import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const brico = "'Bricolage Grotesque', sans-serif";

const PLATFORMS = ['TikTok', 'Instagram', 'Facebook', 'YouTube'] as const;
type Platform = typeof PLATFORMS[number];

const CREATIVE_TYPES = [
  { id: 'ugc_script', label: '🎬 UGC Video Script', desc: 'Word-for-word UGC creator script' },
  { id: 'hook_script', label: '🪝 Hook + Script', desc: '3 hooks + full video script' },
  { id: 'ad_copy', label: '📝 Ad Copy (Static)', desc: 'Headlines, body, CTA for image ads' },
  { id: 'video_concepts', label: '💡 Video Concepts', desc: 'Creative ideas list' },
  { id: 'campaign_brief', label: '📋 Full Campaign Brief', desc: 'Complete paid campaign plan' },
] as const;

interface SavedOutput {
  id: string;
  product_name: string;
  creative_type: string;
  output: string;
  created_at: string;
}

interface MarkdownProps { text: string }
function MayaMarkdown({ text }: MarkdownProps) {
  const lines = text.split('\n');
  return (
    <div style={{ fontFamily: '-apple-system, sans-serif', fontSize: 13, color: '#1F2937', lineHeight: 1.7 }}>
      {lines.map((line, i) => {
        if (line.startsWith('## ')) return <h3 key={i} style={{ fontFamily: brico, fontWeight: 700, fontSize: 14, color: '#6366F1', margin: '16px 0 6px', letterSpacing: '0.02em' }}>{line.slice(3)}</h3>;
        if (line.startsWith('# ')) return <h2 key={i} style={{ fontFamily: brico, fontWeight: 800, fontSize: 16, color: '#0A0A0A', margin: '20px 0 8px' }}>{line.slice(2)}</h2>;
        if (line.startsWith('**') && line.endsWith('**')) return <p key={i} style={{ fontWeight: 700, color: '#0A0A0A', margin: '8px 0 2px' }}>{line.slice(2, -2)}</p>;
        if (line.startsWith('- ') || line.startsWith('• ')) return <div key={i} style={{ display: 'flex', gap: 8, margin: '3px 0' }}><span style={{ color: '#6366F1', flexShrink: 0 }}>•</span><span>{line.slice(2)}</span></div>;
        if (line.match(/^\d+\. /)) return <div key={i} style={{ display: 'flex', gap: 8, margin: '3px 0' }}><span style={{ color: '#6366F1', flexShrink: 0, fontWeight: 600 }}>{line.match(/^(\d+)\./)?.[1]}.</span><span>{line.replace(/^\d+\. /, '')}</span></div>;
        if (line === '') return <div key={i} style={{ height: 6 }} />;
        return <p key={i} style={{ margin: '2px 0' }}>{line}</p>;
      })}
    </div>
  );
}

export default function AdsStudio() {
  const [productName, setProductName] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [audience, setAudience] = useState('');
  const [price, setPrice] = useState('');
  const [benefit, setBenefit] = useState('');
  const [platforms, setPlatforms] = useState<Platform[]>(['TikTok']);
  const [creativeType, setCreativeType] = useState('hook_script');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedOutputs, setSavedOutputs] = useState<SavedOutput[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState('');
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = 'Ads Studio | Majorka';
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setToken(data.session.access_token);
        setUserId(data.session.user.id);
        loadSaved(data.session.access_token);
      }
    });
  }, []);

  async function loadSaved(tok: string) {
    try {
      const r = await fetch('/api/ai/saved-outputs', { headers: { Authorization: `Bearer ${tok}` } });
      if (!r.ok) return;
      const d = await r.json();
      setSavedOutputs((d.outputs || []).slice(0, 20));
    } catch {}
  }

  async function generate() {
    if (!productName.trim()) return;
    setLoading(true);
    setOutput('');
    setSaved(false);

    const typeLabel = CREATIVE_TYPES.find(t => t.id === creativeType)?.label || creativeType;
    const prompt = `Generate a ${typeLabel} for the following product:

Product: ${productName}
${productUrl ? `URL: ${productUrl}` : ''}
Target Audience: ${audience || 'Australian dropshipping customers'}
Price: ${price || 'not specified'}
Key Benefit: ${benefit || 'not specified'}
Platforms: ${platforms.join(', ')}

Follow the Maya Ads Studio format exactly.`;

    try {
      const r = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tool: 'ads_studio', prompt, productName, platforms, creativeType }),
      });
      const d = await r.json();
      const result = d.result || d.content || '';
      setOutput(result);
      if (outputRef.current) outputRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {
      setOutput('Failed to generate — please try again.');
    }
    setLoading(false);
  }

  async function saveOutput() {
    if (!output || !userId) return;
    setSaving(true);
    try {
      const r = await fetch('/api/ai/save-output', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productName, creativeType, output }),
      });
      if (r.ok) {
        setSaved(true);
        loadSaved(token);
      }
    } catch {}
    setSaving(false);
  }

  function togglePlatform(p: Platform) {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '16px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: brico, fontWeight: 800, fontSize: 20, color: '#0A0A0A', margin: 0 }}>Ads Studio</h1>
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: '3px 0 0' }}>Generate scroll-stopping ad creatives with Maya AI</p>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', background: '#EEF2FF', padding: '4px 10px', borderRadius: 20, border: '1px solid #C7D2FE' }}>Powered by Maya AI</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 280px', gap: 0, height: 'calc(100vh - 61px)', overflow: 'hidden' }}>

        {/* LEFT: Input Panel */}
        <div style={{ background: 'white', borderRight: '1px solid #E5E7EB', overflowY: 'auto' as const, padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 14 }}>Product Details</div>

          {[
            { label: 'Product Name *', value: productName, set: setProductName, placeholder: 'e.g. LED Light Therapy Face Mask', required: true },
            { label: 'Product URL', value: productUrl, set: setProductUrl, placeholder: 'https://yourstore.com/product' },
            { label: 'Target Audience', value: audience, set: setAudience, placeholder: 'e.g. Women 25–40, AU' },
            { label: 'Price Point', value: price, set: setPrice, placeholder: 'e.g. $39.99 AUD' },
          ].map(({ label, value, set, placeholder, required }) => (
            <div key={label} style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{label}</label>
              <input value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
                style={{ width: '100%', height: 36, padding: '0 10px', border: `1px solid ${required && !value ? '#FCA5A5' : '#E5E7EB'}`, borderRadius: 7, fontSize: 13, color: '#0A0A0A', background: '#FAFAFA', outline: 'none', boxSizing: 'border-box' as const }} />
            </div>
          ))}

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Key Benefit</label>
            <textarea value={benefit} onChange={e => setBenefit(e.target.value)} placeholder="e.g. reduces back pain in 10 minutes, visible results in 7 days"
              rows={2} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E5E7EB', borderRadius: 7, fontSize: 13, color: '#0A0A0A', background: '#FAFAFA', outline: 'none', resize: 'none' as const, boxSizing: 'border-box' as const }} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Platforms</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
              {PLATFORMS.map(p => (
                <button key={p} onClick={() => togglePlatform(p)}
                  style={{ height: 28, padding: '0 12px', background: platforms.includes(p) ? '#6366F1' : 'white', color: platforms.includes(p) ? 'white' : '#374151', border: `1px solid ${platforms.includes(p) ? '#6366F1' : '#E5E7EB'}`, borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Creative Type</label>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
              {CREATIVE_TYPES.map(ct => (
                <button key={ct.id} onClick={() => setCreativeType(ct.id)}
                  style={{ textAlign: 'left' as const, padding: '8px 12px', background: creativeType === ct.id ? '#EEF2FF' : 'white', border: `1px solid ${creativeType === ct.id ? '#6366F1' : '#E5E7EB'}`, borderRadius: 8, cursor: 'pointer' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: creativeType === ct.id ? '#6366F1' : '#0A0A0A' }}>{ct.label}</div>
                  <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>{ct.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <button onClick={generate} disabled={loading || !productName.trim()}
            style={{ width: '100%', height: 44, background: loading || !productName.trim() ? '#C7D2FE' : 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: loading || !productName.trim() ? 'not-allowed' : 'pointer', fontFamily: brico }}>
            {loading ? 'Maya is thinking…' : 'Generate with Maya →'}
          </button>
        </div>

        {/* CENTER: Output Panel */}
        <div ref={outputRef} style={{ overflowY: 'auto' as const, padding: 24 }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', height: '60%', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>✨</div>
              <div style={{ fontFamily: brico, fontSize: 16, fontWeight: 700, color: '#0A0A0A' }}>Maya is crafting your ads<span style={{ animation: 'pulse 1s infinite' }}>...</span></div>
              <div style={{ fontSize: 13, color: '#9CA3AF' }}>Generating {CREATIVE_TYPES.find(t => t.id === creativeType)?.label} for {productName}</div>
            </div>
          ) : output ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontFamily: brico, fontSize: 15, fontWeight: 700, color: '#0A0A0A' }}>{CREATIVE_TYPES.find(t => t.id === creativeType)?.label} — {productName}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={generate} style={{ height: 32, padding: '0 14px', background: 'white', color: '#6366F1', border: '1px solid #C7D2FE', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>↻ Regenerate</button>
                  <button onClick={() => { navigator.clipboard.writeText(output); }} style={{ height: 32, padding: '0 14px', background: 'white', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Copy All</button>
                  <button onClick={saveOutput} disabled={saving || saved} style={{ height: 32, padding: '0 14px', background: saved ? '#D1FAE5' : '#EEF2FF', color: saved ? '#059669' : '#6366F1', border: `1px solid ${saved ? '#6EE7B7' : '#C7D2FE'}`, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: saving || saved ? 'default' : 'pointer' }}>
                    {saved ? '✓ Saved' : saving ? 'Saving…' : '💾 Save'}
                  </button>
                </div>
              </div>
              <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 24px' }}>
                <MayaMarkdown text={output} />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', height: '60%', gap: 12, color: '#9CA3AF' }}>
              <div style={{ fontSize: 48 }}>✨</div>
              <div style={{ fontFamily: brico, fontSize: 18, fontWeight: 700, color: '#D1D5DB' }}>Your ads will appear here</div>
              <div style={{ fontSize: 13, textAlign: 'center' as const, maxWidth: 320 }}>Fill in the product details on the left and click Generate to create scroll-stopping ad creatives</div>
            </div>
          )}
        </div>

        {/* RIGHT: Saved Outputs */}
        <div style={{ background: 'white', borderLeft: '1px solid #E5E7EB', overflowY: 'auto' as const, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 12 }}>Saved Creatives</div>
          {savedOutputs.length === 0 ? (
            <div style={{ fontSize: 12, color: '#D1D5DB', textAlign: 'center' as const, padding: '20px 0' }}>No saved creatives yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
              {savedOutputs.map(s => (
                <button key={s.id} onClick={() => { setOutput(s.output); setProductName(s.product_name); setCreativeType(s.creative_type); setSaved(true); }}
                  style={{ textAlign: 'left' as const, padding: '10px 12px', background: '#FAFAFA', border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#EEF2FF')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#FAFAFA')}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0A0A0A', marginBottom: 3 }}>{s.product_name}</div>
                  <div style={{ fontSize: 10, color: '#6366F1' }}>{CREATIVE_TYPES.find(t => t.id === s.creative_type)?.label || s.creative_type}</div>
                  <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>{new Date(s.created_at).toLocaleDateString('en-AU')}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
