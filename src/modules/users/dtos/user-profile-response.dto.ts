import { Expose, Type } from 'class-transformer';

class ReviewerResponse {
  @Expose() id!: string;
  @Expose() username!: string;
  @Expose() displayName!: string | null;
  @Expose() avatarUrl!: string | null;
}

export class ReviewResponse {
  @Expose() id!: string;
  @Expose() type!: string;
  @Expose() badges!: string[];
  @Expose() writtenReview!: string | null;
  @Expose() createdAt!: Date;

  @Expose()
  @Type(() => ReviewerResponse)
  reviewer!: ReviewerResponse;
}

export class UserProfileResponse {
  @Expose() id!: string;
  @Expose() username!: string;
  @Expose() displayName!: string | null;
  @Expose() avatarUrl!: string | null;
  @Expose() bio!: string | null;
  @Expose() preferredSystems!: string[];
  @Expose() playStyleTags!: string[];
  @Expose() timezone!: string | null;

  @Expose()
  @Type(() => ReviewResponse)
  reviews!: ReviewResponse[];
}
