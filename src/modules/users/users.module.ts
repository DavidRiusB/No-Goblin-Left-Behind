import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { UserRepository } from './user.repository';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), UploadsModule],
  providers: [UsersService, UserRepository],
  controllers: [UsersController],
  exports: [UserRepository, UsersService],
})
export class UsersModule {}
