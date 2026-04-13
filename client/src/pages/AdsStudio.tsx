import { useState, useEffect, useRef, useCallback } from 'react';
import { Trash2, Download, Copy, Check, Zap, TrendingUp, DollarSign, Target, ChevronRight, Plus, X, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/_core/hooks/useAuth';
import UpgradeModal from '@/components/UpgradeModal';
import UsageMeter from '@/components/UsageMeter';
import { proxyImage } from '@/lib/imageProxy';
import { PLAN_LIMITS } from '@shared/plans';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

const syne = "'Syne', 'Bricolage Grotesque', sans-serif";
const dm = "'DM Sans', sans-serif";
const mono = "'JetBrains Mono', monospace";

// ── Hook Frameworks ──
interface HookFramework {
  id: string;
  name: string;
  icon: string;
  template: string;
  description: string;
}

const HOOK_FRAMEWORKS: HookFramework[] = [
  { id: 'problem_solution', name: 'Problem → Solution', icon: '⚡', template: 'Tired of X? {Product} fixes it in Y.', description: 'Lead with the pain point, then present the product as the fix.' },
  { id: 'before_after', name: 'Before → After', icon: '✨', template: 'My {area} before vs after using {Product}.', description: 'Visual transformation narrative that drives curiosity.' },
  { id: 'social_proof', name: 'Social Proof', icon: '👥', template: '{X}k+ people already switched to {Product}.', description: 'Leverage crowd behaviour and FOMO to build trust.' },
  { id: 'urgency_scarcity', name: 'Urgency / Scarcity', icon: '⏳', template: "Only {N} left at this price. Here's why everyone wants {Product}.", description: 'Create time pressure with limited stock or pricing.' },
  { id: 'curiosity_hook', name: 'Curiosity Hook', icon: '🤔', template: "I can't believe this {Product} actually works for ${price}.", description: 'Open a curiosity gap the viewer must close by watching.' },
  { id: 'ugc_testimonial', name: 'UGC / Testimonial', icon: '🎤', template: 'I was skeptical, but after 2 weeks with {Product}...', description: 'First-person story format that feels authentic and relatable.' },
];

// ── Ad Format Tabs ──
interface AdFormat {
  id: string;
  label: string;
  platform: string;
  aspect: string;
  charLimit: number;
  headlineLimit: number;
  tone: string;
  chromeColor: string;
  chromeLabelColor: string;
  chromeLabel: string;
}

const AD_FORMATS: AdFormat[] = [
  { id: 'meta_feed', label: 'Meta Feed', platform: 'Meta', aspect: '1:1', charLimit: 125, headlineLimit: 40, tone: 'direct, benefit-led, AU English', chromeColor: '#1a1a2e', chromeLabelColor: '#4267B2', chromeLabel: 'Sponsored' },
  { id: 'meta_story', label: 'Meta Story', platform: 'Meta', aspect: '9:16', charLimit: 90, headlineLimit: 30, tone: 'shorter, swipe-up CTA, punchy', chromeColor: '#1a1a2e', chromeLabelColor: '#4267B2', chromeLabel: 'Story Ad' },
  { id: 'tiktok_feed', label: 'TikTok Feed', platform: 'TikTok', aspect: '9:16', charLimit: 150, headlineLimit: 40, tone: 'casual, emoji-heavy, 3-second hook, trending language', chromeColor: '#000000', chromeLabelColor: '#ff0050', chromeLabel: 'For You' },
  { id: 'tiktok_story', label: 'TikTok Story', platform: 'TikTok', aspect: '9:16', charLimit: 80, headlineLimit: 25, tone: 'ultra-short, trending sound reference, 15s max script', chromeColor: '#000000', chromeLabelColor: '#ff0050', chromeLabel: 'Promoted' },
];

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

interface FormatOutput {
  hook: string;
  headline: string;
  body: string;
  cta: string;
}

interface BulkVariation {
  id: number;
  hook: string;
  headline: string;
  body: string;
  cta: string;
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
  try { localStorage.setItem(SAVED_KEY, JSON.stringify(items.slice(0, 20))); } catch { /* ignore */ }
}

// ── CPM heuristics by category keyword ──
function getCPMRange(category: string | null): { low: number; high: number; label: string } {
  const cat = (category ?? '').toLowerCase();
  if (cat.includes('tech') || cat.includes('electronic') || cat.includes('gadget') || cat.includes('phone')) return { low: 8, high: 12, label: 'Tech' };
  if (cat.includes('beauty') || cat.includes('skin') || cat.includes('makeup') || cat.includes('hair')) return { low: 6, high: 10, label: 'Beauty' };
  if (cat.includes('home') || cat.includes('kitchen') || cat.includes('garden') || cat.includes('decor')) return { low: 5, high: 8, label: 'Home' };
  if (cat.includes('fashion') || cat.includes('clothing') || cat.includes('apparel') || cat.includes('jewel')) return { low: 10, high: 15, label: 'Fashion' };
  if (cat.includes('pet') || cat.includes('dog') || cat.includes('cat')) return { low: 4, high: 7, label: 'Pet' };
  if (cat.includes('fitness') || cat.includes('sport') || cat.includes('gym') || cat.includes('yoga')) return { low: 7, high: 11, label: 'Fitness' };
  if (cat.includes('baby') || cat.includes('kid') || cat.includes('toy')) return { low: 5, high: 9, label: 'Kids/Baby' };
  return { low: 6, high: 10, label: 'General' };
}

// ── Parse multi-format AI response ──
function parseMultiFormat(text: string): Record<string, FormatOutput> {
  const results: Record<string, FormatOutput> = {};
  for (const fmt of AD_FORMATS) {
    const sectionRe = new RegExp(`---\\s*${fmt.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*---([\\s\\S]*?)(?=---\\s*(?:Meta|TikTok)|$)`, 'i');
    const section = text.match(sectionRe);
    const block = section ? section[1] : '';
    const grab = (label: string): string => {
      const re = new RegExp(`${label}\\s*:\\s*(.+?)(?:\\n|$)`, 'i');
      const m = block.match(re);
      return m ? m[1].trim().replace(/^\[|\]$/g, '').trim() : '';
    };
    results[fmt.id] = {
      hook: grab('HOOK'),
      headline: grab('HEADLINE'),
      body: grab('BODY'),
      cta: grab('CTA'),
    };
  }
  return results;
}

// ── Parse bulk variations ──
function parseBulkVariations(text: string): BulkVariation[] {
  const variations: BulkVariation[] = [];
  const blocks = text.split(/(?:VARIATION|VAR)\s*#?\d+/i).filter((b) => b.trim());
  for (const block of blocks) {
    const grab = (label: string): string => {
      const re = new RegExp(`${label}\\s*:\\s*(.+?)(?:\\n|$)`, 'i');
      const m = block.match(re);
      return m ? m[1].trim().replace(/^\[|\]$/g, '').trim() : '';
    };
    const hook = grab('HOOK');
    const headline = grab('HEADLINE');
    const body = grab('BODY') || grab('COPY');
    const cta = grab('CTA');
    if (hook || headline) {
      variations.push({ id: Date.now() + variations.length, hook, headline, body, cta });
    }
  }
  return variations;
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
  const [funnelStage, setFunnelStage] = useState<typeof FUNNEL_STAGES[number]>('Cold Traffic');
  const [adObjective, setAdObjective] = useState<typeof AD_OBJECTIVES[number]>('Conversions');
  const [selectedFramework, setSelectedFramework] = useState<string | null>(null);

  // DB picker
  const [showPicker, setShowPicker] = useState(false);
  const [dbProducts, setDbProducts] = useState<DbProduct[]>([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<DbProduct | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');

  // Output
  const [formatOutputs, setFormatOutputs] = useState<Record<string, FormatOutput>>({});
  const [activeTab, setActiveTab] = useState('meta_feed');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState('');
  const [token, setToken] = useState('');

  // Bulk variations
  const [bulkVariations, setBulkVariations] = useState<BulkVariation[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Saved ads
  const [saved, setSaved] = useState<SavedAd[]>([]);
  const [expandedSaved, setExpandedSaved] = useState<number | null>(null);
  const [savedDrawerOpen, setSavedDrawerOpen] = useState(false);

  // Validation
  const [nameError, setNameError] = useState(false);

  const outputRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasOutput = Object.keys(formatOutputs).length > 0;

  useEffect(() => {
    document.title = 'Ads Studio | Majorka';
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setToken(data.session.access_token);
    });
    setSaved(loadSavedAds());

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

  // ── Picker: Escape key + click-outside ──
  useEffect(() => {
    if (!showPicker) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowPicker(false);
    }
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    }
    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);

  // ── Picker helpers ──
  const fetchTopProducts = useCallback(async () => {
    setDbLoading(true);
    try {
      const r = await fetch('/api/products/top20');
      if (!r.ok) { setDbProducts([]); return; }
      const data = await r.json() as { products: DbProduct[]; count: number; error?: string };
      if (data.error) { setDbProducts([]); return; }
      setDbProducts(data.products ?? []);
    } catch {
      setDbProducts([]);
    } finally {
      setDbLoading(false);
    }
  }, []);

  async function openPicker() {
    setShowPicker(true);
    setPickerSearch('');
    await fetchTopProducts();
  }

  // FIX 14: Debounced search in picker
  useEffect(() => {
    if (!showPicker) return;
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    const q = pickerSearch.trim();
    if (!q) {
      fetchTopProducts();
      return;
    }
    if (q.length < 2) return;
    searchTimerRef.current = setTimeout(async () => {
      setDbLoading(true);
      try {
        const r = await fetch(`/api/products/top20?q=${encodeURIComponent(q)}`);
        if (!r.ok) return;
        const data = await r.json() as { products: DbProduct[]; count: number };
        // Fall back to client filter if server doesn't support q param
        if (data.products) {
          setDbProducts(data.products);
        }
      } catch {
        // Keep existing products, just filter client-side
      } finally {
        setDbLoading(false);
      }
    }, 300);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [pickerSearch, showPicker, fetchTopProducts]);

  function pickProduct(p: DbProduct) {
    setProductName(p.product_title);
    if (p.price_aud != null) setPricePoint(`$${Number(p.price_aud).toFixed(2)} AUD`);
    if (p.product_url) setProductUrl(p.product_url);
    setSelectedProduct(p);
    setShowPicker(false);
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  }

  // ── Intelligence computations ──
  function getIntelligence(p: DbProduct | null) {
    if (!p) return null;
    const sold = Number(p.sold_count) || 0;
    const price = Number(p.price_aud) || 0;
    const dailyOrders = Math.max(1, Math.floor(sold / 365));
    const suggestedBudget = Math.round(dailyOrders * price * 0.15 * 100) / 100;
    const competitionLevel = sold > 50000 ? 'high' : sold > 10000 ? 'medium' : 'low';
    const competitionLabel = competitionLevel === 'high'
      ? 'High competition \u2014 differentiate your angle'
      : competitionLevel === 'medium'
        ? 'Medium competition \u2014 good opportunities exist'
        : 'Low competition \u2014 great for new advertisers';
    return { dailyOrders, suggestedBudget, competitionLevel, competitionLabel, sold, price };
  }

  // ── Generate ──
  async function generate() {
    if (!productName.trim()) {
      setNameError(true);
      toast.error('Product name is required');
      return;
    }
    setNameError(false);
    setLoading(true);
    setFormatOutputs({});
    setBulkVariations([]);

    const framework = HOOK_FRAMEWORKS.find((f) => f.id === selectedFramework);
    const frameworkInstruction = framework
      ? `\n\nUse this hook framework: ${framework.name} \u2014 ${framework.template}`
      : '';

    const formatInstructions = AD_FORMATS.map((fmt) =>
      `--- ${fmt.label} ---\nHOOK: [${fmt.tone}, max ${fmt.charLimit} chars for body]\nHEADLINE: [max ${fmt.headlineLimit} chars]\nBODY: [${fmt.tone}, max ${fmt.charLimit} chars]\nCTA: [one of: Shop Now / Get Yours / Order Today / Grab It / Try It Now]`
    ).join('\n\n');

    const userPrompt = `Write ad copy for this dropshipping product targeting the Australian market. Generate copy for ALL 4 formats below.

PRODUCT: ${productName}
PRICE: ${pricePoint || 'not specified'} AUD
TARGET AUDIENCE: ${audience || 'Australian dropshipping customers aged 25-45'}
KEY BENEFIT: ${benefit || 'not specified'}
FUNNEL STAGE: ${funnelStage}
OBJECTIVE: ${adObjective}
${frameworkInstruction}

Return EXACTLY this structure with these section markers:

${formatInstructions}

Rules:
- Each format has different tone and length constraints — follow them strictly.
- TikTok copy should use emoji, casual language, trending phrases.
- Meta copy should be direct, benefit-led, professional AU English.
- Count characters carefully for each format.
- CTA must be one of: Shop Now / Get Yours / Order Today / Grab It / Try It Now`;

    const API_URL = '/api/ai/generate';
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const freshToken = sessionData.session?.access_token ?? token;
      if (!freshToken) {
        setFormatOutputs({ meta_feed: { hook: 'Please sign in to generate ads.', headline: '', body: '', cta: '' } });
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
          platforms: ['Facebook', 'Instagram', 'TikTok'],
          creativeType: 'primary_text',
          model: 'claude-haiku-4-5',
          max_tokens: 2400,
        }),
      });
      const d = await r.json();
      const result: string = d.result || d.content || d.text || d.output || '';
      if (!r.ok || !result) {
        const msg = r.status === 429
          ? 'Usage limit reached \u2014 try again in a minute.'
          : !result ? 'Empty response from AI \u2014 try again.'
          : `Generation failed (${r.status}).`;
        setFormatOutputs({ meta_feed: { hook: msg, headline: '', body: '', cta: '' } });
        setLoading(false);
        return;
      }
      const outputs = parseMultiFormat(result);
      setFormatOutputs(outputs);

      // Save to history
      const metaFeed = outputs.meta_feed ?? { hook: '', headline: '', body: '', cta: '' };
      const entry: SavedAd = {
        id: Date.now(),
        productName,
        platform: 'Multi-format',
        createdAt: new Date().toISOString(),
        hook: metaFeed.hook,
        headline: metaFeed.headline,
        primaryText: metaFeed.body,
        fullBody: Object.values(outputs).map((o) => `${o.hook}\n${o.body}`).join('\n\n'),
        cta: metaFeed.cta,
      };
      const next = [entry, ...saved].slice(0, 20);
      setSaved(next);
      persistSavedAds(next);

      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch {
      setFormatOutputs({ meta_feed: { hook: 'Connection error \u2014 check your internet and try again.', headline: '', body: '', cta: '' } });
    }
    setLoading(false);
  }

  // ── Bulk Variations ──
  async function generateBulkVariations() {
    if (!productName.trim()) {
      setNameError(true);
      toast.error('Product name is required');
      return;
    }
    setBulkLoading(true);

    const framework = HOOK_FRAMEWORKS.find((f) => f.id === selectedFramework);
    const frameworkNote = framework ? ` Use the ${framework.name} framework.` : '';

    const prompt = `Generate 5 different ad variations for this product. Each variation should have a completely different angle and hook.${frameworkNote}

PRODUCT: ${productName}
PRICE: ${pricePoint || 'not specified'} AUD
TARGET AUDIENCE: ${audience || 'Australian dropshipping customers aged 25-45'}
KEY BENEFIT: ${benefit || 'not specified'}

For each variation, output:
VARIATION #1
HOOK: [the opening line]
HEADLINE: [under 40 chars]
BODY: [2-3 sentences, conversational AU English]
CTA: [one of: Shop Now / Get Yours / Order Today / Grab It / Try It Now]

VARIATION #2
... (repeat for all 5)

Make each variation feel genuinely different — different angles, different emotions, different structures.`;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const freshToken = sessionData.session?.access_token ?? token;
      if (!freshToken) { setBulkLoading(false); return; }

      const r = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${freshToken}` },
        body: JSON.stringify({
          tool: 'ads_studio',
          system: ADS_SYSTEM_PROMPT,
          prompt,
          productName,
          platforms: ['Facebook'],
          creativeType: 'hook_variations',
          model: 'claude-haiku-4-5',
          max_tokens: 2000,
        }),
      });
      const d = await r.json();
      const result: string = d.result || d.content || d.text || d.output || '';
      if (result) {
        const parsed = parseBulkVariations(result);
        setBulkVariations((prev) => [...prev, ...parsed]);
      }
    } catch {
      // silent fail
    }
    setBulkLoading(false);
  }

  function deleteSaved(id: number) {
    const next = saved.filter((s) => s.id !== id);
    setSaved(next);
    persistSavedAds(next);
    if (expandedSaved === id) setExpandedSaved(null);
  }

  function removeVariation(id: number) {
    setBulkVariations((prev) => prev.filter((v) => v.id !== id));
  }

  function useVariation(v: BulkVariation) {
    const text = `HOOK: ${v.hook}\nHEADLINE: ${v.headline}\nBODY: ${v.body}\nCTA: ${v.cta}`;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(`var-${v.id}`);
    setTimeout(() => setCopied(''), 2000);
  }

  // ── Export CSV ──
  function exportCSV() {
    const rows: string[][] = [['Format', 'Hook', 'Headline', 'Body', 'CTA']];
    for (const fmt of AD_FORMATS) {
      const o = formatOutputs[fmt.id];
      if (o) {
        rows.push([fmt.label, o.hook, o.headline, o.body, o.cta]);
      }
    }
    for (const v of bulkVariations) {
      rows.push(['Variation', v.hook, v.headline, v.body, v.cta]);
    }
    const csv = rows.map((r) => r.map((c) => `"${(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const slug = (productName || 'ad-pack').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `majorka-ad-pack-${slug}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Exported as majorka-ads.csv');
  }

  // ── Export TXT (legacy) ──
  function exportTxt() {
    const lines = ['MAJORKA AD PACK', `Product: ${productName || 'N/A'}`, `Generated: ${new Date().toLocaleDateString('en-AU')}`, '---', ''];
    for (const fmt of AD_FORMATS) {
      const o = formatOutputs[fmt.id];
      if (o) {
        lines.push(`=== ${fmt.label} ===`, `Hook: ${o.hook}`, `Headline: ${o.headline}`, `Body: ${o.body}`, `CTA: ${o.cta}`, '');
      }
    }
    if (bulkVariations.length > 0) {
      lines.push('=== VARIATIONS ===', '');
      bulkVariations.forEach((v, i) => {
        lines.push(`Variation ${i + 1}:`, `Hook: ${v.hook}`, `Headline: ${v.headline}`, `Body: ${v.body}`, `CTA: ${v.cta}`, '');
      });
    }
    lines.push('---', 'Generated by Majorka \u00b7 majorka.io');
    const slug = (productName || 'ad-pack').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `majorka-ad-brief-${slug}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Access gate
  const isAdmin = session?.user?.email === 'maximusmajorka@gmail.com';
  const isPaid = (subPlan === 'builder' || subPlan === 'scale') && subStatus === 'active';
  if (!isAdmin && !isPaid) {
    return <UpgradeModal isOpen={true} onClose={() => setLocation('/app')} feature="Ads Studio" reason="Generate high-converting ad creatives" />;
  }

  const intel = getIntelligence(selectedProduct);
  const cpmRange = getCPMRange(selectedProduct?.category ?? null);
  const priceNum = Number(selectedProduct?.price_aud) || 0;
  const filteredProducts = dbProducts.filter((p) =>
    !pickerSearch || p.product_title.toLowerCase().includes(pickerSearch.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: '#080808', fontFamily: dm, color: '#ededed' }}>
      {/* Header */}
      <div style={{ background: '#0d0d0d', borderBottom: '1px solid #1a1a1a', padding: '16px 28px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div>
          <h1 style={{ fontFamily: syne, fontWeight: 800, fontSize: 22, color: '#f1f1f3', margin: 0, letterSpacing: '-0.02em' }}>Ads Studio</h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '3px 0 0' }}>AI ad creative engine for AU dropshipping operators</p>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, color: '#d4af37',
          background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)',
          padding: '4px 10px', borderRadius: 999, fontFamily: mono, letterSpacing: '0.05em',
        }}>AI STUDIO</span>
      </div>

      <div style={{ padding: '0 28px', paddingTop: 8 }}>
        <UsageMeter feature="ads_studio" limit={PLAN_LIMITS.builder.ads_studio} label="ad generations" />
      </div>

      {/* ── INTELLIGENCE PANEL ── */}
      {intel && selectedProduct && (
        <div style={{ padding: '12px 28px 0' }}>
          <div style={{
            display: 'grid', gap: 12,
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 8, padding: 16,
          }}>
            <IntelCard
              icon={<TrendingUp size={14} color="#d4af37" />}
              label="Daily Orders"
              value={`${intel.dailyOrders}/day`}
              sub={`${intel.sold.toLocaleString()} total orders`}
            />
            <IntelCard
              icon={<Target size={14} color={intel.competitionLevel === 'low' ? '#10b981' : intel.competitionLevel === 'medium' ? '#f59e0b' : '#f97316'} />}
              label="Competition"
              value={intel.competitionLevel.charAt(0).toUpperCase() + intel.competitionLevel.slice(1)}
              sub={intel.competitionLabel}
            />
            <IntelCard
              icon={<DollarSign size={14} color="#3B82F6" />}
              label="Suggested Daily Budget"
              value={`$${intel.suggestedBudget.toFixed(2)} AUD`}
              sub={`Based on ${intel.dailyOrders} orders/day at $${intel.price.toFixed(2)}`}
            />
            <IntelCard
              icon={<Zap size={14} color="#e5c158" />}
              label="Category"
              value={selectedProduct.category ? (selectedProduct.category.length > 22 ? selectedProduct.category.slice(0, 22) + '\u2026' : selectedProduct.category) : 'Uncategorised'}
              sub={`CPM range: $${cpmRange.low}\u2013$${cpmRange.high} (${cpmRange.label})`}
            />
          </div>
        </div>
      )}

      {/* Responsive layout styles */}
      <style>{`
        .ads-studio-layout {
          display: grid;
          grid-template-columns: 340px 1fr;
          overflow: hidden;
        }
        @media (min-width: 1280px) {
          .ads-studio-layout {
            grid-template-columns: 340px 1fr 280px;
          }
          .ads-studio-layout .ads-saved-panel { display: flex !important; }
          .ads-studio-layout .ads-saved-toggle { display: none !important; }
        }
        @media (max-width: 1279px) {
          .ads-studio-layout .ads-saved-panel { display: none !important; }
          .ads-studio-layout .ads-saved-toggle { display: flex !important; }
        }
        .ads-mockup-grid {
          grid-template-columns: minmax(200px, 260px) 1fr;
        }
        @media (max-width: 900px) {
          .ads-mockup-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      {/* Layout */}
      <div className="ads-studio-layout" style={{ height: intel ? 'calc(100vh - 170px)' : 'calc(100vh - 100px)' }}>
        {/* ── LEFT: Form ── */}
        <div style={{
          position: 'relative',
          background: '#0d0d0d',
          borderRight: '1px solid #1a1a1a',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
        }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 18px 12px', minHeight: 0 }}>
          {/* DB Picker button */}
          <button
            onClick={openPicker}
            style={{
              width: '100%', padding: '10px 12px',
              background: selectedProduct ? 'rgba(212,175,55,0.08)' : 'rgba(212,175,55,0.1)',
              border: `1px solid ${selectedProduct ? 'rgba(212,175,55,0.25)' : 'rgba(212,175,55,0.28)'}`,
              borderRadius: 8, color: selectedProduct ? '#d4af37' : '#e5c158',
              fontFamily: dm, fontSize: 12, fontWeight: 600, cursor: 'pointer', marginBottom: 14,
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            {selectedProduct ? (
              <>
                {selectedProduct.image_url && (
                  <img src={proxyImage(selectedProduct.image_url) ?? selectedProduct.image_url} alt="" style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'cover' }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                )}
                <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedProduct.product_title.length > 30 ? selectedProduct.product_title.slice(0, 30) + '\u2026' : selectedProduct.product_title}</span>
                <ChevronRight size={14} />
              </>
            ) : (
              <><Target size={14} /> Pick from your product database</>
            )}
          </button>

          {showPicker && (
            <div ref={pickerRef} style={{
              position: 'absolute', top: 60, left: 18, right: 18, zIndex: 50,
              background: '#1c1c1c', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, maxHeight: 360, overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <input
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Search products..."
                  style={{ flex: 1, height: 28, padding: '0 8px', background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, fontSize: 11, color: '#f1f1f3', outline: 'none', fontFamily: dm }}
                />
                <button onClick={() => setShowPicker(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4, display: 'inline-flex' }}><X size={14} /></button>
              </div>
              {dbLoading ? (
                <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Loading\u2026</div>
              ) : filteredProducts.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>No products found</div>
              ) : filteredProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => pickProduct(p)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', background: 'transparent', border: 'none',
                    borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', textAlign: 'left',
                    transition: 'background 100ms',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(212,175,55,0.06)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 6, background: '#0f0f14', flexShrink: 0, overflow: 'hidden' }}>
                    {p.image_url && (
                      <img src={proxyImage(p.image_url) ?? p.image_url} alt={p.product_title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#e8e8f0', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.product_title.length > 45 ? p.product_title.slice(0, 45) + '\u2026' : p.product_title}
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {p.category && (
                        <span style={{ fontSize: 9, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', padding: '1px 6px', borderRadius: 999, fontFamily: dm }}>
                          {p.category.length > 20 ? p.category.slice(0, 20) + '\u2026' : p.category}
                        </span>
                      )}
                      {p.sold_count != null && p.sold_count > 0 && (
                        <span style={{ fontSize: 10, color: '#10b981', fontFamily: mono, fontWeight: 600 }}>
                          {p.sold_count >= 1000 ? `${Math.round(p.sold_count / 1000)}k` : p.sold_count} orders
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Product details */}
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontFamily: mono }}>Product Details</div>

          {[
            { label: 'Product Name *', value: productName, set: (v: string) => { setProductName(v); if (v.trim()) setNameError(false); }, placeholder: 'e.g. LED Light Therapy Face Mask', required: true },
            { label: 'Product URL', value: productUrl, set: setProductUrl, placeholder: 'https://yourstore.com/product', required: false },
            { label: 'Target Audience', value: audience, set: setAudience, placeholder: 'e.g. Women 28\u201345, AU, skincare', required: false },
            { label: 'Price Point', value: pricePoint, set: setPricePoint, placeholder: 'e.g. $49.99 AUD', required: false },
          ].map(({ label, value, set, placeholder, required }) => (
            <div key={label} style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{label}</label>
              <input
                value={value}
                onChange={(e) => set(e.target.value)}
                placeholder={placeholder}
                style={{
                  width: '100%', height: 34, padding: '0 10px',
                  border: `1px solid ${required && nameError && !value ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 6, fontSize: 12, color: '#f1f1f3', background: '#0a0a0c',
                  outline: 'none', boxSizing: 'border-box', fontFamily: dm,
                }}
              />
            </div>
          ))}

          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Key Benefit / USP</label>
            <textarea
              value={benefit}
              onChange={(e) => setBenefit(e.target.value.slice(0, 200))}
              placeholder="e.g. reduces back pain in 10 min, visible results in 7 days"
              rows={2}
              style={{
                width: '100%', padding: '6px 10px',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6,
                fontSize: 12, color: '#f1f1f3', background: '#0a0a0c',
                outline: 'none', resize: 'none' as const, boxSizing: 'border-box', fontFamily: dm,
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: dm }}>50-100 chars recommended</span>
              <span style={{ fontSize: 9, color: benefit.length > 100 ? '#f59e0b' : 'rgba(255,255,255,0.3)', fontFamily: mono }}>{benefit.length}/100</span>
            </div>
          </div>

          {/* Funnel stage */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Funnel Stage</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {FUNNEL_STAGES.map((s) => {
                const active = funnelStage === s;
                return (
                  <button key={s} onClick={() => setFunnelStage(s)} style={{
                    flex: 1, padding: '6px 4px',
                    background: active ? 'rgba(212,175,55,0.1)' : 'transparent',
                    border: `1px solid ${active ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 6, fontSize: 10, fontWeight: 600,
                    color: active ? '#f1f1f3' : 'rgba(255,255,255,0.5)', cursor: 'pointer',
                  }}>
                    {s === 'Cold Traffic' ? '\uD83E\uDDCA' : s === 'Warm Retargeting' ? '\uD83D\uDD25' : '\uD83D\uDED2'} {s.split(' ')[0]}
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
                    background: active ? 'rgba(212,175,55,0.1)' : 'transparent',
                    color: active ? '#f1f1f3' : 'rgba(255,255,255,0.5)',
                    border: `1px solid ${active ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                  }}>{o}</button>
                );
              })}
            </div>
          </div>

          {/* ── HOOK FRAMEWORK SELECTOR ── */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, fontFamily: mono }}>Hook Framework</label>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Choose one:</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 6 }}>
              {HOOK_FRAMEWORKS.map((fw) => {
                const active = selectedFramework === fw.id;
                return (
                  <button
                    key={fw.id}
                    onClick={() => setSelectedFramework(active ? null : fw.id)}
                    title={fw.description}
                    style={{
                      textAlign: 'left', padding: '8px 10px',
                      background: active ? 'rgba(212,175,55,0.08)' : 'transparent',
                      border: `1px solid ${active ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.07)'}`,
                      borderRadius: 8, cursor: 'pointer',
                      boxShadow: active ? '0 0 12px rgba(212,175,55,0.15)' : 'none',
                      transition: 'all 150ms ease',
                      position: 'relative',
                    }}
                  >
                    {/* Radio indicator */}
                    <div style={{
                      position: 'absolute', top: 6, right: 6,
                      width: 12, height: 12, borderRadius: '50%',
                      border: `2px solid ${active ? '#d4af37' : 'rgba(255,255,255,0.15)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#d4af37' }} />}
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1, marginBottom: 4 }}>{fw.icon}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: active ? '#d4af37' : 'rgba(255,255,255,0.6)', marginBottom: 2 }}>{fw.name}</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', lineHeight: 1.3 }}>{fw.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>{/* end scrollable form content */}

          {/* Pinned Generate footer */}
          <div style={{ flexShrink: 0, background: '#0d0d0d', borderTop: '1px solid #1a1a1a', padding: '14px 18px 18px' }}>
            <button
              onClick={generate}
              disabled={loading || !productName.trim()}
              style={{
                width: '100%', height: 44,
                background: !productName.trim() ? '#1a1a1a' : '#3B82F6',
                color: 'white', border: 'none', borderRadius: 6,
                fontSize: 14, fontWeight: 600,
                cursor: loading || !productName.trim() ? 'not-allowed' : 'pointer',
                fontFamily: dm,
                boxShadow: !productName.trim() ? 'none' : '0 0 20px rgba(59,130,246,0.3)',
                opacity: loading ? 0.7 : 1, transition: 'all 150ms ease',
              }}
            >{loading ? '\u27F3 Generating 4 formats...' : 'Generate Ad Pack \u2192'}</button>
          </div>
        </div>

        {/* ── CENTER: Output ── */}
        <div ref={outputRef} style={{ overflowY: 'auto', padding: '20px 24px', background: '#0f0f0f' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#3B82F6', boxShadow: '0 0 24px rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>\u2728</div>
              <div style={{ fontFamily: syne, fontSize: 16, fontWeight: 800, color: '#ededed' }}>Generating 4 ad formats\u2026</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Meta Feed \u00B7 Meta Story \u00B7 TikTok Feed \u00B7 TikTok Story</div>
            </div>
          ) : hasOutput ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Format Tabs */}
              <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #1a1a1a', paddingBottom: 0, overflowX: 'auto', flexWrap: 'nowrap', WebkitOverflowScrolling: 'touch', maskImage: 'linear-gradient(to right, black 90%, transparent)', WebkitMaskImage: 'linear-gradient(to right, black 90%, transparent)' }}>
                {AD_FORMATS.map((fmt) => {
                  const active = activeTab === fmt.id;
                  return (
                    <button
                      key={fmt.id}
                      onClick={() => setActiveTab(fmt.id)}
                      style={{
                        padding: '8px 10px',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        background: active ? 'rgba(212,175,55,0.1)' : 'transparent',
                        border: 'none',
                        borderBottom: active ? '2px solid #d4af37' : '2px solid transparent',
                        color: active ? '#d4af37' : 'rgba(255,255,255,0.5)',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: dm,
                        transition: 'all 100ms ease',
                      }}
                    >{fmt.label}</button>
                  );
                })}
              </div>

              {/* Active format mockup + copy */}
              {AD_FORMATS.filter((f) => f.id === activeTab).map((fmt) => {
                const output = formatOutputs[fmt.id] ?? { hook: '', headline: '', body: '', cta: '' };
                return (
                  <div key={fmt.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 260px) 1fr', gap: 20 }} className="ads-mockup-grid">
                    {/* Phone frame mockup */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 320 }}>
                      <div style={{
                        width: fmt.aspect === '1:1' ? 240 : 200,
                        height: fmt.aspect === '1:1' ? 300 : 360,
                        background: '#0a0a0a',
                        borderRadius: 20,
                        border: '2px solid #222',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                      }}>
                        {/* Platform chrome */}
                        <div style={{
                          background: fmt.chromeColor,
                          padding: '8px 12px',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          borderBottom: '1px solid rgba(255,255,255,0.06)',
                        }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: fmt.chromeLabelColor, fontFamily: mono }}>{fmt.chromeLabel}</span>
                          <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>{fmt.aspect}</span>
                        </div>
                        {/* Product image area */}
                        <div style={{ flex: 1, position: 'relative', background: '#111', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {(productUrl || selectedProduct?.image_url) ? (
                            <img
                              src={proxyImage(productUrl || selectedProduct?.image_url || '') ?? (productUrl || selectedProduct?.image_url || '')}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: 16, border: '2px dashed rgba(255,255,255,0.1)', borderRadius: 8, margin: 12 }}>
                              <Plus size={16} color="rgba(255,255,255,0.2)" />
                              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: mono, textAlign: 'center' }}>Add product image</div>
                            </div>
                          )}
                          {/* Overlay copy */}
                          <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
                            padding: '24px 12px 12px',
                          }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', lineHeight: 1.3, marginBottom: 4 }}>
                              {output.hook || 'Hook text here...'}
                            </div>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', lineHeight: 1.3 }}>
                              {(output.body || '').slice(0, 80)}{(output.body ?? '').length > 80 ? '\u2026' : ''}
                            </div>
                          </div>
                        </div>
                        {/* CTA bar */}
                        <div style={{
                          padding: '8px 12px',
                          background: fmt.platform === 'TikTok' ? '#ff0050' : '#3B82F6',
                          textAlign: 'center',
                        }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{output.cta || 'Shop Now'}</span>
                        </div>
                      </div>
                      <div style={{ marginTop: 8, fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: mono }}>{fmt.platform} {fmt.aspect} preview</div>
                    </div>

                    {/* Copy cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <CopyCard label="Hook" value={output.hook} limit={fmt.charLimit} copied={copied} onCopy={copyText} />
                      <CopyCard label="Headline" value={output.headline} limit={fmt.headlineLimit} copied={copied} onCopy={copyText} />
                      <CopyCard label="Body Copy" value={output.body} limit={fmt.charLimit} copied={copied} onCopy={copyText} />
                      <CopyCard label="CTA" value={output.cta} copied={copied} onCopy={copyText} />
                    </div>
                  </div>
                );
              })}

              {/* Export buttons */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button onClick={exportCSV} style={exportBtnStyle}>
                  <Download size={14} color="#d4af37" /> Export CSV (Meta Bulk Import)
                </button>
                <button onClick={exportTxt} style={exportBtnStyle}>
                  <Download size={14} color="#e5c158" /> Export .txt
                </button>
              </div>

              {/* ── BULK VARIATIONS ── */}
              <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: 16, marginTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontFamily: syne, fontSize: 15, fontWeight: 700, color: '#ededed' }}>A/B Test Variations</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Generate multiple angles to split test</div>
                  </div>
                  <button
                    onClick={generateBulkVariations}
                    disabled={bulkLoading}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 16px',
                      background: bulkLoading ? '#1a1a1a' : 'rgba(212,175,55,0.1)',
                      border: '1px solid rgba(212,175,55,0.3)',
                      borderRadius: 6, color: '#d4af37',
                      fontSize: 12, fontWeight: 600, cursor: bulkLoading ? 'not-allowed' : 'pointer',
                      fontFamily: dm, opacity: bulkLoading ? 0.6 : 1,
                    }}
                  >
                    {bulkLoading ? '\u27F3 Generating...' : <><Plus size={14} /> Generate 5 Variations</>}
                  </button>
                </div>

                {bulkVariations.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                    {bulkVariations.map((v) => (
                      <div key={v.id} style={{
                        background: '#1c1c1c', border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 8, padding: '12px 14px',
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f1f3', lineHeight: 1.4, marginBottom: 6 }}>
                          {v.hook || 'No hook'}
                        </div>
                        {v.headline && (
                          <div style={{ fontSize: 11, color: '#d4af37', fontWeight: 600, marginBottom: 4 }}>{v.headline}</div>
                        )}
                        {v.body && (
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4, marginBottom: 8 }}>
                            {v.body.slice(0, 100)}{v.body.length > 100 ? '\u2026' : ''}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => useVariation(v)}
                            style={{
                              flex: 1, padding: '5px 0', fontSize: 10, fontWeight: 600,
                              background: copied === `var-${v.id}` ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.1)',
                              border: `1px solid ${copied === `var-${v.id}` ? 'rgba(16,185,129,0.3)' : 'rgba(59,130,246,0.25)'}`,
                              color: copied === `var-${v.id}` ? '#10b981' : '#3B82F6',
                              borderRadius: 5, cursor: 'pointer',
                            }}
                          >{copied === `var-${v.id}` ? 'Copied' : 'Use This'}</button>
                          <button
                            onClick={() => removeVariation(v.id)}
                            style={{
                              padding: '5px 8px', fontSize: 10,
                              background: 'rgba(239,68,68,0.08)',
                              border: '1px solid rgba(239,68,68,0.2)',
                              color: '#f87171', borderRadius: 5, cursor: 'pointer',
                            }}
                          ><X size={12} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── PERFORMANCE ESTIMATE ── */}
              {selectedProduct && intel && (
                <div style={{
                  background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 8,
                  padding: 16, marginTop: 4,
                }}>
                  <div style={{ fontFamily: syne, fontSize: 14, fontWeight: 700, color: '#ededed', marginBottom: 12 }}>Performance Estimate</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    <PerfCard
                      label="Est. CPM"
                      value={`$${cpmRange.low}\u2013$${cpmRange.high}`}
                      sub={`${cpmRange.label} industry avg`}
                    />
                    <PerfCard
                      label="Est. Daily Reach"
                      value={intel.suggestedBudget > 0 ? `${Math.round(intel.suggestedBudget / ((cpmRange.low + cpmRange.high) / 2 / 1000)).toLocaleString()}` : '\u2014'}
                      sub={`At $${intel.suggestedBudget.toFixed(0)}/day budget`}
                    />
                    <PerfCard
                      label="Break-even ROAS"
                      value={priceNum > 0 ? `${(priceNum / (priceNum * 0.6)).toFixed(1)}x` : '\u2014'}
                      sub="Assuming 60% margin"
                    />
                  </div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 10, lineHeight: 1.4, fontFamily: dm }}>
                    These are AU market averages. Actual performance depends on creative quality, targeting, and landing page.
                  </div>
                </div>
              )}

              {/* ── LAUNCH YOUR ADS ── */}
              <div style={{
                background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 8,
                padding: 20, marginTop: 8,
              }}>
                <div style={{ fontFamily: syne, fontSize: 16, fontWeight: 700, color: '#ededed', marginBottom: 14 }}>Ready to launch?</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    'Copy your ad copy above (or export as CSV)',
                    `Go to Meta Ads Manager \u2192 Create Campaign \u2192 Conversions \u2192 Purchase`,
                    `Paste your headline and body text, set budget to A$${intel?.suggestedBudget?.toFixed(0) ?? '20'}/day, target AU 25\u201344`,
                  ].map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                        background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: '#d4af37', fontFamily: mono,
                      }}>{i + 1}</div>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, fontFamily: dm }}>{step}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                  <a
                    href="https://adsmanager.facebook.com/adsmanager/manage/campaigns"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '8px 16px', borderRadius: 6,
                      background: '#3B82F6', color: 'white',
                      fontSize: 12, fontWeight: 600, textDecoration: 'none', fontFamily: dm,
                    }}
                  >Open Meta Ads Manager &rarr;</a>
                  <a
                    href="https://ads.tiktok.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '8px 16px', borderRadius: 6,
                      background: '#3B82F6', color: 'white',
                      fontSize: 12, fontWeight: 600, textDecoration: 'none', fontFamily: dm,
                    }}
                  >Open TikTok Ads Manager &rarr;</a>
                </div>
                <a
                  href="/app/ai-chat"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    marginTop: 14, padding: '12px 16px', borderRadius: 8,
                    background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)',
                    textDecoration: 'none', transition: 'background 150ms',
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(212,175,55,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Zap size={16} color="#d4af37" />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#d4af37', fontFamily: dm }}>Need help launching? Ask Maya</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: dm, marginTop: 1 }}>Step-by-step ad launch walkthrough</div>
                  </div>
                  <ChevronRight size={14} color="#d4af37" style={{ marginLeft: 'auto' }} />
                </a>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80%', padding: '24px 0' }}>
              <div style={{
                width: '100%', maxWidth: 560, aspectRatio: '4 / 5',
                border: '2px dashed #1a1a1a', borderRadius: 8, background: '#0d0d0d',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 14, padding: 32,
              }}>
                <div style={{ fontFamily: mono, fontSize: 10, color: '#555555', textTransform: 'uppercase', letterSpacing: '0.14em', padding: '3px 10px', border: '1px solid #1a1a1a', borderRadius: 4, background: '#0f0f0f' }}>
                  Ad Pack
                </div>
                <div style={{ fontFamily: syne, fontSize: 18, fontWeight: 700, color: '#ededed', textAlign: 'center' }}>
                  4 ad formats in one click
                </div>
                <div style={{ fontFamily: dm, fontSize: 13, color: '#555555', textAlign: 'center', maxWidth: 320, lineHeight: 1.5 }}>
                  Pick a product, choose a hook framework, and hit Generate. You will get Meta Feed, Meta Story, TikTok Feed, and TikTok Story copy with phone mockups.
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  {AD_FORMATS.map((f) => (
                    <span key={f.id} style={{ fontSize: 9, padding: '3px 8px', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 999, color: '#d4af37', fontFamily: mono }}>{f.label}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Saved Creatives collapsible drawer for narrow viewports */}
          <div className="ads-saved-toggle" style={{ display: 'none', marginTop: 16, flexDirection: 'column', gap: 0 }}>
            <button
              onClick={() => setSavedDrawerOpen(!savedDrawerOpen)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '10px 14px',
                background: '#111111', border: '1px solid #1a1a1a', borderRadius: savedDrawerOpen ? '8px 8px 0 0' : 8,
                color: '#ededed', fontSize: 12, fontWeight: 600, fontFamily: dm, cursor: 'pointer',
              }}
            >
              <span>Saved ({saved.length})</span>
              <ChevronDown size={14} style={{ transform: savedDrawerOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
            </button>
            {savedDrawerOpen && (
              <div style={{ background: '#111111', border: '1px solid #1a1a1a', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: 14, maxHeight: 400, overflowY: 'auto' }}>
                <SavedList saved={saved} expandedSaved={expandedSaved} setExpandedSaved={setExpandedSaved} deleteSaved={deleteSaved} />
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Saved (wide viewport only) ── */}
        <div className="ads-saved-panel" style={{ background: '#111111', borderLeft: '1px solid #1a1a1a', overflowY: 'auto', padding: 14, flexDirection: 'column' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontFamily: mono }}>Saved Creatives</div>
          <SavedList saved={saved} expandedSaved={expandedSaved} setExpandedSaved={setExpandedSaved} deleteSaved={deleteSaved} />
        </div>
      </div>
    </div>
  );
}

// ── Shared export button style ──
const exportBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '8px 14px', background: '#0f0f0f',
  border: '1px solid #1a1a1a', borderRadius: 6,
  color: '#ededed', fontSize: 12, fontWeight: 600, fontFamily: dm, cursor: 'pointer',
};

// ── Intelligence card ──
function IntelCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon}
        <span style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <div style={{ fontFamily: mono, fontSize: 16, fontWeight: 700, color: '#f1f1f3', letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', lineHeight: 1.3 }}>{sub}</div>
    </div>
  );
}

// ── Performance estimate card ──
function PerfCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div style={{ background: '#1c1c1c', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '10px 12px' }}>
      <div style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: mono, fontSize: 18, fontWeight: 700, color: '#d4af37', letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

// ── Copy card for format outputs ──
function CopyCard({ label, value, limit, copied, onCopy }: { label: string; value: string; limit?: number; copied: string; onCopy: (text: string, key: string) => void }) {
  const copyKey = `fmt-${label}`;
  const len = (value ?? '').length;
  const overLimit = limit != null && len > limit;
  return (
    <div style={{
      background: '#1c1c1c', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 8, padding: '12px 14px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: mono, fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
          {limit != null && value && (
            <span style={{
              fontFamily: mono, fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 999,
              background: overLimit ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
              color: overLimit ? '#f87171' : '#10b981',
              border: `1px solid ${overLimit ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
            }}>{len}/{limit}</span>
          )}
        </div>
        {value && (
          <button
            onClick={() => onCopy(value, copyKey)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: copied === copyKey ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${copied === copyKey ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`,
              color: copied === copyKey ? '#10b981' : 'rgba(255,255,255,0.6)',
              fontSize: 10, fontWeight: 600, fontFamily: dm,
              padding: '3px 8px', borderRadius: 5, cursor: 'pointer', flexShrink: 0,
            }}
          >
            {copied === copyKey ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
          </button>
        )}
      </div>
      <div style={{ fontSize: 13, fontFamily: dm, color: '#f1f1f3', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
        {value || <span style={{ color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>{'\u2014'}</span>}
      </div>
    </div>
  );
}

// ── Saved list (shared between right panel and collapsible drawer) ──
function SavedList({ saved, expandedSaved, setExpandedSaved, deleteSaved }: {
  saved: SavedAd[];
  expandedSaved: number | null;
  setExpandedSaved: (id: number | null) => void;
  deleteSaved: (id: number) => void;
}) {
  if (saved.length === 0) {
    return (
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'center', padding: '16px 0', lineHeight: 1.55 }}>
        No saved ads yet {'\u2014'} generate your first ad pack
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {saved.map((s) => {
        const isOpen = expandedSaved === s.id;
        return (
          <div key={s.id} style={{
            background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 8, overflow: 'hidden',
          }}>
            <button
              onClick={() => setExpandedSaved(isOpen ? null : s.id)}
              style={{ width: '100%', textAlign: 'left', padding: '10px 12px', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{s.productName}</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 9, background: 'rgba(212,175,55,0.12)', color: '#d4af37', padding: '1px 6px', borderRadius: 999, fontFamily: mono, fontWeight: 600 }}>{s.platform}</span>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: mono }}>
                      {new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>
                    {(s.hook ?? '').slice(0, 60)}{(s.hook ?? '').length > 60 ? '\u2026' : ''}
                  </div>
                </div>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); deleteSaved(s.id); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); deleteSaved(s.id); } }}
                  title="Delete"
                  aria-label="Delete saved ad"
                  style={{ padding: 4, background: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', flexShrink: 0, display: 'inline-flex' }}
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
  );
}
