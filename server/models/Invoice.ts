import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInvoice extends Document {
  invoiceNumber: number;
  year: number;
  month: string; // English month name
  quarter: 'T1' | 'T2' | 'T3' | 'T4';
  clientName: string;
  amount: number; // total amount
  tvaRate: number; // percentage (e.g. 0.5, 1, 20)
  userId: mongoose.Types.ObjectId; // owner (creator)
  createdAt: Date;
  updatedAt: Date;
}

function monthToQuarter(month: string): 'T1' | 'T2' | 'T3' | 'T4' {
  const idx = [
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
  ].indexOf(month);
  if (idx < 3) return 'T1';
  if (idx < 6) return 'T2';
  if (idx < 9) return 'T3';
  return 'T4';
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: Number, required: true, min: 0 },
    year: { type: Number, required: true, index: true },
    month: { type: String, required: true },
    quarter: { type: String, required: true, enum: ['T1', 'T2', 'T3', 'T4'], index: true },
    clientName: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    tvaRate: { type: Number, required: true, min: 0 },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

// Derive quarter if missing (defensive)
InvoiceSchema.pre('validate', function (next) {
  if (!this.quarter && this.month) {
    this.quarter = monthToQuarter(this.month);
  }
  next();
});

export const Invoice: Model<IInvoice> =
  mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);
