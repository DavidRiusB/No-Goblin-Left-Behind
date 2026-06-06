import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth-guard';
import { UpdateUserDto } from './dtos/user-update.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { JwtUser } from 'src/common/types/jwt-user.type';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get('admin/search')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.Admin)
  async adminSearchUsers(@Query('q') q: string) {
    return this.userService.adminSearchUsers(q);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateUser(
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.userService.update(updateUserDto, user.userId);
  }
}
