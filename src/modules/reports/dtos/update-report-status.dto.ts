import { IsEnum } from 'class-validator';
import { ReportStatus } from 'src/common/enums/report-status.enum';

export class UpdateReportStatusDto {
  @IsEnum(ReportStatus)
  status!: ReportStatus;
}
