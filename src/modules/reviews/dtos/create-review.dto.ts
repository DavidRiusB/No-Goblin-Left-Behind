// dtos/create-review.dto.ts
import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateReviewDto {
  @IsUUID('4', { message: 'Target user id must be a valid UUID' })
  targetUserId!: string;

  @IsOptional()
  @IsArray({ message: 'Badges must be an array' })
  @IsString({ each: true, message: 'Each badge must be a string' })
  badges?: string[];

  @IsOptional()
  @IsString({ message: 'Written review must be a string' })
  @MaxLength(2000, { message: 'Written review cannot exceed 2000 characters' })
  writtenReview?: string;
}
