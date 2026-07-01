import { User } from 'src/modules/users/entity/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { JoinRequest } from './join-request.entity';
import { TableMembership } from './table-membership.entity';
import { TableType } from 'src/common/enums/table-type.enum';
import { ExperienceLevel } from 'src/common/enums/experience-level.enum';
import { Recurrence } from 'src/common/enums/recurrence.enum';
import { AgeRequirement } from 'src/common/enums/age-requirement.enum';
import { TableStatus } from 'src/common/enums/table-status.enum';

@Entity({ name: 'tables' })
export class Table {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // =========================
  // Relations
  // =========================

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'dm_id' })
  dm!: User;

  @OneToMany(() => JoinRequest, (request) => request.table)
  joinRequests!: JoinRequest[];

  @OneToMany(() => TableMembership, (membership) => membership.table)
  memberships!: TableMembership[];

  // =========================
  // Game Info
  // =========================

  @Column({ length: 100 })
  title!: string;

  /**
   * System agnostic.
   * Examples: D&D 5e, Pathfinder 2e, Call of Cthulhu, Shadowdark
   */
  @Column({ length: 100 })
  system!: string;

  /**
   * Short pitch shown on the board / public cards. Public.
   */
  @Column({ length: 280 })
  summary!: string;

  /**
   * Longer narrative blurb — setting, synopsis, tone, expanded pitch. Public.
   */
  @Column({ type: 'text', nullable: true })
  details?: string;

  /**
   * Mechanical house rules. MEMBER-ONLY — surfaced only via the gated
   * member-view endpoint, never on the public table detail.
   */
  @Column({ type: 'text', nullable: true })
  houseRules?: string;

  @Column({
    type: 'enum',
    enum: TableType,
    default: TableType.ONE_SHOT,
  })
  tableType!: TableType;

  @Column({
    type: 'enum',
    enum: ExperienceLevel,
    default: ExperienceLevel.ALL,
  })
  experienceLevel!: ExperienceLevel;

  // =========================
  // Scheduling
  // =========================

  @Column({ type: 'timestamp' })
  scheduledAt!: Date;

  @Column({ length: 100 })
  timezone!: string;

  @Column({ nullable: true })
  estimatedDurationHours?: number;

  @Column({
    type: 'enum',
    enum: Recurrence,
    default: Recurrence.NONE,
  })
  recurrence!: Recurrence;

  // =========================
  // Logistics
  // =========================

  @Column({ default: true })
  isOnline!: boolean;

  /**
   * Discord, Roll20, Foundry, Local Game Store, etc.
   */
  @Column({ length: 100, nullable: true })
  platform?: string;

  /**
   * Session links — Discord invite, VTT room, notes, etc. MEMBER-ONLY.
   * Plain text for now; jsonb ({ label, url }[]) is the upgrade path
   * if you want typed/labeled links later.
   */
  @Column({ type: 'text', nullable: true })
  links?: string;

  /**
   * Optional physical location. Useful for in-person games.
   */
  @Column({ nullable: true, length: 150 })
  location?: string;

  @Column()
  seatsTotal!: number;

  @Column()
  language!: string;

  // =========================
  // Settings
  // =========================

  @Column({ default: false })
  autoAccept!: boolean;

  @Column({
    type: 'enum',
    enum: AgeRequirement,
    default: AgeRequirement.ALL_AGES,
  })
  ageRequirement!: AgeRequirement;

  @Column({
    type: 'enum',
    enum: TableStatus,
    default: TableStatus.OPEN,
  })
  status!: TableStatus;

  // =========================
  // Timestamps
  // =========================

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
