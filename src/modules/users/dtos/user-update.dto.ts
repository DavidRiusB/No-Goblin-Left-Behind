import {
  IsArray,
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: 'Notification email must be a valid email address' })
  notificationEmail?: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'Birth date must be a valid ISO date (YYYY-MM-DD)' },
  )
  birthDate?: string;

  @IsOptional()
  @IsString({ message: 'Display name must be a string' })
  @MaxLength(100, { message: 'Display name cannot exceed 100 characters' })
  displayName?: string;

  @IsOptional()
  @IsString({ message: 'Bio must be a string' })
  bio?: string;

  @IsOptional()
  @IsArray({ message: 'Preferred systems must be an array' })
  @IsString({ each: true, message: 'Each preferred system must be a string' })
  preferredSystems?: string[];

  @IsOptional()
  @IsArray({ message: 'Play style tags must be an array' })
  @IsString({ each: true, message: 'Each play style tag must be a string' })
  playStyleTags?: string[];

  @IsOptional()
  @IsString({ message: 'Timezone must be a string' })
  @MaxLength(100, { message: 'Timezone cannot exceed 100 characters' })
  timezone?: string;

  @IsOptional()
  @IsString({ message: 'Location must be a string' })
  @MaxLength(100, { message: 'Location cannot exceed 100 characters' })
  location?: string;
}
