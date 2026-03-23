import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

const getSupabaseConfig = () => ({
  url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://ievekuazsjbdrltsdksn.supabase.co',
  key: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
});

// GET /api/user/preferences
router.get('/preferences', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.json({ region_code: 'US', currency_code: 'USD' });

    const { url, key } = getSupabaseConfig();

    const r = await fetch(`${url}/rest/v1/user_preferences?user_id=eq.${userId}&limit=1`, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` },
    });
    const prefs = await r.json();
    if (Array.isArray(prefs) && prefs[0]) {
      res.json(prefs[0]);
    } else {
      res.json({ region_code: 'US', currency_code: 'USD' });
    }
  } catch {
    res.json({ region_code: 'US', currency_code: 'USD' });
  }
});

// PATCH /api/user/preferences
router.patch('/preferences', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const { region_code, currency_code } = req.body;
    const { url, key } = getSupabaseConfig();

    // Upsert
    await fetch(`${url}/rest/v1/user_preferences`, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({
        user_id: userId,
        region_code,
        currency_code,
        updated_at: new Date().toISOString(),
      }),
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
