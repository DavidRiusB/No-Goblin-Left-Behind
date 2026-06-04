import { User } from 'src/modules/users/entity/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity({ name: 'credentials' })
export class Credential {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({
    unique: true,
    length: 255,
  })
  email!: string;

  @Column({
    length: 60,
    select: false,
  })
  passwordHash!: string;

  @OneToOne(() => User, (user) => user.credential)
  @JoinColumn()
  user!: User;

  @DeleteDateColumn()
  deletedAt?: Date;
}
