import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Account from "./pages/Account";
import WebsiteGenerator from "./pages/WebsiteGenerator";
import MetaAdsPack from "./pages/MetaAdsPack";
import BrandDNA from "./pages/BrandDNA";
import MarketIntel from "./pages/MarketIntel";
import AIChat from "./pages/AIChat";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/website-generator" component={WebsiteGenerator} />
      <Route path="/dashboard/meta-ads" component={MetaAdsPack} />
      <Route path="/dashboard/brand-dna" component={BrandDNA} />
      <Route path="/dashboard/market-intel" component={MarketIntel} />
      <Route path="/dashboard/chat" component={AIChat} />
      <Route path="/account" component={Account} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
