import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: (req) =>
        req?.cookies?.access_token ??
        ExtractJwt.fromAuthHeaderAsBearerToken()(req) ??
        null,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      passReqToCallback: false,
    });
  }

  async validate(payload: { sub: string; email: string }) {
    return {
      userId: payload.sub,
      email: payload.email,
    };
  }
}
