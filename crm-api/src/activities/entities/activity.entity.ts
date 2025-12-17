import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Lead } from '../../leads/entities/lead.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { User } from '../../users/entities/user.entity';

export enum ActivityType {
  CALL = 'CALL',
  EMAIL = 'EMAIL',
  MEETING = 'MEETING',
  NOTE = 'NOTE',

  CONVERTED = 'CONVERTED',
  LOST = 'LOST',
  STATUS_CHANGED = 'STATUS_CHANGED',
}

@Entity()
export class Activity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'enum', enum: ActivityType })
  type: ActivityType;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  when?: Date;

  @Index()
  @Column({ name: 'ownerId', type: 'int' })
  ownerId: number;

  @ManyToOne(() => User, { nullable: false, eager: false })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Index()
  @Column({ name: 'leadId', type: 'int', nullable: true })
  leadId?: number | null;

  @ManyToOne(() => Lead, { nullable: true, eager: false })
  @JoinColumn({ name: 'leadId' })
  lead?: Lead | null;

  @Index()
  @Column({ name: 'customerId', type: 'int', nullable: true })
  customerId?: number | null;

  @ManyToOne(() => Customer, { nullable: true, eager: false })
  @JoinColumn({ name: 'customerId' })
  customer?: Customer | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp with time zone' })
  deletedAt?: Date | null;
}
