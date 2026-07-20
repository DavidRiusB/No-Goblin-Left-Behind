import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { TablesService } from '../tables/tables.service';
import type { JwtUser } from 'src/common/types/jwt-user.type';
import { ReviewsService } from '../reviews/reviews.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tablesService: TablesService,
    private readonly reviewsService: ReviewsService,
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
}
