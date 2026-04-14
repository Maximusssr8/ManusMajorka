import { useIsMobile } from '@/hooks/useIsMobile';
import { useEffect, useState, useMemo } from 'react';
import React from 'react';
import { DateRangeSelector, getDateRangeStart, type Range } from '@/components/DateRangeSelector';
import { exportCSV } from '@/lib/exportCsv';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/_core/hooks/useAuth';
import UpgradeModal from '@/components/UpgradeModal';
import UsageMeter from '@/components/UsageMeter';
import { PLAN_LIMITS } from '@shared/plans';
import { useLocation } from 'wouter';

const brico = "'Syne', sans-serif";

const FORMAT_META: Record<string, { emoji: string; color: string; bg: string; desc: string }> = {
  POV:       { emoji: '👁️', color: '#d4af37', bg: '#F3E8FF', desc: 'First-person story' },
  REVIEW:    { emoji: '⭐', color: '#B45309', bg: '#FEF3C7', desc: 'Honest opinion' },
  UNBOXING:  { emoji: '📦', color: '#0369A1', bg: '#E0F2FE', desc: 'First look reveal' },
  DEMO:      { emoji: '🎬', color: '#065F46', bg: '#D1FAE5', desc: 'Product in action' },
  LIFESTYLE: { emoji: '✨', color: '#d4af37', bg: 'rgba(212,175,55,0.08)', desc: 'Organic placement' },
};

const SIGNAL_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  VIRAL:  { label: '🔥 VIRAL',  color: '#DC2626', bg: '#FEF2F2',  dot: '#DC2626' },
  HIGH:   { label: '📈 HIGH',   color: '#059669', bg: '#D1FAE5',  dot: '#059669' },
  MEDIUM: { label: '📊 MEDIUM', color: '#B45309', bg: '#FEF3C7',  dot: '#D97706' },
};

const NICHES = ['beauty','fitness','home decor','pet care','health','kitchen'];

interface Video {
  id?: string;
  title: string;
  url: string;
  product_mentioned: string;
  niche: string;
  hook_text: string | null;
  engagement_signal: string;
  format: string;
  region_code: string;
  created_at?: string;
  scraped_at?: string;
  thumbnail?: string;
  playCount?: number;
  likes?: number;
  shares?: number;
  comments?: number;
  creator?: string;
  creatorHandle?: string;
  creatorProfileUrl?: string;
}

const NICHE_KEYWORDS: Record<string, string[]> = {
  beauty: ['beauty', 'skincare', 'makeup', 'glow'],
  fitness: ['fitness', 'gym', 'workout', 'exercise'],
  'home decor': ['home', 'homedecor', 'kitchen', 'cleaning'],
  'tech accessories': ['tech', 'gadget', 'gadgets', 'iphone'],
  'pet care': ['pets', 'dog', 'cat', 'puppy'],
  fashion: ['fashion', 'outfit', 'ootd', 'style'],
  health: ['health', 'wellness', 'supplement'],
  kitchen: ['kitchen', 'cooking', 'recipe', 'food'],
};

function detectVideoNiche(hashtags: string[]): string {
  const lower = hashtags.map(h => h.toLowerCase());
  for (const [niche, keywords] of Object.entries(NICHE_KEYWORDS)) {
    if (lower.some(h => keywords.some(k => h.includes(k)))) return niche;
  }
  return 'general';
}

function detectVideoFormat(title: string, hashtags: string[]): string {
  const text = (title + ' ' + hashtags.join(' ')).toLowerCase();
  if (text.includes('unbox') || text.includes('haul')) return 'UNBOXING';
  if (text.includes('review') || text.includes('honest')) return 'REVIEW';
  if (text.includes('demo') || text.includes('tutorial') || text.includes('how to')) return 'DEMO';
  if (text.includes('pov') || text.includes('storytime')) return 'POV';
  return 'LIFESTYLE';
}

export default function VideoIntelligence() {
  const { subPlan, subStatus, session } = useAuth();
  const [, setLocation] = useLocation();
  React.useEffect(() => { document.title = 'Video Intelligence | Majorka'; }, []);
  const isMobile = useIsMobile();
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selectedNiche, setSelectedNiche] = useState('');
  const [aiTab, setAiTab]         = useState<'hooks'|'script'|'live'>('hooks');
  const [aiProduct, setAiProduct] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOutput, setAiOutput]   = useState('');
  const [copied, setCopied]       = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast]         = useState('');
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<Range>(() => (localStorage.getItem('majorka_video_daterange') as Range) || '30d');
  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDateRange = (v: Range) => { localStorage.setItem('majorka_video_daterange', v); setDateRange(v); };

  const handleSearchInput = (val: string) => {
    setSearchInput(val);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!val.trim()) { setSearchQuery(''); setSearchResults([]); return; }
    searchTimerRef.current = setTimeout(() => runSearch(val.trim()), 500);
  };

  const runSearch = async (q: string) => {
    setSearchQuery(q);
    setSearchLoading(true);
    setSearchResults([]);
    try {
      const r = await fetch(`/api/videos/search?q=${encodeURIComponent(q)}`);
      const d = await r.json();
      setSearchResults((d.videos || []).map((v: any) => ({
        title: v.title || '', url: v.videoUrl || v.url || '', product_mentioned: q,
        niche: q, hook_text: v.title || null, engagement_signal: v.playCount > 500000 ? 'VIRAL' : v.playCount > 100000 ? 'HIGH' : 'MEDIUM',
        format: 'REVIEW', region_code: 'AU', thumbnail: v.thumbnail || '',
        playCount: v.playCount || 0, likes: v.likes || 0, shares: v.shares || 0,
        comments: v.comments || 0, creator: v.creator || '', creatorHandle: v.creatorHandle || '',
        creatorProfileUrl: v.creatorProfileUrl || '',
      })));
    } catch { setSearchResults([]); }
    setSearchLoading(false);
  };

  const clearSearch = () => { setSearchInput(''); setSearchQuery(''); setSearchResults([]); };

  // Load ALL videos once from real TikTok data, filter client-side
  useEffect(() => {
    setLoading(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      const headers: Record<string, string> = {};
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
      return fetch('/api/videos/real', { headers });
    })
      .then(r => r.json())
      .then(d => {
        if (d.last_synced) setLastSynced(d.last_synced);
        const mapped: Video[] = (d.videos || []).map((v: any) => ({
          id: v.id,
          title: v.title || '',
          url: v.videoUrl || '',
          product_mentioned: v.title ? v.title.slice(0, 80) : 'TikTok Video',
          niche: v.hashtags?.length > 0 ? detectVideoNiche(v.hashtags) : 'general',
          hook_text: v.title || null,
          engagement_signal: v.playCount >= 1_000_000 ? 'VIRAL' : v.playCount >= 100_000 ? 'HIGH' : 'MEDIUM',
          format: detectVideoFormat(v.title || '', v.hashtags || []),
          region_code: 'AU',
          created_at: v.postedAt || undefined,
          thumbnail: v.thumbnail || undefined,
          playCount: v.playCount || 0,
          likes: v.likes || 0,
          shares: v.shares || 0,
          comments: v.comments || 0,
          creator: v.creator || '',
          creatorHandle: v.creatorHandle || '',
          creatorProfileUrl: v.creatorProfileUrl || '',
        }));
        setAllVideos(mapped);
      })
      .catch(() => setAllVideos([]))
      .finally(() => setLoading(false));
  }, []);

  const videos = useMemo(() => {
    const rangeStart = getDateRangeStart(dateRange);
    return allVideos.filter(v => {
      if (selectedNiche && v.niche?.toLowerCase() !== selectedNiche.toLowerCase()) return false;
      const dateStr = v.created_at || v.scraped_at;
      if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime()) && d < rangeStart) return false;
      }
      return true;
    });
  }, [allVideos, selectedNiche, dateRange]);

  // Filter out hashtag aggregation page titles — these are not real hooks
  const isJunkHook = (text: string) => {
    const t = text.toLowerCase();
    return (
      t.startsWith('#') ||
      t.includes('viral hashtag') ||
      t.includes('trending hashtag') ||
      t.includes('how to go viral') ||
      t.includes('how to get') ||
      t.includes('20 products') ||
      t.includes('products set to go') ||
      t.includes('como ir viral') ||
      t.includes('cómo ir viral') ||
      (t.includes('viral') && t.includes('2024') && t.includes('product') && t.length < 40) ||
      t.includes('hashtags for') ||
      t.includes('hashtags 2025') ||
      t.includes('hashtags 2026')
    );
  };
  const hooks = useMemo(() =>
    allVideos.filter(v => v.hook_text && v.hook_text.length > 15 && !isJunkHook(v.hook_text))
      .filter(v => !selectedNiche || v.niche?.toLowerCase() === selectedNiche.toLowerCase())
      .slice(0, 12),
    [allVideos, selectedNiche]
  );

  const formatCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of videos) counts[v.format] = (counts[v.format] || 0) + 1;
    return counts;
  }, [videos]);

  const triggerRefresh = async () => {
    setRefreshing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
      await fetch('/api/admin/refresh-videos', { method: 'POST', headers });
      showToast('Scraping TikTok in background — refreshing in ~60s');
      setTimeout(async () => {
        try {
          const { data: { session: s2 } } = await supabase.auth.getSession();
          const h: Record<string, string> = {};
          if (s2?.access_token) h['Authorization'] = `Bearer ${s2.access_token}`;
          const r = await fetch('/api/videos/real', { headers: h });
          const d = await r.json();
          if (Array.isArray(d.videos)) {
            setAllVideos(d.videos.map((v: any) => ({
              id: v.id,
              title: v.title || '',
              url: v.videoUrl || '',
              product_mentioned: v.title ? v.title.slice(0, 80) : 'TikTok Video',
              niche: v.hashtags?.length > 0 ? detectVideoNiche(v.hashtags) : 'general',
              hook_text: v.title || null,
              engagement_signal: v.playCount >= 1_000_000 ? 'VIRAL' : v.playCount >= 100_000 ? 'HIGH' : 'MEDIUM',
              format: detectVideoFormat(v.title || '', v.hashtags || []),
              region_code: 'AU',
              created_at: v.postedAt || undefined,
              thumbnail: v.thumbnail || undefined,
              playCount: v.playCount || 0,
              likes: v.likes || 0,
              shares: v.shares || 0,
              comments: v.comments || 0,
              creator: v.creator || '',
              creatorHandle: v.creatorHandle || '',
              creatorProfileUrl: v.creatorProfileUrl || '',
            })));
          }
        } catch { /* keep current */ }
        setRefreshing(false);
      }, 60000);
    } catch {
      showToast('Scrape failed — try again in a moment');
      setRefreshing(false);
    }
  };

  const generateContent = async () => {
    setAiLoading(true);
    setAiOutput('');
    try {
      const r = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: aiTab === 'hooks' ? 'hook-generator' : aiTab === 'live' ? 'livestream-script' : 'tiktok-script',
          productName: aiProduct || selectedNiche || 'trending product',
          niche: selectedNiche || 'general',
          audience: 'Australian dropshippers',
          platform: 'TikTok',
        }),
      });
      const d = await r.json();
      setAiOutput(d.result || d.content || d.output || 'No output. Try again.');
    } catch { setAiOutput('Error — try again.'); }
    setAiLoading(false);
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const isAdmin = session?.user?.email === 'maximusmajorka@gmail.com';
  const isPaid = (subPlan === 'builder' || subPlan === 'scale') && subStatus === 'active';
  if (!isAdmin && !isPaid) {
    return <UpgradeModal isOpen={true} onClose={() => setLocation('/app/dashboard')} feature="Video Intelligence" reason="Analyse trending videos and content" />;
  }

  return (
    <div style={{ background: '#05070F', minHeight: '100vh' }}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div style={{ background: '#0d0d10', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: brico, fontWeight: 800, fontSize: 20, color: '#F8FAFC', margin: 0 }}>Video Intelligence</h1>
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: '3px 0 0' }}>
            {loading ? 'Loading...' : `${allVideos.length} videos tracked`}
            {lastSynced && !loading && (() => {
              const mins = Math.round((Date.now() - new Date(lastSynced).getTime()) / 60000);
              const ago = mins < 1 ? 'just now' : mins < 60 ? `${mins}m ago` : `${Math.round(mins / 60)}h ago`;
              return <span style={{ marginLeft: 8, color: '#D1D5DB' }}>· Last synced {ago}</span>;
            })()}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <DateRangeSelector value={dateRange} onChange={handleDateRange} />
          <button onClick={() => exportCSV(videos.map(v => ({ title: v.product_mentioned, niche: v.niche, format: v.format, engagement_signal: v.engagement_signal, hook_text: v.hook_text || '', url: v.url, region: v.region_code })), 'videos')}
            style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#0d0d10', color: '#CBD5E1', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer' }}>
            ⬇ Export CSV
          </button>
          <button onClick={triggerRefresh} disabled={refreshing}
            style={{ height: 36, padding: '0 16px', background: refreshing ? '#9CA3AF' : '#d4af37', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: refreshing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14 }}>{refreshing ? '⟳' : '↻'}</span>
            {refreshing ? 'Scraping…' : 'Refresh'}
          </button>
        </div>
      </div>

      <div style={{ padding: '0 28px', paddingTop: 12 }}>
        <UsageMeter feature="video_searches" limit={PLAN_LIMITS.builder.video_searches} label="video searches" />
      </div>

      {/* ── Search Bar ─────────────────────────────────────────────── */}
      <div style={{ padding: '12px 28px', background: '#05070F', borderBottom: '1px solid #F3F4F6' }}>
        <div style={{ maxWidth: 680, display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' as const }}>
            <span style={{ position: 'absolute' as const, left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#9CA3AF', pointerEvents: 'none' as const }}>🔍</span>
            <input
              value={searchInput}
              onChange={e => handleSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchInput.trim() && runSearch(searchInput.trim())}
              placeholder="Search product videos… e.g. 'dog cooling mat', 'LED face mask', 'posture corrector'"
              style={{ width: '100%', height: 40, paddingLeft: 38, paddingRight: searchInput ? 36 : 12, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 13, color: '#F8FAFC', background: '#0d0d10', outline: 'none', boxSizing: 'border-box' as const, fontFamily: '-apple-system, sans-serif' }}
            />
            {searchInput && (
              <button onClick={clearSearch} style={{ position: 'absolute' as const, right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#9CA3AF', padding: 2 }}>✕</button>
            )}
          </div>
          <button onClick={() => searchInput.trim() && runSearch(searchInput.trim())}
            style={{ height: 40, padding: '0 18px', background: '#d4af37', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
            Search
          </button>
        </div>
        {searchQuery && !searchLoading && (
          <div style={{ marginTop: 6, fontSize: 12, color: '#d4af37' }}>
            {searchResults.length > 0 ? `${searchResults.length} results for "${searchQuery}"` : `No videos found for "${searchQuery}" — try a broader search`}
            <button onClick={clearSearch} style={{ marginLeft: 10, fontSize: 11, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>clear</button>
          </div>
        )}
      </div>

      <div style={{ padding: '20px 28px', maxWidth: 1360, margin: '0 auto' }}>

        {/* ── Search loading skeleton ───────────────────────────────── */}
        {searchLoading && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, color: '#d4af37', fontWeight: 600, marginBottom: 12 }}>Searching TikTok for "{searchInput}"…</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
              {[1,2,3,4,5,6].map(i => (
                <div key={i} style={{ borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ height: 140, background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out infinite' }} />
                  <div style={{ padding: 10 }}>
                    <div style={{ height: 10, borderRadius: 5, background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out infinite', marginBottom: 6 }} />
                    <div style={{ height: 8, width: '60%', borderRadius: 5, background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out infinite' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Search results grid ───────────────────────────────────── */}
        {!searchLoading && searchQuery && searchResults.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC', marginBottom: 14 }}>Results for "{searchQuery}"</div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
              {searchResults.map((v, i) => (
              <a key={i} href={v.url || v.creatorProfileUrl || `https://www.tiktok.com/search?q=${encodeURIComponent(v.title || v.product_mentioned || '')}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'block', background: '#0d0d10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden', textDecoration: 'none', transition: 'box-shadow 0.15s' }}>
                {v.thumbnail && <img src={v.thumbnail} alt="" style={{ width: '100%', height: 140, objectFit: 'cover' as const }} onError={e => ((e.target as HTMLImageElement).style.display = 'none')} />}
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 500, lineHeight: 1.4, marginBottom: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{v.title}</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' as const }}>
                    <span style={{ fontSize: 11, color: '#d4af37', fontWeight: 600 }}>▶ {(v.playCount ?? 0) >= 1000000 ? `${((v.playCount ?? 0)/1000000).toFixed(1)}M` : (v.playCount ?? 0) >= 1000 ? `${((v.playCount ?? 0)/1000).toFixed(0)}K` : v.playCount ?? 0}</span>
                    <span style={{ fontSize: 10, color: '#9CA3AF' }}>{v.creator || v.creatorHandle}</span>
                  </div>
                </div>
              </a>
            ))}
            </div>
          </div>
        )}

        {/* ── Default feed hidden when search active ─────────────── */}
        {!searchQuery && (
        <>

        {/* ── Niche pills ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: 18 }}>
          <button onClick={() => setSelectedNiche('')}
            style={{ height: 30, padding: '0 14px', background: selectedNiche === '' ? '#0A0A0A' : 'white', color: selectedNiche === '' ? 'white' : '#374151', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
            All ({allVideos.length})
          </button>
          {NICHES.map(n => {
            const count = allVideos.filter(v => v.niche?.toLowerCase() === n).length;
            return (
              <button key={n} onClick={() => setSelectedNiche(selectedNiche === n ? '' : n)}
                style={{ height: 30, padding: '0 14px', background: selectedNiche === n ? '#d4af37' : 'white', color: selectedNiche === n ? 'white' : count === 0 ? '#D1D5DB' : '#374151', border: `1px solid ${selectedNiche === n ? '#d4af37' : '#E5E7EB'}`, borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' as const }}>
                {n} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>

        {/* ── Format breakdown ────────────────────────────────────── */}
        {videos.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' as const }}>
            {Object.entries(FORMAT_META).map(([fmt, meta]) => {
              const count = formatCounts[fmt] || 0;
              const pct = videos.length > 0 ? Math.round(count / videos.length * 100) : 0;
              return (
                <div key={fmt} style={{ display: 'flex', alignItems: 'center', gap: 7, background: count > 0 ? meta.bg : '#F9FAFB', border: `1px solid ${count > 0 ? 'transparent' : '#E5E7EB'}`, borderRadius: 8, padding: '6px 12px', opacity: count === 0 ? 0.4 : 1 }}>
                  <span style={{ fontSize: 15 }}>{meta.emoji}</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: meta.color }}>{fmt}</div>
                    <div style={{ fontSize: 10, color: '#9CA3AF' }}>{count} videos · {pct}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Main 3-col grid ─────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px 300px', gap: 16, alignItems: 'start' }}>

          {/* ── LEFT: Video cards ─────────────────────────────────── */}
          <div>
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, height: 140, animation: 'pulse 1.5s infinite' }} />
                ))}
              </div>
            ) : videos.length === 0 ? (
              <div style={{ textAlign: 'center' as const, padding: '60px 20px', maxWidth: 480, margin: '0 auto' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
                <div style={{ fontFamily: brico, fontWeight: 700, fontSize: 20, color: '#F8FAFC', marginBottom: 8 }}>
                  {selectedNiche ? `No videos for "${selectedNiche}" yet` : 'No videos loaded yet'}
                </div>
                <div style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.6, marginBottom: 24 }}>
                  {selectedNiche
                    ? 'Try a different niche or click All to see all videos'
                    : <>Click <strong>Scrape Now</strong> to pull the latest TikTok product videos from our data pipeline. Takes ~20 seconds.</>}
                </div>
                {selectedNiche ? (
                  <button onClick={() => setSelectedNiche('')}
                    style={{ height: 44, padding: '0 28px', background: '#d4af37', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                    Show all videos
                  </button>
                ) : (
                  <button onClick={triggerRefresh} disabled={refreshing}
                    style={{ height: 44, padding: '0 28px', background: '#d4af37', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                    🔄 Scrape Now
                  </button>
                )}
                {!selectedNiche && (
                  <div style={{ marginTop: 16, fontSize: 12, color: '#9CA3AF' }}>
                    Or use the search bar above to find product videos instantly
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {videos.map((v, i) => {
                  const fmt = FORMAT_META[v.format] || FORMAT_META.LIFESTYLE;
                  const sig = SIGNAL_META[v.engagement_signal] || SIGNAL_META.MEDIUM;
                  return (
                    <div key={v.id || i}
                      style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden', transition: 'box-shadow 150ms', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px #E5E7EB')}
                      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>

                      {/* Thumbnail */}
                      {v.thumbnail ? (
                        <div style={{ aspectRatio: '16/9', overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
                          <img src={v.thumbnail} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                      ) : (
                        <div style={{ height: 6, background: `linear-gradient(90deg, ${fmt.color}33, ${fmt.color}11)` }} />
                      )}

                      <div style={{ padding: '14px 16px' }}>
                        {/* Format + signal row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: fmt.color, background: fmt.bg, padding: '2px 8px', borderRadius: 20 }}>
                            {fmt.emoji} {v.format}
                          </span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: sig.color, background: sig.bg, padding: '2px 8px', borderRadius: 20 }}>
                            {sig.label}
                          </span>
                        </div>

                        {/* Product name */}
                        <div style={{ fontFamily: brico, fontWeight: 700, fontSize: 13, color: '#F8FAFC', marginBottom: 5, lineHeight: 1.3 }}>
                          {v.product_mentioned || 'Unknown Product'}
                        </div>

                        {/* Hook text */}
                        {v.hook_text && (
                          <div style={{ fontSize: 11, color: '#94A3B8', fontStyle: 'italic', lineHeight: 1.5, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                            "{v.hook_text}"
                          </div>
                        )}

                        {/* Stats row */}
                        {(v.playCount || v.likes) && (
                          <div style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 10, color: '#9CA3AF' }}>
                            {v.playCount ? <span>{'▶'} {v.playCount >= 1_000_000 ? `${(v.playCount/1_000_000).toFixed(1)}M` : v.playCount >= 1_000 ? `${(v.playCount/1_000).toFixed(0)}K` : v.playCount}</span> : null}
                            {v.likes ? <span>{'♥'} {v.likes >= 1_000_000 ? `${(v.likes/1_000_000).toFixed(1)}M` : v.likes >= 1_000 ? `${(v.likes/1_000).toFixed(0)}K` : v.likes}</span> : null}
                            {v.comments ? <span>{'💬'} {v.comments >= 1_000 ? `${(v.comments/1_000).toFixed(0)}K` : v.comments}</span> : null}
                          </div>
                        )}

                        {/* Footer */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <span style={{ fontSize: 9, color: '#9CA3AF', background: 'rgba(255,255,255,0.04)', padding: '1px 6px', borderRadius: 8, textTransform: 'capitalize' as const }}>{v.niche}</span>
                            {v.creatorHandle && <span style={{ fontSize: 9, color: '#d4af37', background: 'rgba(212,175,55,0.08)', padding: '1px 6px', borderRadius: 8 }}>@{v.creatorHandle}</span>}
                          </div>
                          <a href={v.url || `https://www.tiktok.com/search?q=${encodeURIComponent(v.title || v.product_mentioned || '')}`} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: 11, color: '#d4af37', fontWeight: 700, textDecoration: 'none' }}
                            onClick={e => e.stopPropagation()}>
                            {v.url ? 'Watch Video \u2192' : 'Search TikTok \u2192'}
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── MIDDLE: Hook Library ──────────────────────────────── */}
          <div style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6' }}>
              <div style={{ fontFamily: brico, fontWeight: 700, fontSize: 13, color: '#F8FAFC' }}>🎣 Hook Library</div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Top opening lines that convert</div>
            </div>
            {hooks.length === 0 ? (
              <div style={{ padding: '30px 16px', textAlign: 'center' as const, color: '#9CA3AF', fontSize: 12 }}>
                Hooks appear as videos are loaded
              </div>
            ) : (
              <div style={{ maxHeight: 520, overflowY: 'auto' as const }}>
                {hooks.map((v, i) => (
                  <div key={i} style={{ padding: '10px 14px', borderBottom: '1px solid #F9FAFB' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#9CA3AF', minWidth: 18, marginTop: 2 }}>#{i+1}</span>
                      <div style={{ flex: 1, fontSize: 12, color: '#CBD5E1', lineHeight: 1.5, fontStyle: 'italic' }}>
                        "{v.hook_text}"
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 26 }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <span style={{ fontSize: 9, color: (FORMAT_META[v.format] || FORMAT_META.LIFESTYLE).color, background: (FORMAT_META[v.format] || FORMAT_META.LIFESTYLE).bg, padding: '1px 6px', borderRadius: 8, fontWeight: 600 }}>{v.format}</span>
                        <span style={{ fontSize: 9, color: '#9CA3AF', background: 'rgba(255,255,255,0.04)', padding: '1px 6px', borderRadius: 8, textTransform: 'capitalize' as const }}>{v.niche}</span>
                      </div>
                      <button onClick={() => copyText(v.hook_text!, `hook-${i}`)}
                        style={{ fontSize: 10, fontWeight: 700, color: copied === `hook-${i}` ? '#059669' : '#d4af37', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        {copied === `hook-${i}` ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: AI Generator ───────────────────────────────── */}
          <div style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6' }}>
              <div style={{ fontFamily: brico, fontWeight: 700, fontSize: 13, color: '#F8FAFC' }}>🤖 AI Content Generator</div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Scripts, hooks & livestream outlines</div>
            </div>
            <div style={{ padding: 14 }}>
              {/* Tabs */}
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 3, marginBottom: 12 }}>
                {(['hooks', 'script', 'live'] as const).map(t => (
                  <button key={t} onClick={() => setAiTab(t)}
                    style={{ flex: 1, height: 28, background: aiTab === t ? 'white' : 'transparent', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, color: aiTab === t ? '#0A0A0A' : '#9CA3AF', cursor: 'pointer', boxShadow: aiTab === t ? '0 1px 4px #E5E7EB' : 'none', transition: 'all 150ms', textTransform: 'capitalize' as const }}>
                    {t === 'live' ? '📡 Live' : t === 'script' ? '🎬 Script' : '🎣 Hooks'}
                  </button>
                ))}
              </div>

              {/* Product input */}
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: 4 }}>PRODUCT NAME</label>
                <input value={aiProduct} onChange={e => setAiProduct(e.target.value)}
                  placeholder={`e.g. ${selectedNiche === 'beauty' ? 'LED Face Mask' : selectedNiche === 'fitness' ? 'Resistance Bands' : 'viral product'}`}
                  style={{ width: '100%', height: 34, padding: '0 10px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, fontSize: 12, background: '#05070F', boxSizing: 'border-box' as const, color: '#F8FAFC' }} />
              </div>

              {/* Context note */}
              <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '6px 8px' }}>
                {aiTab === 'hooks' && '3 opening lines proven to stop the scroll in the first 3 seconds'}
                {aiTab === 'script' && '60-second script with hook → demo → CTA structure'}
                {aiTab === 'live' && 'Livestream outline with opening hook, demo points, urgency + CTA'}
              </div>

              <button onClick={generateContent} disabled={aiLoading}
                style={{ width: '100%', height: 38, background: aiLoading ? '#9CA3AF' : 'linear-gradient(135deg, #d4af37, #d4af37)', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: aiLoading ? 'not-allowed' : 'pointer', marginBottom: aiOutput ? 10 : 0 }}>
                {aiLoading ? '✍️ Writing…' : `Generate ${aiTab === 'hooks' ? '3 Hooks' : aiTab === 'script' ? '60s Script' : 'Live Outline'}`}
              </button>

              {aiOutput && (
                <div style={{ background: '#F8F8FF', border: '1px solid #E0E7FF', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 11, color: '#CBD5E1', lineHeight: 1.7, whiteSpace: 'pre-wrap' as const, maxHeight: 280, overflowY: 'auto' as const }}>{aiOutput}</div>
                  <button onClick={() => copyText(aiOutput, 'ai-out')}
                    style={{ marginTop: 8, fontSize: 10, color: copied === 'ai-out' ? '#059669' : '#d4af37', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, padding: 0 }}>
                    {copied === 'ai-out' ? '✓ Copied!' : 'Copy all →'}
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </>
        )}{/* end !searchQuery conditional */}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed' as const, bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#0A0A0A', color: 'white', padding: '10px 20px', borderRadius: 100, fontSize: 12, fontWeight: 500, zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', whiteSpace: 'nowrap' as const }}>
          {toast}
        </div>
      )}
    </div>
  );
}
