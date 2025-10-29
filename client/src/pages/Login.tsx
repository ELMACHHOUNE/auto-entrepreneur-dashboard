import { FormEvent, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogIn, Mail } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation() as any;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      await login(email, password);
      nav(loc.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Login failed");
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
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full border p-2 rounded"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button
          className="w-full bg-blue-600 text-white p-2 rounded flex items-center justify-center gap-2"
          type="submit"
        >
          <LogIn size={18} /> Login
        </button>
      </form>
      <div className="mt-4 text-center">
        <a
          href={googleUrl}
          className="inline-flex items-center gap-2 border px-3 py-2 rounded hover:bg-gray-50"
        >
          <Mail size={18} /> Continue with Google
        </a>
      </div>
    </div>
  );
}
