import { useState, useEffect, useRef, type CSSProperties } from 'react';
import { Sparkles, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/_core/hooks/useAuth';
import UpgradeModal from '@/components/UpgradeModal';
import UsageMeter from '@/components/UsageMeter';
import { proxyImage } from '@/lib/imageProxy';
import { PLAN_LIMITS } from '@shared/plans';
import { useLocation } from 'wouter';
import MetaVariantsPanel, {
  SavedAdSetsDrawer,
  type SavedAdSet,
} from '@/components/ads/MetaVariantsPanel';

const brico = "'Syne', sans-serif";
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

type ImageStyle = 'lifestyle' | 'product' | 'ugc' | 'flatlay';
type ImageAspect = '1:1' | '9:16' | '4:5';
interface ImageHealth {
  ok: boolean;
  provider: string;
  reason?: 'no_provider';
}

const IMAGE_STYLES: { id: ImageStyle; label: string; sub: string }[] = [
  { id: 'lifestyle', label: 'Lifestyle', sub: 'Real-home feel' },
  { id: 'product',   label: 'Product',   sub: 'Clean white bg' },
  { id: 'ugc',       label: 'UGC',       sub: 'iPhone mockup' },
  { id: 'flatlay',   label: 'Flat Lay',  sub: 'Top-down editorial' },
];

const IMAGE_ASPECTS: { id: ImageAspect; label: string; sub: string }[] = [
  { id: '1:1',  label: '1:1',  sub: 'Feed' },
  { id: '9:16', label: '9:16', sub: 'Story / Reel' },
  { id: '4:5',  label: '4:5',  sub: 'Feed Tall' },
];

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
  const EXAMPLE_PARSED: ParsedSections = {
    primaryHook: 'Why 50,000+ Australians Can\u2019t Stop Buying This',
    headline: 'Why 50,000+ Australians Can\u2019t Stop Buying This',
    primaryText: 'Finally — a kitchen gadget that actually works. Ships from AU warehouse. Try it risk-free.',
    fullBody: 'Finally — a kitchen gadget that actually works. Ships from AU warehouse. Try it risk-free.',
    cta: 'Shop Now \u2192',
    hookA: '',
    hookB: '',
    hookC: '',
    objectionKiller: '',
  };
  const [parsed, setParsed] = useState<ParsedSections | null>(EXAMPLE_PARSED);
  const [isExample, setIsExample] = useState(true);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string>('');
  const [token, setToken] = useState('');

  // Saved ads
  const [saved, setSaved] = useState<SavedAd[]>([]);
  const [expandedSaved, setExpandedSaved] = useState<number | null>(null);

  // Visual Creative (image generation)
  const [imageStyle, setImageStyle] = useState<ImageStyle>('lifestyle');
  const [imageAspect, setImageAspect] = useState<ImageAspect>('1:1');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string>('');
  const [imageProvider, setImageProvider] = useState<string>('');
  const [imageHealth, setImageHealth] = useState<ImageHealth>({ ok: false, provider: 'unknown' });
  const [imageUrlCopied, setImageUrlCopied] = useState(false);

  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = 'Ads Studio | Majorka';
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setToken(data.session.access_token);
    });
    setSaved(loadSavedAds());

    // Pre-fill from a 'Create Ad' click on the Products page.
    // sessionStorage key written by ProductSheet handleCreateAd.
    try {
      const stored = sessionStorage.getItem('majorka_ad_product');
      if (stored) {
        const prod = JSON.parse(stored) as {
          id?: string | number;
          title?: string;
          image?: string;
          price?: number | string;
        };
        if (prod.title) setProductName(String(prod.title));
        if (prod.price != null) setPricePoint(`$${Number(prod.price).toFixed(2)} AUD`);
        if (typeof prod.image === 'string') setProductUrl(prod.image);
        sessionStorage.removeItem('majorka_ad_product');
      }
    } catch {
      // ignore malformed payload
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/health/image')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('image_health_http'))))
      .then((h: ImageHealth) => {
        if (!cancelled) setImageHealth(h);
      })
      .catch(() => {
        if (!cancelled) setImageHealth({ ok: false, provider: 'unknown', reason: 'no_provider' });
      });
    return () => { cancelled = true; };
  }, []);

  async function generateImage() {
    if (!imageHealth.ok) return;
    if (!productName.trim()) {
      setImageError('Add a product name first — top of the form.');
      return;
    }
    setImageError('');
    setImageLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const freshToken = sessionData.session?.access_token ?? token;
      if (!freshToken) {
        setImageError('Please sign in to generate images.');
        setImageLoading(false);
        return;
      }
      const adCopy = parsed
        ? [parsed.primaryHook, parsed.headline, parsed.primaryText, parsed.fullBody].filter(Boolean).join(' — ')
        : benefit;
      const r = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${freshToken}` },
        body: JSON.stringify({
          productTitle: productName,
          adCopy,
          style: imageStyle,
          aspect: imageAspect,
        }),
      });
      const d = (await r.json()) as {
        ok: boolean;
        imageUrl?: string;
        provider?: string;
        reason?: string;
        message?: string;
      };
      if (!d.ok || !d.imageUrl) {
        const msg =
          d.reason === 'no_provider'
            ? 'Image provider not configured — add FAL_KEY or OPENAI_API_KEY.'
            : d.reason === 'usage_limit'
            ? 'Monthly image limit reached on your plan.'
            : d.message || 'Generation failed — try again.';
        setImageError(msg);
        setImageLoading(false);
        return;
      }
      setImageUrl(d.imageUrl);
      setImageProvider(d.provider ?? '');
    } catch {
      setImageError('Connection error — check your internet and try again.');
    }
    setImageLoading(false);
  }

  async function copyImageUrl() {
    if (!imageUrl) return;
    try {
      await navigator.clipboard.writeText(imageUrl);
      setImageUrlCopied(true);
      setTimeout(() => setImageUrlCopied(false), 1200);
    } catch {
      // ignore clipboard errors
    }
  }

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
    if (!productName.trim()) {
      return;
    }
    setLoading(true);
    setParsed(null);
    setIsExample(false);

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
      // Always fetch a fresh session at call time — avoids empty-token race on first click
      const { data: sessionData } = await supabase.auth.getSession();
      const freshToken = sessionData.session?.access_token ?? token;
      if (!freshToken) {
        setParsed({
          primaryHook: 'Please sign in to generate ads.',
          headline: '', primaryText: '', fullBody: '', cta: '',
          hookA: '', hookB: '', hookC: '', objectionKiller: '',
        });
        setLoading(false);
        return;
      }
      const r = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${freshToken}` },
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
      const d = await r.json();
      const result: string = d.result || d.content || d.text || d.output || '';
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
      <style>{`
        @media (max-width: 1024px) {
          .mj-ads-3col { grid-template-columns: 1fr !important; height: auto !important; overflow: visible !important; }
          .mj-ads-3col > * { height: auto !important; min-height: 0 !important; border-right: none !important; }
        }
        @media (max-width: 640px) {
          .mj-ads-header { padding: 14px 16px !important; }
          .mj-ads-2col { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .mj-ads-generate-footer {
            position: fixed !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            background: linear-gradient(to bottom, rgba(8,8,8,0) 0%, rgba(8,8,8,0.95) 30%, #080808 70%) !important;
            padding: 24px 16px env(safe-area-inset-bottom, 16px) !important;
            border-top: 1px solid rgba(212,175,55,0.18) !important;
            z-index: 50 !important;
          }
        }
      `}</style>
      {/* Header */}
      <div className="mj-ads-header" style={{ background: '#151515', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
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
      <div className="mj-ads-3col" style={{ display: 'grid', gridTemplateColumns: '320px 1fr 280px', height: 'calc(100vh - 61px)', overflow: 'hidden' }}>
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
            <div className="mj-ads-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
              {PLATFORMS.map((p) => {
                const active = platforms.includes(p.id);
                const soon = p.id === 'TikTok' || p.id === 'YouTube';
                return (
                  <button
                    key={p.id}
                    onClick={() => { if (!soon) togglePlatform(p.id); }}
                    disabled={soon}
                    title={soon ? 'Coming soon — Meta ads available now' : undefined}
                    aria-disabled={soon || undefined}
                    style={{
                      position: 'relative',
                      padding: '6px 8px',
                      background: active ? 'rgba(124,106,255,0.1)' : 'transparent',
                      border: `1px solid ${active ? 'rgba(124,106,255,0.25)' : 'rgba(255,255,255,0.07)'}`,
                      borderRadius: 8,
                      cursor: soon ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                      opacity: soon ? 0.5 : 1,
                      pointerEvents: soon ? 'none' : 'auto',
                    }}
                  >
                    <div style={{ fontSize: 14, lineHeight: 1 }}>{p.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: active ? '#f1f1f3' : 'rgba(255,255,255,0.55)', marginTop: 2 }}>{p.label}</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{p.sub}</div>
                    {soon && (
                      <span style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        fontFamily: mono,
                        fontSize: 8,
                        fontWeight: 700,
                        color: '#d4af37',
                        background: 'rgba(212,175,55,0.12)',
                        border: '1px solid rgba(212,175,55,0.3)',
                        padding: '1px 5px',
                        borderRadius: 999,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}>Soon</span>
                    )}
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

          {/* Sticky Generate footer — pinned with fade gradient overlay */}
          <div
            className="mj-ads-generate-footer"
            style={{
              position: 'sticky',
              bottom: 0,
              flexShrink: 0,
              background: 'linear-gradient(to bottom, rgba(21,21,21,0) 0%, rgba(21,21,21,0.92) 35%, #151515 70%)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              padding: '20px 18px 18px',
              zIndex: 10,
            }}
          >
            <button
              onClick={generate}
              disabled={loading || !productName.trim()}
              style={{
                width: '100%',
                height: 44,
                background: !productName.trim()
                  ? 'rgba(124,106,255,0.25)'
                  : 'linear-gradient(135deg, #7c6aff, #d4af37)',
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
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #7c6aff, #d4af37)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>✨</div>
              <div style={{ fontFamily: brico, fontSize: 16, fontWeight: 800 }}>Writing your ad package…</div>
            </div>
          ) : parsed ? (
            <>
              <OutputDisplay parsed={parsed} copied={copied} copyText={copyText} isExample={isExample} />
              <VisualCreativeCard
                style={imageStyle}
                aspect={imageAspect}
                setStyle={setImageStyle}
                setAspect={setImageAspect}
                onGenerate={generateImage}
                onCopyUrl={copyImageUrl}
                imageUrl={imageUrl}
                loading={imageLoading}
                error={imageError}
                provider={imageProvider}
                health={imageHealth}
                urlCopied={imageUrlCopied}
              />
              <MetaVariantsPanel
                product={{
                  title: productName,
                  image: productUrl || null,
                  url: null,
                  price: pricePoint,
                  benefit,
                  audienceHint: audience,
                }}
              />
            </>
          ) : productName.trim() ? (
            <MetaVariantsPanel
              product={{
                title: productName,
                image: productUrl || null,
                url: null,
                price: pricePoint,
                benefit,
                audienceHint: audience,
              }}
            />
          ) : (
            <div style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50%' }}>
              <EmptyState
                icon={<Sparkles size={40} strokeWidth={1.75} />}
                title="Generate your first ad copy"
                body="Pick a product, choose a format, and Majorka generates headline + body + CTA in 10 seconds."
                primaryCta={{ label: 'Pick a product', href: '/app/products' }}
              />
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
      <SavedAdSetsDrawer
        onRestore={(s: SavedAdSet) => {
          setProductName(s.product_title);
          if (s.product_image) setProductUrl(s.product_image);
        }}
      />
    </div>
  );
}

// ── Output display with per-section cards + char counters + copy buttons ──
function OutputDisplay({ parsed, copied, copyText, isExample = false }: { parsed: ParsedSections; copied: string; copyText: (text: string, key: string) => void; isExample?: boolean }) {
  const cards: { key: string; label: string; value: string; limit?: number }[] = [
    { key: 'hook',     label: 'Primary Hook',          value: parsed.primaryHook },
    { key: 'headline', label: 'Headline',              value: parsed.headline, limit: 40 },
    { key: 'primary',  label: 'Primary Text (Mobile Preview)', value: parsed.primaryText, limit: 125 },
    { key: 'body',     label: 'Full Body Copy',        value: parsed.fullBody },
    { key: 'cta',      label: 'CTA Button',            value: parsed.cta },
    { key: 'kill',     label: 'Objection Killer',      value: parsed.objectionKiller },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 820, position: 'relative' }}>
      {isExample && (
        <div
          aria-label="Example preview"
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            zIndex: 5,
            background: 'linear-gradient(135deg, #d4af37, #e5c158)',
            color: '#0a0a0c',
            fontFamily: mono,
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.12em',
            padding: '4px 10px',
            borderRadius: 999,
            boxShadow: '0 4px 14px rgba(212,175,55,0.35)',
            pointerEvents: 'none',
            maxWidth: 'calc(100% - 8px)',
          }}
        >EXAMPLE</div>
      )}
      {cards.map(({ key: cardKey, ...c }) => <SectionCard key={cardKey} {...c} copied={copied} copyText={copyText} />)}

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
            ].filter((h) => h.value).map(({ key: hKey, ...h }) => <SectionCard key={hKey} {...h} copied={copied} copyText={copyText} />)}
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

// ── Visual Creative card — real ad image generation (fal.ai / OpenAI) ─────
interface VisualCreativeCardProps {
  style: ImageStyle;
  aspect: ImageAspect;
  setStyle: (s: ImageStyle) => void;
  setAspect: (a: ImageAspect) => void;
  onGenerate: () => void;
  onCopyUrl: () => void;
  imageUrl: string;
  loading: boolean;
  error: string;
  provider: string;
  health: ImageHealth;
  urlCopied: boolean;
}

function VisualCreativeCard({
  style, aspect, setStyle, setAspect,
  onGenerate, onCopyUrl, imageUrl, loading, error, provider, health, urlCopied,
}: VisualCreativeCardProps) {
  const disabled = !health.ok || loading;
  const disabledTooltip = !health.ok
    ? 'Add FAL_KEY or OPENAI_API_KEY in Vercel env to enable image generation.'
    : '';

  const aspectBoxStyle: Record<ImageAspect, CSSProperties> = {
    '1:1':  { aspectRatio: '1 / 1'  },
    '9:16': { aspectRatio: '9 / 16' },
    '4:5':  { aspectRatio: '4 / 5'  },
  };

  return (
    <div style={{
      marginTop: 16, maxWidth: 820,
      background: '#1c1c1c',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12,
      padding: '16px 18px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12, gap: 10 }}>
        <div>
          <div style={{ fontFamily: brico, fontWeight: 800, fontSize: 15, color: '#f1f1f3', letterSpacing: '-0.01em' }}>
            Visual Creative
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
            Generate a thumb-stopping ad image with {health.ok ? (health.provider === 'fal' ? 'fal.ai Flux' : 'OpenAI') : 'real AI'}
          </div>
        </div>
        {provider && (
          <span style={{
            fontFamily: mono, fontSize: 9, fontWeight: 700,
            padding: '3px 8px', borderRadius: 999,
            background: 'rgba(124,106,255,0.12)', color: '#a78bfa',
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>{provider}</span>
        )}
      </div>

      {!health.ok && (
        <div style={{
          marginBottom: 12, padding: '10px 12px',
          borderRadius: 8,
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.25)',
          color: '#fbbf24',
          fontSize: 12, lineHeight: 1.5, fontFamily: dm,
        }}>
          Image generation is disabled. Add <span style={{ fontFamily: mono }}>FAL_KEY</span> or <span style={{ fontFamily: mono }}>OPENAI_API_KEY</span> in Vercel env to enable.
        </div>
      )}

      {/* Style chips */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Style</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {IMAGE_STYLES.map((s) => {
            const active = style === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                disabled={loading}
                style={{
                  padding: '6px 12px', borderRadius: 8,
                  background: active ? 'rgba(124,106,255,0.18)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${active ? 'rgba(124,106,255,0.45)' : 'rgba(255,255,255,0.08)'}`,
                  color: active ? '#c4b5fd' : 'rgba(255,255,255,0.7)',
                  fontSize: 12, fontWeight: 600, fontFamily: dm,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1,
                }}
              >
                <span>{s.label}</span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>{s.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Aspect chips */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Aspect</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {IMAGE_ASPECTS.map((a) => {
            const active = aspect === a.id;
            return (
              <button
                key={a.id}
                onClick={() => setAspect(a.id)}
                disabled={loading}
                style={{
                  padding: '6px 12px', borderRadius: 8,
                  background: active ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${active ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  color: active ? '#34d399' : 'rgba(255,255,255,0.7)',
                  fontSize: 12, fontWeight: 600, fontFamily: mono,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1,
                }}
              >
                <span>{a.label}</span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: 500, fontFamily: dm }}>{a.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary CTA */}
      <button
        onClick={onGenerate}
        disabled={disabled}
        title={disabledTooltip || undefined}
        style={{
          width: '100%', padding: '11px 14px', borderRadius: 10,
          background: disabled ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #7c6aff, #d4af37)',
          border: 'none',
          color: disabled ? 'rgba(255,255,255,0.35)' : '#ffffff',
          fontSize: 13, fontWeight: 700, fontFamily: brico, letterSpacing: '-0.01em',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? '⟳ Generating image…' : imageUrl ? 'Regenerate Image' : 'Generate Image →'}
      </button>

      {/* Error state */}
      {error && (
        <div style={{
          marginTop: 10, padding: '10px 12px',
          borderRadius: 8,
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.25)',
          color: '#f87171',
          fontSize: 12, lineHeight: 1.5, fontFamily: dm,
          display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center',
        }}>
          <span>{error}</span>
          <button
            onClick={onGenerate}
            disabled={disabled}
            style={{
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.35)',
              color: '#fca5a5',
              fontSize: 11, fontWeight: 600, fontFamily: dm,
              padding: '4px 10px', borderRadius: 6,
              cursor: disabled ? 'not-allowed' : 'pointer',
              flexShrink: 0,
            }}
          >Retry</button>
        </div>
      )}

      {/* Preview */}
      <div style={{ marginTop: 14 }}>
        <div style={{
          width: '100%', maxWidth: 480,
          background: '#0a0a0c',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 10,
          overflow: 'hidden',
          ...aspectBoxStyle[aspect],
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {loading ? (
            <div style={{
              width: '100%', height: '100%',
              background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.02) 100%)',
              backgroundSize: '200% 100%',
              animation: 'majorka-shimmer 1.4s linear infinite',
            }} />
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt="Generated ad creative"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', padding: 16, textAlign: 'center', fontFamily: dm }}>
              {health.ok
                ? 'Pick a style + aspect, then generate.'
                : 'Provider not configured.'}
            </div>
          )}
        </div>

        {/* Actions */}
        {imageUrl && !loading && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <a
              href={imageUrl}
              download={`majorka-ad-${Date.now()}.png`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#f1f1f3',
                fontSize: 11, fontWeight: 600, fontFamily: dm,
                padding: '6px 12px', borderRadius: 6,
                textDecoration: 'none',
              }}
            >Download</a>
            <button
              onClick={onCopyUrl}
              style={{
                background: urlCopied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${urlCopied ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`,
                color: urlCopied ? '#10b981' : '#f1f1f3',
                fontSize: 11, fontWeight: 600, fontFamily: dm,
                padding: '6px 12px', borderRadius: 6,
                cursor: 'pointer',
              }}
            >{urlCopied ? 'Copied ✓' : 'Copy URL'}</button>
            <button
              onClick={onGenerate}
              disabled={disabled}
              style={{
                background: 'rgba(124,106,255,0.12)',
                border: '1px solid rgba(124,106,255,0.28)',
                color: '#a78bfa',
                fontSize: 11, fontWeight: 600, fontFamily: dm,
                padding: '6px 12px', borderRadius: 6,
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >Regenerate</button>
          </div>
        )}
      </div>

      <style>{`@keyframes majorka-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  );
}
