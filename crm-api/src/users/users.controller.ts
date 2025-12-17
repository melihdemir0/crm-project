import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { UsersService } from './users.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { ListQueryDto } from '../common/dto/list-query.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  list(@Query() query: ListQueryDto) {
    return this.usersService.list(query);
  }

  @Get('health')
  health() {
    return { ok: true, scope: 'users' };
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.usersService.getUserById(id);
    } catch {
      throw new NotFoundException();
    }
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Delete(':id')
  deleteUser(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.usersService.deleteById(id, req.user);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch(':id')
  updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { role: 'admin' | 'user' },
  ) {
    return this.usersService.updateRole(id, body.role);
  }
}
