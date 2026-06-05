import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginUserDto } from './dtos/login.dto';
import { DataSource } from 'typeorm';
import { AuthRepository } from './auth.repository';
import { User } from '../users/entity/user.entity';
import { validateUserPassword } from 'src/utils/hashing/bycryp.utils';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
  ) {}
  async signin(credentials: LoginUserDto) {
    const { email, password } = credentials;
    const credential = await this.authRepository.findByEmail(email);

    if (!credential) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const isValidPassword = await validateUserPassword(
      password,
      credential.passwordHash,
    );
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid email or password');
    }
    // 🔥 NEW: generate JWT
    const payload = {
      sub: credential.user.id,
      email: credential.email,
    };

    const access_token = await this.jwtService.signAsync(payload);
    return {
      access_token,
      user: credential.user,
    };
  }
}
