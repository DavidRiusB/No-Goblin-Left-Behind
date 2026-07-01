import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
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
import { hashPassword } from 'src/utils/hashing/bycryp.utils';
import { ReviewType } from 'src/common/enums/review-type.enum';
import { ExperienceLevel } from 'src/common/enums/experience-level.enum';
import { Badge } from 'src/modules/badges/entity/badge.entity';

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
        summary:
          'A weekly dungeon crawl campaign. Beginners welcome, voice required.',
        details:
          'Beneath the drowned city of Yth lies a labyrinth of flooded vaults and ' +
          'barnacle-crusted halls, where a long-dead sorcerer-king still guards his ' +
          'hoard. Expect tense exploration, environmental puzzles, and creeping dread ' +
          'as the water rises. This is a story-forward campaign with room for character ' +
          'arcs between delves — we play slow, we play scared, and we reward clever ' +
          'thinking over brute force.',
        houseRules:
          'Rolling stats (4d6 drop lowest), no evil alignments. Inspiration is handed ' +
          'out for good roleplay, not just clever tactics. Death saves are rolled in the ' +
          'open — no fudging at this table. Flanking is NOT used (RAW only).',
        links:
          'Discord: https://discord.gg/example-yth\n' +
          'Foundry: https://foundry.example.com/yth\n' +
          'Session notes: https://notes.example.com/yth',
        tableType: TableType.CAMPAIGN,
        recurrence: Recurrence.WEEKLY,
        experienceLevel: ExperienceLevel.BEGINNER_FRIENDLY,
        isOnline: true,
        platform: 'Discord + Foundry',
        seatsTotal: 5,
        language: 'Spanish',
        ageRequirement: AgeRequirement.ADULTS_ONLY,
      },
      {
        title: 'Curse of Strahd: Into Barovia 🦇',
        system: 'D&D 5e',
        summary:
          'Gothic horror campaign, experienced players preferred. Mature themes. 🩸',
        details:
          'The mists of Barovia have claimed you. 🌫️ Trapped in a land ruled by the ' +
          'vampire lord Strahd von Zarovich, your party must navigate a realm of dread, ' +
          'tragedy, and gothic romance. Heavy roleplay, meaningful moral choices, and ' +
          'a sandbox you can genuinely lose people in. Not for the faint of heart. ⚰️',
        houseRules:
          'Sanity-style stress mechanic in play (homebrew). 💀 No resurrection magic — ' +
          'death is permanent here. Tarokka reading at session zero sets your fate. ' +
          'PvP allowed but only with table consent.',
        links:
          'Discord: https://discord.gg/example-barovia\n' +
          'Roll20: https://roll20.net/example/barovia\n' +
          'Session 0 doc: https://docs.example.com/barovia-s0',
        tableType: TableType.CAMPAIGN,
        recurrence: Recurrence.BIWEEKLY,
        experienceLevel: ExperienceLevel.EXPERIENCED,
        isOnline: true,
        platform: 'Roll20',
        seatsTotal: 6,
        language: 'English',
        ageRequirement: AgeRequirement.ALL_AGES,
      },
      {
        title: "Pathfinder One-Shot: The Dragon's Hoard 🐉",
        system: 'Pathfinder 2e',
        summary:
          'Single session, drop-in friendly. Perfect for trying Pathfinder. ✨',
        details:
          "A self-contained heist into a young dragon's lair. 💰 Pregens provided, so " +
          'no prep needed — just bring curiosity and a sense of humor. Great for ' +
          'first-timers who want to see what Pathfinder 2e plays like without committing ' +
          'to a campaign. We explain rules as we go. 🎲',
        houseRules:
          'Pregenerated characters only (provided). Hero Points handed out generously ' +
          'for fun plays. 🦸 Rules questions get a quick ruling now, lookup later.',
        links:
          'Foundry: https://foundry.example.com/dragons-hoard\n' +
          'Pregens: https://pf2.example.com/pregens',
        tableType: TableType.ONE_SHOT,
        recurrence: Recurrence.NONE,
        experienceLevel: ExperienceLevel.BEGINNER_FRIENDLY,
        isOnline: true,
        platform: 'Foundry VTT',
        seatsTotal: 4,
        language: 'English',
        ageRequirement: AgeRequirement.ALL_AGES,
      },
      {
        title: 'Call of Cthulhu: The Haunting 🐙',
        system: 'Call of Cthulhu 7e',
        summary:
          'Classic investigative horror scenario. In-person, downtown game store. 🔦',
        details:
          'A haunted house. A missing tenant. A mystery that should have stayed buried. ' +
          '👁️ The Haunting is the quintessential CoC starter scenario — investigation, ' +
          'creeping unease, and the very real possibility that knowledge will cost you. ' +
          'Snacks provided, sanity not guaranteed. 🕯️',
        houseRules:
          'Pulp Cthulhu rules for slightly hardier investigators. 📜 Sanity loss is ' +
          'real and tracked. Players encouraged to lean into doomed-investigator vibes.',
        links:
          "Venue: The Dragon's Den Game Store, Cra 7 #45-12, Bogotá\n" +
          'Group chat: https://wa.me/example-cthulhu',
        tableType: TableType.ONE_SHOT,
        recurrence: Recurrence.NONE,
        experienceLevel: ExperienceLevel.ALL,
        isOnline: false,
        platform: 'Local Game Store',
        location: 'Bogotá - Centro',
        seatsTotal: 5,
        language: 'Spanish',
        ageRequirement: AgeRequirement.ADULTS_ONLY,
      },
      {
        title: 'Mesa de Rol en Español: Aventuras Semanales 🗡️',
        system: 'D&D 5e',
        summary:
          'Campaña narrativa en español, todos los niveles bienvenidos. 🎭',
        details:
          'Una campaña de fantasía clásica centrada en la historia y los personajes. ' +
          '🏰 Exploramos mazmorras, intriga política y vínculos entre personajes. ' +
          'Ambiente relajado y acogedor — perfecto para quienes quieren jugar en ' +
          'español sin presión. ¡Nuevos jugadores siempre bienvenidos! 🌟',
        houseRules:
          'Inspiración por buen roleo. 🎲 Sin alineamientos malignos. Las decisiones ' +
          'del grupo se toman en conjunto. Respeto y buena onda ante todo.',
        links:
          'Discord: https://discord.gg/example-espanol\n' +
          'Notas: https://notas.example.com/aventuras',
        tableType: TableType.CAMPAIGN,
        recurrence: Recurrence.WEEKLY,
        experienceLevel: ExperienceLevel.ALL,
        isOnline: true,
        platform: 'Discord',
        seatsTotal: 5,
        language: 'Spanish',
        ageRequirement: AgeRequirement.ALL_AGES,
      },
      {
        title: 'Shadowdark Monthly Delve ⚔️',
        system: 'Shadowdark',
        summary:
          'Old-school dungeon crawling, monthly sessions. Lethal and fun. 💀',
        details:
          'Torches burn in real time. ⏳ The dark is hungry. Shadowdark strips D&D back ' +
          'to its OSR roots — resource management, deadly traps, and characters who die ' +
          "fast and are replaced faster. Bring three character ideas, you'll need them. " +
          'High lethality, high fun, zero hand-holding. 🔥',
        houseRules:
          'Roll-up-and-go character creation at the table. 🎲 Death is common and ' +
          'expected — keep a backup ready. Real-time torch tracking is strictly enforced. ' +
          'Treasure = XP, so steal everything. 💎',
        links:
          'Discord: https://discord.gg/example-shadowdark\n' +
          'Owlbear Rodeo: https://owlbear.rodeo/example',
        tableType: TableType.CAMPAIGN,
        recurrence: Recurrence.MONTHLY,
        experienceLevel: ExperienceLevel.EXPERIENCED,
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

  private async seedBadges(): Promise<void> {
    const repo = this.dataSource.getRepository(Badge);

    const badges = [
      {
        code: 'FRIENDLY',
        label: 'Friendly',
        icon: '😊',
        category: 'vibe',
        description: '...',
      }, // no appliesTo = general
      {
        code: 'RELIABLE',
        label: 'Reliable',
        icon: '⏰',
        category: 'reliability',
        description: '...',
      },
      {
        code: 'TEAM_PLAYER',
        label: 'Team Player',
        icon: '🤝',
        category: 'teamwork',
        appliesTo: ReviewType.PLAYER,
        description: '...',
      },
      {
        code: 'WELL_PREPARED',
        label: 'Well Prepared',
        icon: '📚',
        category: 'dm-craft',
        appliesTo: ReviewType.DM,
        description: '...',
      },
    ];

    for (const b of badges) {
      const existing = await repo.findOne({ where: { code: b.code } });
      if (existing) continue; // idempotent — skip existing
      await repo.save(repo.create(b));
    }
    this.logger.log('Seeded badges');
  }

  private async seedReview(
    reviewer: User,
    target: User,
    table: Table,
  ): Promise<void> {
    const repo = this.dataSource.getRepository(Review);
    const badgeRepo = this.dataSource.getRepository(Badge);

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

    // resolve codes -> Badge entities (the catalog must be seeded first)
    const badges = await badgeRepo.find({
      where: { code: In(['FRIENDLY', 'RELIABLE']) },
    });

    await repo.save(
      repo.create({
        type: ReviewType.PLAYER,
        reviewer,
        targetUser: target,
        table,
        badges, // ← Badge[] entities, M2M writes join rows
        writtenReview:
          'Bob brought great energy and stayed in character all night.',
      }),
    );
    this.logger.log(
      `Created review ${reviewer.username} -> ${target.username}`,
    );
  }
}
