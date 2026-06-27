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
import { ReviewRepository } from '../reviews/review.repository';
import { Role } from 'src/common/enums/roles.enum';
import { Review } from '../reviews/entity/review.entity';

type UserSummary = { badges: Record<string, number>; reviewCount: number };
@Injectable()
export class TablesService {
  constructor(
    private readonly tableRepository: TableRepository,
    private readonly joinRequestRepository: JoinRequestRepository,
    private readonly membershipRepository: TableMembershipRepository,
    private readonly notificationsService: NotificationsService,
    private readonly conversationService: ConversationService,
    private readonly reviewRepository: ReviewRepository,
    private readonly dataSource: DataSource,
  ) {}

  // shapes a user's full profile + attributed reviews. pure shaping —
  // no access logic. callers do their own gating, then call this.
  private buildUserProfileResponse(user: User, reviews: Review[]) {
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      preferredSystems: user.preferredSystems,
      playStyleTags: user.playStyleTags,
      reviews: reviews.map((r) => ({
        id: r.id,
        type: r.type,
        badges: r.badges,
        writtenReview: r.writtenReview,
        createdAt: r.createdAt,
        reviewer: {
          id: r.reviewer.id,
          username: r.reviewer.username,
          displayName: r.reviewer.displayName,
          avatarUrl: r.reviewer.avatarUrl,
        },
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

  async findById(id: string): Promise<Table> {
    const table = await this.tableRepository.findById(id);
    if (!table) throw new NotFoundException('Table not found');
    return table;
  }

  // ── shared display builder ─────────────────────────────────────────
  // badge aggregation + response shaping. used by BOTH the public and the
  // member-gated detail endpoints. this is pure display logic — no access
  // rules, no private fields. access + private fields live in the callers.
  private async buildTableDetailResponse(table: Table) {
    const memberUsers = table.memberships
      .filter((m) => m.status === MembershipStatus.ACTIVE)
      .map((m) => m.user);
    const allUsers = [table.dm, ...memberUsers];
    const userIds = allUsers.map((u) => u.id);

    const reviews = await this.reviewRepository.findReceivedByUsers(userIds);

    const summaryByUser = new Map<string, UserSummary>();

    for (const user of allUsers) {
      summaryByUser.set(user.id, { badges: {}, reviewCount: 0 });
    }
    for (const review of reviews) {
      const entry = summaryByUser.get(review.targetUser.id);
      if (!entry) continue;
      entry.reviewCount += 1;
      for (const badge of review.badges) {
        // single array now
        entry.badges[badge] = (entry.badges[badge] ?? 0) + 1;
      }
    }

    const shapeUser = (u: User) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      ...summaryByUser.get(u.id)!,
    });

    return {
      id: table.id,
      title: table.title,
      system: table.system,
      summary: table.summary,
      details: table.details,
      houseRules: table.houseRules,
      tableType: table.tableType,
      experienceLevel: table.experienceLevel,
      recurrence: table.recurrence,
      scheduledAt: table.scheduledAt,
      timezone: table.timezone,
      estimatedDurationHours: table.estimatedDurationHours,
      isOnline: table.isOnline,
      platform: table.platform,
      links: table.links,
      location: table.location,
      seatsTotal: table.seatsTotal,
      language: table.language,
      ageRequirement: table.ageRequirement,
      status: table.status,
      dm: shapeUser(table.dm),
      players: memberUsers.map(shapeUser),
    };
  }

  // ── public detail ──────────────────────────────────────────────────
  // no auth, no private fields. anyone browsing can hit this.
  async getTableDetail(id: string) {
    const table = await this.tableRepository.findByIdWithMembers(id);
    if (!table) throw new NotFoundException('Table not found');
    return this.buildTableDetailResponse(table);
  }

  // ── member-gated detail ────────────────────────────────────────────
  // DM, active members, or admins only. THIS is where future private
  // member-only fields (session links, house rules, discord invite, etc.)
  // get added — never on getTableDetail above.
  async getTableMemberDetail(id: string, requester: JwtUser) {
    const table = await this.tableRepository.findByIdWithMembers(id);
    if (!table) throw new NotFoundException('Table not found');

    this.assertTableMember(table, requester);

    const base = await this.buildTableDetailResponse(table);
    return {
      ...base,
      links: table.links,
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

    const reviews = await this.reviewRepository.findReceivedByUser(
      targetUser.id,
    );
    return this.buildUserProfileResponse(targetUser, reviews);
  }

  async getTablePlayerDetail(
    tableId: string,
    playerId: string,
    requester: JwtUser,
  ) {
    const table = await this.tableRepository.findByIdWithMembers(tableId);
    if (!table) throw new NotFoundException('Table not found');

    this.assertTableMember(table, requester); // gate 1: requester allowed

    // gate 2: the target must actually be in this table (DM or active member)
    const targetIsDm = table.dm.id === playerId;
    const targetMembership = table.memberships.find(
      (m) => m.user.id === playerId && m.status === MembershipStatus.ACTIVE,
    );
    if (!targetIsDm && !targetMembership) {
      throw new NotFoundException('Player not found in this table');
    }

    // resolve the target user object (from dm or the membership)
    const targetUser = targetIsDm ? table.dm : targetMembership!.user;

    // full reviews for this one user
    const reviews = await this.reviewRepository.findReceivedByUser(
      targetUser.id,
    );

    return this.buildUserProfileResponse(targetUser, reviews);
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

  async getTableRequests(tableId: string, requester: JwtUser) {
    const table = await this.tableRepository.findById(tableId); // lean: table + dm
    if (!table) throw new NotFoundException('Table not found');

    // only the DM (or admin) can see who's requesting their table
    if (table.dm.id !== requester.userId && requester.role !== Role.Admin) {
      throw new ForbiddenException(
        'Only the table owner can view its requests',
      );
    }

    const requests =
      await this.joinRequestRepository.findPendingByTable(tableId);

    // shape — trim requester to public fields (no email/role)
    return requests.map((r) => ({
      id: r.id,
      message: r.message,
      createdAt: r.createdAt,
      requester: {
        id: r.user.id,
        username: r.user.username,
        displayName: r.user.displayName,
        avatarUrl: r.user.avatarUrl,
      },
    }));
  }

  async getTableManagement(tableId: string, requester: JwtUser) {
    const table = await this.tableRepository.findById(tableId); // lean: table + dm
    if (!table) throw new NotFoundException('Table not found');

    // DM-only (or admin) — members do NOT get the management view
    if (table.dm.id !== requester.userId && requester.role !== Role.Admin) {
      throw new ForbiddenException('Only the table owner can manage it');
    }

    const [memberships, requests] = await Promise.all([
      this.membershipRepository.findByTable(tableId),
      this.joinRequestRepository.findByTable(tableId),
    ]);

    const shapeUser = (u: User) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
    });

    return {
      table: {
        id: table.id,
        title: table.title,
        system: table.system,
        summary: table.summary,
        details: table.details,
        houseRules: table.houseRules,
        tableType: table.tableType,
        experienceLevel: table.experienceLevel,
        recurrence: table.recurrence,
        scheduledAt: table.scheduledAt,
        timezone: table.timezone,
        estimatedDurationHours: table.estimatedDurationHours,
        isOnline: table.isOnline,
        platform: table.platform,
        links: table.links,
        location: table.location,
        seatsTotal: table.seatsTotal,
        language: table.language,
        ageRequirement: table.ageRequirement,
        status: table.status,
      },
      memberships: memberships.map((m) => ({
        id: m.id,
        status: m.status,
        joinedAt: m.joinedAt,
        endedAt: m.endedAt,
        user: shapeUser(m.user),
      })),
      requests: requests.map((r) => ({
        id: r.id,
        status: r.status,
        message: r.message,
        createdAt: r.createdAt,
        user: shapeUser(r.user),
      })),
    };
  }
}
