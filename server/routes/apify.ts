import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { enrichCreatorProfiles, fetchTrendingShopProducts, getCacheStatus } from '../lib/apifyTikTok';

const router = Router();
const ADMIN_EMAILS = ['maximusmajorka@gmail.com'];

function formatFollowers(n: number | null | undefined): string {
  if (n == null || isNaN(Number(n))) return '0';
  const v = Number(n);
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}

function engagementSignal(rate: number | null | undefined): 'High' | 'Medium' | 'Low' {
  if (rate == null) return 'Low';
  if (rate >= 5) return 'High';
  if (rate >= 2) return 'Medium';
  return 'Low';
}

/** Inline plan check — admin email OR active subscription in user_subscriptions table */
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

// POST /api/apify/refresh-creators
router.post('/refresh-creators', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!(await checkAccess(req))) {
      res.status(403).json({ error: 'Scale plan required' });
      return;
    }
    const SURL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const SKEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    // Only fetch creators with verified real TikTok profile URLs (not search/archetype entries)
    // This keeps the Apify run small enough to finish within Vercel's 60s timeout
    const creatorsRes = await fetch(
      `${SURL}/rest/v1/creators?select=handle,profile_url&limit=200&profile_url=like.https://www.tiktok.com/@*`,
      { headers: { apikey: SKEY, Authorization: `Bearer ${SKEY}` } }
    );
    const creatorsData = await creatorsRes.json();
    const handles: string[] = (Array.isArray(creatorsData) ? creatorsData : [])
      .map((c: any) => {
        // Extract handle from profile_url (most reliable) or use handle column
        const url = c.profile_url || '';
        const match = url.match(/tiktok\.com\/@([^/?]+)/);
        return match ? match[1] : (c.handle || '').replace(/^@/, '');
      })
      .filter(Boolean)
      .slice(0, 20); // Safety cap at 20 handles

    if (!handles.length) {
      res.json({ updated: 0, failed: 0, message: 'No creator handles found' });
      return;
    }

    const profiles = await enrichCreatorProfiles(handles);
    let updated = 0;
    let failed = 0;

    for (const profile of profiles) {
      try {
        const handle = profile.uniqueId || profile.username || profile.id || '';
        if (!handle) { failed++; continue; }
        const mapped = {
          handle,
          display_name: profile.nickname || profile.displayName || handle,
          est_followers: formatFollowers(profile.fans || profile.followers || profile.followerCount),
          engagement_signal: engagementSignal(profile.engagementRate || profile.diggCount),
          profile_url: `https://www.tiktok.com/@${handle}`,
        };
        const upsertRes = await fetch(`${SURL}/rest/v1/creators?on_conflict=handle`, {
          method: 'POST',
          headers: {
            apikey: SKEY,
            Authorization: `Bearer ${SKEY}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify(mapped),
        });
        if (upsertRes.ok) { updated++; } else { failed++; }
      } catch { failed++; }
    }

    res.json({ updated, failed });
  } catch (err: any) {
    console.error('[apify/refresh-creators]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/apify/refresh-products
router.post('/refresh-products', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!(await checkAccess(req))) {
      res.status(403).json({ error: 'Scale plan required' });
      return;
    }
    const products = await fetchTrendingShopProducts('AU', 20);
    if (!products.length) {
      res.json({ inserted: 0, source: 'unavailable' });
      return;
    }
    const SURL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const SKEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    let inserted = 0;
    for (const p of products) {
      try {
        const mapped = {
          product_title: p.title || p.name || 'Unknown',
          category: p.category || p.categoryName || 'General',
          price_aud: parseFloat(String(p.price || p.salePrice || '0').replace(/[^0-9.]/g, '')) || 0,
          winning_score: p.score || 70,
          trend: 'rising',
          competition_level: 'Medium',
          image_url: p.imageUrl || p.image || p.coverImage || null,
          tiktok_signal: true,
        };
        const upsertRes = await fetch(`${SURL}/rest/v1/winning_products`, {
          method: 'POST',
          headers: {
            apikey: SKEY,
            Authorization: `Bearer ${SKEY}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify(mapped),
        });
        if (upsertRes.ok) inserted++;
      } catch { /* skip */ }
    }
    res.json({ inserted, source: 'tiktok_shop' });
  } catch (err: any) {
    console.error('[apify/refresh-products]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/apify/cache-status
router.get('/cache-status', async (_req: Request, res: Response) => {
  try {
    const status = await getCacheStatus();
    res.json(status);
  } catch (err: any) {
    res.json({ creators_cached_at: null, products_cached_at: null, creators_fresh: false, products_fresh: false });
  }
});

export default router;
