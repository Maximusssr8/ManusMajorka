import { useState, type ReactNode } from 'react';
import { Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Toaster } from 'sonner';
import { Nav } from './Nav';

interface AppShellProps { children: ReactNode }

/**
 * AppShell — root layout with mobile-responsive sidebar.
 *
 * Desktop (md+): sidebar is static 220px flex child.
 * Mobile: sidebar is hidden by default, slides in from the left
 * as an overlay when the hamburger is tapped. Backdrop fades over
 * the content. Tapping a nav item or the backdrop closes it.
 */
export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  return (
    <Tooltip.Provider delayDuration={200} skipDelayDuration={100}>
      <div className="app-bg flex h-screen overflow-hidden text-text font-body relative">
        <div className="app-glow" aria-hidden="true" />
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar — slide-in on mobile, static on desktop */}
        <div
          className={`
            fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
            md:relative md:translate-x-0 md:z-auto
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
        >
          <Nav onNavigate={() => setSidebarOpen(false)} />
        </div>

        {/* Main column */}
        <div className="flex-1 flex flex-col min-w-0 relative z-10">
          {/* Mobile header bar — visible only below md */}
          <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-surface shrink-0">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="text-muted hover:text-text transition-colors p-1 -ml-1"
            >
              <Menu size={20} strokeWidth={1.75} />
            </button>
            <span className="font-display font-bold text-[15px] text-text tracking-tight">
              Majorka
            </span>
            <div className="w-7" />
          </div>

          <motion.main
            key={typeof window !== 'undefined' ? window.location.pathname : 'page'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 overflow-y-auto min-w-0"
          >
            {children}
          </motion.main>
        </div>
      </div>

      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: '#1a1d27',
            color: '#f0f4ff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            fontSize: '13px',
            fontFamily: "'Inter', sans-serif",
          },
        }}
      />
    </Tooltip.Provider>
  );
}
