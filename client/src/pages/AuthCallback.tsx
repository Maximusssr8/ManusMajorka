import { useEffect, useState, type ReactElement } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';

function parseHashParams(): URLSearchParams {
  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;
  return new URLSearchParams(hash);
}

export default function AuthCallback(): ReactElement {
  const [, setLocation] = useLocation();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [status, setStatus] = useState<'working' | 'error'>('working');

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const url = new URL(window.location.href);
        const hashParams = parseHashParams();

        const providerError =
          url.searchParams.get('error') ||
          url.searchParams.get('error_code') ||
          hashParams.get('error') ||
          hashParams.get('error_code');
        const providerErrorDesc =
          url.searchParams.get('error_description') ||
          hashParams.get('error_description');

        if (providerError) {
          const decoded = providerErrorDesc
            ? decodeURIComponent(providerErrorDesc.replace(/\+/g, ' '))
            : providerError;
          if (!cancelled) {
            setErrorMsg(decoded);
            setStatus('error');
          }
          return;
        }

        const code = url.searchParams.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            if (!cancelled) {
              setErrorMsg(error.message);
              setStatus('error');
            }
            return;
          }
          if (!cancelled) setLocation('/app');
          return;
        }

        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            if (!cancelled) {
              setErrorMsg(error.message);
              setStatus('error');
            }
            return;
          }
          if (!cancelled) setLocation('/app');
          return;
        }

        const { data } = await supabase.auth.getSession();
        if (data.session) {
          if (!cancelled) setLocation('/app');
          return;
        }

        if (!cancelled) {
          setErrorMsg('No authorization code in URL. Please try signing in again.');
          setStatus('error');
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unexpected sign-in error.';
        if (!cancelled) {
          setErrorMsg(msg);
          setStatus('error');
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [setLocation]);

  if (status === 'working') {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          background: '#0d0f14',
          color: '#f0f4ff',
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontFamily: "'Syne', system-ui, sans-serif",
              fontSize: 22,
              fontWeight: 800,
              color: '#6366f1',
              marginBottom: 8,
            }}
          >
            Majorka
          </div>
          <div style={{ fontSize: 13, color: '#a1a1aa' }}>Signing you in…</div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        background: '#0d0f14',
        color: '#f0f4ff',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 420, textAlign: 'center' }}>
        <div
          style={{
            fontFamily: "'Syne', system-ui, sans-serif",
            fontSize: 24,
            fontWeight: 800,
            color: '#ef4444',
            marginBottom: 12,
          }}
        >
          Sign-in failed
        </div>
        <div style={{ fontSize: 14, color: '#a1a1aa', marginBottom: 24, lineHeight: 1.5 }}>
          {errorMsg}
        </div>
        <button
          type="button"
          onClick={() => setLocation('/sign-in')}
          style={{
            padding: '12px 24px',
            minHeight: 44,
            background: '#6366f1',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
