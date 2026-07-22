import { layout } from './layout';

export const passwordResetEmail = (url: string) => ({
  subject: 'Reset your password',
  html: layout({
    heading: 'Reset your password',
    body: 'We got a request to reset your password. Tap below to choose a new one.',
    ctaLabel: 'Reset password',
    ctaUrl: url,
    footer:
      "This link expires in 1 hour. If you didn't request this, ignore this email — your password won't change.",
  }),
});
