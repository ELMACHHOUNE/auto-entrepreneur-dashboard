import { createHmac, timingSafeEqual } from 'crypto';
import { env } from '../config/env';

export interface JwtPayload {
  sub: string; // user id
  role: 'user' | 'admin';
  email: string;
  iat?: number; // issued at (seconds)
  exp?: number; // expiration (seconds)
}

export interface SignOptions {
  expiresIn?: string | number;
}

const secretKey = env.JWT_SECRET;

function parseDuration(input: string): number {
  const match = /^([0-9]+)([smhd])$/.exec(input);
  if (!match) return parseInt(input, 10);
  const value = parseInt(match[1]!, 10);
  const unit = match[2]!;
  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 3600;
    case 'd':
      return value * 86400;
    default:
      return value;
  }
}

function resolveExpirationSeconds(options?: SignOptions): number {
  const raw = options?.expiresIn ?? env.JWT_EXPIRES ?? '7d';
  if (typeof raw === 'number') return raw;
  return parseDuration(String(raw));
}

function b64urlEncode(obj: any): string {
  const json = typeof obj === 'string' ? obj : JSON.stringify(obj);
  return Buffer.from(json).toString('base64url');
}
function b64urlDecode(str: string): any {
  const json = Buffer.from(str, 'base64url').toString('utf8');
  return JSON.parse(json);
}
function signHmacSHA256(data: string): string {
  return createHmac('sha256', secretKey).update(data).digest('base64url');
}

export function signToken(payload: JwtPayload, options: SignOptions = {}): string {
  const now = Math.floor(Date.now() / 1000);
  const expSeconds = resolveExpirationSeconds(options);
  const header = { alg: 'HS256', typ: 'JWT' };
  const body: JwtPayload = { ...payload, iat: now, exp: now + expSeconds };
  const encodedHeader = b64urlEncode(header);
  const encodedPayload = b64urlEncode(body);
  const unsigned = `${encodedHeader}.${encodedPayload}`;
  const signature = signHmacSHA256(unsigned);
  return `${unsigned}.${signature}`;
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token format');
  const [h, p, s] = parts as [string, string, string];
  const unsigned = `${h}.${p}`;
  const expected = signHmacSHA256(unsigned);
  if (expected.length !== s.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(s))) {
    throw new Error('Invalid signature');
  }
  let payload: JwtPayload;
  try {
    payload = b64urlDecode(p) as JwtPayload;
  } catch {
    throw new Error('Invalid payload');
  }
  if (!payload.sub || !payload.email || !payload.role) throw new Error('Invalid token payload');
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && now >= payload.exp) throw new Error('Token expired');
  return payload;
}

/* Security Notes:
   - Custom HS256 JWT removes jsonwebtoken/jwa/tsscmp dependencies.
   - Ensure env.JWT_SECRET >= 32 random bytes.
   - For key rotation, extend verify to attempt previous secrets.
   - For confidentiality, separately encrypt payload before signing. */
