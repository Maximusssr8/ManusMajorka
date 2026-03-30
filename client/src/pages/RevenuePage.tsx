import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight, DollarSign, ExternalLink, Globe,
  ShoppingBag, ShoppingCart, Star, TrendingUp,
  Trophy, Wallet, Zap, Package,
} from 'lucide-react';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useAuth } from '@/_core/hooks/useAuth';
import UpgradeModal from '@/components/UpgradeModal';
import { useLocation } from 'wouter';

// ── Palette ───────────────────────────────────────────────────────────────────
const G  = '#22C55E';
const I  = '#6366F1';
const V  = '#8B5CF6';
const A  = '#F59E0B';
const brico = "'Bricolage Grotesque', sans-serif";
const geist  = "'DM Sans', sans-serif";

// ── Chart data ────────────────────────────────────────────────────────────────
interface Pt { day: string; revenue: number }
function buildCurve(raw: number[]): Pt[] {
  return raw.map((revenue, i) => {
    const d = new Date(); d.setDate(d.getDate() - (raw.length - 1 - i));
    return { day: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), revenue };
  });
}
const MAX_CURVE = [1820,2140,1690,2480,3120,2210,1580,2940,3680,4210,4580,5120,3940,2870,4460,5230,6140,6890,7420,5840,4210,7180,8640,9320,10480,9140,8270,7620,6480,5240];
const MAX_DATA  = buildCurve(MAX_CURVE);
const ZERO_DATA = buildCurve(Array(30).fill(0));

// ── Marketing data ────────────────────────────────────────────────────────────
const MAX_STATS = {
  total: 247831.40,
  month: '$84,291',
  today: '$10,480',
  todayOrders: 47,
  bestDay: '$10,480',
  orders: '5,284',
  aov: '$46.90',
  moM: '+68.4%',
  streak: 27,
  goalTarget: 300000,
  goalPercent: 82.6,
  goalRemaining: '$52,168',
};
const ZERO_STATS = { total: 0, month: '$0', today: '$0', bestDay: '$0', aov: '$0', orders: '0', moM: '--', todayOrders: 0, streak: 0, goalTarget: 300000, goalPercent: 0, goalRemaining: '$300,000' };

// ── Product images (real AliExpress CDN) ─────────────────────────────────────
const IMG = {
  led:     'https://ae01.alicdn.com/kf/S56b8292bb1034f12b95122d6a2e9f657T.jpg',
  roller:  'https://ae01.alicdn.com/kf/Se1692d9a2dab4002afa945e25a7e89918.jpg',
  blender: 'https://ae01.alicdn.com/kf/Sb5b53898025f4c59a6366d3bd8529c04k.jpg',
  posture: 'https://ae01.alicdn.com/kf/Sea30a04945c6486983aee7760c023540j.jpg',
  uv:      'https://ae01.alicdn.com/kf/Sabdc305bec394a5f979f67b7f4f4bb7as.jpg',
  harness: 'https://ae01.alicdn.com/kf/HTB1prW_fi0TMKJjSZFNq6y_1FXa2/Nylon-Reflective-No-Pull-Large-Dog-Harness-Quick-Fit-Pet-Harnesses-Vest-Adjustable-For-Large-Dogs.jpg',
  eyebrow: 'https://ae01.alicdn.com/kf/A5c10248f9a5447d390691851d9af89fbD/Eyebrow-Stamp-Stencil-Kit-1-Pcs-Eye-Brow-Stamp-Shaping-Kit-Long-Lasting-Waterproof-Eyebrow-Makeup.jpg',
  remover: 'https://ae01.alicdn.com/kf/Sc00b8cf6a00043668cf9aeedee786fd2t.jpg',
  biotin:  'https://ae01.alicdn.com/kf/S87552200055646d98092cfde2606cf0aH.jpg',
  carseat: 'https://ae01.alicdn.com/kf/S804729d31cc648ecbdb0bd742bc273a6T.jpg',
};

interface Order { id: string; product: string; amount: number; flag: string; time: string; img: string; today: boolean; qty: number; }
const MAX_ORDERS: Order[] = [
  { id: '5284', product: 'LED Light Therapy Face Mask', amount: 941.46,  flag: '🇦🇺', time: '4m ago',    img: IMG.led,     today: true,  qty: 3 },
  { id: '5283', product: 'Facial Roller Massager Jade', amount: 855.00,  flag: '🇬🇧', time: '11m ago',   img: IMG.roller,  today: true,  qty: 5 },
  { id: '5282', product: 'UV Sanitiser Box Steriliser', amount: 625.92,  flag: '🇦🇺', time: '19m ago',   img: IMG.uv,      today: true,  qty: 4 },
  { id: '5281', product: 'Portable Blender Juicer',     amount: 752.00,  flag: '🇳🇿', time: '33m ago',   img: IMG.blender, today: true,  qty: 4 },
  { id: '5280', product: 'Posture Corrector',           amount: 562.08,  flag: '🇦🇺', time: '47m ago',   img: IMG.posture, today: true,  qty: 6 },
  { id: '5279', product: 'Biotin Hair Growth Serum',    amount: 503.76,  flag: '🇺🇸', time: '1h ago',    img: IMG.biotin,  today: true,  qty: 8 },
  { id: '5278', product: 'Dog Harness No Pull',         amount: 421.60,  flag: '🇦🇺', time: '1h ago',    img: IMG.harness, today: true,  qty: 5 },
  { id: '5277', product: 'Eyebrow Stamp Kit',           amount: 648.00,  flag: '🇸🇬', time: '2h ago',    img: IMG.eyebrow, today: true,  qty: 6 },
  { id: '5276', product: 'LED Light Therapy Face Mask', amount: 627.64,  flag: '🇨🇦', time: '2h ago',    img: IMG.led,     today: true,  qty: 2 },
  { id: '5275', product: 'Makeup Remover Pads',         amount: 439.00,  flag: '🇦🇺', time: '3h ago',    img: IMG.remover, today: true,  qty: 10 },
  { id: '5274', product: 'Car Seat Organiser',          amount: 256.00,  flag: '🇦🇺', time: '3h ago',    img: IMG.carseat, today: true,  qty: 4 },
  { id: '5273', product: 'UV Sanitiser Box Steriliser', amount: 469.44,  flag: '🇳🇿', time: '4h ago',    img: IMG.uv,      today: true,  qty: 3 },
  { id: '5272', product: 'Facial Roller Massager',      amount: 513.00,  flag: '🇬🇧', time: '4h ago',    img: IMG.roller,  today: true,  qty: 3 },
  { id: '5271', product: 'Posture Corrector',           amount: 374.72,  flag: '🇦🇺', time: 'Yesterday', img: IMG.posture, today: false, qty: 4 },
  { id: '5270', product: 'Biotin Hair Growth Serum',    amount: 377.82,  flag: '🇺🇸', time: 'Yesterday', img: IMG.biotin,  today: false, qty: 6 },
  { id: '5269', product: 'LED Light Therapy Face Mask', amount: 1255.28, flag: '🇦🇺', time: 'Yesterday', img: IMG.led,     today: false, qty: 4 },
  { id: '5268', product: 'Portable Blender Juicer',     amount: 940.00,  flag: '🇬🇧', time: 'Yesterday', img: IMG.blender, today: false, qty: 5 },
  { id: '5267', product: 'Eyebrow Stamp Kit',           amount: 864.00,  flag: '🇨🇦', time: 'Yesterday', img: IMG.eyebrow, today: false, qty: 8 },
];

const COUNTRIES = [
  { flag: '🇦🇺', name: 'Australia',      amount: 141640,   pct: 57.2, color: G },
  { flag: '🇳🇿', name: 'New Zealand',    amount: 48330,    pct: 19.5, color: I },
  { flag: '🇬🇧', name: 'United Kingdom', amount: 35940,    pct: 14.5, color: V },
  { flag: '🇺🇸', name: 'United States',  amount: 21921.40, pct: 8.8,  color: A },
];

const TOP_PRODUCTS = [
  { img: IMG.led,     name: 'LED Light Therapy Mask',    revenue: 68420, medal: '🥇', tag: '#1 Best Seller' },
  { img: IMG.roller,  name: 'Facial Roller Massager',    revenue: 51280, medal: '🥈', tag: 'Top Performer' },
  { img: IMG.blender, name: 'Portable Blender Juicer',   revenue: 42840, medal: '🥉', tag: 'Rising Fast' },
  { img: IMG.posture, name: 'Posture Corrector',         revenue: 38760, medal: '',   tag: '' },
  { img: IMG.uv,      name: 'UV Sanitiser Steriliser',   revenue: 31420, medal: '',   tag: '' },
];

type Range = '7D' | '30D';

// ── Tooltip ───────────────────────────────────────────────────────────────────
function Tip({ active, payload }: { active?: boolean; payload?: { payload: Pt }[] }) {
  if (!active || !payload?.length) return null;
  const { day, revenue } = payload[0].payload;
  return (
    <div style={{ background: '#0A0F1E', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 12, padding: '12px 18px', boxShadow: '0 12px 32px rgba(0,0,0,0.6)' }}>
      <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>{day}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: G, fontFamily: brico, letterSpacing: '-0.02em' }}>${revenue.toLocaleString()}</div>
    </div>
  );
}

// ── Glass helper ──────────────────────────────────────────────────────────────
const glass = {
  background: 'rgba(255,255,255,.04)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,.08)',
};

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RevenuePage() {
  const isMobile = useIsMobile();
  const [, nav] = useLocation();
  const { user, session, subPlan, subStatus } = useAuth();
  const [display, setDisplay] = useState(0);
  const [range, setRange] = useState<Range>('30D');
  const [toast, setToast] = useState('');
  const [ready, setReady] = useState(false);
  const ref = useRef<number | null>(null);

  const email = session?.user?.email || user?.email || '';
  const isMarketing = email === 'maximusmajorka@gmail.com';
  const stats   = isMarketing ? MAX_STATS   : ZERO_STATS;
  const orders  = isMarketing ? MAX_ORDERS  : [];
  const allData = isMarketing ? MAX_DATA    : ZERO_DATA;
  const TARGET  = stats.total;

  // Animated counter
  useEffect(() => {
    if (TARGET === 0) { setDisplay(0); return; }
    const t0 = performance.now(); const dur = 1800;
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      setDisplay((1 - Math.pow(1 - p, 4)) * TARGET);
      if (p < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [TARGET]);

  useEffect(() => { const id = setTimeout(() => setReady(true), 300); return () => clearTimeout(id); }, []);

  const chartData = range === '7D' ? allData.slice(-7) : allData;
  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const maxCountry = COUNTRIES[0].amount;
  const maxProduct = TOP_PRODUCTS[0].revenue;

  const handleShare = useCallback(async () => {
    const text = isMarketing
      ? `💰 My Store Earnings\n\nEst. Total: $247,831.40\nThis Month: $84,291\nToday: $10,480\n\nPowered by Majorka · majorka.io`
      : `📊 Track your store earnings with Majorka · majorka.io`;
    if (navigator.share) { try { await navigator.share({ text }); } catch { /**/ } }
    else { await navigator.clipboard.writeText(text); setToast('Copied!'); setTimeout(() => setToast(''), 2000); }
  }, [isMarketing]);

  const isAdmin = session?.user?.email === 'maximusmajorka@gmail.com';
  const isPaid = (subPlan === 'builder' || subPlan === 'scale') && subStatus === 'active';
  if (!isAdmin && !isPaid) {
    return <UpgradeModal isOpen={true} onClose={() => nav('/app/dashboard')} feature="Revenue Tracking" reason="Track your store revenue and analytics" />;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #030608 0%, #080C18 35%, #060A12 100%)', color: '#fff', fontFamily: geist, paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 80px)' }}>

      <style>{`
        @keyframes fadeUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glowPulse{ 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.05)} }
        @keyframes orb1     { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,-40px) scale(1.1)} }
        @keyframes orb2     { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-20px,28px)} }
        @keyframes orb3     { 0%,100%{transform:translate(0,0) scale(1)} 60%{transform:translate(18px,-22px) scale(1.08)} }
        @keyframes ticker   { 0%{transform:translateY(0)} 100%{transform:translateY(-50%)} }
        @keyframes slideToast{ from{opacity:0;transform:translateX(-50%) translateY(-12px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes barFill  { from{width:0} to{width:var(--w)} }
        @keyframes countUp  { from{opacity:0} to{opacity:1} }
        .rev-card    { transition: border-color 180ms, transform 180ms, box-shadow 180ms; }
        .rev-card:hover { border-color:rgba(99,102,241,.4) !important; transform:translateY(-3px); box-shadow:0 12px 40px rgba(0,0,0,.5) !important; }
        .rev-order   { transition: background 150ms, border-color 150ms, transform 120ms; }
        .rev-order:hover { background:rgba(255,255,255,.05) !important; border-color:rgba(99,102,241,.25) !important; transform:translateX(2px); }
        .prod-row    { transition: background 150ms, transform 120ms; }
        .prod-row:hover { background:rgba(255,255,255,.06) !important; transform:translateX(3px); }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed' as const, top: 24, left: '50%', transform: 'translateX(-50%)', background: G, color: '#fff', padding: '10px 22px', borderRadius: 999, fontSize: 13, fontWeight: 700, zIndex: 9999, animation: 'slideToast .25s ease', boxShadow: `0 6px 24px rgba(34,197,94,.5)` }}>
          ✓ {toast}
        </div>
      )}

      {/* Demo banner — only for non-marketing */}
      {!isMarketing && (
        <div style={{ background: 'rgba(245,158,11,.07)', borderBottom: '1px solid rgba(245,158,11,.12)', padding: '10px 20px', textAlign: 'center' as const, fontSize: 12, color: '#F59E0B', fontWeight: 500 }}>
          📊 Connect your Shopify store to start tracking real earnings
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
           HERO
      ════════════════════════════════════════════════════════════ */}
      <div style={{
        background: 'linear-gradient(145deg, #0C1130 0%, #130E38 45%, #091220 100%)',
        borderBottom: '1px solid rgba(99,102,241,.2)',
        padding: isMobile ? '32px 16px 36px' : '52px 52px 56px',
        position: 'relative' as const, overflow: 'hidden' as const,
      }}>
        {/* BG orbs */}
        <div style={{ position:'absolute',top:-80, right:-40,  width:500,height:500, background:'radial-gradient(circle,rgba(34,197,94,.1) 0%,transparent 60%)', pointerEvents:'none', animation:'orb1 9s ease-in-out infinite' }} />
        <div style={{ position:'absolute',bottom:-60,left:-30, width:400,height:400, background:'radial-gradient(circle,rgba(99,102,241,.13) 0%,transparent 60%)', pointerEvents:'none', animation:'orb2 11s ease-in-out infinite' }} />
        <div style={{ position:'absolute',top:'25%',left:'40%', width:280,height:280, background:'radial-gradient(circle,rgba(139,92,246,.09) 0%,transparent 65%)', pointerEvents:'none', animation:'orb3 14s ease-in-out infinite' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' as const }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 56, alignItems: 'center' }}>

            {/* LEFT */}
            <div style={{ animation: 'fadeUp .6s ease both' }}>
              {/* Top pill badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28, flexWrap: 'wrap' as const }}>
                <div style={{ display:'flex',alignItems:'center',gap:7, background:'rgba(99,102,241,.14)', border:'1px solid rgba(99,102,241,.3)', borderRadius:999, padding:'6px 14px' }}>
                  <Wallet size={13} color={I} />
                  <span style={{ fontSize:11,color:I,fontWeight:800,letterSpacing:'.05em' }}>REVENUE DASHBOARD</span>
                </div>
                <div style={{ display:'flex',alignItems:'center',gap:6, background:'rgba(34,197,94,.1)', border:'1px solid rgba(34,197,94,.25)', borderRadius:999, padding:'6px 12px' }}>
                  <div style={{ width:7,height:7,borderRadius:'50%',background:G,boxShadow:`0 0 10px ${G}`,animation:'glowPulse 2s ease-in-out infinite' }} />
                  <span style={{ fontSize:11,color:G,fontWeight:800 }}>LIVE</span>
                </div>
              </div>

              {/* Sub label */}
              <div style={{ fontSize:11,color:'rgba(255,255,255,.25)',letterSpacing:'.14em',textTransform:'uppercase' as const,marginBottom:10,fontWeight:700 }}>
                Est. Lifetime Earnings
              </div>

              {/* THE BIG NUMBER */}
              <div style={{
                fontFamily: brico, fontWeight: 900,
                fontSize: isMobile ? 62 : 104,
                lineHeight: 0.95, letterSpacing: '-0.03em',
                background: 'linear-gradient(135deg, #4ADE80 0%, #22C55E 40%, #86EFAC 80%, #4ADE80 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 48px rgba(34,197,94,.3))',
                marginBottom: 20,
              }}>
                <span style={{ fontSize: '0.52em', verticalAlign: 'super', lineHeight: 1 }}>$</span>
                {display < 1 ? '0.00' : fmt(display)}
              </div>

              {/* Growth badge + MoM */}
              {isMarketing && (
                <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:28,flexWrap:'wrap' as const }}>
                  <div style={{ display:'flex',alignItems:'center',gap:6, background:'rgba(34,197,94,.12)', border:'1px solid rgba(34,197,94,.25)', borderRadius:999, padding:'7px 14px' }}>
                    <ArrowUpRight size={15} color={G} />
                    <span style={{ fontSize:14,color:G,fontWeight:800 }}>{stats.moM} vs last month</span>
                  </div>
                  <div style={{ display:'flex',alignItems:'center',gap:6, background:'rgba(99,102,241,.1)', border:'1px solid rgba(99,102,241,.2)', borderRadius:999, padding:'7px 14px' }}>
                    <Trophy size={13} color={V} />
                    <span style={{ fontSize:13,color:V,fontWeight:700 }}>🔥 {stats.streak}-day streak</span>
                  </div>
                </div>
              )}

              {/* Progress to $300K */}
              {isMarketing && (
                <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', borderRadius:16, padding:'16px 20px' }}>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10 }}>
                    <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                      <Trophy size={14} color={A} />
                      <span style={{ fontSize:13,color:'#E5E7EB',fontWeight:700 }}>$300K Club</span>
                    </div>
                    <span style={{ fontSize:13,color:A,fontWeight:800 }}>{stats.goalPercent}% there</span>
                  </div>
                  <div style={{ height:8, background:'rgba(255,255,255,.06)', borderRadius:999, overflow:'hidden' as const, marginBottom:8 }}>
                    <div style={{
                      height:'100%', borderRadius:999,
                      background:`linear-gradient(90deg,${I},${V})`,
                      width: ready ? `${stats.goalPercent}%` : '0%',
                      transition:'width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      boxShadow:`0 0 16px rgba(99,102,241,.6)`,
                    }} />
                  </div>
                  <div style={{ fontSize:12,color:'rgba(255,255,255,.3)' }}>
                    {stats.goalRemaining} to go
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT — Chart */}
            <div style={{ ...glass, borderRadius:24, padding: isMobile ? '20px 16px' : '24px 24px', display: isMobile ? 'none' : 'flex', flexDirection:'column' as const, animation:'fadeUp .6s .15s ease both', opacity: 0, animationFillMode: 'forwards' as const }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18 }}>
                <div>
                  <div style={{ fontSize:15,fontWeight:800,color:'#fff',fontFamily:brico }}>Revenue Trend</div>
                  <div style={{ fontSize:11,color:'rgba(255,255,255,.3)',marginTop:3 }}>Daily earnings · {range === '7D' ? 'Last 7 days' : 'Last 30 days'}</div>
                </div>
                <div style={{ display:'flex',gap:3,background:'rgba(0,0,0,.4)',borderRadius:10,padding:4 }}>
                  {(['7D','30D'] as Range[]).map(r => (
                    <button key={r} onClick={() => setRange(r)} style={{ padding:'5px 12px',borderRadius:7,border:'none',fontSize:12,fontWeight:700,cursor:'pointer',background:range===r ? I : 'transparent',color:range===r ? '#fff' : 'rgba(255,255,255,.35)',transition:'all 150ms' }}>{r}</button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top:4,right:4,left:-20,bottom:0 }}>
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={G} stopOpacity={0.35} />
                      <stop offset="70%"  stopColor={I} stopOpacity={0.1} />
                      <stop offset="100%" stopColor={I} stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize:10,fill:'rgba(255,255,255,.25)' }} axisLine={false} tickLine={false} interval={range==='7D' ? 0 : 4} />
                  <YAxis tick={{ fontSize:10,fill:'rgba(255,255,255,.25)' }} axisLine={false} tickLine={false} tickFormatter={(v:number) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<Tip />} cursor={{ stroke:'rgba(99,102,241,.3)',strokeWidth:1,strokeDasharray:'4 4' }} />
                  <Area type="monotone" dataKey="revenue" stroke={G} strokeWidth={3} fill="url(#chartGrad)" dot={false} activeDot={{ r:6,fill:G,stroke:'#030608',strokeWidth:2.5 }} />
                </AreaChart>
              </ResponsiveContainer>
              {/* Peak day callout */}
              {isMarketing && (
                <div style={{ marginTop:14, padding:'10px 14px', background:'rgba(34,197,94,.06)', border:'1px solid rgba(34,197,94,.12)', borderRadius:10, display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                  <span style={{ fontSize:12,color:'rgba(255,255,255,.4)' }}>Peak day</span>
                  <span style={{ fontSize:14,fontWeight:800,color:G,fontFamily:brico }}>$10,480 · Mar 25</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
           EMPTY STATE FOR NON-ADMIN
      ════════════════════════════════════════════════════════════ */}
      {!isMarketing && (
        <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 24, textAlign: 'center' as const, padding: '40px 24px' }}>
          <div style={{ fontSize: 56 }}>📊</div>
          <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 900, fontSize: 32, color: 'white', maxWidth: 400, lineHeight: 1.2 }}>
            Your revenue dashboard is ready
          </div>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', maxWidth: 360, lineHeight: 1.6 }}>
            Connect your Shopify store to see real order data, daily revenue, and profit tracking here.
          </div>
          <button
            onClick={() => nav('/app/store-builder')}
            style={{ padding: '14px 32px', background: '#6366F1', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' as const, fontFamily: "'Bricolage Grotesque',sans-serif" }}
          >
            Connect Shopify Store →
          </button>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
            Or connect Shopify in Settings → Integrations
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
           STAT CARDS
      ════════════════════════════════════════════════════════════ */}
      {isMarketing && (
      <div style={{ maxWidth:1200,margin:'0 auto',padding: isMobile ? '16px 16px 0' : '24px 52px 0' }}>
        <div style={{ display:'grid',gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(5,1fr)',gap: isMobile ? 10 : 14 }}>
          {[
            { label:'This Month', value:stats.month,   sub:isMarketing ? '+12%' : '—',      Icon:TrendingUp,   color:G },
            { label:'Today',      value:stats.today,   sub:isMarketing ? `${stats.todayOrders} orders` : '—', Icon:DollarSign,  color:I },
            { label:'Best Day',   value:stats.bestDay, sub:isMarketing ? 'Mar 25' : '—',     Icon:Star,         color:A },
            { label:'Avg Order',  value:stats.aov,     sub:isMarketing ? 'per sale' : '—',   Icon:ShoppingCart, color:V },
            { label:'All Orders', value:stats.orders,  sub:isMarketing ? 'all time' : '—',   Icon:ShoppingBag,  color:'#64748B' },
          ].map((s, idx) => (
            <div key={s.label} className="rev-card" style={{
              ...glass, borderRadius:18,
              padding: isMobile ? '16px 14px' : '22px 20px',
              position:'relative' as const, overflow:'hidden' as const,
              boxShadow:'0 4px 24px rgba(0,0,0,.3)',
              animation:`fadeUp .5s ${idx * 0.07}s ease both`,
            }}>
              {/* Glow accent */}
              <div style={{ position:'absolute',top:-24,right:-24,width:96,height:96,background:`radial-gradient(circle,${s.color}20 0%,transparent 70%)`,pointerEvents:'none' }} />
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom: isMobile ? 10 : 16 }}>
                <div style={{ width:38,height:38,borderRadius:11,background:`${s.color}18`,border:`1px solid ${s.color}28`,display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <s.Icon size={17} color={s.color} />
                </div>
                <span style={{ fontSize:10,color:s.color,fontWeight:800,background:`${s.color}12`,border:`1px solid ${s.color}22`,borderRadius:999,padding:'3px 8px',letterSpacing:'.04em' }}>{s.sub}</span>
              </div>
              <div style={{ fontSize: isMobile ? 26 : 34, fontWeight:900, color:'#FFFFFF', fontFamily:brico, lineHeight:1, letterSpacing:'-0.02em', marginBottom:6 }}>
                {s.value}
              </div>
              <div style={{ fontSize:12,color:'rgba(255,255,255,.3)',fontWeight:600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* ════════════════════════════════════════════════════════════
           MOBILE CHART
      ════════════════════════════════════════════════════════════ */}
      {isMarketing && isMobile && (
        <div style={{ padding:'16px 16px 0' }}>
          <div style={{ ...glass, borderRadius:18, padding:'18px 14px' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14 }}>
              <div style={{ fontSize:14,fontWeight:800,color:'#fff',fontFamily:brico }}>Revenue Trend</div>
              <div style={{ display:'flex',gap:3,background:'rgba(0,0,0,.4)',borderRadius:8,padding:3 }}>
                {(['7D','30D'] as Range[]).map(r => (
                  <button key={r} onClick={() => setRange(r)} style={{ padding:'4px 10px',borderRadius:6,border:'none',fontSize:11,fontWeight:700,cursor:'pointer',background:range===r ? I : 'transparent',color:range===r ? '#fff' : 'rgba(255,255,255,.35)' }}>{r}</button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={chartData} margin={{ top:4,right:4,left:-20,bottom:0 }}>
                <defs>
                  <linearGradient id="mobileGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={G} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={G} stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize:9,fill:'rgba(255,255,255,.25)' }} axisLine={false} tickLine={false} interval={range==='7D' ? 0 : 4} />
                <YAxis tick={{ fontSize:9,fill:'rgba(255,255,255,.25)' }} axisLine={false} tickLine={false} tickFormatter={(v:number) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<Tip />} />
                <Area type="monotone" dataKey="revenue" stroke={G} strokeWidth={2.5} fill="url(#mobileGrad)" dot={false} activeDot={{ r:5,fill:G,stroke:'#030608',strokeWidth:2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
           TOP PRODUCTS + COUNTRIES
      ════════════════════════════════════════════════════════════ */}
      {isMarketing && (
        <div style={{ maxWidth:1200,margin:'0 auto',padding: isMobile ? '16px 16px 0' : '24px 52px 0',display:'grid',gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',gap:16 }}>

          {/* TOP PRODUCTS */}
          <div style={{ ...glass,borderRadius:24,padding: isMobile ? '22px 18px' : '28px 26px',boxShadow:'0 4px 32px rgba(0,0,0,.3)' }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:22 }}>
              <div style={{ display:'flex',alignItems:'center',gap:9 }}>
                <div style={{ width:34,height:34,borderRadius:10,background:'rgba(34,197,94,.15)',border:'1px solid rgba(34,197,94,.25)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <TrendingUp size={16} color={G} />
                </div>
                <span style={{ fontSize:16,fontWeight:900,color:'#fff',fontFamily:brico }}>Top Products</span>
              </div>
              <span style={{ fontSize:11,color:'rgba(255,255,255,.3)',fontWeight:600 }}>by revenue</span>
            </div>
            <div style={{ display:'flex',flexDirection:'column' as const,gap:6 }}>
              {TOP_PRODUCTS.map((p, i) => (
                <div key={p.name} className="prod-row" style={{
                  display:'flex',alignItems:'center',gap:14,
                  padding:'12px 14px',borderRadius:14,
                  background: i === 0 ? 'rgba(250,204,21,.05)' : i === 1 ? 'rgba(148,163,184,.04)' : i === 2 ? 'rgba(180,120,60,.04)' : 'rgba(255,255,255,.02)',
                  border: i < 3 ? `1px solid ${i===0?'rgba(250,204,21,.15)':i===1?'rgba(148,163,184,.12)':'rgba(180,120,60,.12)'}` : '1px solid transparent',
                  cursor:'default',
                }}>
                  {/* Rank */}
                  <div style={{ width:32,height:32,borderRadius:10,background:'rgba(255,255,255,.04)',display:'flex',alignItems:'center',justifyContent:'center',fontSize: i<3 ? 18 : 13,fontWeight:900,color:'rgba(255,255,255,.4)',fontFamily:brico,flexShrink:0 }}>
                    {p.medal || `#${i+1}`}
                  </div>
                  {/* Image */}
                  <div style={{ position:'relative' as const, flexShrink:0 }}>
                    <img src={p.img} alt={p.name} style={{ width:54,height:54,borderRadius:12,objectFit:'cover',border:'2px solid rgba(255,255,255,.1)',display:'block' }} />
                    {p.tag && <div style={{ position:'absolute',bottom:-4,left:'50%',transform:'translateX(-50%)',background: i===0?'#EAB308':i===1?'#94A3B8':'#CD7F32',color:'#000',fontSize:8,fontWeight:900,padding:'2px 6px',borderRadius:99,whiteSpace:'nowrap' as const }}>{p.tag}</div>}
                  </div>
                  {/* Name + bar */}
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:13,fontWeight:700,color:'#F1F5F9',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const,marginBottom:8 }}>{p.name}</div>
                    <div style={{ height:4,background:'rgba(255,255,255,.06)',borderRadius:999,overflow:'hidden' as const }}>
                      <div style={{ height:'100%',borderRadius:999,background: i===0?`linear-gradient(90deg,${G},#4ADE80)`:i===1?`linear-gradient(90deg,${I},${V})`:`linear-gradient(90deg,${A},#FCD34D)`,width:`${(p.revenue/maxProduct*100).toFixed(1)}%`,transition:'width .8s ease' }} />
                    </div>
                  </div>
                  {/* Revenue */}
                  <div style={{ fontSize:16,fontWeight:900,color: i===0?G:i===1?I:A,fontFamily:brico,flexShrink:0,minWidth:72,textAlign:'right' as const }}>
                    ${(p.revenue/1000).toFixed(0)}k
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* COUNTRY BREAKDOWN */}
          <div style={{ ...glass,borderRadius:24,padding: isMobile ? '22px 18px' : '28px 26px',boxShadow:'0 4px 32px rgba(0,0,0,.3)' }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:22 }}>
              <div style={{ display:'flex',alignItems:'center',gap:9 }}>
                <div style={{ width:34,height:34,borderRadius:10,background:'rgba(99,102,241,.15)',border:'1px solid rgba(99,102,241,.25)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <Globe size={16} color={I} />
                </div>
                <span style={{ fontSize:16,fontWeight:900,color:'#fff',fontFamily:brico }}>Global Revenue</span>
              </div>
              <span style={{ fontSize:11,color:'rgba(255,255,255,.3)',fontWeight:600 }}>4 markets</span>
            </div>
            <div style={{ display:'flex',flexDirection:'column' as const,gap:16 }}>
              {COUNTRIES.map((c, i) => (
                <div key={c.name} style={{ display:'flex',alignItems:'center',gap:14 }}>
                  <span style={{ fontSize:26,flexShrink:0,lineHeight:1 }}>{c.flag}</span>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6 }}>
                      <div>
                        <span style={{ fontSize:13,fontWeight:700,color:'#E5E7EB' }}>{c.name}</span>
                        <span style={{ fontSize:11,color:'rgba(255,255,255,.3)',marginLeft:8 }}>{c.pct}%</span>
                      </div>
                      <span style={{ fontSize:14,fontWeight:900,color:'#fff',fontFamily:brico }}>${(c.amount/1000).toFixed(0)}k</span>
                    </div>
                    <div style={{ height:6,background:'rgba(255,255,255,.06)',borderRadius:999,overflow:'hidden' as const }}>
                      <div style={{ height:'100%',borderRadius:999,background:c.color,width:ready ? `${(c.amount/maxCountry*100).toFixed(1)}%` : '0%',transition:`width ${1 + i*0.1}s cubic-bezier(0.34,1.56,0.64,1)`,boxShadow:`0 0 10px ${c.color}60` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:20,paddingTop:16,borderTop:'1px solid rgba(255,255,255,.06)',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              <span style={{ fontSize:12,color:'rgba(255,255,255,.3)' }}>Lifetime total</span>
              <span style={{ fontSize:15,fontWeight:900,color:G,fontFamily:brico }}>$247,831.40</span>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
           ORDERS FEED
      ════════════════════════════════════════════════════════════ */}
      {isMarketing && (
      <div style={{ maxWidth:1200,margin:'0 auto',padding: isMobile ? '16px 16px 0' : '24px 52px 0' }}>

        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16 }}>
          <div>
            <div style={{ fontSize: isMobile ? 16 : 20,fontWeight:900,color:'#fff',fontFamily:brico,letterSpacing:'-0.01em' }}>
              Recent Orders
            </div>
            <div style={{ fontSize:11,color:'rgba(255,255,255,.3)',marginTop:3 }}>
              {isMarketing ? `${MAX_ORDERS.length} transactions · today + yesterday` : 'No orders yet'}
            </div>
          </div>
          {isMarketing && (
            <div style={{ display:'flex',gap:10,alignItems:'center' }}>
              <div style={{ display:'flex',alignItems:'center',gap:6,background:'rgba(34,197,94,.08)',border:'1px solid rgba(34,197,94,.18)',borderRadius:999,padding:'7px 14px' }}>
                <div style={{ width:7,height:7,borderRadius:'50%',background:G,boxShadow:`0 0 8px ${G}`,animation:'glowPulse 2s ease-in-out infinite' }} />
                <span style={{ fontSize:12,color:G,fontWeight:700 }}>{stats.todayOrders} today</span>
              </div>
              <button onClick={handleShare} style={{ display:'flex',alignItems:'center',gap:6,background:'rgba(99,102,241,.1)',border:'1px solid rgba(99,102,241,.2)',borderRadius:999,padding:'7px 14px',cursor:'pointer',color:I,fontSize:12,fontWeight:700 }}>
                <Package size={13} color={I} /> Share
              </button>
            </div>
          )}
        </div>

        {/* Empty state */}
        {orders.length === 0 && (
          <div style={{ ...glass,borderRadius:24,padding:'52px 24px',textAlign:'center' as const,boxShadow:'0 4px 32px rgba(0,0,0,.3)' }}>
            <div style={{ fontSize:48,marginBottom:16 }}>🛍️</div>
            <div style={{ fontSize:17,fontWeight:800,color:'#fff',marginBottom:8,fontFamily:brico }}>No orders yet</div>
            <div style={{ fontSize:13,color:'rgba(255,255,255,.3)',marginBottom:24 }}>Connect a Shopify store to see real orders here</div>
            <button onClick={() => nav('/app/store-builder')} style={{ padding:'11px 22px',borderRadius:12,background:I,color:'#fff',border:'none',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:brico,boxShadow:'0 4px 16px rgba(99,102,241,.35)' }}>
              Connect Store
            </button>
          </div>
        )}

        {/* Feed */}
        {orders.length > 0 && (
          <div style={{ display:'flex',flexDirection:'column' as const,gap:8 }}>
            {/* TODAY label */}
            <div style={{ display:'flex',alignItems:'center',gap:10,paddingLeft:4,paddingBottom:4 }}>
              <div style={{ width:6,height:6,borderRadius:'50%',background:G,boxShadow:`0 0 8px ${G}`,animation:'glowPulse 2s ease-in-out infinite' }} />
              <span style={{ fontSize:10,fontWeight:800,color:'rgba(255,255,255,.35)',letterSpacing:'.12em',textTransform:'uppercase' as const }}>Today</span>
              <span style={{ fontSize:10,fontWeight:700,color:G }}>{stats.today}</span>
            </div>
            {orders.map((o, i) => {
              const todayCount = orders.filter(x => x.today).length;
              const showYesterday = i === todayCount;
              return (
                <React.Fragment key={o.id}>
                  {showYesterday && (
                    <div style={{ display:'flex',alignItems:'center',gap:10,paddingLeft:4,paddingTop:12,paddingBottom:4 }}>
                      <div style={{ width:6,height:6,borderRadius:'50%',background:'rgba(255,255,255,.25)' }} />
                      <span style={{ fontSize:10,fontWeight:800,color:'rgba(255,255,255,.35)',letterSpacing:'.12em',textTransform:'uppercase' as const }}>Yesterday</span>
                    </div>
                  )}
                  <div className="rev-order" style={{
                    ...glass, borderRadius:16,
                    padding: isMobile ? '14px 14px' : '16px 22px',
                    display:'flex', alignItems:'center', gap: isMobile ? 12 : 18,
                    cursor:'default',
                  }}>
                    {/* Product image */}
                    <div style={{ position:'relative' as const,flexShrink:0 }}>
                      <img src={o.img} alt={o.product}
                        style={{ width: isMobile ? 48 : 58, height: isMobile ? 48 : 58, borderRadius:14, objectFit:'cover', border:'2px solid rgba(255,255,255,.1)', display:'block' }}
                      />
                      {/* Qty bubble */}
                      {o.qty > 1 && (
                        <div style={{ position:'absolute',bottom:-4,right:-4,background:I,color:'#fff',fontSize:9,fontWeight:900,width:18,height:18,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid #030608' }}>
                          {o.qty}
                        </div>
                      )}
                    </div>
                    {/* Product info */}
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize: isMobile ? 13 : 14,fontWeight:700,color:'#F1F5F9',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const,marginBottom:5 }}>
                        {o.product}
                      </div>
                      <div style={{ display:'flex',alignItems:'center',gap:8,flexWrap:'wrap' as const }}>
                        <span style={{ fontSize:11,color:'rgba(255,255,255,.25)',fontFamily:"'DM Mono',monospace" }}>#{o.id}</span>
                        <span style={{ fontSize:10,color:'rgba(255,255,255,.15)' }}>·</span>
                        <span style={{ fontSize:11,color:'rgba(255,255,255,.35)' }}>{o.time}</span>
                        <span style={{ fontSize:15 }}>{o.flag}</span>
                        {o.qty > 1 && <span style={{ fontSize:10,color:I,fontWeight:700,background:'rgba(99,102,241,.1)',borderRadius:999,padding:'1px 7px' }}>×{o.qty}</span>}
                      </div>
                    </div>
                    {/* Amount + status */}
                    <div style={{ display:'flex',flexDirection:'column' as const,alignItems:'flex-end',gap:6,flexShrink:0 }}>
                      <div style={{ fontSize: isMobile ? 18 : 22,fontWeight:900,color:'#FFFFFF',fontFamily:brico,letterSpacing:'-0.02em',lineHeight:1 }}>
                        <span style={{ color:G,fontSize:'0.62em',verticalAlign:'super' }}>$</span>{o.amount.toFixed(2)}
                      </div>
                      <div style={{ fontSize:10,fontWeight:800,color:G,background:'rgba(34,197,94,.1)',border:'1px solid rgba(34,197,94,.22)',borderRadius:999,padding:'3px 10px',letterSpacing:'.07em' }}>
                        PAID
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      )}

      {/* ════════════════════════════════════════════════════════════
           BOTTOM ROW: Connect + Withdrawal
      ════════════════════════════════════════════════════════════ */}
      <div style={{ maxWidth:1200,margin:'0 auto',padding: isMobile ? '16px 16px 0' : '24px 52px 0',display:'grid',gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',gap:16 }}>

        {/* Connect store */}
        <div style={{ background:'linear-gradient(135deg,#0C1528 0%,#180E3A 100%)',border:'1px solid rgba(99,102,241,.22)',borderRadius:24,padding: isMobile ? '24px 20px' : '32px 30px',position:'relative' as const,overflow:'hidden' as const,boxShadow:'0 8px 40px rgba(0,0,0,.4)' }}>
          <div style={{ position:'absolute',top:-40,right:-40,width:160,height:160,background:'radial-gradient(circle,rgba(99,102,241,.2) 0%,transparent 65%)',pointerEvents:'none' }} />
          <div style={{ width:44,height:44,borderRadius:14,background:'rgba(99,102,241,.15)',border:'1px solid rgba(99,102,241,.3)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16 }}>
            <Zap size={22} color={I} />
          </div>
          <div style={{ fontSize:18,fontWeight:900,color:'#fff',fontFamily:brico,marginBottom:8 }}>Connect your store</div>
          <div style={{ fontSize:13,color:'rgba(255,255,255,.4)',marginBottom:24,lineHeight:1.6 }}>
            Link Shopify to replace demo data with your real orders, revenue, and customer insights.
          </div>
          <button onClick={() => nav('/app/store-builder')} style={{ padding:'13px 24px',borderRadius:14,border:'none',background:`linear-gradient(135deg,${I},${V})`,color:'#fff',fontSize:14,fontWeight:800,cursor:'pointer',fontFamily:brico,display:'flex',alignItems:'center',gap:8,boxShadow:`0 6px 24px rgba(99,102,241,.4)` }}>
            <ExternalLink size={15} /> Connect Shopify
          </button>
        </div>

        {/* Withdrawal */}
        <div style={{ ...glass,borderRadius:24,padding: isMobile ? '24px 20px' : '32px 30px',display:'flex',flexDirection:'column' as const,justifyContent:'space-between',boxShadow:'0 8px 40px rgba(0,0,0,.4)' }}>
          <div>
            <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:18 }}>
              <div style={{ width:44,height:44,borderRadius:14,background:'rgba(34,197,94,.1)',border:'1px solid rgba(34,197,94,.2)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                <DollarSign size={22} color={G} />
              </div>
              <div>
                <div style={{ fontSize:12,color:'rgba(255,255,255,.35)',fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase' as const }}>Available Balance</div>
                <div style={{ fontSize:11,color:'rgba(255,255,255,.2)',marginTop:2 }}>Processed 2–3 business days</div>
              </div>
            </div>
            <div style={{ fontSize: isMobile ? 36 : 52,fontWeight:900,color:'#FFFFFF',fontFamily:brico,letterSpacing:'-0.025em',lineHeight:1,marginBottom:8 }}>
              <span style={{ color:G,fontSize:'0.58em',verticalAlign:'super' }}>$</span>
              {TARGET > 0 ? TARGET.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}) : '0.00'}
            </div>
          </div>
          <button disabled title="Connect Shopify to enable" style={{ padding:'13px 22px',borderRadius:14,border:'1px solid rgba(255,255,255,.08)',background:'rgba(255,255,255,.04)',color:'rgba(255,255,255,.3)',fontSize:14,fontWeight:700,cursor:'not-allowed',fontFamily:brico,opacity:0.55,display:'flex',alignItems:'center',gap:7,maxWidth:'fit-content' }}>
            <DollarSign size={15} /> Request Withdrawal
          </button>
        </div>
      </div>

      <div style={{ height:40 }} />
    </div>
  );
}
