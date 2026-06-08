import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FindTablesDto } from './dtos/find-table.dto';
import { TableRepository } from './table.repository';
import { Table } from './entities/table.entity';
import { CreateTableDto } from './dtos/create-table.dto';
import { User } from '../users/entity/user.entity';
import { UpdateTableDto } from './dtos/update-table.dto';
import { JwtUser } from 'src/common/types/jwt-user.type';
import { assertSelfOrAdmin } from 'src/common/helpers/assert-self-or-admin.helper';
import { JoinRequestRepository } from './join-request-table.repository';
import { TableMembershipRepository } from './tables-membership.repository';
import { DataSource } from 'typeorm';
import { CreateJoinRequestDto } from './dtos/create-join-request.dto';
import { JoinRequest } from './entities/join-request.entity';
import { UpdateJoinRequestDto } from './dtos/update-join-request.dto';
import { JoinRequestStatus } from 'src/common/enums/join-request-status-enum';
import { TableMembership } from './entities/table-membership.entity';
import { MembershipStatus } from 'src/common/enums/membership-status,enum';

@Injectable()
export class TablesService {
  constructor(
    private readonly tableRepository: TableRepository,
    private readonly joinRequestRepository: JoinRequestRepository,
    private readonly tableMembershipRepository: TableMembershipRepository,
    private readonly dataSource: DataSource,
  ) {}

  async findWithFilters(
    filters: FindTablesDto,
  ): Promise<{ data: Table[]; total: number }> {
    return this.tableRepository.findWithFilters(filters);
  }

  async findById(id: string): Promise<Table> {
    const table = await this.tableRepository.findById(id);
    if (!table) throw new NotFoundException('Table not found');
    return table;
  }

  async create(data: CreateTableDto, dm: User): Promise<Table> {
    return this.tableRepository.create(data, dm);
  }

  async update(
    id: string,
    data: UpdateTableDto,
    requester: JwtUser,
  ): Promise<Table> {
    const table = await this.findById(id);
    assertSelfOrAdmin(requester.userId, table.dm.id, requester.role);
    Object.assign(table, data);
    return this.tableRepository.update(table);
  }

  async delete(id: string, requester: JwtUser): Promise<void> {
    const table = await this.findById(id);
    assertSelfOrAdmin(requester.userId, table.dm.id, requester.role);
    await this.tableRepository.softDelete(id);
  }

  async requestToJoin(
    tableId: string,
    requester: JwtUser,
    data: CreateJoinRequestDto,
  ): Promise<JoinRequest> {
    const table = await this.findById(tableId);

    const existing = await this.joinRequestRepository.findExisting(
      requester.userId,
      tableId,
    );

    if (existing) {
      throw new BadRequestException(
        'You already have an active request for this table',
      );
    }

    return this.joinRequestRepository.create({
      userId: requester.userId,
      tableId,
      message: data.message,
    });
  }

  async updateJoinRequest(
    tableId: string,
    requestId: string,
    data: UpdateJoinRequestDto,
    requester: JwtUser,
  ): Promise<JoinRequest> {
    const request = await this.joinRequestRepository.findById(requestId);

    if (!request) throw new NotFoundException('Join request not found');
    if (request.table.id !== tableId) {
      throw new BadRequestException('Request does not belong to this table');
    }

    assertSelfOrAdmin(requester.userId, request.table.dm.id, requester.role);

    if (request.status !== JoinRequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be updated');
    }

    if (data.status === JoinRequestStatus.APPROVED) {
      return await this.dataSource.transaction(async (manager) => {
        await this.tableMembershipRepository.create(
          { userId: request.user.id, tableId },
          manager,
        );
        return this.joinRequestRepository.updateStatus(
          request,
          JoinRequestStatus.APPROVED,
          manager,
        );
      });
    }

    return this.joinRequestRepository.updateStatus(
      request,
      JoinRequestStatus.REJECTED,
    );
  }

  async withdrawJoinRequest(
    tableId: string,
    requestId: string,
    requester: JwtUser,
  ): Promise<JoinRequest> {
    const request = await this.joinRequestRepository.findById(requestId);

    if (!request) throw new NotFoundException('Join request not found');
    if (request.table.id !== tableId) {
      throw new BadRequestException('Request does not belong to this table');
    }
    if (request.user.id !== requester.userId) {
      throw new ForbiddenException('You can only withdraw your own requests');
    }
    if (request.status !== JoinRequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be withdrawn');
    }

    return this.joinRequestRepository.updateStatus(
      request,
      JoinRequestStatus.WITHDRAWN,
    );
  }

  async leaveTable(
    tableId: string,
    requester: JwtUser,
  ): Promise<TableMembership> {
    const membership = await this.tableMembershipRepository.findOne(
      requester.userId,
      tableId,
    );

    if (!membership) throw new NotFoundException('Membership not found');
    if (membership.status !== MembershipStatus.ACTIVE) {
      throw new BadRequestException(
        'You are not an active member of this table',
      );
    }

    return this.tableMembershipRepository.updateStatus(
      membership,
      MembershipStatus.LEFT,
    );
  }

  async kickMember(
    tableId: string,
    memberId: string,
    requester: JwtUser,
  ): Promise<TableMembership> {
    const membership = await this.tableMembershipRepository.findById(memberId);

    if (!membership) throw new NotFoundException('Membership not found');
    if (membership.table.id !== tableId) {
      throw new BadRequestException('Membership does not belong to this table');
    }

    assertSelfOrAdmin(requester.userId, membership.table.dm.id, requester.role);

    if (membership.status !== MembershipStatus.ACTIVE) {
      throw new BadRequestException('Player is not an active member');
    }

    return this.tableMembershipRepository.updateStatus(
      membership,
      MembershipStatus.KICKED,
    );
  }

  async getMyTables(requester: JwtUser): Promise<{
    dmTables: Table[];
    memberships: TableMembership[];
    joinRequests: JoinRequest[];
  }> {
    const [dmTables, memberships, joinRequests] = await Promise.all([
      this.tableRepository.findByDm(requester.userId),
      this.tableMembershipRepository.findByUser(requester.userId),
      this.joinRequestRepository.findByUser(requester.userId),
    ]);

    return { dmTables, memberships, joinRequests };
  }
}
