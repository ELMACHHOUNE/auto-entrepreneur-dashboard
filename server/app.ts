import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import passport from 'passport';
import authRoutes from './routes/auth.routes';
import './config/passport';

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGINS,
  credentials: true
}));
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(env.COOKIE_SECRET));
app.use(passport.initialize());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);

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
