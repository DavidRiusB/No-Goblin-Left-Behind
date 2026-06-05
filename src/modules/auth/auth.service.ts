import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginUserDto } from './dtos/login.dto';
import { DataSource } from 'typeorm';
import { AuthRepository } from './auth.repository';
import { User } from '../users/entity/user.entity';
import {
  hashPassword,
  validateUserPassword,
} from 'src/utils/hashing/bycryp.utils';
import { JwtService } from '@nestjs/jwt';
import { RegisterUserDto } from './dtos/refister.dto';
import { UserRepository } from '../users/user.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
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

  async register(newUserData: RegisterUserDto): Promise<User> {
    let plainToken: string; // Email verification
    let createdUser: User;
    try {
      const result = await this.dataSource.transaction(async (manager) => {
        const hashedPassword = await hashPassword(newUserData.password);
        const user = await this.userRepository.create(newUserData, manager);
        await this.authRepository.create(
          {
            user,
            email: newUserData.email,
            passwordHash: hashedPassword,
          },
          manager,
        );
        return { user };
      });
      //email verification logic
      createdUser = result.user;
      return createdUser;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Registration failed');
    }
  }
}
