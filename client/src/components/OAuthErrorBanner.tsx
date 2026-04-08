import { useEffect, useState } from 'react';

interface OAuthErrorState {
  error: string;
  errorCode?: string;
  errorDescription?: string;
}

/**
 * Listens for Supabase OAuth callback error params on mount. Clears them from
 * the URL via replaceState and surfaces a dismissible banner so the user isn't
 * stuck on a broken-looking URL when Google's OAuth flow fails.
 */
export function OAuthErrorBanner() {
  const [state, setState] = useState<OAuthErrorState | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Supabase returns OAuth errors either as query params or in the URL hash
    // fragment (implicit flow). Parse both.
    const search = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(
      window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash
    );

    const error = search.get('error') || hash.get('error') || '';
    const errorCode = search.get('error_code') || hash.get('error_code') || '';
    const errorDescription =
      search.get('error_description') || hash.get('error_description') || '';

    if (!error && !errorCode) return;

    console.warn('[Majorka Auth] OAuth callback error detected:', {
      error,
      errorCode,
      errorDescription,
    });

    setState({
      error: error || 'oauth_error',
      errorCode: errorCode || undefined,
      errorDescription: errorDescription || undefined,
    });

    // Strip the error params from the URL so the address bar is clean.
    const cleanUrl = `${window.location.origin}${window.location.pathname}`;
    try {
      window.history.replaceState({}, document.title, cleanUrl);
    } catch {
      /* ignore */
    }
  }, []);

  if (!state) return null;

  const retry = () => {
    setState(null);
    window.location.href = '/login';
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        top: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 60,
        maxWidth: 560,
        width: 'calc(100% - 24px)',
        background: 'rgba(239,68,68,0.1)',
        border: '1px solid rgba(239,68,68,0.35)',
        borderRadius: 10,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 8px 28px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <span style={{ fontSize: 18, flexShrink: 0 }} aria-hidden="true">⚠</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#fecaca', marginBottom: 2 }}>
          Sign-in failed — Google couldn't complete the login.
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
          Please try again. {state.errorDescription ? `(${state.errorDescription.slice(0, 120)})` : ''}
        </div>
      </div>
      <button
        onClick={retry}
        style={{
          padding: '6px 12px',
          borderRadius: 7,
          background: 'rgba(239,68,68,0.2)',
          border: '1px solid rgba(239,68,68,0.4)',
          color: '#fecaca',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'background 120ms ease',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.3)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.2)'; }}
      >Retry</button>
      <button
        onClick={() => setState(null)}
        aria-label="Dismiss"
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.5)',
          fontSize: 18,
          cursor: 'pointer',
          padding: 0,
          width: 24,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >×</button>
    </div>
  );
}
