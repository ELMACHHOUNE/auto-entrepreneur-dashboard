import express from 'express';
import path from 'path';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import passport from 'passport';
import authRoutes from './routes/auth.routes';
import meRoutes from './routes/me.routes';
import invoiceRoutes from './routes/invoice.routes';
import adminRoutes from './routes/admin.routes';
import rateLimit from 'express-rate-limit';
import './config/passport';

const app = express();

// Compression (gzip/brotli if supported)
app.use(
  compression({
    threshold: 1024, // compress responses > 1KB
  })
);

// Middlewares
// Configure Helmet to allow loading static images from another origin (e.g., Vite dev server)
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
  })
);
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(env.COOKIE_SECRET));
app.use(passport.initialize());
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

// Also serve invoice JSON/export files per user for debugging or export (read-only) in non-production
if (env.NODE_ENV !== 'production') {
  const invoicesDirDistSibling = path.resolve(__dirname, '../uploads/invoices');
  const invoicesDirSource = path.resolve(process.cwd(), 'server/uploads/invoices');
  app.use('/uploads/invoices', express.static(invoicesDirDistSibling, staticOpts as any));
  app.use('/uploads/invoices', express.static(invoicesDirSource, staticOpts as any));
}

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
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
