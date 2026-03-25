import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';
import { enrichCreatorProfiles, fetchTrendingShopProducts, getCacheStatus } from '../lib/apifyTikTok';
import { getSupabaseAdmin } from '../_core/supabase';

const router = Router();

/**
 * Format follower count to human-readable string (e.g. "125.3K").
 */
function formatFollowers(n: number | null | undefined): string {
  if (n == null || isNaN(Number(n))) return '0';
  const v = Number(n);
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}

/**
 * Derive engagement signal from engagement rate.
 */
function engagementSignal(rate: number | null | undefined): 'High' | 'Medium' | 'Low' {
  if (rate == null) return 'Low';
  if (rate >= 5) return 'High';
  if (rate >= 2) return 'Medium';
  return 'Low';
}

// POST /api/apify/refresh-creators
router.post('/refresh-creators', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const sb = getSupabaseAdmin();

    // Get all handles from creators table
    const SURL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const SKEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const creatorsRes = await fetch(`${SURL}/rest/v1/creators?select=handle&limit=200`, {
      headers: { apikey: SKEY, Authorization: `Bearer ${SKEY}` },
    });
    const creatorsData = await creatorsRes.json();
    const handles: string[] = (Array.isArray(creatorsData) ? creatorsData : [])
      .map((c: any) => c.handle)
      .filter(Boolean);

    if (!handles.length) {
      return res.json({ updated: 0, failed: 0, message: 'No creator handles found' });
    }

    // Enrich via Apify
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
          profile_url: `https://tiktok.com/@${handle}`,
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
      } catch {
        failed++;
      }
    }

    res.json({ updated, failed });
  } catch (err: any) {
    console.error('[apify/refresh-creators]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/apify/refresh-products
router.post('/refresh-products', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const products = await fetchTrendingShopProducts('AU', 20);

    if (!products.length) {
      return res.json({ inserted: 0, source: 'unavailable' });
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
          winning_score: p.score || Math.floor(Math.random() * 30 + 60),
          trend: 'rising',
          competition_level: 'Medium',
          image_url: p.imageUrl || p.image || p.coverImage || null,
          source: 'tiktok_shop',
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
      } catch {
        // Skip individual failures
      }
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
    res.json({
      creators_cached_at: null,
      products_cached_at: null,
      creators_fresh: false,
      products_fresh: false,
    });
  }
});

export default router;
