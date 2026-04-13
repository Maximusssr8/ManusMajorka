import { useState, useEffect, useCallback } from 'react';
import { Library, Sparkles, Eye, Zap, Search, TrendingUp, Globe, Loader2 } from 'lucide-react';

/**
 * Ad Library — curated winning ad examples organized by niche.
 * Surfaces proven ad frameworks with real hook lines and engagement data.
 * Now includes Meta Ad Library search (via Tavily) and trending ads section.
 * "Use this angle" prefills AdsStudio via sessionStorage.
 */

type Niche = 'Kitchen' | 'Beauty' | 'Pet' | 'Tech' | 'Fitness';

interface WinningAd {
  id: string;
  niche: Niche;
  hook: string;
  body: string;
  platform: 'TikTok' | 'Meta' | 'YouTube';
  engagement: string;
  angle: string;
}

interface MetaAd {
  id: string;
  pageId: string;
  pageName: string;
  adText: string;
  startDate: string;
  platform: string;
  imageUrl?: string;
  category?: string;
  country: string;
}

interface TrendingResult {
  pageName: string;
  hook: string;
  url: string;
  snippet: string;
}

const NICHE_COLORS: Record<Niche, { bg: string; text: string }> = {
  Kitchen: { bg: 'rgba(16,185,129,0.12)', text: '#10b981' },
  Beauty:  { bg: 'rgba(236,72,153,0.12)', text: '#ec4899' },
  Pet:     { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b' },
  Tech:    { bg: 'rgba(59,130,246,0.12)', text: '#3B82F6' },
  Fitness: { bg: 'rgba(212,175,55,0.12)', text: '#d4af37' },
};

const WINNING_ADS: WinningAd[] = [
  { id: 'a1',  niche: 'Kitchen', hook: '"I stopped buying takeaway after I found this"', body: 'Quick meal prep gadget demo showing 3 meals in 10 mins. Before/after fridge shots. Cost breakdown overlay.', platform: 'TikTok', engagement: '2.4M views', angle: 'Cost savings transformation' },
  { id: 'a2',  niche: 'Kitchen', hook: '"My wife thought I was crazy for buying this"', body: 'Husband surprises with kitchen gadget. Her genuine reaction sells it. Product link in bio.', platform: 'TikTok', engagement: '890K views', angle: 'Relationship reaction hook' },
  { id: 'a3',  niche: 'Kitchen', hook: '"The kitchen gadget TikTok made me buy"', body: 'Honest review format. Shows 3 use cases, admits one flaw, strong recommend at end.', platform: 'TikTok', engagement: '1.1M views', angle: 'Honest review with flaw admission' },
  { id: 'a4',  niche: 'Kitchen', hook: '"POV: You just discovered the laziest way to cook"', body: 'Satisfying cooking montage with ASMR audio. Minimal text overlays. Clean plating reveal.', platform: 'TikTok', engagement: '3.2M views', angle: 'ASMR satisfying process' },
  { id: 'a5',  niche: 'Beauty',  hook: '"My dermatologist asked what I changed"', body: 'Skin transformation timeline — day 1, week 1, month 1. Close-up texture shots. No filter disclaimer.', platform: 'TikTok', engagement: '4.1M views', angle: 'Authority validation + timeline' },
  { id: 'a6',  niche: 'Beauty',  hook: '"I replaced my $200 routine with ONE product"', body: 'Side-by-side cost comparison. Shows full old routine then single product. Morning application demo.', platform: 'Meta', engagement: '1.8M reach', angle: 'Cost consolidation' },
  { id: 'a7',  niche: 'Beauty',  hook: '"The 30-second routine that changed my skin"', body: 'Speed demo with timer overlay. Before/after split screen. Ingredient callouts.', platform: 'TikTok', engagement: '2.7M views', angle: 'Angle: Time-saving simplicity' },
  { id: 'a8',  niche: 'Beauty',  hook: '"Why every makeup artist has this in their kit"', body: 'Behind-the-scenes at a photoshoot. Pro artist casually uses product. Subtle endorsement.', platform: 'YouTube', engagement: '560K views', angle: 'Professional insider secret' },
  { id: 'a9',  niche: 'Pet',     hook: '"My dog has never been this calm"', body: 'Anxious dog before vs. calm dog after using product. Vet quote overlay. Owner testimonial.', platform: 'TikTok', engagement: '5.3M views', angle: 'Problem/solution with proof' },
  { id: 'a10', niche: 'Pet',     hook: '"Every pet owner needs to see this hack"', body: 'Common pet problem everyone relates to. Quick fix demo. Comment section engagement bait.', platform: 'TikTok', engagement: '2.1M views', angle: 'Universal pain point + quick fix' },
  { id: 'a11', niche: 'Pet',     hook: '"I tested 5 pet products so you don\'t have to"', body: 'Comparison format ranking 5 products. Honest scoring. Clear winner reveal at the end.', platform: 'TikTok', engagement: '1.4M views', angle: 'Comparison elimination' },
  { id: 'a12', niche: 'Pet',     hook: '"Watch my cat\'s reaction to this"', body: 'Pure reaction content. Cat discovers new toy/gadget. Genuine surprise moment. No voiceover needed.', platform: 'TikTok', engagement: '8.9M views', angle: 'Authentic animal reaction' },
  { id: 'a13', niche: 'Tech',    hook: '"This $30 gadget replaced 4 things on my desk"', body: 'Desk setup tour showing clutter. One product replaces multiple. Clean after shot.', platform: 'TikTok', engagement: '3.6M views', angle: 'Minimalist consolidation' },
  { id: 'a14', niche: 'Tech',    hook: '"Amazon won\'t show you this hidden feature"', body: 'Unboxing with unexpected feature reveal midway. Builds curiosity with slow reveal.', platform: 'TikTok', engagement: '2.2M views', angle: 'Hidden feature discovery' },
  { id: 'a15', niche: 'Tech',    hook: '"I\'ve been using this wrong my entire life"', body: 'Common tech task done the hard way, then the product way. Split screen comparison.', platform: 'Meta', engagement: '1.9M reach', angle: 'Revelation/paradigm shift' },
  { id: 'a16', niche: 'Tech',    hook: '"The gadget my subscribers keep asking about"', body: 'Creator points to desk background item. Full review after audience demand. Social proof built in.', platform: 'YouTube', engagement: '780K views', angle: 'Audience-requested review' },
  { id: 'a17', niche: 'Fitness', hook: '"I got visible results in 14 days with this"', body: 'Day 1 vs day 14 comparison. Daily usage montage. Measurements overlay for credibility.', platform: 'TikTok', engagement: '6.2M views', angle: 'Short timeline transformation' },
  { id: 'a18', niche: 'Fitness', hook: '"My PT said I don\'t need the gym anymore"', body: 'Home workout demo with product. Trainer quote adds authority. Full routine breakdown.', platform: 'TikTok', engagement: '1.5M views', angle: 'Expert dismissal of expensive alternative' },
  { id: 'a19', niche: 'Fitness', hook: '"The recovery tool pro athletes won\'t tell you about"', body: 'Sports footage intercut with product usage. Price comparison to pro equipment.', platform: 'Meta', engagement: '2.8M reach', angle: 'Pro secret at consumer price' },
  { id: 'a20', niche: 'Fitness', hook: '"I stopped going to the physio after buying this"', body: 'Pain point demonstration. Self-treatment with product. Cost savings calculation.', platform: 'TikTok', engagement: '4.4M views', angle: 'Self-sufficiency cost savings' },
];

const ALL_NICHES: Niche[] = ['Kitchen', 'Beauty', 'Pet', 'Tech', 'Fitness'];

const PLATFORM_ICON_STYLE: Record<string, { color: string }> = {
  TikTok:  { color: '#ededed' },
  Meta:    { color: '#3B82F6' },
  YouTube: { color: '#ef4444' },
  Facebook: { color: '#3B82F6' },
  Instagram: { color: '#ec4899' },
};

function getAuthHeaders(): Record<string, string> {
  try {
    const raw = localStorage.getItem('sb-auth-token')
      ?? localStorage.getItem('supabase.auth.token')
      ?? sessionStorage.getItem('sb-auth-token');
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const token = parsed?.currentSession?.access_token ?? parsed?.access_token ?? parsed;
    if (typeof token === 'string' && token.length > 10) {
      return { Authorization: `Bearer ${token}` };
    }
  } catch { /* ignore */ }
  return {};
}

export default function AdLibrary() {
  const [activeNiche, setActiveNiche] = useState<Niche | 'All'>('All');

  // Meta Ad Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCountry, setSearchCountry] = useState('AU');
  const [searchResults, setSearchResults] = useState<MetaAd[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Trending state
  const [trendingNiche, setTrendingNiche] = useState('kitchen');
  const [trendingResults, setTrendingResults] = useState<TrendingResult[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(false);

  const filtered = activeNiche === 'All'
    ? WINNING_ADS
    : WINNING_ADS.filter((ad) => ad.niche === activeNiche);

  function useAngle(ad: WinningAd) {
    try {
      sessionStorage.setItem('majorka_ad_product', JSON.stringify({
        id: `adlib-${ad.id}`,
        title: ad.hook.replace(/"/g, ''),
        hook: ad.hook,
        angle: ad.angle,
        niche: ad.niche,
      }));
    } catch { /* ignore */ }
    window.location.href = '/app/ads-studio';
  }

  function useMetaAdAngle(ad: MetaAd) {
    try {
      sessionStorage.setItem('majorka_ad_product', JSON.stringify({
        id: `meta-${ad.id}`,
        title: ad.pageName,
        hook: ad.adText.slice(0, 80),
        angle: 'Competitor ad analysis',
        niche: 'General',
      }));
    } catch { /* ignore */ }
    window.location.href = '/app/ads-studio';
  }

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;
    setSearchLoading(true);
    setSearchError('');
    setHasSearched(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery.trim(),
        country: searchCountry,
      });
      const resp = await fetch(`/api/meta-ads/search?${params.toString()}`, {
        headers: { ...getAuthHeaders() },
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({ message: 'Search failed' }));
        setSearchError(body.message ?? 'Search failed');
        setSearchResults([]);
        return;
      }
      const data = await resp.json();
      setSearchResults(data.ads ?? []);
    } catch {
      setSearchError('Network error. Please try again.');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery, searchCountry]);

  const fetchTrending = useCallback(async (niche: string) => {
    setTrendingLoading(true);
    try {
      const params = new URLSearchParams({ niche, country: 'AU' });
      const resp = await fetch(`/api/meta-ads/trending?${params.toString()}`, {
        headers: { ...getAuthHeaders() },
      });
      if (resp.ok) {
        const data = await resp.json();
        setTrendingResults(data.trending ?? []);
      } else {
        setTrendingResults([]);
      }
    } catch {
      setTrendingResults([]);
    } finally {
      setTrendingLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrending(trendingNiche);
  }, [trendingNiche, fetchTrending]);

  const COUNTRY_OPTIONS = [
    { value: 'AU', label: 'Australia' },
    { value: 'US', label: 'United States' },
    { value: 'UK', label: 'United Kingdom' },
    { value: 'CA', label: 'Canada' },
    { value: 'NZ', label: 'New Zealand' },
  ];

  const TRENDING_NICHES = ['kitchen', 'beauty', 'pet', 'tech', 'fitness', 'home', 'outdoor'];

  return (
    <div className="min-h-screen p-8 bg-[#080808] text-[#ededed]">
      {/* Header */}
      <div className="mb-6">
        <div className="text-xs text-[#555555] mb-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          Home / Ad Library
        </div>
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)' }}
          >
            <Library size={16} style={{ color: '#d4af37' }} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
            Ad Library
          </h1>
        </div>
        <p className="text-sm text-[#888888]">See what&apos;s working in your niche</p>
        <p className="text-[10px] text-[#555555] mt-2 uppercase tracking-wider" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          Search competitor ads, discover trends, and analyse winning angles.
        </p>
      </div>

      {/* ═══ Search Competitor Ads ═══ */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Search size={14} style={{ color: '#d4af37' }} />
          <h2 className="text-base font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
            Search competitor ads
          </h2>
        </div>

        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[240px] max-w-[480px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              placeholder="Search ads (e.g. kitchen gadget, yoga mat, LED lamp)"
              className="w-full bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg px-4 py-2.5 text-sm text-[#ededed] placeholder-[#555555] outline-none transition-colors"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.5)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#1a1a1a'; }}
            />
          </div>
          <select
            value={searchCountry}
            onChange={(e) => setSearchCountry(e.target.value)}
            className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg px-3 py-2.5 text-sm text-[#ededed] outline-none"
          >
            {COUNTRY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <button
            onClick={handleSearch}
            disabled={searchLoading || searchQuery.trim().length < 2}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white transition-all disabled:opacity-40"
            style={{ background: '#3B82F6' }}
          >
            {searchLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            Search
          </button>
        </div>

        {/* Search error */}
        {searchError && (
          <p className="text-xs text-red-400 mb-3">{searchError}</p>
        )}

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-2">
            {searchResults.map((ad) => {
              const platStyle = PLATFORM_ICON_STYLE[ad.platform] ?? { color: '#888888' };
              return (
                <div
                  key={ad.id}
                  className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg p-4 flex flex-col gap-2.5 transition-all"
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(212,175,55,0.35)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#1a1a1a'; }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#d4af37] truncate max-w-[70%]">
                      {ad.pageName}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Globe size={10} style={{ color: platStyle.color }} />
                      <span className="text-[10px] text-[#888888]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        {ad.platform}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[#888888] leading-relaxed line-clamp-3">
                    {ad.adText.slice(0, 100)}{ad.adText.length > 100 ? '...' : ''}
                  </p>
                  <div className="flex items-center gap-2 mt-auto pt-1">
                    <span className="text-[10px] text-[#555555]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      {ad.startDate}
                    </span>
                    <span
                      className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6' }}
                    >
                      {ad.country}
                    </span>
                  </div>
                  <button
                    onClick={() => useMetaAdAngle(ad)}
                    className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90"
                    style={{ background: '#3B82F6' }}
                  >
                    <Sparkles size={11} />
                    Analyse this angle
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {hasSearched && !searchLoading && searchResults.length === 0 && !searchError && (
          <p className="text-xs text-[#555555] mb-3" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            No results found. Try a different keyword or country.
          </p>
        )}
      </div>

      {/* ═══ Trending in Your Niche ═══ */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={14} style={{ color: '#d4af37' }} />
          <h2 className="text-base font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
            Trending in your niche
          </h2>
        </div>

        <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-none pb-1">
          {TRENDING_NICHES.map((n) => {
            const active = trendingNiche === n;
            return (
              <button
                key={n}
                onClick={() => setTrendingNiche(n)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap capitalize transition-all"
                style={{
                  background: active ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${active ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.08)'}`,
                  color: active ? '#d4af37' : '#888888',
                }}
              >
                {n}
              </button>
            );
          })}
        </div>

        {trendingLoading && (
          <div className="flex items-center gap-2 text-xs text-[#555555]">
            <Loader2 size={12} className="animate-spin" />
            <span>Loading trending ads...</span>
          </div>
        )}

        {!trendingLoading && trendingResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {trendingResults.map((item, idx) => (
              <div
                key={`${item.url}-${idx}`}
                className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg p-3 flex flex-col gap-2 transition-all"
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(212,175,55,0.25)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#1a1a1a'; }}
              >
                <span className="text-[10px] font-bold text-[#d4af37] truncate">
                  {item.pageName}
                </span>
                <p className="text-xs text-[#ededed] font-medium leading-snug line-clamp-2">
                  {item.hook}
                </p>
                <p className="text-[10px] text-[#555555] leading-relaxed line-clamp-2">
                  {item.snippet}
                </p>
              </div>
            ))}
          </div>
        )}

        {!trendingLoading && trendingResults.length === 0 && (
          <p className="text-xs text-[#555555]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            No trending data available for this niche.
          </p>
        )}
      </div>

      {/* ═══ Curated Ad Library (existing) ═══ */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Library size={14} style={{ color: '#d4af37' }} />
          <h2 className="text-base font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
            Curated winning examples
          </h2>
        </div>

        {/* Niche filter */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-none pb-1">
          {(['All', ...ALL_NICHES] as const).map((n) => {
            const active = activeNiche === n;
            return (
              <button
                key={n}
                onClick={() => setActiveNiche(n as Niche | 'All')}
                className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all"
                style={{
                  background: active ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${active ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.08)'}`,
                  color: active ? '#d4af37' : '#888888',
                }}
              >
                {n}
              </button>
            );
          })}
          <span className="text-[10px] text-[#555555] ml-2 tabular-nums" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            {filtered.length} examples
          </span>
        </div>
      </div>

      {/* Ad cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((ad) => {
          const nicheStyle = NICHE_COLORS[ad.niche];
          const platformStyle = PLATFORM_ICON_STYLE[ad.platform];
          return (
            <div
              key={ad.id}
              className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg p-5 flex flex-col gap-3 transition-all group"
              style={{ borderColor: undefined }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(212,175,55,0.35)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#1a1a1a'; }}
            >
              {/* Top row: niche + platform */}
              <div className="flex items-center justify-between">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                  style={{ background: nicheStyle.bg, color: nicheStyle.text }}
                >
                  {ad.niche}
                </span>
                <div className="flex items-center gap-1.5">
                  <Eye size={11} style={{ color: platformStyle.color }} />
                  <span className="text-[10px] text-[#888888]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {ad.platform}
                  </span>
                </div>
              </div>

              {/* Hook line */}
              <p className="text-sm font-bold text-[#ededed] leading-snug">
                {ad.hook}
              </p>

              {/* Body preview */}
              <p className="text-xs text-[#888888] leading-relaxed line-clamp-3">
                {ad.body}
              </p>

              {/* Engagement + angle */}
              <div className="flex items-center gap-2 mt-auto pt-1">
                <span className="flex items-center gap-1 text-[10px] font-mono tabular-nums" style={{ color: '#d4af37', fontFamily: 'JetBrains Mono, monospace' }}>
                  <Zap size={10} />
                  {ad.engagement}
                </span>
              </div>
              <div className="text-[10px] text-[#555555] uppercase tracking-wider" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                Angle: {ad.angle}
              </div>

              {/* CTA */}
              <button
                onClick={() => useAngle(ad)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90"
                style={{ background: '#3B82F6' }}
              >
                <Sparkles size={12} />
                Use this angle
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
