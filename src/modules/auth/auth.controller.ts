import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dtos/login.dto';
import type { Response } from 'express';
import { RegisterUserDto } from './dtos/refister.dto';

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
  async login(
    @Body() credentials: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token, user } = await this.authService.signin(credentials);

    res.cookie('access_token', access_token, this.cookieOptions);

    return user; // <- return full user ?
  }
}
