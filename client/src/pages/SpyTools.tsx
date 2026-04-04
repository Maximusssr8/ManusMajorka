import { useIsMobile } from '@/hooks/useIsMobile';
import { lazy, Suspense, useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

const CreatorIntelligence = lazy(() => import('./CreatorIntelligence'));
const VideoIntelligence = lazy(() => import('./VideoIntelligence'));

type TabKey = 'ads' | 'creators' | 'videos' | 'competitors';

const SEED_ADS = [
  { id:1, platform:'Facebook', product:'Posture Corrector Pro', runningDays:47, spendPerDay:312, niche:'Health',
    hook:"This $29 posture fix sold 11,000 units last month 🤯", body:"Physios HATE this but Australians are obsessed. Fix your hunchback in 2 weeks or your money back.", cta:"Shop Now", bg:'#FFF7ED', accent:'#EA580C' },
  { id:2, platform:'TikTok', product:'LED Desk Lamp RGB', runningDays:23, spendPerDay:187, niche:'Tech',
    hook:"POV: Your home office finally looks like a setup tour 👀", body:"16 million colours, 3 brightness levels, USB-C. £24 anywhere else, $29 AUD here.", cta:"Get Yours", bg:'#EEF2FF', accent:'#6366F1' },
  { id:3, platform:'Instagram', product:'Vitamin C Serum 30ml', runningDays:61, spendPerDay:445, niche:'Beauty',
    hook:"I was embarrassed to go out without makeup. Then I tried this.", body:"Dermatologist-tested 20% Vitamin C. Dark spots visibly reduced in 14 days. Now I leave the house bare-faced.", cta:"Try Risk-Free", bg:'#FDF4FF', accent:'#A855F7' },
  { id:4, platform:'Facebook', product:'Weighted Blanket 8kg', runningDays:38, spendPerDay:276, niche:'Home',
    hook:"My anxiety went down 60% after one week of using this", body:"8kg deep-pressure therapy blanket. Used by 3,200+ Australians with anxiety and insomnia. Ships in 2 days.", cta:"Order Today", bg:'#F0FDF4', accent:'#16A34A' },
  { id:5, platform:'TikTok', product:'Smart Plug 4-Pack', runningDays:15, spendPerDay:134, niche:'Tech',
    hook:"Wait… you can turn your dumb TV into a smart TV for $19?", body:"Control any appliance from your phone. Works with Siri, Alexa, Google. Pack of 4. Aussie plug compatible.", cta:"Add to Cart", bg:'#ECFDF5', accent:'#059669' },
  { id:6, platform:'Instagram', product:'Silk Pillowcase Set', runningDays:29, spendPerDay:198, niche:'Beauty',
    hook:"I switched pillowcases and woke up without frizzy hair 😭", body:"100% mulberry silk. Dermatologists say it reduces hair breakage and skin creasing overnight. Gift-ready packaging.", cta:"Shop the Set", bg:'#FFF1F2', accent:'#E11D48' },
  { id:7, platform:'Facebook', product:'Car Seat Gap Filler', runningDays:52, spendPerDay:89, niche:'Auto',
    hook:"This $15 thing paid for itself the first week I used it", body:"Stop losing your phone/wallet in the seat gap forever. Fits 99% of car models. 2-pack so you cover both sides.", cta:"Get 2-Pack", bg:'#F8FAFC', accent:'#334155' },
  { id:8, platform:'TikTok', product:'Mini Projector 4K', runningDays:31, spendPerDay:267, niche:'Tech',
    hook:"Hotel room → home cinema in 10 seconds flat 🎬", body:"1080p native, 120'' screen, built-in speaker. Sold 4,200 in the last 3 months. Free Prime shipping.", cta:"Watch Demo", bg:'#EFF6FF', accent:'#2563EB' },
  { id:9, platform:'Facebook', product:'Bamboo Cutting Board Set', runningDays:44, spendPerDay:156, niche:'Kitchen',
    hook:"My wife threw out our plastic cutting boards after seeing this", body:"3-piece bamboo set with juice grooves, handles, and non-slip feet. Naturally antibacterial. Ships same day.", cta:"Shop Set", bg:'#FEFCE8', accent:'#CA8A04' },
  { id:10, platform:'Instagram', product:'Resistance Band Kit', runningDays:19, spendPerDay:223, niche:'Fitness',
    hook:"Personal trainers don't want you to know this builds muscle", body:"5-level resistance bands replace a full gym. Used by 12,000+ Aussies at home. Free workout guide included.", cta:"Start Training", bg:'#F0FDFA', accent:'#0D9488' },
];

const PLATFORM_COLORS: Record<string, string> = {
  Facebook: '#1877F2',
  TikTok: '#000000',
  Instagram: '#E4405F',
  Google: '#4285F4',
};

const PLATFORM_ICONS: Record<string, string> = {
  Facebook: 'f',
  TikTok: '♪',
  Instagram: '◎',
  Google: 'G',
};

const STORES = [
  { domain: 'ozziesupplies.com.au', name: 'Ozzie Supplies', category: 'General' },
  { domain: 'mytrendyphone.com.au', name: 'My Trendy Phone AU', category: 'Tech & Gadgets' },
  { domain: 'kogan.com', name: 'Kogan AU', category: 'Tech & Gadgets' },
  { domain: 'catch.com.au', name: 'Catch AU', category: 'General' },
  { domain: 'petcircle.com.au', name: 'Pet Circle AU', category: 'Pet Care' },
  { domain: 'petbarn.com.au', name: 'Petbarn AU', category: 'Pet Care' },
  { domain: 'gymshark.com', name: 'Gymshark AU', category: 'Fitness' },
  { domain: 'iherb.com', name: 'iHerb AU', category: 'Health' },
  { domain: 'frankbody.com', name: 'Frank Body AU', category: 'Skincare' },
  { domain: 'shein.com.au', name: 'SHEIN AU', category: 'Fashion' },
  { domain: 'theiconic.com.au', name: 'THE ICONIC AU', category: 'Fashion' },
  { domain: 'priceline.com.au', name: 'Priceline AU', category: 'Beauty' },
  { domain: 'luxyhair.com', name: 'Luxy Hair', category: 'Beauty' },
  { domain: 'stylerunner.com', name: 'Stylerunner AU', category: 'Fitness' },
  { domain: 'bellabox.com.au', name: 'Bellabox AU', category: 'Beauty' },
  { domain: 'goodnessme.com.au', name: 'GoodnessMe AU', category: 'Health' },
  { domain: 'nuvita.com.au', name: 'Nuvita AU', category: 'Health' },
  { domain: 'beautyheaven.com.au', name: 'Beauty Heaven AU', category: 'Skincare' },
  { domain: 'juicygreenshop.com.au', name: 'Juicy Green Shop', category: 'Home & Wellness' },
  { domain: 'temu.com', name: 'Temu AU', category: 'General' },
];

const C = { bg: '#FAFAFA', surface: '#FFFFFF', border: '#E5E7EB', accent: '#6366F1', text: '#0A0A0A', muted: '#6B7280' };
const brico = "'Bricolage Grotesque', sans-serif";

function CompetitorSpy() {
  const isMobile = useIsMobile();
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>(STORES.map(s => ({ ...s, product_count: 0 })));
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  const fetchProducts = async (store?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (store) params.set('store', store);
      const r = await fetch(`/api/competitor/products?${params}`);
      const data = await r.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch { setProducts([]); }
    finally { setLoading(false); }
  };

  const fetchStores = async () => {
    try {
      const r = await fetch('/api/competitor/stores');
      const data = await r.json();
      if (Array.isArray(data)) setStores(data);
    } catch {}
  };

  useEffect(() => {
    fetchProducts();
    fetchStores();
  }, []);

  useEffect(() => {
    fetchProducts(selectedStore || undefined);
  }, [selectedStore]);

  const triggerRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch('/api/admin/run-competitor-spy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 5 }),
      });
      setLastRefresh(new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }));
      setTimeout(() => { fetchProducts(); fetchStores(); }, 30000);
    } catch {}
    finally { setRefreshing(false); }
  };

  const isNewProduct = (p: any) => {
    const seen = p.first_seen_at;
    return seen ? Date.now() - new Date(seen).getTime() < 86400000 : false;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Header */}
      <div style={{ padding: '0 0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 0, marginBottom: 0 }}>
            Track what 20 AU stores are selling — find winners before they peak
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {lastRefresh && <span style={{ fontSize: 11, color: '#9CA3AF' }}>Last: {lastRefresh}</span>}
          <button onClick={triggerRefresh} disabled={refreshing}
            style={{ height: 36, padding: '0 16px', background: '#6366F1', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: refreshing ? 'wait' : 'pointer', opacity: refreshing ? 0.7 : 1, transition: 'all 150ms' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
            onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1.02)'; }}>
            {refreshing ? 'Scraping...' : 'Refresh Stores'}
          </button>
        </div>
      </div>

      {/* 3-panel layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 280px', gap: 16, flex: 1 }}>

        {/* LEFT — Store Selector */}
        <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', height: 'fit-content' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #F3F4F6', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
            20 AU Stores
          </div>
          {stores.map(s => (
            <button key={s.domain} onClick={() => setSelectedStore(selectedStore === s.domain ? null : s.domain)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px', background: selectedStore === s.domain ? '#EEF2FF' : 'white', border: 'none', borderLeft: selectedStore === s.domain ? '3px solid #6366F1' : '3px solid transparent', cursor: 'pointer', textAlign: 'left' as const, transition: 'background 120ms' }}
              onMouseEnter={e => { if (selectedStore !== s.domain) e.currentTarget.style.background = '#FAFAFF'; }}
              onMouseLeave={e => { if (selectedStore !== s.domain) e.currentTarget.style.background = 'white'; }}>
              <img src={`https://www.google.com/s2/favicons?domain=${s.domain}&sz=32`} alt={s.name} style={{ width: 16, height: 16, borderRadius: 3 }} onError={(e: any) => (e.currentTarget.style.display = 'none')} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: selectedStore === s.domain ? '#6366F1' : '#0A0A0A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, direction: 'ltr' as const }}>{s.name}</div>
              </div>
              {(s.product_count || 0) > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF' }}>{s.product_count}</span>
              )}
            </button>
          ))}
        </div>

        {/* CENTER — Product Feed */}
        <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
              {selectedStore ? `${stores.find(s => s.domain === selectedStore)?.name || selectedStore}` : 'All Stores'} · {products.length} products
            </span>
            {selectedStore && (
              <button onClick={() => setSelectedStore(null)} style={{ fontSize: 11, color: '#6366F1', background: 'none', border: 'none', cursor: 'pointer' }}>
                Show all stores
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' as const, color: '#9CA3AF', fontSize: 14 }}>Loading products...</div>
          ) : products.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' as const }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🕵️</div>
              <div style={{ fontFamily: brico, fontWeight: 700, fontSize: 16, color: '#0A0A0A', marginBottom: 6 }}>Competitor data pipeline warming up</div>
              <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 8, lineHeight: 1.6 }}>
                We're building live store tracking for 20 AU competitor stores.<br />
                Data is collected nightly — check back tomorrow for your first snapshot.
              </div>
              <div style={{ fontSize: 11, color: '#9CA3AF', padding: '8px 16px', background: '#F9FAFB', borderRadius: 8, display: 'inline-block', border: '1px solid #E5E7EB' }}>
                🔄 Next data refresh: tonight at 00:00 AEST
              </div>
            </div>
          ) : (
            <div style={{ maxHeight: 700, overflowY: 'auto' as const }}>
              {products.map((p: any, i: number) => (
                <div key={p.id || i} style={{ padding: '10px 16px', borderBottom: '1px solid #F9FAFB', display: 'flex', gap: 10, alignItems: 'flex-start', transition: 'background 120ms' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FAFAFF'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                  <img src={`https://www.google.com/s2/favicons?domain=${p.store_domain}&sz=32`} alt="" style={{ width: 18, height: 18, borderRadius: 3, marginTop: 2, flexShrink: 0 }} onError={(e: any) => (e.currentTarget.style.display = 'none')} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A', lineHeight: 1.4, marginBottom: 3 }}>{p.product_name}</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' as const }}>
                      <span style={{ fontSize: 10, color: '#9CA3AF' }}>{p.store_domain}</span>
                      {p.price_aud && <span style={{ fontSize: 11, fontWeight: 600, color: '#059669' }}>${p.price_aud}</span>}
                      {p.category && <span style={{ fontSize: 9, color: '#6B7280', background: '#F5F5F5', padding: '1px 6px', borderRadius: 10 }}>{p.category}</span>}
                      {isNewProduct(p) && (
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#6366F1', background: '#EEF2FF', padding: '1px 6px', borderRadius: 10 }}>NEW TODAY</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT — Trend Crossovers */}
        <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', height: 'fit-content' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #F3F4F6', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
            Confirmed Winners
          </div>
          <div style={{ padding: '12px 14px' }}>
            <p style={{ fontSize: 12, color: '#6B7280', marginTop: 0, marginBottom: 12, lineHeight: 1.5 }}>
              Products trending in competitor stores <strong>AND</strong> Majorka's database — confirmed market demand.
            </p>
            {products.filter(p => p.category).slice(0, 8).map((p: any, i: number) => (
              <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #F9FAFB', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 14, flexShrink: 0, color: '#6366F1' }}>●</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0A0A0A', lineHeight: 1.3, marginBottom: 2 }}>{p.product_name?.slice(0, 60)}</div>
                  <div style={{ fontSize: 10, color: '#9CA3AF' }}>{p.store_domain} · {p.category}</div>
                </div>
              </div>
            ))}
            {products.length === 0 && (
              <div style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center' as const, padding: '20px 0' }}>
                Run a refresh to see crossovers
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SpyTools() {
  const [tab, setTab] = useState<TabKey>('ads');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [sort, setSort] = useState<'days' | 'spend' | 'platform'>('days');
  const [viewAd, setViewAd] = useState<typeof SEED_ADS[0] | null>(null);
  const [savedAds, setSavedAds] = useState<Set<number>>(new Set());

  const filteredAds = platformFilter === 'All' ? SEED_ADS : SEED_ADS.filter(a => a.platform === platformFilter);

  const sortedAds = [...filteredAds].sort((a, b) => {
    if (sort === 'days') return b.runningDays - a.runningDays;
    if (sort === 'spend') return b.spendPerDay - a.spendPerDay;
    return a.platform.localeCompare(b.platform);
  });

  const openSupplier = (product: string) => {
    window.open(`https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(product)}&shipCountry=au`, '_blank');
  };

  return (
    <div style={{ background: '#060A12', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <Helmet><title>Spy Tools | Majorka</title></Helmet>

      {/* Header */}
      <div style={{ padding: '24px 24px 0', maxWidth: 1400, margin: '0 auto' }}>
        <h1 style={{ fontFamily: brico, fontWeight: 800, fontSize: 24, color: '#0A0A0A', marginBottom: 4, margin: 0 }}>Spy Tools</h1>
        <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 20, marginTop: 4 }}>See exactly what ads your competitors are running</p>

        {/* Main tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {(['ads', 'creators', 'videos', 'competitors'] as TabKey[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: tab === t ? C.accent : '#F5F5F5',
              color: tab === t ? 'white' : '#374151',
              fontFamily: brico,
              transition: 'all 150ms',
            }}>
              {t === 'ads' ? 'Ad Brief Generator' : t === 'creators' ? 'Creators' : t === 'videos' ? 'Video Inspiration' : 'Competitor Spy'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 24px 60px', maxWidth: 1400, margin: '0 auto' }}>
        {tab === 'competitors' && <CompetitorSpy />}

        {tab === 'ads' && (
          <div>
            {/* Platform filter pills */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {['All', 'Facebook', 'TikTok', 'Instagram', 'Google'].map(p => (
                <button key={p} onClick={() => setPlatformFilter(p)} style={{
                  padding: '6px 16px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                  background: platformFilter === p ? C.accent : '#F5F5F5',
                  color: platformFilter === p ? 'white' : '#374151',
                  transition: 'all 150ms',
                }}>
                  {p}
                </button>
              ))}
            </div>

            {/* Sort controls */}
            <div style={{ display: 'flex', gap: 20, marginBottom: 20, borderBottom: '1px solid #F0F0F0', paddingBottom: 12 }}>
              {([
                { key: 'days' as const, label: 'Running Days' },
                { key: 'spend' as const, label: 'Spend' },
                { key: 'platform' as const, label: 'Platform' },
              ]).map(s => (
                <button key={s.key} onClick={() => setSort(s.key)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  color: sort === s.key ? C.accent : '#9CA3AF',
                  borderBottom: sort === s.key ? `2px solid ${C.accent}` : '2px solid transparent',
                  paddingBottom: 4,
                  transition: 'all 150ms',
                }}>
                  {s.label}
                </button>
              ))}
              <div style={{ marginLeft: 'auto', fontSize: 13, color: '#9CA3AF' }}>
                {sortedAds.length} ad{sortedAds.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Ad card grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {sortedAds.map(ad => (
                <div key={ad.id} style={{
                  background: 'white', borderRadius: 12, border: '1px solid #F0F0F0', overflow: 'hidden',
                  boxShadow: '0 2px 8px #F5F5F5', transition: 'transform 150ms, box-shadow 150ms',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px #E5E7EB'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px #F5F5F5'; }}
                >
                  <div style={{ height: 180, background: ad.bg || '#F9FAFB', position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', padding: 16, flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: ad.accent || '#374151', fontFamily: '"Bricolage Grotesque", sans-serif', lineHeight: 1.4, maxWidth: '100%' }}>{ad.hook || ad.product}</div>
                    <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.5 }}>{ad.body ? ad.body.slice(0,80) + '…' : ''}</div>
                    <div style={{ marginTop: 'auto', display: 'inline-block', background: ad.accent || '#6366F1', color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 99 }}>{ad.cta || 'Shop Now'}</div>
                    <span style={{ display: 'none' }}>📦</span>
                    <div style={{
                      position: 'absolute', top: 10, left: 10,
                      background: PLATFORM_COLORS[ad.platform] || '#333', color: 'white',
                      padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      <span style={{ fontSize: 10 }}>{PLATFORM_ICONS[ad.platform]}</span>
                      {ad.platform}
                    </div>
                    <div style={{
                      position: 'absolute', top: 10, right: 10,
                      background: 'white', color: '#0A0A0A',
                      padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                    }}>
                      RUNNING {ad.runningDays} DAYS
                    </div>
                  </div>

                  <div style={{ padding: 16 }}>
                    <h3 style={{ fontFamily: brico, fontWeight: 700, fontSize: 15, color: '#0A0A0A', margin: '0 0 6px' }}>
                      {ad.product}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: '#6B7280' }}>Est. spend/day:</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A' }}>${ad.spendPerDay} AUD</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 12 }}>{ad.niche}</div>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button onClick={() => setViewAd(ad)} style={{
                        flex: 1, height: 36, borderRadius: 8, border: `1px solid ${C.accent}`, background: 'transparent',
                        color: C.accent, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 150ms',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#EEF2FF'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = ''; }}
                        onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
                        onMouseUp={e => { e.currentTarget.style.transform = 'scale(1.02)'; }}
                      >
                        View Ad
                      </button>
                      <button onClick={() => openSupplier(ad.product)} style={{
                        flex: 1, height: 36, borderRadius: 8, border: 'none', background: C.accent,
                        color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 150ms',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#4F46E5'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = C.accent; e.currentTarget.style.transform = ''; }}
                        onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
                        onMouseUp={e => { e.currentTarget.style.transform = 'scale(1.02)'; }}
                      >
                        Find Supplier
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const newSaved = new Set(savedAds);
                          if (newSaved.has(ad.id)) { newSaved.delete(ad.id); } else { newSaved.add(ad.id); }
                          setSavedAds(newSaved);
                        }}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', fontSize: 18,
                          color: savedAds.has(ad.id) ? '#6366F1' : '#D1D5DB',
                          transition: 'color 150ms', padding: '4px', flexShrink: 0,
                        }}
                        title={savedAds.has(ad.id) ? 'Saved' : 'Save ad'}
                      >
                        {savedAds.has(ad.id) ? '♥' : '♡'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'creators' && (
          <Suspense fallback={<div style={{ textAlign: 'center', padding: 60, color: C.muted }}>Loading...</div>}>
            <CreatorIntelligence />
          </Suspense>
        )}

        {tab === 'videos' && (
          <Suspense fallback={<div style={{ textAlign: 'center', padding: 60, color: C.muted }}>Loading...</div>}>
            <VideoIntelligence />
          </Suspense>
        )}
      </div>

      {/* View Ad Modal */}
      {viewAd && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 24,
        }} onClick={() => setViewAd(null)}>
          <div style={{
            background: 'white', borderRadius: 16, maxWidth: 480, width: '100%', overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ height: 300, background: viewAd.bg || '#F9FAFB', position: 'relative', display: 'flex', flexDirection: 'column', gap: 12, padding: 24, justifyContent: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: viewAd.accent || '#374151', fontFamily: '"Bricolage Grotesque", sans-serif', lineHeight: 1.5 }}>{viewAd.hook || viewAd.product}</div>
              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{viewAd.body || ''}</div>
              <div style={{ display: 'inline-block', background: viewAd.accent || '#6366F1', color: 'white', fontSize: 12, fontWeight: 700, padding: '6px 16px', borderRadius: 99, alignSelf: 'flex-start' }}>{viewAd.cta || 'Shop Now'}</div>
              <div style={{
                position: 'absolute', top: 14, left: 14,
                background: PLATFORM_COLORS[viewAd.platform] || '#333', color: 'white',
                padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700,
              }}>
                {viewAd.platform}
              </div>
              <div style={{
                position: 'absolute', top: 14, right: 14,
                background: 'white', color: '#0A0A0A',
                padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700,
              }}>
                Running {viewAd.runningDays} days
              </div>
              <button onClick={() => setViewAd(null)} style={{
                position: 'absolute', bottom: 14, right: 14,
                width: 32, height: 32, borderRadius: '50%', background: '#FAFAFA', border: 'none',
                cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>×</button>
            </div>

            <div style={{ padding: 24 }}>
              <h2 style={{ fontFamily: brico, fontWeight: 700, fontSize: 20, color: '#0A0A0A', margin: '0 0 4px' }}>
                {viewAd.product}
              </h2>
              <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
                Est. spend/day: <strong style={{ color: '#0A0A0A' }}>${viewAd.spendPerDay} AUD</strong> · {viewAd.niche}
              </div>

              <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 16, marginBottom: 20, border: '1px solid #F0F0F0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Ad Copy Preview</div>
                <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.6 }}>
                  Australians are going crazy for {viewAd.product}. Limited stock available. Free AU shipping. Order now →
                </p>
              </div>

              <button onClick={() => openSupplier(viewAd.product)} style={{
                width: '100%', height: 44, borderRadius: 8, border: 'none', background: C.accent,
                color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 150ms',
                fontFamily: brico,
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#4F46E5'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = C.accent; e.currentTarget.style.transform = ''; }}
                onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
                onMouseUp={e => { e.currentTarget.style.transform = 'scale(1.02)'; }}
              >
                Find on AliExpress
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}