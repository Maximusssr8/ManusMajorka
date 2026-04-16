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
import { TrialCountdown } from '@/components/funnel/TrialCountdown';

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
  const [alertBadgeCount, setAlertBadgeCount] = useState<number>(0);
  useKeyboardShortcuts();
  const [location, navigate] = useLocation();

  // Bell badge reflects real active alerts from the server, not locally-tracked products.
  // Falls back to 0 silently if the API is unavailable / user unauth / table missing.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;
    const load = async (): Promise<void> => {
      try {
        const { supabase } = await import('@/lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) { if (!cancelled) setAlertBadgeCount(0); return; }
        const res = await fetch('/api/alerts', { headers: { Authorization: `Bearer ${session.access_token}` } });
        if (!res.ok) { if (!cancelled) setAlertBadgeCount(0); return; }
        const body = await res.json();
        const list = Array.isArray(body?.alerts) ? body.alerts : [];
        const active = list.filter((a: { last_fired_at?: string | null; status?: string }) =>
          a?.status !== 'cancelled' && a?.status !== 'triggered'
        );
        if (!cancelled) setAlertBadgeCount(active.length);
      } catch {
        if (!cancelled) setAlertBadgeCount(0);
      }
    };
    load();
    const iv = window.setInterval(load, 60_000);
    return () => { cancelled = true; window.clearInterval(iv); };
  }, []);

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
            style={{ background: 'rgba(4,6,15,0.95)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid #161b22' }}
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
            <TrialCountdown />
            <Link
              href="/app/alerts"
              aria-label="Alerts"
              className="w-11 h-11 flex items-center justify-center rounded-xl transition-colors relative"
              style={{ color: '#737373' }}
            >
              <Bell size={18} strokeWidth={2} />
              {alertBadgeCount > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center"
                  style={{ background: '#4f8ef7', color: '#04060f' }}
                >
                  {alertBadgeCount > 9 ? '9+' : alertBadgeCount}
                </span>
              )}
            </Link>
          </div>

          {/* Desktop-only top-right trial pill */}
          <div
            className="hidden md:flex"
            style={{
              position: 'absolute',
              top: 14,
              right: 18,
              zIndex: 30,
              pointerEvents: 'auto',
            }}
          >
            <TrialCountdown />
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
            background: '#0d1117',
            color: '#e5e5e5',
            border: '1px solid #161b22',
            borderRadius: '10px',
            fontSize: '13px',
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: '0 0 0 1px rgba(79,142,247,0.08), 0 8px 40px -10px rgba(79,142,247,0.15)',
          },
        }}
      />
    </Tooltip.Provider>
  );
}
