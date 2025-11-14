import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

function getAllowedHosts(): string[] {
  const origins = Array.isArray(env.CORS_ORIGINS) ? env.CORS_ORIGINS : [env.CORS_ORIGINS];
  return origins
    .map(o => {
      try {
        const u = new URL(o);
        return u.host;
      } catch {
        return o.replace(/^https?:\/\//, '').replace(/\/$/, '');
      }
    })
    .filter(Boolean);
}

/**
 * Lightweight CSRF guard for cookie-authenticated requests. For state-changing methods, if a token cookie
 * is present, require Origin/Referer to match one of the allowed origins.
 */
export function csrfGuard(req: Request, res: Response, next: NextFunction) {
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return next();

  // Only enforce if using cookie-based auth (token cookie present)
  const hasAuthCookie = Boolean((req as any).cookies?.token);
  if (!hasAuthCookie) return next();

  const origin = req.headers.origin || req.headers.referer || '';
  if (!origin) return res.status(403).json({ error: 'Forbidden (missing origin)' });

  try {
    const host = new URL(String(origin)).host;
    const allowed = getAllowedHosts();
    if (!allowed.includes(host)) {
      return res.status(403).json({ error: 'Forbidden (origin mismatch)' });
    }
    return next();
  } catch {
    return res.status(403).json({ error: 'Forbidden (invalid origin)' });
  }
}
