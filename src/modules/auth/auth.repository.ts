import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Credential } from './entity/auth.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectRepository(Credential)
    private readonly credentialRepository: Repository<Credential>,
  ) {}

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
}
