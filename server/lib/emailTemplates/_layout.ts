/**
 * Shared HTML layout for Majorka transactional emails.
 * Dark luxury aesthetic: #080808 bg, #d4af37 gold accents,
 * Syne heading / JetBrains Mono numbers (Google Fonts).
 */

const UNSUBSCRIBE_URL = 'https://majorka.io/unsubscribe';

export interface LayoutOptions {
  subject: string;
  preheader?: string;
  body: string;
  cta?: { href: string; label: string } | null;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderCta(href: string, label: string): string {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:32px 0 8px 0;">
      <tr>
        <td align="center" bgcolor="#d4af37" style="border-radius:8px;">
          <a href="${safeHref}"
             style="display:inline-block;padding:14px 32px;font-family:'JetBrains Mono',Menlo,Consolas,monospace;
                    font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;
                    color:#080808;text-decoration:none;border-radius:8px;">
            ${safeLabel}
          </a>
        </td>
      </tr>
    </table>`;
}

export function renderLayout({ subject, preheader, body, cta }: LayoutOptions): string {
  const safePre = preheader ? escapeHtml(preheader) : '';
  const ctaHtml = cta ? renderCta(cta.href, cta.label) : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <title>${escapeHtml(subject)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#080808;color:#e7e7e7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <span style="display:none !important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;">${safePre}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#080808;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
               style="max-width:600px;width:100%;background:#111111;border:1px solid #1a1a1a;border-radius:16px;">
          <tr>
            <td style="padding:32px 40px 0 40px;">
              <div style="font-family:'Syne',Arial,sans-serif;font-weight:800;font-size:22px;letter-spacing:0.14em;color:#f5f5f5;">
                MAJORKA<span style="color:#d4af37;">.</span>
              </div>
              <div style="height:1px;background:linear-gradient(90deg,#d4af37,transparent);margin-top:20px;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 40px 40px 40px;font-size:15px;line-height:1.7;color:#cfcfcf;">
              ${body}
              ${ctaHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px 32px 40px;border-top:1px solid #1a1a1a;color:#6b6b6b;font-size:12px;line-height:1.6;">
              <a href="${UNSUBSCRIBE_URL}" style="color:#8a8a8a;text-decoration:underline;">Unsubscribe</a>
              &nbsp;·&nbsp; Majorka Pty Ltd &nbsp;·&nbsp; Sydney, AU &nbsp;·&nbsp;
              <a href="https://majorka.io" style="color:#d4af37;text-decoration:none;">majorka.io</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export const esc = escapeHtml;
