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
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    req.user = {
      userId: payload.sub || '',
      email: payload.email || '',
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
