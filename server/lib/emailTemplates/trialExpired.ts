import { renderLayout, esc } from './_layout';
import type { RenderedEmail } from './welcome';

export interface TrialExpiredData {
  firstName?: string;
  upgradeUrl?: string;
}

export function renderTrialExpired(data: TrialExpiredData): RenderedEmail {
  const name = data.firstName?.trim() || 'there';
  const upgradeUrl = data.upgradeUrl || 'https://majorka.io/pricing?plan=scale';

  const subject = 'Your trial just ended — upgrade to keep your winners';

  const body = `
    <h1 style="font-family:'Syne',Arial,sans-serif;font-weight:800;font-size:26px;line-height:1.2;margin:0 0 16px 0;color:#f5f5f5;">
      Trial ended, ${esc(name)}.
    </h1>
    <p style="margin:0 0 16px 0;">
      Your 7-day Majorka trial just closed. Your saved products, lists, and alerts are frozen — nothing's lost yet.
    </p>
    <p style="margin:0 0 16px 0;color:#cfcfcf;">
      Upgrade to <strong style="color:#d4af37;">Scale</strong> and keep:
    </p>
    <ul style="padding-left:20px;margin:0 0 16px 0;color:#cfcfcf;">
      <li style="margin-bottom:6px;">Full product database access (${'<span style="font-family:\'JetBrains Mono\',monospace;color:#d4af37;">10,000+</span>'} AU-relevant winners)</li>
      <li style="margin-bottom:6px;">Unlimited AI store + ad creative generation</li>
      <li style="margin-bottom:0;">Real-time alerts on price, stock, and velocity changes</li>
    </ul>
    <p style="margin:0;color:#a3a3a3;font-size:13px;">
      <span style="font-family:'JetBrains Mono',monospace;">$199 AUD / month.</span> Cancel anytime.
    </p>
  `;

  const html = renderLayout({
    subject,
    preheader: 'Your Majorka trial just ended — upgrade to Scale to keep your winners.',
    body,
    cta: { href: upgradeUrl, label: 'Upgrade to Scale' },
  });

  return { subject, html };
}
