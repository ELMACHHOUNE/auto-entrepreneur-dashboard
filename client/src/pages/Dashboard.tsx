import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';
import { LayoutDashboard, User as UserIcon, LogOut, Table, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(true);
  const baseURL = useMemo(() => import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '', []);

  return (
    <div className="relative mx-auto max-w-7xl">
      {/* Toggle button */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setOpen(o => !o)}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 md:hidden"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
          <span className="text-sm">Menu</span>
        </button>
        <h2 className="text-2xl font-semibold">Dashboard</h2>
      </div>

      {/* Sidebar - fixed, animated */}
      <AnimatePresence>
        {open && (
          <motion.aside
            key="sidebar"
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background p-4"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="h-10 w-10 overflow-hidden rounded-full border">
                {user?.avatarUrl ? (
                  <img
                    src={`${baseURL}${user.avatarUrl}`}
                    alt="avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    N/A
                  </div>
                )}
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Signed in as</div>
                <div className="truncate font-medium">{user?.email}</div>
              </div>
            </div>
            <nav className="flex flex-col gap-2">
              <Link
                to="/dashboard"
                className="hover:bg-muted flex items-center gap-2 rounded px-3 py-2"
              >
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <Link
                to="/profile"
                className="hover:bg-muted flex items-center gap-2 rounded px-3 py-2"
              >
                <UserIcon size={16} /> Profile
              </Link>
              <button
                onClick={logout}
                className="hover:bg-muted flex items-center gap-2 rounded px-3 py-2 text-left"
              >
                <LogOut size={16} /> Logout
              </button>
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Backdrop for mobile when sidebar open */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/20 md:hidden"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main content - shifts when sidebar open on md+ */}
      <main className={`min-h-[60vh] transition-all duration-300 ${open ? 'md:ml-64' : 'md:ml-0'}`}>
        {/* Chart + Table layout scaffold */}
        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-4">Chart A</div>
          <div className="rounded-lg border p-4">Chart B</div>
          <div className="rounded-lg border p-4">Chart C</div>
          <div className="rounded-lg border p-4">Chart D</div>
        </section>

        <section className="rounded-lg border p-4">
          <div className="mb-3 flex items-center gap-2">
            <Table size={18} />
            <h3 className="text-lg font-medium">Data table</h3>
          </div>
          <div className="text-muted-foreground">
            <div className="h-[480px] w-full rounded-md border border-dashed"></div>
          </div>
        </section>
      </main>
    </div>
  );
}
