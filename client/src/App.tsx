import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Account from "./pages/Account";
import SignIn from "./pages/SignIn";
import SettingsProfile from "./pages/SettingsProfile";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={SignIn} />
      <Route path="/sign-in" component={SignIn} />
      <Route path="/account" component={Account} />
      <Route path="/app/settings/profile" component={SettingsProfile} />
      {/* All /app routes go through Dashboard which handles DashboardLayout + ToolPage */}
      <Route path="/app" component={Dashboard} />
      <Route path="/app/:tool" component={Dashboard} />
      <Route path="/app/product-hub/:id" component={Dashboard} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
