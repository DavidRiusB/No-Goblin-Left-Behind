import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Badge } from './entity/badge.entity';
import { In, Repository } from 'typeorm';

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
}
