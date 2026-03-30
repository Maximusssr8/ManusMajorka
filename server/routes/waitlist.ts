import { Router } from 'express';
import { getSupabaseAdmin } from '../_core/supabase';

const router = Router();

router.post('/', async (req, res) => {
  const { email, feature } = req.body;
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Invalid email' });

  const supabase = getSupabaseAdmin();
  try {
    await supabase.from('waitlist').upsert({ email, feature: feature || 'general', created_at: new Date().toISOString() }, { onConflict: 'email,feature' });
  } catch { /* fail silently if table doesn't exist yet */ }

  res.json({ success: true });
});

export default router;
