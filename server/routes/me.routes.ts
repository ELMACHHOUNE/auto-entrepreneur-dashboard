import { Router } from 'express';
import { me, updateMe } from '../controllers/auth.controller';
import { verifyJwt } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateProfileSchema } from '../schemas/profile';

const router = Router();

// GET /api/me/profile - get current user's profile
router.get('/profile', verifyJwt, me);

// PATCH /api/me/profile - update current user's profile with zod validation
router.patch('/profile', verifyJwt, validate(updateProfileSchema), updateMe);

export default router;
