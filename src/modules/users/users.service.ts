import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRepository } from './user.repository';
import { User } from './entity/user.entity';
import { UpdateUserDto } from './dtos/user-update.dto';
import { Role } from 'src/common/enums/roles.enum';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async adminSearchUsers(q: string): Promise<User[]> {
    if (!q || q.trim().length < 2) return [];
    return this.userRepository.adminSearchUsers(q.trim());
  }

  async findUserById(id: string, userId: string): Promise<User> {
    const target = await this.userRepository.findById(id);

    if (!target) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    if (target.role !== Role.Admin && userId !== target.id) {
      throw new ForbiddenException('You can only access your own user');
    }

    return target;
  }

  async update(userData: UpdateUserDto, userId: string): Promise<User> {
    const target = await this.userRepository.findById(userId);
    if (!target) throw new NotFoundException('User not found');
    Object.assign(target, userData);
    return this.userRepository.update(target);
  }
}
