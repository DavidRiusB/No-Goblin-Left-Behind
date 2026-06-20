import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MessageRepository } from './message.repository';
import { Table } from 'src/modules/tables/entities/table.entity';

@Injectable()
export class ChatService {
  constructor(private readonly messageRepository: MessageRepository) {}

  // returns the table so callers can reuse it without re-fetching
  async assertCanAccess(userId: string, tableId: string): Promise<Table> {
    const table = await this.messageRepository.findTableWithDm(tableId);
    if (!table) throw new NotFoundException('Table not found');

    if (table.dm.id === userId) return table;

    const isMember = await this.messageRepository.isActiveMember(
      userId,
      tableId,
    );
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this table');
    }
    return table;
  }

  async sendMessage(userId: string, tableId: string, content: string) {
    const table = await this.assertCanAccess(userId, tableId);
    const message = await this.messageRepository.create({
      tableId,
      senderId: userId,
      content,
    });
    return { message, table };
  }

  async getHistory(userId: string, tableId: string, limit = 30, before?: Date) {
    await this.assertCanAccess(userId, tableId);
    return this.messageRepository.findByTable(tableId, limit, before);
  }

  // notify targets: DM + active members, minus sender. takes the already-loaded table.
  async getNotifyTargets(table: Table, senderId: string): Promise<string[]> {
    const memberships = await this.messageRepository.findActiveMemberships(
      table.id,
    );

    const ids = new Set<string>();
    if (table.dm.id !== senderId) ids.add(table.dm.id);
    for (const m of memberships) {
      if (m.user.id !== senderId) ids.add(m.user.id);
    }
    return [...ids];
  }
}
