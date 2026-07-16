import { Expose, Type } from 'class-transformer';

class PublicUserRef {
  @Expose() id!: string;
  @Expose() username!: string;
  @Expose() displayName!: string | null;
  @Expose() avatarUrl!: string | null;
}

export class ReportResponse {
  @Expose() id!: string;
  @Expose() targetType!: string;
  @Expose() targetId!: string;
  @Expose() reason!: string;
  @Expose() details!: string | null;
  @Expose() status!: string;
  @Expose() createdAt!: Date;
  @Expose() resolvedAt!: Date | null;
  @Expose() @Type(() => PublicUserRef) reporter!: PublicUserRef;
  @Expose() @Type(() => PublicUserRef) resolvedBy!: PublicUserRef | null;
}

export class ReportQueueResponse {
  @Expose() @Type(() => ReportResponse) reports!: ReportResponse[];
  @Expose() total!: number;
  @Expose() page!: number;
}
