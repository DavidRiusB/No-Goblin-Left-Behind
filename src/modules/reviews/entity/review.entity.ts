import { ReviewBadge } from 'src/common/enums/review-badge';
import { Table } from 'src/modules/tables/entities/table.entity';
import { User } from 'src/modules/users/entity/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User)
  reviewer!: User;

  @ManyToOne(() => User)
  targetUser!: User;

  @ManyToOne(() => Table)
  table!: Table;

  @Column({
    type: 'enum',
    enum: ReviewBadge,
    array: true,
    default: [],
  })
  badges!: ReviewBadge[];

  @Column({
    type: 'text',
    nullable: true,
  })
  writtenReview?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
