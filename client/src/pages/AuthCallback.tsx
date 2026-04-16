import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState<string>('Signing you in…');

  useEffect(() => {
    let cancelled = false;

    const run = async (): Promise<void> => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const errorDescription = url.searchParams.get('error_description') || url.searchParams.get('error');

        if (errorDescription) {
          if (!cancelled) setLocation(`/sign-in?error=${encodeURIComponent(errorDescription)}`, { replace: true });
          return;
        }

        // PKCE: exchange the full ?code=... (+ state) query string for a session.
        // detectSessionInUrl may have already attempted this on mount; if so, the
        // second call returns a benign "code already exchanged" — we then fall
        // through to getSession() which returns the live session.
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(window.location.search);
          if (error && !/already|used|invalid/i.test(error.message)) {
            if (!cancelled) setLocation(`/sign-in?error=${encodeURIComponent(error.message)}`, { replace: true });
            return;
          }
        }

        const { data } = await supabase.auth.getSession();
        if (!cancelled) {
          if (data.session) {
            setLocation('/app', { replace: true });
          } else {
            setLocation('/sign-in?error=oauth_no_session', { replace: true });
          }
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'oauth_failed';
        if (!cancelled) setLocation(`/sign-in?error=${encodeURIComponent(msg)}`, { replace: true });
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [setLocation]);

  return (
    <div
      style={{
        background: '#04060f',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          border: '2px solid #161b22',
          borderTopColor: '#4f8ef7',
          borderRadius: '50%',
          animation: 'mjAuthSpin 0.9s linear infinite',
        }}
      />
      <p style={{ color: '#4f8ef7', fontFamily: "'Syne', system-ui, sans-serif", fontSize: 18, letterSpacing: '-0.01em', margin: 0 }}>
        {message}
      </p>
      <style>{`@keyframes mjAuthSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
