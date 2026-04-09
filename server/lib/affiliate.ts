/**
 * Affiliate & subscriber API routes.
 * Handles: affiliate join, stats, click tracking, email subscribe, user count.
 */
import type { Express, Request, Response } from 'express';
import { getSupabaseAdmin } from '../_core/supabase';
import {
  createAffiliate,
  createReferral,
  createSubscriber,
  getAffiliateByCode,
  getAffiliateByUserId,
  getSubscriberByEmail,
  getUserCount,
  incrementAffiliateClicks,
  incrementAffiliateSignups,
} from '../db';

function generateCode(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function authenticateUser(req: Request): Promise<string | null> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getUser(token);
    return data?.user?.id ?? null;
  } catch {
    return null;
  }
}

export function registerAffiliateRoutes(app: Express) {
  // ─── Public affiliate application (no auth) ────────────────────────────
  // Captures leads from /affiliates page and emails hello@majorka.io via Resend.
  app.post('/api/affiliates/apply', async (req: Request, res: Response) => {
    try {
      const { name, email, channel, audienceBracket } = (req.body ?? {}) as {
        name?: string; email?: string; channel?: string; audienceBracket?: string;
      };
      if (!name?.trim() || !email?.trim() || !channel?.trim()) {
        return res.status(400).json({ error: 'name, email, and channel are required' });
      }
      // Fire-and-forget Resend email if configured
      if (process.env.RESEND_API_KEY) {
        try {
          const { Resend } = await import('resend');
          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from: 'Majorka Affiliates <affiliates@majorka.io>',
            to: ['hello@majorka.io'],
            subject: `New affiliate application: ${name}`,
            text: `New affiliate application received

Name: ${name}
Email: ${email}
Channel: ${channel}
Audience: ${audienceBracket ?? 'not specified'}

Reply directly to ${email} to onboard them.`,
          });
        } catch (mailErr) {
          console.warn('[affiliates/apply] Resend send failed:', mailErr);
        }
      } else {
        console.log('[affiliates/apply] (no Resend key) new application:', { name, email, channel, audienceBracket });
      }
      return res.json({ ok: true });
    } catch (err: unknown) {
      console.error('[affiliates/apply]', err);
      return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
  });

  // ─── Affiliate: Join ────────────────────────────────────────────────────
  app.post('/api/affiliate/join', async (req: Request, res: Response) => {
    const userId = await authenticateUser(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const existing = await getAffiliateByUserId(userId);
    if (existing) {
      return res.json({ success: true, affiliate: existing });
    }

    const code = generateCode();
    const affiliate = await createAffiliate({
      userId,
      code,
      clicks: 0,
      signups: 0,
      revenue: 0,
      commissionRate: 30,
    });

    res.json({ success: true, affiliate });
  });

  // ─── Affiliate: Stats ──────────────────────────────────────────────────
  app.get('/api/affiliate/stats', async (req: Request, res: Response) => {
    const userId = await authenticateUser(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const affiliate = await getAffiliateByUserId(userId);
    if (!affiliate) {
      return res.json({ joined: false });
    }

    res.json({
      joined: true,
      code: affiliate.code,
      clicks: affiliate.clicks,
      signups: affiliate.signups,
      revenueCents: affiliate.revenue,
      commissionRate: affiliate.commissionRate,
    });
  });

  // ─── Affiliate: Track click ────────────────────────────────────────────
  app.post('/api/affiliate/track', async (req: Request, res: Response) => {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'code is required' });
    }

    const affiliate = await getAffiliateByCode(code);
    if (!affiliate) {
      return res.status(404).json({ error: 'Invalid affiliate code' });
    }

    await incrementAffiliateClicks(code);
    res.json({ success: true });
  });

  // ─── Affiliate: Record referral on signup ──────────────────────────────
  app.post('/api/affiliate/referral', async (req: Request, res: Response) => {
    const { code, referredUserId } = req.body;
    if (!code || !referredUserId) {
      return res.status(400).json({ error: 'code and referredUserId are required' });
    }

    const affiliate = await getAffiliateByCode(code);
    if (!affiliate) {
      return res.status(404).json({ error: 'Invalid affiliate code' });
    }

    await incrementAffiliateSignups(code);
    await createReferral({
      affiliateId: affiliate.id,
      referredUserId,
      status: 'signed_up',
      commissionCents: 0,
    });

    res.json({ success: true });
  });

  // ─── Email Subscribe ───────────────────────────────────────────────────
  app.post('/api/subscribe', async (req: Request, res: Response) => {
    const { email, name, source, niche } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Try DB — but don't fail if table doesn't exist
    try {
      const existing = await getSubscriberByEmail(cleanEmail);
      if (existing) {
        return res.json({ success: true, message: 'Already subscribed' });
      }
      await createSubscriber({ email: cleanEmail, source: source || 'homepage', niche: niche || null });
    } catch {
      // DB table may not exist yet — continue and use email fallback
    }

    // Send welcome email via Resend (primary path)
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'Majorka AI <hello@majorka.io>',
        to: cleanEmail,
        subject: '📦 Your FREE AU Product Research Playbook',
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;background:#080a0e;color:#fff">
          <h1 style="color:#d4af37;font-size:28px;margin-bottom:8px">Your playbook is on its way, ${name || 'friend'}!</h1>
          <p style="color:#9ca3af;margin-bottom:24px">Thanks for joining 2,800+ AU sellers using Majorka AI to find winning products.</p>
          <div style="background:#111;border:1px solid #d4af37;border-radius:12px;padding:24px;margin-bottom:24px">
            <h2 style="color:#d4af37;font-size:18px;margin-top:0">🎯 What's in your playbook:</h2>
            <ul style="color:#e5e7eb;line-height:2">
              <li>The 5-step product validation framework used by AU's top sellers</li>
              <li>How to find $10K/mo products before they get saturated</li>
              <li>AU supplier directory (Alibaba + local warehouse contacts)</li>
              <li>Afterpay pricing strategy to increase AOV by 30%</li>
              <li>Real examples: $8 COGS → $49 sell price → $1.2M/year</li>
            </ul>
          </div>
          <a href="https://majorka.io/sign-in" style="display:inline-block;background:#d4af37;color:#000;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">Start Finding Winning Products →</a>
          <p style="color:#6b7280;font-size:12px;margin-top:32px">Majorka AI · Built in 🇦🇺 Australia · <a href="https://majorka.io" style="color:#d4af37">majorka.io</a></p>
        </div>`,
      });
    } catch {
      // Email sending failed — still return success (user signed up)
    }

    // Notify Max via Resend
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      resend.emails.send({
        from: 'Majorka AI <hello@majorka.io>',
        to: 'maximusmajorka@gmail.com',
        subject: `New lead: ${cleanEmail}`,
        html: `<p>New subscriber: <strong>${cleanEmail}</strong>${name ? ` (${name})` : ''}<br>Source: ${source || 'homepage'}</p>`,
      }).catch(() => {});
    } catch { /* silent */ }

    // Fire n8n webhook if configured
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, name, source, niche, subscribedAt: new Date().toISOString() }),
      }).catch(() => {});
    }

    res.json({
      success: true,
      message: 'Check your inbox for your free AU product research playbook!',
    });
  });

  // ─── Public: User count (for social proof) ─────────────────────────────
  app.get('/api/stats/users', async (_req: Request, res: Response) => {
    try {
      const count = await getUserCount();
      // Add a base number for social proof (early stage)
      const displayCount = count + 127;
      res.json({ count: displayCount });
    } catch (_err) {
      // DB may be unavailable in test/dev environment — return fallback
      res.json({ count: 1127 });
    }
  });
}
