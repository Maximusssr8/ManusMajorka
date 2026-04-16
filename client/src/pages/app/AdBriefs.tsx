import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '@/lib/supabase';

import { C } from '@/lib/designTokens';
const display = C.fontDisplay;
const sans = C.fontBody;
const mono = C.fontMono;

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

interface TemplateMeta {
  name: string;
  description: string;
  exampleProduct: string;
  previewLine: string;
}

const TEMPLATES: TemplateMeta[] = [
  {
    name: 'Kitchen Gadgets',
    description: 'Fast-moving tools that solve a small daily friction. Tight margins, viral hook potential.',
    exampleProduct: 'Stainless steel garlic press with built-in peeler — solves the sticky-fingers problem in 4 seconds',
    previewLine: 'Hooks built around the "ugh, finally" moment when a tiny daily annoyance vanishes.',
  },
  {
    name: 'Pet Accessories',
    description: 'Cozy, durable, photogenic. Impulse-buyable at $30-60 price points.',
    exampleProduct: 'Calming donut bed for anxious dogs — orthopaedic foam, machine washable, 4 sizes',
    previewLine: 'Emotional, owner-pride angles paired with a clear before/after demo.',
  },
  {
    name: 'Phone Accessories',
    description: 'High-margin micro-niches. Demo-able in 3 seconds, ships flat, repeat purchase potential.',
    exampleProduct: 'MagSafe-compatible kickstand wallet with RFID-blocking sleeve',
    previewLine: 'Clean product hero plus a quick "watch this" demo — designed for thumb-stop scrolls.',
  },
  {
    name: 'Home Organisation',
    description: 'High-perceived-value, easy ad demo, recurring need.',
    exampleProduct: 'Acrylic stackable pantry containers with bamboo lids — set of 8, leak-proof seal',
    previewLine: 'Satisfying transformation arc — chaos to calm in 15 seconds.',
  },
  {
    name: 'Fitness Equipment',
    description: 'Evergreen category with seasonal spikes. Strong AOV, transformation-driven.',
    exampleProduct: 'Adjustable 5-25kg dumbbell with quick-twist plate system — replaces a full rack',
    previewLine: 'Result-driven hooks with credibility anchors — reps, weeks, before/after.',
  },
  {
    name: 'Beauty & Skincare',
    description: 'High-margin, creator-led, compliance-sensitive.',
    exampleProduct: 'Vitamin-C brightening serum with hyaluronic acid — fragrance-free, dermatologist-tested',
    previewLine: 'Ingredient-led trust copy paired with a UGC-style "day 0 vs day 14" hook.',
  },
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
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => { setHistory(loadBriefs()); }, []);

  // Pre-fill from a 'Create Ad Brief' or 'Create Ad' click on Products.
  // We consume either key without removing — AdsStudio is the sole consumer
  // that calls removeItem, preventing a race where whichever page mounts
  // first wipes the handoff before the other reads it.
  useEffect(() => {
    try {
      const stored =
        sessionStorage.getItem('majorka_brief_product') ??
        sessionStorage.getItem('majorka_ad_product');
      if (!stored) return;
      const prod = JSON.parse(stored) as {
        id?: string | number;
        title?: string;
        image?: string;
        price?: number | string;
      };
      if (prod.title) setProduct(String(prod.title));
      // Only remove the brief-specific key if present. Leave majorka_ad_product
      // intact so AdsStudio can still consume it on its own mount.
      sessionStorage.removeItem('majorka_brief_product');
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
      setError(e instanceof Error ? e.message : "We couldn't generate that brief right now. Hit retry or try a different product. If this keeps happening, email support@majorka.io.");
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
          background: 'linear-gradient(135deg, #f5f5f5 0%, #4f8ef7 100%)',
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
            ref={inputRef}
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
            background: loading ? 'rgba(79,142,247,0.3)' : 'linear-gradient(135deg,#4f8ef7,#6ba3ff)',
            color: 'white',
            border: 'none',
            fontFamily: sans, fontSize: 14, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 20px rgba(79,142,247,0.3)',
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
          border: '1px solid rgba(79,142,247,0.2)',
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
          <div className="mj-brief-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
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
                  {open ? (
                    <div className="mj-brief-prose mj-brief-prose--compact" style={{ maxHeight: 'none', overflow: 'hidden' }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{b.brief}</ReactMarkdown>
                    </div>
                  ) : (
                    <div style={{
                      fontSize: 12, color: 'rgba(255,255,255,0.55)',
                      whiteSpace: 'pre-wrap', lineHeight: 1.55,
                      maxHeight: 60,
                      overflow: 'hidden',
                    }}>{b.brief.slice(0, 120) + (b.brief.length > 120 ? '…' : '')}</div>
                  )}
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
          {TEMPLATES.map((t) => (
            <button
              key={t.name}
              onClick={() => {
                setProduct(t.exampleProduct);
                inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                inputRef.current?.focus();
              }}
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
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
              onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(79,142,247,0.3)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
            >
              <div style={{ fontFamily: mono, fontSize: 9, color: C.accentHover, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Template</div>
              <div style={{ fontFamily: display, fontSize: 14, fontWeight: 700, color: '#fff' }}>{t.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{t.description}</div>
              <div style={{
                fontSize: 11,
                color: 'rgba(79,142,247,0.85)',
                fontStyle: 'italic',
                paddingTop: 6,
                borderTop: '1px dashed rgba(255,255,255,0.06)',
                lineHeight: 1.5,
              }}>
                <span style={{ fontFamily: mono, fontSize: 8, color: 'rgba(79,142,247,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 6 }}>Example output preview</span>
                {t.previewLine}
              </div>
            </button>
          ))}
        </div>
      </section>
      <style>{briefProseCss}</style>
    </div>
  );
}

const briefProseCss = `
.mj-brief-prose {
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 13px;
  line-height: 1.65;
  color: #9CA3AF;
}
.mj-brief-prose h1,
.mj-brief-prose h2,
.mj-brief-prose h3,
.mj-brief-prose h4 {
  font-family: 'Syne', system-ui, sans-serif;
  color: #ffffff;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 18px 0 8px;
  line-height: 1.25;
}
.mj-brief-prose h1 { font-size: 20px; }
.mj-brief-prose h2 { font-size: 17px; }
.mj-brief-prose h3 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; color: #4f8ef7; }
.mj-brief-prose h4 { font-size: 13px; }
.mj-brief-prose p { margin: 0 0 10px; color: #9CA3AF; }
.mj-brief-prose ul,
.mj-brief-prose ol { margin: 0 0 12px 0; padding-left: 22px; color: #9CA3AF; }
.mj-brief-prose li { margin-bottom: 4px; }
.mj-brief-prose strong { color: #ffffff; font-weight: 700; }
.mj-brief-prose em { color: #c4c4c4; }
.mj-brief-prose code {
  background: #0d1117;
  color: #4f8ef7;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
}
.mj-brief-prose pre {
  background: #0d1117;
  border: 1px solid rgba(255,255,255,0.06);
  padding: 12px 14px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 0 0 12px;
}
.mj-brief-prose pre code {
  background: transparent;
  padding: 0;
  color: #e5e5e5;
}
.mj-brief-prose blockquote {
  border-left: 2px solid rgba(79,142,247,0.4);
  padding: 4px 0 4px 12px;
  color: #c4c4c4;
  margin: 10px 0;
  font-style: italic;
}
.mj-brief-prose hr { border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 16px 0; }
.mj-brief-prose a { color: #4f8ef7; text-decoration: underline; text-underline-offset: 2px; }
.mj-brief-prose table { border-collapse: collapse; margin: 12px 0; width: 100%; font-size: 12px; }
.mj-brief-prose th, .mj-brief-prose td { border: 1px solid rgba(255,255,255,0.08); padding: 6px 10px; text-align: left; }
.mj-brief-prose th { color: #ffffff; background: rgba(255,255,255,0.03); }
.mj-brief-prose--compact h1 { font-size: 16px; }
.mj-brief-prose--compact h2 { font-size: 14px; }
.mj-brief-prose--compact { font-size: 12px; line-height: 1.55; }
`;

function actionBtnStyle(active: boolean): React.CSSProperties {
  return {
    padding: '7px 12px',
    borderRadius: 7,
    background: active ? 'rgba(16,185,129,0.12)' : 'rgba(79,142,247,0.1)',
    border: `1px solid ${active ? 'rgba(16,185,129,0.3)' : 'rgba(79,142,247,0.28)'}`,
    color: active ? '#10b981' : '#4f8ef7',
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
    background: active ? 'rgba(79,142,247,0.12)' : 'rgba(255,255,255,0.03)',
    border: `1px solid ${active ? 'rgba(79,142,247,0.25)' : 'rgba(255,255,255,0.07)'}`,
    color: active ? '#f5f5f5' : 'rgba(255,255,255,0.5)',
    fontFamily: C.fontBody,
    fontSize: 12,
    fontWeight: active ? 600 : 500,
    cursor: 'pointer',
    transition: 'all 120ms ease',
  };
}
