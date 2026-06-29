import { Expose, Type } from 'class-transformer';

class ManagementUserResponse {
  @Expose() id!: string;
  @Expose() username!: string;
  @Expose() displayName!: string | null;
  @Expose() avatarUrl!: string | null;
}

class ManagementMembershipResponse {
  @Expose() id!: string;
  @Expose() status!: string;
  @Expose() joinedAt!: Date;
  @Expose() endedAt!: Date | null;

  @Expose()
  @Type(() => ManagementUserResponse)
  user!: ManagementUserResponse;
}

class ManagementRequestResponse {
  @Expose() id!: string;
  @Expose() status!: string;
  @Expose() message!: string | null;
  @Expose() createdAt!: Date;

  @Expose()
  @Type(() => ManagementUserResponse)
  user!: ManagementUserResponse;
}

// the table block — DM sees links (their own table)
class ManagementTableResponse {
  @Expose() id!: string;
  @Expose() title!: string;
  @Expose() system!: string;
  @Expose() summary!: string;
  @Expose() details!: string | null;
  @Expose() houseRules!: string | null;
  @Expose() links!: string | null;
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
}

export class TableManagementResponse {
  @Expose()
  @Type(() => ManagementTableResponse)
  table!: ManagementTableResponse;

  @Expose()
  @Type(() => ManagementMembershipResponse)
  memberships!: ManagementMembershipResponse[];

  @Expose()
  @Type(() => ManagementRequestResponse)
  requests!: ManagementRequestResponse[];
}
