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
    } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already in use' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hash,
      role: 'user',
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

    // Allow only specific fields to be updated
    const {
      fullName,
      phone,
      ICE,
      service,
      email,
      profileKind,
      serviceCategory,
      serviceType,
      serviceActivity,
      companyTypeCode,
    } = req.body || {};
    const update: Record<string, unknown> = {};
    if (typeof fullName !== 'undefined') update.fullName = fullName;
    // Phone: allow empty, otherwise must be 9–15 digits
    if (typeof phone !== 'undefined') {
      const p = String(phone).trim();
      if (p === '') {
        update.phone = '';
      } else if (!/^\d{9,15}$/.test(p)) {
        return res.status(400).json({ error: 'Phone must be 9–15 digits' });
      } else {
        update.phone = p;
      }
    }
    // ICE: allow empty, otherwise must be exactly 15 digits
    if (typeof ICE !== 'undefined') {
      const ice = String(ICE).trim();
      if (ice === '') {
        update.ICE = '';
      } else if (!/^\d{15}$/.test(ice)) {
        return res.status(400).json({ error: 'ICE must be exactly 15 digits' });
      } else {
        update.ICE = ice;
      }
    }
    if (typeof service !== 'undefined') update.service = service;
    if (typeof profileKind !== 'undefined') update.profileKind = profileKind;
    if (typeof serviceCategory !== 'undefined') update.serviceCategory = serviceCategory;
    if (typeof serviceType !== 'undefined') update.serviceType = serviceType;
    if (typeof serviceActivity !== 'undefined') update.serviceActivity = serviceActivity;
    if (typeof companyTypeCode !== 'undefined') update.companyTypeCode = companyTypeCode;
    if (typeof email !== 'undefined') {
      // normalize and ensure uniqueness
      const nextEmail = String(email).toLowerCase();
      const existing = await User.findOne({ email: nextEmail, _id: { $ne: id } });
      if (existing) return res.status(409).json({ error: 'Email already in use' });
      update.email = nextEmail;
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

    const oldUrl = user.avatarUrl;
    user.avatarUrl = newUrl;
    await user.save();

    // Attempt to delete previous file if it exists and filename differs
    if (oldUrl && oldUrl !== newUrl) {
      const filename = oldUrl.split('/').pop() as string;
      const path1 = require('path').resolve(__dirname, '../uploads/images', filename);
      const path2 = require('path').resolve(process.cwd(), 'server/uploads/images', filename);
      const fs = require('fs');
      try {
        if (fs.existsSync(path1)) fs.unlinkSync(path1);
      } catch {}
      try {
        if (fs.existsSync(path2)) fs.unlinkSync(path2);
      } catch {}
    }

    return res.json({ user });
  } catch {
    return res.status(500).json({ error: 'Failed to update avatar' });
  }
}
