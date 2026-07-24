import { Expose } from 'class-transformer';

export class BadgeResponse {
  @Expose() code!: string;
  @Expose() label!: string;
  @Expose() description!: string | null;
  @Expose() icon!: string;
  @Expose() category!: string;
  @Expose() appliesTo!: string | null;
  @Expose() iconUrl!: string | null;
}
