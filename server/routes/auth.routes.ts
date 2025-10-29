import { Router } from 'express';
import passport from 'passport';
import { login, me, register, logout } from '../controllers/auth.controller';
import { verifyJwt } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyJwt, me);
router.post('/logout', logout);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (_req, res) => {
    // On success, passport strategy already set cookie; redirect to client app dashboard
    res.redirect('/'); // optionally override with client URL if served separately
  }
);

export default router;
