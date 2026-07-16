import { Role } from '../enums/roles.enum';

const rank: Record<Role, number> = {
  [Role.User]: 0,
  [Role.Moderator]: 1,
  [Role.Admin]: 2,
  [Role.SuperAdmin]: 3,
};

/** true if `role` is at least `min` in the hierarchy (each tier includes all below) */
export const atLeast = (role: Role, min: Role) => rank[role] >= rank[min];
