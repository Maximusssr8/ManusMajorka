import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ProductProvider } from "./contexts/ProductContext";
import { MarketProvider } from "./contexts/MarketContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { lazy, Suspense, useEffect } from "react";
import { capture } from "@/lib/posthog";
import { AnimatePresence, motion } from "framer-motion";

// Lazy-loaded page components for code splitting
const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Account = lazy(() => import("./pages/Account"));
const SignIn = lazy(() => import("./pages/SignIn"));
const SettingsProfile = lazy(() => import("./pages/SettingsProfile"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Storefront = lazy(() => import("./pages/Storefront"));
const AdminLeads = lazy(() => import("./pages/AdminLeads"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const PublicProfitCalculator = lazy(() => import("./pages/PublicProfitCalculator"));
const Affiliate = lazy(() => import("./pages/Affiliate"));
const KnowledgeBase = lazy(() => import("./pages/KnowledgeBase"));
const LearnHub = lazy(() => import("./pages/LearnHub"));

function LoadingFallback() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#080a0e" }}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg animate-pulse"
          style={{
            background: "linear-gradient(135deg, #d4af37, #f0c040)",
            color: "#080a0e",
            fontFamily: "Syne, sans-serif",
          }}
        >
          M
        </div>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full animate-bounce"
              style={{
                background: "#d4af37",
                opacity: 0.6,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Router() {
  const [location] = useLocation();
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AnimatePresence mode="wait">
        <motion.div
          key={location}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={{ height: "100%", display: "flex", flexDirection: "column" }}
        >
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/pricing" component={Pricing} />
            <Route path="/login" component={SignIn} />
            <Route path="/sign-in" component={SignIn} />
            <Route path="/signup">{() => <SignIn />}</Route>
            <Route path="/onboarding">{() => <ProtectedRoute><Onboarding /></ProtectedRoute>}</Route>
            <Route path="/verify-email" component={VerifyEmail} />
            <Route path="/account" component={Account} />
            <Route path="/app/settings/profile" component={SettingsProfile} />
            <Route path="/store/:slug" component={Storefront} />
            <Route path="/tools/profit-calculator" component={PublicProfitCalculator} />
            <Route path="/app/affiliate">{() => <ProtectedRoute><Affiliate /></ProtectedRoute>}</Route>
            <Route path="/admin/leads">{() => <ProtectedRoute><AdminLeads /></ProtectedRoute>}</Route>
            <Route path="/app/knowledge-base">{() => <ProtectedRoute><KnowledgeBase /></ProtectedRoute>}</Route>
            <Route path="/app/learn">{() => <ProtectedRoute><LearnHub /></ProtectedRoute>}</Route>
            <Route path="/app">{() => <ProtectedRoute><Dashboard /></ProtectedRoute>}</Route>
            <Route path="/app/settings">{() => <ProtectedRoute><Dashboard /></ProtectedRoute>}</Route>
            <Route path="/app/store/:subpage">{() => <ProtectedRoute><Dashboard /></ProtectedRoute>}</Route>
            <Route path="/app/:tool">{() => <ProtectedRoute><Dashboard /></ProtectedRoute>}</Route>
            <Route path="/app/product-hub/:id">{() => <ProtectedRoute><Dashboard /></ProtectedRoute>}</Route>
            <Route path="/404" component={NotFound} />
            <Route component={NotFound} />
          </Switch>
        </motion.div>
      </AnimatePresence>
    </Suspense>
  );
}

function App() {
  useEffect(() => {
    capture("app_loaded");
    // Capture referral code from any page
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) localStorage.setItem("majorka_ref", ref);
  }, []);
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <AuthProvider>
          <MarketProvider>
          <ProductProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
          </ProductProvider>
          </MarketProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
