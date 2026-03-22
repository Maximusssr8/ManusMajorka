import { Helmet } from 'react-helmet-async';
import { Calculator, Share2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

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
  n.toLocaleString('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const pct = (n: number) => `${n.toFixed(1)}%`;

// ── Animated SVG Gauge ───────────────────────────────────────────────────────

function ProfitGauge({ value, color }: { value: number; color: string }) {
  // Arc from 215° to -35° (230° sweep) for gauge appearance
  const R = 60;
  const cx = 80;
  const cy = 80;
  const startAngle = 215;
  const totalSweep = 230;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const polar = (deg: number) => ({
    x: cx + R * Math.cos(toRad(deg)),
    y: cy + R * Math.sin(toRad(deg)),
  });

  const bgStart = polar(startAngle);
  const bgEnd = polar(startAngle + totalSweep);
  const bgPath = `M ${bgStart.x} ${bgStart.y} A ${R} ${R} 0 1 1 ${bgEnd.x} ${bgEnd.y}`;

  const valueSweep = (value / 100) * totalSweep;
  const valueEnd = polar(startAngle + valueSweep);
  const largeArc = valueSweep > 180 ? 1 : 0;
  const valuePath =
    valueSweep > 0
      ? `M ${bgStart.x} ${bgStart.y} A ${R} ${R} 0 ${largeArc} 1 ${valueEnd.x} ${valueEnd.y}`
      : '';

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
  const animPath =
    animSweep > 0
      ? `M ${bgStart.x} ${bgStart.y} A ${R} ${R} 0 ${animLargeArc} 1 ${animEnd.x} ${animEnd.y}`
      : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={160} height={120} viewBox="0 0 160 120">
        {/* Background arc */}
        <path
          d={bgPath}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={10}
          strokeLinecap="round"
        />
        {/* Value arc (animated) */}
        {animPath && (
          <path
            d={animPath}
            fill="none"
            stroke={color}
            strokeWidth={10}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
          />
        )}
        {/* Center value */}
        <text
          x={cx}
          y={cy + 8}
          textAnchor="middle"
          fill={color}
          fontSize={26}
          fontWeight={800}
          fontFamily="Syne, sans-serif"
        >
          {animatedValue}%
        </text>
        <text
          x={cx}
          y={cy + 26}
          textAnchor="middle"
          fill="rgba(255,255,255,0.3)"
          fontSize={10}
          fontFamily="DM Sans, sans-serif"
        >
          net margin
        </text>
        {/* Min/Max labels */}
        <text x={22} y={106} fill="rgba(255,255,255,0.25)" fontSize={9} fontFamily="DM Sans, sans-serif">0%</text>
        <text x={126} y={106} fill="rgba(255,255,255,0.25)" fontSize={9} fontFamily="DM Sans, sans-serif">100%</text>
      </svg>
    </div>
  );
}

// ── Component ───────────────────────────────────────────────────────────────
export default function ProfitCalculator() {
  // Inputs
  const [productCost, setProductCost] = useState(12);
  const [shipping, setShipping] = useState(8);
  const [platformKey, setPlatformKey] = useState('Shopify');
  const [customPlatformFee, setCustomPlatformFee] = useState(5);
  const [adSpend, setAdSpend] = useState(10);
  const [sellingPrice, setSellingPrice] = useState(49);

  // Auto-fill from URL params (e.g. from Winning Products quick actions or demo links)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const price = params.get('price');
    const cost = params.get('cost');
    if (price) {
      const parsed = parseFloat(price);
      if (!isNaN(parsed)) setSellingPrice(parsed);
    }
    if (cost) {
      const parsedCost = parseFloat(cost);
      if (!isNaN(parsedCost)) setProductCost(parsedCost);
    }

    // Maya prefill — agentic navigation
    const mayaPrefill = sessionStorage.getItem('maya_prefill_profit-calculator');
    if (mayaPrefill) {
      try {
        const data = JSON.parse(mayaPrefill);
        if (data.sellPrice) {
          const parsed = parseFloat(String(data.sellPrice));
          if (!isNaN(parsed)) setSellingPrice(parsed);
        }
        if (data.costPrice) {
          const parsed = parseFloat(String(data.costPrice));
          if (!isNaN(parsed)) setProductCost(parsed);
        }
        sessionStorage.removeItem('maya_prefill_profit-calculator');
      } catch {
        /* ignore */
      }
    }
  }, []);

  const platformFeeRate = useMemo(() => {
    const opt = PLATFORM_OPTIONS.find((o) => o.label === platformKey);
    if (!opt || opt.value === -1) return customPlatformFee;
    return opt.value;
  }, [platformKey, customPlatformFee]);

  // ── Calculations ────────────────────────────────────────────────────────
  const calc = useMemo(() => {
    const revenue = sellingPrice;
    const platformFeeAmt = (platformFeeRate / 100) * sellingPrice;
    const paymentFeeAmt = (PAYMENT_PROCESSING_RATE / 100) * sellingPrice;
    const costsBeforeAds = productCost + shipping + platformFeeAmt + paymentFeeAmt;
    const totalCosts = costsBeforeAds + adSpend;

    const grossMarginAmt = revenue - costsBeforeAds;
    const grossMarginPct = revenue > 0 ? (grossMarginAmt / revenue) * 100 : 0;

    const netMarginAmt = revenue - totalCosts;
    const netMarginPct = revenue > 0 ? (netMarginAmt / revenue) * 100 : 0;

    const roas = adSpend > 0 ? sellingPrice / adSpend : Infinity;
    const breakEvenRoas =
      netMarginAmt >= 0 && adSpend > 0
        ? sellingPrice / (sellingPrice - costsBeforeAds)
        : adSpend > 0
          ? sellingPrice / (sellingPrice - costsBeforeAds)
          : 0;

    const projections = [100, 500, 1000].map((orders) => ({
      orders,
      revenue: revenue * orders,
      costs: totalCosts * orders,
      profit: netMarginAmt * orders,
    }));

    const afterpayEligible = sellingPrice <= 2000;

    let verdictColor: string;
    let verdictLabel: string;
    let verdictReason: string;
    if (netMarginPct > 30) {
      verdictColor = '#22c55e';
      verdictLabel = 'Highly Viable';
      verdictReason =
        'Strong margins above 30%. This product has healthy room for scaling ad spend, absorbing returns, and still turning a solid profit per unit.';
    } else if (netMarginPct >= 15) {
      verdictColor = '#eab308';
      verdictLabel = 'Proceed with Caution';
      verdictReason =
        'Margins between 15–30% can work but leave limited room for error. Optimise ad spend, negotiate supplier costs, or increase your selling price to improve viability.';
    } else {
      verdictColor = '#ef4444';
      verdictLabel = 'Not Viable';
      verdictReason =
        'Net margin below 15% makes this product risky at scale. Factor in returns, refunds, and overhead — there may not be enough margin to sustain the business.';
    }

    return {
      revenue,
      totalCosts,
      grossMarginAmt,
      grossMarginPct,
      netMarginAmt,
      netMarginPct,
      roas,
      breakEvenRoas,
      projections,
      afterpayEligible,
      verdictColor,
      verdictLabel,
      verdictReason,
    };
  }, [productCost, shipping, platformFeeRate, adSpend, sellingPrice]);

  // ── Shared styles ───────────────────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    background: '#0c0c10',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: '24px',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'DM Sans, sans-serif',
    fontSize: 13,
    color: '#a1a1aa',
    marginBottom: 8,
    display: 'block',
  };

  const numberInputStyle: React.CSSProperties = {
    fontFamily: 'DM Sans, sans-serif',
    background: '#15151a',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    color: '#f5f5f5',
    padding: '8px 12px',
    width: 90,
    fontSize: 14,
    outline: 'none',
  };

  const sliderStyle: React.CSSProperties = {
    flex: 1,
    accentColor: '#6366F1',
    height: 6,
    cursor: 'pointer',
  };

  // ── Slider + number group ───────────────────────────────────────────────
  const InputGroup = ({
    label,
    value,
    onChange,
    min,
    max,
    step,
    prefix = '$',
    suffix = '',
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    min: number;
    max: number;
    step: number;
    prefix?: string;
    suffix?: string;
  }) => (
    <div style={{ marginBottom: 20 }}>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={sliderStyle}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontFamily: 'DM Sans, sans-serif',
            color: '#a1a1aa',
            fontSize: 14,
          }}
        >
          {prefix && <span>{prefix}</span>}
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
            }}
            style={numberInputStyle}
          />
          {suffix && <span>{suffix}</span>}
        </div>
      </div>
    </div>
  );

  // ── Result card ─────────────────────────────────────────────────────────
  const ResultCard = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
    <div style={{ ...cardStyle, padding: '20px 24px' }}>
      <div style={{ ...labelStyle, marginBottom: 4 }}>{label}</div>
      <div
        style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 28,
          fontWeight: 700,
          color: '#f5f5f5',
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            color: '#a1a1aa',
            marginTop: 4,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#060608',
        padding: '40px 24px 80px',
        fontFamily: 'DM Sans, sans-serif',
      }}
    >
      <Helmet><title>Profit Calculator | Majorka</title></Helmet>
      {/* Header */}
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto 40px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'rgba(99,102,241,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Calculator size={24} color="#6366F1" />
        </div>
        <div>
          <h1
            style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 28,
              fontWeight: 700,
              color: '#f5f5f5',
              margin: 0,
            }}
          >
            Profit Calculator
          </h1>
          <p
            style={{
              fontSize: 14,
              color: '#a1a1aa',
              margin: 0,
              marginTop: 2,
            }}
          >
            Model your unit economics for the Australian market
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 32,
        }}
        className="profit-calc-grid"
      >
        {/* ── LEFT: Inputs ─────────────────────────────────────────────── */}
        <div>
          <div style={cardStyle}>
            <h2
              style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 18,
                fontWeight: 600,
                color: '#f5f5f5',
                margin: '0 0 24px',
              }}
            >
              Product & Costs
            </h2>

            <InputGroup
              label="Product Cost (AUD)"
              value={productCost}
              onChange={setProductCost}
              min={0}
              max={200}
              step={0.5}
            />

            <InputGroup
              label="Shipping to AU (AUD)"
              value={shipping}
              onChange={setShipping}
              min={0}
              max={50}
              step={0.5}
            />

            {/* Platform Fees */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Platform Fees</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <select
                  value={platformKey}
                  onChange={(e) => setPlatformKey(e.target.value)}
                  style={{
                    flex: 1,
                    fontFamily: 'DM Sans, sans-serif',
                    background: '#15151a',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8,
                    color: '#f5f5f5',
                    padding: '10px 12px',
                    fontSize: 14,
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {PLATFORM_OPTIONS.map((o) => (
                    <option key={o.label} value={o.label}>
                      {o.label}
                      {o.value > 0 ? ` (${o.value}%)` : ''}
                    </option>
                  ))}
                </select>
                {platformKey === 'Custom' && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      color: '#a1a1aa',
                      fontSize: 14,
                    }}
                  >
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={customPlatformFee}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        if (!isNaN(v)) setCustomPlatformFee(Math.min(100, Math.max(0, v)));
                      }}
                      style={{ ...numberInputStyle, width: 70 }}
                    />
                    <span>%</span>
                  </div>
                )}
              </div>
              <div
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 12,
                  color: '#52525b',
                  marginTop: 6,
                }}
              >
                Fee: {platformFeeRate}% = {fmt((platformFeeRate / 100) * sellingPrice)} per unit
              </div>
            </div>

            {/* Payment Processing — fixed display */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Payment Processing (Stripe AU)</label>
              <div
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 14,
                  color: '#f5f5f5',
                  background: '#15151a',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>{PAYMENT_PROCESSING_RATE}%</span>
                <span style={{ color: '#a1a1aa' }}>
                  {fmt((PAYMENT_PROCESSING_RATE / 100) * sellingPrice)} per unit
                </span>
              </div>
            </div>

            {/* Ad Spend */}
            <InputGroup
              label="Ad Spend per Order (AUD)"
              value={adSpend}
              onChange={setAdSpend}
              min={0}
              max={50}
              step={0.5}
            />
            {adSpend > 0 && sellingPrice > 0 && (
              <div
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 12,
                  color: '#52525b',
                  marginTop: -12,
                  marginBottom: 20,
                }}
              >
                Implied ROAS: {calc.roas === Infinity ? '∞' : calc.roas.toFixed(2)}x
              </div>
            )}

            {/* Selling Price */}
            <InputGroup
              label="Selling Price (AUD)"
              value={sellingPrice}
              onChange={setSellingPrice}
              min={0}
              max={500}
              step={1}
            />
          </div>
        </div>

        {/* ── RIGHT: Results ───────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Animated SVG Gauge + Verdict */}
          <div
            style={{
              ...cardStyle,
              borderColor: calc.verdictColor,
              borderWidth: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
            }}
          >
            {/* SVG Arc Gauge */}
            <ProfitGauge value={Math.max(0, Math.min(100, calc.netMarginPct))} color={calc.verdictColor} />

            {/* Verdict label */}
            <div style={{ textAlign: 'center' }}>
              <span
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 22,
                  fontWeight: 800,
                  color: calc.verdictColor,
                  display: 'block',
                }}
              >
                {calc.verdictLabel}
              </span>
              <p
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 13,
                  color: '#a1a1aa',
                  margin: '8px 0 0',
                  lineHeight: 1.6,
                  maxWidth: 340,
                  textAlign: 'center',
                }}
              >
                {calc.verdictReason}
              </p>
            </div>
          </div>

          {/* Metric cards grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
            }}
          >
            <ResultCard label="Revenue per Unit" value={fmt(calc.revenue)} />
            <ResultCard label="Total Costs" value={fmt(calc.totalCosts)} />
            <ResultCard
              label="Gross Margin (before ads)"
              value={fmt(calc.grossMarginAmt)}
              sub={pct(calc.grossMarginPct)}
            />
            <ResultCard
              label="Net Margin (after ads)"
              value={fmt(calc.netMarginAmt)}
              sub={pct(calc.netMarginPct)}
            />
            <ResultCard
              label="Break-even ROAS"
              value={
                calc.breakEvenRoas === Infinity || isNaN(calc.breakEvenRoas)
                  ? 'N/A'
                  : `${calc.breakEvenRoas.toFixed(2)}x`
              }
            />
            <ResultCard
              label="Afterpay Eligible"
              value={calc.afterpayEligible ? 'Yes' : 'No'}
              sub={calc.afterpayEligible ? 'Product under $2,000 AUD' : 'Exceeds $2,000 AUD limit'}
            />
          </div>

          {/* Monthly Projections */}
          <div style={cardStyle} id="profit-results-card">
            <h3
              style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 16,
                fontWeight: 600,
                color: '#f5f5f5',
                margin: '0 0 16px',
              }}
            >
              Monthly Profit Projections
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 14,
                }}
              >
                <thead>
                  <tr>
                    {['Orders', 'Revenue', 'Costs', 'Profit'].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: 'left',
                          padding: '10px 12px',
                          color: '#52525b',
                          fontWeight: 500,
                          fontSize: 12,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          borderBottom: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {calc.projections.map((row) => (
                    <tr key={row.orders}>
                      <td
                        style={{
                          padding: '12px',
                          color: '#f5f5f5',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                        }}
                      >
                        {row.orders.toLocaleString()}
                      </td>
                      <td
                        style={{
                          padding: '12px',
                          color: '#f5f5f5',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                        }}
                      >
                        {fmt(row.revenue)}
                      </td>
                      <td
                        style={{
                          padding: '12px',
                          color: '#a1a1aa',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                        }}
                      >
                        {fmt(row.costs)}
                      </td>
                      <td
                        style={{
                          padding: '12px',
                          color: row.profit >= 0 ? '#22c55e' : '#ef4444',
                          fontWeight: 600,
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                        }}
                      >
                        {fmt(row.profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Interpretation Card */}
          <div
            style={{
              ...cardStyle,
              background: 'rgba(99,102,241,0.04)',
              borderColor: 'rgba(99,102,241,0.18)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <h3
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#6366F1',
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                What This Means
              </h3>
              <button
                onClick={() => {
                  const summary = [
                    `Profit Calculator Results`,
                    `────────────────────────`,
                    `Selling Price: ${fmt(calc.revenue)}`,
                    `Total Costs: ${fmt(calc.totalCosts)}`,
                    `Gross Margin: ${fmt(calc.grossMarginAmt)} (${pct(calc.grossMarginPct)})`,
                    `Net Margin: ${fmt(calc.netMarginAmt)} (${pct(calc.netMarginPct)})`,
                    `Break-even ROAS: ${calc.breakEvenRoas === Infinity ? '∞' : calc.breakEvenRoas.toFixed(2)}x`,
                    `Verdict: ${calc.verdictLabel}`,
                    `────────────────────────`,
                    `100 orders → ${fmt(calc.projections[0].profit)} profit`,
                    `500 orders → ${fmt(calc.projections[1].profit)} profit`,
                    `1,000 orders → ${fmt(calc.projections[2].profit)} profit`,
                  ].join('\n');
                  navigator.clipboard.writeText(summary);
                  toast.success('Results copied to clipboard!');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#6366F1',
                  background: 'rgba(99,102,241,0.08)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 8,
                  padding: '6px 12px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.15)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.08)')}
              >
                <Share2 size={12} />
                Share Results
              </button>
            </div>
            <p
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 13,
                color: 'rgba(245,245,245,0.75)',
                margin: 0,
                lineHeight: 1.7,
              }}
            >
              {calc.netMarginPct > 30
                ? `You're looking at a ${pct(calc.netMarginPct)} net margin — that's genuinely strong for AU ecommerce. At ${fmt(calc.netMarginAmt)} profit per unit, this product can absorb returns (typically 3–5%), platform fee changes, and ad CPM spikes while remaining profitable. The break-even ROAS of ${calc.breakEvenRoas.toFixed(2)}x means your ads don't need to be exceptional to make money. Next step: run a $50/day validation campaign targeting AU buyers and aim for 3+ ROAS before scaling.`
                : calc.netMarginPct >= 15
                  ? `A ${pct(calc.netMarginPct)} net margin is workable but tight. At ${fmt(calc.netMarginAmt)} per unit, one bad batch of returns or a spike in ad CPMs could push you to break-even. To improve: negotiate your COGS down by 10–15% with your supplier, test a price point $5–10 higher, or reduce ad spend per order by improving your creative CTR. Don't scale until you hit 3+ ROAS consistently over 7 days.`
                  : `At ${pct(calc.netMarginPct)} net margin, this product is high-risk at scale. You have less than ${fmt(Math.abs(calc.netMarginAmt) + 5)} cushion per unit — not enough to cover returns, refunds, or underperforming ad days. Consider increasing the selling price, finding a cheaper supplier, or cutting ad spend. If you can't hit 20%+ net margin on paper, don't launch.`}
            </p>
          </div>
        </div>
      </div>

      {/* Responsive CSS for grid stacking */}
      <style>{`
        @media (max-width: 768px) {
          .profit-calc-grid {
            grid-template-columns: 1fr !important;
          }
        }
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          background: #1e1e24;
          border-radius: 4px;
          height: 6px;
          outline: none;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #6366F1;
          cursor: pointer;
          border: 2px solid #060608;
          box-shadow: 0 0 8px rgba(99,102,241,0.3);
        }
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #6366F1;
          cursor: pointer;
          border: 2px solid #060608;
          box-shadow: 0 0 8px rgba(99,102,241,0.3);
        }
      `}</style>
    </div>
  );
}
