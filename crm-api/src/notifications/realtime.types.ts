export enum RealtimeEventType {
  LEAD_CREATED = 'LEAD_CREATED',
  LEAD_STATUS_CHANGED = 'LEAD_STATUS_CHANGED',
  LEAD_LOST = 'LEAD_LOST',
  LEAD_CONVERTED = 'LEAD_CONVERTED',
}

export type RealtimeEntity = 'lead' | 'customer' | 'activity' | 'user';

export type RealtimeActor = {
  id: number;
  email: string;
  role: string;
};

export type RealtimeNotification = {
  type: RealtimeEventType;

  actor: RealtimeActor;

  entity: RealtimeEntity;
  entityId?: number;

  message: string;
  meta?: Record<string, any>;

  at: string; // ISO
};
