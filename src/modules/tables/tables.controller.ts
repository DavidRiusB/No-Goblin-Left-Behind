import { Controller, Get, Query } from '@nestjs/common';
import { TablesService } from './tables.service';
import { FindTablesDto } from './dtos/find-table.dto';

@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  async findWithFilters(@Query() filters: FindTablesDto) {
    return this.tablesService.findWithFilters(filters);
  }
}
