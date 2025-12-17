import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { ActivityType } from './entities/activity.entity';

@ApiTags('Activities')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'activities', version: '1' })
export class ActivitiesController {
  constructor(private readonly service: ActivitiesService) {}

  @Post()
  create(@Body() dto: CreateActivityDto, @Req() req: any) {
    return this.service.create(dto, req.user);
  }

  @Get()
  findAll(
    @Query('q') q?: string,

    // filters
    @Query('type') type?: ActivityType | string,
    @Query('from') from?: string,
    @Query('to') to?: string,

    // NOTE: query string gelir; parse’ı aşağıda yapıyoruz
    @Query('leadId') leadId?: string,
    @Query('customerId') customerId?: string,

    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('sort', new DefaultValuePipe('createdAt'))
    sort?: 'createdAt' | 'when' | 'type',
    @Query('order', new DefaultValuePipe('DESC')) order?: 'ASC' | 'DESC',
  ) {
    const leadIdNum =
      leadId && leadId.trim() !== '' ? Number(leadId) : undefined;
    const customerIdNum =
      customerId && customerId.trim() !== '' ? Number(customerId) : undefined;

    return this.service.findAll({
      q,
      page,
      limit,
      sort,
      order,

      type: type ? (String(type) as ActivityType) : undefined,
      from: from || undefined,
      to: to || undefined,

      leadId: Number.isFinite(leadIdNum) ? leadIdNum : undefined,
      customerId: Number.isFinite(customerIdNum) ? customerIdNum : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateActivityDto,
    @Req() req: any,
  ) {
    return this.service.update(id, dto, req.user);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.softDelete(id, req.user);
  }

  @Patch(':id/restore')
  restore(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.restore(id, req.user);
  }
}
