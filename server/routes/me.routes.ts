import { Router } from 'express';
import { me, updateMe } from '../controllers/auth.controller';
import { verifyJwt } from '../middleware/auth';

const router = Router();

// GET /api/me/profile - get current user's profile
router.get('/profile', verifyJwt, me);

// PATCH /api/me/profile - update current user's profile
router.patch('/profile', verifyJwt, updateMe);

export default router;
