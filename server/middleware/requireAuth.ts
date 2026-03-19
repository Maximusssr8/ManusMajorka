import type { Request, Response, NextFunction } from 'express';

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

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  try {
    const parts = token.split('.');
    if (parts.length !== 3) { res.status(401).json({ error: 'invalid token' }); return; }
    // base64url → base64 (add padding, replace url-safe chars)
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(parts[1].length / 4) * 4, '=');
    const payload = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    // Supabase puts email at top-level OR inside user_metadata
    const email: string = payload.email || payload.user_metadata?.email || '';
    req.user = {
      userId: payload.sub || '',
      email,
      sub: payload.sub || '',
    };
    if (!req.user.userId) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    next();
  } catch {
    res.status(401).json({ error: 'invalid token' });
  }
};
