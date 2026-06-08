import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';

import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { JwtUser } from 'src/common/types/jwt-user.type';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth-guard';
import { CreateReviewDto } from './dtos/create-review.dto';

@Controller('tables/:id/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Param('id', ParseUUIDPipe) tableId: string,
    @Body() dto: CreateReviewDto,
    @CurrentUser() reviewer: JwtUser,
  ) {
    return this.reviewsService.create(tableId, dto, reviewer);
  }
}
