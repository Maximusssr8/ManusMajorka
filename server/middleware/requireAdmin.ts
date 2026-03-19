import { Request, Response, NextFunction } from 'express';

const ADMIN_EMAILS = ['maximusmajorka@gmail.com'];

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const email: string = (req as any).user?.email || '';
  const role: string = (req as any).user?.role || '';
  if (ADMIN_EMAILS.includes(email) || role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Admin access required' });
}
