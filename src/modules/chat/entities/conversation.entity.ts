import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { User } from 'src/modules/users/entity/user.entity';
import { ConversationStatus } from 'src/common/enums/conversation-status.enum';

@Entity('conversations')
@Unique(['participantA', 'participantB'])
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'participant_a_id' })
  participantA!: User;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'participant_b_id' })
  participantB!: User;

  @Column({
    type: 'enum',
    enum: ConversationStatus,
    default: ConversationStatus.ACTIVE,
  })
  status!: ConversationStatus;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'blocked_by_id' })
  blockedBy?: User;

  @CreateDateColumn()
  createdAt!: Date;
}
