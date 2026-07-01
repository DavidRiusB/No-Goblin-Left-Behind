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
import { BadgesService } from '../badges/badges.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, Table, TableMembership]), // entities only
    BadgesModule, // ← module goes in imports, at the module level
  ],
  providers: [ReviewsService, ReviewRepository, TableRepository], // drop BadgesService
  controllers: [ReviewsController],
})
export class ReviewsModule {}
