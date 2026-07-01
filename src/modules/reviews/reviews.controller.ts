import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dtos/create-review.dto';
import { UpdateReviewDto } from './dtos/update-review.dto';

import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { JwtUser } from 'src/common/types/jwt-user.type';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth-guard';
import { plainToInstance } from 'class-transformer';
import { ReviewResponse } from '../users/dtos/user-profile-response.dto';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyReviews(@CurrentUser() user: JwtUser) {
    const reviews = await this.reviewsService.getReceivedByUser(user.userId);
    return plainToInstance(ReviewResponse, reviews, {
      excludeExtraneousValues: true,
    });
  }

  @Post('tables/:id/reviews')
  @UseGuards(JwtAuthGuard)
  async create(
    @Param('id', ParseUUIDPipe) tableId: string,
    @Body() dto: CreateReviewDto,
    @CurrentUser() reviewer: JwtUser,
  ) {
    return this.reviewsService.create(tableId, dto, reviewer);
  }

  @Patch('reviews/:id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReviewDto,
    @CurrentUser() requester: JwtUser,
  ) {
    return this.reviewsService.update(id, dto, requester);
  }

  @Delete('reviews/:id')
  @UseGuards(JwtAuthGuard)
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() requester: JwtUser,
  ) {
    return this.reviewsService.delete(id, requester);
  }
}
