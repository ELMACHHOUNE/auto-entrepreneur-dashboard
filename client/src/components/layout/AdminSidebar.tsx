import { Users, Settings, LogOut } from 'lucide-react';
import Sidebar, { type SidebarLink } from '@/components/ui/sidebar';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function AdminSidebar({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const links: SidebarLink[] = [
    { to: '/admin/users', label: t('sidebar.admin.manageUsers'), icon: <Users size={18} /> },
    {
      to: '/admin/services',
      label: t('sidebar.admin.manageServices'),
      icon: <Settings size={18} />,
    },
    {
      to: '/login',
      label: t('sidebar.admin.logout'),
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
      title={t('sidebar.admin.title')}
      userEmail={user?.email || ''}
      avatarUrl={user?.avatarUrl || null}
      collapsed={collapsed}
      links={links}
      onNavigate={handleNavigate}
    />
  );
}
