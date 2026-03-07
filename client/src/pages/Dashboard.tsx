import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Loader2, LogOut, User, ChevronRight, Lock } from "lucide-react";

const MAJORKA_CDN = "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663410730336/BApNLVTQJIkjfTKY.html?Expires=1804386341&Signature=VMk5i6QImmjlDYzAeo1ueLBFHRfcckgvTWeyI4ISHQQc-Xss~Dbzto6yNsOGZfdaNnRVnQ0VtqbVJQ4Xwx~f7eQykCAE3BFq4O6M9cHjDclq5pBee0faV71819fXJTuqaliONfahipmy~f9Jy6awmsiZrUZTee~ppw5ypYObfYZOWU~qcrDBbVYOS0OHTpsasgjn~JbOozyMmDkGBN5L5sIf4Q9pdwU5bLME7xUFGTtZ4IL60TMjwVky7DOukS~d6UXMF-3hQhod65Lb2~m2XMq3AISdhMnV9XJeGKSssX8gvYMwGDJatEDM0rvFm1Zg6euNj~fV0t0ztz6EgSRFEQ__&Key-Pair-Id=K2HSFNDJXOU9YS";

const planIncludes = [
  "Unlimited AI tool runs",
  "Unlimited website generations",
  "Unlimited Meta Ads Launch Packs",
  "Ads Studio — hooks, scripts & copy",
  "UGC Video Studio",
  "Brand DNA Analyzer",
  "Full Research → Scale workflow",
];

export default function Dashboard() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeReady, setIframeReady] = useState(false);

  const { data: accessData, isLoading: accessLoading } = trpc.subscription.hasAccess.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const activateMutation = trpc.subscription.activate.useMutation({
    onSuccess: () => {
      utils.subscription.hasAccess.invalidate();
      utils.subscription.get.invalidate();
    },
  });

  const utils = trpc.useUtils();

  // Redirect unauthenticated users to landing page
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [authLoading, isAuthenticated]);

  // Once access is confirmed, send postMessage to the iframe to unlock it
  useEffect(() => {
    if (accessData?.hasAccess && iframeReady && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage("mk_access_granted", "*");
    }
  }, [accessData?.hasAccess, iframeReady]);

  const handleIframeLoad = () => {
    setIframeReady(true);
    // Send access grant immediately on load if subscription is active
    if (accessData?.hasAccess && iframeRef.current?.contentWindow) {
      setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage("mk_access_granted", "*");
      }, 300);
    }
  };

  // Loading state
  if (authLoading || accessLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl"
            style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)", color: "#080a0e", fontFamily: "Syne, sans-serif" }}
          >
            M
          </div>
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const hasAccess = accessData?.hasAccess ?? false;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ── TOP BAR ── */}
      <header
        className="flex items-center justify-between px-4 sm:px-6 h-12 border-b flex-shrink-0"
        style={{ background: "rgba(8,10,14,0.95)", borderColor: "rgba(255,255,255,0.07)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/")}>
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm"
            style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)", color: "#080a0e", fontFamily: "Syne, sans-serif" }}
          >
            M
          </div>
          <span className="font-black text-sm hidden sm:block" style={{ fontFamily: "Syne, sans-serif", letterSpacing: "-0.3px" }}>
            Majorka
          </span>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {hasAccess && (
            <div
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: "rgba(45,202,114,0.1)", border: "1px solid rgba(45,202,114,0.25)", color: "#2dca72", fontFamily: "Syne, sans-serif" }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ boxShadow: "0 0 6px rgba(45,202,114,0.8)" }} />
              Pro Active
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground gap-1.5"
            onClick={() => setLocation("/account")}
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">{user?.name?.split(" ")[0]}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={async () => { await logout(); setLocation("/"); }}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {hasAccess ? (
          /* ── FULL APP IFRAME ── */
          <iframe
            ref={iframeRef}
            src={`${MAJORKA_CDN}`}
            onLoad={handleIframeLoad}
            className="flex-1 w-full border-0"
            title="Majorka AI Ecommerce OS"
            allow="clipboard-write"
            style={{ height: "calc(100vh - 48px)" }}
          />
        ) : (
          /* ── SUBSCRIPTION GATE ── */
          <div
            className="flex-1 flex items-center justify-center p-6"
            style={{
              background: "radial-gradient(ellipse 600px 400px at 50% 30%, rgba(212,175,55,0.06) 0%, transparent 70%)",
            }}
          >
            <div className="w-full max-w-md text-center">
              {/* Icon */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-3xl mx-auto mb-7"
                style={{
                  background: "linear-gradient(135deg, #d4af37, #f0c040)",
                  color: "#080a0e",
                  fontFamily: "Syne, sans-serif",
                  boxShadow: "0 0 40px rgba(212,175,55,0.35)",
                }}
              >
                M
              </div>

              <div className="flex items-center justify-center gap-2 mb-3">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: "#d4af37", fontFamily: "Syne, sans-serif" }}
                >
                  Members Only
                </span>
              </div>

              <h1
                className="text-2xl font-black mb-3"
                style={{ fontFamily: "Syne, sans-serif", letterSpacing: "-0.5px" }}
              >
                Unlock Majorka
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-sm mx-auto">
                You're signed in as <strong className="text-foreground">{user?.name}</strong>. Activate your membership to access the full AI Ecommerce Operating System.
              </p>

              {/* Feature list */}
              <div
                className="rounded-xl p-5 text-left mb-6 border"
                style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
              >
                <ul className="space-y-2.5">
                  {planIncludes.map((item, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm text-foreground/75">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#d4af37" }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <Button
                className="w-full py-6 text-base font-black rounded-xl mb-3"
                disabled={activateMutation.isPending}
                onClick={() => activateMutation.mutate({ plan: "pro" })}
                style={{
                  background: "linear-gradient(135deg, #d4af37, #c09a28)",
                  color: "#080a0e",
                  fontFamily: "Syne, sans-serif",
                  fontWeight: 800,
                  boxShadow: "0 4px 22px rgba(212,175,55,0.35)",
                }}
              >
                {activateMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Activating…</>
                ) : (
                  <>Get Access — $99 / month <ArrowRight className="w-5 h-5 ml-2" /></>
                )}
              </Button>

              {activateMutation.isError && (
                <p className="text-xs text-destructive mt-2">{activateMutation.error.message}</p>
              )}

              <p className="text-xs text-muted-foreground mt-3">
                30-day money-back guarantee · Cancel anytime
              </p>

              <button
                className="mt-5 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mx-auto"
                onClick={() => setLocation("/")}
              >
                ← Back to home
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
