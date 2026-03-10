import { supabase } from "@/lib/supabase";
import { trpc } from "@/lib/trpc";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const utils = trpc.useUtils();

  // Listen for Supabase auth state changes
  useEffect(() => {
    let resolved = false;

    // Hard 2s deadline — fires no matter what
    const deadline = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.warn("[useAuth] deadline hit — forcing sessionLoading=false");
        setSessionLoading(false);
      }
    }, 2000);

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(deadline);
        setSession(s);
        setSessionLoading(false);
      }
    }).catch(() => {
      if (!resolved) {
        resolved = true;
        clearTimeout(deadline);
        setSessionLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      resolved = true;
      clearTimeout(deadline);
      setSession(s);
      setSessionLoading(false);
      utils.auth.me.invalidate();
    });

    return () => {
      clearTimeout(deadline);
      subscription.unsubscribe();
    };
  }, [utils]);

  // Fetch profile from our database via tRPC (only when we have a session)
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !!session,
    staleTime: 0,
  });

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    utils.auth.me.setData(undefined, null);
    await utils.auth.me.invalidate();
  }, [utils]);

  const state = useMemo(() => ({
    user: session ? (meQuery.data ?? null) : null,
    loading: sessionLoading || (!!session && meQuery.isPending && !meQuery.isFetched),
    error: meQuery.error ?? null,
    isAuthenticated: !!session,
    session,
  }), [
    session,
    sessionLoading,
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
