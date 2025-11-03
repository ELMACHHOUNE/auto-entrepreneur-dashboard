import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'user' | 'admin';

export interface IUser extends Document {
  email: string;
  password?: string; // hashed
  role: UserRole;
  fullName?: string;
  phone?: string;
  ICE?: string;
  service?: string;
  avatarUrl?: string;
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
  // Structured service fields
  profileKind?: 'guide_auto_entrepreneur' | 'company_guide';
  serviceCategory?: string;
  serviceType?: string;
  serviceActivity?: string;
  companyTypeCode?: string;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    fullName: { type: String },
    phone: {
      type: String,
      validate: {
        validator: function (v: string | undefined) {
          if (v == null || v === '') return true; // allow empty
          return /^\d{9,15}$/.test(v);
        },
        message: 'Phone must be 9-15 digits',
      },
    },
    ICE: {
      type: String,
      validate: {
        validator: function (v: string | undefined) {
          if (v == null || v === '') return true; // allow empty
          return /^\d{15}$/.test(v);
        },
        message: 'ICE must be exactly 15 digits',
      },
    },
    service: { type: String },
    // New structured fields (all optional)
    profileKind: {
      type: String,
      enum: ['guide_auto_entrepreneur', 'company_guide'],
      required: false,
      index: true,
    },
    serviceCategory: { type: String },
    serviceType: { type: String },
    serviceActivity: { type: String },
    companyTypeCode: { type: String },
    avatarUrl: { type: String },
    googleId: { type: String },
  },
  { timestamps: true }
);

// Ensure password is not selected by default
UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  },
});

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
