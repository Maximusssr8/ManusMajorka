/**
 * /api/cron/daily-digest — router handler mounted by the serverless entry.
 *
 * Vercel rewrites all /api/* → /api/index.serverless.js, so this file is NOT a
 * standalone Vercel function. It exports an Express router that is mounted
 * inside api/_server.ts at /api/cron. The cron entry in vercel.json
 * ("path": "/api/cron/daily-digest") therefore resolves to the router below.
 *
 * Runs at 21:00 UTC (= 07:00 AEST next morning). Sends 5 trending products
 * per active user. Deduplicates via email_logs (type='daily_digest',
 * sent_at::date = today).
 */

import { Router, type Request, type Response } from 'express';
import { getSupabaseAdmin } from '../../server/_core/supabase';
import { Resend } from 'resend';
import {
  renderDailyDigest,
  type DigestDigestProduct,
} from '../../server/emails/daily-digest';

const router = Router();

const DEFAULT_FROM = 'Majorka Daily <daily@majorka.io>';
const FALLBACK_FROM = 'Majorka <alerts@majorka.io>';

function isoCronAllowed(req: Request): boolean {
  const auth = req.headers.authorization || '';
  const secret = process.env.CRON_SECRET || '';
  if (secret) return auth === `Bearer ${secret}`;
  const ua = String(req.headers['user-agent'] || '');
  const isVercelCron = ua.includes('vercel-cron') || req.headers['x-vercel-cron'] === '1';
  const isLocal = String(req.headers.host || '').includes('localhost');
  return isVercelCron || isLocal;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

async function trySend(
  from: string,
  to: string,
  subject: string,
  html: string,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const resend = getResend();
  if (!resend) return { ok: false, error: 'resend not configured' };
  try {
    const result = await resend.emails.send({ from, to, subject, html });
    if (result && 'error' in result && result.error) {
      return { ok: false, error: String(result.error) };
    }
    const id = (result as { data?: { id?: string } })?.data?.id;
    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function fetchTrendingProducts(
  niche: string | null,
  limit = 5,
): Promise<DigestDigestProduct[]> {
  const sb = getSupabaseAdmin();
  const cols = 'id, product_title, image_url, price_aud, sold_count, winning_score, velocity_7d';
  let q = sb
    .from('winning_products')
    .select(cols)
    .gte('winning_score', 75)
    .order('velocity_7d', { ascending: false, nullsFirst: false })
    .limit(limit);
  if (niche) q = q.eq('category', niche);
  const { data } = await q;
  const rows = Array.isArray(data) ? data : [];
  if (rows.length >= limit || !niche) {
    return rows.map((r) => ({
      id: r.id != null ? String(r.id) : null,
      title: (r.product_title as string | null) ?? null,
      image_url: (r.image_url as string | null) ?? null,
      price_aud:
        typeof r.price_aud === 'number' ? r.price_aud : r.price_aud != null ? Number(r.price_aud) : null,
      sold_count: typeof r.sold_count === 'number' ? r.sold_count : null,
      winning_score: typeof r.winning_score === 'number' ? r.winning_score : null,
      velocity_7d: typeof r.velocity_7d === 'number' ? r.velocity_7d : null,
    }));
  }
  return fetchTrendingProducts(null, limit);
}

interface DigestStats {
  eligible: number;
  sent: number;
  deduped: number;
  failed: number;
  no_email: number;
  errors: string[];
}

async function runDailyDigest(opts: { testEmail?: string } = {}): Promise<DigestStats> {
  const sb = getSupabaseAdmin();
  const stats: DigestStats = {
    eligible: 0,
    sent: 0,
    deduped: 0,
    failed: 0,
    no_email: 0,
    errors: [],
  };
  const today = todayKey();

  // Active / trialing subscribers only.
  const { data: subs, error: subsErr } = await sb
    .from('user_subscriptions')
    .select('user_id, status')
    .in('status', ['active', 'trialing']);

  if (subsErr) {
    stats.errors.push(`subs: ${subsErr.message}`);
    return stats;
  }

  const recipients: {
    userId: string;
    email: string;
    firstName: string | null;
    niche: string | null;
  }[] = [];

  for (const row of Array.isArray(subs) ? subs : []) {
    const userId = String(row.user_id);
    try {
      // Respect user_preferences.email_digest if set (default true when missing).
      const { data: prefs } = await sb
        .from('user_preferences')
        .select('email_digest, digest_frequency')
        .eq('user_id', userId)
        .maybeSingle();
      if (prefs && prefs.email_digest === false) continue;
      if (prefs && prefs.digest_frequency === 'never') continue;

      const { data: userRec } = await sb.auth.admin.getUserById(userId);
      const email = userRec?.user?.email ?? null;
      const firstName =
        (userRec?.user?.user_metadata?.first_name as string | undefined) ??
        ((userRec?.user?.user_metadata?.name as string | undefined)?.split(' ')[0] ?? null);
      if (!email) {
        stats.no_email += 1;
        continue;
      }

      // Best-effort niche — first tracked category on user_onboarding/user_preferences.
      let niche: string | null = null;
      const { data: onb } = await sb
        .from('user_onboarding')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (onb && typeof (onb as Record<string, unknown>).niche === 'string') {
        niche = (onb as { niche: string }).niche;
      }

      recipients.push({ userId, email, firstName, niche });
    } catch (err) {
      stats.errors.push(`user ${userId}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (opts.testEmail && !recipients.some((r) => r.email === opts.testEmail)) {
    recipients.push({
      userId: 'test-harness',
      email: opts.testEmail,
      firstName: 'Max',
      niche: null,
    });
  }

  stats.eligible = recipients.length;

  for (const r of recipients) {
    // Dedup: one digest per user per day.
    if (r.userId !== 'test-harness') {
      const { data: already } = await sb
        .from('email_logs')
        .select('id')
        .eq('user_id', r.userId)
        .eq('type', 'daily_digest')
        .gte('sent_at', `${today}T00:00:00Z`)
        .limit(1);
      if (Array.isArray(already) && already.length > 0) {
        stats.deduped += 1;
        continue;
      }
    }

    const products = await fetchTrendingProducts(r.niche, 5);
    const { subject, html } = renderDailyDigest({
      firstName: r.firstName,
      niche: r.niche,
      today,
      products,
    });

    let result = await trySend(DEFAULT_FROM, r.email, subject, html);
    if (!result.ok && /domain|sender|not.*verified|from/i.test(result.error ?? '')) {
      // Fallback to the verified transactional sender.
      result = await trySend(FALLBACK_FROM, r.email, subject, html);
    }

    if (result.ok) {
      stats.sent += 1;
      if (r.userId !== 'test-harness') {
        await sb.from('email_logs').insert({
          user_id: r.userId,
          type: 'daily_digest',
          status: 'sent',
        });
      }
    } else {
      stats.failed += 1;
      stats.errors.push(`${r.email}: ${result.error}`);
      if (r.userId !== 'test-harness') {
        await sb.from('email_logs').insert({
          user_id: r.userId,
          type: 'daily_digest',
          status: 'failed',
          error: result.error ?? null,
        });
      }
    }
  }

  return stats;
}

async function handler(req: Request, res: Response): Promise<void> {
  if (!isoCronAllowed(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const testEmail = typeof req.query.test === 'string' ? req.query.test : undefined;
  try {
    const stats = await runDailyDigest({ testEmail });
    res.json({ ok: true, today: todayKey(), ...stats });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

router.get('/daily-digest', handler);
router.post('/daily-digest', handler);

// Admin test endpoint — force-send a single digest to a given email.
router.post('/daily-digest/test', async (req: Request, res: Response) => {
  const token = req.header('x-admin-token') || '';
  if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const email =
    (typeof req.query.email === 'string' && req.query.email) ||
    (req.body && typeof req.body.email === 'string' ? req.body.email : undefined);
  if (!email) {
    res.status(400).json({ error: 'email required' });
    return;
  }
  try {
    const stats = await runDailyDigest({ testEmail: email });
    res.json({ ok: true, stats });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

export default router;
export { runDailyDigest };
