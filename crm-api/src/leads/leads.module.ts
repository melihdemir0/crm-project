import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { Lead } from './entities/lead.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Activity } from 'src/activities/entities/activity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Lead, Customer, Activity])],
  controllers: [LeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}
