import rateLimit from 'express-rate-limit';

// Generic write limiter to bound state-changing endpoints per IP
export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
