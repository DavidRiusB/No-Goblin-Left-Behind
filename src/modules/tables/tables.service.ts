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
import { MembershipStatus } from 'src/common/enums/membership-status.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from 'src/common/enums/notification-type.enum';
import { ConversationService } from '../chat/conversation.service';
import { Role } from 'src/common/enums/roles.enum';
import { ReviewsService } from '../reviews/reviews.service';

@Injectable()
export class TablesService {
  constructor(
    private readonly tableRepository: TableRepository,
    private readonly joinRequestRepository: JoinRequestRepository,
    private readonly membershipRepository: TableMembershipRepository,
    private readonly notificationsService: NotificationsService,
    private readonly conversationService: ConversationService,
    private readonly reviewsService: ReviewsService,
    private readonly dataSource: DataSource,
  ) {}

  // takes a table's dm + active members, returns them with badge counts attached.
  // no response shaping — just enriching users with their summary.
  private async attachBadgeSummaries(table: Table) {
    const memberUsers = table.memberships
      .filter((m) => m.status === MembershipStatus.ACTIVE)
      .map((m) => m.user);
    const allUsers = [table.dm, ...memberUsers];
    const userIds = allUsers.map((u) => u.id);

    const summaries = await this.reviewsService.getBadgeSummaries(userIds);

    const withBadges = (u: User) => ({ ...u, ...summaries.get(u.id)! });

    return {
      dm: withBadges(table.dm),
      players: memberUsers.map(withBadges),
    };
  }

  // throws if the requester isn't the DM, an active member, or an admin.
  // the standard "are you allowed to see member-only stuff for this table" gate.
  private assertTableMember(table: Table, requester: JwtUser): void {
    const isDm = table.dm.id === requester.userId;
    const isActiveMember = table.memberships.some(
      (m) =>
        m.user.id === requester.userId && m.status === MembershipStatus.ACTIVE,
    );

    if (!isDm && !isActiveMember && requester.role !== Role.Admin) {
      throw new ForbiddenException('You are not a member of this table');
    }
  }

  async findWithFilters(
    filters: FindTablesDto,
  ): Promise<{ data: Table[]; total: number }> {
    return this.tableRepository.findWithFilters(filters);
  }

  async getMyTables(requester: JwtUser): Promise<{
    dmTables: Table[];
    memberships: TableMembership[];
    joinRequests: JoinRequest[];
  }> {
    const [dmTables, memberships, joinRequests] = await Promise.all([
      this.tableRepository.findByDm(requester.userId),
      this.membershipRepository.findByUser(requester.userId),
      this.joinRequestRepository.findByUser(requester.userId),
    ]);

    return { dmTables, memberships, joinRequests };
  }

  async findById(id: string): Promise<Table> {
    const table = await this.tableRepository.findById(id);
    if (!table) throw new NotFoundException('Table not found');
    return table;
  }

  async create(data: CreateTableDto, dm: User): Promise<Table> {
    return this.tableRepository.create(data, dm);
  }

  // ── public detail ──────────────────────────────────────────────────
  // no auth, no private fields. anyone browsing can hit this.
  async getTableDetail(id: string) {
    const table = await this.tableRepository.findByIdWithMembers(id);
    if (!table) throw new NotFoundException('Table not found');
    const { dm, players } = await this.attachBadgeSummaries(table);
    return {
      ...table,
      dm,
      players,
    };
  }

  async getTableForMember(id: string, requester: JwtUser) {
    const table = await this.tableRepository.findByIdWithMembers(id);
    if (!table) throw new NotFoundException('Table not found');

    this.assertTableMember(table, requester);

    const { dm, players } = await this.attachBadgeSummaries(table);
    return {
      ...table,
      dm,
      players,
    };
  }

  async getConnectionProfile(
    tableId: string,
    targetUserId: string,
    requester: JwtUser,
  ) {
    const table = await this.tableRepository.findById(tableId); // lean: table + dm
    if (!table) throw new NotFoundException('Table not found');

    // who's connected to this table by a request (any status — supports
    // retroactive: a rejected requester keeps visibility for re-accept)
    const requests = await this.joinRequestRepository.findByTable(tableId);
    const hasRequest = (userId: string) =>
      requests.some((r) => r.user.id === userId);

    const requesterIsDm = table.dm.id === requester.userId;
    const targetIsDm = table.dm.id === targetUserId;

    // symmetric gate: a request connects the two parties, either direction
    const allowed =
      (requesterIsDm && hasRequest(targetUserId)) || // DM viewing a requester
      (targetIsDm && hasRequest(requester.userId)) || // requester viewing the DM
      requester.role === Role.Admin;

    if (!allowed) {
      throw new ForbiddenException('No request connects you to this profile');
    }

    // resolve the target user object — either the DM, or the requester from the request rows
    let targetUser: User | undefined;
    if (targetIsDm) {
      targetUser = table.dm;
    } else {
      const req = requests.find((r) => r.user.id === targetUserId);
      targetUser = req?.user;
    }
    if (!targetUser) {
      throw new NotFoundException('User not found for this table');
    }

    const reviews = await this.reviewsService.getReceivedByUser(targetUser.id);
    return { ...targetUser, reviews };
  }

  async getTablePlayerDetail(tableId, playerId, requester) {
    const table = await this.tableRepository.findByIdWithMembers(tableId);
    if (!table) throw new NotFoundException('Table not found');
    this.assertTableMember(table, requester);

    const targetIsDm = table.dm.id === playerId;
    const targetMembership = table.memberships.find(
      (m) => m.user.id === playerId && m.status === MembershipStatus.ACTIVE,
    );
    if (!targetIsDm && !targetMembership) {
      throw new NotFoundException('Player not found in this table');
    }
    const targetUser = targetIsDm ? table.dm : targetMembership!.user;

    const reviews = await this.reviewsService.getReceivedByUser(targetUser.id);

    return { ...targetUser, reviews, isDm: targetIsDm };
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

    const request = await this.joinRequestRepository.create({
      userId: requester.userId,
      tableId,
      message: data.message,
    });

    await this.notificationsService.notify(
      table.dm.id,
      NotificationType.REQUEST_RECEIVED,
      { tableId, tableTitle: table.title, requesterId: requester.userId },
    );
    await this.conversationService.openConversation(
      requester.userId,
      table.dm.id,
    );

    return request;
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
        await this.membershipRepository.create(
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
    const membership = await this.membershipRepository.findOne(
      requester.userId,
      tableId,
    );

    if (!membership) throw new NotFoundException('Membership not found');
    if (membership.status !== MembershipStatus.ACTIVE) {
      throw new BadRequestException(
        'You are not an active member of this table',
      );
    }

    return this.membershipRepository.updateStatus(
      membership,
      MembershipStatus.LEFT,
    );
  }

  async kickMember(
    tableId: string,
    memberId: string,
    requester: JwtUser,
  ): Promise<TableMembership> {
    const membership = await this.membershipRepository.findById(memberId);

    if (!membership) throw new NotFoundException('Membership not found');
    if (membership.table.id !== tableId) {
      throw new BadRequestException('Membership does not belong to this table');
    }

    assertSelfOrAdmin(requester.userId, membership.table.dm.id, requester.role);

    if (membership.status !== MembershipStatus.ACTIVE) {
      throw new BadRequestException('Player is not an active member');
    }

    return this.membershipRepository.updateStatus(
      membership,
      MembershipStatus.KICKED,
    );
  }

  async getTableManagement(tableId: string, requester: JwtUser) {
    const table = await this.tableRepository.findById(tableId);
    if (!table) throw new NotFoundException('Table not found');

    if (table.dm.id !== requester.userId && requester.role !== Role.Admin) {
      throw new ForbiddenException('Only the table owner can manage it');
    }

    const [memberships, requests] = await Promise.all([
      this.membershipRepository.findByTable(tableId),
      this.joinRequestRepository.findByTable(tableId),
    ]);

    return { table, memberships, requests };
  }
}
