import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsService } from './reviews.service';

import { Table } from 'src/modules/tables/entities/table.entity';
import { TableMembership } from 'src/modules/tables/entities/table-membership.entity';
import { Review } from './entity/review.entity';

import { ReviewsController } from './reviews.controller';
import { ReviewRepository } from './review.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Table, TableMembership])],
  providers: [ReviewsService, ReviewRepository],
  controllers: [ReviewsController],
})
export class ReviewsModule {}
