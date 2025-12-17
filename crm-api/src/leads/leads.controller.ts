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
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { MarkLostDto } from './dto/mark-lost.dto';
import { ChangeLeadStatusDto } from './dto/change-lead-status.dto';
import { ListQueryDto } from 'src/common/dto/list-query.dto';

import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Leads')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'leads', version: '1' })
export class LeadsController {
  constructor(private readonly service: LeadsService) {}

  @Post()
  create(@Body() dto: CreateLeadDto, @Req() req: any) {
    return this.service.create(dto, req.user);
  }

  @Get()
  list(@Query() query: ListQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLeadDto,
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

  @Post(':id/convert')
  convert(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.convertToCustomer(id, req.user);
  }

  @Post(':id/lost')
  markLost(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MarkLostDto,
    @Req() req: any,
  ) {
    return this.service.markLost(id, dto, req.user);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch(':id/status')
  changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeLeadStatusDto,
    @Req() req: any,
  ) {
    return this.service.changeStatus(id, dto, req.user);
  }
}
