import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Lead, LeadStatus } from './entities/lead.entity';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { Customer } from '../customers/entities/customer.entity';
import {
  Activity,
  ActivityType,
} from 'src/activities/entities/activity.entity';
import { ChangeLeadStatusDto } from './dto/change-lead-status.dto';
import { ListQueryDto } from 'src/common/dto/list-query.dto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { RealtimeEventType } from 'src/notifications/realtime.types';

type ListParams = {
  q?: string;
  page?: number;
  limit?: number;
  sort?: 'createdAt' | 'name' | 'status';
  order?: 'ASC' | 'DESC';
};

type Paginated<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    sort: string;
    order: 'ASC' | 'DESC';
  };
};

// req.user tipin payload, en azından bunlar lazım
type AuthedUser = { id?: number; sub?: number; role?: string; email?: string };

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private readonly repo: Repository<Lead>,

    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,

    @InjectRepository(Activity)
    private readonly activitiesRepo: Repository<Activity>,

    private readonly notifications: NotificationsService,
  ) {}

  private userId(user: AuthedUser): number {
    const id = user?.id ?? user?.sub;
    if (!id) throw new ForbiddenException('Invalid token payload (missing id)');
    return Number(id);
  }

  private isAdmin(user: AuthedUser): boolean {
    return String(user?.role ?? '').toLowerCase() === 'admin';
  }

  private ensureCanMutate(user: AuthedUser, lead: Lead) {
    if (this.isAdmin(user)) return;
    const uid = this.userId(user);
    if (lead.ownerId !== uid) throw new ForbiddenException('Not your lead');
  }

  async countAll(): Promise<number> {
    return this.repo.count();
  }

  //  ownerId set
  async create(dto: CreateLeadDto, user: AuthedUser): Promise<Lead> {
    const ownerId = this.userId(user);
    const entity = this.repo.create({ ...dto, ownerId });
    const saved = await this.repo.save(entity);

    //  admin’e anlık bildirim
    try {
      this.notifications.notifyAdmins({
        type: RealtimeEventType.LEAD_CREATED,
        actor: {
          id: ownerId,
          email: user?.email ?? 'unknown',
          role: String(user?.role ?? '').toLowerCase(),
        },
        entity: 'lead',
        entityId: saved.id,
        message: `Lead created: ${saved.name}`,
        meta: { leadName: saved.name },
        at: new Date().toISOString(),
      });
    } catch {}

    return saved;
  }

  async list(query: ListQueryDto): Promise<Paginated<Lead>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const order: 'ASC' | 'DESC' = query.order ?? 'DESC';
    const q = query.q?.trim();

    // leads için güvenli sort whitelist
    const allowedSort = new Set(['createdAt', 'name', 'status', 'id']);
    const rawSort = query.sort ?? 'createdAt';
    const sort = allowedSort.has(rawSort) ? rawSort : 'createdAt';

    const where: FindOptionsWhere<Lead>[] = q
      ? [
          { name: ILike(`%${q}%`) },
          { email: ILike(`%${q}%`) },
          { phone: ILike(`%${q}%`) },
          { notes: ILike(`%${q}%`) },
        ]
      : [];

    const [data, total] = await this.repo.findAndCount({
      where: where.length ? where : undefined,
      order: { [sort]: order } as any,
      skip: (page - 1) * limit,
      take: limit,
      withDeleted: false,
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        sort,
        order,
      },
    };
  }

  async findOne(id: number): Promise<Lead> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Lead not found');
    return entity;
  }

  // ✅ ownership check
  async update(
    id: number,
    dto: UpdateLeadDto,
    user: AuthedUser,
  ): Promise<Lead> {
    const existing = await this.findOne(id);
    this.ensureCanMutate(user, existing);

    const pre = await this.repo.preload({ id, ...dto });
    if (!pre) throw new NotFoundException('Lead not found');
    return this.repo.save(pre);
  }

  // ✅ ownership check
  async softDelete(id: number, user: AuthedUser): Promise<{ success: true }> {
    const lead = await this.findOne(id);
    this.ensureCanMutate(user, lead);

    const res = await this.repo.softDelete(id);
    if (!res.affected) throw new NotFoundException('Lead not found');
    return { success: true };
  }

  // ✅ restore genelde admin-only olur; ama sen “user her şeyi görsün” dedin.
  // Burada: admin restore edebilsin, user kendi lead’ini restore edebilsin.
  async restore(id: number, user: AuthedUser): Promise<{ success: true }> {
    const lead = await this.repo.findOne({ where: { id }, withDeleted: true });
    if (!lead) throw new NotFoundException('Lead not found');
    this.ensureCanMutate(user, lead);

    const res = await this.repo.restore(id);
    if (!res.affected)
      throw new NotFoundException('Lead not found or not deleted');
    return { success: true };
  }

  async convertToCustomer(
    id: number,
    user: AuthedUser,
  ): Promise<{ customer: Customer; leadId: number; status: LeadStatus }> {
    const lead = await this.findOne(id); // ideally includes customer relation
    this.ensureCanMutate(user, lead);

    // 1) LOST ise convert olmaz
    if (lead.status === LeadStatus.LOST) {
      throw new BadRequestException(
        'Lead is marked as LOST and cannot be converted',
      );
    }

    // 2) Zaten customer'a bağlıysa idempotent davran
    if (lead.customer?.id) {
      if (lead.status !== LeadStatus.WON) {
        lead.status = LeadStatus.WON;
        lead.convertedAt = lead.convertedAt ?? new Date();
        await this.repo.save(lead);
      }

      return { customer: lead.customer, leadId: lead.id, status: lead.status };
    }

    // 3) Customer oluştur
    const customer = this.customerRepo.create({
      name: lead.name,
      email: lead.email ?? undefined,
      phone: lead.phone ?? undefined,
      ownerId: lead.ownerId, // ✅ ownership: lead owner
    });

    const savedCustomer = await this.customerRepo.save(customer);

    // 4) Lead'i güncelle
    lead.customer = savedCustomer;
    lead.status = LeadStatus.WON;
    lead.convertedAt = new Date();
    await this.repo.save(lead);

    // 5) Activity log: CONVERTED
    const currentUserId = Number((user as any)?.sub ?? (user as any)?.id);
    await this.activitiesRepo.save(
      this.activitiesRepo.create({
        type: ActivityType.CONVERTED,
        note: `Converted lead #${lead.id} to customer #${savedCustomer.id}`,
        when: new Date(),
        ownerId: currentUserId,
        leadId: lead.id,
        customerId: savedCustomer.id,
      }),
    );
    try {
      this.notifications.notifyAdmins({
        type: RealtimeEventType.LEAD_CONVERTED,
        actor: {
          id: this.userId(user),
          email: user?.email ?? 'unknown',
          role: String(user?.role ?? '').toLowerCase(),
        },
        entity: 'lead',
        entityId: lead.id,
        message: `Lead converted: ${lead.name} → Customer #${savedCustomer.id}`,
        meta: {
          leadId: lead.id,
          leadName: lead.name,
          customerId: savedCustomer.id,
          customerName: savedCustomer.name,
        },
        at: new Date().toISOString(),
      });
    } catch {}

    return { customer: savedCustomer, leadId: lead.id, status: lead.status };
  }

  async markLost(
    id: number,
    dto: { reason?: string },
    user: AuthedUser,
  ): Promise<{ leadId: number; status: LeadStatus }> {
    const lead = await this.findOne(id);
    this.ensureCanMutate(user, lead);

    // Zaten customer olmuşsa lost yapmak mantıksız — istersen izin verirsin ama ben engelliyorum
    if (lead.customer?.id) {
      throw new BadRequestException('Converted lead cannot be marked as LOST');
    }

    if (lead.status === LeadStatus.LOST) {
      // idempotent
      return { leadId: lead.id, status: lead.status };
    }

    lead.status = LeadStatus.LOST;
    await this.repo.save(lead);

    // Activity log: LOST
    const currentUserId = Number((user as any)?.sub ?? (user as any)?.id);
    await this.activitiesRepo.save(
      this.activitiesRepo.create({
        type: ActivityType.LOST,
        note: dto?.reason?.trim()
          ? `Lost: ${dto.reason.trim()}`
          : 'Marked as LOST',
        when: new Date(),
        ownerId: currentUserId,
        leadId: lead.id,
        customerId: null,
      }),
    );
    try {
      this.notifications.notifyAdmins({
        type: RealtimeEventType.LEAD_LOST,
        actor: {
          id: this.userId(user),
          email: user?.email ?? 'unknown',
          role: String(user?.role ?? '').toLowerCase(),
        },
        entity: 'lead',
        entityId: lead.id,
        message: `Lead marked LOST: ${lead.name}`,
        meta: {
          leadId: lead.id,
          leadName: lead.name,
          reason: dto?.reason?.trim() || null,
        },
        at: new Date().toISOString(),
      });
    } catch {}

    return { leadId: lead.id, status: lead.status };
  }

  async changeStatus(id: number, dto: ChangeLeadStatusDto, user: any) {
    const lead = await this.repo.findOne({
      where: { id } as any,
    });
    if (!lead) throw new NotFoundException('Lead not found');

    // ✅ converted lead (customerId var) ise status değiştirmeyelim (net kural)
    if (lead.customerId != null) {
      throw new BadRequestException('Converted lead status cannot be changed');
    }

    // ✅ ownership/admin bypass (sende zaten vardı)
    const role = (user?.role || '').toLowerCase();
    const userId = user?.sub ?? user?.id;
    const isAdmin = role === 'admin';
    if (!isAdmin && lead.ownerId !== userId) {
      throw new ForbiddenException('Not allowed');
    }

    const prev = lead.status;
    if (prev === dto.status) return lead; // değişiklik yoksa dokunma

    lead.status = dto.status;
    const saved = await this.repo.save(lead);

    // ✅ activity log
    const act = this.activitiesRepo.create({
      type: ActivityType.STATUS_CHANGED,
      lead: saved,
      ownerId: userId,
      note: dto.note?.trim()
        ? `Status: ${prev} → ${dto.status}. ${dto.note.trim()}`
        : `Status: ${prev} → ${dto.status}`,
      when: new Date(),
    });

    await this.activitiesRepo.save(act);
    try {
      this.notifications.notifyAdmins({
        type: RealtimeEventType.LEAD_STATUS_CHANGED,
        actor: {
          id: this.userId(user),
          email: user?.email ?? 'unknown',
          role: String(user?.role ?? '').toLowerCase(),
        },
        entity: 'lead',
        entityId: saved.id,
        message: `Lead "${lead.name}" status: ${prev} → ${saved.status}`,
        meta: {
          leadId: saved.id,
          leadName: saved.name,
          from: prev,
          to: saved.status,
          note: dto.note?.trim() || null,
        },
        at: new Date().toISOString(),
      });
    } catch {}

    return saved;
  }
}
