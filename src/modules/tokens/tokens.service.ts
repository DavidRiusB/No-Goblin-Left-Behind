// src/tokens/tokens.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull, EntityManager } from 'typeorm';
import { randomBytes, createHash } from 'crypto';

import { TokenType } from 'src/common/enums/token-type.enum';
import { Token } from './entity/token.entity';
import { User } from '../users/entity/user.entity';

const TTL_MINUTES: Record<TokenType, number> = {
  [TokenType.EmailVerify]: 60 * 24, // 24h
  [TokenType.PasswordReset]: 60, // 1h — shorter on purpose
};

@Injectable()
export class TokensService {
  constructor(
    @InjectRepository(Token)
    private readonly repo: Repository<Token>,
  ) {}
  private getRepo(manager?: EntityManager): Repository<Token> {
    return manager ? manager.getRepository(Token) : this.repo;
  }

  private hash(raw: string) {
    return createHash('sha256').update(raw).digest('hex');
  }

  /** Returns the RAW token — email it, never log it. */
  async issue(userId: string, type: TokenType): Promise<string> {
    // one live token per user+type: kill the old ones
    await this.repo.update(
      { userId, type, usedAt: IsNull() },
      { usedAt: new Date() },
    );

    const raw = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + TTL_MINUTES[type] * 60_000);

    await this.repo.save(
      this.repo.create({ userId, type, tokenHash: this.hash(raw), expiresAt }),
    );
    return raw;
  }

  /** Validates + burns the token. Returns userId, or null if invalid/expired/used. */
  async consume(
    raw: string,
    type: TokenType,
    manager?: EntityManager,
  ): Promise<User | null> {
    const repo = this.getRepo(manager);
    const token = await repo.findOne({
      where: { tokenHash: this.hash(raw), type },
      relations: { user: true },
    });
    if (!token) return null;
    if (token.usedAt) return null;
    if (token.expiresAt.getTime() < Date.now()) return null;

    token.usedAt = new Date();
    await repo.save(token);
    return token.user;
  }

  /** Optional housekeeping — call from a cron if you add one. */
  async purgeExpired() {
    await this.repo.delete({ expiresAt: LessThan(new Date()) });
  }
}
