import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  ILike,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { Activity, ActivityType } from './entities/activity.entity';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { Lead } from '../leads/entities/lead.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Role, User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';

type ListParams = {
  q?: string;
  page?: number;
  limit?: number;
  sort?: 'createdAt' | 'when' | 'type';
  order?: 'ASC' | 'DESC';

  type?: ActivityType;
  leadId?: number;
  customerId?: number;

  from?: string;
  to?: string;
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

type AuthedUser = { id?: number; sub?: number; role?: string };

type UserSafe = {
  id: number;
  email?: string | null;
  role?: any;
};

type ActivityDto = {
  id: number;
  type: ActivityType;

  note?: string | null;
  when?: Date | null;

  leadId?: number | null;
  customerId?: number | null;

  ownerId?: number | null; // ✅ FE fallback için iyi olur
  owner?: UserSafe | null;

  createdAt?: Date;
  updatedAt?: Date;
};

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity) private readonly repo: Repository<Activity>,
    @InjectRepository(Lead) private readonly leads: Repository<Lead>,
    @InjectRepository(Customer)
    private readonly customers: Repository<Customer>,
    private readonly usersService: UsersService,
  ) {}

  private userId(user: AuthedUser): number {
    const id = user?.id ?? user?.sub;
    if (!id) throw new ForbiddenException('Invalid token payload (missing id)');
    return Number(id);
  }

  private isAdmin(user: AuthedUser): boolean {
    return String(user?.role ?? '').toLowerCase() === 'admin';
  }

  private ensureCanMutate(user: AuthedUser, activity: any) {
    if (this.isAdmin(user)) return;
    const uid = this.userId(user);

    const ownerId = activity.ownerId ?? activity.owner?.id;
    if (!ownerId || Number(ownerId) !== uid) {
      throw new ForbiddenException('Not your activity');
    }
  }

  private ensureXor(dto: { leadId?: number; customerId?: number }) {
    const a = !!dto.leadId;
    const b = !!dto.customerId;
    if (a === b) {
      throw new BadRequestException(
        'Exactly one of leadId or customerId must be provided',
      );
    }
  }
  async getLastAny() {
    return this.repo
      .createQueryBuilder('a')
      .where('a.deletedAt IS NULL')
      .orderBy('a.id', 'DESC')
      .getOne();
  }

  private toSafeUser(u: any): UserSafe | null {
    if (!u) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshTokenHash, ...safe } = u;
    return {
      id: Number(safe.id),
      email: safe.email ?? null,
      role: safe.role,
    };
  }

  private toActivityDto(a: any): ActivityDto {
    const leadId = a.lead?.id ?? a.leadId ?? null;
    const customerId = a.customer?.id ?? a.customerId ?? null;

    return {
      id: Number(a.id),
      type: a.type,

      note: a.note ?? null,
      when: a.when ?? null,

      leadId,
      customerId,

      ownerId: a.ownerId ?? a.owner?.id ?? null,
      owner: this.toSafeUser(a.owner),

      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    };
  }

  async create(dto: CreateActivityDto, user: AuthedUser): Promise<ActivityDto> {
    this.ensureXor(dto);
    const ownerId = this.userId(user);

    const entity: any = this.repo.create({
      type: dto.type,
      note: dto.note,
      when: dto.when ? new Date(dto.when) : undefined,
      ownerId,
    });

    if (dto.leadId) {
      const lead = await this.leads.findOne({ where: { id: dto.leadId } });
      if (!lead) throw new NotFoundException('Lead not found');
      entity.lead = lead;
      entity.customer = null;
    } else if (dto.customerId) {
      const customer = await this.customers.findOne({
        where: { id: dto.customerId },
      });
      if (!customer) throw new NotFoundException('Customer not found');
      entity.customer = customer;
      entity.lead = null;
    }

    const saved = await this.repo.save(entity);

    // ✅ owner/lead/customer da gelsin diye relation’larla reload
    const reloaded = await this.repo.findOne({
      where: { id: saved.id },
      relations: { owner: true, lead: true, customer: true },
      select: {
        id: true,
        type: true,
        note: true,
        when: true,
        createdAt: true,
        updatedAt: true,
        ownerId: true,
        owner: { id: true, email: true, role: true },
        lead: { id: true, name: true },
        customer: { id: true, name: true },
      } as any,
    });

    return this.toActivityDto(reloaded ?? saved);
  }

  async findAll(params: ListParams = {}): Promise<Paginated<ActivityDto>> {
    const {
      q,
      page = 1,
      limit = 20,
      sort = 'createdAt',
      order = 'DESC',
      leadId,
      customerId,
      type,
      from,
      to,
    } = params;

    // ✅ sort whitelist (defense)
    const sortWhitelist: Record<string, true> = {
      createdAt: true,
      when: true,
      type: true,
    };
    const safeSort = sortWhitelist[sort] ? sort : 'createdAt';
    const safeOrder: 'ASC' | 'DESC' = order === 'ASC' ? 'ASC' : 'DESC';

    const where: FindOptionsWhere<Activity> = {};

    // AND filters
    if (q) where.note = ILike(`%${q}%`);
    if (type) where.type = type;
    if (leadId) (where as any).lead = { id: leadId };
    if (customerId) (where as any).customer = { id: customerId };

    // date range (when)
    if (from || to) {
      const fromDate = from ? new Date(from) : undefined;
      const toDate = to ? new Date(to) : undefined;

      if (fromDate && Number.isNaN(fromDate.getTime())) {
        throw new BadRequestException('Invalid from date');
      }
      if (toDate && Number.isNaN(toDate.getTime())) {
        throw new BadRequestException('Invalid to date');
      }

      if (fromDate && toDate) (where as any).when = Between(fromDate, toDate);
      else if (fromDate) (where as any).when = MoreThanOrEqual(fromDate);
      else if (toDate) (where as any).when = LessThanOrEqual(toDate);
    }

    const [entities, total] = await this.repo.findAndCount({
      where,
      order: { [safeSort]: safeOrder },
      skip: (page - 1) * limit,
      take: limit,
      withDeleted: false,

      // ✅ owner/lead/customer yüklensin
      relations: { owner: true, lead: true, customer: true },

      // ✅ sadece gereken alanlar
      select: {
        id: true,
        type: true,
        note: true,
        when: true,
        createdAt: true,
        updatedAt: true,
        ownerId: true,

        owner: { id: true, email: true, role: true },

        lead: { id: true, name: true },
        customer: { id: true, name: true },
      } as any,
    });

    return {
      data: entities.map((a) => this.toActivityDto(a)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        sort: safeSort,
        order: safeOrder,
      },
    };
  }

  async findOne(id: number): Promise<ActivityDto> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: { owner: true, lead: true, customer: true },
      select: {
        id: true,
        type: true,
        note: true,
        when: true,
        createdAt: true,
        updatedAt: true,
        ownerId: true,
        owner: { id: true, email: true, role: true },
        lead: { id: true, name: true },
        customer: { id: true, name: true },
      } as any,
    });

    if (!entity) throw new NotFoundException('Activity not found');
    return this.toActivityDto(entity);
  }

  async update(
    id: number,
    dto: UpdateActivityDto,
    user: AuthedUser,
  ): Promise<ActivityDto> {
    if (dto.leadId !== undefined || dto.customerId !== undefined) {
      this.ensureXor(dto);
    }

    const activity: any = await this.repo.findOne({ where: { id } });
    if (!activity) throw new NotFoundException('Activity not found');

    this.ensureCanMutate(user, activity);

    if (dto.when !== undefined)
      activity.when = dto.when ? new Date(dto.when) : null;
    if (dto.type) activity.type = dto.type;
    if (dto.note !== undefined) activity.note = dto.note;

    if (dto.leadId) {
      const lead = await this.leads.findOne({ where: { id: dto.leadId } });
      if (!lead) throw new NotFoundException('Lead not found');
      activity.lead = lead;
      activity.customer = null;
    } else if (dto.customerId) {
      const customer = await this.customers.findOne({
        where: { id: dto.customerId },
      });
      if (!customer) throw new NotFoundException('Customer not found');
      activity.customer = customer;
      activity.lead = null;
    }

    const saved = await this.repo.save(activity);

    const reloaded = await this.repo.findOne({
      where: { id: saved.id },
      relations: { owner: true, lead: true, customer: true },
      select: {
        id: true,
        type: true,
        note: true,
        when: true,
        createdAt: true,
        updatedAt: true,
        ownerId: true,
        owner: { id: true, email: true, role: true },
        lead: { id: true, name: true },
        customer: { id: true, name: true },
      } as any,
    });

    return this.toActivityDto(reloaded ?? saved);
  }

  async softDelete(id: number, user: AuthedUser): Promise<{ success: true }> {
    const activity: any = await this.repo.findOne({ where: { id } });
    if (!activity) throw new NotFoundException('Activity not found');

    this.ensureCanMutate(user, activity);

    const res = await this.repo.softDelete(id);
    if (!res.affected) throw new NotFoundException('Activity not found');
    return { success: true };
  }

  async restore(id: number, user: AuthedUser): Promise<{ success: true }> {
    const activity: any = await this.repo.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!activity) throw new NotFoundException('Activity not found');

    this.ensureCanMutate(user, activity);

    const res = await this.repo.restore(id);
    if (!res.affected)
      throw new NotFoundException('Activity not found or not deleted');
    return { success: true };
  }
}
