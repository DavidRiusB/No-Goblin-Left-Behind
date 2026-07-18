import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtUser } from 'src/common/types/jwt-user.type';
import { TablesService } from '../tables/tables.service';

// admin.service.ts
@Injectable()
export class AdminService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tablesService: TablesService,
  ) {}

  async searchUsers(search: string) {
    if (!search?.trim()) {
      throw new BadRequestException('Search term required');
    }
    return this.usersService.adminSearchUsers(search.trim());
  }

  async getUserDetail(id: string, requester: JwtUser) {
    const user = await this.usersService.findUserById(id, requester);
    const { dmTables, memberships, joinRequests } =
      await this.tablesService.getMyTables(id);
    return { user, dmTables, memberships, joinRequests };
  }
}
