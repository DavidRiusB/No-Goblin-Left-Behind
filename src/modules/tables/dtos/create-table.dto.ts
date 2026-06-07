import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { AgeRequirement } from 'src/common/enums/age-requirement.enum';
import { Recurrence } from 'src/common/enums/recurrence.enum';
import { TableType } from 'src/common/enums/table-type.enum';

export class CreateTableDto {
  @IsString({ message: 'Title must be a string' })
  @MaxLength(100, { message: 'Title cannot exceed 100 characters' })
  title!: string;

  @IsString({ message: 'System must be a string' })
  @MaxLength(100, { message: 'System cannot exceed 100 characters' })
  system!: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @IsEnum(TableType, { message: 'Invalid table type' })
  tableType!: TableType;

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
  platform!: string;

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
