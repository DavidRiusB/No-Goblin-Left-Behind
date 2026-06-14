// src/modules/notifications/notification.repository.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, LessThan } from 'typeorm';

import { User } from 'src/modules/users/entity/user.entity';
import { NotificationType } from 'src/common/enums/notification-type.enum';
import { Notification } from './entity/notification.entity';

@Injectable()
export class NotificationRepository {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Notification> {
    return manager
      ? manager.getRepository(Notification)
      : this.notificationRepository;
  }

  async create(
    data: {
      userId: string;
      type: NotificationType;
      payload?: Record<string, any>;
    },
    manager?: EntityManager,
  ): Promise<Notification> {
    const repo = this.getRepo(manager);
    try {
      const notification = repo.create({
        user: { id: data.userId } as User,
        type: data.type,
        payload: data.payload,
      });
      return await repo.save(notification);
    } catch (error: any) {
      throw new InternalServerErrorException('Failed to create notification');
    }
  }

  async findByUser(
    userId: string,
    limit: number,
    before?: Date,
  ): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: {
        user: { id: userId },
        ...(before ? { createdAt: LessThan(before) } : {}),
      },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async countUnread(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { user: { id: userId }, isRead: false },
    });
  }

  async findById(id: string): Promise<Notification | null> {
    return this.notificationRepository.findOne({
      where: { id },
      relations: { user: true },
    });
  }

  async markRead(notification: Notification): Promise<Notification> {
    notification.isRead = true;
    return this.notificationRepository.save(notification);
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { user: { id: userId }, isRead: false },
      { isRead: true },
    );
  }
}
