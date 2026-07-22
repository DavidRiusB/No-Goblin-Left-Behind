export function layout(opts: {
  heading: string;
  body: string; // plain sentences, no markup needed
  ctaLabel: string;
  ctaUrl: string;
  footer?: string;
}) {
  const { heading, body, ctaLabel, ctaUrl, footer } = opts;
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#12101a;padding:32px 0;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#1a1725;border-radius:12px;padding:32px;">
      <tr><td style="color:#e8e5f0;font-size:20px;font-weight:bold;padding-bottom:16px;">
        ${heading}
      </td></tr>
      <tr><td style="color:#aaa3bf;font-size:14px;line-height:22px;padding-bottom:24px;">
        ${body}
      </td></tr>
      <tr><td>
        <a href="${ctaUrl}" style="display:inline-block;background:#7209b7;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:bold;">
          ${ctaLabel}
        </a>
      </td></tr>
      <tr><td style="color:#8b84a3;font-size:12px;line-height:18px;padding-top:24px;">
        ${footer ?? ''}
        <br><br>
        If the button doesn't work, paste this into your browser:<br>
        <span style="color:#aaa3bf;word-break:break-all;">${ctaUrl}</span>
      </td></tr>
    </table>
  </td></tr>
</table>`.trim();
}
