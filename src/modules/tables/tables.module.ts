import { forwardRef, Module } from '@nestjs/common';
import { TablesService } from './tables.service';
import { TablesController } from './tables.controller';
import { TableRepository } from './table.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Table } from './entities/table.entity';
import { JoinRequestRepository } from './join-request-table.repository';
import { JoinRequest } from './entities/join-request.entity';
import { TableMembership } from './entities/table-membership.entity';
import { TableMembershipRepository } from './tables-membership.repository';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChatModule } from '../chat/chat.module';
import { ReviewRepository } from '../reviews/review.repository';
import { Review } from '../reviews/entity/review.entity';
import { ReviewsService } from '../reviews/reviews.service';
import { BadgesModule } from '../badges/badges.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Table, JoinRequest, TableMembership, Review]),
    NotificationsModule,
    BadgesModule,
    ChatModule,
    UsersModule,
  ],
  providers: [
    TablesService,
    TableRepository,
    JoinRequestRepository,
    TableMembershipRepository,
    ReviewRepository,
    ReviewsService,
  ],
  controllers: [TablesController],
})
export class TablesModule {}
