import { Expose, Type } from 'class-transformer';

class ChatParticipantResponse {
  @Expose() id!: string;
  @Expose() username!: string;
  @Expose() displayName!: string | null;
  @Expose() avatarUrl!: string | null;
}

export class MessageResponse {
  @Expose() id!: string;
  @Expose() content!: string;
  @Expose() createdAt!: Date;
  @Expose()
  @Type(() => ChatParticipantResponse)
  sender!: ChatParticipantResponse;
}

export class ConversationResponse {
  @Expose() id!: string;
  @Expose() createdAt!: Date;
  @Expose()
  @Type(() => ChatParticipantResponse)
  participantA!: ChatParticipantResponse;
  @Expose()
  @Type(() => ChatParticipantResponse)
  participantB!: ChatParticipantResponse;
  @Expose() @Type(() => MessageResponse) lastMessage!: MessageResponse | null;
  @Expose() status!: string;
  @Expose()
  @Type(() => ChatParticipantResponse)
  blockedBy!: ChatParticipantResponse | null;
}
