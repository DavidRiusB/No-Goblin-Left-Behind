import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BadgesRepository } from './badge.repository';
import { ReviewType } from 'src/common/enums/review-type.enum';
import { Badge } from './entity/badge.entity';
import { CreateBadgeDto } from '../admin/dtos/create-badge.dto';
import { UpdateBadgeDto } from '../admin/dtos/update-badge.dto';

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

  async listBadges(page: number, limit: number) {
    const [badges, total] = await this.badgeRepository.findAllForAdmin(
      page,
      limit,
    );
    return { badges, total, page };
  }

  async getAllActive(): Promise<Badge[]> {
    return this.badgeRepository.findAllActive();
  }

  async findById(id: string): Promise<Badge> {
    const badge = await this.badgeRepository.findById(id);
    if (!badge) throw new NotFoundException('Badge not found');
    return badge;
  }

  async create(dto: CreateBadgeDto): Promise<Badge> {
    const existing = await this.badgeRepository.findByCode(dto.code);
    if (existing) {
      throw new BadRequestException(`Badge code "${dto.code}" already exists`);
    }
    return this.badgeRepository.create(dto);
  }

  async setIcon(badge: Badge, iconUrl: string): Promise<Badge> {
    badge.iconUrl = iconUrl;
    return this.badgeRepository.save(badge);
  }

  async delete(id: string): Promise<void> {
    await this.badgeRepository.deleteById(id);
  }

  async setActive(id: string, isActive: boolean): Promise<Badge> {
    const badge = await this.badgeRepository.findById(id);
    if (!badge) throw new NotFoundException('Badge not found');
    badge.isActive = isActive;
    return this.badgeRepository.save(badge);
  }

  async update(id: string, dto: UpdateBadgeDto): Promise<Badge> {
    const badge = await this.badgeRepository.findById(id);
    if (!badge) throw new NotFoundException('Badge not found');
    Object.assign(badge, dto);
    return this.badgeRepository.save(badge);
  }
}
