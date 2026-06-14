// src/modules/notifications/notifications.controller.ts
import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';

import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { JwtUser } from 'src/common/types/jwt-user.type';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth-guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getMine(
    @CurrentUser() user: JwtUser,
    @Query('before') before?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.getMine(
      user.userId,
      limit ? parseInt(limit, 10) : 20,
      before ? new Date(before) : undefined,
    );
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: JwtUser) {
    return this.notificationsService.getUnreadCount(user.userId);
  }

  @Patch('read-all')
  async markAllRead(@CurrentUser() user: JwtUser) {
    await this.notificationsService.markAllRead(user.userId);
    return { ok: true };
  }

  @Patch(':id/read')
  async markRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.notificationsService.markRead(id, user);
  }
}
