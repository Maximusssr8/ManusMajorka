import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

import { C } from '@/lib/designTokens';
const display = C.fontDisplay;
const sans = C.fontBody;
const mono = C.fontBody;

type Platform = 'facebook' | 'tiktok' | 'instagram' | 'youtube';
type AdType = 'video' | 'image' | 'carousel' | 'story';

const PLATFORMS: { key: Platform; label: string; icon: string }[] = [
  { key: 'facebook',  label: 'Facebook',  icon: '📘' },
  { key: 'tiktok',    label: 'TikTok',    icon: '🎵' },
  { key: 'instagram', label: 'Instagram', icon: '📸' },
  { key: 'youtube',   label: 'YouTube',   icon: '▶️' },
];

const AD_TYPES: { key: AdType; label: string }[] = [
  { key: 'video',     label: 'Video Hook' },
  { key: 'image',     label: 'Static Image' },
  { key: 'carousel',  label: 'Carousel' },
  { key: 'story',     label: 'Story' },
];

const TEMPLATES = [
  'Kitchen Gadgets',
  'Pet Accessories',
  'Phone Accessories',
  'Home Organisation',
  'Fitness Equipment',
  'Beauty & Skincare',
];

interface StoredBrief {
  id: string;
  product: string;
  platforms: Platform[];
  adType: AdType;
  brief: string;
  createdAt: string;
}

const STORAGE_KEY = 'majorka-adbriefs-v1';

function loadBriefs(): StoredBrief[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as StoredBrief[]; }
  catch { return []; }
}
function saveBriefs(items: StoredBrief[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 10))); } catch { /* ignore */ }
}

export default function AdBriefs() {
  const [product, setProduct] = useState('');
  const [platforms, setPlatforms] = useState<Platform[]>(['facebook', 'tiktok']);
  const [adType, setAdType] = useState<AdType>('video');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<string | null>(null);
  const [history, setHistory] = useState<StoredBrief[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => { setHistory(loadBriefs()); }, []);

  // Pre-fill from a 'Create Ad Brief' click on the Products page. Mirrors
  // the pattern in AdsStudio.tsx so both tools accept the same handoff key.
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('majorka_ad_product');
      if (!stored) return;
      const prod = JSON.parse(stored) as {
        id?: string | number;
        title?: string;
        image?: string;
        price?: number | string;
      };
      if (prod.title) setProduct(String(prod.title));
      sessionStorage.removeItem('majorka_ad_product');
    } catch {
      // ignore malformed payload
    }
  }, []);

  const copyBrief = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      setError('Could not copy to clipboard');
    }
  };

  const downloadBrief = (b: StoredBrief) => {
    const safeProduct = b.product.replace(/[^a-z0-9-]+/gi, '-').toLowerCase().slice(0, 40) || 'brief';
    const header = `# Ad Brief — ${b.product}\nPlatforms: ${b.platforms.join(', ')}\nAd type: ${b.adType}\nGenerated: ${new Date(b.createdAt).toLocaleString()}\n\n`;
    const blob = new Blob([header + b.brief], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeProduct}-brief.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const deleteBrief = (id: string) => {
    const next = history.filter((h) => h.id !== id);
    setHistory(next);
    saveBriefs(next);
    if (expanded === id) setExpanded(null);
  };

  const togglePlatform = (p: Platform) => {
    setPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  };

  const generate = async (overrideProduct?: string) => {
    const q = (overrideProduct ?? product).trim();
    if (!q) { setError('Enter a product name or niche'); return; }
    if (platforms.length === 0) { setError('Pick at least one platform'); return; }
    setLoading(true);
    setError(null);
    setOutput(null);
    if (overrideProduct) setProduct(overrideProduct);

    const system =
      'You are an expert dropshipping ad copywriter. Generate a complete ad brief for the product below targeting Australian dropshippers. Include: 3 headline variations, primary text, hook opening line, call to action, and targeting suggestions. Format as clean markdown with headings.';

    const userMsg =
      `Product / niche: ${q}\nPlatforms: ${platforms.join(', ')}\nAd type: ${adType}\n\nReturn a complete brief formatted in markdown.`;

    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess?.session?.access_token ?? '';
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          system,
          prompt: userMsg,
          model: 'claude-haiku-4-5',
          max_tokens: 900,
        }),
      });
      const data = await res.json();
      const text: string = data?.text ?? data?.output ?? data?.content ?? '';
      if (!res.ok || !text) {
        throw new Error(data?.error || 'AI endpoint returned no content');
      }
      setOutput(text);
      const entry: StoredBrief = {
        id: `brief-${Date.now()}`,
        product: q,
        platforms,
        adType,
        brief: text,
        createdAt: new Date().toISOString(),
      };
      const next = [entry, ...history].slice(0, 10);
      setHistory(next);
      saveBriefs(next);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '32px 36px', overflow: 'auto', color: C.text, fontFamily: sans }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: display, fontSize: 28, fontWeight: 800,
          letterSpacing: '-0.02em', margin: '0 0 4px', lineHeight: 1.1,
          background: 'linear-gradient(135deg, #f5f5f5 0%, #a78bfa 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>Ad Briefs</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
          Generate platform-specific ad briefs for any product in seconds
        </p>
      </div>

      {/* Generator */}
      <section style={{
        background: C.raised,
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12,
        padding: 24,
        marginBottom: 28,
      }}>
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }}>✨</span>
          <input
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="Enter a product name or niche…"
            style={{
              width: '100%',
              background: '#151515',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              padding: '14px 18px 14px 44px',
              color: '#f5f5f5',
              fontFamily: sans,
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') generate(); }}
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Platforms</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {PLATFORMS.map((p) => {
                const active = platforms.includes(p.key);
                return (
                  <button
                    key={p.key}
                    onClick={() => togglePlatform(p.key)}
                    style={pillStyle(active)}
                  >{p.icon} {p.label}</button>
                );
              })}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Ad Type</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {AD_TYPES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setAdType(t.key)}
                  style={pillStyle(t.key === adType)}
                >{t.label}</button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 14,
            fontSize: 12,
            color: '#f87171',
          }}>{error}</div>
        )}

        <button
          onClick={() => generate()}
          disabled={loading}
          style={{
            padding: '12px 24px',
            borderRadius: 9,
            background: loading ? 'rgba(124,106,255,0.3)' : 'linear-gradient(135deg,#7c6aff,#a78bfa)',
            color: 'white',
            border: 'none',
            fontFamily: sans, fontSize: 14, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 20px rgba(124,106,255,0.3)',
          }}
        >{loading ? 'Generating…' : 'Generate Brief →'}</button>
      </section>

      {/* Output */}
      {loading && (
        <div style={{
          background: C.raised,
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12,
          padding: 24,
          marginBottom: 28,
        }}>
          <div className="mj-shim" style={{ height: 14, width: '70%', marginBottom: 10 }} />
          <div className="mj-shim" style={{ height: 12, width: '90%', marginBottom: 6 }} />
          <div className="mj-shim" style={{ height: 12, width: '85%', marginBottom: 6 }} />
          <div className="mj-shim" style={{ height: 12, width: '80%' }} />
        </div>
      )}
      {output && !loading && (
        <div style={{
          background: C.raised,
          border: '1px solid rgba(124,106,255,0.2)',
          borderRadius: 12,
          padding: 24,
          marginBottom: 28,
          fontFamily: sans,
        }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => copyBrief(output, 'current')}
              style={actionBtnStyle(copied === 'current')}
            >{copied === 'current' ? 'Copied ✓' : 'Copy brief'}</button>
            <button
              onClick={() => {
                const latest = history[0];
                if (latest) downloadBrief(latest);
              }}
              style={actionBtnStyle(false)}
            >Download .md</button>
          </div>
          <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.65, color: 'rgba(255,255,255,0.85)' }}>
            {output}
          </div>
        </div>
      )}

      {/* Recent briefs */}
      {history.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: display, fontSize: 17, fontWeight: 700, margin: '0 0 14px' }}>Recent Briefs</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            {history.slice(0, 3).map((b) => {
              const open = expanded === b.id;
              return (
                <div key={b.id} style={{
                  background: C.raised,
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 10,
                  padding: 16,
                }}>
                  <div style={{ fontFamily: display, fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>{b.product}</div>
                  <div style={{ fontFamily: mono, fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                    {b.platforms.join(' · ')} · {new Date(b.createdAt).toLocaleDateString()}
                  </div>
                  <div style={{
                    fontSize: 12, color: 'rgba(255,255,255,0.55)',
                    whiteSpace: 'pre-wrap', lineHeight: 1.55,
                    maxHeight: open ? 'none' : 60,
                    overflow: 'hidden',
                  }}>{open ? b.brief : b.brief.slice(0, 120) + (b.brief.length > 120 ? '…' : '')}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                    {b.brief.length > 120 && (
                      <button
                        onClick={() => setExpanded(open ? null : b.id)}
                        style={miniBtnStyle(false)}
                      >{open ? 'Collapse' : 'View full'}</button>
                    )}
                    <button
                      onClick={() => copyBrief(b.brief, b.id)}
                      style={miniBtnStyle(copied === b.id)}
                    >{copied === b.id ? 'Copied ✓' : 'Copy'}</button>
                    <button
                      onClick={() => downloadBrief(b)}
                      style={miniBtnStyle(false)}
                    >Download</button>
                    <button
                      onClick={() => deleteBrief(b.id)}
                      style={{ ...miniBtnStyle(false), color: '#f87171', borderColor: 'rgba(239,68,68,0.2)' }}
                      aria-label="Delete brief"
                    >Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Templates */}
      <section>
        <h2 style={{ fontFamily: display, fontSize: 17, fontWeight: 700, margin: '0 0 14px' }}>Popular Templates</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          {TEMPLATES.map((t) => (
            <button
              key={t}
              onClick={() => generate(t)}
              disabled={loading}
              style={{
                background: C.raised,
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10,
                padding: 16,
                textAlign: 'left',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: sans,
                color: C.text,
                fontSize: 13,
                fontWeight: 500,
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(124,106,255,0.3)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
            >
              <div style={{ fontFamily: mono, fontSize: 9, color: C.accentHover, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Template</div>
              {t}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function actionBtnStyle(active: boolean): React.CSSProperties {
  return {
    padding: '7px 12px',
    borderRadius: 7,
    background: active ? 'rgba(16,185,129,0.12)' : 'rgba(124,106,255,0.1)',
    border: `1px solid ${active ? 'rgba(16,185,129,0.3)' : 'rgba(124,106,255,0.28)'}`,
    color: active ? '#10b981' : '#a78bfa',
    fontFamily: C.fontBody,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 120ms ease',
  };
}

function miniBtnStyle(active: boolean): React.CSSProperties {
  return {
    padding: '5px 10px',
    borderRadius: 6,
    background: active ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)',
    border: `1px solid ${active ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`,
    color: active ? '#10b981' : 'rgba(255,255,255,0.65)',
    fontFamily: C.fontBody,
    fontSize: 11,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 120ms ease',
  };
}

function pillStyle(active: boolean): React.CSSProperties {
  return {
    padding: '7px 12px',
    borderRadius: 7,
    background: active ? 'rgba(124,106,255,0.12)' : 'rgba(255,255,255,0.03)',
    border: `1px solid ${active ? 'rgba(124,106,255,0.25)' : 'rgba(255,255,255,0.07)'}`,
    color: active ? '#f5f5f5' : 'rgba(255,255,255,0.5)',
    fontFamily: C.fontBody,
    fontSize: 12,
    fontWeight: active ? 600 : 500,
    cursor: 'pointer',
    transition: 'all 120ms ease',
  };
}
