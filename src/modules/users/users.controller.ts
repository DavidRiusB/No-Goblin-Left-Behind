import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth-guard';
import { UpdateUserDto } from './dtos/user-update.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { JwtUser } from 'src/common/types/jwt-user.type';
import { MinRole } from 'src/common/helpers/min-role.guard';
import { Role } from 'src/common/enums/roles.enum';
import { plainToInstance } from 'class-transformer';
import { UserProfileResponse } from './dtos/user-profile-response.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: JwtUser) {
    return this.userService.findMe(user.userId);
  }

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

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  async deleteMe(@CurrentUser() user: JwtUser): Promise<void> {
    await this.userService.deleteMe(user.userId);
  }
}
