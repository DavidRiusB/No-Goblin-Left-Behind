import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from 'src/common/enums/roles.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth-guard';
import { MinRole } from 'src/common/helpers/min-role.guard';
import { AdminService } from './admin.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { JwtUser } from 'src/common/types/jwt-user.type';

@Controller('admin')
@UseGuards(JwtAuthGuard, MinRole(Role.Moderator))
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async searchUsers(@Query('search') search: string) {
    return this.adminService.searchUsers(search);
  }

  @Get('users/:id')
  async getUserDetail(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.adminService.getUserDetail(id, user);
  }
}
