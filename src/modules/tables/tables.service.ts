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
import { AgeRequirement } from 'src/common/enums/age-requirement.enum';
import { ageFrom } from 'src/common/helpers/age.helper';
import { UsersService } from '../users/users.service';
import { assertSelfOrStaff } from 'src/common/helpers/assert-self-or-admin.helper';
import { TableStatus } from 'src/common/enums/table-status.enum';

@Injectable()
export class TablesService {
  constructor(
    private readonly tableRepository: TableRepository,
    private readonly joinRequestRepository: JoinRequestRepository,
    private readonly membershipRepository: TableMembershipRepository,
    private readonly notificationsService: NotificationsService,
    private readonly conversationService: ConversationService,
    private readonly reviewsService: ReviewsService,
    private readonly userService: UsersService,
    private readonly dataSource: DataSource,
  ) {}

  // takes a table's dm + members, returns them with badge counts attached.
  // no response shaping — just enriching users with their summary.
  private async attachBadgeSummaries(table: Table) {
    const activeMemberships = table.memberships.filter(
      (m) => m.status === MembershipStatus.ACTIVE,
    );
    const pastMemberships = table.memberships.filter(
      (m) => m.status !== MembershipStatus.ACTIVE,
    );

    // everyone goes into ONE summaries query — active, past, dm
    const allUsers = [
      table.dm,
      ...activeMemberships.map((m) => m.user),
      ...pastMemberships.map((m) => m.user),
    ];
    const summaries = await this.reviewsService.getBadgeSummaries(
      allUsers.map((u) => u.id),
    );

    const withBadges = (u: User) => ({ ...u, ...summaries.get(u.id)! });

    return {
      dm: withBadges(table.dm),
      players: activeMemberships.map((m) => withBadges(m.user)),
      // membership rows kept whole: user enriched, status/dates alongside
      pastMembers: pastMemberships.map((m) => ({
        user: withBadges(m.user),
        status: m.status,
        joinedAt: m.joinedAt,
        endedAt: m.endedAt,
      })),
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

  async getMyTables(userId: string): Promise<{
    dmTables: Table[];
    memberships: TableMembership[];
    joinRequests: JoinRequest[];
  }> {
    const [dmTables, memberships, joinRequests] = await Promise.all([
      this.tableRepository.findByDm(userId),
      this.membershipRepository.findByUser(userId),
      this.joinRequestRepository.findByUser(userId),
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
    if (table.bannedAt) throw new NotFoundException('Table not available');

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

    const { dm, players, pastMembers } = await this.attachBadgeSummaries(table);
    return { ...table, dm, players, pastMembers };
  }

  async getConnectionProfile(
    tableId: string,
    targetUserId: string,
    requester: JwtUser,
  ) {
    const table = await this.tableRepository.findById(tableId);
    if (!table) throw new NotFoundException('Table not found');

    const [requests, memberships] = await Promise.all([
      this.joinRequestRepository.findByTable(tableId),
      this.membershipRepository.findByTable(tableId),
    ]);

    const hasRequest = (userId: string) =>
      requests.some((r) => r.user.id === userId); //
    const hasMembership = (userId: string) =>
      memberships.some((m) => m.user.id === userId); // any status — same rule as everywhere

    // "connected to the table" = request OR membership
    const isConnected = (userId: string) =>
      hasRequest(userId) || hasMembership(userId);

    const requesterIsDm = table.dm.id === requester.userId;
    const targetIsDm = table.dm.id === targetUserId;

    // symmetric: either party is the DM, the other is connected
    const allowed =
      (requesterIsDm && isConnected(targetUserId)) ||
      (targetIsDm && isConnected(requester.userId)) ||
      requester.role === Role.Admin;

    if (!allowed) {
      throw new ForbiddenException('No request connects you to this profile');
    }

    // resolve target: DM, or from request rows, or from membership rows
    let targetUser: User | undefined;
    if (targetIsDm) {
      targetUser = table.dm;
    } else {
      targetUser =
        requests.find((r) => r.user.id === targetUserId)?.user ??
        memberships.find((m) => m.user.id === targetUserId)?.user;
    }
    if (!targetUser) {
      throw new NotFoundException('User not found for this table');
    }

    const reviews = await this.reviewsService.getReceivedByUser(targetUser.id);
    const myReview = await this.reviewsService.findMine(
      requester.userId,
      targetUser.id,
      tableId,
    );
    return { ...targetUser, reviews, myReview };
  }

  async getTablePlayerDetail(tableId, playerId, requester) {
    const table = await this.tableRepository.findByIdWithMembers(tableId);
    if (!table) throw new NotFoundException('Table not found');
    this.assertTableMember(table, requester);

    const targetIsDm = table.dm.id === playerId;
    const targetMembership = table.memberships.find(
      (m) => m.user.id === playerId,
    );
    if (!targetIsDm && !targetMembership) {
      throw new NotFoundException('Player not found in this table');
    }
    const targetUser = targetIsDm ? table.dm : targetMembership!.user;

    const reviews = await this.reviewsService.getReceivedByUser(targetUser.id);

    const myReview = await this.reviewsService.findMine(
      requester.userId,
      targetUser.id,
      tableId,
    );

    return { ...targetUser, reviews, isDm: targetIsDm, myReview };
  }

  async requestToJoin(
    tableId: string,
    requester: JwtUser,
    data: CreateJoinRequestDto,
  ): Promise<JoinRequest> {
    const table = await this.findById(tableId);
    if (table.bannedAt)
      throw new BadRequestException('This table is not accepting requests');

    const existing = await this.joinRequestRepository.findExisting(
      requester.userId,
      tableId,
    );

    if (existing) {
      throw new BadRequestException(
        'You already have an active request for this table',
      );
    }

    if (table.ageRequirement === AgeRequirement.ADULTS_ONLY) {
      const requesterUser = await this.userService.findMe(requester.userId);
      if (!requesterUser?.birthDate || ageFrom(requesterUser.birthDate) < 18) {
        throw new BadRequestException('This table requires players 18+.');
      }
    }

    const request = await this.joinRequestRepository.create({
      userId: requester.userId,
      tableId,
      message: data.message,
    });

    try {
      await this.notificationsService.notify(
        table.dm.id,
        NotificationType.REQUEST_RECEIVED,
        { tableId, tableTitle: table.title, requesterId: requester.userId },
      );
      await this.conversationService.openConversation(
        requester.userId,
        table.dm.id,
      );
    } catch (err) {
      // request stands; log and move on
      console.error('join-request side effects failed', err);
    }

    return request;
  }

  async update(
    id: string,
    data: UpdateTableDto,
    requester: JwtUser,
  ): Promise<Table> {
    const table = await this.findById(id);
    if (table.bannedAt)
      throw new ForbiddenException('This table has been suspended');
    assertSelfOrStaff(requester.userId, table.dm.id, requester.role);
    Object.assign(table, data);
    return this.tableRepository.update(table);
  }

  async delete(id: string, requester: JwtUser): Promise<void> {
    const table = await this.findById(id);
    assertSelfOrStaff(requester.userId, table.dm.id, requester.role);
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

    assertSelfOrStaff(requester.userId, request.table.dm.id, requester.role);

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

    assertSelfOrStaff(requester.userId, membership.table.dm.id, requester.role);

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

  async openConversation(tableId: string, userIds: string[]) {
    const relatedToTable = await this.areAllRelatedToTable(tableId, userIds);
    if (!relatedToTable) {
      throw new BadRequestException('You cant talk with that person'); // maybe tone that down 😄
    }
    const [userA, userB] = userIds;
    return this.conversationService.openConversation(userA, userB); // create/fetch, return it
  }

  async areAllRelatedToTable(
    tableId: string,
    userIds: string[],
  ): Promise<boolean> {
    const table = await this.tableRepository.findById(tableId);
    if (!table) throw new NotFoundException('Table not found');

    const [memberIds, requesterIds] = await Promise.all([
      this.membershipRepository.findUserIdsByTable(tableId),
      this.joinRequestRepository.findUserIdsByTable(tableId),
    ]);

    const related = new Set<string>([
      table.dm.id,
      ...memberIds,
      ...requesterIds,
    ]);
    return userIds.every((id) => related.has(id));
  }

  async banTable(id: string): Promise<Table> {
    const table = await this.tableRepository.findById(id);
    if (!table) throw new NotFoundException('Table not found');
    table.bannedAt = new Date();
    return this.tableRepository.update(table);
  }

  async unbanTable(id: string): Promise<Table> {
    const table = await this.tableRepository.findById(id);
    if (!table) throw new NotFoundException('Table not found');
    table.bannedAt = null;
    return this.tableRepository.update(table);
  }

  async adminSearchTables(q: string): Promise<Table[]> {
    if (!q || q.trim().length < 2) return [];
    return this.tableRepository.adminSearchTables(q);
  }

  async getTableForAdmin(id: string): Promise<{
    table: Table;
    requests: JoinRequest[];
  }> {
    const table = await this.tableRepository.findByIdWithMembers(id);
    if (!table) throw new NotFoundException('Table not found');

    const requests = await this.joinRequestRepository.findByTable(id);

    return { table, requests };
  }
}
