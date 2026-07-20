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
import { ConversationService } from './conversation.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from 'src/common/enums/notification-type.enum';

interface AuthedSocket extends Socket {
  data: { userId: string; email: string; role: string };
}

@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class ChatGateway {
  private readonly logger = new Logger(ChatGateway.name);

  private msgTimes = new Map<string, number[]>();

  private rateOk(clientId: string, max = 10, windowMs = 10_000): boolean {
    const now = Date.now();
    const times = (this.msgTimes.get(clientId) ?? []).filter(
      (t) => now - t < windowMs,
    );
    if (times.length >= max) return false;
    times.push(now);
    this.msgTimes.set(clientId, times);
    return true;
  }

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly conversationService: ConversationService,
    private readonly notificationsService: NotificationsService,
  ) {}

  handleDisconnect(client: AuthedSocket) {
    this.msgTimes.delete(client.id);
  }

  private getUserIdsInRoom(room: string): Set<string> {
    const ids = new Set<string>();
    const sockets = this.server.sockets.adapter.rooms.get(room);
    if (!sockets) return ids;
    for (const socketId of sockets) {
      const socket = this.server.sockets.sockets.get(socketId);
      if (socket?.data?.userId) ids.add(socket.data.userId);
    }
    return ids;
  }

  @SubscribeMessage('joinConversation')
  async onJoinConversation(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    try {
      await this.conversationService.assertCanMessage(
        data.conversationId,
        client.data.userId,
      );
      client.join(`conversation:${data.conversationId}`);
      return { ok: true, room: `conversation:${data.conversationId}` };
    } catch {
      return { ok: false, error: 'Access denied' };
    }
  }

  @SubscribeMessage('sendDirectMessage')
  async onSendDirectMessage(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { conversationId: string; content: string },
  ) {
    if (!this.rateOk(client.id)) {
      return { ok: false, error: 'Slow down' };
    }
    try {
      const { message, conversation } =
        await this.conversationService.sendMessage(
          data.conversationId,
          client.data.userId,
          data.content,
        );

      this.server
        .to(`conversation:${data.conversationId}`)
        .emit('newDirectMessage', {
          id: message.id,
          conversationId: data.conversationId,
          content: message.content,
          sender: {
            id: message.sender.id,
            username: message.sender.username,
            displayName: message.sender.displayName,
            avatarUrl: message.sender.avatarUrl,
          },
          createdAt: message.createdAt,
        });

      const otherUserId =
        conversation.participantA.id === client.data.userId
          ? conversation.participantB.id
          : conversation.participantA.id;

      const inRoom = this.getUserIdsInRoom(
        `conversation:${data.conversationId}`,
      );

      if (!inRoom.has(otherUserId)) {
        await this.notificationsService.notify(
          otherUserId,
          NotificationType.NEW_MESSAGE,
          {
            conversationId: data.conversationId,
            messageId: message.id,
            senderId: client.data.userId,
            senderName: message.sender.displayName ?? message.sender.username,
          },
        );
      }

      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message ?? 'Failed to send' };
    }
  }

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
    if (!this.rateOk(client.id)) {
      return { ok: false, error: 'Slow down' };
    }
    try {
      const { message, table } = await this.chatService.sendMessage(
        client.data.userId,
        data.tableId,
        data.content,
      );

      this.server.to(`table:${data.tableId}`).emit('newMessage', {
        id: message.id,
        tableId: data.tableId,
        content: message.content,
        sender: {
          id: message.sender.id,
          username: message.sender.username,
          displayName: message.sender.displayName,
          avatarUrl: message.sender.avatarUrl,
        },
        createdAt: message.createdAt,
      });

      const recipients = await this.chatService.getNotifyTargets(
        table,
        client.data.userId,
      );
      const inRoom = this.getUserIdsInRoom(`table:${data.tableId}`);

      for (const userId of recipients) {
        if (inRoom.has(userId)) continue;
        await this.notificationsService.notify(
          userId,
          NotificationType.NEW_MESSAGE,
          {
            tableId: data.tableId,
            messageId: message.id,
            senderId: client.data.userId,
          },
        );
      }

      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message ?? 'Failed to send' };
    }
  }
}
