// src/modules/reports/entities/report.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ReportTargetType } from 'src/common/enums/report-target-type.enum';
import { ReportReason } from 'src/common/enums/report-reason.enum';
import { ReportStatus } from 'src/common/enums/report-status.enum';
import { User } from 'src/modules/users/entity/user.entity';

@Entity('reports')
@Index(['status']) // the admin queue filters on this constantly
@Index(['targetType', 'targetId']) // "all reports about X"
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'reporter_id' })
  reporter!: User;

  @Column({ type: 'enum', enum: ReportTargetType })
  targetType!: ReportTargetType;

  @Column({ type: 'uuid' })
  targetId!: string;

  @Column({ type: 'enum', enum: ReportReason })
  reason!: ReportReason;

  @Column({ type: 'varchar', length: 500, nullable: true })
  details!: string | null;

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.OPEN })
  status!: ReportStatus;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'resolved_by_id' })
  resolvedBy!: User | null;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt!: Date | null;
}
