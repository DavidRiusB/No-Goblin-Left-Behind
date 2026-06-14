import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth-guard';
import { ConversationService } from './conversation.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { JwtUser } from 'src/common/types/jwt-user.type';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Get()
  async getMine(@CurrentUser() user: JwtUser) {
    return this.conversationService.getMine(user.userId);
  }

  @Get(':id/messages')
  async getHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUser,
    @Query('before') before?: string,
    @Query('limit') limit?: string,
  ) {
    return this.conversationService.getHistory(
      id,
      user.userId,
      limit ? parseInt(limit, 10) : 30,
      before ? new Date(before) : undefined,
    );
  }

  @Patch(':id/block')
  async block(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.conversationService.block(id, user.userId);
  }

  @Patch(':id/unblock')
  async unblock(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.conversationService.unblock(id, user.userId);
  }
}
