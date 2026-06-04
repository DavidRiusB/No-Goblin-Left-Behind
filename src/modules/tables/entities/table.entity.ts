import { AgeRequirement } from 'src/common/enums/age-requirement.enum';
import { TableStatus } from 'src/common/enums/table-status.enum';
import { TableType } from 'src/common/enums/table-type.enum';
import { User } from 'src/modules/users/entity/user.entity';
import { JoinRequest } from './join-request.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { TableMembership } from './table-membership.entity';

@Entity({ name: 'tables' })
export class Table {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // =========================
  // Relations
  // =========================

  @ManyToOne(() => User, {
    nullable: false,
  })
  @JoinColumn({ name: 'dm_id' })
  dm!: User;

  @OneToMany(() => JoinRequest, (request) => request.table)
  joinRequests!: JoinRequest[];

  @OneToMany(() => TableMembership, (membership) => membership.table)
  memberships!: TableMembership[];

  // =========================
  // Game Info
  // =========================

  @Column({
    length: 100,
  })
  title!: string;

  /**
   * System agnostic.
   * Examples:
   * D&D 5e
   * Pathfinder 2e
   * Call of Cthulhu
   * Shadowdark
   */
  @Column({
    length: 100,
  })
  system!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description?: string;

  @Column({
    type: 'enum',
    enum: TableType,
    default: TableType.ONE_SHOT,
  })
  tableType!: TableType;

  // =========================
  // Scheduling
  // =========================

  @Column({
    type: 'timestamp',
  })
  scheduledAt!: Date;

  @Column({
    length: 100,
  })
  timezone!: string;

  @Column({
    nullable: true,
  })
  estimatedDurationHours?: number;

  // =========================
  // Logistics
  // =========================

  @Column({
    default: true,
  })
  isOnline!: boolean;

  /**
   * Discord, Roll20, Foundry,
   * Local Game Store, etc.
   */
  @Column({
    length: 100,
  })
  platform!: string;

  /**
   * Optional physical location.
   * Useful for in-person games.
   */
  @Column({
    nullable: true,
    length: 150,
  })
  location?: string;

  @Column()
  seatsTotal!: number;

  // =========================
  // Settings
  // =========================

  @Column({
    default: false,
  })
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

  // =========================
  // Future Relations
  // =========================

  // @OneToMany(() => Review, (review) => review.table)
  // reviews!: Review[];
}
