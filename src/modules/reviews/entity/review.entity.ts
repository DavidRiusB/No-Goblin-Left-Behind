import { ReviewBadge } from 'src/common/enums/review-badge';
import { DmBadge } from 'src/common/enums/review-badge-dm.enum';
import { PlayerBadge } from 'src/common/enums/review-badge-player.enum';
import { SharedBadge } from 'src/common/enums/review-badge-shared.enum';
import { Table } from 'src/modules/tables/entities/table.entity';
import { User } from 'src/modules/users/entity/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('reviews')
@Unique(['reviewer', 'targetUser', 'table'])
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewer_id' })
  reviewer!: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'target_user_id' })
  targetUser!: User;

  @ManyToOne(() => Table)
  @JoinColumn({ name: 'table_id' })
  table!: Table;

  @Column({
    type: 'enum',
    enum: SharedBadge,
    array: true,
    default: [],
  })
  sharedBadges!: SharedBadge[];

  @Column({
    type: 'enum',
    enum: DmBadge,
    array: true,
    default: [],
  })
  dmBadges!: DmBadge[];

  @Column({
    type: 'enum',
    enum: PlayerBadge,
    array: true,
    default: [],
  })
  playerBadges!: PlayerBadge[];

  @Column({
    type: 'text',
    nullable: true,
  })
  writtenReview?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
