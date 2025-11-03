import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Users, Settings, LayoutDashboard, LogOut } from 'lucide-react';

export default function AdminSidebar({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const baseURL = useMemo(() => import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '', []);
  const resolvedBase = useMemo(
    () => baseURL || (typeof window !== 'undefined' ? window.location.origin : ''),
    [baseURL]
  );

  const linkCls = (active: boolean) =>
    collapsed
      ? `flex items-center justify-center rounded p-2 hover:bg-accent ${
          active ? 'bg-accent font-medium' : ''
        }`
      : `flex items-center gap-2 rounded px-3 py-2 hover:bg-accent ${
          active ? 'bg-accent font-medium' : ''
        }`;

  const isAdminPath = (p: string) => pathname.startsWith('/admin') && pathname.includes(p);

  return (
    <div className="h-full">
      <div className={`mb-4 flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="h-10 w-10 overflow-hidden rounded-full border">
          {user?.avatarUrl ? (
            <img
              src={`${resolvedBase}${user.avatarUrl}`}
              alt="avatar"
              className="h-full w-full object-cover"
              width={40}
              height={40}
              decoding="async"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              N/A
            </div>
          )}
        </div>
        {!collapsed && (
          <div>
            <div className="text-sm text-muted-foreground">Admin</div>
            <div className="truncate font-medium">{user?.email}</div>
          </div>
        )}
      </div>

      <nav className={`flex flex-col ${collapsed ? 'items-center gap-1' : 'gap-2'}`}>
        <button
          onClick={() => {
            navigate('/dashboard');
            onNavigate?.();
          }}
          className={linkCls(pathname === '/dashboard')}
          title="Dashboard"
          aria-label="Dashboard"
        >
          <LayoutDashboard size={18} />
          {!collapsed && <span>Dashboard</span>}
        </button>
        <button
          onClick={() => {
            navigate('/admin/users');
            onNavigate?.();
          }}
          className={linkCls(isAdminPath('/users'))}
          title="Manage users"
          aria-label="Manage users"
        >
          <Users size={18} />
          {!collapsed && <span>Manage users</span>}
        </button>
        <button
          onClick={() => {
            navigate('/admin/services');
            onNavigate?.();
          }}
          className={linkCls(isAdminPath('/services'))}
          title="Manage services"
          aria-label="Manage services"
        >
          <Settings size={18} />
          {!collapsed && <span>Manage services</span>}
        </button>
        <button
          onClick={async () => {
            await logout();
            onNavigate?.();
          }}
          className={linkCls(false)}
          title="Logout"
          aria-label="Logout"
        >
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </nav>
    </div>
  );
}
