import type { ReactNode } from 'react';
import { Redirect, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const [location] = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: '#FAFAFA' }}>
        <div
          className="w-6 h-6 rounded-full border-2 animate-spin"
          style={{ borderColor: '#f59e0b', borderTopColor: 'transparent' }}
        />
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
