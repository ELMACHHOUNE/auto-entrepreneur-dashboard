import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  sub: string; // user id
  role: 'user' | 'admin';
  email: string;
}

// env.JWT_SECRET expected string; env.JWT_EXPIRES could be a duration string like '7d'
export function signToken(payload: JwtPayload, options: SignOptions = {}) {
  const secret: Secret = env.JWT_SECRET as string;
  // Accept both string durations (e.g. '7d') or numeric seconds; coerce invalid to undefined
  let expiresIn: SignOptions['expiresIn'] = undefined;
  if (env.JWT_EXPIRES) {
    // If numeric-like and equals the original string (no trailing d/h), treat as seconds; else pass through string
    const numeric = /^[0-9]+$/.test(env.JWT_EXPIRES) ? parseInt(env.JWT_EXPIRES, 10) : undefined;
    expiresIn = numeric !== undefined ? numeric : (env.JWT_EXPIRES as any); // cast to satisfy SignOptions
  }
  const jwtOptions: SignOptions = { ...options };
  if (expiresIn) jwtOptions.expiresIn = expiresIn;
  return jwt.sign(payload, secret, jwtOptions);
}

export function verifyToken(token: string): JwtPayload {
  const secret: Secret = env.JWT_SECRET as string;
  return jwt.verify(token, secret) as JwtPayload;
}
