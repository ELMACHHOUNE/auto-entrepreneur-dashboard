import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, User as UserIcon, LogOut } from 'lucide-react';

export default function AppSidebar({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const baseURL = useMemo(() => import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '', []);

  const linkCls = (active: boolean) =>
    collapsed
      ? `flex items-center justify-center rounded p-2 hover:bg-muted ${
          active ? 'bg-muted font-medium' : ''
        }`
      : `flex items-center gap-2 rounded px-3 py-2 hover:bg-muted ${
          active ? 'bg-muted font-medium' : ''
        }`;

  return (
    <div className="h-full">
      <div className={`mb-4 flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="h-10 w-10 overflow-hidden rounded-full border">
          {user?.avatarUrl ? (
            // Note: avatarUrl is like /uploads/images/filename
            <img
              src={`${baseURL}${user.avatarUrl}`}
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
            <div className="text-sm text-muted-foreground">Signed in as</div>
            <div className="truncate font-medium">{user?.email}</div>
          </div>
        )}
      </div>
      <nav className={`flex flex-col ${collapsed ? 'items-center gap-1' : 'gap-2'}`}>
        <Link
          to="/dashboard"
          onClick={onNavigate}
          className={linkCls(pathname === '/dashboard')}
          title="Dashboard"
          aria-label="Dashboard"
        >
          <LayoutDashboard size={18} />
          {!collapsed && <span>Dashboard</span>}
        </Link>
        <Link
          to="/profile"
          onClick={onNavigate}
          className={linkCls(pathname === '/profile')}
          title="Profile"
          aria-label="Profile"
        >
          <UserIcon size={18} />
          {!collapsed && <span>Profile</span>}
        </Link>
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
