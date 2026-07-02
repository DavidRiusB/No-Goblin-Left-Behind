import { BadRequestException, Injectable } from '@nestjs/common';
import { BadgesRepository } from './badge.repository';
import { ReviewType } from 'src/common/enums/review-type.enum';
import { Badge } from './entity/badge.entity';

const MAX_BADGES = 3; // tunable; later a subscriber perk could raise this
@Injectable()
export class BadgesService {
  constructor(private readonly badgeRepository: BadgesRepository) {}

  // badges.service.ts
  async resolveForReview(codes: string[], type: ReviewType): Promise<Badge[]> {
    // dedupe + basic shape checks
    const unique = [...new Set(codes)];
    if (unique.length === 0) {
      throw new BadRequestException('At least one badge is required');
    }
    if (unique.length > MAX_BADGES) {
      throw new BadRequestException('A review can have at most 3 badges');
    }

    // fetch the real badge rows for these codes (active only)
    const badges = await this.badgeRepository.findByCodes(unique); // active + code IN (...)

    // every code must resolve to a real, active badge
    if (badges.length !== unique.length) {
      throw new BadRequestException('One or more badges are invalid');
    }

    // each badge must be allowed for this review type:
    // appliesTo null = general (any); else must match the review type
    const wrong = badges.filter((b) => b.appliesTo && b.appliesTo !== type);
    if (wrong.length > 0) {
      throw new BadRequestException(
        'One or more badges are not valid for this review type',
      );
    }

    return badges;
  }

  async getAllActive(): Promise<Badge[]> {
    return this.badgeRepository.findAllActive();
  }
}
