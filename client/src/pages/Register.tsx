import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { MagicCard } from '@/components/ui/magic-card';
import AuthSplit from '@/components/layout/AuthSplit';
import {
  User as UserIcon,
  Mail,
  Lock,
  Phone,
  IdCard,
  Briefcase,
  Chrome,
  UserPlus,
  Eye,
  EyeOff,
} from 'lucide-react';

type ApiError = { response?: { data?: { error?: string } } };

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    ICE: '',
    service: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null); // placeholder only, not uploaded
  const [err, setErr] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const googleUrl = `${import.meta.env.VITE_API_URL}api/auth/google`;

  const errors = useMemo(() => {
    const e: Partial<Record<keyof typeof form, string>> = {};
    if (!form.fullName || form.fullName.trim().length < 2) e.fullName = 'Full name is required';
    // Phone: allow +, spaces, parentheses, dashes; must contain 9-15 digits total
    const digits = form.phone.replace(/\D/g, '');
    if (!digits || digits.length < 9 || digits.length > 15) e.phone = 'Enter a valid phone number';
    // ICE: 15 digits
    const iceDigits = form.ICE.replace(/\D/g, '');
    if (iceDigits.length !== 15) e.ICE = 'ICE must be 15 digits';
    if (!form.service) e.service = 'Please select a service';
    if (!form.email) e.email = 'Email is required';
    if (!form.password || form.password.length < 6)
      e.password = 'Password must be at least 6 characters';
    return e;
  }, [form]);

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const onAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) return;
    setAvatarFile(f);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!isValid) {
      setErr('Please fix the errors and try again');
      return;
    }
    try {
      const { email, password, fullName, phone, ICE, service } = form;
      await register({ email, password, fullName, phone, ICE, service });
      nav('/dashboard', { replace: true });
    } catch (e: unknown) {
      const apiErr = e as ApiError;
      setErr(apiErr.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <AuthSplit rightClassName="flex h-full w-full items-center p-4 sm:p-6 md:p-8 overflow-auto">
      <MagicCard gradientColor={isDark ? '#262626' : '#D9D9D955'} className="h-full w-full p-0">
        <div className="flex h-full flex-col">
          <div className="border-border border-b p-4 [.border-b]:pb-4">
            <h3 className="text-lg font-semibold">Create account</h3>
            <p className="text-sm text-muted-foreground">Fill in your details to get started</p>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <form id="register-form" onSubmit={onSubmit} className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full  overflow-hidden flex items-center justify-center border">
                  {avatarFile ? (
                    <img
                      src={URL.createObjectURL(avatarFile)}
                      alt="avatar preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400 text-xs">Avatar</span>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium">Profile picture (optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onAvatarChange}
                    className="mt-1 block w-full text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold "
                  />
                </div>
              </div>

              <div className="relative">
                <UserIcon
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  className="w-full border p-2 pl-9 rounded"
                  placeholder="Full name"
                  value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })}
                />
              </div>
              {errors.fullName && <p className="text-red-600 text-sm">{errors.fullName}</p>}
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  className="w-full border p-2 pl-9 rounded"
                  placeholder="Email"
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
              {errors.email && <p className="text-red-600 text-sm">{errors.email}</p>}
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  className="w-full border p-2 pl-9 pr-10 rounded"
                  placeholder="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-red-600 text-sm">{errors.password}</p>}

              <div className="relative">
                <Phone
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  className="w-full border p-2 pl-9 rounded"
                  placeholder="Phone"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              {errors.phone && <p className="text-red-600 text-sm">{errors.phone}</p>}

              <div className="relative">
                <IdCard
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  className="w-full border p-2 pl-9 rounded"
                  placeholder="ICE (15 digits)"
                  value={form.ICE}
                  onChange={e => setForm({ ...form, ICE: e.target.value })}
                />
              </div>
              {errors.ICE && <p className="text-red-600 text-sm">{errors.ICE}</p>}
              <div className="relative">
                <Briefcase
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <select
                  className="w-full border p-2 pl-9 rounded bg-background text-foreground"
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
              {errors.service && <p className="text-red-600 text-sm ">{errors.service}</p>}
              {err && <p className="text-red-600 text-sm">{err}</p>}
            </form>
          </div>
          <div className="border-border border-t p-4 [.border-t]:pt-4">
            <div className="flex flex-col gap-3">
              <InteractiveHoverButton
                className="w-full"
                form="register-form"
                type="submit"
                disabled={!isValid}
              >
                <span className="inline-flex items-center gap-2">
                  <UserPlus size={16} />
                  Create account
                </span>
              </InteractiveHoverButton>
              <InteractiveHoverButton
                type="button"
                onClick={() => (window.location.href = googleUrl)}
              >
                <span className="inline-flex items-center gap-2">
                  <Chrome size={16} />
                  Continue with Google
                </span>
              </InteractiveHoverButton>
            </div>
            <p className="mt-3 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link className="text-primary underline-offset-4 hover:underline" to="/login">
                Login
              </Link>
            </p>
          </div>
        </div>
      </MagicCard>
    </AuthSplit>
  );
}
