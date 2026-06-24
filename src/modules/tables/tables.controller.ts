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
    return this.tablesService.getMyTables(requester);
  }

  @Get(':id')
  async getTableDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.tablesService.getTableDetail(id);
  }

  @Get(':id/member-view')
  @UseGuards(JwtAuthGuard)
  async getMemberView(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() requester: JwtUser,
  ) {
    return this.tablesService.getTableMemberDetail(id, requester);
  }

  @Get(':id/players/:playerId')
  @UseGuards(JwtAuthGuard)
  async getPlayerDetail(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('playerId', ParseUUIDPipe) playerId: string,
    @CurrentUser() requester: JwtUser,
  ) {
    return this.tablesService.getTablePlayerDetail(id, playerId, requester);
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
