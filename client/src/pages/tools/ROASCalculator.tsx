import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Calculator } from 'lucide-react';

/**
 * Public ROAS Calculator — /tools/roas-calculator
 *
 * No login required. Standalone page with dark theme but no sidebar.
 * Live-updating outputs as inputs change.
 */

type CurrencyCode = 'AUD' | 'USD' | 'GBP' | 'CAD' | 'NZD' | 'EUR' | 'SGD';
const CURRENCIES: { code: CurrencyCode; symbol: string; label: string }[] = [
  { code: 'AUD', symbol: '$', label: 'Australian Dollar' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'CAD', symbol: '$', label: 'Canadian Dollar' },
  { code: 'NZD', symbol: '$', label: 'New Zealand Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'SGD', symbol: '$', label: 'Singapore Dollar' },
];

interface Inputs {
  currency: CurrencyCode;
  cost: number;
  price: number;
  adSpend: number;
  shipping: number;
  feePct: number;
}

interface Outputs {
  grossMarginPct: number | null;
  netMarginPct: number | null;
  breakEvenRoas: number | null;
  maxCpa: number | null;
  monthlyProfit: number | null;
  monthlyProfitAt2x: number | null;
  isProfitable: boolean;
}

function compute(inp: Inputs): Outputs {
  const { cost, price, adSpend, shipping, feePct } = inp;
  if (price <= 0) {
    return {
      grossMarginPct: null,
      netMarginPct: null,
      breakEvenRoas: null,
      maxCpa: null,
      monthlyProfit: null,
      monthlyProfitAt2x: null,
      isProfitable: false,
    };
  }
  const platformFee = (price * feePct) / 100;
  const grossProfitPerUnit = price - cost - shipping - platformFee;
  const grossMarginPct = ((price - cost - shipping) / price) * 100;

  // Assume 50 sales/day for monthly projections
  const monthlySales = 50 * 30;
  const grossRevenue = price * monthlySales;
  const totalCost = (cost + shipping + platformFee) * monthlySales;
  const netProfitMonthly = grossRevenue - totalCost - adSpend;
  const netMarginPct = (netProfitMonthly / grossRevenue) * 100;

  const breakEvenRoas = grossProfitPerUnit > 0 ? price / grossProfitPerUnit : null;
  const maxCpa = grossProfitPerUnit > 0 ? grossProfitPerUnit : null;

  const netProfitAt2x = grossRevenue - totalCost - (adSpend * 2);

  return {
    grossMarginPct,
    netMarginPct,
    breakEvenRoas,
    maxCpa,
    monthlyProfit: netProfitMonthly,
    monthlyProfitAt2x: netProfitAt2x,
    isProfitable: netProfitMonthly > 0,
  };
}

function fmtPct(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return `${v.toFixed(1)}%`;
}
function fmtMoney(v: number | null, symbol: string): string {
  if (v == null || !Number.isFinite(v)) return '—';
  const abs = Math.abs(v);
  const formatted = abs >= 1000
    ? Math.round(abs).toLocaleString()
    : abs.toFixed(2);
  return `${v < 0 ? '-' : ''}${symbol}${formatted}`;
}
function fmtRoas(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return `${v.toFixed(2)}x`;
}

function colourForMargin(pct: number | null): string {
  if (pct == null) return '#71717a';
  if (pct >= 30) return '#22c55e';
  if (pct >= 15) return '#f59e0b';
  return '#ef4444';
}

export default function ROASCalculator() {
  const [inputs, setInputs] = useState<Inputs>({
    currency: 'AUD',
    cost: 8,
    price: 29.95,
    adSpend: 500,
    shipping: 4.5,
    feePct: 2.9,
  });

  const outputs = useMemo(() => compute(inputs), [inputs]);
  const currency = CURRENCIES.find((c) => c.code === inputs.currency)!;
  const sym = currency.symbol;

  function update<K extends keyof Inputs>(key: K, value: Inputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }
  function updateNum(key: keyof Omit<Inputs, 'currency'>, raw: string) {
    const n = Number(raw);
    update(key, Number.isFinite(n) && n >= 0 ? n : 0);
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#f5f5f5',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Nav */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'linear-gradient(135deg, #4f8ef7, #4f8ef7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 14,
            fontFamily: "'Syne', sans-serif",
          }}>M</div>
          <span style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 16, fontWeight: 700, color: '#f5f5f5',
            letterSpacing: '-0.02em',
          }}>Majorka</span>
        </Link>
        <Link href="/" style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 13, color: '#a1a1aa', textDecoration: 'none',
        }}>
          <ArrowLeft size={14} /> Back to Majorka
        </Link>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '64px 24px 96px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '6px 14px', borderRadius: 999,
            background: 'rgba(79,142,247,0.08)',
            border: '1px solid rgba(79,142,247,0.2)',
            marginBottom: 18,
          }}>
            <Calculator size={14} color="#a5b4fc" />
            <span style={{
              fontSize: 11, fontFamily: 'monospace', color: '#a5b4fc',
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>Free tool</span>
          </div>
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 'clamp(32px, 5vw, 52px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            margin: '0 0 14px',
            lineHeight: 1.1,
          }}>
            Dropshipping ROAS Calculator
          </h1>
          <p style={{ fontSize: 16, color: '#a1a1aa', margin: 0, maxWidth: 560, marginInline: 'auto', lineHeight: 1.55 }}>
            Find out if a product is actually profitable before spending a dollar on ads. Live calculation as you type.
          </p>
        </div>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(260px, 360px) 1fr',
          gap: 28,
          alignItems: 'flex-start',
        }} className="mj-roas-grid">
          {/* Inputs */}
          <div style={{
            background: '#111114',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16,
            padding: 24,
          }}>
            <div style={{
              fontSize: 11, fontFamily: 'monospace', color: '#71717a',
              letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16,
            }}>Inputs</div>

            <Field label="Currency">
              <select
                value={inputs.currency}
                onChange={(e) => update('currency', e.target.value as CurrencyCode)}
                style={inputStyle}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code} — {c.label}</option>
                ))}
              </select>
            </Field>

            <Field label={`Product cost (${sym})`} hint="Landed cost from supplier">
              <input type="number" min={0} step="0.01" value={inputs.cost}
                onChange={(e) => updateNum('cost', e.target.value)} style={inputStyle} />
            </Field>

            <Field label={`Selling price (${sym})`} hint="Retail price customers pay">
              <input type="number" min={0} step="0.01" value={inputs.price}
                onChange={(e) => updateNum('price', e.target.value)} style={inputStyle} />
            </Field>

            <Field label={`Ad spend / month (${sym})`}>
              <input type="number" min={0} step="1" value={inputs.adSpend}
                onChange={(e) => updateNum('adSpend', e.target.value)} style={inputStyle} />
            </Field>

            <Field label={`Shipping per unit (${sym})`}>
              <input type="number" min={0} step="0.01" value={inputs.shipping}
                onChange={(e) => updateNum('shipping', e.target.value)} style={inputStyle} />
            </Field>

            <Field label="Platform fee %" hint="Shopify ~2.9%, Etsy ~6.5%">
              <input type="number" min={0} step="0.1" value={inputs.feePct}
                onChange={(e) => updateNum('feePct', e.target.value)} style={inputStyle} />
            </Field>
          </div>

          {/* Outputs */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 14,
          }}>
            <StatCard
              label="Gross margin"
              value={fmtPct(outputs.grossMarginPct)}
              color={colourForMargin(outputs.grossMarginPct)}
              hint="Profit per unit before ads"
            />
            <StatCard
              label="Net margin after ads"
              value={fmtPct(outputs.netMarginPct)}
              color={colourForMargin(outputs.netMarginPct)}
              hint="At 50 sales/day assumption"
            />
            <StatCard
              label="Break-even ROAS"
              value={fmtRoas(outputs.breakEvenRoas)}
              color="#a5b4fc"
              hint="Minimum return on ad spend"
            />
            <StatCard
              label="Max CPA"
              value={fmtMoney(outputs.maxCpa, sym)}
              color="#a5b4fc"
              hint="Maximum cost per customer"
            />
            <StatCard
              label="Monthly profit"
              value={fmtMoney(outputs.monthlyProfit, sym)}
              color={outputs.isProfitable ? '#22c55e' : '#ef4444'}
              hint="At current ad spend"
            />
            <StatCard
              label="Profit at 2x ad spend"
              value={fmtMoney(outputs.monthlyProfitAt2x, sym)}
              color={(outputs.monthlyProfitAt2x ?? 0) > 0 ? '#22c55e' : '#ef4444'}
              hint="Doubled ad budget scenario"
            />
          </div>
        </div>

        {/* Footer CTA */}
        <div style={{
          marginTop: 64,
          padding: 32,
          borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(79,142,247,0.08), rgba(79,142,247,0.04))',
          border: '1px solid rgba(79,142,247,0.18)',
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 22, fontWeight: 700, color: '#f5f5f5',
            marginBottom: 8, letterSpacing: '-0.02em',
          }}>
            Ready to find products worth the margin?
          </div>
          <p style={{ fontSize: 14, color: '#a1a1aa', margin: '0 0 20px' }}>
            Majorka shows 2,302+ AI-scored winning products across 7 markets with live AliExpress data.
          </p>
          <Link href="/sign-up" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 24px',
            background: '#4f8ef7',
            color: '#fff',
            fontWeight: 600,
            fontSize: 14,
            borderRadius: 999,
            textDecoration: 'none',
          }}>Explore Majorka free →</Link>
        </div>
      </div>

      <style>{`
        @media (max-width: 760px) {
          .mj-roas-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  padding: '11px 14px',
  color: '#f5f5f5',
  fontSize: 14,
  fontFamily: "'DM Sans', sans-serif",
  outline: 'none',
  boxSizing: 'border-box',
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: 'block',
        fontSize: 12,
        fontWeight: 600,
        color: '#e5e7eb',
        marginBottom: 6,
      }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 11, color: '#71717a', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function StatCard({ label, value, color, hint }: { label: string; value: string; color: string; hint: string }) {
  return (
    <div style={{
      background: '#111114',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14,
      padding: 20,
    }}>
      <div style={{
        fontSize: 10, fontFamily: 'monospace', color: '#71717a',
        letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10,
      }}>{label}</div>
      <div style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 30, fontWeight: 700, color, letterSpacing: '-0.02em',
        lineHeight: 1, marginBottom: 8,
      }}>{value}</div>
      <div style={{ fontSize: 11, color: '#71717a' }}>{hint}</div>
    </div>
  );
}
