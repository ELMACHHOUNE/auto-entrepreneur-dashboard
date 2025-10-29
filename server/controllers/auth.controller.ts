import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { signToken } from '../utils/jwt';
import { env } from '../config/env';
import { cookieOpts } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';

const TOKEN_COOKIE = 'token';
// default 7 days
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export async function register(req: Request, res: Response) {
  try {
    const { email, password, fullName, phone, ICE, service } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already in use' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hash, role: 'user', fullName, phone, ICE, service });

    const token = signToken({ sub: user.id, role: user.role, email: user.email });
    res.cookie(TOKEN_COOKIE, token, cookieOpts(env.IS_PROD, MAX_AGE_MS));
    return res.status(201).json({ user });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to register' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken({ sub: user.id, role: user.role, email: user.email });
    res.cookie(TOKEN_COOKIE, token, cookieOpts(env.IS_PROD, MAX_AGE_MS));
    return res.json({ user: user.toJSON() });
  } catch {
    return res.status(500).json({ error: 'Failed to login' });
  }
}

export async function me(req: AuthRequest, res: Response) {
  try {
    const id = req.user?.sub;
    if (!id) return res.status(401).json({ error: 'Unauthorized' });
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie(TOKEN_COOKIE, { path: '/', sameSite: env.IS_PROD ? 'none' : 'lax', secure: env.IS_PROD, httpOnly: true });
  return res.json({ ok: true });
}
