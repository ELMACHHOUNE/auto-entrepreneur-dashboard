import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { Briefcase, IdCard, Phone, User as UserIcon, Mail, Lock } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function Profile() {
  const { user, updateProfile, changePassword, updateAvatar } = useAuth();
  const [form, setForm] = useState({
    email: user?.email || '',
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    ICE: user?.ICE || '',
    service: user?.service || '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwdOk, setPwdOk] = useState(false);
  const [pwdErr, setPwdErr] = useState<string | null>(null);

  useEffect(() => {
    // keep email in sync if user changes via refresh
    setForm(f => ({ ...f, email: user?.email || f.email }));
  }, [user?.email]);

  const errors = useMemo(() => {
    const e: Partial<Record<keyof typeof form, string>> = {};
    if (form.fullName && form.fullName.trim().length < 2) e.fullName = 'Full name is too short';
    const digits = form.phone.replace(/\D/g, '');
    if (form.phone && (digits.length < 9 || digits.length > 15))
      e.phone = 'Enter a valid phone number';
    if (form.ICE && form.ICE.replace(/\D/g, '').length !== 15) e.ICE = 'ICE must be 15 digits';
    if (!form.email) e.email = 'Email is required';
    return e;
  }, [form]);

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setOk(false);
    if (!isValid) return;
    try {
      setSaving(true);
      await updateProfile(form);
      if (avatarFile) {
        await updateAvatar(avatarFile);
        setAvatarFile(null);
      }
      setOk(true);
    } catch {
      setErr('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const onAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) return;
    setAvatarFile(f);
  };

  const onChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwdErr(null);
    setPwdOk(false);
    if (!pwd.newPassword || pwd.newPassword.length < 6) {
      setPwdErr('New password must be at least 6 characters');
      return;
    }
    if (pwd.newPassword !== pwd.confirm) {
      setPwdErr('Passwords do not match');
      return;
    }
    try {
      await changePassword({
        currentPassword: pwd.currentPassword || undefined,
        newPassword: pwd.newPassword,
      });
      setPwdOk(true);
      setPwd({ currentPassword: '', newPassword: '', confirm: '' });
    } catch {
      setPwdErr('Failed to change password');
    }
  };

  const baseURL = useMemo(() => import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '', []);
  const resolvedBase = useMemo(
    () => baseURL || (typeof window !== 'undefined' ? window.location.origin : ''),
    [baseURL]
  );

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-3xl">
        <h2 className="mb-4 text-2xl font-semibold">Profile settings</h2>
        <form onSubmit={onSubmit} className="space-y-3 rounded-lg border p-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border">
              {avatarFile ? (
                <img
                  src={URL.createObjectURL(avatarFile)}
                  alt="avatar"
                  className="h-full w-full object-cover"
                  width={64}
                  height={64}
                  decoding="async"
                  loading="lazy"
                />
              ) : user?.avatarUrl ? (
                <img
                  src={`${resolvedBase}${user.avatarUrl}`}
                  alt="avatar"
                  className="h-full w-full object-cover"
                  width={64}
                  height={64}
                  decoding="async"
                  loading="lazy"
                />
              ) : (
                <span className="text-xs text-muted-foreground">Avatar</span>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium">Profile picture</label>
              <input
                type="file"
                accept="image/*"
                onChange={onAvatarChange}
                className="mt-1 block w-full text-sm file:mr-4 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-semibold"
              />
            </div>
          </div>
          {/* Email */}
          <div className="relative">
            <Mail
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              className="w-full rounded border p-2 pl-9"
              placeholder="Email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>
          {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
          <div className="relative">
            <UserIcon
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              className="w-full rounded border p-2 pl-9"
              placeholder="Full name"
              value={form.fullName}
              onChange={e => setForm({ ...form, fullName: e.target.value })}
            />
          </div>
          {errors.fullName && <p className="text-sm text-red-600">{errors.fullName}</p>}
          <div className="relative">
            <Phone
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              className="w-full rounded border p-2 pl-9"
              placeholder="Phone"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
          <div className="relative">
            <IdCard
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              className="w-full rounded border p-2 pl-9"
              placeholder="ICE (15 digits)"
              value={form.ICE}
              onChange={e => setForm({ ...form, ICE: e.target.value })}
            />
          </div>
          {errors.ICE && <p className="text-sm text-red-600">{errors.ICE}</p>}
          <div className="relative">
            <Briefcase
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <select
              className="w-full rounded border bg-background p-2 pl-9 text-foreground"
              value={form.service}
              onChange={e => setForm({ ...form, service: e.target.value })}
            >
              <option value="">Select service</option>
              <option value="consulting">Consulting</option>
              <option value="design">Design</option>
              <option value="development">Development</option>
              <option value="marketing">Marketing</option>
              <option value="other">Other</option>
            </select>
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          {ok && <p className="text-sm text-emerald-600">Profile updated</p>}
          <div>
            <InteractiveHoverButton type="submit" disabled={!isValid || saving} className="w-full">
              Save changes
            </InteractiveHoverButton>
          </div>
        </form>

        {/* Change Password */}
        <form onSubmit={onChangePassword} className="mt-6 space-y-3 rounded-lg border p-4">
          <h3 className="text-lg font-medium">Change password</h3>
          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="password"
              className="w-full rounded border p-2 pl-9"
              placeholder="Current password (if set)"
              value={pwd.currentPassword}
              onChange={e => setPwd({ ...pwd, currentPassword: e.target.value })}
            />
          </div>
          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="password"
              className="w-full rounded border p-2 pl-9"
              placeholder="New password"
              value={pwd.newPassword}
              onChange={e => setPwd({ ...pwd, newPassword: e.target.value })}
            />
          </div>
          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="password"
              className="w-full rounded border p-2 pl-9"
              placeholder="Confirm new password"
              value={pwd.confirm}
              onChange={e => setPwd({ ...pwd, confirm: e.target.value })}
            />
          </div>
          {pwdErr && <p className="text-sm text-red-600">{pwdErr}</p>}
          {pwdOk && <p className="text-sm text-emerald-600">Password changed</p>}
          <div>
            <InteractiveHoverButton type="submit" className="w-full">
              Update password
            </InteractiveHoverButton>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
