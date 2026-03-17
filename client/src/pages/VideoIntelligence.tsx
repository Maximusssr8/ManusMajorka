/**
 * VideoIntelligence — /app/videos
 * Top-performing AU product videos. Card grid, revenue-first.
 * Bloomberg terminal style — no gamification, no scores.
 */

import { Helmet } from 'react-helmet-async';
import { Copy, Play, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';

// ── Quick Action flywheel ─────────────────────────────────────────────────────
function QuickActions({
  productTitle,
  category,
  compact = false,
}: {
  productTitle: string | null;
  category: string | null;
  compact?: boolean;
}) {
  const [, nav] = useLocation();
  if (!productTitle && !category) return null;
  const pt = encodeURIComponent(productTitle ?? category ?? '');
  const cat = encodeURIComponent(category ?? 'General');
  const actions = [
    { label: 'Generate Ads', path: `/app/meta-ads?product=${pt}&category=${cat}`, color: '#a78bfa' },
    { label: 'Build Store', path: `/app/website-generator?niche=${cat}&product=${pt}`, color: '#34d399' },
    { label: 'Check Profit', path: `/app/profit-calculator`, color: '#d4af37' },
    { label: 'Find Creators', path: `/app/creators?category=${cat}`, color: '#38bdf8' },
  ];
  return (
    <div className={`flex flex-wrap gap-1.5 ${compact ? '' : 'mt-1'}`}>
      {actions.map((a) => (
        <button
          key={a.label}
          onClick={(e) => { e.stopPropagation(); nav(a.path); }}
          className="text-xs px-2 py-0.5 rounded font-medium transition-colors"
          style={{ background: `${a.color}14`, color: a.color, border: `1px solid ${a.color}25` }}
          onMouseEnter={(ev) => (ev.currentTarget.style.background = `${a.color}28`)}
          onMouseLeave={(ev) => (ev.currentTarget.style.background = `${a.color}14`)}
        >
          {a.label} →
        </button>
      ))}
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface TrendingVideo {
  id: string;
  video_title: string | null;
  creator_username: string | null;
  product_name: string | null;
  thumbnail_url: string | null;
  tiktok_video_url: string | null;
  views: number;
  likes: number;
  gmv_driven_aud: number;
  items_sold_from_video: number;
  engagement_rate: number;
  hook_type: string | null;
  category: string | null;
  published_at: string | null;
}

type TabKey = 'hot' | 'rising' | 'converting' | 'gmv';
type HookFilter = 'all' | string;
type CategoryFilter = 'all' | string;

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtAUD(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}k`;
  return `$${val.toFixed(0)}`;
}

function fmtViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const HOOK_COLOURS: Record<string, string> = {
  'Problem/Solution': '#ef4444',
  'POV':             '#a78bfa',
  'Unboxing':        '#38bdf8',
  'Demo':            '#34d399',
  'Testimonial':     '#f59e0b',
};

function HookBadge({ hook }: { hook: string | null }) {
  if (!hook) return null;
  const color = HOOK_COLOURS[hook] ?? '#94a3b8';
  return (
    <span
      className="text-xs px-2 py-0.5 rounded font-medium"
      style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
    >
      {hook}
    </span>
  );
}

// ── Video Modal ───────────────────────────────────────────────────────────────

function VideoModal({
  video,
  onClose,
  onGenerateScript,
}: {
  video: TrendingVideo;
  onClose: () => void;
  onGenerateScript: (v: TrendingVideo) => void;
}) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  function copyHook() {
    const hook = video.video_title ?? `Check this out — ${video.product_name}`;
    void navigator.clipboard.writeText(hook);
    toast.success('Hook copied');
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Thumbnail */}
        <div className="relative aspect-video bg-black">
          {video.thumbnail_url ? (
            <img src={video.thumbnail_url} alt={video.video_title ?? ''} className="w-full h-full object-cover opacity-80" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <Play size={40} style={{ color: '#475569' }} />
            </div>
          )}
          {video.tiktok_video_url && (
            <a
              href={video.tiktok_video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.4)' }}
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', border: '2px solid rgba(255,255,255,0.4)' }}>
                <Play size={22} style={{ color: '#fff' }} fill="white" />
              </div>
            </a>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.7)' }}
          >
            <X size={15} style={{ color: '#fff' }} />
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-sm font-semibold" style={{ color: '#e2e8f0', fontFamily: 'DM Sans, sans-serif' }}>{video.video_title ?? 'Untitled video'}</p>
              <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                @{video.creator_username} · {timeAgo(video.published_at)}
              </p>
            </div>
            <HookBadge hook={video.hook_type} />
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'GMV Driven', value: fmtAUD(video.gmv_driven_aud), gold: true },
              { label: 'Views', value: fmtViews(video.views), gold: false },
              { label: 'Items Sold', value: fmtViews(video.items_sold_from_video), gold: false },
              { label: 'Likes', value: fmtViews(video.likes), gold: false },
              { label: 'Engagement', value: `${video.engagement_rate?.toFixed(1)}%`, gold: false },
              { label: 'Product', value: video.product_name ?? '—', gold: false },
            ].map((m) => (
              <div key={m.label} className="rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs mb-0.5" style={{ color: '#64748b' }}>{m.label}</p>
                <p className="text-sm font-semibold truncate" style={{ color: m.gold ? '#d4af37' : '#e2e8f0' }}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* Why it works */}
          <div className="rounded-lg p-3 mb-4" style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: '#d4af37' }}>Why this video works</p>
            <p className="text-xs" style={{ color: '#94a3b8', lineHeight: '1.6' }}>
              {video.hook_type === 'POV' && 'POV hooks place the viewer inside the experience — creates instant relatability and drives saves/shares as people tag friends.'}
              {video.hook_type === 'Problem/Solution' && 'Leads with a pain point the AU audience already feels, then positions the product as the obvious solution — high purchase intent.'}
              {video.hook_type === 'Unboxing' && 'Unboxing satisfies curiosity and builds trust — viewers see the exact product before buying, reducing return risk mentally.'}
              {video.hook_type === 'Demo' && 'Live demonstrations remove the "does it work?" doubt — highest-converting hook type for functional products.'}
              {video.hook_type === 'Testimonial' && 'Real results from a relatable creator build social proof — AU audiences trust peer recommendations over brand ads.'}
              {!video.hook_type && 'Strong creative execution with an engaging hook and product demonstration drives high conversion rates.'}
            </p>
          </div>

          {/* Quick Actions flywheel */}
          <QuickActions productTitle={video.product_name} category={video.category} />

          {/* Script actions */}
          <div className="flex gap-2 mt-1">
            <button
              onClick={copyHook}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            >
              <Copy size={14} /> Copy Hook
            </button>
            <button
              onClick={() => onGenerateScript(video)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{ background: 'rgba(212,175,55,0.15)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.3)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(212,175,55,0.25)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(212,175,55,0.15)')}
            >
              Generate Script →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Seed data fallback ───────────────────────────────────────────────────────

const SEED_VIDEOS: TrendingVideo[] = [
  { id: '1', video_title: 'Stop looking washed out on video calls — this $39 fix changed everything', creator_username: 'zoeaubeauty', product_name: 'LED Ring Light', thumbnail_url: null, tiktok_video_url: null, views: 2400000, likes: 180000, gmv_driven_aud: 127680, items_sold_from_video: 1840, engagement_rate: 8.4, hook_type: 'Problem/Solution', category: 'Tech Accessories', published_at: new Date(Date.now()-2*86400000).toISOString() },
  { id: '2', video_title: '3 weeks of WFH destroyed my posture — here\'s what fixed it', creator_username: 'healthhackau', product_name: 'Posture Corrector', thumbnail_url: null, tiktok_video_url: null, views: 1890000, likes: 145000, gmv_driven_aud: 89200, items_sold_from_video: 2230, engagement_rate: 9.1, hook_type: 'Problem/Solution', category: 'Health & Wellness', published_at: new Date(Date.now()-1*86400000).toISOString() },
  { id: '3', video_title: 'I ASMR\'d my stress away with this $45 gadget and now I can\'t stop', creator_username: 'glowwithgrace_au', product_name: 'Electric Scalp Massager', thumbnail_url: null, tiktok_video_url: null, views: 3200000, likes: 290000, gmv_driven_aud: 205000, items_sold_from_video: 4100, engagement_rate: 11.2, hook_type: 'Demo', category: 'Beauty & Skincare', published_at: new Date(Date.now()-3*86400000).toISOString() },
  { id: '4', video_title: '5 exercises to transform your glutes at home — no gym needed', creator_username: 'fitnesswithkyle_au', product_name: 'Resistance Bands Set', thumbnail_url: null, tiktok_video_url: null, views: 890000, likes: 52000, gmv_driven_aud: 48020, items_sold_from_video: 980, engagement_rate: 6.8, hook_type: 'Demo', category: 'Activewear & Gym', published_at: new Date(Date.now()-4*86400000).toISOString() },
  { id: '5', video_title: 'Unboxing the charging pad that cleared all the cables off my desk', creator_username: 'techdealsau', product_name: 'Wireless Charging Pad', thumbnail_url: null, tiktok_video_url: null, views: 1560000, likes: 98000, gmv_driven_aud: 143500, items_sold_from_video: 2870, engagement_rate: 7.3, hook_type: 'Unboxing', category: 'Tech Accessories', published_at: new Date(Date.now()-5*86400000).toISOString() },
  { id: '6', video_title: 'My new morning ritual that actually makes me want to wake up', creator_username: 'cookingwithmateo', product_name: 'Matcha Whisk Set', thumbnail_url: null, tiktok_video_url: null, views: 2100000, likes: 175000, gmv_driven_aud: 96000, items_sold_from_video: 3200, engagement_rate: 10.4, hook_type: 'POV', category: 'Coffee & Beverages', published_at: new Date(Date.now()-6*86400000).toISOString() },
  { id: '7', video_title: 'My dog completely lost his mind when I gave him this $28 puzzle toy', creator_username: 'petsofoz', product_name: 'Dog Puzzle Feeder', thumbnail_url: null, tiktok_video_url: null, views: 4500000, likes: 420000, gmv_driven_aud: 224000, items_sold_from_video: 5600, engagement_rate: 14.2, hook_type: 'Testimonial', category: 'Pets & Animals', published_at: new Date(Date.now()-1*86400000).toISOString() },
  { id: '8', video_title: 'The ancient face sculpting technique that costs $24 — dermatologist approved', creator_username: 'zoeaubeauty', product_name: 'Gua Sha Tool', thumbnail_url: null, tiktok_video_url: null, views: 1200000, likes: 88000, gmv_driven_aud: 95000, items_sold_from_video: 1900, engagement_rate: 8.8, hook_type: 'Demo', category: 'Beauty & Skincare', published_at: new Date(Date.now()-2*86400000).toISOString() },
  { id: '9', video_title: 'I finally found what stops my air fryer from staining — game changer', creator_username: 'cookingwithmateo', product_name: 'Air Fryer Silicone Liners', thumbnail_url: null, tiktok_video_url: null, views: 780000, likes: 41000, gmv_driven_aud: 52800, items_sold_from_video: 2400, engagement_rate: 5.6, hook_type: 'Problem/Solution', category: 'Home & Kitchen', published_at: new Date(Date.now()-7*86400000).toISOString() },
  { id: '10', video_title: 'I took this on a 5-day hike and it charged my phone 8 times', creator_username: 'outdooradventuresoz', product_name: 'Solar Power Bank', thumbnail_url: null, tiktok_video_url: null, views: 640000, likes: 35000, gmv_driven_aud: 71200, items_sold_from_video: 890, engagement_rate: 6.2, hook_type: 'Testimonial', category: 'Outdoor & Camping', published_at: new Date(Date.now()-8*86400000).toISOString() },
  { id: '11', video_title: 'My pantry went from chaos to Pinterest-worthy in 20 minutes', creator_username: 'homewithsophie', product_name: 'Bamboo Storage Baskets', thumbnail_url: null, tiktok_video_url: null, views: 920000, likes: 56000, gmv_driven_aud: 44000, items_sold_from_video: 1100, engagement_rate: 7.1, hook_type: 'POV', category: 'Home Decor', published_at: new Date(Date.now()-3*86400000).toISOString() },
  { id: '12', video_title: 'I make a week of baby food in 30 minutes with this — mums this is for you', creator_username: 'mumlifemelbourne', product_name: 'Baby Food Maker', thumbnail_url: null, tiktok_video_url: null, views: 1080000, likes: 82000, gmv_driven_aud: 53200, items_sold_from_video: 760, engagement_rate: 9.4, hook_type: 'Testimonial', category: 'Baby & Kids', published_at: new Date(Date.now()-4*86400000).toISOString() },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function VideoIntelligence() {
  const [videos, setVideos] = useState<TrendingVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('hot');
  const [hookFilter, setHookFilter] = useState<HookFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [minGmv, setMinGmv] = useState(0);
  const [selected, setSelected] = useState<TrendingVideo | null>(null);
  const [scriptLoading, setScriptLoading] = useState(false);
  const [scriptText, setScriptText] = useState('');

  useEffect(() => { void fetchVideos(); }, []);

  async function fetchVideos() {
    try {
      const { data } = await supabase.from('trending_videos').select('*').order('gmv_driven_aud', { ascending: false });
      setVideos(data && data.length > 0 ? (data as TrendingVideo[]) : SEED_VIDEOS);
    } catch {
      setVideos(SEED_VIDEOS);
    } finally {
      setLoading(false);
    }
  }

  const allHooks = useMemo(() => ['all', ...Array.from(new Set(videos.map(v => v.hook_type).filter(Boolean)))], [videos]) as string[];
  const allCategories = useMemo(() => ['all', ...Array.from(new Set(videos.map(v => v.category).filter(Boolean)))], [videos]) as string[];

  const filtered = useMemo(() => {
    let list = [...videos];
    if (hookFilter !== 'all') list = list.filter(v => v.hook_type === hookFilter);
    if (categoryFilter !== 'all') list = list.filter(v => v.category === categoryFilter);
    if (minGmv > 0) list = list.filter(v => v.gmv_driven_aud >= minGmv);
    switch (tab) {
      case 'hot': list.sort((a, b) => b.views - a.views); break;
      case 'rising': list.sort((a, b) => b.engagement_rate - a.engagement_rate); break;
      case 'converting': list.sort((a, b) => b.items_sold_from_video - a.items_sold_from_video); break;
      case 'gmv': list.sort((a, b) => b.gmv_driven_aud - a.gmv_driven_aud); break;
    }
    return list;
  }, [videos, tab, hookFilter, categoryFilter, minGmv]);

  async function handleGenerateScript(video: TrendingVideo) {
    setScriptLoading(true);
    setScriptText('');
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          toolName: 'ai-chat',
          messages: [{
            role: 'user',
            content: `Write a TikTok video script similar to this high-performing video:
Title: "${video.video_title}"
Product: ${video.product_name}
Hook type: ${video.hook_type}
Performance: ${fmtViews(video.views)} views, ${fmtAUD(video.gmv_driven_aud)} GMV driven, ${video.engagement_rate.toFixed(1)}% engagement
Category: ${video.category}

Write a 30-second script with: hook (0-3s), problem/tension (3-10s), solution/product reveal (10-22s), CTA (22-30s). Include text overlays. AU English.`,
          }],
          stream: false,
        }),
      });
      const json = await res.json() as { reply?: string };
      setScriptText(json.reply ?? 'Error generating script.');
    } catch { setScriptText('Error — please try again.'); }
    finally { setScriptLoading(false); }
  }

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'hot', label: '🔥 Most Viewed' },
    { key: 'rising', label: '📈 Best Engagement' },
    { key: 'converting', label: '🎯 Top Converting' },
    { key: 'gmv', label: '💰 Top GMV' },
  ];

  return (
    <div className="min-h-full" style={{ background: '#080a0e', color: '#e2e8f0' }}>
      <Helmet><title>Video Intelligence | Majorka</title></Helmet>
      {/* Header */}
      <div className="px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <h1 className="text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif', color: '#fff' }}>Video Intelligence</h1>
        <p className="text-sm mt-0.5" style={{ color: '#64748b', fontFamily: 'DM Sans, sans-serif' }}>Top-performing AU product videos — what drives real sales</p>
      </div>

      <div className="flex">
        {/* Left sidebar */}
        <aside
          className="hidden lg:flex flex-col w-52 flex-shrink-0 p-4 border-r space-y-6"
          style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#080a0e', minHeight: 'calc(100vh - 80px)' }}
        >
          {/* Hook type filter */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#475569' }}>Hook Type</p>
            <div className="space-y-1">
              {allHooks.map((h) => (
                <button
                  key={h}
                  onClick={() => setHookFilter(h)}
                  className="w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors"
                  style={{
                    background: hookFilter === h ? 'rgba(212,175,55,0.12)' : 'transparent',
                    color: hookFilter === h ? '#d4af37' : '#94a3b8',
                  }}
                >
                  {h === 'all' ? 'All Types' : h}
                </button>
              ))}
            </div>
          </div>

          {/* Category filter */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#475569' }}>Category</p>
            <div className="space-y-1">
              {allCategories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c)}
                  className="w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors"
                  style={{
                    background: categoryFilter === c ? 'rgba(212,175,55,0.12)' : 'transparent',
                    color: categoryFilter === c ? '#d4af37' : '#94a3b8',
                  }}
                >
                  {c === 'all' ? 'All Categories' : c}
                </button>
              ))}
            </div>
          </div>

          {/* Min GMV */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#475569' }}>Min GMV</p>
            <div className="space-y-1">
              {[0, 5000, 8000, 10000, 15000].map((g) => (
                <button
                  key={g}
                  onClick={() => setMinGmv(g)}
                  className="w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors"
                  style={{
                    background: minGmv === g ? 'rgba(212,175,55,0.12)' : 'transparent',
                    color: minGmv === g ? '#d4af37' : '#94a3b8',
                  }}
                >
                  {g === 0 ? 'Any' : `$${(g / 1000).toFixed(0)}k+`}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 p-6">
          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 mb-6">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="flex-shrink-0 text-sm px-4 py-2 rounded-lg transition-colors font-medium"
                style={{
                  background: tab === t.key ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)',
                  color: tab === t.key ? '#d4af37' : '#94a3b8',
                  border: tab === t.key ? '1px solid rgba(212,175,55,0.3)' : '1px solid rgba(255,255,255,0.07)',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Cards grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-xl aspect-video animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16" style={{ color: '#475569' }}>
              <Play size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No videos match your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((v) => (
                <div
                  key={v.id}
                  className="rounded-xl overflow-hidden cursor-pointer transition-all duration-150 hover:scale-[1.01]"
                  style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}
                  onClick={() => { setSelected(v); setScriptText(''); }}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-black">
                    {v.thumbnail_url ? (
                      <img src={v.thumbnail_url} alt={v.video_title ?? ''} className="w-full h-full object-cover opacity-75" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: '#0a0b0d' }}>
                        <Play size={28} style={{ color: '#334155' }} />
                      </div>
                    )}
                    {/* View count badge */}
                    <div
                      className="absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded"
                      style={{ background: 'rgba(0,0,0,0.75)', color: '#fff' }}
                    >
                      👁 {fmtViews(v.views)}
                    </div>
                    {/* Play overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.4)' }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.8)' }}>
                        <Play size={16} fill="white" style={{ color: '#fff' }} />
                      </div>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-medium leading-tight flex-1" style={{ color: '#e2e8f0', fontFamily: 'DM Sans, sans-serif' }}>
                        {v.video_title ?? 'Untitled'}
                      </p>
                      <HookBadge hook={v.hook_type} />
                    </div>

                    <p className="text-xs mb-2" style={{ color: '#475569' }}>
                      @{v.creator_username} · {v.category} · {timeAgo(v.published_at)}
                    </p>

                    <div className="flex items-center justify-between mb-2">
                      {/* GMV — primary metric */}
                      <div>
                        <p className="text-xs" style={{ color: '#64748b' }}>GMV driven</p>
                        <p className="text-base font-bold" style={{ color: '#d4af37', fontFamily: 'Syne, sans-serif' }}>
                          {fmtAUD(v.gmv_driven_aud)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs" style={{ color: '#64748b' }}>Engagement</p>
                        <p className="text-sm font-medium" style={{ color: '#94a3b8' }}>{v.engagement_rate?.toFixed(1)}%</p>
                      </div>
                    </div>
                    <QuickActions productTitle={v.product_name} category={v.category} compact />
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs mt-4" style={{ color: '#334155' }}>{filtered.length} of {videos.length} videos shown</p>
        </div>
      </div>

      {/* Script result panel */}
      {(scriptLoading || scriptText) && (
        <div
          className="fixed bottom-6 right-6 max-w-md rounded-xl p-5 shadow-2xl overflow-y-auto"
          style={{ background: '#0f1117', border: '1px solid rgba(212,175,55,0.3)', zIndex: 60, maxHeight: '60vh' }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold" style={{ color: '#d4af37' }}>Generated Script</p>
            <button onClick={() => setScriptText('')} style={{ color: '#64748b' }}><X size={15} /></button>
          </div>
          {scriptLoading ? (
            <p className="text-sm" style={{ color: '#94a3b8' }}>Writing script…</p>
          ) : (
            <p className="text-sm whitespace-pre-wrap" style={{ color: '#e2e8f0', fontFamily: 'DM Sans, sans-serif', lineHeight: '1.6' }}>{scriptText}</p>
          )}
        </div>
      )}

      {/* Modal */}
      {selected && (
        <VideoModal
          video={selected}
          onClose={() => { setSelected(null); setScriptText(''); }}
          onGenerateScript={(v) => {
            setSelected(null);
            void handleGenerateScript(v);
          }}
        />
      )}
    </div>
  );
}
