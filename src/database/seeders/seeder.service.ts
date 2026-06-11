import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from 'src/modules/users/entity/user.entity';
import { Credential } from 'src/modules/auth/entity/auth.entity';
import { Table } from 'src/modules/tables/entities/table.entity';
import { TableMembership } from 'src/modules/tables/entities/table-membership.entity';
import { JoinRequest } from 'src/modules/tables/entities/join-request.entity';
import { Role } from 'src/common/enums/roles.enum';
import { TableType } from 'src/common/enums/table-type.enum';
import { TableStatus } from 'src/common/enums/table-status.enum';
import { AgeRequirement } from 'src/common/enums/age-requirement.enum';
import { Recurrence } from 'src/common/enums/recurrence.enum';

import { JoinRequestStatus } from 'src/common/enums/join-request-status-enum';
import { hashPassword } from 'src/utils/hashing/bycryp.utils';
import { MembershipStatus } from 'src/common/enums/membership-status,enum';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Credential)
    private readonly credentialRepository: Repository<Credential>,
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
  ) {}

  async seed() {
    const basicUser = await this.seedUser({
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

    const dmUser = await this.seedUser({
      username: 'dungeon_dave',
      email: 'dm@test.com',
      password: 'Test1234!',
      role: Role.User,
    });

    const player1 = await this.seedUser({
      username: 'rogue_rita',
      email: 'rita@test.com',
      password: 'Test1234!',
      role: Role.User,
    });

    const player2 = await this.seedUser({
      username: 'bard_bob',
      email: 'bob@test.com',
      password: 'Test1234!',
      role: Role.User,
    });

    if (dmUser && player1 && player2 && basicUser) {
      await this.seedTable(dmUser, [player1, player2], basicUser);
    }

    this.logger.log('Seeding complete');
  }

  private async seedUser(data: {
    username: string;
    email: string;
    password: string;
    role: Role;
  }): Promise<User | null> {
    const exists = await this.credentialRepository.findOne({
      where: { email: data.email },
      relations: { user: true },
    });

    if (exists) {
      this.logger.log(`User ${data.email} already exists, skipping`);
      return exists.user;
    }

    return this.dataSource.transaction(async (manager) => {
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
      return user;
    });
  }

  private async seedTable(
    dm: User,
    members: User[],
    pendingRequester: User,
  ): Promise<void> {
    const exists = await this.tableRepository.findOne({
      where: { title: 'The Sunken Crypt of Yth' },
    });

    if (exists) {
      this.logger.log('Seed table already exists, skipping');
      return;
    }

    await this.dataSource.transaction(async (manager) => {
      const tableRepo = manager.getRepository(Table);
      const membershipRepo = manager.getRepository(TableMembership);
      const requestRepo = manager.getRepository(JoinRequest);

      const table = tableRepo.create({
        dm,
        title: 'The Sunken Crypt of Yth',
        system: 'D&D 5e',
        description:
          'A weekly dungeon crawl campaign. Beginners welcome, voice required.',
        tableType: TableType.CAMPAIGN,
        recurrence: Recurrence.WEEKLY,
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // next week
        timezone: 'America/Bogota',
        estimatedDurationHours: 4,
        isOnline: true,
        platform: 'Discord + Foundry',
        seatsTotal: 5,
        language: 'Spanish',
        autoAccept: false,
        ageRequirement: AgeRequirement.ALL_AGES,
        status: TableStatus.OPEN,
      });
      await tableRepo.save(table);

      // active members
      for (const member of members) {
        const membership = membershipRepo.create({
          user: member,
          table,
          status: MembershipStatus.ACTIVE,
        });
        await membershipRepo.save(membership);
      }

      // pending join request from basicuser
      const request = requestRepo.create({
        user: pendingRequester,
        table,
        status: JoinRequestStatus.PENDING,
        message: 'Hi! New to 5e but very motivated, would love to join!',
      });
      await requestRepo.save(request);

      this.logger.log(
        `Created table "${table.title}" with ${members.length} members and 1 pending request`,
      );
    });
  }
}
