import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository, UpdateResult } from 'typeorm';
import { User, Role } from './entities/user.entity';
import { ListQueryDto } from 'src/common/dto/list-query.dto';
import { Paginated } from 'src/common/types/paginated.type';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
  ) {}

  private toSafeUser(u: any) {
    if (!u) return u;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshTokenHash, ...safe } = u;
    return safe;
  }

  async list(query: ListQueryDto): Promise<Paginated<any>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const order: 'ASC' | 'DESC' = query.order ?? 'DESC';
    const q = query.q?.trim();

    const allowedSort = new Set(['createdAt', 'email', 'role', 'id']);

    const rawSort = query.sort ?? 'createdAt';
    const sort = allowedSort.has(rawSort) ? rawSort : 'createdAt';

    const where = q ? ({ email: ILike(`%${q}%`) } as any) : undefined;

    const [rows, total] = await this.repo.findAndCount({
      where,
      order: { [sort]: order } as any,
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: rows.map((u) => this.toSafeUser(u)),
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

  // ✅ Genel kullanım: password/refreshTokenHash select:false olduğu için gelmez
  findById(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  // ✅ Genel kullanım: password gelmez (select:false)
  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  // 🔐 LOGIN için: password'ü özellikle çek
  findByEmailWithPassword(email: string) {
    return this.repo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  // 🔐 REFRESH için: refreshTokenHash'i özellikle çek
  findByIdWithRefreshHash(id: number) {
    return this.repo
      .createQueryBuilder('user')
      .addSelect('user.refreshTokenHash')
      .where('user.id = :id', { id })
      .getOne();
  }

  async create(email: string, passwordHash: string, role: Role = Role.USER) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = this.repo.create({
      email: normalizedEmail,
      password: passwordHash,
      role,
    });
    return this.repo.save(user);
  }

  async setRefreshTokenHash(
    userId: number,
    hash: string | null,
  ): Promise<UpdateResult> {
    if (hash === null) {
      return this.repo
        .createQueryBuilder()
        .update(User)
        .set({ refreshTokenHash: () => 'NULL' })
        .where('id = :id', { id: userId })
        .execute();
    }

    return this.repo.update({ id: userId }, { refreshTokenHash: hash });
  }

  async getUserById(id: number) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');
    return this.toSafeUser(user);
  }

  async updateRole(id: number, role: Role | 'admin' | 'user') {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');

    const normalized = String(role).toLowerCase();
    const nextRole =
      normalized === 'admin'
        ? Role.ADMIN
        : normalized === 'user'
          ? Role.USER
          : null;

    if (!nextRole) {
      throw new BadRequestException('Geçersiz role. Sadece admin | user.');
    }

    user.role = nextRole;
    const saved = await this.repo.save(user);
    return this.toSafeUser(saved);
  }

  async deleteById(id: number, currentUser: any) {
    const targetUserId = id;
    const currentUserId = Number(currentUser.id ?? currentUser.sub);

    if (targetUserId === currentUserId) {
      throw new ForbiddenException('Kendinizi silemezsiniz');
    }

    const targetUser = await this.repo.findOne({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return { deleted: false, message: 'Kullanıcı bulunamadı' };
    }

    await this.repo.delete(id);
    return { deleted: true, message: 'Kullanıcı başarıyla silindi' };
  }
}
