import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { Table } from 'src/modules/tables/entities/table.entity';
import { TableMembership } from 'src/modules/tables/entities/table-membership.entity';
import { User } from 'src/modules/users/entity/user.entity';
import { Review } from './entity/review.entity';
import { CreateReviewDto } from './dtos/create-review.dto';

@Injectable()
export class ReviewRepository {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
    @InjectRepository(TableMembership)
    private readonly membershipRepository: Repository<TableMembership>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Review> {
    return manager ? manager.getRepository(Review) : this.reviewRepository;
  }

  async findTableWithDm(tableId: string): Promise<Table | null> {
    return this.tableRepository.findOne({
      where: { id: tableId },
      relations: { dm: true },
    });
  }

  async findMembershipAnyStatus(
    userId: string,
    tableId: string,
  ): Promise<TableMembership | null> {
    return this.membershipRepository.findOne({
      where: { user: { id: userId }, table: { id: tableId } },
    });
  }

  async findExisting(
    reviewerId: string,
    targetUserId: string,
    tableId: string,
  ): Promise<Review | null> {
    return this.reviewRepository.findOne({
      where: {
        reviewer: { id: reviewerId },
        targetUser: { id: targetUserId },
        table: { id: tableId },
      },
    });
  }

  async create(
    data: {
      reviewerId: string;
      tableId: string;
      dto: CreateReviewDto;
    },
    manager?: EntityManager,
  ): Promise<Review> {
    const repo = this.getRepo(manager);
    try {
      const review = repo.create({
        reviewer: { id: data.reviewerId } as User,
        targetUser: { id: data.dto.targetUserId } as User,
        table: { id: data.tableId } as Table,
        sharedBadges: data.dto.sharedBadges ?? [],
        dmBadges: data.dto.dmBadges ?? [],
        playerBadges: data.dto.playerBadges ?? [],
        writtenReview: data.dto.writtenReview,
      });
      return await repo.save(review);
    } catch (error: any) {
      if (error.code === '23505') {
        throw new InternalServerErrorException(
          'You have already reviewed this user for this table',
        );
      }
      throw new InternalServerErrorException('Failed to create review');
    }
  }
}
