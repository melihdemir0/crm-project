import { Injectable } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { RealtimeNotification } from './realtime.types';

@Injectable()
export class NotificationsService {
  constructor(private readonly gw: NotificationsGateway) {}

  notifyAdmins(payload: RealtimeNotification) {
    this.gw.emitToAdmins('admin.notification', payload);
  }
}
