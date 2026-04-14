import { Router } from 'express';
import { sendTransactional } from '../lib/email';
import { getSupabaseAdmin } from '../_core/supabase';

const router = Router();

const WHITELIST = (process.env.WHITELIST_EMAILS || 'maximusmajorka@gmail.com')
  .split(',')
  .map(e => e.trim().toLowerCase());

// POST /api/auth/check-whitelist
// No auth required — called right after sign-in from client
router.post('/check-whitelist', (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'email required' });
  }

  const allowed = WHITELIST.includes(email.trim().toLowerCase());
  if (allowed) {
    return res.json({ allowed: true });
  }

  return res.json({
    allowed: false,
    message: 'Majorka is currently in private beta. Access is restricted.',
  });
});

// POST /api/auth/signup-complete
// Fires the welcome email exactly once per user (dedup via email_sends).
// Call from the client right after Supabase auth.signUp succeeds.
router.post('/signup-complete', async (req, res) => {
  const { userId, email, firstName } = req.body as {
    userId?: string;
    email?: string;
    firstName?: string;
  };
  if (!userId || !email) {
    return res.status(400).json({ error: 'userId and email required' });
  }

  try {
    const supabase = getSupabaseAdmin();

    // Dedup — one welcome per user lifetime.
    const { data: existing } = await supabase
      .from('email_sends')
      .select('id')
      .eq('user_id', userId)
      .eq('template', 'welcome')
      .maybeSingle();

    if (existing) {
      return res.json({ ok: true, status: 'already_sent' });
    }

    const result = await sendTransactional(email, {
      template: 'welcome',
      data: { firstName },
    });

    if (result.ok) {
      await supabase.from('email_sends').insert({
        user_id: userId,
        email,
        template: 'welcome',
        provider: result.provider,
        provider_id: result.id ?? null,
      });
      return res.json({ ok: true, status: 'sent', id: result.id });
    }

    return res.json({ ok: false, status: result.reason ?? 'send_failed', error: result.error });
  } catch (err: unknown) {
    return res.status(500).json({
      error: 'internal',
      message: err instanceof Error ? err.message : String(err),
    });
  }
});

export default router;
