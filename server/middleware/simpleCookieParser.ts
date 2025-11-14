import { Request, Response, NextFunction } from 'express';

// Lightweight cookie parser to replace cookie-parser dependency and avoid transitive insecure hashing libs.
// Parses Cookie header into req.cookies object without signing.
export function simpleCookieParser() {
  return function cookieParserMiddleware(req: Request, _res: Response, next: NextFunction) {
    const header = req.headers.cookie;
    const cookies: Record<string, string> = {};
    if (header) {
      const pairs = header.split(/;\s*/);
      for (const pair of pairs) {
        const eqIdx = pair.indexOf('=');
        if (eqIdx === -1) continue;
        const key = decodeURIComponent(pair.substring(0, eqIdx).trim());
        const val = decodeURIComponent(pair.substring(eqIdx + 1));
        if (key) cookies[key] = val;
      }
    }
    (req as Request & { cookies?: Record<string, string> }).cookies = cookies;
    next();
  };
}
