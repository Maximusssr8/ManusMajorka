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
  background-image: radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px);
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
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: #94949e; text-decoration: none; font-size: 14px; font-weight: 700;
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
  .nav-inner     { height: 56px !important; padding: 0 16px !important; overflow: hidden !important; }
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
  bg: '#080a0e',
  card: '#0d1117',
  elevated: '#131620',
  border: 'rgba(255,255,255,0.06)',
  borderHover: 'rgba(99,102,241,0.25)',
  text: '#f5f5f5',
  secondary: '#94949e',
  muted: '#52525b',
  gold: '#6366F1',
  goldLight: '#A5B4FC',
  goldDim: 'rgba(99,102,241,0.08)',
  goldBorder: 'rgba(99,102,241,0.25)',
  green: '#22c55e',
  red: '#ef4444',
};

const syne = 'Syne, sans-serif';
const dm = "'DM Sans', sans-serif";

// ── Data ──────────────────────────────────────────────────────────────────────

const STATS_BASE = [
  { key: 'sellers', end: 2400, suffix: '+', prefix: '', label: 'Active Sellers', icon: Users, live: true, tickEvery: 30000, tickBy: 1 },
  { key: 'revenue', end: 4200000, suffix: 'M+', prefix: '$', label: 'Revenue Generated', icon: DollarSign, live: true, tickEvery: 45000, tickBy: 2500, display: (n: number) => `$${(n / 1000000).toFixed(1)}M+` },
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
    sub: 'Real AUD numbers',
    desc: 'Enter your buy price, sell price, and market. Maya calculates net margin, break-even CPA, and ad budget — with AU shipping, GST, and platform fees built in.',
    accent: '#6366F1',
    stat: '98% AU market accuracy',
  },
  {
    Icon: Zap,
    title: 'Generate ad campaigns ready to run',
    sub: 'Copy, creative angles, everything',
    desc: 'Get 5 Facebook/TikTok ad variations with hooks, body copy, and creative direction — written for AU audiences, ready to upload to Ads Manager.',
    accent: '#22c55e',
    stat: '5 ad angles per product',
  },
  {
    Icon: Users,
    title: 'Spy on competitors before they spy on you',
    sub: 'Full competitive intelligence',
    desc: 'See exactly what products any AU dropshipping store is running, their ad spend signals, price changes, and top-selling SKUs. Enter a domain, get the full playbook.',
    accent: '#8B5CF6',
    stat: '50K+ AU stores tracked',
  },
  {
    Icon: DollarSign,
    title: 'Know your margins before you spend a cent',
    sub: 'AUD-native profit calculator',
    desc: 'Full AU cost stack: AliExpress price, AusPost rates, Shopify fees, GST, and ad CPA. Enter your numbers, get your real take-home margin — with break-even ROAS built in.',
    accent: '#6366F1',
    stat: 'GST + AusPost included',
  },
  {
    Icon: Package,
    title: 'Built entirely for the Australian market',
    sub: 'Not a US tool with an AU flag',
    desc: 'AUD pricing, AusPost rates, local supplier network, GST compliance, and Australian consumer trends baked in at every layer. This is what AU-first actually means.',
    accent: '#22c55e',
    stat: '100% AU-focused',
  },
];

const TESTIMONIALS_SHOW = [
  { quote: 'Made $4,200 in my first month using Majorka\'s winning products feed. The AU-specific data is what makes it different.', name: 'Jordan K.', city: 'Gold Coast, QLD', flag: '🇦🇺', plan: 'Builder Plan', stars: 5 },
  { quote: 'Finally a tool that understands Australian shipping costs. The profit calculator alone saved me from 3 bad decisions.', name: 'Sarah M.', city: 'Sydney, NSW', flag: '🇦🇺', plan: 'Builder Plan', stars: 5 },
  { quote: 'The TikTok trend detection is scary accurate. I got into posture correctors 2 weeks before they blew up.', name: 'Marcus T.', city: 'Melbourne, VIC', flag: '🇦🇺', plan: 'Builder Plan', stars: 5 },
  { quote: 'Competitor spy is 🔥. I can see exactly what other stores are selling and undercut them before they know what happened.', name: 'Priya S.', city: 'Brisbane, QLD', flag: '🇦🇺', plan: 'Scale Plan', stars: 5 },
  { quote: 'Used 3 other tools before Majorka. This is the only one that actually knows Australia — AusPost rates, GST, Afterpay.', name: 'Tom W.', city: 'Perth, WA', flag: '🇦🇺', plan: 'Builder Plan', stars: 5 },
  { quote: 'The AI ad copy writes better than I do. My Facebook CTR went from 1.2% to 3.8% using Majorka\'s templates.', name: 'Emma L.', city: 'Adelaide, SA', flag: '🇦🇺', plan: 'Scale Plan', stars: 5 },
];

const FAQ = [
  { q: 'Is Majorka built for sellers worldwide?', a: 'Yes. Majorka detects your timezone and currency automatically, serving sellers in Australia (AUD), UK (GBP), Europe (EUR), and the US (USD). Every tool adapts to your local market — shipping carriers, compliance, language, and pricing.' },
  { q: 'What makes this different from other AI tools?', a: 'Most tools are US-centric. Majorka supports multi-currency pricing, global shipping carriers, regional compliance, and local payment methods (Afterpay, Klarna, Zip, Stripe). No more converting USD or adapting American advice.' },
  { q: 'Can I cancel anytime?', a: 'Yes, absolutely. No lock-in contracts. Cancel from your dashboard anytime. You retain access until the end of your billing period.' },
  { q: 'Do you support Shopify?', a: 'Yes. Website Generator exports production-ready Shopify Liquid theme files as a ZIP. All landing pages include trust signals, local payment badges, and mobile-optimised layouts ready for your store.' },
  { q: 'Is there a free trial?', a: 'Yes. The Starter plan is free forever with 5 AI credits per day and access to core tools. Paid plans include a 7-day free trial with no credit card required.' },
];

const LOGO_STRIP = ['Shopify', 'AliExpress', 'Meta', 'Google', 'TikTok', 'Australia Post', 'Stripe', 'Klarna', 'Afterpay', 'Amazon', 'Canva'];

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
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 100, padding: '6px 18px' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.green, animation: 'pulse-ring 2s ease-in-out infinite' }} />
      <span style={{ fontSize: 13, fontWeight: 600, color: C.green }}>Join {count.toLocaleString()}+ sellers worldwide using Majorka</span>
    </div>
  );
}

function StatsBar() {
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
    <section ref={ref as React.RefCallback<HTMLElement>} style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '64px 24px', overflowX: 'hidden' }}>
      <div className="grid-2-mobile" style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, textAlign: 'center' }}>
        {STATS_BASE.map((stat, i) => {
          const Icon = stat.icon;
          const currentVal = liveValues[stat.key] ?? stat.end;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }} transition={{ delay: i * 0.1, duration: 0.5, ease: 'easeOut' }} style={{ padding: '16px 8px', position: 'relative' }}>
              {i < STATS_BASE.length - 1 && <div style={{ position: 'absolute', right: 0, top: '20%', bottom: '20%', width: 1, background: 'rgba(255,255,255,0.06)' }} className="hide-mobile" />}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 10, background: C.goldDim, border: `1px solid ${C.goldBorder}`, margin: '0 auto 12px', position: 'relative' }}>
                <Icon size={18} color={C.gold} />
                {stat.live && <div style={{ position: 'absolute', top: -3, right: -3, width: 8, height: 8, borderRadius: '50%', background: C.green, animation: 'pulse-ring 2s ease-in-out infinite' }} />}
              </div>
              <div style={{ fontFamily: syne, fontWeight: 900, fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', color: C.gold, lineHeight: 1.1, marginBottom: 6 }}>
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
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${C.border}`, overflow: 'hidden' }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', minHeight: 48 }}>
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
      <div style={{ background: C.elevated, border: `1px solid ${C.goldBorder}`, borderRadius: 20, padding: '48px 32px', textAlign: 'center', maxWidth: 560, margin: '0 auto' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h3 style={{ fontFamily: syne, fontWeight: 800, fontSize: 22, color: C.text, marginBottom: 12 }}>You're in! Check your inbox.</h3>
        <p style={{ color: C.secondary, fontSize: 15, lineHeight: 1.6 }}>While you wait, <Link href="/app" style={{ color: C.gold, textDecoration: 'underline' }}>try the tools free →</Link></p>
      </div>
    );
  }

  return (
    <div style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 20, padding: '48px 32px', maxWidth: 560, margin: '0 auto', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: C.goldDim, border: `1px solid ${C.goldBorder}`, borderRadius: 100, padding: '5px 14px', marginBottom: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.gold }}>FREE PRODUCT GUIDE</span>
        </div>
        <h3 style={{ fontFamily: syne, fontWeight: 800, fontSize: 22, color: C.text, marginBottom: 8 }}>Get the Product Research Playbook</h3>
        <p style={{ color: C.secondary, fontSize: 14, lineHeight: 1.6 }}>How top sellers find $10K/mo products + weekly trending product alerts. Free, no spam.</p>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input type="text" placeholder="First name (optional)" value={name} onChange={(e) => setName(e.target.value)} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 16px', color: C.text, fontSize: 14, fontFamily: dm, outline: 'none', minHeight: 48 }} />
        <input type="email" placeholder="Your email address" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 16px', color: C.text, fontSize: 14, fontFamily: dm, outline: 'none', minHeight: 48 }} />
        <button type="submit" disabled={status === 'loading'} style={{ background: `linear-gradient(135deg, ${C.gold}, #4F46E5)`, color: '#000', borderRadius: 10, padding: '14px 20px', fontFamily: syne, fontWeight: 800, fontSize: 15, border: 'none', cursor: status === 'loading' ? 'wait' : 'pointer', opacity: status === 'loading' ? 0.7 : 1, transition: 'opacity 0.2s', minHeight: 48 }}>
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
  { name: 'Ninja Creami 7-in-1', revenue: '$28,400', badge: '🔥', blur: 0 },
  { name: 'Heatless Curl Kit',   revenue: '$21,800', badge: '📈', blur: 1 },
  { name: 'Pet Hair Remover',    revenue: '$19,600', badge: '🚀', blur: 3 },
  { name: 'Posture Corrector',   revenue: '$18,500', badge: '⚡', blur: 6 },
  { name: 'LED Face Mask Pro',   revenue: '$17,800', badge: '🔥', blur: 10 },
];

function WeeklyWinnersSection() {
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
            Real revenue data. Real opportunities. Before your competitors find them.
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 16 }}>{prod.badge}</span>
                  {i === 0 && <span style={{ fontSize: 10, fontWeight: 700, background: C.goldDim, color: C.gold, border: `1px solid ${C.goldBorder}`, borderRadius: 6, padding: '2px 6px', fontFamily: syne }}>#{i + 1}</span>}
                </div>
                <div style={{ fontFamily: syne, fontWeight: 800, fontSize: 13, color: C.text, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {prod.name}
                </div>
                <div style={{ fontFamily: syne, fontWeight: 900, fontSize: 16, color: C.gold }}>{prod.revenue}</div>
                <div style={{ fontSize: 10, color: C.secondary, marginTop: 2 }}>/day revenue</div>
              </div>
            );
          })}
        </div>

        {/* Form */}
        {status === 'success' ? (
          <div style={{ textAlign: 'center', padding: '28px 24px', background: C.elevated, border: `1px solid ${C.goldBorder}`, borderRadius: 16, maxWidth: 600, margin: '0 auto' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
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
                style={{ flex: '1 1 260px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 18px', color: C.text, fontSize: 15, fontFamily: dm, outline: 'none', minHeight: 52 }}
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
        <span className="hide-mobile">🔥 Join 2,400+ AU sellers · Find your first winner →</span>
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
    desc: 'Discover the exact products trending in the AU market right now. Real revenue data, supplier links, and competitor analysis — updated daily.',
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
    desc: 'Real-time AU market data. Know what is selling, where demand is spiking, and which niches are about to blow up.',
    gridColumn: '2 / 3', gridRow: '2 / 3',
  },
  {
    key: 'E', Icon: DollarSign, title: 'Profit Calculator',
    desc: 'Enter your product cost and ad spend, get exact margins, ROAS targets, and break-even CPA — before you spend a dollar.',
    gridColumn: '1 / 2', gridRow: '3 / 4',
  },
  {
    key: 'F', title: '\u{1F1E6}\u{1F1FA} AU-First Data',
    desc: 'Every signal, trend, and supplier link is filtered for the Australian market. No US noise. Just AU opportunities.',
    gridColumn: '2 / 3', gridRow: '3 / 4',
  },
  {
    key: 'G', Icon: Megaphone, title: 'Ad Intelligence',
    desc: 'Find winning ad creatives across Meta and TikTok. See spend estimates, engagement, and hook formulas that work in AU.',
    gridColumn: '3 / 4', gridRow: '3 / 4',
  },
];

function BentoFeaturesSection() {
  const gridRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [progressWidth, setProgressWidth] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const el = progressRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setTimeout(() => setProgressWidth(72), 300); obs.disconnect(); }
    }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const brico = "'Bricolage Grotesque', sans-serif";

  const cardBase: React.CSSProperties = {
    background: 'white', border: '1px solid #E5E7EB', borderRadius: 16, padding: 32,
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'default',
  };

  const handleEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    el.style.transform = 'translateY(-3px)';
    el.style.boxShadow = '0 12px 32px rgba(0,0,0,0.08)';
    el.style.borderColor = 'rgba(99,102,241,0.25)';
  };
  const handleLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    el.style.transform = '';
    el.style.boxShadow = '';
    el.style.borderColor = '#E5E7EB';
  };

  return (
    <section id="features" style={{ padding: '100px 24px', background: '#FAFAFA' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontFamily: brico, fontWeight: 800, fontSize: 'clamp(28px,5vw,48px)', color: '#0A0A0A' }}>Everything you need to win</h2>
          <p style={{ fontSize: 17, color: '#6B7280', maxWidth: 560, margin: '12px auto 0' }}>One platform. Every tool an AU dropshipper actually needs.</p>
        </div>

        <div ref={gridRef} className="bento-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: 'auto auto auto', gap: 20 }}>
          {BENTO_CARDS.map((card, index) => {
            const IconComp = card.Icon;
            return (
              <div
                key={card.key}
                style={{
                  ...cardBase,
                  gridColumn: card.gridColumn,
                  gridRow: card.gridRow,
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(24px)',
                  transition: `opacity 500ms ease ${index * 60}ms, transform 500ms ease ${index * 60}ms, box-shadow 200ms, border-color 200ms`,
                }}
                onMouseEnter={handleEnter}
                onMouseLeave={handleLeave}
              >
                {/* Icon */}
                <div style={{ width: 40, height: 40, background: '#EEF2FF', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  {IconComp ? <IconComp size={20} color="#6366F1" /> : <span style={{ fontSize: 18 }}>{'\u{1F1E6}\u{1F1FA}'}</span>}
                </div>
                <h3 style={{ fontFamily: brico, fontWeight: 700, fontSize: 20, color: '#0A0A0A', marginBottom: 8 }}>{card.title}</h3>
                <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.65 }}>{card.desc}</p>

                {/* Card A — mini table */}
                {card.key === 'A' && (
                  <div style={{ marginTop: 20, border: '1px solid #F3F4F6', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 0 }}>
                      <div style={{ background: '#F9FAFB', padding: '8px 16px', fontSize: 11, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Product</div>
                      <div style={{ background: '#F9FAFB', padding: '8px 16px', fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Revenue</div>
                      <div style={{ background: '#F9FAFB', padding: '8px 16px', fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Score</div>
                      <div style={{ padding: '10px 16px', fontSize: 13, color: '#374151', borderTop: '1px solid #F3F4F6' }}>Air Fryer 11-in-1</div>
                      <div style={{ padding: '10px 16px', fontSize: 13, color: '#374151', borderTop: '1px solid #F3F4F6' }}>$8.7k/mo</div>
                      <div style={{ padding: '10px 16px', borderTop: '1px solid #F3F4F6' }}>
                        <span style={{ background: '#F3E8FF', color: '#7C3AED', border: '1px solid #DDD6FE', borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>75</span>
                      </div>
                      <div style={{ padding: '10px 16px', fontSize: 13, color: '#374151', borderTop: '1px solid #F3F4F6' }}>LED Strip Lights</div>
                      <div style={{ padding: '10px 16px', fontSize: 13, color: '#374151', borderTop: '1px solid #F3F4F6' }}>$24.2k/mo</div>
                      <div style={{ padding: '10px 16px', borderTop: '1px solid #F3F4F6' }}>
                        <span style={{ background: '#EEF2FF', color: '#6366F1', border: '1px solid #C7D2FE', borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>82</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Card B — progress checklist */}
                {card.key === 'B' && (
                  <div ref={progressRef} style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { done: true, text: 'Niche identified: Pet accessories' },
                      { done: true, text: 'Shopify store created' },
                      { done: true, text: 'Hero product imported' },
                      { done: false, spinning: true, text: 'Generating product descriptions...' },
                      { done: false, text: 'Setting up payment gateway' },
                      { done: false, text: 'Publishing store' },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                        <span style={{ fontSize: 14, color: item.done ? '#10B981' : (item as any).spinning ? '#6366F1' : '#D1D5DB' }}>
                          {item.done ? '\u2705' : (item as any).spinning ? '\u27F3' : '\u2610'}
                        </span>
                        <span style={{ color: item.done ? '#374151' : (item as any).spinning ? '#6366F1' : '#9CA3AF' }}>{item.text}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: '#9CA3AF' }}>
                        <span>Building store...</span><span>72%</span>
                      </div>
                      <div style={{ height: 6, background: '#F3F4F6', borderRadius: 999 }}>
                        <div style={{ height: '100%', width: `${progressWidth}%`, background: 'linear-gradient(90deg, #6366F1, #8B5CF6)', borderRadius: 999, transition: 'width 1.5s ease' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── How It Works ──────────────────────────────────────────────────────────────
function HowItWorksSection() {
  const brico = "'Bricolage Grotesque', sans-serif";
  const steps = [
    { Icon: Search, title: 'Find a Winner', desc: 'Browse trending AU products with real revenue data and supplier links.' },
    { Icon: Zap, title: 'Build Your Store', desc: 'Describe your niche. AI builds your entire Shopify store in under 60 seconds.' },
    { Icon: TrendingUp, title: 'Launch & Scale', desc: 'Run spy tools, monitor competitors, and optimise with the profit calculator.' },
  ];

  return (
    <section style={{ background: '#FAFAFA', padding: '100px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <h2 style={{ fontFamily: brico, fontWeight: 800, fontSize: 'clamp(28px,5vw,44px)', color: '#0A0A0A' }}>How it works</h2>
          <p style={{ fontSize: 16, color: '#6B7280', marginTop: 12 }}>From zero to first sale — faster than you think.</p>
        </div>

        <div className="hiw-steps" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: 0, position: 'relative' }}>
          {/* Connector line */}
          <div className="hide-mobile" style={{ position: 'absolute', top: 28, left: '16.67%', right: '16.67%', height: 1, borderTop: '1px dashed #E5E7EB', zIndex: 0 }} />

          {steps.map((step, i) => {
            const StepIcon = step.Icon;
            return (
              <div key={i} style={{ flex: 1, textAlign: 'center', padding: '0 24px', position: 'relative' }}>
                {/* Big background number */}
                <div style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', fontSize: 72, fontWeight: 900, color: '#F3F4F6', lineHeight: 1, userSelect: 'none', zIndex: 0 }}>
                  0{i + 1}
                </div>
                {/* Icon circle */}
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#EEF2FF', border: '2px solid #C7D2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', position: 'relative', zIndex: 1 }}>
                  <StepIcon size={24} color="#6366F1" />
                </div>
                <h3 style={{ fontFamily: brico, fontWeight: 700, fontSize: 18, color: '#0A0A0A', marginBottom: 8 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, maxWidth: 220, margin: '0 auto' }}>{step.desc}</p>
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
  { rank: 1, product: 'Posture Corrector Pro', revenue: '$41,200', orders: '528', margin: '62%', score: 91 },
  { rank: 2, product: 'LED Strip Lights RGB', revenue: '$24,200', orders: '312', margin: '61%', score: 82 },
  { rank: 3, product: 'Air Fryer 11-in-1', revenue: '$8,700', orders: '48', margin: '58%', score: 75 },
  { rank: 4, product: 'Smart Watch GPS', revenue: '$5,400', orders: '49', margin: '44%', score: 68 },
  { rank: 5, product: 'Resistance Band Set', revenue: '$3,100', orders: '38', margin: '31%', score: 54 },
];

function getScoreStyle(score: number) {
  if (score >= 80) return { background: 'rgba(99,102,241,0.2)', color: '#A5B4FC', border: '1px solid rgba(99,102,241,0.3)' };
  if (score >= 65) return { background: 'rgba(139,92,246,0.15)', color: '#C4B5FD', border: '1px solid rgba(139,92,246,0.25)' };
  return { background: 'rgba(107,114,128,0.15)', color: '#9CA3AF', border: '1px solid rgba(107,114,128,0.2)' };
}

function DemoSection() {
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
                  color: activeTab === tab.key ? '#111827' : '#6B7280',
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
                      {['#', 'Product', 'Revenue/mo', 'Orders', 'Margin', 'Score', ''].map(h => (
                        <th key={h} style={{ padding: '10px 20px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', textAlign: 'left', fontWeight: 600 }}>{h}</th>
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
                          <td style={{ padding: '12px 20px' }}>{row.revenue}</td>
                          <td style={{ padding: '12px 20px' }}>{row.orders}</td>
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

// ── Main Home ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [annual, setAnnual] = useState(false);
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
        title="Majorka — AI Ecommerce OS for Australian Dropshippers"
        description="Find winning products, build Shopify stores and launch AU dropshipping campaigns with AI. Trusted by 2,400+ AU sellers."
        path="/"
        ogImage="/og-image.svg"
      />
      <style>{GLOBAL_STYLES}</style>

      {/* ═══ NAV ═══════════════════════════════════════════════════════════ */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(250,250,250,0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(229,231,235,0.8)', boxShadow: navShadow ? '0 1px 12px rgba(0,0,0,0.08)' : 'none', transition: 'box-shadow 0.3s' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 max(calc((100vw - 1200px) / 2), 24px)', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Left: wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 13, color: '#fff' }}>M</div>
            <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 16, color: '#111827' }}>MAJORKA</span>
          </div>
          {/* Center: nav links */}
          <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {[['#features', 'Features'], ['#pricing', 'Pricing'], ['/dropshipping-australia', 'Blog'], ['/docs', 'Docs']].map(([href, label]) => (
              <a key={label} href={href} style={{ color: '#374151', textDecoration: 'none', fontSize: 14, padding: '0 4px', margin: '0 12px', transition: 'color 150ms' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#6366F1')} onMouseLeave={(e) => (e.currentTarget.style.color = '#374151')}>{label}</a>
            ))}
          </div>
          {/* Right: auth */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/sign-in" className="hide-mobile" style={{ color: '#374151', textDecoration: 'none', fontSize: 14 }}>Log in</Link>
            <Link href="/app" style={{ background: '#6366F1', color: '#fff', borderRadius: 8, padding: '8px 18px', fontWeight: 600, fontSize: 14, textDecoration: 'none', display: 'inline-block' }}>
              Start Free →
            </Link>
            {/* Mobile hamburger */}
            <button className="hide-desktop" onClick={() => setMobileMenuOpen(prev => !prev)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#374151', padding: '4px 0', lineHeight: 1 }}>☰</button>
          </div>
        </div>
        {/* Mobile drawer */}
        {mobileMenuOpen && (
          <div className="hide-desktop" style={{ borderTop: '1px solid #E5E7EB', background: 'rgba(250,250,250,0.95)', padding: '12px 24px', display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[['#features', 'Features'], ['#pricing', 'Pricing'], ['/dropshipping-australia', 'Blog'], ['/docs', 'Docs']].map(([href, label]) => (
              <a key={label} href={href} onClick={() => setMobileMenuOpen(false)} style={{ color: '#374151', textDecoration: 'none', fontSize: 15, padding: '12px 0', borderBottom: '1px solid #F3F4F6' }}>{label}</a>
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
              ✦ Built exclusively for Australian Dropshippers
            </span>
          </div>

          {/* H1 */}
          <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 'clamp(40px, 8vw, 72px)', lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 0', opacity: 0, animation: 'fadeInUp 0.5s ease 0.2s both' }}>
            The <span style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI Operating System</span>
            <br />
            <span style={{ color: '#0A0A0A' }}>for Ecommerce Winners.</span>
          </h1>

          {/* Subheading */}
          <p style={{ fontSize: 18, color: '#6B7280', maxWidth: 520, margin: '20px auto 0', lineHeight: 1.6, fontFamily: dm, opacity: 0, animation: 'fadeInUp 0.5s ease 0.3s both' }}>
            Find winning products, build a Shopify store in 60 seconds, and spy on competitors — all built for the AU market.
          </p>

          {/* CTA row */}
          <div className="hero-cta-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 36, opacity: 0, animation: 'fadeInUp 0.5s ease 0.4s both' }}>
            <Link href="/app" style={{ background: '#6366F1', color: 'white', height: 48, padding: '0 28px', borderRadius: 10, fontWeight: 600, fontSize: 15, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', transition: 'background 150ms, transform 150ms' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#4F46E5'; e.currentTarget.style.transform = 'scale(1.02)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = '#6366F1'; e.currentTarget.style.transform = 'scale(1)'; }}>
              Start for Free →
            </Link>
            <button onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })} style={{ background: 'transparent', color: '#374151', height: 48, padding: '0 24px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 15, cursor: 'pointer', transition: 'background 150ms' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
              Watch a Demo ↓
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
          <div ref={mockupRef} style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #E5E7EB', boxShadow: '0 40px 80px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)', transform: 'perspective(1200px) rotateX(4deg)', maxWidth: 900, margin: '0 auto' }}>
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
              <div style={{ background: '#FAFAFA', borderBottom: '1px solid #E5E7EB', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>Product Intelligence</span>
                <span style={{ fontSize: 12, color: '#6B7280' }}>🇦🇺 AU Market · Live Data</span>
              </div>
              {/* Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB' }}>
                    {['Product', 'Revenue/mo', 'Orders', 'Margin', 'Score', ''].map((h) => (
                      <th key={h} style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', padding: '8px 20px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { product: 'Air Fryer 11-in-1', revenue: '$8,700', orders: '48 orders', margin: '58%', score: 75 },
                    { product: 'LED Strip Lights', revenue: '$24,200', orders: '312 orders', margin: '61%', score: 82 },
                    { product: 'Smart Watch GPS', revenue: '$5,400', orders: '49 orders', margin: '44%', score: 68 },
                  ].map((row) => {
                    const scoreBg = row.score >= 80 ? '#EEF2FF' : row.score >= 65 ? '#F3E8FF' : '#F9FAFB';
                    const scoreColor = row.score >= 80 ? '#6366F1' : row.score >= 65 ? '#7C3AED' : '#6B7280';
                    const scoreBorder = row.score >= 80 ? '#C7D2FE' : row.score >= 65 ? '#DDD6FE' : '#E5E7EB';
                    return (
                      <tr key={row.product} style={{ borderBottom: '1px solid #F3F4F6', fontSize: 13, color: '#374151' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#F5F3FF')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ padding: '10px 20px', fontWeight: 500 }}>{row.product}</td>
                        <td style={{ padding: '10px 20px', fontWeight: 600 }}>{row.revenue}</td>
                        <td style={{ padding: '10px 20px' }}>{row.orders}</td>
                        <td style={{ padding: '10px 20px' }}>{row.margin}</td>
                        <td style={{ padding: '10px 20px' }}>
                          <span style={{ background: scoreBg, color: scoreColor, border: `1px solid ${scoreBorder}`, fontWeight: 700, borderRadius: 6, padding: '3px 8px', fontSize: 12 }}>{row.score}</span>
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
      <div style={{ padding: '48px 24px', borderTop: '1px solid #F3F4F6', borderBottom: '1px solid #F3F4F6', background: '#FAFAFA' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
            <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
            <span style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 500, whiteSpace: 'nowrap', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Powering stores across Australia
            </span>
            <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
            {['Shopify', 'AliExpress', 'TikTok Shop', 'Meta Ads', 'Google Ads', 'Australia Post'].map(name => (
              <div key={name}
                style={{ fontSize: 15, fontWeight: 700, color: '#374151', opacity: 0.35, filter: 'grayscale(1)', transition: 'opacity 200ms', letterSpacing: name === 'Australia Post' ? '-0.02em' : '0', cursor: 'default', userSelect: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.65')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.35')}
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ STATS ═════════════════════════════════════════════════════════ */}
      <StatsBar />

      {/* ═══ WEEKLY WINNERS EMAIL CAPTURE ══════════════════════════════════ */}
      <WeeklyWinnersSection />

      {/* ═══ PRODUCT INTELLIGENCE PREVIEW ══════════════════════════════════ */}
      <ProductIntelligencePreview />

      {/* ═══ TRUSTED BY ════════════════════════════════════════════════════ */}
      <section style={{ padding: '36px 24px', background: C.bg, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: C.muted, textTransform: 'uppercase', marginBottom: 20 }}>
            Trusted by 2,400+ Australian dropshippers
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
            {['Shopify Partners', 'TikTok Shop AU', 'AliExpress', 'Australia Post'].map((logo) => (
              <span key={logo} style={{
                background: '#1a1d21',
                border: '1px solid #374151',
                borderRadius: 100,
                padding: '6px 16px',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: dm,
                color: '#f5f5f5',
                whiteSpace: 'nowrap',
                letterSpacing: '0.01em',
              }}>
                {logo}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ LOGO STRIP ════════════════════════════════════════════════════ */}
      <section style={{ background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: '48px 0' }}>
        <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: C.muted, marginBottom: 28, textTransform: 'uppercase' }}>
          Built for the platforms sellers use worldwide
        </p>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 100, background: `linear-gradient(to right, ${C.card}, transparent)`, zIndex: 1, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 100, background: `linear-gradient(to left, ${C.card}, transparent)`, zIndex: 1, pointerEvents: 'none' }} />
          <Marquee speed={28} gradient={false}>
            {[...LOGO_STRIP, ...LOGO_STRIP].map((name, i) => (
              <div key={i} style={{ padding: '10px 40px', fontSize: 14, fontWeight: 700, fontFamily: syne, color: C.secondary, whiteSpace: 'nowrap', borderRight: `1px solid ${C.border}` }}>
                {name}
              </div>
            ))}
          </Marquee>
        </div>
      </section>

      {/* ═══ MEET MAYA — AI AGENT SHOWCASE ═══════════════════════════════ */}
      <section style={{ padding: '100px 0', position: 'relative', overflow: 'hidden' }}>
        {/* Background glow */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(99,102,241,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        {/* Dot grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(99,102,241,0.08) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none', maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', position: 'relative' }}>

          {/* ── Section label ── */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 20, padding: '6px 16px' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366F1', display: 'inline-block', boxShadow: '0 0 8px #6366F1' }} />
              <span style={{ color: '#6366F1', fontSize: 12, fontWeight: 700, fontFamily: syne, letterSpacing: '0.1em', textTransform: 'uppercase' }}>AI Co-Pilot</span>
            </div>
          </div>

          {/* ── Headline ── */}
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <h2 style={{ fontFamily: syne, fontSize: 'clamp(36px, 5.5vw, 60px)', fontWeight: 800, color: '#f5f5f5', lineHeight: 1.05, letterSpacing: '-0.03em', margin: '0 0 20px' }}>
              Meet Maya — she doesn't<br />just answer. She <span style={{ color: '#6366F1' }}>acts.</span>
            </h2>
            <p style={{ color: '#71717a', fontSize: 18, maxWidth: 520, margin: '0 auto', fontFamily: dm, lineHeight: 1.6 }}>
              One message. Maya researches your niche, finds suppliers, builds your store, and writes your ads — all in under 3 minutes.
            </p>
          </div>

          {/* ── Split layout ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.1fr)', gap: 48, alignItems: 'center' }}>

            {/* LEFT — capabilities */}
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40 }}>
                {[
                  { icon: '🔍', label: 'Market Intelligence', desc: 'Scans TikTok Shop, Amazon AU & AliExpress for what\'s actually selling right now.' },
                  { icon: '🏪', label: 'Store Builder', desc: 'Generates a full Shopify store from a competitor URL or product idea in 60 seconds.' },
                  { icon: '🎯', label: 'Ad Creative Engine', desc: 'Writes Meta + TikTok hooks, scripts, and targeting briefs — AU-specific, high-converting.' },
                  { icon: '📦', label: 'Supplier Finder', desc: 'Compares AliExpress, CJDropshipping & AU local suppliers with landed cost estimates.' },
                ].map((item) => (
                  <div key={item.label} style={{ display: 'flex', gap: 16, padding: '18px 20px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, transition: 'border-color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ fontFamily: syne, fontWeight: 700, fontSize: 15, color: '#f5f5f5', marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: 13, color: '#71717a', lineHeight: 1.5, fontFamily: dm }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <Link href="/app/chat" style={{
                display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 28px',
                background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                borderRadius: 14, color: '#080a0e', fontFamily: syne, fontWeight: 800,
                fontSize: 15, textDecoration: 'none', boxShadow: '0 8px 32px rgba(99,102,241,0.35)',
              }}>
                Talk to Maya → <span style={{ opacity: 0.7, fontSize: 12 }}>Free</span>
              </Link>
            </div>

            {/* RIGHT — chat window */}
            <div style={{ position: 'relative' }}>
              {/* Glow behind card */}
              <div style={{ position: 'absolute', inset: -20, background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

              <div style={{
                position: 'relative',
                background: 'rgba(10,12,20,0.9)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 24,
                overflow: 'hidden',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1) inset',
              }}>
                {/* Title bar — macOS style */}
                <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />)}
                  </div>
                  <div style={{ flex: 1, textAlign: 'center', fontSize: 12, color: '#52525b', fontFamily: dm, fontWeight: 600 }}>Maya — AI Co-Pilot</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 6px #22c55e' }} />
                    <span style={{ fontSize: 11, color: '#22c55e', fontFamily: dm, fontWeight: 600 }}>Online</span>
                  </div>
                </div>

                {/* Messages */}
                <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20, minHeight: 360 }}>

                  {/* Maya greeting */}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1 0%, #92711a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: syne, fontWeight: 800, fontSize: 13, color: '#080a0e', flexShrink: 0, boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}>M</div>
                    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px 16px 16px 16px', padding: '12px 16px', maxWidth: '85%' }}>
                      <p style={{ color: '#d1d5db', fontSize: 14, margin: 0, lineHeight: 1.6, fontFamily: dm }}>
                        Hey 👋 I'm Maya. Tell me what you want to sell and I'll handle everything — research, suppliers, store, ads. What's the niche?
                      </p>
                    </div>
                  </div>

                  {/* User message */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.08))', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '16px 4px 16px 16px', padding: '12px 16px', maxWidth: '80%' }}>
                      <p style={{ color: '#f5f5f5', fontSize: 14, margin: 0, fontFamily: dm }}>LED face masks for the AU market</p>
                    </div>
                  </div>

                  {/* Maya action response */}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1 0%, #92711a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: syne, fontWeight: 800, fontSize: 13, color: '#080a0e', flexShrink: 0, boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}>M</div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px 16px 16px 16px', padding: '12px 16px' }}>
                        <p style={{ color: '#d1d5db', fontSize: 14, margin: 0, lineHeight: 1.6, fontFamily: dm }}>
                          Solid pick. <strong style={{ color: '#f5f5f5' }}>Low competition</strong> in AU right now — 23 stores vs 340K searches/mo. Top sellers averaging <strong style={{ color: '#6366F1' }}>$2,800/day</strong>. Running full workflow now ↓
                        </p>
                      </div>

                      {/* Workflow card */}
                      <div style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14, padding: '16px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#6366F1', fontFamily: syne, letterSpacing: '0.05em' }}>⚡ WORKFLOW RUNNING</span>
                          <span style={{ fontSize: 10, color: '#52525b', fontFamily: dm }}>3 of 4 complete</span>
                        </div>
                        {[
                          { done: true, label: 'Market scan', detail: 'Score 82/100 — high opportunity' },
                          { done: true, label: 'Supplier match', detail: 'CJDropshipping · $19 landed AU' },
                          { done: true, label: 'Ad angles', detail: '3 hooks written — TikTok + Meta' },
                          { done: false, label: 'Store build', detail: 'Generating…' },
                        ].map((step) => (
                          <div key={step.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <div style={{ width: 20, height: 20, borderRadius: '50%', background: step.done ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.1)', border: `1px solid ${step.done ? 'rgba(34,197,94,0.4)' : 'rgba(99,102,241,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0 }}>
                              {step.done ? <span style={{ color: '#22c55e' }}>✓</span> : <span style={{ color: '#6366F1' }}>◌</span>}
                            </div>
                            <div style={{ flex: 1 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: step.done ? '#e5e7eb' : '#71717a', fontFamily: dm }}>{step.label}</span>
                              <span style={{ fontSize: 11, color: '#52525b', fontFamily: dm, marginLeft: 8 }}>— {step.detail}</span>
                            </div>
                          </div>
                        ))}
                        <button style={{ marginTop: 6, width: '100%', background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: '#080a0e', border: 'none', borderRadius: 10, padding: '11px 16px', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: syne, letterSpacing: '0.02em' }}>
                          Open Store Preview →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input bar */}
                <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 10, background: 'rgba(255,255,255,0.01)' }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '0 14px', gap: 8 }}>
                    <input readOnly placeholder="Message Maya…" style={{ flex: 1, background: 'transparent', border: 'none', padding: '11px 0', color: '#52525b', fontSize: 14, outline: 'none', fontFamily: dm }} />
                    <span style={{ fontSize: 11, color: '#3f3f46', fontFamily: dm }}>⌘↵</span>
                  </div>
                  <button style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)', border: 'none', borderRadius: 12, width: 42, height: 42, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(99,102,241,0.4)', fontSize: 16 }}>→</button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom stat strip ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 1, marginTop: 64, background: 'rgba(255,255,255,0.05)', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { value: '< 3 min', label: 'Idea to live store' },
              { value: '50+', label: 'AI tools chained' },
              { value: '$0', label: 'Extra subscriptions' },
              { value: '24/7', label: 'Always running' },
            ].map((stat) => (
              <div key={stat.label} style={{ padding: '28px 24px', background: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
                <div style={{ fontFamily: syne, fontSize: 28, fontWeight: 800, color: '#6366F1', marginBottom: 6 }}>{stat.value}</div>
                <div style={{ fontSize: 13, color: '#52525b', fontFamily: dm }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES — BENTO GRID ═══════════════════════════════════════ */}
      <BentoFeaturesSection />

      {/* ═══ HOW IT WORKS ════════════════════════════════════════════════ */}
      <HowItWorksSection />

      {/* ═══ DEMO ════════════════════════════════════════════════════════ */}
      <DemoSection />

      {/* ═══ TESTIMONIALS — 6 AU sellers ══════════════════════════════════ */}
      <section style={{ padding: '100px 24px', background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: C.goldDim, border: `1px solid ${C.goldBorder}`, borderRadius: 100, padding: '5px 14px', marginBottom: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.gold, fontFamily: syne }}>WHAT SELLERS ARE SAYING</span>
            </div>
            <h2 style={{ fontFamily: syne, fontWeight: 800, fontSize: 'clamp(1.6rem, 4.5vw, 3rem)', letterSpacing: '-0.025em', color: C.text }}>
              Real results. Real Australian sellers.
            </h2>
            <p style={{ color: C.secondary, fontSize: 16, marginTop: 12 }}>Join 2,400+ sellers already winning with Majorka.</p>
          </motion.div>

          <div className="grid-1-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {TESTIMONIALS_SHOW.map((t, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                transition={{ delay: (i % 3) * 0.1, duration: 0.5, ease: 'easeOut' }}
                style={{ position: 'relative', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '28px 24px', overflow: 'hidden', backdropFilter: 'blur(8px)' }}
              >
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: C.gold, boxShadow: '4px 0 20px rgba(99,102,241,0.2)', borderRadius: '18px 0 0 18px' }} />
                <div style={{ paddingLeft: 6 }}>
                  <div style={{ color: C.gold, fontSize: 13, letterSpacing: 2, marginBottom: 12 }}>{'★'.repeat(t.stars)}</div>
                  <p style={{ fontSize: 15, color: '#e2e8f0', lineHeight: 1.65, marginBottom: 20, fontStyle: 'italic' }}>&ldquo;{t.quote}&rdquo;</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.goldDim, border: `1px solid ${C.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: syne, fontWeight: 800, fontSize: 11, color: C.gold, flexShrink: 0 }}>
                      {t.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <div style={{ fontFamily: syne, fontWeight: 700, fontSize: 13, color: C.text }}>{t.name} {t.flag}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{t.city}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', background: C.goldDim, border: `1px solid ${C.goldBorder}`, borderRadius: 100, padding: '2px 8px', fontSize: 10, fontWeight: 700, color: C.gold, fontFamily: syne, flexShrink: 0 }}>{t.plan}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TRUST BADGES ══════════════════════════════════════════════════ */}
      <section style={{ padding: '32px 24px', background: C.bg, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '12px 32px' }}>
          {[
            { icon: '🔒', label: 'SSL Encrypted' },
            { icon: '🇦🇺', label: 'Australian-Founded' },
            { icon: '💳', label: 'Cancel Anytime' },
            { icon: '🤝', label: '7-Day Money Back' },
          ].map((badge, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, color: C.muted, fontSize: 13, fontWeight: 500 }}>
              <span style={{ fontSize: 16 }}>{badge.icon}</span>
              <span>{badge.label}</span>
              {i < 3 && <span style={{ color: C.border, paddingLeft: 20, display: 'none' }} className="hide-mobile">|</span>}
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
          <div ref={pricingCardsRef} className="grid-1-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, textAlign: 'left' }}>
            {/* Free */}
            <div data-pricing-card style={{ opacity: 0, transform: 'translateY(20px)', transition: 'opacity 400ms, transform 400ms', background: 'white', border: '1px solid #E5E7EB', borderRadius: 20, padding: 32 }}>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#6B7280', marginBottom: 16 }}>Free</div>
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 56, fontWeight: 800, fontFamily: "'Bricolage Grotesque', sans-serif", color: '#0A0A0A', lineHeight: 1 }}>$0</span>
                <span style={{ fontSize: 16, color: '#6B7280', marginLeft: 4 }}>/month</span>
              </div>
              <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>Get started with essential tools.</p>
              <div style={{ height: 1, background: '#F3F4F6', margin: '24px 0' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { text: '10 product searches/day', on: true },
                  { text: 'Basic store builder (1 store)', on: true },
                  { text: 'AU market filters', on: true },
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
              <Link href="/app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: 10, fontWeight: 600, fontSize: 15, width: '100%', cursor: 'pointer', transition: 'all 150ms', marginTop: 28, background: 'white', border: '1px solid #E5E7EB', color: '#374151', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                onMouseLeave={e => (e.currentTarget.style.background = 'white')}
              >Start Free</Link>
            </div>

            {/* Builder — Most Popular */}
            <div data-pricing-card style={{ opacity: 0, transform: 'translateY(20px)', transition: 'opacity 400ms, transform 400ms', background: 'white', border: '2px solid #6366F1', borderRadius: 20, padding: 32, boxShadow: '0 0 0 4px rgba(99,102,241,0.08), 0 24px 48px rgba(99,102,241,0.12)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#6366F1', color: 'white', fontSize: 12, fontWeight: 700, padding: '5px 16px', borderRadius: 999, whiteSpace: 'nowrap' }}>⭐ Most Popular</div>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#6B7280', marginBottom: 16 }}>Builder</div>
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 56, fontWeight: 800, fontFamily: "'Bricolage Grotesque', sans-serif", color: '#0A0A0A', lineHeight: 1 }}>${annual ? 79 : 99}</span>
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
              <Link href="/pricing" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: 10, fontWeight: 600, fontSize: 15, width: '100%', cursor: 'pointer', transition: 'all 150ms', marginTop: 28, background: '#6366F1', color: 'white', border: 'none', textDecoration: 'none', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#4F46E5')}
                onMouseLeave={e => (e.currentTarget.style.background = '#6366F1')}
              >Start Free Trial</Link>
            </div>

            {/* Scale */}
            <div data-pricing-card style={{ opacity: 0, transform: 'translateY(20px)', transition: 'opacity 400ms, transform 400ms', background: 'white', border: '1px solid #E5E7EB', borderRadius: 20, padding: 32 }}>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#6B7280', marginBottom: 16 }}>Scale</div>
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 56, fontWeight: 800, fontFamily: "'Bricolage Grotesque', sans-serif", color: '#0A0A0A', lineHeight: 1 }}>${annual ? 159 : 199}</span>
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
              <Link href="/pricing" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: 10, fontWeight: 600, fontSize: 15, width: '100%', cursor: 'pointer', transition: 'all 150ms', marginTop: 28, background: '#0A0A0A', color: 'white', border: 'none', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#1A1A1A')}
                onMouseLeave={e => (e.currentTarget.style.background = '#0A0A0A')}
              >Start Free Trial</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ════════════════════════════════════════════════════════════ */}
      <section id="faq" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} style={{ fontFamily: syne, fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', letterSpacing: '-0.025em', textAlign: 'center', marginBottom: 48 }}>
            Common questions.
          </motion.h2>
          {FAQ.map((item, i) => <FAQItem key={i} q={item.q} a={item.a} />)}
        </div>
      </section>

      {/* ═══ EMAIL CAPTURE ═════════════════════════════════════════════════ */}
      <section id="guide" style={{ padding: '80px 24px', background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
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
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 64 }}>
            {/* Col 1: Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, background: '#6366F1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 16 }}>M</div>
                <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 18, color: 'white' }}>Majorka</span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: '#6B7280', maxWidth: 240, marginBottom: 24 }}>The AI OS for AU ecommerce. Find winners, build stores, scale fast.</p>
              <div style={{ display: 'flex', gap: 12 }}>
                {['𝕏', 'in', 'TT'].map((icon, i) => (
                  <div key={i} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid #27272A', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#6B7280', transition: '150ms' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.color = '#6366F1'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#27272A'; e.currentTarget.style.color = '#6B7280'; }}
                  >{icon}</div>
                ))}
              </div>
            </div>
            {/* Col 2: Product */}
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 16, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Product</h4>
              {['Features', 'Pricing', 'Store Builder', 'Product Intelligence', 'Competitor Spy'].map(link => (
                <a key={link} href="#" style={{ display: 'block', fontSize: 14, color: '#6B7280', marginBottom: 10, textDecoration: 'none', transition: 'color 150ms' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}
                >{link}</a>
              ))}
            </div>
            {/* Col 3: Company */}
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 16, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Company</h4>
              {['About', 'Blog', 'Careers', 'Contact', 'Affiliate'].map(link => (
                <a key={link} href="#" style={{ display: 'block', fontSize: 14, color: '#6B7280', marginBottom: 10, textDecoration: 'none', transition: 'color 150ms' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}
                >{link}</a>
              ))}
            </div>
            {/* Col 4: Legal */}
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 16, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Legal</h4>
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Refund Policy'].map(link => (
                <a key={link} href="#" style={{ display: 'block', fontSize: 14, color: '#6B7280', marginBottom: 10, textDecoration: 'none', transition: 'color 150ms' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}
                >{link}</a>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid #1F1F23', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#4B4B57' }}>© 2026 Majorka Pty Ltd · Made in Gold Coast, Australia 🇦🇺</span>
            <span style={{ fontSize: 13, color: '#4B4B57' }}>🇦🇺 Australian Owned & Operated</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
