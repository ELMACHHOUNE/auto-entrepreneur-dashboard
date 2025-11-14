import { Router } from 'express';
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
const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter: (_req, file, cb) => {
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
    if (!allowed.has(file.mimetype)) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyJwt, me);
router.post('/logout', logout);
router.put('/me', verifyJwt, updateMe);
router.put('/me/password', verifyJwt, changePassword);
router.put('/me/avatar', verifyJwt, upload.single('avatar'), updateAvatar);

export default router;
