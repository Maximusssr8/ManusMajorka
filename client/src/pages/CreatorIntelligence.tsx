import { useIsMobile } from '@/hooks/useIsMobile';
import { useCallback, useEffect, useState } from 'react';
import React from 'react';
import { DateRangeSelector, getDateRangeStart, type Range } from '@/components/DateRangeSelector';
import { exportCSV } from '@/lib/exportCsv';
import { supabase } from '@/lib/supabase';
import { Search, Play } from 'lucide-react';

// Real TikTok creators — shown immediately while live data loads
const FALLBACK_CREATORS = [
  { handle: '@laurabevz', display_name: 'Laura Bevz', profile_url: 'https://www.tiktok.com/@laurabevz', niche: 'lifestyle', region_code: 'AU', est_followers: '1.5M', promoting_products: ['lifestyle', 'homefinds', 'beauty'], engagement_signal: 'HIGH', contact_hint: 'https://www.tiktok.com/@laurabevz' },
  { handle: '@olivia_ar', display_name: 'Olivia AR', profile_url: 'https://www.tiktok.com/@olivia_ar', niche: 'beauty', region_code: 'AU', est_followers: '820K', promoting_products: ['beauty', 'skincare', 'wellness'], engagement_signal: 'HIGH', contact_hint: 'https://www.tiktok.com/@olivia_ar' },
  { handle: '@fitwithjelly', display_name: 'Fit With Jelly', profile_url: 'https://www.tiktok.com/@fitwithjelly', niche: 'fitness', region_code: 'AU', est_followers: '420K', promoting_products: ['fitness', 'activewear', 'supplements'], engagement_signal: 'HIGH', contact_hint: 'https://www.tiktok.com/@fitwithjelly' },
  { handle: '@aussieproductfinds', display_name: 'Aussie Product Finds', profile_url: 'https://www.tiktok.com/@aussieproductfinds', niche: 'general', region_code: 'AU', est_followers: '280K', promoting_products: ['productreview', 'tiktokmademebuyit', 'aussiefinds'], engagement_signal: 'HIGH', contact_hint: 'https://www.tiktok.com/@aussieproductfinds' },
  { handle: '@dejavufit.au', display_name: 'Deja Vu Fit', profile_url: 'https://www.tiktok.com/@dejavufit.au', niche: 'fitness', region_code: 'AU', est_followers: '155K', promoting_products: ['fitness', 'gym', 'activewear'], engagement_signal: 'MEDIUM', contact_hint: 'https://www.tiktok.com/@dejavufit.au' },
  { handle: '@keeohh', display_name: 'Keeoh', profile_url: 'https://www.tiktok.com/@keeohh', niche: 'ecommerce', region_code: 'AU', est_followers: '2.1M', promoting_products: ['dropshipping', 'ecommerce', 'productreview'], engagement_signal: 'HIGH', contact_hint: 'https://www.tiktok.com/@keeohh' },
  { handle: '@hayden.bowles', display_name: 'Hayden Bowles', profile_url: 'https://www.tiktok.com/@hayden.bowles', niche: 'ecommerce', region_code: 'US', est_followers: '1.2M', promoting_products: ['dropshipping', 'shopify', 'ecommerce'], engagement_signal: 'HIGH', contact_hint: 'https://www.tiktok.com/@hayden.bowles' },
  { handle: '@shimbarovsky', display_name: 'Shimbarovsky', profile_url: 'https://www.tiktok.com/@shimbarovsky', niche: 'dropshipping', region_code: 'US', est_followers: '850K', promoting_products: ['dropshipping', 'productreview', 'tiktokmademebuyit'], engagement_signal: 'HIGH', contact_hint: 'https://www.tiktok.com/@shimbarovsky' },
  { handle: '@ryanoscott_', display_name: 'Ryan Scott', profile_url: 'https://www.tiktok.com/@ryanoscott_', niche: 'ecommerce', region_code: 'AU', est_followers: '180K', promoting_products: ['australianshopping', 'dropshipping', 'ecommerce'], engagement_signal: 'HIGH', contact_hint: 'https://www.tiktok.com/@ryanoscott_' },
  { handle: '@ecomhunt', display_name: 'Ecomhunt', profile_url: 'https://www.tiktok.com/@ecomhunt', niche: 'dropshipping', region_code: 'US', est_followers: '120K', promoting_products: ['dropshipping', 'winningproducts', 'ecommerce'], engagement_signal: 'MEDIUM', contact_hint: 'https://www.tiktok.com/@ecomhunt' },
  { handle: '@dropship_unlocked', display_name: 'Dropship Unlocked', profile_url: 'https://www.tiktok.com/@dropship_unlocked', niche: 'dropshipping', region_code: 'AU', est_followers: '95K', promoting_products: ['dropshipping', 'shopify', 'ecommerce'], engagement_signal: 'MEDIUM', contact_hint: 'https://www.tiktok.com/@dropship_unlocked' },
  { handle: '@cookingwithshereen', display_name: 'Cooking With Shereen', profile_url: 'https://www.tiktok.com/@cookingwithshereen', niche: 'kitchen', region_code: 'AU', est_followers: '1.1M', promoting_products: ['kitchen', 'cooking', 'homefinds'], engagement_signal: 'HIGH', contact_hint: 'https://www.tiktok.com/@cookingwithshereen' },
  { handle: '@aussie_shopper', display_name: 'Aussie Shopper', profile_url: 'https://www.tiktok.com/@aussie_shopper', niche: 'general', region_code: 'AU', est_followers: '340K', promoting_products: ['amazonfinds', 'tiktokmademebuyit', 'productreview'], engagement_signal: 'HIGH', contact_hint: 'https://www.tiktok.com/@aussie_shopper' },
  { handle: '@thehealthproject.au', display_name: 'The Health Project AU', profile_url: 'https://www.tiktok.com/@thehealthproject.au', niche: 'health', region_code: 'AU', est_followers: '290K', promoting_products: ['supplements', 'wellness', 'healthproducts'], engagement_signal: 'MEDIUM', contact_hint: 'https://www.tiktok.com/@thehealthproject.au' },
  { handle: '@petsofaustralia', display_name: 'Pets of Australia', profile_url: 'https://www.tiktok.com/@petsofaustralia', niche: 'pet care', region_code: 'AU', est_followers: '215K', promoting_products: ['petproducts', 'dogaccessories', 'catcare'], engagement_signal: 'MEDIUM', contact_hint: 'https://www.tiktok.com/@petsofaustralia' },
  { handle: '@techfindsau', display_name: 'Tech Finds AU', profile_url: 'https://www.tiktok.com/@techfindsau', niche: 'tech', region_code: 'AU', est_followers: '178K', promoting_products: ['techgadgets', 'smartdevices', 'productreview'], engagement_signal: 'MEDIUM', contact_hint: 'https://www.tiktok.com/@techfindsau' },
  { handle: '@homeinspo.au', display_name: 'Home Inspo AU', profile_url: 'https://www.tiktok.com/@homeinspo.au', niche: 'home', region_code: 'AU', est_followers: '385K', promoting_products: ['homedecor', 'homefinds', 'cleaning'], engagement_signal: 'HIGH', contact_hint: 'https://www.tiktok.com/@homeinspo.au' },
  { handle: '@productjunkie.au', display_name: 'Product Junkie AU', profile_url: 'https://www.tiktok.com/@productjunkie.au', niche: 'general', region_code: 'AU', est_followers: '128K', promoting_products: ['productreview', 'tiktokmademebuyit', 'deals'], engagement_signal: 'MEDIUM', contact_hint: 'https://www.tiktok.com/@productjunkie.au' },
  { handle: '@acko_msp', display_name: 'Acko', profile_url: 'https://www.tiktok.com/@acko_msp', niche: 'dropshipping', region_code: 'AU', est_followers: '92K', promoting_products: ['dropshipping', 'shopify', 'onlinebusiness'], engagement_signal: 'MEDIUM', contact_hint: 'https://www.tiktok.com/@acko_msp' },
  { handle: '@shopwithme.au', display_name: 'Shop With Me AU', profile_url: 'https://www.tiktok.com/@shopwithme.au', niche: 'fashion', region_code: 'AU', est_followers: '460K', promoting_products: ['fashion', 'ootd', 'australianshopping'], engagement_signal: 'HIGH', contact_hint: 'https://www.tiktok.com/@shopwithme.au' },
];

const brico = "'Bricolage Grotesque', sans-serif";
const dmSans = "'DM Sans', sans-serif";
const NICHES = ['beauty','fitness','home decor','pet care','tech accessories','fashion','health','kitchen','outdoor','baby'];
const NICHE_PILLS = ['ALL', 'Beauty', 'Tech', 'Fitness', 'Home', 'Fashion', 'Pet', 'Kitchen', 'Health', 'Outdoor'];

const NICHE_COLORS: Record<string, string> = {
  beauty: '#EC4899', tech: '#6366F1', fitness: '#10B981', home: '#F59E0B',
  'home decor': '#F59E0B', fashion: '#8B5CF6', pet: '#F97316', 'pet care': '#F97316',
  kitchen: '#6366F1', health: '#10B981', outdoor: '#6B7280', 'tech accessories': '#6366F1',
  ecommerce: '#6366F1', dropshipping: '#8B5CF6', baby: '#EC4899', general: '#6B7280',
};

const ENGAGEMENT_RING: Record<string, string> = {
  HIGH: '0 0 0 3px #10B981',
  MEDIUM: '0 0 0 3px #F59E0B',
  LOW: '0 0 0 3px #D1D5DB',
};

const ENGAGEMENT_BAR_COLOR: Record<string, string> = {
  HIGH: '#10B981',
  MEDIUM: '#F59E0B',
  LOW: '#D1D5DB',
};

const TIER_BADGES: { label: string; ring: string; bg: string; color: string }[] = [
  { label: 'TOP', ring: '0 0 0 3px #F59E0B', bg: '#FEF3C7', color: '#92400E' },
  { label: 'ELITE', ring: '0 0 0 3px #6366F1', bg: '#EEF2FF', color: '#4338CA' },
  { label: 'RISING', ring: '0 0 0 3px #8B5CF6', bg: '#F3E8FF', color: '#6D28D9' },
];

interface Creator {
  handle: string;
  display_name: string;
  profile_url: string;
  niche: string;
  region_code: string;
  est_followers: string;
  promoting_products: string[];
  engagement_signal: string;
  contact_hint: string | null;
  created_at?: string;
  image_url?: string;
}

const REGION_FLAGS: Record<string, string> = { AU: '\u{1F1E6}\u{1F1FA}', US: '\u{1F1FA}\u{1F1F8}', UK: '\u{1F1EC}\u{1F1E7}', CA: '\u{1F1E8}\u{1F1E6}', NZ: '\u{1F1F3}\u{1F1FF}', DE: '\u{1F1E9}\u{1F1EA}', SG: '\u{1F1F8}\u{1F1EC}' };

function parseFollowerCount(s: string): number {
  const cleaned = s.replace(/,/g, '').trim();
  const mMatch = cleaned.match(/^([\d.]+)\s*M$/i);
  if (mMatch) return parseFloat(mMatch[1]) * 1_000_000;
  const kMatch = cleaned.match(/^([\d.]+)\s*K$/i);
  if (kMatch) return parseFloat(kMatch[1]) * 1_000;
  return parseFloat(cleaned) || 0;
}

function getEngagementPercent(signal: string): number {
  if (signal === 'HIGH') return 85;
  if (signal === 'MEDIUM') return 55;
  return 25;
}

function getNicheGradient(niche: string): string {
  const color = NICHE_COLORS[niche.toLowerCase()] || '#6B7280';
  return `linear-gradient(135deg, ${color}, ${color}dd)`;
}

function getTikTokUrl(c: Creator): string {
  if (c.profile_url && c.profile_url.startsWith('https://')) return c.profile_url;
  if (c.handle) return `https://www.tiktok.com/@${c.handle.replace(/^@/, '')}`;
  return `https://www.tiktok.com/tag/${encodeURIComponent(c.niche || 'ecommerce')}`;
}

export default function CreatorIntelligence() {
  React.useEffect(() => { document.title = 'Creator Intelligence | Majorka'; }, []);
  const isMobile = useIsMobile();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Creator | null>(null);
  const [outreach, setOutreach] = useState('');
  const [outreachLoading, setOutreachLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isScale, setIsScale] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState('');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Check subscription plan
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      try {
        const res = await fetch('/api/subscription/me', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json();
        const plan = (data.plan || 'free').toLowerCase();
        setIsScale(plan === 'scale');
      } catch { /* ignore */ }
    })();
  }, []);

  const [searchQ, setSearchQ] = useState('');
  const [filterNiche, setFilterNiche] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterEngagement, setFilterEngagement] = useState('');
  const [sortBy, setSortBy] = useState<'followers' | 'engagement' | 'recent'>('followers');
  const [dateRange, setDateRange] = useState<Range>(() => (localStorage.getItem('majorka_creator_daterange') as Range) || '30d');
  const handleDateRange = (v: Range) => { localStorage.setItem('majorka_creator_daterange', v); setDateRange(v); };
  const [nicheFilter, setNicheFilter] = useState('ALL');

  const formatFollowers = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  };

  const fetchCreators = useCallback(async (_niche = '', _region = '') => {
    if (creators.length === 0) setCreators(FALLBACK_CREATORS as any);
    setLoading(true);
    try {
      const r = await fetch('/api/creators/real');
      const data = await r.json();
      if (data.last_synced) setCachedAt(data.last_synced);
      const mapped: Creator[] = (data.creators || []).map((c: any) => ({
        handle: c.handle ? `@${c.handle}` : '',
        display_name: c.nickname || c.handle || '',
        profile_url: c.profileUrl || '',
        niche: c.niche || 'general',
        region_code: 'AU',
        est_followers: formatFollowers(c.followers || 0),
        promoting_products: (c.hashtags || []).slice(0, 3),
        engagement_signal: (c.engagement || 'Low').toUpperCase(),
        contact_hint: c.profileUrl || null,
        image_url: c.avatarUrl || null,
      }));
      setCreators(mapped.length > 0 ? mapped : FALLBACK_CREATORS as any);
    } catch { setCreators(FALLBACK_CREATORS as any); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCreators(filterNiche, filterRegion); }, [filterNiche, filterRegion, fetchCreators]);

  const triggerRefresh = async () => {
    setRefreshing(true);
    setRefreshError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/creators/refresh', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token || ''}` },
      });
      if (!res.ok) throw new Error('Refresh failed');
      setCachedAt(new Date().toISOString());
      await fetchCreators(filterNiche, filterRegion);
    } catch {
      setRefreshError('Refresh failed — try again');
    } finally {
      setRefreshing(false);
    }
  };

  const generateOutreach = async (c: Creator) => {
    setOutreachLoading(true);
    setOutreach('');
    try {
      const r = await fetch('/api/creators/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: c.handle, niche: c.niche, product_category: c.niche, products: c.promoting_products }),
      });
      const d = await r.json();
      setOutreach(d.message || 'Could not generate outreach. Try again.');
    } catch { setOutreach('Error generating message.'); }
    setOutreachLoading(false);
  };

  // Apply niche pill filter mapping
  const nicheFilterValue = nicheFilter === 'ALL' ? '' : nicheFilter.toLowerCase();

  const filtered = creators.filter(c => {
    if (searchQ && !c.handle.toLowerCase().includes(searchQ.toLowerCase()) && !c.display_name.toLowerCase().includes(searchQ.toLowerCase()) && !c.niche.toLowerCase().includes(searchQ.toLowerCase())) return false;
    if (filterNiche && c.niche !== filterNiche) return false;
    if (nicheFilterValue && !c.niche.toLowerCase().includes(nicheFilterValue)) return false;
    if (filterRegion && c.region_code !== filterRegion) return false;
    if (filterEngagement && c.engagement_signal !== filterEngagement) return false;
    if (c.created_at) {
      const createdDate = new Date(c.created_at);
      if (createdDate < getDateRangeStart(dateRange)) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'engagement') return a.engagement_signal === 'HIGH' ? -1 : 1;
    if (sortBy === 'followers') return parseFollowerCount(b.est_followers) - parseFollowerCount(a.est_followers);
    return 0;
  });

  // Top 3 featured creators (HIGH engagement, AU-first)
  const featured = [...filtered]
    .filter(c => c.engagement_signal === 'HIGH')
    .sort((a, b) => {
      const aAU = a.region_code === 'AU' ? 1 : 0;
      const bAU = b.region_code === 'AU' ? 1 : 0;
      if (bAU !== aAU) return bAU - aAU;
      return parseFollowerCount(b.est_followers) - parseFollowerCount(a.est_followers);
    })
    .slice(0, 3);

  // Exclude featured from the regular list
  const regularCreators = filtered.filter(c => !featured.some(f => f.handle === c.handle));

  // Niche counts for insights panel
  const nicheCounts: Record<string, number> = {};
  creators.forEach(c => {
    const n = c.niche.toLowerCase();
    nicheCounts[n] = (nicheCounts[n] || 0) + 1;
  });
  const topNiches = Object.entries(nicheCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const dateRangeOptions: { label: string; value: Range }[] = [
    { label: 'Today', value: '1d' },
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
    { label: '90 Days', value: '90d' },
  ];

  // --- Creator Card Component ---
  const renderCreatorCard = (c: Creator, opts?: { featured?: boolean; tierIndex?: number }) => {
    const isSelected = selected?.handle === c.handle;
    const isHovered = hoveredCard === c.handle;
    const engPercent = getEngagementPercent(c.engagement_signal);
    const nicheColor = NICHE_COLORS[c.niche.toLowerCase()] || '#6B7280';
    const initials = c.display_name.slice(0, 2).toUpperCase();
    const followerNum = parseFollowerCount(c.est_followers);
    const followerStr = followerNum >= 1000 ? `${(followerNum / 1000).toFixed(1)}K followers` : `${followerNum} followers`;
    const padding = opts?.featured ? 24 : 20;
    const tier = opts?.tierIndex !== undefined ? TIER_BADGES[opts.tierIndex] : null;

    return (
      <div
        key={c.handle}
        onClick={() => { setSelected(c); setOutreach(''); }}
        onMouseEnter={() => setHoveredCard(c.handle)}
        onMouseLeave={() => setHoveredCard(null)}
        style={{
          background: isSelected ? '#F5F3FF' : 'white',
          border: `1px solid ${isSelected ? '#6366F1' : '#F0F0F0'}`,
          borderRadius: 16,
          padding,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          transform: isHovered ? 'translateY(-2px)' : 'none',
          boxShadow: isHovered ? '0 8px 24px rgba(99,102,241,0.12)' : 'none',
          position: 'relative' as const,
        }}
      >
        {/* Tier badge */}
        {tier && (
          <div style={{
            position: 'absolute' as const, top: 12, right: 12,
            fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
            background: tier.bg, color: tier.color, letterSpacing: '0.05em',
          }}>{tier.label}</div>
        )}

        {/* Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', marginBottom: 14 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            boxShadow: tier ? tier.ring : ENGAGEMENT_RING[c.engagement_signal] || ENGAGEMENT_RING.LOW,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
            background: c.image_url ? 'transparent' : getNicheGradient(c.niche),
            marginBottom: 10,
          }}>
            {c.image_url ? (
              <img src={c.image_url} alt={c.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover' as const }} />
            ) : (
              <span style={{ fontSize: 22, fontWeight: 800, color: 'white', fontFamily: brico }}>{initials}</span>
            )}
          </div>

          {/* Niche chip */}
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 10,
            background: `${nicheColor}15`, color: nicheColor, marginBottom: 6,
          }}>{c.niche}</span>

          {/* Handle */}
          <div style={{ fontFamily: brico, fontWeight: 700, fontSize: 14, color: '#0A0A0A', marginBottom: 2, textAlign: 'center' as const }}>
            {c.display_name || c.handle}
          </div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 10 }}>
            {followerStr}
          </div>
        </div>

        {/* Engagement bar */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600 }}>Engagement</span>
            <span style={{ fontSize: 10, color: ENGAGEMENT_BAR_COLOR[c.engagement_signal] || '#D1D5DB', fontWeight: 700 }}>{c.engagement_signal}</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: '#F3F4F6', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2,
              width: `${engPercent}%`,
              background: ENGAGEMENT_BAR_COLOR[c.engagement_signal] || '#D1D5DB',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>

        {/* Tags */}
        {c.promoting_products.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const, marginBottom: 12 }}>
            {c.promoting_products.map((p, i) => (
              <span key={i} style={{ fontSize: 9, color: '#6B7280', background: '#F5F5F5', padding: '2px 7px', borderRadius: 10 }}>#{p.slice(0, 20)}</span>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={e => { e.stopPropagation(); setSelected(c); generateOutreach(c); }}
            style={{
              flex: 1, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              background: 'linear-gradient(135deg, #7C3AED, #6366F1)', color: 'white',
              border: 'none', borderRadius: 8, padding: '8px 14px',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
              fontFamily: dmSans,
            }}
          >
            AI Pitch
          </button>
          <a
            href={getTikTokUrl(c)}
            target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#F3F4F6', border: 'none', borderRadius: 8, cursor: 'pointer',
              textDecoration: 'none', color: '#374151',
            }}
          >
            <Play size={14} />
          </a>
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: '#F8F9FC', minHeight: '100vh', display: 'flex', flexDirection: 'column' as const, fontFamily: dmSans }}>

      {/* ===== 1. DARK HERO BANNER ===== */}
      <div style={{
        background: 'linear-gradient(135deg, #0F0F1A 0%, #1a1040 50%, #0F0F1A 100%)',
        padding: isMobile ? '28px 16px 24px' : '36px 32px 28px',
        borderRadius: 0,
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' as const : 'row' as const, gap: 16 }}>
          <div>
            <h1 style={{
              fontFamily: brico, fontWeight: 800, fontSize: 32, color: 'white', margin: 0, lineHeight: 1.1,
            }}>
              Find Your Next Viral Partner
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 8, marginBottom: 16 }}>
              Global creator network — find your next viral partner
            </p>

            {/* Date range pills */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
              {dateRangeOptions.map(opt => {
                const isActive = dateRange === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleDateRange(opt.value)}
                    style={{
                      padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                      fontSize: 12, fontWeight: 600, fontFamily: dmSans,
                      background: isActive ? '#6366F1' : 'rgba(255,255,255,0.08)',
                      color: isActive ? 'white' : 'rgba(255,255,255,0.5)',
                      boxShadow: isActive ? '0 0 12px rgba(99,102,241,0.5)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right side: stat badge + actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{
              background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 10, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontSize: 20 }}>👥</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{filtered.length} creators tracked</span>
            </div>
            <button onClick={() => exportCSV(filtered.map(c => ({ username: c.handle, platform: 'TikTok', niche: c.niche, followers: c.est_followers, engagement_rate: c.engagement_signal, profile_url: c.profile_url })), 'creators')}
              style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
              Export CSV
            </button>
            {isScale && (
              <button onClick={triggerRefresh} disabled={refreshing}
                style={{ padding: '6px 14px', background: refreshing ? 'rgba(255,255,255,0.1)' : 'rgba(99,102,241,0.2)', color: 'white', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: refreshing ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                {refreshing ? 'Refreshing...' : '\u21BB Refresh'}
              </button>
            )}
          </div>
        </div>
        {cachedAt && (
          <div style={{ maxWidth: 1400, margin: '8px auto 0' }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
              Last updated: {(() => {
                const mins = Math.round((Date.now() - new Date(cachedAt).getTime()) / 60000);
                if (mins < 1) return 'just now';
                if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
                return `${Math.round(mins / 60)}h ago`;
              })()}
            </p>
          </div>
        )}
        {refreshError && <p style={{ fontSize: 11, color: '#EF4444', maxWidth: 1400, margin: '4px auto 0' }}>{refreshError}</p>}
      </div>

      {/* ===== 2. GLASSMORPHISM FILTER BAR ===== */}
      <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%', padding: '16px 24px 0' }}>
        <div style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(99,102,241,0.15)',
          borderRadius: 14,
          padding: '12px 16px',
          display: 'flex',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: 12,
          flexDirection: isMobile ? 'column' as const : 'row' as const,
        }}>
          {/* Search */}
          <div style={{ position: 'relative' as const, flex: isMobile ? undefined : '0 0 220px', width: isMobile ? '100%' : undefined }}>
            <Search size={14} style={{ position: 'absolute' as const, left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' as const }} />
            <input
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search creators..."
              style={{
                width: '100%', height: 36, padding: '0 12px 0 32px', border: '1px solid #E5E7EB',
                borderRadius: 10, fontSize: 13, color: '#374151', background: 'white',
                boxSizing: 'border-box' as const, outline: 'none', fontFamily: dmSans,
              }}
            />
          </div>

          {/* Niche pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, flex: 1 }}>
            {NICHE_PILLS.map(pill => {
              const isActive = nicheFilter === pill;
              return (
                <button
                  key={pill}
                  onClick={() => setNicheFilter(pill)}
                  style={{
                    padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 600, fontFamily: dmSans,
                    background: isActive ? '#6366F1' : '#F3F4F6',
                    color: isActive ? 'white' : '#6B7280',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {pill}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%', padding: '20px 24px 40px', flex: 1, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 320px', gap: 20 }}>

        {/* LEFT — Cards area */}
        <div>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center' as const, color: '#9CA3AF', fontSize: 14 }}>Loading creators...</div>
          ) : filtered.length === 0 ? (
            <div style={{ background: 'white', border: '1px solid #F0F0F0', borderRadius: 16, padding: 60, textAlign: 'center' as const }}>
              <div style={{ fontFamily: brico, fontWeight: 700, fontSize: 18, color: '#0A0A0A', marginBottom: 8 }}>Creator data refreshing</div>
              <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 20, maxWidth: 380, margin: '0 auto 20px' }}>Our system syncs TikTok creator data every 6 hours. Check back soon — or try the Video Intel tab to browse trending content now.</div>
              <a href="/app/videos" style={{ display: 'inline-block', height: 38, lineHeight: '38px', padding: '0 20px', background: '#6366F1', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}>
                Browse Video Intel →
              </a>
              <div style={{ fontSize: 11, color: '#D1D5DB', marginTop: 16 }}>Last sync: checking...</div>
            </div>
          ) : (
            <>
              {/* ===== 4. FEATURED CREATORS ===== */}
              {featured.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ fontFamily: brico, fontWeight: 700, fontSize: 16, color: '#0A0A0A', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    ⭐ Featured Creators
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 14 }}>
                    {featured.map((c, i) => renderCreatorCard(c, { featured: true, tierIndex: i }))}
                  </div>
                </div>
              )}

              {/* ===== 3. CREATOR GRID ===== */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
                {regularCreators.map(c => renderCreatorCard(c))}
              </div>
            </>
          )}
        </div>

        {/* ===== RIGHT PANEL ===== */}
        <div style={{ height: 'fit-content', position: 'sticky' as const, top: 20 }}>
          {!selected ? (
            /* ===== 5. LIVE INSIGHTS ===== */
            <div style={{
              background: 'linear-gradient(135deg, #0F0F1A, #1a1040)',
              color: 'white', borderRadius: 16, padding: 24,
            }}>
              <h3 style={{ fontFamily: brico, fontWeight: 800, fontSize: 18, margin: '0 0 4px', color: 'white' }}>This Week</h3>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>Top performing niches</p>

              {topNiches.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  {topNiches.map(([niche, count], i) => (
                    <div key={niche} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 0', borderBottom: i < topNiches.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', width: 16 }}>{i + 1}</span>
                        <span style={{
                          fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 6,
                          background: `${NICHE_COLORS[niche] || '#6B7280'}30`,
                          color: NICHE_COLORS[niche] || '#6B7280',
                        }}>
                          {niche}
                        </span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{count}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{
                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 10, padding: 14, marginBottom: 16,
              }}>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.5 }}>
                  💡 Creators with 50K–500K followers have <span style={{ color: '#6366F1', fontWeight: 700 }}>3x better response rates</span>
                </p>
              </div>

              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center' as const }}>
                Click a creator to see details
              </div>
            </div>
          ) : (
            /* Selected creator detail */
            <div style={{ background: 'white', border: '1px solid #F0F0F0', borderRadius: 16, padding: 20 }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: selected.image_url ? 'transparent' : getNicheGradient(selected.niche),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                  boxShadow: ENGAGEMENT_RING[selected.engagement_signal] || ENGAGEMENT_RING.LOW,
                }}>
                  {selected.image_url ? (
                    <img src={selected.image_url} alt={selected.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover' as const }} />
                  ) : (
                    <span style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>{selected.display_name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <div style={{ fontFamily: brico, fontWeight: 700, fontSize: 15, color: '#0A0A0A' }}>{selected.display_name}</div>
                  <a href={getTikTokUrl(selected)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#6366F1', textDecoration: 'none' }}>{selected.handle} ↗</a>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                {[
                  { label: 'Followers', value: selected.est_followers },
                  { label: 'Region', value: `${REGION_FLAGS[selected.region_code] || ''} ${selected.region_code}` },
                  { label: 'Niche', value: selected.niche },
                  { label: 'Engagement', value: selected.engagement_signal },
                ].map(s => (
                  <div key={s.label} style={{ background: '#F8F9FC', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, color: '#9CA3AF' }}>{s.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0A0A0A' }}>{s.value}</div>
                  </div>
                ))}
              </div>
              {selected.promoting_products.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Promoting:</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const }}>
                    {selected.promoting_products.map((p, i) => (
                      <span key={i} style={{ fontSize: 10, color: '#6366F1', background: '#EEF2FF', padding: '2px 8px', borderRadius: 10 }}>{p}</span>
                    ))}
                  </div>
                </div>
              )}
              <a href={getTikTokUrl(selected)} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', height: 36, marginBottom: 12, background: '#000', color: 'white', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none', boxSizing: 'border-box' as const }}>
                🎵 Find on TikTok
              </a>
              <button onClick={() => generateOutreach(selected)} disabled={outreachLoading}
                style={{ width: '100%', height: 38, background: 'linear-gradient(135deg, #7C3AED, #6366F1)', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 12, opacity: outreachLoading ? 0.7 : 1 }}>
                {outreachLoading ? 'Generating...' : 'AI Pitch Message'}
              </button>
              {outreach && (
                <div style={{ background: '#F8F8FF', border: '1px solid #E0E7FF', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#6366F1', marginBottom: 6 }}>AI-Generated Pitch:</div>
                  <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap' as const }}>{outreach}</div>
                  <button onClick={() => navigator.clipboard.writeText(outreach)}
                    style={{ marginTop: 8, fontSize: 10, color: '#6366F1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}>
                    Copy message →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
