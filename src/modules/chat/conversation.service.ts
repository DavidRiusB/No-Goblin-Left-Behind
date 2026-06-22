import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConversationRepository } from './conversation.repository';
import { MessageRepository } from './message.repository';
import { Conversation } from './entities/conversation.entity';
import { ConversationStatus } from 'src/common/enums/conversation-status.enum';

@Injectable()
export class ConversationService {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly messageRepository: MessageRepository,
  ) {}

  // open (or fetch) a 1-on-1 — called when a join request is made
  async openConversation(userX: string, userY: string): Promise<Conversation> {
    return this.conversationRepository.findOrCreate(userX, userY);
  }

  private isParticipant(conv: Conversation, userId: string): boolean {
    return conv.participantA.id === userId || conv.participantB.id === userId;
  }

  async assertCanMessage(
    conversationId: string,
    userId: string,
  ): Promise<Conversation> {
    const conv = await this.conversationRepository.findById(conversationId);
    if (!conv) throw new NotFoundException('Conversation not found');
    if (!this.isParticipant(conv, userId)) {
      throw new ForbiddenException('You are not part of this conversation');
    }
    if (conv.status === ConversationStatus.BLOCKED) {
      throw new ForbiddenException('This conversation is blocked');
    }
    return conv;
  }

  async sendMessage(conversationId: string, userId: string, content: string) {
    const conv = await this.assertCanMessage(conversationId, userId);
    const message = await this.messageRepository.createInConversation({
      conversationId,
      senderId: userId,
      content,
    });
    return { message, conversation: conv };
  }

  async getHistory(
    conversationId: string,
    userId: string,
    limit = 30,
    before?: Date,
  ) {
    const conv = await this.conversationRepository.findById(conversationId);
    if (!conv) throw new NotFoundException('Conversation not found');
    if (!this.isParticipant(conv, userId)) {
      throw new ForbiddenException('You are not part of this conversation');
    }
    // reading allowed even if blocked — you can see history, just can't send
    return this.messageRepository.findByConversation(
      conversationId,
      limit,
      before,
    );
  }

  async getMine(userId: string) {
    return this.conversationRepository.findByUser(userId);
  }

  async block(conversationId: string, userId: string): Promise<Conversation> {
    const conv = await this.conversationRepository.findById(conversationId);
    if (!conv) throw new NotFoundException('Conversation not found');
    if (!this.isParticipant(conv, userId)) {
      throw new ForbiddenException('You are not part of this conversation');
    }
    conv.status = ConversationStatus.BLOCKED;
    conv.blockedBy = { id: userId } as any;
    return this.conversationRepository.save(conv);
  }

  async unblock(conversationId: string, userId: string): Promise<Conversation> {
    const conv = await this.conversationRepository.findById(conversationId);
    if (!conv) throw new NotFoundException('Conversation not found');
    // only the person who blocked can unblock
    if (conv.blockedBy?.id !== userId) {
      throw new ForbiddenException('Only the user who blocked can unblock');
    }
    conv.status = ConversationStatus.ACTIVE;
    conv.blockedBy = undefined;
    return this.conversationRepository.save(conv);
  }
  // ConversationService
  async getById(id: string): Promise<Conversation> {
    const conv = await this.conversationRepository.findById(id);
    if (!conv) throw new NotFoundException('Conversation not found');
    return conv;
  }
}
