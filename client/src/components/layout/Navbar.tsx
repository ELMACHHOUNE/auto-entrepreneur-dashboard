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
import { useTranslation } from 'react-i18next';

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('fr') ? 'fr' : 'en';
  const setLang = (lng: 'en' | 'fr') => {
    i18n.changeLanguage(lng);
    try {
      localStorage.setItem('lang', lng);
    } catch {
      /* ignore write failures (e.g., privacy mode) */
    }
  };

  return (
    <RNavbar className="sticky top-0 z-50 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60 border-b border-border">
      <NavBody>
        {/* Left: Logo */}
        <button
          onClick={() => nav('/')}
          className="relative z-20 mr-4 flex items-center space-x-2 px-2 py-1 text-sm font-semibold text-foreground hover:text-primary"
          aria-label={t('goHome')}
        >
          <span className="text-foreground hover:underline hover:text-accent">{t('brand')}</span>
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
              item={t('home')}
              onClick={() => nav('/')}
            />
            <MenuItem
              setActive={(val: string) => setActive(val)}
              active={active}
              item={t('dashboard')}
              onClick={() => nav('/dashboard')}
            />
            {user?.role === 'admin' && (
              <MenuItem
                setActive={(val: string) => setActive(val)}
                active={active}
                item={t('admin')}
                onClick={() => nav('/admin')}
              />
            )}
          </Menu>
        </div>

        {/* Right: Theme toggle + Auth actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Language toggle */}
          <div className="flex items-center gap-1 rounded-md border border-border bg-card p-1">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-2 py-1 text-xs rounded ${
                currentLang === 'en'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-foreground hover:bg-accent/40'
              }`}
              aria-pressed={currentLang === 'en'}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('fr')}
              className={`px-2 py-1 text-xs rounded ${
                currentLang === 'fr'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-foreground hover:bg-accent/40'
              }`}
              aria-pressed={currentLang === 'fr'}
            >
              FR
            </button>
          </div>
          <AnimatedThemeToggler
            className="p-1.5 rounded hover:bg-accent text-foreground"
            aria-label={t('themeToggle')}
          />
          {user ? (
            <button
              className="text-foreground underline-offset-4 hover:underline hover:text-accent"
              onClick={async () => {
                await logout();
                nav('/', { replace: true });
              }}
            >
              {t('logout')}
            </button>
          ) : (
            <>
              <button
                className="text-foreground hover:text-accent hover:underline"
                onClick={() => nav('/login')}
              >
                {t('login')}
              </button>
              <button
                className="text-foreground hover:text-accent hover:underline"
                onClick={() => nav('/register')}
              >
                {t('register')}
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
            aria-label={t('goHome')}
          >
            <span className="text-foreground">{t('brand')}</span>
          </button>

          <div className="flex items-center gap-3">
            <AnimatedThemeToggler
              className="p-1.5 rounded hover:bg-accent text-foreground"
              aria-label={t('themeToggle')}
            />
            <MobileNavToggle isOpen={mobileOpen} onClick={() => setMobileOpen(v => !v)} />
          </div>
        </MobileNavHeader>

        <MobileNavMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)}>
          {/* Language toggle (mobile) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`px-2 py-1 text-xs rounded ${
                currentLang === 'en'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-foreground hover:bg-accent/40'
              }`}
              onClick={() => setLang('en')}
            >
              EN
            </button>
            <button
              type="button"
              className={`px-2 py-1 text-xs rounded ${
                currentLang === 'fr'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-foreground hover:bg-accent/40'
              }`}
              onClick={() => setLang('fr')}
            >
              FR
            </button>
          </div>
          <button
            className="px-2 py-1 text-left text-foreground hover:bg-accent rounded-md"
            onClick={() => {
              nav('/');
              setMobileOpen(false);
            }}
          >
            {t('home')}
          </button>
          <button
            className="px-2 py-1 text-left text-foreground hover:bg-accent rounded-md"
            onClick={() => {
              nav('/dashboard');
              setMobileOpen(false);
            }}
          >
            {t('dashboard')}
          </button>
          {user?.role === 'admin' && (
            <button
              className="px-2 py-1 text-left text-foreground hover:bg-accent rounded-md"
              onClick={() => {
                nav('/admin');
                setMobileOpen(false);
              }}
            >
              {t('admin')}
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
              {t('logout')}
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
                {t('login')}
              </button>
              <button
                className="px-2 py-1 text-left text-foreground hover:bg-accent/40 rounded-md"
                onClick={() => {
                  nav('/register');
                  setMobileOpen(false);
                }}
              >
                {t('register')}
              </button>
            </div>
          )}
        </MobileNavMenu>
      </MobileNav>
    </RNavbar>
  );
}
