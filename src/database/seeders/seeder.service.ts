import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from 'src/modules/users/entity/user.entity';
import { Credential } from 'src/modules/auth/entity/auth.entity';
import { Table } from 'src/modules/tables/entities/table.entity';
import { TableMembership } from 'src/modules/tables/entities/table-membership.entity';
import { Review } from 'src/modules/reviews/entity/review.entity';
import { Role } from 'src/common/enums/roles.enum';
import { TableType } from 'src/common/enums/table-type.enum';
import { TableStatus } from 'src/common/enums/table-status.enum';
import { AgeRequirement } from 'src/common/enums/age-requirement.enum';
import { Recurrence } from 'src/common/enums/recurrence.enum';
import { MembershipStatus } from 'src/common/enums/membership-status.enum';
import { SharedBadge } from 'src/common/enums/review-badge-shared.enum';
import { PlayerBadge } from 'src/common/enums/review-badge-player.enum';
import { hashPassword } from 'src/utils/hashing/bycryp.utils';
import { ReviewType } from 'src/common/enums/review-type.enum';

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
    // 1. users
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
    const dm = await this.seedUser({
      username: 'dungeon_dave',
      email: 'dm@test.com',
      password: 'Test1234!',
      role: Role.User,
    });
    const rita = await this.seedUser({
      username: 'rogue_rita',
      email: 'rita@test.com',
      password: 'Test1234!',
      role: Role.User,
    });
    const bob = await this.seedUser({
      username: 'bard_bob',
      email: 'bob@test.com',
      password: 'Test1234!',
      role: Role.User,
    });

    if (!dm || !rita || !bob || !basicUser) {
      this.logger.error('User seeding failed, aborting');
      return;
    }

    // 2. tables (returns the ones created/found so we can reference them)
    const tables = await this.seedTables(dm);

    // 3. memberships + reviews — separate, idempotent, not gated by table creation
    const sunkenCrypt = tables.find(
      (t) => t.title === 'The Sunken Crypt of Yth',
    );
    if (sunkenCrypt) {
      await this.seedMembership(rita, sunkenCrypt);
      await this.seedMembership(bob, sunkenCrypt);
      await this.seedReview(rita, bob, sunkenCrypt);
    }

    this.logger.log('Seeding complete');
  }

  private async seedUser(data: {
    username: string;
    email: string;
    password: string;
    role: Role;
  }): Promise<User | null> {
    const existing = await this.credentialRepository.findOne({
      where: { email: data.email },
      relations: { user: true },
    });
    if (existing) {
      this.logger.log(`User ${data.email} exists, skipping`);
      return existing.user;
    }

    return this.dataSource.transaction(async (manager) => {
      const user = await manager.getRepository(User).save(
        manager.getRepository(User).create({
          username: data.username,
          notificationEmail: data.email,
          role: data.role,
        }),
      );
      await manager.getRepository(Credential).save(
        manager.getRepository(Credential).create({
          email: data.email,
          passwordHash: await hashPassword(data.password),
          user,
        }),
      );
      this.logger.log(`Created user ${data.email} (${data.role})`);
      return user;
    });
  }

  // creates tables that don't exist, returns the full set (created + existing)
  private async seedTables(dm: User): Promise<Table[]> {
    const tablesData = [
      {
        title: 'The Sunken Crypt of Yth',
        system: 'D&D 5e',
        description:
          'A weekly dungeon crawl campaign. Beginners welcome, voice required.',
        tableType: TableType.CAMPAIGN,
        recurrence: Recurrence.WEEKLY,
        isOnline: true,
        platform: 'Discord + Foundry',
        seatsTotal: 5,
        language: 'Spanish',
        ageRequirement: AgeRequirement.ADULTS_ONLY,
      },
      {
        title: 'Curse of Strahd: Into Barovia',
        system: 'D&D 5e',
        description:
          'Gothic horror campaign, experienced players preferred. Mature themes.',
        tableType: TableType.CAMPAIGN,
        recurrence: Recurrence.BIWEEKLY,
        isOnline: true,
        platform: 'Roll20',
        seatsTotal: 6,
        language: 'English',
        ageRequirement: AgeRequirement.ALL_AGES,
      },
      {
        title: "Pathfinder One-Shot: The Dragon's Hoard",
        system: 'Pathfinder 2e',
        description:
          'Single session, drop-in friendly. Perfect for trying Pathfinder.',
        tableType: TableType.ONE_SHOT,
        recurrence: Recurrence.NONE,
        isOnline: true,
        platform: 'Foundry VTT',
        seatsTotal: 4,
        language: 'English',
        ageRequirement: AgeRequirement.ALL_AGES,
      },
      {
        title: 'Call of Cthulhu: The Haunting',
        system: 'Call of Cthulhu 7e',
        description:
          'Classic investigative horror scenario. In-person, downtown game store.',
        tableType: TableType.ONE_SHOT,
        recurrence: Recurrence.NONE,
        isOnline: false,
        platform: 'Local Game Store',
        location: 'Bogotá - Centro',
        seatsTotal: 5,
        language: 'Spanish',
        ageRequirement: AgeRequirement.ADULTS_ONLY,
      },
      {
        title: 'Mesa de Rol en Español: Aventuras Semanales',
        system: 'D&D 5e',
        description:
          'Campaña narrativa en español, todos los niveles bienvenidos.',
        tableType: TableType.CAMPAIGN,
        recurrence: Recurrence.WEEKLY,
        isOnline: true,
        platform: 'Discord',
        seatsTotal: 5,
        language: 'Spanish',
        ageRequirement: AgeRequirement.ALL_AGES,
      },
      {
        title: 'Shadowdark Monthly Delve',
        system: 'Shadowdark',
        description:
          'Old-school dungeon crawling, monthly sessions. Lethal and fun.',
        tableType: TableType.CAMPAIGN,
        recurrence: Recurrence.MONTHLY,
        isOnline: true,
        platform: 'Discord + Owlbear Rodeo',
        seatsTotal: 6,
        language: 'English',
        ageRequirement: AgeRequirement.ADULTS_ONLY,
      },
    ];

    const result: Table[] = [];
    for (const data of tablesData) {
      const existing = await this.tableRepository.findOne({
        where: { title: data.title },
      });
      if (existing) {
        this.logger.log(`Table "${data.title}" exists, skipping`);
        result.push(existing);
        continue;
      }
      const table = await this.tableRepository.save(
        this.tableRepository.create({
          ...data,
          dm,
          scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          timezone: 'America/Bogota',
          estimatedDurationHours: 4,
          autoAccept: false,
          status: TableStatus.OPEN,
        }),
      );
      this.logger.log(`Created table "${table.title}"`);
      result.push(table);
    }
    return result;
  }

  private async seedMembership(user: User, table: Table): Promise<void> {
    const repo = this.dataSource.getRepository(TableMembership);
    const existing = await repo.findOne({
      where: { user: { id: user.id }, table: { id: table.id } },
    });
    if (existing) {
      this.logger.log(
        `Membership ${user.username}@${table.title} exists, skipping`,
      );
      return;
    }
    await repo.save(
      repo.create({ user, table, status: MembershipStatus.ACTIVE }),
    );
    this.logger.log(`Created membership ${user.username}@${table.title}`);
  }

  private async seedReview(
    reviewer: User,
    target: User,
    table: Table,
  ): Promise<void> {
    const repo = this.dataSource.getRepository(Review);
    const existing = await repo.findOne({
      where: {
        reviewer: { id: reviewer.id },
        targetUser: { id: target.id },
        table: { id: table.id },
      },
    });
    if (existing) {
      this.logger.log('Seed review exists, skipping');
      return;
    }
    await repo.save(
      repo.create({
        type: ReviewType.PLAYER,
        reviewer,
        targetUser: target,
        table,
        badges: ['FRIENDLY', 'RELIABLE'],
        writtenReview:
          'Bob brought great energy and stayed in character all night.',
      }),
    );
    this.logger.log(
      `Created review ${reviewer.username} -> ${target.username}`,
    );
  }
}
