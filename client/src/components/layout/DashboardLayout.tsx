import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, X } from 'lucide-react';
import AppSidebar from './AppSidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  rightSidebar?: React.ReactNode; // content component for right-side panel
  rightCollapsible?: boolean; // enable collapse behavior for right sidebar
}

export default function DashboardLayout({
  children,
  rightSidebar,
  rightCollapsible = false,
}: DashboardLayoutProps) {
  // Persist open state so it doesn't change on navigation
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = window.localStorage.getItem('app-sidebar-open');
    return saved === null ? true : saved !== '0';
  });

  useEffect(() => {
    try {
      window.localStorage.setItem('app-sidebar-open', open ? '1' : '0');
    } catch {
      /* noop */
    }
  }, [open]);

  // Only close on navigate for mobile overlay UX
  const handleNavigate = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setOpen(false);
    }
  };

  // Right sidebar open state (desktop only). Persist separate key.
  const [rightOpen, setRightOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = window.localStorage.getItem('app-right-sidebar-open');
    return saved === null ? true : saved !== '0';
  });

  useEffect(() => {
    try {
      window.localStorage.setItem('app-right-sidebar-open', rightOpen ? '1' : '0');
    } catch {
      /* noop */
    }
  }, [rightOpen]);

  return (
    <div className="relative w-full">
      {/* Sidebar below the navbar (assume navbar ~4rem height) */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.aside
            key="sidebar"
            initial={{ x: -240, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -240, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            className="fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-56 border-r bg-background p-3"
            id="app-sidebar"
          >
            <div className="mb-3 flex items-center justify-end ">
              <button
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-2 rounded-md border px-2 py-1 text-sm hover:bg-accent text-foreground"
                aria-label="Close sidebar"
                title="Close sidebar"
              >
                <X size={16} />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
            <AppSidebar onNavigate={handleNavigate} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Collapsed sidebar (md+ only) when closed */}
      {!open && (
        <aside
          className="fixed left-0 top-16 z-30 hidden h-[calc(100vh-4rem)] w-16 border-r bg-background p-2 md:block"
          id="app-sidebar-collapsed"
        >
          <div className="mb-2 flex items-center justify-center">
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center justify-center text-foreground rounded-md border p-2 hover:bg-accent"
              aria-label="Open sidebar"
              title="Open sidebar"
            >
              <Menu size={16} />
            </button>
          </div>
          <AppSidebar collapsed />
        </aside>
      )}

      {/* Backdrop for mobile when sidebar open; below navbar */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-x-0 bottom-0 top-16 z-30 bg-black/20 md:hidden "
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Optional right sidebar (md+) */}
      {rightSidebar && rightCollapsible && (
        <AnimatePresence initial={false}>
          {rightOpen && (
            <motion.aside
              key="right-sidebar"
              initial={{ x: 240, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 240, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              className="fixed right-0 top-16 z-30 hidden h-[calc(100vh-4rem)] w-64 border-l border-accent bg-background p-3 md:block"
              aria-label="Right insights panel"
              id="right-sidebar"
            >
              <div className="mb-3 flex items-center justify-end">
                <button
                  onClick={() => setRightOpen(false)}
                  className="inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs hover:bg-accent text-foreground"
                  aria-label="Close insights panel"
                  aria-controls="right-sidebar"
                  aria-expanded={rightOpen}
                >
                  <X size={14} />
                  <span className="hidden sm:inline">Close</span>
                </button>
              </div>
              {rightSidebar}
            </motion.aside>
          )}
        </AnimatePresence>
      )}
      {rightSidebar && rightCollapsible && !rightOpen && (
        <aside
          className="fixed right-0 top-16 z-30 hidden h-[calc(100vh-4rem)] w-14 border-l bg-background p-2 md:block"
          id="right-sidebar-collapsed"
        >
          <div className="flex items-center justify-center">
            <button
              onClick={() => setRightOpen(true)}
              className="inline-flex items-center justify-center rounded-md border p-2 hover:bg-accent text-foreground"
              aria-label="Open insights panel"
              aria-controls="right-sidebar"
              aria-expanded={rightOpen}
            >
              <Menu size={16} />
            </button>
          </div>
        </aside>
      )}
      {rightSidebar && !rightCollapsible && (
        <aside
          className="fixed right-0 top-16 z-30 hidden h-[calc(100vh-4rem)] w-64 border-l border-accent bg-background p-3 md:block"
          aria-label="Right insights panel"
        >
          {rightSidebar}
        </aside>
      )}

      {/* Main content shifts when sidebars are open on md+ */}
      <main
        className={`min-h-[60vh] transition-all duration-300 md:pt-2 text-foreground ${
          open ? 'md:ml-56' : 'md:ml-16'
        } ${
          rightSidebar
            ? rightCollapsible
              ? rightOpen
                ? 'md:mr-64'
                : 'md:mr-14'
              : 'md:mr-64'
            : ''
        } px-4`}
      >
        {/* Mobile-only inline trigger shown when sidebar is closed; scrolls with content */}
        {!open && (
          <div className="mb-3 md:hidden ">
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 rounded-md border bg-background hover:bg-accent px-3 py-2"
              aria-label="Open menu"
              title="Open menu"
            >
              <Menu size={18} />
              <span className="text-sm">Menu</span>
            </button>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
