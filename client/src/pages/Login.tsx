import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';

type ApiError = { response?: { data?: { error?: string } } };

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation() as Location & { state?: { from?: { pathname?: string } } };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);

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
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Login</h2>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="w-full border p-2 rounded"
          placeholder="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          className="w-full border p-2 rounded"
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InteractiveHoverButton type="submit">Login</InteractiveHoverButton>
          <InteractiveHoverButton type="button" onClick={() => (window.location.href = googleUrl)}>
            Continue with Google
          </InteractiveHoverButton>
        </div>
      </form>
    </div>
  );
}
