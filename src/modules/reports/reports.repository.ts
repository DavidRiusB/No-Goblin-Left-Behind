import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Report } from './entity/report.entity';
import { EntityManager, Repository } from 'typeorm';
import { ReportStatus } from 'src/common/enums/report-status.enum';
import { ReportTargetType } from 'src/common/enums/report-target-type.enum';
import { ReportReason } from 'src/common/enums/report-reason.enum';
import { User } from '../users/entity/user.entity';

@Injectable()
export class ReportRepository {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Report> {
    return manager ? manager.getRepository(Report) : this.reportRepository;
  }

  async create(
    data: {
      reporterId: string;
      targetType: ReportTargetType;
      targetId: string;
      reason: ReportReason;
      details?: string;
    },
    manager?: EntityManager,
  ): Promise<Report> {
    const repo = this.getRepo(manager);
    const report = repo.create({
      reporter: { id: data.reporterId } as User,
      targetType: data.targetType,
      targetId: data.targetId,
      reason: data.reason,
      details: data.details ?? null,
    });
    return repo.save(report);
  }

  /** dedupe check: does this reporter already have an OPEN report on this target? */
  async findExisting(
    reporterId: string,
    targetType: ReportTargetType,
    targetId: string,
  ): Promise<Report | null> {
    return this.reportRepository.findOne({
      where: {
        reporter: { id: reporterId },
        targetType,
        targetId,
        status: ReportStatus.OPEN,
      },
    });
  }

  async findAll(
    status: ReportStatus,
    page = 1,
    limit = 20,
  ): Promise<[Report[], number]> {
    return this.reportRepository.findAndCount({
      where: { status },
      relations: { reporter: true, resolvedBy: true },
      order: { createdAt: 'ASC' }, // oldest first — queue semantics
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findById(id: string): Promise<Report | null> {
    return this.reportRepository.findOne({
      where: { id },
      relations: { reporter: true, resolvedBy: true },
    });
  }

  async save(report: Report, manager?: EntityManager): Promise<Report> {
    return this.getRepo(manager).save(report);
  }
}
