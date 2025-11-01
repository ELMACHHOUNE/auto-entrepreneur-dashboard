import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validate(schema: ZodSchema<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const flat = result.error.flatten();
      return res.status(400).json({ error: 'Validation error', details: flat });
    }
    // Replace body with parsed, trimmed/coerced values
    (req as any).body = result.data;
    return next();
  };
}
