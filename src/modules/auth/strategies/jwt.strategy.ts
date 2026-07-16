import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Role } from 'src/common/enums/roles.enum';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UsersService,
  ) {
    super({
      jwtFromRequest: (req) =>
        req?.cookies?.access_token ??
        ExtractJwt.fromAuthHeaderAsBearerToken()(req) ??
        null,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      passReqToCallback: false,
    });
  }

  async validate(payload: { sub: string; email: string; role: Role }) {
    const user = await this.userService.findMe(payload.sub);
    if (user.bannedAt) throw new UnauthorizedException('Account suspended');
    return {
      userId: user.id,
      email: payload.email,
      role: user.role, // ← live role, not the token's stale claim
    };
  }
}
