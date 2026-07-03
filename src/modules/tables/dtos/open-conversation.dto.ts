import { IsUUID } from 'class-validator';

export class OpenConversationDto {
  @IsUUID('4', { message: 'otherUserId must be a valid UUID' })
  targetId!: string;
}
