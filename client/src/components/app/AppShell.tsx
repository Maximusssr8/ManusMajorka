import { useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { Menu, Bell } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Toaster, toast } from 'sonner';
import { Nav } from './Nav';
import { GradientM } from '@/components/MajorkaLogo';
import { useTracking } from '@/hooks/useTracking';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { TrialCountdown } from '@/components/funnel/TrialCountdown';
import { useSubscriptionTier } from '@/hooks/useSubscriptionTier';
import { useAuth } from '@/_core/hooks/useAuth';

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
  const { tier, status, daysRemaining, refetch } = useSubscriptionTier();

  // ── Post-Stripe return handler ─────────────────────────────────────────────
  // When the user lands back at /app?upgraded=true after Stripe Checkout,
  // eagerly refetch the subscription, show a success toast, and scrub the
  // query param so the toast doesn't re-fire on refresh.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgraded') !== 'true') return;

    refetch();

    // Briefly poll for the webhook to land, then confirm via toast.
    const started = Date.now();
    const poll = window.setInterval(() => {
      refetch();
      if (tier === 'builder' || tier === 'scale' || Date.now() - started > 15_000) {
        window.clearInterval(poll);
      }
    }, 1500);

    const label = tier === 'scale' ? 'Scale' : 'Builder';
    toast.success(`Welcome to ${label}! All features unlocked.`, { duration: 5000 });

    // Strip ?upgraded=true (keep other params intact)
    params.delete('upgraded');
    params.delete('session_id');
    const next = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
    window.history.replaceState({}, '', next);

    return () => window.clearInterval(poll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            <TrialCountdown />
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
            {status === 'trialing' && daysRemaining !== null && daysRemaining < 0 ? (
              <TrialExpiredGate />
            ) : (
              children
            )}
          </motion.main>
        </div>
      </div>

      {/* Trial-expired gate rendered above so it covers the whole app */}
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

// ── TrialExpiredGate ─────────────────────────────────────────────────────────
// Full-viewport blocker shown when the user's trial has ended and no active
// paid subscription has taken over. Offers direct Stripe Checkout CTAs for
// Builder and Scale so there's a zero-friction path to unblock the app.
function TrialExpiredGate(): ReactElement {
  const { session } = useAuth();
  const [loading, setLoading] = useState<'builder' | 'scale' | null>(null);

  const handleCheckout = async (plan: 'builder' | 'scale'): Promise<void> => {
    const token = session?.access_token;
    if (!token) {
      window.location.href = '/sign-in?redirect=/app';
      return;
    }
    setLoading(plan);
    try {
      const res = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan, billing: 'monthly' }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error ?? 'Checkout error — please try again.');
        setLoading(null);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Network error');
      setLoading(null);
    }
  };

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label="Trial ended"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100%',
        padding: 24,
        background: 'radial-gradient(circle at 50% 30%, rgba(212,175,55,0.08), transparent 60%), #080808',
      }}
    >
      <div
        style={{
          maxWidth: 520,
          width: '100%',
          background: '#111114',
          border: '1px solid rgba(212,175,55,0.3)',
          borderRadius: 18,
          padding: 36,
          textAlign: 'center',
          fontFamily: "'DM Sans', system-ui, sans-serif",
          boxShadow: '0 0 80px rgba(212,175,55,0.12)',
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 12 }}>⏱</div>
        <h2
          style={{
            fontFamily: "'Syne', system-ui, sans-serif",
            fontSize: 26,
            fontWeight: 800,
            color: '#f0f4ff',
            margin: '0 0 10px',
            letterSpacing: '-0.02em',
          }}
        >
          Trial ended — upgrade to continue
        </h2>
        <p style={{ fontSize: 14, color: '#a1a1aa', margin: '0 0 24px', lineHeight: 1.55 }}>
          Your free trial has finished. Pick a plan to restore access to product research, alerts, Maya, and the full Ads Studio.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <button
            type="button"
            onClick={() => handleCheckout('builder')}
            disabled={loading !== null}
            style={{
              height: 52,
              background: 'linear-gradient(135deg, #d4af37 0%, #f4d77a 50%, #d4af37 100%)',
              color: '#111',
              border: 'none',
              borderRadius: 12,
              fontWeight: 800,
              fontSize: 14,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading && loading !== 'builder' ? 0.5 : 1,
            }}
          >
            {loading === 'builder' ? 'Redirecting…' : 'Builder · $99/mo'}
          </button>
          <button
            type="button"
            onClick={() => handleCheckout('scale')}
            disabled={loading !== null}
            style={{
              height: 52,
              background: '#0d1424',
              color: '#f0f4ff',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 12,
              fontWeight: 800,
              fontSize: 14,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading && loading !== 'scale' ? 0.5 : 1,
            }}
          >
            {loading === 'scale' ? 'Redirecting…' : 'Scale · $199/mo'}
          </button>
        </div>
        <p style={{ fontSize: 12, color: '#737373', marginTop: 18 }}>
          Cancel anytime · 14-day money-back guarantee
        </p>
      </div>
    </div>
  );
}
