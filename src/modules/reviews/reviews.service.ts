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
import { TableRepository } from '../tables/table.repository';
import { BadgesService } from '../badges/badges.service';

export type BadgeSummaryEntry = {
  code: string;
  label: string;
  icon: string;
  count: number;
};

const FUNNY_DEFAULT =
  'Wow… this person was too lazy to write something nice about you 😴';

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

  async getWrittenByUser(userId: string): Promise<Review[]> {
    return this.reviewRepository.findWrittenByUser(userId);
  }

  async findMine(requester: string, target: string, table: string) {
    return this.reviewRepository.findExisting(requester, target, table);
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

    // membership rows per party (can be several if someone left and rejoined)
    const rowsOf = (userId: string) =>
      table.memberships.filter((m) => m.user.id === userId);

    const reviewerIsDm = table.dm.id === reviewer.userId;
    const targetIsDm = table.dm.id === dto.targetUserId;

    const reviewerRows = rowsOf(reviewer.userId);
    const targetRows = rowsOf(dto.targetUserId);

    // in the table = is the DM, or has at least one membership row (any status)
    if (
      (!reviewerIsDm && reviewerRows.length === 0) ||
      (!targetIsDm && targetRows.length === 0)
    ) {
      throw new BadRequestException('Both users must have shared this table');
    }

    // temporal overlap: their membership windows must have intersected.
    // the DM spans the table's whole life, so DM ↔ anyone always overlaps.
    // open memberships (endedAt null) run to "now".
    const overlaps = (): boolean => {
      if (reviewerIsDm || targetIsDm) return true;
      const now = new Date();
      return reviewerRows.some((r) =>
        targetRows.some(
          (t) =>
            r.joinedAt < (t.endedAt ?? now) && t.joinedAt < (r.endedAt ?? now),
        ),
      );
    };

    if (!overlaps()) {
      throw new BadRequestException(
        'You were never in this table at the same time as this user',
      );
    }
    const type = targetIsDm ? ReviewType.DM : ReviewType.PLAYER;

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
      badges: badgeEntities,
      writtenReview: dto.writtenReview?.trim() || FUNNY_DEFAULT,
    });
  }

  async update(
    id: string,
    dto: UpdateReviewDto,
    requester: JwtUser,
  ): Promise<void> {
    const review = await this.reviewRepository.findById(id);
    if (!review) throw new NotFoundException('Review not found');

    if (review.reviewer.id !== requester.userId) {
      throw new ForbiddenException('You can only edit your own reviews');
    }

    // badges: re-resolve through the same validation as create.
    // review.type already encodes the target's role — the old manual
    // dm/player cross-checks live inside resolveForReview now.
    if (dto.badges) {
      review.badges = await this.badgesService.resolveForReview(
        dto.badges,
        review.type,
      );
    }

    if (dto.writtenReview !== undefined) {
      review.writtenReview = dto.writtenReview.trim() || FUNNY_DEFAULT;
    }

    await this.reviewRepository.save(review);
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
      { badges: BadgeSummaryEntry[]; reviewCount: number }
    >();

    for (const id of userIds) {
      summaryByUser.set(id, { badges: [], reviewCount: 0 });
    }

    for (const review of reviews) {
      const entry = summaryByUser.get(review.targetUser.id);
      if (!entry) continue;
      entry.reviewCount += 1;

      for (const badge of review.badges) {
        const existing = entry.badges.find((b) => b.code === badge.code);
        if (existing) {
          existing.count += 1;
        } else {
          entry.badges.push({
            code: badge.code,
            label: badge.label,
            icon: badge.icon,
            count: 1,
          });
        }
      }
    }

    for (const entry of summaryByUser.values()) {
      entry.badges.sort((a, b) => b.count - a.count);
    }

    return summaryByUser;
  }
}
