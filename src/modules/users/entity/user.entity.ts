import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Identity

  @Column({ unique: true, length: 50 })
  username!: string;

  @Column({ unique: true })
  email!: string;

  // Profile

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

  // Timestamps

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
