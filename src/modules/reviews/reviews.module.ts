import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsService } from './reviews.service';

import { Table } from 'src/modules/tables/entities/table.entity';
import { TableMembership } from 'src/modules/tables/entities/table-membership.entity';
import { Review } from './entity/review.entity';

import { ReviewsController } from './reviews.controller';
import { ReviewRepository } from './review.repository';
import { TableRepository } from '../tables/table.repository';
import { BadgesModule } from '../badges/badges.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, Table, TableMembership]),
    BadgesModule,
  ],
  providers: [ReviewsService, ReviewRepository, TableRepository],
  controllers: [ReviewsController],
  exports: [ReviewsService],
})
export class ReviewsModule {}
