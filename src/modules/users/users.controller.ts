import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth-guard';
import { UpdateUserDto } from './dtos/user-update.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { JwtUser } from 'src/common/types/jwt-user.type';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from '../uploads/uploads.service';
import { imageUploadOptions } from 'src/common/upload/image-upload.options';

@Controller('users')
export class UsersController {
  constructor(
    private readonly userService: UsersService,
    private readonly uploadsService: UploadsService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: JwtUser) {
    return this.userService.findMe(user.userId);
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

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', imageUploadOptions))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtUser,
  ) {
    const url = await this.uploadsService.uploadAvatar(file, user.userId);
    return this.userService.updateAvatar(user.userId, url);
  }
}
