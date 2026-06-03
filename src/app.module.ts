import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TablesModule } from './tables/tables.module';
import { ReviewsModule } from './reviews/reviews.module';
import { NotificationsModule } from './notifications/notifications.module';
import { GatewayGateway } from './gateway/gateway.gateway';

@Module({
  imports: [AuthModule, UsersModule, TablesModule, ReviewsModule, NotificationsModule],
  controllers: [AppController],
  providers: [AppService, GatewayGateway],
})
export class AppModule {}
