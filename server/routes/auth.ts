import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { sendWelcomeEmail } from '../services/email';

const router = Router();

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// When WHITELIST_EMAILS is unset or '*', allow ALL users (launch mode).
// Set WHITELIST_EMAILS=email1,email2 to re-enable private beta.
const whitelistRaw = process.env.WHITELIST_EMAILS || '*';
const whitelistOpen = whitelistRaw.trim() === '*' || whitelistRaw.trim() === '';
const WHITELIST = whitelistOpen
  ? null
  : whitelistRaw.split(',').map(e => e.trim().toLowerCase());

// POST /api/auth/check-whitelist
// No auth required — called right after sign-in from client
router.post('/check-whitelist', (req, res) => {
  // Open mode: everyone is allowed
  if (!WHITELIST) return res.json({ allowed: true });

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

// GET /api/auth/admin-check — server-side admin verification
// Verifies JWT via Supabase, then checks user ID against ADMIN_USER_ID env var.
// No secrets exposed to client — only returns { isAdmin: true/false }.
router.get('/admin-check', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.json({ isAdmin: false });
    }
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const { createClient } = await import('@supabase/supabase-js');
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!url || !key) return res.json({ isAdmin: false });

    const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await sb.auth.getUser(token);
    if (error || !data?.user) return res.json({ isAdmin: false });

    const adminIds = new Set(
      (process.env.ADMIN_USER_ID || 'c2ee80e9-1b1b-4988-bea5-8f5278e6d25e')
        .split(',').map((s) => s.trim()).filter(Boolean),
    );
    const adminEmails = new Set(
      (process.env.ADMIN_EMAIL || 'maximusmajorka@gmail.com')
        .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
    );
    const userEmail = (data.user.email || '').toLowerCase();
    const isAdmin = adminIds.has(data.user.id) || adminEmails.has(userEmail);

    return res.json({ isAdmin });
  } catch {
    return res.json({ isAdmin: false });
  }
});

// POST /api/auth/provision-trial
// Called after successful Supabase signup — auto-provisions a 7-day free trial
router.post('/provision-trial', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return res.status(503).json({ error: 'service_unavailable' });
    }

    // Verify JWT
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user) {
      return res.status(401).json({ error: 'invalid_token' });
    }

    const userId = authData.user.id;

    // Check if user already has a subscription row — skip if so
    const { data: existing } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      return res.json({ provisioned: false, message: 'subscription_exists' });
    }

    // Insert trial subscription: 7 days from now
    const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const { error: insertError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        plan: 'trial',
        status: 'active',
        current_period_end: trialEnd.toISOString(),
      });

    if (insertError) {
      return res.status(500).json({ error: 'insert_failed', message: insertError.message });
    }

    // Send welcome email (fire-and-forget — don't block the response)
    const email = authData.user.email || '';
    const name = authData.user.user_metadata?.full_name || authData.user.user_metadata?.name || email.split('@')[0] || '';
    sendWelcomeEmail(email, name).catch(() => {});

    return res.json({ provisioned: true, trialEndsAt: trialEnd.toISOString() });
  } catch {
    return res.status(500).json({ error: 'internal_error' });
  }
});

export default router;
