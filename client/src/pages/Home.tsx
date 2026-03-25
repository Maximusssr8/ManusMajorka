import { useIsMobile } from '@/hooks/useIsMobile';
import { motion } from 'framer-motion';
import {
  BarChart2,
  BarChart3,
  DollarSign,
  Eye,
  Globe,
  Megaphone,
  Package,
  Search,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Marquee from 'react-fast-marquee';
import { useInView } from 'react-intersection-observer';
import { Link } from 'wouter';
import ProductIntelligencePreview from '@/components/ProductIntelligencePreview';
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
@keyframes aurora { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
@keyframes float { 0%, 100% { transform: translateY(0) rotate(-1deg); } 50% { transform: translateY(-10px) rotate(-1deg); } }
@keyframes float-mobile { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
@keyframes pulse-ring { 0% { transform: scale(0.9); opacity: 0.6; } 50% { transform: scale(1.05); opacity: 1; } 100% { transform: scale(0.9); opacity: 0.6; } }
@keyframes gradient-x { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
@keyframes ray-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes shimmer-btn { 0% { background-position: 200% center; } 100% { background-position: -200% center; } }
@keyframes gold-pulse { 0%, 100% { opacity: 0.05; } 50% { opacity: 0.08; } }
@keyframes horizon-glow { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.55; } }
@keyframes live-dot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
@keyframes float-cta { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

.btn-shimmer {
  background: linear-gradient(90deg, #4F46E5 0%, #6366F1 25%, #A5B4FC 50%, #6366F1 75%, #4F46E5 100%);
  background-size: 200% 100%;
  animation: shimmer-btn 3s linear infinite;
  color: #000;
}
.gold-text {
  background: linear-gradient(135deg, #6366F1, #A5B4FC, #6366F1);
  background-size: 200% 200%;
  animation: gradient-x 5s ease infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.particle-grid {
  background-image: radial-gradient(circle, rgba(99,102,241,0.06) 1px, transparent 1px);
  background-size: 48px 48px;
}
.horizon-line {
  position: absolute; left: 0; right: 0; top: 60%; height: 1px;
  background: linear-gradient(to right, transparent, rgba(99,102,241,0.18) 30%, rgba(99,102,241,0.35) 50%, rgba(99,102,241,0.18) 70%, transparent);
  animation: horizon-glow 6s ease-in-out infinite;
  pointer-events: none;
}
.social-icon-btn {
  display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: 8px;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  color: #6B7280; text-decoration: none; font-size: 14px; font-weight: 700;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
}
.social-icon-btn:hover { border-color: rgba(99,102,241,0.35); color: #6366F1; background: rgba(99,102,241,0.06); }
.feature-big:hover { border-color: rgba(99,102,241,0.25) !important; transform: translateY(-3px); }

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
  .hero-section .btn-shimmer { display: flex !important; width: 100% !important; box-sizing: border-box !important; }
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

@keyframes blobFloat {
  from { transform: translateY(0px); }
  to { transform: translateY(-20px); }
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes blob-drift-1 { 0%,100%{transform:translate(0,0) scale(1);} 33%{transform:translate(60px,-40px) scale(1.1);} 66%{transform:translate(-40px,30px) scale(0.95);} }
@keyframes blob-drift-2 { 0%,100%{transform:translate(0,0) scale(1);} 33%{transform:translate(-50px,60px) scale(1.05);} 66%{transform:translate(70px,-30px) scale(0.98);} }
@keyframes blob-drift-3 { 0%,100%{transform:translate(0,0) scale(1);} 33%{transform:translate(40px,50px) scale(0.92);} 66%{transform:translate(-60px,-40px) scale(1.08);} }
.gradient-blob { position:absolute; border-radius:50%; filter:blur(80px); pointer-events:none; }
`;

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: '#FAFAFA',
  card: '#FFFFFF',
  elevated: '#F9FAFB',
  border: '#E5E7EB',
  borderHover: 'rgba(99,102,241,0.25)',
  text: '#0A0A0A',
  secondary: '#6B7280',
  muted: '#9CA3AF',
  gold: '#6366F1',
  goldLight: '#A5B4FC',
  goldDim: 'rgba(99,102,241,0.08)',
  goldBorder: 'rgba(99,102,241,0.2)',
  green: '#10B981',
  red: '#EF4444',
};

const syne = "'Bricolage Grotesque', sans-serif";
const dm = "'DM Sans', sans-serif";

// ── Data ──────────────────────────────────────────────────────────────────────

const STATS_BASE = [
  { key: 'sellers', end: 500, suffix: '+', prefix: '', label: 'AU Dropshippers', icon: Users, live: true, tickEvery: 30000, tickBy: 1 },
  { key: 'markets', end: 7, suffix: '', prefix: '', label: 'Markets Supported', icon: DollarSign, live: false, display: (_n: number) => '7' },
  { key: 'joiners', end: 47, suffix: ' this week', prefix: '', label: 'New Joiners', icon: Package, live: true, tickEvery: 60000, tickBy: 1 },
  { key: 'rating', end: 4.9, suffix: '★', prefix: '', label: 'Average Rating', icon: BarChart2, live: false, display: () => '4.9★' },
];

const BIG_FEATURES = [
  {
    Icon: Search,
    title: 'Find winning products in seconds',
    sub: 'Not months of research',
    desc: 'AI scans global marketplaces for AU demand signals. Get scored opportunities with margin data, competition index, and supplier matches — in under 10 seconds.',
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
const TESTIMONIALS_SHOW: { quote: string; name: string; city: string; flag: string; plan: string; stars: number }[] = [];

const FAQ = [
  { q: 'Which markets does Majorka support?', a: 'Majorka supports 7 markets: US, Australia, UK, Canada, New Zealand, Germany, and Singapore. Select your region and every tool adapts — currency, shipping carriers, tax rates, compliance, and local payment methods.' },
  { q: 'What makes this different from other AI tools?', a: 'Majorka is region-native. It supports multi-currency pricing, local shipping carriers, tax compliance, and payment methods (Afterpay, Klarna, Zip, Stripe) across 7 markets. No more converting currencies or adapting generic advice.' },
  { q: 'Can I cancel anytime?', a: 'Yes, absolutely. No lock-in contracts. Cancel from your dashboard anytime. You retain access until the end of your billing period.' },
  { q: 'Do you support Shopify?', a: 'Yes. Website Generator exports production-ready Shopify Liquid theme files as a ZIP. All landing pages include trust signals, local payment badges, and mobile-optimised layouts ready for your store.' },
  { q: 'Is there a free trial?', a: 'Yes. The Starter plan is free forever with 5 AI credits per day and access to core tools. Paid plans include a 7-day free trial with no credit card required.' },
];

const LOGO_STRIP = ['Shopify', 'AliExpress', 'Meta', 'Google', 'TikTok', 'DHL', 'Stripe', 'Klarna', 'Afterpay', 'Amazon', 'Canva'];

// ── Sub-components ────────────────────────────────────────────────────────────

function SocialProofCounter() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    fetch('/api/stats/users')
      .then((r) => r.json())
      .then((d) => setCount(d.count))
      .catch(() => setCount(2847));
  }, []);
  if (count === null) return null;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 100, padding: '6px 18px' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.green, animation: 'pulse-ring 2s ease-in-out infinite' }} />
      <span style={{ fontSize: 13, fontWeight: 600, color: '#059669' }}>Join 500+ AU sellers using Majorka</span>
    </div>
  );
}

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
    <section ref={ref as React.RefCallback<HTMLElement>} style={{ background: '#F9FAFB', borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB', padding: isMobile ? '40px 16px' : '64px 24px', overflowX: 'hidden' }}>
      <div className="grid-2-mobile" style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 12 : 24, textAlign: 'center' }}>
        {STATS_BASE.map((stat, i) => {
          const Icon = stat.icon;
          const currentVal = liveValues[stat.key] ?? stat.end;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }} transition={{ delay: i * 0.1, duration: 0.5, ease: 'easeOut' }} style={{ padding: '16px 8px', position: 'relative' }}>
              {i < STATS_BASE.length - 1 && <div style={{ position: 'absolute', right: 0, top: '20%', bottom: '20%', width: 1, background: '#E5E7EB' }} className="hide-mobile" />}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 10, background: C.goldDim, border: `1px solid ${C.goldBorder}`, margin: '0 auto 12px', position: 'relative' }}>
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
              <div style={{ fontSize: 13, color: C.secondary, fontWeight: 500, letterSpacing: '0.02em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
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
    <div style={{ borderBottom: `1px solid ${C.border}`, overflow: 'hidden' }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', flexDirection: isMobile ? 'column' as const : 'row' as const, padding: '20px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', minHeight: 48 }}>
        <span style={{ fontFamily: syne, fontWeight: 700, fontSize: 16, color: C.text, paddingRight: 16 }}>{q}</span>
        <span style={{ color: C.gold, fontSize: 22, fontWeight: 300, flexShrink: 0, transform: open ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.25s' }}>+</span>
      </button>
      <div style={{ maxHeight: open ? 300 : 0, opacity: open ? 1 : 0, transition: 'max-height 0.35s ease, opacity 0.25s ease', overflow: 'hidden' }}>
        <p style={{ fontSize: 15, color: C.secondary, lineHeight: 1.7, paddingBottom: 20 }}>{a}</p>
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
      <div style={{ background: C.elevated, border: `1px solid ${C.goldBorder}`, borderRadius: 20, padding: isMobile ? '32px 16px' : '48px 32px', textAlign: 'center', maxWidth: 560, margin: '0 auto' }}>
        <div style={{ fontSize: isMobile ? 30 : 48, marginBottom: 16 }}>✅</div>
        <h3 style={{ fontFamily: syne, fontWeight: 800, fontSize: 22, color: C.text, marginBottom: 12 }}>You're in! Check your inbox.</h3>
        <p style={{ color: C.secondary, fontSize: 15, lineHeight: 1.6 }}>While you wait, <Link href="/app" style={{ color: C.gold, textDecoration: 'underline' }}>try the tools free →</Link></p>
      </div>
    );
  }

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 20, padding: isMobile ? '32px 16px' : '48px 32px', maxWidth: 560, margin: '0 auto', boxShadow: '0 4px 16px #E5E7EB' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 100, padding: '5px 14px', marginBottom: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.gold }}>FREE PRODUCT GUIDE</span>
        </div>
        <h3 style={{ fontFamily: syne, fontWeight: 800, fontSize: 22, color: '#0A0A0A', marginBottom: 8 }}>Get the Product Research Playbook</h3>
        <p style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.6 }}>How top sellers find $10K/mo products + weekly trending product alerts. Free, no spam.</p>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input type="text" placeholder="First name (optional)" value={name} onChange={(e) => setName(e.target.value)} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 10, padding: '12px 16px', color: '#0A0A0A', fontSize: 14, fontFamily: dm, outline: 'none', minHeight: 48 }} />
        <input type="email" placeholder="Your email address" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 10, padding: '12px 16px', color: '#0A0A0A', fontSize: 14, fontFamily: dm, outline: 'none', minHeight: 48 }} />
        <button type="submit" disabled={status === 'loading'} style={{ background: `linear-gradient(135deg, ${C.gold}, #4F46E5)`, color: '#fff', borderRadius: 10, padding: '14px 20px', fontFamily: syne, fontWeight: 800, fontSize: 15, border: 'none', cursor: status === 'loading' ? 'wait' : 'pointer', opacity: status === 'loading' ? 0.7 : 1, transition: 'opacity 0.2s', minHeight: 48 }}>
          {status === 'loading' ? 'Sending...' : 'Send Me the Guide'}
        </button>
        {status === 'error' && <p style={{ color: C.red, fontSize: 13, textAlign: 'center' }}>{errMsg}</p>}
        <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center' }}>Unsubscribe anytime. We respect your privacy.</p>
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
    <section style={{ background: C.card, borderTop: '2px solid transparent', backgroundImage: `linear-gradient(${C.card}, ${C.card}), linear-gradient(90deg, transparent, ${C.gold}, transparent)`, backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box', borderBottom: `1px solid ${C.border}`, padding: '72px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: C.goldDim, border: `1px solid ${C.goldBorder}`, borderRadius: 100, padding: '5px 14px', marginBottom: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.gold, fontFamily: syne }}>📬 FREE EVERY MONDAY</span>
          </div>
          <h2 style={{ fontFamily: syne, fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 2.6rem)', letterSpacing: '-0.025em', color: C.text, marginBottom: 10 }}>
            Get AU's Top 5 Products Every Monday — <span className="gold-text">Free Forever</span>
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
                  <div style={{ position: 'absolute', inset: 0, background: `rgba(8,10,14,${overlayOpacity})`, borderRadius: 14, zIndex: 1 }} />
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
                style={{ flex: '1 1 260px', background: '#F9FAFB', border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 18px', color: C.text, fontSize: 15, fontFamily: dm, outline: 'none', minHeight: 52 }}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                style={{ flex: '0 0 auto', background: `linear-gradient(135deg, ${C.gold}, #4F46E5)`, color: '#000', borderRadius: 12, padding: '14px 28px', fontFamily: syne, fontWeight: 800, fontSize: 15, border: 'none', cursor: status === 'loading' ? 'wait' : 'pointer', opacity: status === 'loading' ? 0.7 : 1, whiteSpace: 'nowrap', minHeight: 52 }}
              >
                {status === 'loading' ? 'Sending...' : 'Get Free Weekly Report →'}
              </button>
            </form>
            {status === 'error' && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 8, textAlign: 'center' }}>{errMsg}</p>}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 14, flexWrap: 'wrap' }}>
              {['✓ No spam', '✓ Unsubscribe anytime', '✓ 2,847 subscribers'].map((t) => (
                <span key={t} style={{ fontSize: 12, color: C.secondary }}>{t}</span>
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
      borderTop: `1px solid ${C.gold}`,
      padding: '14px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      animation: 'float-cta 0.4s ease-out',
    }} className="floating-cta-bar">
      <span style={{ fontSize: 14, fontWeight: 600, color: C.text, flex: 1 }}>
        <span className="hide-mobile">🔥 Join 500+ AU dropshippers · Find your first winner →</span>
        <span className="hide-desktop">Find your winner →</span>
      </span>
      <Link href="/sign-in" style={{ background: `linear-gradient(135deg, ${C.gold}, #4F46E5)`, color: '#000', borderRadius: 10, padding: '10px 22px', fontFamily: syne, fontWeight: 800, fontSize: 14, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
        Start Free
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
    desc: 'Real-time market data. Know what is selling, where demand is spiking, and which niches are about to blow up.',
    gridColumn: '2 / 3', gridRow: '2 / 3',
  },
  {
    key: 'E', Icon: DollarSign, title: 'Profit Calculator',
    desc: 'Enter your product cost and ad spend, get exact margins, ROAS targets, and break-even CPA — before you spend a dollar.',
    gridColumn: '1 / 2', gridRow: '3 / 4',
  },
  {
    key: 'F', title: '\u{1F1E6}\u{1F1FA} AU-First Data',
    desc: 'Every signal, trend, and supplier link is filtered for your market. Pick your region and get local opportunities.',
    gridColumn: '2 / 3', gridRow: '3 / 4',
  },
  {
    key: 'G', Icon: Megaphone, title: 'Ad Intelligence',
    desc: 'Find winning ad creatives across Meta and TikTok. See spend estimates, engagement, and hook formulas that work in AU.',
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
            ⚡ 20+ AI TOOLS
          </div>
          <h2 style={{ fontFamily: brico, fontWeight: 800, fontSize: 'clamp(28px,5vw,48px)', color: '#F8FAFC', letterSpacing: '-0.02em', marginBottom: 12 }}>Everything you need to win</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', maxWidth: 480, margin: '0 auto' }}>One platform. Every tool a serious dropshipper actually needs.</p>
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
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 16, lineHeight: 1.6 }}>Real margin data, TikTok signals, and supplier links — updated every 6 hours.</p>
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
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', animation: 'demoPulse 2s ease-in-out infinite' }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: mono }}>Live market data · Updated every 6 hours</span>
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
  const steps = [
    { Icon: Search, title: 'Find a Winner', desc: 'Browse trending AU products with real revenue data and supplier links.' },
    { Icon: Zap, title: 'Build Your Store', desc: 'Describe your niche. AI builds your entire Shopify store in under 60 seconds.' },
    { Icon: TrendingUp, title: 'Launch & Scale', desc: 'Run spy tools, monitor competitors, and optimise with the profit calculator.' },
  ];

  return (
    <section style={{ background: '#FAFAFA', padding: '100px 24px', borderTop: '1px solid #F0F0F0' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 999, padding: '4px 14px', marginBottom: 16, fontSize: 12, fontWeight: 700, color: '#6366F1', letterSpacing: '0.06em' }}>
            🗺️ THE PROCESS
          </div>
          <h2 style={{ fontFamily: brico, fontWeight: 800, fontSize: 'clamp(28px,5vw,44px)', color: '#0A0A0A', letterSpacing: '-0.02em' }}>
            Zero to first sale.{" "}
            <span style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Faster than you think.
            </span>
          </h2>
        </div>

        <div className="grid-1-mobile" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? 12 : 24 }}>
          {[
            {
              num: '01', Icon: Search, color: '#6366F1', bg: '#EEF2FF',
              title: 'Find a winning product',
              desc: 'AI scans 50k+ products for AU demand signals. See real revenue estimates, supplier links, and TikTok trend data — in seconds.',
              stat: { label: 'Products analysed', value: '50,000+' },
              tag: 'Free feature',
            },
            {
              num: '02', Icon: Zap, color: '#8B5CF6', bg: '#F3E8FF',
              title: 'Build your store in 60s',
              desc: 'Type your niche. Majorka generates a complete Shopify store — theme, product copy, images, and AU shipping settings.',
              stat: { label: 'Avg build time', value: '54 seconds' },
              tag: 'AI-powered',
            },
            {
              num: '03', Icon: TrendingUp, color: '#10B981', bg: '#ECFDF5',
              title: 'Launch, spy & scale',
              desc: 'Use Spy Tools to monitor competitor ads. Track profit with the calculator. Scale what works, cut what does not.',
              stat: { label: '14-day free trial', value: 'Free' },
              tag: 'Results',
            },
          ].map((step, i) => {
            const StepIcon = step.Icon;
            return (
              <div key={i}
                style={{ background: 'white', border: '1px solid #F0F0F0', borderRadius: 20, padding: '32px', position: 'relative', overflow: 'hidden', cursor: 'default', transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 32px #E5E7EB'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#F0F0F0'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {/* Ghost number */}
                <div style={{ position: 'absolute', top: -8, right: 16, fontSize: 80, fontWeight: 800, color: '#F5F5F7', lineHeight: 1, userSelect: 'none' as const, zIndex: 0 }}>{step.num}</div>
                {/* Icon */}
                <div style={{ width: 52, height: 52, borderRadius: 14, background: step.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, position: 'relative', zIndex: 1 }}>
                  <StepIcon size={24} color={step.color} />
                </div>
                {/* Tag */}
                <div style={{ display: 'inline-flex', fontSize: 10, fontWeight: 700, color: step.color, background: step.bg, padding: '3px 10px', borderRadius: 999, letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 14, position: 'relative', zIndex: 1 }}>{step.tag}</div>
                <h3 style={{ fontFamily: brico, fontWeight: 700, fontSize: 19, color: '#0A0A0A', marginBottom: 10, position: 'relative', zIndex: 1 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, marginBottom: 24, position: 'relative', zIndex: 1 }}>{step.desc}</p>
                {/* Stat */}
                <div style={{ borderTop: '1px solid #F5F5F7', paddingTop: 16, position: 'relative', zIndex: 1 }}>
                  <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 4 }}>{step.stat.label}</div>
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
    <section style={{ background: '#0A0A0A', padding: '120px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: brico, fontWeight: 800, fontSize: 'clamp(28px,5vw,48px)', color: 'white' }}>See it in action</h2>
          <p style={{ fontSize: 17, color: '#A1A1AA', maxWidth: 560, margin: '12px auto 48px' }}>Watch Majorka find a winning product and build a store in 60 seconds.</p>
        </div>

        {/* Tab row */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', background: '#111113', border: '1px solid #27272A', borderRadius: 10, padding: 4 }}>
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '8px 20px', borderRadius: 7, fontSize: 14, cursor: 'pointer', border: 'none', transition: 'all 150ms',
                  background: activeTab === tab.key ? 'white' : 'transparent',
                  color: activeTab === tab.key ? '#FAFAFA' : '#6B7280',
                  fontWeight: activeTab === tab.key ? 600 : 500,
                  boxShadow: activeTab === tab.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
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
                <span style={{ fontSize: 12, color: '#6B7280' }}>{'\u{1F1E6}\u{1F1FA}'} AU Market · Live Data</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                  <thead>
                    <tr style={{ background: '#0F0F11' }}>
                      {['#', 'Product', 'Margin', 'Score', ''].map(h => (
                        <th key={h} style={{ padding: '10px 20px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DEMO_PRODUCTS.map(row => {
                      const ss = getScoreStyle(row.score);
                      return (
                        <tr key={row.rank} style={{ borderBottom: '1px solid #1F1F23', fontSize: 13, color: '#E5E7EB' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
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
              <div className="spy-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
    '▸ Setting up AUD pricing ($49.95)...',
    '▸ Configuring Stripe + Afterpay...',
    '▸ Launching Meta ad campaign...',
    '✓ Store is live.',
  ];

  // Step 0: scan animation
  useEffect(() => {
    if (step !== 0) return;
    const t = setInterval(() => setScanLine(p => p < 4 ? p + 1 : p), 320);
    return () => clearInterval(t);
  }, [step]);

  // Step 2: terminal build log
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

  // Step 3: revenue counter
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

  // Auto-advance
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
      {/* Backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(9,9,18,0.75)', backdropFilter: 'blur(10px)' }} onClick={onClose} />

      {/* Modal */}
      <div style={{
        position: 'relative', background: '#FFFFFF',
        borderRadius: isMobile ? '20px 20px 0 0' : 20,
        width: '100%', maxWidth: isMobile ? '100%' : 580,
        maxHeight: isMobile ? '92vh' : '88vh',
        overflowY: 'auto',
        boxShadow: '0 40px 120px rgba(0,0,0,0.35)',
        ...(isMobile ? { position: 'fixed', bottom: 0, left: 0, right: 0 } : {}),
      }}>

        {/* Header — dark indigo gradient */}
        <div style={{ background: 'linear-gradient(135deg, #0F1117 0%, #1E1B4B 50%, #312E81 100%)', padding: isMobile ? '20px 20px 24px' : '24px 28px 28px', borderRadius: isMobile ? '20px 20px 0 0' : '20px 20px 0 0' }}>
          {/* Close */}
          <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.12)', cursor: 'pointer', color: 'white', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>

          {/* Step pills */}
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

          {/* Progress bar */}
          <div style={{ height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 999, marginBottom: 20 }}>
            <div style={{ height: '100%', width: `${((step + 1) / STEPS.length) * 100}%`, background: `linear-gradient(90deg, ${acc}, ${acc}cc)`, borderRadius: 999, transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)' }} />
          </div>

          {/* Title */}
          <div style={{ fontFamily: brico, fontWeight: 800, fontSize: isMobile ? 20 : 24, color: 'white', marginBottom: 6 }}>
            {step === 0 && 'Scanning 50,000+ products…'}
            {step === 1 && '🏆 Winner identified'}
            {step === 2 && '⚙️ Building your store…'}
            {step === 3 && '🎉 First sale in 6 hours'}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
            {step === 0 && 'AI ranks every product by margin, demand, and AU relevance'}
            {step === 1 && 'Posture Corrector Pro — 62% margin · TikTok trending · Low competition'}
            {step === 2 && 'AI writes copy, imports product, configures payments. Done in minutes.'}
            {step === 3 && 'Real customer from Sydney. $52.10 profit on the first order.'}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: isMobile ? '20px' : '24px 28px 28px' }}>

          {/* ── STEP 0: Product scan ── */}
          {step === 0 && (
            <div>
              {/* Scan bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#F5F3FF', borderRadius: 10, marginBottom: 14, border: '1px solid #DDD6FE' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366F1', animation: 'demoPulse 1.2s ease-in-out infinite' }} />
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
                    {/* Score ring */}
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

          {/* ── STEP 1: Product card ── */}
          {step === 1 && (
            <div>
              {/* Product card — looks like Majorka's real UI */}
              <div style={{ border: '1.5px solid #E5E7EB', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ background: 'linear-gradient(135deg, #EEF2FF, #F5F3FF)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 12, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>🦺</div>
                  <div>
                    <div style={{ fontFamily: brico, fontWeight: 800, fontSize: 16, color: '#0F172A', marginBottom: 2 }}>Posture Corrector Pro</div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>Health & Wellness · AliExpress · Ships AUS</div>
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
                    { label: 'Monthly Rev.', value: '$41k', color: '#8B5CF6' },
                  ].map((s, i) => (
                    <div key={i} style={{ textAlign: 'center' as const }}>
                      <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 3 }}>{s.label}</div>
                      <div style={{ fontFamily: brico, fontWeight: 700, fontSize: 15, color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Why winning */}
              <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 14px', border: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 8 }}>🤖 Why It's Winning</div>
                {['Post-pandemic posture awareness driving 340% YoY search growth', 'Only 3 serious competitors selling AU — massive gap', 'TikTok organic reach still wide open for this category'].map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                    <span style={{ color: '#6366F1', fontSize: 12, marginTop: 1, flexShrink: 0 }}>▸</span>
                    <span style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 2: Terminal build log ── */}
          {step === 2 && (
            <div>
              <div style={{ background: '#0D1117', borderRadius: 12, padding: '16px 18px', fontFamily: "'Geist Mono', 'Fira Code', monospace", fontSize: 12, minHeight: 200 }}>
                {/* Terminal chrome */}
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
              {/* Progress bar */}
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

          {/* ── STEP 3: First sale ── */}
          {step === 3 && (
            <div>
              {/* Sale notification */}
              <div style={{ background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)', border: '1.5px solid #6EE7B7', borderRadius: 14, padding: '20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #059669, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>💸</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 4 }}>New Sale — posture-pro.myshopify.com</div>
                  <div style={{ fontFamily: brico, fontWeight: 800, fontSize: isMobile ? 26 : 32, color: '#064E3B', lineHeight: 1 }}>
                    ${counterVal.toFixed(2)} AUD
                  </div>
                  <div style={{ fontSize: 12, color: '#059669', marginTop: 4 }}>Sophie T. · Sydney, NSW · 6 hrs after launch</div>
                </div>
              </div>
              {/* Stats */}
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

          {/* Footer CTA */}
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
                  Start for Free →
                </a>
            }
          </div>
        </div>
      </div>

      <style>{`
        @keyframes termBlink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
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
  const mockupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setNavShadow(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (mockupRef.current) {
        const scrollY = window.scrollY;
        mockupRef.current.style.transform = `perspective(1200px) rotateX(${Math.max(0, 4 - scrollY * 0.01)}deg) translateY(${scrollY * -0.15}px)`;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
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
        description="Find winning products, build Shopify stores and launch AU dropshipping campaigns with AI. Trusted by 500+ AU dropshippers."
        path="/"
        ogImage="/og-image.svg"
      />
      <style>{GLOBAL_STYLES}</style>
      {showDemo && <DemoModal onClose={() => setShowDemo(false)} />}

      {/* ═══ NAV ═══════════════════════════════════════════════════════════ */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(250,250,250,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid #ECECEC', boxShadow: navShadow ? '0 1px 16px rgba(0,0,0,0.06)' : 'none', transition: 'box-shadow 0.3s' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* ── Left: Logo ── */}
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', userSelect: 'none', flexShrink: 0 }}>
            <img src="/majorka-logo.jpg" alt="Majorka" width={30} height={30} style={{ width: 30, height: 30, objectFit: 'contain', borderRadius: 7, flexShrink: 0, display: 'block' }} draggable={false} />
            <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 16, color: '#0F172A', letterSpacing: '-0.02em' }}>Majorka</span>
          </a>

          {/* ── Center: Nav links (desktop only) ── */}
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {[['https://majorka.io/#features', 'Features'], ['https://majorka.io/#pricing', 'Pricing']].map(([href, label]) => (
                <a key={label} href={href} style={{ color: '#6B7280', textDecoration: 'none', fontSize: 14, fontWeight: 500, padding: '6px 12px', borderRadius: 7, transition: 'color 120ms, background 120ms' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#111827'; e.currentTarget.style.background = '#F3F4F6'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#6B7280'; e.currentTarget.style.background = 'transparent'; }}>
                  {label}
                </a>
              ))}
            </div>
          )}

          {/* ── Right: CTA ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {!isMobile && (
              <Link href="/sign-in" style={{ color: '#6B7280', textDecoration: 'none', fontSize: 14, fontWeight: 500, padding: '6px 12px', borderRadius: 7, transition: 'color 120ms, background 120ms' }}
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = '#111827'; e.currentTarget.style.background = '#F3F4F6'; }}
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = '#6B7280'; e.currentTarget.style.background = 'transparent'; }}>
                Log in
              </Link>
            )}
            <Link href="/sign-up" style={{ background: '#6366F1', color: '#fff', borderRadius: 8, padding: '8px 18px', fontWeight: 600, fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', letterSpacing: '-0.01em', whiteSpace: 'nowrap' as const }}>
              {isMobile ? 'Sign up' : 'Start Free →'}
            </Link>
            {isMobile && (
              <button onClick={() => setMobileMenuOpen(prev => !prev)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#374151', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}>
                {mobileMenuOpen
                  ? <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 4L16 16M4 16L16 4" stroke="#374151" strokeWidth="2" strokeLinecap="round"/></svg>
                  : <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h14M3 15h14" stroke="#374151" strokeWidth="2" strokeLinecap="round"/></svg>
                }
              </button>
            )}
          </div>
        </div>

        {/* ── Mobile drawer ── */}
        {isMobile && mobileMenuOpen && (
          <div style={{ borderTop: '1px solid #E5E7EB', background: 'rgba(250,250,250,0.97)', padding: '8px 16px 16px' }}>
            {[['https://majorka.io/#features', 'Features'], ['https://majorka.io/#pricing', 'Pricing'], ['/sign-in', 'Log in']].map(([href, label]) => (
              <a key={label} href={href} onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', color: '#374151', textDecoration: 'none', fontSize: 15, fontWeight: 500, padding: '12px 8px', borderBottom: '1px solid #F3F4F6' }}>{label}</a>
            ))}
          </div>
        )}
      </nav>

      {/* ═══ HERO ══════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', paddingTop: 120, paddingBottom: 80, textAlign: 'center', overflow: 'hidden', background: '#FAFAFA' }}>
        {/* Gradient mesh blobs */}
        <div style={{ position: 'absolute', top: -200, left: -300, width: 600, height: 600, background: 'radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%)', animation: 'blobFloat 8s ease-in-out infinite alternate', animationDelay: '0s', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: 100, right: -200, width: 500, height: 500, background: 'radial-gradient(circle, rgba(139,92,246,0.10), transparent 70%)', animation: 'blobFloat 8s ease-in-out infinite alternate', animationDelay: '2s', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: -100, left: '40%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(6,182,212,0.08), transparent 70%)', animation: 'blobFloat 8s ease-in-out infinite alternate', animationDelay: '4s', pointerEvents: 'none', zIndex: 0 }} />

        {/* Inner content */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 720, margin: '0 auto', padding: '0 24px' }}>
          {/* Pill badge */}
          <div style={{ opacity: 0, animation: 'fadeIn 0.4s ease 0.1s both' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #E5E7EB', background: 'white', color: '#6B7280', fontSize: 13, padding: '6px 14px', borderRadius: 999, marginBottom: 24 }}>
              ✦ Built for Australian Dropshippers
            </span>
          </div>

          {/* H1 */}
          <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 'clamp(32px, 7vw, 72px)', lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 0', opacity: 0, animation: 'fadeInUp 0.5s ease 0.2s both', overflowWrap: 'break-word' as const, wordBreak: 'break-word' as const }}>
            The Only <span style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI Tool</span> That Finds
            <br />
            <span style={{ color: '#0A0A0A' }}>AU Winners Before Your Competitors Do.</span>
          </h1>

          {/* Subheading */}
          <p style={{ fontSize: 18, color: '#6B7280', maxWidth: 520, margin: '20px auto 0', lineHeight: 1.6, fontFamily: dm, opacity: 0, animation: 'fadeInUp 0.5s ease 0.3s both' }}>
            Real TikTok Shop data. Real AliExpress suppliers. Real-time market signals — all in one platform built for Australian dropshippers.
          </p>

          {/* CTA row */}
          <div className="hero-cta-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 36, opacity: 0, animation: 'fadeInUp 0.5s ease 0.4s both' }}>
            <Link href="/sign-up" style={{ background: '#6366F1', color: 'white', height: 48, padding: '0 28px', borderRadius: 10, fontWeight: 600, fontSize: 15, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', transition: 'background 150ms, transform 150ms' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#4F46E5'; e.currentTarget.style.transform = 'scale(1.02)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = '#6366F1'; e.currentTarget.style.transform = 'scale(1)'; }}>
              Start for Free →
            </Link>
            <button
              onClick={() => setShowDemo(true)}
              style={{ position: 'relative', background: 'transparent', color: '#0F172A', height: 48, padding: '0 24px 0 16px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10, transition: 'border-color 200ms, box-shadow 200ms', letterSpacing: '-0.01em' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(99,102,241,0.10)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {/* Animated play icon */}
              <span style={{ position: 'relative', width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {/* Pulse ring */}
                <span style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '2px solid rgba(99,102,241,0.35)', animation: 'demoPulse 2s ease-in-out infinite' }} />
                {/* Triangle play */}
                <svg width="10" height="12" viewBox="0 0 10 12" fill="none" style={{ marginLeft: 2 }}>
                  <path d="M1 1L9 6L1 11V1Z" fill="white" stroke="white" strokeWidth="1" strokeLinejoin="round"/>
                </svg>
              </span>
              Watch a Demo
            </button>
          </div>

          {/* Social proof */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 24, opacity: 0, animation: 'fadeIn 0.5s ease 0.5s both' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {[
                { initials: 'JM', bg: '#6366F1' },
                { initials: 'SR', bg: '#8B5CF6' },
                { initials: 'AK', bg: '#0891B2' },
                { initials: 'BT', bg: '#059669' },
                { initials: 'LP', bg: '#D97706' },
              ].map((av, i) => (
                <div key={av.initials} style={{ width: 32, height: 32, borderRadius: '50%', background: av.bg, border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', marginLeft: i === 0 ? 0 : -8, zIndex: 5 - i, position: 'relative' }}>
                  {av.initials}
                </div>
              ))}
            </div>
            <span style={{ fontSize: 13, color: '#6B7280', marginLeft: 12 }}>★★★★★ Trusted by 500+ AU dropshippers</span>
          </div>
        </div>

        {/* Browser mockup */}
        <div id="demo" style={{ marginTop: 80, padding: '0 24px', opacity: 0, animation: 'fadeInUp 0.7s ease 0.6s both' }}>
          <div ref={mockupRef} style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #E5E7EB', boxShadow: '0 40px 80px rgba(0,0,0,0.12), 0 0 0 1px #F5F5F5', transform: 'perspective(1200px) rotateX(4deg)', maxWidth: 900, margin: '0 auto' }}>
            {/* Browser title bar */}
            <div style={{ height: 44, background: '#F3F4F6', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 8 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#EF4444' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#F59E0B' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#22C55E' }} />
              <div style={{ flex: 1, margin: '0 12px', height: 28, background: 'white', border: '1px solid #E5E7EB', borderRadius: 6, display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 12, color: '#6B7280', fontFamily: 'monospace' }}>
                🔒 app.majorka.io/dashboard
              </div>
            </div>
            {/* Browser content */}
            <div style={{ background: 'white' }}>
              {/* Mini header */}
              <div style={{ background: '#FAFAFA', borderBottom: '1px solid #E5E7EB', padding: '12px 20px', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', flexDirection: isMobile ? 'column' as const : 'row' as const }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: '#FAFAFA' }}>Product Intelligence</span>
                <span style={{ fontSize: 12, color: '#6B7280' }}>🇦🇺 AU Market · Live Data</span>
              </div>
              {/* Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB' }}>
                    {['Product', 'Margin', 'Score', ''].map((h) => (
                      <th key={h} style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', padding: '8px 20px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { product: 'Air Fryer 11-in-1', margin: '58%', score: 75 },
                    { product: 'LED Strip Lights', margin: '61%', score: 82 },
                    { product: 'Smart Watch GPS', margin: '44%', score: 68 },
                  ].map((row) => {
                    const scoreBg = row.score >= 80 ? '#EEF2FF' : row.score >= 65 ? '#F3E8FF' : '#F9FAFB';
                    const scoreColor = row.score >= 80 ? '#6366F1' : row.score >= 65 ? '#7C3AED' : '#6B7280';
                    const scoreBorder = row.score >= 80 ? '#C7D2FE' : row.score >= 65 ? '#DDD6FE' : '#E5E7EB';
                    return (
                      <tr key={row.product} style={{ borderBottom: '1px solid #F3F4F6', fontSize: 13, color: '#374151' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#F5F3FF')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ padding: '10px 20px', fontWeight: 500 }}>{row.product}</td>
                        <td style={{ padding: '10px 20px' }}>{row.margin}</td>
                        <td style={{ padding: '10px 20px' }}>
                          <span style={{ background: scoreBg, color: scoreColor, border: `1px solid ${scoreBorder}`, fontWeight: 700, borderRadius: 6, padding: '3px 8px', fontSize: 12, animation: 'scorePulse 3s ease-in-out infinite' }}>{row.score}</span>
                        </td>
                        <td style={{ padding: '10px 20px' }}>
                          <button style={{ fontSize: 11, padding: '4px 10px', background: '#6366F1', color: 'white', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 500 }}>Build Store →</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TRUST BAR ════════════════════════════════════════════════════ */}
      <div style={{ padding: isMobile ? '28px 16px' : '48px 24px', borderTop: '1px solid #F3F4F6', borderBottom: '1px solid #F3F4F6', background: '#FAFAFA' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 24, marginBottom: 32 }}>
            <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
            <span style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 500, whiteSpace: 'nowrap', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Powering AU stores
            </span>
            <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 24 : 48, flexWrap: 'wrap' }}>
            {['Shopify', 'AliExpress', 'TikTok Shop', 'Meta Ads', 'Google Ads', 'DHL'].map(name => (
              <div key={name}
                style={{ fontSize: 15, fontWeight: 700, color: '#374151', opacity: 0.35, filter: 'grayscale(1)', transition: 'opacity 200ms', letterSpacing: '0', cursor: 'default', userSelect: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.65')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.35')}
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats, Weekly Winners, and Product Intelligence Preview removed — replaced by new light sections above */}

      {/* Trusted By section removed — redundant with Trust Bar above */}

      {/* Logo Strip removed — redundant with Trust Bar above */}

      {/* Meet Maya section removed — dark theme incompatible with light landing page */}

      {/* ═══ FEATURES — BENTO GRID ═══════════════════════════════════════ */}
      <BentoFeaturesSection />

      {/* ═══ HOW IT WORKS ════════════════════════════════════════════════ */}
      <HowItWorksSection />

      {/* ═══ DEMO (removed — dark section incompatible with light landing) ═══ */}

      {/* ═══ TESTIMONIALS — hidden until real ones collected ══════════════ */}
      {import.meta.env.DEV && (
        <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
          [Testimonials section — add real customer quotes here]
        </div>
      )}

      {/* ═══ COMPARISON TABLE ════════════════════════════════════════════ */}
      <section style={{ padding: '80px 24px', background: 'white' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', letterSpacing: '-0.025em', textAlign: 'center', marginBottom: 8, color: '#0A0A0A' }}>
            Why teams switch to Majorka
          </h2>
          <p style={{ textAlign: 'center', color: '#6B7280', fontSize: 15, marginBottom: 40, maxWidth: 520, margin: '0 auto 40px' }}>
            One platform replaces your entire stack — at a fraction of the cost.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: '#9CA3AF', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Feature</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', color: '#6366F1', fontSize: 13, fontWeight: 700 }}>Majorka</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', color: '#9CA3AF', fontSize: 13, fontWeight: 600 }}>Minea</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', color: '#9CA3AF', fontSize: 13, fontWeight: 600 }}>Sell The Trend</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', color: '#9CA3AF', fontSize: 13, fontWeight: 600 }}>Manual Research</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'AI Winning Product Score', majorka: true, minea: false, stt: false, manual: false },
                  { feature: 'TikTok Shop Data', majorka: true, minea: true, stt: false, manual: false },
                  { feature: 'AliExpress Supplier Match', majorka: true, minea: false, stt: true, manual: true },
                  { feature: 'Competitor Store Spy', majorka: true, minea: true, stt: true, manual: false },
                  { feature: 'AI Store Builder', majorka: true, minea: false, stt: false, manual: false },
                  { feature: 'AU Market Optimised', majorka: true, minea: false, stt: false, manual: false },
                  { feature: 'Profit Calculator', majorka: true, minea: false, stt: true, manual: true },
                  { feature: 'Free Plan Available', majorka: true, minea: false, stt: false, manual: true },
                ].map((row, i) => (
                  <tr key={row.feature} style={{ borderBottom: '1px solid #F3F4F6', background: i % 2 === 0 ? 'white' : '#FAFAFA' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 500, color: '#374151' }}>{row.feature}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>{row.majorka ? <span style={{ color: '#6366F1', fontWeight: 700 }}>✓</span> : <span style={{ color: '#D1D5DB' }}>—</span>}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>{row.minea ? <span style={{ color: '#22C55E' }}>✓</span> : <span style={{ color: '#D1D5DB' }}>—</span>}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>{row.stt ? <span style={{ color: '#22C55E' }}>✓</span> : <span style={{ color: '#D1D5DB' }}>—</span>}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>{row.manual ? <span style={{ color: '#22C55E' }}>✓</span> : <span style={{ color: '#D1D5DB' }}>—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═══ TRUST BADGES ══════════════════════════════════════════════════ */}
      <section style={{ padding: '32px 24px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '12px 32px' }}>
          {[
            { icon: '🔒', label: 'SSL Encrypted' },
            { icon: '🌍', label: 'Global Platform' },
            { icon: '💳', label: 'Cancel Anytime' },
            { icon: '🤝', label: '7-Day Money Back' },
          ].map((badge, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#6B7280', fontSize: 13, fontWeight: 500 }}>
              <span style={{ fontSize: 16 }}>{badge.icon}</span>
              <span>{badge.label}</span>
              {i < 3 && <span style={{ color: '#E5E7EB', paddingLeft: 20, display: 'none' }} className="hide-mobile">|</span>}
            </div>
          ))}
        </div>
      </section>

      {/* ═══ PRICING ═══════════════════════════════════════════════════════ */}
      <section id="pricing" style={{ padding: '100px 24px', background: '#FAFAFA' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 'clamp(1.6rem, 4.5vw, 3rem)', letterSpacing: '-0.025em', marginBottom: 12, color: '#0A0A0A' }}>
            Simple pricing. No surprises.
          </h2>
          <p style={{ color: '#6B7280', fontSize: 16, maxWidth: 460, margin: '0 auto 24px' }}>
            One platform replacing 6 tools at a fraction of the cost.
          </p>

          {/* Toggle */}
          <div style={{ display: 'inline-flex', alignItems: 'center', background: '#F5F5F5', borderRadius: 999, padding: 4, marginBottom: 48 }}>
            <button onClick={() => setAnnual(false)} style={{ padding: '7px 20px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: annual ? 400 : 600, background: annual ? 'transparent' : 'white', color: annual ? '#6B7280' : '#111111', boxShadow: annual ? 'none' : '0 1px 3px rgba(0,0,0,0.1)', transition: 'all 150ms' }}>Monthly</button>
            <button onClick={() => setAnnual(true)} style={{ padding: '7px 20px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: annual ? 600 : 400, background: annual ? 'white' : 'transparent', color: annual ? '#111111' : '#6B7280', boxShadow: annual ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 150ms', display: 'flex', alignItems: 'center', gap: 8 }}>
              Annual <span style={{ background: '#D1FAE5', color: '#059669', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 999 }}>Save 20%</span>
            </button>
          </div>

          {/* Cards */}
          <div ref={pricingCardsRef} className="grid-1-mobile" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? 12 : 24, textAlign: 'left' }}>
            {/* Free */}
            <div data-pricing-card style={{ opacity: 0, transform: 'translateY(20px)', transition: 'opacity 400ms, transform 400ms', background: 'white', border: '1px solid #E5E7EB', borderRadius: 20, padding: 32 }}>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#6B7280', marginBottom: 16 }}>Free</div>
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: isMobile ? 34 : 56, fontWeight: 800, fontFamily: "'Bricolage Grotesque', sans-serif", color: '#0A0A0A', lineHeight: 1 }}>$0</span>
                <span style={{ fontSize: 16, color: '#6B7280', marginLeft: 4 }}>/month</span>
              </div>
              <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>Get started with essential tools.</p>
              <div style={{ height: 1, background: '#F3F4F6', margin: '24px 0' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { text: '10 product searches/day', on: true },
                  { text: 'Basic store builder (1 store)', on: true },
                  { text: 'Market filters (7 regions)', on: true },
                  { text: 'Product Intelligence', on: false },
                  { text: 'Competitor Spy Tools', on: false },
                  { text: 'Priority support', on: false },
                ].map(f => (
                  <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#374151' }}>
                    <span style={{ color: f.on ? '#6366F1' : '#D1D5DB', fontSize: 16, fontWeight: 700 }}>{f.on ? '✓' : '—'}</span>
                    <span style={{ color: f.on ? '#374151' : '#9CA3AF' }}>{f.text}</span>
                  </div>
                ))}
              </div>
              <Link href="/sign-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: 10, fontWeight: 600, fontSize: 15, width: '100%', cursor: 'pointer', transition: 'all 150ms', marginTop: 28, background: 'white', border: '1px solid #E5E7EB', color: '#374151', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                onMouseLeave={e => (e.currentTarget.style.background = 'white')}
              >Start Free</Link>
            </div>

            {/* Builder — Most Popular */}
            <div data-pricing-card style={{ opacity: 0, transform: 'translateY(20px)', transition: 'opacity 400ms, transform 400ms', background: 'white', border: '2px solid #6366F1', borderRadius: 20, padding: 32, boxShadow: '0 0 0 4px rgba(99,102,241,0.08), 0 24px 48px rgba(99,102,241,0.12)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#6366F1', color: 'white', fontSize: 12, fontWeight: 700, padding: '5px 16px', borderRadius: 999, whiteSpace: 'nowrap' }}>⭐ Most Popular</div>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#6B7280', marginBottom: 16 }}>Builder</div>
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: isMobile ? 34 : 56, fontWeight: 800, fontFamily: "'Bricolage Grotesque', sans-serif", color: '#0A0A0A', lineHeight: 1 }}>${annual ? 79 : 99}</span>
                <span style={{ fontSize: 16, color: '#6B7280', marginLeft: 4 }}>/month</span>
              </div>
              {annual && <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>billed ${79 * 12} annually</div>}
              <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>Everything you need to run a winning store.</p>
              <div style={{ height: 1, background: '#F3F4F6', margin: '24px 0' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { text: 'Unlimited product searches', on: true },
                  { text: 'AI store builder (unlimited)', on: true },
                  { text: 'Full Product Intelligence', on: true },
                  { text: 'Market trend data', on: true },
                  { text: 'Email support', on: true },
                  { text: 'Competitor Spy Tools', on: false },
                ].map(f => (
                  <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#374151' }}>
                    <span style={{ color: f.on ? '#6366F1' : '#D1D5DB', fontSize: 16, fontWeight: 700 }}>{f.on ? '✓' : '—'}</span>
                    <span style={{ color: f.on ? '#374151' : '#9CA3AF' }}>{f.text}</span>
                  </div>
                ))}
              </div>
              <Link href="/sign-up?plan=builder" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: 10, fontWeight: 600, fontSize: 15, width: '100%', cursor: 'pointer', transition: 'all 150ms', marginTop: 28, background: '#6366F1', color: 'white', border: 'none', textDecoration: 'none', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#4F46E5')}
                onMouseLeave={e => (e.currentTarget.style.background = '#6366F1')}
              >Start Free Trial</Link>
            </div>

            {/* Scale */}
            <div data-pricing-card style={{ opacity: 0, transform: 'translateY(20px)', transition: 'opacity 400ms, transform 400ms', background: 'white', border: '1px solid #E5E7EB', borderRadius: 20, padding: 32 }}>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#6B7280', marginBottom: 16 }}>Scale</div>
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: isMobile ? 34 : 56, fontWeight: 800, fontFamily: "'Bricolage Grotesque', sans-serif", color: '#0A0A0A', lineHeight: 1 }}>${annual ? 159 : 199}</span>
                <span style={{ fontSize: 16, color: '#6B7280', marginLeft: 4 }}>/month</span>
              </div>
              {annual && <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>billed ${159 * 12} annually</div>}
              <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>For serious operators who need full control.</p>
              <div style={{ height: 1, background: '#F3F4F6', margin: '24px 0' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { text: 'Everything in Builder', on: true },
                  { text: 'Competitor Spy Tools', on: true },
                  { text: 'Shop Intelligence', on: true },
                  { text: 'API access', on: true },
                  { text: 'Priority support', on: true },
                  { text: 'Custom reporting', on: true },
                ].map(f => (
                  <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#374151' }}>
                    <span style={{ color: f.on ? '#6366F1' : '#D1D5DB', fontSize: 16, fontWeight: 700 }}>{f.on ? '✓' : '—'}</span>
                    <span style={{ color: f.on ? '#374151' : '#9CA3AF' }}>{f.text}</span>
                  </div>
                ))}
              </div>
              <Link href="/sign-up?plan=scale" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: 10, fontWeight: 600, fontSize: 15, width: '100%', cursor: 'pointer', transition: 'all 150ms', marginTop: 28, background: '#0A0A0A', color: 'white', border: 'none', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#1A1A1A')}
                onMouseLeave={e => (e.currentTarget.style.background = '#0A0A0A')}
              >Start Free Trial</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ════════════════════════════════════════════════════════════ */}
      <section id="faq" style={{ padding: isMobile ? '40px 16px' : '80px 24px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} style={{ fontFamily: syne, fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', letterSpacing: '-0.025em', textAlign: 'center', marginBottom: 48 }}>
            Common questions.
          </motion.h2>
          {FAQ.map((item, i) => <FAQItem key={i} q={item.q} a={item.a} />)}
        </div>
      </section>

      {/* ═══ EMAIL CAPTURE ═════════════════════════════════════════════════ */}
      <section id="guide" style={{ padding: isMobile ? '40px 16px' : '80px 24px', background: '#FAFAFA', borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }} style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontFamily: syne, fontWeight: 800, fontSize: 'clamp(1.4rem, 3.5vw, 2.2rem)', letterSpacing: '-0.025em', marginBottom: 12 }}>Free resources. No catch.</h2>
            <p style={{ color: C.secondary, fontSize: 16, maxWidth: 460, margin: '0 auto' }}>Get our product research playbook and weekly trending products — straight to your inbox.</p>
          </motion.div>
          <EmailCapture />
        </div>
      </section>

      {/* ═══ FINAL CTA ═════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', padding: '120px 24px', textAlign: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', width: 900, height: 500, marginTop: -250, marginLeft: -450, background: 'radial-gradient(ellipse, rgba(99,102,241,0.07) 0%, transparent 70%)', animation: 'gold-pulse 4s ease-in-out infinite', pointerEvents: 'none' }} />
        <div className="particle-grid" style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 640, margin: '0 auto' }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
            <h2 style={{ fontFamily: syne, fontWeight: 800, fontSize: 'clamp(1.8rem, 5vw, 3.5rem)', letterSpacing: '-0.03em', marginBottom: 20, lineHeight: 1.1 }}>
              Your competitors are already using AI. <span className="gold-text">Are you?</span>
            </h2>
            <p style={{ color: C.secondary, fontSize: 'clamp(15px, 2vw, 18px)', marginBottom: 44, lineHeight: 1.65 }}>
              Start free. No credit card. Upgrade when you're ready.
            </p>
            <div className="stack-mobile" style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
              <Link
                href="/sign-in"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 14, padding: '18px 52px', fontFamily: syne, fontWeight: 800, fontSize: 'clamp(15px, 2vw, 18px)', textDecoration: 'none', boxShadow: `0 0 60px rgba(99,102,241,0.35), 0 4px 24px rgba(0,0,0,0.3)`, minHeight: 56, minWidth: 200, transition: 'transform 0.2s, box-shadow 0.2s' }}
                className="btn-shimmer"
                onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-3px)'; el.style.boxShadow = '0 0 80px rgba(99,102,241,0.5), 0 8px 32px rgba(0,0,0,0.4)'; }}
                onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.transform = ''; el.style.boxShadow = '0 0 60px rgba(99,102,241,0.35), 0 4px 24px rgba(0,0,0,0.3)'; }}
              >
                Get Started Free →
              </Link>
            </div>
            <SocialProofCounter />
          </motion.div>
        </div>
      </section>

      {/* ═══ FLOATING CTA ═══════════════════════════════════════════════════ */}
      <FloatingCTA />

      {/* ═══ FOOTER ════════════════════════════════════════════════════════ */}
      <footer style={{ background: '#0A0A0A', padding: '80px 24px 40px', color: '#6B7280' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '0 16px' : '0 24px' }}>
          <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: isMobile ? 24 : 48, marginBottom: 64 }}>
            {/* Col 1: Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <img src="/majorka-logo.jpg" alt="Majorka" width={36} height={36} style={{ width: 36, height: 36, objectFit: 'contain', display: 'block', borderRadius: 10, flexShrink: 0 }} draggable={false} />
                <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 18, color: 'white', letterSpacing: '-0.02em' }}>Majorka</span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: '#6B7280', maxWidth: 240, marginBottom: 24 }}>The AI OS for AU ecommerce. Find winners, build stores, scale fast.</p>
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
            {/* Col 2: Product */}
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 16, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Product</h4>
              {[
                { label: 'Features', href: 'https://majorka.io/#features' },
                { label: 'Pricing', href: '/pricing' },
                { label: 'Store Builder', href: '/store-builder' },
                { label: 'Product Intelligence', href: '/app/intelligence' },
                { label: 'Competitor Spy', href: '/app/spy' },
              ].map(link => (
                <a key={link.label} href={link.href} style={{ display: 'block', fontSize: 14, color: '#6B7280', marginBottom: 10, textDecoration: 'none', transition: 'color 150ms' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}
                >{link.label}</a>
              ))}
            </div>
            {/* Col 3: Company */}
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 16, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Company</h4>
              {[
                { label: 'Academy', href: '/app/learn' },
                { label: 'Affiliate', href: '/app/affiliate' },
                { label: 'Contact', href: 'mailto:hello@majorka.io' },
              ].map(link => (
                <a key={link.label} href={link.href} style={{ display: 'block', fontSize: 14, color: '#6B7280', marginBottom: 10, textDecoration: 'none', transition: 'color 150ms' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}
                >{link.label}</a>
              ))}
            </div>
            {/* Col 4: Legal */}
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
            <span style={{ fontSize: 13, color: '#4B4B57' }}>🌍 Global Platform · 7 Markets</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
