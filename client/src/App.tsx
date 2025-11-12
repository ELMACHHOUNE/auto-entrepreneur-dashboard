import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Loader from '@/components/ui/Loader';
const Landing = lazy(() => import('@/pages/Landing'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Profile = lazy(() => import('@/pages/Profile'));
const Admin = lazy(() => import('@/pages/Admin'));
const AdminUsers = lazy(() => import('@/pages/admin/Users.tsx'));
const AdminServices = lazy(() => import('@/pages/admin/Services.tsx'));
import RequireAuth from '@/components/RequireAuth';
import RequireRole from '@/components/RequireRole';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/layout/Navbar';
import AdminLayout from '@/components/layout/AdminLayout';
import ErrorPage from '@/components/ui/ErrorPage';

export default function App() {
  useAuth();
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="p-6">
        <Suspense
          fallback={
            <div className="flex min-h-[60vh] items-center justify-center">
              <Loader size={72} label="Loading application" />
            </div>
          }
        >
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
              path="/profile"
              element={
                <RequireAuth>
                  <Profile />
                </RequireAuth>
              }
            />
            <Route
              path="/admin"
              element={
                <RequireAuth>
                  <RequireRole role="admin">
                    <AdminLayout />
                  </RequireRole>
                </RequireAuth>
              }
            >
              <Route index element={<Admin />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="services" element={<AdminServices />} />
            </Route>
            <Route path="*" element={<ErrorPage code={404} message="Page not found" />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}
