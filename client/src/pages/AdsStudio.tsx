import { useState, useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/_core/hooks/useAuth';
import UpgradeModal from '@/components/UpgradeModal';
import UsageMeter from '@/components/UsageMeter';
import { proxyImage } from '@/lib/imageProxy';
import { PLAN_LIMITS } from '@shared/plans';
import { useLocation } from 'wouter';

const brico = "'Bricolage Grotesque', sans-serif";
const dm = "'DM Sans', sans-serif";
const mono = "'JetBrains Mono', monospace";

const PLATFORMS = [
  { id: 'Facebook',  icon: '📘', label: 'Facebook',  sub: 'Feed, Reels, Stories' },
  { id: 'Instagram', icon: '📸', label: 'Instagram', sub: 'Feed, Reels, Stories' },
  { id: 'TikTok',    icon: '🎵', label: 'TikTok',    sub: 'For You Page' },
  { id: 'YouTube',   icon: '▶️', label: 'YouTube',   sub: 'Pre-roll, Shorts' },
] as const;
type Platform = typeof PLATFORMS[number]['id'];

const CREATIVE_TYPES = [
  { id: 'primary_text',    label: '📝 Primary Text + Headline' },
  { id: 'vsl_script',      label: '🎬 VSL Script' },
  { id: 'ugc_script',      label: '🎭 UGC Script' },
  { id: 'hook_variations', label: '🪝 Hook Variations' },
  { id: 'image_ad_copy',   label: '🖼️ Image Ad Copy' },
  { id: 'full_campaign',   label: '🚀 Full Campaign Brief' },
] as const;

const FUNNEL_STAGES = ['Cold Traffic', 'Warm Retargeting', 'Cart Abandonment'] as const;
const AD_OBJECTIVES = ['Conversions', 'Traffic', 'Awareness'] as const;

// Expert direct-response system prompt
const ADS_SYSTEM_PROMPT = `You are an elite direct-response copywriter who specialises in Australian dropshipping. You have written hundreds of winning Meta and TikTok ads that have generated millions in revenue. You understand Australian consumer psychology, what converts for cold traffic vs retargeting, and platform-specific constraints. Facebook primary text preview cuts off at 125 characters. Headlines must be under 40 characters. TikTok hooks must grab attention in the first 3 seconds. You write copy that sounds human, specific, and urgent — never generic, never AI-sounding, never using words like 'amazing', 'game-changing', or 'life-changing'. You write like a founder who knows their customer, not like a copywriter trying to sound smart.`;

interface DbProduct {
  id: string | number;
  product_title: string;
  image_url: string | null;
  price_aud: number | string | null;
  sold_count: number | null;
  category: string | null;
  product_url: string | null;
}

interface ParsedSections {
  primaryHook: string;
  headline: string;
  primaryText: string;
  fullBody: string;
  cta: string;
  hookA: string;
  hookB: string;
  hookC: string;
  objectionKiller: string;
}

interface SavedAd {
  id: number;
  productName: string;
  platform: string;
  createdAt: string;
  hook: string;
  headline: string;
  primaryText: string;
  fullBody: string;
  cta: string;
}

const SAVED_KEY = 'majorka_saved_ads';

function loadSavedAds(): SavedAd[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]') as SavedAd[]; }
  catch { return []; }
}
function persistSavedAds(items: SavedAd[]) {
  try { localStorage.setItem(SAVED_KEY, JSON.stringify(items.slice(0, 10))); } catch { /* ignore */ }
}

// Parser — splits AI response by the exact labels the system prompt requests
function parseSections(text: string): ParsedSections {
  const grab = (label: string, nextLabels: string[]): string => {
    const re = new RegExp(`${label}\\s*:?\\s*\\n?([\\s\\S]*?)(?=${nextLabels.map((l) => l + '\\s*:').join('|')}|$)`, 'i');
    const match = text.match(re);
    return match ? match[1].trim().replace(/^\[|\]$/g, '').trim() : '';
  };
  const LABELS = [
    'PRIMARY HOOK', 'HEADLINE', 'PRIMARY TEXT \\(125 chars\\)', 'PRIMARY TEXT',
    'FULL BODY COPY', 'CTA BUTTON',
    'HOOK VARIATION 1', 'HOOK VARIATION 2', 'HOOK VARIATION 3',
    'OBJECTION KILLER',
  ];
  return {
    primaryHook:     grab('PRIMARY HOOK',             LABELS),
    headline:        grab('HEADLINE',                 LABELS),
    primaryText:     grab('PRIMARY TEXT( \\(125 chars\\))?', LABELS),
    fullBody:        grab('FULL BODY COPY',           LABELS),
    cta:             grab('CTA BUTTON',               LABELS),
    hookA:           grab('HOOK VARIATION 1',         LABELS),
    hookB:           grab('HOOK VARIATION 2',         LABELS),
    hookC:           grab('HOOK VARIATION 3',         LABELS),
    objectionKiller: grab('OBJECTION KILLER',         LABELS),
  };
}

export default function AdsStudio() {
  const { subPlan, subStatus, session } = useAuth();
  const [, setLocation] = useLocation();

  // Inputs
  const [productName, setProductName] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [audience, setAudience] = useState('');
  const [pricePoint, setPricePoint] = useState('');
  const [benefit, setBenefit] = useState('');
  const [platforms, setPlatforms] = useState<Platform[]>(['Facebook', 'Instagram']);
  const [creativeType, setCreativeType] = useState('primary_text');
  const [funnelStage, setFunnelStage] = useState<typeof FUNNEL_STAGES[number]>('Cold Traffic');
  const [adObjective, setAdObjective] = useState<typeof AD_OBJECTIVES[number]>('Conversions');

  // DB picker
  const [showPicker, setShowPicker] = useState(false);
  const [dbProducts, setDbProducts] = useState<DbProduct[]>([]);
  const [dbLoading, setDbLoading] = useState(false);

  // Output
  const [parsed, setParsed] = useState<ParsedSections | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string>('');
  const [token, setToken] = useState('');

  // Saved ads
  const [saved, setSaved] = useState<SavedAd[]>([]);
  const [expandedSaved, setExpandedSaved] = useState<number | null>(null);

  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = 'Ads Studio | Majorka';
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setToken(data.session.access_token);
    });
    setSaved(loadSavedAds());
  }, []);

  async function openPicker() {
    setShowPicker(true);
    if (dbProducts.length > 0) return;
    setDbLoading(true);
    try {
      // Use the server route — bypasses RLS via service role key, no client-side auth hassle
      const r = await fetch('/api/products/top20');
      if (!r.ok) {
        console.error('[ads-studio] DB picker HTTP error:', r.status);
        setDbProducts([]);
        return;
      }
      const data = await r.json() as { products: DbProduct[]; count: number; error?: string };
      if (data.error) {
        console.error('[ads-studio] DB picker server error:', data.error);
        setDbProducts([]);
        return;
      }
      console.info(`[ads-studio] DB picker loaded ${data.count} products via /api/products/top20`);
      setDbProducts(data.products ?? []);
    } catch (err) {
      console.error('[ads-studio] DB picker threw:', err);
      setDbProducts([]);
    } finally {
      setDbLoading(false);
    }
  }

  function pickProduct(p: DbProduct) {
    setProductName(p.product_title);
    if (p.price_aud != null) {
      setPricePoint(`$${Number(p.price_aud).toFixed(2)} AUD`);
    }
    if (p.product_url) setProductUrl(p.product_url);
    setShowPicker(false);
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  }

  function togglePlatform(p: Platform) {
    setPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  }

  async function generate() {
    // Log FIRST so we can see if the handler is firing even when validation bails.
    console.log('[generate] FIRED - productName:', productName, 'price:', pricePoint);
    if (!productName.trim()) {
      console.warn('[generate] aborted — productName is empty');
      return;
    }
    setLoading(true);
    setParsed(null);

    const userPrompt = `Write a complete ad package for this dropshipping product targeting the Australian market.

PRODUCT: ${productName}
PRICE: ${pricePoint || 'not specified'} AUD
TARGET AUDIENCE: ${audience || 'Australian dropshipping customers aged 25-45'}
KEY BENEFIT: ${benefit || 'not specified'}
FUNNEL STAGE: ${funnelStage}
PLATFORMS: ${platforms.join(', ')}
CREATIVE TYPE: ${CREATIVE_TYPES.find((t) => t.id === creativeType)?.label ?? creativeType}

Return EXACTLY this structure with these labels:

PRIMARY HOOK:
[The first 1-2 sentences that stop the scroll. Must be punchy and specific to this product. No fluff.]

HEADLINE:
[Under 40 characters. Benefit-led. Specific.]

PRIMARY TEXT (125 chars):
[The preview text. MUST be under 125 characters. Count carefully.]

FULL BODY COPY:
[3-4 sentences. Includes a social proof signal, addresses the main objection, ends with urgency and CTA. Conversational AU English.]

CTA BUTTON:
[One of: Shop Now / Get Yours / Order Today / Grab It / Try It Now]

HOOK VARIATION 1:
[Alternative opening line for split testing]

HOOK VARIATION 2:
[Another alternative opening]

HOOK VARIATION 3:
[Another alternative opening]

OBJECTION KILLER:
[One sentence that neutralises the main reason someone would scroll past]`;

    const API_URL = '/api/ai/generate';
    try {
      console.log('[generate] calling API at:', API_URL);
      const r = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          tool: 'ads_studio',
          system: ADS_SYSTEM_PROMPT,
          prompt: userPrompt,
          productName,
          platforms,
          creativeType,
          model: 'claude-haiku-4-5',
          max_tokens: 1400,
        }),
      });
      console.log('[generate] API response status:', r.status);
      const d = await r.json();
      const result: string = d.result || d.content || d.text || d.output || '';
      console.log('[ads-studio] raw result length:', result.length);
      if (!r.ok || !result) {
        const msg = r.status === 429
          ? 'Usage limit reached — try again in a minute.'
          : !result ? 'Empty response from AI — try again.'
          : `Generation failed (${r.status}).`;
        setParsed({
          primaryHook: msg, headline: '', primaryText: '', fullBody: '', cta: '',
          hookA: '', hookB: '', hookC: '', objectionKiller: '',
        });
        setLoading(false);
        return;
      }
      const sections = parseSections(result);
      console.log('[ads-studio] parsed output:', sections.primaryHook?.slice(0, 50) || '(empty)');
      setParsed(sections);

      // Persist to localStorage
      const entry: SavedAd = {
        id: Date.now(),
        productName,
        platform: platforms.join(' + '),
        createdAt: new Date().toISOString(),
        hook: sections.primaryHook,
        headline: sections.headline,
        primaryText: sections.primaryText,
        fullBody: sections.fullBody,
        cta: sections.cta,
      };
      const next = [entry, ...saved].slice(0, 10);
      setSaved(next);
      persistSavedAds(next);

      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err) {
      console.error('[ads-studio] generate error:', err);
      setParsed({
        primaryHook: 'Connection error — check your internet and try again.',
        headline: '', primaryText: '', fullBody: '', cta: '',
        hookA: '', hookB: '', hookC: '', objectionKiller: '',
      });
    }
    setLoading(false);
  }

  function deleteSaved(id: number) {
    const next = saved.filter((s) => s.id !== id);
    setSaved(next);
    persistSavedAds(next);
    if (expandedSaved === id) setExpandedSaved(null);
  }

  // Access gate
  const isAdmin = session?.user?.email === 'maximusmajorka@gmail.com';
  const isPaid = (subPlan === 'builder' || subPlan === 'scale') && subStatus === 'active';
  if (!isAdmin && !isPaid) {
    return <UpgradeModal isOpen={true} onClose={() => setLocation('/app')} feature="Ads Studio" reason="Generate high-converting ad creatives" />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0c', fontFamily: dm, color: '#e8e8f0' }}>
      {/* Header */}
      <div style={{ background: '#151515', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: brico, fontWeight: 800, fontSize: 22, color: '#f1f1f3', margin: 0, letterSpacing: '-0.02em' }}>Ads Studio</h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '3px 0 0' }}>Expert direct-response ad copy, crafted for AU dropshipping operators</p>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, color: '#10b981',
          background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)',
          padding: '4px 10px', borderRadius: 999, fontFamily: mono, letterSpacing: '0.05em',
        }}>✨ AI</span>
      </div>

      <div style={{ padding: '0 28px', paddingTop: 8 }}>
        <UsageMeter feature="ads_studio" limit={PLAN_LIMITS.builder.ads_studio} label="ad generations" />
      </div>

      {/* 3-col */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 280px', height: 'calc(100vh - 61px)', overflow: 'hidden' }}>
        {/* ── LEFT: Form — flex column so generate button can pin to bottom without sticky quirks ── */}
        <div style={{
          position: 'relative',
          background: '#151515',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
        }}>
        {/* Scrollable form content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '18px 18px 12px',
          minHeight: 0,
        }}>
          {/* DB Picker button */}
          <button
            onClick={openPicker}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'rgba(124,106,255,0.1)',
              border: '1px solid rgba(124,106,255,0.28)',
              borderRadius: 9,
              color: '#a78bfa',
              fontFamily: dm, fontSize: 12, fontWeight: 600,
              cursor: 'pointer',
              marginBottom: 14,
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >🎯 Pick from your product database</button>

          {showPicker && (
            <div style={{
              position: 'absolute',
              top: 60,
              left: 18,
              right: 18,
              zIndex: 50,
              background: '#1c1c1c',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              maxHeight: 320,
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}>
              <div style={{
                padding: '10px 14px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontFamily: mono, fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Top 20 by orders
                </span>
                <button onClick={() => setShowPicker(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 16 }}>×</button>
              </div>
              {dbLoading ? (
                <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Loading…</div>
              ) : dbProducts.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>No products found</div>
              ) : dbProducts.map((p) => {
                const truncName = (p.product_title ?? '').length > 45 ? (p.product_title ?? '').slice(0, 45) + '…' : p.product_title;
                return (
                  <button
                    key={p.id}
                    onClick={() => pickProduct(p)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 14px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 100ms',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,106,255,0.06)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                  >
                    <div style={{
                      width: 40, height: 40,
                      borderRadius: 6,
                      background: '#0f0f14',
                      flexShrink: 0,
                      overflow: 'hidden',
                    }}>
                      {p.image_url && (
                        <img
                          src={proxyImage(p.image_url) ?? p.image_url}
                          alt={p.product_title}
                          loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#e8e8f0', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {truncName}
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {p.category && (
                          <span style={{
                            fontSize: 9,
                            background: 'rgba(255,255,255,0.05)',
                            color: 'rgba(255,255,255,0.5)',
                            padding: '1px 6px',
                            borderRadius: 999,
                            fontFamily: dm,
                          }}>{p.category.length > 20 ? p.category.slice(0, 20) + '…' : p.category}</span>
                        )}
                        {p.sold_count != null && p.sold_count > 0 && (
                          <span style={{ fontSize: 10, color: '#10b981', fontFamily: mono, fontWeight: 600 }}>
                            {p.sold_count >= 1000 ? `${Math.round(p.sold_count / 1000)}k` : p.sold_count} orders
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Product details */}
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontFamily: mono }}>Product Details</div>

          {[
            { label: 'Product Name *', value: productName, set: setProductName, placeholder: 'e.g. LED Light Therapy Face Mask', required: true },
            { label: 'Product URL',    value: productUrl,  set: setProductUrl,  placeholder: 'https://yourstore.com/product', required: false },
            { label: 'Target Audience', value: audience,   set: setAudience,    placeholder: 'e.g. Women 28–45, AU, skincare', required: false },
            { label: 'Price Point',    value: pricePoint,  set: setPricePoint,  placeholder: 'e.g. $49.99 AUD', required: false },
          ].map(({ label, value, set, placeholder, required }) => (
            <div key={label} style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{label}</label>
              <input
                value={value}
                onChange={(e) => set(e.target.value)}
                placeholder={placeholder}
                style={{
                  width: '100%',
                  height: 34,
                  padding: '0 10px',
                  border: `1px solid ${required && !value ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 7,
                  fontSize: 12,
                  color: '#f1f1f3',
                  background: '#0a0a0c',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: dm,
                }}
              />
            </div>
          ))}

          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Key Benefit / USP</label>
            <textarea
              value={benefit}
              onChange={(e) => setBenefit(e.target.value)}
              placeholder="e.g. reduces back pain in 10 min, visible results in 7 days"
              rows={2}
              style={{
                width: '100%', padding: '6px 10px',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7,
                fontSize: 12, color: '#f1f1f3', background: '#0a0a0c',
                outline: 'none', resize: 'none' as const, boxSizing: 'border-box', fontFamily: dm,
              }}
            />
          </div>

          {/* Funnel stage */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Funnel Stage</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {FUNNEL_STAGES.map((s) => {
                const active = funnelStage === s;
                return (
                  <button key={s} onClick={() => setFunnelStage(s)} style={{
                    textAlign: 'left',
                    padding: '7px 10px',
                    background: active ? 'rgba(124,106,255,0.1)' : 'transparent',
                    border: `1px solid ${active ? 'rgba(124,106,255,0.25)' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 7,
                    fontSize: 11, fontWeight: 600,
                    color: active ? '#f1f1f3' : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                  }}>
                    {s === 'Cold Traffic' ? '🧊 ' : s === 'Warm Retargeting' ? '🔥 ' : '🛒 '}{s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Objective */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Ad Objective</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {AD_OBJECTIVES.map((o) => {
                const active = adObjective === o;
                return (
                  <button key={o} onClick={() => setAdObjective(o)} style={{
                    flex: 1, height: 28,
                    background: active ? 'rgba(124,106,255,0.1)' : 'transparent',
                    color: active ? '#f1f1f3' : 'rgba(255,255,255,0.5)',
                    border: `1px solid ${active ? 'rgba(124,106,255,0.25)' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 6, fontSize: 10, fontWeight: 600,
                    cursor: 'pointer',
                  }}>{o}</button>
                );
              })}
            </div>
          </div>

          {/* Platforms */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Platforms</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
              {PLATFORMS.map((p) => {
                const active = platforms.includes(p.id);
                return (
                  <button key={p.id} onClick={() => togglePlatform(p.id)} style={{
                    padding: '6px 8px',
                    background: active ? 'rgba(124,106,255,0.1)' : 'transparent',
                    border: `1px solid ${active ? 'rgba(124,106,255,0.25)' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                  }}>
                    <div style={{ fontSize: 14, lineHeight: 1 }}>{p.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: active ? '#f1f1f3' : 'rgba(255,255,255,0.55)', marginTop: 2 }}>{p.label}</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{p.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Creative type */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Creative Type</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {CREATIVE_TYPES.map((ct) => {
                const active = creativeType === ct.id;
                return (
                  <button key={ct.id} onClick={() => setCreativeType(ct.id)} style={{
                    textAlign: 'left', padding: '7px 10px',
                    background: active ? 'rgba(124,106,255,0.1)' : 'transparent',
                    border: `1px solid ${active ? 'rgba(124,106,255,0.25)' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 8, cursor: 'pointer',
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: active ? '#f1f1f3' : 'rgba(255,255,255,0.55)' }}>{ct.label}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>{/* end scrollable form content */}

          {/* Pinned Generate footer — outside scroll container, flex-shrink:0 */}
          <div style={{
            flexShrink: 0,
            background: '#151515',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            padding: '14px 18px 18px',
          }}>
            <button
              onClick={generate}
              disabled={loading || !productName.trim()}
              style={{
                width: '100%',
                height: 44,
                background: !productName.trim()
                  ? 'rgba(124,106,255,0.25)'
                  : 'linear-gradient(135deg, #7c6aff, #6366f1)',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                fontSize: 14, fontWeight: 600,
                cursor: loading || !productName.trim() ? 'not-allowed' : 'pointer',
                fontFamily: dm,
                boxShadow: !productName.trim() ? 'none' : '0 4px 20px rgba(124,106,255,0.35)',
                opacity: loading ? 0.7 : 1,
                transition: 'all 150ms ease',
              }}
            >{loading ? '⟳ Generating...' : 'Generate Ads →'}</button>
          </div>
        </div>

        {/* ── CENTER: Output ── */}
        <div ref={outputRef} style={{ overflowY: 'auto', padding: '24px 28px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #7c6aff, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>✨</div>
              <div style={{ fontFamily: brico, fontSize: 16, fontWeight: 800 }}>Writing your ad package…</div>
            </div>
          ) : parsed ? (
            <OutputDisplay parsed={parsed} copied={copied} copyText={copyText} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60%' }}>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', fontFamily: dm }}>
                Fill in your product details and click Generate
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Saved ── */}
        <div style={{ background: '#151515', borderLeft: '1px solid rgba(255,255,255,0.06)', overflowY: 'auto', padding: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontFamily: mono }}>Saved Creatives</div>
          {saved.length === 0 ? (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'center', padding: '16px 0', lineHeight: 1.55 }}>
              No saved ads yet — generate your first ad pack
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {saved.map((s) => {
                const isOpen = expandedSaved === s.id;
                return (
                  <div key={s.id} style={{
                    background: '#0a0a0c',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 8,
                    overflow: 'hidden',
                  }}>
                    <button
                      onClick={() => setExpandedSaved(isOpen ? null : s.id)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 12px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 13, fontWeight: 600, color: '#ffffff',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4,
                          }}>{s.productName}</div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                            <span style={{
                              fontSize: 9,
                              background: 'rgba(124,106,255,0.12)',
                              color: '#a78bfa',
                              padding: '1px 6px',
                              borderRadius: 999,
                              fontFamily: mono, fontWeight: 600,
                            }}>{s.platform}</span>
                            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: mono }}>
                              {new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>
                            {(s.primaryText ?? '').slice(0, 60)}{(s.primaryText ?? '').length > 60 ? '…' : ''}
                          </div>
                        </div>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); deleteSaved(s.id); }}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); deleteSaved(s.id); } }}
                          title="Delete"
                          aria-label="Delete saved ad"
                          style={{
                            padding: 4,
                            background: 'none',
                            color: 'rgba(255,255,255,0.3)',
                            cursor: 'pointer',
                            flexShrink: 0,
                            display: 'inline-flex',
                          }}
                        ><Trash2 size={13} /></span>
                      </div>
                    </button>
                    {isOpen && (
                      <div style={{ padding: '8px 12px 12px', borderTop: '1px solid rgba(255,255,255,0.04)', background: '#0f0f14' }}>
                        {[
                          { label: 'HOOK', value: s.hook },
                          { label: 'HEADLINE', value: s.headline },
                          { label: 'PRIMARY TEXT', value: s.primaryText },
                          { label: 'BODY', value: s.fullBody },
                          { label: 'CTA', value: s.cta },
                        ].filter((x) => x.value).map((x) => (
                          <div key={x.label} style={{ marginBottom: 8 }}>
                            <div style={{ fontFamily: mono, fontSize: 8, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>{x.label}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{x.value}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Output display with per-section cards + char counters + copy buttons ──
function OutputDisplay({ parsed, copied, copyText }: { parsed: ParsedSections; copied: string; copyText: (text: string, key: string) => void }) {
  const cards: { key: string; label: string; value: string; limit?: number }[] = [
    { key: 'hook',     label: 'Primary Hook',          value: parsed.primaryHook },
    { key: 'headline', label: 'Headline',              value: parsed.headline, limit: 40 },
    { key: 'primary',  label: 'Primary Text (Mobile Preview)', value: parsed.primaryText, limit: 125 },
    { key: 'body',     label: 'Full Body Copy',        value: parsed.fullBody },
    { key: 'cta',      label: 'CTA Button',            value: parsed.cta },
    { key: 'kill',     label: 'Objection Killer',      value: parsed.objectionKiller },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 820 }}>
      {cards.map((c) => <SectionCard key={c.key} {...c} copied={copied} copyText={copyText} />)}

      {/* Hook variations — side by side */}
      {(parsed.hookA || parsed.hookB || parsed.hookC) && (
        <div>
          <div style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10, marginTop: 6 }}>
            Hook Variations — split test these
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {[
              { key: 'hookA', label: 'Hook A', value: parsed.hookA },
              { key: 'hookB', label: 'Hook B', value: parsed.hookB },
              { key: 'hookC', label: 'Hook C', value: parsed.hookC },
            ].filter((h) => h.value).map((h) => <SectionCard key={h.key} {...h} copied={copied} copyText={copyText} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionCard({ key: _k, label, value, limit, copied, copyText }: { key: string; label: string; value: string; limit?: number; copied: string; copyText: (text: string, key: string) => void }) {
  const len = value.length;
  const overLimit = limit != null && len > limit;
  const copyKey = `sec-${label.slice(0, 16)}`;
  return (
    <div style={{
      background: '#1c1c1c',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10,
      padding: '14px 16px',
      position: 'relative',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: mono, fontSize: 9,
            color: 'rgba(255,255,255,0.3)',
            textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>{label}</span>
          {limit != null && (
            <span style={{
              fontFamily: mono, fontSize: 9, fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 999,
              background: overLimit ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
              color: overLimit ? '#f87171' : '#10b981',
              border: `1px solid ${overLimit ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
            }}>{len}/{limit}{overLimit ? ' ⚠' : ' ✓'}</span>
          )}
        </div>
        <button
          onClick={() => copyText(value, copyKey)}
          style={{
            background: copied === copyKey ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${copied === copyKey ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`,
            color: copied === copyKey ? '#10b981' : 'rgba(255,255,255,0.65)',
            fontSize: 11, fontWeight: 600,
            fontFamily: dm,
            padding: '4px 10px',
            borderRadius: 6,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >{copied === copyKey ? 'Copied ✓' : 'Copy'}</button>
      </div>
      <div style={{
        fontSize: 14, fontFamily: dm, color: '#f1f1f3',
        lineHeight: 1.6, whiteSpace: 'pre-wrap',
      }}>{value || <span style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>—</span>}</div>
    </div>
  );
}
