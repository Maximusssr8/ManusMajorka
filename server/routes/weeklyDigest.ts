/**
 * Weekly digest cron — runs Saturday 23:00 UTC (= Sunday 09:00 AEST).
 * Mounted at /api/cron/weekly-digest (vercel.json).
 *
 * For every subscriber with user_subscriptions.status IN ('active','trialing'):
 *   - pick top 3 trending products in their niche (category fallback: all niches)
 *   - recommend the next uncompleted Academy lesson in their current track
 *   - attach Maya's tip of the week
 *   - dedup via email_sends (unique user_id + template='weekly_digest' + week_of)
 *
 * Cron auth: Bearer CRON_SECRET, or Vercel's x-vercel-cron header.
 */
import { Router, type Request, type Response } from 'express';
import { getSupabaseAdmin } from '../_core/supabase';
import { sendTransactional } from '../lib/email';
import { ACADEMY_TRACKS } from '../../client/src/components/academy/tracks';
import type { DigestProduct, DigestLessonRec } from '../lib/emailTemplates/weeklyDigest';

const router = Router();

// Hard-coded 10-tip rotation — pulls from maya_tips table if any are active.
const FALLBACK_MAYA_TIPS: string[] = [
  'Your most profitable day this week is Thursday — AU evening scroll. Front-load 50% of your creative tests between 6–10pm AEST Thursday and Friday.',
  'If a SKU has spent $150 and is under 1.2 ROAS, it is dead. The only thing more expensive than cutting it is hoping it recovers.',
  'Before you launch another product, go look at your existing customer list. A post-purchase email at day 3 lifts repeat rate more than any ad you will run.',
  'Velocity above +150% is almost always a single viral creator, not real demand. Trust the +15% to +150% band — that is where durable winners live.',
  'Afterpay on cart for any AU product between $40 and $200 is a free 15–25% conversion uplift. If you have not enabled it, you are leaving money on the table.',
  'Meta Advantage+ Shopping has quietly become better than hand-picked interest targeting. Run it alongside a broad AU 25–55 ad set and let the algorithm pick.',
  'Review count matters less than photo-review ratio. 100 reviews with 15% photos beats 3,000 reviews with 3% photos every time. Audit your suppliers against this.',
  'Contribution margin under 10% is the real warning light. ROAS looks fine, MER looks fine, but you cannot scale a 7% margin business through Q4.',
  'The creator you are about to pay $300 for UGC — check their last 6 posts. If three of them are other dropship ads, the audience is burnt. Find someone newer.',
  'Every SKU that passes $30k/month should trigger a private-label conversation with the factory on Alibaba. MOQ is usually 300. Margin lift is usually 30%+.',
];

function isoCronAllowed(req: Request): boolean {
  const auth = req.headers.authorization || '';
  const secret = process.env.CRON_SECRET || '';
  if (secret) return auth === `Bearer ${secret}`;
  const ua = String(req.headers['user-agent'] || '');
  const isVercelCron = ua.includes('vercel-cron') || req.headers['x-vercel-cron'] === '1';
  const isLocal = String(req.headers.host || '').includes('localhost');
  return isVercelCron || isLocal;
}

function weekOfKey(): string {
  // ISO date of the most recent Sunday (UTC). Stable dedup key.
  const d = new Date();
  const day = d.getUTCDay(); // 0 = Sunday
  const diff = day; // back to Sunday
  const sunday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diff));
  return sunday.toISOString().slice(0, 10);
}

async function pickMayaTip(): Promise<string> {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('maya_tips')
      .select('tip')
      .eq('active', true)
      .limit(50);
    const tips = Array.isArray(data) ? data.map((r) => String(r.tip)).filter(Boolean) : [];
    const pool = tips.length > 0 ? tips : FALLBACK_MAYA_TIPS;
    // Deterministic per-week pick so the whole cohort sees the same tip.
    const weekIdx = Math.floor(Date.now() / (7 * 24 * 3600 * 1000));
    return pool[weekIdx % pool.length] ?? FALLBACK_MAYA_TIPS[0];
  } catch {
    return FALLBACK_MAYA_TIPS[0];
  }
}

async function topProductsForNiche(niche: string | null): Promise<DigestProduct[]> {
  const supabase = getSupabaseAdmin();
  const cols = 'id, product_title, category, price_aud, winning_score, velocity_7d, image_url';
  let query = supabase
    .from('winning_products')
    .select(cols)
    .gte('winning_score', 80)
    .order('velocity_7d', { ascending: false, nullsFirst: false })
    .limit(3);
  if (niche) query = query.eq('category', niche);
  const { data } = await query;
  const rows = Array.isArray(data) ? data : [];
  if (rows.length >= 3 || !niche) {
    return rows.map((r) => ({
      id: String(r.id),
      title: (r.product_title as string | null) ?? null,
      category: (r.category as string | null) ?? null,
      price_aud: typeof r.price_aud === 'number' ? r.price_aud : r.price_aud != null ? Number(r.price_aud) : null,
      winning_score: typeof r.winning_score === 'number' ? r.winning_score : null,
      velocity_7d: typeof r.velocity_7d === 'number' ? r.velocity_7d : null,
      image_url: (r.image_url as string | null) ?? null,
    }));
  }
  // Niche under-populated — fall back to all-niches.
  return topProductsForNiche(null);
}

async function nextLessonFor(userId: string): Promise<DigestLessonRec | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('academy_progress')
    .select('lesson_id')
    .eq('user_id', userId);
  const done = new Set((Array.isArray(data) ? data : []).map((r) => String(r.lesson_id)));
  for (const t of ACADEMY_TRACKS) {
    for (const l of t.lessons) {
      if (!done.has(l.id)) {
        return {
          trackTitle: t.title,
          lessonNum: l.num,
          lessonTitle: l.title,
          url: `https://majorka.io/app/academy#${l.id}`,
        };
      }
    }
  }
  return null;
}

interface DigestRunStats {
  eligible: number;
  skipped_deduped: number;
  sent: number;
  failed: number;
  no_email: number;
  errors: string[];
}

async function runWeeklyDigest(testEmail?: string): Promise<DigestRunStats> {
  const supabase = getSupabaseAdmin();
  const stats: DigestRunStats = {
    eligible: 0,
    skipped_deduped: 0,
    sent: 0,
    failed: 0,
    no_email: 0,
    errors: [],
  };
  const weekOf = weekOfKey();
  const mayaTip = await pickMayaTip();

  const { data: subs, error: subsErr } = await supabase
    .from('user_subscriptions')
    .select('user_id, status')
    .in('status', ['active', 'trialing']);

  if (subsErr) {
    stats.errors.push(`subs: ${subsErr.message}`);
    return stats;
  }

  const recipients: { userId: string; email: string; firstName: string | null; niche: string | null }[] = [];

  for (const row of Array.isArray(subs) ? subs : []) {
    const userId = String(row.user_id);
    // Resolve email — prefer auth.users via admin API.
    try {
      const { data: userRec } = await supabase.auth.admin.getUserById(userId);
      const email = userRec?.user?.email ?? null;
      const firstName = (userRec?.user?.user_metadata?.first_name as string | undefined)
        || (userRec?.user?.user_metadata?.name as string | undefined)?.split(' ')[0]
        || null;
      if (!email) {
        stats.no_email += 1;
        continue;
      }
      // Resolve niche via user_onboarding / user_preferences (best-effort).
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('tracked_categories')
        .eq('user_id', userId)
        .maybeSingle();
      const tracked: string[] = Array.isArray(prefs?.tracked_categories) ? prefs.tracked_categories : [];
      const niche = tracked[0] ?? null;
      recipients.push({ userId, email, firstName, niche });
    } catch (err: unknown) {
      stats.errors.push(`user ${userId}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Optional test recipient — force-send regardless of dedup when explicitly requested.
  if (testEmail && !recipients.some((r) => r.email === testEmail)) {
    recipients.push({ userId: 'test-harness', email: testEmail, firstName: 'Max', niche: null });
  }

  stats.eligible = recipients.length;

  for (const r of recipients) {
    // Dedup (skip when userId is the test harness marker).
    if (r.userId !== 'test-harness') {
      const { data: sent } = await supabase
        .from('email_sends')
        .select('id')
        .eq('user_id', r.userId)
        .eq('template', 'weekly_digest')
        .gte('sent_at', `${weekOf}T00:00:00Z`)
        .limit(1);
      if (Array.isArray(sent) && sent.length > 0) {
        stats.skipped_deduped += 1;
        continue;
      }
    }

    const products = await topProductsForNiche(r.niche);
    const lesson = r.userId === 'test-harness' ? null : await nextLessonFor(r.userId);
    const result = await sendTransactional(r.email, {
      template: 'weekly_digest',
      data: {
        firstName: r.firstName ?? undefined,
        niche: r.niche,
        weekOf,
        products,
        lesson,
        mayaTip,
        dashboardUrl: 'https://majorka.io/app',
      },
    });
    if (result.ok) {
      stats.sent += 1;
      if (r.userId !== 'test-harness') {
        await supabase.from('email_sends').insert({
          user_id: r.userId,
          email: r.email,
          template: 'weekly_digest',
          sent_at: new Date().toISOString(),
          resend_id: result.id ?? null,
        });
      }
    } else {
      stats.failed += 1;
      if (result.error) stats.errors.push(`${r.email}: ${result.error}`);
    }
  }

  return stats;
}

async function weeklyDigestHandler(req: Request, res: Response): Promise<void> {
  if (!isoCronAllowed(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const testEmail = typeof req.query.test === 'string' ? req.query.test : undefined;
  try {
    const stats = await runWeeklyDigest(testEmail);
    res.json({ ok: true, week_of: weekOfKey(), ...stats });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ ok: false, error: message });
  }
}

router.get('/weekly-digest', weeklyDigestHandler);
router.post('/weekly-digest', weeklyDigestHandler);

export default router;
