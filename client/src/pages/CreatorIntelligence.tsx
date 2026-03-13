/**
 * CreatorIntelligence — /app/creators
 * Data-dense table of AU TikTok creators.
 * Revenue-first, Bloomberg-style, no gamification.
 */

import { ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useLocation } from 'wouter';
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
        style={{ background: '#0f1117', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Drawer header */}
        <div
          className="sticky top-0 flex items-center justify-between px-5 py-4"
          style={{ background: '#0f1117', borderBottom: '1px solid rgba(255,255,255,0.06)', zIndex: 10 }}
        >
          <p className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>Creator Profile</p>
          <button onClick={onClose} style={{ color: '#64748b' }}><X size={18} /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Identity */}
          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-full flex-shrink-0 bg-cover bg-center"
              style={{ backgroundImage: creator.avatar_url ? `url(${creator.avatar_url})` : undefined, background: creator.avatar_url ? undefined : 'rgba(212,175,55,0.2)' }}
            />
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-base font-semibold" style={{ color: '#e2e8f0', fontFamily: 'Syne, sans-serif' }}>
                  {creator.display_name ?? creator.username}
                </p>
                {creator.is_verified && <span className="text-sm" style={{ color: '#38bdf8' }}>✓</span>}
              </div>
              <p className="text-sm" style={{ color: '#64748b' }}>@{creator.username}</p>
              {creator.location && <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{creator.location}</p>}
              {creator.tiktok_url && (
                <a href={creator.tiktok_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs mt-1 inline-block" style={{ color: '#d4af37' }}>
                  View TikTok →
                </a>
              )}
            </div>
          </div>

          {/* Revenue chart */}
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs mb-3" style={{ color: '#64748b' }}>8-week GMV trend</p>
            {sparkData.length > 1 ? (
              <ResponsiveContainer width="100%" height={80}>
                <LineChart data={sparkData.map((v) => ({ v }))}>
                  <Line type="monotone" dataKey="v" stroke="#d4af37" dot={false} strokeWidth={2} />
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
              <div key={m.label} className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs" style={{ color: '#64748b' }}>{m.label}</p>
                <p className="text-base font-semibold mt-0.5" style={{ color: m.highlight ? '#d4af37' : '#e2e8f0', fontFamily: 'Syne, sans-serif' }}>
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
                <span key={c} className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(212,175,55,0.1)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.2)' }}>{c}</span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <button
            onClick={() => onOutreach(creator)}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: 'rgba(212,175,55,0.15)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.3)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(212,175,55,0.25)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(212,175,55,0.15)')}
          >
            Generate Outreach Pitch →
          </button>
        </div>
      </div>
    </div>
  );
}

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

  async function fetchCreators() {
    try {
      const { data } = await supabase.from('au_creators').select('*').order('gmv_30d_aud', { ascending: false });
      setCreators((data ?? []) as Creator[]);
    } catch { /* graceful */ }
    finally { setLoading(false); }
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
    if (sortKey !== col) return <span style={{ color: '#334155' }}>↕</span>;
    return sortDir === 'desc' ? <ChevronDown size={12} style={{ color: '#d4af37' }} /> : <ChevronUp size={12} style={{ color: '#d4af37' }} />;
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
    <div className="min-h-full" style={{ background: '#080a0e', color: '#e2e8f0' }}>
      {/* Header */}
      <div className="px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif', color: '#fff' }}>Creator Intelligence</h1>
            <p className="text-sm mt-0.5" style={{ color: '#64748b', fontFamily: 'DM Sans, sans-serif' }}>AU TikTok creators driving product sales</p>
          </div>
          {/* Stats bar */}
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <p className="font-semibold" style={{ color: '#d4af37' }}>{creators.length}</p>
              <p className="text-xs" style={{ color: '#64748b' }}>Total</p>
            </div>
            <div className="text-center">
              <p className="font-semibold" style={{ color: '#d4af37' }}>{fmtAUD(avgGmv)}</p>
              <p className="text-xs" style={{ color: '#64748b' }}>Avg GMV</p>
            </div>
            <div className="text-center">
              <p className="font-semibold" style={{ color: '#d4af37' }}>{topEngagement.toFixed(1)}%</p>
              <p className="text-xs" style={{ color: '#64748b' }}>Top Eng.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Left sidebar filters */}
        <aside
          className="hidden lg:flex flex-col w-52 flex-shrink-0 p-4 border-r"
          style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#080a0e', minHeight: 'calc(100vh - 80px)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#475569' }}>Filter</p>
          <div className="space-y-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className="w-full text-left text-sm px-3 py-2 rounded-lg transition-colors"
                style={{
                  background: filter === f.key ? 'rgba(212,175,55,0.12)' : 'transparent',
                  color: filter === f.key ? '#d4af37' : '#94a3b8',
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
                  background: filter === f.key ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)',
                  color: filter === f.key ? '#d4af37' : '#94a3b8',
                  border: filter === f.key ? '1px solid rgba(212,175,55,0.3)' : '1px solid rgba(255,255,255,0.08)',
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
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#e2e8f0',
                outline: 'none',
                fontFamily: 'DM Sans, sans-serif',
              }}
            />
          </div>

          {/* Table */}
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
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
                    <tr><td colSpan={9} className="px-4 py-8 text-center text-sm" style={{ color: '#475569' }}>No creators found</td></tr>
                  ) : (
                    filtered.map((c, i) => (
                      <tr
                        key={c.id}
                        className="cursor-pointer transition-colors"
                        style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        onClick={() => setSelected(c)}
                      >
                        {/* Creator */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs w-5 text-center font-mono flex-shrink-0" style={{ color: '#475569' }}>{i + 1}</span>
                            <div
                              className="w-8 h-8 rounded-full flex-shrink-0 bg-cover bg-center"
                              style={{ backgroundImage: c.avatar_url ? `url(${c.avatar_url})` : undefined, background: c.avatar_url ? undefined : 'rgba(212,175,55,0.2)', minWidth: 32 }}
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate flex items-center gap-1" style={{ color: '#e2e8f0' }}>
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
                        <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#d4af37' }}>{fmtAUD(c.gmv_30d_aud)}</td>
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
                              <span key={cat} className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(212,175,55,0.08)', color: '#d4af37' }}>{cat}</span>
                            ))}
                          </div>
                        </td>
                        {/* Action */}
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelected(c); }}
                            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                            style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(212,175,55,0.12)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
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

          <p className="text-xs mt-3" style={{ color: '#334155' }}>
            {filtered.length} of {creators.length} creators shown
          </p>
        </div>
      </div>

      {/* Outreach result panel */}
      {(outreachLoading || outreachText) && selected && (
        <div
          className="fixed bottom-6 right-6 max-w-md rounded-xl p-5 shadow-2xl"
          style={{ background: '#0f1117', border: '1px solid rgba(212,175,55,0.3)', zIndex: 60 }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold" style={{ color: '#d4af37' }}>Outreach Pitch</p>
            <button onClick={() => setOutreachText('')} style={{ color: '#64748b' }}><X size={15} /></button>
          </div>
          {outreachLoading ? (
            <p className="text-sm" style={{ color: '#94a3b8' }}>Writing pitch…</p>
          ) : (
            <p className="text-sm whitespace-pre-wrap" style={{ color: '#e2e8f0', fontFamily: 'DM Sans, sans-serif', lineHeight: '1.6' }}>{outreachText}</p>
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
