// src/modules/notifications/notifications.service.ts
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationRepository } from './notification.repository';
import { RealtimeGateway } from 'src/modules/realtime/realtime.gateway';
import { NotificationType } from 'src/common/enums/notification-type.enum';

import { JwtUser } from 'src/common/types/jwt-user.type';
import { Notification } from './entity/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  // called by other modules — persist then push live
  async notify(
    userId: string,
    type: NotificationType,
    payload?: Record<string, any>,
  ): Promise<Notification> {
    const notification = await this.notificationRepository.create({
      userId,
      type,
      payload,
    });

    this.realtimeGateway.emitToUser(userId, 'notification', {
      id: notification.id,
      type: notification.type,
      payload: notification.payload,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    });

    return notification;
  }

  async getMine(
    userId: string,
    limit = 20,
    before?: Date,
  ): Promise<Notification[]> {
    return this.notificationRepository.findByUser(userId, limit, before);
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.notificationRepository.countUnread(userId);
    return { count };
  }

  async markRead(id: string, requester: JwtUser): Promise<Notification> {
    const notification = await this.notificationRepository.findById(id);
    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.user.id !== requester.userId) {
      throw new ForbiddenException('Not your notification');
    }
    return this.notificationRepository.markRead(notification);
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notificationRepository.markAllRead(userId);
  }
}
