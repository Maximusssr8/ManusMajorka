import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import WebsiteGenerator from "./WebsiteGenerator";
import MetaAdsPack from "./MetaAdsPack";
import BrandDNA from "./BrandDNA";
import MarketIntel from "./MarketIntel";
import AIChat from "./AIChat";

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
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [location] = useLocation();
  const [showGate, setShowGate] = useState(false);

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

  // Determine if user has access
  const hasAccess = accessData?.hasAccess ?? false;

  // Determine which tool page to show
  const renderToolPage = () => {
    if (!hasAccess) return null;

    switch (location) {
      case "/dashboard/website-generator":
        return <WebsiteGenerator />;
      case "/dashboard/meta-ads":
        return <MetaAdsPack />;
      case "/dashboard/brand-dna":
        return <BrandDNA />;
      case "/dashboard/market-intel":
        return <MarketIntel />;
      case "/dashboard/chat":
        return <AIChat />;
      default:
        return <DefaultDashboardView />;
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

  // If no access, show gate
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
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
        </div>
      </div>
    );
  }

  // If has access, show DashboardLayout with tool pages
  return (
    <DashboardLayout>
      {renderToolPage()}
    </DashboardLayout>
  );
}

function DefaultDashboardView() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-black mb-2" style={{ fontFamily: "Syne, sans-serif" }}>
          Welcome to Majorka
        </h1>
        <p className="text-muted-foreground mb-6">
          Select a tool from the sidebar to get started.
        </p>
      </div>
    </div>
  );
}
