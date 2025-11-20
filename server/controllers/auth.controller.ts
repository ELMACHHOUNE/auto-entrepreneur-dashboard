import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { signToken } from '../utils/jwt';
import { env } from '../config/env';
import { cookieOpts } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import { parseProfileUpdate } from '../schemas/profile';

const TOKEN_COOKIE = 'token';
// default 7 days
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export async function register(req: Request, res: Response) {
  try {
    const {
      email,
      password,
      fullName,
      phone,
      ICE,
      service,
      profileKind,
      serviceCategory,
      serviceType,
      serviceActivity,
      companyTypeCode,
      plan,
    } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already in use' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hash,
      role: 'user',
      plan: plan === 'premium' ? 'premium' : 'freemium',
      fullName,
      phone,
      ICE,
      service,
      profileKind,
      serviceCategory,
      serviceType,
      serviceActivity,
      companyTypeCode,
    });

    const token = await signToken({ sub: user.id, role: user.role, email: user.email });
    res.cookie(TOKEN_COOKIE, token, {
      ...cookieOpts(env.IS_PROD, MAX_AGE_MS),
      httpOnly: true,
      secure: env.IS_PROD || process.env.COOKIE_SECURE === 'true',
    });
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

    const token = await signToken({ sub: user.id, role: user.role, email: user.email });
    res.cookie(TOKEN_COOKIE, token, {
      ...cookieOpts(env.IS_PROD, MAX_AGE_MS),
      httpOnly: true,
      secure: env.IS_PROD || process.env.COOKIE_SECURE === 'true',
    });
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
  res.clearCookie(TOKEN_COOKIE, {
    path: '/',
    sameSite: env.IS_PROD ? 'none' : 'lax',
    secure: env.IS_PROD,
    httpOnly: true,
  });
  return res.json({ ok: true });
}

// Update current user's profile (non-sensitive fields)
export async function updateMe(req: AuthRequest, res: Response) {
  try {
    const id = req.user?.sub;
    if (!id) return res.status(401).json({ error: 'Unauthorized' });

    const validation = parseProfileUpdate(req.body);
    if (!validation.ok) {
      return res.status(400).json({ error: 'Validation error', details: validation.errors });
    }
    const update = validation.data;

    if (update.email) {
      const existing = await User.findOne({ email: update.email, _id: { $ne: id } });
      if (existing) return res.status(409).json({ error: 'Email already in use' });
    }

    const user = await User.findByIdAndUpdate(id, update, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user });
  } catch {
    return res.status(500).json({ error: 'Failed to update profile' });
  }
}

// Change password: requires currentPassword and newPassword
export async function changePassword(req: AuthRequest, res: Response) {
  try {
    const id = req.user?.sub;
    if (!id) return res.status(401).json({ error: 'Unauthorized' });
    const { currentPassword, newPassword } = req.body || {};
    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    const user = await User.findById(id).select('+password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    // If user has a password set, verify currentPassword. If not (e.g., Google user), allow setting it.
    if (user.password) {
      if (!currentPassword) return res.status(400).json({ error: 'Current password required' });
      const ok = await bcrypt.compare(String(currentPassword), user.password);
      if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hash = await bcrypt.hash(String(newPassword), 10);
    user.password = hash;
    await user.save();
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Failed to change password' });
  }
}

// Update avatar: expects file uploaded via multer as req.file
export async function updateAvatar(req: AuthRequest, res: Response) {
  try {
    const id = req.user?.sub;
    if (!id) return res.status(401).json({ error: 'Unauthorized' });
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const newUrl = `/uploads/images/${file.filename}`;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.avatarUrl = newUrl;
    await user.save();

    return res.json({ user });
  } catch {
    return res.status(500).json({ error: 'Failed to update avatar' });
  }
}
