import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { TablesService } from '../tables/tables.service';
import type { JwtUser } from 'src/common/types/jwt-user.type';
import { ReviewsService } from '../reviews/reviews.service';
import { CreateBadgeDto } from './dtos/create-badge.dto';
import { BadgesService } from '../badges/badges.service';
import { UploadsService } from '../uploads/uploads.service';
import { UpdateBadgeDto } from './dtos/update-badge.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tablesService: TablesService,
    private readonly reviewsService: ReviewsService,
    private readonly badgesService: BadgesService,
    private readonly uploadsService: UploadsService,
  ) {}

  // ── users ──────────────────────────────────────────────

  async searchUsers(search: string) {
    return this.usersService.adminSearchUsers(search);
  }

  async getUserDetail(id: string, requester: JwtUser) {
    const user = await this.usersService.findUserById(id, requester);
    const { dmTables, memberships, joinRequests } =
      await this.tablesService.getMyTables(id);
    return { user, dmTables, memberships, joinRequests };
  }

  async banUser(id: string, requester: JwtUser) {
    return this.usersService.banUser(id, requester);
  }

  async unbanUser(id: string, requester: JwtUser) {
    return this.usersService.unbanUser(id, requester);
  }

  // ── tables ─────────────────────────────────────────────

  async searchTables(search: string) {
    return this.tablesService.adminSearchTables(search);
  }

  async getTableDetail(id: string) {
    return this.tablesService.getTableForAdmin(id);
  }

  async banTable(id: string) {
    return this.tablesService.banTable(id);
  }

  async unbanTable(id: string) {
    return this.tablesService.unbanTable(id);
  }

  // ── reviews ─────────────────────────────────────────────

  async getReviewDetail(id: string) {
    return this.reviewsService.getReviewForAdmin(id);
  }

  async findUserReviews(id: string, admin: JwtUser) {
    const user = await this.usersService.findUserById(id, admin);

    return this.reviewsService.getUserReviewsForAdmin(user.id);
  }

  async deleteReview(id: string, requester: JwtUser) {
    return this.reviewsService.delete(id, requester);
  }

  // ── reviews ─────────────────────────────────────────────

  async listBadges(page = 1, limit = 20) {
    return this.badgesService.listBadges(page, limit);
  }

  async createBadge(dto: CreateBadgeDto, file?: Express.Multer.File) {
    // create throws on duplicate code (unique constraint / explicit check) —
    // happens BEFORE any upload, so a dupe never wastes a Cloudinary call
    const badge = await this.badgesService.create(dto);

    if (!file) return badge;

    // badge exists; upload can fail (network, Cloudinary down) — roll back if it does
    try {
      const url = await this.uploadsService.uploadBadgeIcon(file, badge.id);
      return this.badgesService.setIcon(badge, url);
    } catch (err) {
      await this.badgesService.delete(badge.id);
      throw err;
    }
  }

  async setBadgeActive(id: string, isActive: boolean) {
    return this.badgesService.setActive(id, isActive);
  }

  async updateBadge(id: string, dto: UpdateBadgeDto) {
    return this.badgesService.update(id, dto);
  }

  async updateBadgeIcon(id: string, file: Express.Multer.File) {
    const badge = await this.badgesService.findById(id); // throws if gone
    const url = await this.uploadsService.uploadBadgeIcon(file, badge.id);
    return this.badgesService.setIcon(badge, url);
  }
}
