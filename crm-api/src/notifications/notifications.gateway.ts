import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { UnauthorizedException } from '@nestjs/common';

type SocketUser = { id: number; email: string; role: string };

const ADMIN_ROOM = 'admins';

@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly cfg: ConfigService,
  ) {}

  async handleConnection(@ConnectedSocket() client: Socket) {
    try {
      const token = this.extractToken(client);

      const payload: any = this.jwt.verify(token, {
        secret: this.cfg.get<string>('JWT_ACCESS_SECRET'),
      });

      const user: SocketUser = {
        id: Number(payload.sub),
        email: String(payload.email ?? ''),
        role: String(payload.role ?? '').toLowerCase(),
      };

      if (!user.id) throw new UnauthorizedException('Invalid token payload');

      client.data.user = user;

      if (user.role === 'admin') {
        client.join(ADMIN_ROOM);
      }
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {}

  emitToAdmins(event: string, data: any) {
    this.server.to(ADMIN_ROOM).emit(event, data);
  }

  private extractToken(client: Socket): string {
    const token = client.handshake.auth?.token;
    if (typeof token === 'string' && token.length > 10) return token;

    const authHeader = client.handshake.headers?.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.slice('Bearer '.length);
    }

    throw new UnauthorizedException('Missing token');
  }
}
