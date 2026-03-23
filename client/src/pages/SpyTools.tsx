import { lazy, Suspense, useState } from 'react';
import { Helmet } from 'react-helmet-async';

const CreatorIntelligence = lazy(() => import('./CreatorIntelligence'));
const VideoIntelligence = lazy(() => import('./VideoIntelligence'));

type TabKey = 'ads' | 'creators' | 'videos';

const SEED_ADS = [
  { id: 1, platform: 'Facebook', product: 'Posture Corrector Pro', runningDays: 47, spendPerDay: 312, gradient: 'linear-gradient(135deg,#1a1a2e,#16213e)', niche: 'Health' },
  { id: 2, platform: 'TikTok', product: 'LED Desk Lamp RGB', runningDays: 23, spendPerDay: 187, gradient: 'linear-gradient(135deg,#0f0f23,#1a1a3e)', niche: 'Tech' },
  { id: 3, platform: 'Instagram', product: 'Vitamin C Serum 30ml', runningDays: 61, spendPerDay: 445, gradient: 'linear-gradient(135deg,#fdf4ff,#fce7f3)', niche: 'Beauty' },
  { id: 4, platform: 'Facebook', product: 'Weighted Blanket 8kg', runningDays: 38, spendPerDay: 276, gradient: 'linear-gradient(135deg,#1c1917,#292524)', niche: 'Home' },
  { id: 5, platform: 'TikTok', product: 'Smart Plug 4-Pack', runningDays: 15, spendPerDay: 134, gradient: 'linear-gradient(135deg,#0a0a1a,#1a1a3e)', niche: 'Tech' },
  { id: 6, platform: 'Google', product: 'Pet GPS Tracker', runningDays: 52, spendPerDay: 389, gradient: 'linear-gradient(135deg,#ecfdf5,#d1fae5)', niche: 'Pets' },
  { id: 7, platform: 'Facebook', product: 'Resistance Bands Set', runningDays: 29, spendPerDay: 198, gradient: 'linear-gradient(135deg,#064e3b,#065f46)', niche: 'Fitness' },
  { id: 8, platform: 'TikTok', product: 'Rose Quartz Face Roller', runningDays: 44, spendPerDay: 267, gradient: 'linear-gradient(135deg,#fff1f2,#ffe4e6)', niche: 'Beauty' },
  { id: 9, platform: 'Instagram', product: 'Bamboo Cutting Board Set', runningDays: 18, spendPerDay: 143, gradient: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', niche: 'Kitchen' },
  { id: 10, platform: 'Google', product: 'Blue Light Glasses', runningDays: 71, spendPerDay: 521, gradient: 'linear-gradient(135deg,#eff6ff,#dbeafe)', niche: 'Health' },
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

const C = { bg: '#FAFAFA', surface: '#FFFFFF', border: '#E5E7EB', accent: '#6366F1', text: '#0A0A0A', muted: '#6B7280' };

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
    <div style={{ background: '#FAFAFA', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <Helmet><title>Spy Tools | Majorka</title></Helmet>

      {/* Header */}
      <div style={{ padding: '24px 24px 0', maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 24, color: '#0A0A0A', marginBottom: 4, margin: 0 }}>Spy Tools</h1>
        <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 20, marginTop: 4 }}>See exactly what ads your competitors are running</p>

        {/* Main tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {(['ads', 'creators', 'videos'] as TabKey[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: tab === t ? C.accent : '#F5F5F5',
              color: tab === t ? 'white' : '#374151',
              fontFamily: "'Bricolage Grotesque', sans-serif",
              transition: 'all 150ms',
            }}>
              {t === 'ads' ? 'Ad Spy' : t === 'creators' ? 'Creators' : 'Video Inspiration'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 24px 60px', maxWidth: 1200, margin: '0 auto' }}>
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
                { key: 'days' as const, label: 'Running Days ↓' },
                { key: 'spend' as const, label: 'Spend ↓' },
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
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'transform 150ms, box-shadow 150ms',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; }}
                >
                  {/* Gradient thumbnail */}
                  <div style={{ height: 180, background: ad.gradient, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 48, opacity: 0.3 }}>📦</span>

                    {/* Platform badge */}
                    <div style={{
                      position: 'absolute', top: 10, left: 10,
                      background: PLATFORM_COLORS[ad.platform] || '#333', color: 'white',
                      padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      <span style={{ fontSize: 10 }}>{PLATFORM_ICONS[ad.platform]}</span>
                      {ad.platform}
                    </div>

                    {/* Running days badge */}
                    <div style={{
                      position: 'absolute', top: 10, right: 10,
                      background: 'white', color: '#0A0A0A',
                      padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                    }}>
                      RUNNING {ad.runningDays} DAYS
                    </div>
                  </div>

                  {/* Card body */}
                  <div style={{ padding: 16 }}>
                    <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 15, color: '#0A0A0A', margin: '0 0 6px' }}>
                      {ad.product}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: '#6B7280' }}>Est. spend/day:</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A' }}>${ad.spendPerDay} AUD</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 12 }}>{ad.niche}</div>

                    {/* Buttons */}
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
                        🛒 Find Supplier
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
            {/* Large gradient thumbnail */}
            <div style={{ height: 300, background: viewAd.gradient, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 72, opacity: 0.3 }}>📦</span>
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
              {/* Close button */}
              <button onClick={() => setViewAd(null)} style={{
                position: 'absolute', bottom: 14, right: 14,
                width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none',
                cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>×</button>
            </div>

            <div style={{ padding: 24 }}>
              <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 20, color: '#0A0A0A', margin: '0 0 4px' }}>
                {viewAd.product}
              </h2>
              <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
                Est. spend/day: <strong style={{ color: '#0A0A0A' }}>${viewAd.spendPerDay} AUD</strong> · {viewAd.niche}
              </div>

              {/* Fake ad copy */}
              <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 16, marginBottom: 20, border: '1px solid #F0F0F0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Ad Copy Preview</div>
                <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.6 }}>
                  Australians are going crazy for {viewAd.product}. Limited stock available. Free AU shipping. Order now →
                </p>
              </div>

              <button onClick={() => openSupplier(viewAd.product)} style={{
                width: '100%', height: 44, borderRadius: 8, border: 'none', background: C.accent,
                color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 150ms',
                fontFamily: "'Bricolage Grotesque', sans-serif",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#4F46E5'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = C.accent; e.currentTarget.style.transform = ''; }}
                onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
                onMouseUp={e => { e.currentTarget.style.transform = 'scale(1.02)'; }}
              >
                Find on AliExpress →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
