import { Module } from '@nestjs/common';
import { BadgesService } from './badges.service';
import { BadgesController } from './badges.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Badge } from './entity/badge.entity';
import { BadgesRepository } from './badge.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Badge])],
  providers: [BadgesService, BadgesRepository],
  controllers: [BadgesController],
  exports: [BadgesService],
})
export class BadgesModule {}
