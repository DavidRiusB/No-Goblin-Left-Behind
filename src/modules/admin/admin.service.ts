import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { TablesService } from '../tables/tables.service';
import type { JwtUser } from 'src/common/types/jwt-user.type';

@Injectable()
export class AdminService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tablesService: TablesService,
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
}
