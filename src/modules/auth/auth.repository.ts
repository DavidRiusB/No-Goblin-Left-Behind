import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Credential } from './entity/auth.entity';
import { EntityManager, Repository } from 'typeorm';
import { User } from '../users/entity/user.entity';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectRepository(Credential)
    private readonly credentialRepository: Repository<Credential>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Credential> {
    return manager
      ? manager.getRepository(Credential)
      : this.credentialRepository;
  }

  async findByEmail(email: string): Promise<Credential | null> {
    return this.credentialRepository.findOne({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
      },
      relations: {
        user: true,
      },
    });
  }

  async create(
    data: { user: User; email: string; passwordHash: string },

    manager?: EntityManager,
  ): Promise<Credential> {
    try {
      const repo = this.getRepo(manager);
      const newCredential = repo.create(data);
      return await repo.save(newCredential);
    } catch (error: any) {
      if (error.code === '23505') {
        throw new BadRequestException(
          'Unable to create account with the provided information',
        );
      }
      throw new InternalServerErrorException('Error creating Credentials');
    }
  }

  async updatePassword(
    user: User,
    passwordHash: string,
    manager?: EntityManager,
  ): Promise<Credential> {
    const repo = this.getRepo(manager);
    const credential = await repo.findOne({
      where: { user: { id: user.id } },
    });

    if (!credential) {
      throw new InternalServerErrorException('Credential not found');
    } // do we need this shit ?? for real ? there shuld not be posible to create a user with out credentials

    credential.passwordHash = passwordHash;

    try {
      return await repo.save(credential);
    } catch {
      throw new InternalServerErrorException('Error updating password');
    }
  }
}
