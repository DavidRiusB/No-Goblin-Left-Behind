import { layout } from './layout';

export const verificationEmail = (url: string) => ({
  subject: 'Confirm your email',
  html: layout({
    heading: 'Confirm your email',
    body: 'Tap the button below to verify your address and finish setting up your account.',
    ctaLabel: 'Verify email',
    ctaUrl: url,
    footer:
      "This link expires in 24 hours. If you didn't sign up, ignore this email.",
  }),
});
