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
import { TableMemberDetailResponse } from './dtos/table-detail.response';
import { plainToInstance } from 'class-transformer';

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

  // table player detail? whats the difrence with the end point in top
  // misleading name
  // dosnet return table, checks only if playes is in table ???
  // is a bad version of   @Get(':id/connections/:userId') only checks active tables
  @Get(':id/players/:playerId')
  @UseGuards(JwtAuthGuard)
  async getPlayerDetail(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('playerId', ParseUUIDPipe) playerId: string,
    @CurrentUser() requester: JwtUser,
  ) {
    return this.tablesService.getTablePlayerDetail(id, playerId, requester);
  }

  @Get(':id/requests')
  @UseGuards(JwtAuthGuard)
  async getTableRequests(
    @Param('id', ParseUUIDPipe) tableId: string,
    @CurrentUser() requester: JwtUser,
  ) {
    return this.tablesService.getTableRequests(tableId, requester);
  }

  @Get(':id/connections/:userId')
  @UseGuards(JwtAuthGuard)
  async getConnectionProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() requester: JwtUser,
  ) {
    return this.tablesService.getConnectionProfile(id, userId, requester);
  }

  @Get(':id/manage')
  @UseGuards(JwtAuthGuard)
  async getTableManagement(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() requester: JwtUser,
  ) {
    return this.tablesService.getTableManagement(id, requester);
  }

  @Get(':id')
  async getTableDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.tablesService.getTableDetail(id);
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
