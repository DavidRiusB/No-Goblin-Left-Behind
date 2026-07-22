import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { TokenType } from 'src/common/enums/token-type.enum';
import { User } from 'src/modules/users/entity/user.entity';

@Entity('Token')
export class Token {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  userId!: string;

  @Index()
  @Column()
  tokenHash!: string; // sha256 of the raw token — raw never stored

  @Column({ type: 'enum', enum: TokenType })
  type!: TokenType;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  usedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}
