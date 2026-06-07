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

@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  async findWithFilters(@Query() filters: FindTablesDto) {
    return this.tablesService.findWithFilters(filters);
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.tablesService.findById(id);
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
}
