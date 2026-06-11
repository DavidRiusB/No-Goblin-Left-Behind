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
import { Role } from 'src/common/enums/roles.enum';

@Injectable()
export class ReviewsService {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  async create(
    tableId: string,
    dto: CreateReviewDto,
    reviewer: JwtUser,
  ): Promise<Review> {
    if (dto.targetUserId === reviewer.userId) {
      throw new BadRequestException('You cannot review yourself');
    }

    const table = await this.reviewRepository.findTableWithDm(tableId);
    if (!table) throw new NotFoundException('Table not found');

    const isTargetDm = table.dm.id === dto.targetUserId;

    // badge role-context validation
    if (!isTargetDm && dto.dmBadges?.length) {
      throw new BadRequestException(
        'DM badges can only be given to the table DM',
      );
    }
    if (isTargetDm && dto.playerBadges?.length) {
      throw new BadRequestException('Player badges cannot be given to the DM');
    }

    // both parties must have shared the table
    const reviewerInTable = await this.isUserInTable(
      reviewer.userId,
      tableId,
      table.dm.id,
    );
    const targetInTable = await this.isUserInTable(
      dto.targetUserId,
      tableId,
      table.dm.id,
    );

    if (!reviewerInTable || !targetInTable) {
      throw new BadRequestException('Both users must have shared this table');
    }

    // no duplicate review
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
      tableId,
      dto,
    });
  }

  private async isUserInTable(
    userId: string,
    tableId: string,
    dmId: string,
  ): Promise<boolean> {
    if (userId === dmId) return true;
    const membership = await this.reviewRepository.findMembershipAnyStatus(
      userId,
      tableId,
    );
    return !!membership;
  }

  async findReceivedByUser(
    targetUserId: string,
    requester: JwtUser,
  ): Promise<Review[]> {
    await this.assertCanViewUserReviews(targetUserId, requester);
    return this.reviewRepository.findReceivedByUser(targetUserId);
  }

  async findPostedByUser(authorId: string): Promise<Review[]> {
    // admin-only, enforced at controller level via guard,
    // but double-check here until RolesGuard exists
    return this.reviewRepository.findPostedByUser(authorId);
  }

  async findById(id: string, requester: JwtUser): Promise<Review> {
    const review = await this.reviewRepository.findById(id);
    if (!review) throw new NotFoundException('Review not found');

    // same visibility rule: you can see it if you could see the target's reviews
    await this.assertCanViewUserReviews(review.targetUser.id, requester);
    return review;
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

  private async assertCanViewUserReviews(
    targetUserId: string,
    requester: JwtUser,
  ): Promise<void> {
    if (requester.userId === targetUserId) return;
    if (requester.role === Role.Admin) return;

    const connected = await this.reviewRepository.hasTableConnection(
      requester.userId,
      targetUserId,
    );

    if (!connected) {
      throw new ForbiddenException(
        'You can only view reviews of users you share a table with',
      );
    }
  }
}
