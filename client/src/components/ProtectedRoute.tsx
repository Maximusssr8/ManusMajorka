import type { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { Redirect, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedRoute({ children, requireSubscription = false }: { children: ReactNode; requireSubscription?: boolean }) {
  const { isAuthenticated, loading, isPro } = useAuth();
  const [location] = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4" style={{ background: '#0d0f14' }}>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-lg animate-pulse"
          style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', color: '#FAFAFA', fontFamily: "'Bricolage Grotesque', sans-serif" }}
        >M</div>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#3B82F6', opacity: 0.6, animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Redirect to="/sign-in" />;

  // If onboarding not completed and not already on onboarding page, redirect
  const onboarded = localStorage.getItem('majorka_onboarded');
  if (!onboarded && !location.startsWith('/onboarding')) {
    return <Redirect to="/onboarding" />;
  }

  if (requireSubscription && !isPro) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'var(--bg-base)' }}>
        <div className="max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-5" style={{ background: 'var(--accent-muted)', border: '1px solid var(--border)' }}>
            <Lock className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            Subscription required
          </h2>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Choose a plan to access Majorka's product intelligence tools.
          </p>
          <div className="flex flex-col gap-2">
            <a href="/pricing" className="w-full py-2 rounded-md text-sm font-medium text-center" style={{ background: 'var(--accent)', color: 'var(--bg-base)' }}>
              View Plans
            </a>
            <a href="/academy" className="w-full py-2 rounded-md text-sm text-center" style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              Browse Academy (free)
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
