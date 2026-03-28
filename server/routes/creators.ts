import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { fetchRealCreators, fetchRawTikTokData, getTikTokCacheStatus } from '../lib/tiktokData';
import { cacheGet, cacheSet, TTL } from '../lib/redisCache';
import { checkUsageLimit, incrementUsage } from '../lib/usageLimits';
import type { Plan } from '../../shared/plans';

const router = Router();
const ADMIN_EMAILS = ['maximusmajorka@gmail.com'];

/** Inline plan check — admin email OR active subscription */
async function checkAccess(req: Request): Promise<boolean> {
  const email = (req as any).user?.email || '';
  if (ADMIN_EMAILS.includes(email)) return true;
  const userId = (req as any).user?.userId;
  if (!userId) return false;
  const SURL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const SKEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  try {
    const res = await fetch(
      `${SURL}/rest/v1/user_subscriptions?user_id=eq.${userId}&select=status&limit=1`,
      { headers: { apikey: SKEY, Authorization: `Bearer ${SKEY}` } }
    );
    const rows = await res.json().catch(() => []);
    const sub = Array.isArray(rows) ? rows[0] : null;
    return ['active', 'trialing'].includes(sub?.status || '');
  } catch {
    return false;
  }
}

// GET /api/creators/real
router.get('/real', requireAuth, async (req: Request, res: Response) => {
  try {
    // Usage enforcement
    const userId = (req as any).user?.userId;
    if (userId) {
      const plan = ((req as any).subscription?.plan || 'builder') as Plan;
      const usage = await checkUsageLimit(userId, 'creator_searches', plan);
      if (!usage.allowed) {
        res.status(429).json({ error: 'limit_exceeded', used: usage.used, limit: usage.limit, message: `You've used ${usage.used}/${usage.limit} creator searches this month. Upgrade to Scale for unlimited.` });
        return;
      }
    }
    // Redis cache — 1 hour TTL (Apify data, expensive to re-fetch)
    const cacheKey = 'creators:real';
    const cached = await cacheGet<{ creators: unknown[]; count: number; last_synced: unknown }>(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
      res.json(cached);
      return;
    }
    const creators = await fetchRealCreators();
    const status = await getTikTokCacheStatus();
    const result = { creators, count: creators.length, last_synced: status.cached_at };
    await cacheSet(cacheKey, result, TTL.CREATORS);
    res.setHeader('X-Cache', 'MISS');
    res.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    res.json(result);
    // Increment usage after successful response
    const uid = (req as any).user?.userId;
    if (uid) incrementUsage(uid, 'creator_searches').catch(() => {});
  } catch (err: any) {
    console.error('[creators/real]', err.message);
    res.json({ creators: [], count: 0, last_synced: null });
  }
});

// POST /api/creators/refresh
router.post('/refresh', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!(await checkAccess(req))) {
      res.status(403).json({ error: 'Scale plan required' });
      return;
    }
    const raw = await fetchRawTikTokData(true); // bypass cache
    const count = Array.isArray(raw) ? raw.length : 0;
    res.json({ count, synced_at: new Date().toISOString() });
  } catch (err: any) {
    console.error('[creators/refresh]', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
