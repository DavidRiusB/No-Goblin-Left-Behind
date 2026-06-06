import { Controller, Get, Param, Query } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get('admin/search')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.Admin)
  async adminSearchUsers(@Query('q') q: string) {
    return this.userService.adminSearchUsers(q);
  }
}
