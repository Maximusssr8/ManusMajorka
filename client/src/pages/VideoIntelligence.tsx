import { useEffect, useState, useMemo } from 'react';

const brico = "'Bricolage Grotesque', sans-serif";

const FORMAT_META: Record<string, { emoji: string; color: string; bg: string; desc: string }> = {
  POV:       { emoji: '👁️', color: '#7C3AED', bg: '#F3E8FF', desc: 'First-person story' },
  REVIEW:    { emoji: '⭐', color: '#B45309', bg: '#FEF3C7', desc: 'Honest opinion' },
  UNBOXING:  { emoji: '📦', color: '#0369A1', bg: '#E0F2FE', desc: 'First look reveal' },
  DEMO:      { emoji: '🎬', color: '#065F46', bg: '#D1FAE5', desc: 'Product in action' },
  LIFESTYLE: { emoji: '✨', color: '#6366F1', bg: '#EEF2FF', desc: 'Organic placement' },
};

const SIGNAL_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  VIRAL:  { label: '🔥 VIRAL',  color: '#DC2626', bg: '#FEF2F2',  dot: '#DC2626' },
  HIGH:   { label: '📈 HIGH',   color: '#059669', bg: '#D1FAE5',  dot: '#059669' },
  MEDIUM: { label: '📊 MEDIUM', color: '#B45309', bg: '#FEF3C7',  dot: '#D97706' },
};

const NICHES = ['beauty','fitness','home decor','pet care','tech accessories','fashion','health','kitchen'];

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
}

export default function VideoIntelligence() {
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

  // Load ALL videos once, filter client-side
  useEffect(() => {
    setLoading(true);
    fetch('/api/videos?limit=50')
      .then(r => r.json())
      .then(d => setAllVideos(Array.isArray(d.videos) ? d.videos : []))
      .catch(() => setAllVideos([]))
      .finally(() => setLoading(false));
  }, []);

  const videos = useMemo(() => {
    if (!selectedNiche) return allVideos;
    return allVideos.filter(v => v.niche?.toLowerCase() === selectedNiche.toLowerCase());
  }, [allVideos, selectedNiche]);

  const hooks = useMemo(() =>
    allVideos.filter(v => v.hook_text && v.hook_text.length > 15)
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
      await fetch('/api/admin/refresh-videos', { method: 'POST' });
      showToast('Scraping videos in background — refresh in ~60 seconds');
      setTimeout(() => {
        fetch('/api/videos?limit=50').then(r => r.json()).then(d => {
          if (Array.isArray(d.videos)) setAllVideos(d.videos);
        });
        setRefreshing(false);
      }, 60000);
    } catch {
      showToast('Scrape failed — Tavily resets daily');
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
          type: aiTab === 'script' ? 'TikTok Script' : aiTab === 'live' ? 'Livestream Script' : 'TikTok Script',
          niche: selectedNiche || 'general',
          product: aiProduct || selectedNiche || 'trending product',
        }),
      });
      const d = await r.json();
      setAiOutput(d.content || d.result || 'No output. Try again.');
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

  return (
    <div style={{ background: '#FAFAFA', minHeight: '100vh' }}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '16px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: brico, fontWeight: 800, fontSize: 20, color: '#0A0A0A', margin: 0 }}>Video Intelligence</h1>
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: '3px 0 0' }}>
            {loading ? 'Loading…' : `${videos.length} videos tracked`}
          </p>
        </div>
        <button onClick={triggerRefresh} disabled={refreshing}
          style={{ height: 36, padding: '0 16px', background: refreshing ? '#9CA3AF' : '#6366F1', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: refreshing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14 }}>{refreshing ? '⟳' : '↻'}</span>
          {refreshing ? 'Scraping…' : 'Refresh'}
        </button>
      </div>

      <div style={{ padding: '20px 28px', maxWidth: 1360, margin: '0 auto' }}>

        {/* ── Niche pills ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: 18 }}>
          <button onClick={() => setSelectedNiche('')}
            style={{ height: 30, padding: '0 14px', background: selectedNiche === '' ? '#0A0A0A' : 'white', color: selectedNiche === '' ? 'white' : '#374151', border: '1px solid #E5E7EB', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
            All ({allVideos.length})
          </button>
          {NICHES.map(n => {
            const count = allVideos.filter(v => v.niche?.toLowerCase() === n).length;
            return (
              <button key={n} onClick={() => setSelectedNiche(selectedNiche === n ? '' : n)}
                style={{ height: 30, padding: '0 14px', background: selectedNiche === n ? '#6366F1' : 'white', color: selectedNiche === n ? 'white' : count === 0 ? '#D1D5DB' : '#374151', border: `1px solid ${selectedNiche === n ? '#6366F1' : '#E5E7EB'}`, borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' as const }}>
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
                  <div key={i} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, height: 140, animation: 'pulse 1.5s infinite' }} />
                ))}
              </div>
            ) : videos.length === 0 ? (
              <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 16, padding: '60px 24px', textAlign: 'center' as const }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎬</div>
                <div style={{ fontFamily: brico, fontWeight: 700, fontSize: 18, color: '#0A0A0A', marginBottom: 6 }}>
                  {selectedNiche ? `No videos for "${selectedNiche}" yet` : 'No videos loaded'}
                </div>
                <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 20, maxWidth: 320, margin: '0 auto 20px' }}>
                  {selectedNiche ? 'Try a different niche or click All to see all videos' : 'Click Refresh to scrape trending TikTok product videos'}
                </div>
                {selectedNiche ? (
                  <button onClick={() => setSelectedNiche('')}
                    style={{ height: 36, padding: '0 20px', background: '#6366F1', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Show all videos
                  </button>
                ) : (
                  <button onClick={triggerRefresh} disabled={refreshing}
                    style={{ height: 36, padding: '0 20px', background: '#6366F1', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Scrape Now
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {videos.map((v, i) => {
                  const fmt = FORMAT_META[v.format] || FORMAT_META.LIFESTYLE;
                  const sig = SIGNAL_META[v.engagement_signal] || SIGNAL_META.MEDIUM;
                  return (
                    <div key={v.id || i}
                      style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', transition: 'box-shadow 150ms', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px #E5E7EB')}
                      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>

                      {/* Thumbnail strip */}
                      <div style={{ height: 6, background: `linear-gradient(90deg, ${fmt.color}33, ${fmt.color}11)` }} />

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
                        <div style={{ fontFamily: brico, fontWeight: 700, fontSize: 13, color: '#0A0A0A', marginBottom: 5, lineHeight: 1.3 }}>
                          {v.product_mentioned || 'Unknown Product'}
                        </div>

                        {/* Hook text */}
                        {v.hook_text && (
                          <div style={{ fontSize: 11, color: '#6B7280', fontStyle: 'italic', lineHeight: 1.5, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                            "{v.hook_text}"
                          </div>
                        )}

                        {/* Footer */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <span style={{ fontSize: 9, color: '#9CA3AF', background: '#F5F5F5', padding: '1px 6px', borderRadius: 8, textTransform: 'capitalize' as const }}>{v.niche}</span>
                            <span style={{ fontSize: 9, color: '#9CA3AF', background: '#F5F5F5', padding: '1px 6px', borderRadius: 8 }}>{v.region_code}</span>
                          </div>
                          <a href={v.url} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: 11, color: '#6366F1', fontWeight: 700, textDecoration: 'none' }}
                            onClick={e => e.stopPropagation()}>
                            Open →
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
          <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6' }}>
              <div style={{ fontFamily: brico, fontWeight: 700, fontSize: 13, color: '#0A0A0A' }}>🎣 Hook Library</div>
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
                      <div style={{ flex: 1, fontSize: 12, color: '#374151', lineHeight: 1.5, fontStyle: 'italic' }}>
                        "{v.hook_text}"
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 26 }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <span style={{ fontSize: 9, color: (FORMAT_META[v.format] || FORMAT_META.LIFESTYLE).color, background: (FORMAT_META[v.format] || FORMAT_META.LIFESTYLE).bg, padding: '1px 6px', borderRadius: 8, fontWeight: 600 }}>{v.format}</span>
                        <span style={{ fontSize: 9, color: '#9CA3AF', background: '#F5F5F5', padding: '1px 6px', borderRadius: 8, textTransform: 'capitalize' as const }}>{v.niche}</span>
                      </div>
                      <button onClick={() => copyText(v.hook_text!, `hook-${i}`)}
                        style={{ fontSize: 10, fontWeight: 700, color: copied === `hook-${i}` ? '#059669' : '#6366F1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        {copied === `hook-${i}` ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: AI Generator ───────────────────────────────── */}
          <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6' }}>
              <div style={{ fontFamily: brico, fontWeight: 700, fontSize: 13, color: '#0A0A0A' }}>🤖 AI Content Generator</div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Scripts, hooks & livestream outlines</div>
            </div>
            <div style={{ padding: 14 }}>
              {/* Tabs */}
              <div style={{ display: 'flex', background: '#F5F5F5', borderRadius: 8, padding: 3, marginBottom: 12 }}>
                {(['hooks', 'script', 'live'] as const).map(t => (
                  <button key={t} onClick={() => setAiTab(t)}
                    style={{ flex: 1, height: 28, background: aiTab === t ? 'white' : 'transparent', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, color: aiTab === t ? '#0A0A0A' : '#9CA3AF', cursor: 'pointer', boxShadow: aiTab === t ? '0 1px 4px #E5E7EB' : 'none', transition: 'all 150ms', textTransform: 'capitalize' as const }}>
                    {t === 'live' ? '📡 Live' : t === 'script' ? '🎬 Script' : '🎣 Hooks'}
                  </button>
                ))}
              </div>

              {/* Product input */}
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 10, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>PRODUCT NAME</label>
                <input value={aiProduct} onChange={e => setAiProduct(e.target.value)}
                  placeholder={`e.g. ${selectedNiche === 'beauty' ? 'LED Face Mask' : selectedNiche === 'fitness' ? 'Resistance Bands' : 'viral product'}`}
                  style={{ width: '100%', height: 34, padding: '0 10px', border: '1px solid #E5E7EB', borderRadius: 7, fontSize: 12, background: '#FAFAFA', boxSizing: 'border-box' as const, color: '#0A0A0A' }} />
              </div>

              {/* Context note */}
              <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 12, background: '#F9FAFB', borderRadius: 6, padding: '6px 8px' }}>
                {aiTab === 'hooks' && '3 opening lines proven to stop the scroll in the first 3 seconds'}
                {aiTab === 'script' && '60-second script with hook → demo → CTA structure'}
                {aiTab === 'live' && 'Livestream outline with opening hook, demo points, urgency + CTA'}
              </div>

              <button onClick={generateContent} disabled={aiLoading}
                style={{ width: '100%', height: 38, background: aiLoading ? '#9CA3AF' : 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: aiLoading ? 'not-allowed' : 'pointer', marginBottom: aiOutput ? 10 : 0 }}>
                {aiLoading ? '✍️ Writing…' : `Generate ${aiTab === 'hooks' ? '3 Hooks' : aiTab === 'script' ? '60s Script' : 'Live Outline'}`}
              </button>

              {aiOutput && (
                <div style={{ background: '#F8F8FF', border: '1px solid #E0E7FF', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap' as const, maxHeight: 280, overflowY: 'auto' as const }}>{aiOutput}</div>
                  <button onClick={() => copyText(aiOutput, 'ai-out')}
                    style={{ marginTop: 8, fontSize: 10, color: copied === 'ai-out' ? '#059669' : '#6366F1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, padding: 0 }}>
                    {copied === 'ai-out' ? '✓ Copied!' : 'Copy all →'}
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
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
