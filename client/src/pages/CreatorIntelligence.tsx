/**
 * CreatorIntelligence — /app/creators
 * Data-dense table of AU TikTok creators.
 * Revenue-first, Bloomberg-style, no gamification.
 */

import { Helmet } from 'react-helmet-async';
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useLocation } from 'wouter';

// ── Quick Action flywheel ─────────────────────────────────────────────────────
function QuickActions({ category, compact = false }: { category: string; compact?: boolean }) {
  const [, nav] = useLocation();
  const cat = encodeURIComponent(category);
  const actions = [
    { label: 'Find Products', path: `/app/winning-products?category=${cat}`, color: '#ef4444' },
    { label: 'Generate Ads', path: `/app/meta-ads?category=${cat}`, color: '#a78bfa' },
    { label: 'Build Store', path: `/app/website-generator?niche=${cat}`, color: '#34d399' },
  ];
  return (
    <div className={`flex flex-wrap gap-1.5 ${compact ? '' : 'mt-2'}`}>
      {actions.map((a) => (
        <button
          key={a.label}
          onClick={(e) => { e.stopPropagation(); nav(a.path); }}
          className="text-xs px-2.5 py-1 rounded-lg font-medium transition-colors"
          style={{ background: `${a.color}14`, color: a.color, border: `1px solid ${a.color}30` }}
          onMouseEnter={(ev) => (ev.currentTarget.style.background = `${a.color}28`)}
          onMouseLeave={(ev) => (ev.currentTarget.style.background = `${a.color}14`)}
        >
          {a.label} →
        </button>
      ))}
    </div>
  );
}
import { useAuth } from '@/_core/hooks/useAuth';
import { supabase } from '@/lib/supabase';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Creator {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  follower_count: number;
  gmv_30d_aud: number;
  gmv_growth_rate: number;
  items_sold_30d: number;
  avg_video_views: number;
  engagement_rate: number;
  top_categories: string[];
  commission_rate: number;
  creator_conversion_ratio: number;
  tiktok_url: string | null;
  is_verified: boolean;
  location: string | null;
  revenue_sparkline: string | number[];
}

type SortKey = keyof Creator;
type SortDir = 'asc' | 'desc';
type FilterMode = 'all' | 'rising' | 'top-gmv' | 'micro' | 'nano';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtAUD(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}k`;
  return `$${val.toFixed(0)}`;
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

function parseSparkline(raw: string | number[] | null | undefined): number[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as number[];
  try { return JSON.parse(raw as string) as number[]; } catch { return []; }
}

function MiniSparkline({ data }: { data: number[] }) {
  if (!data.length) return <span style={{ color: '#475569' }}>—</span>;
  const isUp = data[data.length - 1] >= data[0];
  const pts = data.map((v) => ({ v }));
  return (
    <ResponsiveContainer width={80} height={28}>
      <LineChart data={pts}>
        <Line type="monotone" dataKey="v" stroke={isUp ? '#22c55e' : '#ef4444'} dot={false} strokeWidth={1.5} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Drawer ────────────────────────────────────────────────────────────────────

function CreatorDrawer({
  creator,
  onClose,
  onOutreach,
}: {
  creator: Creator;
  onClose: () => void;
  onOutreach: (c: Creator) => void;
}) {
  const sparkData = parseSparkline(creator.revenue_sparkline);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={drawerRef}
        className="w-full max-w-md h-full overflow-y-auto flex flex-col"
        style={{ background: 'white', borderLeft: '1px solid #F0F0F0' }}
      >
        {/* Drawer header */}
        <div
          className="sticky top-0 flex items-center justify-between px-5 py-4"
          style={{ background: 'white', borderBottom: '1px solid #F0F0F0', zIndex: 10 }}
        >
          <p className="text-sm font-semibold" style={{ color: '#0A0A0A' }}>Creator Profile</p>
          <button onClick={onClose} style={{ color: '#64748b' }}><X size={18} /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Identity */}
          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-full flex-shrink-0 bg-cover bg-center"
              style={{ backgroundImage: creator.avatar_url ? `url(${creator.avatar_url})` : undefined, background: creator.avatar_url ? undefined : 'rgba(99,102,241,0.2)' }}
            />
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-base font-semibold" style={{ color: '#0A0A0A', fontFamily: 'Syne, sans-serif' }}>
                  {creator.display_name ?? creator.username}
                </p>
                {creator.is_verified && <span className="text-sm" style={{ color: '#38bdf8' }}>✓</span>}
              </div>
              <p className="text-sm" style={{ color: '#64748b' }}>@{creator.username}</p>
              {creator.location && <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{creator.location}</p>}
              {creator.tiktok_url && (
                <a href={creator.tiktok_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs mt-1 inline-block" style={{ color: '#6366F1' }}>
                  View TikTok →
                </a>
              )}
            </div>
          </div>

          {/* Revenue chart */}
          <div className="rounded-xl p-4" style={{ background: '#FFFFFF', border: '1px solid #F0F0F0' }}>
            <p className="text-xs mb-3" style={{ color: '#64748b' }}>8-week GMV trend</p>
            {sparkData.length > 1 ? (
              <ResponsiveContainer width="100%" height={80}>
                <LineChart data={sparkData.map((v) => ({ v }))}>
                  <Line type="monotone" dataKey="v" stroke="#6366F1" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-center py-4" style={{ color: '#475569' }}>No history data</p>
            )}
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '30-day GMV', value: fmtAUD(creator.gmv_30d_aud), highlight: true },
              { label: 'GMV Growth', value: `${creator.gmv_growth_rate >= 0 ? '+' : ''}${creator.gmv_growth_rate?.toFixed(1)}%`, highlight: false },
              { label: 'Followers', value: fmtNum(creator.follower_count), highlight: false },
              { label: 'Avg Views', value: fmtNum(creator.avg_video_views), highlight: false },
              { label: 'Engagement', value: `${creator.engagement_rate?.toFixed(1)}%`, highlight: false },
              { label: 'Conversion', value: `${creator.creator_conversion_ratio?.toFixed(1)}%`, highlight: false },
              { label: 'Items Sold', value: fmtNum(creator.items_sold_30d), highlight: false },
              { label: 'Commission', value: `${creator.commission_rate}%`, highlight: false },
            ].map((m) => (
              <div key={m.label} className="rounded-lg p-3" style={{ background: '#FFFFFF', border: '1px solid #F0F0F0' }}>
                <p className="text-xs" style={{ color: '#64748b' }}>{m.label}</p>
                <p className="text-base font-semibold mt-0.5" style={{ color: m.highlight ? '#6366F1' : '#0A0A0A', fontFamily: 'Syne, sans-serif' }}>
                  {m.value}
                </p>
              </div>
            ))}
          </div>

          {/* Categories */}
          <div>
            <p className="text-xs mb-2" style={{ color: '#64748b' }}>Top Categories</p>
            <div className="flex flex-wrap gap-1.5">
              {(creator.top_categories ?? []).map((c) => (
                <span key={c} className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366F1', border: '1px solid rgba(99,102,241,0.2)' }}>{c}</span>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <p className="text-xs mb-2" style={{ color: '#64748b' }}>Jump to tool</p>
            <QuickActions category={(creator.top_categories ?? [])[0] ?? 'General'} />
          </div>

          {/* Outreach */}
          <button
            onClick={() => onOutreach(creator)}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: 'rgba(99,102,241,0.15)', color: '#6366F1', border: '1px solid rgba(99,102,241,0.3)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.25)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.15)')}
          >
            Generate Outreach Pitch →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Seed data fallback ───────────────────────────────────────────────────────

const SEED_CREATORS: Creator[] = [
  { id: '1', username: 'zoeaubeauty', display_name: 'Zoe Au Beauty', avatar_url: null, follower_count: 487000, gmv_30d_aud: 142000, gmv_growth_rate: 34, items_sold_30d: 3200, avg_video_views: 89000, engagement_rate: 6.8, top_categories: ['Beauty & Skincare'], commission_rate: 12, creator_conversion_ratio: 3.6, tiktok_url: null, is_verified: true, location: 'Sydney', revenue_sparkline: [38000,42000,35000,41000,48000,52000,44000] },
  { id: '2', username: 'fitnesswithkyle_au', display_name: 'Kyle Fitness AU', avatar_url: null, follower_count: 234000, gmv_30d_aud: 98000, gmv_growth_rate: 67, items_sold_30d: 1800, avg_video_views: 64000, engagement_rate: 8.2, top_categories: ['Activewear & Gym'], commission_rate: 10, creator_conversion_ratio: 2.8, tiktok_url: null, is_verified: false, location: 'Brisbane', revenue_sparkline: [18000,22000,28000,31000,34000,38000,42000] },
  { id: '3', username: 'homewithsophie', display_name: 'Sophie Home', avatar_url: null, follower_count: 312000, gmv_30d_aud: 87000, gmv_growth_rate: 22, items_sold_30d: 1500, avg_video_views: 45000, engagement_rate: 4.9, top_categories: ['Home Decor'], commission_rate: 8, creator_conversion_ratio: 2.1, tiktok_url: null, is_verified: true, location: 'Melbourne', revenue_sparkline: [28000,24000,30000,27000,32000,29000,31000] },
  { id: '4', username: 'petsofoz', display_name: 'Pets of OZ', avatar_url: null, follower_count: 156000, gmv_30d_aud: 64000, gmv_growth_rate: 89, items_sold_30d: 2400, avg_video_views: 112000, engagement_rate: 9.1, top_categories: ['Pets & Animals'], commission_rate: 15, creator_conversion_ratio: 4.2, tiktok_url: null, is_verified: false, location: 'Gold Coast', revenue_sparkline: [8000,12000,14000,16000,18000,22000,28000] },
  { id: '5', username: 'techdealsau', display_name: 'Tech Deals AU', avatar_url: null, follower_count: 98000, gmv_30d_aud: 52000, gmv_growth_rate: 18, items_sold_30d: 900, avg_video_views: 38000, engagement_rate: 5.4, top_categories: ['Tech Accessories'], commission_rate: 8, creator_conversion_ratio: 2.3, tiktok_url: null, is_verified: false, location: 'Perth', revenue_sparkline: [14000,16000,12000,18000,14000,16000,20000] },
  { id: '6', username: 'glowwithgrace_au', display_name: 'Grace Glow AU', avatar_url: null, follower_count: 89000, gmv_30d_aud: 43000, gmv_growth_rate: 41, items_sold_30d: 1100, avg_video_views: 32000, engagement_rate: 7.3, top_categories: ['Beauty & Skincare'], commission_rate: 10, creator_conversion_ratio: 3.4, tiktok_url: null, is_verified: false, location: 'Adelaide', revenue_sparkline: [9000,11000,13000,12000,14000,16000,18000] },
  { id: '7', username: 'outdooradventuresoz', display_name: 'Outdoor Adventures OZ', avatar_url: null, follower_count: 178000, gmv_30d_aud: 71000, gmv_growth_rate: 29, items_sold_30d: 1200, avg_video_views: 55000, engagement_rate: 5.8, top_categories: ['Outdoor & Camping'], commission_rate: 9, creator_conversion_ratio: 2.6, tiktok_url: null, is_verified: true, location: 'Cairns', revenue_sparkline: [16000,18000,20000,22000,24000,26000,28000] },
  { id: '8', username: 'mumlifemelbourne', display_name: 'Mum Life Melbourne', avatar_url: null, follower_count: 67000, gmv_30d_aud: 38000, gmv_growth_rate: 52, items_sold_30d: 800, avg_video_views: 28000, engagement_rate: 8.9, top_categories: ['Baby & Kids'], commission_rate: 12, creator_conversion_ratio: 3.8, tiktok_url: null, is_verified: false, location: 'Melbourne', revenue_sparkline: [6000,8000,9000,10000,11000,12000,14000] },
  { id: '9', username: 'cookingwithmateo', display_name: 'Cooking with Mateo', avatar_url: null, follower_count: 445000, gmv_30d_aud: 118000, gmv_growth_rate: 45, items_sold_30d: 2800, avg_video_views: 95000, engagement_rate: 6.2, top_categories: ['Home & Kitchen'], commission_rate: 11, creator_conversion_ratio: 2.9, tiktok_url: null, is_verified: true, location: 'Sydney', revenue_sparkline: [28000,32000,36000,38000,42000,44000,48000] },
  { id: '10', username: 'activewearaddictau', display_name: 'Activewear Addict AU', avatar_url: null, follower_count: 203000, gmv_30d_aud: 85000, gmv_growth_rate: 38, items_sold_30d: 1600, avg_video_views: 41000, engagement_rate: 7.6, top_categories: ['Activewear & Gym'], commission_rate: 10, creator_conversion_ratio: 3.1, tiktok_url: null, is_verified: false, location: 'Byron Bay', revenue_sparkline: [18000,20000,22000,24000,28000,30000,32000] },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function CreatorIntelligence() {
  const [, nav] = useLocation();
  const { user } = useAuth();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [sortKey, setSortKey] = useState<SortKey>('gmv_30d_aud');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selected, setSelected] = useState<Creator | null>(null);
  const [outreachLoading, setOutreachLoading] = useState(false);
  const [outreachText, setOutreachText] = useState('');

  useEffect(() => { void fetchCreators(); }, []);

  // Auto-fill from URL params (e.g. from Winning Products quick actions)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category');
    if (category) setSearch(category);
  }, []);

  async function fetchCreators() {
    try {
      const { data } = await supabase.from('au_creators').select('*').order('gmv_30d_aud', { ascending: false });
      setCreators(data && data.length > 0 ? (data as Creator[]) : SEED_CREATORS);
    } catch {
      setCreators(SEED_CREATORS);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    let list = [...creators];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => c.username.toLowerCase().includes(q) || (c.display_name ?? '').toLowerCase().includes(q));
    }
    switch (filter) {
      case 'rising': list = list.filter(c => c.gmv_growth_rate > 20); break;
      case 'top-gmv': list = list.sort((a, b) => b.gmv_30d_aud - a.gmv_30d_aud).slice(0, 10); break;
      case 'micro': list = list.filter(c => c.follower_count >= 50000 && c.follower_count < 500000); break;
      case 'nano': list = list.filter(c => c.follower_count < 50000); break;
    }
    list.sort((a, b) => {
      const av = a[sortKey] as number | string;
      const bv = b[sortKey] as number | string;
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'desc' ? bv - av : av - bv;
      return sortDir === 'desc' ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
    });
    return list;
  }, [creators, search, filter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span style={{ color: '#9CA3AF' }}>↕</span>;
    return sortDir === 'desc' ? <ChevronDown size={12} style={{ color: '#6366F1' }} /> : <ChevronUp size={12} style={{ color: '#6366F1' }} />;
  }

  async function handleOutreach(creator: Creator) {
    setOutreachLoading(true);
    setOutreachText('');
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          toolName: 'ai-chat',
          messages: [{
            role: 'user',
            content: `Write a personalised TikTok creator outreach pitch for ${creator.display_name ?? creator.username} (@${creator.username}).
Creator context: ${creator.follower_count.toLocaleString()} followers, ${creator.top_categories.join(', ')} niche, $${creator.gmv_30d_aud.toLocaleString()} AUD GMV last 30 days, ${creator.engagement_rate}% engagement, based in ${creator.location}.
Keep it under 150 words, friendly and specific to their niche. Include a subject line. AU English.`,
          }],
          stream: false,
        }),
      });
      const json = await res.json() as { reply?: string };
      setOutreachText(json.reply ?? 'No response — please try again.');
    } catch { setOutreachText('Error generating pitch — check connection.'); }
    finally { setOutreachLoading(false); }
  }

  const FILTERS: { key: FilterMode; label: string }[] = [
    { key: 'all', label: 'All Creators' },
    { key: 'rising', label: '🚀 Rising (>20% growth)' },
    { key: 'top-gmv', label: '💰 Top GMV' },
    { key: 'micro', label: 'Micro (50k–500k)' },
    { key: 'nano', label: 'Nano (<50k)' },
  ];

  const COLS: { key: SortKey; label: string; width?: string }[] = [
    { key: 'username', label: '#  Creator', width: 'w-48' },
    { key: 'follower_count', label: 'Followers' },
    { key: 'gmv_30d_aud', label: 'GMV 30d' },
    { key: 'gmv_growth_rate', label: 'Growth' },
    { key: 'avg_video_views', label: 'Avg Views' },
    { key: 'engagement_rate', label: 'Eng.' },
    { key: 'revenue_sparkline', label: 'Trend' },
  ];

  const avgGmv = creators.length ? Math.round(creators.reduce((a, c) => a + c.gmv_30d_aud, 0) / creators.length) : 0;
  const topEngagement = creators.length ? Math.max(...creators.map(c => c.engagement_rate)) : 0;

  return (
    <div className="min-h-full" style={{ background: '#FAFAFA', color: '#0A0A0A' }}>
      <Helmet><title>Creator Intelligence | Majorka</title></Helmet>
      {/* Header */}
      <div className="px-6 py-5 border-b" style={{ borderColor: '#E5E7EB' }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif', color: '#0A0A0A' }}>Creator Intelligence</h1>
            <p className="text-sm mt-0.5" style={{ color: '#64748b', fontFamily: 'DM Sans, sans-serif' }}>AU TikTok creators driving product sales</p>
          </div>
          {/* Stats bar */}
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <p className="font-semibold" style={{ color: '#6366F1' }}>{creators.length}</p>
              <p className="text-xs" style={{ color: '#64748b' }}>Total</p>
            </div>
            <div className="text-center">
              <p className="font-semibold" style={{ color: '#6366F1' }}>{fmtAUD(avgGmv)}</p>
              <p className="text-xs" style={{ color: '#64748b' }}>Avg GMV</p>
            </div>
            <div className="text-center">
              <p className="font-semibold" style={{ color: '#6366F1' }}>{topEngagement.toFixed(1)}%</p>
              <p className="text-xs" style={{ color: '#64748b' }}>Top Eng.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Left sidebar filters */}
        <aside
          className="hidden lg:flex flex-col w-52 flex-shrink-0 p-4 border-r"
          style={{ borderColor: '#E5E7EB', background: '#FAFAFA', minHeight: 'calc(100vh - 80px)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#475569' }}>Filter</p>
          <div className="space-y-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className="w-full text-left text-sm px-3 py-2 rounded-lg transition-colors"
                style={{
                  background: filter === f.key ? 'rgba(99,102,241,0.12)' : 'transparent',
                  color: filter === f.key ? '#6366F1' : '#6B7280',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 p-6">
          {/* Mobile filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 lg:hidden mb-4">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full transition-colors"
                style={{
                  background: filter === f.key ? 'rgba(99,102,241,0.1)' : '#F5F5F5',
                  color: filter === f.key ? '#6366F1' : '#6B7280',
                  border: filter === f.key ? '1px solid rgba(99,102,241,0.3)' : '1px solid #E5E7EB',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
            <input
              type="text"
              placeholder="Search by name or username…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
              style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                color: '#0A0A0A',
                outline: 'none',
                fontFamily: 'DM Sans, sans-serif',
              }}
            />
          </div>

          {/* Table */}
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr style={{ borderBottom: '1px solid #F0F0F0', background: '#F9FAFB' }}>
                    {COLS.map((col) => (
                      <th
                        key={col.key as string}
                        className="text-left px-4 py-2.5 text-xs font-medium cursor-pointer select-none"
                        style={{ color: '#475569' }}
                        onClick={() => col.key !== 'revenue_sparkline' && toggleSort(col.key)}
                      >
                        <span className="flex items-center gap-1">
                          {col.label}
                          {col.key !== 'revenue_sparkline' && <SortIcon col={col.key} />}
                        </span>
                      </th>
                    ))}
                    <th className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: '#475569' }}>Categories</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={9} className="px-4 py-8 text-center text-sm" style={{ color: '#475569' }}>Loading creators…</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={9} style={{ padding: '48px 24px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 32, opacity: 0.4 }}>👥</span>
                        <p style={{ color: '#0A0A0A', fontSize: 14, fontWeight: 600, fontFamily: 'Syne, sans-serif', margin: 0 }}>No creators found</p>
                        <p style={{ color: '#475569', fontSize: 12, margin: 0 }}>Data refreshes every 6 hours — check back soon</p>
                      </div>
                    </td></tr>
                  ) : (
                    filtered.map((c, i) => (
                      <tr
                        key={c.id}
                        className="cursor-pointer transition-colors"
                        style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F0F0F0' : 'none' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F5F5FF')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        onClick={() => setSelected(c)}
                      >
                        {/* Creator */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs w-5 text-center font-mono flex-shrink-0" style={{ color: '#475569' }}>{i + 1}</span>
                            <div
                              className="w-8 h-8 rounded-full flex-shrink-0 bg-cover bg-center"
                              style={{ backgroundImage: c.avatar_url ? `url(${c.avatar_url})` : undefined, background: c.avatar_url ? undefined : 'rgba(99,102,241,0.2)', minWidth: 32 }}
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate flex items-center gap-1" style={{ color: '#0A0A0A' }}>
                                {c.display_name ?? c.username}
                                {c.is_verified && <span className="text-xs" style={{ color: '#38bdf8' }}>✓</span>}
                              </p>
                              <p className="text-xs truncate" style={{ color: '#475569' }}>@{c.username}</p>
                            </div>
                          </div>
                        </td>
                        {/* Followers */}
                        <td className="px-4 py-3 text-sm" style={{ color: '#94a3b8' }}>{fmtNum(c.follower_count)}</td>
                        {/* GMV */}
                        <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#6366F1' }}>{fmtAUD(c.gmv_30d_aud)}</td>
                        {/* Growth */}
                        <td className="px-4 py-3 text-sm font-medium" style={{ color: c.gmv_growth_rate >= 0 ? '#22c55e' : '#ef4444' }}>
                          {c.gmv_growth_rate >= 0 ? '+' : ''}{c.gmv_growth_rate?.toFixed(1)}%
                        </td>
                        {/* Avg views */}
                        <td className="px-4 py-3 text-sm" style={{ color: '#94a3b8' }}>{fmtNum(c.avg_video_views)}</td>
                        {/* Engagement */}
                        <td className="px-4 py-3 text-sm" style={{ color: '#94a3b8' }}>{c.engagement_rate?.toFixed(1)}%</td>
                        {/* Sparkline */}
                        <td className="px-4 py-3">
                          <MiniSparkline data={parseSparkline(c.revenue_sparkline)} />
                        </td>
                        {/* Categories */}
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(c.top_categories ?? []).slice(0, 2).map((cat) => (
                              <span key={cat} className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(99,102,241,0.08)', color: '#6366F1' }}>{cat}</span>
                            ))}
                          </div>
                        </td>
                        {/* Action */}
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelected(c); }}
                            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                            style={{ background: '#F5F5F5', color: '#6B7280', border: '1px solid #E5E7EB' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.1)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = '#F5F5F5')}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs mt-3" style={{ color: '#9CA3AF' }}>
            {filtered.length} of {creators.length} creators shown
          </p>
        </div>
      </div>

      {/* Outreach result panel */}
      {(outreachLoading || outreachText) && selected && (
        <div
          className="fixed bottom-6 right-6 max-w-md rounded-xl p-5 shadow-2xl"
          style={{ background: 'white', border: '1px solid rgba(99,102,241,0.3)', zIndex: 60 }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold" style={{ color: '#6366F1' }}>Outreach Pitch</p>
            <button onClick={() => setOutreachText('')} style={{ color: '#64748b' }}><X size={15} /></button>
          </div>
          {outreachLoading ? (
            <p className="text-sm" style={{ color: '#94a3b8' }}>Writing pitch…</p>
          ) : (
            <p className="text-sm whitespace-pre-wrap" style={{ color: '#0A0A0A', fontFamily: 'DM Sans, sans-serif', lineHeight: '1.6' }}>{outreachText}</p>
          )}
        </div>
      )}

      {/* Drawer */}
      {selected && (
        <CreatorDrawer
          creator={selected}
          onClose={() => { setSelected(null); setOutreachText(''); }}
          onOutreach={(c) => { void handleOutreach(c); }}
        />
      )}
    </div>
  );
}
