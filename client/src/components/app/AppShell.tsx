import { useEffect, useState, type ReactNode } from 'react';
import { Menu, Bell } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Toaster } from 'sonner';
import { Nav } from './Nav';
import { GradientM } from '@/components/MajorkaLogo';
import { useTracking } from '@/hooks/useTracking';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

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
  const { trackedCount } = useTracking();
  useKeyboardShortcuts();
  const [location, navigate] = useLocation();

  // First-time users are routed to the full-page /onboarding flow.
  // The legacy modal wizard has been removed in favour of one canonical path.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('majorka_onboarded');
      // Backfill older values
      if (raw === 'true' || raw === 'yes') {
        localStorage.setItem('majorka_onboarded', '1');
        return;
      }
      if (raw !== '1' && !location.startsWith('/onboarding')) {
        navigate('/onboarding');
      }
    } catch { /* private mode / quota */ }
  }, [location, navigate]);

  return (
    <Tooltip.Provider delayDuration={200} skipDelayDuration={100}>
      <div
        className="app-bg app-shell flex overflow-hidden text-text font-body relative w-full"
        style={{ height: '100dvh' }}
      >
        <div className="app-glow" aria-hidden="true" />
        {/* Skip-link — hidden until focused, jumps past sidebar to main content */}
        <a href="#main-content" className="mj-skip-link">
          Skip to main content
        </a>
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
          {/* Mobile header bar — sticky, 56px tall, 44px touch targets */}
          <div
            className="md:hidden sticky top-0 z-40 flex items-center justify-between px-3 h-14 shrink-0"
            style={{ background: 'rgba(8,8,8,0.95)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid #1a1a1a' }}
          >
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="w-11 h-11 flex items-center justify-center rounded-xl transition-colors"
              style={{ color: '#a3a3a3' }}
            >
              <Menu size={20} strokeWidth={2} />
            </button>
            <Link
              href="/app"
              className="flex items-center gap-2 no-underline"
            >
              <img src="/majorka-logo.jpg" alt="Majorka" style={{ height: 28, width: 28, borderRadius: 7, objectFit: 'cover' }} />
              <span
                className="text-[16px]"
                style={{
                  fontFamily: "'Syne', system-ui, sans-serif",
                  fontWeight: 800,
                  color: '#e5e5e5',
                  letterSpacing: '-0.02em',
                }}
              >
                Majorka<span className="mj-wordmark-dot" aria-hidden="true" />
              </span>
            </Link>
            <Link
              href="/app/alerts"
              aria-label="Alerts"
              className="w-11 h-11 flex items-center justify-center rounded-xl transition-colors relative"
              style={{ color: '#737373' }}
            >
              <Bell size={18} strokeWidth={2} />
              {trackedCount > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center"
                  style={{ background: '#d4af37', color: '#080808' }}
                >
                  {trackedCount > 9 ? '9+' : trackedCount}
                </span>
              )}
            </Link>
          </div>

          <motion.main
            id="main-content"
            tabIndex={-1}
            key={typeof window !== 'undefined' ? window.location.pathname : 'page'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 overflow-y-auto min-w-0 focus:outline-none"
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
            background: '#111111',
            color: '#e5e5e5',
            border: '1px solid #1a1a1a',
            borderRadius: '10px',
            fontSize: '13px',
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: '0 0 0 1px rgba(212,175,55,0.08), 0 8px 40px -10px rgba(212,175,55,0.15)',
          },
        }}
      />
    </Tooltip.Provider>
  );
}
