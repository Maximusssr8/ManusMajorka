import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { fetchRealVideos, getTikTokCacheStatus, searchVideos } from '../lib/tiktokData';
import { cacheGet, cacheSet, TTL } from '../lib/redisCache';

const router = Router();

// GET /api/videos/real
router.get('/real', requireAuth, async (_req: Request, res: Response) => {
  try {
    // Redis cache — 1 hour TTL
    const cacheKey = 'videos:real';
    const cached = await cacheGet<{ videos: unknown[]; count: number; last_synced: unknown }>(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
      res.json(cached);
      return;
    }
    const videos = await fetchRealVideos();
    const status = await getTikTokCacheStatus();
    const result = { videos, count: videos.length, last_synced: status.cached_at };
    await cacheSet(cacheKey, result, TTL.VIDEOS);
    res.setHeader('X-Cache', 'MISS');
    res.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    res.json(result);
  } catch (err: any) {
    console.error('[videos/real]', err.message);
    res.json({ videos: [], count: 0, last_synced: null });
  }
});

// GET /api/videos/search?q=term — live Apify search, no cache
router.get('/search', requireAuth, async (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'q required', videos: [] });
  try {
    const videos = await searchVideos(q);
    res.json({ videos, count: videos.length, query: q });
  } catch (err: any) {
    console.error('[videos/search]', err.message);
    res.json({ videos: [], count: 0, query: q });
  }
});

export default router;
