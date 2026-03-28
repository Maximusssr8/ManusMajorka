import type { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

export interface AuthUser {
  userId: string;
  email?: string;
  sub?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Service-role key — allows server-to-server calls to bypass user auth
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  return createClient(url, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getSupabaseAnon() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * requireAuth — verifies the Supabase JWT signature by calling supabase.auth.getUser().
 * This is the ONLY correct way to validate — decoding without verification is insecure.
 * Falls back to service_role key check for server-to-server calls.
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'unauthorized', message: 'No token provided' });
    return;
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  // ── Service role key check (server-to-server / admin scripts) ──────────────
  // Service role JWTs have role=service_role in payload — verify by exact key match
  if (token === SERVICE_ROLE_KEY && SERVICE_ROLE_KEY.length > 20) {
    req.user = { userId: 'service_role', email: 'service@majorka.io', sub: 'service_role' };
    next();
    return;
  }

  // ── User JWT: verify signature via Supabase auth.getUser() ─────────────────
  // This calls Supabase to cryptographically verify the token — cannot be spoofed
  try {
    const supabase = getSupabaseAnon();
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      // Try with admin client as fallback (handles edge cases)
      const supabaseAdmin = getSupabaseAdmin();
      const { data: adminData, error: adminError } = await supabaseAdmin.auth.getUser(token);

      if (adminError || !adminData?.user) {
        res.status(401).json({ error: 'unauthorized', message: 'Invalid or expired token' });
        return;
      }

      req.user = {
        userId: adminData.user.id,
        email: adminData.user.email || '',
        sub: adminData.user.id,
      };
      next();
      return;
    }

    req.user = {
      userId: data.user.id,
      email: data.user.email || '',
      sub: data.user.id,
    };
    next();
  } catch (err: any) {
    console.error('[requireAuth] Unexpected error:', err?.message);
    res.status(401).json({ error: 'unauthorized', message: 'Token verification failed' });
  }
};
