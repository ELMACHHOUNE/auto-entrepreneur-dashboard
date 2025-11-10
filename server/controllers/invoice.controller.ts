import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Invoice } from '../models/Invoice';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

// List invoices for current user (optionally filter by year)
export async function listInvoices(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { year } = req.query;
    const filter: Record<string, any> = { userId };
    if (year) {
      const yNum = parseInt(String(year), 10);
      if (!isNaN(yNum)) filter.year = yNum;
    }
    const invoices = await Invoice.find(filter).sort({ year: -1, month: 1, createdAt: -1 });
    return res.json({ invoices });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch invoices' });
  }
}

// Create new invoice
export async function createInvoice(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { invoiceNumber, year, month, clientName, amount, tvaRate } = req.body || {};
    if (invoiceNumber === undefined || !year || !month || !clientName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const numAmount = parseFloat(String(amount));
    const rate = parseFloat(String(tvaRate));
    if (isNaN(numAmount) || numAmount < 0) return res.status(400).json({ error: 'Invalid amount' });
    if (isNaN(rate) || rate < 0) return res.status(400).json({ error: 'Invalid tvaRate' });
    const invNum = parseInt(String(invoiceNumber), 10);
    if (isNaN(invNum) || invNum < 0)
      return res.status(400).json({ error: 'Invalid invoiceNumber' });
    const doc = await Invoice.create({
      invoiceNumber: invNum,
      year: parseInt(String(year), 10),
      month: String(month),
      quarter: undefined as any, // will be derived in pre-validate if needed
      clientName: String(clientName).trim(),
      amount: numAmount,
      tvaRate: rate,
      userId: new mongoose.Types.ObjectId(userId),
    });
    // Persist JSON copy to per-user directory for optional file-based organization
    try {
      const email = req.user?.email || 'unknown';
      const safeEmail = email.replace(/[^a-zA-Z0-9._-]/g, '_');
      const baseDir = path.resolve(process.cwd(), 'server', 'uploads', 'invoices', safeEmail);
      fs.mkdirSync(baseDir, { recursive: true });
      const filePath = path.join(baseDir, `${doc._id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(doc.toJSON(), null, 2), 'utf-8');
    } catch {}
    return res.status(201).json({ invoice: doc });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to create invoice' });
  }
}

// Update invoice (only owner)
export async function updateInvoice(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const invoice = await Invoice.findById(id);
    if (!invoice) return res.status(404).json({ error: 'Not found' });
    if (String(invoice.userId) !== String(userId))
      return res.status(403).json({ error: 'Forbidden' });
    const { invoiceNumber, year, month, clientName, amount, tvaRate } = req.body || {};
    if (typeof invoiceNumber !== 'undefined') {
      const invNum = parseInt(String(invoiceNumber), 10);
      if (isNaN(invNum) || invNum < 0)
        return res.status(400).json({ error: 'Invalid invoiceNumber' });
      invoice.invoiceNumber = invNum;
    }
    if (typeof year !== 'undefined') invoice.year = parseInt(String(year), 10);
    if (typeof month !== 'undefined') invoice.month = String(month);
    if (typeof clientName !== 'undefined') invoice.clientName = String(clientName).trim();
    if (typeof amount !== 'undefined') {
      const numAmount = parseFloat(String(amount));
      if (isNaN(numAmount) || numAmount < 0)
        return res.status(400).json({ error: 'Invalid amount' });
      invoice.amount = numAmount;
    }
    if (typeof tvaRate !== 'undefined') {
      const rate = parseFloat(String(tvaRate));
      if (isNaN(rate) || rate < 0) return res.status(400).json({ error: 'Invalid tvaRate' });
      invoice.tvaRate = rate;
    }
    // recompute quarter defensively
    invoice.quarter = undefined as any;
    await invoice.save();
    // Sync file copy if exists
    try {
      const email = req.user?.email || 'unknown';
      const safeEmail = email.replace(/[^a-zA-Z0-9._-]/g, '_');
      const baseDir = path.resolve(process.cwd(), 'server', 'uploads', 'invoices', safeEmail);
      const filePath = path.join(baseDir, `${invoice._id}.json`);
      if (fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(invoice.toJSON(), null, 2), 'utf-8');
      }
    } catch {}
    return res.json({ invoice });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to update invoice' });
  }
}

// Delete invoice
export async function deleteInvoice(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const invoice = await Invoice.findById(id);
    if (!invoice) return res.status(404).json({ error: 'Not found' });
    if (String(invoice.userId) !== String(userId))
      return res.status(403).json({ error: 'Forbidden' });
    await invoice.deleteOne();
    // Remove file copy if exists
    try {
      const email = req.user?.email || 'unknown';
      const safeEmail = email.replace(/[^a-zA-Z0-9._-]/g, '_');
      const baseDir = path.resolve(process.cwd(), 'server', 'uploads', 'invoices', safeEmail);
      const filePath = path.join(baseDir, `${invoice._id}.json`);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {}
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to delete invoice' });
  }
}
