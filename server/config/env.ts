import 'dotenv/config';

function requireEnv(name: string, fallback?: string) {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const NODE_ENV = process.env.NODE_ENV ?? 'development';
const CORS = requireEnv('CORS_ORIGINS', 'http://localhost:5173');
const CORS_ORIGINS = CORS.includes(',') ? CORS.split(',').map(s => s.trim()) : CORS;

function parseSameSite(value?: string) {
  if (!value) return undefined;
  const lower = value.toLowerCase();
  if (lower === 'lax' || lower === 'strict' || lower === 'none')
    return lower as 'lax' | 'strict' | 'none';
  return undefined;
}

const defaultSameSite = NODE_ENV === 'production' ? 'none' : 'lax';
const cookieSameSite = parseSameSite(process.env.COOKIE_SAMESITE) ?? defaultSameSite;
const csrfSameSite = parseSameSite(process.env.CSRF_SAMESITE) ?? defaultSameSite;
const cookieSecure = process.env.COOKIE_SECURE === 'true' || NODE_ENV === 'production';
const csrfSecure = process.env.CSRF_SECURE === 'true' || NODE_ENV === 'production';
const csrfSecret = requireEnv('CSRF_SECRET', process.env.COOKIE_SECRET);
const defaultMongoTls = NODE_ENV === 'production';
const mongoTlsRequired = process.env.MONGO_TLS_REQUIRED
  ? process.env.MONGO_TLS_REQUIRED === 'true'
  : defaultMongoTls;
const requestPathMaxLength = parseInt(process.env.REQUEST_PATH_MAX_LENGTH ?? '2048', 10);
if (!Number.isFinite(requestPathMaxLength) || requestPathMaxLength <= 0) {
  throw new Error('REQUEST_PATH_MAX_LENGTH must be a positive integer');
}

export const env = {
  NODE_ENV,
  PORT: requireEnv('PORT', '5000'),
  HTTPS_CERT_FILE: process.env.HTTPS_CERT_FILE,
  HTTPS_KEY_FILE: process.env.HTTPS_KEY_FILE,
  MONGO_URI: requireEnv('MONGO_URI'),
  MONGO_TLS_REQUIRED: mongoTlsRequired,
  MONGO_TLS_CA_FILE: process.env.MONGO_TLS_CA_FILE,
  MONGO_TLS_CERT_KEY_FILE: process.env.MONGO_TLS_CERT_KEY_FILE,
  JWT_SECRET: requireEnv('JWT_SECRET'),
  JWT_EXPIRES: process.env.JWT_EXPIRES ?? '7d',
  COOKIE_SECRET: requireEnv('COOKIE_SECRET'),
  CORS_ORIGINS,
  GOOGLE_CLIENT_ID: requireEnv('GOOGLE_CLIENT_ID'),
  GOOGLE_CLIENT_SECRET: requireEnv('GOOGLE_CLIENT_SECRET'),
  GOOGLE_CALLBACK_URL: requireEnv('GOOGLE_CALLBACK_URL'),
  FILES_BUCKET: process.env.FILES_BUCKET ?? 'invoices',
  IS_PROD: NODE_ENV === 'production',
  COOKIE_SECURE: cookieSecure,
  COOKIE_SAMESITE: cookieSameSite,
  CSRF_SECURE: csrfSecure,
  CSRF_SAMESITE: csrfSameSite,
  CSRF_SECRET: csrfSecret,
  REQUEST_PATH_MAX_LENGTH: requestPathMaxLength,
};
