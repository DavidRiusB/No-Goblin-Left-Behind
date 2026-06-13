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

@Module({
  imports: [TypeOrmModule.forFeature([Message, Table, TableMembership])],
  providers: [ChatService, ChatGateway, MessageRepository],
  controllers: [ChatController],
})
export class ChatModule {}
