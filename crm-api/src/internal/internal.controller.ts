import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { N8nKeyGuard } from 'src/common/guards/n8n-key.guard';
import { CustomersService } from 'src/customers/customers.service';
import { LeadsService } from 'src/leads/leads.service';
import { ActivitiesService } from 'src/activities/activities.service';

@ApiTags('Internal')
@UseGuards(N8nKeyGuard)
@Controller('internal')
export class InternalController {
  constructor(
    private readonly customers: CustomersService,
    private readonly leads: LeadsService,
    private readonly activities: ActivitiesService,
  ) {}

  @Get('customers/count')
  async customersCount() {
    const n = await this.customers.countAll();
    return { intent: 'customer_count', reply: `Toplam müşteri sayısı: ${n}` };
  }

  @Get('leads/count')
  async leadsCount() {
    const n = await this.leads.countAll();
    return { intent: 'lead_count', reply: `Toplam lead sayısı: ${n}` };
  }

  @Get('activities/last')
  async lastActivity() {
    const a = await this.activities.getLastAny();
    if (!a) return { intent: 'last_activity', reply: 'Henüz aktivite yok.' };
    return {
      intent: 'last_activity',
      reply: `Son aktivite: ${a.type}${a.note ? ` — ${a.note}` : ''}`,
    };
  }
}
