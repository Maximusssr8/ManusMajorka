import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * useAdmin — checks admin status via server API.
 *
 * No secrets or user IDs in client code. The server verifies
 * the JWT and checks the user against ADMIN_USER_ID env var.
 */
export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) { setIsAdmin(false); setLoading(false); return; }

        const res = await fetch('/api/auth/admin-check', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;

        if (res.ok) {
          const body = await res.json();
          setIsAdmin(body.isAdmin === true);
        } else {
          setIsAdmin(false);
        }
      } catch {
        if (!cancelled) setIsAdmin(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    check();

    const { data: sub } = supabase.auth.onAuthStateChange(() => { check(); });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  return { isAdmin, loading };
}

/**
 * adminFetch — authenticated fetch for admin API calls.
 */
export async function adminFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not authenticated');

  const url = path.startsWith('/api/') ? path : `/api/admin${path.startsWith('/') ? path : '/' + path}`;
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
}
