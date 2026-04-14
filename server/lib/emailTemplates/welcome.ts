import { renderLayout, esc } from './_layout';

export interface WelcomeData {
  firstName?: string;
  dashboardUrl?: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
}

export function renderWelcome(data: WelcomeData): RenderedEmail {
  const name = data.firstName?.trim() || 'there';
  const dashboardUrl = data.dashboardUrl || 'https://majorka.io/app';

  const subject = 'Welcome to Majorka — your first winning product awaits 🔥';

  const body = `
    <h1 style="font-family:'Syne',Arial,sans-serif;font-weight:800;font-size:28px;line-height:1.2;margin:0 0 16px 0;color:#f5f5f5;">
      Welcome, ${esc(name)}.
    </h1>
    <p style="margin:0 0 16px 0;">
      You now have the same AliExpress dropshipping intelligence engine that top AU operators use to find winners before the market saturates.
    </p>
    <p style="margin:0 0 8px 0;color:#a3a3a3;">Here's how to find your first winner in under 60 minutes:</p>
    <ol style="padding-left:20px;margin:8px 0 16px 0;color:#cfcfcf;">
      <li style="margin-bottom:8px;">Open <strong style="color:#f5f5f5;">Products</strong> — sort by Winning Score ≥ 90.</li>
      <li style="margin-bottom:8px;">Pick one with <span style="font-family:'JetBrains Mono',monospace;color:#d4af37;">est. daily revenue &gt; $500</span>.</li>
      <li style="margin-bottom:0;">Hit <strong style="color:#f5f5f5;">Build Store</strong> — AI generates a full storefront in ~7 minutes.</li>
    </ol>
    <p style="margin:0;color:#a3a3a3;">Your 7-day free trial is active. No card required until day 7.</p>
  `;

  const html = renderLayout({
    subject,
    preheader: 'Your Majorka account is live — find your first winning product in under 60 minutes.',
    body,
    cta: { href: dashboardUrl, label: 'Open Your Dashboard' },
  });

  return { subject, html };
}
