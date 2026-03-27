import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const brico = "'Bricolage Grotesque', sans-serif";
const dm = "'DM Sans', sans-serif";

// ── Platform config ──────────────────────────────────────────────────────────
const PLATFORMS = [
  { id: 'Facebook', icon: '📘', label: 'Facebook', sub: 'Feed, Reels, Stories' },
  { id: 'Instagram', icon: '📸', label: 'Instagram', sub: 'Feed, Reels, Stories' },
  { id: 'TikTok', icon: '🎵', label: 'TikTok', sub: 'For You Page' },
  { id: 'YouTube', icon: '▶️', label: 'YouTube', sub: 'Pre-roll, Shorts' },
] as const;
type Platform = typeof PLATFORMS[number]['id'];

// ── Creative type config ─────────────────────────────────────────────────────
const CREATIVE_TYPES = [
  { id: 'primary_text', label: '📝 Primary Text + Headline', desc: 'Meta ad copy with 5 headline variations', color: '#3B82F6' },
  { id: 'vsl_script', label: '🎬 VSL Script', desc: '60–90s video sales letter, structured by phase', color: '#8B5CF6' },
  { id: 'ugc_script', label: '🎭 UGC Script', desc: 'Authentic person-to-camera script', color: '#8B5CF6' },
  { id: 'hook_variations', label: '🪝 Hook Variations', desc: '5 scroll-stopping hooks for split testing', color: '#3B82F6' },
  { id: 'image_ad_copy', label: '🖼️ Image Ad Copy', desc: 'Headline + body + CTA for static ads', color: '#3B82F6' },
  { id: 'full_campaign', label: '🚀 Full Campaign Brief', desc: 'Complete — all of the above combined', color: '#059669' },
] as const;

const FUNNEL_STAGES = ['Cold Traffic', 'Warm Retargeting', 'Cart Abandonment'] as const;
const AD_OBJECTIVES = ['Conversions', 'Traffic', 'Awareness'] as const;

// ── Meta system prompt ───────────────────────────────────────────────────────
const MAYA_META_SYSTEM = `You are Maya, an expert Meta (Facebook/Instagram) ad copywriter specialising in Australian ecommerce and dropshipping. You've written ads that have generated millions in revenue for AU DTC brands.

Your ad copy framework:
- Pattern interrupt hook (stop the scroll)
- Problem identification (speak to pain points)
- Agitate (make them feel it)
- Solution reveal (your product)
- Social proof (reviews, results, numbers)
- Urgency/scarcity CTA
- AU-specific language (arvo, servo, mate — only where natural, not forced)

Meta Ad Copy Rules:
- Primary text: 125 chars for mobile preview, full version after
- Headlines: 5 variations, under 40 chars each
- Pain-point led > feature led ALWAYS
- Specific numbers crush vague claims ('reduces pain in 7 minutes' > 'fast relief')
- Social proof format: 'X Australians have...' or '★★★★★ Brisbane mum says...'
- CTA options: 'Shop Now', 'Get Yours', 'Claim Offer', 'Try It Today'

For VSL Scripts:
- Hook (0-3s): visual + verbal pattern interrupt
- Problem (3-15s): 2-3 pain points
- Agitate (15-25s): consequences of not solving
- Solution (25-45s): product introduction
- Proof (45-60s): testimonials/results
- Offer (60-75s): price, guarantee, urgency
- CTA (75-90s): clear single action

Always output in this EXACT format with these EXACT section headers:
## 🎯 AD ANGLE
## 📝 PRIMARY TEXT (Mobile Preview — 125 chars)
## 📝 PRIMARY TEXT (Full Version)
## 💡 HEADLINE VARIATIONS (5 options)
## 🎬 VSL SCRIPT
## 📱 STORY/REEL VERSION (15s cut-down)
## 🔄 SPLIT TEST SUGGESTIONS
## 🇦🇺 AU-SPECIFIC NOTES`;

// ── Section config (for output card colours) ────────────────────────────────
const SECTION_CONFIG: Record<string, { color: string; bg: string; border: string; type: 'copy' | 'script' | 'strategy' }> = {
  '🎯 AD ANGLE':                        { color: '#059669', bg: '#ECFDF5', border: '#6EE7B7', type: 'strategy' },
  '📝 PRIMARY TEXT (Mobile Preview':    { color: '#2563EB', bg: '#EFF6FF', border: '#93C5FD', type: 'copy' },
  '📝 PRIMARY TEXT (Full Version)':     { color: '#2563EB', bg: '#EFF6FF', border: '#93C5FD', type: 'copy' },
  '💡 HEADLINE VARIATIONS':             { color: '#2563EB', bg: '#EFF6FF', border: '#93C5FD', type: 'copy' },
  '🎬 VSL SCRIPT':                      { color: '#7C3AED', bg: '#F5F3FF', border: '#C4B5FD', type: 'script' },
  '📱 STORY/REEL VERSION':              { color: '#7C3AED', bg: '#F5F3FF', border: '#C4B5FD', type: 'script' },
  '🔄 SPLIT TEST SUGGESTIONS':          { color: '#059669', bg: '#ECFDF5', border: '#6EE7B7', type: 'strategy' },
  '🇦🇺 AU-SPECIFIC NOTES':             { color: '#059669', bg: '#ECFDF5', border: '#6EE7B7', type: 'strategy' },
};

function getSection(header: string) {
  for (const [key, val] of Object.entries(SECTION_CONFIG)) {
    if (header.includes(key.replace(/[()]/g, '').trim().slice(0, 20))) return val;
  }
  return { color: '#374151', bg: '#F9FAFB', border: '#E5E7EB', type: 'copy' as const };
}

// ── Output card parser ───────────────────────────────────────────────────────
function parseOutputSections(text: string): Array<{ header: string; body: string }> {
  const lines = text.split('\n');
  const sections: Array<{ header: string; body: string }> = [];
  let cur: { header: string; lines: string[] } | null = null;
  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (cur) sections.push({ header: cur.header, body: cur.lines.join('\n').trim() });
      cur = { header: line.slice(3).trim(), lines: [] };
    } else if (cur) {
      cur.lines.push(line);
    }
  }
  if (cur) sections.push({ header: cur.header, body: cur.lines.join('\n').trim() });
  if (sections.length === 0) sections.push({ header: 'Generated Output', body: text });
  return sections;
}

// ── Character counter component ──────────────────────────────────────────────
function CharCounter({ text }: { text: string }) {
  const lines = text.split('\n').filter(l => l.trim());
  const preview = lines[0] || '';
  const len = preview.length;
  const overLimit = len > 125;
  if (!preview) return null;
  return (
    <div style={{ marginTop: 6, padding: '6px 8px', background: overLimit ? '#FEF2F2' : '#F0FDF4', borderRadius: 6, border: `1px solid ${overLimit ? '#FECACA' : '#BBF7D0'}` }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: overLimit ? '#DC2626' : '#059669' }}>
        Preview: {len}/125 chars {overLimit ? '⚠️ too long for mobile preview' : '✓ fits mobile preview'}
      </div>
      <div style={{ fontSize: 11, color: '#374151', marginTop: 3, fontStyle: 'italic' }}>"{preview.slice(0, 125)}{len > 125 ? '…' : ''}"</div>
    </div>
  );
}

// ── Output section card ──────────────────────────────────────────────────────
function SectionCard({ header, body, onCopy, copied }: {
  header: string; body: string;
  onCopy: (text: string, key: string) => void; copied: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const cfg = getSection(header);
  const key = `sec-${header.slice(0, 10)}`;
  const isCopySection = header.includes('PRIMARY TEXT') && header.includes('Mobile');

  return (
    <div style={{ border: `1px solid ${cfg.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
      {/* Header bar */}
      <div style={{ background: cfg.bg, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setCollapsed(c => !c)}>
        <div style={{ fontWeight: 700, fontSize: 12, color: cfg.color, fontFamily: brico }}>{header}</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={e => { e.stopPropagation(); onCopy(body, key); }}
            style={{ height: 24, padding: '0 10px', background: copied === key ? cfg.bg : 'white', color: copied === key ? '#059669' : cfg.color, border: `1px solid ${cfg.border}`, borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
            {copied === key ? '✓ Copied' : 'Copy for Meta'}
          </button>
          <span style={{ fontSize: 12, color: cfg.color, opacity: 0.6 }}>{collapsed ? '▼' : '▲'}</span>
        </div>
      </div>
      {/* Body */}
      {!collapsed && (
        <div style={{ padding: '10px 12px', background: 'white' }}>
          {isCopySection && <CharCounter text={body} />}
          <pre style={{ whiteSpace: 'pre-wrap' as const, fontFamily: dm, fontSize: 12, color: '#374151', lineHeight: 1.75, margin: isCopySection ? '8px 0 0' : 0 }}>{body}</pre>
        </div>
      )}
    </div>
  );
}

interface SavedOutput { id: string; product_name: string; creative_type: string; output: string; created_at: string; }

export default function AdsStudio() {
  // Inputs
  const [productName, setProductName] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [audience, setAudience] = useState('');
  const [price, setPrice] = useState('');
  const [benefit, setBenefit] = useState('');
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [platforms, setPlatforms] = useState<Platform[]>(['Facebook', 'Instagram']);
  const [creativeType, setCreativeType] = useState('primary_text');
  const [funnelStage, setFunnelStage] = useState<typeof FUNNEL_STAGES[number]>('Cold Traffic');
  const [adObjective, setAdObjective] = useState<typeof AD_OBJECTIVES[number]>('Conversions');
  // Output
  const [output, setOutput] = useState('');
  const [sections, setSections] = useState<Array<{ header: string; body: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState('');
  // Saved
  const [savedOutputs, setSavedOutputs] = useState<SavedOutput[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [token, setToken] = useState('');
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = 'Ads Studio | Majorka';
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setToken(data.session.access_token);
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

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(''), 2500);
  }

  async function generate() {
    if (!productName.trim()) return;
    setLoading(true);
    setOutput('');
    setSections([]);
    setSaved(false);

    const typeLabel = CREATIVE_TYPES.find(t => t.id === creativeType)?.label || creativeType;
    const prompt = `Create a ${typeLabel} for this product:

Product: ${productName}
${productUrl ? `Product URL: ${productUrl}` : ''}
${competitorUrl ? `Competitor URL: ${competitorUrl} — analyse their angle and DIFFERENTIATE` : ''}
Target Audience: ${audience || 'Australian dropshipping customers aged 25-45'}
Price: ${price || 'not specified'}
Key Benefit / USP: ${benefit || 'not specified'}
Platforms: ${platforms.join(', ')}
Funnel Stage: ${funnelStage}
Ad Objective: ${adObjective}

${funnelStage === 'Cart Abandonment' ? 'IMPORTANT: This is for cart abandonment retargeting. The user already visited the product page. Reference urgency, scarcity, and remind them what they\'re missing.' : ''}
${funnelStage === 'Warm Retargeting' ? 'IMPORTANT: This is for warm retargeting. The audience knows us. Use social proof and overcome objections.' : ''}
${funnelStage === 'Cold Traffic' ? 'IMPORTANT: This is cold traffic. Assume zero awareness. Lead with pattern interrupt and strong pain-point hook.' : ''}

Generate the full output following your exact format with all sections.`;

    try {
      const r = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tool: 'ads_studio', prompt, productName, platforms, creativeType }),
      });
      const d = await r.json();
      if (!r.ok) {
        const errMsg = r.status === 429
          ? '⚠️ Usage limit reached — please wait a moment before generating more.'
          : r.status === 401 || r.status === 403
          ? '🔒 Please log in again to continue.'
          : `❌ Server error (${r.status}) — please try again in a moment.`;
        setOutput(errMsg);
        setSections([{ header: 'Generation Failed', body: errMsg }]);
        setLoading(false);
        return;
      }
      const result = d.result || d.content || '';
      if (!result) {
        setOutput('⚠️ No output received — please try again.');
        setSections([{ header: 'Empty Response', body: 'The AI returned an empty response. Please try again.' }]);
        setLoading(false);
        return;
      }
      setOutput(result);
      setSections(parseOutputSections(result));
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err: any) {
      const msg = err?.name === 'AbortError'
        ? '⏱ Request timed out — please try again.'
        : '❌ Connection error — check your internet and try again.';
      setOutput(msg);
      setSections([{ header: 'Connection Error', body: msg }]);
    }
    setLoading(false);
  }

  async function saveOutput() {
    if (!output) return;
    setSaving(true);
    try {
      const r = await fetch('/api/ai/save-output', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productName, creativeType, output }),
      });
      if (r.ok) { setSaved(true); loadSaved(token); }
    } catch {}
    setSaving(false);
  }

  function togglePlatform(p: Platform) {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '16px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: brico, fontWeight: 800, fontSize: 20, color: '#0A0A0A', margin: 0 }}>Ads Studio</h1>
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: '3px 0 0' }}>Meta-focused ad creative generator — Facebook, Instagram & beyond</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#2563EB', background: '#EFF6FF', padding: '4px 10px', borderRadius: 20, border: '1px solid #BFDBFE', fontWeight: 700 }}>📘 Meta-First</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', background: '#EEF2FF', padding: '4px 10px', borderRadius: 20, border: '1px solid #C7D2FE' }}>✨ Maya AI</span>
        </div>
      </div>

      {/* ── 3-col layout ───────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 260px', height: 'calc(100vh - 61px)', overflow: 'hidden' }}>

        {/* ── LEFT: Input Panel ────────────────────────────────────────── */}
        <div style={{ background: 'white', borderRight: '1px solid #E5E7EB', overflowY: 'auto' as const, padding: 18 }}>

          {/* Product details */}
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 10 }}>Product Details</div>

          {[
            { label: 'Product Name *', value: productName, set: setProductName, placeholder: 'e.g. LED Light Therapy Face Mask', required: true },
            { label: 'Product URL', value: productUrl, set: setProductUrl, placeholder: 'https://yourstore.com/product' },
            { label: 'Target Audience', value: audience, set: setAudience, placeholder: 'e.g. Women 28–45, AU, interest: skincare' },
            { label: 'Price Point', value: price, set: setPrice, placeholder: 'e.g. $49.99 AUD' },
          ].map(({ label, value, set, placeholder, required }) => (
            <div key={label} style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: '#6B7280', marginBottom: 3 }}>{label}</label>
              <input value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
                style={{ width: '100%', height: 34, padding: '0 10px', border: `1px solid ${required && !value ? '#FCA5A5' : '#E5E7EB'}`, borderRadius: 7, fontSize: 12, color: '#0A0A0A', background: '#FAFAFA', outline: 'none', boxSizing: 'border-box' as const }} />
            </div>
          ))}

          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: '#6B7280', marginBottom: 3 }}>Key Benefit / USP</label>
            <textarea value={benefit} onChange={e => setBenefit(e.target.value)} placeholder="e.g. reduces back pain in 10 minutes, visible results in 7 days"
              rows={2} style={{ width: '100%', padding: '6px 10px', border: '1px solid #E5E7EB', borderRadius: 7, fontSize: 12, color: '#0A0A0A', background: '#FAFAFA', outline: 'none', resize: 'none' as const, boxSizing: 'border-box' as const }} />
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: '#6B7280', marginBottom: 3 }}>
              Competitor URL <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(optional)</span>
            </label>
            <input value={competitorUrl} onChange={e => setCompetitorUrl(e.target.value)} placeholder="https://competitor.com/product"
              style={{ width: '100%', height: 34, padding: '0 10px', border: '1px solid #E5E7EB', borderRadius: 7, fontSize: 12, color: '#0A0A0A', background: '#FAFAFA', outline: 'none', boxSizing: 'border-box' as const }} />
            <div style={{ fontSize: 9, color: '#9CA3AF', marginTop: 3 }}>We'll analyse their angle and differentiate</div>
          </div>

          {/* Funnel stage */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: '#6B7280', marginBottom: 5 }}>Funnel Stage</label>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
              {FUNNEL_STAGES.map(s => (
                <button key={s} onClick={() => setFunnelStage(s)}
                  style={{ textAlign: 'left' as const, padding: '6px 10px', background: funnelStage === s ? '#EFF6FF' : 'white', border: `1px solid ${funnelStage === s ? '#93C5FD' : '#E5E7EB'}`, borderRadius: 7, fontSize: 11, fontWeight: 600, color: funnelStage === s ? '#2563EB' : '#374151', cursor: 'pointer' }}>
                  {s === 'Cold Traffic' ? '🧊 ' : s === 'Warm Retargeting' ? '🔥 ' : '🛒 '}{s}
                </button>
              ))}
            </div>
          </div>

          {/* Ad objective */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: '#6B7280', marginBottom: 5 }}>Ad Objective</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {AD_OBJECTIVES.map(o => (
                <button key={o} onClick={() => setAdObjective(o)}
                  style={{ flex: 1, height: 28, background: adObjective === o ? '#EFF6FF' : 'white', color: adObjective === o ? '#2563EB' : '#6B7280', border: `1px solid ${adObjective === o ? '#93C5FD' : '#E5E7EB'}`, borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
                  {o}
                </button>
              ))}
            </div>
          </div>

          {/* Platforms */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: '#6B7280', marginBottom: 5 }}>Platforms</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
              {PLATFORMS.map(p => (
                <button key={p.id} onClick={() => togglePlatform(p.id)}
                  style={{ padding: '6px 8px', background: platforms.includes(p.id) ? '#EFF6FF' : 'white', border: `1px solid ${platforms.includes(p.id) ? '#93C5FD' : '#E5E7EB'}`, borderRadius: 8, cursor: 'pointer', textAlign: 'left' as const }}>
                  <div style={{ fontSize: 14, lineHeight: 1 }}>{p.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: platforms.includes(p.id) ? '#2563EB' : '#374151', marginTop: 2 }}>{p.label}</div>
                  <div style={{ fontSize: 9, color: '#9CA3AF' }}>{p.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Creative type */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: '#6B7280', marginBottom: 5 }}>Creative Type</label>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 5 }}>
              {CREATIVE_TYPES.map(ct => (
                <button key={ct.id} onClick={() => setCreativeType(ct.id)}
                  style={{ textAlign: 'left' as const, padding: '7px 10px', background: creativeType === ct.id ? '#EFF6FF' : 'white', border: `1px solid ${creativeType === ct.id ? '#93C5FD' : '#E5E7EB'}`, borderRadius: 8, cursor: 'pointer' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: creativeType === ct.id ? '#2563EB' : '#0A0A0A' }}>{ct.label}</div>
                  <div style={{ fontSize: 9, color: '#9CA3AF', marginTop: 1 }}>{ct.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <button onClick={generate} disabled={loading || !productName.trim()}
            style={{ width: '100%', height: 44, background: loading || !productName.trim() ? '#BFDBFE' : 'linear-gradient(135deg, #2563EB, #6366F1)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: loading || !productName.trim() ? 'not-allowed' : 'pointer', fontFamily: brico }}>
            {loading ? '✨ Maya is writing…' : '📘 Generate Meta Ads →'}
          </button>
        </div>

        {/* ── CENTER: Output ───────────────────────────────────────────── */}
        <div ref={outputRef} style={{ overflowY: 'auto' as const, padding: '20px 24px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', height: '60%', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #2563EB, #6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>✨</div>
              <div style={{ fontFamily: brico, fontSize: 16, fontWeight: 800, color: '#0A0A0A' }}>Maya is crafting your Meta ads…</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center' as const, maxWidth: 300 }}>
                Writing {CREATIVE_TYPES.find(t => t.id === creativeType)?.label} for <strong>{productName}</strong>
                <br />{funnelStage} · {adObjective} · {platforms.join(' + ')}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                {['Analysing angle', 'Writing hooks', 'Crafting copy', 'AU localising'].map((step, i) => (
                  <div key={i} style={{ fontSize: 10, color: '#6366F1', background: '#EEF2FF', padding: '3px 8px', borderRadius: 20, fontWeight: 600 }}>{step}</div>
                ))}
              </div>
            </div>
          ) : sections.length > 0 ? (
            <div>
              {/* Output header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: brico, fontSize: 15, fontWeight: 800, color: '#0A0A0A' }}>{CREATIVE_TYPES.find(t => t.id === creativeType)?.label}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{productName} · {funnelStage} · {platforms.join(' + ')}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={generate} style={{ height: 30, padding: '0 12px', background: 'white', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>↻ Regenerate</button>
                  <button onClick={() => copyText(output, 'all')} style={{ height: 30, padding: '0 12px', background: 'white', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{copied === 'all' ? '✓ Copied' : 'Copy All'}</button>
                  <button onClick={saveOutput} disabled={saving || saved} style={{ height: 30, padding: '0 12px', background: saved ? '#ECFDF5' : '#EFF6FF', color: saved ? '#059669' : '#2563EB', border: `1px solid ${saved ? '#6EE7B7' : '#BFDBFE'}`, borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: saving || saved ? 'default' : 'pointer' }}>
                    {saved ? '✓ Saved' : saving ? 'Saving…' : '💾 Save'}
                  </button>
                </div>
              </div>

              {/* Section type legend */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' as const }}>
                {[
                  { label: 'Copy / Text', color: '#2563EB', bg: '#EFF6FF' },
                  { label: 'Script', color: '#7C3AED', bg: '#F5F3FF' },
                  { label: 'Strategy', color: '#059669', bg: '#ECFDF5' },
                ].map(t => (
                  <span key={t.label} style={{ fontSize: 9, fontWeight: 700, color: t.color, background: t.bg, padding: '2px 8px', borderRadius: 20 }}>{t.label}</span>
                ))}
              </div>

              {/* Sections */}
              {sections.map((s, i) => (
                <SectionCard key={i} header={s.header} body={s.body} onCopy={copyText} copied={copied} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', height: '60%', gap: 12 }}>
              <div style={{ fontSize: 52 }}>📘</div>
              <div style={{ fontFamily: brico, fontSize: 20, fontWeight: 800, color: '#D1D5DB' }}>Meta Ads Will Appear Here</div>
              <div style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center' as const, maxWidth: 320, lineHeight: 1.6 }}>
                Fill in your product details, choose a funnel stage, select a creative type and click <strong>Generate Meta Ads</strong>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 8, maxWidth: 360 }}>
                {['🎯 AU-specific angles', '📝 125-char preview', '🔄 Split test ideas', '💡 5 headlines', '🎬 VSL scripts', '🇦🇺 Local language'].map(t => (
                  <div key={t} style={{ fontSize: 10, color: '#6B7280', background: '#F3F4F6', padding: '5px 8px', borderRadius: 6, textAlign: 'center' as const }}>{t}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Saved Outputs ─────────────────────────────────────── */}
        <div style={{ background: 'white', borderLeft: '1px solid #E5E7EB', overflowY: 'auto' as const, padding: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 10 }}>Saved Creatives</div>
          {savedOutputs.length === 0 ? (
            <div>
              <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center' as const, padding: '12px 0 16px', lineHeight: 1.6 }}>
                Generate an ad pack to start your library
              </div>
              {/* Example cards */}
              <div style={{ fontSize: 10, fontWeight: 700, color: '#D1D5DB', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 8 }}>Example outputs</div>
              {[
                { product: 'LED Face Mask Pro', type: 'Facebook Carousel', date: 'Example' },
                { product: 'Posture Corrector Belt', type: 'TikTok Hook Pack', date: 'Example' },
                { product: 'Portable Blender', type: 'UGC Brief', date: 'Example' },
              ].map((ex, i) => (
                <div key={i} style={{ padding: '8px 10px', background: '#F9FAFB', border: '1px dashed #E5E7EB', borderRadius: 7, marginBottom: 6, opacity: 0.7 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 2 }}>{ex.product}</div>
                  <div style={{ fontSize: 10, color: '#6366F1' }}>{ex.type}</div>
                  <div style={{ fontSize: 9, color: '#9CA3AF', marginTop: 2 }}>{ex.date}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
              {savedOutputs.map(s => (
                <button key={s.id}
                  onClick={() => { setOutput(s.output); setSections(parseOutputSections(s.output)); setProductName(s.product_name); setCreativeType(s.creative_type); setSaved(true); }}
                  style={{ textAlign: 'left' as const, padding: '8px 10px', background: '#FAFAFA', border: '1px solid #E5E7EB', borderRadius: 7, cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#EFF6FF')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#FAFAFA')}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#0A0A0A', marginBottom: 2 }}>{s.product_name}</div>
                  <div style={{ fontSize: 10, color: '#2563EB' }}>{CREATIVE_TYPES.find(t => t.id === s.creative_type)?.label || s.creative_type}</div>
                  <div style={{ fontSize: 9, color: '#9CA3AF', marginTop: 2 }}>{new Date(s.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</div>
                </button>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
