import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { AgeRequirement } from 'src/common/enums/age-requirement.enum';
import { ExperienceLevel } from 'src/common/enums/experience-level.enum';
import { Recurrence } from 'src/common/enums/recurrence.enum';
import { TableType } from 'src/common/enums/table-type.enum';

export class FindTablesDto {
  @IsOptional()
  @IsString()
  system?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;

  @IsOptional()
  @IsEnum(AgeRequirement)
  ageRequirement?: AgeRequirement;

  @IsOptional()
  @IsEnum(TableType)
  tableType?: TableType;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;

  @IsOptional()
  @IsEnum(Recurrence)
  recurrence?: Recurrence;

  @IsOptional()
  @IsEnum(ExperienceLevel)
  experienceLevel?: ExperienceLevel;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}
