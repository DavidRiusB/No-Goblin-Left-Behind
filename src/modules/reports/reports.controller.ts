import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dtos/create-report.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from 'src/common/enums/roles.enum';
import { ReportStatus } from 'src/common/enums/report-status.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth-guard';
import type { JwtUser } from 'src/common/types/jwt-user.type';
import {
  ReportQueueResponse,
  ReportResponse,
} from './dtos/report-response.dto';
import { MinRole } from 'src/common/helpers/min-role.guard';
import { UpdateReportStatusDto } from './dtos/update-report-status.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateReportDto, @CurrentUser() user: JwtUser) {
    const data = await this.reportsService.create(user, dto);
    return plainToInstance(ReportResponse, data, {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard, MinRole(Role.Moderator))
  async getQueue(
    @Query('status') status?: ReportStatus,
    @Query('page') page?: string,
  ) {
    const data = await this.reportsService.getQueue(
      status ?? ReportStatus.OPEN,
      page ? parseInt(page, 10) : 1,
    );
    return plainToInstance(ReportQueueResponse, data, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, MinRole(Role.Moderator))
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReportStatusDto,
    @CurrentUser() user: JwtUser,
  ) {
    const data = await this.reportsService.updateStatus(id, dto.status, user);
    return plainToInstance(ReportResponse, data, {
      excludeExtraneousValues: true,
    });
  }
}
