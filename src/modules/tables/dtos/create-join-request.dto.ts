import { IsOptional, IsString } from 'class-validator';

export class CreateJoinRequestDto {
  @IsOptional()
  @IsString({ message: 'Message must be a string' })
  message?: string;
}
