import {
  CanActivate,
  ExecutionContext,
  Injectable,
  mixin,
  type Type,
} from '@nestjs/common';
import { Role } from '../enums/roles.enum';
import { atLeast } from '../helpers/role-rank.helper';

/** Usage: @UseGuards(JwtAuthGuard, MinRole(Role.Admin))
 *  JwtAuthGuard must come first — this guard reads the user it attaches. */
export const MinRole = (min: Role): Type<CanActivate> => {
  @Injectable()
  class MinRoleGuard implements CanActivate {
    canActivate(ctx: ExecutionContext): boolean {
      const { user } = ctx.switchToHttp().getRequest();
      return !!user && atLeast(user.role, min);
    }
  }
  return mixin(MinRoleGuard);
};
