import { useState } from 'react';
import { Link } from 'wouter';
import { ArrowUpRight } from 'lucide-react';
import { useProductStats } from '@/hooks/useProducts';
import { Skeleton } from '@/components/app/SkeletonRow';

const display = "'Bricolage Grotesque', system-ui, sans-serif";
const sans = "'DM Sans', system-ui, sans-serif";
const mono = "'JetBrains Mono', 'SF Mono', ui-monospace, monospace";

interface MarketInfo {
  code: string;
  flag: string;
  name: string;
  currency: string;
  payments: string;
  tax: string;
  note: string;
}
const MARKETS: MarketInfo[] = [
  { code: 'AU', flag: '🇦🇺', name: 'Australia',     currency: 'AUD', payments: 'Afterpay, Zip, ShopPay', tax: '10% GST',         note: 'Local AliExpress suppliers, Auspost shipping' },
  { code: 'US', flag: '🇺🇸', name: 'United States', currency: 'USD', payments: 'ShopPay, PayPal, Klarna', tax: 'State sales tax', note: 'Highest order volume; FB ad benchmarks built in' },
  { code: 'UK', flag: '🇬🇧', name: 'United Kingdom', currency: 'GBP', payments: 'Klarna, ClearPay, PayPal', tax: '20% VAT',        note: 'HMRC compliance, EU/UK split shipping' },
  { code: 'CA', flag: '🇨🇦', name: 'Canada',         currency: 'CAD', payments: 'PayPal, ShopPay',         tax: 'GST/HST/PST',     note: 'Cross-border duty handling' },
  { code: 'NZ', flag: '🇳🇿', name: 'New Zealand',    currency: 'NZD', payments: 'Afterpay, PayPal',         tax: '15% GST',         note: 'NZ Post rates, local supplier network' },
  { code: 'DE', flag: '🇩🇪', name: 'Germany',        currency: 'EUR', payments: 'Klarna, SOFORT, PayPal',   tax: '19% VAT',         note: 'GDPR-first onboarding, EU shipping' },
  { code: 'SG', flag: '🇸🇬', name: 'Singapore',      currency: 'SGD', payments: 'PayLah, PayPal, ShopPay',  tax: '9% GST',          note: 'Asia-Pacific shipping hub' },
];

export default function AppMarket() {
  const [active, setActive] = useState<string>('AU');
  const stats = useProductStats();
  const market = MARKETS.find((m) => m.code === active) ?? MARKETS[0];

  return (
    <div style={{ padding: '32px 32px 64px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: display, fontWeight: 600, fontSize: 28, color: '#ededed', letterSpacing: '-0.025em', margin: '0 0 6px' }}>Market Intelligence</h1>
        <p style={{ fontFamily: sans, fontSize: 14, color: '#71717a', margin: 0 }}>
          Localised pricing, suppliers, taxes, and benchmarks for seven regions.
        </p>
      </div>

      {/* Market grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 12,
        marginBottom: 32,
      }}>
        {MARKETS.map((m) => {
          const isActive = m.code === active;
          return (
            <button
              key={m.code}
              onClick={() => setActive(m.code)}
              style={{
                background: isActive ? 'rgba(99,102,241,0.08)' : '#111114',
                border: `1px solid ${isActive ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 10,
                padding: '20px 18px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 200ms',
                fontFamily: sans,
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
              }}
            >
              <div style={{ fontSize: 26, marginBottom: 10 }}>{m.flag}</div>
              <div style={{ fontFamily: mono, fontSize: 11, color: isActive ? '#6366F1' : '#52525b', letterSpacing: '0.08em', marginBottom: 4 }}>{m.code}</div>
              <div style={{ fontFamily: display, fontWeight: 600, fontSize: 15, color: '#ededed', letterSpacing: '-0.01em' }}>{m.name}</div>
            </button>
          );
        })}
      </div>

      {/* Active market detail */}
      <div style={{
        background: '#111114',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10,
        padding: 28,
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <span style={{ fontSize: 40 }}>{market.flag}</span>
          <div>
            <div style={{ fontFamily: mono, fontSize: 11, color: '#6366F1', letterSpacing: '0.08em', marginBottom: 4 }}>{market.code}</div>
            <h2 style={{ fontFamily: display, fontWeight: 700, fontSize: 24, color: '#ededed', letterSpacing: '-0.02em', margin: 0 }}>{market.name}</h2>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 1,
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 8,
          overflow: 'hidden',
          marginBottom: 22,
        }}>
          <Detail label="Currency"  value={market.currency} />
          <Detail label="Tax"       value={market.tax} />
          <Detail label="Payments"  value={market.payments} />
          <Detail
            label="Products in DB"
            value={stats.loading ? null : `${stats.total.toLocaleString()}`}
            sub="across all markets"
          />
        </div>

        <p style={{ fontFamily: sans, fontSize: 14, color: '#a1a1aa', lineHeight: 1.6, margin: '0 0 22px' }}>
          {market.note}.
        </p>

        <div style={{
          padding: '12px 16px',
          background: 'rgba(245,158,11,0.06)',
          border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 6,
          fontFamily: mono,
          fontSize: 12,
          color: '#f59e0b',
          marginBottom: 22,
        }}>
          ⚡ Per-market product filtering coming soon — for now, all products are sourced from AliExpress with global demand signals.
        </div>

        <Link href="/app/products" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 18px',
          background: '#6366F1',
          color: '#fff',
          borderRadius: 6,
          fontFamily: sans,
          fontSize: 13,
          fontWeight: 600,
          textDecoration: 'none',
        }}>View all products <ArrowUpRight size={14} /></Link>
      </div>
    </div>
  );
}

function Detail({ label, value, sub }: { label: string; value: string | null; sub?: string }) {
  return (
    <div style={{ background: '#0d0d10', padding: '16px 18px' }}>
      <div style={{ fontFamily: mono, fontSize: 10, color: '#52525b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: display, fontSize: 18, fontWeight: 700, color: '#ededed', letterSpacing: '-0.015em' }}>
        {value ?? <Skeleton width={60} height={16} />}
      </div>
      {sub && <div style={{ fontSize: 11, color: '#52525b', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}
