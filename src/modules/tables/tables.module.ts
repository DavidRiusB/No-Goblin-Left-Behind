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

@Module({
  imports: [TypeOrmModule.forFeature([Table, JoinRequest, TableMembership])],
  providers: [
    TablesService,
    TableRepository,
    JoinRequestRepository,
    TableMembershipRepository,
  ],
  controllers: [TablesController],
})
export class TablesModule {}
