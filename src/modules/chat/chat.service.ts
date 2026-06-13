// src/modules/chat/chat.service.ts
import { ForbiddenException, Injectable } from '@nestjs/common';
import { MessageRepository } from './message.repository';
import { Message } from './entities/message.entity';

@Injectable()
export class ChatService {
  constructor(private readonly messageRepository: MessageRepository) {}

  async assertCanAccess(userId: string, tableId: string): Promise<void> {
    const allowed = await this.messageRepository.canAccessTable(
      userId,
      tableId,
    );
    if (!allowed) {
      throw new ForbiddenException('You are not a member of this table');
    }
  }

  async sendMessage(
    userId: string,
    tableId: string,
    content: string,
  ): Promise<Message> {
    await this.assertCanAccess(userId, tableId);
    return this.messageRepository.create({
      tableId,
      senderId: userId,
      content,
    });
  }

  async getHistory(
    userId: string,
    tableId: string,
    limit = 30,
    before?: Date,
  ): Promise<Message[]> {
    await this.assertCanAccess(userId, tableId);
    return this.messageRepository.findByTable(tableId, limit, before);
  }
}
