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

export default router;
