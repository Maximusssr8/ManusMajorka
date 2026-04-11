import { Request, Response, NextFunction } from 'express';

/**
 * Admin gate. Email is cryptographically verified upstream by requireAuth
 * (supabase.auth.getUser) and cannot be spoofed, so trusting it here is safe.
 *
 * Accepts a match on EITHER the whitelisted email(s) OR the whitelisted user
 * UUID(s). Earlier versions required both to match, which broke in production
 * whenever ADMIN_USER_ID was unset or drifted from the real Supabase user
 * UUID — the sidebar would show the Admin link (because useAdmin uses
 * `/api/auth/admin-check` which is OR-based) but every /api/admin/* call
 * returned 403 because this middleware was AND-based. Unified to OR so both
 * paths agree.
 *
 * Both env vars accept comma-separated lists so secondary admins can be
 * added without a code change.
 */
const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAIL || 'maximusmajorka@gmail.com')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);

const ADMIN_USER_IDS = new Set(
  (process.env.ADMIN_USER_ID || 'c2ee80e9-1b1b-4988-bea5-8f5278e6d25e')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean),
);

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  // Service role (server-to-server) always passes
  if ((req as any).user?.userId === 'service_role') {
    return next();
  }

  const email: string = ((req as any).user?.email || '').toLowerCase();
  const userId: string = (req as any).user?.userId || '';

  const emailMatch = !!email && ADMIN_EMAILS.has(email);
  const userIdMatch = !!userId && ADMIN_USER_IDS.has(userId);

  if (emailMatch || userIdMatch) {
    // Log a drift warning so we notice when env vars are stale without
    // blocking the legitimate admin.
    if (emailMatch && !userIdMatch && userId) {
      console.warn(
        `[requireAdmin] drift: email ${email} matched but userId ${userId} not in ADMIN_USER_ID — update env var`,
      );
    }
    return next();
  }

  console.warn(`[requireAdmin] denied: email=${email || '(none)'} userId=${userId || '(none)'}`);
  return res.status(403).json({ error: 'forbidden', message: 'Admin access required' });
}
