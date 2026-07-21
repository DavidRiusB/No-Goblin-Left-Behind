import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Role } from 'src/common/enums/roles.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth-guard';
import { MinRole } from 'src/common/helpers/min-role.guard';
import { AdminService } from './admin.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { JwtUser } from 'src/common/types/jwt-user.type';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateBadgeDto } from './dtos/create-badge.dto';
import { UpdateBadgeDto } from './dtos/update-badge.dto';
import { SetActiveDto } from './dtos/set-active.dto';
import { imageUploadOptions } from 'src/common/upload/image-upload.options';

@Controller('admin')
@UseGuards(JwtAuthGuard, MinRole(Role.Moderator))
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── users ──────────────────────────────────────────────

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

  @Patch('users/:id/ban')
  @UseGuards(JwtAuthGuard, MinRole(Role.Admin))
  async banUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.adminService.banUser(id, user);
  }

  @Patch('users/:id/unban')
  @UseGuards(JwtAuthGuard, MinRole(Role.Admin))
  async unbanUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.adminService.unbanUser(id, user);
  }

  // ── tables ─────────────────────────────────────────────

  @Get('tables')
  async searchTables(@Query('search') search: string) {
    return this.adminService.searchTables(search);
  }

  @Get('tables/:id')
  async getTableDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getTableDetail(id);
  }

  @Patch('tables/:id/ban')
  @UseGuards(JwtAuthGuard, MinRole(Role.Admin))
  async banTable(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.banTable(id);
  }

  @Patch('tables/:id/unban')
  @UseGuards(JwtAuthGuard, MinRole(Role.Admin))
  async unbanTable(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.unbanTable(id);
  }

  // ── reviews ─────────────────────────────────────────────

  @Get('reviews/:id')
  async getReviewById(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getReviewDetail(id);
  }

  @Get('users/:id/reviews')
  async getUserReviews(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: JwtUser,
  ) {
    return this.adminService.findUserReviews(id, admin);
  }

  @Delete('reviews/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() requester: JwtUser,
  ) {
    return this.adminService.deleteReview(id, requester);
  }

  // ── Badges ─────────────────────────────────────────────

  @Get('badges')
  async listBadges(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.listBadges(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post('badges')
  @UseGuards(JwtAuthGuard, MinRole(Role.SuperAdmin))
  @UseInterceptors(FileInterceptor('file', imageUploadOptions))
  async createBadge(
    @Body() dto: CreateBadgeDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.adminService.createBadge(dto, file);
  }

  @Patch('badges/:id/active')
  async setActive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetActiveDto,
  ) {
    return this.adminService.setBadgeActive(id, dto.isActive);
  }

  @Patch('badges/:id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBadgeDto,
  ) {
    return this.adminService.updateBadge(id, dto);
  }

  @Patch('badges/:id/icon')
  @UseInterceptors(FileInterceptor('file', imageUploadOptions))
  async updateBadgeIcon(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.adminService.updateBadgeIcon(id, file);
  }
}
