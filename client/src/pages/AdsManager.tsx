import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UpgradeModal from '@/components/UpgradeModal';
import {
  Megaphone, Link2, ShoppingBag, Activity, ChevronRight,
  Loader2, CheckCircle, XCircle, AlertTriangle, Plus, Target,
  Eye, Users, Zap, Package, RefreshCw, ExternalLink, Trash2,
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
  created_at: string;
}

type Tab = 'overview' | 'campaigns' | 'products' | 'pixel';

const TABS: { key: Tab; label: string; icon: typeof Megaphone }[] = [
  { key: 'overview', label: 'Overview', icon: Activity },
  { key: 'campaigns', label: 'Campaigns', icon: Megaphone },
  { key: 'products', label: 'Products', icon: Package },
  { key: 'pixel', label: 'Pixel & CAPI', icon: Zap },
];

const OBJECTIVES = [
  { key: 'OUTCOME_SALES', label: 'Sales', desc: 'Uses Meta Advantage+ Shopping — best ROAS for ecommerce', icon: ShoppingBag, recommended: true },
  { key: 'OUTCOME_TRAFFIC', label: 'Traffic', desc: 'Drive visitors to your store', icon: Eye, recommended: false },
  { key: 'OUTCOME_AWARENESS', label: 'Awareness', desc: 'Reach new audiences at scale', icon: Users, recommended: false },
  { key: 'OUTCOME_ENGAGEMENT', label: 'Engagement', desc: 'Boost likes, comments, shares', icon: Activity, recommended: false },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function getHeaders(session: { access_token?: string } | null) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token || ''}`,
  };
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

// ── Campaign Builder ─────────────────────────────────────────────────────────
function CampaignBuilder({
  session,
  catalog,
  onCreated,
  onCancel,
  preSelectedProduct,
}: {
  session: { access_token?: string } | null;
  catalog: CatalogProduct[];
  onCreated: () => void;
  onCancel: () => void;
  preSelectedProduct?: CatalogProduct;
}) {
  const [step, setStep] = useState(1);
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

  const handlePublish = async () => {
    setSaving(true);
    try {
      await fetch('/api/meta/campaigns', {
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
      onCreated();
    } catch {
      // handled silently
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h3 style={{ fontFamily: FONT_HEADING, fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>
          New Campaign — Step {step}/4
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
                  padding: 16,
                  borderRadius: 10,
                  border: `1px solid ${objective === obj.key ? C.indigo : C.border}`,
                  background: objective === obj.key ? C.indigoBg : C.surface,
                  cursor: 'pointer',
                  transition: 'border 150ms',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <obj.icon size={18} style={{ color: objective === obj.key ? C.indigo : C.muted }} />
                  <span style={{ fontWeight: 600, color: C.text, fontSize: 14 }}>{obj.label}</span>
                  {obj.recommended && (
                    <span style={{ fontSize: 10, background: C.indigo, color: '#fff', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                      RECOMMENDED
                    </span>
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
          <p style={{ color: C.muted, fontSize: 14, marginBottom: 16 }}>
            Select 1–5 products ({selectedProducts.length} selected)
          </p>
          {catalog.length === 0 ? (
            <Card>
              <p style={{ color: C.dim, textAlign: 'center' as const }}>
                No synced products. Connect Shopify and sync your catalog first.
              </p>
            </Card>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {catalog.map((p) => (
                <div
                  key={p.id}
                  onClick={() => toggleProduct(p.id)}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    border: `1px solid ${selectedProducts.includes(p.id) ? C.indigo : C.border}`,
                    background: selectedProducts.includes(p.id) ? C.indigoBg : C.surface,
                    cursor: 'pointer',
                    display: 'flex',
                    gap: 10,
                    alignItems: 'center',
                  }}
                >
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
              <div
                key={mode}
                onClick={() => setAudienceMode(mode)}
                style={{
                  flex: 1,
                  padding: 16,
                  borderRadius: 10,
                  border: `1px solid ${audienceMode === mode ? C.indigo : C.border}`,
                  background: audienceMode === mode ? C.indigoBg : C.surface,
                  cursor: 'pointer',
                }}
              >
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
                  <option value="All">All</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
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

      {/* Step 4 — Budget & Publish */}
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

          {/* Estimated results */}
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
            <Btn onClick={handlePublish} loading={saving} disabled={!campaignName}>
              Publish Campaign <Megaphone size={14} />
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function AdsManager() {
  const { session, isPro, isBuilder, isScale, subPlan, subStatus, user } = useAuth();
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

  const isAdmin = user?.email === 'maximusmajorka@gmail.com';
  const isPaid = isAdmin || (isPro && (subPlan === 'builder' || subPlan === 'scale') && subStatus === 'active');

  const headers = getHeaders(session);

  // Check if user should be gated
  if (!isPaid && !loading) {
    return <UpgradeModal isOpen={true} onClose={() => window.history.back()} feature="Ads Manager" />;
  }

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

  // Check URL params for callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('meta_connected') === 'true') {
      fetchAll();
      window.history.replaceState({}, '', '/app/ads-manager');
    }
  }, [fetchAll]);

  const handleMetaConnect = async () => {
    const res = await fetch('/api/meta/connect', { method: 'POST', headers });
    const data = await res.json();
    if (data.error) {
      alert(data.message || 'Meta not configured');
      return;
    }
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
    } catch {
      // handled
    } finally {
      setSyncing(false);
    }
  };

  const handleInstallPixel = async () => {
    setInstallingPixel(true);
    try {
      await fetch('/api/meta/install-pixel', { method: 'POST', headers });
    } catch {
      // handled
    } finally {
      setInstallingPixel(false);
    }
  };

  const handleEnableCapi = async () => {
    setEnablingCapi(true);
    try {
      await fetch('/api/meta/setup-capi', { method: 'POST', headers });
      fetchAll();
    } catch {
      // handled
    } finally {
      setEnablingCapi(false);
    }
  };

  // ── Next Steps checklist ──────────────────────────────────────────────────
  const nextSteps = [
    { label: 'Connect Meta Business Account', done: !!metaStatus?.connected },
    { label: 'Connect Shopify Store', done: !!shopifyStatus?.connected },
    { label: 'Install Meta Pixel', done: !!metaStatus?.pixelId },
    { label: 'Enable Conversions API', done: !!metaStatus?.capiEnabled },
    { label: 'Create your first campaign', done: campaigns.length > 0 },
  ];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={24} style={{ color: C.indigo, animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: FONT_BODY }}>
      {showUpgrade && <UpgradeModal isOpen onClose={() => setShowUpgrade(false)} feature="Ads Manager" />}

      {/* Header */}
      <div style={{ padding: '28px 32px 0', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: FONT_HEADING, fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              Ads Manager
            </h1>
            <p style={{ color: C.muted, fontSize: 14, marginTop: 4 }}>
              Connect, create campaigns, and track your Meta ads performance
            </p>
          </div>
          {tab === 'campaigns' && !showBuilder && (
            <Btn onClick={() => { setBuilderProduct(undefined); setShowBuilder(true); }}>
              <Plus size={14} /> New Campaign
            </Btn>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${C.border}`, marginBottom: 28 }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setShowBuilder(false); }}
              style={{
                padding: '10px 16px',
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${tab === t.key ? C.indigo : 'transparent'}`,
                color: tab === t.key ? C.text : C.muted,
                fontFamily: FONT_BODY,
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'color 150ms',
                marginBottom: -1,
              }}
            >
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 28 }}>
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
                  <Btn onClick={() => window.location.href = '/app/store-builder'}><Link2 size={14} /> Connect Shopify</Btn>
                )}
              </Card>
            </div>

            {/* Next Steps */}
            <Card>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.indigo, fontFamily: FONT_HEADING, letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 14 }}>
                SETUP CHECKLIST
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {nextSteps.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                    {s.done ? (
                      <CheckCircle size={16} style={{ color: C.green, flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${C.border}`, flexShrink: 0 }} />
                    )}
                    <span style={{ fontSize: 14, color: s.done ? C.muted : C.text, textDecoration: s.done ? 'line-through' : 'none' }}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
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
                onCreated={() => { setShowBuilder(false); fetchAll(); }}
                onCancel={() => setShowBuilder(false)}
              />
            ) : campaigns.length === 0 ? (
              <Card style={{ textAlign: 'center' as const, padding: 48 }}>
                <Megaphone size={32} style={{ color: C.dim, marginBottom: 12 }} />
                <h3 style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 18, color: C.text, marginBottom: 8 }}>No Campaigns Yet</h3>
                <p style={{ color: C.muted, fontSize: 14, marginBottom: 20 }}>Create your first campaign to start advertising your products on Meta.</p>
                <Btn onClick={() => { setBuilderProduct(undefined); setShowBuilder(true); }} style={{ margin: '0 auto' }}>
                  <Plus size={14} /> Create Campaign
                </Btn>
              </Card>
            ) : (
              <div style={{ overflowX: 'auto' as const }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                  <thead>
                    <tr>
                      {['Name', 'Objective', 'Status', 'Daily Budget', 'Created'].map((h) => (
                        <th key={h} style={{ textAlign: 'left' as const, padding: '10px 12px', fontSize: 11, fontWeight: 700, color: C.dim, borderBottom: `1px solid ${C.border}`, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c) => (
                      <tr key={c.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '12px', fontSize: 14, fontWeight: 600, color: C.text }}>{c.name}</td>
                        <td style={{ padding: '12px', fontSize: 13, color: C.muted }}>{c.objective.replace('OUTCOME_', '')}</td>
                        <td style={{ padding: '12px' }}>
                          <StatusBadge ok={c.status !== 'draft'} label={c.status} />
                        </td>
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
                <Btn onClick={() => window.location.href = '/app/store-builder'} style={{ margin: '0 auto' }}>
                  <Link2 size={14} /> Connect Shopify Store
                </Btn>
              </Card>
            ) : catalog.length === 0 ? (
              <Card style={{ textAlign: 'center' as const, padding: 48 }}>
                <Package size={32} style={{ color: C.dim, marginBottom: 12 }} />
                <h3 style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 18, color: C.text, marginBottom: 8 }}>No Products Synced</h3>
                <p style={{ color: C.muted, fontSize: 14, marginBottom: 20 }}>Sync your Shopify catalog to start creating ad campaigns.</p>
                <Btn onClick={handleSync} loading={syncing} style={{ margin: '0 auto' }}>
                  <RefreshCw size={14} /> Sync Products Now
                </Btn>
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
                        <div style={{ width: '100%', height: 160, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Package size={32} style={{ color: C.dim }} />
                        </div>
                      )}
                      <div style={{ padding: 16 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{p.title}</div>
                        <div style={{ fontSize: 13, color: C.indigo, fontWeight: 700, marginBottom: 4 }}>${p.price_aud?.toFixed(2)} AUD</div>
                        <StatusBadge ok={p.inventory_status === 'active'} label={p.inventory_status} />
                        <Btn
                          variant="secondary"
                          onClick={() => { setBuilderProduct(p); setShowBuilder(true); setTab('campaigns'); }}
                          style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}
                        >
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
                <Btn onClick={handleMetaConnect} style={{ margin: '0 auto' }}>
                  <Link2 size={14} /> Connect Meta
                </Btn>
              </Card>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                {/* Pixel Installation */}
                <Card>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.indigo, fontFamily: FONT_HEADING, letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 14 }}>
                    META PIXEL
                  </div>
                  {metaStatus.pixelId ? (
                    <div>
                      <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>Pixel ID: <span style={{ color: C.text, fontFamily: 'monospace' }}>{metaStatus.pixelId}</span></div>
                      <StatusBadge ok={true} label="Installed" />
                      <div style={{ marginTop: 12 }}>
                        <Btn variant="secondary" onClick={handleInstallPixel} loading={installingPixel} disabled={!shopifyStatus?.connected}>
                          <Zap size={12} /> Re-install on Shopify
                        </Btn>
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

                {/* CAPI */}
                <Card>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.indigo, fontFamily: FONT_HEADING, letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 14 }}>
                    CONVERSIONS API
                  </div>
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
                      <p style={{ color: C.dim, fontSize: 13, margin: '12px 0' }}>
                        Enable server-side conversion tracking for better attribution and EMQ.
                      </p>
                      <Btn onClick={handleEnableCapi} loading={enablingCapi} disabled={!shopifyStatus?.connected}>
                        <Zap size={12} /> Enable CAPI
                      </Btn>
                      {!shopifyStatus?.connected && <p style={{ fontSize: 11, color: C.dim, marginTop: 6 }}>Requires both Meta and Shopify connected</p>}
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Spin animation for loaders */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
