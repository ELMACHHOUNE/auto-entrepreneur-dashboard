import { LayoutDashboard, User as UserIcon, LogOut } from 'lucide-react';
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
  const { user } = useAuth();

  const links: SidebarLink[] = [
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { to: '/profile', label: 'Profile', icon: <UserIcon size={18} /> },
    // Logout as a link surrogate: we'll handle click to perform logout then rely on auth guard
    { to: '/login', label: 'Logout', icon: <LogOut size={18} /> },
  ];

  const handleNavigate = async () => {
    // If current link is Logout (navigates to /login), auth guard will redirect after we logout.
    // Since we can't detect which link in this simple delegation, rely on Login route guard after logout.
    onNavigate?.();
  };

  return (
    <Sidebar
      title="Signed in as"
      userEmail={user?.email || ''}
      avatarUrl={user?.avatarUrl || null}
      collapsed={collapsed}
      links={links}
      onNavigate={handleNavigate}
    />
  );
}
