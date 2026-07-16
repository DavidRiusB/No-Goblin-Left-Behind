import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { EntityManager, Repository } from 'typeorm';
import { RegisterUserDto } from '../auth/dtos/refister.dto';
import { promises } from 'dns';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<User> {
    return manager ? manager.getRepository(User) : this.userRepository;
  }

  async create(
    newUserData: RegisterUserDto,
    manager?: EntityManager,
  ): Promise<User> {
    try {
      const repo = this.getRepo(manager);
      const { username, email } = newUserData;
      const newUser = repo.create({
        username,
        notificationEmail: email,
      });
      return await repo.save(newUser);
    } catch (error: any) {
      if (error.code === '23505') {
        if (error.detail?.includes('username')) {
          throw new BadRequestException('Username already exists');
        }

        if (error.detail?.includes('notification_email')) {
          throw new BadRequestException('Email already exists');
        }

        throw new BadRequestException('User already exists');
      }
      throw new InternalServerErrorException('Error creating user');
    }
  }

  async adminSearchUsers(q: string, manager?: EntityManager): Promise<User[]> {
    const repo = this.getRepo(manager);
    return repo
      .createQueryBuilder('user')
      .where('user.username ILIKE :q', { q: `%${q}%` })
      .orWhere('user.notificationEmail ILIKE :q', { q: `%${q}%` })
      .orWhere('user.displayName ILIKE :q', { q: `%${q}%` })
      .orderBy('user.username', 'ASC')
      .limit(20)
      .getMany();
  }

  async findById(id: string, manager?: EntityManager): Promise<User | null> {
    const repo = manager ? manager.getRepository(User) : this.userRepository;
    return repo.findOne({ where: { id } });
  }

  async update(user: User, manager?: EntityManager): Promise<User> {
    const repo = this.getRepo(manager);
    try {
      return await repo.save(user);
    } catch (error: any) {
      if (error.code === '23505') {
        throw new BadRequestException('User with provided data already exists');
      }
      throw new InternalServerErrorException(
        'Unexpected error while updating user',
      );
    }
  }

  async softDelete(id: string, manager?: EntityManager): Promise<void> {
    const repo = this.getRepo(manager);
    await repo.softDelete(id);
  }
}
