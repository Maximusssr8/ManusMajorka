import './styles/components.css';
import { AnimatePresence, motion } from 'framer-motion';
import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import { Toaster } from '@/components/ui/sonner';
import AlmostWonModal from '@/components/AlmostWonModal';
import { OAuthErrorBanner } from '@/components/OAuthErrorBanner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { capture } from '@/lib/posthog';
import ErrorBoundary from './components/ErrorBoundary';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';
import CookieBanner from './components/CookieBanner';
import { CommandPalette } from './components/CommandPalette';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { MarketProvider } from './contexts/MarketContext';
import { ProductProvider } from './contexts/ProductContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { MayaProvider } from './context/MayaContext';
import { RegionProvider } from './context/RegionContext';

function lazyWithRetry(factory: () => Promise<any>) {
  return lazy(() =>
    factory().catch((err: unknown) => {
      // Chunk load failure = stale deploy. Force a hard reload once.
      const reloadKey = 'mkr_chunk_reload';
      const didReload = sessionStorage.getItem(reloadKey);
      if (!didReload) {
        sessionStorage.setItem(reloadKey, '1');
        window.location.reload();
        return new Promise(() => {}); // never resolves — reload is happening
      }
      // Already reloaded once — surface the error
      throw err;
    })
  );
}

// Lazy-loaded page components for code splitting
const Home = lazy(() => import('./pages/Home'));
const Blog = lazy(() => import('./pages/Blog'));
const About = lazy(() => import('./pages/About'));
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'));
const Account = lazy(() => import('./pages/Account'));
const SignIn = lazy(() => import('./pages/SignIn'));
const SettingsProfile = lazy(() => import('./pages/SettingsProfile'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Academy = lazy(() => import('./pages/Academy'));
const Storefront = lazy(() => import('./pages/Storefront'));
const AdminLeads = lazy(() => import('./pages/AdminLeads'));
const StoreBuilder = lazyWithRetry(() => import('./pages/store-builder/index'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const PublicProfitCalculator = lazy(() => import('./pages/PublicProfitCalculator'));
const Affiliate = lazy(() => import('./pages/Affiliate'));
const PublicProfitShare = lazy(() => import('./pages/PublicProfitShare'));
const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase'));
const LearnHub = lazy(() => import('./pages/LearnHub'));
const AdSpy = lazyWithRetry(() => import('./pages/AdSpy'));
const CompetitorSpy = lazyWithRetry(() => import('./pages/CompetitorSpy'));
const AdsStudio = lazyWithRetry(() => import('./pages/AdsStudio'));
const AdsManager = lazyWithRetry(() => import('./pages/AdsManager'));
const ProfitCalculator = lazyWithRetry(() => import('./pages/ProfitCalculator'));
const GrowthTools = lazyWithRetry(() => import('./pages/GrowthTools'));
const SpyTools = lazyWithRetry(() => import('./pages/SpyTools'));
const MarketDashboard = lazyWithRetry(() => import('./pages/MarketDashboard'));
const CreatorIntelligence = lazyWithRetry(() => import('./pages/CreatorIntelligence'));
const VideoIntelligence = lazyWithRetry(() => import('./pages/VideoIntelligence'));
const ProductIntelligence = lazyWithRetry(() =>
  import('./components/intelligence/ProductIntelligencePage').then(m => ({ default: m.ProductIntelligencePage }))
);
const Alerts = lazy(() => import('./pages/Alerts'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const AdminControlPanel = lazy(() => import('./pages/AdminControlPanel'));
const AdminSubscribers = lazy(() => import('./pages/AdminSubscribers'));
const PromoDashboard = lazy(() => import('./pages/PromoDashboard'));
const ProductReport = lazy(() => import('./pages/ProductReport'));
const SharedReport = lazy(() => import('./pages/SharedReport'));
const ShopDetail = lazy(() => import('./pages/ShopDetail'));
const ProductSearch = lazy(() => import('./pages/ProductSearch'));
const StoreHealthScore = lazy(() => import('./pages/StoreHealthScore'));
const AIChat = lazyWithRetry(() => import('./pages/AIChat'));
const RevenuePage = lazyWithRetry(() => import('./pages/RevenuePage'));
// SEO landing pages
const DropshippingAustralia = lazy(() => import('./pages/seo/DropshippingAustralia'));
const TikTokShopAustralia = lazy(() => import('./pages/seo/TikTokShopAustralia'));
const WinningProductsAustralia = lazy(() => import('./pages/seo/WinningProductsAustralia'));

// New v2 app shell (4 files only — AppShell, Nav, Home, Products)
const NewAppShell = lazyWithRetry(() => import('./components/app/AppShell').then((m) => ({ default: m.AppShell })));
const NewHome = lazyWithRetry(() => import('./pages/app/Home'));
const NewProducts = lazyWithRetry(() => import('./pages/app/Products'));
const NewRadar = lazyWithRetry(() => import('./pages/app/Radar'));
const NewMarket = lazyWithRetry(() => import('./pages/app/Market'));
const NewCreators = lazyWithRetry(() => import('./pages/app/Creators'));
const NewAlerts = lazyWithRetry(() => import('./pages/app/Alerts'));
const NewRevenue = lazyWithRetry(() => import('./pages/app/Revenue'));
const NewAdBriefs = lazyWithRetry(() => import('./pages/app/AdBriefs'));
const NewAnalytics = lazyWithRetry(() => import('./pages/app/Analytics'));
const NewNiches = lazyWithRetry(() => import('./pages/app/Niches'));
const ROASCalculator = lazy(() => import('./pages/tools/ROASCalculator'));
const OperatorWall = lazy(() => import('./pages/OperatorWall'));
const Affiliates = lazy(() => import('./pages/Affiliates'));
const Contact = lazy(() => import('./pages/Contact'));

interface ComingSoonProps { page: string }
function ComingSoon({ page }: ComingSoonProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 24, fontWeight: 700, color: '#ededed', letterSpacing: '-0.025em' }}>{page}</div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#71717a' }}>Coming soon</div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#0d0f14' }}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-lg animate-pulse"
          style={{
            background: 'var(--color-accent)',
            color: 'var(--color-bg)',
            fontFamily: "'Bricolage Grotesque', sans-serif",
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
                background: 'var(--color-accent)',
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


// Loading bar on route change
const LOADING_BAR_CSS = `
  .page-loading-bar {
    position: fixed; top: 0; left: 0; height: 2px;
    background: var(--color-accent); z-index: 99999;
    animation: loadingBar 0.5s ease forwards;
    pointer-events: none;
  }
  @keyframes loadingBar {
    0% { width: 0%; opacity: 1; }
    60% { width: 80%; opacity: 1; }
    100% { width: 100%; opacity: 0; }
  }
`;

// Wraps any app page with the persistent sidebar shell.
// Uses the unified NewAppShell (Nav.tsx) so every route — Home, Products,
// Maya AI, Ads Studio, Store Builder, Settings, Admin — renders the exact
// same sidebar, top header zone, and background tokens.
function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <NewAppShell>
      {children}
    </NewAppShell>
  );
}

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
    <RouteErrorBoundary>
    <Suspense fallback={<LoadingFallback />}>
      <div className="mkr-page-content" key={location} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/blog" component={Blog} />
            <Route path="/about" component={About} />
            <Route path="/academy" component={Academy} />
            <Route path="/pricing" component={Pricing} />
            <Route path="/store-builder" component={StoreBuilder} />
            <Route path="/login" component={SignIn} />
            <Route path="/sign-in" component={SignIn} />
            <Route path="/signup">{() => <SignIn />}</Route>
            <Route path="/sign-up">{() => <SignIn />}</Route>
            <Route path="/register">{() => <SignIn />}</Route>
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
            <Route path="/tools/roas-calculator" component={ROASCalculator} />
            <Route path="/operators" component={OperatorWall} />
            <Route path="/affiliates" component={Affiliates} />
            <Route path="/share/profit">{() => <PublicProfitShare />}</Route>
            <Route path="/app/affiliate">
              {() => (
                <ProtectedRoute requireSubscription>
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
                <ProtectedRoute requireSubscription>
                  <AppLayout><KnowledgeBase /></AppLayout>
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/app/ad-spy">{() => <ProtectedRoute requireSubscription><AppLayout><NewAdBriefs /></AppLayout></ProtectedRoute>}</Route>
            <Route path="/app/ad-briefs">{() => <ProtectedRoute requireSubscription><AppLayout><NewAdBriefs /></AppLayout></ProtectedRoute>}</Route>
            <Route path="/app/ad-spy-legacy">{() => <ProtectedRoute requireSubscription><AppLayout><AdSpy /></AppLayout></ProtectedRoute>}</Route>
            <Route path="/app/competitor-spy">{() => <ProtectedRoute requireSubscription><AppLayout><CompetitorSpy /></AppLayout></ProtectedRoute>}</Route>
            <Route path="/app/ads-studio">{() => <ProtectedRoute requireSubscription><AppLayout><AdsStudio /></AppLayout></ProtectedRoute>}</Route>
            <Route path="/app/ads-manager">{() => <ProtectedRoute requireSubscription><AppLayout><AdsManager /></AppLayout></ProtectedRoute>}</Route>
            <Route path="/app/learn">
              {() => (
                <ProtectedRoute requireSubscription>
                  <AppLayout><LearnHub /></AppLayout>
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/app/admin">
              {() => (
                <ProtectedRoute>
                  <AppLayout><AdminControlPanel /></AppLayout>
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/app">{() => <ProtectedRoute requireSubscription><NewAppShell><NewHome /></NewAppShell></ProtectedRoute>}</Route>
            <Route path="/app/legacy">{() => <ProtectedRoute requireSubscription><AppLayout><Dashboard /></AppLayout></ProtectedRoute>}</Route>
            <Route path="/app/settings">{() => <ProtectedRoute requireSubscription><AppLayout><SettingsProfile /></AppLayout></ProtectedRoute>}</Route>
            <Route path="/app/ai">{() => <ProtectedRoute requireSubscription><NewAppShell><ComingSoon page="AI Tools" /></NewAppShell></ProtectedRoute>}</Route>

            {/* Redirects for consolidated pages */}
            <Route path="/app/analytics">{() => <ProtectedRoute requireSubscription><NewAppShell><NewAnalytics /></NewAppShell></ProtectedRoute>}</Route>
            <Route path="/app/products">{() => <ProtectedRoute requireSubscription><NewAppShell><NewProducts /></NewAppShell></ProtectedRoute>}</Route>
            {/* Removed from nav — kept as redirects so old bookmarks land on Products */}
            <Route path="/app/niches">{() => { window.location.replace('/app/products'); return null; }}</Route>
            <Route path="/app/radar">{() => { window.location.replace('/app/products'); return null; }}</Route>
            <Route path="/app/trend-signals">{() => { window.location.replace('/app/intelligence'); return null; }}</Route>
            <Route path="/app/winning-products">{() => { window.location.replace('/app/intelligence'); return null; }}</Route>
            {/* Both routes render WebsiteGenerator — ToolPage handles both via location check */}
            <Route path="/app/product-discovery">{() => { window.location.replace('/app/intelligence'); return null; }}</Route>
            <Route path="/app/market">{() => { window.location.replace('/app/products'); return null; }}</Route>
            <Route path="/app/market-legacy">{() => <ProtectedRoute requireSubscription><AppLayout><MarketDashboard /></AppLayout></ProtectedRoute>}</Route>
            <Route path="/app/market-intel">{() => { window.location.replace('/app/market'); return null; }}</Route>
            <Route path="/app/market-dashboard">{() => { window.location.replace('/app/market'); return null; }}</Route>
            <Route path="/app/creators">{() => <ProtectedRoute requireSubscription><AppLayout><NewCreators /></AppLayout></ProtectedRoute>}</Route>
            <Route path="/app/creators-legacy">{() => <ProtectedRoute requireSubscription><AppLayout><ErrorBoundary><CreatorIntelligence /></ErrorBoundary></AppLayout></ProtectedRoute>}</Route>
            <Route path="/app/videos">{() => <ProtectedRoute requireSubscription><AppLayout><VideoIntelligence /></AppLayout></ProtectedRoute>}</Route>
            <Route path="/app/meta-ads">{() => { window.location.replace('/app/growth'); return null; }}</Route>
            <Route path="/app/copywriter">{() => { window.location.replace('/app/growth'); return null; }}</Route>
            <Route path="/app/brand-dna">{() => { window.location.replace('/app/growth'); return null; }}</Route>
            <Route path="/app/suppliers">{() => { window.location.replace('/app/profit'); return null; }}</Route>
            <Route path="/app/profit-calculator">{() => { window.location.replace('/app/profit'); return null; }}</Route>
            <Route path="/app/profit-check">{() => { window.location.replace('/app/profit'); return null; }}</Route>

            {/* New consolidated routes */}
            <Route path="/app/intelligence">{() => { window.location.replace('/app/products'); return null; }}</Route>
            <Route path="/app/alerts">{() => <ProtectedRoute requireSubscription><NewAppShell><NewAlerts /></NewAppShell></ProtectedRoute>}</Route>
            <Route path="/app/alerts-legacy">{() => <ProtectedRoute requireSubscription><AppLayout><Alerts /></AppLayout></ProtectedRoute>}</Route>
            <Route path="/app/spy">{() => <ProtectedRoute requireSubscription><NewAppShell><ComingSoon page="Competitor Spy" /></NewAppShell></ProtectedRoute>}</Route>
            <Route path="/app/spy-legacy">{() => <ProtectedRoute requireSubscription><AppLayout><SpyTools /></AppLayout></ProtectedRoute>}</Route>
            <Route path="/app/growth">{() => <ProtectedRoute requireSubscription><AppLayout><GrowthTools /></AppLayout></ProtectedRoute>}</Route>
            <Route path="/app/profit">{() => <ProtectedRoute requireSubscription><AppLayout><ProfitCalculator /></AppLayout></ProtectedRoute>}</Route>

            <Route path="/app/shops/:id">
              {() => (
                <ProtectedRoute requireSubscription>
                  <AppLayout>
                    <Suspense fallback={<LoadingFallback />}>
                      <ShopDetail />
                    </Suspense>
                  </AppLayout>
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/app/store/:subpage">
              {() => (
                <ProtectedRoute requireSubscription>
                  <AppLayout><Dashboard /></AppLayout>
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/app/product-hub/:id">
              {() => (
                <ProtectedRoute requireSubscription>
                  <AppLayout><Dashboard /></AppLayout>
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/app/product-search">
              {() => (
                <ProtectedRoute requireSubscription>
                  <AppLayout><ProductSearch /></AppLayout>
                </ProtectedRoute>
              )}
            </Route>
            
            {/* ── Sidebar route aliases — must come before catch-all ─────────────── */}
            <Route path="/app/product-intelligence">{() => { window.location.replace('/app/products'); return null; }}</Route>
            <Route path="/app/video-intelligence">{() => { window.location.replace('/app/videos'); return null; }}</Route>
            <Route path="/app/video-intel">{() => { window.location.replace('/app/videos'); return null; }}</Route>
            <Route path="/app/spy-tools">{() => { window.location.replace('/app/spy'); return null; }}</Route>
            <Route path="/app/shop-spy">{() => { window.location.replace('/app/spy'); return null; }}</Route>
            <Route path="/app/shop-intelligence">{() => { window.location.replace('/app/spy'); return null; }}</Route>
            <Route path="/app/store-intelligence">{() => { window.location.replace('/app/spy'); return null; }}</Route>
            <Route path="/app/store-builder">{() => <ProtectedRoute requireSubscription><AppLayout><StoreBuilder /></AppLayout></ProtectedRoute>}</Route>
            <Route path="/app/growth-tools">{() => { window.location.replace('/app/growth'); return null; }}</Route>
            <Route path="/app/livestream">{() => { window.location.replace('/app/videos'); return null; }}</Route>
            <Route path="/app/live">{() => { window.location.replace('/app/videos'); return null; }}</Route>
            <Route path="/app/ads">{() => { window.location.replace('/app/ad-spy'); return null; }}</Route>
            <Route path="/app/creator-intel">{() => { window.location.replace('/app/creators'); return null; }}</Route>
            <Route path="/app/academy">{() => { window.location.replace('/app/learn'); return null; }}</Route>
            <Route path="/app/maya">{() => { window.location.replace('/app/ai-chat'); return null; }}</Route>
            <Route path="/app/home">{() => { window.location.replace('/app/dashboard'); return null; }}</Route>
            <Route path="/app/maya-ai">{() => { window.location.replace('/app/ai-chat'); return null; }}</Route>
            <Route path="/app/profit-calc">{() => { window.location.replace('/app/profit'); return null; }}</Route>
            <Route path="/app/intelligence/database">{() => { window.location.replace('/app/intelligence'); return null; }}</Route>
            <Route path="/app/ai-chat">{() => <ProtectedRoute requireSubscription><AppLayout><AIChat /></AppLayout></ProtectedRoute>}</Route>
            <Route path="/app/revenue">{() => <ProtectedRoute requireSubscription><NewAppShell><NewRevenue /></NewAppShell></ProtectedRoute>}</Route>
            <Route path="/app/revenue-legacy">{() => <ProtectedRoute requireSubscription><AppLayout><RevenuePage /></AppLayout></ProtectedRoute>}</Route>
            <Route path="/app/:tool">
              {() => (
                <ProtectedRoute requireSubscription>
                  <AppLayout><Dashboard /></AppLayout>
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/store-health" component={StoreHealthScore} />
            <Route path="/dropshipping-australia" component={DropshippingAustralia} />
            <Route path="/tiktok-shop-australia" component={TikTokShopAustralia} />
            <Route path="/winning-products-australia" component={WinningProductsAustralia} />
            <Route path="/report/:slug" component={SharedReport} />
            <Route path="/product/:slug" component={ProductReport} />
            <Route path="/demo-dashboard" component={PromoDashboard} />
            <Route path="/privacy">{() => <LegalPage title="Privacy Policy" slug="privacy" />}</Route>
            <Route path="/terms">{() => <LegalPage title="Terms of Service" slug="terms" />}</Route>
            <Route path="/cookies">{() => <LegalPage title="Cookie Policy" slug="cookie-policy" />}</Route>
            <Route path="/refund-policy">{() => <LegalPage title="Refund Policy" slug="refund-policy" />}</Route>
            <Route path="/refunds">{() => <LegalPage title="Refund Policy" slug="refund-policy" />}</Route>
            <Route path="/contact">{() => <Contact />}</Route>
            <Route path="/404" component={NotFound} />
            <Route component={NotFound} />
          </Switch>
      </div>
    </Suspense>
    </RouteErrorBoundary>
    </>
  );
}

function LegalPage({ title, slug }: { title: string; slug: string }) {
  const content: Record<string, string[]> = {
    privacy: [
      'Majorka Pty Ltd ("Majorka", "we", "us", "our") is committed to protecting your personal information in accordance with the Australian Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs).',
      'We collect personal information including your name, email address, billing details, usage data, and product research activity. This information is collected when you create an account, purchase a subscription, or interact with our platform.',
      'We use your information to: provide and improve the Majorka platform; process payments via Stripe; send product updates and marketing communications (with your consent); analyse platform usage via PostHog session recording and analytics; comply with legal obligations; and prevent fraud.',
      'Third-party processors: We share limited data with trusted service providers necessary to operate the platform. These include Stripe (payments, PCI-DSS compliant, USA), Supabase (database hosting, Australia/USA), Vercel (hosting infrastructure, USA), PostHog (product analytics, EU/USA), and Anthropic (AI processing, USA). Each provider is contractually bound to handle your data in accordance with applicable privacy laws.',
      'Data retention: We retain your account data for as long as your account is active, plus 7 years for financial records as required by Australian law. You may request deletion of non-financial data at any time.',
      'International data transfers: Some of our processors store data outside Australia. Where data is transferred internationally, we ensure adequate protections are in place consistent with the APPs.',
      'Your rights: You have the right to access, correct, or request deletion of your personal data. You may also withdraw marketing consent at any time. To exercise these rights, email privacy@majorka.io.',
      'Cookies: We use essential cookies (authentication, session management), analytics cookies (PostHog), and preference cookies (theme, region). You can opt out of analytics cookies via your browser settings or our cookie preferences.',
      'Data security: We implement industry-standard security including TLS encryption in transit, AES-256 encryption at rest, access controls, and regular security audits.',
      'Data breach notification: In the event of an eligible data breach affecting your information, we will notify you and the OAIC as required by the Notifiable Data Breaches scheme.',
      'Questions or complaints: Contact us at privacy@majorka.io. If you are not satisfied with our response, you may lodge a complaint with the Office of the Australian Information Commissioner (oaic.gov.au).',
      'Last updated: March 2026. This policy may be updated — we will notify you of material changes via email.',
    ],
    terms: [
      'These Terms of Service ("Terms") form a legally binding agreement between you ("User") and Majorka Pty Ltd ("Majorka"), Gold Coast, QLD, Australia. By creating an account or using the platform at majorka.io, you agree to these Terms.',
      'Services: Majorka provides an AI-powered ecommerce intelligence and product research platform for dropshippers. We reserve the right to modify, suspend, or discontinue features at any time with reasonable notice.',
      'Eligibility: You must be 18 years or older and have legal capacity to enter contracts in your jurisdiction. By registering, you confirm you meet these requirements.',
      'Acceptable use: You agree not to: reverse engineer, scrape, or resell access to Majorka; use the platform for illegal purposes; share account credentials; generate content that violates third-party rights; or attempt to circumvent our access controls or paywalls.',
      'Subscriptions and billing: Subscriptions are billed monthly in AUD via Stripe. Your subscription renews automatically unless cancelled before the renewal date. Prices may change with 30 days notice. You are responsible for all charges on your account.',
      'AI-generated content: Majorka uses AI to generate product insights, ad copy, trend analysis, and other content. This content is provided for informational purposes only. We do not guarantee specific business outcomes, revenue, or profits from using AI-generated recommendations.',
      'Intellectual property: Majorka and its underlying technology, data, and design are owned by Majorka Pty Ltd. AI-generated outputs created using our platform are provided to you for your business use. You retain ownership of data you upload to the platform.',
      'Limitation of liability: To the maximum extent permitted by law, Majorka is not liable for indirect, incidental, or consequential damages. Our total liability to you in any month shall not exceed the subscription fees paid in that month.',
      'Australian Consumer Law: Nothing in these Terms limits your rights under the Competition and Consumer Act 2010 (Cth) or Australian Consumer Law. These statutory rights apply regardless of any other provision in these Terms.',
      'Account termination: We may suspend or terminate your account for breach of these Terms, non-payment, or abuse of the platform. You may cancel your account at any time via account settings. Termination does not entitle you to a refund except as provided in our Refund Policy.',
      'Dispute resolution: For disputes, please contact hello@majorka.io first. We commit to responding within 5 business days. If unresolved, disputes are governed by the laws of Queensland, Australia, and subject to the exclusive jurisdiction of Queensland courts.',
      'Privacy: Our Privacy Policy forms part of these Terms and governs how we handle your personal information.',
      'Updates: We may update these Terms. Material changes will be communicated via email with 14 days notice. Continued use after the notice period constitutes acceptance.',
      'Contact: Majorka Pty Ltd · Gold Coast, QLD, Australia · hello@majorka.io',
    ],
    'cookie-policy': [
      'Majorka uses cookies and similar technologies to provide, protect, and improve our service.',
      'Essential cookies: Required for core functionality — authentication, session management, security, and remembering your preferences. These cannot be disabled without affecting platform functionality.',
      'Analytics cookies: We use PostHog to understand how users interact with our platform. This data is used to improve features and user experience. PostHog data is pseudonymised and stored in the EU. You may opt out via your browser settings or by emailing privacy@majorka.io.',
      'Preference cookies: We store your theme preference (light/dark), selected region, and display settings to provide a consistent experience.',
      'We do not use advertising cookies, tracking pixels, or sell cookie data to third parties.',
      'Cookie consent: By continuing to use Majorka, you consent to our use of essential cookies. For analytics cookies, you consent by not opting out via browser settings.',
      'Managing cookies: You can control and delete cookies via your browser settings. Note that disabling essential cookies will affect platform functionality.',
      'For questions about our cookie practices, contact privacy@majorka.io.',
    ],
    'refund-policy': [
      'Majorka offers a 14-day money-back guarantee on your first subscription payment. If you are not satisfied with our platform for any reason within the first 14 days, we will refund your payment in full — no questions asked.',
      'To request a refund: Email hello@majorka.io within 14 days of your first charge. Include your account email address and the payment reference number (from your Stripe receipt). We will process your refund within 2 business days.',
      'Refunds are credited to your original payment method within 5-10 business days depending on your bank or card issuer.',
      'After the 14-day guarantee period: Subscription fees for subsequent billing periods are non-refundable, except where required by Australian Consumer Law. We do not offer pro-rata refunds for partial months.',
      'Exceptions: If you experience a verified technical issue that prevented you from using the platform during your subscription period, contact us promptly. We will investigate and issue a credit or refund at our discretion.',
      'Annual subscriptions (if applicable): Annual plans include a 30-day money-back guarantee from the date of purchase.',
      'Chargebacks: If you initiate a chargeback rather than contacting us first, your account will be suspended pending resolution. We always prefer to resolve disputes directly.',
      'Australian Consumer Law: This refund policy does not limit any rights you have under the Australian Consumer Law, including rights relating to major failures or goods/services not as described.',
      'To request a refund or for billing questions, contact hello@majorka.io.',
    ],
  };
    const paragraphs = content[slug] || [];
  // Set page title
  useEffect(() => {
    const prev = document.title;
    document.title = `${title} — Majorka`;
    return () => { document.title = prev; };
  }, [title]);
  return (
    <div style={{ minHeight: '100vh', background: '#05070F', color: '#F8FAFC', fontFamily: 'DM Sans, sans-serif', padding: '80px 24px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <a href="/" style={{ color: 'var(--color-accent)', fontSize: 13, textDecoration: 'none', display: 'inline-block', marginBottom: 32 }}>← Back to Majorka</a>
        <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 36, fontWeight: 800, marginBottom: 8, color: '#F8FAFC' }}>{title}</h1>
        <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 48 }}>Last updated: March 2026 · Majorka Pty Ltd · Gold Coast, QLD, Australia</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {paragraphs.map((p, i) => (
            <p key={i} style={{ fontSize: 15, lineHeight: 1.8, color: '#94A3B8', borderLeft: '2px solid rgba(99,102,241,0.2)', paddingLeft: 20 }}>{p}</p>
          ))}
        </div>
        <div style={{ marginTop: 60, padding: '24px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 12 }}>
          <p style={{ fontSize: 14, color: '#94A3B8' }}>Questions? Email us at <a href="mailto:hello@majorka.io" style={{ color: 'var(--color-accent)' }}>hello@majorka.io</a></p>
          <div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap' as const }}>
            {[['Privacy Policy', '/privacy'], ['Terms of Service', '/terms'], ['Refund Policy', '/refund-policy'], ['Cookie Policy', '/cookies']].map(([label, href]) => (
              <a key={href} href={href} style={{ fontSize: 12, color: '#9CA3AF', textDecoration: 'none' }}>{label}</a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    capture('app_loaded');
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) localStorage.setItem('majorka_ref', ref);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        document.dispatchEvent(new CustomEvent('close-modal'));
        setCmdOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  return (
    <ErrorBoundary fallback={<div style={{minHeight:'100vh',background:'#05070F',color:'#f87171',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,padding:32,fontFamily:'monospace'}}><h2 style={{margin:0,color:'#f87171'}}>App Error</h2><p id="app-err-msg" style={{margin:0,fontSize:13,color:'#fca5a5',textAlign:'center',maxWidth:600}}>Check browser console for details</p><button onClick={()=>window.location.reload()} style={{padding:'8px 20px',background:'var(--color-accent)',color:'white',border:'none',borderRadius:8,cursor:'pointer',fontSize:14}}>Reload</button></div>}>
      <div className="aurora-bg" aria-hidden="true"><div className="aurora-blob-3" /></div>
      <ThemeProvider defaultTheme="dark" switchable={false}>
        <AuthProvider>
          <MarketProvider>
            <RegionProvider>
            <ProductProvider>
              <MayaProvider>
                <TooltipProvider>
                  <Toaster />
                  <OAuthErrorBanner />
                  <AlmostWonModal />
                  {cmdOpen && <CommandPalette onClose={() => setCmdOpen(false)} />}
                  <Router />
                </TooltipProvider>
              </MayaProvider>
            </ProductProvider>
            </RegionProvider>
          </MarketProvider>
        </AuthProvider>
      </ThemeProvider>
      <CookieBanner />
    </ErrorBoundary>
  );
}

export default App;
