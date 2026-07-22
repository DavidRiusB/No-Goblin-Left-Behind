import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dtos/login.dto';
import type { Response } from 'express';
import { RegisterUserDto } from './dtos/refister.dto';
import { Throttle } from '@nestjs/throttler';
import { VerifyEmailDto } from './dtos/verify-email.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  get cookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
    };
  }

  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  async register(
    @Body() newUserData: RegisterUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.register(newUserData);
    const { access_token, user } = await this.authService.signin({
      email: newUserData.email,
      password: newUserData.password,
    });
    res.cookie('access_token', access_token, this.cookieOptions);
    return user; // <- Full User ?
  }

  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async login(
    @Body() credentials: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token, user } = await this.authService.signin(credentials);

    res.cookie('access_token', access_token, this.cookieOptions);

    return user; // <- return full user ?
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    return { ok: true };
  }

  // ── Email verification ─────────────────────────────────

  @Post('verify-email')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.authService.verifyEmail(dto.token);
    return { ok: true };
  }

  @Post('resend-verification')
  @Throttle({ default: { ttl: 300000, limit: 3 } }) // 3 per 5 min
  async resendVerification(@Body() dto: ForgotPasswordDto) {
    await this.authService.resendVerification(dto.email);
    return { ok: true }; // always ok — don't leak whether the account exists
  }

  // ── Password reset ─────────────────────────────────────

  @Post('forgot-password')
  @Throttle({ default: { ttl: 300000, limit: 3 } })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return { ok: true }; // always ok, existing account or not
  }

  @Post('reset-password')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.resetPassword(dto.token, dto.password);
    // password changed — kill the current session, force a fresh login
    res.clearCookie('access_token', this.cookieOptions);
    return { ok: true };
  }
}
