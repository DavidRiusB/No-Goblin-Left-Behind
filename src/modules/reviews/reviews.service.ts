import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReviewRepository } from './review.repository';

import { JwtUser } from 'src/common/types/jwt-user.type';
import { CreateReviewDto } from './dtos/create-review.dto';
import { Review } from './entity/review.entity';
import { UpdateReviewDto } from './dtos/update-review.dto';
import { assertSelfOrAdmin } from 'src/common/helpers/assert-self-or-admin.helper';
import { ReviewType } from 'src/common/enums/review-type.enum';
import { allowedBadgesForType } from 'src/common/badges';
import { TableRepository } from '../tables/table.repository';
import { BadgesService } from '../badges/badges.service';

const MAX_BADGES = 3; // tunable; later a subscriber perk could raise this
@Injectable()
export class ReviewsService {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly tablesRepository: TableRepository,
    private readonly badgesService: BadgesService,
  ) {}

  async getReceivedByUser(userId: string) {
    return this.reviewRepository.findReceivedByUser(userId);
  }

  async create(
    tableId: string,
    dto: CreateReviewDto,
    reviewer: JwtUser,
  ): Promise<Review> {
    if (dto.targetUserId === reviewer.userId) {
      throw new BadRequestException('You cannot review yourself');
    }

    const table = await this.tablesRepository.findByIdWithMembers(tableId);
    if (!table) throw new NotFoundException('Table not found');

    const targetIsDm = table.dm.id === dto.targetUserId;
    const type = targetIsDm ? ReviewType.DM : ReviewType.PLAYER;

    const memberIds = new Set(table.memberships.map((m) => m.user.id));
    const isInTable = (userId: string) =>
      userId === table.dm.id || memberIds.has(userId);

    if (!isInTable(reviewer.userId) || !isInTable(dto.targetUserId)) {
      throw new BadRequestException('Both users must have shared this table');
    }

    // resolve + validate badge codes against the badge TABLE (replaces the
    // old code-catalog checks: existence, active, dupes, max, allowed-for-type)
    const badgeEntities = await this.badgesService.resolveForReview(
      dto.badges ?? [],
      type,
    );

    // one review per reviewer/target/table
    const existing = await this.reviewRepository.findExisting(
      reviewer.userId,
      dto.targetUserId,
      tableId,
    );
    if (existing) {
      throw new BadRequestException(
        'You have already reviewed this user for this table',
      );
    }

    return this.reviewRepository.create({
      reviewerId: reviewer.userId,
      targetUserId: dto.targetUserId,
      tableId,
      type,
      badges: badgeEntities, // ← Badge[] entities now, not string codes
      writtenReview: dto.writtenReview,
    });
  }

  async update(
    id: string,
    dto: UpdateReviewDto,
    requester: JwtUser,
  ): Promise<Review> {
    const review = await this.reviewRepository.findById(id);
    if (!review) throw new NotFoundException('Review not found');

    if (review.reviewer.id !== requester.userId) {
      throw new ForbiddenException('You can only edit your own reviews');
    }

    // re-validate badge role-context on edit
    const isTargetDm = review.table.dm.id === review.targetUser.id;
    if (!isTargetDm && dto.dmBadges?.length) {
      throw new BadRequestException(
        'DM badges can only be given to the table DM',
      );
    }
    if (isTargetDm && dto.playerBadges?.length) {
      throw new BadRequestException('Player badges cannot be given to the DM');
    }

    Object.assign(review, dto);
    return this.reviewRepository.update(review);
  }

  async delete(id: string, requester: JwtUser): Promise<void> {
    const review = await this.reviewRepository.findById(id);
    if (!review) throw new NotFoundException('Review not found');

    assertSelfOrAdmin(requester.userId, review.reviewer.id, requester.role);

    await this.reviewRepository.softDelete(id);
  }

  async getBadgeSummaries(userIds: string[]) {
    const reviews = await this.reviewRepository.findReceivedByUsers(userIds);

    const summaryByUser = new Map<
      string,
      { badges: Record<string, number>; reviewCount: number }
    >();

    for (const id of userIds) {
      summaryByUser.set(id, { badges: {}, reviewCount: 0 });
    }
    for (const review of reviews) {
      const entry = summaryByUser.get(review.targetUser.id);
      if (!entry) continue;
      entry.reviewCount += 1;
      for (const badge of review.badges) {
        entry.badges[badge.code] = (entry.badges[badge.code] ?? 0) + 1;
      }
    }

    return summaryByUser;
  }
}
