// src/modules/chat/message.repository.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, LessThan } from 'typeorm';
import { Message } from './entities/message.entity';
import { Table } from 'src/modules/tables/entities/table.entity';
import { TableMembership } from 'src/modules/tables/entities/table-membership.entity';
import { User } from 'src/modules/users/entity/user.entity';
import { Conversation } from './entities/conversation.entity';
import { MembershipStatus } from 'src/common/enums/membership-status.enum';

@Injectable()
export class MessageRepository {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
    @InjectRepository(TableMembership)
    private readonly membershipRepository: Repository<TableMembership>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Message> {
    return manager ? manager.getRepository(Message) : this.messageRepository;
  }

  // is this user allowed in the table room? DM or ACTIVE member
  async canAccessTable(userId: string, tableId: string): Promise<boolean> {
    const table = await this.tableRepository.findOne({
      where: { id: tableId },
      relations: { dm: true },
    });
    if (!table) return false;
    if (table.dm.id === userId) return true;

    const membership = await this.membershipRepository.findOne({
      where: {
        user: { id: userId },
        table: { id: tableId },
        status: MembershipStatus.ACTIVE,
      },
    });
    return !!membership;
  }

  async create(
    data: { tableId: string; senderId: string; content: string },
    manager?: EntityManager,
  ): Promise<Message> {
    const repo = this.getRepo(manager);
    try {
      const message = repo.create({
        table: { id: data.tableId } as Table,
        sender: { id: data.senderId } as User,
        content: data.content,
      });
      const saved = await repo.save(message);
      // reload with sender relation so the emitted payload has sender info
      return repo.findOneOrFail({
        where: { id: saved.id },
        relations: { sender: true },
      });
    } catch (error: any) {
      throw new InternalServerErrorException('Failed to save message');
    }
  }

  // history, newest-first, cursor paginated by createdAt
  async findByTable(
    tableId: string,
    limit: number,
    before?: Date,
  ): Promise<Message[]> {
    return this.messageRepository.find({
      where: {
        table: { id: tableId },
        ...(before ? { createdAt: LessThan(before) } : {}),
      },
      relations: { sender: true },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
  async createInConversation(data: {
    conversationId: string;
    senderId: string;
    content: string;
  }): Promise<Message> {
    try {
      const message = this.messageRepository.create({
        conversation: { id: data.conversationId } as Conversation,
        sender: { id: data.senderId } as User,
        content: data.content,
      });
      const saved = await this.messageRepository.save(message);
      return this.messageRepository.findOneOrFail({
        where: { id: saved.id },
        relations: { sender: true },
      });
    } catch {
      throw new InternalServerErrorException('Failed to save message');
    }
  }

  async findByConversation(
    conversationId: string,
    limit: number,
    before?: Date,
  ): Promise<Message[]> {
    return this.messageRepository.find({
      where: {
        conversation: { id: conversationId },
        ...(before ? { createdAt: LessThan(before) } : {}),
      },
      relations: { sender: true },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
