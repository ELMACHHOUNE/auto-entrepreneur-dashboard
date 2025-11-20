import React from 'react';
import { NavLink } from 'react-router-dom';

export interface SidebarLink {
  to: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
}

export interface SidebarProps {
  title?: string;
  userEmail?: string;
  avatarUrl?: string | null;
  onNavigate?: () => void;
  collapsed?: boolean;
  links: SidebarLink[];
}

function classNames(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

// Generic, accessible Sidebar with support for collapsed mode and active link states.
function SidebarComponent({
  title,
  userEmail,
  avatarUrl,
  onNavigate,
  collapsed = false,
  links,
}: SidebarProps) {
  const baseURL = (import.meta.env?.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';
  const resolvedBase = baseURL || (typeof window !== 'undefined' ? window.location.origin : '');
  const avatarSrc = avatarUrl ? `${resolvedBase}${avatarUrl}` : null;

  return (
    <aside aria-label="Primary" className="h-full" role="navigation">
      <div className={classNames('mb-4 flex items-center', collapsed ? 'justify-center' : 'gap-3')}>
        <div className="h-10 w-10 overflow-hidden rounded-full border">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={userEmail ? `${userEmail} avatar` : 'User avatar'}
              className="h-full w-full object-cover"
              width={40}
              height={40}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              N/A
            </div>
          )}
        </div>
        {!collapsed && (
          <div className="min-w-0">
            {title && <div className="text-sm text-muted-foreground">{title}</div>}
            {userEmail && (
              <div className="truncate font-medium text-foreground" title={userEmail}>
                {userEmail}
              </div>
            )}
          </div>
        )}
      </div>

      <nav className={classNames('flex flex-col', collapsed ? 'items-center gap-1' : 'gap-2')}>
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={e => {
              link.onClick?.(e);
              onNavigate?.();
            }}
            className={({ isActive }) =>
              classNames(
                collapsed
                  ? 'flex items-center justify-center rounded p-2 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-foreground'
                  : 'flex items-center gap-2 rounded px-3 py-2 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-foreground',
                isActive &&
                  'bg-accent font-medium text-accent-foreground dark:text-accent-foreground'
              )
            }
            aria-label={link.label}
          >
            {link.icon}
            {!collapsed && <span>{link.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

const Sidebar = React.memo(SidebarComponent);
export default Sidebar;
