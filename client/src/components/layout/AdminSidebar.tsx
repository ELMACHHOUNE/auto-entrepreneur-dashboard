import { Users, Settings, LogOut } from 'lucide-react';
import Sidebar, { type SidebarLink } from '@/components/ui/sidebar';
import { useAuth } from '@/context/AuthContext';

export default function AdminSidebar({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const { user, logout } = useAuth();

  const links: SidebarLink[] = [
    { to: '/admin/users', label: 'Manage users', icon: <Users size={18} /> },
    { to: '/admin/services', label: 'Manage services', icon: <Settings size={18} /> },
    {
      to: '/login',
      label: 'Logout',
      icon: <LogOut size={18} />,
      onClick: async () => {
        await logout();
      },
    },
  ];

  const handleNavigate = async () => {
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
