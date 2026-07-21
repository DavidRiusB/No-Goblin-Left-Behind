import { BadgeCategory } from 'src/common/enums/badge-category.enum';
import { ReviewType } from 'src/common/enums/review-type.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('Badge')
export class Badge {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  code!: string; // 'FRIENDLY' — what reviews store & reference

  @Column()
  label!: string; // 'Friendly' — display name on the chip

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column()
  icon!: string;

  @Column({ type: 'text', nullable: true })
  iconUrl!: string | null;

  @Column()
  category!: string; // grouping for the picker;

  @Column({
    type: 'enum',
    enum: ReviewType,
    nullable: true,
  })
  appliesTo?: ReviewType;

  @Column({ type: 'text', nullable: true })
  tier?: string; // monetization hook; null = free. model TBD.

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: 0 })
  sortOrder!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
