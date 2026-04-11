import { Router } from 'express';

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

export default router;
