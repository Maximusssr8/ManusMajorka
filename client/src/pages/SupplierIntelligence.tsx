/**
 * SupplierIntelligence — Find AU-ready suppliers for any product.
 * Bloomberg terminal style, data-dense table, profit snapshot card.
 */

import {
  ArrowUpRight,
  Bookmark,
  Calculator,
  Globe,
  Package,
  Search,
  Store,
  TrendingUp,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import UsageCounter from '@/components/UsageCounter';
import UpgradePromptBanner from '@/components/UpgradePromptBanner';
import { SEO } from '@/components/SEO';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Supplier {
  supplier_name: string;
  platform: 'AliExpress' | 'Alibaba' | 'CJ Dropshipping' | 'DHgate';
  unit_cost_aud: number;
  moq: number;
  shipping_days_to_au: number;
  shipping_cost_aud: number;
  rating: number;
  review_count: number;
  url: string;
  why_recommended: string;
  profit_margin_pct: number;
}

// ── Static featured platforms ─────────────────────────────────────────────────

const FEATURED_PLATFORMS = [
  {
    name: 'AliExpress',
    description: '100M+ products, ships to AU',
    shipping: '10–20 days',
    margin: '60–70%',
    url: 'https://www.aliexpress.com',
    color: '#e4393c',
    bg: 'rgba(228,57,60,0.08)',
  },
  {
    name: 'CJ Dropshipping',
    description: 'Warehouses in SYD, faster AU shipping',
    shipping: '7–15 days',
    margin: '55–65%',
    url: 'https://cjdropshipping.com',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
  },
  {
    name: 'Alibaba',
    description: 'Wholesale pricing, negotiate MOQ',
    shipping: '15–25 days',
    margin: '65–80%',
    url: 'https://www.alibaba.com',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.08)',
  },
  {
    name: 'DHgate',
    description: 'Fashion & electronics, bulk deals',
    shipping: '12–18 days',
    margin: '55–70%',
    url: 'https://www.dhgate.com',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.08)',
  },
  {
    name: 'Spocket',
    description: 'AU/NZ suppliers, premium quality',
    shipping: '3–7 days',
    margin: '30–60%',
    url: 'https://www.spocket.co',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.08)',
  },
  {
    name: 'Syncee',
    description: 'AU supplier network, Shopify-ready',
    shipping: '5–10 days',
    margin: '40–60%',
    url: 'https://syncee.com',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.08)',
  },
];

// ── Platform colour pill ──────────────────────────────────────────────────────

const PLATFORM_COLOURS: Record<string, string> = {
  AliExpress: '#e4393c',
  Alibaba: '#f97316',
  'CJ Dropshipping': '#f59e0b',
  DHgate: '#8b5cf6',
};

function PlatformPill({ platform }: { platform: string }) {
  const color = PLATFORM_COLOURS[platform] ?? '#6366F1';
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{
        background: `${color}18`,
        color,
        border: `1px solid ${color}40`,
        fontFamily: 'DM Sans, sans-serif',
      }}
    >
      {platform}
    </span>
  );
}

// ── Star rating ───────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  const filled = Math.round(rating);
  return (
    <span className="text-xs" style={{ color: '#6366F1' }}>
      {'★'.repeat(filled)}{'☆'.repeat(5 - filled)}
      <span style={{ color: '#9CA3AF', marginLeft: 4 }}>{rating.toFixed(1)}</span>
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SupplierIntelligence() {
  const { session } = useAuth();
  const [, navigate] = useLocation();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [currentQuery, setCurrentQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('supplier_recent') ?? '[]');
      setRecentSearches(Array.isArray(stored) ? stored.slice(0, 5) : []);
    } catch { /* ignore */ }
  }, []);

  // Demo pre-fill from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const demo = params.get('demo');
    if (demo) {
      const queries: Record<string, string> = {
        'posture-corrector': 'posture corrector',
        'led-face-mask': 'LED light therapy face mask',
      };
      const q = queries[demo] || demo.replace(/-/g, ' ');
      setQuery(q);
      setTimeout(() => handleSearch(q), 800);
    }

    // Maya prefill — agentic navigation
    const mayaPrefill = sessionStorage.getItem('maya_prefill_suppliers');
    if (mayaPrefill) {
      try {
        const data = JSON.parse(mayaPrefill);
        if (data.query) {
          setQuery(data.query);
          sessionStorage.removeItem('maya_prefill_suppliers');
          setTimeout(() => handleSearch(data.query), 800);
        }
      } catch {
        /* ignore */
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveRecentSearch = (q: string) => {
    const updated = [q, ...recentSearches.filter((s) => s !== q)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('supplier_recent', JSON.stringify(updated));
  };

  const handleSearch = async (searchQuery?: string) => {
    const q = (searchQuery ?? query).trim();
    if (!q || loading) return;
    if (!session?.access_token) {
      setError('Please sign in to search for suppliers.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuppliers([]);

    try {
      const res = await fetch('/api/suppliers/search', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ query: q }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Search failed');
        return;
      }

      setSuppliers(data.suppliers ?? []);
      setCurrentQuery(data.query ?? q);
      saveRecentSearch(q);
      setSavedIds(new Set());
    } catch (err: any) {
      setError(err.message ?? 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (supplier: Supplier, idx: number) => {
    if (!session?.access_token) return;
    const key = `${idx}`;
    setSavingId(key);
    try {
      const res = await fetch('/api/suppliers/save', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ supplier, product_query: currentQuery }),
      });
      if (res.ok) {
        setSavedIds((prev) => new Set([...prev, key]));
        setSavedCount((c) => c + 1);
      }
    } catch { /* ignore */ } finally {
      setSavingId(null);
    }
  };

  // Top supplier for profit snapshot
  const topSupplier = suppliers[0] ?? null;
  const snapSellPrice = topSupplier ? +(topSupplier.unit_cost_aud * 3.2).toFixed(2) : 0;
  const snapTotalCost = topSupplier ? +(topSupplier.unit_cost_aud + topSupplier.shipping_cost_aud).toFixed(2) : 0;
  const snapProfit = topSupplier ? +(snapSellPrice - snapTotalCost).toFixed(2) : 0;
  const snapDaily = topSupplier ? +(snapProfit * 10).toFixed(2) : 0;
  const snapMonthly = topSupplier ? +(snapDaily * 30).toFixed(2) : 0;

  const fmt = (n: number) => `$${n.toFixed(2)}`;

  return (
    <div
      className="flex h-full overflow-hidden"
      style={{ background: '#05070F', color: '#F8FAFC', fontFamily: 'DM Sans, sans-serif' }}
    >
      <SEO
        title="Supplier Intelligence Australia — Find AU-Ready Suppliers | Majorka"
        description="Find AU-compliant suppliers for any dropshipping product. 240V, AU plug, AU sizing — source suppliers with fast AU shipping verified by Majorka AI."
        path="/app/supplier-intelligence"
      />
      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Usage Counter */}
        <div className="flex-none px-6 pt-4">
          <UsageCounter />
          <UpgradePromptBanner />
        </div>
        {/* Header */}
        <div
          className="flex-none px-4 sm:px-6 pt-2 pb-4 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}
            >
              <Package className="w-4 h-4" style={{ color: '#6366F1' }} />
            </div>
            <div>
              <h1
                className="text-lg font-bold leading-tight"
                style={{ fontFamily: "'Syne', sans-serif", color: '#CBD5E1' }}
              >
                Supplier Intelligence
              </h1>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>
                Find AU-ready suppliers · AliExpress · Alibaba · CJ Dropshipping
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: '#9CA3AF' }}
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search any product to find AU-ready suppliers..."
              className="w-full pl-10 pr-32 py-3 rounded-xl text-sm outline-none"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid #F5F5F5',
                color: '#CBD5E1',
              }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-24 top-1/2 -translate-y-1/2 p-1 rounded"
                style={{ color: '#9CA3AF' }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => handleSearch()}
              disabled={!query.trim() || loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-40"
              style={{
                background: '#6366F1',
                color: '#FAFAFA',
                fontFamily: "'Syne', sans-serif",
              }}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 sm:pb-24 space-y-6">
          {/* Error */}
          {error && (
            <div
              className="px-4 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
            >
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div
              className="flex items-center gap-3 px-5 py-4 rounded-xl"
              style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}
            >
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: '#6366F1', animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <span className="text-sm" style={{ color: '#6366F1' }}>
                Searching AliExpress, Alibaba, CJ Dropshipping...
              </span>
            </div>
          )}

          {/* Profit snapshot card */}
          {topSupplier && !loading && (
            <div
              className="rounded-xl p-5"
              style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4" style={{ color: '#6366F1' }} />
                <span
                  className="text-sm font-semibold"
                  style={{ fontFamily: "'Syne', sans-serif", color: '#6366F1' }}
                >
                  Profit Snapshot — {currentQuery}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{ background: 'rgba(99,102,241,0.15)', color: '#6366F1' }}
                >
                  Top supplier: {topSupplier.supplier_name}
                </span>
              </div>
              <p
                className="text-sm mb-3"
                style={{ color: '#CBD5E1' }}
              >
                If you sell <strong style={{ color: '#CBD5E1' }}>{currentQuery}</strong> at{' '}
                <strong style={{ color: '#6366F1' }}>{fmt(snapSellPrice)}</strong>:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Cost (unit + ship)', value: `${fmt(topSupplier.unit_cost_aud)} + ${fmt(topSupplier.shipping_cost_aud)} = ${fmt(snapTotalCost)}` },
                  { label: 'Revenue per sale', value: fmt(snapSellPrice) },
                  { label: 'Profit per sale', value: fmt(snapProfit) },
                  { label: '10 sales/day', value: `${fmt(snapDaily)}/day · ${fmt(snapMonthly)}/mo` },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg px-4 py-3"
                    style={{ background: '#05070F', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <div className="text-xs mb-1" style={{ color: '#9CA3AF' }}>
                      {item.label}
                    </div>
                    <div className="text-sm font-semibold" style={{ color: '#CBD5E1', fontFamily: "'Syne', sans-serif" }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results table */}
          {suppliers.length > 0 && !loading && (
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid rgba(255,255,255,0.08)', overflowX: 'auto' }}
            >
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{ background: '#05070F', borderBottom: '1px solid #F9FAFB' }}
              >
                <span
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: '#9CA3AF', fontFamily: "'Syne', sans-serif" }}
                >
                  {suppliers.length} Suppliers Found — Sorted by Margin
                </span>
              </div>

              {/* Table header */}
              <div
                className="grid text-xs font-semibold uppercase tracking-wider px-4 py-2.5"
                style={{
                  gridTemplateColumns: '28px 1fr 120px 90px 100px 60px 90px 90px 120px',
                  minWidth: 780,
                  color: '#9CA3AF',
                  background: '#05070F',
                  borderBottom: '1px solid #F9FAFB',
                  fontFamily: "'Syne', sans-serif",
                }}
              >
                <span>#</span>
                <span>Supplier</span>
                <span>Platform</span>
                <span>Unit Cost</span>
                <span>Shipping AU</span>
                <span>Days</span>
                <span>Rating</span>
                <span>Est. Margin</span>
                <span>Actions</span>
              </div>

              {/* Table rows */}
              {suppliers.map((s, i) => {
                const isSaved = savedIds.has(`${i}`);
                const isSaving = savingId === `${i}`;
                const profitColor =
                  s.profit_margin_pct >= 60 ? '#10b981' : s.profit_margin_pct >= 40 ? '#6366F1' : '#f87171';
                return (
                  <div
                    key={i}
                    className="grid items-center px-4 py-3 text-sm transition-colors"
                    style={{
                      gridTemplateColumns: '28px 1fr 120px 90px 100px 60px 90px 90px 120px',
                      minWidth: 780,
                      borderBottom: i < suppliers.length - 1 ? '1px solid #F9FAFB' : 'none',
                      background: i % 2 === 0 ? 'transparent' : '#FAFAFA',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.04)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        i % 2 === 0 ? 'transparent' : '#FAFAFA';
                    }}
                  >
                    {/* # */}
                    <span style={{ color: '#9CA3AF', fontSize: 11 }}>{i + 1}</span>

                    {/* Supplier name + why */}
                    <div className="min-w-0 pr-2">
                      <div
                        className="font-semibold truncate"
                        style={{ color: '#CBD5E1', fontFamily: "'Syne', sans-serif", fontSize: 13 }}
                      >
                        {s.supplier_name}
                      </div>
                      <div
                        className="text-xs truncate mt-0.5"
                        style={{ color: '#9CA3AF' }}
                        title={s.why_recommended}
                      >
                        {s.why_recommended}
                      </div>
                    </div>

                    {/* Platform */}
                    <PlatformPill platform={s.platform} />

                    {/* Unit cost */}
                    <span style={{ color: '#CBD5E1', fontWeight: 600 }}>
                      {fmt(s.unit_cost_aud)}
                    </span>

                    {/* Shipping */}
                    <span style={{ color: '#CBD5E1' }}>
                      {fmt(s.shipping_cost_aud)}
                    </span>

                    {/* Days */}
                    <span
                      style={{
                        color: s.shipping_days_to_au <= 10 ? '#10b981' : s.shipping_days_to_au <= 15 ? '#6366F1' : '#6B7280',
                      }}
                    >
                      {s.shipping_days_to_au}d
                    </span>

                    {/* Rating */}
                    <StarRating rating={s.rating} />

                    {/* Margin */}
                    <span
                      className="font-bold text-sm"
                      style={{ color: profitColor, fontFamily: "'Syne', sans-serif" }}
                    >
                      {s.profit_margin_pct.toFixed(0)}%
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded transition-colors"
                        style={{ color: '#94A3B8' }}
                        title="Visit Supplier"
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.color = '#6366F1';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.color = '#6B7280';
                        }}
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() =>
                          navigate(
                            `/app/profit-calculator?price=${(s.unit_cost_aud * 3).toFixed(2)}&cost=${s.unit_cost_aud}&shipping=${s.shipping_cost_aud}`
                          )
                        }
                        className="p-1.5 rounded transition-colors"
                        style={{ color: '#94A3B8' }}
                        title="Calculate Profit"
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.color = '#10b981';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.color = '#6B7280';
                        }}
                      >
                        <Calculator className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          navigate(
                            `/app/website-generator?product=${encodeURIComponent(currentQuery)}`
                          )
                        }
                        className="p-1.5 rounded transition-colors"
                        style={{ color: '#94A3B8' }}
                        title="Build Store"
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.color = '#7c6af5';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.color = '#6B7280';
                        }}
                      >
                        <Store className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => !isSaved && handleSave(s, i)}
                        disabled={isSaved || isSaving}
                        className="p-1.5 rounded transition-colors"
                        style={{
                          color: isSaved ? '#6366F1' : '#6B7280',
                          opacity: isSaving ? 0.5 : 1,
                        }}
                        title={isSaved ? 'Saved' : 'Save Supplier'}
                        onMouseEnter={(e) => {
                          if (!isSaved)
                            (e.currentTarget as HTMLElement).style.color = '#6366F1';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSaved)
                            (e.currentTarget as HTMLElement).style.color = '#6B7280';
                        }}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state — featured platforms */}
          {!loading && suppliers.length === 0 && (
            <>
              <div className="mb-2">
                <h2
                  className="text-sm font-semibold mb-1"
                  style={{ fontFamily: "'Syne', sans-serif", color: '#CBD5E1' }}
                >
                  Featured AU Supplier Platforms
                </h2>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>
                  Trusted platforms for Australian dropshippers — search above to find product-specific suppliers.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {FEATURED_PLATFORMS.map((p) => (
                  <div
                    key={p.name}
                    className="rounded-xl p-4 flex flex-col gap-2"
                    style={{
                      background: p.bg,
                      border: `1px solid ${p.color}20`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="font-bold text-sm"
                        style={{ fontFamily: "'Syne', sans-serif", color: p.color }}
                      >
                        {p.name}
                      </span>
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium transition-opacity hover:opacity-80"
                        style={{ background: `${p.color}20`, color: p.color }}
                      >
                        Browse <ArrowUpRight className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-xs" style={{ color: '#94A3B8' }}>
                      {p.description}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span
                        className="text-xs"
                        style={{ color: '#9CA3AF' }}
                      >
                        🚢 {p.shipping}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: '#10b981' }}
                      >
                        📈 {p.margin} margin
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Side panel ── */}
      <div
        className="hidden lg:flex flex-col w-56 flex-none border-l p-4 gap-5"
        style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#05070F' }}
      >
        {/* Saved count */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: '#9CA3AF', fontFamily: "'Syne', sans-serif" }}
            >
              Saved Suppliers
            </span>
            {savedCount > 0 && (
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(99,102,241,0.15)', color: '#6366F1' }}
              >
                {savedCount}
              </span>
            )}
          </div>
          <p className="text-xs" style={{ color: '#D1D5DB' }}>
            {savedCount === 0 ? 'No suppliers saved yet.' : `${savedCount} supplier${savedCount > 1 ? 's' : ''} saved this session.`}
          </p>
        </div>

        {/* Recent searches */}
        <div>
          <div className="mb-2">
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: '#9CA3AF', fontFamily: "'Syne', sans-serif" }}
            >
              Recent Searches
            </span>
          </div>
          {recentSearches.length === 0 ? (
            <p className="text-xs" style={{ color: '#D1D5DB' }}>
              No recent searches.
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {recentSearches.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setQuery(s);
                    handleSearch(s);
                  }}
                  className="text-left text-xs px-2.5 py-1.5 rounded-lg truncate transition-colors"
                  style={{
                    color: '#94A3B8',
                    background: '#05070F',
                    border: '1px solid #F9FAFB',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = '#6366F1';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = '#6B7280';
                    (e.currentTarget as HTMLElement).style.borderColor = '#F9FAFB';
                  }}
                >
                  🔍 {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick tips */}
        <div
          className="rounded-xl p-3 mt-auto"
          style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.1)' }}
        >
          <div
            className="text-xs font-semibold mb-2"
            style={{ color: '#6366F1', fontFamily: "'Syne', sans-serif" }}
          >
            💡 Pro Tips
          </div>
          <ul className="text-xs space-y-1.5" style={{ color: '#94A3B8' }}>
            <li>• Search exact product names for better results</li>
            <li>• CJ Dropshipping ships fastest to AU</li>
            <li>• Margin &gt;60% = strong product</li>
            <li>• Save top suppliers before they go</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
