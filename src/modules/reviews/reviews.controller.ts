import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';

import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { JwtUser } from 'src/common/types/jwt-user.type';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth-guard';
import { CreateReviewDto } from './dtos/create-review.dto';
import { UpdateReviewDto } from './dtos/update-review.dto';

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('tables/:id/reviews')
  @UseGuards(JwtAuthGuard)
  async create(
    @Param('id', ParseUUIDPipe) tableId: string,
    @Body() dto: CreateReviewDto,
    @CurrentUser() reviewer: JwtUser,
  ) {
    return this.reviewsService.create(tableId, dto, reviewer);
  }

  @Get('users/:id/reviews')
  @UseGuards(JwtAuthGuard)
  async findReceivedByUser(
    @Param('id', ParseUUIDPipe) targetUserId: string,
    @CurrentUser() requester: JwtUser,
  ) {
    return this.reviewsService.findReceivedByUser(targetUserId, requester);
  }

  @Get('reviews/by-author/:id')
  @UseGuards(JwtAuthGuard)
  // @UseGuards(JwtAuthGuard, RolesGuard) + @Roles(Role.Admin) when ready
  async findPostedByUser(@Param('id', ParseUUIDPipe) authorId: string) {
    return this.reviewsService.findPostedByUser(authorId);
  }

  @Get('reviews/:id')
  @UseGuards(JwtAuthGuard)
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() requester: JwtUser,
  ) {
    return this.reviewsService.findById(id, requester);
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
