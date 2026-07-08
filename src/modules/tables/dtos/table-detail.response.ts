import { Expose, Type } from 'class-transformer';

class BadgeSummaryResponse {
  @Expose() code!: string;
  @Expose() label!: string;
  @Expose() icon!: string;
  @Expose() count!: number;
}

export class TableUserResponse {
  @Expose() id!: string;
  @Expose() username!: string;
  @Expose() displayName!: string | null;
  @Expose() avatarUrl!: string | null;
  @Expose() @Type(() => BadgeSummaryResponse) badges!: BadgeSummaryResponse[];
  @Expose() reviewCount!: number;
}

// PUBLIC — no links. the base shape.
export class TableDetailResponse {
  @Expose() id!: string;
  @Expose() title!: string;
  @Expose() system!: string;
  @Expose() summary!: string;
  @Expose() details!: string | null;
  @Expose() houseRules!: string | null;
  @Expose() tableType!: string;
  @Expose() experienceLevel!: string;
  @Expose() recurrence!: string;
  @Expose() scheduledAt!: Date;
  @Expose() timezone!: string;
  @Expose() estimatedDurationHours!: number | null;
  @Expose() isOnline!: boolean;
  @Expose() platform!: string;
  @Expose() location!: string | null;
  @Expose() seatsTotal!: number;
  @Expose() language!: string;
  @Expose() ageRequirement!: string;
  @Expose() status!: string;

  @Expose()
  @Type(() => TableUserResponse)
  dm!: TableUserResponse;

  @Expose()
  @Type(() => TableUserResponse)
  players!: TableUserResponse[];
}

// MEMBER — everything public + the one private field.
export class TableMemberDetailResponse extends TableDetailResponse {
  @Expose() links!: string | null;
}
