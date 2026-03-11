import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ProductProvider } from "./contexts/ProductContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { lazy, Suspense } from "react";

// Lazy-loaded page components for code splitting
const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Account = lazy(() => import("./pages/Account"));
const SignIn = lazy(() => import("./pages/SignIn"));
const SettingsProfile = lazy(() => import("./pages/SettingsProfile"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Storefront = lazy(() => import("./pages/Storefront"));

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
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/login" component={SignIn} />
        <Route path="/sign-in" component={SignIn} />
        <Route path="/account" component={Account} />
        <Route path="/app/settings/profile" component={SettingsProfile} />
        <Route path="/store/:slug" component={Storefront} />
        <Route path="/app">{() => <ProtectedRoute><Dashboard /></ProtectedRoute>}</Route>
        <Route path="/app/settings">{() => <ProtectedRoute><Dashboard /></ProtectedRoute>}</Route>
        <Route path="/app/store/:subpage">{() => <ProtectedRoute><Dashboard /></ProtectedRoute>}</Route>
        <Route path="/app/:tool">{() => <ProtectedRoute><Dashboard /></ProtectedRoute>}</Route>
        <Route path="/app/product-hub/:id">{() => <ProtectedRoute><Dashboard /></ProtectedRoute>}</Route>
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <AuthProvider>
          <ProductProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
          </ProductProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
