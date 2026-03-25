import { Router, Request, Response } from 'express';
import { fetchRealVideos, getTikTokCacheStatus } from '../lib/tiktokData';

const router = Router();

// GET /api/videos/real
router.get('/real', async (_req: Request, res: Response) => {
  try {
    const videos = await fetchRealVideos();
    const status = await getTikTokCacheStatus();
    res.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    res.json({ videos, count: videos.length, last_synced: status.cached_at });
  } catch (err: any) {
    console.error('[videos/real]', err.message);
    res.json({ videos: [], count: 0, last_synced: null });
  }
});

export default router;
