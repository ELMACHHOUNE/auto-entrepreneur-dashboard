import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';

// Allow a conservative subset of RFC3986 reserved + unreserved characters.
// Excludes backslashes and angle brackets to shrink attack surface.
const SAFE_URL_CHARACTERS = /^[A-Za-z0-9\-._~!$&'()*+,;=:@\/?%]*$/;
// Limit pathological repetitions that can expand regex backtracking inside downstream frameworks.
const MAX_SEGMENTS = 50; // generous upper bound
const MAX_RUN = 40; // limit any single character run length

function normalizePathname(pathname: string) {
  const collapsed = pathname.replace(/\/{2,}/g, '/');
  const withoutTraversal = collapsed.replace(/\.\.+/g, '.');
  return withoutTraversal;
}

export function requestPathGuard(req: Request, res: Response, next: NextFunction) {
  const rawUrl = req.url ?? '/';

  if (rawUrl.length > env.REQUEST_PATH_MAX_LENGTH) {
    return res.status(414).json({ error: 'Request URI too long' });
  }

  if (!SAFE_URL_CHARACTERS.test(rawUrl)) {
    return res.status(400).json({ error: 'Invalid characters in request path' });
  }

  try {
    decodeURIComponent(rawUrl);
  } catch {
    return res.status(400).json({ error: 'Malformed path encoding' });
  }

  const questionMarkIndex = rawUrl.indexOf('?');
  const pathname = questionMarkIndex >= 0 ? rawUrl.slice(0, questionMarkIndex) : rawUrl;
  const query = questionMarkIndex >= 0 ? rawUrl.slice(questionMarkIndex) : '';
  const normalizedPath = normalizePathname(pathname);

  // Segment count enforcement
  const segmentCount = normalizedPath.split('/').filter(Boolean).length;
  if (segmentCount > MAX_SEGMENTS) {
    return res.status(414).json({ error: 'Too many path segments' });
  }

  // Character run length enforcement
  let currentChar = '';
  let runLen = 0;
  for (const ch of normalizedPath) {
    if (ch === currentChar) {
      runLen++;
      if (runLen > MAX_RUN) {
        return res.status(400).json({ error: 'Path contains excessive repeated characters' });
      }
    } else {
      currentChar = ch;
      runLen = 1;
    }
  }
  req.url = `${normalizedPath}${query}`;

  next();
}
