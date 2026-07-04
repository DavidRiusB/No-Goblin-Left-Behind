import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, LessThan } from 'typeorm';
import { Message } from './entities/message.entity';
import { Table } from 'src/modules/tables/entities/table.entity';
import { TableMembership } from 'src/modules/tables/entities/table-membership.entity';
import { User } from 'src/modules/users/entity/user.entity';
import { MembershipStatus } from 'src/common/enums/membership-status.enum';
import { Conversation } from './entities/conversation.entity';

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

  async findTableWithDm(tableId: string): Promise<Table | null> {
    return this.tableRepository.findOne({
      where: { id: tableId },
      relations: { dm: true },
    });
  }

  async isActiveMember(userId: string, tableId: string): Promise<boolean> {
    const membership = await this.membershipRepository.findOne({
      where: {
        user: { id: userId },
        table: { id: tableId },
        status: MembershipStatus.ACTIVE,
      },
    });
    return !!membership;
  }

  async findActiveMemberships(tableId: string): Promise<TableMembership[]> {
    return this.membershipRepository.find({
      where: { table: { id: tableId }, status: MembershipStatus.ACTIVE },
      relations: { user: true },
    });
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
      return repo.findOneOrFail({
        where: { id: saved.id },
        relations: { sender: true },
      });
    } catch (error: any) {
      throw new InternalServerErrorException('Failed to save message');
    }
  }

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

  async findLastByConversations(conversationIds: string[]): Promise<Message[]> {
    if (conversationIds.length === 0) return [];
    return this.messageRepository
      .createQueryBuilder('msg')
      .innerJoinAndSelect('msg.sender', 'sender')
      .innerJoinAndSelect('msg.conversation', 'conversation')
      .distinctOn(['conversation.id'])
      .where('conversation.id IN (:...ids)', { ids: conversationIds })
      .andWhere('msg.deletedAt IS NULL')
      .orderBy('conversation.id')
      .addOrderBy('msg.createdAt', 'DESC')
      .getMany();
  }
}
