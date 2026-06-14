import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationRepository } from './notification.repository';
import { RealtimeModule } from 'src/modules/realtime/realtime.module';
import { Notification } from './entity/notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notification]), RealtimeModule],
  providers: [NotificationsService, NotificationRepository],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
