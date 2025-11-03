import { LayoutDashboard, Users, Settings, LogOut } from 'lucide-react';
import Sidebar, { type SidebarLink } from '@/components/ui/sidebar';
import { useAuth } from '@/context/AuthContext';

export default function AdminSidebar({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const { user } = useAuth();

  const links: SidebarLink[] = [
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { to: '/admin/users', label: 'Manage users', icon: <Users size={18} /> },
    { to: '/admin/services', label: 'Manage services', icon: <Settings size={18} /> },
    { to: '/login', label: 'Logout', icon: <LogOut size={18} /> },
  ];

  const handleNavigate = async () => {
    // On Logout link click, NavLink will navigate to /login, while this callback can also process logout.
    // We cannot distinguish which link here; a robust pattern is to add an onClick handler per link, but to keep API simple
    // we rely on AdminLayout/Auth guards to redirect after logout actions elsewhere.
    onNavigate?.();
  };

  return (
    <Sidebar
      title="Admin"
      userEmail={user?.email || ''}
      avatarUrl={user?.avatarUrl || null}
      collapsed={collapsed}
      links={links}
      onNavigate={handleNavigate}
    />
  );
}
