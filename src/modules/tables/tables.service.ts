import { Injectable } from '@nestjs/common';
import { FindTablesDto } from './dtos/find-table.dto';
import { TableRepository } from './table.repository';
import { Table } from './entities/table.entity';

@Injectable()
export class TablesService {
  constructor(private readonly tableRepository: TableRepository) {}

  async findWithFilters(
    filters: FindTablesDto,
  ): Promise<{ data: Table[]; total: number }> {
    return this.tableRepository.findWithFilters(filters);
  }
}
