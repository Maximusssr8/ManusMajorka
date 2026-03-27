import { lazy, Suspense, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/supabase';

const FullDatabase = lazy(() => import('./intelligence/FullDatabase'));
const ProductDiscovery = lazy(() => import('./ProductDiscovery'));

type TabKey = 'trending' | 'database' | 'scout';

const C = {
  bg: '#FAFAFA',
  surface: '#FFFFFF',
  border: '#F0F0F0',
  accent: '#6366F1',
  text: '#0A0A0A',
  muted: '#6B7280',
};

const brico = "'Bricolage Grotesque', sans-serif";

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

function timeSince(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function ProductIntelligence() {
  const [tab, setTab] = useState<TabKey>('trending');
  const [products, setProducts] = useState<TrendProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    setLoading(true);
    supabase
      .from('trend_signals')
      .select('*')
      .order('trend_score', { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
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
        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `1px solid ${C.border}`, paddingBottom: 20, marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: brico, fontSize: 24, fontWeight: 800, color: C.text, margin: 0, marginBottom: 4 }}>Product Intelligence</h1>
            <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>AI-curated winning products updated daily</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {lastRefresh && (
              <span style={{ fontSize: 12, color: C.muted }}>
                Updated {timeSince(lastRefresh)}
              </span>
            )}
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: C.muted }}>
              <span>
                <strong style={{ color: C.accent, fontFamily: brico }}>{products.length > 0 ? products.length : '—'}</strong> products
              </span>
              <span>
                <strong style={{ color: C.accent, fontFamily: brico }}>6h</strong> refresh
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#F5F5F5', padding: 4, borderRadius: 10, width: 'fit-content' }}>
          {(['trending', 'database', 'scout'] as TabKey[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '8px 20px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: tab === t ? 'white' : 'transparent',
                color: tab === t ? C.accent : C.muted,
                boxShadow: tab === t ? '0 1px 4px #E5E7EB' : 'none',
                transition: 'all 150ms',
              }}
            >
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <span>{t === 'trending' ? '🔥 Trending Today' : t === 'database' ? '🗄 Full Database' : '🔍 Scout'}</span>
                {tab === t && <span style={{ fontSize: 9, fontWeight: 600, color: t === 'trending' ? '#F59E0B' : t === 'database' ? '#6366F1' : '#059669', letterSpacing: '0.04em' }}>
                  {t === 'trending' ? 'RISING TREND · TIKTOK SIGNALS' : t === 'database' ? '131 PRODUCTS · SORTED BY AI SCORE' : 'AI-POWERED SEARCH'}
                </span>}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 24px 60px', maxWidth: 1200, margin: '0 auto' }}>
        {tab === 'trending' && (
          <Suspense fallback={<div style={{ textAlign: 'center', padding: 60, color: C.muted }}>Loading...</div>}>
            <FullDatabase key="trending" presetFilter="trending" />
          </Suspense>
        )}
        {tab === 'database' && (
          <Suspense fallback={<div style={{ textAlign: 'center', padding: 60, color: C.muted }}>Loading...</div>}>
            <FullDatabase key="database" presetFilter="all" />
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
