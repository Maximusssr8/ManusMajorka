import { renderLayout, esc } from './_layout';
import type { RenderedEmail } from './welcome';

export interface TrialReminderData {
  firstName?: string;
  dashboardUrl?: string;
  unusedFeatures?: string[];
}

const DEFAULT_FEATURES = [
  'Store Builder — generate a full Shopify-ready store in 7 minutes',
  'Ads Studio — hook/script/creative bundles tuned for Meta + TikTok',
  'Competitor Spy — see which AU stores are scaling which products',
];

export function renderTrialReminder(data: TrialReminderData): RenderedEmail {
  const name = data.firstName?.trim() || 'there';
  const dashboardUrl = data.dashboardUrl || 'https://majorka.io/app';
  const features = (data.unusedFeatures && data.unusedFeatures.length > 0
    ? data.unusedFeatures
    : DEFAULT_FEATURES
  ).slice(0, 3);

  const subject = "2 days left — here's what you haven't tried yet";

  const featureList = features
    .map(
      (f) => `
      <li style="margin-bottom:12px;padding-left:4px;">
        <span style="color:#d4af37;">▸</span>&nbsp; ${esc(f)}
      </li>`,
    )
    .join('');

  const body = `
    <h1 style="font-family:'Syne',Arial,sans-serif;font-weight:800;font-size:26px;line-height:1.2;margin:0 0 16px 0;color:#f5f5f5;">
      ${esc(name)}, your trial ends in <span style="color:#d4af37;font-family:'JetBrains Mono',monospace;">2 days</span>.
    </h1>
    <p style="margin:0 0 20px 0;">
      You've explored part of Majorka. Three tools you haven't touched yet — any one of them could pay for the whole year:
    </p>
    <ul style="list-style:none;padding:0;margin:0 0 12px 0;color:#cfcfcf;">
      ${featureList}
    </ul>
    <p style="margin:16px 0 0 0;color:#a3a3a3;">
      Keep the momentum. Your next winning product is one dashboard click away.
    </p>
  `;

  const html = renderLayout({
    subject,
    preheader: '2 days left on your Majorka trial — unlock what you haven\'t tried yet.',
    body,
    cta: { href: dashboardUrl, label: 'Keep My Trial' },
  });

  return { subject, html };
}
