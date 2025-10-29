import 'dotenv/config';

function requireEnv(name: string, fallback?: string) {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const NODE_ENV = process.env.NODE_ENV ?? 'development';
const CORS = requireEnv('CORS_ORIGINS', 'http://localhost:5173');
const CORS_ORIGINS = CORS.includes(',') ? CORS.split(',').map(s => s.trim()) : CORS;

export const env = {
  NODE_ENV,
  PORT: requireEnv('PORT', '5000'),
  MONGO_URI: requireEnv('MONGO_URI'),
  JWT_SECRET: requireEnv('JWT_SECRET'),
  JWT_EXPIRES: process.env.JWT_EXPIRES ?? '7d',
  COOKIE_SECRET: requireEnv('COOKIE_SECRET'),
  CORS_ORIGINS,
  GOOGLE_CLIENT_ID: requireEnv('GOOGLE_CLIENT_ID'),
  GOOGLE_CLIENT_SECRET: requireEnv('GOOGLE_CLIENT_SECRET'),
  GOOGLE_CALLBACK_URL: requireEnv('GOOGLE_CALLBACK_URL'),
  FILES_BUCKET: process.env.FILES_BUCKET ?? 'invoices',
  IS_PROD: NODE_ENV === 'production',
};
