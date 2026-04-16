import React, { useState, useEffect } from 'react';
import type { JSX } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { useFavourites } from '@/hooks/useFavourites';
import UpgradeModal from '@/components/UpgradeModal';
import StepIndicator from '@/components/store-builder/StepIndicator';
import AIConceptPanel, { SavedStoresList } from '@/components/store-builder/AIConceptPanel';
import {
  Check, X, Plus, Loader2, ExternalLink, RefreshCw, Eye, Smartphone,
  Monitor, Copy, ShoppingCart, Sparkles, Store as StoreIcon, Globe, ArrowLeft, ArrowRight,
  Lock, Info, Megaphone, Bell, DollarSign, CircleDashed,
} from 'lucide-react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/EmptyState';

/* ────────────────────────────────────────────────────────────────
 * Store Builder — Deerflow/Minea-inspired two-panel wizard
 * Left: step-by-step config. Right: live store preview.
 * Design tokens from Majorka CLAUDE.md. Keeps all existing handlers
 * and API contracts intact.
 * ──────────────────────────────────────────────────────────────── */

// ── Design tokens ──────────────────────────────────────────────
const ACCENT = '#4f8ef7';
const VIOLET = '#4f8ef7';
const BG = '#0d0f14';
const SURFACE = '#13151c';
const TEXT_PRIMARY = '#f0f4ff';
const TEXT_BODY = '#a1a1aa';
const TEXT_MUTED = '#52525b';
const FONT_DISPLAY = "'Syne', 'Syne', sans-serif";
const FONT_BODY = "'DM Sans', sans-serif";

type Mode = 'select' | 'ai' | 'shopify' | 'marketplace';
type WizardStepId = 'niche' | 'products' | 'branding' | 'publish';

const WIZARD_STEPS: Array<{ id: WizardStepId; label: string }> = [
  { id: 'niche', label: 'Niche' },
  { id: 'products', label: 'Products' },
  { id: 'branding', label: 'Branding' },
  { id: 'publish', label: 'Publish' },
];

const NICHES = ['Pet Products', 'Beauty & Skincare', 'Home & Garden', 'Fashion', 'Electronics', 'Fitness', 'Baby & Kids', 'General'];
const MARKETS = ['Australia', 'United States', 'United Kingdom', 'Global'];
const TONES = ['Professional', 'Fun & Casual', 'Luxury', 'Minimal'];

const COLOR_SWATCHES = [
  { color: '#4f8ef7', label: 'Gold' },
  { color: '#3B82F6', label: 'Blue' },
  { color: '#f43f5e', label: 'Rose' },
  { color: '#10b981', label: 'Emerald' },
  { color: '#f59e0b', label: 'Amber' },
  { color: '#06b6d4', label: 'Cyan' },
];

const TEMPLATES = [
  { id: 'minimal',     name: 'Minimal',     style: 'White · Premium spacing',       bestFor: ['Beauty', 'Fashion', 'Jewellery'],  bg: '#ffffff', preview: { bg: '#fff',     text: '#0a0a0a', btn: '#0a0a0a' } },
  { id: 'bold',        name: 'Bold',        style: 'Dark · High contrast',          bestFor: ['Fitness', 'Electronics'],           bg: '#09090b', preview: { bg: '#09090b', text: '#fff',    btn: '#4f8ef7' } },
  { id: 'luxury',      name: 'Luxury',      style: 'Black · Gold accents',          bestFor: ['Premium', 'Watches'],               bg: '#04060f', preview: { bg: '#04060f', text: '#4f8ef7', btn: '#4f8ef7' } },
  { id: 'warm',        name: 'Warm',        style: 'Cream · Earthy tones',          bestFor: ['Pet', 'Baby', 'Eco'],               bg: '#fdf6ec', preview: { bg: '#fdf6ec', text: '#1c1917', btn: '#b45309' } },
  { id: 'clean',       name: 'Clean',       style: 'Light grey · Systematic',       bestFor: ['Electronics', 'Tools'],             bg: '#f8fafc', preview: { bg: '#f8fafc', text: '#0f172a', btn: '#0f172a' } },
  { id: 'high-energy', name: 'High Energy', style: 'Bright · Sale-focused',         bestFor: ['General', 'Impulse buys'],          bg: '#fff7ed', preview: { bg: '#fff7ed', text: '#1c1917', btn: '#dc2626' } },
];

const REVIEW_TEMPLATES = [
  { name: 'Sarah M.',   rating: 5, text: 'Absolutely love this! Exactly what I was looking for. Delivery was super fast too.',     date: '2 weeks ago' },
  { name: 'James T.',   rating: 5, text: 'Really impressive quality for the price. Already ordered a second one for a gift.',     date: '3 weeks ago' },
  { name: 'Priya K.',   rating: 5, text: 'Shipping was quicker than expected and the packaging was really nice. Very happy!',      date: '1 month ago' },
  { name: 'Daniel W.',  rating: 4, text: 'Does exactly what it says. Simple, effective, and great value. Would recommend.',        date: '3 weeks ago' },
  { name: 'Emma R.',    rating: 5, text: 'Bought as a gift and the recipient absolutely loved it. Presentation was beautiful.',    date: '1 week ago'  },
  { name: 'Marcus O.',  rating: 5, text: 'Great product. Even better than I expected from the photos. Solid construction.',        date: '2 months ago'},
  { name: 'Liam H.',    rating: 4, text: 'Good quality, fast shipping, easy to use. Nothing to complain about honestly.',          date: '1 month ago' },
  { name: 'Olivia S.',  rating: 5, text: "This solved a problem I didn't even know I had. Now I use it every single day!",         date: '2 weeks ago' },
  { name: 'Noah B.',    rating: 5, text: 'Excellent customer service when I had a question. Product is great too!',                date: '3 weeks ago' },
  { name: 'Isabella C.',rating: 5, text: 'Looks even better in person. The quality is obvious the moment you unbox it.',           date: '1 week ago'  },
  { name: 'Ethan F.',   rating: 4, text: 'Value for money is excellent. Premium feel without the premium price tag.',              date: '5 weeks ago' },
  { name: 'Mia J.',     rating: 5, text: 'Third time buying from here. Consistent quality every time. Trust this store completely.',date: '2 weeks ago' },
  { name: 'Alex D.',    rating: 5, text: 'Was skeptical at first but this totally exceeded my expectations. Brilliant product.',   date: '1 month ago' },
  { name: 'Charlotte P.',rating:4, text: 'Arrived well-packaged and in perfect condition. Happy with the purchase overall.',       date: '3 weeks ago' },
  { name: 'Ryan M.',    rating: 5, text: 'Exactly as described. No surprises, just a genuinely good product. Will buy again.',     date: '2 months ago'},
];

function getStoreReviews(storeName: string): typeof REVIEW_TEMPLATES {
  const hash = storeName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const indices = [hash % 15, (hash * 7 + 3) % 15, (hash * 13 + 7) % 15];
  const unique = [...new Set(indices)];
  while (unique.length < 3) unique.push((unique[unique.length - 1] + 1) % 15);
  return unique.slice(0, 3).map(i => REVIEW_TEMPLATES[i]);
}

interface WinningProduct {
  id: string;
  product_title: string;
  image_url: string | null;
  price_aud: number | null;
  supplier_cost_aud: number | null;
  cost_price_aud: number | null;
  winning_score: number | null;
  trend: string | null;
  category: string | null;
}
interface CustomProduct {
  id: string;
  product_title: string;
  image_url: string | null;
  price_aud: number | null;
  winning_score: null;
  trend: null;
  category: null;
  isCustom: true;
}
type ProductItem = WinningProduct | CustomProduct;

interface GeneratedCopy {
  tagline?: string;
  hero_headline?: string;
  hero_subheading?: string;
  hero_cta?: string;
  about_text?: string;
  trust_badges?: string[];
  faq?: Array<{ question: string; answer: string }>;
  meta_title?: string;
  meta_description?: string;
  products?: Array<{ id: string; seo_title: string; description: string; bullet_points: string[] }>;
}

// ── Shared small UI ─────────────────────────────────────────────
function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'px-4 py-2 rounded-full text-sm font-semibold transition-all duration-150',
        selected
          ? 'bg-[#4f8ef7]/15 text-[#6ba3ff] border border-[#4f8ef7]/60 shadow-[0_0_0_3px_rgba(79,142,247,0.12)]'
          : 'bg-white/[0.03] text-white/60 border border-white/[0.08] hover:border-white/20 hover:text-white/80',
      ].join(' ')}
      style={{ fontFamily: FONT_BODY }}
    >
      {label}
    </button>
  );
}

// ── Live store preview ─────────────────────────────────────────
function StorePreview({ copy, template, products, storeName, primaryColor, isMobilePreview }: {
  copy: GeneratedCopy | null;
  template: typeof TEMPLATES[0];
  products: ProductItem[];
  storeName: string;
  primaryColor: string;
  isMobilePreview: boolean;
}) {
  const [expandedFaq, setExpandedFaq] = useState<number[]>([0, 1]);
  const bgColor = template.bg;
  const textColor = template.preview.text;
  const btnColor = template.preview.btn;
  const isLightBg = ['#ffffff', '#fdf6ec', '#f8fafc', '#fff7ed'].includes(bgColor);
  const mutedColor = isLightBg ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)';
  const borderColor = isLightBg ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
  const surfaceColor = isLightBg ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)';

  const frameWidth = isMobilePreview ? 375 : 900;
  const productCols = isMobilePreview ? 1 : 3;

  const safeCopy = copy || {};
  const displayName = storeName || 'Your Store';

  return (
    <div
      className="mx-auto shadow-2xl"
      style={{
        width: '100%',
        maxWidth: isMobilePreview ? 375 : '100%',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.06)',
        background: bgColor,
        color: textColor,
        fontFamily: FONT_BODY,
      }}
    >
      <div style={{ width: '100%', margin: '0 auto' }}>
        {/* Browser chrome */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderBottom: `1px solid ${borderColor}`, background: surfaceColor }}>
          <span style={{ width: 10, height: 10, borderRadius: 99, background: '#ff5f57' }} />
          <span style={{ width: 10, height: 10, borderRadius: 99, background: '#febc2e' }} />
          <span style={{ width: 10, height: 10, borderRadius: 99, background: '#28c840' }} />
          <div style={{ flex: 1, textAlign: 'center', fontSize: 11, color: mutedColor, fontFamily: FONT_BODY }}>
            {displayName.toLowerCase().replace(/\s+/g, '')}.majorka.io
          </div>
        </div>

        {/* Nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 22px', borderBottom: `1px solid ${borderColor}` }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 17, color: primaryColor }}>{displayName}</div>
          <div style={{ display: isMobilePreview ? 'none' : 'flex', gap: 18, fontSize: 12, color: mutedColor }}>
            <span>Home</span><span>Shop</span><span>About</span><span>Contact</span>
          </div>
          <ShoppingCart size={16} color={mutedColor} />
        </div>

        {/* Hero */}
        <div style={{ padding: isMobilePreview ? '36px 20px' : '64px 40px', textAlign: 'center', background: surfaceColor }}>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: isMobilePreview ? 24 : 40, fontWeight: 700, marginBottom: 14, lineHeight: 1.15 }}>
            {safeCopy.hero_headline || `Welcome to ${displayName}`}
          </h1>
          <p style={{ fontSize: 14, color: mutedColor, marginBottom: 22, maxWidth: 520, margin: '0 auto 22px' }}>
            {safeCopy.hero_subheading || 'Premium products curated for quality and value.'}
          </p>
          <button style={{ background: btnColor, color: isLightBg ? '#fff' : bgColor, padding: '12px 28px', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            {safeCopy.hero_cta || 'Shop Now'}
          </button>
        </div>

        {/* Ticker */}
        <div style={{ padding: '10px 0', borderTop: `1px solid ${borderColor}`, borderBottom: `1px solid ${borderColor}`, textAlign: 'center', fontSize: 11, color: mutedColor, whiteSpace: 'nowrap', overflow: 'hidden' }}>
          500+ happy customers · Free shipping · 4.8★ rated · Secure checkout
        </div>

        {/* Products */}
        {products.length > 0 && (
          <div style={{ padding: '32px 22px' }}>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700, marginBottom: 18, textAlign: 'center' }}>Featured Products</h2>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${productCols}, 1fr)`, gap: 14 }}>
              {products.slice(0, 6).map((p, i) => {
                const copyProduct = safeCopy.products?.find(cp => cp.id === p.id);
                const reviewCount = (parseInt(String(p.id || '0').slice(-4), 16) % 200) + 50;
                return (
                  <div key={p.id || i} style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${borderColor}`, background: surfaceColor }}>
                    <div style={{ height: 140, background: isLightBg ? '#f5f5f5' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.product_title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div style={{ fontSize: 28, opacity: 0.25 }}>📦</div>
                      )}
                    </div>
                    <div style={{ padding: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {copyProduct?.seo_title || p.product_title}
                      </div>
                      <div style={{ fontSize: 10, color: mutedColor, marginBottom: 6 }}>★★★★★ ({reviewCount})</div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: primaryColor, marginBottom: 8 }}>${(p.price_aud || 49.95).toFixed(2)}</div>
                      <button style={{ width: '100%', padding: 8, borderRadius: 6, border: 'none', background: btnColor, color: isLightBg ? '#fff' : bgColor, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Add to Cart</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Trust badges */}
        {safeCopy.trust_badges && safeCopy.trust_badges.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 20, padding: '20px 22px', borderTop: `1px solid ${borderColor}` }}>
            {safeCopy.trust_badges.slice(0, 4).map((badge, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: mutedColor }}>
                <span>✓</span> {badge}
              </div>
            ))}
          </div>
        )}

        {/* Reviews */}
        <div style={{ padding: '32px 22px', background: surfaceColor }}>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700, marginBottom: 16, textAlign: 'center' }}>What customers say</h3>
          <div style={{ display: 'grid', gridTemplateColumns: isMobilePreview ? '1fr' : 'repeat(3, 1fr)', gap: 12 }}>
            {getStoreReviews(displayName).map((review, i) => (
              <div key={i} style={{ padding: 14, borderRadius: 10, border: `1px solid ${borderColor}`, background: isLightBg ? '#fff' : 'rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: 11, color: primaryColor, marginBottom: 6 }}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
                <div style={{ fontSize: 11, color: textColor, marginBottom: 8, lineHeight: 1.5 }}>{review.text}</div>
                <div style={{ fontSize: 10, color: mutedColor }}>{review.name} · {review.date}</div>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 14,
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid rgba(245,158,11,0.35)',
              background: 'rgba(245,158,11,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              color: '#f59e0b',
              fontFamily: FONT_BODY,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <Info size={12} />
            <span>Illustrative sample reviews — not real customers. Replace with genuine feedback before launch.</span>
          </div>
        </div>

        {/* FAQ */}
        {safeCopy.faq && safeCopy.faq.length > 0 && (
          <div style={{ padding: '32px 22px' }}>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700, marginBottom: 14, textAlign: 'center' }}>FAQ</h3>
            {safeCopy.faq.slice(0, 5).map((item, i) => (
              <div key={i} style={{ borderBottom: `1px solid ${borderColor}`, padding: '12px 0' }}>
                <div
                  onClick={() => setExpandedFaq(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}
                  style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                >
                  {item.question}
                  <span>{expandedFaq.includes(i) ? '−' : '+'}</span>
                </div>
                {expandedFaq.includes(i) && (
                  <div style={{ fontSize: 11, color: mutedColor, marginTop: 8 }}>{item.answer}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: '24px 22px', borderTop: `1px solid ${borderColor}`, textAlign: 'center', fontSize: 10, color: mutedColor }}>
          © 2026 {displayName}. All rights reserved · Privacy · Terms
        </div>
      </div>
    </div>
  );
}

// ── CSS keyframes ───────────────────────────────────────────────
const KEYFRAMES_CSS = `
@keyframes confetti-fall { 0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }
@keyframes progress-fill { 0% { width: 0%; } 100% { width: 100%; } }
@keyframes sb-pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
@keyframes sb-fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.sb-fade-in { animation: sb-fade-in 300ms ease-out both; }
.sb-glow-cta { box-shadow: 0 0 0 1px rgba(79,142,247,0.4), 0 10px 40px -10px rgba(79,142,247,0.6), 0 0 60px -10px rgba(79,142,247,0.4); }
.sb-glow-cta:hover { box-shadow: 0 0 0 1px rgba(79,142,247,0.6), 0 14px 50px -10px rgba(79,142,247,0.8), 0 0 80px -10px rgba(79,142,247,0.6); transform: translateY(-1px); }
.sb-input { width: 100%; padding: 13px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); color: ${TEXT_PRIMARY}; font-size: 14px; font-family: ${FONT_BODY}; outline: none; transition: all 150ms; box-sizing: border-box; }
.sb-input:focus { border-color: rgba(79,142,247,0.6); background: rgba(79,142,247,0.05); box-shadow: 0 0 0 3px rgba(79,142,247,0.12); }
.sb-card-hover { transition: transform 200ms, border-color 200ms, box-shadow 200ms; }
.sb-card-hover:hover { transform: translateY(-2px); border-color: rgba(79,142,247,0.4); box-shadow: 0 12px 40px -12px rgba(79,142,247,0.4); }
`;

// ════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
export default function StoreBuilder() {
  const { session, subPlan, subStatus } = useAuth();
  const [, setLocation] = useLocation();
  const fav = useFavourites();
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ done: number; total: number; failed: number }>({ done: 0, total: 0, failed: 0 });

  // Auth & subscription
  const isAdmin = session?.user?.email === 'maximusmajorka@gmail.com';
  const isBuilder = (subPlan === 'builder' && subStatus === 'active') || isAdmin;
  const isScale = (subPlan === 'scale' && subStatus === 'active') || isAdmin;
  const isPaid = isBuilder || isScale;

  // Mode
  const [mode, setMode] = useState<Mode>('select');
  const [upgradeModal, setUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('');

  // Wizard step (consolidated 4-step flow)
  const [stepId, setStepId] = useState<WizardStepId>('niche');
  const stepIndex = WIZARD_STEPS.findIndex(s => s.id === stepId);

  // Config
  const [storeName, setStoreName] = useState('');
  const [niche, setNiche] = useState('');
  const [targetMarket, setTargetMarket] = useState('Australia');
  const [tone, setTone] = useState('Professional');
  const [primaryColor, setPrimaryColor] = useState(ACCENT);
  const [selectedTemplate, setSelectedTemplate] = useState('bold');

  // Products
  const [nicheProducts, setNicheProducts] = useState<WinningProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<ProductItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [customProductModal, setCustomProductModal] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customDesc, setCustomDesc] = useState('');

  // Generation
  const [generatedCopy, setGeneratedCopy] = useState<GeneratedCopy | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);

  // Preview
  const [isMobilePreview, setIsMobilePreview] = useState(false);

  // Publish
  const [subdomain, setSubdomain] = useState('');
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);
  const [customDomain, setCustomDomain] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{ success: boolean; liveUrl?: string; storeId?: string } | null>(null);

  // Shopify
  const [shopifyStatus, setShopifyStatus] = useState<{ connected: boolean; shop?: string }>({ connected: false });
  const [shopifyDomain, setShopifyDomain] = useState('');
  const [shopifyCatalog, setShopifyCatalog] = useState<Array<{ id: string; title: string; price_aud: number; image_url: string | null; inventory_status: string }>>([]);
  const [syncing, setSyncing] = useState(false);
  const [topProducts, setTopProducts] = useState<WinningProduct[]>([]);

  // Marketplace
  const [mpProfile, setMpProfile] = useState<{ username?: string; display_name?: string; bio?: string; avatar_url?: string } | null>(null);
  const [mpStep, setMpStep] = useState<'onboarding' | 'dashboard'>('onboarding');
  const [mpUsername, setMpUsername] = useState('');
  const [mpDisplayName, setMpDisplayName] = useState('');
  const [mpBio, setMpBio] = useState('');
  const [mpUsernameAvail, setMpUsernameAvail] = useState<boolean | null>(null);
  const [mpListings, setMpListings] = useState<Array<{ id: string; title: string; price_aud: number; inventory_qty: number; status: string }>>([]);
  const [mpOrders, setMpOrders] = useState<Array<{ id: string; buyer_name: string; items: unknown; subtotal: number; status: string; created_at: string }>>([]);
  const [mpEarnings, setMpEarnings] = useState<{ total_sales: number; total_revenue: number; net_earnings: number; pending_orders: number } | null>(null);

  // Existing stores
  const [existingStores, setExistingStores] = useState<Array<{ id: string; store_name: string; subdomain?: string; created_at: string; published?: boolean }>>([]);

  const authToken = session?.access_token || '';
  const authHeaders = { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' };

  // Reference unused imports for the curated experience (kept for future use)
  void mpProfile; void Eye; void Globe;

  // ── Pre-fill from Products page (majorka_import_product) ──────
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('majorka_import_product');
      if (!stored) return;
      const prod = JSON.parse(stored) as {
        id?: string | number; title?: string; rawTitle?: string; image?: string;
        price?: number | string; cost?: number | string; description?: string; category?: string | null;
      };
      if (prod.title) {
        setCustomTitle(String(prod.title));
        if (!storeName) setStoreName(String(prod.title).split(/\s+/).slice(0, 2).join(' '));
        if (!niche) setNiche(prod.category ? String(prod.category) : String(prod.title).split(/\s+/).slice(0, 3).join(' '));
      }
      if (prod.image) setCustomImageUrl(String(prod.image));
      if (prod.price != null) setCustomPrice(String(prod.price));
      if (prod.description) setCustomDesc(String(prod.description));
      setMode('ai');
      setCustomProductModal(true);
      sessionStorage.removeItem('majorka_import_product');
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch existing stores & shopify status ────────────────────
  useEffect(() => {
    if (!authToken) return;
    fetch('/api/shopify/status', { headers: authHeaders })
      .then(r => r.json())
      .then(d => { if (d.connected) setShopifyStatus({ connected: true, shop: d.shop }); })
      .catch(() => {});

    const env = (import.meta as unknown as Record<string, Record<string, string>>).env;
    const supabaseUrl = env?.VITE_SUPABASE_URL;
    const supabaseKey = env?.VITE_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      fetch(`${supabaseUrl}/rest/v1/generated_stores?select=id,store_name,subdomain,created_at,published&order=created_at.desc&limit=10&subdomain=not.ilike.*test*&subdomain=not.ilike.*qa*`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${authToken}` },
      })
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) setExistingStores(data.filter((s: { store_name?: string }) => s.store_name && !s.store_name.toLowerCase().includes('test')));
        })
        .catch(() => {});
    }
  }, [authToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // Free-tier users can preview the full wizard; publish is gated below on the Publish step.

  // ── Fetch niche products ──────────────────────────────────────
  const fetchNicheProducts = async (selectedNiche: string) => {
    setLoadingProducts(true);
    try {
      const res = await fetch(`/api/store-builder/products-for-niche?niche=${encodeURIComponent(selectedNiche)}`, { headers: authHeaders });
      const data = await res.json();
      setNicheProducts(data.products || []);
    } catch { /* silent */ }
    setLoadingProducts(false);
  };

  // ── Generate copy (kicked off on entering Branding step) ──────
  const generateCopy = async () => {
    if (!storeName.trim()) { toast.error('Enter a store name first'); return; }
    setGenerating(true);
    setGenStep(0);
    const steps = [
      { msg: 'Analysing your niche...',          delay: 0    },
      { msg: 'Writing your store copy...',       delay: 1500 },
      { msg: 'Optimising product descriptions...', delay: 3000 },
      { msg: 'Almost ready...',                  delay: 4500 },
    ];
    steps.forEach((s, i) => { setTimeout(() => setGenStep(i), s.delay); });

    const fallback = (): GeneratedCopy => ({
      tagline: `Quality ${niche || 'products'} delivered fast`,
      hero_headline: `Welcome to ${storeName || 'My Store'}`,
      hero_subheading: `Discover our curated collection of ${niche || 'products'} — trusted by thousands worldwide.`,
      hero_cta: 'Shop Now',
      about_text: `${storeName} is your destination for high-quality ${niche || 'products'}.`,
      trust_badges: ['Free Shipping', 'Secure Checkout', '30-Day Returns', '24/7 Support'],
      faq: [
        { question: 'How fast is shipping?', answer: 'Standard shipping takes 7-14 business days. Express options are available at checkout.' },
        { question: 'What is your return policy?', answer: 'We offer a 30-day money-back guarantee.' },
        { question: 'Is checkout secure?', answer: 'Yes. We use SSL encryption and trusted payment processors.' },
      ],
      meta_title: `${storeName} — ${niche || 'Quality Products'}`,
      meta_description: `Shop ${niche || 'products'} at ${storeName}.`,
      products: selectedProducts.map(p => ({
        id: String(p.id),
        seo_title: p.product_title || 'Product',
        description: `Premium ${((p as WinningProduct).category || niche || 'product').toLowerCase()} — fast shipping, excellent quality.`,
        bullet_points: ['High quality materials', 'Fast worldwide shipping', 'Trusted by thousands'],
      })),
    });

    try {
      const res = await fetch('/api/store-builder/generate-copy', {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({
          storeName, niche: niche || 'General', targetMarket, tone,
          products: selectedProducts.map(p => ({ id: p.id, product_title: p.product_title, price_aud: p.price_aud })),
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(errData.error || `Generation failed (${res.status})`);
      }
      const data = await res.json();
      if (data.copy && Object.keys(data.copy).length > 0) {
        setGeneratedCopy(data.copy);
        toast.success('Store copy generated');
      } else {
        setGeneratedCopy(fallback());
        toast('AI copy unavailable — using template. You can edit everything.', { duration: 4000 });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Generation error: ${msg.slice(0, 80)}. Using template copy instead.`, { duration: 5000 });
      setGeneratedCopy(fallback());
    }
    setTimeout(() => setGenerating(false), 600);
  };

  // ── Subdomain availability ────────────────────────────────────
  const checkSubdomain = async (slug: string) => {
    if (!slug || slug.length < 3) { setSubdomainAvailable(null); return; }
    setCheckingSubdomain(true);
    try {
      const res = await fetch(`/api/store-builder/check-subdomain?slug=${encodeURIComponent(slug)}`);
      const data = await res.json();
      setSubdomainAvailable(data.available);
    } catch { setSubdomainAvailable(null); }
    setCheckingSubdomain(false);
  };

  useEffect(() => {
    if (!subdomain) return;
    if (!isPaid) return; // Paywall: skip availability check for free-tier
    const t = setTimeout(() => checkSubdomain(subdomain), 500);
    return () => clearTimeout(t);
  }, [subdomain, isPaid]);

  // ── Publish ───────────────────────────────────────────────────
  const publishStore = async () => {
    if (!isPaid) { setLocation('/pricing'); return; }
    if (!subdomain || subdomain.length < 3) { toast.error('Enter a store URL slug (at least 3 characters)'); return; }
    setPublishing(true);
    try {
      const res = await fetch('/api/store-builder/publish', {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({
          storeName: storeName || 'My Store',
          niche: niche || 'General',
          targetMarket, tone, primaryColor,
          templateId: selectedTemplate,
          selectedProducts: selectedProducts.map(p => ({
            id: p.id, product_title: p.product_title, price_aud: p.price_aud,
            image_url: p.image_url, category: (p as WinningProduct).category,
          })),
          generatedCopy, subdomain, customDomain, mode: 'ai',
        }),
      });
      const data = await res.json();
      if (!res.ok)        { toast.error(data.error || `Publish failed (${res.status})`); setPublishResult({ success: false }); }
      else if (data.success) { toast.success('Store published!'); setPublishResult(data); }
      else                 { toast.error(data.error || 'Publish returned no success flag'); setPublishResult({ success: false }); }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      toast.error(`Publish failed: ${msg}`);
      setPublishResult({ success: false });
    }
    setPublishing(false);
  };

  // ── Shopify handlers ──────────────────────────────────────────
  const connectShopify = () => {
    const domain = shopifyDomain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!domain.includes('.myshopify.com')) return;
    window.location.href = `/api/shopify/auth?shop=${encodeURIComponent(domain)}`;
  };
  const syncShopify = async () => {
    setSyncing(true);
    try {
      await fetch('/api/shopify/sync', { method: 'POST', headers: authHeaders });
      const catRes = await fetch('/api/shopify/catalog', { headers: authHeaders });
      const catData = await catRes.json();
      setShopifyCatalog(catData.products || []);
    } catch { /* silent */ }
    setSyncing(false);
  };
  const fetchTopProducts = async () => {
    try {
      const res = await fetch('/api/store-builder/products-for-niche?niche=General', { headers: authHeaders });
      const data = await res.json();
      setTopProducts((data.products || []).slice(0, 5));
    } catch { /* silent */ }
  };

  // ── Marketplace handlers ──────────────────────────────────────
  const fetchMpProfile = async () => {
    try {
      const res = await fetch('/api/marketplace/profile', { headers: authHeaders });
      const data = await res.json();
      if (data.profile) {
        setMpProfile(data.profile);
        setMpStep('dashboard');
        const [listRes, ordRes, earnRes] = await Promise.all([
          fetch('/api/marketplace/listings', { headers: authHeaders }),
          fetch('/api/marketplace/orders',  { headers: authHeaders }),
          fetch('/api/marketplace/earnings',{ headers: authHeaders }),
        ]);
        const [listData, ordData, earnData] = await Promise.all([listRes.json(), ordRes.json(), earnRes.json()]);
        setMpListings(listData.listings || []);
        setMpOrders(ordData.orders || []);
        setMpEarnings(earnData.earnings || null);
      }
    } catch { /* silent */ }
  };
  const checkMpUsername = async (username: string) => {
    if (username.length < 3) { setMpUsernameAvail(null); return; }
    try {
      const res = await fetch(`/api/marketplace/check-username?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      setMpUsernameAvail(data.available);
    } catch { setMpUsernameAvail(null); }
  };
  const createMpProfile = async () => {
    if (!mpUsername || !mpDisplayName) return;
    try {
      const res = await fetch('/api/marketplace/profile', {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ username: mpUsername, display_name: mpDisplayName, bio: mpBio }),
      });
      const data = await res.json();
      if (data.profile) { setMpProfile(data.profile); setMpStep('dashboard'); }
    } catch { /* silent */ }
  };

  // ── Step transitions ──────────────────────────────────────────
  const goToStep = (id: WizardStepId) => {
    if (id === 'products' && nicheProducts.length === 0 && niche) fetchNicheProducts(niche);
    if (id === 'branding' && !generatedCopy && !generating) generateCopy();
    setStepId(id);
  };

  const canContinueFrom: Record<WizardStepId, boolean> = {
    niche: Boolean(storeName.trim() && niche),
    products: selectedProducts.length > 0,
    branding: Boolean(selectedTemplate),
    publish: subdomainAvailable === true,
  };

  const nextStep = () => {
    const idx = stepIndex;
    if (idx < WIZARD_STEPS.length - 1) goToStep(WIZARD_STEPS[idx + 1].id);
  };
  const prevStep = () => {
    const idx = stepIndex;
    if (idx > 0) goToStep(WIZARD_STEPS[idx - 1].id);
  };

  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT_PRIMARY, fontFamily: FONT_BODY }}>
      <Helmet><title>Store Builder — Majorka</title><meta name="robots" content="noindex, nofollow" /></Helmet>
      <style>{KEYFRAMES_CSS}</style>

      {upgradeModal && <UpgradeModal isOpen={true} onClose={() => setUpgradeModal(false)} scaleOnly={true} reason={upgradeReason} feature="Majorka Marketplace" />}

      {/* ══════ MODE SELECT ══════ */}
      {mode === 'select' && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          {existingStores.length === 0 && (
            <div className="mb-10">
              <EmptyState
                icon={<StoreIcon size={40} strokeWidth={1.75} />}
                title="Spin up a store concept"
                body="Give Majorka a niche and target market. It returns a store name, tagline, palette, and a product shortlist — Shopify-ready."
                primaryCta={{
                  label: 'Start generator',
                  onClick: () => { setMode('ai'); setStepId('niche'); },
                }}
              />
            </div>
          )}
          {/* Hero */}
          <div className="text-center mb-14 sb-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6" style={{ background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.2)' }}>
              <Sparkles size={14} color={ACCENT} />
              <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: ACCENT, letterSpacing: '0.1em' }}>AI Store Builder</span>
            </div>
            <h1 className="mb-4" style={{ fontFamily: FONT_DISPLAY, fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
              From niche to <span style={{ background: `linear-gradient(90deg, ${ACCENT}, ${VIOLET})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>live store</span> in 7 minutes
            </h1>
            <p className="mx-auto" style={{ color: TEXT_BODY, fontSize: 17, maxWidth: 560, lineHeight: 1.5 }}>
              Pick a path. Our AI handles copy, layout, and product optimisation.
            </p>
          </div>

          {/* Mode cards */}
          <div className="grid gap-5 mb-12" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            <div
              onClick={() => { setMode('ai'); setStepId('niche'); }}
              className="sb-card-hover group cursor-pointer relative overflow-hidden p-8"
              style={{ background: SURFACE, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20 }}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ background: `radial-gradient(600px circle at 50% 0%, rgba(79,142,247,0.10), transparent 40%)` }} />
              <div className="flex items-center gap-2 mb-5">
                <div className="flex items-center justify-center w-11 h-11 rounded-xl" style={{ background: 'rgba(79,142,247,0.12)', border: '1px solid rgba(79,142,247,0.25)' }}>
                  <Sparkles size={20} color={ACCENT} />
                </div>
                <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded" style={{ background: 'rgba(79,142,247,0.1)', color: ACCENT, letterSpacing: '0.12em' }}>Recommended</span>
              </div>
              <div className="mb-2" style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700 }}>Build with AI</div>
              <div className="mb-6" style={{ color: TEXT_BODY, fontSize: 14, lineHeight: 1.5 }}>Wizard generates copy, selects products, and publishes a live storefront in minutes.</div>
              <div className="flex items-center gap-2" style={{ color: ACCENT, fontSize: 13, fontWeight: 600 }}>
                Start building <ArrowRight size={14} />
              </div>
            </div>

            <div
              onClick={() => { setMode('shopify'); syncShopify(); fetchTopProducts(); }}
              className="sb-card-hover cursor-pointer p-8"
              style={{ background: SURFACE, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20 }}
            >
              <div className="flex items-center justify-center w-11 h-11 rounded-xl mb-5" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
                <StoreIcon size={20} color="#10b981" />
              </div>
              <div className="mb-2" style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700 }}>Connect Shopify</div>
              <div className="mb-6" style={{ color: TEXT_BODY, fontSize: 14, lineHeight: 1.5 }}>Sync existing products and orders. Layer Majorka intelligence over your Shopify store.</div>
              <div className="flex items-center gap-2" style={{ color: '#10b981', fontSize: 13, fontWeight: 600 }}>
                Connect store <ArrowRight size={14} />
              </div>
            </div>

            <div
              onClick={() => {
                if (!isScale) { setUpgradeReason('Majorka Marketplace is available on Scale plan'); setUpgradeModal(true); return; }
                setMode('marketplace'); fetchMpProfile();
              }}
              className="sb-card-hover cursor-pointer relative p-8"
              style={{ background: SURFACE, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20 }}
            >
              <div className="absolute top-4 right-4 text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded" style={{ background: 'rgba(79,142,247,0.12)', color: VIOLET, letterSpacing: '0.1em' }}>Scale</div>
              <div className="flex items-center justify-center w-11 h-11 rounded-xl mb-5" style={{ background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.25)' }}>
                <StoreIcon size={20} color={VIOLET} />
              </div>
              <div className="mb-2" style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700 }}>Sell on Majorka</div>
              <div className="mb-6" style={{ color: TEXT_BODY, fontSize: 14, lineHeight: 1.5 }}>List products. We handle the storefront. 5% platform fee, no monthly cost.</div>
              <div className="flex items-center gap-2" style={{ color: VIOLET, fontSize: 13, fontWeight: 600 }}>
                Start selling <ArrowRight size={14} />
              </div>
            </div>
          </div>

          {/* Existing stores */}
          {existingStores.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-widest mb-4" style={{ color: TEXT_MUTED, letterSpacing: '0.15em' }}>Your stores</div>
              <div className="flex flex-col gap-2">
                {existingStores.map(store => (
                  <div key={store.id} className="flex items-center justify-between px-5 py-4" style={{ background: SURFACE, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{store.store_name}</div>
                      <div style={{ fontSize: 12, color: TEXT_MUTED }}>
                        {store.subdomain ? `majorka.io/store/${store.subdomain}` : 'Not published'} · {new Date(store.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                    {store.published && store.subdomain && (
                      <a href={`https://majorka.io/store/${store.subdomain}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: ACCENT, textDecoration: 'none' }}>
                        View <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════ AI WIZARD — two-panel layout ══════ */}
      {mode === 'ai' && (
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 md:py-10">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setMode('select')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-white/5"
              style={{ color: TEXT_BODY, fontFamily: FONT_BODY }}
            >
              <ArrowLeft size={15} /> Back
            </button>
            <div className="hidden md:block flex-1 max-w-2xl mx-8">
              <StepIndicator
                steps={WIZARD_STEPS}
                currentIndex={stepIndex}
                onStepClick={(i) => goToStep(WIZARD_STEPS[i].id)}
              />
            </div>
            <div className="hidden md:flex items-center gap-1 px-1 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={() => setIsMobilePreview(false)} className={`px-2.5 py-1.5 rounded ${!isMobilePreview ? '' : ''}`} style={{ background: !isMobilePreview ? 'rgba(79,142,247,0.15)' : 'transparent', color: !isMobilePreview ? ACCENT : TEXT_MUTED }}>
                <Monitor size={15} />
              </button>
              <button onClick={() => setIsMobilePreview(true)} style={{ background: isMobilePreview ? 'rgba(79,142,247,0.15)' : 'transparent', color: isMobilePreview ? ACCENT : TEXT_MUTED }} className="px-2.5 py-1.5 rounded">
                <Smartphone size={15} />
              </button>
            </div>
          </div>

          {/* Mobile step indicator */}
          <div className="md:hidden mb-6">
            <StepIndicator steps={WIZARD_STEPS} currentIndex={stepIndex} onStepClick={(i) => goToStep(WIZARD_STEPS[i].id)} />
          </div>

          {/* Two-panel grid */}
          <div className="grid gap-6 lg:gap-8" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
            <div className="grid gap-6 lg:gap-8" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
              <div className="grid gap-6 lg:gap-8 lg:grid-cols-[minmax(0,_520px)_minmax(0,_1fr)]">
                {/* ── LEFT PANEL — CONFIG ── */}
                <div className="sb-fade-in">
                  <div className="p-6 md:p-8" style={{ background: SURFACE, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20 }}>
                    {/* STEP 1: NICHE */}
                    {stepId === 'niche' && (
                      <div>
                        <div className="mb-1 text-xs uppercase tracking-widest" style={{ color: ACCENT, letterSpacing: '0.15em' }}>Step 1 of 4</div>
                        <h2 className="mb-2" style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 700, letterSpacing: '-0.01em' }}>Define your brand</h2>
                        <p className="mb-7" style={{ color: TEXT_BODY, fontSize: 14 }}>AI uses these to generate copy, pick colours, and shape the storefront.</p>

                        <div className="flex flex-col gap-5">
                          <div>
                            <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: TEXT_BODY, letterSpacing: '0.08em' }}>Store name</label>
                            <input value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="e.g. PawsAustralia" className="sb-input" />
                          </div>

                          <div>
                            <label className="block mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: TEXT_BODY, letterSpacing: '0.08em' }}>Niche</label>
                            <div className="flex flex-wrap gap-2">
                              {NICHES.map(n => <Chip key={n} label={n} selected={niche === n} onClick={() => setNiche(n)} />)}
                            </div>
                          </div>

                          <div>
                            <label className="block mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: TEXT_BODY, letterSpacing: '0.08em' }}>Target market</label>
                            <div className="flex flex-wrap gap-2">
                              {MARKETS.map(m => <Chip key={m} label={m} selected={targetMarket === m} onClick={() => setTargetMarket(m)} />)}
                            </div>
                          </div>

                          <div>
                            <label className="block mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: TEXT_BODY, letterSpacing: '0.08em' }}>Brand tone</label>
                            <div className="flex flex-wrap gap-2">
                              {TONES.map(t => <Chip key={t} label={t} selected={tone === t} onClick={() => setTone(t)} />)}
                            </div>
                          </div>
                        </div>

                        {/* AI one-click concept generator */}
                        <div className="mt-8">
                          <AIConceptPanel
                            initialNiche={niche}
                            initialMarket={targetMarket}
                            onSelectConcept={(c) => {
                              setStoreName(c.chosenName);
                              toast.success('Concept applied — continue to Products to see matches.');
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* STEP 2: PRODUCTS */}
                    {stepId === 'products' && (
                      <div>
                        <div className="mb-1 text-xs uppercase tracking-widest" style={{ color: ACCENT, letterSpacing: '0.15em' }}>Step 2 of 4</div>
                        <h2 className="mb-2" style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 700, letterSpacing: '-0.01em' }}>Choose products</h2>
                        <p className="mb-5" style={{ color: TEXT_BODY, fontSize: 14 }}>Top performers in <span style={{ color: TEXT_PRIMARY, fontWeight: 600 }}>{niche || 'your niche'}</span>. Pick up to 10.</p>

                        {loadingProducts ? (
                          <div className="flex flex-col items-center gap-3 py-14">
                            <Loader2 size={22} color={ACCENT} style={{ animation: 'spin 1s linear infinite' }} />
                            <span style={{ color: TEXT_MUTED, fontSize: 13 }}>Finding top products...</span>
                          </div>
                        ) : nicheProducts.length === 0 ? (
                          <div className="text-center py-12" style={{ color: TEXT_MUTED, fontSize: 14 }}>
                            <div className="mb-3">No matching products yet.</div>
                            <button onClick={() => setCustomProductModal(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: ACCENT }}>
                              <Plus size={14} /> Add manually
                            </button>
                          </div>
                        ) : (
                          <div className="grid gap-3 max-h-[520px] overflow-y-auto pr-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
                            {nicheProducts.map(p => {
                              const isSelected = selectedProducts.some(sp => sp.id === p.id);
                              const scoreColor = (p.winning_score || 0) >= 90 ? '#10b981' : (p.winning_score || 0) >= 75 ? '#f59e0b' : '#f97316';
                              return (
                                <button
                                  key={p.id}
                                  onClick={() => {
                                    if (isSelected) setSelectedProducts(prev => prev.filter(sp => sp.id !== p.id));
                                    else if (selectedProducts.length < 10) setSelectedProducts(prev => [...prev, p]);
                                  }}
                                  className="text-left p-2.5 transition-all relative"
                                  style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: isSelected ? `2px solid ${ACCENT}` : '1px solid rgba(255,255,255,0.07)',
                                    borderRadius: 12,
                                    cursor: 'pointer',
                                  }}
                                >
                                  {isSelected && (
                                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: ACCENT }}>
                                      <Check size={11} color="#fff" />
                                    </div>
                                  )}
                                  <div className="w-full aspect-square rounded-lg overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                    {p.image_url ? (
                                      <img src={p.image_url} alt={p.product_title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center opacity-30 text-2xl">📦</div>
                                    )}
                                  </div>
                                  <div className="text-[11px] font-semibold leading-tight mb-1.5" style={{ color: TEXT_PRIMARY, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.product_title}</div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold" style={{ color: ACCENT }}>${(p.price_aud || 0).toFixed(2)}</span>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: scoreColor, background: `${scoreColor}20` }}>{p.winning_score || 0}</span>
                                  </div>
                                </button>
                              );
                            })}
                            <button
                              onClick={() => setCustomProductModal(true)}
                              className="flex flex-col items-center justify-center aspect-square"
                              style={{ background: 'transparent', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: 12, minHeight: 180 }}
                            >
                              <Plus size={20} color={TEXT_MUTED} />
                              <div className="text-[11px] mt-1.5" style={{ color: TEXT_MUTED }}>Custom</div>
                            </button>
                          </div>
                        )}

                        <div className="mt-4 flex items-center justify-between text-xs" style={{ color: TEXT_MUTED }}>
                          <span>{selectedProducts.length} / 10 selected</span>
                          {selectedProducts.length > 0 && (
                            <button onClick={() => setSelectedProducts([])} className="underline hover:text-white/60">Clear</button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* STEP 3: BRANDING */}
                    {stepId === 'branding' && (
                      <div>
                        <div className="mb-1 text-xs uppercase tracking-widest" style={{ color: ACCENT, letterSpacing: '0.15em' }}>Step 3 of 4</div>
                        <h2 className="mb-2" style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 700, letterSpacing: '-0.01em' }}>Brand & template</h2>
                        <p className="mb-6" style={{ color: TEXT_BODY, fontSize: 14 }}>Pick a template and accent colour. Preview updates live.</p>

                        {generating && (
                          <div className="mb-6 p-4 flex items-center gap-3" style={{ background: 'rgba(79,142,247,0.06)', border: '1px solid rgba(79,142,247,0.2)', borderRadius: 12 }}>
                            <Loader2 size={18} color={ACCENT} style={{ animation: 'spin 1s linear infinite' }} />
                            <div className="flex-1">
                              <div className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>Generating copy...</div>
                              <div className="text-xs" style={{ color: TEXT_BODY }}>
                                {['Analysing your niche', 'Writing store copy', 'Optimising product descriptions', 'Almost ready'][genStep]}
                              </div>
                            </div>
                          </div>
                        )}

                        <label className="block mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: TEXT_BODY, letterSpacing: '0.08em' }}>Template</label>
                        <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                          {TEMPLATES.map(tpl => (
                            <button
                              key={tpl.id}
                              onClick={() => setSelectedTemplate(tpl.id)}
                              className="text-left overflow-hidden transition-all relative"
                              style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: selectedTemplate === tpl.id ? `2px solid ${ACCENT}` : '1px solid rgba(255,255,255,0.07)',
                                borderRadius: 12,
                              }}
                            >
                              <div style={{ background: tpl.preview.bg, padding: 10, height: 66 }}>
                                <div style={{ height: 5, background: tpl.preview.text, borderRadius: 2, marginBottom: 4, width: '55%', opacity: 0.8 }} />
                                <div style={{ height: 3, background: tpl.preview.text, borderRadius: 2, marginBottom: 6, width: '35%', opacity: 0.4 }} />
                                <div style={{ display: 'flex', gap: 4 }}>
                                  {[1, 2, 3].map(i => <div key={i} style={{ flex: 1, height: 22, background: tpl.preview.text, opacity: 0.1, borderRadius: 3 }} />)}
                                </div>
                              </div>
                              <div className="p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 13, fontWeight: 700 }}>{tpl.name}</div>
                                  {selectedTemplate === tpl.id && <Check size={13} color={ACCENT} />}
                                </div>
                                <div className="text-[10px]" style={{ color: TEXT_MUTED }}>{tpl.style}</div>
                              </div>
                            </button>
                          ))}
                        </div>

                        <label className="block mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: TEXT_BODY, letterSpacing: '0.08em' }}>Accent colour</label>
                        <div className="flex items-center gap-2 mb-6">
                          {COLOR_SWATCHES.map(s => (
                            <button
                              key={s.color}
                              onClick={() => setPrimaryColor(s.color)}
                              title={s.label}
                              className="w-8 h-8 rounded-full transition-all"
                              style={{
                                background: s.color,
                                border: primaryColor === s.color ? '3px solid #fff' : '3px solid transparent',
                                boxShadow: primaryColor === s.color ? `0 0 0 2px ${s.color}` : 'none',
                              }}
                            />
                          ))}
                          <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-8 h-8 cursor-pointer bg-transparent border-0" />
                        </div>

                        {generatedCopy && !generating && (
                          <button
                            onClick={generateCopy}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold"
                            style={{ color: TEXT_BODY }}
                          >
                            <RefreshCw size={12} /> Regenerate copy
                          </button>
                        )}
                      </div>
                    )}

                    {/* STEP 4: PUBLISH */}
                    {stepId === 'publish' && !publishResult && (
                      <div>
                        <div className="mb-1 text-xs uppercase tracking-widest" style={{ color: ACCENT, letterSpacing: '0.15em' }}>Step 4 of 4</div>
                        <h2 className="mb-2" style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 700, letterSpacing: '-0.01em' }}>Go live</h2>
                        <p className="mb-6" style={{ color: TEXT_BODY, fontSize: 14 }}>Pick your URL. Your store will be live on the internet in seconds.</p>

                        {!isPaid && (
                          <div
                            className="mb-6 p-5"
                            style={{
                              background: `linear-gradient(135deg, rgba(79,142,247,0.12), rgba(79,142,247,0.08))`,
                              border: '1px solid rgba(79,142,247,0.35)',
                              borderRadius: 16,
                            }}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: 'rgba(79,142,247,0.2)', border: '1px solid rgba(79,142,247,0.35)' }}>
                                <Lock size={14} color={ACCENT} />
                              </div>
                              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY }}>Upgrade to publish your store</div>
                            </div>
                            <p className="mb-4" style={{ color: TEXT_BODY, fontSize: 13, lineHeight: 1.55 }}>
                              You can preview every step of the Store Builder for free. Upgrade to <strong style={{ color: TEXT_PRIMARY }}>Builder ($99/mo)</strong> or <strong style={{ color: TEXT_PRIMARY }}>Scale ($199/mo)</strong> to publish your store to a live URL.
                            </p>
                            <button
                              onClick={() => setLocation('/pricing')}
                              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-bold sb-glow-cta"
                              style={{ background: `linear-gradient(135deg, ${ACCENT}, ${VIOLET})`, color: '#fff', border: 'none' }}
                            >
                              See plans <ArrowRight size={14} />
                            </button>
                          </div>
                        )}

                        <div className="mb-5">
                          <label className="block mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: TEXT_BODY, letterSpacing: '0.08em' }}>Store URL</label>
                          <div className="flex items-stretch">
                            <div className="flex items-center px-3 text-xs" style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '10px 0 0 10px', border: '1px solid rgba(255,255,255,0.1)', borderRight: 'none', color: TEXT_MUTED, fontFamily: FONT_BODY }}>
                              majorka.io/store/
                            </div>
                            <input
                              value={subdomain}
                              onChange={e => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                              placeholder="yourstore"
                              className="sb-input"
                              style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, flex: 1 }}
                            />
                          </div>
                          {subdomain.length >= 3 && (
                            <div className="mt-2 text-xs flex items-center gap-1.5" style={{ color: subdomainAvailable === true ? '#10b981' : subdomainAvailable === false ? '#ef4444' : TEXT_MUTED }}>
                              {checkingSubdomain ? 'Checking…' : subdomainAvailable === true ? <><Check size={12} /> Available</> : subdomainAvailable === false ? 'Already taken' : ''}
                            </div>
                          )}
                        </div>

                        <div className="mb-2">
                          <label className="block mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: TEXT_BODY, letterSpacing: '0.08em' }}>Custom domain (optional)</label>
                          <input value={customDomain} onChange={e => setCustomDomain(e.target.value)} placeholder="shop.yourdomain.com" className="sb-input" />
                          <div className="mt-2 text-xs" style={{ color: TEXT_MUTED }}>Point your CNAME to <span style={{ color: TEXT_BODY, fontFamily: 'monospace' }}>stores.majorka.io</span></div>
                        </div>
                      </div>
                    )}

                    {/* PUBLISH SUCCESS — next-steps panel (post-publish) */}
                    {stepId === 'publish' && publishResult && publishResult.success && (
                      <PostPublishNextSteps
                        liveUrl={publishResult.liveUrl}
                        firstProduct={selectedProducts[0]}
                        setLocation={setLocation}
                      />
                    )}

                    {/* Wizard nav (only on config steps, not success screen) */}
                    {!(stepId === 'publish' && publishResult?.success) && (
                      <div className="mt-8 flex items-center justify-between gap-3">
                        <button
                          onClick={prevStep}
                          disabled={stepIndex === 0}
                          className="inline-flex items-center gap-1.5 px-4 py-3 rounded-lg text-sm font-semibold transition-colors"
                          style={{
                            background: 'transparent',
                            color: stepIndex === 0 ? TEXT_MUTED : TEXT_BODY,
                            border: '1px solid rgba(255,255,255,0.1)',
                            opacity: stepIndex === 0 ? 0.4 : 1,
                            cursor: stepIndex === 0 ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <ArrowLeft size={14} /> Back
                        </button>
                        {stepId !== 'publish' ? (
                          <button
                            onClick={nextStep}
                            disabled={!canContinueFrom[stepId]}
                            className="inline-flex items-center gap-1.5 px-6 py-3 rounded-lg text-sm font-bold transition-all sb-glow-cta"
                            style={{
                              background: canContinueFrom[stepId] ? `linear-gradient(135deg, ${ACCENT}, ${VIOLET})` : 'rgba(79,142,247,0.3)',
                              color: '#fff',
                              border: 'none',
                              opacity: canContinueFrom[stepId] ? 1 : 0.5,
                              cursor: canContinueFrom[stepId] ? 'pointer' : 'not-allowed',
                              fontFamily: FONT_BODY,
                            }}
                          >
                            Continue <ArrowRight size={14} />
                          </button>
                        ) : !isPaid ? (
                          <button
                            onClick={() => setLocation('/pricing')}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all sb-glow-cta"
                            style={{
                              background: `linear-gradient(135deg, ${ACCENT}, ${VIOLET})`,
                              color: '#fff',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            <Lock size={14} /> Upgrade to publish
                          </button>
                        ) : (
                          <button
                            onClick={publishStore}
                            disabled={!subdomainAvailable || publishing}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all sb-glow-cta"
                            style={{
                              background: subdomainAvailable ? `linear-gradient(135deg, ${ACCENT}, ${VIOLET})` : 'rgba(79,142,247,0.3)',
                              color: '#fff',
                              border: 'none',
                              opacity: !subdomainAvailable ? 0.5 : 1,
                              cursor: !subdomainAvailable ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {publishing ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Publishing…</> : <>Publish store 🚀</>}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── RIGHT PANEL — LIVE PREVIEW ── */}
                <div className="sb-fade-in">
                  <div className="sticky top-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: '#10b981', animation: 'sb-pulse 2s ease-in-out infinite' }} />
                        <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: TEXT_BODY, letterSpacing: '0.12em' }}>Live preview</span>
                      </div>
                      <div className="md:hidden flex items-center gap-1 px-1 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <button onClick={() => setIsMobilePreview(false)} style={{ background: !isMobilePreview ? 'rgba(79,142,247,0.15)' : 'transparent', color: !isMobilePreview ? ACCENT : TEXT_MUTED }} className="px-2 py-1 rounded"><Monitor size={13} /></button>
                        <button onClick={() => setIsMobilePreview(true)} style={{ background: isMobilePreview ? 'rgba(79,142,247,0.15)' : 'transparent', color: isMobilePreview ? ACCENT : TEXT_MUTED }} className="px-2 py-1 rounded"><Smartphone size={13} /></button>
                      </div>
                    </div>
                    <div
                      className="relative overflow-hidden"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 20,
                        padding: 16,
                        minHeight: 600,
                        maxHeight: 'calc(100vh - 140px)',
                        overflowY: 'auto',
                      }}
                    >
                      {selectedProducts.length === 0 && stepId !== 'niche' ? (
                        <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-center px-6">
                          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.2)' }}>
                            <StoreIcon size={22} color={ACCENT} />
                          </div>
                          <div className="mb-2" style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700 }}>Preview will appear here</div>
                          <div style={{ color: TEXT_BODY, fontSize: 13, maxWidth: 320 }}>Select products to see your storefront come to life.</div>
                        </div>
                      ) : (
                        <StorePreview
                          copy={generatedCopy}
                          template={TEMPLATES.find(t => t.id === selectedTemplate) || TEMPLATES[1]}
                          products={selectedProducts}
                          storeName={storeName}
                          primaryColor={primaryColor}
                          isMobilePreview={isMobilePreview}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════ SHOPIFY ══════ */}
      {mode === 'shopify' && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <button onClick={() => setMode('select')} className="flex items-center gap-1.5 mb-6 px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/5" style={{ color: TEXT_BODY }}>
            <ArrowLeft size={15} /> Back
          </button>

          <div className="text-center mb-10 sb-fade-in">
            <h2 className="mb-3" style={{ fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: 700, letterSpacing: '-0.01em' }}>Already on Shopify? Keep it.</h2>
            <p style={{ color: TEXT_BODY, fontSize: 15 }}>Majorka layers product intelligence, profit tracking, and Meta ads on top of your existing store.</p>
          </div>

          {!shopifyStatus.connected ? (
            <div className="p-8" style={{ background: SURFACE, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20 }}>
              <div className="flex items-center justify-center w-14 h-14 rounded-xl mb-5 mx-auto" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
                <StoreIcon size={24} color="#10b981" />
              </div>
              <label className="block mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: TEXT_BODY, letterSpacing: '0.08em' }}>Shopify store URL</label>
              <div className="flex gap-2 mb-3">
                <input value={shopifyDomain} onChange={e => setShopifyDomain(e.target.value)} placeholder="yourstore.myshopify.com" className="sb-input flex-1" />
                <button onClick={connectShopify} className="px-5 rounded-lg text-sm font-bold sb-glow-cta" style={{ background: `linear-gradient(135deg, ${ACCENT}, ${VIOLET})`, color: '#fff', border: 'none' }}>
                  Connect →
                </button>
              </div>
              <p className="text-xs mb-5" style={{ color: TEXT_MUTED }}>Read-only access to products, orders, and inventory. We never modify your store without permission.</p>

              <ShopifyAdminValidateBlock />
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between p-5 mb-6" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 16 }}>
                <div className="flex items-center gap-2.5">
                  <Check size={18} color="#10b981" />
                  <span style={{ fontWeight: 600 }}>Connected to {shopifyStatus.shop}</span>
                </div>
                <button onClick={syncShopify} disabled={syncing} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.04)', color: TEXT_BODY, border: '1px solid rgba(255,255,255,0.08)' }}>
                  {syncing ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={12} />} Sync now
                </button>
              </div>

              {shopifyCatalog.length > 0 && (
                <div className="mb-8">
                  <h3 className="mb-3" style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 700 }}>Your Shopify Products</h3>
                  <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                    {shopifyCatalog.map(p => (
                      <div key={p.id} className="p-3" style={{ background: SURFACE, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
                        <div className="w-full h-24 rounded-lg overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                          {p.image_url && <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />}
                        </div>
                        <div className="text-xs font-semibold truncate mb-1">{p.title}</div>
                        <div className="text-xs font-bold" style={{ color: ACCENT }}>${p.price_aud?.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {fav.count > 0 && (
                <div className="mb-8 p-5" style={{ background: SURFACE, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16 }}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="mb-1" style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700 }}>Import saved products</h3>
                      <p className="text-xs" style={{ color: TEXT_BODY }}>{fav.count} product{fav.count === 1 ? '' : 's'} ready to import.</p>
                    </div>
                    <button
                      onClick={async () => {
                        setExporting(true);
                        setExportProgress({ done: 0, total: fav.favourites.length, failed: 0 });
                        let done = 0; let failed = 0;
                        for (const item of fav.favourites) {
                          try {
                            const r = await fetch('/api/shopify/create-product', {
                              method: 'POST', headers: authHeaders,
                              body: JSON.stringify({
                                product: {
                                  product_title: item.product_title, price_aud: item.price_aud,
                                  sold_count: item.sold_count, category: item.category,
                                  image_url: item.image_url, product_url: item.product_url,
                                },
                              }),
                            });
                            if (!r.ok) failed += 1;
                          } catch { failed += 1; }
                          done += 1;
                          setExportProgress({ done, total: fav.favourites.length, failed });
                        }
                        setExporting(false);
                      }}
                      disabled={exporting}
                      className="px-4 py-2 rounded-lg text-xs font-bold sb-glow-cta"
                      style={{ background: `linear-gradient(135deg, ${ACCENT}, ${VIOLET})`, color: '#fff', border: 'none', opacity: exporting ? 0.7 : 1 }}
                    >
                      {exporting ? `Importing ${exportProgress.done}/${exportProgress.total}…` : 'Export all →'}
                    </button>
                  </div>
                </div>
              )}

              {topProducts.length > 0 && (
                <div>
                  <h3 className="mb-2" style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700 }}>Push winners to your store</h3>
                  <p className="text-xs mb-3" style={{ color: TEXT_BODY }}>Add Majorka's top products as drafts in your Shopify catalog.</p>
                  <div className="flex flex-col gap-2">
                    {topProducts.map(p => (
                      <div key={p.id} className="flex items-center gap-3 px-4 py-3" style={{ background: SURFACE, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'rgba(255,255,255,0.04)' }}>
                          {p.image_url && <img src={p.image_url} alt={p.product_title} className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold truncate">{p.product_title}</div>
                          <div className="text-xs" style={{ color: ACCENT }}>${(p.price_aud || 0).toFixed(2)}</div>
                        </div>
                        <button
                          onClick={async () => { try { await fetch('/api/shopify/push-product', { method: 'POST', headers: authHeaders, body: JSON.stringify({ productId: p.id }) }); toast.success('Added to Shopify'); } catch { /* silent */ } }}
                          className="px-3 py-2 rounded-lg text-xs font-bold"
                          style={{ background: `linear-gradient(135deg, ${ACCENT}, ${VIOLET})`, color: '#fff', border: 'none' }}
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════ MARKETPLACE ══════ */}
      {mode === 'marketplace' && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <button onClick={() => setMode('select')} className="flex items-center gap-1.5 mb-6 px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/5" style={{ color: TEXT_BODY }}>
            <ArrowLeft size={15} /> Back
          </button>

          <div className="text-center mb-10 sb-fade-in">
            <h2 className="mb-3" style={{ fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: 700, letterSpacing: '-0.01em' }}>Sell on Majorka</h2>
            <p style={{ color: TEXT_BODY, fontSize: 15, marginBottom: 8 }}>No Shopify subscription. No monthly fees. 5% platform fee per sale.</p>
          </div>

          {/* Saved AI store concepts — list, delete, publish-gated */}
          <div className="mb-8">
            <div className="text-xs uppercase tracking-widest mb-3" style={{ color: TEXT_MUTED, letterSpacing: '0.15em' }}>
              Your saved AI concepts
            </div>
            <SavedStoresList
              isScale={isScale}
              onRequireUpgrade={() => {
                setUpgradeReason('Publishing a store is a Scale plan feature');
                setUpgradeModal(true);
              }}
            />
          </div>

          {mpStep === 'onboarding' && (
            <div className="p-8" style={{ background: SURFACE, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20 }}>
              <h3 className="mb-5" style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700 }}>Create your seller profile</h3>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: TEXT_BODY, letterSpacing: '0.08em' }}>Display name</label>
                  <input value={mpDisplayName} onChange={e => setMpDisplayName(e.target.value)} placeholder="Your brand name" className="sb-input" />
                </div>
                <div>
                  <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: TEXT_BODY, letterSpacing: '0.08em' }}>Username</label>
                  <input value={mpUsername} onChange={e => { const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''); setMpUsername(v); checkMpUsername(v); }} placeholder="your-shop-name" className="sb-input" />
                  <div className="mt-1.5 text-xs" style={{ color: TEXT_MUTED }}>Your shop URL: /shop/{mpUsername || 'username'}</div>
                  {mpUsernameAvail !== null && <div className="text-xs mt-1" style={{ color: mpUsernameAvail ? '#10b981' : '#ef4444' }}>{mpUsernameAvail ? '✓ Available' : '✗ Taken'}</div>}
                </div>
                <div>
                  <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: TEXT_BODY, letterSpacing: '0.08em' }}>Bio</label>
                  <textarea value={mpBio} onChange={e => setMpBio(e.target.value)} placeholder="Tell buyers about your brand..." rows={3} className="sb-input" style={{ resize: 'vertical' }} />
                </div>
              </div>
              <button
                onClick={createMpProfile}
                disabled={!mpUsername || !mpDisplayName || mpUsernameAvail === false}
                className="w-full mt-6 px-5 py-3 rounded-lg text-sm font-bold sb-glow-cta"
                style={{ background: `linear-gradient(135deg, ${ACCENT}, ${VIOLET})`, color: '#fff', border: 'none', opacity: (!mpUsername || !mpDisplayName) ? 0.4 : 1 }}
              >
                Create profile
              </button>
            </div>
          )}

          {mpStep === 'dashboard' && (
            <div>
              {mpEarnings && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  {[
                    { label: 'Products', value: String(mpListings.length) },
                    { label: 'Total Sales', value: String(mpEarnings.total_sales) },
                    { label: 'Earnings', value: `$${(mpEarnings.net_earnings || 0).toFixed(2)}` },
                    { label: 'Pending', value: String(mpEarnings.pending_orders) },
                  ].map(stat => (
                    <div key={stat.label} className="p-4 text-center" style={{ background: SURFACE, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
                      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700, color: ACCENT }}>{stat.value}</div>
                      <div className="text-xs" style={{ color: TEXT_MUTED }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700 }}>Your listings</h3>
                  <button className="px-3 py-2 rounded-lg text-xs font-bold" style={{ background: `linear-gradient(135deg, ${ACCENT}, ${VIOLET})`, color: '#fff', border: 'none' }}>+ New listing</button>
                </div>
                {mpListings.length === 0 ? (
                  <div className="text-center py-10" style={{ background: SURFACE, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, color: TEXT_MUTED }}>No listings yet. Add your first product to start selling.</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {mpListings.map(l => (
                      <div key={l.id} className="flex items-center justify-between px-4 py-3" style={{ background: SURFACE, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
                        <div>
                          <div className="text-sm font-semibold">{l.title}</div>
                          <div className="text-xs" style={{ color: TEXT_MUTED }}>${l.price_aud?.toFixed(2)} · {l.inventory_qty} in stock</div>
                        </div>
                        <span className="text-[11px] font-bold px-2 py-1 rounded" style={{ color: l.status === 'active' ? '#10b981' : TEXT_MUTED, background: l.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)' }}>{l.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="mb-3" style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700 }}>Orders</h3>
                {mpOrders.length === 0 ? (
                  <div className="text-center py-10" style={{ background: SURFACE, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, color: TEXT_MUTED }}>No orders yet.</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {mpOrders.map(o => (
                      <div key={o.id} className="flex items-center justify-between px-4 py-3" style={{ background: SURFACE, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
                        <div>
                          <div className="text-sm font-semibold">{o.buyer_name}</div>
                          <div className="text-xs" style={{ color: TEXT_MUTED }}>${o.subtotal?.toFixed(2)} · {new Date(o.created_at).toLocaleDateString('en-AU')}</div>
                        </div>
                        <span className="text-[11px] font-bold px-2 py-1 rounded" style={{ color: o.status === 'shipped' ? '#10b981' : '#f59e0b', background: o.status === 'shipped' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)' }}>{o.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════ CUSTOM PRODUCT MODAL ══════ */}
      {customProductModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md p-7 sb-fade-in" style={{ background: SURFACE, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20 }}>
            <div className="flex justify-between items-center mb-5">
              <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700 }}>Add custom product</h3>
              <button onClick={() => setCustomProductModal(false)} className="p-1 rounded hover:bg-white/5" style={{ color: TEXT_MUTED }}><X size={18} /></button>
            </div>
            <div className="flex flex-col gap-3">
              <input value={customTitle}    onChange={e => setCustomTitle(e.target.value)}    placeholder="Product title *"          className="sb-input" />
              <input value={customImageUrl} onChange={e => setCustomImageUrl(e.target.value)} placeholder="Image URL (optional)"      className="sb-input" />
              <input value={customPrice}    onChange={e => setCustomPrice(e.target.value)}    placeholder="Price (AUD)" type="number" className="sb-input" />
              <textarea value={customDesc}  onChange={e => setCustomDesc(e.target.value)}     placeholder="Description (optional)" rows={3} className="sb-input" style={{ resize: 'vertical' }} />
            </div>
            <button
              onClick={() => {
                if (!customTitle) return;
                const product: CustomProduct = {
                  id: `custom-${Date.now()}`,
                  product_title: customTitle,
                  image_url: customImageUrl || null,
                  price_aud: parseFloat(customPrice) || null,
                  winning_score: null, trend: null, category: null, isCustom: true,
                };
                setSelectedProducts(prev => [...prev, product]);
                setCustomTitle(''); setCustomImageUrl(''); setCustomPrice(''); setCustomDesc('');
                setCustomProductModal(false);
              }}
              disabled={!customTitle}
              className="w-full mt-5 px-5 py-3 rounded-lg text-sm font-bold sb-glow-cta"
              style={{ background: `linear-gradient(135deg, ${ACCENT}, ${VIOLET})`, color: '#fff', border: 'none', opacity: !customTitle ? 0.4 : 1 }}
            >
              Add product
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
 * Post-publish "What's next" panel.
 * Renders after publishStore() succeeds. Provides live store URL,
 * three CTAs into the next logical surfaces (Ads Studio / Alerts /
 * Revenue), and a persistent first-sale checklist in localStorage.
 * ──────────────────────────────────────────────────────────────── */

const FIRST_SALE_KEY = 'majorka_first_sale_checklist';

type FirstSaleChecklist = {
  pickedProduct: boolean;
  publishedStore: boolean;
  launchedFirstAd: boolean;
  madeFirstSale: boolean;
};

const DEFAULT_CHECKLIST: FirstSaleChecklist = {
  pickedProduct: false,
  publishedStore: false,
  launchedFirstAd: false,
  madeFirstSale: false,
};

function loadChecklist(): FirstSaleChecklist {
  try {
    const raw = localStorage.getItem(FIRST_SALE_KEY);
    if (!raw) return DEFAULT_CHECKLIST;
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_CHECKLIST;
    const p = parsed as Partial<FirstSaleChecklist>;
    return {
      pickedProduct: p.pickedProduct === true,
      publishedStore: p.publishedStore === true,
      launchedFirstAd: p.launchedFirstAd === true,
      madeFirstSale: p.madeFirstSale === true,
    };
  } catch {
    return DEFAULT_CHECKLIST;
  }
}

function saveChecklist(c: FirstSaleChecklist): void {
  try {
    localStorage.setItem(FIRST_SALE_KEY, JSON.stringify(c));
  } catch {
    /* storage disabled — silently fail */
  }
}

interface PostPublishNextStepsProps {
  liveUrl?: string;
  firstProduct: ProductItem | undefined;
  setLocation: (path: string) => void;
}

function PostPublishNextSteps({ liveUrl, firstProduct, setLocation }: PostPublishNextStepsProps): JSX.Element {
  const [checklist, setChecklist] = useState<FirstSaleChecklist>(() => {
    const loaded = loadChecklist();
    // Picking a product and publishing the store both happened to reach
    // this panel — mark them done immediately.
    return { ...loaded, pickedProduct: true, publishedStore: true };
  });

  useEffect(() => {
    saveChecklist(checklist);
  }, [checklist]);

  const copyLink = (): void => {
    if (!liveUrl) return;
    try {
      void navigator.clipboard.writeText(liveUrl);
      toast.success('Link copied');
    } catch {
      toast.error('Copy failed');
    }
  };

  const goToAds = (): void => {
    if (firstProduct) {
      try {
        sessionStorage.setItem('majorka_ad_product', JSON.stringify({
          id: firstProduct.id,
          product_title: firstProduct.product_title,
          image_url: firstProduct.image_url,
          price_aud: firstProduct.price_aud,
        }));
      } catch {
        /* storage full — navigate anyway */
      }
    }
    setChecklist((c) => ({ ...c, launchedFirstAd: true }));
    setLocation('/app/ads-studio');
  };

  const goToAlerts = (): void => {
    if (firstProduct) {
      try {
        sessionStorage.setItem('majorka_track_product_id', firstProduct.id);
      } catch {
        /* ignore */
      }
    }
    setLocation('/app/alerts');
  };

  const goToRevenue = (): void => {
    setChecklist((c) => ({ ...c, madeFirstSale: true }));
    setLocation('/app/revenue');
  };

  const checklistItems: Array<{ key: keyof FirstSaleChecklist; label: string }> = [
    { key: 'pickedProduct',   label: 'Picked a product' },
    { key: 'publishedStore',  label: 'Published store' },
    { key: 'launchedFirstAd', label: 'Launched first ad' },
    { key: 'madeFirstSale',   label: 'Made first sale' },
  ];

  return (
    <div className="py-6">
      {/* Confetti (kept — small celebration) */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100 }}>
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${(i * 37) % 100}%`,
            top: '-10px',
            width: 8, height: 8,
            borderRadius: i % 2 === 0 ? '50%' : '0',
            background: [ACCENT, VIOLET, '#f43f5e', '#10b981', '#f59e0b', '#06b6d4'][i % 6],
            animation: `confetti-fall ${2 + (i % 3)}s ease-in ${(i * 0.1)}s forwards`,
          }} />
        ))}
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🚀</div>
        <h2 className="mb-2" style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 700, color: TEXT_PRIMARY }}>
          Your store is live
        </h2>
        <p style={{ color: TEXT_BODY, fontSize: 14 }}>
          One product published. Now get your first visitor — then your first sale.
        </p>
      </div>

      {/* Live URL bar */}
      {liveUrl && (
        <div
          className="flex items-center gap-2 p-3 rounded-xl mb-6"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Globe size={16} style={{ color: ACCENT, flexShrink: 0 }} />
          <code
            className="flex-1 truncate"
            style={{ color: TEXT_PRIMARY, fontSize: 13, fontFamily: 'monospace' }}
            title={liveUrl}
          >
            {liveUrl}
          </code>
          <button
            onClick={copyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: 'rgba(255,255,255,0.06)', color: TEXT_BODY, border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Copy size={12} /> Copy
          </button>
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: ACCENT, color: '#fff' }}
          >
            Open store <ExternalLink size={12} />
          </a>
        </div>
      )}

      {/* What's next — 3 card grid */}
      <div className="mb-6">
        <div className="text-[11px] font-mono uppercase tracking-widest mb-3" style={{ color: TEXT_MUTED }}>
          What's next
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <NextStepCard
            icon={<Megaphone size={18} />}
            accent={ACCENT}
            title="Create your first ad"
            body="Generate Meta + TikTok ad copy tuned to your product."
            cta="Open Ads Studio"
            onClick={goToAds}
          />
          <NextStepCard
            icon={<Bell size={18} />}
            accent="#f59e0b"
            title="Set an alert"
            body="Track velocity spikes and price drops on this SKU."
            cta="Go to Alerts"
            onClick={goToAlerts}
          />
          <NextStepCard
            icon={<DollarSign size={18} />}
            accent="#10b981"
            title="Log your first sale"
            body="Record ROAS, margin and ad spend to see what's working."
            cta="Open Revenue"
            onClick={goToRevenue}
          />
        </div>
      </div>

      {/* First-sale checklist */}
      <div
        className="p-4 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="text-[11px] font-mono uppercase tracking-widest mb-3" style={{ color: TEXT_MUTED }}>
          First-sale checklist
        </div>
        <ul className="space-y-2">
          {checklistItems.map((item) => {
            const done = checklist[item.key];
            return (
              <li key={item.key} className="flex items-center gap-2.5">
                {done ? (
                  <div
                    className="flex items-center justify-center rounded-full"
                    style={{ width: 18, height: 18, background: '#10b981' }}
                  >
                    <Check size={11} style={{ color: '#fff' }} strokeWidth={3} />
                  </div>
                ) : (
                  <CircleDashed size={18} style={{ color: TEXT_MUTED }} />
                )}
                <span
                  style={{
                    color: done ? TEXT_BODY : TEXT_MUTED,
                    textDecoration: done ? 'line-through' : 'none',
                    fontSize: 14,
                  }}
                >
                  {item.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

interface NextStepCardProps {
  icon: React.ReactNode;
  accent: string;
  title: string;
  body: string;
  cta: string;
  onClick: () => void;
}

function NextStepCard({ icon, accent, title, body, cta, onClick }: NextStepCardProps): JSX.Element {
  return (
    <button
      onClick={onClick}
      className="text-left p-4 rounded-xl transition-all hover:scale-[1.02]"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        cursor: 'pointer',
      }}
    >
      <div
        className="inline-flex items-center justify-center rounded-lg mb-3"
        style={{
          width: 36,
          height: 36,
          background: `${accent}1a`,
          color: accent,
          border: `1px solid ${accent}33`,
        }}
      >
        {icon}
      </div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 4 }}>
        {title}
      </div>
      <div style={{ color: TEXT_BODY, fontSize: 12, lineHeight: 1.5, marginBottom: 10 }}>
        {body}
      </div>
      <div className="inline-flex items-center gap-1" style={{ color: accent, fontSize: 12, fontWeight: 600 }}>
        {cta} <ArrowRight size={12} />
      </div>
    </button>
  );
}

/* ────────────────────────────────────────────────────────────────
 * ShopifyAdminValidateBlock — manual Admin API validation.
 * Calls our server-side `/api/stores/shopify/validate` which in turn
 * pings Shopify Admin API and returns shop name/email/plan on success.
 * Token only persists for the session unless user opts in to remember.
 * ──────────────────────────────────────────────────────────────── */
const SHOPIFY_REMEMBER_KEY = 'majorka_shopify_admin_v1';

interface ShopifyValidationSuccess {
  name: string;
  email: string;
  plan_name: string;
  domain: string;
}

function ShopifyAdminValidateBlock() {
  const { session } = useAuth();
  const [shopUrl, setShopUrl] = React.useState<string>('');
  const [accessToken, setAccessToken] = React.useState<string>('');
  const [remember, setRemember] = React.useState<boolean>(false);
  const [result, setResult] = React.useState<ShopifyValidationSuccess | null>(null);
  const [error, setError] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem('majorka_shopify_session');
      if (raw) {
        const p = JSON.parse(raw) as { shopUrl?: string; accessToken?: string };
        if (p.shopUrl) setShopUrl(p.shopUrl);
        if (p.accessToken) setAccessToken(p.accessToken);
        return;
      }
    } catch {
      /* ignore */
    }
    try {
      const raw = localStorage.getItem(SHOPIFY_REMEMBER_KEY);
      if (raw) {
        const p = JSON.parse(raw) as { shopUrl?: string; accessToken?: string };
        if (p.shopUrl) setShopUrl(p.shopUrl);
        if (p.accessToken) {
          setAccessToken(p.accessToken);
          setRemember(true);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  async function handleValidate(): Promise<void> {
    setError('');
    setResult(null);
    if (!shopUrl.trim() || !accessToken.trim()) {
      setError('Enter both the store URL and the Admin API access token.');
      return;
    }
    setLoading(true);
    try {
      const token = session?.access_token;
      if (!token) {
        setError('Please sign in to validate.');
        setLoading(false);
        return;
      }
      const r = await fetch('/api/stores/shopify/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ shop: shopUrl, accessToken }),
      });
      const data = (await r.json()) as
        | { ok: true; shop: ShopifyValidationSuccess }
        | { ok: false; reason: string; message: string };
      if (!data.ok) {
        setError(data.message);
        setLoading(false);
        return;
      }
      setResult(data.shop);
      try {
        sessionStorage.setItem('majorka_shopify_session', JSON.stringify({ shopUrl, accessToken }));
        if (remember) {
          localStorage.setItem(SHOPIFY_REMEMBER_KEY, JSON.stringify({ shopUrl, accessToken }));
        } else {
          localStorage.removeItem(SHOPIFY_REMEMBER_KEY);
        }
      } catch {
        /* storage disabled — continue */
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 }}>
      <div className="flex items-center gap-2 mb-3">
        <Lock size={14} color={TEXT_MUTED} />
        <span className="text-xs font-bold tracking-wider uppercase" style={{ color: TEXT_BODY, letterSpacing: '0.1em' }}>
          Advanced — validate with Admin API token
        </span>
      </div>
      <label className="block text-xs mb-1" style={{ color: TEXT_MUTED }}>Store URL</label>
      <input
        value={shopUrl}
        onChange={(e) => setShopUrl(e.target.value)}
        placeholder="your-shop.myshopify.com"
        className="sb-input mb-3"
      />
      <label className="block text-xs mb-1" style={{ color: TEXT_MUTED }}>Admin API access token (shpat_…)</label>
      <input
        value={accessToken}
        onChange={(e) => setAccessToken(e.target.value)}
        placeholder="shpat_xxxxxxxxxxxx"
        type="password"
        autoComplete="off"
        className="sb-input mb-3"
      />
      <label className="flex items-center gap-2 mb-3 text-xs" style={{ color: TEXT_BODY }}>
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
        />
        Remember this store on this device
      </label>
      <button
        onClick={handleValidate}
        disabled={loading}
        className="px-4 rounded-lg text-sm font-bold"
        style={{
          minHeight: 44,
          background: loading ? 'rgba(59,130,246,0.2)' : '#3B82F6',
          color: '#fff', border: 'none',
          cursor: loading ? 'wait' : 'pointer',
          fontFamily: FONT_BODY,
        }}
      >
        {loading ? 'Validating…' : 'Validate'}
      </button>
      {error && (
        <div className="mt-3 p-3 text-xs" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span>{error}</span>
          <button onClick={handleValidate} style={{ background: 'none', color: '#fca5a5', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Retry</button>
        </div>
      )}
      {result && (
        <div className="mt-3 p-4" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, color: TEXT_PRIMARY }}>
          <div className="flex items-center gap-2 mb-2">
            <Check size={14} color="#10b981" />
            <span className="font-bold text-sm">Connected</span>
          </div>
          <div className="text-xs" style={{ color: TEXT_BODY }}><strong>{result.name}</strong> · {result.domain}</div>
          <div className="text-xs" style={{ color: TEXT_BODY }}>{result.email} · plan: {result.plan_name}</div>
        </div>
      )}
    </div>
  );
}
