import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AnimatedThemeToggler } from '@/registry/magicui/animated-theme-toggler';

export default function Navbar() {
  const { user } = useAuth();
  return (
    <nav className="p-4 border-b border-border bg-background text-foreground flex items-center gap-4">
      <Link to="/">Home</Link>
      <Link to="/dashboard">Dashboard</Link>
      {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
      <div className="ml-auto flex items-center gap-4">
        <AnimatedThemeToggler className="p-2 rounded hover:bg-accent" aria-label="Toggle theme" />
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
      </div>
    </nav>
  );
}
