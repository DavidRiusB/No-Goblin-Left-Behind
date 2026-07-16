import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { User } from './entity/user.entity';
import { UpdateUserDto } from './dtos/user-update.dto';
import { JwtUser } from 'src/common/types/jwt-user.type';
import { assertSelfOrStaff } from 'src/common/helpers/assert-self-or-admin.helper';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async findMe(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async adminSearchUsers(q: string): Promise<User[]> {
    if (!q || q.trim().length < 2) return [];
    return this.userRepository.adminSearchUsers(q.trim());
  }

  async findUserById(id: string, requester: JwtUser): Promise<User> {
    const target = await this.userRepository.findById(id);

    if (!target) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    assertSelfOrStaff(requester.userId, target.id, requester.role);

    return target;
  }

  async update(userData: UpdateUserDto, userId: string): Promise<User> {
    const target = await this.userRepository.findById(userId);
    if (!target) throw new NotFoundException('User not found');
    Object.assign(target, userData);
    return this.userRepository.update(target);
  }

  async deleteMe(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    await this.userRepository.softDelete(userId);
  }
}
