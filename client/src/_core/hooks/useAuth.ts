import { supabase } from "@/lib/supabase";
import { trpc } from "@/lib/trpc";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const utils = trpc.useUtils();

  // Fetch profile from our database via tRPC (only when we have a session)
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !!session,
    staleTime: 0,
  });

  // Stable ref so the auth effect can call refetch without it being a dep
  const refetchMe = useRef<() => void>(() => {});
  refetchMe.current = () => {
    console.log("[useAuth] refetchMe called, session:", !!session);
    meQuery.refetch();
  };

  useEffect(() => {
    let resolved = false;

    const deadline = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.warn("[useAuth] 2s deadline hit — forcing sessionLoading=false");
        setSessionLoading(false);
      }
    }, 2000);

    // Subscribe FIRST — before any async work — so we never miss an event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      console.log(`[useAuth] onAuthStateChange: ${event} | session: ${!!s} | user: ${s?.user?.email ?? "none"}`);
      resolved = true;
      clearTimeout(deadline);
      setSession(s);
      setSessionLoading(false);
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        // Invalidate cache so React Query refetches with the new token.
        // Also explicitly call refetch via ref — at this point the React state
        // hasn't re-rendered yet so enabled:!!session is still false on the
        // query. We trigger it manually here and React Query will also pick it
        // up on the next render when enabled becomes true.
        utils.auth.me.invalidate().then(() => {
          refetchMe.current();
        });
      }
      if (event === "SIGNED_OUT") {
        utils.auth.me.setData(undefined, null);
      }
    });

    // ── Handle implicit-flow OAuth tokens in URL hash (#access_token=...) ──
    const hash = window.location.hash;
    if (hash.includes("access_token")) {
      const params = new URLSearchParams(hash.replace(/^#/, ""));
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      console.log("[useAuth] implicit OAuth tokens in hash — calling setSession");
      if (access_token && refresh_token) {
        supabase.auth.setSession({ access_token, refresh_token }).then(({ data, error }) => {
          if (error) {
            console.error("[useAuth] setSession error:", error.message);
          } else {
            console.log("[useAuth] setSession OK, user:", data.session?.user?.email);
            setSession(data.session);
            setSessionLoading(false);
            // Clean hash from URL without a reload
            window.history.replaceState(null, "", window.location.pathname);
            refetchMe.current();
          }
        });
        return () => { clearTimeout(deadline); subscription.unsubscribe(); };
      }
    }

    // ── Handle PKCE-flow code in query params (?code=...) ──
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get("code");
    if (code) {
      console.log("[useAuth] PKCE code in URL — Supabase will exchange it; waiting for onAuthStateChange");
      // Supabase client detects the code automatically and fires onAuthStateChange.
      // Just extend our deadline to give the exchange time to complete.
      // getSession() below will also pick it up once exchange is done.
    }

    // ── Normal mount: pull existing session from storage ──
    supabase.auth.getSession().then(({ data: { session: s }, error }) => {
      console.log(`[useAuth] getSession: ${!!s} | user: ${s?.user?.email ?? "none"} | err: ${error?.message ?? "none"}`);
      if (!resolved) {
        resolved = true;
        clearTimeout(deadline);
        setSession(s);
        setSessionLoading(false);
      }
    }).catch((err) => {
      console.error("[useAuth] getSession threw:", err);
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
  }, [utils]); // intentionally omit meQuery — we use the ref instead

  // When session transitions from null → value, ensure meQuery fires even
  // if the onAuthStateChange path already ran (handles PKCE exchange timing).
  useEffect(() => {
    if (session) {
      console.log("[useAuth] session became truthy, triggering meQuery refetch");
      meQuery.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!session]); // only react to truthy/falsy flip, not session object identity

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
    meQuery.isPending,
    meQuery.isFetched,
  ]);

  console.log(`[useAuth] render | isAuthenticated: ${state.isAuthenticated} | loading: ${state.loading} | user: ${state.user?.email ?? "none"} | meStatus: ${meQuery.status}`);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
