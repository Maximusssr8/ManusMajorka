import { useState, type ReactNode } from 'react';
import { Menu, Bell } from 'lucide-react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Toaster } from 'sonner';
import { Nav } from './Nav';
import { OnboardingWizard } from './OnboardingWizard';
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
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try { return localStorage.getItem('majorka_onboarded') !== '1'; } catch { return false; }
  });

  return (
    <Tooltip.Provider delayDuration={200} skipDelayDuration={100}>
      <div
        className="app-bg app-shell flex overflow-hidden text-text font-body relative w-full"
        style={{ height: '100dvh' }}
      >
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
          {/* Mobile header bar — sticky, blurred, 56px tall, 44px touch targets */}
          <div
            className="md:hidden sticky top-0 z-40 flex items-center justify-between px-3 h-14 border-b border-white/[0.06] shrink-0"
            style={{ background: 'rgba(13,15,20,0.95)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
          >
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="w-11 h-11 flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <Menu size={20} strokeWidth={2} />
            </button>
            <Link
              href="/app"
              className="flex items-center gap-2 no-underline"
            >
              <img src="/majorka-logo.jpg" alt="Majorka" style={{ height: 28, width: 28, borderRadius: 7, objectFit: 'cover' }} />
              <span
                className="text-[15px] font-display font-bold tracking-tight"
                style={{
                  background: 'linear-gradient(135deg, #f0f4ff 0%, #a5b4fc 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Majorka
              </span>
            </Link>
            <Link
              href="/app/alerts"
              aria-label="Alerts"
              className="w-11 h-11 flex items-center justify-center rounded-xl text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors relative"
            >
              <Bell size={18} strokeWidth={2} />
              {trackedCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-amber/90 text-[9px] font-bold text-bg flex items-center justify-center">
                  {trackedCount > 9 ? '9+' : trackedCount}
                </span>
              )}
            </Link>
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

      {showOnboarding && (
        <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
      )}

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
