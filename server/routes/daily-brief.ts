import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { cacheGet, cacheSet, TTL } from '../lib/redisCache';
import { callClaude } from '../lib/claudeWrap';
import { claudeRateLimit } from '../middleware/claudeRateLimit';

const router = Router();

router.post('/', requireAuth, claudeRateLimit, async (req: Request, res: Response) => {
  const { niche } = req.body;
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const nicheKey = (niche || 'general').toLowerCase().replace(/\s+/g, '_');
  const cacheKey = `daily-brief:${nicheKey}:${today}`;

  // Redis-backed cache — survives server restarts, shared across all instances
  const cached = await cacheGet<string>(cacheKey);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.json({ brief: cached });
  }

  try {
    const prompt = `You are a daily market intelligence briefing system for a dropshipping platform.
Generate a concise daily brief for a seller in the "${niche || 'general ecommerce'}" niche.
Date: ${new Date().toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

Format as exactly 3 lines (no headers, no bullets, plain text):
Line 1: One key market insight for this niche today
Line 2: One product trend or opportunity to watch
Line 3: One actionable tip for today

Keep each line under 20 words. Be specific to the niche. Sound like a savvy market analyst.`;

    const msg = await callClaude({
      feature: 'ai_brief',
      userId: (req as any).user?.userId,
      maxTokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (msg.content[0] as any).text || '';
    // Cache for 24h — one Claude call per niche per day across all users and instances
    await cacheSet(cacheKey, text, TTL.DAILY_BRIEF);
    res.setHeader('X-Cache', 'MISS');
    res.json({ brief: text });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[daily-brief] Error:', message);
    res.status(500).json({ brief: '', error: 'Failed to generate brief' });
  }
});

export default router;
