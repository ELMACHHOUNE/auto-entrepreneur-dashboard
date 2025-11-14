import { Request, Response, NextFunction, CookieOptions } from 'express';
import { env } from '../config/env';
import { verifyToken, JwtPayload } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

const TOKEN_COOKIE = 'token';

function extractToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    return auth.substring('Bearer '.length);
  }
  const cookieToken = (req as any).cookies?.token;
  return cookieToken || null;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const payload = await verifyToken(token);
    (req as AuthRequest).user = payload;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export async function verifyJwt(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[TOKEN_COOKIE];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const payload = await verifyToken(token);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

export function requireRole(role: 'admin' | 'user') {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (req.user.role !== role) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

// Cookie options helper
export const cookieOpts = (_isProd: boolean, maxAgeMs: number): CookieOptions => {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAMESITE,
    maxAge: maxAgeMs,
    path: '/',
  };
};
