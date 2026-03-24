import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  CreditCard,
  Loader2,
  LogOut,
  Shield,
  User,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';

function StatusBadge({ status }: { status: string | undefined }) {
  if (!status) return <Badge variant="secondary">No subscription</Badge>;
  if (status === 'active')
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
        style={{
          background: '#EEF2FF',
          border: '1px solid #C7D2FE',
          color: '#6366F1',
          fontFamily: "'Bricolage Grotesque', sans-serif",
        }}
      >
        <div
          className="w-1.5 h-1.5 rounded-full bg-green-400"
          style={{ boxShadow: '0 0 6px rgba(99,102,241,1.00)' }}
        />
        Active
      </span>
    );
  if (status === 'cancelled')
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
        style={{
          background: 'rgba(255,165,0,0.1)',
          border: '1px solid rgba(255,165,0,0.25)',
          color: '#ffa500',
          fontFamily: "'Bricolage Grotesque', sans-serif",
        }}
      >
        Cancelled
      </span>
    );
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
      style={{
        background: 'rgba(255,80,80,0.1)',
        border: '1px solid rgba(255,80,80,0.25)',
        color: '#ff5050',
        fontFamily: "'Bricolage Grotesque', sans-serif",
      }}
    >
      Expired
    </span>
  );
}

export default function Account() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const {
    data: subscription,
    isLoading: subLoading,
    refetch,
  } = trpc.subscription.get.useQuery(undefined, { enabled: isAuthenticated });

  const activateMutation = trpc.subscription.activate.useMutation({
    onSuccess: () => refetch(),
  });

  const cancelMutation = trpc.subscription.cancel.useMutation({
    onSuccess: () => refetch(),
  });

  // Handle ?success=1 after Stripe redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === '1') {
      toast.success('Subscription activated!', { description: 'Welcome to Majorka Pro.' });
      refetch();
      // Clean the URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [refetch]);

  const handleStripeCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const response = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create checkout session');
      }
      const { url } = await response.json();
      if (url) window.location.href = url;
    } catch (err: any) {
      toast.error('Checkout failed', { description: err.message });
    } finally {
      setCheckoutLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [authLoading, isAuthenticated, setLocation]);

  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const isActive = subscription?.status === 'active';
  const periodEnd = subscription?.periodEnd ? new Date(subscription.periodEnd) : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Background */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(ellipse 600px 400px at 10% 10%, rgba(99,102,241,0.05) 0%, transparent 60%)',
        }}
      />

      {/* ── NAV ── */}
      <nav
        className="relative z-10 border-b sticky top-0 backdrop-blur-md"
        style={{ background: 'rgba(8,10,14,0.9)', borderColor: '#E5E7EB' }}
      >
        <div className="container flex items-center justify-between h-14">
          <button
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setLocation(isActive ? '/app' : '/')}
          >
            <ArrowLeft className="w-4 h-4" />
            {isActive ? 'Back to Dashboard' : 'Back to Home'}
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-sm"
              style={{
                background: 'linear-gradient(135deg, #6366F1, #f0c040)',
                color: '#FAFAFA',
                fontFamily: "'Bricolage Grotesque', sans-serif",
              }}
            >
              M
            </div>
            <span className="font-extrabold text-sm" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              Majorka
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground gap-1.5"
            onClick={async () => {
              await logout();
              setLocation('/');
            }}
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">Sign out</span>
          </Button>
        </div>
      </nav>

      {/* ── CONTENT ── */}
      <main className="relative z-10 container py-12 max-w-2xl">
        <h1 className="text-3xl font-extrabold mb-2" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
          Account
        </h1>
        <p className="text-muted-foreground mb-10">Manage your Majorka membership and billing.</p>

        {/* Profile card */}
        <div
          className="rounded-2xl p-6 border mb-5"
          style={{ background: '#FAFAFA', borderColor: '#E5E7EB' }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-lg flex-shrink-0"
              style={{
                background: 'rgba(99,102,241,0.15)',
                color: '#6366F1',
                fontFamily: "'Bricolage Grotesque', sans-serif",
              }}
            >
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div>
              <div className="font-bold text-base" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                {user?.name}
              </div>
              <div className="text-sm text-muted-foreground">
                {user?.email ?? 'No email on file'}
              </div>
            </div>
          </div>
        </div>

        {/* Subscription card */}
        <div
          className="rounded-2xl border overflow-hidden mb-5"
          style={{
            background: '#FAFAFA',
            borderColor: isActive ? 'rgba(99,102,241,0.25)' : '#E5E7EB',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: '#F9FAFB' }}
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" style={{ color: '#6366F1' }} />
              <span className="font-bold text-sm" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                Subscription
              </span>
            </div>
            <StatusBadge status={subscription?.status} />
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            {subscription ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p
                      className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold"
                      style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                    >
                      Plan
                    </p>
                    <p className="text-sm font-bold capitalize">{subscription.plan}</p>
                  </div>
                  <div>
                    <p
                      className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold"
                      style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                    >
                      Price
                    </p>
                    <p className="text-sm font-bold">
                      ${(subscription.priceInCents / 100).toFixed(2)} / month
                    </p>
                  </div>
                  <div>
                    <p
                      className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold"
                      style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                    >
                      Started
                    </p>
                    <p className="text-sm">
                      {new Date(subscription.periodStart).toLocaleDateString()}
                    </p>
                  </div>
                  {periodEnd && (
                    <div>
                      <p
                        className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold"
                        style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                      >
                        {subscription.status === 'cancelled' ? 'Access until' : 'Renews'}
                      </p>
                      <p className="text-sm">{periodEnd.toLocaleDateString()}</p>
                    </div>
                  )}
                </div>

                {isActive && (
                  <div
                    className="flex items-center gap-2 p-3 rounded-xl text-sm"
                    style={{
                      background: 'rgba(99,102,241,0.09)',
                      border: '1px solid #EEF2FF',
                      color: 'rgba(99,102,241,1.00)',
                    }}
                  >
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    Full access to Majorka AI Ecommerce OS is active.
                  </div>
                )}

                {subscription.status === 'cancelled' && (
                  <div
                    className="flex items-center gap-2 p-3 rounded-xl text-sm"
                    style={{
                      background: 'rgba(255,165,0,0.06)',
                      border: '1px solid rgba(255,165,0,0.15)',
                      color: 'rgba(255,165,0,0.9)',
                    }}
                  >
                    <XCircle className="w-4 h-4 flex-shrink-0" />
                    Your subscription is cancelled. Access ends{' '}
                    {periodEnd?.toLocaleDateString() ?? 'soon'}.
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-1">No active subscription.</p>
                <p className="text-xs text-muted-foreground">
                  Subscribe to unlock the full Majorka AI OS.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div
            className="px-6 py-4 border-t flex flex-col sm:flex-row gap-3"
            style={{ borderColor: '#F9FAFB' }}
          >
            {!isActive ? (
              <Button
                className="flex-1 font-extrabold"
                disabled={checkoutLoading}
                onClick={handleStripeCheckout}
                style={{
                  background: 'linear-gradient(135deg, #6366F1, #c09a28)',
                  color: '#FAFAFA',
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  fontWeight: 800,
                  boxShadow: '0 4px 18px rgba(99,102,241,0.3)',
                }}
              >
                {checkoutLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Redirecting…
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" /> Subscribe — $99 / month
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="flex-1 text-sm border-border hover:bg-secondary"
                  onClick={() => setLocation('/app')}
                >
                  Open Dashboard
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-sm border-destructive/30 text-destructive hover:bg-destructive/10"
                  disabled={cancelMutation.isPending}
                  onClick={() => {
                    if (
                      confirm(
                        "Are you sure you want to cancel your subscription? You'll keep access until the end of your billing period."
                      )
                    ) {
                      cancelMutation.mutate();
                    }
                  }}
                >
                  {cancelMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" /> Cancelling…
                    </>
                  ) : (
                    'Cancel Subscription'
                  )}
                </Button>
              </>
            )}
          </div>

          {(activateMutation.isError || cancelMutation.isError) && (
            <p className="text-xs text-destructive px-6 pb-4">
              {activateMutation.error?.message ?? cancelMutation.error?.message}
            </p>
          )}
        </div>

        {/* Info card */}
        <div
          className="rounded-2xl p-5 border text-sm text-muted-foreground"
          style={{ background: '#FAFAFA', borderColor: '#F9FAFB' }}
        >
          <p className="flex items-start gap-2">
            <Calendar className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#6366F1' }} />
            Subscriptions are billed monthly. Cancel anytime — you'll retain access until the end of
            your current billing period. For billing support, contact us at{' '}
            <a
              href="mailto:support@majorka.com"
              className="underline hover:text-foreground transition-colors"
            >
              support@majorka.com
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
