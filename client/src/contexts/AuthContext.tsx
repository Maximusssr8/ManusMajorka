import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import type { Profile } from "@shared/types";
import { supabase } from "@/lib/supabase";
import { trpc } from "@/lib/trpc";

interface AuthContextValue {
  user: Profile | null;
  loading: boolean;
  error: unknown;
  isAuthenticated: boolean;
  session: Session | null;
  refresh: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !!session,
    staleTime: 0,
  });

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      console.log(`[useAuth] onAuthStateChange: ${event} | session: ${!!s} | user: ${s?.user?.email ?? "none"}`);
      resolved = true;
      clearTimeout(deadline);
      setSession(s);
      setSessionLoading(false);
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        utils.auth.me.invalidate().then(() => {
          refetchMe.current();
        });
      }
      if (event === "SIGNED_OUT") {
        utils.auth.me.setData(undefined, null);
      }
    });

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
            window.history.replaceState(null, "", window.location.pathname);
            refetchMe.current();
          }
        });
        return () => { clearTimeout(deadline); subscription.unsubscribe(); };
      }
    }

    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get("code");
    if (code) {
      console.log("[useAuth] PKCE code in URL — Supabase will exchange it; waiting for onAuthStateChange");
    }

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
  }, [utils]);

  useEffect(() => {
    if (session) {
      console.log("[useAuth] session became truthy, triggering meQuery refetch");
      meQuery.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!session]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    utils.auth.me.setData(undefined, null);
    await utils.auth.me.invalidate();
  }, [utils]);

  const value = useMemo<AuthContextValue>(() => ({
    user: session ? ((meQuery.data as Profile | null | undefined) ?? null) : null,
    loading: sessionLoading || (!!session && meQuery.isPending && !meQuery.isFetched),
    error: meQuery.error ?? null,
    isAuthenticated: !!session,
    session,
    refresh: () => meQuery.refetch(),
    logout,
  }), [
    session,
    sessionLoading,
    meQuery.data,
    meQuery.error,
    meQuery.isPending,
    meQuery.isFetched,
    logout,
  ]);

  console.log(`[useAuth] render | isAuthenticated: ${value.isAuthenticated} | loading: ${value.loading} | user: ${value.user?.email ?? "none"} | meStatus: ${meQuery.status}`);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
