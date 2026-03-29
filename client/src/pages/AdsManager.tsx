import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
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
}

interface SwipeFileEntry {
  id: string;
  hook?: string;
  bodyText?: string;
  cta?: string;
  platform?: string;
  savedAt: string;
}

type Tab = 'overview' | 'campaigns' | 'products' | 'pixel' | 'performance' | 'creative';

const TABS: { key: Tab; label: string; icon: typeof Megaphone }[] = [
  { key: 'overview', label: 'Overview', icon: Activity },
  { key: 'campaigns', label: 'Campaigns', icon: Megaphone },
  { key: 'products', label: 'Products', icon: Package },
  { key: 'pixel', label: 'Pixel & CAPI', icon: Zap },
  { key: 'performance', label: 'Performance', icon: BarChart3 },
  { key: 'creative', label: 'Creative Library', icon: Palette },
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
        <h3 style={{ fontFamily: FONT_HEADING, fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>
          New Campaign — Step {step}/{totalSteps}
        </h3>
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

  // Build recommendations (Phase 6)
  const recommendations: Recommendation[] = campaigns.flatMap((c) => {
    const recs: Recommendation[] = [];
    const metrics = c.meta_campaign_id ? campaignMetrics[c.meta_campaign_id] : null;
    if (!metrics) return recs;
    const breakEvenRoas = ROAS_BENCHMARKS.Default;
    if (metrics.purchase_roas > 0 && metrics.purchase_roas < breakEvenRoas) {
      recs.push({ type: 'pause', campaign: c, msg: `ROAS ${metrics.purchase_roas.toFixed(1)}x is below break-even (${breakEvenRoas}x)`, action: 'Pause Campaign' });
    }
    if (metrics.purchase_roas > 3) {
      recs.push({ type: 'scale', campaign: c, msg: `ROAS ${metrics.purchase_roas.toFixed(1)}x is strong. Scale budget +20%?`, action: 'Scale Budget' });
    }
    if (metrics.ctr > 0 && metrics.ctr < 0.8) {
      recs.push({ type: 'creative', campaign: c, msg: `CTR ${metrics.ctr.toFixed(2)}% is below 0.8%. Try a new creative.`, action: 'Swap Creative' });
    }
    if (metrics.frequency > 3) {
      recs.push({ type: 'fatigue', campaign: c, msg: `Frequency ${metrics.frequency.toFixed(1)}x — audience fatigued. Expand targeting.`, action: 'Expand Audience' });
    }
    return recs;
  });

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
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', maxWidth: 380, lineHeight: 1.6 }}>
                Connect your Meta account and launch campaigns directly from Majorka. Scale plan only.
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
                    <p style={{ color: C.dim, fontSize: 13, marginBottom: 12 }}>Meta integration coming soon. Contact support for early access.</p>
                    <Btn disabled style={{ opacity: 0.5 }}>Coming Soon</Btn>
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
          </div>
        )}

        {/* ── Performance Tab (Phase 5 + 6) ────────────────────────────────── */}
        {tab === 'performance' && (
          <div>
            {campaigns.length === 0 ? (
              <Card style={{ textAlign: 'center' as const, padding: 48 }}>
                <BarChart3 size={32} style={{ color: C.dim, marginBottom: 12 }} />
                <h3 style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 18, color: C.text, marginBottom: 8 }}>No Campaigns Yet</h3>
                <p style={{ color: C.muted, fontSize: 14 }}>Create campaigns to see performance data here.</p>
              </Card>
            ) : (
              <div>
                {/* Summary Stats */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' as const }}>
                  <StatCard label="Total Spend" value={`$${totalSpend.toFixed(2)}`} color={roasColor(blendedRoas)} />
                  <StatCard label="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} />
                  <StatCard label="Blended ROAS" value={blendedRoas > 0 ? `${blendedRoas.toFixed(1)}x` : '—'} color={roasColor(blendedRoas)} />
                  <StatCard label="Net Profit" value={`$${Math.max(0, totalRevenue - totalSpend).toFixed(2)}`} sub="Revenue - Ad Spend" color={totalRevenue - totalSpend > 0 ? C.emerald : C.red} />
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
                          {['Campaign', 'Status', 'Spend', 'ROAS', 'Purchases', 'CPC', 'CTR', 'Freq.', 'Actions'].map((h) => (
                            <th key={h} style={{ textAlign: 'left' as const, padding: '10px 8px', fontSize: 11, fontWeight: 700, color: C.dim, borderBottom: `1px solid ${C.border}`, textTransform: 'uppercase' as const, letterSpacing: '0.05em', whiteSpace: 'nowrap' as const }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {campaigns.map((c) => {
                          const m = c.meta_campaign_id ? campaignMetrics[c.meta_campaign_id] : null;
                          const isDraft = !c.meta_campaign_id;
                          return (
                            <tr key={c.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                              <td style={{ padding: '10px 8px', fontSize: 13, fontWeight: 600, color: C.text, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{c.name}</td>
                              <td style={{ padding: '10px 8px' }}><StatusBadge ok={!isDraft} label={isDraft ? 'Draft' : c.status} /></td>
                              <td style={{ padding: '10px 8px', fontSize: 13, color: C.muted }}>{m ? `$${m.spend.toFixed(2)}` : '—'}</td>
                              <td style={{ padding: '10px 8px' }}>
                                {m && m.purchase_roas > 0 ? (
                                  <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: roasBg(m.purchase_roas), color: roasColor(m.purchase_roas) }}>
                                    {m.purchase_roas.toFixed(1)}x
                                  </span>
                                ) : <span style={{ color: C.dim }}>—</span>}
                              </td>
                              <td style={{ padding: '10px 8px', fontSize: 13, color: C.muted }}>{m ? m.purchases : '—'}</td>
                              <td style={{ padding: '10px 8px', fontSize: 13, color: C.muted }}>{m ? `$${m.cpc.toFixed(2)}` : '—'}</td>
                              <td style={{ padding: '10px 8px', fontSize: 13, color: C.muted }}>{m ? `${m.ctr.toFixed(2)}%` : '—'}</td>
                              <td style={{ padding: '10px 8px', fontSize: 13, color: C.muted }}>{m ? m.frequency.toFixed(1) : '—'}</td>
                              <td style={{ padding: '10px 8px' }}>
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

                {/* Phase 6 — AI Budget Optimiser Recommendations */}
                {recommendations.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.indigo, fontFamily: FONT_HEADING, letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 14 }}>AI RECOMMENDATIONS</div>
                    <div style={{ display: 'grid', gap: 10 }}>
                      {recommendations.map((rec, i) => (
                        <Card key={i} style={{
                          padding: 16,
                          background: rec.type === 'pause' ? C.redBg : C.orangeBg,
                          border: `1px solid ${rec.type === 'pause' ? C.redBorder : C.orangeBorder}`,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between', flexWrap: 'wrap' as const }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200 }}>
                              <span style={{ fontSize: 16 }}>{rec.type === 'pause' ? '🔴' : '⚠️'}</span>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>{rec.campaign.name}</div>
                                <div style={{ fontSize: 12, color: C.muted }}>{rec.msg}</div>
                              </div>
                            </div>
                            {metaStatus?.connected ? (
                              <Btn
                                variant={rec.type === 'pause' ? 'danger' : 'secondary'}
                                onClick={() => {
                                  if (rec.action === 'Pause Campaign') handleUpdateCampaign(rec.campaign.id, { status: 'PAUSED' });
                                  else if (rec.action === 'Scale Budget') handleUpdateCampaign(rec.campaign.id, { budget_multiplier: 1.2 });
                                  else if (rec.action === 'Swap Creative') { setBuilderInitialStep(5); setShowBuilder(true); setTab('campaigns'); }
                                  else if (rec.action === 'Expand Audience') { setBuilderInitialStep(3); setShowBuilder(true); setTab('campaigns'); }
                                }}
                                style={{ fontSize: 12, whiteSpace: 'nowrap' as const }}
                              >
                                {rec.action}
                              </Btn>
                            ) : (
                              <span style={{ fontSize: 11, color: C.dim }}>Connect Meta to apply with one click</span>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                {recommendations.length === 0 && !metricsLoading && Object.keys(campaignMetrics).length > 0 && (
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

        {/* ── Creative Library Tab (Phase 7) ───────────────────────────────── */}
        {tab === 'creative' && (
          <div>
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
                  .map((c) => {
                    const adCopy = c.ad_copy as Record<string, unknown>;
                    const m = c.meta_campaign_id ? campaignMetrics[c.meta_campaign_id] : null;
                    const roas = m?.purchase_roas || 0;
                    const isWinner = roas >= 2;
                    const productImg = catalog.find((p) => c.product_ids?.includes(p.id))?.image_url;

                    return (
                      <Card key={c.id} style={{ padding: 0, overflow: 'hidden' }}>
                        {/* Product image */}
                        {productImg ? (
                          <div style={{ height: 140, background: '#111', position: 'relative' as const }}>
                            <img src={productImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' as const }} />
                            {isWinner && (
                              <span style={{ position: 'absolute' as const, top: 8, right: 8, background: 'rgba(34,197,94,0.9)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Star size={10} /> Winner
                              </span>
                            )}
                          </div>
                        ) : (
                          <div style={{ height: 80, background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' as const }}>
                            <Palette size={24} style={{ color: C.dim }} />
                            {isWinner && (
                              <span style={{ position: 'absolute' as const, top: 8, right: 8, background: 'rgba(34,197,94,0.9)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4 }}>⭐ Winner</span>
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
                            <div>
                              <div style={{ fontSize: 11, color: C.dim }}>ROAS</div>
                              <div style={{ fontSize: 15, fontWeight: 700, color: roas > 0 ? roasColor(roas) : C.dim }}>{roas > 0 ? `${roas.toFixed(1)}x` : 'No data'}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 11, color: C.dim }}>Spend</div>
                              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{m ? `$${m.spend.toFixed(0)}` : '—'}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 11, color: C.dim }}>Purchases</div>
                              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{m ? m.purchases : '—'}</div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: 6 }}>
                            <Btn variant="secondary" onClick={() => {
                              setBuilderInitialStep(5);
                              setBuilderInitialAdCopy({
                                primaryText: String(adCopy.primaryText || ''),
                                headline: String(adCopy.headline || ''),
                                description: String(adCopy.description || ''),
                                cta: String(adCopy.cta || 'Shop Now'),
                              });
                              setShowBuilder(true);
                              setTab('campaigns');
                            }} style={{ fontSize: 11, flex: 1, justifyContent: 'center' }}>
                              <Copy size={10} /> Duplicate
                            </Btn>
                            {isWinner && (
                              <Btn variant="secondary" onClick={() => handleAnalyzeCreative(c.id, adCopy, roas)} loading={analyzingCreative === c.id} style={{ fontSize: 11, flex: 1, justifyContent: 'center' }}>
                                <Star size={10} /> Why It Worked
                              </Btn>
                            )}
                          </div>

                          {/* Analysis expand */}
                          {creativeAnalysis[c.id] && (
                            <div style={{ marginTop: 10, padding: 10, background: 'rgba(99,102,241,0.06)', border: `1px solid ${C.indigoBorder}`, borderRadius: 8, fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
                              {creativeAnalysis[c.id]}
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </div>

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
