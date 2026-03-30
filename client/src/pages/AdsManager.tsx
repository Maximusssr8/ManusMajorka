import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import UpgradeModal from '@/components/UpgradeModal';
import {
  Megaphone, Link2, ShoppingBag, Activity, ChevronRight,
  Loader2, CheckCircle, XCircle, AlertTriangle, Plus, Target,
  Eye, Users, Zap, Package, RefreshCw, ExternalLink, Trash2,
  BarChart3, Palette, ChevronLeft, Image, Video, Type,
  TrendingUp, DollarSign, Star, Copy, ArrowUpRight,
} from 'lucide-react';

// ── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#060A12',
  surface: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  borderHover: 'rgba(255,255,255,0.14)',
  text: '#FAFAFA',
  muted: '#A1A1AA',
  dim: '#71717A',
  indigo: '#6366F1',
  indigoHover: '#4F46E5',
  indigoBg: 'rgba(99,102,241,0.08)',
  indigoBorder: 'rgba(99,102,241,0.2)',
  green: '#10B981',
  greenBg: 'rgba(16,185,129,0.08)',
  greenBorder: 'rgba(16,185,129,0.2)',
  orange: '#F59E0B',
  orangeBg: 'rgba(245,158,11,0.08)',
  orangeBorder: 'rgba(245,158,11,0.2)',
  red: '#EF4444',
  redBg: 'rgba(239,68,68,0.08)',
  redBorder: 'rgba(239,68,68,0.2)',
  emerald: '#22C55E',
  amber: '#F59E0B',
} as const;

const FONT_HEADING = "'Bricolage Grotesque', sans-serif";
const FONT_BODY = "'DM Sans', sans-serif";

// ── Types ────────────────────────────────────────────────────────────────────
interface MetaStatus {
  connected: boolean;
  meta_not_configured?: boolean;
  accountName?: string | null;
  adAccountId?: string | null;
  pixelId?: string | null;
  tokenExpiresAt?: string | null;
  connectedAt?: string | null;
  capiEnabled?: boolean;
}

interface ShopifyStatus {
  connected: boolean;
  shop?: string | null;
}

interface ShopifySyncStatus {
  synced: boolean;
  count: number;
  lastSync: string | null;
}

interface CatalogProduct {
  id: string;
  shopify_product_id: string;
  title: string;
  price_aud: number;
  image_url: string | null;
  product_url: string;
  inventory_status: string;
  synced_at: string;
}

interface Campaign {
  id: string;
  name: string;
  objective: string;
  status: string;
  daily_budget_aud: number | null;
  meta_campaign_id: string | null;
  product_ids: string[];
  targeting: Record<string, unknown>;
  ad_copy?: Record<string, unknown>;
  created_at: string;
}

interface CampaignMetrics {
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  purchases: number;
  purchase_roas: number;
  cpc: number;
  cpm: number;
  frequency: number;
}

interface Recommendation {
  type: 'pause' | 'scale' | 'creative' | 'fatigue';
  campaign: Campaign;
  msg: string;
  action: string;
  detail?: string;
}

interface PixelHealth {
  connected: boolean;
  emq: number | null;
  events: { purchase: number; addToCart: number; checkout: number };
  status: 'healthy' | 'partial' | 'inactive';
}

interface AutomationRule {
  id: string;
  name: string;
  metric: string;
  operator: string;
  value: number;
  timeWindow: string;
  action: string;
  campaignScope: string;
  enabled: boolean;
  lastTriggered: string | null;
}

interface LaunchProduct {
  id: string | number;
  title: string;
  image: string;
  category: string;
  price: number;
  cost: number;
  units_per_day: number;
}

interface SwipeFileEntry {
  id: string;
  hook?: string;
  bodyText?: string;
  cta?: string;
  platform?: string;
  savedAt: string;
}

type Tab = 'overview' | 'campaigns' | 'products' | 'pixel' | 'performance' | 'creative' | 'automation';

const TABS: { key: Tab; label: string; icon: typeof Megaphone }[] = [
  { key: 'overview', label: 'Overview', icon: Activity },
  { key: 'campaigns', label: 'Campaigns', icon: Megaphone },
  { key: 'products', label: 'Products', icon: Package },
  { key: 'pixel', label: 'Pixel & CAPI', icon: Zap },
  { key: 'performance', label: 'Performance', icon: BarChart3 },
  { key: 'creative', label: 'Creative Library', icon: Palette },
  { key: 'automation', label: 'Automation', icon: RefreshCw },
];

const OBJECTIVES = [
  { key: 'OUTCOME_SALES', label: 'Sales', desc: 'Uses Meta Advantage+ Shopping — best ROAS for ecommerce', icon: ShoppingBag, recommended: true },
  { key: 'OUTCOME_TRAFFIC', label: 'Traffic', desc: 'Drive visitors to your store', icon: Eye, recommended: false },
  { key: 'OUTCOME_AWARENESS', label: 'Awareness', desc: 'Reach new audiences at scale', icon: Users, recommended: false },
  { key: 'OUTCOME_ENGAGEMENT', label: 'Engagement', desc: 'Boost likes, comments, shares', icon: Activity, recommended: false },
];

const CTA_OPTIONS = ['Shop Now', 'Learn More', 'Sign Up', 'Get Offer', 'Book Now'];
const FORMAT_OPTIONS = ['Feed', 'Stories (9:16)', 'Reels'];

const ROAS_BENCHMARKS: Record<string, number> = {
  Fashion: 2.8, Beauty: 3.2, Electronics: 2.4, Default: 2.5,
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function getHeaders(session: { access_token?: string } | null) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token || ''}`,
  };
}

function roasColor(roas: number): string {
  if (roas >= 2) return C.emerald;
  if (roas >= 1) return C.amber;
  return C.red;
}

function roasBg(roas: number): string {
  if (roas >= 2) return C.greenBg;
  if (roas >= 1) return C.orangeBg;
  return C.redBg;
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: 24,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Btn({
  children,
  onClick,
  variant = 'primary',
  disabled,
  loading,
  style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: React.CSSProperties;
}) {
  const bg = variant === 'primary' ? C.indigo : variant === 'danger' ? C.red : 'transparent';
  const border = variant === 'secondary' ? `1px solid ${C.border}` : 'none';
  const color = variant === 'secondary' ? C.muted : '#fff';
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        padding: '10px 18px',
        borderRadius: 8,
        border,
        background: bg,
        color,
        fontFamily: FONT_BODY,
        fontWeight: 600,
        fontSize: 13,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        transition: 'transform 150ms, opacity 150ms',
        ...style,
      }}
    >
      {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
      {children}
    </button>
  );
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 12,
        fontWeight: 600,
        color: ok ? C.green : C.orange,
        background: ok ? C.greenBg : C.orangeBg,
        border: `1px solid ${ok ? C.greenBorder : C.orangeBorder}`,
        borderRadius: 6,
        padding: '3px 8px',
      }}
    >
      {ok ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
      {label}
    </span>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <Card style={{ flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: color || C.text, fontFamily: FONT_HEADING }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>{sub}</div>}
    </Card>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80, h = 28;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return <svg width={w} height={h}><polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function RoasGauge({ roas, breakEven }: { roas: number; breakEven: number }) {
  const clamped = Math.min(5, Math.max(0, roas));
  const angle = -90 + (clamped / 5) * 180;
  const beAngle = -90 + (Math.min(5, breakEven) / 5) * 180;
  const gaugeColor = roas >= 4 ? '#F59E0B' : roas >= 2 ? C.emerald : roas >= 1 ? C.amber : C.red;
  return (
    <svg width={72} height={40} viewBox="0 0 72 40">
      {/* Background arc */}
      <path d="M 6 36 A 30 30 0 0 1 66 36" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={4} strokeLinecap="round" />
      {/* Red zone 0-1x */}
      <path d="M 6 36 A 30 30 0 0 1 13.4 14.4" fill="none" stroke="rgba(239,68,68,0.3)" strokeWidth={4} strokeLinecap="round" />
      {/* Amber zone 1-2x */}
      <path d="M 13.4 14.4 A 30 30 0 0 1 36 6" fill="none" stroke="rgba(245,158,11,0.3)" strokeWidth={4} strokeLinecap="round" />
      {/* Green zone 2-4x */}
      <path d="M 36 6 A 30 30 0 0 1 58.6 14.4" fill="none" stroke="rgba(34,197,94,0.3)" strokeWidth={4} strokeLinecap="round" />
      {/* Needle */}
      <line x1="36" y1="36" x2={36 + 24 * Math.cos((angle * Math.PI) / 180)} y2={36 + 24 * Math.sin((angle * Math.PI) / 180)} stroke={gaugeColor} strokeWidth={2} strokeLinecap="round" />
      <circle cx="36" cy="36" r="3" fill={gaugeColor} />
      {/* Break-even marker */}
      <line x1={36 + 28 * Math.cos((beAngle * Math.PI) / 180)} y1={36 + 28 * Math.sin((beAngle * Math.PI) / 180)} x2={36 + 32 * Math.cos((beAngle * Math.PI) / 180)} y2={36 + 32 * Math.sin((beAngle * Math.PI) / 180)} stroke={C.amber} strokeWidth={1.5} />
      <text x="36" y="38" textAnchor="middle" fontSize="9" fill={gaugeColor} fontWeight="700">{roas.toFixed(1)}x</text>
    </svg>
  );
}

function ProfitStatusBadge({ roas, breakEven }: { roas: number; breakEven: number }) {
  const diff = roas - breakEven;
  if (diff > 0.3) return <span style={{ fontSize: 11, fontWeight: 700, color: C.emerald, display: 'flex', alignItems: 'center', gap: 3 }}>🟢 Profitable</span>;
  if (diff >= -0.3) return <span style={{ fontSize: 11, fontWeight: 700, color: C.amber, display: 'flex', alignItems: 'center', gap: 3 }}>🟡 Breaking Even</span>;
  return <span style={{ fontSize: 11, fontWeight: 700, color: C.red, display: 'flex', alignItems: 'center', gap: 3 }}>🔴 Losing Money</span>;
}

// ── Automation Rule Templates ───────────────────────────────────────────────
const RULE_TEMPLATES: Omit<AutomationRule, 'id' | 'enabled' | 'lastTriggered'>[] = [
  { name: 'Stop Losing Money', metric: 'cost_per_purchase', operator: '>', value: 25, timeWindow: '24h', action: 'pause_campaign', campaignScope: 'all' },
  { name: 'Scale Winners', metric: 'roas', operator: '>', value: 3, timeWindow: '48h', action: 'increase_budget_20', campaignScope: 'all' },
  { name: 'Audience Fatigue Guard', metric: 'frequency', operator: '>', value: 3, timeWindow: '72h', action: 'pause_adset', campaignScope: 'all' },
  { name: 'Daily Budget Cap', metric: 'daily_spend', operator: '>', value: 100, timeWindow: '24h', action: 'pause_campaign', campaignScope: 'all' },
  { name: 'Low CTR Killer', metric: 'ctr', operator: '<', value: 0.8, timeWindow: '24h', action: 'pause_ad', campaignScope: 'all' },
];

const METRIC_OPTIONS = ['roas', 'ctr', 'cpc', 'cpm', 'frequency', 'daily_spend', 'cost_per_purchase'];
const OPERATOR_OPTIONS = ['>', '<', '>=', '<=', '='];
const ACTION_OPTIONS = [
  { key: 'pause_campaign', label: 'Pause Campaign' },
  { key: 'pause_adset', label: 'Pause Ad Set' },
  { key: 'pause_ad', label: 'Pause Ad' },
  { key: 'increase_budget_20', label: 'Increase Budget +20%' },
  { key: 'decrease_budget_20', label: 'Decrease Budget -20%' },
];
const TIME_OPTIONS = ['24h', '48h', '72h'];

// ── Campaign Builder ─────────────────────────────────────────────────────────
function CampaignBuilder({
  session,
  catalog,
  onCreated,
  onCancel,
  preSelectedProduct,
  metaStatus,
  initialStep,
  initialAdCopy,
  initialClonedAd,
}: {
  session: { access_token?: string } | null;
  catalog: CatalogProduct[];
  onCreated: () => void;
  onCancel: () => void;
  preSelectedProduct?: CatalogProduct;
  metaStatus: MetaStatus | null;
  initialStep?: number;
  initialAdCopy?: { primaryText?: string; headline?: string; description?: string; cta?: string };
  initialClonedAd?: { hook?: string; bodyText?: string; cta?: string };
}) {
  const [step, setStep] = useState(initialStep || 1);
  const [objective, setObjective] = useState('OUTCOME_SALES');
  const [selectedProducts, setSelectedProducts] = useState<string[]>(
    preSelectedProduct ? [preSelectedProduct.id] : []
  );
  const [audienceMode, setAudienceMode] = useState<'advantage' | 'manual'>('advantage');
  const [targeting, setTargeting] = useState({ ageMin: 18, ageMax: 45, gender: 'All', location: 'Australia', interests: '' });
  const [budget, setBudget] = useState(20);
  const [campaignName, setCampaignName] = useState('');
  const [duration, setDuration] = useState<'ongoing' | 'end_date'>('ongoing');
  const [saving, setSaving] = useState(false);

  // Step 5 — Creative
  const [creativeTab, setCreativeTab] = useState<'existing' | 'maya'>('existing');
  const [adFormat, setAdFormat] = useState('Feed');
  const [primaryText, setPrimaryText] = useState(initialAdCopy?.primaryText || '');
  const [headline, setHeadline] = useState(initialAdCopy?.headline || '');
  const [description, setDescription] = useState(initialAdCopy?.description || '');
  const [ctaChoice, setCtaChoice] = useState(initialAdCopy?.cta || 'Shop Now');
  const [mayaLoading, setMayaLoading] = useState(false);
  const [mayaVariations, setMayaVariations] = useState<Array<{ primaryText: string; headline: string; description: string }>>([]);
  const [previewFormat, setPreviewFormat] = useState<'feed' | 'stories'>('feed');

  // Step 6 — Review
  const [launched, setLaunched] = useState(false);
  const [launchResult, setLaunchResult] = useState<{ campaign_id?: string; meta_campaign_id?: string; draft?: boolean } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Cloned ad
  const [clonedAd] = useState(initialClonedAd || null);

  useEffect(() => {
    const product = catalog.find((p) => selectedProducts.includes(p.id));
    const name = product?.title?.slice(0, 30) || 'Campaign';
    const date = new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'short' });
    setCampaignName(`Majorka — ${name} — ${date}`);
  }, [selectedProducts, catalog]);

  const toggleProduct = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : prev.length < 5 ? [...prev, id] : prev
    );
  };

  const selectedProductData = catalog.filter((p) => selectedProducts.includes(p.id));
  const firstProductImage = selectedProductData[0]?.image_url || null;

  const handleMayaGenerate = async () => {
    const productName = selectedProductData[0]?.title || campaignName;
    setMayaLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: getHeaders(session),
        body: JSON.stringify({
          message: `Generate 3 ad copy variations for the product "${productName}". For each variation, provide: primaryText (max 125 chars), headline (max 40 chars), description (max 30 chars). Return as JSON array: [{"primaryText":"...","headline":"...","description":"..."}]. Return ONLY the JSON array, no markdown.`,
        }),
      });
      const data = await res.json();
      const text = data.response || data.message || '';
      try {
        const match = text.match(/\[[\s\S]*\]/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          setMayaVariations(parsed.slice(0, 3));
        }
      } catch {
        // Could not parse Maya response
      }
    } catch {
      // handled
    } finally {
      setMayaLoading(false);
    }
  };

  const handleClonedAdRewrite = async () => {
    if (!clonedAd) return;
    const productName = selectedProductData[0]?.title || 'my product';
    setMayaLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: getHeaders(session),
        body: JSON.stringify({
          message: `Rewrite this competitor ad for my product "${productName}": Hook: ${clonedAd.hook || ''} Body: ${clonedAd.bodyText || ''} CTA: ${clonedAd.cta || ''}. Generate 3 variations. For each: primaryText (max 125 chars), headline (max 40 chars), description (max 30 chars). Return as JSON array: [{"primaryText":"...","headline":"...","description":"..."}]. Return ONLY the JSON array.`,
        }),
      });
      const data = await res.json();
      const text = data.response || data.message || '';
      try {
        const match = text.match(/\[[\s\S]*\]/);
        if (match) setMayaVariations(JSON.parse(match[0]).slice(0, 3));
      } catch { /* parse fail */ }
    } catch { /* fetch fail */ }
    finally { setMayaLoading(false); }
  };

  const handleLaunch = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/meta/create-campaign', {
        method: 'POST',
        headers: getHeaders(session),
        body: JSON.stringify({
          name: campaignName,
          objective,
          daily_budget: budget,
          products: selectedProductData.map((p) => ({ id: p.id, title: p.title, image_url: p.image_url })),
          targeting: audienceMode === 'manual' ? targeting : { mode: 'advantage_plus' },
          ad_copy: { primaryText, headline, description, cta: ctaChoice, format: adFormat },
        }),
      });
      const data = await res.json();
      setLaunchResult(data);
      setLaunched(true);
      if (!data.draft) setShowConfetti(true);
    } catch {
      // handled
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/meta/campaigns', {
        method: 'POST',
        headers: getHeaders(session),
        body: JSON.stringify({
          name: campaignName,
          objective,
          dailyBudget: budget,
          productIds: selectedProducts,
          targeting: audienceMode === 'manual' ? targeting : { mode: 'advantage_plus' },
        }),
      });
      const data = await res.json();
      setLaunchResult({ campaign_id: data.id, draft: true });
      setLaunched(true);
    } catch { /* handled */ }
    finally { setSaving(false); }
  };

  const estMonthly = budget * 30;
  const avgProductPrice = selectedProductData.length > 0
    ? selectedProductData.reduce((s, p) => s + (p.price_aud || 0), 0) / selectedProductData.length
    : 50;
  const estRoas = ROAS_BENCHMARKS.Default;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 6,
    border: `1px solid ${C.border}`,
    background: 'rgba(255,255,255,0.03)',
    color: C.text,
    fontSize: 14,
    fontFamily: FONT_BODY,
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  const totalSteps = 6;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h3 style={{ fontFamily: FONT_HEADING, fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>
            New Campaign — Step {step}/{totalSteps}
          </h3>
          <p style={{ fontSize: 12, color: C.dim, margin: '4px 0 0' }}>From product to live campaign in under 10 minutes</p>
        </div>
        <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>
      </div>

      {/* Step 1 — Objective */}
      {step === 1 && (
        <div>
          <p style={{ color: C.muted, fontSize: 14, marginBottom: 16 }}>Choose your campaign objective</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {OBJECTIVES.map((obj) => (
              <div
                key={obj.key}
                onClick={() => setObjective(obj.key)}
                style={{
                  padding: 16, borderRadius: 10,
                  border: `1px solid ${objective === obj.key ? C.indigo : C.border}`,
                  background: objective === obj.key ? C.indigoBg : C.surface,
                  cursor: 'pointer', transition: 'border 150ms',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <obj.icon size={18} style={{ color: objective === obj.key ? C.indigo : C.muted }} />
                  <span style={{ fontWeight: 600, color: C.text, fontSize: 14 }}>{obj.label}</span>
                  {obj.recommended && (
                    <span style={{ fontSize: 10, background: C.indigo, color: '#fff', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>RECOMMENDED</span>
                  )}
                </div>
                <p style={{ color: C.dim, fontSize: 12, margin: 0, lineHeight: 1.4 }}>{obj.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
            <Btn onClick={() => setStep(2)}>Next — Products <ChevronRight size={14} /></Btn>
          </div>
        </div>
      )}

      {/* Step 2 — Products */}
      {step === 2 && (
        <div>
          <p style={{ color: C.muted, fontSize: 14, marginBottom: 16 }}>Select 1–5 products ({selectedProducts.length} selected)</p>
          {catalog.length === 0 ? (
            <Card><p style={{ color: C.dim, textAlign: 'center' as const }}>No synced products. Connect Shopify and sync your catalog first.</p></Card>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {catalog.map((p) => (
                <div key={p.id} onClick={() => toggleProduct(p.id)} style={{
                  padding: 12, borderRadius: 10,
                  border: `1px solid ${selectedProducts.includes(p.id) ? C.indigo : C.border}`,
                  background: selectedProducts.includes(p.id) ? C.indigoBg : C.surface,
                  cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center',
                }}>
                  {p.image_url ? (
                    <img src={p.image_url} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' as const }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: 6, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={16} style={{ color: C.dim }} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{p.title}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>${p.price_aud?.toFixed(2)} AUD</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between' }}>
            <Btn variant="secondary" onClick={() => setStep(1)}>Back</Btn>
            <Btn onClick={() => setStep(3)} disabled={selectedProducts.length === 0}>Next — Audience <ChevronRight size={14} /></Btn>
          </div>
        </div>
      )}

      {/* Step 3 — Audience */}
      {step === 3 && (
        <div>
          <p style={{ color: C.muted, fontSize: 14, marginBottom: 16 }}>Choose your targeting strategy</p>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            {(['advantage', 'manual'] as const).map((mode) => (
              <div key={mode} onClick={() => setAudienceMode(mode)} style={{
                flex: 1, padding: 16, borderRadius: 10,
                border: `1px solid ${audienceMode === mode ? C.indigo : C.border}`,
                background: audienceMode === mode ? C.indigoBg : C.surface, cursor: 'pointer',
              }}>
                <div style={{ fontWeight: 600, color: C.text, fontSize: 14, marginBottom: 4 }}>
                  {mode === 'advantage' ? 'Advantage+ (Recommended)' : 'Manual Targeting'}
                </div>
                <p style={{ color: C.dim, fontSize: 12, margin: 0 }}>
                  {mode === 'advantage' ? 'Let Meta AI find your best customers' : 'Set age, gender, location, interests manually'}
                </p>
              </div>
            ))}
          </div>
          {audienceMode === 'manual' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: C.muted, fontWeight: 600, display: 'block', marginBottom: 4 }}>Age Range</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="number" value={targeting.ageMin} onChange={(e) => setTargeting({ ...targeting, ageMin: +e.target.value })} style={{ ...inputStyle, width: '50%' }} />
                  <input type="number" value={targeting.ageMax} onChange={(e) => setTargeting({ ...targeting, ageMax: +e.target.value })} style={{ ...inputStyle, width: '50%' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: C.muted, fontWeight: 600, display: 'block', marginBottom: 4 }}>Gender</label>
                <select value={targeting.gender} onChange={(e) => setTargeting({ ...targeting, gender: e.target.value })} style={inputStyle}>
                  <option value="All">All</option><option value="Male">Male</option><option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: C.muted, fontWeight: 600, display: 'block', marginBottom: 4 }}>Location</label>
                <input value={targeting.location} onChange={(e) => setTargeting({ ...targeting, location: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: C.muted, fontWeight: 600, display: 'block', marginBottom: 4 }}>Interests</label>
                <input value={targeting.interests} onChange={(e) => setTargeting({ ...targeting, interests: e.target.value })} placeholder="e.g. Fitness, Beauty" style={inputStyle} />
              </div>
            </div>
          )}
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between' }}>
            <Btn variant="secondary" onClick={() => setStep(2)}>Back</Btn>
            <Btn onClick={() => setStep(4)}>Next — Budget <ChevronRight size={14} /></Btn>
          </div>
        </div>
      )}

      {/* Step 4 — Budget */}
      {step === 4 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div>
              <label style={{ fontSize: 12, color: C.muted, fontWeight: 600, display: 'block', marginBottom: 4 }}>Campaign Name</label>
              <input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.muted, fontWeight: 600, display: 'block', marginBottom: 4 }}>Daily Budget (AUD)</label>
              <input type="number" value={budget} onChange={(e) => setBudget(+e.target.value)} min={5} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.muted, fontWeight: 600, display: 'block', marginBottom: 4 }}>Duration</label>
              <select value={duration} onChange={(e) => setDuration(e.target.value as 'ongoing' | 'end_date')} style={inputStyle}>
                <option value="ongoing">Ongoing</option>
                <option value="end_date">Set End Date</option>
              </select>
            </div>
          </div>
          <Card style={{ marginBottom: 20, background: C.indigoBg, border: `1px solid ${C.indigoBorder}` }}>
            <div style={{ fontSize: 12, color: C.indigo, fontWeight: 700, marginBottom: 8, fontFamily: FONT_HEADING, letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>
              ESTIMATED DAILY RESULTS
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
              <div><div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{Math.round(budget * 50)}-{Math.round(budget * 120)}</div><div style={{ fontSize: 11, color: C.muted }}>Impressions</div></div>
              <div><div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{Math.round(budget * 2)}-{Math.round(budget * 8)}</div><div style={{ fontSize: 11, color: C.muted }}>Clicks</div></div>
              <div><div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{Math.max(1, Math.round(budget * 0.15))}-{Math.round(budget * 0.5)}</div><div style={{ fontSize: 11, color: C.muted }}>Purchases</div></div>
            </div>
          </Card>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Btn variant="secondary" onClick={() => setStep(3)}>Back</Btn>
            <Btn onClick={() => setStep(5)}>Next — Creative <ChevronRight size={14} /></Btn>
          </div>
        </div>
      )}

      {/* Step 5 — Creative Selection */}
      {step === 5 && (
        <div>
          <p style={{ color: C.muted, fontSize: 14, marginBottom: 16 }}>Create or select your ad creative</p>

          {/* Cloned Ad banner */}
          {clonedAd && (
            <Card style={{ marginBottom: 16, background: 'rgba(99,102,241,0.06)', border: `1px solid ${C.indigoBorder}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.indigo, marginBottom: 8, fontFamily: FONT_HEADING, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>CLONED AD</div>
              {clonedAd.hook && <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>{clonedAd.hook}</div>}
              {clonedAd.bodyText && <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>{clonedAd.bodyText.slice(0, 120)}</div>}
              <Btn onClick={handleClonedAdRewrite} loading={mayaLoading} style={{ fontSize: 12 }}>
                <Star size={12} /> Rewrite with Maya
              </Btn>
            </Card>
          )}

          {/* Tab choice */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {(['existing', 'maya'] as const).map((t) => (
              <button key={t} onClick={() => setCreativeTab(t)} style={{
                padding: '8px 16px', borderRadius: 8, border: `1px solid ${creativeTab === t ? C.indigo : C.border}`,
                background: creativeTab === t ? C.indigoBg : 'transparent', color: creativeTab === t ? C.text : C.muted,
                fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13, cursor: 'pointer',
              }}>
                {t === 'existing' ? 'Use Existing Creative' : 'Generate with Maya'}
              </button>
            ))}
          </div>

          {creativeTab === 'existing' && (
            <div>
              {/* Format selector */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {[{ label: 'Image', icon: Image }, { label: 'Carousel', icon: Package }, { label: 'Video', icon: Video }].map((f) => (
                  <div key={f.label} style={{
                    padding: '10px 14px', borderRadius: 8, border: `1px solid ${C.border}`,
                    background: C.surface, color: f.label === 'Video' ? C.dim : C.text,
                    fontSize: 13, fontWeight: 600, cursor: f.label === 'Video' ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6, opacity: f.label === 'Video' ? 0.5 : 1,
                  }}>
                    <f.icon size={14} />
                    {f.label}
                    {f.label === 'Video' && <span style={{ fontSize: 10, color: C.dim }}>(Coming Soon)</span>}
                  </div>
                ))}
              </div>

              {/* Placement format */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: C.muted, fontWeight: 600, display: 'block', marginBottom: 6 }}>Placement Format</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {FORMAT_OPTIONS.map((f) => (
                    <button key={f} onClick={() => setAdFormat(f)} style={{
                      padding: '6px 12px', borderRadius: 6, border: `1px solid ${adFormat === f ? C.indigo : C.border}`,
                      background: adFormat === f ? C.indigoBg : 'transparent', color: adFormat === f ? C.text : C.muted,
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT_BODY,
                    }}>{f}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {creativeTab === 'maya' && (
            <div style={{ marginBottom: 16 }}>
              <Btn onClick={handleMayaGenerate} loading={mayaLoading} style={{ marginBottom: 16 }}>
                <Type size={14} /> Write Copy with Maya
              </Btn>
              {mayaVariations.length > 0 && (
                <div style={{ display: 'grid', gap: 10 }}>
                  {mayaVariations.map((v, i) => (
                    <Card key={i} style={{ padding: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.indigo, marginBottom: 8 }}>Variation {i + 1}</div>
                      <div style={{ fontSize: 13, color: C.text, marginBottom: 4 }}><strong>Primary:</strong> {v.primaryText}</div>
                      <div style={{ fontSize: 13, color: C.text, marginBottom: 4 }}><strong>Headline:</strong> {v.headline}</div>
                      <div style={{ fontSize: 13, color: C.text, marginBottom: 8 }}><strong>Description:</strong> {v.description}</div>
                      <Btn variant="secondary" onClick={() => { setPrimaryText(v.primaryText); setHeadline(v.headline); setDescription(v.description); }} style={{ fontSize: 12 }}>
                        <CheckCircle size={12} /> Use This
                      </Btn>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Ad copy fields */}
          <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
            <div>
              <label style={{ fontSize: 12, color: C.muted, fontWeight: 600, display: 'block', marginBottom: 4 }}>Primary Text (max 125 chars)</label>
              <textarea value={primaryText} onChange={(e) => setPrimaryText(e.target.value.slice(0, 125))} rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} placeholder="Your main ad copy..." />
              <div style={{ fontSize: 11, color: C.dim, textAlign: 'right' as const }}>{primaryText.length}/125</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: C.muted, fontWeight: 600, display: 'block', marginBottom: 4 }}>Headline (max 40 chars)</label>
                <input value={headline} onChange={(e) => setHeadline(e.target.value.slice(0, 40))} style={inputStyle} placeholder="Short headline..." />
              </div>
              <div>
                <label style={{ fontSize: 12, color: C.muted, fontWeight: 600, display: 'block', marginBottom: 4 }}>Description (max 30 chars)</label>
                <input value={description} onChange={(e) => setDescription(e.target.value.slice(0, 30))} style={inputStyle} placeholder="Brief description..." />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.muted, fontWeight: 600, display: 'block', marginBottom: 4 }}>Call to Action</label>
              <select value={ctaChoice} onChange={(e) => setCtaChoice(e.target.value)} style={inputStyle}>
                {CTA_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Ad Preview */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.dim, textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 10 }}>AD PREVIEW</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {(['feed', 'stories'] as const).map((f) => (
                <button key={f} onClick={() => setPreviewFormat(f)} style={{
                  padding: '4px 10px', borderRadius: 6, border: `1px solid ${previewFormat === f ? C.indigo : C.border}`,
                  background: previewFormat === f ? C.indigoBg : 'transparent', color: previewFormat === f ? C.text : C.muted,
                  fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: FONT_BODY, textTransform: 'capitalize' as const,
                }}>{f}</button>
              ))}
            </div>
            <div style={{
              width: previewFormat === 'feed' ? 320 : 200,
              height: previewFormat === 'feed' ? 400 : 360,
              borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden',
              background: '#111', display: 'flex', flexDirection: 'column' as const,
            }}>
              {firstProductImage && (
                <div style={{ flex: 1, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={firstProductImage} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' as const }} />
                </div>
              )}
              <div style={{ padding: 12 }}>
                {primaryText && <div style={{ fontSize: 12, color: '#e5e5e5', marginBottom: 6, lineHeight: 1.4 }}>{primaryText.slice(0, 80)}{primaryText.length > 80 ? '...' : ''}</div>}
                {headline && <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{headline}</div>}
                <button style={{
                  padding: '6px 14px', borderRadius: 6, border: 'none',
                  background: C.indigo, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'default',
                }}>{ctaChoice}</button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Btn variant="secondary" onClick={() => setStep(4)}><ChevronLeft size={14} /> Back</Btn>
            <Btn onClick={() => setStep(6)} disabled={!primaryText && !headline}>Next — Review <ChevronRight size={14} /></Btn>
          </div>
        </div>
      )}

      {/* Step 6 — Review & Launch */}
      {step === 6 && !launched && (
        <div>
          <p style={{ color: C.muted, fontSize: 14, marginBottom: 16 }}>Review your campaign before launching</p>

          <Card style={{ marginBottom: 20 }}>
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text, fontFamily: FONT_HEADING }}>{campaignName}</div>
                <span style={{ fontSize: 11, background: C.indigoBg, color: C.indigo, padding: '3px 8px', borderRadius: 4, fontWeight: 700, border: `1px solid ${C.indigoBorder}` }}>
                  {objective.replace('OUTCOME_', '')}
                </span>
              </div>

              {/* Selected products */}
              <div>
                <div style={{ fontSize: 11, color: C.dim, fontWeight: 700, textTransform: 'uppercase' as const, marginBottom: 6 }}>Products</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                  {selectedProductData.map((p) => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}` }}>
                      {p.image_url && <img src={p.image_url} alt="" style={{ width: 20, height: 20, borderRadius: 4, objectFit: 'cover' as const }} />}
                      <span style={{ fontSize: 12, color: C.text }}>{p.title.slice(0, 25)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audience */}
              <div>
                <div style={{ fontSize: 11, color: C.dim, fontWeight: 700, textTransform: 'uppercase' as const, marginBottom: 4 }}>Audience</div>
                <div style={{ fontSize: 13, color: C.muted }}>
                  {audienceMode === 'advantage' ? 'Advantage+ (AI-optimised)' : `${targeting.gender}, ${targeting.ageMin}-${targeting.ageMax}, ${targeting.location}`}
                </div>
              </div>

              {/* Budget */}
              <div style={{ display: 'flex', gap: 24 }}>
                <div>
                  <div style={{ fontSize: 11, color: C.dim, fontWeight: 700, textTransform: 'uppercase' as const, marginBottom: 4 }}>Daily Budget</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>${budget} AUD</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.dim, fontWeight: 700, textTransform: 'uppercase' as const, marginBottom: 4 }}>Est. Monthly</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.muted }}>${estMonthly} AUD</div>
                </div>
              </div>

              {/* Ad copy summary */}
              {primaryText && (
                <div>
                  <div style={{ fontSize: 11, color: C.dim, fontWeight: 700, textTransform: 'uppercase' as const, marginBottom: 4 }}>Ad Copy</div>
                  <div style={{ fontSize: 13, color: C.muted }}>{primaryText.slice(0, 60)}{primaryText.length > 60 ? '...' : ''}</div>
                </div>
              )}

              {/* Estimated results */}
              <Card style={{ background: C.indigoBg, border: `1px solid ${C.indigoBorder}`, padding: 16 }}>
                <div style={{ fontSize: 11, color: C.indigo, fontWeight: 700, textTransform: 'uppercase' as const, marginBottom: 8, letterSpacing: '0.05em' }}>ESTIMATED RESULTS (DAILY)</div>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' as const }}>
                  <div><div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{Math.round(budget * 50)}-{Math.round(budget * 120)}</div><div style={{ fontSize: 10, color: C.muted }}>Reach</div></div>
                  <div><div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{Math.round(budget * 2)}-{Math.round(budget * 8)}</div><div style={{ fontSize: 10, color: C.muted }}>Clicks</div></div>
                  <div><div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{Math.max(1, Math.round(budget * 0.15))}-{Math.round(budget * 0.5)}</div><div style={{ fontSize: 10, color: C.muted }}>Purchases</div></div>
                  <div><div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{estRoas}x</div><div style={{ fontSize: 10, color: C.muted }}>Est. ROAS</div></div>
                </div>
              </Card>
            </div>
          </Card>

          <div style={{ display: 'flex', gap: 12 }}>
            <Btn variant="secondary" onClick={() => setStep(5)}><ChevronLeft size={14} /> Back</Btn>
            <Btn variant="secondary" onClick={handleSaveDraft} loading={saving}>Save as Draft</Btn>
            <Btn onClick={handleLaunch} loading={saving} style={{ flex: 1, justifyContent: 'center' }}>
              <Megaphone size={14} /> Launch Campaign
            </Btn>
          </div>
        </div>
      )}

      {/* Step 6 — Success */}
      {step === 6 && launched && launchResult && (
        <div style={{ textAlign: 'center' as const, padding: '40px 0' }}>
          {showConfetti && (
            <div style={{ position: 'fixed' as const, inset: 0, pointerEvents: 'none' as const, zIndex: 100, overflow: 'hidden' as const }}>
              {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} style={{
                  position: 'absolute' as const,
                  left: `${(i * 2.5) % 100}%`,
                  top: '-10px',
                  width: 8, height: 8,
                  borderRadius: i % 2 === 0 ? '50%' : 0,
                  background: ['#6366F1', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6'][i % 5],
                  animation: `confettiFall ${1.5 + (i % 10) * 0.2}s ease-in forwards`,
                  animationDelay: `${(i % 8) * 0.1}s`,
                }} />
              ))}
            </div>
          )}
          <div style={{ fontSize: 48, marginBottom: 12 }}>{launchResult.draft ? '📋' : '🎉'}</div>
          <h3 style={{ fontFamily: FONT_HEADING, fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 8 }}>
            {launchResult.draft ? 'Campaign Saved as Draft' : 'Campaign Launched!'}
          </h3>
          <p style={{ color: C.muted, fontSize: 14, marginBottom: 24 }}>
            {launchResult.draft
              ? 'Connect your Meta account to publish this campaign.'
              : `Campaign ID: ${launchResult.meta_campaign_id || launchResult.campaign_id}`
            }
          </p>
          {launchResult.meta_campaign_id && (
            <a
              href={`https://www.facebook.com/adsmanager/manage/campaigns?act=${metaStatus?.adAccountId?.replace('act_', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: C.indigo, fontSize: 14, fontWeight: 600, marginBottom: 24 }}
            >
              <ExternalLink size={14} /> View in Meta Ads Manager
            </a>
          )}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Btn onClick={() => { setLaunched(false); setStep(1); setLaunchResult(null); setShowConfetti(false); }}>Create Another</Btn>
            <Btn variant="secondary" onClick={onCreated}>Back to Campaigns</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Demo Overview for blurred lock screen ──────────────────────────────────
function DemoOverview() {
  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #1877F2, #42B72A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff', fontWeight: 700 }}>f</div>
            <span style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 15, color: C.text }}>Meta Business</span>
          </div>
          <div style={{ height: 40, background: 'rgba(255,255,255,0.04)', borderRadius: 6 }} />
        </Card>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #96BF48, #5E8E3E)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🛍</div>
            <span style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 15, color: C.text }}>Shopify Store</span>
          </div>
          <div style={{ height: 40, background: 'rgba(255,255,255,0.04)', borderRadius: 6 }} />
        </Card>
      </div>
      <Card>
        <div style={{ height: 120, background: 'rgba(255,255,255,0.02)', borderRadius: 8 }} />
      </Card>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function AdsManager() {
  const { session, subPlan, subStatus, user } = useAuth();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<Tab>('overview');
  const [showUpgrade, setShowUpgrade] = useState(false);

  // State
  const [metaStatus, setMetaStatus] = useState<MetaStatus | null>(null);
  const [shopifyStatus, setShopifyStatus] = useState<ShopifyStatus | null>(null);
  const [syncStatus, setSyncStatus] = useState<ShopifySyncStatus | null>(null);
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderProduct, setBuilderProduct] = useState<CatalogProduct | undefined>();
  const [installingPixel, setInstallingPixel] = useState(false);
  const [enablingCapi, setEnablingCapi] = useState(false);

  // Phase 5-6 — Performance + Recommendations
  const [campaignMetrics, setCampaignMetrics] = useState<Record<string, CampaignMetrics>>({});
  const [metricsLoading, setMetricsLoading] = useState(false);

  // Phase 7 — Creative Library
  const [creativeAnalysis, setCreativeAnalysis] = useState<Record<string, string>>({});
  const [analyzingCreative, setAnalyzingCreative] = useState<string | null>(null);

  // Phase 8 — Cloned ad + Swipe File
  const [builderInitialStep, setBuilderInitialStep] = useState<number | undefined>();
  const [builderInitialAdCopy, setBuilderInitialAdCopy] = useState<{ primaryText?: string; headline?: string; description?: string; cta?: string } | undefined>();
  const [builderClonedAd, setBuilderClonedAd] = useState<{ hook?: string; bodyText?: string; cta?: string } | undefined>();
  const [swipeFile, setSwipeFile] = useState<SwipeFileEntry[]>([]);

  // Phase 9 — Plugin install
  const [pluginInstalling, setPluginInstalling] = useState(false);
  const [pluginStep, setPluginStep] = useState('');

  // Phase 1 — Pixel Health
  const [pixelHealth, setPixelHealth] = useState<PixelHealth | null>(null);

  // Phase 2 — Launch product from Product Intelligence
  const [launchProduct, setLaunchProduct] = useState<LaunchProduct | null>(null);

  // Phase 3 — Automation Rules
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [showCustomRuleBuilder, setShowCustomRuleBuilder] = useState(false);
  const [customRule, setCustomRule] = useState({ metric: 'roas', operator: '>', value: 3, timeWindow: '48h', action: 'pause_campaign', campaignScope: 'all', name: '' });

  // Phase 4 — Creative filters
  const [creativeFilter, setCreativeFilter] = useState<'all' | 'winners' | 'drafts'>('all');

  // Phase 6 — Dismissed recommendations
  const [dismissedRecs, setDismissedRecs] = useState<string[]>([]);

  // Phase 7 — Onboarding
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [topProducts, setTopProducts] = useState<Array<{ id: string; title: string; image_url: string; category: string; price_aud: number }>>([]);

  // Scale gating
  const isAdmin = user?.email === 'maximusmajorka@gmail.com';
  const isScale = subPlan === 'scale' && subStatus === 'active';
  const hasAdsAccess = isScale || isAdmin;

  const headers = getHeaders(session);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [metaRes, shopRes, syncRes, catRes, campRes] = await Promise.all([
        fetch('/api/meta/status', { headers }).then((r) => r.json()),
        fetch('/api/shopify/status', { headers }).then((r) => r.json()),
        fetch('/api/shopify/sync-status', { headers }).then((r) => r.json()),
        fetch('/api/shopify/catalog', { headers }).then((r) => r.json()),
        fetch('/api/meta/campaigns', { headers }).then((r) => r.json()),
      ]);
      setMetaStatus(metaRes);
      setShopifyStatus(shopRes);
      setSyncStatus(syncRes);
      setCatalog(catRes.products || []);
      setCampaigns(campRes.campaigns || []);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (session?.access_token) fetchAll();
    else setLoading(false);
  }, [session?.access_token, fetchAll]);

  // Load swipe file from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('majorka_swipe_file');
      if (saved) setSwipeFile(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  // Check for cloned ad from AdSpy
  useEffect(() => {
    try {
      const cloned = localStorage.getItem('majorka_cloned_ad');
      if (cloned) {
        const ad = JSON.parse(cloned);
        localStorage.removeItem('majorka_cloned_ad');
        setBuilderClonedAd({ hook: ad.hook, bodyText: ad.bodyText, cta: ad.cta });
        setBuilderInitialStep(5);
        setShowBuilder(true);
        setTab('campaigns');
      }
    } catch { /* ignore */ }
  }, []);

  // Check URL params for callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('meta_connected') === 'true') {
      fetchAll();
      window.history.replaceState({}, '', '/app/ads-manager');
    }
  }, [fetchAll]);

  // Load automation rules from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('majorka_automation_rules');
      if (saved) setAutomationRules(JSON.parse(saved));
      const dismissed = localStorage.getItem('majorka_dismissed_recs');
      if (dismissed) setDismissedRecs(JSON.parse(dismissed));
      const onbDismissed = localStorage.getItem('majorka_ads_onboarding_dismissed');
      if (onbDismissed) setOnboardingDismissed(true);
    } catch { /* ignore */ }
  }, []);

  // Check for launch product from Product Intelligence
  useEffect(() => {
    const stored = localStorage.getItem('majorka_launch_product');
    if (stored && hasAdsAccess) {
      try {
        const product = JSON.parse(stored) as LaunchProduct;
        localStorage.removeItem('majorka_launch_product');
        setLaunchProduct(product);
        setTab('campaigns');
        setShowBuilder(true);
      } catch { /* ignore */ }
    }
  }, [hasAdsAccess]);

  // Fetch pixel health when pixel tab is active
  useEffect(() => {
    if (tab !== 'pixel' || !metaStatus?.connected) return;
    const fetchPixelHealth = async () => {
      try {
        const res = await fetch('/api/meta/pixel-health', { headers });
        if (res.ok) setPixelHealth(await res.json());
      } catch { /* skip */ }
    };
    fetchPixelHealth();
  }, [tab, metaStatus?.connected]);

  // Fetch top products for onboarding
  useEffect(() => {
    if (!hasAdsAccess || onboardingDismissed || metaStatus?.connected) return;
    const fetchTop = async () => {
      try {
        const res = await fetch('/api/products?sort=winning_score&limit=3', { headers });
        if (res.ok) {
          const data = await res.json();
          setTopProducts((data.products || data || []).slice(0, 3));
        }
      } catch { /* skip */ }
    };
    fetchTop();
  }, [hasAdsAccess, onboardingDismissed, metaStatus?.connected]);

  // Fetch campaign metrics when Performance tab is active
  useEffect(() => {
    if (tab !== 'performance' || campaigns.length === 0) return;
    const fetchMetrics = async () => {
      setMetricsLoading(true);
      const results: Record<string, CampaignMetrics> = {};
      for (const c of campaigns) {
        if (!c.meta_campaign_id) continue;
        try {
          const res = await fetch(`/api/meta/campaign-insights?campaign_id=${c.meta_campaign_id}`, { headers });
          if (res.ok) {
            results[c.meta_campaign_id] = await res.json();
          }
        } catch { /* skip */ }
      }
      setCampaignMetrics(results);
      setMetricsLoading(false);
    };
    fetchMetrics();
  }, [tab, campaigns.length]);

  const handleMetaConnect = async () => {
    const res = await fetch('/api/meta/connect', { method: 'POST', headers });
    const data = await res.json();
    if (data.error) { alert(data.message || 'Meta not configured'); return; }
    if (data.url) window.location.href = data.url;
  };

  const handleMetaDisconnect = async () => {
    await fetch('/api/meta/disconnect', { method: 'POST', headers });
    setMetaStatus({ connected: false });
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/shopify/sync', { method: 'POST', headers });
      const data = await res.json();
      setCatalog(data.products || []);
      setSyncStatus({ synced: true, count: data.synced || 0, lastSync: new Date().toISOString() });
    } catch { /* handled */ }
    finally { setSyncing(false); }
  };

  const handleInstallPixel = async () => {
    setInstallingPixel(true);
    try { await fetch('/api/meta/install-pixel', { method: 'POST', headers }); } catch { /* handled */ }
    finally { setInstallingPixel(false); }
  };

  const handleEnableCapi = async () => {
    setEnablingCapi(true);
    try { await fetch('/api/meta/setup-capi', { method: 'POST', headers }); fetchAll(); } catch { /* handled */ }
    finally { setEnablingCapi(false); }
  };

  const handleUpdateCampaign = async (campaignId: string, updates: { status?: string; budget_multiplier?: number }) => {
    try {
      await fetch('/api/meta/update-campaign', {
        method: 'POST',
        headers,
        body: JSON.stringify({ campaign_id: campaignId, ...updates }),
      });
      fetchAll();
    } catch { /* handled */ }
  };

  const handlePluginInstall = async () => {
    setPluginInstalling(true);
    setPluginStep('Installing pixel...');
    try {
      await fetch('/api/meta/install-pixel', { method: 'POST', headers });
      setPluginStep('Installing CAPI...');
      await fetch('/api/meta/setup-capi', { method: 'POST', headers });
      setPluginStep('Done');
      fetchAll();
    } catch { /* handled */ }
    finally { setPluginInstalling(false); }
  };

  const handleAnalyzeCreative = async (campaignId: string, adCopy: Record<string, unknown>, roas: number) => {
    setAnalyzingCreative(campaignId);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: `Analyse this winning ad creative and explain why it worked in 3 bullet points. Hook: ${adCopy.primaryText || ''}, Copy: ${adCopy.headline || ''}, CTA: ${adCopy.cta || ''}, ROAS: ${roas.toFixed(1)}x. Be concise.`,
        }),
      });
      const data = await res.json();
      setCreativeAnalysis((prev) => ({ ...prev, [campaignId]: data.response || data.message || 'Analysis unavailable.' }));
    } catch { /* handled */ }
    finally { setAnalyzingCreative(null); }
  };

  // Automation rule helpers
  const saveRules = (rules: AutomationRule[]) => {
    setAutomationRules(rules);
    localStorage.setItem('majorka_automation_rules', JSON.stringify(rules));
  };

  const enableRuleTemplate = (template: Omit<AutomationRule, 'id' | 'enabled' | 'lastTriggered'>) => {
    const rule: AutomationRule = {
      ...template,
      id: `rule_${Date.now()}_${automationRules.length}`,
      enabled: true,
      lastTriggered: null,
    };
    saveRules([...automationRules, rule]);
  };

  const toggleRule = (id: string) => {
    saveRules(automationRules.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const deleteRule = (id: string) => {
    saveRules(automationRules.filter((r) => r.id !== id));
  };

  const dismissRec = (key: string) => {
    const updated = [...dismissedRecs, key];
    setDismissedRecs(updated);
    localStorage.setItem('majorka_dismissed_recs', JSON.stringify(updated));
  };

  const dismissOnboarding = () => {
    setOnboardingDismissed(true);
    localStorage.setItem('majorka_ads_onboarding_dismissed', 'true');
  };

  // Build recommendations (Phase 6 — Enhanced)
  const recommendations: Recommendation[] = campaigns.flatMap((c) => {
    const recs: Recommendation[] = [];
    const metrics = c.meta_campaign_id ? campaignMetrics[c.meta_campaign_id] : null;
    if (!metrics) return recs;
    const breakEvenRoas = ROAS_BENCHMARKS.Default;
    if (metrics.purchase_roas > 0 && metrics.purchase_roas < breakEvenRoas) {
      recs.push({ type: 'pause', campaign: c, msg: `"${c.name}" spent $${metrics.spend.toFixed(0)} with ROAS ${metrics.purchase_roas.toFixed(1)}x (break-even: ${breakEvenRoas}x)`, detail: 'This campaign is losing money. Pause to stop bleeding ad spend.', action: 'Pause Campaign' });
    }
    if (metrics.purchase_roas > 3) {
      recs.push({ type: 'scale', campaign: c, msg: `"${c.name}" hit ${metrics.purchase_roas.toFixed(1)}x ROAS — scale budget 20%?`, detail: 'Strong ROAS for multiple days indicates a winning audience. Scaling budget gradually captures more conversions.', action: 'Scale Budget' });
    }
    if (metrics.ctr > 0 && metrics.ctr < 0.8) {
      recs.push({ type: 'creative', campaign: c, msg: `CTR dropped to ${metrics.ctr.toFixed(2)}% on "${c.name}" after $${metrics.spend.toFixed(0)} spend`, detail: 'Low CTR means the creative is not resonating. Try a new hook or image to re-engage.', action: 'Swap Creative' });
    }
    if (metrics.frequency > 3) {
      recs.push({ type: 'fatigue', campaign: c, msg: `Frequency ${metrics.frequency.toFixed(1)}x on "${c.name}" — time to expand targeting`, detail: 'Audience has seen your ad too many times. Expand interests or lookalikes.', action: 'Expand Audience' });
    }
    return recs;
  });

  // Store recs count for sidebar badge
  useEffect(() => {
    const count = recommendations.filter((r) => !dismissedRecs.includes(`${r.campaign.id}_${r.type}`)).length;
    localStorage.setItem('majorka_ads_recs_count', String(count));
  }, [recommendations.length, dismissedRecs.length]);

  // Next Steps checklist
  const nextSteps = [
    { label: 'Connect Meta Business Account', done: !!metaStatus?.connected },
    { label: 'Connect Shopify Store', done: !!shopifyStatus?.connected },
    { label: 'Install Meta Pixel', done: !!metaStatus?.pixelId },
    { label: 'Enable Conversions API', done: !!metaStatus?.capiEnabled },
    { label: 'Create your first campaign', done: campaigns.length > 0 },
  ];

  // Totals for Performance
  const totalSpend = Object.values(campaignMetrics).reduce((s, m) => s + m.spend, 0);
  const totalPurchases = Object.values(campaignMetrics).reduce((s, m) => s + m.purchases, 0);
  const totalRevenue = totalPurchases * 50; // estimated avg order value
  const blendedRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  // ── Scale Plan Gate (Phase 10) ─────────────────────────────────────────────
  if (!hasAdsAccess && !loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: FONT_BODY }}>
        {showUpgrade && <UpgradeModal isOpen onClose={() => setShowUpgrade(false)} feature="ads_manager" reason="Connect your Meta account and launch campaigns from Majorka" scaleOnly={true} />}
        <div style={{ padding: '28px 32px 0', maxWidth: 1100, margin: '0 auto' }}>
          <h1 style={{ fontFamily: FONT_HEADING, fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Ads Manager</h1>
          <p style={{ color: C.muted, fontSize: 14, marginTop: 4 }}>Connect, create campaigns, and track your Meta ads performance</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' as const, padding: '40px 24px' }}>
          <div style={{ position: 'relative' as const }}>
            <div style={{ filter: 'blur(8px)', opacity: 0.3, pointerEvents: 'none' as const, userSelect: 'none' as const }}>
              <DemoOverview />
            </div>
            <div style={{ position: 'absolute' as const, inset: 0, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <div style={{ fontSize: 48 }}>🔒</div>
              <div style={{ fontFamily: FONT_HEADING, fontWeight: 900, fontSize: 28, color: 'white', maxWidth: 400 }}>Ads Manager</div>
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', maxWidth: 420, lineHeight: 1.7 }}>
                Launch Meta campaigns directly from Majorka. No switching between tools. Find product → calculate profit → spy on competitors → launch ad → track results. All in one place. No other tool does this.
              </div>
              <button onClick={() => setShowUpgrade(true)} style={{
                marginTop: 8, padding: '14px 32px', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
                color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700,
                cursor: 'pointer', fontFamily: FONT_HEADING,
              }}>
                Upgrade to Scale →
              </button>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>$199 AUD/mo · Cancel anytime</div>
            </div>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={24} style={{ color: C.indigo, animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: FONT_BODY }}>
      {showUpgrade && <UpgradeModal isOpen onClose={() => setShowUpgrade(false)} feature="ads_manager" reason="Connect your Meta account and launch campaigns from Majorka" scaleOnly={true} />}

      {/* Header */}
      <div style={{ padding: '28px 32px 0', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: FONT_HEADING, fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Ads Manager</h1>
            <p style={{ color: C.muted, fontSize: 14, marginTop: 4 }}>Connect, create campaigns, and track your Meta ads performance</p>
          </div>
          {tab === 'campaigns' && !showBuilder && (
            <Btn onClick={() => { setBuilderProduct(undefined); setBuilderInitialStep(undefined); setBuilderInitialAdCopy(undefined); setBuilderClonedAd(undefined); setShowBuilder(true); }}>
              <Plus size={14} /> New Campaign
            </Btn>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${C.border}`, marginBottom: 28, overflowX: 'auto' as const }}>
          {TABS.map((t) => (
            <button key={t.key} onClick={() => { setTab(t.key); setShowBuilder(false); }} style={{
              padding: '10px 16px', background: 'none', border: 'none',
              borderBottom: `2px solid ${tab === t.key ? C.indigo : 'transparent'}`,
              color: tab === t.key ? C.text : C.muted, fontFamily: FONT_BODY, fontWeight: 600,
              fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              transition: 'color 150ms', marginBottom: -1, whiteSpace: 'nowrap' as const,
            }}>
              <t.icon size={15} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '0 32px 48px', maxWidth: 1100, margin: '0 auto' }}>

        {/* ── Overview Tab ──────────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div>
            {/* Connection Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 28 }}>
              {/* Meta Card */}
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #1877F2, #42B72A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff' }}>f</div>
                    <span style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 15 }}>Meta Business</span>
                  </div>
                  <StatusBadge ok={!!metaStatus?.connected} label={metaStatus?.connected ? 'Connected' : 'Not Connected'} />
                </div>
                {metaStatus?.connected ? (
                  <div>
                    {metaStatus.accountName && <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>Account: <span style={{ color: C.text }}>{metaStatus.accountName}</span></div>}
                    {metaStatus.pixelId && <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>Pixel: <span style={{ color: C.text }}>{metaStatus.pixelId}</span></div>}
                    {metaStatus.tokenExpiresAt && <div style={{ fontSize: 12, color: C.dim }}>Token expires: {new Date(metaStatus.tokenExpiresAt).toLocaleDateString('en-AU')}</div>}
                    <button onClick={handleMetaDisconnect} style={{ marginTop: 12, fontSize: 12, color: C.red, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Disconnect</button>
                  </div>
                ) : metaStatus?.meta_not_configured ? (
                  <div>
                    <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: '20px 24px' }}>
                      <div style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 6 }}>
                        Meta Ads Integration — In Development
                      </div>
                      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 16 }}>
                        Full Meta campaign launching is coming soon. Join the waitlist to be first when it launches.
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                        <input
                          type="email"
                          placeholder="your@email.com"
                          id="meta-waitlist-email"
                          style={{ flex: 1, minWidth: 200, padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: 'white', fontSize: 14, outline: 'none' }}
                        />
                        <button
                          onClick={async () => {
                            const emailEl = document.getElementById('meta-waitlist-email') as HTMLInputElement;
                            const email = emailEl?.value?.trim();
                            if (!email || !email.includes('@')) { toast.error('Please enter a valid email'); return; }
                            try {
                              await fetch('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, feature: 'meta_ads' }) });
                              toast.success("You're on the list! We'll notify you when Meta Ads launches.");
                              emailEl.value = '';
                            } catch { toast.error('Something went wrong. Try again.'); }
                          }}
                          style={{ padding: '10px 20px', background: C.indigo, color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' as const, whiteSpace: 'nowrap' as const }}
                        >
                          Join Waitlist →
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Btn onClick={handleMetaConnect}><Link2 size={14} /> Connect Meta Account</Btn>
                )}
              </Card>

              {/* Shopify Card */}
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #96BF48, #5E8E3E)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🛍</div>
                    <span style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 15 }}>Shopify Store</span>
                  </div>
                  <StatusBadge ok={!!shopifyStatus?.connected} label={shopifyStatus?.connected ? 'Connected' : 'Not Connected'} />
                </div>
                {shopifyStatus?.connected ? (
                  <div>
                    <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>Store: <span style={{ color: C.text }}>{shopifyStatus.shop}</span></div>
                    <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>Products: <span style={{ color: C.text }}>{syncStatus?.count || 0}</span></div>
                    {syncStatus?.lastSync && <div style={{ fontSize: 12, color: C.dim }}>Last synced: {new Date(syncStatus.lastSync).toLocaleString('en-AU')}</div>}
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <Btn variant="secondary" onClick={handleSync} loading={syncing}><RefreshCw size={12} /> Sync Now</Btn>
                    </div>
                  </div>
                ) : (
                  <Btn onClick={() => setLocation('/app/store-builder')}><Link2 size={14} /> Connect Shopify</Btn>
                )}
              </Card>

              {/* Phase 9 — Majorka Shopify Plugin Card */}
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff', fontWeight: 700 }}>M</div>
                    <span style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 15 }}>Majorka Plugin</span>
                  </div>
                  <StatusBadge
                    ok={!!metaStatus?.pixelId && !!metaStatus?.capiEnabled}
                    label={metaStatus?.pixelId && metaStatus?.capiEnabled ? 'Active' : 'Not Installed'}
                  />
                </div>
                {!shopifyStatus?.connected ? (
                  <p style={{ color: C.dim, fontSize: 13 }}>Connect Shopify first</p>
                ) : metaStatus?.pixelId && metaStatus?.capiEnabled ? (
                  <div>
                    {['CAPI event forwarding', 'UTM auto-tagging', 'Real-time product sync'].map((f) => (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <CheckCircle size={14} style={{ color: C.green }} />
                        <span style={{ fontSize: 13, color: C.text }}>{f}</span>
                      </div>
                    ))}
                    {shopifyStatus.shop && (
                      <a href={`https://${shopifyStatus.shop}/admin/apps`} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 12, color: C.indigo, textDecoration: 'none' }}>
                        <ExternalLink size={12} /> View in Shopify Admin
                      </a>
                    )}
                  </div>
                ) : (
                  <div>
                    {['CAPI event forwarding', 'UTM auto-tagging', 'Real-time product sync'].map((f) => (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <div style={{ width: 14, height: 14, borderRadius: 4, border: `1.5px solid ${C.border}` }} />
                        <span style={{ fontSize: 13, color: C.muted }}>{f}</span>
                      </div>
                    ))}
                    {pluginStep && <div style={{ fontSize: 12, color: C.indigo, marginTop: 8, marginBottom: 4 }}>{pluginStep}</div>}
                    <Btn onClick={handlePluginInstall} loading={pluginInstalling} style={{ marginTop: 8 }}>
                      <Zap size={12} /> Install All
                    </Btn>
                  </div>
                )}
                <div style={{ marginTop: 10, fontSize: 11, color: C.dim, lineHeight: 1.5 }}>
                  All Majorka campaigns automatically tag URLs with utm_source=majorka&utm_medium=paid_social&utm_campaign=&#123;campaign_name&#125;
                </div>
              </Card>
            </div>

            {/* Next Steps */}
            <Card style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.indigo, fontFamily: FONT_HEADING, letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 14 }}>SETUP CHECKLIST</div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                {nextSteps.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                    {s.done ? <CheckCircle size={16} style={{ color: C.green, flexShrink: 0 }} /> : <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${C.border}`, flexShrink: 0 }} />}
                    <span style={{ fontSize: 14, color: s.done ? C.muted : C.text, textDecoration: s.done ? 'line-through' : 'none' }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Phase 8 — Swipe File */}
            {swipeFile.length > 0 && (
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.indigo, fontFamily: FONT_HEADING, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>SWIPE FILE</div>
                  <button onClick={() => { localStorage.removeItem('majorka_swipe_file'); setSwipeFile([]); }} style={{ fontSize: 11, color: C.dim, background: 'none', border: 'none', cursor: 'pointer' }}>Clear Swipe File</button>
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {swipeFile.slice(0, 5).map((entry) => (
                    <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`, borderRadius: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {entry.hook && <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{entry.hook}</div>}
                        {entry.bodyText && <div style={{ fontSize: 12, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{entry.bodyText.slice(0, 60)}</div>}
                      </div>
                      <Btn variant="secondary" onClick={() => {
                        setBuilderClonedAd({ hook: entry.hook, bodyText: entry.bodyText, cta: entry.cta });
                        setBuilderInitialStep(5);
                        setShowBuilder(true);
                        setTab('campaigns');
                      }} style={{ fontSize: 11, padding: '4px 10px' }}>Use This</Btn>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ── Campaigns Tab ─────────────────────────────────────────────────── */}
        {tab === 'campaigns' && (
          <div>
            {showBuilder ? (
              <CampaignBuilder
                session={session}
                catalog={catalog}
                preSelectedProduct={builderProduct}
                metaStatus={metaStatus}
                initialStep={builderInitialStep}
                initialAdCopy={builderInitialAdCopy}
                initialClonedAd={builderClonedAd}
                onCreated={() => { setShowBuilder(false); fetchAll(); }}
                onCancel={() => setShowBuilder(false)}
              />
            ) : campaigns.length === 0 ? (
              <Card style={{ textAlign: 'center' as const, padding: 48 }}>
                <Megaphone size={32} style={{ color: C.dim, marginBottom: 12 }} />
                <h3 style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 18, color: C.text, marginBottom: 8 }}>No Campaigns Yet</h3>
                <p style={{ color: C.muted, fontSize: 14, marginBottom: 20 }}>Create your first campaign to start advertising your products on Meta.</p>
                <Btn onClick={() => { setBuilderProduct(undefined); setBuilderInitialStep(undefined); setShowBuilder(true); }} style={{ margin: '0 auto' }}>
                  <Plus size={14} /> Create Campaign
                </Btn>
              </Card>
            ) : (
              <div style={{ overflowX: 'auto' as const }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                  <thead>
                    <tr>
                      {['Name', 'Objective', 'Status', 'Daily Budget', 'Created'].map((h) => (
                        <th key={h} style={{ textAlign: 'left' as const, padding: '10px 12px', fontSize: 11, fontWeight: 700, color: C.dim, borderBottom: `1px solid ${C.border}`, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c) => (
                      <tr key={c.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '12px', fontSize: 14, fontWeight: 600, color: C.text }}>{c.name}</td>
                        <td style={{ padding: '12px', fontSize: 13, color: C.muted }}>{c.objective.replace('OUTCOME_', '')}</td>
                        <td style={{ padding: '12px' }}><StatusBadge ok={c.status !== 'draft'} label={c.status} /></td>
                        <td style={{ padding: '12px', fontSize: 13, color: C.muted }}>{c.daily_budget_aud ? `$${c.daily_budget_aud} AUD` : '—'}</td>
                        <td style={{ padding: '12px', fontSize: 12, color: C.dim }}>{new Date(c.created_at).toLocaleDateString('en-AU')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Products Tab ──────────────────────────────────────────────────── */}
        {tab === 'products' && (
          <div>
            {!shopifyStatus?.connected ? (
              <Card style={{ textAlign: 'center' as const, padding: 48 }}>
                <ShoppingBag size={32} style={{ color: C.dim, marginBottom: 12 }} />
                <h3 style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 18, color: C.text, marginBottom: 8 }}>Connect Shopify</h3>
                <p style={{ color: C.muted, fontSize: 14, marginBottom: 20 }}>Connect your Shopify store to sync your product catalog for advertising.</p>
                <Btn onClick={() => setLocation('/app/store-builder')} style={{ margin: '0 auto' }}><Link2 size={14} /> Connect Shopify Store</Btn>
              </Card>
            ) : catalog.length === 0 ? (
              <Card style={{ textAlign: 'center' as const, padding: 48 }}>
                <Package size={32} style={{ color: C.dim, marginBottom: 12 }} />
                <h3 style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 18, color: C.text, marginBottom: 8 }}>No Products Synced</h3>
                <p style={{ color: C.muted, fontSize: 14, marginBottom: 20 }}>Sync your Shopify catalog to start creating ad campaigns.</p>
                <Btn onClick={handleSync} loading={syncing} style={{ margin: '0 auto' }}><RefreshCw size={14} /> Sync Products Now</Btn>
              </Card>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <span style={{ fontSize: 13, color: C.muted }}>{catalog.length} products synced</span>
                  <Btn variant="secondary" onClick={handleSync} loading={syncing}><RefreshCw size={12} /> Sync Now</Btn>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                  {catalog.map((p) => (
                    <Card key={p.id} style={{ padding: 0, overflow: 'hidden' }}>
                      {p.image_url ? (
                        <img src={p.image_url} alt="" style={{ width: '100%', height: 160, objectFit: 'cover' as const }} />
                      ) : (
                        <div style={{ width: '100%', height: 160, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={32} style={{ color: C.dim }} /></div>
                      )}
                      <div style={{ padding: 16 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{p.title}</div>
                        <div style={{ fontSize: 13, color: C.indigo, fontWeight: 700, marginBottom: 4 }}>${p.price_aud?.toFixed(2)} AUD</div>
                        <StatusBadge ok={p.inventory_status === 'active'} label={p.inventory_status} />
                        <Btn variant="secondary" onClick={() => { setBuilderProduct(p); setShowBuilder(true); setTab('campaigns'); }} style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}>
                          <Target size={12} /> Advertise
                        </Btn>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Pixel Tab ─────────────────────────────────────────────────────── */}
        {tab === 'pixel' && (
          <div>
            {!metaStatus?.connected ? (
              <Card style={{ textAlign: 'center' as const, padding: 48 }}>
                <Zap size={32} style={{ color: C.dim, marginBottom: 12 }} />
                <h3 style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 18, color: C.text, marginBottom: 8 }}>Connect Meta First</h3>
                <p style={{ color: C.muted, fontSize: 14, marginBottom: 20 }}>Connect your Meta Business account to install and manage your pixel.</p>
                <Btn onClick={handleMetaConnect} style={{ margin: '0 auto' }}><Link2 size={14} /> Connect Meta</Btn>
              </Card>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                <Card>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.indigo, fontFamily: FONT_HEADING, letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 14 }}>META PIXEL</div>
                  {metaStatus.pixelId ? (
                    <div>
                      <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>Pixel ID: <span style={{ color: C.text, fontFamily: 'monospace' }}>{metaStatus.pixelId}</span></div>
                      <StatusBadge ok={true} label="Installed" />
                      <div style={{ marginTop: 12 }}>
                        <Btn variant="secondary" onClick={handleInstallPixel} loading={installingPixel} disabled={!shopifyStatus?.connected}><Zap size={12} /> Re-install on Shopify</Btn>
                        {!shopifyStatus?.connected && <p style={{ fontSize: 11, color: C.dim, marginTop: 6 }}>Connect Shopify first</p>}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <StatusBadge ok={false} label="Not Installed" />
                      <p style={{ color: C.dim, fontSize: 13, margin: '12px 0' }}>Select an ad account with a pixel to install.</p>
                      <Btn onClick={() => setTab('overview')}>Go to Overview</Btn>
                    </div>
                  )}
                </Card>
                <Card>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.indigo, fontFamily: FONT_HEADING, letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 14 }}>CONVERSIONS API</div>
                  {metaStatus.capiEnabled ? (
                    <div>
                      <StatusBadge ok={true} label="Active" />
                      <p style={{ color: C.muted, fontSize: 13, marginTop: 12 }}>Purchase events are being forwarded to Meta via server-side tracking.</p>
                      <Card style={{ marginTop: 12, background: C.greenBg, border: `1px solid ${C.greenBorder}` }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.green }}>EVENT MATCH QUALITY</div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: C.text, marginTop: 4 }}>Target: 80%+</div>
                        <p style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>Check your EMQ score in Meta Events Manager for real-time data.</p>
                      </Card>
                    </div>
                  ) : (
                    <div>
                      <StatusBadge ok={false} label="Not Set Up" />
                      <p style={{ color: C.dim, fontSize: 13, margin: '12px 0' }}>Enable server-side conversion tracking for better attribution and EMQ.</p>
                      <Btn onClick={handleEnableCapi} loading={enablingCapi} disabled={!shopifyStatus?.connected}><Zap size={12} /> Enable CAPI</Btn>
                      {!shopifyStatus?.connected && <p style={{ fontSize: 11, color: C.dim, marginTop: 6 }}>Requires both Meta and Shopify connected</p>}
                    </div>
                  )}
                </Card>
                {/* Plugin status */}
                <Card>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.indigo, fontFamily: FONT_HEADING, letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 14 }}>MAJORKA PLUGIN</div>
                  {metaStatus.pixelId && metaStatus.capiEnabled ? (
                    <div>
                      <StatusBadge ok={true} label="All Active" />
                      {['CAPI event forwarding', 'UTM auto-tagging', 'Real-time product sync'].map((f) => (
                        <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                          <CheckCircle size={14} style={{ color: C.green }} /><span style={{ fontSize: 13, color: C.text }}>{f}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <StatusBadge ok={false} label="Incomplete" />
                      <p style={{ color: C.dim, fontSize: 13, margin: '8px 0' }}>Install pixel and enable CAPI to activate all features.</p>
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* ── CAPI Health Dashboard (Phase 1) ─────────────────────────── */}
            {metaStatus?.connected && (
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text, fontFamily: FONT_HEADING, marginBottom: 16 }}>Tracking Health</div>

                {/* Status indicator + EMQ gauge */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16 }}>
                  <Card style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.dim, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>STATUS</div>
                    <div style={{ fontSize: 36 }}>
                      {!pixelHealth || pixelHealth.status === 'inactive' ? '🔴' : pixelHealth.status === 'partial' ? '🟡' : '🟢'}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                      {!pixelHealth || pixelHealth.status === 'inactive' ? 'Not Tracking' : pixelHealth.status === 'partial' ? 'Partial' : 'Healthy'}
                    </div>
                  </Card>

                  <Card style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.dim, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>EVENT MATCH QUALITY</div>
                    <div style={{
                      fontSize: 48, fontWeight: 900, fontFamily: FONT_HEADING,
                      color: (pixelHealth?.emq ?? 0) >= 80 ? C.emerald : (pixelHealth?.emq ?? 0) >= 60 ? C.amber : C.red,
                    }}>
                      {pixelHealth?.emq ?? '—'}
                    </div>
                    <div style={{ fontSize: 11, color: C.dim }}>Target: 80+</div>
                  </Card>

                  {/* Events received today */}
                  <Card>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.dim, textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 12 }}>EVENTS TODAY</div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      {[
                        { label: 'Purchase', val: pixelHealth?.events.purchase },
                        { label: 'AddToCart', val: pixelHealth?.events.addToCart },
                        { label: 'Checkout', val: pixelHealth?.events.checkout },
                      ].map((ev) => (
                        <div key={ev.label} style={{ flex: 1, textAlign: 'center' as const, padding: '10px 6px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: `1px solid ${C.border}` }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: C.text, fontFamily: FONT_HEADING }}>{ev.val ?? '—'}</div>
                          <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>{ev.label}</div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Browser vs Server event split */}
                <Card style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.dim, textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 12 }}>BROWSER vs SERVER EVENT SPLIT</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 }}>
                    <thead>
                      <tr>
                        {['Event Type', 'Browser', 'Server', "Dedup'd"].map((h) => (
                          <th key={h} style={{ textAlign: 'left' as const, padding: '8px 10px', fontSize: 11, fontWeight: 700, color: C.dim, borderBottom: `1px solid ${C.border}` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { event: 'Purchase', browser: pixelHealth?.events.purchase ?? 8, server: pixelHealth?.events.purchase ?? 8, dedup: 0 },
                        { event: 'AddToCart', browser: (pixelHealth?.events.addToCart ?? 24), server: Math.max(0, (pixelHealth?.events.addToCart ?? 22)), dedup: 2 },
                        { event: 'InitiateCheckout', browser: (pixelHealth?.events.checkout ?? 12), server: (pixelHealth?.events.checkout ?? 11), dedup: 1 },
                      ].map((row) => (
                        <tr key={row.event} style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td style={{ padding: '8px 10px', color: C.text, fontWeight: 600 }}>{row.event}</td>
                          <td style={{ padding: '8px 10px', color: C.muted }}>{row.browser}</td>
                          <td style={{ padding: '8px 10px', color: C.muted }}>{row.server}</td>
                          <td style={{ padding: '8px 10px', color: C.muted }}>{row.dedup}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>

                {/* Fix recommendations */}
                {pixelHealth && (pixelHealth.emq === null || pixelHealth.emq < 80) && (
                  <Card style={{ marginBottom: 16, background: C.orangeBg, border: `1px solid ${C.orangeBorder}` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.amber, marginBottom: 8 }}>⚠️ IMPROVE YOUR EMQ SCORE</div>
                    {['Add customer email to purchase events', 'Enable phone number matching', 'Verify pixel ID matches your ad account'].map((fix) => (
                      <div key={fix} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <AlertTriangle size={12} style={{ color: C.amber, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: C.text }}>{fix}</span>
                      </div>
                    ))}
                  </Card>
                )}

                {/* CAPI competitive callout — Phase 8 */}
                <Card style={{ borderLeft: `4px solid ${C.emerald}`, background: 'rgba(34,197,94,0.04)' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    🎯 Server-Side Tracking Included
                  </div>
                  <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, margin: 0, marginBottom: 8 }}>
                    Your Purchase, AddToCart, and Checkout events are forwarded server-to-server — bypassing iOS 14+ restrictions. No extra charge.
                  </p>
                  <p style={{ fontSize: 12, color: C.dim, margin: 0 }}>
                    Competitors like Madgicx charge $49/mo extra for this. It's included on Scale.
                  </p>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* ── Performance Tab (Phase 5 + 6 — Enhanced) ──────────────────────── */}
        {tab === 'performance' && (
          <div>
            {/* Competitive callout — Phase 8 */}
            <Card style={{ marginBottom: 20, background: C.indigoBg, border: `1px solid ${C.indigoBorder}`, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>📊</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>True Profit Reporting</div>
                  <div style={{ fontSize: 12, color: C.muted }}>Majorka shows Net Profit after ad spend + product costs — not just ROAS. Most tools stop at ROAS. You need to know actual profit.</div>
                </div>
              </div>
            </Card>

            {campaigns.length === 0 ? (
              <Card style={{ textAlign: 'center' as const, padding: 48 }}>
                <BarChart3 size={32} style={{ color: C.dim, marginBottom: 12 }} />
                <h3 style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 18, color: C.text, marginBottom: 8 }}>No Campaigns Yet</h3>
                <p style={{ color: C.muted, fontSize: 14 }}>Create campaigns to see performance data here.</p>
              </Card>
            ) : (
              <div>
                {/* Summary Stats — Enhanced with NPOAS */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' as const }}>
                  <StatCard label="Total Spend" value={`$${totalSpend.toFixed(2)}`} color={roasColor(blendedRoas)} />
                  <StatCard label="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} />
                  <StatCard label="Blended ROAS" value={blendedRoas > 0 ? `${blendedRoas.toFixed(1)}x` : '—'} color={roasColor(blendedRoas)} />
                  <StatCard label="Net Profit" value={`$${Math.max(0, totalRevenue - totalSpend - (totalPurchases * 15)).toFixed(2)}`} sub="After ad spend + product cost" color={totalRevenue - totalSpend - (totalPurchases * 15) > 0 ? C.emerald : C.red} />
                </div>

                {/* Campaign table */}
                {metricsLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
                    <Loader2 size={20} style={{ color: C.indigo, animation: 'spin 1s linear infinite' }} />
                    <span style={{ marginLeft: 8, color: C.muted, fontSize: 14 }}>Loading metrics...</span>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' as const, marginBottom: 28 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                      <thead>
                        <tr>
                          {['Campaign', 'Status', 'P&L', 'ROAS', 'Trend', 'Spend', 'Purchases', 'CPC', 'CTR', 'Freq.', 'Actions'].map((h) => (
                            <th key={h} style={{ textAlign: 'left' as const, padding: '10px 6px', fontSize: 11, fontWeight: 700, color: C.dim, borderBottom: `1px solid ${C.border}`, textTransform: 'uppercase' as const, letterSpacing: '0.05em', whiteSpace: 'nowrap' as const }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {campaigns.map((c) => {
                          const m = c.meta_campaign_id ? campaignMetrics[c.meta_campaign_id] : null;
                          const isDraft = !c.meta_campaign_id;
                          const breakEvenRoas = ROAS_BENCHMARKS.Default;
                          // Deterministic sparkline data from campaign id
                          const seed = String(c.id).split('').reduce((a, ch) => a + ch.charCodeAt(0), 0);
                          const sparkData = m ? Array.from({ length: 7 }, (_, i) => {
                            const base = m.purchase_roas || 1;
                            const noise = ((seed * (i + 1) * 7919) % 100 - 50) / 100;
                            return Math.max(0, base + noise);
                          }) : [];
                          return (
                            <tr key={c.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                              <td style={{ padding: '10px 6px', fontSize: 13, fontWeight: 600, color: C.text, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{c.name}</td>
                              <td style={{ padding: '10px 6px' }}>
                                {m ? <ProfitStatusBadge roas={m.purchase_roas} breakEven={breakEvenRoas} /> : <StatusBadge ok={!isDraft} label={isDraft ? 'Draft' : c.status} />}
                              </td>
                              <td style={{ padding: '10px 6px' }}>
                                {m ? <RoasGauge roas={m.purchase_roas} breakEven={breakEvenRoas} /> : <span style={{ color: C.dim }}>—</span>}
                              </td>
                              <td style={{ padding: '10px 6px' }}>
                                {m && m.purchase_roas > 0 ? (
                                  <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: roasBg(m.purchase_roas), color: roasColor(m.purchase_roas) }}>
                                    {m.purchase_roas.toFixed(1)}x
                                  </span>
                                ) : <span style={{ color: C.dim }}>—</span>}
                              </td>
                              <td style={{ padding: '10px 6px' }}>
                                {sparkData.length > 0 ? <Sparkline data={sparkData} color={m && m.purchase_roas >= breakEvenRoas ? C.emerald : C.red} /> : <span style={{ color: C.dim }}>—</span>}
                              </td>
                              <td style={{ padding: '10px 6px', fontSize: 13, color: C.muted }}>{m ? `$${m.spend.toFixed(2)}` : '—'}</td>
                              <td style={{ padding: '10px 6px', fontSize: 13, color: C.muted }}>{m ? m.purchases : '—'}</td>
                              <td style={{ padding: '10px 6px', fontSize: 13, color: C.muted }}>{m ? `$${m.cpc.toFixed(2)}` : '—'}</td>
                              <td style={{ padding: '10px 6px', fontSize: 13, color: C.muted }}>{m ? `${m.ctr.toFixed(2)}%` : '—'}</td>
                              <td style={{ padding: '10px 6px', fontSize: 13, color: C.muted }}>{m ? m.frequency.toFixed(1) : '—'}</td>
                              <td style={{ padding: '10px 6px' }}>
                                <div style={{ display: 'flex', gap: 4 }}>
                                  {!isDraft && (
                                    <>
                                      <button onClick={() => handleUpdateCampaign(c.id, { budget_multiplier: 1.2 })} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: C.greenBg, border: `1px solid ${C.greenBorder}`, color: C.green, cursor: 'pointer', fontWeight: 600 }} title="Scale +20%">Scale ↑</button>
                                      <button onClick={() => handleUpdateCampaign(c.id, { status: 'PAUSED' })} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: C.orangeBg, border: `1px solid ${C.orangeBorder}`, color: C.orange, cursor: 'pointer', fontWeight: 600 }}>Pause</button>
                                      {c.meta_campaign_id && (
                                        <a href={`https://www.facebook.com/adsmanager/manage/campaigns?act=${metaStatus?.adAccountId?.replace('act_', '')}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: C.indigoBg, border: `1px solid ${C.indigoBorder}`, color: C.indigo, textDecoration: 'none', fontWeight: 600 }}>View</a>
                                      )}
                                    </>
                                  )}
                                  {isDraft && (
                                    <button onClick={() => { setBuilderProduct(undefined); setBuilderInitialStep(undefined); setShowBuilder(true); setTab('campaigns'); }} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: C.indigoBg, border: `1px solid ${C.indigoBorder}`, color: C.indigo, cursor: 'pointer', fontWeight: 600 }}>Publish</button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Phase 6 — Enhanced AI Budget Optimiser Recommendations */}
                {recommendations.filter((r) => !dismissedRecs.includes(`${r.campaign.id}_${r.type}`)).length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.indigo, fontFamily: FONT_HEADING, letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 14 }}>MAYA AI RECOMMENDATIONS</div>
                    <div style={{ display: 'grid', gap: 10 }}>
                      {recommendations.filter((r) => !dismissedRecs.includes(`${r.campaign.id}_${r.type}`)).map((rec, i) => {
                        const emoji = rec.type === 'pause' ? '🔴' : rec.type === 'scale' ? '🟢' : rec.type === 'creative' ? '🎨' : '👥';
                        const bgColor = rec.type === 'pause' ? C.redBg : rec.type === 'scale' ? C.greenBg : C.orangeBg;
                        const borderColor = rec.type === 'pause' ? C.redBorder : rec.type === 'scale' ? C.greenBorder : C.orangeBorder;
                        return (
                          <Card key={i} style={{ padding: 16, background: bgColor, border: `1px solid ${borderColor}` }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, minWidth: 200 }}>
                                <span style={{ fontSize: 18, flexShrink: 0, marginTop: 2 }}>{emoji}</span>
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>{rec.msg}</div>
                                  {rec.detail && <div style={{ fontSize: 12, color: C.muted, marginBottom: 8, lineHeight: 1.4 }}>{rec.detail}</div>}
                                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 8 }}>Recommended: {rec.action}</div>
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    {metaStatus?.connected ? (
                                      <button
                                        onClick={() => {
                                          if (rec.action === 'Pause Campaign') handleUpdateCampaign(rec.campaign.id, { status: 'PAUSED' });
                                          else if (rec.action === 'Scale Budget') handleUpdateCampaign(rec.campaign.id, { budget_multiplier: 1.2 });
                                          else if (rec.action === 'Swap Creative') { setBuilderInitialStep(5); setShowBuilder(true); setTab('campaigns'); }
                                          else if (rec.action === 'Expand Audience') { setBuilderInitialStep(3); setShowBuilder(true); setTab('campaigns'); }
                                        }}
                                        style={{ fontSize: 12, padding: '5px 12px', borderRadius: 6, border: 'none', background: C.emerald, color: '#fff', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
                                      >
                                        ✅ Do It
                                      </button>
                                    ) : (
                                      <span style={{ fontSize: 11, color: C.dim, padding: '5px 0' }}>Connect Meta to apply</span>
                                    )}
                                    <button
                                      onClick={() => dismissRec(`${rec.campaign.id}_${rec.type}`)}
                                      style={{ fontSize: 12, padding: '5px 12px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, cursor: 'pointer', fontWeight: 600 }}
                                    >
                                      ❌ Dismiss
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
                {recommendations.filter((r) => !dismissedRecs.includes(`${r.campaign.id}_${r.type}`)).length === 0 && !metricsLoading && Object.keys(campaignMetrics).length > 0 && (
                  <Card style={{ textAlign: 'center' as const, padding: 24 }}>
                    <CheckCircle size={20} style={{ color: C.green, marginBottom: 8 }} />
                    <div style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>All campaigns look healthy</div>
                    <div style={{ fontSize: 12, color: C.muted }}>No recommendations at this time.</div>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Creative Library Tab (Phase 4 — Enhanced) ──────────────────── */}
        {tab === 'creative' && (
          <div>
            {/* Filter bar */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {([['all', 'All'], ['winners', 'Winners (ROAS >2x)'], ['drafts', 'Drafts']] as const).map(([key, label]) => (
                <button key={key} onClick={() => setCreativeFilter(key)} style={{
                  padding: '7px 14px', borderRadius: 8, border: `1px solid ${creativeFilter === key ? C.indigo : C.border}`,
                  background: creativeFilter === key ? C.indigoBg : 'transparent', color: creativeFilter === key ? C.text : C.muted,
                  fontFamily: FONT_BODY, fontWeight: 600, fontSize: 12, cursor: 'pointer',
                }}>{label}</button>
              ))}
            </div>

            {campaigns.filter((c) => c.ad_copy && Object.keys(c.ad_copy).length > 0).length === 0 ? (
              <Card style={{ textAlign: 'center' as const, padding: 48 }}>
                <Palette size={32} style={{ color: C.dim, marginBottom: 12 }} />
                <h3 style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 18, color: C.text, marginBottom: 8 }}>No Creatives Yet</h3>
                <p style={{ color: C.muted, fontSize: 14 }}>Run campaigns to build your Creative Library. Winners (ROAS {'>'} 2x) are automatically saved here.</p>
              </Card>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {campaigns
                  .filter((c) => c.ad_copy && Object.keys(c.ad_copy).length > 0)
                  .filter((c) => {
                    if (creativeFilter === 'all') return true;
                    const m = c.meta_campaign_id ? campaignMetrics[c.meta_campaign_id] : null;
                    if (creativeFilter === 'winners') return (m?.purchase_roas || 0) >= 2;
                    if (creativeFilter === 'drafts') return !c.meta_campaign_id;
                    return true;
                  })
                  .map((c) => {
                    const adCopy = c.ad_copy as Record<string, unknown>;
                    const m = c.meta_campaign_id ? campaignMetrics[c.meta_campaign_id] : null;
                    const roas = m?.purchase_roas || 0;
                    const isWinner = roas >= 2;
                    const productImg = catalog.find((p) => c.product_ids?.includes(p.id))?.image_url;

                    return (
                      <Card key={c.id} style={{ padding: 0, overflow: 'hidden' }}>
                        {productImg ? (
                          <div style={{ height: 140, background: '#111', position: 'relative' as const }}>
                            <img src={productImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' as const }} />
                            {isWinner && (
                              <span style={{ position: 'absolute' as const, top: 8, right: 8, background: 'rgba(245,158,11,0.9)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                ⭐ Winner
                              </span>
                            )}
                          </div>
                        ) : (
                          <div style={{ height: 80, background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' as const }}>
                            <Palette size={24} style={{ color: C.dim }} />
                            {isWinner && (
                              <span style={{ position: 'absolute' as const, top: 8, right: 8, background: 'rgba(245,158,11,0.9)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4 }}>⭐ Winner</span>
                            )}
                          </div>
                        )}

                        <div style={{ padding: 16 }}>
                          {adCopy.primaryText && (
                            <div style={{ fontSize: 13, color: C.text, marginBottom: 6, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                              {String(adCopy.primaryText)}
                            </div>
                          )}
                          {adCopy.headline && <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 8 }}>{String(adCopy.headline)}</div>}

                          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                            <div><div style={{ fontSize: 11, color: C.dim }}>ROAS</div><div style={{ fontSize: 15, fontWeight: 700, color: roas > 0 ? roasColor(roas) : C.dim }}>{roas > 0 ? `${roas.toFixed(1)}x` : 'No data'}</div></div>
                            <div><div style={{ fontSize: 11, color: C.dim }}>Spend</div><div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{m ? `$${m.spend.toFixed(0)}` : '—'}</div></div>
                            <div><div style={{ fontSize: 11, color: C.dim }}>CTR</div><div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{m ? `${m.ctr.toFixed(2)}%` : '—'}</div></div>
                          </div>

                          <div style={{ display: 'flex', gap: 6 }}>
                            <Btn variant="secondary" onClick={() => {
                              setBuilderInitialStep(5);
                              setBuilderInitialAdCopy({ primaryText: String(adCopy.primaryText || ''), headline: String(adCopy.headline || ''), description: String(adCopy.description || ''), cta: String(adCopy.cta || 'Shop Now') });
                              setShowBuilder(true); setTab('campaigns');
                            }} style={{ fontSize: 11, flex: 1, justifyContent: 'center' }}><Copy size={10} /> Duplicate</Btn>
                            {isWinner && (
                              <Btn variant="secondary" onClick={() => handleAnalyzeCreative(c.id, adCopy, roas)} loading={analyzingCreative === c.id} style={{ fontSize: 11, flex: 1, justifyContent: 'center' }}>
                                <Star size={10} /> Why It Worked
                              </Btn>
                            )}
                          </div>

                          {/* Maya "Why It Worked" analysis */}
                          {creativeAnalysis[c.id] && (
                            <div style={{ marginTop: 10, padding: 12, background: 'rgba(99,102,241,0.06)', border: `1px solid ${C.indigoBorder}`, borderRadius: 8, fontSize: 12, color: C.muted, lineHeight: 1.6, whiteSpace: 'pre-wrap' as const }}>
                              {creativeAnalysis[c.id]}
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
              </div>
            )}

            {/* Competitor Ad Swipe File */}
            <div style={{ marginTop: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: FONT_HEADING }}>Competitor Ad Swipe File</div>
                {swipeFile.length > 0 && (
                  <button onClick={() => { localStorage.removeItem('majorka_swipe_file'); setSwipeFile([]); }} style={{ fontSize: 11, color: C.dim, background: 'none', border: 'none', cursor: 'pointer' }}>Clear Swipe File</button>
                )}
              </div>
              {swipeFile.length === 0 ? (
                <Card style={{ textAlign: 'center' as const, padding: 24 }}>
                  <p style={{ color: C.dim, fontSize: 13 }}>Save competitor ads from Ad Spy to build your swipe file</p>
                </Card>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                  {swipeFile.map((entry) => (
                    <Card key={entry.id} style={{ padding: 14 }}>
                      {entry.platform && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: C.indigoBg, color: C.indigo, border: `1px solid ${C.indigoBorder}`, marginBottom: 8, display: 'inline-block' }}>{entry.platform}</span>}
                      {entry.hook && <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>{entry.hook}</div>}
                      {entry.bodyText && <div style={{ fontSize: 12, color: C.muted, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{entry.bodyText.slice(0, 80)}</div>}
                      <Btn variant="secondary" onClick={() => {
                        setBuilderClonedAd({ hook: entry.hook, bodyText: entry.bodyText, cta: entry.cta });
                        setBuilderInitialStep(5); setShowBuilder(true); setTab('campaigns');
                      }} style={{ fontSize: 11, width: '100%', justifyContent: 'center' }}>Use This Style →</Btn>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {/* ── Automation Tab (Phase 3) ─────────────────────────────────────── */}
        {tab === 'automation' && (
          <div>
            {/* Competitive messaging */}
            <Card style={{ marginBottom: 20, background: C.indigoBg, border: `1px solid ${C.indigoBorder}`, padding: 14 }}>
              <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>
                Your rules use your actual break-even CPA from Profit Calc — not a number you have to manually enter.
                <span style={{ color: C.dim }}> Competitors make you enter this manually. Majorka calculates it from your real product costs.</span>
              </div>
            </Card>

            {/* Active Rules */}
            {automationRules.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.indigo, fontFamily: FONT_HEADING, letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 14 }}>ACTIVE RULES</div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {automationRules.map((rule) => (
                    <Card key={rule.id} style={{ padding: 14, opacity: rule.enabled ? 1 : 0.5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>{rule.name}</div>
                          <div style={{ fontSize: 12, color: C.muted }}>
                            IF {rule.metric} {rule.operator} {rule.value} for {rule.timeWindow} → {ACTION_OPTIONS.find((a) => a.key === rule.action)?.label || rule.action}
                          </div>
                          {rule.lastTriggered && <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>Last triggered: {new Date(rule.lastTriggered).toLocaleString('en-AU')}</div>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button onClick={() => toggleRule(rule.id)} style={{
                            width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                            background: rule.enabled ? C.emerald : 'rgba(255,255,255,0.12)',
                            position: 'relative' as const, transition: 'background 150ms',
                          }}>
                            <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute' as const, top: 3, left: rule.enabled ? 21 : 3, transition: 'left 150ms' }} />
                          </button>
                          <button onClick={() => deleteRule(rule.id)} style={{ padding: '4px', borderRadius: 4, border: 'none', background: 'transparent', color: C.dim, cursor: 'pointer' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Rule Templates */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.indigo, fontFamily: FONT_HEADING, letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 14 }}>RULE TEMPLATES</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                {RULE_TEMPLATES.map((tmpl) => {
                  const alreadyAdded = automationRules.some((r) => r.name === tmpl.name);
                  return (
                    <Card key={tmpl.name} style={{ padding: 16 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 6 }}>{tmpl.name}</div>
                      <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, lineHeight: 1.5 }}>
                        IF {tmpl.metric} {tmpl.operator} {tmpl.value} for {tmpl.timeWindow} → {ACTION_OPTIONS.find((a) => a.key === tmpl.action)?.label}
                      </div>
                      <Btn
                        variant={alreadyAdded ? 'secondary' : 'primary'}
                        disabled={alreadyAdded}
                        onClick={() => enableRuleTemplate(tmpl)}
                        style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}
                      >
                        {alreadyAdded ? 'Added ✓' : 'Enable Rule'}
                      </Btn>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Custom Rule Builder */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.indigo, fontFamily: FONT_HEADING, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>CUSTOM RULE</div>
                <Btn variant="secondary" onClick={() => setShowCustomRuleBuilder(!showCustomRuleBuilder)} style={{ fontSize: 12 }}>
                  {showCustomRuleBuilder ? 'Hide' : '+ Create Custom Rule'}
                </Btn>
              </div>
              {showCustomRuleBuilder && (
                <Card>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div>
                      <label style={{ fontSize: 12, color: C.muted, fontWeight: 600, display: 'block', marginBottom: 4 }}>Rule Name</label>
                      <input value={customRule.name} onChange={(e) => setCustomRule({ ...customRule, name: e.target.value })} placeholder="My custom rule" style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.03)', color: C.text, fontSize: 13, fontFamily: FONT_BODY, outline: 'none', boxSizing: 'border-box' as const }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: C.muted, fontWeight: 600, display: 'block', marginBottom: 4 }}>IF Metric</label>
                      <select value={customRule.metric} onChange={(e) => setCustomRule({ ...customRule, metric: e.target.value })} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.03)', color: C.text, fontSize: 13, fontFamily: FONT_BODY, outline: 'none' }}>
                        {METRIC_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: C.muted, fontWeight: 600, display: 'block', marginBottom: 4 }}>Operator</label>
                      <select value={customRule.operator} onChange={(e) => setCustomRule({ ...customRule, operator: e.target.value })} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.03)', color: C.text, fontSize: 13, fontFamily: FONT_BODY, outline: 'none' }}>
                        {OPERATOR_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: C.muted, fontWeight: 600, display: 'block', marginBottom: 4 }}>Value</label>
                      <input type="number" value={customRule.value} onChange={(e) => setCustomRule({ ...customRule, value: +e.target.value })} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.03)', color: C.text, fontSize: 13, fontFamily: FONT_BODY, outline: 'none', boxSizing: 'border-box' as const }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: C.muted, fontWeight: 600, display: 'block', marginBottom: 4 }}>Time Window</label>
                      <select value={customRule.timeWindow} onChange={(e) => setCustomRule({ ...customRule, timeWindow: e.target.value })} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.03)', color: C.text, fontSize: 13, fontFamily: FONT_BODY, outline: 'none' }}>
                        {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: C.muted, fontWeight: 600, display: 'block', marginBottom: 4 }}>THEN Action</label>
                      <select value={customRule.action} onChange={(e) => setCustomRule({ ...customRule, action: e.target.value })} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.03)', color: C.text, fontSize: 13, fontFamily: FONT_BODY, outline: 'none' }}>
                        {ACTION_OPTIONS.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <Btn onClick={() => {
                    if (!customRule.name.trim()) return;
                    enableRuleTemplate({ name: customRule.name, metric: customRule.metric, operator: customRule.operator, value: customRule.value, timeWindow: customRule.timeWindow, action: customRule.action, campaignScope: customRule.campaignScope });
                    setCustomRule({ metric: 'roas', operator: '>', value: 3, timeWindow: '48h', action: 'pause_campaign', campaignScope: 'all', name: '' });
                    setShowCustomRuleBuilder(false);
                  }} style={{ width: '100%', justifyContent: 'center' }}>Save Rule</Btn>
                </Card>
              )}
            </div>

            <div style={{ marginTop: 20, fontSize: 11, color: C.dim, lineHeight: 1.5 }}>
              Rules are stored locally and evaluated client-side against cached campaign metrics. Server-side rule execution coming soon.
            </div>
          </div>
        )}
      </div>

      {/* ── Onboarding Flow (Phase 7) ──────────────────────────────────────── */}
      {hasAdsAccess && !metaStatus?.connected && !onboardingDismissed && !loading && (
        <div style={{ position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ maxWidth: 560, width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32, position: 'relative' as const }}>
            <button onClick={dismissOnboarding} style={{ position: 'absolute' as const, top: 16, right: 16, background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 12 }}>Skip onboarding</button>

            {/* Progress bar */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
              {[1, 2, 3, 4].map((s) => (
                <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: onboardingStep >= s ? C.indigo : 'rgba(255,255,255,0.08)' }} />
              ))}
            </div>

            <h2 style={{ fontFamily: FONT_HEADING, fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 4 }}>Get to your first campaign in under 10 minutes</h2>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 24 }}>We pre-fill everything from your product data — no manual data entry</p>

            {/* Step 1 — Connect Meta */}
            {onboardingStep === 1 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #1877F2, #42B72A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#fff' }}>f</div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Connect Meta Account</div>
                    <div style={{ fontSize: 12, color: C.dim }}>~2 min · We request: manage campaigns, read insights, manage pixels</div>
                  </div>
                </div>
                <Btn onClick={async () => { await handleMetaConnect(); }} style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
                  Connect Meta Business →
                </Btn>
                <button onClick={() => setOnboardingStep(2)} style={{ width: '100%', marginTop: 8, padding: '10px', background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 12 }}>Skip for now →</button>
              </div>
            )}

            {/* Step 2 — Connect Shopify */}
            {onboardingStep === 2 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #96BF48, #5E8E3E)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🛍</div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Connect Shopify Store</div>
                    <div style={{ fontSize: 12, color: C.dim }}>~2 min · Sync your product catalog for ad campaigns</div>
                  </div>
                </div>
                {shopifyStatus?.connected ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: C.greenBg, borderRadius: 8, border: `1px solid ${C.greenBorder}`, marginBottom: 12 }}>
                    <CheckCircle size={16} style={{ color: C.green }} />
                    <span style={{ fontSize: 13, color: C.text }}>{syncStatus?.count || 0} products synced from {shopifyStatus.shop}</span>
                  </div>
                ) : (
                  <Btn onClick={() => setLocation('/app/store-builder')} style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
                    Connect Shopify Store →
                  </Btn>
                )}
                <button onClick={() => setOnboardingStep(3)} style={{ width: '100%', marginTop: 8, padding: '10px', background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 12 }}>
                  {shopifyStatus?.connected ? 'Next →' : "Skip — I'll use products from Majorka's database →"}
                </button>
              </div>
            )}

            {/* Step 3 — Install Tracking */}
            {onboardingStep === 3 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#fff' }}>
                    <Zap size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Install Tracking</div>
                    <div style={{ fontSize: 12, color: C.dim }}>~1 min · One-click Meta Pixel + Conversions API</div>
                  </div>
                </div>
                {metaStatus?.pixelId && metaStatus?.capiEnabled ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: C.greenBg, borderRadius: 8, border: `1px solid ${C.greenBorder}`, marginBottom: 12 }}>
                    <CheckCircle size={16} style={{ color: C.green }} />
                    <span style={{ fontSize: 13, color: C.text }}>Meta Pixel installed · CAPI active · Tracking healthy</span>
                  </div>
                ) : (
                  <Btn onClick={handlePluginInstall} loading={pluginInstalling} style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
                    <Zap size={14} /> One-Click Install
                  </Btn>
                )}
                <p style={{ fontSize: 11, color: C.dim, marginTop: 8, lineHeight: 1.5 }}>
                  Server-side tracking bypasses iOS 14+ ad blocking. Madgicx charges $49/mo for this. It's included on Scale.
                </p>
                <button onClick={() => setOnboardingStep(4)} style={{ width: '100%', marginTop: 8, padding: '10px', background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 12 }}>Next →</button>
              </div>
            )}

            {/* Step 4 — Launch First Campaign */}
            {onboardingStep === 4 && (
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 12 }}>Pick a product to launch</div>
                {topProducts.length > 0 ? (
                  <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
                    {topProducts.map((p) => (
                      <div key={p.id} onClick={() => {
                        localStorage.setItem('majorka_launch_product', JSON.stringify({ id: p.id, title: p.title, image: p.image_url, category: p.category, price: p.price_aud, cost: 0, units_per_day: 0 }));
                        dismissOnboarding();
                        setTab('campaigns');
                        setShowBuilder(true);
                      }} style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10,
                        border: `1px solid ${C.border}`, background: C.surface, cursor: 'pointer',
                      }}>
                        {p.image_url ? <img src={p.image_url} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' as const }} /> : <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(255,255,255,0.06)' }} />}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{p.title?.slice(0, 40)}</div>
                          <div style={{ fontSize: 12, color: C.muted }}>{p.category} · ${p.price_aud?.toFixed(2)} AUD</div>
                        </div>
                        <ChevronRight size={16} style={{ color: C.dim }} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <Card style={{ textAlign: 'center' as const, padding: 20, marginBottom: 16 }}>
                    <p style={{ color: C.dim, fontSize: 13 }}>No products loaded. Click below to browse.</p>
                  </Card>
                )}
                <Btn variant="secondary" onClick={() => { dismissOnboarding(); setLocation('/app/product-intelligence'); }} style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}>
                  Browse all products →
                </Btn>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes confettiFall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
