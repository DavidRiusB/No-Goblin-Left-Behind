import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { SharedBadge } from 'src/common/enums/review-badge-shared.enum';
import { DmBadge } from 'src/common/enums/review-badge-dm.enum';
import { PlayerBadge } from 'src/common/enums/review-badge-player.enum';

export class CreateReviewDto {
  @IsUUID('4', { message: 'Target user id must be a valid UUID' })
  targetUserId!: string;

  @IsOptional()
  @IsArray({ message: 'Shared badges must be an array' })
  @IsEnum(SharedBadge, { each: true, message: 'Invalid shared badge' })
  sharedBadges?: SharedBadge[];

  @IsOptional()
  @IsArray({ message: 'DM badges must be an array' })
  @IsEnum(DmBadge, { each: true, message: 'Invalid DM badge' })
  dmBadges?: DmBadge[];

  @IsOptional()
  @IsArray({ message: 'Player badges must be an array' })
  @IsEnum(PlayerBadge, { each: true, message: 'Invalid player badge' })
  playerBadges?: PlayerBadge[];

  @IsOptional()
  @IsString({ message: 'Written review must be a string' })
  @MaxLength(2000, { message: 'Written review cannot exceed 2000 characters' })
  writtenReview?: string;
}
