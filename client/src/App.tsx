import { Routes, Route, Navigate, Link } from 'react-router-dom';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import Admin from '@/pages/Admin';
import RequireAuth from '@/components/RequireAuth';
import RequireRole from '@/components/RequireRole';
import { useAuth } from '@/context/AuthContext';

export default function App() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="p-4 border-b bg-white flex gap-4">
        <Link to="/">Home</Link>
        <Link to="/dashboard">Dashboard</Link>
        {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
        <div className="ml-auto flex gap-4">
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </div>
      </nav>
      <main className="p-6">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <RequireRole role="admin">
                  <Admin />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}
