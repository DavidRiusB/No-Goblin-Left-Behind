import { ForbiddenException } from '@nestjs/common';
import { Role } from '../enums/roles.enum';

export function assertSelfOrAdmin(
  userId: string,
  targetId: string,
  role: Role,
): void {
  if (role !== Role.Admin && userId !== targetId) {
    throw new ForbiddenException('You can only access your own resources');
  }
}
