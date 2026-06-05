import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dtos/login.dto';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  cookieOptions = {
    httpOnly: true,
    secure: false,
  };

  @Post('register')
  async register() {}

  @Post('login')
  async login(
    @Body() credentials: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token, user } = await this.authService.signin(credentials);

    res.cookie('access_token', access_token, this.cookieOptions);
    return user;
  }
}
