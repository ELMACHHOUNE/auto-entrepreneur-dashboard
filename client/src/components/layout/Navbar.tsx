import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AnimatedThemeToggler } from '@/registry/magicui/animated-theme-toggler';
import {
  Navbar as RNavbar,
  NavBody,
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
} from '@/components/ui/resizable-navbar';
import { Menu, MenuItem } from '@/components/ui/navbar-menu';

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  return (
    <RNavbar className="sticky top-0 z-50 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60 border-b border-border">
      <NavBody>
        {/* Left: Logo */}
        <button
          onClick={() => nav('/')}
          className="relative z-20 mr-4 flex items-center space-x-2 px-2 py-1 text-sm font-semibold text-foreground hover:text-primary"
          aria-label="Go to home"
        >
          <span className="text-foreground hover:underline hover:text-accent">AutoDash</span>
        </button>

        {/* Center: Old styled menu */}
        <div className="flex-1 flex justify-center">
          <Menu
            setActive={setActive}
            className="gap-6 rounded-full border  border-border bg-card text-card-foreground shadow-input px-6 py-3"
          >
            <MenuItem
              setActive={(val: string) => setActive(val)}
              active={active}
              item="Home"
              onClick={() => nav('/')}
            />
            <MenuItem
              setActive={(val: string) => setActive(val)}
              active={active}
              item="Dashboard"
              onClick={() => nav('/dashboard')}
            />
            {user?.role === 'admin' && (
              <MenuItem
                setActive={(val: string) => setActive(val)}
                active={active}
                item="Admin"
                onClick={() => nav('/admin')}
              />
            )}
          </Menu>
        </div>

        {/* Right: Theme toggle + Auth actions */}
        <div className="flex items-center gap-4">
          <AnimatedThemeToggler
            className="p-1.5 rounded hover:bg-accent"
            aria-label="Toggle theme"
          />
          {user ? (
            <button
              className="text-foreground underline-offset-4 hover:underline hover:text-accent"
              onClick={async () => {
                await logout();
                nav('/', { replace: true });
              }}
            >
              Logout
            </button>
          ) : (
            <>
              <button
                className="text-foreground hover:text-accent hover:underline"
                onClick={() => nav('/login')}
              >
                Login
              </button>
              <button
                className="text-foreground hover:text-accent hover:underline"
                onClick={() => nav('/register')}
              >
                Register
              </button>
            </>
          )}
        </div>
      </NavBody>

      {/* Mobile navbar */}
      <MobileNav>
        <MobileNavHeader>
          <button
            onClick={() => nav('/')}
            className="relative z-20 flex items-center space-x-2 px-2 py-1 text-sm font-semibold text-foreground hover:text-primary"
            aria-label="Go to home"
          >
            <span className="text-foreground">AutoDash</span>
          </button>

          <div className="flex items-center gap-3">
            <AnimatedThemeToggler
              className="p-1.5 rounded hover:bg-accent"
              aria-label="Toggle theme"
            />
            <MobileNavToggle isOpen={mobileOpen} onClick={() => setMobileOpen(v => !v)} />
          </div>
        </MobileNavHeader>

        <MobileNavMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)}>
          <button
            className="px-2 py-1 text-left text-foreground hover:bg-accent rounded-md"
            onClick={() => {
              nav('/');
              setMobileOpen(false);
            }}
          >
            Home
          </button>
          <button
            className="px-2 py-1 text-left text-foreground hover:bg-accent rounded-md"
            onClick={() => {
              nav('/dashboard');
              setMobileOpen(false);
            }}
          >
            Dashboard
          </button>
          {user?.role === 'admin' && (
            <button
              className="px-2 py-1 text-left text-foreground hover:bg-accent rounded-md"
              onClick={() => {
                nav('/admin');
                setMobileOpen(false);
              }}
            >
              Admin
            </button>
          )}
          <div className="h-px w-full bg-border my-2" />
          {user ? (
            <button
              className="px-2 py-1 text-left text-foreground hover:bg-accent rounded-md"
              onClick={async () => {
                await logout();
                setMobileOpen(false);
                nav('/', { replace: true });
              }}
            >
              Logout
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                className="px-2 py-1 text-left text-foreground hover:bg-accent/40 rounded-md"
                onClick={() => {
                  nav('/login');
                  setMobileOpen(false);
                }}
              >
                Login
              </button>
              <button
                className="px-2 py-1 text-left text-foreground hover:bg-accent/40 rounded-md"
                onClick={() => {
                  nav('/register');
                  setMobileOpen(false);
                }}
              >
                Register
              </button>
            </div>
          )}
        </MobileNavMenu>
      </MobileNav>
    </RNavbar>
  );
}
