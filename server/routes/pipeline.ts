/**
 * Pipeline routes — cron + admin triggers for the Apify pintostudio pipeline.
 *
 * Endpoints:
 *   POST/GET /api/cron/apify-pipeline   gated by CRON_SECRET (Bearer) or Vercel
 *   POST     /api/admin/trigger-pipeline  gated by X-Admin-Token = ADMIN_TOKEN
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { runApifyPintostudioPipeline } from '../lib/apifyPintostudio';

const router = Router();

function verifyCronSecret(req: Request): boolean {
  const auth = req.headers.authorization ?? '';
  const secret = process.env.CRON_SECRET ?? '';
  if (!secret) {
    const ua = String(req.headers['user-agent'] ?? '');
    const isVercelCron = ua.includes('vercel-cron') || req.headers['x-vercel-cron'] === '1';
    const isLocal = String(req.headers.host ?? '').includes('localhost');
    return isVercelCron || isLocal;
  }
  return auth === `Bearer ${secret}`;
}

function verifyAdminToken(req: Request): boolean {
  const token = process.env.ADMIN_TOKEN ?? '';
  if (!token) return false;
  const provided = String(req.headers['x-admin-token'] ?? '');
  return provided.length > 0 && provided === token;
}

const resultSchema = z.object({
  status: z.enum(['success', 'partial', 'error']),
  productsAdded: z.number().int(),
  productsUpdated: z.number().int(),
  productsRejected: z.number().int(),
  durationMs: z.number().int(),
  logId: z.string().nullable(),
  sourceBreakdown: z.record(z.string(), z.number()),
  errors: z.array(z.string()),
});

async function handleRun(res: Response): Promise<void> {
  try {
    const result = await runApifyPintostudioPipeline();
    const parsed = resultSchema.parse(result);
    res.json({ success: true, ...parsed });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'unknown error';
    res.status(500).json({ success: false, error: msg });
  }
}

router.post('/cron/apify-pipeline', async (req: Request, res: Response) => {
  if (!verifyCronSecret(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  await handleRun(res);
});

router.get('/cron/apify-pipeline', async (req: Request, res: Response) => {
  if (!verifyCronSecret(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  await handleRun(res);
});

router.post('/admin/trigger-pipeline', async (req: Request, res: Response) => {
  if (!verifyAdminToken(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  await handleRun(res);
});

export default router;
