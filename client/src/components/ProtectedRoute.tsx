import type { ReactNode } from 'react';
import { Redirect, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const [location] = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4" style={{ background: '#0d0f14' }}>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-lg animate-pulse"
          style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#FAFAFA', fontFamily: "'Bricolage Grotesque', sans-serif" }}
        >M</div>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#6366F1', opacity: 0.6, animationDelay: `${i * 0.15}s` }} />
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

  return <>{children}</>;
}
