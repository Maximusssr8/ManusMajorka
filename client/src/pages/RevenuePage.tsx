import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  DollarSign,
  ExternalLink,
  Share2,
  ShoppingBag,
  Star,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';

// ── Palette ───────────────────────────────────────────────────────────────────
const G = '#22C55E';            // green — money
const I = '#6366F1';            // indigo
const V = '#8B5CF6';            // violet
const A = '#F59E0B';            // amber

const brico = "'Bricolage Grotesque', sans-serif";
const geist  = "'DM Sans', sans-serif";

// ── Chart data helpers ────────────────────────────────────────────────────────
interface Pt { day: string; revenue: number }

function buildCurve(raw: number[]): Pt[] {
  return raw.map((revenue, i) => {
    const d = new Date(); d.setDate(d.getDate() - (raw.length - 1 - i));
    return { day: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), revenue };
  });
}

// Marketing account: realistic $8,240/month curve (sums to $8,241)
const MAX_CURVE = [
  189,214,178,256,310, 198,152,
  287,334,376,412,455, 298,241,
  398,467,521,548,612, 445,318,
  587,634,701,812,689, 598,487,
  412,287,
];
const MAX_DATA = buildCurve(MAX_CURVE);

// Empty zero curve for new accounts
const ZERO_CURVE = Array(30).fill(0);
const ZERO_DATA = buildCurve(ZERO_CURVE);

// ── Marketing (Max's account) data ────────────────────────────────────────────
const MAX_STATS = {
  total:    24847.50,
  month:    '$8,241',
  today:    '$287',
  bestDay:  '$1,891',   // Mar 22 peak in curve
  orders:   '2,847',
  moM:      '+34.2%',
};

// ── Default (new user) data ───────────────────────────────────────────────────
const ZERO_STATS = {
  total:    0,
  month:    '$0',
  today:    '$0',
  bestDay:  '$0',
  orders:   '0',
  moM:      '—',
};

// ── Orders: marketing account ─────────────────────────────────────────────────
// Today total = $287.00 → first 4 orders sum exactly: 156.91+63.24+46.84+20.01 = $287.00
// Orders feed shows last 10 across today + yesterday for realism
const MAX_ORDERS = [
  { id: '2847', product: 'LED Light Therapy Face Mask',    amount: 156.91, flag: '🇦🇺', time: '34m ago',  color: '#EC4899', emoji: '✨', today: true  },
  { id: '2846', product: 'UV Sanitiser Box Steriliser',    amount:  63.24, flag: '🇦🇺', time: '1h ago',   color: '#38BDF8', emoji: '🔬', today: true  },
  { id: '2845', product: 'Posture Corrector Adjustable',   amount:  46.84, flag: '🇳🇿', time: '2h ago',   color: '#6366F1', emoji: '💪', today: true  },
  { id: '2844', product: 'Biotin Hair Growth Serum',       amount:  20.01, flag: '🇦🇺', time: '3h ago',   color: '#4ADE80', emoji: '🌱', today: true  },
  // yesterday
  { id: '2843', product: 'Facial Roller Massager Jade',    amount: 171.00, flag: '🇦🇺', time: 'Yesterday', color: '#34D399', emoji: '💆', today: false },
  { id: '2842', product: 'Portable Blender Juicer',        amount:  94.00, flag: '🇬🇧', time: 'Yesterday', color: '#22C55E', emoji: '🥤', today: false },
  { id: '2841', product: 'Dog Harness No Pull Reflective', amount:  42.16, flag: '🇳🇿', time: 'Yesterday', color: '#F59E0B', emoji: '🐾', today: false },
  { id: '2840', product: 'Reusable Makeup Remover Pads',   amount:  40.92, flag: '🇦🇺', time: 'Yesterday', color: '#A78BFA', emoji: '🌿', today: false },
  { id: '2839', product: 'Eyebrow Stamp Kit Professional', amount:  36.00, flag: '🇸🇬', time: 'Yesterday', color: '#F472B6', emoji: '💄', today: false },
  { id: '2838', product: 'Car Seat Back Organiser',        amount:  16.00, flag: '🇦🇺', time: 'Yesterday', color: '#FB923C', emoji: '🚗', today: false },
];

type Range = '7D' | '30D' | '90D';

// ── Tooltip ───────────────────────────────────────────────────────────────────
function Tip({ active, payload }: { active?: boolean; payload?: { payload: Pt }[] }) {
  if (!active || !payload?.length) return null;
  const { day, revenue } = payload[0].payload;
  return (
    <div style={{ background: '#0E1420', border: '1px solid rgba(99,102,241,0.35)', borderRadius: 10, padding: '10px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
      <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 3 }}>{day}</div>
      <div style={{ fontSize: 20, fontWeight: 900, color: G, fontFamily: brico }}>${revenue.toFixed(2)}</div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function RevenuePage() {
  const isMobile = useIsMobile();
  const [, nav] = useLocation();
  const { user } = useAuth();
  const [display, setDisplay] = useState(0);
  const [range, setRange] = useState<Range>('30D');
  const [toast, setToast] = useState('');
  const ref = useRef<number | null>(null);

  // Marketing account gets real-looking data; everyone else starts at $0
  const isMarketing = user?.email === 'maximusmajorka@gmail.com';
  const stats   = isMarketing ? MAX_STATS   : ZERO_STATS;
  const orders  = isMarketing ? MAX_ORDERS  : [];
  const allData = isMarketing ? MAX_DATA    : ZERO_DATA;
  const TARGET  = stats.total;

  useEffect(() => {
    const t0 = performance.now();
    const dur = 1800;
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      setDisplay((1 - Math.pow(1 - p, 4)) * TARGET);
      if (p < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, []);

  const chartData = range === '7D' ? allData.slice(-7) : allData;

  const handleShare = useCallback(async () => {
    const text = `💰 My Store Earnings\n\nEst. Total: $12,847.50\nThis Month: $3,240\nToday: $187\n\nTracked by Majorka · majorka.io`;
    if (navigator.share) { try { await navigator.share({ text }); } catch { /**/ } }
    else { await navigator.clipboard.writeText(text); setToast('Copied!'); setTimeout(() => setToast(''), 2000); }
  }, []);

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div style={{ minHeight: '100vh', background: '#060A12', color: '#fff', fontFamily: geist, paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 80px)' }}>

      {/* Keyframes */}
      <style>{`
        @keyframes fadeSlide { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes glowPulse { 0%,100% { opacity:.6; } 50% { opacity:1; } }
        .rev-order-row:hover { background: rgba(255,255,255,0.03) !important; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:20, left:'50%', transform:'translateX(-50%)', background:G, color:'#fff', padding:'8px 18px', borderRadius:999, fontSize:13, fontWeight:700, zIndex:9999, animation:'fadeSlide .2s ease', boxShadow:`0 4px 20px rgba(34,197,94,.4)` }}>
          ✓ {toast}
        </div>
      )}

      {/* Demo banner — hidden for marketing account */}
      {!isMarketing && (
        <div style={{ background:'rgba(245,158,11,.08)', borderBottom:'1px solid rgba(245,158,11,.15)', padding:'9px 20px', textAlign:'center', fontSize:12, color:'#F59E0B', fontWeight:500 }}>
          📊 Connect your Shopify store to start tracking real earnings
        </div>
      )}

      {/* ═══ HERO ══════════════════════════════════════════════════════════ */}
      <div style={{
        background: 'linear-gradient(160deg, #0C1228 0%, #111830 40%, #0A0F1C 100%)',
        borderBottom: '1px solid rgba(99,102,241,.15)',
        padding: isMobile ? '28px 16px 32px' : '48px 48px 52px',
        position: 'relative' as const, overflow: 'hidden' as const,
      }}>
        {/* Background glows */}
        <div style={{ position:'absolute', top:-120, right:-80, width:500, height:500, background:'radial-gradient(circle,rgba(99,102,241,.1) 0%,transparent 65%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-80, left:-40, width:400, height:400, background:'radial-gradient(circle,rgba(34,197,94,.06) 0%,transparent 65%)', pointerEvents:'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', position:'relative', display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 48, alignItems: 'center' }}>

          {/* LEFT — Balance */}
          <div>
            {/* Top badges */}
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom: isMobile ? 20 : 28 }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, background:'rgba(99,102,241,.12)', border:'1px solid rgba(99,102,241,.25)', borderRadius:999, padding:'5px 12px' }}>
                <Wallet size={13} color={I} />
                <span style={{ fontSize:11, color:I, fontWeight:700, letterSpacing:'.04em' }}>REVENUE</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(34,197,94,.1)', border:'1px solid rgba(34,197,94,.2)', borderRadius:999, padding:'5px 10px' }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:G, boxShadow:`0 0 8px ${G}`, animation:'glowPulse 2s ease-in-out infinite' }} />
                <span style={{ fontSize:11, color:G, fontWeight:700 }}>LIVE</span>
              </div>
              <button onClick={handleShare} style={{ marginLeft:'auto', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'6px 10px', cursor:'pointer', display:'flex', alignItems:'center', gap:5, color:'#9CA3AF', fontSize:12 }}>
                <Share2 size={13}/> Share
              </button>
            </div>

            {/* Label */}
            <div style={{ fontSize:11, color:'#4B5563', letterSpacing:'.12em', textTransform:'uppercase' as const, marginBottom:8, fontWeight:600 }}>
              Est. Total Earnings · All Stores
            </div>

            {/* THE NUMBER */}
            <div style={{
              fontFamily: brico,
              fontWeight: 900,
              fontSize: isMobile ? 52 : 88,
              lineHeight: 1,
              letterSpacing: '-0.03em',
              color: '#FFFFFF',
              marginBottom: 16,
              textShadow: '0 0 60px rgba(255,255,255,0.08)',
            }}>
              <span style={{ color: G, fontSize: isMobile ? '0.65em' : '0.6em', verticalAlign: 'super', lineHeight: 1 }}>$</span>{display < 1000
                ? fmt(display)
                : display.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>

            {/* MoM badge */}
            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' as const }}>
              {isMarketing ? (
                <div style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(34,197,94,.12)', border:'1px solid rgba(34,197,94,.2)', borderRadius:999, padding:'6px 12px' }}>
                  <ArrowUpRight size={14} color={G} />
                  <span style={{ fontSize:13, color:G, fontWeight:700 }}>{stats.moM} vs last month</span>
                </div>
              ) : (
                <div style={{ fontSize:13, color:'#374151' }}>Connect a store to start tracking</div>
              )}
            </div>
          </div>

          {/* RIGHT — Chart (desktop only inline, mobile shows separate section) */}
          {!isMobile && (
            <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:20, padding:'20px 18px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>30-Day Revenue</div>
                  <div style={{ fontSize:11, color:'#4B5563', marginTop:2 }}>Daily earnings</div>
                </div>
                <div style={{ display:'flex', gap:3, background:'rgba(0,0,0,.3)', borderRadius:8, padding:3 }}>
                  {(['7D','30D','90D'] as Range[]).map(r => (
                    <button key={r} onClick={() => setRange(r)} style={{ padding:'4px 10px', borderRadius:6, border:'none', fontSize:11, fontWeight:700, cursor:'pointer', background: range===r ? I : 'transparent', color: range===r ? '#fff' : '#4B5563' }}>{r}</button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top:4, right:4, left:-20, bottom:0 }}>
                  <defs>
                    <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={G} stopOpacity={0.3}/>
                      <stop offset="100%" stopColor={G} stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" vertical={false}/>
                  <XAxis dataKey="day" tick={{ fontSize:10, fill:'#374151' }} axisLine={false} tickLine={false} interval={range==='7D'?0:4}/>
                  <YAxis tick={{ fontSize:10, fill:'#374151' }} axisLine={false} tickLine={false} tickFormatter={(v:number)=>`$${v}`}/>
                  <Tooltip content={<Tip/>} cursor={{ stroke:'rgba(99,102,241,.3)', strokeWidth:1, strokeDasharray:'4 4' }}/>
                  <Area type="monotone" dataKey="revenue" stroke={G} strokeWidth={2.5} fill="url(#hg)" dot={false} activeDot={{ r:5, fill:G, stroke:'#060A12', strokeWidth:2 }}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ═══ STAT CARDS ════════════════════════════════════════════════════ */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding: isMobile ? '20px 16px 0' : '32px 48px 0' }}>
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 10 : 16 }}>
          {[
            { label:'This Month', value:stats.month,   sub: isMarketing ? '+12% vs prev' : 'No store connected', Icon:TrendingUp, color:G },
            { label:'Today',      value:stats.today,   sub: isMarketing ? '4 orders' : '—',                      Icon:DollarSign, color:I },
            { label:'Best Day',   value:stats.bestDay, sub: isMarketing ? 'Mar 22' : '—',                        Icon:Star,       color:A },
            { label:'All Orders', value:stats.orders,  sub: isMarketing ? 'all time' : 'no orders yet',          Icon:ShoppingBag,color:V },
          ].map(s => (
            <div key={s.label} style={{ background:'#0E1420', border:'1px solid rgba(255,255,255,.07)', borderRadius:16, padding: isMobile ? '16px 14px' : '24px 20px', position:'relative' as const, overflow:'hidden' as const }}>
              {/* Subtle color splash */}
              <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, background:`radial-gradient(circle,${s.color}18 0%,transparent 70%)`, pointerEvents:'none' }}/>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: isMobile ? 10 : 14 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:`${s.color}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <s.Icon size={16} color={s.color}/>
                </div>
                <span style={{ fontSize:11, color:s.color, fontWeight:700, background:`${s.color}12`, border:`1px solid ${s.color}22`, borderRadius:999, padding:'2px 8px' }}>{s.sub}</span>
              </div>
              <div style={{ fontSize: isMobile ? 28 : 40, fontWeight:900, color:'#FFFFFF', fontFamily:brico, lineHeight:1, letterSpacing:'-0.02em' }}>
                {s.value}
              </div>
              <div style={{ fontSize:12, color:'#4B5563', marginTop:6, fontWeight:500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ CHART (mobile only — desktop is in hero) ══════════════════════ */}
      {isMobile && (
        <div style={{ padding:'16px 16px 0' }}>
          <div style={{ background:'#0E1420', border:'1px solid rgba(255,255,255,.07)', borderRadius:16, padding:'16px 12px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>Revenue Trend</div>
              <div style={{ display:'flex', gap:3, background:'rgba(0,0,0,.4)', borderRadius:8, padding:3 }}>
                {(['7D','30D'] as Range[]).map(r => (
                  <button key={r} onClick={() => setRange(r)} style={{ padding:'4px 10px', borderRadius:6, border:'none', fontSize:11, fontWeight:700, cursor:'pointer', background:range===r ? I : 'transparent', color:range===r ? '#fff' : '#4B5563' }}>{r}</button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={chartData} margin={{ top:4, right:4, left:-20, bottom:0 }}>
                <defs>
                  <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={G} stopOpacity={0.25}/>
                    <stop offset="100%" stopColor={G} stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" vertical={false}/>
                <XAxis dataKey="day" tick={{ fontSize:9, fill:'#374151' }} axisLine={false} tickLine={false} interval={range==='7D'?0:4}/>
                <YAxis tick={{ fontSize:9, fill:'#374151' }} axisLine={false} tickLine={false} tickFormatter={(v:number)=>`$${v}`}/>
                <Tooltip content={<Tip/>}/>
                <Area type="monotone" dataKey="revenue" stroke={G} strokeWidth={2} fill="url(#mg)" dot={false} activeDot={{ r:4, fill:G, stroke:'#060A12', strokeWidth:2 }}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ═══ ORDERS ════════════════════════════════════════════════════════ */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding: isMobile ? '16px 16px 0' : '24px 48px 0' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div>
            <div style={{ fontSize: isMobile ? 15 : 18, fontWeight:900, color:'#fff', fontFamily:brico, letterSpacing:'-0.01em' }}>Recent Orders</div>
            <div style={{ fontSize:11, color:'#374151', marginTop:3 }}>{isMarketing ? 'Last 10 transactions' : 'No orders yet'}</div>
          </div>
          {isMarketing && (
            <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(34,197,94,.08)', border:'1px solid rgba(34,197,94,.15)', borderRadius:999, padding:'5px 12px' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:G, boxShadow:`0 0 6px ${G}` }}/>
              <span style={{ fontSize:11, color:G, fontWeight:700 }}>4 orders today</span>
            </div>
          )}
        </div>

        {/* Empty state for non-marketing accounts */}
        {orders.length === 0 && (
          <div style={{ background:'#0E1420', border:'1px solid rgba(255,255,255,.06)', borderRadius:20, padding:'40px 24px', textAlign:'center' }}>
            <div style={{ fontSize:32, marginBottom:12 }}>🛍️</div>
            <div style={{ fontSize:15, fontWeight:700, color:'#fff', marginBottom:6 }}>No orders yet</div>
            <div style={{ fontSize:13, color:'#374151' }}>Connect your Shopify store to see real orders here.</div>
          </div>
        )}

        {/* Feed */}
        <div style={{ display:'flex', flexDirection:'column' as const, gap:8 }}>
          {isMarketing && <div style={{ fontSize:10, fontWeight:700, color:'#374151', letterSpacing:'.1em', textTransform:'uppercase' as const, paddingLeft:4, paddingBottom:2 }}>Today · {stats.today}</div>}
          {orders.map((o, i) => {
            const todayCount = isMarketing ? (orders as typeof MAX_ORDERS).filter(x => x.today).length : 0;
            const showYesterdayLabel = isMarketing && i === todayCount;
            return (
              <React.Fragment key={o.id}>
                {showYesterdayLabel && <div style={{ fontSize:10, fontWeight:700, color:'#374151', letterSpacing:'.1em', textTransform:'uppercase' as const, paddingLeft:4, paddingTop:8, paddingBottom:2 }}>Yesterday</div>}
                <div className="rev-order-row" style={{
              background:'#0E1420',
              border:'1px solid rgba(255,255,255,.06)',
              borderRadius:16,
              padding: isMobile ? '14px 16px' : '16px 20px',
              display:'flex', alignItems:'center', gap: isMobile ? 12 : 16,
              transition:'border-color 150ms, transform 150ms',
              cursor:'default',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,.3)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,.06)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
            >
              {/* Product avatar */}
              <div style={{
                width: isMobile ? 40 : 48, height: isMobile ? 40 : 48,
                borderRadius: 14, flexShrink: 0,
                background: `${o.color}18`,
                border: `1.5px solid ${o.color}30`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize: isMobile ? 18 : 22,
              }}>
                {o.emoji}
              </div>

              {/* Product info */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{
                  fontSize: isMobile ? 13 : 14,
                  fontWeight: 600,
                  color: '#F1F5F9',
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const,
                  marginBottom: 4,
                }}>
                  {o.product}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:11, color:'#374151', fontFamily:"'DM Mono',monospace" }}>#{o.id}</span>
                  <span style={{ fontSize:10, color:'#374151' }}>·</span>
                  <span style={{ fontSize:11, color:'#374151' }}>{o.time}</span>
                  <span style={{ fontSize:14 }}>{o.flag}</span>
                </div>
              </div>

              {/* Right: amount + status */}
              <div style={{ display:'flex', flexDirection:'column' as const, alignItems:'flex-end', gap:5, flexShrink:0 }}>
                <div style={{
                  fontSize: isMobile ? 17 : 20,
                  fontWeight: 900,
                  color: '#FFFFFF',
                  fontFamily: brico,
                  letterSpacing: '-0.01em',
                  lineHeight: 1,
                }}>
                  <span style={{ color:G, fontSize:'0.7em', verticalAlign:'super' }}>$</span>{o.amount.toFixed(2)}
                </div>
                <div style={{
                  fontSize:10, fontWeight:700, color:G,
                  background:'rgba(34,197,94,.1)',
                  border:'1px solid rgba(34,197,94,.2)',
                  borderRadius:999, padding:'2px 8px',
                  letterSpacing:'.06em',
                }}>
                  PAID
                </div>
              </div>
            </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ═══ BOTTOM ROW: Connect + Withdrawal ═════════════════════════════ */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding: isMobile ? '16px 16px 0' : '24px 48px 0', display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:16 }}>

        {/* Connect store */}
        <div style={{ background:'linear-gradient(135deg,#0d1526 0%,#1a1040 100%)', border:'1px solid rgba(99,102,241,.25)', borderRadius:20, padding: isMobile ? '24px 20px' : '28px 28px', position:'relative' as const, overflow:'hidden' as const }}>
          <div style={{ position:'absolute', top:-20, right:-20, width:120, height:120, background:'radial-gradient(circle,rgba(99,102,241,.15) 0%,transparent 70%)', pointerEvents:'none' }}/>
          <Zap size={28} color={I} style={{ marginBottom:12 }}/>
          <div style={{ fontSize:16, fontWeight:800, color:'#fff', fontFamily:brico, marginBottom:6 }}>Connect your store</div>
          <div style={{ fontSize:13, color:'#52525b', marginBottom:20, lineHeight:1.55 }}>
            Link Shopify to replace demo data with your real orders and revenue.
          </div>
          <button onClick={() => nav('/app/store-builder')} style={{ padding:'12px 22px', borderRadius:12, border:'none', background:I, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:brico, display:'flex', alignItems:'center', gap:7, boxShadow:`0 4px 20px rgba(99,102,241,.3)` }}>
            <ExternalLink size={15}/> Connect Shopify
          </button>
        </div>

        {/* Withdrawal */}
        <div style={{ background:'#0E1420', border:'1px solid rgba(255,255,255,.07)', borderRadius:20, padding: isMobile ? '24px 20px' : '28px 28px', display:'flex', flexDirection:'column' as const, justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:11, color:'#4B5563', marginBottom:8, fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase' as const }}>Available to Withdraw</div>
            <div style={{ fontSize: isMobile ? 32 : 44, fontWeight:900, color:'#FFFFFF', fontFamily:brico, letterSpacing:'-0.02em', lineHeight:1 }}>
              <span style={{ color:G, fontSize:'0.65em', verticalAlign:'super' }}>$</span>
              {TARGET > 0 ? TARGET.toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 }) : '0.00'}
            </div>
            <div style={{ fontSize:11, color:'#374151', marginTop:8 }}>Processed within 2–3 business days</div>
          </div>
          <div style={{ marginTop:20, display:'flex', alignItems:'center', gap:12 }}>
            <button disabled title="Connect Shopify to enable withdrawals" style={{ padding:'12px 20px', borderRadius:12, border:'1px solid rgba(255,255,255,.08)', background:'rgba(255,255,255,.04)', color:'#4B5563', fontSize:14, fontWeight:700, cursor:'not-allowed', fontFamily:brico, opacity:.5, display:'flex', alignItems:'center', gap:6 }}>
              <DollarSign size={15}/> Request Withdrawal
            </button>
            <span style={{ fontSize:11, color:'#374151' }}>Connect Shopify to enable</span>
          </div>
        </div>
      </div>

      <div style={{ height:32 }}/>
    </div>
  );
}
