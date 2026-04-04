import { HeroDemo } from '@/components/landing/HeroDemo';
import { useIsMobile } from '@/hooks/useIsMobile';
import { motion } from 'framer-motion';
import {
  BarChart2,
  BarChart3,
  DollarSign,
  Eye,
  Megaphone,
  Package,
  Search,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { Link } from 'wouter';
import { SEO } from '@/components/SEO';
// SocialProofTicker removed — felt cheap/spammy

// ── Animation variants ────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1 },
};

// ── Global styles ─────────────────────────────────────────────────────────────
const GLOBAL_STYLES = `
@keyframes pulse-ring { 0% { transform: scale(0.9); opacity: 0.6; } 50% { transform: scale(1.05); opacity: 1; } 100% { transform: scale(0.9); opacity: 0.6; } }
@keyframes live-dot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
@keyframes float-cta { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes termBlink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }

.gold-text {
  background: linear-gradient(135deg, #6366F1, #A5B4FC, #6366F1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.particle-grid {
  background-image: radial-gradient(circle, rgba(99,102,241,0.08) 1px, transparent 1px);
  background-size: 32px 32px;
}
.social-icon-btn {
  display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: 8px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: #6B7280; text-decoration: none; font-size: 14px; font-weight: 700;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
}
.social-icon-btn:hover { border-color: rgba(99,102,241,0.35); color: #6366F1; background: rgba(99,102,241,0.06); }
.feature-big:hover { border-color: rgba(99,102,241,0.25) !important; transform: translateY(-3px); }

/* Nav: hamburger always in DOM, CSS shows/hides — no JS hydration delay */
.nav-hamburger { display: none; align-items: center; justify-content: center; background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.7); padding: 6px; border-radius: 6px; }
.nav-desktop-only { display: flex; }
@media (max-width: 768px) {
  .nav-hamburger { display: flex !important; }
  .nav-desktop-only { display: none !important; }
}

@media (max-width: 768px) {
  .hide-mobile   { display: none !important; }
  .stack-mobile  { flex-direction: column !important; align-items: stretch !important; }
  .stack-mobile > * { width: 100% !important; min-width: 0 !important; text-align: center !important; justify-content: center !important; }
  .grid-1-mobile { grid-template-columns: 1fr !important; }
  .grid-2-mobile { grid-template-columns: 1fr 1fr !important; }
  .px-4-mobile   { padding-left: 16px !important; padding-right: 16px !important; }
  .text-center-mobile { text-align: center !important; }
  /* Hero section */
  .hero-section  { padding: 80px 16px 60px !important; min-height: auto !important; }
  /* Hero CTA: full width */
  .hero-section .hero-cta-primary { display: flex !important; width: 100% !important; box-sizing: border-box !important; }
  /* Hero animation wrapper: show on mobile but no float animation */
  .hero-widget   { animation: none !important; width: 100% !important; flex: 0 0 auto !important; }
  /* Nav: compact on mobile */
  .nav-inner     { height: 64px !important; padding: 0 24px !important; }
  /* Weekly winners: show only first 2 cards */
  .weekly-card:nth-child(n+3) { display: none !important; }
  /* Weekly form: stack vertically */
  .weekly-form   { flex-direction: column !important; }
  .weekly-form > * { flex: none !important; width: 100% !important; box-sizing: border-box !important; }
  /* Floating CTA */
  .floating-cta-bar { padding: 12px 16px !important; }
  /* Stats bar */
  .stats-section { padding: 40px 16px !important; }
  /* Urgency strip items */
  .urgency-item  { font-size: 11px !important; }
  /* Section horizontal padding */
  section { padding-left: 16px !important; padding-right: 16px !important; }
  /* Hero CTA buttons stack */
  .hero-cta-row { flex-direction: column !important; gap: 12px !important; }
  .hero-cta-row > * { width: 100% !important; text-align: center !important; }
  /* Feature cards mobile fix */
  .feature-big { padding: 24px 16px !important; }
  /* Bento grid mobile */
  .bento-grid { grid-template-columns: 1fr !important; }
  .bento-grid > * { grid-column: auto !important; grid-row: auto !important; }
  /* How it works mobile */
  .hiw-steps { flex-direction: column !important; align-items: center !important; }
  .hiw-steps > * { max-width: 320px !important; }
  /* Demo spy grid mobile */
  .spy-grid { grid-template-columns: 1fr !important; }
  /* Footer grid mobile */
  .footer-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)) !important; gap: 16px !important; }
}
@media (min-width: 769px) { .hide-desktop { display: none !important; } }
`;

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: '#040609',
  card: '#0B0F1E',
  elevated: '#111827',
  border: 'rgba(255,255,255,0.08)',
  borderHover: 'rgba(99,102,241,0.35)',
  text: '#F8FAFC',
  secondary: 'rgba(255,255,255,0.55)',
  muted: 'rgba(255,255,255,0.3)',
  gold: '#6366F1',
  goldLight: '#A5B4FC',
  goldDim: 'rgba(99,102,241,0.1)',
  goldBorder: 'rgba(99,102,241,0.25)',
  green: '#22C55E',
  red: '#EF4444',
};

const syne = "'Bricolage Grotesque', sans-serif";
const dm = "'DM Sans', sans-serif";

// ── Data ──────────────────────────────────────────────────────────────────────

const STATS_BASE = [
  { key: 'sellers', end: 500, suffix: '+', prefix: '', label: 'Active Sellers', icon: Users, live: true, tickEvery: 30000, tickBy: 1 },
  { key: 'markets', end: 7, suffix: '', prefix: '', label: 'Markets Supported', icon: DollarSign, live: false, display: (_n: number) => '7' },
  { key: 'joiners', end: 47, suffix: ' this week', prefix: '', label: 'New Joiners', icon: Package, live: true, tickEvery: 60000, tickBy: 1 },
  { key: 'rating', end: 4.9, suffix: '★', prefix: '', label: 'Average Rating', icon: BarChart2, live: false, display: () => '4.9★' },
];

const BIG_FEATURES = [
  {
    Icon: Search,
    title: 'Find winning products in seconds',
    sub: 'Not months of research',
    desc: 'AI scans global marketplaces for product demand signals. Get scored opportunities with margin data, competition index, and supplier matches — in under 10 seconds.',
    accent: '#3b82f6',
    stat: '127K+ products analysed',
  },
  {
    Icon: BarChart2,
    title: 'Validate margins before you spend a cent',
    sub: 'Real numbers, your currency',
    desc: 'Enter your buy price, sell price, and market. Maya calculates net margin, break-even CPA, and ad budget — with shipping, tax, and platform fees built in.',
    accent: '#6366F1',
    stat: '98% market accuracy',
  },
  {
    Icon: Zap,
    title: 'Generate ad campaigns ready to run',
    sub: 'Copy, creative angles, everything',
    desc: 'Get 5 Facebook/TikTok ad variations with hooks, body copy, and creative direction — written for your market, ready to upload to Ads Manager.',
    accent: '#22c55e',
    stat: '5 ad angles per product',
  },
  {
    Icon: Users,
    title: 'Spy on competitors before they spy on you',
    sub: 'Full competitive intelligence',
    desc: 'See exactly what products any dropshipping store is running, their ad spend signals, price changes, and top-selling SKUs. Enter a domain, get the full playbook.',
    accent: '#8B5CF6',
    stat: '50K+ stores tracked',
  },
  {
    Icon: DollarSign,
    title: 'Know your margins before you spend a cent',
    sub: 'Region-native profit calculator',
    desc: 'Full cost stack: supplier price, shipping rates, Shopify fees, tax, and ad CPA. Enter your numbers, get your real take-home margin — with break-even ROAS built in.',
    accent: '#6366F1',
    stat: 'Tax + shipping included',
  },
  {
    Icon: Package,
    title: 'Built for your market, wherever you sell',
    sub: '7 regions, one platform',
    desc: 'Local pricing, shipping rates, supplier networks, tax compliance, and consumer trends — adapted for AU, US, UK, CA, NZ, DE, and SG. Pick your market and go.',
    accent: '#22c55e',
    stat: '7 markets supported',
  },
];

// Testimonials — hidden until real customer quotes are collected
// TODO: Replace testimonials with real user quotes before paid traffic
const TESTIMONIALS_SHOW: { quote: string; name: string; city: string; flag: string; plan: string; stars: number }[] = [];

const FAQ = [
  { q: 'Which markets does Majorka support?', a: 'Majorka supports 7 markets: US, Australia, UK, Canada, New Zealand, Germany, and Singapore. Select your region and every tool adapts — currency, shipping carriers, tax rates, compliance, and local payment methods.' },
  { q: 'What makes this different from other AI tools?', a: 'Majorka is region-native. It supports multi-currency pricing, local shipping carriers, tax compliance, and payment methods (Afterpay, Klarna, Zip, Stripe) across 7 markets. No more converting currencies or adapting generic advice.' },
  { q: 'Can I cancel anytime?', a: 'Yes, absolutely. No lock-in contracts. Cancel from your dashboard anytime. You retain access until the end of your billing period.' },
  { q: 'Do you support Shopify?', a: 'Yes. Website Generator exports production-ready Shopify Liquid theme files as a ZIP. All landing pages include trust signals, local payment badges, and mobile-optimised layouts ready for your store.' },
  { q: 'Is there a money-back guarantee?', a: 'Yes. All paid plans include a 14-day money-back guarantee — no questions asked. Cancel anytime from your dashboard.' },
];

const LOGO_STRIP = ['Shopify', 'AliExpress', 'Meta', 'Google', 'TikTok', 'DHL', 'Stripe', 'Klarna', 'Afterpay', 'Amazon', 'Canva'];

// ── Sub-components ────────────────────────────────────────────────────────────

function StatsBar() {
  const isMobile = useIsMobile();
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.15 });
  const [liveValues, setLiveValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(STATS_BASE.map((s) => [s.key, s.end]))
  );

  useEffect(() => {
    const intervals: ReturnType<typeof setInterval>[] = [];
    STATS_BASE.forEach((stat) => {
      if (!stat.live || !stat.tickBy || !stat.tickEvery) return;
      const id = setInterval(() => {
        setLiveValues((prev) => ({ ...prev, [stat.key]: (prev[stat.key] ?? stat.end) + stat.tickBy! }));
      }, stat.tickEvery + Math.random() * 5000);
      intervals.push(id);
    });
    return () => intervals.forEach(clearInterval);
  }, []);

  const formatValue = (stat: (typeof STATS_BASE)[0], val: number) => {
    if (stat.display) return stat.display(val);
    if (stat.key === 'sellers') return `${val.toLocaleString()}${stat.suffix}`;
    if (stat.key === 'joiners') return `${val}${stat.suffix}`;
    return `${stat.prefix}${val.toLocaleString()}${stat.suffix}`;
  };

  return (
    <section ref={ref as React.RefCallback<HTMLElement>} style={{ background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: isMobile ? '40px 16px' : '64px 24px', overflowX: 'hidden' }}>
      <div className="grid-2-mobile" style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 12 : 24, textAlign: 'center' }}>
        {STATS_BASE.map((stat, i) => {
          const Icon = stat.icon;
          const currentVal = liveValues[stat.key] ?? stat.end;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }} transition={{ delay: i * 0.1, duration: 0.5, ease: 'easeOut' }} style={{ padding: '16px 8px', position: 'relative' }}>
              {i < STATS_BASE.length - 1 && <div style={{ position: 'absolute', right: 0, top: '20%', bottom: '20%', width: 1, background: 'rgba(255,255,255,0.08)' }} className="hide-mobile" />}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 10, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', margin: '0 auto 12px', position: 'relative' }}>
                <Icon size={18} color={C.gold} />
                {stat.live && <div style={{ position: 'absolute', top: -3, right: -3, width: 8, height: 8, borderRadius: '50%', background: C.green, animation: 'pulse-ring 2s ease-in-out infinite' }} />}
              </div>
              <div style={{ fontFamily: syne, fontWeight: 800, fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', color: C.gold, lineHeight: 1.1, marginBottom: 6 }}>
                {inView ? (
                  <motion.span key={currentVal} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    {formatValue(stat, currentVal)}
                  </motion.span>
                ) : <span>{formatValue(stat, stat.end)}</span>}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 500, letterSpacing: '0.02em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                {stat.live && inView && <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.green, display: 'inline-block', animation: 'pulse-ring 2s ease-in-out infinite', flexShrink: 0 }} />}
                {stat.label}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', flexDirection: isMobile ? 'column' as const : 'row' as const, padding: '20px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', minHeight: 48 }}>
        <span style={{ fontFamily: syne, fontWeight: 700, fontSize: 16, color: '#F8FAFC', paddingRight: 16 }}>{q}</span>
        <span style={{ color: '#6366F1', fontSize: 22, fontWeight: 300, flexShrink: 0, transform: open ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.25s' }}>+</span>
      </button>
      <div style={{ maxHeight: open ? 300 : 0, opacity: open ? 1 : 0, transition: 'max-height 0.35s ease, opacity 0.25s ease', overflow: 'hidden' }}>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, paddingBottom: 20 }}>{a}</p>
      </div>
    </div>
  );
}

function EmailCapture() {
  const isMobile = useIsMobile();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, name: name || undefined, source: 'landing-guide' }) });
      const data = await res.json();
      if (res.ok && data.success) { setStatus('success'); }
      else { setStatus('error'); setErrMsg(data.error || 'Something went wrong. Try again.'); }
    } catch { setStatus('error'); setErrMsg('Network error. Check your connection.'); }
  };

  if (status === 'success') {
    return (
      <div style={{ background: C.card, border: `1px solid ${C.goldBorder}`, borderRadius: 20, padding: isMobile ? '32px 16px' : '48px 32px', textAlign: 'center', maxWidth: 560, margin: '0 auto' }}>
        <div style={{ fontSize: isMobile ? 30 : 48, marginBottom: 16 }}>✅</div>
        <h3 style={{ fontFamily: syne, fontWeight: 800, fontSize: 22, color: C.text, marginBottom: 12 }}>You're in! Check your inbox.</h3>
        <p style={{ color: C.secondary, fontSize: 15, lineHeight: 1.6 }}>While you wait, <Link href="/app" style={{ color: C.gold, textDecoration: 'underline' }}>go to the app →</Link></p>
      </div>
    );
  }

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: isMobile ? '32px 16px' : '48px 32px', maxWidth: 560, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: C.goldDim, border: `1px solid ${C.goldBorder}`, borderRadius: 100, padding: '5px 14px', marginBottom: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.gold }}>FREE PRODUCT GUIDE</span>
        </div>
        <h3 style={{ fontFamily: syne, fontWeight: 800, fontSize: 22, color: C.text, marginBottom: 8 }}>Get the Product Research Playbook</h3>
        <p style={{ color: C.secondary, fontSize: 14, lineHeight: 1.6 }}>How top sellers find $10K/mo products + weekly trending product alerts. Free, no spam.</p>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input type="text" placeholder="First name (optional)" value={name} onChange={(e) => setName(e.target.value)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px 16px', color: 'white', fontSize: 14, fontFamily: dm, outline: 'none', minHeight: 48 }} />
        <input type="email" autoComplete="email" placeholder="Your email address" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px 16px', color: 'white', fontSize: 14, fontFamily: dm, outline: 'none', minHeight: 48 }} />
        <button type="submit" disabled={status === 'loading'} style={{ background: `linear-gradient(135deg, ${C.gold}, #4F46E5)`, color: '#fff', borderRadius: 10, padding: '14px 20px', fontFamily: syne, fontWeight: 800, fontSize: 15, border: 'none', cursor: status === 'loading' ? 'wait' : 'pointer', opacity: status === 'loading' ? 0.7 : 1, transition: 'opacity 0.2s', minHeight: 48 }}>
          {status === 'loading' ? 'Sending...' : 'Send Me the Guide'}
        </button>
        {status === 'error' && <p style={{ color: C.red, fontSize: 13, textAlign: 'center' }}>{errMsg}</p>}
        <p style={{ fontSize: 11, color: C.muted, textAlign: 'center' }}>Unsubscribe anytime. We respect your privacy.</p>
      </form>
    </div>
  );
}

// ── Weekly Winners Email Capture ──────────────────────────────────────────────

const WEEKLY_PRODUCTS = [
  { name: 'Ninja Creami 7-in-1', revenue: 'View details →', badge: '🔥', blur: 0 },
  { name: 'Heatless Curl Kit',   revenue: 'View details →', badge: '📈', blur: 1 },
  { name: 'Pet Hair Remover',    revenue: 'View details →', badge: '🚀', blur: 3 },
  { name: 'Posture Corrector',   revenue: 'View details →', badge: '⚡', blur: 6 },
  { name: 'LED Face Mask Pro',   revenue: 'View details →', badge: '🔥', blur: 10 },
];

function WeeklyWinnersSection() {
  const isMobile = useIsMobile();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, source: 'weekly-winners' }) });
      const data = await res.json();
      if (res.ok && data.success) { setStatus('success'); }
      else { setStatus('error'); setErrMsg(data.error || 'Something went wrong. Try again.'); }
    } catch { setStatus('error'); setErrMsg('Network error. Check your connection.'); }
  };

  return (
    <section style={{ background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: '72px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: C.goldDim, border: `1px solid ${C.goldBorder}`, borderRadius: 100, padding: '5px 14px', marginBottom: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.gold, fontFamily: syne }}>📬 FREE EVERY MONDAY</span>
          </div>
          <h2 style={{ fontFamily: syne, fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 2.6rem)', letterSpacing: '-0.025em', color: C.text, marginBottom: 10 }}>
            Get This Week's Top 5 Winning Products — <span className="gold-text">Free Forever</span>
          </h2>
          <p style={{ fontSize: 15, color: C.secondary, maxWidth: 500, margin: '0 auto' }}>
            Real products. Real opportunities. Before your competitors find them.
          </p>
        </div>

        {/* Blurred product preview row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 40, overflowX: 'auto', paddingBottom: 8 }}>
          {WEEKLY_PRODUCTS.map((prod, i) => {
            const overlayOpacity = i === 0 ? 0 : Math.min(0.1 + i * 0.12, 0.7);
            return (
              <div
                key={i}
                className="weekly-card"
                style={{
                  flex: '1 1 160px',
                  minWidth: 150,
                  background: C.elevated,
                  border: `1px solid ${i === 0 ? C.goldBorder : C.border}`,
                  borderRadius: 14,
                  padding: '16px 14px',
                  position: 'relative',
                  overflow: 'hidden',
                  filter: prod.blur > 0 ? `blur(${prod.blur}px)` : 'none',
                  userSelect: prod.blur > 0 ? 'none' : 'auto',
                  pointerEvents: prod.blur > 0 ? 'none' : 'auto',
                }}
              >
                {overlayOpacity > 0 && (
                  <div style={{ position: 'absolute', inset: 0, background: `rgba(4,6,9,${overlayOpacity})`, borderRadius: 14, zIndex: 1 }} />
                )}
                <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', flexDirection: isMobile ? 'column' as const : 'row' as const, marginBottom: 8 }}>
                  <span style={{ fontSize: 16 }}>{prod.badge}</span>
                  {i === 0 && <span style={{ fontSize: 10, fontWeight: 700, background: C.goldDim, color: C.gold, border: `1px solid ${C.goldBorder}`, borderRadius: 6, padding: '2px 6px', fontFamily: syne }}>#{i + 1}</span>}
                </div>
                <div style={{ fontFamily: syne, fontWeight: 800, fontSize: 13, color: C.text, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {prod.name}
                </div>
                <div style={{ fontFamily: syne, fontWeight: 800, fontSize: 13, color: C.gold }}>{prod.revenue}</div>
              </div>
            );
          })}
        </div>

        {/* Form */}
        {status === 'success' ? (
          <div style={{ textAlign: 'center', padding: '28px 24px', background: C.elevated, border: `1px solid ${C.goldBorder}`, borderRadius: 16, maxWidth: 600, margin: '0 auto' }}>
            <div style={{ fontSize: isMobile ? 26 : 40, marginBottom: 12 }}>🎉</div>
            <h3 style={{ fontFamily: syne, fontWeight: 800, fontSize: 20, color: C.text, marginBottom: 8 }}>You're in! Check your inbox.</h3>
            <p style={{ color: C.secondary, fontSize: 14 }}>First report arrives Monday. We'll also send one now so you know what to expect.</p>
          </div>
        ) : (
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <form onSubmit={handleSubmit} className="weekly-form" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <input
                type="email"
                placeholder="your@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ flex: '1 1 260px', background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(255,255,255,0.12)`, borderRadius: 12, padding: '14px 18px', color: 'white', fontSize: 15, fontFamily: dm, outline: 'none', minHeight: 52 }}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                style={{ flex: '0 0 auto', background: `linear-gradient(135deg, ${C.gold}, #4F46E5)`, color: '#fff', borderRadius: 12, padding: '14px 28px', fontFamily: syne, fontWeight: 800, fontSize: 15, border: 'none', cursor: status === 'loading' ? 'wait' : 'pointer', opacity: status === 'loading' ? 0.7 : 1, whiteSpace: 'nowrap', minHeight: 52 }}
              >
                {status === 'loading' ? 'Sending...' : 'Get Free Weekly Report →'}
              </button>
            </form>
            {status === 'error' && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 8, textAlign: 'center' }}>{errMsg}</p>}
            <p style={{ fontSize: 13, color: C.secondary, textAlign: 'center', marginTop: 12, lineHeight: 1.6 }}>
              Every Monday: 5 curated products with AI margin scores, supplier links, and trend data.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 10, flexWrap: 'wrap' }}>
              {['✓ No spam', '✓ Unsubscribe anytime', '✓ 2,847 subscribers'].map((t) => (
                <span key={t} style={{ fontSize: 12, color: C.muted }}>{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}


// ── Floating CTA ──────────────────────────────────────────────────────────────

function FloatingCTA() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('floatingCTADismissed')) { setDismissed(true); return; }
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const dismiss = () => { setDismissed(true); sessionStorage.setItem('floatingCTADismissed', '1'); };

  if (dismissed || !visible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 999,
      background: 'rgba(8,10,14,0.95)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderTop: '1px solid rgba(99,102,241,0.3)',
      padding: '14px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      animation: 'float-cta 0.4s ease-out',
    }} className="floating-cta-bar">
      <span style={{ fontSize: 14, fontWeight: 600, color: C.text, flex: 1 }}>
        <span className="hide-mobile">Join 500+ sellers worldwide · Find your first winner →</span>
        <span className="hide-desktop">Find your winner →</span>
      </span>
      <Link href="/sign-in" style={{ background: `linear-gradient(135deg, ${C.gold}, #4F46E5)`, color: '#fff', borderRadius: 10, padding: '10px 22px', fontFamily: syne, fontWeight: 800, fontSize: 14, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
        Get Started
      </Link>
      <button onClick={dismiss} style={{ background: 'none', border: 'none', color: C.secondary, cursor: 'pointer', fontSize: 18, flexShrink: 0, padding: '4px 6px' }}>×</button>
    </div>
  );
}

// ── Bento Features ────────────────────────────────────────────────────────────
const BENTO_CARDS = [
  {
    key: 'A', Icon: TrendingUp, title: 'Product Intelligence',
    desc: 'Discover the exact products trending in your market right now. Supplier links, margin data, and competitor analysis — updated daily.',
    gridColumn: '1 / 3', gridRow: '1 / 2',
  },
  {
    key: 'B', Icon: Zap, title: 'AI Store Builder',
    desc: 'Describe your niche. Majorka builds your entire Shopify store in 60 seconds — theme, products, copy, everything.',
    gridColumn: '3 / 4', gridRow: '1 / 3',
  },
  {
    key: 'C', Icon: Eye, title: 'Competitor Spy',
    desc: "See exactly which ads your rivals are running, what products they push, and how their stores are converting.",
    gridColumn: '1 / 2', gridRow: '2 / 3',
  },
  {
    key: 'D', Icon: BarChart3, title: 'Market Intelligence',
    desc: 'AI-powered market research. Know what is selling, where demand is spiking, and which niches are about to blow up.',
    gridColumn: '2 / 3', gridRow: '2 / 3',
  },
  {
    key: 'E', Icon: DollarSign, title: 'Profit Calculator',
    desc: 'Enter your product cost and ad spend, get exact margins, ROAS targets, and break-even CPA — before you spend a dollar.',
    gridColumn: '1 / 2', gridRow: '3 / 4',
  },
  {
    key: 'F', title: 'Local Market Data',
    desc: 'Every signal, trend, and supplier link is filtered for your market. Pick your region and get local opportunities.',
    gridColumn: '2 / 3', gridRow: '3 / 4',
  },
  {
    key: 'G', Icon: Megaphone, title: 'Ad Intelligence',
    desc: 'Find winning ad creatives across Meta and TikTok. See spend estimates, engagement, and hook formulas that convert.',
    gridColumn: '3 / 4', gridRow: '3 / 4',
  },
];

function BentoFeaturesSection() {
  const isMobile = useIsMobile();
  const gridRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [buildStep, setBuildStep] = useState(0);
  const brico = "'Bricolage Grotesque', sans-serif";
  const mono = "'Geist Mono','Fira Code',monospace";

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.08 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Animate build steps when section visible
  useEffect(() => {
    if (!visible) return;
    const t = setInterval(() => setBuildStep(p => p < 4 ? p + 1 : 0), 1400);
    return () => clearInterval(t);
  }, [visible]);

  const accent = '#6366F1';
  const card = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    background: '#111318',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 18,
    padding: isMobile ? 20 : 28,
    cursor: 'default',
    transition: 'border-color 220ms, box-shadow 220ms, transform 220ms',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    ...extra,
  });

  const hoverCard = (id: string): React.CSSProperties =>
    hoveredCard === id ? { borderColor: 'rgba(99,102,241,0.5)', boxShadow: '0 0 0 1px rgba(99,102,241,0.2), 0 20px 60px rgba(0,0,0,0.5)', transform: 'translateY(-2px)' } : {};

  const PRODUCTS = [
    { name: 'Posture Corrector Pro', rev: '$41.2k/mo', score: 94, trend: '+340%' },
    { name: 'LED Strip Lights RGB',  rev: '$18.5k/mo', score: 81, trend: '+128%' },
    { name: 'Air Fryer 11-in-1',     rev: '$24.1k/mo', score: 78, trend: '+67%'  },
    { name: 'Bamboo Desk Set',       rev: '$11.9k/mo', score: 71, trend: '+44%'  },
  ];

  const BUILD_STEPS = [
    { done: true,  active: false, text: 'Niche identified: Pet accessories' },
    { done: true,  active: false, text: 'Shopify store created' },
    { done: true,  active: false, text: 'Hero product imported' },
    { done: false, active: true,  text: 'Generating product descriptions...' },
    { done: false, active: false, text: 'Setting up payment gateway' },
    { done: false, active: false, text: 'Publishing store' },
  ];

  const MARKET_BARS = [
    { label: 'Pet Accessories', val: 87, color: '#6366F1' },
    { label: 'Home & Garden',   val: 74, color: '#8B5CF6' },
    { label: 'Health & Wellness', val: 91, color: '#06B6D4' },
    { label: 'Kitchen & Cook', val: 62, color: '#6366F1' },
  ];

  const SPY_ADS = [
    { platform: 'TikTok', days: 47, spend: '$312/day', hook: '"I fixed my posture in 2 weeks—"' },
    { platform: 'Meta',   days: 23, spend: '$187/day', hook: '"My wife threw out our old ones"' },
  ];

  const FEATURES = [
    { id: 'A', col: isMobile ? '1 / -1' : '1 / 2', row: '1 / 2' },
    { id: 'B', col: isMobile ? '1 / -1' : '2 / 4', row: '1 / 2' },
    { id: 'C', col: isMobile ? '1 / -1' : '1 / 2', row: '2 / 3' },
    { id: 'D', col: isMobile ? '1 / -1' : '2 / 3', row: '2 / 3' },
    { id: 'E', col: isMobile ? '1 / -1' : '3 / 4', row: '2 / 3' },
    { id: 'F', col: isMobile ? '1 / -1' : '1 / 2', row: '3 / 4' },
    { id: 'G', col: isMobile ? '1 / -1' : '2 / 4', row: '3 / 4' },
  ];

  const staggerStyle = (i: number): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(20px)',
    transition: `opacity 500ms ease ${i * 70}ms, transform 500ms ease ${i * 70}ms`,
  });

  return (
    <section id="features" style={{ padding: isMobile ? '64px 0' : '100px 0', background: '#080A0F', position: 'relative', overflow: 'hidden' }}>
      {/* Subtle grid bg */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none' }} />
      {/* Glow orbs */}
      <div style={{ position: 'absolute', top: '10%', left: '5%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 64 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 999, padding: '4px 14px', marginBottom: 16, fontSize: 11, fontWeight: 700, color: '#818CF8', letterSpacing: '0.08em' }}>
            PLATFORM
          </div>
          <h2 style={{ fontFamily: brico, fontWeight: 800, fontSize: 'clamp(28px,5vw,48px)', color: '#F8FAFC', letterSpacing: '-0.02em', marginBottom: 12 }}>Every tool. One platform.</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', maxWidth: 520, margin: '0 auto' }}>Product research · Store builder · Competitor spy · Profit calculator · Creator intel — without switching tabs.</p>
        </div>

        {/* Bento Grid */}
        <div ref={gridRef} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: isMobile ? 12 : 16 }}>

          {/* ── A: Product Intelligence ── */}
          <div style={{ ...card(), ...staggerStyle(0), ...hoverCard('A'), gridColumn: FEATURES[0].col, gridRow: FEATURES[0].row }}
            onMouseEnter={() => setHoveredCard('A')} onMouseLeave={() => setHoveredCard(null)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 12L6 7l3 4 2-3 3 4" stroke="#6366F1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', letterSpacing: '0.08em' }}>PRODUCT INTELLIGENCE</span>
            </div>
            <h3 style={{ fontFamily: brico, fontSize: 18, fontWeight: 800, color: '#F8FAFC', marginBottom: 6, letterSpacing: '-0.01em' }}>Find winners before anyone else</h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 16, lineHeight: 1.6 }}>AI-estimated margin data, trend signals, and supplier links — refreshed regularly.</p>
            {/* Mini product table */}
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 36px', gap: 0, padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['PRODUCT','REVENUE',''].map(h => <span key={h} style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}>{h}</span>)}
              </div>
              {PRODUCTS.map((p, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 36px', gap: 0, padding: '9px 12px', borderBottom: i < PRODUCTS.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none', background: i === 0 ? 'rgba(99,102,241,0.06)' : 'transparent' }}>
                  <span style={{ fontSize: 12, color: i === 0 ? '#E0E7FF' : 'rgba(255,255,255,0.6)', fontWeight: i === 0 ? 600 : 400, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                  <span style={{ fontSize: 12, color: '#4ADE80', fontFamily: mono, fontWeight: 600 }}>{p.rev}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: i === 0 ? '#818CF8' : 'rgba(255,255,255,0.4)', textAlign: 'right' as const, fontFamily: mono }}>{p.score}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', animation: 'pulse-ring 2s ease-in-out infinite' }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: mono }}>AI-estimated data · not guaranteed · Refreshed regularly</span>
            </div>
          </div>

          {/* ── B: AI Store Builder ── */}
          <div style={{ ...card(), ...staggerStyle(1), ...hoverCard('B'), gridColumn: FEATURES[1].col, gridRow: FEATURES[1].row }}
            onMouseEnter={() => setHoveredCard('B')} onMouseLeave={() => setHoveredCard(null)}>
            <div style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(99,102,241,0.9)', color: 'white', fontSize: 9, fontWeight: 800, padding: '4px 10px', borderRadius: 999, letterSpacing: '0.08em', backdropFilter: 'blur(4px)' }}>
              60 SECONDS ⚡
            </div>
            <div style={{ display: 'flex', gap: isMobile ? 0 : 28, flexDirection: isMobile ? 'column' as const : 'row' as const }}>
              {/* Left */}
              <div style={{ flex: '0 0 auto', maxWidth: isMobile ? '100%' : '48%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3h10v2H3V3zm0 4h10v6H3V7zm2 2v2h6V9H5z" fill="#8B5CF6"/></svg>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#8B5CF6', letterSpacing: '0.08em' }}>AI STORE BUILDER</span>
                </div>
                <h3 style={{ fontFamily: brico, fontSize: 18, fontWeight: 800, color: '#F8FAFC', marginBottom: 6, letterSpacing: '-0.01em' }}>Store live in 60 seconds</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>Describe your niche. AI builds your entire Shopify store — theme, products, copy, payments.</p>
              </div>
              {/* Right — build checklist */}
              <div style={{ flex: 1, marginTop: isMobile ? 16 : 0 }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {BUILD_STEPS.slice(0, Math.min(buildStep + 2, BUILD_STEPS.length)).map((step, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', opacity: i <= buildStep ? 1 : 0.3, transition: 'opacity 0.4s' }}>
                      <span style={{ fontSize: 11, flexShrink: 0, color: step.done && i < buildStep ? '#4ADE80' : step.active && i === buildStep ? '#FBBF24' : 'rgba(255,255,255,0.25)' }}>
                        {step.done && i < buildStep ? '✓' : step.active && i === buildStep ? '◉' : '○'}
                      </span>
                      <span style={{ fontSize: 12, color: step.active && i === buildStep ? '#F8FAFC' : step.done && i < buildStep ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)', fontFamily: i === buildStep ? mono : 'inherit' }}>{step.text}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 10 }}>
                    <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 999 }}>
                      <div style={{ height: '100%', width: `${Math.round((Math.min(buildStep, BUILD_STEPS.length - 1) / BUILD_STEPS.length) * 100)}%`, background: 'linear-gradient(90deg, #6366F1, #8B5CF6)', borderRadius: 999, transition: 'width 0.8s ease' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── C: Competitor Spy ── */}
          <div style={{ ...card(), ...staggerStyle(2), ...hoverCard('C'), gridColumn: FEATURES[2].col, gridRow: FEATURES[2].row }}
            onMouseEnter={() => setHoveredCard('C')} onMouseLeave={() => setHoveredCard(null)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4" stroke="#06B6D4" strokeWidth="1.8"/><path d="M10.5 10.5L14 14" stroke="#06B6D4" strokeWidth="1.8" strokeLinecap="round"/></svg>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#06B6D4', letterSpacing: '0.08em' }}>COMPETITOR SPY</span>
            </div>
            <h3 style={{ fontFamily: brico, fontSize: 17, fontWeight: 800, color: '#F8FAFC', marginBottom: 6, letterSpacing: '-0.01em' }}>See exactly what rivals run</h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 14, lineHeight: 1.5 }}>Winning ads, top products, and spend estimates.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SPY_ADS.map((ad, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: i === 0 ? '#FF6B6B' : '#1DA1F2', letterSpacing: '0.06em' }}>{ad.platform}</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: mono }}>{ad.days}d · {ad.spend}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>{ad.hook}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── D: Market Intelligence ── */}
          <div style={{ ...card(), ...staggerStyle(3), ...hoverCard('D'), gridColumn: FEATURES[3].col, gridRow: FEATURES[3].row }}
            onMouseEnter={() => setHoveredCard('D')} onMouseLeave={() => setHoveredCard(null)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 10l3-4 3 3 3-5 3 2" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', letterSpacing: '0.08em' }}>MARKET INTEL</span>
            </div>
            <h3 style={{ fontFamily: brico, fontSize: 17, fontWeight: 800, color: '#F8FAFC', marginBottom: 12, letterSpacing: '-0.01em' }}>Know what's about to blow up</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {MARKET_BARS.map((b, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{b.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#F8FAFC', fontFamily: mono }}>{b.val}</span>
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 999 }}>
                    <div style={{ height: '100%', width: visible ? `${b.val}%` : '0%', background: b.color, borderRadius: 999, transition: `width 1s ease ${i * 150}ms` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── E: Profit Calculator ── */}
          <div style={{ ...card(), ...staggerStyle(4), ...hoverCard('E'), gridColumn: FEATURES[4].col, gridRow: FEATURES[4].row }}
            onMouseEnter={() => setHoveredCard('E')} onMouseLeave={() => setHoveredCard(null)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M4 6h8M4 10h8" stroke="#4ADE80" strokeWidth="1.8" strokeLinecap="round"/></svg>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#4ADE80', letterSpacing: '0.08em' }}>PROFIT CALC</span>
            </div>
            <h3 style={{ fontFamily: brico, fontSize: 17, fontWeight: 800, color: '#F8FAFC', marginBottom: 10, letterSpacing: '-0.01em' }}>Know your numbers cold</h3>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.06)' }}>
              {[['Sell price','$49.95'],['COGS','$12.00'],['Ad spend','$8.50'],['Net profit','$29.45']].map(([k,v],i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{k}</span>
                  <span style={{ fontSize: 12, fontWeight: i === 3 ? 800 : 600, color: i === 3 ? '#4ADE80' : 'rgba(255,255,255,0.7)', fontFamily: mono }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── F: Creator Intel ── */}
          <div style={{ ...card(), ...staggerStyle(5), ...hoverCard('F'), gridColumn: FEATURES[5].col, gridRow: FEATURES[5].row }}
            onMouseEnter={() => setHoveredCard('F')} onMouseLeave={() => setHoveredCard(null)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke="#EC4899" strokeWidth="1.8"/><path d="M2 14c0-3 2.7-5 6-5s6 2 6 5" stroke="#EC4899" strokeWidth="1.8" strokeLinecap="round"/></svg>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#EC4899', letterSpacing: '0.08em' }}>CREATOR INTEL</span>
            </div>
            <h3 style={{ fontFamily: brico, fontSize: 17, fontWeight: 800, color: '#F8FAFC', marginBottom: 6, letterSpacing: '-0.01em' }}>Find your next collab</h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>Browse creators by niche, GMV, and engagement. Contact info included.</p>
          </div>

          {/* ── G: Ad Intelligence ── */}
          <div style={{ ...card({ background: 'linear-gradient(135deg, #0D0F1A 0%, #1A1040 100%)' }), ...staggerStyle(6), ...hoverCard('G'), gridColumn: FEATURES[6].col, gridRow: FEATURES[6].row }}
            onMouseEnter={() => setHoveredCard('G')} onMouseLeave={() => setHoveredCard(null)}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h2l2-5 2 10 2-6 2 3h2" stroke="#A78BFA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#A78BFA', letterSpacing: '0.08em' }}>AD INTELLIGENCE</span>
                </div>
                <h3 style={{ fontFamily: brico, fontSize: 18, fontWeight: 800, color: '#F8FAFC', marginBottom: 6, letterSpacing: '-0.01em' }}>Steal winning ad formulas</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: 300 }}>Browse live ads across Meta and TikTok. See spend estimates, engagement, and the exact hooks that convert.</p>
              </div>
              {!isMobile && (
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[['Meta','47d','$312/d','#1877F2'],['TikTok','23d','$187/d','#FF0050'],['Google','61d','$445/d','#4285F4']].map(([p,d,s,col]) => (
                    <div key={p} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '8px 12px', border: '1px solid rgba(255,255,255,0.08)', minWidth: 140 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: col }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em' }}>{p}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: mono }}>{d}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#F8FAFC', fontFamily: mono }}>{s}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}


function HowItWorksSection() {
  const isMobile = useIsMobile();
  const brico = "'Bricolage Grotesque', sans-serif";

  return (
    <section style={{ background: C.bg, padding: '100px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 999, padding: '4px 14px', marginBottom: 16, fontSize: 12, fontWeight: 700, color: '#818CF8', letterSpacing: '0.06em' }}>
            THE PROCESS
          </div>
          <h2 style={{ fontFamily: brico, fontWeight: 800, fontSize: 'clamp(28px,5vw,44px)', color: '#F8FAFC', letterSpacing: '-0.02em' }}>
            Zero to first sale.{" "}
            <span style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Faster than you think.
            </span>
          </h2>
        </div>

        <div className="grid-1-mobile" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? 12 : 24 }}>
          {[
            {
              num: '01', Icon: Search, color: '#6366F1',
              title: 'Find a winning product',
              desc: 'AI scans 50k+ products for demand signals. See AI-estimated revenue data, supplier links, and trend signals — in seconds.',
              stat: { label: 'Products analysed', value: '50,000+' },
              tag: 'Included',
            },
            {
              num: '02', Icon: Zap, color: '#8B5CF6',
              title: 'Build your store in 60s',
              desc: 'Type your niche. Majorka generates a complete Shopify store — theme, product copy, images, and shipping settings.',
              stat: { label: 'Avg build time', value: '54 seconds' },
              tag: 'AI-powered',
            },
            {
              num: '03', Icon: TrendingUp, color: '#10B981',
              title: 'Launch, spy & scale',
              desc: 'Use Spy Tools to monitor competitor ads. Track profit with the calculator. Scale what works, cut what does not.',
              stat: { label: '14-day guarantee', value: 'Included' },
              tag: 'Results',
            },
          ].map((step, i) => {
            const StepIcon = step.Icon;
            return (
              <div key={i}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '32px', position: 'relative', overflow: 'hidden', cursor: 'default', transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.5)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {/* Ghost number */}
                <div style={{ position: 'absolute', top: -8, right: 16, fontSize: 80, fontWeight: 800, color: 'rgba(255,255,255,0.04)', lineHeight: 1, userSelect: 'none' as const, zIndex: 0 }}>{step.num}</div>
                {/* Icon */}
                <div style={{ width: 52, height: 52, borderRadius: 14, background: `rgba(99,102,241,0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, position: 'relative', zIndex: 1 }}>
                  <StepIcon size={24} color={step.color} />
                </div>
                {/* Tag */}
                <div style={{ display: 'inline-flex', fontSize: 10, fontWeight: 700, color: step.color, background: `${step.color}15`, padding: '3px 10px', borderRadius: 999, letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 14, position: 'relative', zIndex: 1 }}>{step.tag}</div>
                <h3 style={{ fontFamily: brico, fontWeight: 700, fontSize: 19, color: '#F8FAFC', marginBottom: 10, position: 'relative', zIndex: 1 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: 24, position: 'relative', zIndex: 1 }}>{step.desc}</p>
                {/* Stat */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, position: 'relative', zIndex: 1 }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 4 }}>{step.stat.label}</div>
                  <div style={{ fontFamily: brico, fontWeight: 800, fontSize: 22, color: step.color }}>{step.stat.value}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Demo Section ──────────────────────────────────────────────────────────────
const DEMO_PRODUCTS = [
  { rank: 1, product: 'Posture Corrector Pro', margin: '62%', score: 91 },
  { rank: 2, product: 'LED Strip Lights RGB', margin: '61%', score: 82 },
  { rank: 3, product: 'Air Fryer 11-in-1', margin: '58%', score: 75 },
  { rank: 4, product: 'Smart Watch GPS', margin: '44%', score: 68 },
  { rank: 5, product: 'Resistance Band Set', margin: '31%', score: 54 },
];

function getScoreStyle(score: number) {
  if (score >= 80) return { background: 'rgba(99,102,241,0.2)', color: '#A5B4FC', border: '1px solid rgba(99,102,241,0.3)' };
  if (score >= 65) return { background: 'rgba(139,92,246,0.15)', color: '#C4B5FD', border: '1px solid rgba(139,92,246,0.25)' };
  return { background: 'rgba(107,114,128,0.15)', color: '#9CA3AF', border: '1px solid rgba(107,114,128,0.2)' };
}

function DemoSection() {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<'products' | 'builder' | 'spy'>('products');
  const brico = "'Bricolage Grotesque', sans-serif";

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: 'products', label: 'Product Intelligence' },
    { key: 'builder', label: 'Store Builder' },
    { key: 'spy', label: 'Spy Tools' },
  ];

  return (
    <section style={{ background: '#0A0A0A', padding: isMobile ? '60px 16px' : '120px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: brico, fontWeight: 800, fontSize: 'clamp(24px,5vw,48px)', color: 'white' }}>Built for how you actually work</h2>
          <p style={{ fontSize: isMobile ? 15 : 17, color: '#A1A1AA', maxWidth: 560, margin: '12px auto 32px' }}>From discovery to first sale — every step in Majorka.</p>
        </div>

        {/* Tab row */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
          <div style={{ display: 'inline-flex', background: '#111113', border: '1px solid #27272A', borderRadius: 10, padding: 4, flexShrink: 0 }}>
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: isMobile ? '8px 14px' : '8px 20px', borderRadius: 7, fontSize: isMobile ? 12 : 14, cursor: 'pointer', border: 'none', transition: 'all 150ms', whiteSpace: 'nowrap' as const,
                  background: activeTab === tab.key ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: activeTab === tab.key ? '#A5B4FC' : '#6B7280',
                  fontWeight: activeTab === tab.key ? 600 : 500,
                  boxShadow: 'none',
                }}
              >{tab.label}</button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ background: '#111113', border: '1px solid #27272A', borderRadius: 20, overflow: 'hidden' }}>
          {/* Tab 1: Products */}
          {activeTab === 'products' && (
            <div>
              <div style={{ background: '#0F0F11', padding: '12px 20px', borderBottom: '1px solid #1F1F23', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: 'white' }}>Product Intelligence</span>
                <span style={{ fontSize: 12, color: '#6B7280' }}>Global Markets · AI Research</span>
              </div>
              {isMobile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 4px 8px' }}>
                  {DEMO_PRODUCTS.map(row => {
                    const ss = getScoreStyle(row.score);
                    return (
                      <div key={row.rank} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#111113', borderRadius: 10, border: '1px solid #1F1F23' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#E5E7EB', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{row.product}</div>
                          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>Margin: {row.margin}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 10 }}>
                          <span style={{ ...ss, borderRadius: 5, padding: '2px 7px', fontSize: 11, fontWeight: 700 }}>{row.score}</span>
                          <button style={{ background: 'rgba(99,102,241,0.15)', color: '#A5B4FC', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 6, fontSize: 11, padding: '4px 8px', cursor: 'pointer', whiteSpace: 'nowrap' as const }}>View</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                    <thead>
                      <tr style={{ background: '#0F0F11' }}>
                        {['#', 'Product', 'Margin', 'Score', ''].map(h => (
                          <th key={h} style={{ padding: '10px 20px', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#6B7280', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {DEMO_PRODUCTS.map(row => {
                        const ss = getScoreStyle(row.score);
                        return (
                          <tr key={row.rank} style={{ borderBottom: '1px solid #1F1F23', fontSize: 13, color: '#E5E7EB' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <td style={{ padding: '12px 20px', color: '#6B7280' }}>{row.rank}</td>
                            <td style={{ padding: '12px 20px', fontWeight: 500 }}>{row.product}</td>
                            <td style={{ padding: '12px 20px' }}>{row.margin}</td>
                            <td style={{ padding: '12px 20px' }}>
                              <span style={{ ...ss, borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{row.score}</span>
                            </td>
                            <td style={{ padding: '12px 20px' }}>
                              <button style={{ background: 'rgba(99,102,241,0.15)', color: '#A5B4FC', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 6, fontSize: 11, padding: '4px 10px', cursor: 'pointer' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.25)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.15)')}
                              >Build Store</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Builder */}
          {activeTab === 'builder' && (
            <div style={{ padding: 32 }}>
              <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { done: true, text: 'Niche identified: Pet accessories' },
                  { done: true, text: 'Shopify store created' },
                  { done: true, text: 'Hero product imported (AliExpress)' },
                  { done: true, text: 'Store theme applied' },
                  { done: false, spinning: true, text: 'Generating product descriptions...' },
                  { done: false, text: 'Setting up payment gateway' },
                  { done: false, text: 'Publishing store' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: (item as any).spinning ? 'rgba(99,102,241,0.08)' : 'transparent', borderRadius: 8, border: (item as any).spinning ? '1px solid rgba(99,102,241,0.2)' : 'none' }}>
                    <span style={{ fontSize: 18, minWidth: 24, color: item.done ? '#10B981' : (item as any).spinning ? '#6366F1' : '#374151' }}>
                      {item.done ? '\u2705' : (item as any).spinning ? '\u27F3' : '\u25CB'}
                    </span>
                    <span style={{ fontSize: 14, color: item.done ? '#E5E7EB' : (item as any).spinning ? '#A5B4FC' : '#6B7280' }}>{item.text}</span>
                  </div>
                ))}
                <div style={{ marginTop: 8, padding: '0 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, color: '#6B7280' }}>
                    <span>Building store...</span><span style={{ color: '#A5B4FC' }}>65%</span>
                  </div>
                  <div style={{ height: 8, background: '#1F1F23', borderRadius: 999 }}>
                    <div style={{ height: '100%', width: '65%', background: 'linear-gradient(90deg, #6366F1, #8B5CF6)', borderRadius: 999 }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Spy Tools */}
          {activeTab === 'spy' && (
            <div style={{ padding: 24 }}>
              <div className="spy-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                {[
                  { platform: 'Meta Ad', product: 'Neck Massager Pro', spend: '~$2,400/day' },
                  { platform: 'TikTok Ad', product: 'LED Ring Light Kit', spend: '~$1,800/day' },
                  { platform: 'Meta Ad', product: 'Posture Corrector Band', spend: '~$3,100/day' },
                  { platform: 'TikTok Ad', product: 'Wireless Earbuds Pro', spend: '~$950/day' },
                ].map((ad, i) => (
                  <div key={i} style={{ background: '#1A1A1E', border: '1px solid #27272A', borderRadius: 12, padding: 16 }}>
                    <span style={{ background: 'rgba(59,130,246,0.15)', color: '#93C5FD', fontSize: 11, padding: '3px 8px', borderRadius: 4, display: 'inline-block', marginBottom: 12 }}>
                      {'\u{1F3AF}'} {ad.platform} · Active
                    </span>
                    <div style={{ height: 120, borderRadius: 8, background: 'linear-gradient(135deg, #1F2937, #374151)', marginBottom: 12 }} />
                    <div style={{ fontWeight: 600, color: '#E5E7EB', fontSize: 14, marginBottom: 4 }}>{ad.product}</div>
                    <div style={{ fontSize: 13, color: '#22C55E', marginBottom: 12 }}>Spend: {ad.spend}</div>
                    <button style={{ background: 'transparent', color: '#A5B4FC', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 6, fontSize: 12, padding: '6px 12px', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.1)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >View Ad →</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Demo Modal ────────────────────────────────────────────────────────────────
function DemoModal({ onClose }: { onClose: () => void }) {
  const isMobile = useIsMobile();
  const [step, setStep] = useState(0);
  const [scanLine, setScanLine] = useState(0);
  const [buildLines, setBuildLines] = useState<string[]>([]);
  const [counterVal, setCounterVal] = useState(0);
  const brico = "'Bricolage Grotesque', sans-serif";

  const STEPS = [
    { label: 'Market Scan',     color: '#6366F1' },
    { label: 'Winner Found',    color: '#8B5CF6' },
    { label: 'Building Store',  color: '#0891B2' },
    { label: 'Live & Selling',  color: '#059669' },
  ];

  const BUILD_LOG = [
    '▸ Connecting to Shopify API...',
    '▸ Creating store: posture-pro.myshopify.com',
    '▸ Applying AI-generated theme...',
    '▸ Importing product from AliExpress...',
    '▸ Writing product descriptions with Claude...',
    '▸ Generating 3 hero images...',
    '▸ Setting up pricing ($49.95)...',
    '▸ Configuring Stripe + Afterpay...',
    '▸ Launching Meta ad campaign...',
    '✓ Store is live.',
  ];

  useEffect(() => {
    if (step !== 0) return;
    const t = setInterval(() => setScanLine(p => p < 4 ? p + 1 : p), 320);
    return () => clearInterval(t);
  }, [step]);

  useEffect(() => {
    if (step !== 2) { setBuildLines([]); return; }
    let i = 0;
    const t = setInterval(() => {
      i++;
      setBuildLines(BUILD_LOG.slice(0, i));
      if (i >= BUILD_LOG.length) clearInterval(t);
    }, 420);
    return () => clearInterval(t);
  }, [step]);

  useEffect(() => {
    if (step !== 3) { setCounterVal(0); return; }
    let v = 0;
    const t = setInterval(() => {
      v += 3;
      setCounterVal(v);
      if (v >= 84) clearInterval(t);
    }, 28);
    return () => clearInterval(t);
  }, [step]);

  useEffect(() => {
    const delays = [2800, 3200, 4800, 99999];
    if (step < 3) {
      const t = setTimeout(() => setStep(s => s + 1), delays[step]);
      return () => clearTimeout(t);
    }
  }, [step]);

  const SCAN_PRODUCTS = [
    { name: 'Posture Corrector Pro', score: 94, trend: '↑ 340%', winner: true },
    { name: 'LED Strip Lights RGB',  score: 81, trend: '↑ 128%', winner: false },
    { name: 'Air Fryer 11-in-1',    score: 78, trend: '→ Stable', winner: false },
    { name: 'Smart Watch GPS',       score: 72, trend: '↑ 67%',  winner: false },
    { name: 'Bamboo Desk Organiser', score: 69, trend: '↑ 44%',  winner: false },
  ];

  const stepColors = ['#6366F1', '#8B5CF6', '#0891B2', '#059669'];
  const acc = stepColors[step];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 0 : 24 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(9,9,18,0.75)', backdropFilter: 'blur(10px)' }} onClick={onClose} />

      <div style={{
        position: 'relative', background: '#FFFFFF',
        borderRadius: isMobile ? '20px 20px 0 0' : 20,
        width: '100%', maxWidth: isMobile ? '100%' : 580,
        maxHeight: isMobile ? '92vh' : '88vh',
        overflowY: 'auto',
        boxShadow: '0 40px 120px rgba(0,0,0,0.35)',
        ...(isMobile ? { position: 'fixed', bottom: 0, left: 0, right: 0 } : {}),
      }}>

        <div style={{ background: 'linear-gradient(135deg, #0F1117 0%, #1E1B4B 50%, #312E81 100%)', padding: isMobile ? '20px 20px 24px' : '24px 28px 28px', borderRadius: isMobile ? '20px 20px 0 0' : '20px 20px 0 0' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.12)', cursor: 'pointer', color: 'white', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>

          <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' as const }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{
                padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                background: i === step ? s.color : 'rgba(255,255,255,0.08)',
                color: i === step ? 'white' : 'rgba(255,255,255,0.4)',
                border: `1px solid ${i === step ? s.color : 'rgba(255,255,255,0.1)'}`,
                transition: 'all 0.3s',
                letterSpacing: '0.04em',
              }}>
                {i < step ? '✓ ' : i === step ? '● ' : ''}{s.label}
              </div>
            ))}
          </div>

          <div style={{ height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 999, marginBottom: 20 }}>
            <div style={{ height: '100%', width: `${((step + 1) / STEPS.length) * 100}%`, background: `linear-gradient(90deg, ${acc}, ${acc}cc)`, borderRadius: 999, transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)' }} />
          </div>

          <div style={{ fontFamily: brico, fontWeight: 800, fontSize: isMobile ? 20 : 24, color: 'white', marginBottom: 6 }}>
            {step === 0 && 'Scanning 50,000+ products…'}
            {step === 1 && '🏆 Winner identified'}
            {step === 2 && '⚙️ Building your store…'}
            {step === 3 && '🎉 First sale in 6 hours'}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
            {step === 0 && 'AI ranks every product by margin, demand, and market relevance'}
            {step === 1 && 'Posture Corrector Pro — 62% margin · TikTok trending · Low competition'}
            {step === 2 && 'AI writes copy, imports product, configures payments. Done in minutes.'}
            {step === 3 && 'Real customer from Sydney. $52.10 profit on the first order.'}
          </div>
        </div>

        <div style={{ padding: isMobile ? '20px' : '24px 28px 28px' }}>

          {step === 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#F5F3FF', borderRadius: 10, marginBottom: 14, border: '1px solid #DDD6FE' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366F1', animation: 'pulse-ring 1.2s ease-in-out infinite' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#6366F1', letterSpacing: '0.04em' }}>LIVE SCAN IN PROGRESS</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9CA3AF' }}>{scanLine * 10_240 + 1_280} products analysed</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {SCAN_PRODUCTS.map((p, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
                    background: p.winner ? '#F5F3FF' : '#FAFAFA',
                    borderRadius: 10,
                    border: p.winner ? '1.5px solid #C4B5FD' : '1px solid #F0F0F0',
                    opacity: i <= scanLine ? 1 : 0.25,
                    transform: i <= scanLine ? 'translateX(0)' : 'translateX(-8px)',
                    transition: `opacity 0.4s ${i * 0.1}s, transform 0.4s ${i * 0.1}s`,
                  }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', border: `2.5px solid ${p.winner ? '#6366F1' : '#E5E7EB'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: brico, fontWeight: 800, fontSize: 12, color: p.winner ? '#6366F1' : '#6B7280', flexShrink: 0 }}>
                      {p.score}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: p.winner ? '#6366F1' : '#9CA3AF', fontWeight: p.winner ? 600 : 400 }}>{p.trend}</div>
                    </div>
                    {p.winner && (
                      <span style={{ fontSize: 10, fontWeight: 800, background: '#6366F1', color: 'white', padding: '3px 9px', borderRadius: 999, letterSpacing: '0.06em', flexShrink: 0 }}>WINNER</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <div style={{ border: '1.5px solid #E5E7EB', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ background: 'linear-gradient(135deg, #EEF2FF, #F5F3FF)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 12, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>🦺</div>
                  <div>
                    <div style={{ fontFamily: brico, fontWeight: 800, fontSize: 16, color: '#0F172A', marginBottom: 2 }}>Posture Corrector Pro</div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>Health & Wellness · AliExpress · Global Shipping</div>
                  </div>
                  <div style={{ marginLeft: 'auto', textAlign: 'right' as const, flexShrink: 0 }}>
                    <div style={{ fontFamily: brico, fontWeight: 800, fontSize: 28, color: '#6366F1', lineHeight: 1 }}>94</div>
                    <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600 }}>WIN SCORE</div>
                  </div>
                </div>
                <div style={{ padding: '14px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  {[
                    { label: 'Sell Price', value: '$49.95', color: '#0F172A' },
                    { label: 'Cost', value: '$12.00', color: '#6B7280' },
                    { label: 'Margin', value: '62%', color: '#059669' },
                    { label: 'TikTok Views', value: '4.2M+', color: '#6366F1' },
                    { label: 'Competition', value: 'Low', color: '#059669' },
                    { label: 'Monthly Rev.', value: '$41k', color: '#8B5CF6', note: true },
                  ].map((s, i) => (
                    <div key={i} style={{ textAlign: 'center' as const }}>
                      <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 3 }}>{s.label}</div>
                      <div style={{ fontFamily: brico, fontWeight: 700, fontSize: 15, color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '6px 20px 10px', textAlign: 'center' as const }}>
                  <span style={{ fontSize: 10, color: '#9CA3AF', fontStyle: 'italic' }}>AI-estimated · not guaranteed</span>
                </div>
              </div>
              <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 14px', border: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 8 }}>🤖 Why It's Winning</div>
                {['Post-pandemic posture awareness driving 340% YoY search growth', 'Only 3 serious competitors in this niche — massive gap', 'TikTok organic reach still wide open for this category'].map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                    <span style={{ color: '#6366F1', fontSize: 12, marginTop: 1, flexShrink: 0 }}>▸</span>
                    <span style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={{ background: '#0D1117', borderRadius: 12, padding: '16px 18px', fontFamily: "'Geist Mono', 'Fira Code', monospace", fontSize: 12, minHeight: 200 }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                  {['#FF5F57','#FFBD2E','#28C840'].map(c => <div key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />)}
                  <span style={{ marginLeft: 8, color: '#6B7280', fontSize: 11 }}>majorka — store-builder — zsh</span>
                </div>
                {buildLines.map((line, i) => (
                  <div key={i} style={{ color: line.startsWith('✓') ? '#4ADE80' : '#94A3B8', marginBottom: 5, display: 'flex', gap: 8 }}>
                    <span style={{ color: '#6366F1', flexShrink: 0 }}>$</span>
                    <span>{line}</span>
                  </div>
                ))}
                {buildLines.length < BUILD_LOG.length && (
                  <div style={{ color: '#6366F1', animation: 'termBlink 1s step-end infinite' }}>▊</div>
                )}
              </div>
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#6B7280' }}>Store build progress</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0891B2' }}>{Math.round((buildLines.length / BUILD_LOG.length) * 100)}%</span>
                </div>
                <div style={{ height: 6, background: '#F3F4F6', borderRadius: 999 }}>
                  <div style={{ height: '100%', width: `${(buildLines.length / BUILD_LOG.length) * 100}%`, background: 'linear-gradient(90deg, #0891B2, #6366F1)', borderRadius: 999, transition: 'width 0.4s ease' }} />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div style={{ background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)', border: '1.5px solid #6EE7B7', borderRadius: 14, padding: '20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #059669, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>💸</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 4 }}>New Sale — posture-pro.myshopify.com</div>
                  <div style={{ fontFamily: brico, fontWeight: 800, fontSize: isMobile ? 26 : 32, color: '#064E3B', lineHeight: 1 }}>
                    ${counterVal.toFixed(2)} USD
                  </div>
                  <div style={{ fontSize: 12, color: '#059669', marginTop: 4 }}>Illustrative example · results vary by product &amp; market</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Profit', value: '$52.10', color: '#059669', bg: '#ECFDF5' },
                  { label: 'Margin', value: '62%',    color: '#6366F1', bg: '#EEF2FF' },
                  { label: 'Time to sale', value: '6h 14m', color: '#8B5CF6', bg: '#F5F3FF' },
                ].map((s, i) => (
                  <div key={i} style={{ background: s.bg, borderRadius: 10, padding: '14px 12px', textAlign: 'center' as const }}>
                    <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontFamily: brico, fontWeight: 800, fontSize: 17, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 5 }}>
              {STEPS.map((_, i) => (
                <div key={i} onClick={() => setStep(i)} style={{ width: i === step ? 20 : 6, height: 6, borderRadius: 999, background: i === step ? acc : '#E5E7EB', cursor: 'pointer', transition: 'all 0.3s' }} />
              ))}
            </div>
            {step < 3
              ? <button onClick={() => setStep(s => s + 1)} style={{ padding: '10px 22px', background: acc, color: 'white', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: '-0.01em', transition: 'opacity 150ms' }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')} onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}>
                  Next →
                </button>
              : <a href="/sign-up" style={{ padding: '10px 22px', background: '#059669', color: 'white', borderRadius: 9, fontSize: 14, fontWeight: 700, textDecoration: 'none', display: 'inline-block', letterSpacing: '-0.01em' }}>
                  Get Started →
                </a>
            }
          </div>
        </div>
      </div>
    </div>
  );
}


// ── Main Home ─────────────────────────────────────────────────────────────────
export default function Home() {
  const isMobile = useIsMobile();
  const [annual, setAnnual] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const pricingCardsRef = useRef<HTMLDivElement>(null);
  const [navShadow, setNavShadow] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setNavShadow(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Pricing intersection observer for stagger animation
  useEffect(() => {
    const el = pricingCardsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const cards = el.querySelectorAll<HTMLElement>('[data-pricing-card]');
          cards.forEach((card, i) => {
            setTimeout(() => {
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            }, i * 80);
          });
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: dm, overflowX: 'hidden', minHeight: '100vh' }}>
      <SEO
        title="Majorka — AI Ecommerce OS for Dropshippers"
        description="Find winning products, build Shopify stores and launch ecommerce campaigns with AI. Trusted by 500+ sellers worldwide."
        path="/"
        ogImage="/og-image.svg"
      />
      <style>{GLOBAL_STYLES}</style>
      {showDemo && <DemoModal onClose={() => setShowDemo(false)} />}

      {/* ═══ NAV ═══════════════════════════════════════════════════════════ */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(4,6,9,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: `1px solid ${C.border}`, boxShadow: navShadow ? '0 1px 16px rgba(0,0,0,0.3)' : 'none', transition: 'box-shadow 0.3s' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', userSelect: 'none', flexShrink: 0 }}>
            <img src="/majorka-logo.jpg" alt="Majorka" width={30} height={30} style={{ width: 30, height: 30, objectFit: 'contain', borderRadius: 7, flexShrink: 0, display: 'block' }} draggable={false} />
            <span style={{ fontFamily: syne, fontWeight: 800, fontSize: 16, color: '#F8FAFC', letterSpacing: '-0.02em' }}>Majorka</span>
          </a>

          <div className="nav-desktop-only" style={{ alignItems: 'center', gap: 2 }}>
            {[['https://majorka.io/#features', 'Features'], ['https://majorka.io/#pricing', 'Pricing'], ['/blog', 'Blog']].map(([href, label]) => (
              <a key={label} href={href} style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: 14, fontWeight: 500, padding: '6px 12px', borderRadius: 7, transition: 'color 120ms, background 120ms' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#F8FAFC'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.background = 'transparent'; }}>
                {label}{label === 'Blog' && <span style={{ fontSize: 9, background: 'rgba(99,102,241,0.2)', color: '#818CF8', borderRadius: 4, padding: '1px 5px', fontWeight: 700, marginLeft: 4 }}>SOON</span>}
              </a>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <Link href="/sign-in" className="nav-desktop-only" style={{ alignItems: 'center', color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: 14, fontWeight: 500, padding: '6px 12px', borderRadius: 7, transition: 'color 120ms, background 120ms' }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = '#F8FAFC'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.background = 'transparent'; }}>
              Log in
            </Link>
            <Link href="/sign-up" style={{ background: '#6366F1', color: '#fff', borderRadius: 8, padding: '8px 18px', fontWeight: 600, fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', letterSpacing: '-0.01em', whiteSpace: 'nowrap' as const }}>
              Get Started →
            </Link>
            <button
              className="nav-hamburger"
              onClick={() => setMobileMenuOpen(prev => !prev)}
              aria-label="Open menu"
            >
              {mobileMenuOpen
                ? <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M4 4L18 18M4 18L18 4" stroke="rgba(255,255,255,0.7)" strokeWidth="2.2" strokeLinecap="round"/></svg>
                : <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 6h16M3 11h16M3 16h16" stroke="rgba(255,255,255,0.7)" strokeWidth="2.2" strokeLinecap="round"/></svg>
              }
            </button>
          </div>
        </div>

        {isMobile && mobileMenuOpen && (
          <div style={{ borderTop: `1px solid ${C.border}`, background: 'rgba(4,6,9,0.97)', padding: '8px 16px 16px' }}>
            {[['https://majorka.io/#features', 'Features'], ['https://majorka.io/#pricing', 'Pricing'], ['/blog', 'Blog'], ['/sign-in', 'Log in']].map(([href, label]) => (
              <a key={label} href={href} onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 15, fontWeight: 500, padding: '12px 8px', borderBottom: `1px solid ${C.border}` }}>{label}{label === 'Blog' && <span style={{ fontSize: 9, background: 'rgba(99,102,241,0.2)', color: '#818CF8', borderRadius: 4, padding: '1px 5px', fontWeight: 700, marginLeft: 6 }}>SOON</span>}</a>
            ))}
          </div>
        )}
      </nav>

      {/* ═══ HERO ══════════════════════════════════════════════════════════ */}
      <section className="hero-section" style={{ position: 'relative', paddingTop: 120, paddingBottom: 80, textAlign: 'center', overflow: 'hidden', background: C.bg }}>
        {/* Dot grid background */}
        <div className="particle-grid" style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
        {/* Subtle ambient glow — top right corner only */}
        <div style={{ position: 'absolute', top: -100, right: -100, width: 500, height: 500, background: 'radial-gradient(circle, rgba(99,102,241,0.08), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 720, margin: '0 auto', padding: '0 24px' }}>
          {/* H1 */}
          <h1 style={{ fontFamily: syne, fontWeight: 800, fontSize: 'clamp(32px, 7vw, 72px)', lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 0', opacity: 0, animation: 'fadeInUp 0.5s ease 0.2s both', wordBreak: 'keep-all' as const, overflowWrap: 'normal' as const }}>
            <span style={{ color: '#F8FAFC' }}>Find Products That Sell.</span>
            <br />
            <span style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Build Stores That Convert.</span>
          </h1>

          {/* Subheading */}
          <p style={{ fontSize: 18, color: C.secondary, maxWidth: 520, margin: '20px auto 0', lineHeight: 1.6, fontFamily: dm, opacity: 0, animation: 'fadeInUp 0.5s ease 0.3s both' }}>
            AI-powered product research, competitor intelligence, and store building — in one platform.
          </p>

          {/* CTA row */}
          <div className="hero-cta-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 36, opacity: 0, animation: 'fadeInUp 0.5s ease 0.4s both' }}>
            <Link href="/sign-up" className="hero-cta-primary" style={{ background: '#6366F1', color: 'white', height: 52, padding: '0 32px', borderRadius: 10, fontWeight: 600, fontSize: 16, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', transition: 'background 150ms, transform 150ms' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#4F46E5'; e.currentTarget.style.transform = 'scale(1.02)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = '#6366F1'; e.currentTarget.style.transform = 'scale(1)'; }}>
              Get Started →
            </Link>
            <button
              onClick={() => setShowDemo(true)}
              style={{ position: 'relative', background: 'transparent', color: '#F8FAFC', height: 48, padding: '0 24px 0 16px', borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10, transition: 'border-color 200ms, box-shadow 200ms', letterSpacing: '-0.01em' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(99,102,241,0.10)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <span style={{ fontSize: 16 }}>🖥️</span>
              Take a Tour
            </button>
          </div>

          {/* Social proof — clean text, no fake avatars */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 24, opacity: 0, animation: 'fadeIn 0.5s ease 0.5s both' }}>
            <span style={{ fontSize: 13, color: C.secondary }}>★★★★★  500+ sellers worldwide · No contracts · Cancel anytime</span>
          </div>
        </div>

        {/* Animated hero demo — real API data, 5 panels */}
        <div id="demo" style={{ marginTop: 80, padding: '0 24px', opacity: 0, animation: 'fadeInUp 0.7s ease 0.6s both' }}>
          <HeroDemo />
        </div>
      </section>

      {/* ═══ TRUST BAR ════════════════════════════════════════════════════ */}
      <div style={{ padding: isMobile ? '28px 16px' : '48px 24px', background: C.bg }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <span style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Integrates with
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 24 : 48, flexWrap: 'wrap' }}>
            {['Shopify', 'AliExpress', 'Meta Ads', 'TikTok', 'Stripe', 'Google Ads', 'DHL'].map(name => (
              <div key={name}
                style={{ fontSize: 15, fontWeight: 700, color: '#9CA3AF', opacity: 0.5, transition: 'opacity 200ms', letterSpacing: '0', cursor: 'default', userSelect: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ STATS ═══════════════════════════════════════════════════════ */}
      <StatsBar />

      {/* ═══ FEATURES — BENTO GRID ═══════════════════════════════════════ */}
      <BentoFeaturesSection />

      {/* ═══ HOW IT WORKS ════════════════════════════════════════════════ */}
      <HowItWorksSection />

      {/* ═══ COMPARISON TABLE ════════════════════════════════════════════ */}
      <section style={{ padding: isMobile ? '48px 16px' : '80px 24px', background: C.card }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontFamily: syne, fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', letterSpacing: '-0.025em', textAlign: 'center', marginBottom: 8, color: '#F8FAFC' }}>
            Why teams switch to Majorka
          </h2>
          <p style={{ textAlign: 'center', color: C.secondary, fontSize: 15, maxWidth: 520, margin: '0 auto 32px' }}>
            One platform replaces your entire stack — at a fraction of the cost.
          </p>

          {isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { feature: 'AI Winning Product Score', majorka: true, others: false },
                { feature: 'TikTok Shop Data', majorka: true, others: 'Some' },
                { feature: 'AliExpress Supplier Match', majorka: true, others: 'Some' },
                { feature: 'Competitor Ad Spy', majorka: true, others: 'Some', note: 'Scale plan' },
                { feature: 'AI Store Builder', majorka: true, others: false },
                { feature: 'Multi-Market Optimised', majorka: true, others: false },
                { feature: 'Profit Calculator', majorka: true, others: 'Some' },
                { feature: 'Money-Back Guarantee', majorka: true, others: false },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.7)', flex: 1, paddingRight: 12 }}>{row.feature}{row.note ? <span style={{ fontSize: 11, color: C.muted, marginLeft: 6 }}>({row.note})</span> : null}</span>
                  <div style={{ display: 'flex', gap: 20, flexShrink: 0 }}>
                    <div style={{ textAlign: 'center', minWidth: 52 }}>
                      <div style={{ fontSize: 10, color: '#6366F1', fontWeight: 700, marginBottom: 2 }}>MAJORKA</div>
                      <span style={{ color: '#4ADE80', fontWeight: 800, fontSize: 16 }}>✓</span>
                    </div>
                    <div style={{ textAlign: 'center', minWidth: 52 }}>
                      <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, marginBottom: 2 }}>OTHERS</div>
                      <span style={{ color: row.others ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.2)', fontWeight: 600, fontSize: 14 }}>{row.others === 'Some' ? '~' : row.others ? '✓' : '—'}</span>
                    </div>
                  </div>
                </div>
              ))}
              <p style={{ fontSize: 11, color: C.muted, marginTop: 4, textAlign: 'right' }}>~ = some competitors only · * Scale plan</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 560 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                    <th style={{ textAlign: 'left', padding: '12px 16px', color: C.muted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Feature</th>
                    <th style={{ textAlign: 'center', padding: '12px 16px', color: '#6366F1', fontSize: 13, fontWeight: 700 }}>Majorka</th>
                    <th style={{ textAlign: 'center', padding: '12px 16px', color: C.muted, fontSize: 13, fontWeight: 600 }}>Minea</th>
                    <th style={{ textAlign: 'center', padding: '12px 16px', color: C.muted, fontSize: 13, fontWeight: 600 }}>Sell The Trend</th>
                    <th style={{ textAlign: 'center', padding: '12px 16px', color: C.muted, fontSize: 13, fontWeight: 600 }}>Manual Research</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'AI Winning Product Score', majorka: true, minea: false, stt: false, manual: false },
                    { feature: 'TikTok Shop Data', majorka: true, minea: true, stt: false, manual: false },
                    { feature: 'AliExpress Supplier Match', majorka: true, minea: false, stt: true, manual: true },
                    { feature: 'Competitor Ad Spy', majorka: true, minea: true, stt: false, manual: false, note: 'Scale plan' },
                    { feature: 'AI Store Builder', majorka: true, minea: false, stt: false, manual: false },
                    { feature: 'Multi-Market Optimised', majorka: true, minea: false, stt: false, manual: false },
                    { feature: 'Profit Calculator', majorka: true, minea: false, stt: true, manual: true },
                    { feature: 'Money-Back Guarantee', majorka: true, minea: false, stt: false, manual: true },
                  ].map((row: { feature: string; majorka: boolean; minea: boolean; stt: boolean; manual: boolean; note?: string }, i) => (
                    <tr key={row.feature} style={{ borderBottom: `1px solid rgba(255,255,255,0.06)`, background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>{row.feature}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>{row.majorka ? <span style={{ color: '#4ADE80', fontWeight: 700 }}>✓{row.note ? '*' : ''}</span> : <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>{row.minea ? <span style={{ color: '#4ADE80' }}>✓</span> : <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>{row.stt ? <span style={{ color: '#4ADE80' }}>✓</span> : <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>{row.manual ? <span style={{ color: '#4ADE80' }}>✓</span> : <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ fontSize: 12, color: C.muted, marginTop: 12, textAlign: 'right' }}>* Scale plan only</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══ TRUST BADGES ══════════════════════════════════════════════════ */}
      <section style={{ padding: '32px 24px', background: C.bg, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '12px 32px' }}>
          {[
            { icon: '🔒', label: 'SSL Encrypted' },
            { icon: '🌍', label: 'Global Platform' },
            { icon: '💳', label: 'Cancel Anytime' },
            { icon: '🤝', label: '14-Day Money Back' },
          ].map((badge, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, color: C.secondary, fontSize: 13, fontWeight: 500 }}>
              <span style={{ fontSize: 16 }}>{badge.icon}</span>
              <span>{badge.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ PRICING ═══════════════════════════════════════════════════════ */}
      <section id="pricing" style={{ padding: '100px 24px', background: C.bg }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: syne, fontWeight: 800, fontSize: 'clamp(1.6rem, 4.5vw, 3rem)', letterSpacing: '-0.025em', marginBottom: 12, color: '#F8FAFC' }}>
            Simple pricing. No surprises.
          </h2>
          <p style={{ color: C.secondary, fontSize: 16, maxWidth: 460, margin: '0 auto 24px' }}>
            One platform replacing 6 tools at a fraction of the cost.
          </p>

          {/* Toggle */}
          <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(255,255,255,0.06)', borderRadius: 999, padding: 4, marginBottom: 48, border: `1px solid ${C.border}` }}>
            <button onClick={() => setAnnual(false)} style={{ padding: '7px 20px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: annual ? 400 : 600, background: annual ? 'transparent' : 'rgba(255,255,255,0.1)', color: annual ? C.secondary : '#F8FAFC', transition: 'all 150ms' }}>Monthly</button>
            <button onClick={() => setAnnual(true)} style={{ padding: '7px 20px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: annual ? 600 : 400, background: annual ? 'rgba(255,255,255,0.1)' : 'transparent', color: annual ? '#F8FAFC' : C.secondary, transition: 'all 150ms', display: 'flex', alignItems: 'center', gap: 8 }}>
              Annual <span style={{ background: 'rgba(34,197,94,0.15)', color: '#4ADE80', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 999 }}>Save 20%</span>
            </button>
          </div>

          {/* Cards */}
          <div ref={pricingCardsRef} className="grid-1-mobile" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 12 : 24, textAlign: 'left', maxWidth: 740, margin: '0 auto' }}>

            {/* Builder — Most Popular */}
            <div data-pricing-card style={{ opacity: 0, transform: 'translateY(20px)', transition: 'opacity 400ms, transform 400ms', background: C.card, border: '2px solid #6366F1', borderRadius: 20, padding: 32, boxShadow: '0 0 0 4px rgba(99,102,241,0.08), 0 24px 48px rgba(0,0,0,0.3)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#6366F1', color: 'white', fontSize: 12, fontWeight: 700, padding: '5px 16px', borderRadius: 999, whiteSpace: 'nowrap' }}>Most Popular</div>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: C.secondary, marginBottom: 16 }}>Builder</div>
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: isMobile ? 34 : 56, fontWeight: 800, fontFamily: syne, color: '#F8FAFC', lineHeight: 1 }}>${annual ? 79 : 99}</span>
                <span style={{ fontSize: 16, color: C.secondary, marginLeft: 4 }}>/month</span>
              </div>
              {annual && <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>billed ${79 * 12} annually</div>}
              <p style={{ fontSize: 14, color: C.secondary, marginBottom: 24 }}>Everything you need to run a winning store.</p>
              <div style={{ height: 1, background: C.border, margin: '24px 0' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { text: '50 product searches/month', on: true },
                  { text: '50 video searches/month', on: true },
                  { text: '50 ad intelligence searches/month', on: true },
                  { text: '50 creator searches/month', on: true },
                  { text: '5 competitor shop spy/month', on: true },
                  { text: '3 stores in Store Builder', on: true },
                  { text: '20 Ads Studio generations/month', on: true },
                  { text: 'Full Competitor Spy', on: false },
                  { text: 'API access', on: false },
                ].map(f => (
                  <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
                    <span style={{ color: f.on ? '#4ADE80' : 'rgba(255,255,255,0.2)', fontSize: 16, fontWeight: 700 }}>{f.on ? '\u2713' : '\u2014'}</span>
                    <span style={{ color: f.on ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)' }}>{f.text}</span>
                  </div>
                ))}
              </div>
              <Link href="/sign-up?plan=builder" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: 10, fontWeight: 600, fontSize: 15, width: '100%', cursor: 'pointer', transition: 'all 150ms', marginTop: 28, background: '#6366F1', color: 'white', border: 'none', textDecoration: 'none', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#4F46E5')}
                onMouseLeave={e => (e.currentTarget.style.background = '#6366F1')}
              >Get Started</Link>
            </div>

            {/* Scale */}
            <div data-pricing-card style={{ opacity: 0, transform: 'translateY(20px)', transition: 'opacity 400ms, transform 400ms', background: C.card, border: '2px solid transparent', borderRadius: 20, padding: 32, backgroundImage: `linear-gradient(${C.card}, ${C.card}), linear-gradient(135deg, #6366F1, #8B5CF6)`, backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box' }}>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: C.secondary, marginBottom: 16 }}>Scale</div>
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: isMobile ? 34 : 56, fontWeight: 800, fontFamily: syne, color: '#F8FAFC', lineHeight: 1 }}>${annual ? 159 : 199}</span>
                <span style={{ fontSize: 16, color: C.secondary, marginLeft: 4 }}>/month</span>
              </div>
              {annual && <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>billed ${159 * 12} annually</div>}
              <p style={{ fontSize: 14, color: C.secondary, marginBottom: 24 }}>For serious operators who need full control.</p>
              <div style={{ height: 1, background: C.border, margin: '24px 0' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { text: 'Everything in Builder', on: true },
                  { text: 'Unlimited searches (all tools)', on: true },
                  { text: 'Unlimited Competitor Shop Spy', on: true },
                  { text: 'Unlimited Store Builder', on: true },
                  { text: 'Niche Signal Tracking', on: true },
                  { text: 'API access', on: true },
                  { text: 'Priority support', on: true },
                ].map(f => (
                  <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
                    <span style={{ color: f.on ? '#4ADE80' : 'rgba(255,255,255,0.2)', fontSize: 16, fontWeight: 700 }}>{f.on ? '\u2713' : '\u2014'}</span>
                    <span style={{ color: f.on ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)' }}>{f.text}</span>
                  </div>
                ))}
              </div>
              <Link href="/sign-up?plan=scale" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: 10, fontWeight: 600, fontSize: 15, width: '100%', cursor: 'pointer', transition: 'all 150ms', marginTop: 28, background: 'rgba(255,255,255,0.1)', color: '#F8FAFC', border: `1px solid ${C.border}`, textDecoration: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = C.border; }}
              >Subscribe</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ════════════════════════════════════════════════════════════ */}
      <section id="faq" style={{ padding: isMobile ? '40px 16px' : '80px 24px', background: C.bg }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} style={{ fontFamily: syne, fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', letterSpacing: '-0.025em', textAlign: 'center', marginBottom: 48, color: '#F8FAFC' }}>
            Common questions.
          </motion.h2>
          {FAQ.map((item, i) => <FAQItem key={i} q={item.q} a={item.a} />)}
        </div>
      </section>

      {/* ═══ EMAIL CAPTURE ═════════════════════════════════════════════════ */}
      <section id="guide" style={{ padding: isMobile ? '40px 16px' : '80px 24px', background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }} style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontFamily: syne, fontWeight: 800, fontSize: 'clamp(1.4rem, 3.5vw, 2.2rem)', letterSpacing: '-0.025em', marginBottom: 12, color: '#F8FAFC' }}>Free resources. No catch.</h2>
            <p style={{ color: C.secondary, fontSize: 16, maxWidth: 460, margin: '0 auto' }}>Get our product research playbook and weekly trending products — straight to your inbox.</p>
          </motion.div>
          <EmailCapture />
        </div>
      </section>

      {/* ═══ FINAL CTA ═════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', padding: '120px 24px', textAlign: 'center', overflow: 'hidden', background: C.bg }}>
        <div className="particle-grid" style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', width: 600, height: 400, marginTop: -200, marginLeft: -300, background: 'radial-gradient(ellipse, rgba(99,102,241,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 640, margin: '0 auto' }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
            <h2 style={{ fontFamily: syne, fontWeight: 800, fontSize: 'clamp(1.8rem, 5vw, 3.5rem)', letterSpacing: '-0.03em', marginBottom: 20, lineHeight: 1.1, color: '#F8FAFC' }}>
              Your competitors are already using AI. <span className="gold-text">Are you?</span>
            </h2>
            <p style={{ color: C.secondary, fontSize: 'clamp(15px, 2vw, 18px)', marginBottom: 44, lineHeight: 1.65 }}>
              No contracts. Cancel anytime.
            </p>
            <div className="stack-mobile" style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
              <Link
                href="/sign-up"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 14, padding: '18px 52px', fontFamily: syne, fontWeight: 800, fontSize: 'clamp(15px, 2vw, 18px)', textDecoration: 'none', boxShadow: '0 0 60px rgba(99,102,241,0.35), 0 4px 24px rgba(0,0,0,0.3)', minHeight: 56, minWidth: 200, transition: 'transform 0.2s, box-shadow 0.2s', background: '#6366F1', color: '#fff' }}
                onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-3px)'; el.style.boxShadow = '0 0 80px rgba(99,102,241,0.5), 0 8px 32px rgba(0,0,0,0.4)'; }}
                onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.transform = ''; el.style.boxShadow = '0 0 60px rgba(99,102,241,0.35), 0 4px 24px rgba(0,0,0,0.3)'; }}
              >
                Get Started →
              </Link>
            </div>
            <span style={{ fontSize: 13, color: C.secondary }}>★★★★★  500+ sellers worldwide</span>
          </motion.div>
        </div>
      </section>

      {/* ═══ FLOATING CTA ═══════════════════════════════════════════════════ */}
      <FloatingCTA />

      {/* ═══ FOOTER ════════════════════════════════════════════════════════ */}
      <footer style={{ background: '#0A0A0A', padding: '80px 24px 40px', color: '#6B7280' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '0 16px' : '0 24px' }}>
          <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: isMobile ? 24 : 48, marginBottom: 64 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <img src="/majorka-logo.jpg" alt="Majorka" width={36} height={36} style={{ width: 36, height: 36, objectFit: 'contain', display: 'block', borderRadius: 10, flexShrink: 0 }} draggable={false} />
                <span style={{ fontFamily: syne, fontWeight: 800, fontSize: 18, color: 'white', letterSpacing: '-0.02em' }}>Majorka</span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: '#6B7280', maxWidth: 240, marginBottom: 24 }}>The AI OS for Dropshippers. Find winners, build stores, scale fast.</p>
              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  { key: 'x', icon: <span>𝕏</span>, href: 'https://twitter.com/majorkaio' },
                  { key: 'li', icon: <span>in</span>, href: 'https://linkedin.com/company/majorka' },
                  { key: 'tt', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, height: 16 }}><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.77a4.85 4.85 0 01-1.01-.08z"/></svg>, href: 'https://tiktok.com/@majorkaio' },
                ].map(({ key, icon, href }) => (
                  <a key={key} href={href} target="_blank" rel="noopener noreferrer" style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid #27272A', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#6B7280', transition: '150ms', textDecoration: 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.color = '#6366F1'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#27272A'; e.currentTarget.style.color = '#6B7280'; }}
                  >{icon}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 16, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Product</h4>
              {[
                { label: 'Features', href: 'https://majorka.io/#features' },
                { label: 'Pricing', href: '/pricing' },
                { label: 'Store Builder', href: '/sign-up?ref=store-builder' },
                { label: 'Product Intelligence', href: '/sign-up?ref=intelligence' },
                { label: 'Competitor Spy', href: '/sign-up?ref=spy' },
              ].map(link => (
                <a key={link.label} href={link.href} style={{ display: 'block', fontSize: 14, color: '#6B7280', marginBottom: 10, textDecoration: 'none', transition: 'color 150ms' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}
                >{link.label}</a>
              ))}
            </div>
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 16, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Company</h4>
              {[
                { label: 'Blog', href: '/blog' },
                { label: 'About', href: '/about' },
                { label: 'Contact', href: 'mailto:hello@majorka.io' },
                { label: 'Support', href: 'mailto:support@majorka.io' },
              ].map(link => (
                <a key={link.label} href={link.href} style={{ display: 'block', fontSize: 14, color: '#6B7280', marginBottom: 10, textDecoration: 'none', transition: 'color 150ms' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}
                >{link.label}</a>
              ))}
            </div>
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 16, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Legal</h4>
              {[
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Terms of Service', href: '/terms' },
                { label: 'Cookie Policy', href: '/cookies' },
                { label: 'Refund Policy', href: '/refund-policy' },
              ].map(link => (
                <a key={link.label} href={link.href} style={{ display: 'block', fontSize: 14, color: '#6B7280', marginBottom: 10, textDecoration: 'none', transition: 'color 150ms' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}
                >{link.label}</a>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid #1F1F23', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#4B4B57' }}>© 2026 Majorka Pty Ltd</span>
            <span style={{ fontSize: 13, color: '#4B4B57' }}>Global Platform · 7 Markets</span>
          </div>
        </div>
      </footer>

      {/* Live chat CTA — bottom right */}
      <a
        href="mailto:support@majorka.io?subject=Pre-sale question"
        style={{
          position: 'fixed' as const,
          bottom: 24,
          right: 24,
          zIndex: 9000,
          background: '#6366F1',
          color: 'white',
          borderRadius: 999,
          padding: '12px 18px',
          fontSize: 14,
          fontWeight: 700,
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
          fontFamily: dm,
          transition: 'transform 150ms, box-shadow 150ms',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(99,102,241,0.5)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(99,102,241,0.4)'; }}
      >
        💬 Have a question?
      </a>
    </div>
  );
}
