import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { env } from '../config/env';
import { Invoice } from '../models/Invoice';
import { User } from '../models/User';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  if (!arr.length) {
    throw new Error('Cannot pick from an empty array');
  }
  const idx = randomInt(0, arr.length - 1);
  return arr[idx] as T;
}

type SeedUserResult = { id: mongoose.Types.ObjectId; passwordNotice: string | null };

async function ensureUser(): Promise<SeedUserResult> {
  const existing = await User.findOne({ role: 'user' }).select('_id password email').lean();
  if (existing?.password) {
    return { id: new mongoose.Types.ObjectId(String(existing._id)), passwordNotice: null };
  }

  const email = `seeduser_${Date.now()}@example.com`;
  const seedPassword = process.env.SEED_USER_PASSWORD || crypto.randomBytes(24).toString('hex');
  const hashedPassword = await bcrypt.hash(seedPassword, 12);
  const created = await User.create({ email, role: 'user', password: hashedPassword });
  const notice = process.env.SEED_USER_PASSWORD
    ? `Seed user created with password from SEED_USER_PASSWORD env.`
    : `Seed user created with generated password: ${seedPassword}`;
  if (!process.env.SEED_USER_PASSWORD) {
    console.warn(notice);
  } else {
    console.log(notice);
  }
  return { id: created._id as mongoose.Types.ObjectId, passwordNotice: notice };
}

async function run() {
  await mongoose.connect(env.MONGO_URI);
  const { id: userId } = await ensureUser();
  console.log('Seeding invoices for user:', userId.toHexString());

  const year = new Date().getFullYear();
  await Invoice.deleteMany({ userId, year });

  const docs = [];
  const clientNames = [
    'Alpha SARL',
    'Beta Consulting',
    'Gamma Industries',
    'Delta Traders',
    'Epsilon Labs',
    'Zeta Group',
    'Eta Ventures',
    'Theta Studio',
    'Iota Services',
    'Kappa Retail',
    'Lambda Media',
    'Mu Logistics',
    'Nu Digital',
    'Xi Health',
    'Omicron Foods',
    'Pi Crafts',
    'Rho Travel',
    'Sigma Auto',
    'Tau Energy',
    'Upsilon Finance',
  ];
  const baseAmount = () => parseFloat((randomInt(500, 8000) + Math.random() * 250).toFixed(2));
  const tvaRates = [0.5, 1, 20];

  for (let i = 0; i < 20; i++) {
    const month = pick(MONTHS);
    const amount = baseAmount();
    const tvaRate = pick(tvaRates);
    const invoiceNumber = i + 1;
    const clientName = clientNames[i] ?? `Client ${i + 1}`;
    docs.push({
      invoiceNumber,
      year,
      month,
      quarter: undefined,
      clientName,
      amount,
      tvaRate,
      userId,
    });
  }

  const inserted = await Invoice.insertMany(docs);
  console.log(`Inserted ${inserted.length} invoices.`);
}

run()
  .catch(err => {
    console.error('Seed error:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
