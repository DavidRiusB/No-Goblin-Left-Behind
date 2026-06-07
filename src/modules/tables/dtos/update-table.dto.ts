import { PartialType } from '@nestjs/mapped-types';
import { CreateTableDto } from './create-table.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { TableStatus } from 'src/common/enums/table-status.enum';

export class UpdateTableDto extends PartialType(CreateTableDto) {
  @IsOptional()
  @IsEnum(TableStatus, { message: 'Invalid table status' })
  status?: TableStatus;
}
