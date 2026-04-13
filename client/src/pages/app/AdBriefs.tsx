import { useEffect, useState } from 'react';
import { Sparkles, Zap, AlertTriangle, PackageOpen, MessageSquare, Rocket, Copy, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';

import { C } from '@/lib/designTokens';
const display = C.fontDisplay;
const sans = C.fontBody;
const mono = C.fontBody;

const PLATFORM_TOOLTIPS: Record<Platform, string> = {
  facebook: 'Feed + Stories + Reels',
  tiktok: 'For You page + TikTok Shop',
  instagram: 'Feed + Stories + Reels',
  youtube: 'Shorts + In-stream',
};

const AD_TYPE_DESCRIPTIONS: Record<AdType, string> = {
  video: 'Best for scroll-stopping cold traffic',
  image: 'Clean product shots + bold text overlay',
  carousel: 'Multiple angles or step-by-step',
  story: '9:16 full-screen, swipe-up CTA',
};

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

interface AdTemplate {
  name: string;
  icon: LucideIcon;
  description: string;
  prompt: string;
}

const TEMPLATES: AdTemplate[] = [
  {
    name: 'UGC Hook',
    icon: Sparkles,
    description: 'Authentic creator-style opener.\nHigh scroll-stop on TikTok & Reels.',
    prompt: 'UGC-style hook for viral product',
  },
  {
    name: 'Before / After',
    icon: Zap,
    description: 'Visual transformation narrative.\nProof-driven, converts cold traffic.',
    prompt: 'Before / after transformation ad',
  },
  {
    name: 'Problem / Agitation',
    icon: AlertTriangle,
    description: 'Identify pain, twist the knife.\nEmotion-led, strong for Facebook.',
    prompt: 'Problem / agitation angle ad',
  },
  {
    name: 'Feature Drop',
    icon: PackageOpen,
    description: 'Spotlight 3 key features.\nClean product-led direct response.',
    prompt: 'Feature-drop product highlight ad',
  },
  {
    name: 'Testimonial',
    icon: MessageSquare,
    description: 'Customer-voice social proof.\nBest for retargeting warm audiences.',
    prompt: 'Customer testimonial style ad',
  },
  {
    name: 'Launch Teaser',
    icon: Rocket,
    description: 'Coming-soon urgency copy.\nEngineered for launch-week reach.',
    prompt: 'Launch teaser countdown ad',
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

// Read product data from sessionStorage if passed from Products page
interface PrefilledProduct {
  id?: string; title?: string; image?: string; price?: number;
  category?: string; score?: number; orders?: number;
}
function getPrefilledProduct(): PrefilledProduct | null {
  try {
    const raw = sessionStorage.getItem('majorka_ad_product');
    if (!raw) return null;
    return JSON.parse(raw) as PrefilledProduct;
  } catch { return null; }
}

export default function AdBriefs() {
  const prefilled = getPrefilledProduct();
  const [product, setProduct] = useState(prefilled?.title || '');
  const [productMeta, setProductMeta] = useState<PrefilledProduct | null>(prefilled);
  const [platforms, setPlatforms] = useState<Platform[]>(['facebook', 'tiktok']);
  const [adType, setAdType] = useState<AdType>('video');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<string | null>(null);
  const [history, setHistory] = useState<StoredBrief[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => { setHistory(loadBriefs()); }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => { /* ignore */ });
  };

  const applyTemplate = (prompt: string) => {
    setProduct(prompt);
    setError(null);
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

    // Build an intelligence-enriched prompt when product data is available
    const pm = productMeta;
    const intel = pm ? `
PRODUCT INTELLIGENCE (from Majorka database — use this to inform your brief):
- Name: ${pm.title || q}
- Category: ${pm.category || 'Unknown'}
- AU Price: $${pm.price ?? 'N/A'} AUD
- Orders: ${pm.orders?.toLocaleString() ?? 'N/A'}
- Winning Score: ${pm.score ?? 'N/A'}/100
- Competition: ${(pm.score ?? 50) > 70 ? 'Competitive niche — differentiate aggressively' : (pm.score ?? 50) > 40 ? 'Medium competition — lean into social proof' : 'Low competition — first-mover advantage, go broad'}
- Suggested daily budget: A$${Math.max(15, Math.round((pm.price ?? 25) * (pm.orders ?? 100) * 0.0001))} (based on category CPM averages)
` : '';

    const system =
      `You are an elite direct-response copywriter specialising in Australian ecommerce. You write ads that convert cold traffic into buyers — not brand awareness fluff. You understand AU consumer psychology, Afterpay checkout behavior, and platform-specific creative constraints (Facebook 125-char preview, TikTok 3-second hook rule, Instagram Story swipe-up friction).

${intel}
Generate a COMPLETE campaign brief that an operator can execute without any other tools. This is what makes Majorka better than going straight to Meta Ads Manager — the brief should be actionable enough that a junior media buyer could run it.`;

    const userMsg =
      `Product / niche: ${q}
Platforms: ${platforms.join(', ')}
Ad type: ${adType}

Return a markdown brief with these sections:
## Campaign Strategy
(1 sentence objective, budget recommendation, timeline)
## Target Audience
(3 specific audience segments with interests/behaviors for Meta targeting)
## Ad Copy Variations
(3 headline variations, 3 primary text variations, 3 CTAs)
## Hook Framework
(Opening line for video ads — must stop the scroll in under 3 seconds)
## Creative Direction
(Visual concept, color palette suggestion, thumbnail strategy)
## A/B Test Plan
(What to test first, what success looks like, when to scale)
## Objection Handling
(Top 3 buyer objections and how the ad copy addresses each one)`;

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
          tool: 'ads_studio',
          system,
          prompt: userMsg,
          productName: q,
          platforms,
          creativeType: adType,
        }),
      });
      const data = await res.json();
      const text: string = data?.result ?? data?.text ?? data?.output ?? data?.content ?? '';
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
      // Error already handled by setError below
      setError('Brief generation failed — please try again or check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '32px 36px', overflow: 'auto', color: C.text, fontFamily: sans }}>
      {/* Breadcrumb (FIX 11) */}
      <div style={{ fontSize: 11, color: '#555', marginBottom: 12, fontFamily: mono }}>
        Home <span style={{ margin: '0 6px', opacity: 0.5 }}>/</span> Ad Briefs
      </div>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: display, fontSize: 28, fontWeight: 800,
          letterSpacing: '-0.02em', margin: '0 0 4px', lineHeight: 1.1,
          color: '#ededed',
        }}>Ad Briefs</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '0 0 6px' }}>
          Generate platform-specific ad briefs for any product in seconds
        </p>
        <p style={{ fontSize: 12, color: '#888', margin: 0 }}>
          A brief includes: campaign strategy, 3 headline variations, primary text, hook framework, target audience segments, creative direction, and an A/B test plan.
        </p>
      </div>

      {/* Product intelligence card — when pre-filled from Products page */}
      {productMeta && (
        <div style={{
          background: 'rgba(212,175,55,0.04)',
          border: '1px solid rgba(212,175,55,0.2)',
          borderRadius: 8,
          padding: '18px 20px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap' as const,
        }}>
          {productMeta.image && (
            <img src={productMeta.image} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(212,175,55,0.25)' }} />
          )}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#ededed' }}>{productMeta.title}</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
              {productMeta.category || ''} · A${productMeta.price ?? '—'} · {productMeta.orders?.toLocaleString() ?? '—'} orders · Score {productMeta.score ?? '—'}
            </div>
          </div>
          <div style={{
            padding: '6px 12px',
            borderRadius: 6,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase' as const,
            background: (productMeta.score ?? 50) > 70 ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
            color: (productMeta.score ?? 50) > 70 ? '#22c55e' : '#f59e0b',
            border: `1px solid ${(productMeta.score ?? 50) > 70 ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
          }}>
            {(productMeta.score ?? 50) > 70 ? 'High potential' : 'Good potential'}
          </div>
        </div>
      )}

      {/* Generator */}
      <section style={{
        background: C.raised,
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 8,
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
              borderRadius: 8,
              padding: '14px 18px 14px 44px',
              color: '#f5f5f5',
              fontFamily: sans,
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') generate(); }}
            maxLength={50}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: '#555' }}>
            <span>1-5 words works best (e.g. &apos;nano tape&apos;, &apos;posture corrector&apos;)</span>
            <span style={{ fontFamily: mono }}>{product.length}/50</span>
          </div>
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
                    title={PLATFORM_TOOLTIPS[p.key]}
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
                <div key={t.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <button
                    onClick={() => setAdType(t.key)}
                    style={pillStyle(t.key === adType)}
                  >{t.label}</button>
                  <span style={{ fontSize: 10, color: '#555', marginTop: 2, paddingLeft: 2 }}>
                    {AD_TYPE_DESCRIPTIONS[t.key]}
                  </span>
                </div>
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
          className={loading ? 'animate-pulse' : ''}
          style={{
            padding: '12px 24px',
            borderRadius: 8,
            background: loading ? 'rgba(59,130,246,0.3)' : '#3B82F6',
            color: 'white',
            border: 'none',
            fontFamily: sans, fontSize: 14, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}
        >{loading ? 'Generating…' : 'Generate Brief →'}</button>
      </section>

      {/* Output */}
      {loading && (
        <div style={{
          background: C.raised,
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 8,
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
          background: '#0f0f0f',
          border: '1px solid #1a1a1a',
          borderRadius: 8,
          padding: 24,
          marginBottom: 28,
          position: 'relative',
        }}>
          <button
            onClick={() => copyToClipboard(output)}
            style={{
              position: 'absolute', top: 12, right: 12,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6, padding: '6px 12px',
              color: copied ? '#22c55e' : '#888',
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy brief</>}
          </button>
          <div style={{
            whiteSpace: 'pre-wrap',
            fontSize: 13,
            lineHeight: 1.65,
            color: 'rgba(255,255,255,0.85)',
            fontFamily: sans,
          }}>{output}</div>
        </div>
      )}

      {/* Recent briefs */}
      {history.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: display, fontSize: 17, fontWeight: 700, margin: '0 0 14px' }}>Recent Briefs</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            {history.slice(0, 5).map((b) => {
              const open = expanded === b.id;
              return (
                <div key={b.id} style={{
                  background: C.raised,
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 8,
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
                  {b.brief.length > 120 && (
                    <button
                      onClick={() => setExpanded(open ? null : b.id)}
                      style={{
                        marginTop: 8,
                        background: 'none', border: 'none',
                        color: C.accentHover, fontSize: 12, cursor: 'pointer', padding: 0,
                      }}
                    >{open ? 'Collapse ↑' : 'View full brief →'}</button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Templates */}
      <section>
        <h2 style={{ fontFamily: display, fontSize: 17, fontWeight: 700, margin: '0 0 6px' }}>Popular Templates</h2>
        <p style={{ fontSize: 12, color: '#555555', margin: '0 0 14px' }}>
          Battle-tested ad angles. Click a template to pre-fill, then review and generate.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {TEMPLATES.map((t) => {
            const Icon = t.icon;
            return (
              <div
                key={t.name}
                onClick={() => applyTemplate(t.prompt)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') applyTemplate(t.prompt); }}
                style={{
                  background: '#0f0f0f',
                  border: '1px solid #1a1a1a',
                  borderRadius: 8,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  cursor: 'pointer',
                  transition: 'border-color 120ms ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: 'rgba(59,130,246,0.08)',
                      border: '1px solid rgba(59,130,246,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={16} color="#3B82F6" />
                  </div>
                  <div style={{ fontFamily: display, fontSize: 15, fontWeight: 700, color: '#ededed' }}>
                    {t.name}
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: sans,
                    fontSize: 12,
                    color: '#888888',
                    lineHeight: 1.55,
                    whiteSpace: 'pre-line',
                    flex: 1,
                  }}
                >
                  {t.description}
                </div>
                <span
                  style={{
                    padding: '9px 14px',
                    borderRadius: 6,
                    background: '#3B82F6',
                    border: '1px solid #3B82F6',
                    color: '#ffffff',
                    fontFamily: sans,
                    fontSize: 12,
                    fontWeight: 600,
                    boxShadow: '0 0 0 1px rgba(59,130,246,0.3)',
                    alignSelf: 'flex-start',
                    pointerEvents: 'none',
                  }}
                >
                  Use template →
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function pillStyle(active: boolean): React.CSSProperties {
  return {
    padding: '7px 12px',
    borderRadius: 7,
    background: active ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.03)',
    border: `1px solid ${active ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.07)'}`,
    color: active ? '#f5f5f5' : 'rgba(255,255,255,0.5)',
    fontFamily: C.fontBody,
    fontSize: 12,
    fontWeight: active ? 600 : 500,
    cursor: 'pointer',
    transition: 'all 120ms ease',
  };
}
