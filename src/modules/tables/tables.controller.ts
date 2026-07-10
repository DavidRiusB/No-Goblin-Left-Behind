import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  SerializeOptions,
  UseGuards,
} from '@nestjs/common';
import { TablesService } from './tables.service';
import { FindTablesDto } from './dtos/find-table.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth-guard';
import { CreateTableDto } from './dtos/create-table.dto';
import type { JwtUser } from 'src/common/types/jwt-user.type';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from '../users/entity/user.entity';
import { UpdateTableDto } from './dtos/update-table.dto';
import { CreateJoinRequestDto } from './dtos/create-join-request.dto';
import { UpdateJoinRequestDto } from './dtos/update-join-request.dto';
import {
  TableDetailResponse,
  TableMemberDetailResponse,
} from './dtos/table-detail.response';
import { plainToInstance } from 'class-transformer';
import { UserProfileResponse } from '../users/dtos/user-profile-response.dto';
import { TableManagementResponse } from './dtos/management-table-response.dto';
import { OpenConversationDto } from './dtos/open-conversation.dto';
import { MyTablesResponse } from './dtos/my-tables.response.dto';
import { ConversationResponse } from '../chat/dtos/chat-participant-response.dto';

@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  async findWithFilters(@Query() filters: FindTablesDto) {
    return this.tablesService.findWithFilters(filters);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyTables(@CurrentUser() requester: JwtUser) {
    const data = await this.tablesService.getMyTables(requester);
    return plainToInstance(MyTablesResponse, data, {
      excludeExtraneousValues: true,
    });
  }

  @Get(':id/member-view')
  @UseGuards(JwtAuthGuard)
  async getMemberView(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() requester: JwtUser,
  ) {
    const data = await this.tablesService.getTableForMember(id, requester);
    return plainToInstance(TableMemberDetailResponse, data, {
      excludeExtraneousValues: true,
    });
  }

  @Get(':id/players/:playerId')
  @UseGuards(JwtAuthGuard)
  async getPlayerDetail(
    @Param('id', ParseUUIDPipe) id,
    @Param('playerId', ParseUUIDPipe) playerId,
    @CurrentUser() requester,
  ) {
    const data = await this.tablesService.getTablePlayerDetail(
      id,
      playerId,
      requester,
    );
    return plainToInstance(UserProfileResponse, data, {
      excludeExtraneousValues: true,
    });
  }

  @Get(':id/connections/:userId')
  @UseGuards(JwtAuthGuard)
  async getConnectionProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() requester: JwtUser,
  ) {
    const data = this.tablesService.getConnectionProfile(id, userId, requester);
    return plainToInstance(UserProfileResponse, data, {
      excludeExtraneousValues: true,
    });
  }

  @Get(':id/manage')
  @UseGuards(JwtAuthGuard)
  async getTableManagement(
    @Param('id', ParseUUIDPipe) id,
    @CurrentUser() requester,
  ) {
    const data = await this.tablesService.getTableManagement(id, requester);
    return plainToInstance(TableManagementResponse, data, {
      excludeExtraneousValues: true,
    });
  }

  @Get(':id')
  async getTableDetail(@Param('id', ParseUUIDPipe) id: string) {
    const data = this.tablesService.getTableDetail(id);
    return plainToInstance(TableDetailResponse, data, {
      excludeExtraneousValues: true,
    });
  }

  @Post('/:id/open-conversation')
  @UseGuards(JwtAuthGuard)
  async open(
    @Param('id', ParseUUIDPipe) tableId,
    @Body() dto: OpenConversationDto,
    @CurrentUser() user: JwtUser,
  ) {
    const data = await this.tablesService.openConversation(tableId, [
      dto.targetId,
      user.userId,
    ]);
    return plainToInstance(ConversationResponse, data, {
      excludeExtraneousValues: true,
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createTableDto: CreateTableDto,
    @CurrentUser() requester: JwtUser,
  ) {
    const dm = { id: requester.userId } as User;
    return this.tablesService.create(createTableDto, dm);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTableDto: UpdateTableDto,
    @CurrentUser() requester: JwtUser,
  ) {
    return this.tablesService.update(id, updateTableDto, requester);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() requester: JwtUser,
  ) {
    return this.tablesService.delete(id, requester);
  }

  @Post(':id/requests')
  @UseGuards(JwtAuthGuard)
  async requestToJoin(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createJoinRequestDto: CreateJoinRequestDto,
    @CurrentUser() requester: JwtUser,
  ) {
    return this.tablesService.requestToJoin(
      id,
      requester,
      createJoinRequestDto,
    );
  }

  @Patch(':id/requests/:requestId')
  @UseGuards(JwtAuthGuard)
  async updateJoinRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Body() updateJoinRequestDto: UpdateJoinRequestDto,
    @CurrentUser() requester: JwtUser,
  ) {
    return this.tablesService.updateJoinRequest(
      id,
      requestId,
      updateJoinRequestDto,
      requester,
    );
  }

  @Delete(':id/requests/:requestId')
  @UseGuards(JwtAuthGuard)
  async withdrawJoinRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @CurrentUser() requester: JwtUser,
  ) {
    return this.tablesService.withdrawJoinRequest(id, requestId, requester);
  }

  @Delete(':id/members/me')
  @UseGuards(JwtAuthGuard)
  async leaveTable(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() requester: JwtUser,
  ) {
    return this.tablesService.leaveTable(id, requester);
  }

  @Delete(':id/members/:memberId')
  @UseGuards(JwtAuthGuard)
  async kickMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @CurrentUser() requester: JwtUser,
  ) {
    return this.tablesService.kickMember(id, memberId, requester);
  }
}
