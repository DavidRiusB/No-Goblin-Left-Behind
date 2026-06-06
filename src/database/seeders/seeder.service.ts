import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Credential } from 'src/modules/auth/entity/auth.entity';
import { Role } from 'src/common/enums/roles.enum';

import { User } from 'src/modules/users/entity/user.entity';
import { hashPassword } from 'src/utils/hashing/bycryp.utils';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Credential)
    private readonly credentialRepository: Repository<Credential>,
  ) {}

  async seed() {
    await this.seedUser({
      username: 'basicuser',
      email: 'user@test.com',
      password: 'Test1234!',
      role: Role.User,
    });

    await this.seedUser({
      username: 'adminuser',
      email: 'admin@test.com',
      password: 'Admin1234!',
      role: Role.Admin,
    });

    this.logger.log('Seeding complete');
  }

  private async seedUser(data: {
    username: string;
    email: string;
    password: string;
    role: Role;
  }) {
    const exists = await this.credentialRepository.findOne({
      where: { email: data.email },
    });

    if (exists) {
      this.logger.log(`User ${data.email} already exists, skipping`);
      return;
    }

    await this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const credentialRepo = manager.getRepository(Credential);

      const user = userRepo.create({
        username: data.username,
        notificationEmail: data.email,
        role: data.role,
      });
      await userRepo.save(user);

      const passwordHash = await hashPassword(data.password);
      const credential = credentialRepo.create({
        email: data.email,
        passwordHash,
        user,
      });
      await credentialRepo.save(credential);

      this.logger.log(`Created user: ${data.email} with role: ${data.role}`);
    });
  }
}
