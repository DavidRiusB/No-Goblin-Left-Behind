import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    TypeOrmModule.forFeature([Table, JoinRequest, TableMembership, Review]),
    NotificationsModule,
    ChatModule,
  ],
  providers: [
    TablesService,
    TableRepository,
    JoinRequestRepository,
    TableMembershipRepository,
    ReviewRepository,
  ],
  controllers: [TablesController],
})
export class TablesModule {}
