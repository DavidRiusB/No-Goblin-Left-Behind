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
import { WrittenReviewResponse } from './dtos/written-review-response.dto';

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

  @Get('written-by-me')
  @UseGuards(JwtAuthGuard)
  async getWrittenByMe(@CurrentUser() user: JwtUser) {
    const data = await this.reviewsService.getWrittenByUser(user.userId);
    return plainToInstance(WrittenReviewResponse, data, {
      excludeExtraneousValues: true,
    });
  }

  @Post('tables/:tableId')
  @UseGuards(JwtAuthGuard)
  async create(
    @Param('tableId', ParseUUIDPipe) tableId: string,
    @Body() dto: CreateReviewDto,
    @CurrentUser() reviewer: JwtUser,
  ) {
    await this.reviewsService.create(tableId, dto, reviewer);
    return { success: true };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReviewDto,
    @CurrentUser() requester: JwtUser,
  ) {
    await this.reviewsService.update(id, dto, requester);
    return { success: true };
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
