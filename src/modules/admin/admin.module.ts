import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UsersModule } from '../users/users.module';
import { TablesModule } from '../tables/tables.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [UsersModule, TablesModule, ReviewsModule, ChatModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
