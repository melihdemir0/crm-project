import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

export type Tokens = {
  accessToken: string;
  refreshToken: string;
};

export type JwtPayload = {
  sub: string;
  email: string;
  role: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // KAYIT
  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new BadRequestException('Email already in use');

    const hash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create(dto.email, hash);

    // user.entity.ts select:false olsa bile create sonrası user dönebilir;
    // biz yine de güvenli dönelim
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshTokenHash, ...safe } = user as any;
    return safe;
  }

  // GİRİŞ + TOKEN ÜRETİMİ
  async login(dto: LoginDto): Promise<Tokens> {
    // ✅ password'ü özellikle seç
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.signTokens({
      sub: String(user.id),
      email: user.email,
      role: user.role,
    });

    // refresh token'ı hashleyip DB'ye kaydet
    const refreshHash = await bcrypt.hash(tokens.refreshToken, 10);
    await this.usersService.setRefreshTokenHash(user.id, refreshHash);

    return tokens;
  }

  // REFRESH: gelen refresh token'ı doğrula + DB hash ile karşılaştır + rotate
  async refresh(dto: RefreshDto): Promise<Tokens> {
    const refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET');

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(dto.refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // ✅ refreshTokenHash'ı özellikle seç
    const user = await this.usersService.findByIdWithRefreshHash(
      Number(payload.sub),
    );
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh not allowed');
    }

    const ok = await bcrypt.compare(dto.refreshToken, user.refreshTokenHash);
    if (!ok) throw new UnauthorizedException('Refresh token mismatch');

    // Token rotation
    const tokens = await this.signTokens({
      sub: String(user.id),
      email: user.email,
      role: user.role,
    });

    const newRefreshHash = await bcrypt.hash(tokens.refreshToken, 10);
    await this.usersService.setRefreshTokenHash(user.id, newRefreshHash);

    return tokens;
  }

  // LOGOUT: refresh token hash'ini sıfırla
  async logout(userId: number): Promise<{ success: true }> {
    await this.usersService.setRefreshTokenHash(userId, null);
    return { success: true };
  }

  // Access + Refresh token üretimi
  private async signTokens(payload: JwtPayload): Promise<Tokens> {
    const accessToken = await this.jwt.signAsync(payload);

    const refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET');
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: refreshSecret,
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }
}
