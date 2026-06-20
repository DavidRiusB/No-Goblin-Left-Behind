// src/modules/chat/chat.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { Table } from 'src/modules/tables/entities/table.entity';
import { TableMembership } from 'src/modules/tables/entities/table-membership.entity';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { MessageRepository } from './message.repository';
import { ConversationRepository } from './conversation.repository';
import { Conversation } from './entities/conversation.entity';
import { ConversationService } from './conversation.service';
import { ConversationController } from './conversation.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Conversation, Table, TableMembership]),
    NotificationsModule,
  ],
  providers: [
    ChatService,
    ConversationService,
    ChatGateway,
    MessageRepository,
    ConversationRepository,
  ],
  controllers: [ChatController, ConversationController],
  exports: [ConversationService],
})
export class ChatModule {}
