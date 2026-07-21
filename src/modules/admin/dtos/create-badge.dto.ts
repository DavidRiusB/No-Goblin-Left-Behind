import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { BadgeCategory } from 'src/common/enums/badge-category.enum';
import { ReviewType } from 'src/common/enums/review-type.enum';

export class CreateBadgeDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z][A-Z0-9_]*$/, {
    message: 'code must be UPPER_SNAKE_CASE (e.g. TEAM_PLAYER)',
  })
  @MaxLength(50)
  code!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  label!: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  description?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(16) // an emoji or two, not a paragraph
  icon!: string;

  @IsEnum(BadgeCategory)
  category!: BadgeCategory;

  @IsOptional()
  @IsEnum(ReviewType)
  appliesTo?: ReviewType;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  tier?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(9999)
  sortOrder?: number;
}
