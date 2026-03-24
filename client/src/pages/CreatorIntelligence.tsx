import { useIsMobile } from '@/hooks/useIsMobile';
import { useCallback, useEffect, useState } from 'react';
import { DateRangeSelector, getDateRangeStart, type Range } from '@/components/DateRangeSelector';
import { exportCSV } from '@/lib/exportCsv';

const brico = "'Bricolage Grotesque', sans-serif";
const NICHES = ['beauty','fitness','home decor','pet care','tech accessories','fashion','health','kitchen','outdoor','baby'];

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
}

const REGION_FLAGS: Record<string, string> = { AU: '\u{1F1E6}\u{1F1FA}', US: '\u{1F1FA}\u{1F1F8}', UK: '\u{1F1EC}\u{1F1E7}', CA: '\u{1F1E8}\u{1F1E6}', NZ: '\u{1F1F3}\u{1F1FF}', DE: '\u{1F1E9}\u{1F1EA}', SG: '\u{1F1F8}\u{1F1EC}' };
const ENGAGEMENT_STYLE: Record<string, { bg: string; color: string }> = {
  HIGH: { bg: '#D1FAE5', color: '#065F46' },
  MEDIUM: { bg: '#FEF3C7', color: '#92400E' },
  LOW: { bg: '#F3F4F6', color: '#374151' },
};

export default function CreatorIntelligence() {
  const isMobile = useIsMobile();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Creator | null>(null);
  const [outreach, setOutreach] = useState('');
  const [outreachLoading, setOutreachLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQ, setSearchQ] = useState('');
  const [filterNiche, setFilterNiche] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterEngagement, setFilterEngagement] = useState('');
  const [sortBy, setSortBy] = useState<'followers' | 'engagement' | 'recent'>('followers');
  const [dateRange, setDateRange] = useState<Range>(() => (localStorage.getItem('majorka_creator_daterange') as Range) || '30d');
  const handleDateRange = (v: Range) => { localStorage.setItem('majorka_creator_daterange', v); setDateRange(v); };

  const fetchCreators = useCallback(async (niche = '', region = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (niche) params.set('niche', niche);
      if (region) params.set('region', region);
      const r = await fetch(`/api/creators?${params}`);
      const data = await r.json();
      setCreators(data.creators && data.creators.length > 0 ? data.creators : []);
    } catch { setCreators([]); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCreators(filterNiche, filterRegion); }, [filterNiche, filterRegion, fetchCreators]);

  const triggerRefresh = async () => {
    setRefreshing(true);
    await fetch('/api/admin/refresh-creators', { method: 'POST' });
    setTimeout(() => { fetchCreators(filterNiche, filterRegion); setRefreshing(false); }, 5000);
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

  const filtered = creators.filter(c => {
    if (searchQ && !c.handle.toLowerCase().includes(searchQ.toLowerCase()) && !c.display_name.toLowerCase().includes(searchQ.toLowerCase())) return false;
    if (filterNiche && c.niche !== filterNiche) return false;
    if (filterRegion && c.region_code !== filterRegion) return false;
    if (filterEngagement && c.engagement_signal !== filterEngagement) return false;
    if (c.created_at) {
      const createdDate = new Date(c.created_at);
      if (createdDate < getDateRangeStart(dateRange)) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'engagement') return a.engagement_signal === 'HIGH' ? -1 : 1;
    return 0;
  });

  const selectStyle = {
    width: '100%', height: 34, padding: '0 8px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 12,
    background: 'white', marginBottom: 8, cursor: 'pointer',
  };

  return (
    <div style={{ background: '#FAFAFA', minHeight: '100vh', display: 'flex', flexDirection: 'column' as const }}>
      <div style={{ padding: '24px 24px 0', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontFamily: brico, fontWeight: 800, fontSize: 22, color: '#0A0A0A', margin: 0 }}>Creator Intelligence</h1>
            <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4, marginBottom: 0 }}>
              Find TikTok creators promoting products in your niche. Contact hints FREE (KaloData charges $90+/mo).
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <DateRangeSelector value={dateRange} onChange={handleDateRange} />
            <button onClick={() => exportCSV(filtered.map(c => ({ username: c.handle, platform: 'TikTok', niche: c.niche, followers: c.est_followers, engagement_rate: c.engagement_signal, profile_url: c.profile_url })), 'creators')}
              style={{ border: '1px solid #E5E7EB', background: 'white', color: '#374151', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer' }}>
              {'⬇'} Export CSV
            </button>
            <button onClick={triggerRefresh} disabled={refreshing}
              style={{ height: 36, padding: '0 16px', background: refreshing ? '#9CA3AF' : '#6366F1', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: refreshing ? 'wait' : 'pointer' }}>
              {refreshing ? '\u27F3 Refreshing...' : '\u21BB Refresh Creators'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 320px', gap: 16, padding: '0 24px 40px', maxWidth: 1400, margin: '0 auto', width: '100%', flex: 1 }}>
        {/* LEFT \u2014 Filters */}
        <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, height: 'fit-content' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 12 }}>Filters</div>
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search @handle..."
            style={{ width: '100%', height: 34, padding: '0 10px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 12, color: '#374151', background: '#FAFAFA', boxSizing: 'border-box' as const, marginBottom: 8 }} />
          <select value={filterNiche} onChange={e => setFilterNiche(e.target.value)} style={selectStyle}>
            <option value="">All Niches</option>
            {NICHES.map(n => <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>)}
          </select>
          <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)} style={selectStyle}>
            <option value="">All Regions</option>
            {Object.entries(REGION_FLAGS).map(([code, flag]) => <option key={code} value={code}>{flag} {code}</option>)}
          </select>
          <select value={filterEngagement} onChange={e => setFilterEngagement(e.target.value)} style={selectStyle}>
            <option value="">All Engagement</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} style={selectStyle}>
            <option value="engagement">Sort: Engagement</option>
            <option value="followers">Sort: Followers</option>
            <option value="recent">Sort: Recent</option>
          </select>
          {(searchQ || filterNiche || filterRegion || filterEngagement) && (
            <button onClick={() => { setSearchQ(''); setFilterNiche(''); setFilterRegion(''); setFilterEngagement(''); }}
              style={{ width: '100%', marginTop: 8, height: 30, background: 'none', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 11, color: '#9CA3AF', cursor: 'pointer' }}>
              \u2715 Reset filters
            </button>
          )}
        </div>

        {/* CENTER \u2014 Creator grid */}
        <div>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center' as const, color: '#9CA3AF', fontSize: 14 }}>Loading creators...</div>
          ) : filtered.length === 0 ? (
            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 60, textAlign: 'center' as const }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{'👤'}</div>
              <div style={{ fontFamily: brico, fontWeight: 700, fontSize: 16, color: '#0A0A0A', marginBottom: 6 }}>No creators yet</div>
              <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 16 }}>Click "Refresh Creators" to scrape TikTok creators for your niche</div>
              <button onClick={triggerRefresh} disabled={refreshing}
                style={{ height: 38, padding: '0 20px', background: '#6366F1', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Start Scraping
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {filtered.map(c => {
                const eng = ENGAGEMENT_STYLE[c.engagement_signal] || ENGAGEMENT_STYLE.LOW;
                const initial = c.display_name.charAt(0).toUpperCase();
                const isSelected = selected?.handle === c.handle;
                return (
                  <div key={c.handle} onClick={() => { setSelected(c); setOutreach(''); }}
                    style={{ background: isSelected ? '#EEF2FF' : 'white', border: `1px solid ${isSelected ? '#6366F1' : '#E5E7EB'}`, borderRadius: 12, padding: 16, cursor: 'pointer', transition: 'all 150ms' }}>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#6366F1', flexShrink: 0 }}>
                        {initial}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <a href={c.profile_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                          style={{ fontSize: 13, fontWeight: 700, color: '#6366F1', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                          {c.handle}
                        </a>
                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>{c.est_followers} followers · {REGION_FLAGS[c.region_code] || ''} {c.region_code}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const, marginBottom: 8 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: '#EEF2FF', color: '#6366F1' }}>{c.niche}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: eng.bg, color: eng.color }}>{c.engagement_signal}</span>
                      {c.contact_hint && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: '#ECFDF5', color: '#065F46' }}>Has contact</span>}
                    </div>
                    {c.promoting_products.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const, marginBottom: 10 }}>
                        {c.promoting_products.map((p, i) => (
                          <span key={i} style={{ fontSize: 9, color: '#6B7280', background: '#F5F5F5', padding: '1px 6px', borderRadius: 10 }}>{p.slice(0, 25)}</span>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <a href={c.profile_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                        style={{ flex: 1, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F5', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 600, color: '#374151', textDecoration: 'none', cursor: 'pointer' }}>
                        View Profile
                      </a>
                      {c.contact_hint ? (
                        <button onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(c.contact_hint!); }}
                          style={{ flex: 1, height: 30, background: '#ECFDF5', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 600, color: '#065F46', cursor: 'pointer' }}>
                          Copy Contact
                        </button>
                      ) : (
                        <button onClick={e => { e.stopPropagation(); setSelected(c); generateOutreach(c); }}
                          style={{ flex: 1, height: 30, background: '#EEF2FF', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 600, color: '#6366F1', cursor: 'pointer' }}>
                          AI Pitch
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT \u2014 Selected creator detail */}
        <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, height: 'fit-content' }}>
          {!selected ? (
            <div style={{ textAlign: 'center' as const, padding: '40px 0', color: '#9CA3AF', fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{'👆'}</div>
              Select a creator to see details
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#6366F1' }}>
                  {selected.display_name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontFamily: brico, fontWeight: 700, fontSize: 15, color: '#0A0A0A' }}>{selected.display_name}</div>
                  <a href={selected.profile_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#6366F1' }}>{selected.handle}</a>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                {[
                  { label: 'Followers', value: selected.est_followers },
                  { label: 'Region', value: `${REGION_FLAGS[selected.region_code] || ''} ${selected.region_code}` },
                  { label: 'Niche', value: selected.niche },
                  { label: 'Engagement', value: selected.engagement_signal },
                ].map(s => (
                  <div key={s.label} style={{ background: '#FAFAFA', borderRadius: 8, padding: '8px 10px' }}>
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
              {selected.contact_hint && (
                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 8, padding: '10px 12px', marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#065F46', marginBottom: 4 }}>Contact</div>
                  <div style={{ fontSize: 12, color: '#065F46', wordBreak: 'break-all' as const }}>{selected.contact_hint}</div>
                  <button onClick={() => navigator.clipboard.writeText(selected.contact_hint!)}
                    style={{ marginTop: 6, fontSize: 10, color: '#065F46', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}>
                    Copy →
                  </button>
                </div>
              )}
              <button onClick={() => generateOutreach(selected)} disabled={outreachLoading}
                style={{ width: '100%', height: 38, background: '#6366F1', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 12, opacity: outreachLoading ? 0.7 : 1 }}>
                {outreachLoading ? 'Generating...' : 'Suggest Outreach Message'}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
