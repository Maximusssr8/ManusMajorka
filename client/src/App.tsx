import { AnimatePresence, motion } from 'framer-motion';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import { Toaster } from '@/components/ui/sonner';
import AlmostWonModal from '@/components/AlmostWonModal';
import { TooltipProvider } from '@/components/ui/tooltip';
import { capture } from '@/lib/posthog';
import ErrorBoundary from './components/ErrorBoundary';
import CookieBanner from './components/CookieBanner';
import { ProtectedRoute } from './components/ProtectedRoute';
import MajorkaAppShell from './components/MajorkaAppShell';
import { AuthProvider } from './contexts/AuthContext';
import { MarketProvider } from './contexts/MarketContext';
import { ProductProvider } from './contexts/ProductContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { MayaProvider } from './context/MayaContext';
import { RegionProvider } from './context/RegionContext';

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
const AdSpy = lazy(() => import('./pages/AdSpy'));
const AdsStudio = lazy(() => import('./pages/AdsStudio'));
const ProfitCalculator = lazy(() => import('./pages/ProfitCalculator'));
const GrowthTools = lazy(() => import('./pages/GrowthTools'));
const SpyTools = lazy(() => import('./pages/SpyTools'));
const MarketDashboard = lazy(() => import('./pages/MarketDashboard'));
const CreatorIntelligence = lazy(() => import('./pages/CreatorIntelligence'));
const VideoIntelligence = lazy(() => import('./pages/VideoIntelligence'));
const ProductIntelligence = lazy(() => import('./pages/ProductIntelligence'));
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
const AIChat = lazy(() => import('./pages/AIChat'));
// SEO landing pages
const DropshippingAustralia = lazy(() => import('./pages/seo/DropshippingAustralia'));
const TikTokShopAustralia = lazy(() => import('./pages/seo/TikTokShopAustralia'));
const WinningProductsAustralia = lazy(() => import('./pages/seo/WinningProductsAustralia'));

function LoadingFallback() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#FAFAFA' }}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-lg animate-pulse"
          style={{
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            color: '#FAFAFA',
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
                background: '#6366F1',
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
    background: #6366F1; z-index: 99999;
    animation: loadingBar 0.5s ease forwards;
    pointer-events: none;
  }
  @keyframes loadingBar {
    0% { width: 0%; opacity: 1; }
    60% { width: 80%; opacity: 1; }
    100% { width: 100%; opacity: 0; }
  }
`;

// Wraps any app page with the persistent sidebar shell
function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <MajorkaAppShell>
      {children}
    </MajorkaAppShell>
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
                  <AppLayout><KnowledgeBase /></AppLayout>
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/app/ad-spy">{() => <ProtectedRoute><AppLayout><AdSpy /></AppLayout></ProtectedRoute>}</Route>
            <Route path="/app/ads-studio">{() => <ProtectedRoute><AppLayout><AdsStudio /></AppLayout></ProtectedRoute>}</Route>
            <Route path="/app/learn">
              {() => (
                <ProtectedRoute>
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
            <Route path="/app">
              {() => (
                <ProtectedRoute>
                  <AppLayout><Dashboard /></AppLayout>
                </ProtectedRoute>
              )}
            </Route>
            <Route path="/app/settings">{() => <ProtectedRoute><AppLayout><SettingsProfile /></AppLayout></ProtectedRoute>}</Route>

            {/* Redirects for consolidated pages */}
            <Route path="/app/trend-signals">{() => { window.location.replace('/app/intelligence'); return null; }}</Route>
            <Route path="/app/winning-products">{() => { window.location.replace('/app/intelligence'); return null; }}</Route>
            {/* Both routes render WebsiteGenerator — ToolPage handles both via location check */}
            <Route path="/app/product-discovery">{() => { window.location.replace('/app/intelligence'); return null; }}</Route>
            <Route path="/app/market">{() => <ProtectedRoute><AppLayout><MarketDashboard /></AppLayout></ProtectedRoute>}</Route>
            <Route path="/app/market-intel">{() => { window.location.replace('/app/market'); return null; }}</Route>
            <Route path="/app/market-dashboard">{() => { window.location.replace('/app/market'); return null; }}</Route>
            <Route path="/app/creators">{() => <ProtectedRoute><AppLayout><CreatorIntelligence /></AppLayout></ProtectedRoute>}</Route>
            <Route path="/app/videos">{() => <ProtectedRoute><AppLayout><VideoIntelligence /></AppLayout></ProtectedRoute>}</Route>
            <Route path="/app/meta-ads">{() => { window.location.replace('/app/growth'); return null; }}</Route>
            <Route path="/app/copywriter">{() => { window.location.replace('/app/growth'); return null; }}</Route>
            <Route path="/app/brand-dna">{() => { window.location.replace('/app/growth'); return null; }}</Route>
            <Route path="/app/suppliers">{() => { window.location.replace('/app/profit'); return null; }}</Route>
            <Route path="/app/profit-calculator">{() => { window.location.replace('/app/profit'); return null; }}</Route>
            <Route path="/app/profit-check">{() => { window.location.replace('/app/profit'); return null; }}</Route>

            {/* New consolidated routes */}
            <Route path="/app/intelligence">{() => <ProtectedRoute><AppLayout><ProductIntelligence /></AppLayout></ProtectedRoute>}</Route>
            <Route path="/app/alerts">{() => <ProtectedRoute><AppLayout><Alerts /></AppLayout></ProtectedRoute>}</Route>
            <Route path="/app/spy">{() => <ProtectedRoute><AppLayout><SpyTools /></AppLayout></ProtectedRoute>}</Route>
            <Route path="/app/growth">{() => <ProtectedRoute><AppLayout><GrowthTools /></AppLayout></ProtectedRoute>}</Route>
            <Route path="/app/profit">{() => <ProtectedRoute><AppLayout><ProfitCalculator /></AppLayout></ProtectedRoute>}</Route>

            <Route path="/app/shops/:id">
              {() => (
                <ProtectedRoute>
                  <Suspense fallback={<LoadingFallback />}>
                    <ShopDetail />
                  </Suspense>
                </ProtectedRoute>
              )}
            </Route>
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
            <Route path="/app/product-search">
              {() => (
                <ProtectedRoute>
                  <ProductSearch />
                </ProtectedRoute>
              )}
            </Route>
            
            {/* ── Sidebar route aliases — must come before catch-all ─────────────── */}
            <Route path="/app/product-intelligence">{() => { window.location.replace('/app/intelligence'); return null; }}</Route>
            <Route path="/app/video-intelligence">{() => { window.location.replace('/app/videos'); return null; }}</Route>
            <Route path="/app/video-intel">{() => { window.location.replace('/app/videos'); return null; }}</Route>
            <Route path="/app/spy-tools">{() => { window.location.replace('/app/spy'); return null; }}</Route>
            <Route path="/app/shop-spy">{() => { window.location.replace('/app/spy'); return null; }}</Route>
            <Route path="/app/shop-intelligence">{() => { window.location.replace('/app/spy'); return null; }}</Route>
            <Route path="/app/store-intelligence">{() => { window.location.replace('/app/spy'); return null; }}</Route>
            <Route path="/app/store-builder">{() => <ProtectedRoute><AppLayout><StoreBuilder /></AppLayout></ProtectedRoute>}</Route>
            <Route path="/app/growth-tools">{() => { window.location.replace('/app/growth'); return null; }}</Route>
            <Route path="/app/livestream">{() => { window.location.replace('/app/videos'); return null; }}</Route>
            <Route path="/app/live">{() => { window.location.replace('/app/videos'); return null; }}</Route>
            <Route path="/app/ads">{() => { window.location.replace('/app/ad-spy'); return null; }}</Route>
            <Route path="/app/creator-intel">{() => { window.location.replace('/app/creators'); return null; }}</Route>
            <Route path="/app/academy">{() => { window.location.replace('/app/learn'); return null; }}</Route>
            <Route path="/app/intelligence/database">{() => { window.location.replace('/app/intelligence'); return null; }}</Route>
            <Route path="/app/ai-chat">{() => <ProtectedRoute><AppLayout><AIChat /></AppLayout></ProtectedRoute>}</Route>
            <Route path="/app/:tool">
              {() => (
                <ProtectedRoute>
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
    <div style={{ minHeight: '100vh', background: '#FAFAFA', color: '#0A0A0A', fontFamily: 'DM Sans, sans-serif', padding: '80px 24px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <a href="/" style={{ color: '#6366F1', fontSize: 13, textDecoration: 'none', display: 'inline-block', marginBottom: 32 }}>← Back to Majorka</a>
        <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 36, fontWeight: 800, marginBottom: 8, color: '#0A0A0A' }}>{title}</h1>
        <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 48 }}>Last updated: March 2026 · Majorka Pty Ltd · Gold Coast, QLD, Australia</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {paragraphs.map((p, i) => (
            <p key={i} style={{ fontSize: 15, lineHeight: 1.8, color: '#6B7280', borderLeft: '2px solid rgba(99,102,241,0.2)', paddingLeft: 20 }}>{p}</p>
          ))}
        </div>
        <div style={{ marginTop: 60, padding: '24px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 12 }}>
          <p style={{ fontSize: 14, color: '#6B7280' }}>Questions? Email us at <a href="mailto:hello@majorka.io" style={{ color: '#6366F1' }}>hello@majorka.io</a></p>
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
      <ThemeProvider defaultTheme="light" switchable={false}>
        <AuthProvider>
          <MarketProvider>
            <RegionProvider>
            <ProductProvider>
              <MayaProvider>
                <TooltipProvider>
                  <Toaster />
                  <AlmostWonModal />
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
