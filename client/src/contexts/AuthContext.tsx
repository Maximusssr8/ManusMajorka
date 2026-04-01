import type { Profile } from '@shared/types';
import type { Session } from '@supabase/supabase-js';
import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getAttributionFlat } from '@/lib/attribution';
import { capture, identifyUser, resetUser } from '@/lib/posthog';
import { supabase } from '@/lib/supabase';
import { trpc } from '@/lib/trpc';

// ── Private beta whitelist check ────────────────────────────────────────────
async function checkWhitelist(userEmail: string): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/check-whitelist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail }),
    });
    const data = await res.json();
    return data.allowed === true;
  } catch {
    return false; // fail closed — block on error
  }
}

interface AuthContextValue {
  user: Profile | null;
  loading: boolean;
  error: unknown;
  isAuthenticated: boolean;
  session: Session | null;
  refresh: () => void;
  logout: () => Promise<void>;
  subPlan: string;
  subStatus: string;
  isPro: boolean;
  isBuilder: boolean;
  isScale: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [subPlan, setSubPlan] = useState<string>('');
  const [subStatus, setSubStatus] = useState<string>('inactive');
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !!session,
    staleTime: 0,
    // Prevent TRPC failures from crashing the entire app
    throwOnError: false,
  });

  const refetchMe = useRef<() => void>(() => {});
  refetchMe.current = () => {
    meQuery.refetch();
  };

  useEffect(() => {
    let resolved = false;

    // Hard deadline — never spin more than 3 seconds
    const deadline = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        setSessionLoading(false);
      }
    }, 3000);

    // 1. Subscribe to future auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, s) => {
      resolved = true;
      clearTimeout(deadline);

      // ── Private beta whitelist gate ──────────────────────────────────
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && s?.user?.email) {
        const allowed = await checkWhitelist(s.user.email);
        if (!allowed) {
          await supabase.auth.signOut();
          setSession(null);
          setSessionLoading(false);
          // Redirect to sign-in with beta error
          if (!window.location.search.includes('error=beta')) {
            window.location.href = '/login?error=beta';
          }
          return;
        }
      }

      setSession(s);
      setSessionLoading(false);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        utils.auth.me.invalidate().then(() => refetchMe.current());
      }
      if (event === 'SIGNED_OUT') {
        utils.auth.me.setData(undefined, null);
      }
    });

    // 2. Handle implicit OAuth tokens in URL hash
    const hash = window.location.hash;
    if (hash.includes('access_token')) {
      const params = new URLSearchParams(hash.replace(/^#/, ''));
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      if (access_token && refresh_token) {
        supabase.auth.setSession({ access_token, refresh_token }).then(({ data, error }) => {
          if (!error && data.session) {
            setSession(data.session);
            setSessionLoading(false);
            window.history.replaceState(null, '', window.location.pathname);
            refetchMe.current();
          }
        });
        return () => {
          clearTimeout(deadline);
          subscription.unsubscribe();
        };
      }
    }

    // 3. Recover existing session from localStorage on mount
    supabase.auth
      .getSession()
      .then(({ data: { session: s } }) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(deadline);
          setSession(s);
          setSessionLoading(false);
        }
      })
      .catch(() => {
        if (!resolved) {
          resolved = true;
          clearTimeout(deadline);
          setSessionLoading(false);
        }
      });

    return () => {
      clearTimeout(deadline);
      subscription.unsubscribe();
    };
  }, [utils]);

  // Trigger meQuery when session becomes available
  useEffect(() => {
    if (session) meQuery.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!session]);

  // Identify user in PostHog + send attribution when profile loads
  const attributionSent = useRef(false);
  useEffect(() => {
    const profile = meQuery.data as Profile | null | undefined;
    if (profile?.id) {
      identifyUser(profile.id, {
        email: profile.email,
        name: profile.name,
        role: profile.role,
        created_at: profile.createdAt,
      });
      capture('user_logged_in');

      // Send UTM attribution once per session
      if (!attributionSent.current) {
        attributionSent.current = true;
        const attrs = getAttributionFlat();
        if (attrs.first_touch_source || attrs.last_touch_source) {
          capture('user_attribution', attrs);
        }
      }
    }
  }, [meQuery.data]);

  // Fetch subscription plan from REST endpoint (not Drizzle)
  useEffect(() => {
    if (!session?.access_token) return;
    fetch('/api/subscription/me', {
      headers: { Authorization: `Bearer ${session.access_token}` }
    })
      .then(r => r.json())
      .then((d: { plan?: string; status?: string }) => {
        setSubPlan(d.plan || '');
        setSubStatus(d.status || 'inactive');
      })
      .catch(() => {
        setSubPlan('');
        setSubStatus('inactive');
      });
  }, [session?.access_token]);

  const logout = useCallback(async () => {
    resetUser();
    await supabase.auth.signOut();
    utils.auth.me.setData(undefined, null);
    await utils.auth.me.invalidate();
  }, [utils]);

  const isPro = ['builder', 'scale'].includes(subPlan.toLowerCase()) && ['active'].includes(subStatus.toLowerCase());
  const isBuilder = subPlan.toLowerCase() === 'builder' && subStatus.toLowerCase() === 'active';
  const isScale = subPlan.toLowerCase() === 'scale' && subStatus.toLowerCase() === 'active';

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session ? ((meQuery.data as Profile | null | undefined) ?? null) : null,
      loading: sessionLoading || (!!session && meQuery.isPending && !meQuery.isFetched),
      error: meQuery.error ?? null,
      isAuthenticated: !!session,
      session,
      refresh: () => meQuery.refetch(),
      logout,
      subPlan,
      subStatus,
      isPro,
      isBuilder,
      isScale,
    }),
    [
      session,
      sessionLoading,
      meQuery.data,
      meQuery.error,
      meQuery.isPending,
      meQuery.isFetched,
      logout,
      subPlan,
      subStatus,
      isPro,
      isBuilder,
      isScale,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
