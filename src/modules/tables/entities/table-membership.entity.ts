import { User } from 'src/modules/users/entity/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Table } from './table.entity';
import { MembershipStatus } from 'src/common/enums/membership-status.enum';

@Entity('table_memberships')
export class TableMembership {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, {
    nullable: false,
  })
  user!: User;

  @ManyToOne(() => Table, {
    nullable: false,
  })
  @JoinColumn({ name: 'table_id' })
  table!: Table;

  @Column({
    type: 'enum',
    enum: MembershipStatus,
    default: MembershipStatus.ACTIVE,
  })
  status!: MembershipStatus;

  @CreateDateColumn()
  joinedAt!: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  endedAt?: Date | null;
}
