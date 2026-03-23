import { useEffect, useState } from 'react';

const brico = "'Bricolage Grotesque', sans-serif";
const FORMATS = ['POV', 'REVIEW', 'UNBOXING', 'DEMO', 'LIFESTYLE'] as const;
const FORMAT_EMOJI: Record<string, string> = { POV: '\u{1F441}\u{FE0F}', REVIEW: '\u2B50', UNBOXING: '\u{1F4E6}', DEMO: '\u{1F3AC}', LIFESTYLE: '\u2728' };
const NICHES = ['beauty', 'fitness', 'home decor', 'pet care', 'tech accessories', 'fashion', 'health', 'kitchen'];

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
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiTab, setAiTab] = useState<'hooks' | 'script' | 'livestream'>('hooks');
  const [selectedNiche, setSelectedNiche] = useState('beauty');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState('');
  const [scriptProduct, setScriptProduct] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/videos?niche=${selectedNiche}&limit=20`)
      .then(r => r.json())
      .then(d => setVideos(d.videos || []))
      .catch(() => setVideos([]))
      .finally(() => setLoading(false));
  }, [selectedNiche]);

  const formatCounts = FORMATS.reduce((acc, f) => {
    acc[f] = videos.filter(v => v.format === f).length;
    return acc;
  }, {} as Record<string, number>);

  const hooks = videos.filter(v => v.hook_text).map(v => ({ hook: v.hook_text!, niche: v.niche, format: v.format }));

  const generateContent = async () => {
    setAiLoading(true);
    setAiOutput('');
    try {
      const r = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: aiTab === 'script' ? 'TikTok Script' : aiTab === 'livestream' ? 'Livestream Script' : 'Hooks',
          niche: selectedNiche,
          product: scriptProduct || selectedNiche,
          format: 'DEMO',
        }),
      });
      const d = await r.json();
      setAiOutput(d.content || d.result || 'No output generated.');
    } catch { setAiOutput('Error generating content.'); }
    setAiLoading(false);
  };

  const triggerRefresh = async () => {
    setRefreshing(true);
    await fetch('/api/admin/refresh-videos', { method: 'POST' });
    setTimeout(() => {
      fetch(`/api/videos?niche=${selectedNiche}&limit=20`).then(r => r.json()).then(d => setVideos(d.videos || []));
      setRefreshing(false);
    }, 5000);
  };

  return (
    <div style={{ background: '#FAFAFA', minHeight: '100vh', padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: brico, fontWeight: 800, fontSize: 22, color: '#0A0A0A', margin: 0 }}>Video Intelligence</h1>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4, marginBottom: 0 }}>Top-performing TikTok product videos. AI script generator included.</p>
        </div>
        <button onClick={triggerRefresh} disabled={refreshing}
          style={{ height: 36, padding: '0 16px', background: refreshing ? '#9CA3AF' : '#6366F1', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {refreshing ? '\u27F3 Refreshing...' : '\u21BB Refresh Videos'}
        </button>
      </div>

      {/* Niche selector */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: 16 }}>
        {NICHES.map(n => (
          <button key={n} onClick={() => setSelectedNiche(n)}
            style={{ height: 30, padding: '0 12px', background: selectedNiche === n ? '#6366F1' : 'white', color: selectedNiche === n ? 'white' : '#374151', border: `1px solid ${selectedNiche === n ? '#6366F1' : '#E5E7EB'}`, borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' as const }}>
            {n}
          </button>
        ))}
      </div>

      {/* Format breakdown */}
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '14px 20px', marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' as const }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', alignSelf: 'center' }}>FORMAT BREAKDOWN</span>
        {FORMATS.map(f => {
          const count = formatCounts[f] || 0;
          const pct = videos.length > 0 ? Math.round((count / videos.length) * 100) : 0;
          return (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14 }}>{FORMAT_EMOJI[f]}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{f}</span>
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>{count} ({pct}%)</span>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
        {/* Video feed */}
        <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' as const }}>
            {videos.length} Videos \u00B7 {selectedNiche}
          </div>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' as const, color: '#9CA3AF' }}>Loading...</div>
          ) : videos.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' as const }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{'🎬'}</div>
              <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 12 }}>No videos yet. Click Refresh to scrape TikTok.</div>
              <button onClick={triggerRefresh} style={{ height: 34, padding: '0 16px', background: '#6366F1', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Scrape Now
              </button>
            </div>
          ) : (
            <div style={{ maxHeight: 600, overflowY: 'auto' as const }}>
              {videos.map((v, i) => (
                <div key={i} style={{ padding: '10px 16px', borderBottom: '1px solid #F9FAFB', display: 'flex', gap: 10 }}>
                  <div style={{ width: 40, height: 52, background: '#EEF2FF', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {FORMAT_EMOJI[v.format] || '\u{1F3AC}'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#0A0A0A', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{v.title}</div>
                    {v.hook_text && <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4, fontStyle: 'italic' }}>"{v.hook_text.slice(0, 80)}..."</div>}
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' as const }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#6366F1', background: '#EEF2FF', padding: '1px 6px', borderRadius: 8 }}>{v.format}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: v.engagement_signal === 'VIRAL' ? '#DC2626' : '#059669', background: v.engagement_signal === 'VIRAL' ? '#FEE2E2' : '#D1FAE5', padding: '1px 6px', borderRadius: 8 }}>{v.engagement_signal}</span>
                      <span style={{ fontSize: 9, color: '#9CA3AF' }}>{v.product_mentioned.slice(0, 40)}</span>
                    </div>
                  </div>
                  <a href={v.url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 11, color: '#6366F1', fontWeight: 600, textDecoration: 'none', alignSelf: 'center', flexShrink: 0 }}>
                    Open \u2192
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Hook Library + AI Generator */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid #F3F4F6', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' as const }}>
              Top Converting Hooks
            </div>
            <div style={{ maxHeight: 220, overflowY: 'auto' as const }}>
              {hooks.length === 0 ? (
                <div style={{ padding: 20, fontSize: 12, color: '#9CA3AF', textAlign: 'center' as const }}>Load videos to see hooks</div>
              ) : hooks.slice(0, 10).map((h, i) => (
                <div key={i} style={{ padding: '8px 14px', borderBottom: '1px solid #F9FAFB', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 10, color: '#9CA3AF', flexShrink: 0, marginTop: 1 }}>#{i + 1}</span>
                  <div style={{ flex: 1, fontSize: 11, color: '#374151', fontStyle: 'italic', lineHeight: 1.4 }}>"{h.hook.slice(0, 80)}"</div>
                  <button onClick={() => navigator.clipboard.writeText(h.hook)}
                    style={{ fontSize: 9, color: '#6366F1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, flexShrink: 0 }}>
                    Copy
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 14, flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 10 }}>
              AI Content Generator
            </div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
              {(['hooks', 'script', 'livestream'] as const).map(t => (
                <button key={t} onClick={() => setAiTab(t)}
                  style={{ flex: 1, height: 28, background: aiTab === t ? '#6366F1' : '#F5F5F5', color: aiTab === t ? 'white' : '#374151', border: 'none', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' as const }}>
                  {t === 'livestream' ? 'Live' : t}
                </button>
              ))}
            </div>
            <input value={scriptProduct} onChange={e => setScriptProduct(e.target.value)}
              placeholder="Product name (optional)"
              style={{ width: '100%', height: 32, padding: '0 10px', border: '1px solid #E5E7EB', borderRadius: 7, fontSize: 11, background: '#FAFAFA', boxSizing: 'border-box' as const, marginBottom: 8 }} />
            <button onClick={generateContent} disabled={aiLoading}
              style={{ width: '100%', height: 34, background: '#6366F1', color: 'white', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', marginBottom: aiOutput ? 8 : 0, opacity: aiLoading ? 0.7 : 1 }}>
              {aiLoading ? 'Generating...' : `Generate ${aiTab === 'hooks' ? '3 Hooks' : aiTab === 'script' ? '60s Script' : 'Live Script'}`}
            </button>
            {aiOutput && (
              <div style={{ background: '#F8F8FF', border: '1px solid #E0E7FF', borderRadius: 7, padding: 10, maxHeight: 200, overflowY: 'auto' as const }}>
                <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap' as const }}>{aiOutput}</div>
                <button onClick={() => navigator.clipboard.writeText(aiOutput)}
                  style={{ marginTop: 6, fontSize: 10, color: '#6366F1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  Copy all \u2192
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
