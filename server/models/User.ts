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
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    fullName: { type: String },
    phone: { type: String },
    ICE: { type: String },
    service: { type: String },
    googleId: { type: String },
  },
  { timestamps: true }
);

// Ensure password is not selected by default
UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  }
});

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
