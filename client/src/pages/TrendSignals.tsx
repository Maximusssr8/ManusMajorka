/**
 * TrendSignals — AU Trending Products dashboard.
 * Data source: trend_signals Supabase table (cron refreshes every 6h).
 * Schema: name, niche, estimated_retail_aud, estimated_margin_pct,
 *         trend_score, dropship_viability_score, trend_reason, refreshed_at
 */
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  RefreshCw,
  Search,
  Store,
  Package,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// ── Types ─────────────────────────────────────────────────────────────────────

interface TrendProduct {
  id: string;
  name: string;
  niche: string;
  estimated_retail_aud: number;
  estimated_margin_pct: number;
  trend_score: number;
  dropship_viability_score: number;
  trend_reason: string;
  refreshed_at: string;
  source?: string;
}

type SortField = 'trend_score' | 'estimated_retail_aud' | 'estimated_margin_pct' | 'dropship_viability_score' | 'name';
type SortDir = 'asc' | 'desc';

// ── Design tokens ─────────────────────────────────────────────────────────────

const C = {
  bg: '#080a0e',
  surface: 'rgba(255,255,255,0.02)',
  border: 'rgba(255,255,255,0.07)',
  borderHover: 'rgba(212,175,55,0.35)',
  gold: '#d4af37',
  goldDim: 'rgba(212,175,55,0.6)',
  text: '#f0ede8',
  sub: 'rgba(240,237,232,0.55)',
  muted: 'rgba(240,237,232,0.35)',
  green: '#10b981',
  yellow: '#f59e0b',
  red: '#ef4444',
};

const ADMIN_EMAILS = ['maximusmajorka@gmail.com'];
const PAGE_SIZE = 25;

const ALL_NICHES = [
  'All Niches',
  'Tech Accessories',
  'Beauty & Skincare',
  'Health & Wellness',
  'Home Decor',
  'Fashion',
  'Fitness',
  'Pets',
  'Other',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function nicheEmoji(niche: string): string {
  const map: Record<string, string> = {
    'Beauty': '💄', 'Skincare': '✨', 'Health': '💊', 'Wellness': '🌿',
    'Fitness': '💪', 'Home': '🏠', 'Kitchen': '🍳', 'Tech': '📱',
    'Fashion': '👗', 'Pets': '🐾', 'Baby': '👶', 'Outdoor': '🏕️',
    'Jewellery': '💎', 'Automotive': '🚗', 'Sports': '⚽',
  };
  const key = Object.keys(map).find(k => niche?.includes(k));
  return key ? map[key] : '📦';
}

function formatTimeAgo(iso: string): string {
  if (!iso) return 'never';
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function isNewProduct(refreshed_at: string): boolean {
  return Date.now() - new Date(refreshed_at).getTime() < 24 * 3600 * 1000;
}

function trendScoreColor(score: number): string {
  if (score >= 70) return C.green;
  if (score >= 40) return C.yellow;
  return C.red;
}

// ── Sort icon ─────────────────────────────────────────────────────────────────

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (field !== sortField) return <ArrowUpDown size={11} style={{ opacity: 0.3, marginLeft: 4 }} />;
  return sortDir === 'asc'
    ? <ArrowUp size={11} style={{ color: C.gold, marginLeft: 4 }} />
    : <ArrowDown size={11} style={{ color: C.gold, marginLeft: 4 }} />;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function TrendSignals() {
  const [, navigate] = useLocation();
  const { session } = useAuth();
  const userEmail = session?.user?.email || '';
  const isAdmin = ADMIN_EMAILS.includes(userEmail);

  const [products, setProducts] = useState<TrendProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [nicheFilter, setNicheFilter] = useState('All Niches');
  const [minMargin, setMinMargin] = useState(0);
  const [minTrend, setMinTrend] = useState(0);

  // Sort
  const [sortField, setSortField] = useState<SortField>('trend_score');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const latestRefresh = products.reduce((latest, p) => {
    return !latest || p.refreshed_at > latest ? p.refreshed_at : latest;
  }, '');

  // ── Fetch ────────────────────────────────────────────────────────────────────

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('trend_signals')
        .select('*')
        .order('trend_score', { ascending: false });

      if (error) {
        console.error('[TrendSignals] fetch error:', error.message);
        setProducts([]);
      } else {
        setProducts(data || []);
      }
    } catch (err) {
      console.error('[TrendSignals]', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  // ── Admin refresh ─────────────────────────────────────────────────────────────

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/cron/refresh-trends');
      const data = await res.json();
      if (data.ok) {
        toast.success(`Refreshed ${data.count} products`);
        await fetchProducts();
      } else {
        toast.error(data.error || 'Refresh failed');
      }
    } catch {
      toast.error('Refresh failed — check connection');
    } finally {
      setRefreshing(false);
    }
  };

  // ── Sort toggle ──────────────────────────────────────────────────────────────

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(1);
  };

  // ── Filter + sort ────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = products.filter(p => {
      if (search && !p.name?.toLowerCase().includes(search.toLowerCase())) return false;
      if (nicheFilter !== 'All Niches' && !p.niche?.includes(nicheFilter.split(' ')[0])) return false;
      if (p.estimated_margin_pct < minMargin) return false;
      if (p.trend_score < minTrend) return false;
      return true;
    });

    list.sort((a, b) => {
      const aVal = a[sortField] ?? 0;
      const bVal = b[sortField] ?? 0;
      if (typeof aVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
      }
      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return list;
  }, [products, search, nicheFilter, minMargin, minTrend, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Column header ────────────────────────────────────────────────────────────

  const ColHeader = ({ label, field, style }: { label: string; field?: SortField; style?: React.CSSProperties }) => (
    <th
      onClick={field ? () => handleSort(field) : undefined}
      style={{
        padding: '10px 12px',
        textAlign: 'left',
        fontSize: 10,
        fontWeight: 800,
        fontFamily: 'Syne, sans-serif',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: field === sortField ? C.gold : C.muted,
        cursor: field ? 'pointer' : 'default',
        whiteSpace: 'nowrap',
        background: 'rgba(255,255,255,0.02)',
        borderBottom: `1px solid ${C.border}`,
        userSelect: 'none',
        ...style,
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
        {label}
        {field && <SortIcon field={field} sortField={sortField} sortDir={sortDir} />}
      </span>
    </th>
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '20px 16px', background: C.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: C.text, marginBottom: 4 }}>
            Trend Signals
          </h1>
          <p style={{ fontSize: 12, color: C.muted }}>
            {loading ? 'Loading...' : `${filtered.length} products`}
            {latestRefresh && !loading && (
              <span style={{ marginLeft: 10, color: C.muted }}>· Updated {formatTimeAgo(latestRefresh)}</span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isAdmin && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                background: 'rgba(212,175,55,0.08)', border: `1px solid rgba(212,175,55,0.25)`,
                color: C.gold, cursor: refreshing ? 'not-allowed' : 'pointer', opacity: refreshing ? 0.7 : 1,
                fontFamily: 'Syne, sans-serif',
              }}
            >
              <RefreshCw size={12} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          )}
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div style={{
        display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
        marginBottom: 16, padding: '12px 14px',
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 140 }}>
          <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search products..."
            style={{
              width: '100%', paddingLeft: 28, paddingRight: 10, paddingTop: 7, paddingBottom: 7,
              background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`,
              borderRadius: 7, fontSize: 12, color: C.text, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Niche */}
        <select
          value={nicheFilter}
          onChange={e => { setNicheFilter(e.target.value); setPage(1); }}
          style={{
            padding: '7px 10px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`,
            borderRadius: 7, fontSize: 12, color: C.text, cursor: 'pointer', flex: '0 0 auto',
          }}
        >
          {ALL_NICHES.map(n => <option key={n} value={n} style={{ background: '#0a0b0d' }}>{n}</option>)}
        </select>

        {/* Min margin */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.muted, flex: '0 0 auto' }}>
          Margin ≥
          <input
            type="number" min={0} max={90} value={minMargin}
            onChange={e => { setMinMargin(Number(e.target.value)); setPage(1); }}
            style={{
              width: 52, padding: '5px 7px', background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, color: C.text, textAlign: 'center',
            }}
          />%
        </label>

        {/* Min trend score */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.muted, flex: '0 0 auto' }}>
          Trend ≥
          <input
            type="number" min={0} max={100} value={minTrend}
            onChange={e => { setMinTrend(Number(e.target.value)); setPage(1); }}
            style={{
              width: 52, padding: '5px 7px', background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, color: C.text, textAlign: 'center',
            }}
          />
        </label>

        {/* Reset */}
        {(search || nicheFilter !== 'All Niches' || minMargin > 0 || minTrend > 0) && (
          <button
            onClick={() => { setSearch(''); setNicheFilter('All Niches'); setMinMargin(0); setMinTrend(0); setPage(1); }}
            style={{ padding: '6px 10px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 11, color: C.muted, cursor: 'pointer' }}
          >
            Reset
          </button>
        )}
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{ height: 56, background: C.surface, borderRadius: 8, border: `1px solid ${C.border}`, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
          <style>{`@keyframes pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.sub, marginBottom: 8 }}>No products match your filters</div>
          <div style={{ fontSize: 12 }}>Try adjusting your filters or refreshing the data</div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 10, border: `1px solid ${C.border}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr>
                <ColHeader label="#" style={{ width: 40 }} />
                <ColHeader label="Product" field="name" style={{ minWidth: 200 }} />
                <ColHeader label="Price (AUD)" field="estimated_retail_aud" style={{ width: 110 }} />
                <ColHeader label="Margin %" field="estimated_margin_pct" style={{ width: 100 }} />
                <ColHeader label="Trend" field="trend_score" style={{ width: 90 }} />
                <ColHeader label="Viability" field="dropship_viability_score" style={{ width: 90 }} />
                <ColHeader label="Actions" style={{ width: 180 }} />
              </tr>
            </thead>
            <tbody>
              {paginated.map((p, idx) => {
                const rank = (page - 1) * PAGE_SIZE + idx + 1;
                const isNew = isNewProduct(p.refreshed_at);
                const isTrending = p.trend_score >= 85;
                return (
                  <tr
                    key={p.id || p.name}
                    style={{ borderBottom: `1px solid ${C.border}`, transition: 'background 0.12s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,175,55,0.03)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Rank */}
                    <td style={{ padding: '12px', fontSize: 12, color: C.muted, textAlign: 'center', width: 40 }}>
                      {rank}
                    </td>

                    {/* Product + niche */}
                    <td style={{ padding: '10px 12px', minWidth: 200 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {/* Thumbnail */}
                        <div style={{
                          width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                          background: 'rgba(212,175,55,0.06)', border: `1px solid ${C.border}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18,
                        }}>
                          {nicheEmoji(p.niche)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginBottom: 3 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: C.text }}>
                              {p.name}
                            </span>
                            {isTrending && (
                              <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 5px', borderRadius: 4, background: 'rgba(239,68,68,0.12)', color: '#ef4444', fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                                🔥 Trending
                              </span>
                            )}
                            {isNew && (
                              <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 5px', borderRadius: 4, background: 'rgba(16,185,129,0.12)', color: C.green, fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                                New
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 10, color: C.muted, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, padding: '1px 6px' }}>
                              {p.niche}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: C.gold, whiteSpace: 'nowrap' }}>
                      ${p.estimated_retail_aud?.toFixed(0)} AUD
                    </td>

                    {/* Margin */}
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        fontSize: 13, fontWeight: 700,
                        color: p.estimated_margin_pct >= 50 ? C.green : p.estimated_margin_pct >= 30 ? C.yellow : C.red,
                      }}>
                        {p.estimated_margin_pct?.toFixed(0)}%
                      </span>
                    </td>

                    {/* Trend score */}
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: trendScoreColor(p.trend_score), minWidth: 28 }}>
                          {p.trend_score}
                        </span>
                        <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, minWidth: 30 }}>
                          <div style={{ height: '100%', width: `${p.trend_score}%`, background: trendScoreColor(p.trend_score), borderRadius: 2 }} />
                        </div>
                      </div>
                    </td>

                    {/* Viability */}
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        fontSize: 13, fontWeight: 700,
                        color: p.dropship_viability_score >= 8 ? C.green : p.dropship_viability_score >= 6 ? C.yellow : C.muted,
                      }}>
                        {p.dropship_viability_score}/10
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => navigate(`/app/store-builder?product=${encodeURIComponent(p.name)}&niche=${encodeURIComponent(p.niche)}&price=${p.estimated_retail_aud}`)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '5px 10px', background: C.gold, color: '#080a0e',
                            border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 800,
                            cursor: 'pointer', fontFamily: 'Syne, sans-serif', whiteSpace: 'nowrap',
                          }}
                        >
                          <Store size={10} /> Build Store
                        </button>
                        <button
                          onClick={() => navigate('/app/suppliers')}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '5px 10px', background: C.surface, color: C.sub,
                            border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 11, fontWeight: 600,
                            cursor: 'pointer', whiteSpace: 'nowrap',
                          }}
                        >
                          <Package size={10} /> Supplier
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ── */}
      {!loading && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 20 }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ padding: '7px 16px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 7, color: page === 1 ? C.muted : C.sub, cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 12 }}
          >
            ← Prev
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              style={{
                width: 32, height: 32, borderRadius: 7, border: `1px solid ${page === i + 1 ? C.gold : C.border}`,
                background: page === i + 1 ? 'rgba(212,175,55,0.12)' : C.surface,
                color: page === i + 1 ? C.gold : C.muted,
                cursor: 'pointer', fontSize: 12, fontWeight: page === i + 1 ? 700 : 400,
              }}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{ padding: '7px 16px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 7, color: page === totalPages ? C.muted : C.sub, cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: 12 }}
          >
            Next →
          </button>
        </div>
      )}

      {/* ── Footer context ── */}
      {!loading && paginated.length > 0 && (
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: C.muted }}>
          Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} products
          {filtered.length !== products.length && ` (filtered from ${products.length})`}
        </p>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        th:hover { background: rgba(255,255,255,0.03) !important; }
      `}</style>
    </div>
  );
}
