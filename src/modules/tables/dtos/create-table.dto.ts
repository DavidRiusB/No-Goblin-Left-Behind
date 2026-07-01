import {
  IsString,
  IsOptional,
  IsEnum,
  IsDate,
  IsInt,
  IsBoolean,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TableType } from 'src/common/enums/table-type.enum';
import { Recurrence } from 'src/common/enums/recurrence.enum';
import { AgeRequirement } from 'src/common/enums/age-requirement.enum';
import { ExperienceLevel } from 'src/common/enums/experience-level.enum';

export class CreateTableDto {
  @IsString({ message: 'Title must be a string' })
  @MaxLength(100, { message: 'Title cannot exceed 100 characters' })
  title!: string;

  @IsString({ message: 'System must be a string' })
  @MaxLength(100, { message: 'System cannot exceed 100 characters' })
  system!: string;

  // summary — required, the public pitch (matches entity: required, 280)
  @IsString({ message: 'Summary must be a string' })
  @MaxLength(280, { message: 'Summary cannot exceed 280 characters' })
  summary!: string;

  // details — optional public narrative
  @IsOptional()
  @IsString({ message: 'Details must be a string' })
  details?: string;

  // houseRules — optional, public (table meta)
  @IsOptional()
  @IsString({ message: 'House rules must be a string' })
  houseRules?: string;

  // links — optional, member-only
  @IsOptional()
  @IsString({ message: 'Links must be a string' })
  links?: string;

  @IsEnum(TableType, { message: 'Invalid table type' })
  tableType!: TableType;

  @IsEnum(ExperienceLevel, { message: 'Invalid experience level' })
  experienceLevel!: ExperienceLevel;

  @IsEnum(Recurrence, { message: 'Invalid recurrence' })
  recurrence!: Recurrence;

  @Type(() => Date)
  @IsDate({ message: 'Scheduled date must be a valid date' })
  scheduledAt!: Date;

  @IsString({ message: 'Timezone must be a string' })
  @MaxLength(100, { message: 'Timezone cannot exceed 100 characters' })
  timezone!: string;

  @IsOptional()
  @IsInt({ message: 'Estimated duration must be a number' })
  @Min(1, { message: 'Estimated duration must be at least 1 hour' })
  estimatedDurationHours?: number;

  @IsBoolean({ message: 'isOnline must be a boolean' })
  isOnline!: boolean;

  @IsString({ message: 'Platform must be a string' })
  @MaxLength(100, { message: 'Platform cannot exceed 100 characters' })
  platform?: string;

  @IsOptional()
  @IsString({ message: 'Location must be a string' })
  @MaxLength(150, { message: 'Location cannot exceed 150 characters' })
  location?: string;

  @IsInt({ message: 'Seats total must be a number' })
  @Min(1, { message: 'Must have at least 1 seat' })
  seatsTotal!: number;

  @IsString({ message: 'Language must be a string' })
  language!: string;

  @IsOptional()
  @IsBoolean({ message: 'autoAccept must be a boolean' })
  autoAccept?: boolean;

  @IsEnum(AgeRequirement, { message: 'Invalid age requirement' })
  ageRequirement!: AgeRequirement;
}
