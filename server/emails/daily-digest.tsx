/**
 * daily-digest — personalised "today's trending products" email (Engagement Director).
 *
 * Implemented as a plain-HTML render function (no JSX / React Email dep) so it
 * slots into the existing Majorka email layout without a new build pipeline.
 * Exposed as `renderDailyDigest(data)` to match the weekly-digest pattern.
 */

import { renderLayout, esc } from '../lib/emailTemplates/_layout';

export interface DigestDigestProduct {
  id: string | null;
  title: string | null;
  image_url: string | null;
  price_aud: number | null;
  sold_count: number | null;
  winning_score: number | null;
  velocity_7d: number | null;
}

export interface DailyDigestData {
  firstName?: string | null;
  niche?: string | null;
  today: string; // ISO date (yyyy-mm-dd)
  products: ReadonlyArray<DigestDigestProduct>;
  dashboardUrl?: string;
}

function fmtPrice(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return '';
  return `$${n.toFixed(2)}`;
}

function fmtSold(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

function velocityBadge(score: number | null): { label: string; colour: string } {
  if (score == null || !Number.isFinite(score)) return { label: '—', colour: '#6b6b6b' };
  if (score >= 90) return { label: `${Math.round(score)}`, colour: '#10b981' };
  if (score >= 75) return { label: `${Math.round(score)}`, colour: '#f59e0b' };
  return { label: `${Math.round(score)}`, colour: '#f97316' };
}

function productCard(p: DigestDigestProduct, index: number): string {
  const title = esc(p.title ?? 'Untitled product');
  const href = p.id
    ? `https://www.majorka.io/app/products/${encodeURIComponent(p.id)}`
    : 'https://www.majorka.io/app/products';
  const img = p.image_url
    ? `https://www.majorka.io/api/image-proxy?url=${encodeURIComponent(p.image_url)}`
    : '';
  const badge = velocityBadge(p.winning_score);
  const price = fmtPrice(p.price_aud);
  const sold = fmtSold(p.sold_count);

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="margin:${index === 0 ? 0 : 12}px 0 0 0;background:#161616;border:1px solid #1f1f1f;border-radius:12px;">
      <tr>
        <td style="padding:14px 16px;" valign="top">
          <a href="${esc(href)}" style="text-decoration:none;color:inherit;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="72" valign="top" style="padding-right:14px;">
                  ${img
                    ? `<img src="${esc(img)}" width="72" height="72" alt=""
                        style="display:block;width:72px;height:72px;border-radius:8px;object-fit:cover;background:#0a0a0a;" />`
                    : `<div style="width:72px;height:72px;border-radius:8px;background:#0a0a0a;"></div>`}
                </td>
                <td valign="top">
                  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;
                              font-size:14px;font-weight:600;color:#f5f5f5;line-height:1.35;margin-bottom:6px;">
                    ${title}
                  </div>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="padding-right:10px;">
                        <span style="display:inline-block;padding:3px 8px;border-radius:999px;
                                     background:${badge.colour}1a;color:${badge.colour};
                                     font-family:'JetBrains Mono',Menlo,Consolas,monospace;font-size:11px;font-weight:700;">
                          TVS ${badge.label}
                        </span>
                      </td>
                      <td style="padding-right:10px;color:#9a9a9a;font-size:12px;">
                        ${esc(sold)} sold
                      </td>
                      <td style="color:#d4af37;font-family:'JetBrains Mono',Menlo,Consolas,monospace;
                                 font-size:13px;font-weight:700;">
                        ${esc(price)}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </a>
        </td>
      </tr>
    </table>
  `;
}

export function renderDailyDigest(data: DailyDigestData): { subject: string; html: string } {
  const name = data.firstName?.trim() || 'there';
  const nicheSuffix = data.niche ? ` in ${esc(data.niche)}` : '';
  const intro = `
    <p style="margin:0 0 8px 0;color:#9a9a9a;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">
      Majorka Daily · ${esc(data.today)}
    </p>
    <h1 style="margin:0 0 12px 0;font-family:'Syne',Arial,sans-serif;font-size:24px;font-weight:800;color:#f5f5f5;">
      Good morning, ${esc(name)}.
    </h1>
    <p style="margin:0 0 24px 0;color:#cfcfcf;font-size:15px;line-height:1.7;">
      Here's what's trending${nicheSuffix} today — five products with the strongest velocity in the last 24 hours.
    </p>
  `;

  const cards = data.products.map((p, i) => productCard(p, i)).join('\n');

  const body = `
    ${intro}
    ${cards}
    <div style="height:24px;"></div>
    <p style="margin:0;color:#9a9a9a;font-size:13px;">
      Digest tuned daily from Majorka's AliExpress + TikTok Shop intelligence feed.
    </p>
  `;

  const dashboardUrl = data.dashboardUrl ?? 'https://www.majorka.io/app/products';

  return {
    subject: `Majorka Daily — 5 trending picks for ${data.today}`,
    html: renderLayout({
      subject: `Majorka Daily — 5 trending picks for ${data.today}`,
      preheader: 'Five AU-ready winning products curated for you this morning.',
      body,
      cta: { href: dashboardUrl, label: 'View all trending products' },
    }),
  };
}
