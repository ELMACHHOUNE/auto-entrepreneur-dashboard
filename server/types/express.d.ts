import 'express-serve-static-core';

declare global {
  namespace Express {
    interface Request {
      csrfToken?: () => string;
    }
  }
}

export {};
