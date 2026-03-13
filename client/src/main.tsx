console.log('[main] mounting React app');

import * as Sentry from '@sentry/react';
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink, TRPCClientError } from '@trpc/client';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import superjson from 'superjson';
import { captureUTM } from '@/lib/attribution';
import { initPostHog } from '@/lib/posthog';
import { supabase } from '@/lib/supabase';
import { trpc } from '@/lib/trpc';
import App from './App';
import './index.css';

// Initialise Sentry error tracking
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN as string,
    tracesSampleRate: 0.1,
  });
}

// Initialise analytics and capture UTM params on first load
initPostHog();
captureUTM();

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: '#080a0e',
            color: '#d4af37',
            fontFamily: 'Syne, sans-serif',
            gap: 16,
          }}
        >
          <h1>Something went wrong</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
            {this.state.error?.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 24px',
              background: '#d4af37',
              color: '#000',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === 'undefined') return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;
  if (!isUnauthorized) return;

  window.location.href = '/login';
};

queryClient.getQueryCache().subscribe((event) => {
  if (event.type === 'updated' && event.action.type === 'error') {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error('[API Query Error]', error);
  }
});

queryClient.getMutationCache().subscribe((event) => {
  if (event.type === 'updated' && event.action.type === 'error') {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error('[API Mutation Error]', error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      transformer: superjson,
      async headers() {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        console.log(
          `[trpc] headers() | has session: ${!!session} | user: ${session?.user?.email ?? 'none'}`
        );
        if (session?.access_token) {
          return { Authorization: `Bearer ${session.access_token}` };
        }
        return {};
      },
    }),
  ],
});

const rootEl = document.getElementById('root');
console.log('[main] root element:', rootEl);
try {
  createRoot(rootEl!).render(
    <ErrorBoundary>
      <HelmetProvider>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </trpc.Provider>
      </HelmetProvider>
    </ErrorBoundary>
  );
} catch (err) {
  console.error('[main] RENDER CRASH:', err);
}
