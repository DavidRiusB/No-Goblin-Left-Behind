import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { User } from 'src/modules/users/entity/user.entity';

@Injectable()
export class ConversationRepository {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
  ) {}

  // consistent ordering so (A,B) and (B,A) resolve to the same row
  private orderPair(userX: string, userY: string): [string, string] {
    return userX < userY ? [userX, userY] : [userY, userX];
  }

  async findOrCreate(userX: string, userY: string): Promise<Conversation> {
    const [a, b] = this.orderPair(userX, userY);

    const existing = await this.conversationRepository.findOne({
      where: { participantA: { id: a }, participantB: { id: b } },
      relations: { participantA: true, participantB: true, blockedBy: true },
    });
    if (existing) return existing;

    try {
      const conversation = this.conversationRepository.create({
        participantA: { id: a } as User,
        participantB: { id: b } as User,
      });
      return await this.conversationRepository.save(conversation);
    } catch (error: any) {
      // race: another request created it between our check and insert
      if (error.code === '23505') {
        const found = await this.conversationRepository.findOne({
          where: { participantA: { id: a }, participantB: { id: b } },
          relations: {
            participantA: true,
            participantB: true,
            blockedBy: true,
          },
        });
        if (found) return found;
      }
      throw new InternalServerErrorException('Failed to create conversation');
    }
  }

  async findById(id: string): Promise<Conversation | null> {
    return this.conversationRepository.findOne({
      where: { id },
      relations: { participantA: true, participantB: true, blockedBy: true },
    });
  }

  async findByUser(userId: string): Promise<Conversation[]> {
    return this.conversationRepository.find({
      where: [
        { participantA: { id: userId } },
        { participantB: { id: userId } },
      ],
      relations: { participantA: true, participantB: true, blockedBy: true },
      order: { createdAt: 'DESC' },
    });
  }

  async save(conversation: Conversation): Promise<Conversation> {
    return this.conversationRepository.save(conversation);
  }
}
