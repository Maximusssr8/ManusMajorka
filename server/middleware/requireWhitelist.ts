/**
 * Email whitelist middleware — private beta access control.
 *
 * Add WHITELIST_EMAILS=maximusmajorka@gmail.com to Vercel environment variables.
 * Comma-separated for multiple emails: user1@example.com,user2@example.com
 */
import type { Request, Response, NextFunction } from 'express';
import { getSupabaseAdmin } from '../_core/supabase';

const WHITELIST = (process.env.WHITELIST_EMAILS || 'maximusmajorka@gmail.com')
  .split(',')
  .map(e => e.trim().toLowerCase());

export async function requireWhitelist(req: Request, res: Response, next: NextFunction) {
  // Extract Bearer token
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'unauthorized' });

  // Get user from token
  const supabase = getSupabaseAdmin();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user?.email) return res.status(401).json({ error: 'unauthorized' });

  // Whitelist check
  const email = user.email.toLowerCase();
  if (!WHITELIST.includes(email)) {
    return res.status(403).json({
      error: 'access_denied',
      message: 'Majorka is currently in private beta. Access is restricted.',
    });
  }

  next();
}
