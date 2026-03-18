import { AnimatePresence, motion } from 'framer-motion';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import { Toaster } from '@/components/ui/sonner';
import AlmostWonModal from '@/components/AlmostWonModal';
import { TooltipProvider } from '@/components/ui/tooltip';
import { capture } from '@/lib/posthog';
import ErrorBoundary from './components/ErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { MarketProvider } from './contexts/MarketContext';
import { ProductProvider } from './contexts/ProductContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { MayaProvider } from './context/MayaContext';

// Lazy-loaded page components for code splitting
const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Account = lazy(() => import('./pages/Account'));
const SignIn = lazy(() => import('./pages/SignIn'));
const SettingsProfile = lazy(() => import('./pages/SettingsProfile'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Storefront = lazy(() => import('./pages/Storefront'));
const AdminLeads = lazy(() => import('./pages/AdminLeads'));
const StoreBuilder = lazy(() => import('./pages/store-builder/index'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const PublicProfitCalculator = lazy(() => import('./pages/PublicProfitCalculator'));
const Affiliate = lazy(() => import('./pages/Affiliate'));
const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase'));
const LearnHub = lazy(() => import('./pages/LearnHub'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const AdminControlPanel = lazy(() => import('./pages/AdminControlPanel'));
const AdminSubscribers = lazy(() => import('./pages/AdminSubscribers'));
const PromoDashboard = lazy(() => import('./pages/PromoDashboard'));
const ProductReport = lazy(() => import('./pages/ProductReport'));
const StoreHealthScore = lazy(() => import('./pages/StoreHealthScore'));
// SEO landing pages
const DropshippingAustralia = lazy(() => import('./pages/seo/DropshippingAustralia'));
const TikTokShopAustralia = lazy(() => import('./pages/seo/TikTokShopAustralia'));
const WinningProductsAustralia = lazy(() => import('./pages/seo/WinningProductsAustralia'));

function LoadingFallback() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#080a0e' }}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg animate-pulse"
          style={{
            background: 'linear-gradient(135deg, #d4af37, #f0c040)',
            color: '#080a0e',
            fontFamily: 'Syne, sans-serif',
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
                background: '#d4af37',
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


// Gold loading bar on route change
const LOADING_BAR_CSS = `
  .page-loading-bar {
    position: fixed; top: 0; left: 0; height: 2px;
    background: #d4af37; z-index: 99999;
    animation: loadingBar 0.5s ease forwards;
    pointer-events: none;
  }
  @keyframes loadingBar {
    0% { width: 0%; opacity: 1; }
    60% { width: 80%; opacity: 1; }
    100% { width: 100%; opacity: 0; }
  }
`;

function Router() {
  const [location] = useLocation();
  const [showBar, setShowBar] = useState(false);
  const barTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    setShowBar(true);
    if (barTimerRef.current) clearTimeout(barTimerRef.current);
    barTimerRef.current = setTimeout(() => setShowBar(false), 600);
    return () => { if (barTimerRef.current) clearTimeout(barTimerRef.current); };
  }, [location]);

  return (
    <>
      <style>{LOADING_BAR_CSS}</style>
      {showBar && <div className="page-loading-bar" key={location + '-bar'} />}
    <Suspense fallback={<LoadingFallback />}>
      <AnimatePresence mode="wait">
        <motion.div
          key={location}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        >
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/pricing" component={Pricing} />
            <Route path="/store-builder" component={StoreBuilder} />
            <Route path="/login" component={SignIn} />
            <Route path="/sign-in" component={SignIn} />
            <Route path="/signup">{() => <SignIn />}</Route>
            <Route path="/onboarding">
              {() => (
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/verify-email" component={VerifyEmail} />
            <Route path="/account" component={Account} />
            <Route path="/app/settings/profile" component={SettingsProfile} />
            <Route path="/store/:slug" component={Storefront} />
            <Route path="/tools/profit-calculator" component={PublicProfitCalculator} />
            <Route path="/app/affiliate">
              {() => (
                <ProtectedRoute>
                  <Affiliate />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/admin/subscribers">
              {() => (
                <ProtectedRoute>
                  <AdminSubscribers />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/admin/leads">
              {() => (
                <ProtectedRoute>
                  <AdminLeads />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/admin">
              {() => (
                <ProtectedRoute>
                  <AdminPanel />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/app/knowledge-base">
              {() => (
                <ProtectedRoute>
                  <KnowledgeBase />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/app/learn">
              {() => (
                <ProtectedRoute>
                  <LearnHub />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/app/admin">
              {() => (
                <ProtectedRoute>
                  <AdminControlPanel />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/app">
              {() => (
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/app/settings">
              {() => (
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              )}
            </Route>

            {/* Redirects for consolidated pages */}
            <Route path="/app/trend-signals">{() => { window.location.replace('/app/intelligence'); return null; }}</Route>
            <Route path="/app/winning-products">{() => { window.location.replace('/app/intelligence'); return null; }}</Route>
            <Route path="/app/product-discovery">{() => { window.location.replace('/app/intelligence'); return null; }}</Route>
            <Route path="/app/market">{() => { window.location.replace('/app/spy'); return null; }}</Route>
            <Route path="/app/creators">{() => { window.location.replace('/app/spy'); return null; }}</Route>
            <Route path="/app/videos">{() => { window.location.replace('/app/spy'); return null; }}</Route>
            <Route path="/app/meta-ads">{() => { window.location.replace('/app/growth'); return null; }}</Route>
            <Route path="/app/copywriter">{() => { window.location.replace('/app/growth'); return null; }}</Route>
            <Route path="/app/brand-dna">{() => { window.location.replace('/app/growth'); return null; }}</Route>
            <Route path="/app/suppliers">{() => { window.location.replace('/app/profit'); return null; }}</Route>
            <Route path="/app/profit-calculator">{() => { window.location.replace('/app/profit'); return null; }}</Route>
            <Route path="/app/profit-check">{() => { window.location.replace('/app/profit'); return null; }}</Route>

            {/* New consolidated routes */}
            <Route path="/app/intelligence">{() => <ProtectedRoute><Dashboard /></ProtectedRoute>}</Route>
            <Route path="/app/spy">{() => <ProtectedRoute><Dashboard /></ProtectedRoute>}</Route>
            <Route path="/app/growth">{() => <ProtectedRoute><Dashboard /></ProtectedRoute>}</Route>
            <Route path="/app/profit">{() => <ProtectedRoute><Dashboard /></ProtectedRoute>}</Route>

            <Route path="/app/store/:subpage">
              {() => (
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/app/product-hub/:id">
              {() => (
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/app/:tool">
              {() => (
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/store-health" component={StoreHealthScore} />
            <Route path="/dropshipping-australia" component={DropshippingAustralia} />
            <Route path="/tiktok-shop-australia" component={TikTokShopAustralia} />
            <Route path="/winning-products-australia" component={WinningProductsAustralia} />
            <Route path="/product/:slug" component={ProductReport} />
            <Route path="/demo-dashboard" component={PromoDashboard} />
            <Route path="/privacy">{() => <LegalPage title="Privacy Policy" slug="privacy" />}</Route>
            <Route path="/terms">{() => <LegalPage title="Terms of Service" slug="terms" />}</Route>
            <Route path="/refund-policy">{() => <LegalPage title="Refund Policy" slug="refund-policy" />}</Route>
            <Route path="/404" component={NotFound} />
            <Route component={NotFound} />
          </Switch>
        </motion.div>
      </AnimatePresence>
    </Suspense>
    </>
  );
}

function LegalPage({ title, slug }: { title: string; slug: string }) {
  const content: Record<string, string[]> = {
    privacy: [
      'Majorka Pty Ltd ("we", "us") is committed to protecting your privacy in accordance with the Australian Privacy Act 1988.',
      'We collect personal information such as name, email, and usage data to provide and improve our service.',
      'Your data is stored securely and never sold to third parties. We use it solely to operate the platform and communicate with you.',
      'You may request access to, correction of, or deletion of your personal data by emailing hello@majorka.io.',
      'We use cookies and analytics tools (PostHog) to understand how users interact with Majorka. You may opt out at any time.',
      'By using Majorka, you consent to this policy. We may update it — continued use constitutes acceptance.',
    ],
    terms: [
      'These Terms of Service govern your use of Majorka (majorka.io), operated by Majorka Pty Ltd (ABN pending), Gold Coast, QLD, Australia.',
      'By creating an account, you agree to use the platform lawfully and not to misuse AI tools, resell access, or reverse-engineer the service.',
      'Subscription fees are charged in AUD. Cancellations take effect at the end of the current billing period. No refunds for partial months.',
      'Majorka provides AI-generated content for informational purposes. We do not guarantee specific business outcomes.',
      'Australian Consumer Law applies. Nothing in these terms limits your rights under the Competition and Consumer Act 2010.',
      'We may suspend accounts that breach these terms. For disputes, contact hello@majorka.io before seeking legal remedies.',
    ],
    'refund-policy': [
      'We offer a 7-day money-back guarantee on your first subscription payment if you are not satisfied with Majorka.',
      'To request a refund, email hello@majorka.io within 7 days of your first charge with your account email and reason.',
      'Refunds are processed within 5-10 business days to your original payment method.',
      'Subsequent billing periods are non-refundable unless required by Australian Consumer Law.',
      'If you experience a technical issue preventing you from using the platform, contact us immediately — we will resolve it or issue a credit.',
      'This policy does not affect your rights under the Australian Consumer Law.',
    ],
  };
  const paragraphs = content[slug] || [];
  return (
    <div style={{ minHeight: '100vh', background: '#080a0e', color: '#f2efe9', fontFamily: 'DM Sans, sans-serif', padding: '80px 24px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <a href="/" style={{ color: '#d4af37', fontSize: 13, textDecoration: 'none', display: 'inline-block', marginBottom: 32 }}>← Back to Majorka</a>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 36, fontWeight: 800, marginBottom: 8, color: '#f2efe9' }}>{title}</h1>
        <p style={{ fontSize: 13, color: '#52525b', marginBottom: 48 }}>Last updated: March 2025 · Majorka Pty Ltd · Gold Coast, QLD, Australia</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {paragraphs.map((p, i) => (
            <p key={i} style={{ fontSize: 15, lineHeight: 1.8, color: '#a1a1aa', borderLeft: '2px solid rgba(212,175,55,0.2)', paddingLeft: 20 }}>{p}</p>
          ))}
        </div>
        <div style={{ marginTop: 60, padding: '24px', background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 12 }}>
          <p style={{ fontSize: 14, color: '#71717a' }}>Questions? Email us at <a href="mailto:hello@majorka.io" style={{ color: '#d4af37' }}>hello@majorka.io</a></p>
        </div>
      </div>
    </div>
  );
}

function App() {
  useEffect(() => {
    capture('app_loaded');
    // Capture referral code from any page
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) localStorage.setItem('majorka_ref', ref);
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        document.dispatchEvent(new CustomEvent('close-modal'));
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent('open-command-palette'));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <AuthProvider>
          <MarketProvider>
            <ProductProvider>
              <MayaProvider>
                <TooltipProvider>
                  <Toaster />
                  <AlmostWonModal />
                  <Router />
                </TooltipProvider>
              </MayaProvider>
            </ProductProvider>
          </MarketProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
