import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { parse } from 'cookie';

interface AuthedSocket extends Socket {
  data: {
    userId: string;
    email: string;
    role: string;
  };
}

@WebSocketGateway({
  cors: { origin: true, credentials: true },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: AuthedSocket) {
    try {
      const token = this.extractToken(client);

      if (!token) {
        this.logger.warn(`No token, disconnecting ${client.id}`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // attach user to the socket — persists for the connection's lifetime
      client.data.userId = payload.sub;
      client.data.email = payload.email;
      client.data.role = payload.role;

      // personal room — how we target this user from anywhere later
      client.join(`user:${payload.sub}`);

      this.logger.log(`Authed & connected: ${payload.sub} (${client.id})`);
    } catch (err) {
      this.logger.warn(`Auth failed, disconnecting ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthedSocket) {
    this.logger.log(`Disconnected: ${client.data?.userId ?? client.id}`);
  }

  emitToUser(userId: string, event: string, payload: unknown): void {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  private extractToken(client: Socket): string | null {
    // 1) cookie (web clients)
    const cookieHeader = client.handshake.headers.cookie;
    if (cookieHeader) {
      const cookies = parse(cookieHeader);
      if (cookies.access_token) return cookies.access_token;
    }
    // 2) auth payload (mobile / non-cookie clients)
    const authToken = client.handshake.auth?.token;
    if (authToken) return authToken;

    return null;
  }
}
