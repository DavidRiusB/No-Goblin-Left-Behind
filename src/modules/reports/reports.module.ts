import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from './entity/report.entity';
import { ReportRepository } from './reports.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Report])],
  providers: [ReportsService, ReportRepository],
  controllers: [ReportsController],
})
export class ReportsModule {}
