/**
 * /api/onboarding — onboarding checklist API (Engagement Director).
 * Fetches and dismisses the per-user onboarding row.
 */
import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { getSupabaseAdmin } from '../_core/supabase';

const router = Router();

interface OnboardingRow {
  user_id: string;
  profile_complete: boolean;
  first_search: boolean;
  first_save: boolean;
  first_brief: boolean;
  store_connected: boolean;
  completed_at: string | null;
  created_at: string;
}

async function upsertDefault(userId: string): Promise<OnboardingRow | null> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('user_onboarding')
    .upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true })
    .select('*')
    .maybeSingle();
  if (error) {
    // If upsert failed (RLS or already exists), read back.
    const { data: existing } = await sb
      .from('user_onboarding')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    return (existing as OnboardingRow | null) ?? null;
  }
  return (data as OnboardingRow | null) ?? null;
}

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  try {
    const sb = getSupabaseAdmin();
    const { data } = await sb
      .from('user_onboarding')
      .select('*')
      .eq('user_id', req.user.userId)
      .maybeSingle();

    if (!data) {
      const created = await upsertDefault(req.user.userId);
      res.json({ success: true, data: created });
      return;
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'failed to fetch onboarding',
    });
  }
});

router.post('/dismiss', requireAuth, async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  try {
    const sb = getSupabaseAdmin();
    await sb
      .from('user_onboarding')
      .upsert(
        { user_id: req.user.userId, completed_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'failed to dismiss',
    });
  }
});

export default router;
