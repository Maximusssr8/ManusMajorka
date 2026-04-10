import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * useAdmin — client-side admin detection.
 *
 * Compares the current Supabase session user ID against
 * VITE_ADMIN_USER_ID. This is purely a UX gate (show/hide the admin
 * link in the nav, render-or-redirect on the /admin route). It is
 * NOT the security boundary — every server admin request still has
 * to clear adminAuth + requireAuth + requireAdmin middleware on the
 * backend regardless of what the client thinks.
 *
 * Two exports:
 *   useAdmin()           → { isAdmin, loading } React hook
 *   adminFetch(path,...) → fetch wrapper that adds Authorization +
 *                          X-Admin-Token headers automatically
 *
 * SECURITY NOTE: VITE_ADMIN_SECRET ends up in the public client
 * bundle. The "secret" header is therefore only an obscurity layer
 * vs the casual visitor — anyone who reads the bundle can see it.
 * The real boundary is the server's per-request JWT verification
 * + hardcoded admin user ID match. Treat this header as a tripwire,
 * not a trust anchor.
 */

const ADMIN_USER_ID = import.meta.env.VITE_ADMIN_USER_ID as string | undefined;

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        const userId = data.session?.user?.id;
        setIsAdmin(!!userId && !!ADMIN_USER_ID && userId === ADMIN_USER_ID);
      } catch {
        if (!cancelled) setIsAdmin(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    check();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user?.id;
      setIsAdmin(!!userId && !!ADMIN_USER_ID && userId === ADMIN_USER_ID);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { isAdmin, loading };
}

/**
 * adminFetch — convenience wrapper for /api/admin/* calls.
 *
 * Automatically attaches:
 *   - Authorization: Bearer <supabase access token>
 *   - X-Admin-Token: <VITE_ADMIN_SECRET>
 *   - Content-Type: application/json
 *
 * Throws if there's no active session or no admin secret env var.
 * Returns the raw Response — caller decides .json() / .text().
 */
export async function adminFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const adminSecret = import.meta.env.VITE_ADMIN_SECRET as string | undefined;

  if (!token) throw new Error('Not authenticated');
  if (!adminSecret) throw new Error('VITE_ADMIN_SECRET not configured');

  const url = path.startsWith('/api/') ? path : `/api/admin${path.startsWith('/') ? path : '/' + path}`;

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Admin-Token': adminSecret,
      ...(options.headers || {}),
    },
  });
}
