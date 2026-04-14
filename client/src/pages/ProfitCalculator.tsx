import { useIsMobile } from '@/hooks/useIsMobile';
import { Helmet } from 'react-helmet-async';
import { Calculator, Share2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useRegion } from '@/context/RegionContext';

// ── Platform fee presets ────────────────────────────────────────────────────
const PLATFORM_OPTIONS = [
  { label: 'Shopify', value: 2 },
  { label: 'eBay AU', value: 13 },
  { label: 'MyDeal', value: 12.5 },
  { label: 'Kogan', value: 12 },
  { label: 'Amazon AU', value: 15 },
  { label: 'Custom', value: -1 },
] as const;

const PAYMENT_PROCESSING_RATE = 1.75; // Stripe AU

// ── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

const pct = (n: number) => `${n.toFixed(1)}%`;

// ── Animated SVG Gauge ───────────────────────────────────────────────────────
function ProfitGauge({ value, color }: { value: number; color: string }) {
  const R = 60;
  const cx = 80;
  const cy = 80;
  const startAngle = 215;
  const totalSweep = 230;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const polar = (deg: number) => ({ x: cx + R * Math.cos(toRad(deg)), y: cy + R * Math.sin(toRad(deg)) });

  const bgStart = polar(startAngle);
  const bgEnd = polar(startAngle + totalSweep);
  const bgPath = `M ${bgStart.x} ${bgStart.y} A ${R} ${R} 0 1 1 ${bgEnd.x} ${bgEnd.y}`;

  const isMobile = useIsMobile();
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 900;
    const target = value;
    const raf = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatedValue(Math.round(eased * target));
      if (t < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [value]);

  const animSweep = (animatedValue / 100) * totalSweep;
  const animEnd = polar(startAngle + animSweep);
  const animLargeArc = animSweep > 180 ? 1 : 0;
  const animPath = animSweep > 0 ? `M ${bgStart.x} ${bgStart.y} A ${R} ${R} 0 ${animLargeArc} 1 ${animEnd.x} ${animEnd.y}` : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={160} height={120} viewBox="0 0 160 120">
        <path d={bgPath} fill="none" stroke="#F0F0F0" strokeWidth={10} strokeLinecap="round" />
        {animPath && <path d={animPath} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${color}66)` }} />}
        <text x={cx} y={cy + 8} textAnchor="middle" fill={color} fontSize={26} fontWeight={800} fontFamily="'Syne', sans-serif">{animatedValue}%</text>
        <text x={cx} y={cy + 26} textAnchor="middle" fill="#9CA3AF" fontSize={10} fontFamily="DM Sans, sans-serif">net margin</text>
        <text x={22} y={106} fill="#9CA3AF" fontSize={9} fontFamily="DM Sans, sans-serif">0%</text>
        <text x={126} y={106} fill="#9CA3AF" fontSize={9} fontFamily="DM Sans, sans-serif">100%</text>
      </svg>
    </div>
  );
}

// ── Component ───────────────────────────────────────────────────────────────
export default function ProfitCalculator() {
  const isMobile = useIsMobile();
  const { region } = useRegion();
  // Inputs
  const [productCost, setProductCost] = useState(12);
  const [sellingPrice, setSellingPrice] = useState(49);
  const [unitsPerDay, setUnitsPerDay] = useState(5);
  const [adSpendPerDay, setAdSpendPerDay] = useState(50);
  const [shippingOption, setShippingOption] = useState<'standard' | 'express' | 'free'>('standard');
  const [platformKey, setPlatformKey] = useState('Shopify');
  const [customPlatformFee, setCustomPlatformFee] = useState(5);
  const [gstEnabled, setGstEnabled] = useState(false);
  const [afterpayEnabled, setAfterpayEnabled] = useState(false);

  const [saved, setSaved] = useState(false);
  const [returnRate, setReturnRate] = useState(0); // % of orders returned
  const [showSavedList, setShowSavedList] = useState(false);
  const [savedCalcs, setSavedCalcs] = useState<any[]>([]);

  // Auto-fill from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const price = params.get('price');
    const cost = params.get('cost');
    const units = params.get('units');
    const ads = params.get('ads');
    if (price) { const p = parseFloat(price); if (!isNaN(p)) setSellingPrice(p); }
    if (cost) { const c = parseFloat(cost); if (!isNaN(c)) setProductCost(c); }
    if (units) { const u = parseFloat(units); if (!isNaN(u)) setUnitsPerDay(u); }
    if (ads) { const a = parseFloat(ads); if (!isNaN(a)) setAdSpendPerDay(a); }
    const mayaPrefill = sessionStorage.getItem('maya_prefill_profit-calculator');
    if (mayaPrefill) {
      try {
        const data = JSON.parse(mayaPrefill);
        if (data.sellPrice) { const p = parseFloat(String(data.sellPrice)); if (!isNaN(p)) setSellingPrice(p); }
        if (data.costPrice) { const p = parseFloat(String(data.costPrice)); if (!isNaN(p)) setProductCost(p); }
        sessionStorage.removeItem('maya_prefill_profit-calculator');
      } catch { /* ignore */ }
    }
  }, []);

  const shippingCost = shippingOption === 'standard' ? 9.99 : shippingOption === 'express' ? 13.99 : 0;

  const platformFeeRate = useMemo(() => {
    const opt = PLATFORM_OPTIONS.find((o) => o.label === platformKey);
    if (!opt || opt.value === -1) return customPlatformFee;
    return opt.value;
  }, [platformKey, customPlatformFee]);

  // ── Calculations ────────────────────────────────────────────────────────
  const calc = useMemo(() => {
    const adjustedCost = gstEnabled ? productCost * 1.1 : productCost;
    const afterpayFee = afterpayEnabled ? sellingPrice * 0.06 : 0;
    const grossProfit = sellingPrice - adjustedCost - shippingCost;
    const platformFeeAmt = sellingPrice * (platformFeeRate / 100);
    const paymentFeeAmt = sellingPrice * (PAYMENT_PROCESSING_RATE / 100);
    const returnCostPerUnit = returnRate > 0 ? (sellingPrice * (returnRate / 100)) * 0.5 : 0; // 50% of sale price lost per return
    const netProfit = grossProfit - platformFeeAmt - paymentFeeAmt - afterpayFee - returnCostPerUnit;
    const dailyProfit = netProfit * unitsPerDay - adSpendPerDay;
    const monthlyProfit = dailyProfit * 30;
    const marginPct = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;
    const roas = adSpendPerDay > 0 ? (sellingPrice * unitsPerDay) / adSpendPerDay : 0;
    const breakEvenCpa = netProfit;

    const totalCostsPerUnit = adjustedCost + shippingCost + platformFeeAmt + paymentFeeAmt + afterpayFee;
    const netMarginPct = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;

    const projections = [100, 500, 1000].map(orders => ({
      orders,
      revenue: sellingPrice * orders,
      costs: totalCostsPerUnit * orders + (adSpendPerDay / Math.max(unitsPerDay, 1)) * orders,
      profit: netProfit * orders - (adSpendPerDay / Math.max(unitsPerDay, 1)) * orders,
    }));

    let verdictColor: string;
    let verdictLabel: string;
    let verdictReason: string;
    if (netMarginPct > 30) {
      verdictColor = '#22c55e'; verdictLabel = 'Highly Viable';
      verdictReason = 'Strong margins above 30%. This product has healthy room for scaling ad spend, absorbing returns, and still turning a solid profit per unit.';
    } else if (netMarginPct >= 15) {
      verdictColor = '#eab308'; verdictLabel = 'Proceed with Caution';
      verdictReason = 'Margins between 15–30% can work but leave limited room for error. Optimise ad spend, negotiate supplier costs, or increase your selling price.';
    } else {
      verdictColor = '#ef4444'; verdictLabel = 'Not Viable';
      verdictReason = 'Net margin below 15% makes this product risky at scale. Factor in returns, refunds, and overhead.';
    }

    return { netProfit, dailyProfit, monthlyProfit, marginPct, roas, breakEvenCpa, totalCostsPerUnit, netMarginPct, projections, verdictColor, verdictLabel, verdictReason, platformFeeAmt, paymentFeeAmt, afterpayFee };
  }, [productCost, sellingPrice, unitsPerDay, adSpendPerDay, shippingCost, platformFeeRate, gstEnabled, afterpayEnabled, returnRate]);

  // ── Shared styles ───────────────────────────────────────────────────────
  const cardStyle: React.CSSProperties = { background: '#0d0d10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '24px' };
  const labelStyle: React.CSSProperties = { fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, color: '#94A3B8', marginBottom: 8, display: 'block' };
  const numberInputStyle: React.CSSProperties = { fontFamily: "'DM Sans', system-ui, sans-serif", background: '#0d0d10', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#F8FAFC', padding: '8px 12px', width: 90, fontSize: 14, outline: 'none' };
  const sliderStyle: React.CSSProperties = { flex: 1, accentColor: '#6366F1', height: 6, cursor: 'pointer' };

  const InputGroup = ({ label, value, onChange, min, max, step, prefix = '$', suffix = '' }: {
    label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; prefix?: string; suffix?: string;
  }) => (
    <div style={{ marginBottom: 20 }}>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className="accent-[#d4af37]" style={sliderStyle} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'DM Sans', system-ui, sans-serif", color: '#94A3B8', fontSize: 14 }}>
          {prefix && <span>{prefix}</span>}
          <input type="number" min={0} max={999999} step={step} value={value}
            onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange(Math.min(999999, Math.max(0, v))); }}
            className="bg-[#0d0d10]/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#d4af37] focus:border-[#d4af37] transition-colors"
            style={{ width: 90, fontSize: 14 }} />
          {suffix && <span>{suffix}</span>}
        </div>
      </div>
    </div>
  );

  // ── Color helpers for results ─────────────────────────────────────────
  const monthlyColor = calc.monthlyProfit > 0 ? '#059669' : '#EF4444';
  const marginColor = calc.marginPct > 40 ? '#059669' : calc.marginPct >= 20 ? '#F59E0B' : '#EF4444';
  const roasColor = calc.roas > 3 ? '#059669' : calc.roas >= 1.5 ? '#F59E0B' : '#EF4444';

  const ResultMetric = ({ label, value, color }: { label: string; value: string; color: string }) => (
    <div style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: color === '#0A0A0A' ? '#A5B4FC' : color, fontFamily: "'DM Sans', system-ui, sans-serif", fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#05070F', padding: '40px 24px 80px', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <Helmet><title>Profit Calculator | Majorka</title></Helmet>

      {/* Header */}
      <div style={{ maxWidth: 1200, margin: '0 auto 40px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Calculator size={24} color="#6366F1" />
        </div>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 700, color: '#F8FAFC', margin: 0 }}>Profit Calculator</h1>
          <p style={{ fontSize: 14, color: '#94A3B8', margin: 0, marginTop: 2 }}>Model your unit economics for the {region.name} market</p>
        </div>
      </div>

      {/* Input validation warnings */}
      {productCost >= sellingPrice && sellingPrice > 0 && (
        <div style={{ maxWidth: 1200, margin: '0 auto 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '8px 16px', fontSize: 12, color: '#FCA5A5', fontWeight: 500 }}>
          ⚠️ Product cost (${productCost}) is higher than or equal to selling price (${sellingPrice}) — this will produce a negative margin.
        </div>
      )}

      {/* Key metrics row */}
      <div style={{ maxWidth: 1200, margin: '0 auto 24px', overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(160px, 1fr))', gap: 12, minWidth: 800 }}>
          <ResultMetric label="Monthly Profit" value={fmt(calc.monthlyProfit)} color={monthlyColor} />
          <ResultMetric label="Margin %" value={`${calc.marginPct.toFixed(1)}%`} color={marginColor} />
          <ResultMetric label="ROAS" value={calc.roas > 0 ? `${calc.roas.toFixed(2)}x` : 'N/A'} color={roasColor} />
          <ResultMetric label="Daily Profit" value={fmt(calc.dailyProfit)} color={calc.dailyProfit > 0 ? '#059669' : '#EF4444'} />
          <ResultMetric label="Break-even CPA" value={fmt(calc.breakEvenCpa)} color="#0A0A0A" />
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? 16 : 32 }} className="profit-calc-grid">
        {/* ── LEFT: Inputs ─────────────────────────────────────────────── */}
        <div>
          <div style={cardStyle}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 600, color: '#F8FAFC', margin: '0 0 24px' }}>Product & Costs</h2>

            <InputGroup label={`Product Cost (${region.currency})`} value={productCost} onChange={setProductCost} min={0} max={200} step={0.5} />
            <InputGroup label={`Selling Price (${region.currency})`} value={sellingPrice} onChange={setSellingPrice} min={0} max={500} step={1} />
            <InputGroup label="Units per Day" value={unitsPerDay} onChange={setUnitsPerDay} min={1} max={100} step={1} prefix="" suffix="units" />
            <InputGroup label={`Ad Spend per Day (${region.currency})`} value={adSpendPerDay} onChange={setAdSpendPerDay} min={0} max={500} step={5} />

            {/* AusPost Shipping Dropdown */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Shipping (AusPost)</label>
              <select value={shippingOption} onChange={e => setShippingOption(e.target.value as 'standard' | 'express' | 'free')}
                className="w-full bg-[#0d0d10]/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#d4af37] transition-colors cursor-pointer"
                style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 14 }}>
                <option value="standard">Standard — $9.99</option>
                <option value="express">Express — $13.99</option>
                <option value="free">Free Shipping — $0</option>
              </select>
            </div>

            {/* Platform Fees */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Platform Fees</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <select value={platformKey} onChange={e => setPlatformKey(e.target.value)}
                  className="bg-[#0d0d10]/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#d4af37] transition-colors cursor-pointer"
                  style={{ flex: 1, fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 14 }}>
                  {PLATFORM_OPTIONS.map(o => <option key={o.label} value={o.label}>{o.label}{o.value > 0 ? ` (${o.value}%)` : ''}</option>)}
                </select>
                {platformKey === 'Custom' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94A3B8', fontSize: 14 }}>
                    <input type="number" min={0} max={100} step={0.5} value={customPlatformFee}
                      onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) setCustomPlatformFee(Math.min(100, Math.max(0, v))); }}
                      className="bg-[#0d0d10]/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#d4af37] focus:border-[#d4af37] transition-colors"
                      style={{ width: 70, fontSize: 14 }} />
                    <span>%</span>
                  </div>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>Fee: {platformFeeRate}% = {fmt(calc.platformFeeAmt)} per unit</div>
            </div>

            {/* Payment Processing */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Payment Processing (Stripe AU)</label>
              <div style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span>{PAYMENT_PROCESSING_RATE}%</span>
                <span style={{ color: '#94A3B8' }}>{fmt(calc.paymentFeeAmt)} per unit</span>
              </div>
            </div>

            {/* AU-specific toggles */}
            <div style={{ borderTop: '1px solid #F0F0F0', paddingTop: 20, marginTop: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 12 }}>Tax & Fees</div>

              {/* GST Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#F8FAFC' }}>Include Tax ({(region.gst_rate * 100).toFixed(0)}%)</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>Adds {(region.gst_rate * 100).toFixed(0)}% to product cost</div>
                </div>
                <button onClick={() => setGstEnabled(!gstEnabled)} style={{
                  width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: gstEnabled ? '#6366F1' : '#E5E7EB', position: 'relative', transition: 'background 150ms',
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', background: '#0d0d10',
                    position: 'absolute', top: 3, left: gstEnabled ? 23 : 3, transition: 'left 150ms',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }} />
                </button>
              </div>

              {/* Return Rate Input */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#F8FAFC' }}>Return Rate ({returnRate}%)</div>
                  <input type="number" value={returnRate} min={0} max={50}
                    onChange={e => setReturnRate(Math.min(50, Math.max(0, Number(e.target.value))))}
                    className="bg-[#0d0d10]/[0.05] border border-white/[0.08] rounded-lg px-2 py-1 text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#d4af37] transition-colors"
                    style={{ width: 64, height: 28, fontSize: 13, textAlign: 'right' as const }} />
                </div>
                <input type="range" min={0} max={30} step={1} value={returnRate} onChange={e => setReturnRate(Number(e.target.value))}
                  className="accent-[#d4af37]" style={{ width: '100%', margin: '4px 0' }} />
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>AU ecommerce avg: 10–20% · 0% = no returns modelled</div>
              </div>

              {/* Afterpay Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#F8FAFC' }}>Afterpay Fee (6%)</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>Adds 6% fee on selling price{afterpayEnabled ? ` = ${fmt(calc.afterpayFee)}` : ''}</div>
                </div>
                <button onClick={() => setAfterpayEnabled(!afterpayEnabled)} style={{
                  width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: afterpayEnabled ? '#6366F1' : '#E5E7EB', position: 'relative', transition: 'background 150ms',
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', background: '#0d0d10',
                    position: 'absolute', top: 3, left: afterpayEnabled ? 23 : 3, transition: 'left 150ms',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Results ───────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Animated SVG Gauge + Verdict */}
          <div style={{ ...cardStyle, borderColor: calc.verdictColor, borderWidth: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <ProfitGauge value={Math.max(0, Math.min(100, calc.netMarginPct))} color={calc.verdictColor} />
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: calc.verdictColor, display: 'block' }}>{calc.verdictLabel}</span>
              <p style={{ fontSize: 13, color: '#94A3B8', margin: '8px 0 0', lineHeight: 1.6, maxWidth: 340, textAlign: 'center' }}>{calc.verdictReason}</p>
            </div>
          </div>

          {/* Monthly Projections */}
          <div style={cardStyle} id="profit-results-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 600, color: '#F8FAFC', margin: 0 }}>Monthly Profit Projections</h3>
                <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>Based on 30-day month</div>
              </div>
              <button onClick={() => {
                const summary = [
                  'Profit Calculator Results', '────────────────────────',
                  `Selling Price: ${fmt(sellingPrice)}`, `Product Cost: ${fmt(productCost)}`,
                  `Units/day: ${unitsPerDay}`, `Ad Spend/day: ${fmt(adSpendPerDay)}`,
                  `Monthly Profit: ${fmt(calc.monthlyProfit)}`, `Net Margin: ${pct(calc.marginPct)}`,
                  `ROAS: ${calc.roas.toFixed(2)}x`, `Verdict: ${calc.verdictLabel}`,
                ].join('\n');
                navigator.clipboard.writeText(summary);
                toast.success('Results copied to clipboard!');
              }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#6366F1', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.15)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.08)')}>
                <Share2 size={12} /> Share Results
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr>
                    {['Orders', 'Revenue', 'Costs', 'Profit'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#9CA3AF', fontWeight: 500, fontSize: 12, textTransform: 'uppercase' as const, letterSpacing: '0.05em', borderBottom: '1px solid #F0F0F0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {calc.projections.map(row => (
                    <tr key={row.orders}>
                      <td style={{ padding: '12px', color: '#F8FAFC', borderBottom: '1px solid #F9FAFB' }}>{row.orders.toLocaleString()}</td>
                      <td style={{ padding: '12px', color: '#F8FAFC', borderBottom: '1px solid #F9FAFB' }}>{fmt(row.revenue)}</td>
                      <td style={{ padding: '12px', color: '#94A3B8', borderBottom: '1px solid #F9FAFB' }}>{fmt(row.costs)}</td>
                      <td style={{ padding: '12px', color: row.profit >= 0 ? '#22c55e' : '#ef4444', fontWeight: 600, borderBottom: '1px solid #F9FAFB' }}>{fmt(row.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Interpretation Card */}
          <div style={{ ...cardStyle, background: 'rgba(99,102,241,0.04)', borderColor: 'rgba(99,102,241,0.18)' }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: '#6366F1', margin: '0 0 12px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>What This Means</h3>
            <p style={{ fontSize: 13, color: '#94A3B8', margin: 0, lineHeight: 1.7 }}>
              {calc.netMarginPct > 30
                ? `You're looking at a ${pct(calc.netMarginPct)} net margin — genuinely strong for AU ecommerce. At ${fmt(calc.netProfit)} profit per unit and ${unitsPerDay} units/day, that's ${fmt(calc.dailyProfit)}/day or ${fmt(calc.monthlyProfit)}/month. Next step: run a $50/day validation campaign targeting AU buyers.`
                : calc.netMarginPct >= 15
                  ? `A ${pct(calc.netMarginPct)} net margin is workable but tight. At ${fmt(calc.netProfit)} per unit, one bad batch of returns or a spike in ad CPMs could push you to break-even. Negotiate COGS down 10–15%, test a higher price point, or improve ad creative CTR.`
                  : `At ${pct(calc.netMarginPct)} net margin, this product is high-risk at scale. Consider increasing the selling price, finding a cheaper supplier, or cutting ad spend. If you can't hit 20%+ net margin on paper, don't launch.`}
            </p>
          </div>
        </div>
      </div>

      {/* Save & Share Actions */}
      <div style={{ maxWidth: 1200, margin: '16px auto 0', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button
          onClick={() => {
            const calcData = { productCost, sellingPrice, unitsPerDay, adSpendPerDay, shippingOption, platformKey, savedAt: new Date().toISOString() };
            const existing = JSON.parse(localStorage.getItem('majorka_saved_calcs') || '[]');
            existing.unshift(calcData);
            localStorage.setItem('majorka_saved_calcs', JSON.stringify(existing.slice(0, 10)));
            setSavedCalcs(existing.slice(0, 10));
            setSaved(true);
            toast.success('Calculation saved!');
            setTimeout(() => setSaved(false), 2000);
          }}
          style={{ height: 40, padding: '0 20px', background: saved ? '#059669' : 'white', color: saved ? 'white' : '#374151', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 200ms' }}
        >
          {saved ? '✓ Saved!' : 'Save Calculation'}
        </button>
        <button
          onClick={async () => {
            const params = new URLSearchParams({
              cost: String(productCost), price: String(sellingPrice),
              units: String(unitsPerDay), ads: String(adSpendPerDay),
            });
            const shareUrl = `${window.location.origin}/share/profit?${params.toString()}`;
            try {
              if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(shareUrl);
                toast.success('Share link copied to clipboard!');
              } else {
                const textArea = document.createElement('textarea');
                textArea.value = shareUrl;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                toast.success('Share link copied to clipboard!');
              }
            } catch {
              toast.error('Could not copy link. URL: ' + shareUrl.slice(0, 60));
            }
          }}
          style={{ height: 40, padding: '0 20px', background: '#0d0d10', color: '#CBD5E1', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          Share
        </button>
      </div>

      {/* Responsive CSS */}
      <style>{`
        @media (max-width: 768px) {
          .profit-calc-grid { grid-template-columns: 1fr !important; }
        }
        input[type="range"] { -webkit-appearance: none; appearance: none; background: #E5E7EB; border-radius: 4px; height: 6px; outline: none; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #6366F1; cursor: pointer; border: 2px solid #FFFFFF; box-shadow: 0 0 8px rgba(99,102,241,0.3); }
        input[type="range"]::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; background: #6366F1; cursor: pointer; border: 2px solid #FFFFFF; box-shadow: 0 0 8px rgba(99,102,241,0.3); }
      `}</style>
    </div>
  );
}
