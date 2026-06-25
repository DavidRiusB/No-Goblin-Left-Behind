import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { Table } from 'src/modules/tables/entities/table.entity';
import { User } from 'src/modules/users/entity/user.entity';
import { Review } from './entity/review.entity';
import { ReviewType } from 'src/common/enums/review-type.enum';

@Injectable()
export class ReviewRepository {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Review> {
    return manager ? manager.getRepository(Review) : this.reviewRepository;
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
      targetUserId: string;
      tableId: string;
      type: ReviewType;
      badges: string[];
      writtenReview?: string;
    },
    manager?: EntityManager,
  ): Promise<Review> {
    const repo = this.getRepo(manager);
    try {
      const review = repo.create({
        reviewer: { id: data.reviewerId } as User,
        targetUser: { id: data.targetUserId } as User, // wait — see note
        table: { id: data.tableId } as Table,
        type: data.type,
        badges: data.badges,
        writtenReview: data.writtenReview,
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

  async findReceivedByUser(userId: string): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { targetUser: { id: userId } },
      relations: { reviewer: true, table: true },
      order: { createdAt: 'DESC' },
    });
  }

  // review.repository.ts
  async findReceivedByUsers(userIds: string[]): Promise<Review[]> {
    if (userIds.length === 0) return [];
    return this.reviewRepository.find({
      where: { targetUser: { id: In(userIds) } },
      relations: { targetUser: true },
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
