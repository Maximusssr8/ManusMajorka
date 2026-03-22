import { lazy, Suspense, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/supabase';

const TrendSignals = lazy(() => import('./TrendSignals'));
const FullDatabase = lazy(() => import('./intelligence/FullDatabase'));
const ProductDiscovery = lazy(() => import('./ProductDiscovery'));

type TabKey = 'trending' | 'database' | 'scout';

const C = { bg: '#080a0e', surface: '#111118', border: '#1e1e1e', gold: '#6366F1', text: '#f0ede8', muted: 'rgba(240,237,232,0.5)' };

interface TrendProduct {
  id?: string;
  name: string;
  niche: string;
  trend_score: number;
  estimated_retail_aud?: number;
  estimated_margin_pct?: number;
  dropship_viability_score?: number;
  trend_reason?: string;
  image_url?: string;
}

const SEED_PRODUCTS: TrendProduct[] = [
  { name: 'Red Light Therapy Wand', niche: 'Health & Wellness', trend_score: 92, estimated_retail_aud: 89, estimated_margin_pct: 65, dropship_viability_score: 88, trend_reason: 'Exploding on TikTok AU — wellness creators driving massive demand.' },
  { name: 'LED Teeth Whitening Kit', niche: 'Beauty & Skincare', trend_score: 88, estimated_retail_aud: 59, estimated_margin_pct: 72, dropship_viability_score: 85, trend_reason: 'Instagram influencers posting before/after results going viral.' },
  { name: 'Smart Herb Garden Kit', niche: 'Home & Kitchen', trend_score: 84, estimated_retail_aud: 79, estimated_margin_pct: 58, dropship_viability_score: 82, trend_reason: 'Sustainability trend + apartment living driving indoor garden demand.' },
  { name: 'Portable Neck Massager', niche: 'Health & Wellness', trend_score: 81, estimated_retail_aud: 69, estimated_margin_pct: 68, dropship_viability_score: 80, trend_reason: 'WFH ergonomic pain solution — consistent search volume growth.' },
  { name: 'Ice Roller Face Tool', niche: 'Beauty & Skincare', trend_score: 79, estimated_retail_aud: 29, estimated_margin_pct: 78, dropship_viability_score: 90, trend_reason: 'Morning routine staple — low cost, high perceived value.' },
  { name: 'Silicone Air Fryer Liners', niche: 'Home & Kitchen', trend_score: 76, estimated_retail_aud: 19, estimated_margin_pct: 82, dropship_viability_score: 92, trend_reason: 'Air fryer penetration at 70% in AU — accessories market booming.' },
];

function timeSince(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function ProductCard({ product, rank }: { product: TrendProduct; rank: number }) {
  const imgSrc = product.image_url || null;

  return (
    <div
      style={{
        background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden',
        transition: 'border-color 0.2s, box-shadow 0.2s', cursor: 'default',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.gold; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 1px ${C.gold}44`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.border; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
    >
      <div style={{ position: 'relative', height: 180, background: 'linear-gradient(135deg, #1a1a2e, #111118)', overflow: 'hidden' }}>
        {imgSrc ? (
          <img src={imgSrc} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>🛍️</div>
        )}
        {rank <= 3 && (
          <div style={{ position: 'absolute', top: 10, left: 10, background: rank === 1 ? '#f59e0b' : rank === 2 ? '#9ca3af' : '#cd7c2f', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 700, color: '#fff' }}>
            #{rank} Today
          </div>
        )}
        <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.7)', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 700, color: C.gold }}>
          {product.trend_score}/100
        </div>
      </div>
      <div style={{ padding: '16px' }}>
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.text, display: 'block', marginBottom: 6, fontFamily: 'Syne, sans-serif' }}>{product.name}</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'rgba(99,102,241,0.12)', color: C.gold, border: '1px solid rgba(99,102,241,0.2)' }}>{product.niche}</span>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>Trending</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
          {product.estimated_retail_aud && <div><span style={{ fontSize: 16, fontWeight: 800, color: C.gold, fontFamily: 'Syne, sans-serif' }}>${product.estimated_retail_aud}</span><span style={{ fontSize: 11, color: C.muted, marginLeft: 3 }}>AUD</span></div>}
          {product.estimated_margin_pct && <div><span style={{ fontSize: 14, fontWeight: 600, color: '#10b981' }}>{product.estimated_margin_pct}%</span><span style={{ fontSize: 11, color: C.muted, marginLeft: 3 }}>margin</span></div>}
          {product.dropship_viability_score && <div><span style={{ fontSize: 14, fontWeight: 600, color: C.gold }}>{product.dropship_viability_score}</span><span style={{ fontSize: 11, color: C.muted, marginLeft: 3 }}>viability</span></div>}
        </div>
        {product.trend_reason && (
          <p style={{ fontSize: 12, color: C.muted, marginBottom: 12, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {product.trend_reason}
          </p>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => {
              const params = new URLSearchParams({
                productName: product.name,
                niche: product.niche,
                price: String(product.estimated_retail_aud || 49),
                description: product.trend_reason || '',
                imageUrl: product.image_url || '',
                viability: String(product.dropship_viability_score || ''),
                fromDatabase: 'true',
              });
              window.location.href = `/app/website-generator?${params}`;
            }}
            style={{ flex: 1, padding: '8px 0', borderRadius: 8, background: C.gold, color: '#080a0e', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}
          >
            Build Store
          </button>
          <button
            onClick={() => {
              const params = new URLSearchParams({ niche: product.niche, product: product.name });
              window.location.href = `/app/profit?${params}`;
            }}
            style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, color: C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            $
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductIntelligence() {
  const [tab, setTab] = useState<TabKey>('trending');
  const [products, setProducts] = useState<TrendProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [showBanner, setShowBanner] = useState(() => !localStorage.getItem('majorka_dismiss_build_banner'));

  useEffect(() => {
    setLoading(true);
    supabase
      .from('trend_signals')
      .select('*')
      .order('trend_score', { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (error || !data || data.length === 0) {
          setProducts(SEED_PRODUCTS);
        } else {
          setProducts(data as TrendProduct[]);
        }
        setLastRefresh(new Date());
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'DM Sans', sans-serif" }}>
      <Helmet><title>Product Intelligence | Majorka</title></Helmet>
      <div style={{ padding: '24px 24px 0', maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, color: C.text, margin: 0, marginBottom: 4 }}>Product Intelligence</h1>
        <p style={{ color: C.muted, fontSize: 14, margin: 0, marginBottom: 20 }}>Discover winning products for the AU market</p>

        <div style={{ display: 'flex', gap: 20, fontSize: 12, color: C.muted, marginBottom: 24, borderBottom: `1px solid ${C.border}`, paddingBottom: 16 }}>
          <span><strong style={{ color: C.gold }}>{products.length}</strong> products tracked</span>
          <span><strong style={{ color: C.gold }}>6h</strong> refresh cycle</span>
          {lastRefresh && <span>Updated <strong style={{ color: C.text }}>{timeSince(lastRefresh)}</strong></span>}
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {(['trending', 'database', 'scout'] as TabKey[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: tab === t ? C.gold : 'rgba(255,255,255,0.04)',
              color: tab === t ? '#080a0e' : C.muted,
              fontFamily: 'Syne, sans-serif', letterSpacing: '0.02em',
            }}>
              {t === 'trending' ? 'Trending Today' : t === 'database' ? 'Full Database' : 'Scout'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 24px 60px', maxWidth: 1200, margin: '0 auto' }}>
        {tab === 'trending' && (
          <Suspense fallback={<div style={{ textAlign: 'center', padding: 60, color: C.muted }}>Loading...</div>}>
            <FullDatabase presetFilter="trending" />
          </Suspense>
        )}
        {tab === 'database' && (
          <Suspense fallback={<div style={{ textAlign: 'center', padding: 60, color: C.muted }}>Loading...</div>}>
            <FullDatabase />
          </Suspense>
        )}
        {tab === 'scout' && (
          <Suspense fallback={<div style={{ textAlign: 'center', padding: 60, color: C.muted }}>Loading...</div>}>
            <ProductDiscovery />
          </Suspense>
        )}
      </div>
    </div>
  );
}
