import { Expose } from 'class-transformer';

export class AdminUserResponse {
  @Expose() id!: string;
  @Expose() username!: string;
  @Expose() displayName!: string | null;
  @Expose() avatarUrl!: string | null;
  @Expose() notificationEmail!: string;
  @Expose() role!: string;
  @Expose() bannedAt!: Date | null;
  @Expose() createdAt!: Date;
}
