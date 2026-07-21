import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Badge } from './entity/badge.entity';
import { In, Repository } from 'typeorm';
import { CreateBadgeDto } from '../admin/dtos/create-badge.dto';

@Injectable()
export class BadgesRepository {
  constructor(
    @InjectRepository(Badge)
    private readonly badgeRepository: Repository<Badge>,
  ) {}

  // badge.repository.ts
  async findByCodes(codes: string[]): Promise<Badge[]> {
    return this.badgeRepository.find({
      where: { code: In(codes), isActive: true },
    });
  }

  async findAllForAdmin(page = 1, limit = 20): Promise<[Badge[], number]> {
    return this.badgeRepository.findAndCount({
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findAllActive(): Promise<Badge[]> {
    return this.badgeRepository.find({
      where: { isActive: true },
      order: { category: 'ASC', sortOrder: 'ASC' },
    });
  }

  async findByCode(code: string): Promise<Badge | null> {
    return this.badgeRepository.findOne({ where: { code } });
  }

  async findById(id: string): Promise<Badge | null> {
    return this.badgeRepository.findOne({ where: { id } });
  }

  async create(data: CreateBadgeDto): Promise<Badge> {
    const badge = await this.badgeRepository.create(data); // instantiate the entity from the dto
    return this.badgeRepository.save(badge);
  }

  async save(badge: Badge): Promise<Badge> {
    return this.badgeRepository.save(badge);
  }

  async deleteById(id: string): Promise<void> {
    await this.badgeRepository.delete(id);
  }
}
