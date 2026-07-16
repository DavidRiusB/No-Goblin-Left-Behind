import { ForbiddenException } from '@nestjs/common';
import { Role } from '../enums/roles.enum';
import { atLeast } from '../helpers/role-rank.helper';

export function assertSelfOrStaff(
  userId: string,
  targetId: string,
  role: Role,
  minStaff: Role = Role.Admin,
): void {
  if (userId !== targetId && !atLeast(role, minStaff)) {
    throw new ForbiddenException('You can only access your own resources');
  }
}
