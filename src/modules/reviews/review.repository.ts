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

  async hasTableConnection(userAId: string, userBId: string): Promise<boolean> {
    // tables where A is DM and B is member/requester, or vice versa,
    // or both are members of the same table
    const result = await this.tableRepository
      .createQueryBuilder('table')
      .select('table.id')
      .where(
        `(
        -- A is DM, B is connected to A's table
        (table.dm_id = :userA AND (
          EXISTS (SELECT 1 FROM table_memberships tm WHERE tm.table_id = table.id AND tm.user_id = :userB)
          OR EXISTS (SELECT 1 FROM join_requests jr WHERE jr.table_id = table.id AND jr.user_id = :userB AND jr.status IN (:...activeStatuses))
        ))
        OR
        -- B is DM, A is connected to B's table
        (table.dm_id = :userB AND (
          EXISTS (SELECT 1 FROM table_memberships tm WHERE tm.table_id = table.id AND tm.user_id = :userA)
          OR EXISTS (SELECT 1 FROM join_requests jr WHERE jr.table_id = table.id AND jr.user_id = :userA AND jr.status IN (:...activeStatuses))
        ))
        OR
        -- both are members of the same table
        (
          EXISTS (SELECT 1 FROM table_memberships tm WHERE tm.table_id = table.id AND tm.user_id = :userA)
          AND EXISTS (SELECT 1 FROM table_memberships tm WHERE tm.table_id = table.id AND tm.user_id = :userB)
        )
      )`,
        {
          userA: userAId,
          userB: userBId,
          activeStatuses: [
            JoinRequestStatus.PENDING,
            JoinRequestStatus.APPROVED,
          ],
        },
      )
      .limit(1)
      .getRawOne();

    return !!result;
  }

  async findReceivedByUser(userId: string): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { targetUser: { id: userId } },
      relations: { reviewer: true, table: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findPostedByUser(userId: string): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { reviewer: { id: userId } },
      relations: { targetUser: true, table: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Review | null> {
    return this.reviewRepository.findOne({
      where: { id },
      relations: { reviewer: true, targetUser: true, table: { dm: true } },
    });
  }

  async update(review: Review, manager?: EntityManager): Promise<Review> {
    const repo = this.getRepo(manager);
    try {
      return await repo.save(review);
    } catch (error: any) {
      throw new InternalServerErrorException('Failed to update review');
    }
  }

  async softDelete(id: string, manager?: EntityManager): Promise<void> {
    const repo = this.getRepo(manager);
    await repo.softDelete(id);
  }
}
