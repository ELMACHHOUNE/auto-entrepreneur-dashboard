import { Router } from 'express';
import passport from 'passport';
import {
  login,
  me,
  register,
  logout,
  updateMe,
  changePassword,
  updateAvatar,
} from '../controllers/auth.controller';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { verifyJwt } from '../middleware/auth';

const router = Router();
// Multer setup for avatar uploads
// Store uploads under server/uploads/images (consistent for dev and prod)
const uploadDir = path.resolve(process.cwd(), 'server/uploads/images');
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    } catch (err) {
      cb(err as Error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const userId = (req as any)?.user?.sub || Date.now();
    const ext = (path.extname(file.originalname) || '.jpg').toLowerCase();
    cb(null, `avatar-${userId}${ext}`);
  },
});
const upload = multer({ storage });

router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyJwt, me);
router.post('/logout', logout);
router.put('/me', verifyJwt, updateMe);
router.put('/me/password', verifyJwt, changePassword);
router.put('/me/avatar', verifyJwt, upload.single('avatar'), updateAvatar);

// Google OAuth
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (_req, res) => {
    // On success, passport strategy already set cookie; redirect to client app dashboard
    res.redirect('/'); // optionally override with client URL if served separately
  }
);

export default router;
