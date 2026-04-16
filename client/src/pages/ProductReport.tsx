/**
 * ProductReport.tsx — Public shareable product intelligence report.
 * Route: /product/:slug
 * No auth required — viral growth driver.
 */

import MajorkaLogo from '@/components/MajorkaLogo';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Copy } from 'lucide-react';
import { Link, useParams } from 'wouter';
import { SEO } from '@/components/SEO';

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: '#0B0F1A',
  card: '#141924',
  elevated: '#1A2130',
  border: 'rgba(255,255,255,0.08)',
  text: '#F1F5F9',
  secondary: '#94A3B8',
  muted: '#64748B',
  gold: '#4f8ef7',
  goldDim: 'rgba(79,142,247,0.08)',
  goldBorder: 'rgba(79,142,247,0.25)',
  green: '#22c55e',
  red: '#ef4444',
};

const syne = "'Syne', sans-serif";
const dm = "'DM Sans', sans-serif";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

interface WinningProduct {
  id: string;
  product_title: string;
  image_url: string | null;
  category: string | null;
  platform: string;
  price_aud: number | null;
  winning_score: number;
  trend: string | null;
  competition_level: string | null;
  au_relevance: number;
  est_daily_revenue_aud: number | null;
  units_per_day: number | null;
  why_winning: string | null;
  ad_angle: string | null;
  est_monthly_revenue_aud?: number | null;
}

function fmtAUD(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return `$${n.toLocaleString('en-AU', { maximumFractionDigits: 0 })}`;
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
      <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: `linear-gradient(90deg, ${C.gold}, #A5B4FC)`, borderRadius: 4, transition: 'width 0.8s ease' }} />
      </div>
      <span style={{ fontFamily: syne, fontWeight: 800, fontSize: 16, color: C.gold, flexShrink: 0 }}>{score}/100</span>
    </div>
  );
}

function TrendBadge({ trend }: { trend: string | null }) {
  const map: Record<string, { emoji: string; label: string; color: string; bg: string }> = {
    exploding: { emoji: '🔥', label: 'Exploding', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
    growing:   { emoji: '📈', label: 'Growing',   color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
    stable:    { emoji: '➡️', label: 'Stable',    color: '#94949e', bg: 'rgba(148,148,158,0.1)' },
    declining: { emoji: '📉', label: 'Declining', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  };
  const t = map[trend ?? ''] ?? map.stable;
  return (
    <span style={{ fontSize: 13, fontWeight: 700, color: t.color, background: t.bg, border: `1px solid ${t.color}40`, borderRadius: 8, padding: '4px 12px', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      {t.emoji} {t.label}
    </span>
  );
}

export default function ProductReport() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? '';

  const [product, setProduct] = useState<WinningProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => { supabase.auth.getSession().then(({ data }) => setIsLoggedIn(!!data.session)); }, []);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Fetch all products and match by slug
        const { data } = await supabase
          .from('winning_products')
          .select('*')
          .order('winning_score', { ascending: false })
          .limit(200);

        if (data && data.length > 0) {
          const match = data.find((p: WinningProduct) => slugify(p.product_title) === slug);
          setProduct(match ?? null);
        }
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const handleShare = () => {
    const url = `https://majorka.io/product/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <img src="/majorka-logo.jpg" alt="Majorka" width={36} height={36} style={{ width: 36, height: 36, objectFit: 'contain', display: 'block', borderRadius: 10, flexShrink: 0 }} draggable={false} />
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: 'white', letterSpacing: '-0.02em' }}>Majorka</span>
          <p style={{ color: C.secondary, fontSize: 14 }}>Loading product intelligence...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: dm, color: C.text }}>
        <div style={{ textAlign: 'center', maxWidth: 480, padding: '0 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <h1 style={{ fontFamily: syne, fontWeight: 800, fontSize: 28, marginBottom: 12 }}>Product not found</h1>
          <p style={{ color: C.secondary, marginBottom: 28 }}>This product report may have expired or doesn't exist yet.</p>
          <Link href="/app/winning-products" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `linear-gradient(135deg, ${C.gold}, #3B82F6)`, color: 'white', borderRadius: 12, padding: '12px 28px', fontFamily: syne, fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>
            Browse Winning Products →
          </Link>
        </div>
      </div>
    );
  }

  const dailyRevenue = product.est_daily_revenue_aud;
  const monthlyRevenue = product.est_monthly_revenue_aud ?? (dailyRevenue ? dailyRevenue * 30 : null);
  const compMap: Record<string, string> = { low: 'Low', medium: 'Medium', high: 'High' };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: dm, overflowX: 'hidden' }}>
      <SEO
        title={`${product.product_title} — AU Market Intelligence | Majorka`}
        description={`${product.product_title}: ${fmtAUD(dailyRevenue)}/day revenue. Winning score ${product.winning_score}/100. Find more winners on Majorka.`}
        path={`/product/${slug}`}
      />

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }`}</style>

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(8,10,14,0.9)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: `linear-gradient(135deg, ${C.gold}, #3B82F6)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: syne, fontWeight: 900, fontSize: 15, color: 'white' }}>M</div>
            <span style={{ fontFamily: syne, fontWeight: 800, fontSize: 15, letterSpacing: '0.08em', color: C.text }}>MAJORKA</span>
          </Link>
          <span style={{ fontSize: 12, color: C.secondary }}>🇦🇺 AU Market Intelligence</span>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Product Image */}
        {product.image_url && (
          <div style={{ width: '100%', height: 280, borderRadius: 16, overflow: 'hidden', marginBottom: 28, background: C.card }}>
            <img src={product.image_url} alt={product.product_title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <TrendBadge trend={product.trend} />
            {product.category && (
              <span style={{ fontSize: 12, color: C.secondary, background: C.goldDim, border: `1px solid ${C.goldBorder}`, borderRadius: 8, padding: '3px 10px' }}>{product.category}</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
            <h1 style={{ fontFamily: syne, fontWeight: 800, fontSize: 'clamp(1.4rem, 4vw, 2.2rem)', lineHeight: 1.2, color: C.text, margin: 0, flex: 1 }}>
              {product.product_title}
            </h1>
            <button
              onClick={handleShare}
              style={{
                height: 34, padding: '0 16px', background: '#4f8ef7', color: 'white',
                border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
                transition: 'transform 150ms, opacity 150ms',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.02)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
            >
              <Copy size={13} /> {copied ? 'Copied!' : 'Share Report'}
            </button>
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: C.secondary, marginBottom: 6, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Winning Score</div>
            <ScoreBar score={product.winning_score} />
          </div>
        </div>

        {/* Revenue stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Daily Revenue', value: fmtAUD(dailyRevenue) },
            { label: 'Monthly Revenue', value: fmtAUD(monthlyRevenue) },
            { label: 'Units/Day', value: product.units_per_day ? `${product.units_per_day}` : '—' },
            { label: 'AU Price', value: fmtAUD(product.price_aud) },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 14px' }}>
              <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
              <div style={{ fontFamily: syne, fontWeight: 900, fontSize: 20, color: C.gold }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Details */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px 20px', marginBottom: 24 }}>
          <h3 style={{ fontFamily: syne, fontWeight: 700, fontSize: 13, color: C.secondary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Product Intelligence</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
            {[
              { k: 'AU Relevance', v: `${product.au_relevance}%` },
              { k: 'Competition', v: compMap[product.competition_level ?? ''] ?? (product.competition_level ? product.competition_level : 'Moderate') },
              { k: 'Platform', v: product.platform },
              { k: 'Category', v: product.category ?? '—' },
            ].map(({ k, v }) => (
              <div key={k}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>{k}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Why winning */}
        {product.why_winning && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px 20px', marginBottom: 16 }}>
            <h3 style={{ fontFamily: syne, fontWeight: 700, fontSize: 14, color: C.gold, marginBottom: 12 }}>Why It's Winning</h3>
            <p style={{ fontSize: 14, color: C.secondary, lineHeight: 1.7 }}>{product.why_winning}</p>
          </div>
        )}

        {/* Ad angle */}
        {product.ad_angle && (
          <div style={{ background: 'rgba(79,142,247,0.04)', border: `1px solid ${C.goldBorder}`, borderRadius: 16, padding: '24px 20px', marginBottom: 28 }}>
            <h3 style={{ fontFamily: syne, fontWeight: 700, fontSize: 14, color: C.gold, marginBottom: 12 }}>🎯 Winning Ad Angle</h3>
            <p style={{ fontSize: 14, color: C.text, lineHeight: 1.7, fontStyle: 'italic' }}>{product.ad_angle && !product.ad_angle.includes('_') ? `"${product.ad_angle}"` : `"Highlight the key benefit: show how this product solves a real problem your target customer faces daily. Lead with the transformation, not the product."`}</p>
          </div>
        )}

        {/* Divider + upsell (only shown to non-logged-in visitors) */}
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 28, marginBottom: 24 }}>
          {!isLoggedIn && <div style={{ background: 'rgba(79,142,247,0.06)', border: `1px solid ${C.goldBorder}`, borderRadius: 16, padding: '24px 20px', textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>🔒</div>
            <h3 style={{ fontFamily: syne, fontWeight: 800, fontSize: 16, color: C.text, marginBottom: 8 }}>Full supplier data, competitor analysis, and 40+ more products like this →</h3>
            <p style={{ color: C.secondary, fontSize: 13, marginBottom: 20 }}>Get access to real-time AU market intelligence. Free plan available.</p>
            <Link href="/sign-in" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `linear-gradient(135deg, ${C.gold}, #3B82F6)`, color: 'white', borderRadius: 12, padding: '14px 32px', fontFamily: syne, fontWeight: 800, fontSize: 15, textDecoration: 'none' }}>
              Find More Winners on Majorka — Free →
            </Link>
          </div>}

          {/* Share button */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleShare}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 20px', color: C.secondary, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: dm, transition: 'border-color 0.2s' }}
            >
              {copied ? '✅ Copied!' : '🔗 Share this report'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: 12, color: C.muted }}>
          Powered by{' '}
          <Link href="/" style={{ color: C.gold, textDecoration: 'none' }}>Majorka.io</Link>
          {' '}· Data updated every 6 hours · 🇦🇺 AU Market Intelligence
        </div>
      </div>
    </div>
  );
}
