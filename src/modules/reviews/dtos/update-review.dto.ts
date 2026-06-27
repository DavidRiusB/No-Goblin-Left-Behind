import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateReviewDto {
  @IsOptional()
  @IsArray({ message: 'Shared badges must be an array' })
  sharedBadges?: string[];

  @IsOptional()
  @IsArray({ message: 'DM badges must be an array' })
  dmBadges?: string[];

  @IsOptional()
  @IsArray({ message: 'Player badges must be an array' })
  playerBadges?: string[];

  @IsOptional()
  @IsString({ message: 'Written review must be a string' })
  @MaxLength(2000, { message: 'Written review cannot exceed 2000 characters' })
  writtenReview?: string;
}
