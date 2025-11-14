import express from 'express';
import path from 'path';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import authRoutes from './routes/auth.routes';
import meRoutes from './routes/me.routes';
import invoiceRoutes from './routes/invoice.routes';
import adminRoutes from './routes/admin.routes';
import rateLimit from 'express-rate-limit';
import { csrfGuard, exposeCsrfToken, csrfErrorHandler } from './middleware/csrf';
import { simpleCookieParser } from './middleware/simpleCookieParser';
import { requestPathGuard } from './middleware/requestPathGuard';

const app = express();
// Using custom HMAC-SHA256 CSRF implementation (avoids SHA1 usage flagged by Snyk)

// When behind a reverse proxy (e.g., nginx/Heroku), trust the first proxy to ensure req.secure works
if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(requestPathGuard);

// Compression (gzip/brotli if supported)
app.use(
  compression({
    threshold: 1024, // compress responses > 1KB
  })
);

// Enforce HTTPS in production when behind proxy, redirect insecure requests early.
app.use((req, res, next) => {
  if (env.NODE_ENV === 'production' && !req.secure) {
    if (req.originalUrl === '/health') return next();
    const host = req.headers.host;
    return res.redirect(301, `https://${host}${req.originalUrl}`);
  }
  next();
});

// Security & CORS middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(
  cors({
    origin: env.CORS_ORIGINS,
    credentials: true,
    exposedHeaders: ['X-CSRF-Token'],
  })
);

if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(simpleCookieParser());
app.use(csrfGuard); // custom HMAC guard only
app.use(exposeCsrfToken); // expose custom token
app.use(csrfErrorHandler);
// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(generalLimiter);

// Static serving for uploaded images (ensure CORP allows cross-origin loads in dev)
const uploadsDirDistSibling = path.resolve(__dirname, '../uploads/images');
const uploadsDirSource = path.resolve(process.cwd(), 'server/uploads/images');
const staticOpts = {
  // Conservative cache: 1h in production, no cache in dev
  maxAge: env.NODE_ENV === 'production' ? '1h' : 0,
  setHeaders: (res: express.Response) => {
    // Allow loading images from different origins (e.g., Vite dev server)
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    // Client-side caching. Avoid immutable since filenames are deterministic and can be overwritten.
    const cacheControl =
      env.NODE_ENV === 'production' ? 'public, max-age=3600' : 'public, max-age=0, must-revalidate';
    res.setHeader('Cache-Control', cacheControl);
  },
};

// Serve from both potential locations (dist sibling and source), whichever has the file
app.use('/uploads/images', express.static(uploadsDirDistSibling, staticOpts as any));
app.use('/uploads/images', express.static(uploadsDirSource, staticOpts as any));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Provide explicit CSRF token fetch endpoint for clients that prefer JSON
app.get('/api/csrf-token', (req, res) => {
  res.json({ token: req.csrfToken?.() });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/me', meRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // ...log as needed...
  res.status(err?.status || 500).json({ error: err?.message || 'Internal Server Error' });
});

export default app;
