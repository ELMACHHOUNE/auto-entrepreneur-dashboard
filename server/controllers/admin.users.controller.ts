import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';

function parseIntParam(value: unknown, { min, max }: { min: number; max: number }) {
  if (typeof value === 'undefined') return undefined;
  const num = Number(value);
  if (!Number.isInteger(num) || num < min || num > max) return null;
  return num;
}

// GET /api/admin/users
export async function listUsers(req: Request, res: Response) {
  try {
    const parsedPage = parseIntParam(req.query.page, { min: 1, max: 1000 });
    if (parsedPage === null) return res.status(400).json({ error: 'Invalid page parameter' });
    const parsedLimit = parseIntParam(req.query.limit, { min: 1, max: 100 });
    if (parsedLimit === null) return res.status(400).json({ error: 'Invalid limit parameter' });

    const page = parsedPage ?? 1;
    const limit = parsedLimit ?? 10;

    const rawSearchValue = req.query.search;
    const rawSearch = Array.isArray(rawSearchValue)
      ? rawSearchValue[0] ?? ''
      : typeof rawSearchValue === 'string'
      ? rawSearchValue
      : '';
    const normalizedSearch = typeof rawSearch === 'string' ? rawSearch : String(rawSearch ?? '');
    const cleanedSearch = normalizedSearch.trim();
    const search = ['undefined', 'null'].includes(cleanedSearch.toLowerCase()) ? '' : cleanedSearch;
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
      plan,
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
      plan,
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
    if (typeof plan !== 'undefined') {
      update.plan = plan === 'premium' ? 'premium' : 'freemium';
    }
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

// GET /api/admin/users/stats/yearly
export async function usersStatsYearly(_req: Request, res: Response) {
  try {
    const agg = await User.aggregate([
      {
        $group: {
          _id: { $year: '$createdAt' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          year: '$_id',
          count: 1,
        },
      },
    ]);
    return res.json({ items: agg });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to compute yearly user stats' });
  }
}

// GET /api/admin/users/stats/by-category
// Category here refers to profileKind (guide_auto_entrepreneur | company_guide | unknown)
export async function usersStatsByCategory(_req: Request, res: Response) {
  try {
    const agg = await User.aggregate([
      {
        $group: {
          _id: { $ifNull: ['$profileKind', 'unknown'] },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          _id: 0,
          category: '$_id',
          count: 1,
        },
      },
    ]);
    return res.json({ items: agg });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to compute user category stats' });
  }
}

// GET /api/admin/users/stats/count
export async function usersCount(_req: Request, res: Response) {
  try {
    const total = await User.countDocuments({});
    return res.json({ total });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to count users' });
  }
}
