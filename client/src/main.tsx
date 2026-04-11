
// ── Mermaid isMobile shim ────────────────────────────────────────────────────
// @streamdown/mermaid bundles Mermaid.js which calls the `is-mobile` package's
// isMobile() as a global at runtime. Vite tree-shakes it out. Shim it before
// any lazy chunk can reference it.
if (typeof (window as any).isMobile === 'undefined') {
  (window as any).isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;
}

// ── Stale chunk reload fix ───────────────────────────────────────────────────
// After a new deploy, old lazily-loaded JS chunks no longer exist (hash mismatch).
// Catch the failed dynamic import and force a hard reload once so the browser
// picks up the new chunk manifest. A session flag prevents infinite reload loops.
window.addEventListener('error', (e) => {
  const msg = e.message || '';
  if (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('error loading dynamically imported module')
  ) {
    if (!sessionStorage.getItem('chunk_reload_attempted')) {
      sessionStorage.setItem('chunk_reload_attempted', '1');
      window.location.reload();
    }
  }
});
// Also handle unhandled promise rejections (Chrome/Vite path)
window.addEventListener('unhandledrejection', (e) => {
  const msg = String(e.reason?.message || e.reason || '');
  if (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('Loading chunk') ||
    msg.includes('Loading CSS chunk') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('Failed to load module script') ||
    msg.includes('404')
  ) {
    if (!sessionStorage.getItem('chunk_reload_attempted')) {
      sessionStorage.setItem('chunk_reload_attempted', '1');
      window.location.reload();
    }
  }
});

// Clear the stale-chunk reload flag 3s after load — so future deploys can auto-reload again
window.addEventListener('load', () => {
  setTimeout(() => sessionStorage.removeItem('chunk_reload_attempted'), 3000);
});

// ── Cross-domain OAuth redirect fix ──────────────────────────────────────────
// Supabase Site URL is still manus-majorka.vercel.app. After Google OAuth it
// sends the access_token hash there. This snippet detects that and immediately
// bounces to majorka.io with the same hash so auth completes on the right domain.
if (
  typeof window !== 'undefined' &&
  window.location.hostname.includes('manus-majorka.vercel.app') &&
  (window.location.hash.includes('access_token') || window.location.search.includes('code='))
) {
  const newUrl = `https://www.majorka.io/app${window.location.hash || window.location.search}`;
  window.location.replace(newUrl);
}

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

// Initialise Sentry error tracking — only when a valid DSN URL is set.
// Skips all 'pending', empty-string, or non-https values to avoid the
// 'Invalid Sentry DSN' console error that was firing on every page load.
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
if (SENTRY_DSN && typeof SENTRY_DSN === 'string' && SENTRY_DSN.startsWith('https://') && SENTRY_DSN !== 'pending') {
  Sentry.init({
    dsn: SENTRY_DSN as string,
    environment: import.meta.env.MODE || 'production',
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 0.1,
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    beforeSend(event) {
      if (window.location.hostname === 'localhost') return null;
      return event;
    },
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
            background: '#05070F',
            color: '#6366F1',
            fontFamily: "'Bricolage Grotesque', sans-serif",
            gap: 16,
          }}
        >
          <h1>Something went wrong</h1>
          <p style={{ color: '#94A3B8', fontSize: 14 }}>
            {this.state.error?.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 24px',
              background: '#6366F1',
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,       // 5 min default — don't refetch fresh data
      gcTime: 1000 * 60 * 30,          // keep in memory 30 min
      refetchOnWindowFocus: false,     // CRITICAL — stop refetching on every tab switch
      refetchOnReconnect: false,       // stop refetching on reconnect
      refetchInterval: false,          // no polling by default
      retry: 1,                        // only retry once on failure
    },
  },
});

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
        if (session?.access_token) {
          return { Authorization: `Bearer ${session.access_token}` };
        }
        return {};
      },
    }),
  ],
});

const rootEl = document.getElementById('root');
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
