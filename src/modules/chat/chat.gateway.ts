// src/modules/chat/chat.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ChatService } from './chat.service';

interface AuthedSocket extends Socket {
  data: { userId: string; email: string; role: string };
}

@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class ChatGateway {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly chatService: ChatService) {}

  @SubscribeMessage('joinTableRoom')
  async onJoinTableRoom(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { tableId: string },
  ) {
    try {
      await this.chatService.assertCanAccess(client.data.userId, data.tableId);
      client.join(`table:${data.tableId}`);
      return { ok: true, room: `table:${data.tableId}` };
    } catch {
      return { ok: false, error: 'Access denied' };
    }
  }

  @SubscribeMessage('sendMessage')
  async onSendMessage(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { tableId: string; content: string },
  ) {
    try {
      const message = await this.chatService.sendMessage(
        client.data.userId,
        data.tableId,
        data.content,
      );
      // broadcast to everyone currently in the room
      this.server.to(`table:${data.tableId}`).emit('newMessage', {
        id: message.id,
        tableId: data.tableId,
        content: message.content,
        sender: {
          id: message.sender.id,
          username: message.sender.username,
          displayName: message.sender.displayName,
        },
        createdAt: message.createdAt,
      });
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message ?? 'Failed to send' };
    }
  }
}
