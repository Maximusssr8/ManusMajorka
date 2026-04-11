import { Request, Response, NextFunction } from 'express';

/**
 * Admin email list — these user IDs / emails get full admin access.
 * SECURITY: Email is only trusted because requireAuth uses supabase.auth.getUser()
 * which cryptographically verifies the JWT signature. Email cannot be spoofed.
 *
 * Dual check: both email AND known user_id must match to prevent any edge cases.
 */
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'maximusmajorka@gmail.com';
const ADMIN_ID = process.env.ADMIN_USER_ID || 'c2ee80e9-1b1b-4988-bea5-8f5278e6d25e';

const ADMIN_EMAILS = new Set([ADMIN_EMAIL.toLowerCase()]);
const ADMIN_USER_IDS = new Set([ADMIN_ID]);

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  // Service role (server-to-server) always passes
  if ((req as any).user?.userId === 'service_role') {
    return next();
  }

  const email: string = ((req as any).user?.email || '').toLowerCase();
  const userId: string = (req as any).user?.userId || '';

  // Must match BOTH email AND userId — prevents any single-vector bypass
  const emailMatch = ADMIN_EMAILS.has(email);
  const userIdMatch = ADMIN_USER_IDS.has(userId);

  if (emailMatch && userIdMatch) {
    return next();
  }

  // Log attempted admin access for suspicious requests
  if (emailMatch !== userIdMatch) {
    console.warn(`[requireAdmin] SUSPICIOUS: email=${email} userId=${userId} — partial match`);
  }

  return res.status(403).json({ error: 'forbidden', message: 'Admin access required' });
}
