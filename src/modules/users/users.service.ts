import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { User } from './entity/user.entity';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async adminSearchUsers(q: string): Promise<User[]> {
    if (!q || q.trim().length < 2) return [];
    return this.userRepository.adminSearchUsers(q.trim());
  }
}
