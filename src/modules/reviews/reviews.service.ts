import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReviewRepository } from './review.repository';

import { JwtUser } from 'src/common/types/jwt-user.type';
import { CreateReviewDto } from './dtos/create-review.dto';
import { Review } from './entity/review.entity';

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
}
