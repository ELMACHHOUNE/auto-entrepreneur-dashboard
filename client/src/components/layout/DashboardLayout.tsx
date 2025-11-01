import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, X } from 'lucide-react';
import AppSidebar from './AppSidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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

  return (
    <div className="relative mx-auto max-w-7xl">
      {/* Note: toggle controls are rendered inside the sidebar itself now */}

      {/* Sidebar below the navbar (assume navbar ~4rem height) */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.aside
            key="sidebar"
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            className="fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r bg-background p-4 "
            id="app-sidebar"
          >
            <div className="mb-3 flex items-center justify-end ">
              <button
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-2 rounded-md border px-2 py-1 text-sm hover:bg-accent"
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
          className="fixed left-0 top-16 z-30 hidden h-[calc(100vh-4rem)] w-16 border-r bg-background  p-2 md:block"
          id="app-sidebar-collapsed"
        >
          <div className="mb-2 flex items-center justify-center">
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center justify-center rounded-md border p-2 hover:bg-accent"
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

      {/* Main content shifts when sidebar is open on md+ */}
      <main
        className={`min-h-[60vh] transition-all duration-300 md:pt-2 ${
          open ? 'md:ml-64' : 'md:ml-16'
        }`}
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
