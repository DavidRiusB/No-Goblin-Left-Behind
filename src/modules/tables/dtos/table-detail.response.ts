import { Expose, Transform, Type } from 'class-transformer';

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

// a departed membership: the full user card + how the stint ended
class PastMemberResponse {
  @Expose() @Type(() => TableUserResponse) user!: TableUserResponse;
  @Expose() status!: string;
  @Expose() joinedAt!: Date;
  @Expose() endedAt!: Date | null;
}

// PUBLIC — no links, no history. the base shape.
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

  @Expose() @Type(() => TableUserResponse) dm!: TableUserResponse;
  @Expose() @Type(() => TableUserResponse) players!: TableUserResponse[];
  @Expose() @Transform(({ obj }) => !!obj.bannedAt) isBanned!: boolean;
}

// MEMBER — adds the private stuff: links + membership history
export class TableMemberDetailResponse extends TableDetailResponse {
  @Expose() links!: string | null;
  @Expose() @Type(() => PastMemberResponse) pastMembers!: PastMemberResponse[];
}
