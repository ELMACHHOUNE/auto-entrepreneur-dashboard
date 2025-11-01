import { z } from 'zod';

export const updateProfileSchema = z
  .object({
    email: z.string().email().optional(),
    fullName: z
      .union([z.string().trim().min(2, 'Full name is too short'), z.literal('')])
      .optional(),
    phone: z
      .union([z.string().regex(/^\d{9,15}$/, 'Phone must be 9–15 digits'), z.literal('')])
      .optional(),
    ICE: z
      .union([z.string().regex(/^\d{15}$/, 'ICE must be exactly 15 digits'), z.literal('')])
      .optional(),
    service: z.string().optional(),
  })
  .strict();
