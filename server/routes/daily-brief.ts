import { Router } from 'express';
import type { Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

const briefCache = new Map<string, { text: string; date: string }>();

router.post('/', requireAuth, async (req: Request, res: Response) => {
  const { niche } = req.body;
  const today = new Date().toISOString().slice(0, 10);
  const cacheKey = `${(niche || 'general').toLowerCase()}_${today}`;

  const cached = briefCache.get(cacheKey);
  if (cached && cached.date === today) {
    return res.json({ brief: cached.text });
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const prompt = `You are a daily market intelligence briefing system for a dropshipping platform.
Generate a concise daily brief for a seller in the "${niche || 'general ecommerce'}" niche.
Date: ${new Date().toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

Format as exactly 3 lines (no headers, no bullets, plain text):
Line 1: One key market insight for this niche today
Line 2: One product trend or opportunity to watch
Line 3: One actionable tip for today

Keep each line under 20 words. Be specific to the niche. Sound like a savvy market analyst.`;

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (msg.content[0] as any).text || '';
    briefCache.set(cacheKey, { text, date: today });

    for (const [k, v] of briefCache) {
      if (v.date !== today) briefCache.delete(k);
    }

    res.json({ brief: text });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[daily-brief] Error:', message);
    res.status(500).json({ brief: '', error: 'Failed to generate brief' });
  }
});

export default router;
