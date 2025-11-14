import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';

// GET /api/admin/users
export async function listUsers(req: Request, res: Response) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    // Validate and coerce accidental 'undefined' or 'null' string query values to empty
    const rawSearch = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const search = ['undefined', 'null'].includes(rawSearch.toLowerCase()) ? '' : rawSearch;
    // Bound search length to avoid excessive regex work
    const boundedSearch = search.slice(0, 100);

    const query: Record<string, unknown> = {};
    if (boundedSearch) {
      const escaped = boundedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(escaped, 'i');
      query.$or = [{ email: pattern }, { fullName: pattern }, { phone: pattern }];
    }

    const [items, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(query),
    ]);

    return res.json({ items, total, page, limit });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to list users' });
  }
}

// POST /api/admin/users
export async function createUser(req: Request, res: Response) {
  try {
    const {
      email,
      password,
      role,
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

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email already in use' });

    const hash = await bcrypt.hash(String(password), 10);
    const user = await User.create({
      email,
      password: hash,
      role: role || 'user',
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
    return res.status(201).json({ user });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to create user' });
  }
}

// PATCH /api/admin/users/:id
export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      email,
      role,
      fullName,
      phone,
      ICE,
      service,
      password,
      profileKind,
      serviceCategory,
      serviceType,
      serviceActivity,
      companyTypeCode,
    } = req.body || {};

    const update: Record<string, unknown> = {};
    if (typeof email !== 'undefined') {
      const nextEmail = String(email).toLowerCase();
      const exists = await User.findOne({ email: nextEmail, _id: { $ne: id } });
      if (exists) return res.status(409).json({ error: 'Email already in use' });
      update.email = nextEmail;
    }
    if (typeof role !== 'undefined') update.role = role;
    if (typeof fullName !== 'undefined') update.fullName = fullName;
    if (typeof phone !== 'undefined') update.phone = phone;
    if (typeof ICE !== 'undefined') update.ICE = ICE;
    if (typeof service !== 'undefined') update.service = service;
    if (typeof profileKind !== 'undefined') update.profileKind = profileKind;
    if (typeof serviceCategory !== 'undefined') update.serviceCategory = serviceCategory;
    if (typeof serviceType !== 'undefined') update.serviceType = serviceType;
    if (typeof serviceActivity !== 'undefined') update.serviceActivity = serviceActivity;
    if (typeof companyTypeCode !== 'undefined') update.companyTypeCode = companyTypeCode;
    if (typeof password !== 'undefined' && String(password).length > 0) {
      update.password = await bcrypt.hash(String(password), 10);
    }

    const user = await User.findByIdAndUpdate(id, update, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to update user' });
  }
}

// DELETE /api/admin/users/:id
export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to delete user' });
  }
}
