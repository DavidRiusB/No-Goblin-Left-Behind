import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  Logger,
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
import { TokensService } from '../tokens/tokens.service';
import { TokenType } from 'src/common/enums/token-type.enum';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly dataSource: DataSource,
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokensService,
    private readonly mailService: MailService,
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
    let createdUser: User;
    try {
      createdUser = await this.dataSource.transaction(async (manager) => {
        const hashedPassword = await hashPassword(newUserData.password);
        const user = await this.userRepository.create(newUserData, manager);
        await this.authRepository.create(
          { user, email: newUserData.email, passwordHash: hashedPassword },
          manager,
        );
        return user;
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Registration failed', error as Error);
      throw new InternalServerErrorException('Registration failed');
    }

    // post-commit: neither of these should be able to fail the signup
    try {
      const token = await this.tokenService.issue(
        createdUser.id,
        TokenType.EmailVerify,
      );
      await this.mailService.sendVerification(
        createdUser.notificationEmail,
        token,
      );
    } catch (error) {
      this.logger.error(
        `Verification mail failed for ${createdUser.id}`,
        error as Error,
      );
    }

    return createdUser;
  }

  async verifyEmail(rawToken: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const user = await this.tokenService.consume(
        rawToken,
        TokenType.EmailVerify,
        manager,
      );
      if (!user) {
        throw new BadRequestException('Invalid or expired verification link');
      }
      user.verified = true;
      await this.userRepository.update(user, manager);
    });
  }

  async resendVerification(email: string): Promise<void> {
    const auth = await this.authRepository.findByEmail(email);

    // no account, or already verified — return silently either way
    if (!auth || auth.user.verified) return;

    try {
      const token = await this.tokenService.issue(
        auth.user.id,
        TokenType.EmailVerify,
      );
      await this.mailService.sendVerification(email, token);
    } catch (error) {
      this.logger.error(
        `Resend verification failed for ${email}`,
        error as Error,
      );
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const auth = await this.authRepository.findByEmail(email);
    if (!auth) return; // silent — same response as a real account

    try {
      const token = await this.tokenService.issue(
        auth.user.id,
        TokenType.PasswordReset,
      );
      await this.mailService.sendPasswordReset(email, token);
    } catch (error) {
      this.logger.error(
        `Password reset mail failed for ${email}`,
        error as Error,
      );
    }
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const user = await this.tokenService.consume(
      rawToken,
      TokenType.PasswordReset,
    );
    if (!user) {
      throw new BadRequestException('Invalid or expired reset link');
    }

    const passwordHash = await hashPassword(newPassword);
    await this.authRepository.updatePassword(user, passwordHash);
  }
}
