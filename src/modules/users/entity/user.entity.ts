import { Role } from 'src/common/enums/roles.enum';
import { Credential } from 'src/modules/auth/entity/auth.entity';
import { JoinRequest } from 'src/modules/tables/entities/join-request.entity';
import { TableMembership } from 'src/modules/tables/entities/table-membership.entity';

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Identity

  @Column({ unique: true, length: 50 })
  username!: string;

  @Column({ unique: true })
  notificationEmail!: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.User,
  })
  role!: Role;

  // Profile

  @Column({
    type: 'date',
    nullable: true,
  })
  birthDate?: Date;

  @Column({ nullable: true, length: 100 })
  displayName?: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ nullable: true, type: 'text' })
  bio?: string;

  @Column('text', {
    array: true,
    default: [],
  })
  preferredSystems!: string[];

  @Column('text', {
    array: true,
    default: [],
  })
  playStyleTags!: string[];

  @Column({
    nullable: true,
    length: 100,
  })
  timezone?: string;

  @Column({
    nullable: true,
    length: 100,
  })
  location?: string;

  // =========================
  // Relations
  // =========================

  @OneToOne(() => Credential, (credential) => credential.user, {
    cascade: true,
  })
  credential!: Credential;

  @OneToMany(() => JoinRequest, (request) => request.user)
  joinRequests!: JoinRequest[];

  @OneToMany(() => TableMembership, (membership) => membership.user)
  memberships!: TableMembership[];

  // Timestamps

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  bannedAt!: Date | null;
}
