import { Expose, Type } from 'class-transformer';
import { BadgeResponse } from 'src/modules/badges/dtos/badge-response.dto';
import {
  ReviewerResponse,
  ReviewResponse,
  UserProfileResponse,
} from 'src/modules/users/dtos/user-profile-response.dto';

class TableRefResponse {
  @Expose() id!: string;
  @Expose() title!: string;
}

export class WrittenReviewResponse {
  @Expose() id!: string;
  @Expose() type!: string;
  @Expose() @Type(() => BadgeResponse) badges!: BadgeResponse[];
  @Expose() writtenReview!: string | null;
  @Expose() createdAt!: Date;
  @Expose() @Type(() => ReviewerResponse) targetUser!: ReviewerResponse;
  @Expose() @Type(() => TableRefResponse) table!: TableRefResponse;
}
