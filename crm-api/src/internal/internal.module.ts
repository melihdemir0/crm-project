import { Module } from '@nestjs/common';
import { InternalController } from './internal.controller';
import { CustomersModule } from 'src/customers/customers.module';
import { LeadsModule } from 'src/leads/leads.module';
import { ActivitiesModule } from 'src/activities/activities.module';

@Module({
  imports: [CustomersModule, LeadsModule, ActivitiesModule],
  controllers: [InternalController],
})
export class InternalModule {}
