// review.entity.ts — the changed bits
import { ReviewType } from 'src/common/enums/review-type.enum';
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
    enum: ReviewType,
  })
  type!: ReviewType;

  @Column({
    type: 'text',
    array: true,
    default: [],
  })
  badges!: string[];

  @Column({ type: 'text', nullable: true })
  writtenReview?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
