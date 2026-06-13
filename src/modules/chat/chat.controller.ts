import {
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';

import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { JwtUser } from 'src/common/types/jwt-user.type';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth-guard';

@Controller('tables/:id/messages')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getHistory(
    @Param('id', ParseUUIDPipe) tableId: string,
    @CurrentUser() user: JwtUser,
    @Query('before') before?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.getHistory(
      user.userId,
      tableId,
      limit ? parseInt(limit, 10) : 30,
      before ? new Date(before) : undefined,
    );
  }
}
