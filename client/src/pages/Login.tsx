import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { MagicCard } from '@/components/ui/magic-card';
import AuthSplit from '@/components/layout/AuthSplit';
import { Eye, EyeOff, Mail, Lock, LogIn, Chrome } from 'lucide-react';

type ApiError = { response?: { data?: { error?: string } } };

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation() as Location & { state?: { from?: { pathname?: string } } };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      await login(email, password);
      nav(loc.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (e: unknown) {
      const apiErr = e as ApiError;
      setErr(apiErr.response?.data?.error || 'Login failed');
    }
  };

  const googleUrl = `${import.meta.env.VITE_API_URL}api/auth/google`;

  return (
    <AuthSplit rightClassName="flex h-full w-full items-center justify-center p-4 sm:p-6 md:p-8 overflow-auto">
      <MagicCard gradientColor={isDark ? '#262626' : '#D9D9D955'} className="w-full max-w-sm p-0">
        <div className="border-border border-b p-4 [.border-b]:pb-4">
          <h3 className="text-lg font-semibold">Login</h3>
          <p className="text-sm text-muted-foreground">
            Enter your credentials to access your account
          </p>
        </div>
        <div className="p-4">
          <form id="login-form" onSubmit={onSubmit} className="space-y-3">
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                className="w-full border p-2 pl-9 rounded"
                placeholder="Email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                className="w-full border p-2 pl-9 pr-10 rounded"
                placeholder="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
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
            {err && <p className="text-red-600 text-sm">{err}</p>}
          </form>
        </div>
        <div className="border-border border-t p-4 [.border-t]:pt-4">
          <div className="flex flex-col gap-3">
            <InteractiveHoverButton type="submit" form="login-form">
              <span className="inline-flex items-center gap-2">
                <LogIn size={16} />
                Login
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
            Don&apos;t have an account?{' '}
            <Link className="text-primary underline-offset-4 hover:underline" to="/register">
              Register
            </Link>
          </p>
        </div>
      </MagicCard>
    </AuthSplit>
  );
}
