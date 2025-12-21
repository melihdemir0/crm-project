import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class N8nKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const provided = (req.headers['x-internal-api-key'] as string) || '';
    const expected = this.config.get<string>('N8N_API_KEY');

    if (!expected) {
      throw new UnauthorizedException('N8N_API_KEY is not configured');
    }
    if (!provided || provided !== expected) {
      throw new UnauthorizedException('Invalid internal api key');
    }
    return true;
  }
}
