// src/mail/mail.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { verificationEmail } from './templates/verification';
import { passwordResetEmail } from './templates/password-reset';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;
  private readonly from: string;
  private readonly appUrl: string;

  constructor(config: ConfigService) {
    this.resend = new Resend(config.getOrThrow<string>('RESEND_API_KEY'));
    this.from = config.getOrThrow<string>('MAIL_FROM');
    this.appUrl = config.getOrThrow<string>('APP_URL');
  }

  async sendVerification(to: string, rawToken: string) {
    const url = `${this.appUrl}/verify-email?token=${encodeURIComponent(rawToken)}`;
    await this.send(to, verificationEmail(url));
  }

  async sendPasswordReset(to: string, rawToken: string) {
    const url = `${this.appUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
    await this.send(to, passwordResetEmail(url));
  }

  /** Never throws — a mail outage must not break the calling flow. */
  private async send(to: string, msg: { subject: string; html: string }) {
    try {
      const { error } = await this.resend.emails.send({
        from: this.from,
        to,
        subject: msg.subject,
        html: msg.html,
      });
      if (error)
        this.logger.error(`Resend rejected mail to ${to}: ${error.message}`);
    } catch (e) {
      this.logger.error(`Mail send failed to ${to}`, e as Error);
    }
  }
}
