/**
 * Weekly digest email — fires Sunday 09:00 AEST to every active subscriber.
 * Matches the dark gold aesthetic from _layout.ts.
 *
 * Content blocks:
 *   1. Top 3 trending products in the subscriber's niche (fallback: all niches)
 *   2. Next uncompleted Academy lesson in their active track
 *   3. Maya tip of the week
 */
import { renderLayout, esc } from './_layout';

export interface DigestProduct {
  id: string;
  title: string | null;
  category: string | null;
  price_aud: number | null;
  winning_score: number | null;
  velocity_7d: number | null;
  image_url: string | null;
}

export interface DigestLessonRec {
  trackTitle: string;
  lessonNum: string;
  lessonTitle: string;
  url: string;
}

export interface WeeklyDigestData {
  firstName?: string;
  niche?: string | null;
  weekOf: string; // ISO date (Sunday)
  products: DigestProduct[];
  lesson: DigestLessonRec | null;
  mayaTip: string;
  dashboardUrl?: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
}

function formatAUD(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return `$${n.toFixed(n < 10 ? 2 : 0)}`;
}

function formatVelocity(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return '—';
  const rounded = Math.min(999, Math.round(v));
  return `${rounded >= 0 ? '+' : ''}${rounded}%`;
}

function productRow(p: DigestProduct, rank: number): string {
  const score = p.winning_score != null ? Math.round(p.winning_score) : null;
  const title = p.title ? esc(p.title.length > 72 ? `${p.title.slice(0, 69)}…` : p.title) : 'Untitled';
  const scorePill = score != null
    ? `<span style="display:inline-block;padding:2px 8px;border-radius:6px;background:#d4af37;color:#080808;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;">${score}</span>`
    : '';
  const velocity = p.velocity_7d != null
    ? `<span style="color:#34d399;font-family:'JetBrains Mono',monospace;font-size:11px;">${esc(formatVelocity(p.velocity_7d))}</span>`
    : '';
  return `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid #1a1a1a;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="28" valign="top" style="font-family:'JetBrains Mono',monospace;color:#d4af37;font-size:13px;font-weight:700;">
              ${rank}.
            </td>
            <td valign="top">
              <div style="color:#f5f5f5;font-size:14px;font-weight:600;line-height:1.4;margin-bottom:4px;">${title}</div>
              <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#8a8a8a;">
                ${esc(p.category || 'Uncategorised')} &nbsp;·&nbsp; ${esc(formatAUD(p.price_aud))} AUD ${velocity ? '&nbsp;·&nbsp; ' + velocity : ''}
              </div>
            </td>
            <td width="48" align="right" valign="top">${scorePill}</td>
          </tr>
        </table>
      </td>
    </tr>`;
}

export function renderWeeklyDigest(data: WeeklyDigestData): RenderedEmail {
  const name = data.firstName?.trim() || 'there';
  const dashboardUrl = data.dashboardUrl || 'https://majorka.io/app';
  const niche = data.niche?.trim() || null;

  const weekLabel = (() => {
    try {
      const d = new Date(data.weekOf);
      return d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' });
    } catch {
      return data.weekOf;
    }
  })();

  const subject = niche
    ? `Your weekly ${niche} intelligence — ${weekLabel}`
    : `Your Majorka weekly digest — ${weekLabel}`;

  const productsBlock = data.products.length > 0
    ? `
      <h2 style="font-family:'Syne',Arial,sans-serif;font-weight:800;font-size:20px;line-height:1.2;margin:28px 0 4px 0;color:#f5f5f5;">
        Top 3 trending this week${niche ? ` in ${esc(niche)}` : ''}
      </h2>
      <p style="margin:0 0 12px 0;color:#8a8a8a;font-size:13px;">
        Ranked by 7-day velocity. Winning score in gold.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">
        ${data.products.slice(0, 3).map((p, i) => productRow(p, i + 1)).join('')}
      </table>`
    : '';

  const lessonBlock = data.lesson
    ? `
      <h2 style="font-family:'Syne',Arial,sans-serif;font-weight:800;font-size:20px;line-height:1.2;margin:36px 0 4px 0;color:#f5f5f5;">
        Next up in your Academy track
      </h2>
      <div style="margin:12px 0 0 0;padding:16px 20px;background:#0d0d0d;border:1px solid #1a1a1a;border-left:3px solid #d4af37;border-radius:8px;">
        <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#d4af37;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">
          ${esc(data.lesson.trackTitle)} · Lesson ${esc(data.lesson.lessonNum)}
        </div>
        <div style="color:#f5f5f5;font-size:15px;font-weight:600;line-height:1.4;margin-bottom:10px;">
          ${esc(data.lesson.lessonTitle)}
        </div>
        <a href="${esc(data.lesson.url)}" style="font-family:'JetBrains Mono',monospace;font-size:12px;color:#d4af37;text-decoration:none;font-weight:600;">
          Open lesson →
        </a>
      </div>`
    : '';

  const mayaBlock = data.mayaTip
    ? `
      <h2 style="font-family:'Syne',Arial,sans-serif;font-weight:800;font-size:20px;line-height:1.2;margin:36px 0 4px 0;color:#f5f5f5;">
        Maya&rsquo;s tip of the week
      </h2>
      <div style="margin:12px 0 0 0;padding:18px 22px;background:linear-gradient(180deg,rgba(212,175,55,0.06),rgba(212,175,55,0.01));border:1px solid rgba(212,175,55,0.18);border-radius:10px;color:#cfcfcf;font-size:14px;line-height:1.65;">
        ${esc(data.mayaTip)}
      </div>`
    : '';

  const body = `
    <h1 style="font-family:'Syne',Arial,sans-serif;font-weight:800;font-size:26px;line-height:1.2;margin:0 0 6px 0;color:#f5f5f5;">
      Good morning, ${esc(name)}.
    </h1>
    <p style="margin:0 0 16px 0;color:#a3a3a3;font-size:14px;">
      Here&rsquo;s what shifted in the AliExpress data while you were offline — plus one lesson and one Maya tip to tighten your week.
    </p>
    ${productsBlock}
    ${lessonBlock}
    ${mayaBlock}
    <p style="margin:36px 0 0 0;color:#6b6b6b;font-size:12px;line-height:1.6;">
      Sent every Sunday 9am AEST. Built for AU operators. Unsubscribe anytime — we won&rsquo;t take it personally.
    </p>
  `;

  const html = renderLayout({
    subject,
    preheader: `${data.products.length} new trending products and your next Academy lesson.`,
    body,
    cta: { href: dashboardUrl, label: 'Open Majorka' },
  });

  return { subject, html };
}
