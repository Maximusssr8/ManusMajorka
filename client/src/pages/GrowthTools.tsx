import { useIsMobile } from '@/hooks/useIsMobile';
import { useState, useRef } from 'react';
import React from 'react';

const brico = "'Bricolage Grotesque', sans-serif";

// ── AI caller ──────────────────────────────────────────────────────────────
async function callAI(tool: string, params: Record<string, string | undefined>): Promise<string> {
  const r = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool, ...Object.fromEntries(Object.entries(params).filter(([,v]) => v !== undefined)) }),
  });
  const d = await r.json();
  return d.result || d.content || d.text || '';
}

// ── Copy button ────────────────────────────────────────────────────────────
function CopyBtn({ text, small }: { text: string; small?: boolean }) {
  const isMobile = useIsMobile();
  const [done, setDone] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setDone(true);
    setTimeout(() => setDone(false), 2000);
  };
  return (
    <button onClick={copy} style={{ height: small ? 24 : 28, padding: '0 10px', background: done ? '#D1FAE5' : '#EEF2FF', color: done ? '#065F46' : '#6366F1', border: 'none', borderRadius: 6, fontSize: small ? 10 : 11, fontWeight: 700, cursor: 'pointer', transition: 'all 150ms', flexShrink: 0 }}>
      {done ? '✓ Copied' : 'Copy'}
    </button>
  );
}

// ── Output block ───────────────────────────────────────────────────────────
function Output({ text, label }: { text: string; label?: string }) {
  if (!text) return null;
  return (
    <div style={{ background: '#F8F8FF', border: '1px solid #E0E7FF', borderRadius: 10, padding: 14, marginTop: 10 }}>
      {label && <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 6 }}>{label}</div>}
      <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap' as const }}>{text}</div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <CopyBtn text={text} />
      </div>
    </div>
  );
}

// ── HERO: Full Launch Pack ─────────────────────────────────────────────────
function LaunchPack() {
  const [product, setProduct] = useState('');
  const [niche, setNiche] = useState('');
  const [region, setRegion] = useState('AU');
  const [loading, setLoading] = useState(false);
  const [pack, setPack] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState(0);

  const sections = [
    { key: 'meta_ads', label: '📘 Meta Ad (3 variants)', icon: '📘' },
    { key: 'tiktok_hooks', label: '🎵 TikTok Hooks (3)', icon: '🎵' },
    { key: 'product_desc', label: '🛍️ Product Description', icon: '🛍️' },
    { key: 'email_subject', label: '📧 Email Subject Lines (5)', icon: '📧' },
    { key: 'hashtags', label: '#️⃣ Hashtags (15)', icon: '#️⃣' },
    { key: 'store_names', label: '✨ Store Name Ideas (5)', icon: '✨' },
  ];

  const generate = async () => {
    if (!product.trim()) return;
    setLoading(true);
    setPack({});
    setProgress(0);

    const tools = [
      { key: 'meta_ads',      tool: 'ad_copy',          params: { product, niche, platform: 'Meta', tone: 'Urgent', region } },
      { key: 'tiktok_hooks',  tool: 'tiktok_hooks',      params: { product, niche, region } },
      { key: 'product_desc',  tool: 'product_description', params: { product, features: niche, audience: region + ' Shoppers' } },
      { key: 'email_subject', tool: 'email_subject_lines', params: { product, brand: niche || 'our store', type: 'launch' } },
      { key: 'hashtags',      tool: 'hashtags',          params: { product, niche, region } },
      { key: 'store_names',   tool: 'store_name',        params: { niche: niche || product, region } },
    ];

    for (let i = 0; i < tools.length; i++) {
      const t = tools[i];
      try {
        const result = await callAI(t.tool, t.params);
        setPack(prev => ({ ...prev, [t.key]: result }));
      } catch {}
      setProgress(Math.round(((i + 1) / tools.length) * 100));
    }
    setLoading(false);
  };

  const allText = sections.map(s => `## ${s.label}\n${pack[s.key] || ''}`).join('\n\n');
  const hasPack = Object.keys(pack).length > 0;

  return (
    <div style={{ background: 'white', border: '1.5px solid #6366F1', borderRadius: 16, overflow: 'hidden', marginBottom: 24, boxShadow: '0 4px 24px rgba(99,102,241,0.08)' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 22 }}>🚀</span>
            <span style={{ fontFamily: brico, fontWeight: 800, fontSize: 18, color: 'white' }}>Full Launch Pack</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#A5B4FC', background: '#D1D5DB', padding: '2px 8px', borderRadius: 10 }}>MAJORKA EXCLUSIVE</span>
          </div>
          <p style={{ fontSize: 12, color: '#C7D2FE', margin: 0 }}>
            One product → complete marketing kit: Meta ads, TikTok hooks, description, emails, hashtags + store names
          </p>
        </div>
        {hasPack && (
          <button onClick={() => { navigator.clipboard.writeText(allText); }}
            style={{ height: 32, padding: '0 14px', background: '#D1D5DB', color: 'white', border: '1px solid #9CA3AF', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
            📋 Copy All
          </button>
        )}
      </div>

      <div style={{ padding: '20px 24px' }}>
        {/* Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: 10, marginBottom: 14, alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', display: 'block', marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Product Name *</label>
            <input value={product} onChange={e => setProduct(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && generate()}
              placeholder="e.g. LED Face Mask Pro"
              style={{ width: '100%', height: 40, padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, background: '#FAFAFA', boxSizing: 'border-box' as const, color: '#0A0A0A' }} />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', display: 'block', marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Niche</label>
            <input value={niche} onChange={e => setNiche(e.target.value)}
              placeholder="e.g. Beauty & Skincare"
              style={{ width: '100%', height: 40, padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, background: '#FAFAFA', boxSizing: 'border-box' as const, color: '#0A0A0A' }} />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', display: 'block', marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Market</label>
            <select value={region} onChange={e => setRegion(e.target.value)}
              style={{ height: 40, padding: '0 10px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, background: 'white', cursor: 'pointer' }}>
              {[['AU','🇦🇺 AU'],['US','🇺🇸 US'],['UK','🇬🇧 UK'],['CA','🇨🇦 CA']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <button onClick={generate} disabled={loading || !product.trim()}
            style={{ height: 40, padding: '0 24px', background: loading ? '#9CA3AF' : 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' as const }}>
            {loading ? `${progress}%…` : '⚡ Generate Pack'}
          </button>
        </div>

        {/* Progress bar */}
        {loading && (
          <div style={{ height: 3, background: '#EEF2FF', borderRadius: 99, marginBottom: 16, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #6366F1, #8B5CF6)', borderRadius: 99, transition: 'width 400ms' }} />
          </div>
        )}

        {/* Output grid */}
        {hasPack && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {sections.map(s => (
              <div key={s.key} style={{ background: '#FAFAFA', border: `1px solid ${pack[s.key] ? '#E0E7FF' : '#F3F4F6'}`, borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: pack[s.key] ? '#6366F1' : '#9CA3AF' }}>{s.label}</div>
                  {pack[s.key] && <CopyBtn text={pack[s.key]} small />}
                </div>
                {pack[s.key] ? (
                  <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap' as const, maxHeight: 120, overflowY: 'auto' as const }}>{pack[s.key]}</div>
                ) : (
                  <div style={{ fontSize: 11, color: '#D1D5DB', fontStyle: 'italic' }}>
                    {loading ? '✍️ Generating…' : 'Not generated'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!hasPack && !loading && (
          <div style={{ textAlign: 'center' as const, padding: '24px 0', color: '#9CA3AF', fontSize: 13 }}>
            Enter a product name above → get a complete marketing kit in ~30 seconds
          </div>
        )}
      </div>
    </div>
  );
}

// ── Individual tool card ───────────────────────────────────────────────────
function ToolCard({ icon, title, desc, children }: { icon: string; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <div>
            <div style={{ fontFamily: brico, fontWeight: 700, fontSize: 14, color: '#0A0A0A' }}>{title}</div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{desc}</div>
          </div>
        </div>
      </div>
      <div style={{ padding: '16px 20px' }}>{children}</div>
    </div>
  );
}

// ── Tool: Ad Copy ──────────────────────────────────────────────────────────
function AdCopyTool() {
  const [product, setProduct] = useState('');
  const [platform, setPlatform] = useState('Meta');
  const [tone, setTone] = useState('Urgent');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const run = async () => {
    if (!product.trim()) return;
    setLoading(true);
    setResult(await callAI('ad_copy', { product, platform, tone, region: 'AU' }));
    setLoading(false);
  };

  return (
    <ToolCard icon="📣" title="Ad Copy Generator" desc="Meta, TikTok & Google ad copy in seconds">
      <div style={{ display: 'grid', gap: 8 }}>
        <input value={product} onChange={e => setProduct(e.target.value)} placeholder="Product name (e.g. Posture Corrector)"
          style={{ height: 38, padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, background: '#FAFAFA', color: '#0A0A0A' }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {['Meta', 'TikTok', 'Google'].map(p => (
            <button key={p} onClick={() => setPlatform(p)}
              style={{ flex: 1, height: 32, background: platform === p ? '#6366F1' : '#F5F5F5', color: platform === p ? 'white' : '#374151', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              {p}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['Urgent', 'Casual', 'Premium'].map(t => (
            <button key={t} onClick={() => setTone(t)}
              style={{ flex: 1, height: 30, background: tone === t ? '#EEF2FF' : '#F9FAFB', color: tone === t ? '#6366F1' : '#6B7280', border: `1px solid ${tone === t ? '#C7D2FE' : '#E5E7EB'}`, borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              {t}
            </button>
          ))}
        </div>
        <button onClick={run} disabled={loading || !product.trim()}
          style={{ height: 38, background: loading ? '#9CA3AF' : '#6366F1', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Generating…' : 'Generate Ad Copy →'}
        </button>
        <Output text={result} />
      </div>
    </ToolCard>
  );
}

// ── Tool: Product Description ──────────────────────────────────────────────
function DescriptionTool() {
  const [product, setProduct] = useState('');
  const [features, setFeatures] = useState('');
  const [audience, setAudience] = useState('AU Shoppers (General)');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const run = async () => {
    if (!product.trim()) return;
    setLoading(true);
    setResult(await callAI('product_description', { product, features, audience }));
    setLoading(false);
  };

  return (
    <ToolCard icon="✍️" title="Product Description" desc="SEO-optimised copy for your store">
      <div style={{ display: 'grid', gap: 8 }}>
        <input value={product} onChange={e => setProduct(e.target.value)} placeholder="Product name"
          style={{ height: 38, padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, background: '#FAFAFA', color: '#0A0A0A' }} />
        <textarea value={features} onChange={e => setFeatures(e.target.value)} rows={2} placeholder="Key features (2-3 bullet points)"
          style={{ padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 12, background: '#FAFAFA', color: '#0A0A0A', resize: 'none' as const, fontFamily: 'inherit' }} />
        <select value={audience} onChange={e => setAudience(e.target.value)}
          style={{ height: 38, padding: '0 10px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, background: 'white', cursor: 'pointer', color: '#374151' }}>
          {['AU Shoppers (General)','US Shoppers (General)','Beauty Enthusiasts','Fitness & Health','Pet Owners','Tech Lovers','Home Improvers'].map(a => <option key={a}>{a}</option>)}
        </select>
        <button onClick={run} disabled={loading || !product.trim()}
          style={{ height: 38, background: loading ? '#9CA3AF' : '#6366F1', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Generating…' : 'Generate Description →'}
        </button>
        <Output text={result} />
      </div>
    </ToolCard>
  );
}

// ── Tool: Email Templates ──────────────────────────────────────────────────
function EmailTool() {
  const [brand, setBrand] = useState('');
  const [type, setType] = useState<'Abandoned Cart' | 'Welcome' | 'Win-Back' | 'Launch'>('Abandoned Cart');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const run = async () => {
    setLoading(true);
    setResult(await callAI('email_template', { brand: brand || 'our store', type, region: 'AU' }));
    setLoading(false);
  };

  return (
    <ToolCard icon="📧" title="Email Templates" desc="Abandoned cart, welcome, win-back & launch">
      <div style={{ display: 'grid', gap: 8 }}>
        <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="Brand name (e.g. PureGlow AU)"
          style={{ height: 38, padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, background: '#FAFAFA', color: '#0A0A0A' }} />
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const }}>
          {(['Abandoned Cart', 'Welcome', 'Win-Back', 'Launch'] as const).map(t => (
            <button key={t} onClick={() => setType(t)}
              style={{ height: 30, padding: '0 10px', background: type === t ? '#6366F1' : '#F5F5F5', color: type === t ? 'white' : '#374151', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              {t}
            </button>
          ))}
        </div>
        <button onClick={run} disabled={loading}
          style={{ height: 38, background: loading ? '#9CA3AF' : '#6366F1', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Generating…' : 'Generate Email →'}
        </button>
        <Output text={result} />
      </div>
    </ToolCard>
  );
}

// ── Tool: TikTok Script ────────────────────────────────────────────────────
function TikTokTool() {
  const [product, setProduct] = useState('');
  const [format, setFormat] = useState('POV');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const run = async () => {
    if (!product.trim()) return;
    setLoading(true);
    setResult(await callAI('tiktok_script', { product, format, duration: '60' }));
    setLoading(false);
  };

  return (
    <ToolCard icon="🎵" title="TikTok Script" desc="Hook → demo → CTA in 60 seconds">
      <div style={{ display: 'grid', gap: 8 }}>
        <input value={product} onChange={e => setProduct(e.target.value)} placeholder="Product name"
          style={{ height: 38, padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, background: '#FAFAFA', color: '#0A0A0A' }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {['POV', 'Review', 'Demo', 'Unboxing'].map(f => (
            <button key={f} onClick={() => setFormat(f)}
              style={{ flex: 1, height: 30, background: format === f ? '#6366F1' : '#F5F5F5', color: format === f ? 'white' : '#374151', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              {f}
            </button>
          ))}
        </div>
        <button onClick={run} disabled={loading || !product.trim()}
          style={{ height: 38, background: loading ? '#9CA3AF' : '#6366F1', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Generating…' : 'Generate Script →'}
        </button>
        <Output text={result} />
      </div>
    </ToolCard>
  );
}

// ── Tool: Store Name Generator ─────────────────────────────────────────────
function NameTool() {
  const [niche, setNiche] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const run = async () => {
    if (!niche.trim()) return;
    setLoading(true);
    setResult(await callAI('store_name', { niche, region: 'AU' }));
    setLoading(false);
  };

  return (
    <ToolCard icon="✨" title="Store Name Generator" desc="Brand name ideas for your niche">
      <div style={{ display: 'grid', gap: 8 }}>
        <input value={niche} onChange={e => setNiche(e.target.value)} placeholder="Niche (e.g. pet accessories)"
          style={{ height: 38, padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, background: '#FAFAFA', color: '#0A0A0A' }} />
        <button onClick={run} disabled={loading || !niche.trim()}
          style={{ height: 38, background: loading ? '#9CA3AF' : '#6366F1', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Generating…' : 'Generate Names →'}
        </button>
        <Output text={result} />
      </div>
    </ToolCard>
  );
}

// ── Tool: Hashtag Research ─────────────────────────────────────────────────
function HashtagTool() {
  const [product, setProduct] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const run = async () => {
    if (!product.trim()) return;
    setLoading(true);
    setResult(await callAI('hashtags', { product, niche: product, region: 'AU' }));
    setLoading(false);
  };

  return (
    <ToolCard icon="#️⃣" title="Hashtag Research" desc="TikTok & Instagram hashtag packs">
      <div style={{ display: 'grid', gap: 8 }}>
        <input value={product} onChange={e => setProduct(e.target.value)} placeholder="Product or niche"
          style={{ height: 38, padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, background: '#FAFAFA', color: '#0A0A0A' }} />
        <button onClick={run} disabled={loading || !product.trim()}
          style={{ height: 38, background: loading ? '#9CA3AF' : '#6366F1', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Generating…' : 'Generate Hashtags →'}
        </button>
        {result && (
          <div style={{ background: '#F8F8FF', border: '1px solid #E0E7FF', borderRadius: 10, padding: 12, marginTop: 4 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5 }}>
              {result.split(/[\s,\n]+/).filter(h => h.startsWith('#')).map((h, i) => (
                <button key={i} onClick={() => navigator.clipboard.writeText(h)}
                  style={{ fontSize: 11, fontWeight: 600, color: '#6366F1', background: '#EEF2FF', border: 'none', padding: '3px 8px', borderRadius: 20, cursor: 'pointer' }}>
                  {h}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <CopyBtn text={result} />
            </div>
          </div>
        )}
      </div>
    </ToolCard>
  );
}

// ── Main export ────────────────────────────────────────────────────────────
export default function GrowthTools() {
  React.useEffect(() => { document.title = 'Growth Tools | Majorka'; }, []);
  const isMobile = useIsMobile();
  return (
    <div style={{ background: '#FAFAFA', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '16px 28px' }}>
        <h1 style={{ fontFamily: brico, fontWeight: 800, fontSize: 20, color: '#0A0A0A', margin: 0 }}>Growth Tools</h1>
        <p style={{ fontSize: 12, color: '#9CA3AF', margin: '3px 0 0' }}>AI-powered marketing tools — from one product to a full launch kit</p>
      </div>

      <div style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto' }}>
        {/* Launch Pack hero */}
        <LaunchPack />

        {/* Individual tools 3-col grid */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 14 }}>Individual Tools</div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 14 }}>
            <AdCopyTool />
            <DescriptionTool />
            <EmailTool />
            <TikTokTool />
            <NameTool />
            <HashtagTool />
          </div>
        </div>
      </div>
    </div>
  );
}
