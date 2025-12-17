import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { ListQueryDto } from 'src/common/dto/list-query.dto';
import { Paginated } from 'src/common/types/paginated.type';

type AuthedUser = { id?: number; sub?: number; role?: string };

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly repo: Repository<Customer>,
  ) {}

  private userId(user: AuthedUser): number {
    const id = user?.id ?? user?.sub;
    if (!id) throw new ForbiddenException('Invalid token payload (missing id)');
    return Number(id);
  }

  private isAdmin(user: AuthedUser): boolean {
    return String(user?.role ?? '').toLowerCase() === 'admin';
  }

  private ensureCanMutate(user: AuthedUser, customer: Customer) {
    if (this.isAdmin(user)) return;
    const uid = this.userId(user);
    if (customer.ownerId !== uid)
      throw new ForbiddenException('Not your customer');
  }

  // ✅ ownerId set
  async create(dto: CreateCustomerDto, user: AuthedUser): Promise<Customer> {
    const ownerId = this.userId(user);
    const entity = this.repo.create({ ...dto, ownerId });
    return this.repo.save(entity);
  }

  // ✅ Paginated list standardı
  async list(query: ListQueryDto): Promise<Paginated<Customer>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const order: 'ASC' | 'DESC' = query.order ?? 'DESC';
    const q = query.q?.trim();

    // customers için güvenli sort whitelist (istersen email/phone da ekleriz)
    const allowedSort = new Set(['createdAt', 'name', 'id']);
    const rawSort = query.sort ?? 'createdAt';
    const sort = allowedSort.has(rawSort) ? rawSort : 'createdAt';

    const where: FindOptionsWhere<Customer>[] = q
      ? [
          { name: ILike(`%${q}%`) },
          { email: ILike(`%${q}%`) },
          { phone: ILike(`%${q}%`) },
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

  async findOne(id: number): Promise<Customer> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Customer not found');
    return entity;
  }

  // ✅ ownership check
  async update(
    id: number,
    dto: UpdateCustomerDto,
    user: AuthedUser,
  ): Promise<Customer> {
    const existing = await this.findOne(id);
    this.ensureCanMutate(user, existing);

    const preloaded = await this.repo.preload({ id, ...dto });
    if (!preloaded) throw new NotFoundException('Customer not found');
    return this.repo.save(preloaded);
  }

  // ✅ ownership check
  async softDelete(id: number, user: AuthedUser): Promise<{ success: true }> {
    const existing = await this.findOne(id);
    this.ensureCanMutate(user, existing);

    const res = await this.repo.softDelete(id);
    if (!res.affected) throw new NotFoundException('Customer not found');
    return { success: true };
  }

  // ✅ ownership check (admin veya owner restore)
  async restore(id: number, user: AuthedUser): Promise<{ success: true }> {
    const customer = await this.repo.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!customer) throw new NotFoundException('Customer not found');
    this.ensureCanMutate(user, customer);

    const res = await this.repo.restore(id);
    if (!res.affected)
      throw new NotFoundException('Customer not found or not deleted');
    return { success: true };
  }
}
