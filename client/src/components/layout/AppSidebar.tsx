import {
  LayoutDashboard,
  User as UserIcon,
  LogOut,
  Files as FilesIcon,
  Crown,
  HardDrive,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/ui/sidebar';
import type { SidebarLink } from '@/components/ui/sidebar';

export default function AppSidebar({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const { user, logout } = useAuth();

  const links: SidebarLink[] = [
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { to: '/invoices', label: 'Invoices Files', icon: <FilesIcon size={18} /> },
    { to: '/profile', label: 'Profile', icon: <UserIcon size={18} /> },
    {
      to: '/login',
      label: 'Logout',
      icon: <LogOut size={18} />,
      onClick: async () => {
        // Trigger logout to clear auth state immediately so Navbar updates
        // Don't prevent navigation; after logout, router will navigate to /login
        await logout();
      },
    },
  ];

  const handleNavigate = async () => {
    // If current link is Logout (navigates to /login), auth guard will redirect after we logout.
    // Since we can't detect which link in this simple delegation, rely on Login route guard after logout.
    onNavigate?.();
  };

  const plan = user?.plan === 'premium' ? 'premium' : user?.plan === 'freemium' ? 'freemium' : null;

  return (
    <div className="h-full flex flex-col">
      {plan && (
        <div className="mb-3 flex items-center justify-center">
          <div
            className={
              'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium shadow-sm transition-colors ' +
              (plan === 'premium'
                ? 'bg-linear-to-r from-accent/30 to-accent/10 text-accent border-accent/40'
                : 'bg-muted text-muted-foreground border-border')
            }
            aria-label={`Subscription plan: ${plan}`}
            title={`Subscription plan: ${plan}`}
          >
            {plan === 'premium' ? (
              <Crown size={14} aria-hidden />
            ) : (
              <HardDrive size={14} aria-hidden />
            )}
            {!collapsed && <span className="capitalize">{plan}</span>}
          </div>
        </div>
      )}
      <Sidebar
        title="Signed in as"
        userEmail={user?.email || ''}
        avatarUrl={user?.avatarUrl || null}
        collapsed={collapsed}
        links={links}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
