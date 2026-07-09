import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateReviewDto {
  @IsOptional()
  @IsArray({ message: 'Badges must be an array' })
  @IsString({ each: true, message: 'Each badge must be a string' })
  badges?: string[];

  @IsOptional()
  @IsString({ message: 'Written review must be a string' })
  @MaxLength(2000, { message: 'Written review cannot exceed 2000 characters' })
  writtenReview?: string;
}
