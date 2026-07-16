import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReportRepository } from './reports.repository';
import { Report } from './entity/report.entity';
import { ReportTargetType } from 'src/common/enums/report-target-type.enum';
import { ReportReason } from 'src/common/enums/report-reason.enum';
import { ReportStatus } from 'src/common/enums/report-status.enum';
import { JwtUser } from 'src/common/types/jwt-user.type';

@Injectable()
export class ReportsService {
  constructor(private readonly reportRepository: ReportRepository) {}

  async create(
    reporter: JwtUser,
    data: {
      targetType: ReportTargetType;
      targetId: string;
      reason: ReportReason;
      details?: string;
    },
  ): Promise<Report> {
    const existing = await this.reportRepository.findExisting(
      reporter.userId,
      data.targetType,
      data.targetId,
    );
    if (existing) {
      throw new BadRequestException('You already have an open report on this');
    }

    return this.reportRepository.create({
      reporterId: reporter.userId,
      ...data,
    });
  }

  async getQueue(
    status: ReportStatus,
    page: number,
  ): Promise<{ reports: Report[]; total: number; page: number }> {
    const [reports, total] = await this.reportRepository.findAll(status, page);
    return { reports, total, page };
  }

  async updateStatus(
    id: string,
    status: ReportStatus,
    resolver: JwtUser,
  ): Promise<Report> {
    if (status === ReportStatus.OPEN) {
      throw new BadRequestException('Reports cannot be reopened');
    }

    const report = await this.reportRepository.findById(id);
    if (!report) throw new NotFoundException('Report not found');
    if (report.status !== ReportStatus.OPEN) {
      throw new BadRequestException('Report is already closed');
    }

    report.status = status;
    report.resolvedBy = { id: resolver.userId } as any;
    report.resolvedAt = new Date();
    return this.reportRepository.save(report);
  }
}
