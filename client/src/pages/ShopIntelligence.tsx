import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/supabase';
import Sparkline from '@/components/Sparkline';
import { useLocation } from 'wouter';

interface Shop {
  id: string;
  shop_name: string;
  shop_domain: string;
  niche: string;
  shop_type: string;
  est_revenue_aud: number;
  revenue_trend: number[];
  growth_rate_pct: number;
  items_sold_est: number;
  items_sold_monthly: number;
  avg_unit_price_aud: number;
  best_selling_products: { name: string; imageUrl: string }[];
  affiliate_revenue_aud: number;
  ad_spend_est_aud: number;
  founded_year: number;
}

const NICHES = ['All Niches', 'Activewear & Gym', 'Beauty & Skincare', 'Health & Wellness', 'Tech Accessories', 'Home Decor', 'Pets & Animals', 'Fashion & Apparel', 'Jewellery & Accessories', 'Outdoor & Camping', 'Baby & Kids', 'Coffee & Beverages', 'Supplements & Nutrition', 'Electronics', 'Office & Stationery', 'Garden & Plants', 'Sports Equipment', 'Travel Accessories', 'Food & Gourmet', 'Automotive', 'Home & Kitchen'];

const C = { bg: '#080a0e', surface: '#0d0d14', border: '#1a1a2e', gold: '#6366F1', text: '#f0ede8', muted: 'rgba(240,237,232,0.5)' };

function fmtRevenue(n: number) {
  if (n >= 1000000) return `$${(n/1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n/1000).toFixed(0)}k`;
  return `$${n}`;
}

const fmtSold = (n: number | null | undefined) => {
  if (!n || n === 0) return '\u2014';
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
};

function ShopTypeBadge({ type }: { type: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    'dropship': { bg: 'rgba(99,102,241,0.12)', text: '#6366F1' },
    'brand': { bg: 'rgba(45,202,114,0.12)', text: '#2dca72' },
    'print-on-demand': { bg: 'rgba(99,102,241,0.12)', text: '#a5b4fc' },
  };
  const c = colors[type] || colors['dropship'];
  return (
    <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 9, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', background: c.bg, color: c.text }}>
      {type === 'print-on-demand' ? 'POD' : type}
    </span>
  );
}

export default function ShopIntelligence() {
  const [, navigate] = useLocation();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Filters
  const [niche, setNiche] = useState('All Niches');
  const [sortBy, setSortBy] = useState('est_revenue_aud');
  const [search, setSearch] = useState('');
  const [minRevenue, setMinRevenue] = useState('');
  const [maxRevenue, setMaxRevenue] = useState('');

  // Check pro status
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setIsPro(false); return; }
      try {
        const res = await fetch('/api/subscription/me', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json();
        const plan = data.plan?.toLowerCase() || 'free';
        setIsPro(['pro', 'builder', 'scale'].includes(plan));
      } catch { setIsPro(false); }
    })();
  }, []);

  const fetchShops = useCallback(async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setIsPro(false); setLoading(false); return; }

      const params = new URLSearchParams({ page: String(p), limit: '20', sortBy });
      if (niche !== 'All Niches') params.set('niche', niche);
      if (search.trim()) params.set('search', search.trim());
      if (minRevenue) params.set('minRevenue', minRevenue);
      if (maxRevenue) params.set('maxRevenue', maxRevenue);

      const res = await fetch(`/api/shops?${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.status === 403) { setIsPro(false); setLoading(false); return; }
      if (!res.ok) throw new Error(`Failed: ${res.status}`);

      const data = await res.json();
      setShops(data.shops || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setPage(p);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [niche, sortBy, search, minRevenue, maxRevenue]);

  useEffect(() => { fetchShops(1); }, []);

  async function seedShops() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch('/api/shops/seed', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` } });
    const data = await res.json();
    if (data.seeded) { fetchShops(1); }
  }

  // Pro gate
  if (isPro === false) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, position: 'relative', overflow: 'hidden' }}>
        <Helmet><title>Shop Intelligence — Majorka</title></Helmet>
        <div style={{ filter: 'blur(8px)', pointerEvents: 'none', opacity: 0.4, padding: '40px 32px' }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'Syne, sans-serif', color: C.text }}>Shop Intelligence</div>
            <div style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>Discover top performing Shopify stores in your niche</div>
          </div>
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{ height: 56, background: C.surface, borderRadius: 8, marginBottom: 8, border: `1px solid ${C.border}` }} />
          ))}
        </div>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#0d0d14', border: `1.5px solid ${C.border}`, borderRadius: 16, padding: '40px 48px', maxWidth: 420, width: '90%', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: C.text, marginBottom: 8 }}>Pro Feature</div>
            <div style={{ fontSize: 14, color: C.muted, marginBottom: 24, lineHeight: 1.6 }}>
              Unlock Shop Intelligence to:
            </div>
            <ul style={{ textAlign: 'left', marginBottom: 28, listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Discover top AU Shopify stores', 'See revenue & sales estimates', 'Analyse competitor strategy', 'Find market gaps to exploit', 'Build a competing store in 60s'].map(item => (
                <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: C.text }}>
                  <span style={{ color: C.gold, fontSize: 16 }}>✓</span> {item}
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate('/app/billing')}
              style={{ width: '100%', padding: '14px', borderRadius: 10, background: C.gold, border: 'none', color: '#080a0e', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'Syne, sans-serif', marginBottom: 8 }}
            >
              Upgrade to Pro →
            </button>
            <div style={{ fontSize: 12, color: C.muted }}>From $49 AUD/month · Cancel anytime</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: '32px 24px' }}>
      <Helmet><title>Shop Intelligence — Majorka</title></Helmet>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'Syne, sans-serif', color: C.text, marginBottom: 4 }}>
          Shop Intelligence
        </div>
        <div style={{ fontSize: 14, color: C.muted }}>
          Discover top performing Shopify stores in the AU market · {total} stores tracked
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20, padding: '16px', background: C.surface, borderRadius: 12, border: `1px solid ${C.border}` }}>
        <select value={niche} onChange={e => setNiche(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 7, background: '#0a0a12', border: `1px solid ${C.border}`, color: C.text, fontSize: 13, cursor: 'pointer' }}>
          {NICHES.map(n => <option key={n}>{n}</option>)}
        </select>

        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 7, background: '#0a0a12', border: `1px solid ${C.border}`, color: C.text, fontSize: 13, cursor: 'pointer' }}>
          <option value="est_revenue_aud">Sort: Revenue</option>
          <option value="growth_rate_pct">Sort: Growth Rate</option>
          <option value="items_sold_est">Sort: Items Sold</option>
          <option value="avg_unit_price_aud">Sort: Avg Price</option>
        </select>

        <select value={`${minRevenue}-${maxRevenue}`} onChange={e => {
          const [mn, mx] = e.target.value.split('-');
          setMinRevenue(mn === '0' ? '' : mn);
          setMaxRevenue(mx === '0' ? '' : mx);
        }} style={{ padding: '8px 12px', borderRadius: 7, background: '#0a0a12', border: `1px solid ${C.border}`, color: C.text, fontSize: 13, cursor: 'pointer' }}>
          <option value="0-0">Any Revenue</option>
          <option value="1000-10000">$1k–$10k/mo</option>
          <option value="10000-100000">$10k–$100k/mo</option>
          <option value="100000-0">$100k+/mo</option>
        </select>

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search shop name..."
          onKeyDown={e => e.key === 'Enter' && fetchShops(1)}
          style={{ flex: 1, minWidth: 160, padding: '8px 12px', borderRadius: 7, background: '#0a0a12', border: `1px solid ${C.border}`, color: C.text, fontSize: 13, outline: 'none' }}
        />

        <button onClick={() => fetchShops(1)}
          style={{ padding: '8px 20px', borderRadius: 7, background: C.gold, border: 'none', color: '#080a0e', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>
          Apply Filters
        </button>
      </div>

      {/* Table */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 130px 110px 80px 90px 90px 100px 90px', padding: '12px 16px', borderBottom: `1px solid ${C.border}`, gap: 12 }}>
          {['#', 'Shop', 'Revenue', 'Products', 'Trend', 'Growth', 'Sold', 'Avg Price', ''].map((h, i) => (
            <div key={i} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: C.muted, fontFamily: 'Syne, sans-serif' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: C.muted }}>Loading shops...</div>
        ) : error ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#ef4444' }}>{error}</div>
        ) : shops.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: C.muted }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🏪</div>
            No shops found. <button onClick={() => seedShops()} style={{ color: C.gold, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Seed data</button>
          </div>
        ) : shops.map((shop, idx) => (
          <div key={shop.id}
            style={{ display: 'grid', gridTemplateColumns: '40px 1fr 130px 110px 80px 90px 90px 100px 90px', padding: '14px 16px', gap: 12, borderBottom: `1px solid ${C.border}`, alignItems: 'center', cursor: 'pointer', transition: 'border-left 0.15s', borderLeft: '3px solid transparent' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderLeft = `3px solid ${C.gold}`; (e.currentTarget as HTMLDivElement).style.background = 'rgba(99,102,241,0.03)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderLeft = '3px solid transparent'; (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
            onClick={() => navigate(`/app/shops/${shop.id}`)}
          >
            <div style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>{(page - 1) * 20 + idx + 1}</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `hsl(${shop.shop_name.charCodeAt(0) * 7 % 360},40%,25%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: C.text, flexShrink: 0 }}>
                {shop.shop_name[0].toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{shop.shop_name}</div>
                <div style={{ display: 'flex', gap: 4, marginTop: 3, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: C.muted }}>{shop.niche}</span>
                  <ShopTypeBadge type={shop.shop_type} />
                </div>
              </div>
            </div>

            <div style={{ fontSize: 15, fontWeight: 800, color: C.gold, fontFamily: 'Syne, sans-serif' }}>
              {fmtRevenue(shop.est_revenue_aud)}
              <div style={{ fontSize: 10, color: C.muted, fontWeight: 400, marginTop: 1 }}>AUD/mo</div>
            </div>

            <div style={{ display: 'flex', gap: 3 }}>
              {(shop.best_selling_products || []).slice(0, 3).map((p, i) => (
                <img key={i} src={p.imageUrl} alt={p.name} title={p.name} style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'cover', border: `1px solid ${C.border}` }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              ))}
            </div>

            <div>
              <Sparkline data={shop.revenue_trend || [100,110,105,115,108,120,118]} width={72} height={28} />
            </div>

            <div style={{ fontSize: 13, fontWeight: 700, color: shop.growth_rate_pct >= 0 ? '#2dca72' : '#ef4444' }}>
              {shop.growth_rate_pct >= 0 ? '↑' : '↓'} {Math.abs(shop.growth_rate_pct)}%
            </div>

            <div style={{ fontSize: 13, color: C.text }}>{fmtSold(shop.items_sold_monthly || shop.items_sold_est)}</div>

            <div style={{ fontSize: 13, color: C.text }}>${shop.avg_unit_price_aud}</div>

            <button
              onClick={e => { e.stopPropagation(); navigate(`/app/shops/${shop.id}`); }}
              style={{ padding: '6px 14px', borderRadius: 6, background: 'rgba(99,102,241,0.1)', border: `1px solid rgba(99,102,241,0.25)`, color: C.gold, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne, sans-serif', whiteSpace: 'nowrap' }}
            >
              Analyse →
            </button>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => fetchShops(p)}
              style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${page === p ? C.gold : C.border}`, background: page === p ? 'rgba(99,102,241,0.1)' : 'transparent', color: page === p ? C.gold : C.muted, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
