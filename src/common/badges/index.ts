import { GENERAL_BADGES } from './general-badges';
import { DM_BADGES } from './dm-badges';
import { PLAYER_BADGES } from './player-badges';
import { ReviewType } from 'src/common/enums/review-type.enum';

export { GENERAL_BADGES, DM_BADGES, PLAYER_BADGES };

// every valid badge, for a general "is this a real badge" check
export const ALL_BADGES: readonly string[] = [
  ...GENERAL_BADGES,
  ...DM_BADGES,
  ...PLAYER_BADGES,
];

// which badges are allowed for a given review type
export function allowedBadgesForType(type: ReviewType): readonly string[] {
  return type === ReviewType.DM
    ? [...GENERAL_BADGES, ...DM_BADGES]
    : [...GENERAL_BADGES, ...PLAYER_BADGES];
}
