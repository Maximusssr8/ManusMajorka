/**
 * Onboarding email sequence for Majorka.
 * 3 emails: welcome (day 0), engagement (day 2), conversion (day 5).
 * Uses Resend API directly.
 */
import { Resend } from 'resend';

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const FROM = 'Majorka AI <hello@majorka.ai>';
const APP_URL = process.env.VITE_APP_URL ?? 'https://majorka.ai';

// ── Email 1 — Day 0: Welcome ──────────────────────────────────────────────────

function welcomeEmail1(name: string): string {
  const firstName = name?.split(' ')[0] || 'there';
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#080a0e;font-family:-apple-system,BlinkMacSystemFont,'DM Sans',sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px">
    <!-- Logo -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:32px">
      <div style="width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,#d4af37,#f0c040);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:18px;color:#080a0e;font-family:Syne,sans-serif">M</div>
      <span style="color:#d4af37;font-weight:700;font-size:18px;font-family:Syne,sans-serif">Majorka</span>
    </div>

    <!-- Hero -->
    <h1 style="color:#f5f5f5;font-size:28px;font-weight:800;margin:0 0 8px;font-family:Syne,sans-serif">
      Welcome to Majorka, ${firstName}! 🚀
    </h1>
    <p style="color:#94949e;font-size:16px;line-height:1.6;margin:0 0 28px">
      Your AU dropshipping edge starts now. While your competitors are guessing, you'll be using AI to find winning products before they even know they exist.
    </p>

    <!-- Free market report CTA -->
    <div style="background:#0c0c10;border:1px solid rgba(212,175,55,0.25);border-radius:12px;padding:24px;margin-bottom:28px">
      <p style="color:#d4af37;font-weight:700;font-size:14px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px">🎁 Your Free AU Market Report</p>
      <p style="color:#e5e7eb;font-size:15px;line-height:1.6;margin:0 0 16px">
        We've already pulled today's top 10 trending products for the Australian market. Products with strong profit margins, low saturation, and Afterpay-friendly price points.
      </p>
      <a href="${APP_URL}/app/winning-products" style="display:inline-block;background:linear-gradient(135deg,#d4af37,#b8941f);color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;font-family:Syne,sans-serif">
        View Winning Products →
      </a>
    </div>

    <!-- What you get -->
    <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:24px;margin-bottom:28px">
      <p style="color:#f5f5f5;font-weight:700;font-size:16px;margin:0 0 16px">Here's what's inside your dashboard:</p>
      <table style="width:100%;border-collapse:collapse">
        ${[
          ['🔍', 'Winning Products', 'Daily AU market intel, sourced and validated'],
          ['🕵️', 'Competitor Spy', 'See exactly what ads your competitors are running'],
          ['📈', 'Saturation Checker', 'Know if a product is oversaturated before you invest'],
          ['🌐', 'Website Generator', 'Build an AU Shopify-ready store in 60 seconds'],
          ['✍️', 'Ad Copywriter', 'High-converting Meta + TikTok ads, done in seconds'],
        ].map(([icon, title, desc]) => `
        <tr>
          <td style="padding:8px 0;width:32px;font-size:20px;vertical-align:top">${icon}</td>
          <td style="padding:8px 12px 8px 8px;vertical-align:top">
            <span style="color:#f5f5f5;font-weight:600;font-size:14px">${title}</span>
            <br><span style="color:#94949e;font-size:13px">${desc}</span>
          </td>
        </tr>`).join('')}
      </table>
    </div>

    <a href="${APP_URL}/app" style="display:block;text-align:center;background:linear-gradient(135deg,#d4af37,#b8941f);color:#000;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;font-family:Syne,sans-serif;margin-bottom:32px">
      Open Your Dashboard →
    </a>

    <!-- Footer -->
    <p style="color:#52525b;font-size:12px;text-align:center;margin:0">
      Majorka AI · Built for Australian dropshippers · <a href="${APP_URL}" style="color:#d4af37;text-decoration:none">majorka.ai</a>
      <br>You received this because you created a Majorka account.
      <a href="${APP_URL}/account" style="color:#52525b;text-decoration:underline;margin-left:4px">Manage preferences</a>
    </p>
  </div>
</body>
</html>`;
}

// ── Email 2 — Day 2: The missing product ─────────────────────────────────────

function welcomeEmail2(name: string): string {
  const firstName = name?.split(' ')[0] || 'there';
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#080a0e;font-family:-apple-system,BlinkMacSystemFont,'DM Sans',sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:32px">
      <div style="width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,#d4af37,#f0c040);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:18px;color:#080a0e;font-family:Syne,sans-serif">M</div>
      <span style="color:#d4af37;font-weight:700;font-size:18px;font-family:Syne,sans-serif">Majorka</span>
    </div>

    <h1 style="color:#f5f5f5;font-size:26px;font-weight:800;margin:0 0 8px;font-family:Syne,sans-serif">
      The #1 product Aussie dropshippers are missing 👀
    </h1>
    <p style="color:#94949e;font-size:15px;line-height:1.6;margin:0 0 24px">
      Hey ${firstName}, quick one — most AU sellers are still chasing the same products they saw on TikTok 6 weeks ago. By the time they launch, the market's saturated.
    </p>

    <div style="background:#0c0c10;border-left:3px solid #d4af37;padding:20px 24px;border-radius:0 8px 8px 0;margin-bottom:24px">
      <p style="color:#f5f5f5;font-size:15px;line-height:1.7;margin:0">
        <strong style="color:#d4af37">The real edge?</strong> Finding products <em>before</em> saturation hits. Products with strong AU demand, untapped audiences, and 4–8x margins are sitting in our database right now. Most sellers don't even know to look.
      </p>
    </div>

    <p style="color:#e5e7eb;font-size:15px;line-height:1.6;margin:0 0 24px">
      Majorka's Winning Products tool scans 50+ data sources daily — TikTok trends, AliExpress velocity, AU Google Trends, and ad spend patterns — to surface products hitting velocity <em>before</em> your competition.
    </p>

    <div style="background:#131318;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;margin-bottom:24px">
      <p style="color:#d4af37;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 12px">🔥 Today's Early Signal Products</p>
      ${['LED Desk Lamp with wireless charger — AU search +340% MoM', 'Posture corrector harness — TikTok AU 12M views, low Shopify competition', 'Smart water bottle (hydration tracker) — repeat buyer rate 2.3x'].map(p => `
      <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px">
        <span style="color:#2dca72;font-size:16px;margin-top:1px">✦</span>
        <p style="color:#e5e7eb;font-size:14px;margin:0;line-height:1.5">${p}</p>
      </div>`).join('')}
    </div>

    <a href="${APP_URL}/app/winning-products" style="display:block;text-align:center;background:linear-gradient(135deg,#d4af37,#b8941f);color:#000;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;font-family:Syne,sans-serif;margin-bottom:32px">
      See All Winning Products →
    </a>

    <p style="color:#52525b;font-size:12px;text-align:center;margin:0">
      Majorka AI · <a href="${APP_URL}" style="color:#d4af37;text-decoration:none">majorka.ai</a>
      <br><a href="${APP_URL}/account" style="color:#52525b;text-decoration:underline">Unsubscribe</a>
    </p>
  </div>
</body>
</html>`;
}

// ── Email 3 — Day 5: Case study + upgrade CTA ─────────────────────────────────

function welcomeEmail3(name: string): string {
  const firstName = name?.split(' ')[0] || 'there';
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#080a0e;font-family:-apple-system,BlinkMacSystemFont,'DM Sans',sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:32px">
      <div style="width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,#d4af37,#f0c040);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:18px;color:#080a0e;font-family:Syne,sans-serif">M</div>
      <span style="color:#d4af37;font-weight:700;font-size:18px;font-family:Syne,sans-serif">Majorka</span>
    </div>

    <h1 style="color:#f5f5f5;font-size:26px;font-weight:800;margin:0 0 8px;font-family:Syne,sans-serif">
      3 AU stores making $10k+/mo — what they share 📊
    </h1>
    <p style="color:#94949e;font-size:15px;line-height:1.6;margin:0 0 24px">
      Hey ${firstName}, we've been looking at the AU dropshipping stores that are consistently doing 5-figures per month. Here's the pattern we found.
    </p>

    ${[
      { title: 'Store #1: Gold Coast Wellness Co', revenue: '$14,200/mo', detail: 'Found their hero product via trend velocity data. $8 COGS → $49 sell. Afterpay boosted AOV by 35%. Running 3 Meta ad sets, all based on AI-written hooks.' },
      { title: 'Store #2: Sydney Home Edit', revenue: '$11,800/mo', detail: 'Niche: eco homeware. Used competitor spy to reverse-engineer their top competitor\'s winning ads, then made them better. Time from idea to first sale: 11 days.' },
      { title: 'Store #3: Perth Outdoor Gear', revenue: '$17,500/mo', detail: 'Seasonal product, but pre-identified 8 weeks early using AU Google Trends data. Stocked up, launched before saturation. Now owns the niche.' },
    ].map(s => `
    <div style="background:#0c0c10;border:1px solid rgba(212,175,55,0.15);border-radius:12px;padding:20px;margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
        <p style="color:#f5f5f5;font-weight:700;font-size:15px;margin:0">${s.title}</p>
        <span style="background:rgba(45,202,114,0.15);color:#2dca72;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:700;white-space:nowrap;margin-left:12px">${s.revenue}</span>
      </div>
      <p style="color:#94949e;font-size:14px;line-height:1.6;margin:0">${s.detail}</p>
    </div>`).join('')}

    <div style="background:linear-gradient(135deg,rgba(212,175,55,0.1),rgba(212,175,55,0.05));border:1px solid rgba(212,175,55,0.25);border-radius:12px;padding:24px;margin-bottom:28px">
      <p style="color:#d4af37;font-weight:700;font-size:16px;margin:0 0 8px;font-family:Syne,sans-serif">What they all used: Majorka Pro</p>
      <p style="color:#e5e7eb;font-size:14px;line-height:1.6;margin:0 0 16px">
        Unlimited AI tool calls, advanced competitor intelligence, automated product scoring, and the full ad creative suite. Starting at $79 AUD/mo — less than a single Facebook ad test.
      </p>
      <a href="${APP_URL}/pricing" style="display:inline-block;background:linear-gradient(135deg,#d4af37,#b8941f);color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;font-family:Syne,sans-serif">
        Upgrade to Pro →
      </a>
    </div>

    <p style="color:#52525b;font-size:12px;text-align:center;margin:0">
      Majorka AI · <a href="${APP_URL}" style="color:#d4af37;text-decoration:none">majorka.ai</a>
      <br><a href="${APP_URL}/account" style="color:#52525b;text-decoration:underline">Unsubscribe</a>
    </p>
  </div>
</body>
</html>`;
}

// ── Send functions ────────────────────────────────────────────────────────────

/**
 * Send the immediate welcome email (day 0).
 * Called on new user signup.
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn('[onboarding-emails] RESEND_API_KEY not set — skipping welcome email');
    return;
  }
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: 'Welcome to Majorka — Your AU dropshipping edge starts now 🚀',
      html: welcomeEmail1(name),
    });
  } catch (err: any) {
    console.error('[onboarding-emails] Failed to send welcome email:', err.message);
  }
}

/**
 * Send the day-2 engagement email.
 */
export async function sendDay2Email(email: string, name: string): Promise<void> {
  const resend = getResend();
  if (!resend) return;
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: 'The #1 product Aussie dropshippers are missing right now 👀',
      html: welcomeEmail2(name),
    });
  } catch (err: any) {
    console.error('[onboarding-emails] Failed to send day-2 email:', err.message);
  }
}

/**
 * Send the day-5 case study / upgrade email.
 */
export async function sendDay5Email(email: string, name: string): Promise<void> {
  const resend = getResend();
  if (!resend) return;
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: '3 stores making $10k+/month — what they have in common 📊',
      html: welcomeEmail3(name),
    });
  } catch (err: any) {
    console.error('[onboarding-emails] Failed to send day-5 email:', err.message);
  }
}

/**
 * Trigger the full welcome sequence.
 * Email 1 is sent immediately. Emails 2 & 3 would be sent by a scheduled job
 * (n8n workflow or cron) — this function sends email 1 only.
 */
export async function sendWelcomeSequence(email: string, name: string): Promise<void> {
  await sendWelcomeEmail(email, name);
  // Day 2 and day 5 emails are handled by n8n workflow: "Welcome Email Sequence"
  // Workflow ID: s6p2EouVEPIQhGjS — triggers on new subscriber event
}
