import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import UpgradeModal from '@/components/UpgradeModal';
import { Check, X, Plus, ChevronDown, ChevronUp, Loader2, ExternalLink, RefreshCw, Eye, Smartphone, Monitor, Copy, ShoppingCart } from 'lucide-react';
import { useLocation } from 'wouter';

// ── Constants ──────────────────────────────────────────────────
const accent = '#6366F1';
const violet = '#8B5CF6';
const brico = "'Bricolage Grotesque', sans-serif";
const dmSans = "'DM Sans', sans-serif";
const bgDark = '#0a0a0a';
const cardBg = 'rgba(255,255,255,0.04)';
const cardBorder = '1px solid rgba(255,255,255,0.08)';
const textPrimary = '#FFFFFF';
const textSecondary = 'rgba(255,255,255,0.6)';
const textMuted = 'rgba(255,255,255,0.35)';

type Mode = 'select' | 'ai' | 'shopify' | 'marketplace';
type AIStep = 'setup' | 'products' | 'generating' | 'template' | 'preview' | 'publish';

// ── Niche options ──────────────────────────────────────────────
const NICHES = ['Pet Products', 'Beauty & Skincare', 'Home & Garden', 'Fashion', 'Electronics', 'Fitness', 'Baby & Kids', 'General'];
const MARKETS = ['Australia', 'United States', 'United Kingdom', 'Global'];
const TONES = ['Professional', 'Fun & Casual', 'Luxury', 'Minimal'];
const COLOR_SWATCHES = [
  { color: '#6366F1', label: 'Indigo' },
  { color: '#8B5CF6', label: 'Violet' },
  { color: '#F43F5E', label: 'Rose' },
  { color: '#10B981', label: 'Emerald' },
  { color: '#F59E0B', label: 'Amber' },
  { color: '#06B6D4', label: 'Cyan' },
];

// ── Templates ──────────────────────────────────────────────────
const TEMPLATES = [
  { id: 'minimal', name: 'Minimal', style: 'White · Premium spacing · Elegant', bestFor: ['Beauty', 'Skincare', 'Fashion', 'Jewellery'], bg: '#FFFFFF', accent: '#0A0A0A', font: 'serif', preview: { bg: '#fff', text: '#0a0a0a', btn: '#0a0a0a' } },
  { id: 'bold', name: 'Bold', style: 'Dark · High contrast · Energetic', bestFor: ['Fitness', 'Sports', 'Electronics', 'Gadgets'], bg: '#09090B', accent: '#6366F1', font: 'sans-serif', preview: { bg: '#09090B', text: '#fff', btn: '#6366F1' } },
  { id: 'luxury', name: 'Luxury', style: 'Black · Gold accents · Sophisticated', bestFor: ['Premium', 'Watches', 'High-end Home'], bg: '#080808', accent: '#d4af37', font: 'serif', preview: { bg: '#080808', text: '#d4af37', btn: '#d4af37' } },
  { id: 'warm', name: 'Warm', style: 'Cream · Earthy tones · Approachable', bestFor: ['Pet', 'Baby', 'Eco', 'Natural'], bg: '#FDF6EC', accent: '#B45309', font: 'sans-serif', preview: { bg: '#FDF6EC', text: '#1C1917', btn: '#B45309' } },
  { id: 'clean', name: 'Clean', style: 'Light grey · Systematic · Trustworthy', bestFor: ['Electronics', 'Tools', 'Gadgets', 'Tech'], bg: '#F8FAFC', accent: '#0F172A', font: 'sans-serif', preview: { bg: '#F8FAFC', text: '#0F172A', btn: '#0F172A' } },
  { id: 'high-energy', name: 'High Energy', style: 'Bright · Sale-focused · Impulsive', bestFor: ['General', 'Impulse buys', 'Seasonal'], bg: '#FFF7ED', accent: '#DC2626', font: 'sans-serif', preview: { bg: '#FFF7ED', text: '#1C1917', btn: '#DC2626' } },
];

const REVIEW_TEMPLATES = [
  { name: 'Sarah M.', rating: 5, text: 'Absolutely love this! Exactly what I was looking for. Delivery was super fast too.', date: '2 weeks ago' },
  { name: 'James T.', rating: 5, text: 'Really impressive quality for the price. Already ordered a second one for a gift.', date: '3 weeks ago' },
  { name: 'Priya K.', rating: 5, text: 'Shipping was quicker than expected and the packaging was really nice. Very happy!', date: '1 month ago' },
  { name: 'Daniel W.', rating: 4, text: 'Does exactly what it says. Simple, effective, and great value. Would recommend.', date: '3 weeks ago' },
  { name: 'Emma R.', rating: 5, text: 'Bought as a gift and the recipient absolutely loved it. Presentation was beautiful.', date: '1 week ago' },
  { name: 'Marcus O.', rating: 5, text: 'Great product. Even better than I expected from the photos. Solid construction.', date: '2 months ago' },
  { name: 'Liam H.', rating: 4, text: 'Good quality, fast shipping, easy to use. Nothing to complain about honestly.', date: '1 month ago' },
  { name: 'Olivia S.', rating: 5, text: "This solved a problem I didn't even know I had. Now I use it every single day!", date: '2 weeks ago' },
  { name: 'Noah B.', rating: 5, text: 'Excellent customer service when I had a question. Product is great too!', date: '3 weeks ago' },
  { name: 'Isabella C.', rating: 5, text: 'Looks even better in person. The quality is obvious the moment you unbox it.', date: '1 week ago' },
  { name: 'Ethan F.', rating: 4, text: 'Value for money is excellent. Premium feel without the premium price tag.', date: '5 weeks ago' },
  { name: 'Mia J.', rating: 5, text: 'Third time buying from here. Consistent quality every time. Trust this store completely.', date: '2 weeks ago' },
  { name: 'Alex D.', rating: 5, text: 'Was skeptical at first but this totally exceeded my expectations. Brilliant product.', date: '1 month ago' },
  { name: 'Charlotte P.', rating: 4, text: 'Arrived well-packaged and in perfect condition. Happy with the purchase overall.', date: '3 weeks ago' },
  { name: 'Ryan M.', rating: 5, text: 'Exactly as described. No surprises, just a genuinely good product. Will buy again.', date: '2 months ago' },
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

// ── Pill button component ──────────────────────────────────────
function PillButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '8px 16px', borderRadius: 999, border: `1px solid ${selected ? accent : 'rgba(255,255,255,0.12)'}`,
      background: selected ? 'rgba(99,102,241,0.15)' : 'transparent', color: selected ? accent : textSecondary,
      fontSize: 13, fontWeight: 600, cursor: 'pointer' as const, transition: 'all 150ms', fontFamily: dmSans,
    }}>{label}</button>
  );
}

// ── Template mini preview ──────────────────────────────────────
function TemplatePreview({ preview }: { preview: { bg: string; text: string; btn: string } }) {
  return (
    <div style={{ background: preview.bg, borderRadius: 6, padding: 8, height: 80, overflow: 'hidden' as const, position: 'relative' as const }}>
      <div style={{ height: 6, background: preview.text, borderRadius: 2, marginBottom: 4, width: '60%', opacity: 0.8 }} />
      <div style={{ height: 4, background: preview.text, borderRadius: 2, marginBottom: 8, width: '40%', opacity: 0.4 }} />
      <div style={{ display: 'flex', gap: 4 }}>
        {[1, 2, 3].map(i => <div key={i} style={{ flex: 1, background: preview.text, borderRadius: 4, height: 28, opacity: 0.1 }} />)}
      </div>
      <div style={{ position: 'absolute' as const, bottom: 8, left: 8 }}>
        <div style={{ background: preview.btn, borderRadius: 3, padding: '2px 8px', fontSize: 8, color: preview.bg === '#080808' || preview.bg === '#09090B' ? '#fff' : preview.bg, fontWeight: 700 }}>Buy Now</div>
      </div>
    </div>
  );
}

// ── Store Preview Component ────────────────────────────────────
function StorePreview({ copy, template, products, storeName, primaryColor, isMobilePreview }: {
  copy: GeneratedCopy;
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
  const isLightBg = bgColor === '#FFFFFF' || bgColor === '#FDF6EC' || bgColor === '#F8FAFC' || bgColor === '#FFF7ED';
  const mutedColor = isLightBg ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)';
  const borderColor = isLightBg ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
  const surfaceColor = isLightBg ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)';

  const containerWidth = isMobilePreview ? 375 : 800;
  const scale = isMobilePreview ? 0.42 : 0.45;
  const productCols = isMobilePreview ? 1 : 3;

  return (
    <div style={{ width: containerWidth * scale, height: 600, overflow: 'hidden' as const, borderRadius: 8, border: cardBorder }}>
      <div style={{ width: containerWidth, height: 600 / scale, transform: `scale(${scale})`, transformOrigin: 'top left' as const, background: bgColor, color: textColor, fontFamily: dmSans }}>
        {/* Nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between' as const, alignItems: 'center' as const, padding: '12px 24px', borderBottom: `1px solid ${borderColor}` }}>
          <div style={{ fontFamily: brico, fontWeight: 700, fontSize: 18, color: primaryColor }}>{storeName}</div>
          <div style={{ display: 'flex', gap: 20, fontSize: 13, color: mutedColor }}>
            <span>Home</span><span>Products</span><span>About</span><span>Contact</span>
          </div>
          <ShoppingCart size={18} color={mutedColor} />
        </div>

        {/* Hero */}
        <div style={{ padding: isMobilePreview ? '40px 20px' : '60px 40px', textAlign: 'center' as const, background: surfaceColor }}>
          <h1 style={{ fontFamily: brico, fontSize: isMobilePreview ? 24 : 36, fontWeight: 700, marginBottom: 12, lineHeight: 1.2 }}>{copy.hero_headline || `The ${storeName} Collection`}</h1>
          <p style={{ fontSize: 15, color: mutedColor, marginBottom: 20, maxWidth: 480, margin: '0 auto 20px' }}>{copy.hero_subheading || 'Premium products curated for quality and value.'}</p>
          <button style={{ background: btnColor, color: isLightBg ? '#fff' : bgColor, padding: '12px 28px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer' as const }}>{copy.hero_cta || 'Shop Now'}</button>
        </div>

        {/* Social proof ticker */}
        <div style={{ padding: '10px 0', borderTop: `1px solid ${borderColor}`, borderBottom: `1px solid ${borderColor}`, textAlign: 'center' as const, fontSize: 12, color: mutedColor, overflow: 'hidden' as const, whiteSpace: 'nowrap' as const }}>
          500+ happy customers · Free shipping · 4.8★ rated · Secure checkout
        </div>

        {/* Products grid */}
        {products.length > 0 && (
          <div style={{ padding: '30px 24px' }}>
            <h2 style={{ fontFamily: brico, fontSize: 22, fontWeight: 700, marginBottom: 20, textAlign: 'center' as const }}>Featured Products</h2>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${productCols}, 1fr)`, gap: 16 }}>
              {products.slice(0, 6).map((p, i) => {
                const copyProduct = copy.products?.find(cp => cp.id === p.id);
                const reviewCount = (parseInt(p.id?.slice(-4) || '0', 16) % 200) + 50;
                return (
                  <div key={p.id || i} style={{ borderRadius: 10, overflow: 'hidden' as const, border: `1px solid ${borderColor}`, background: surfaceColor }}>
                    <div style={{ height: 120, background: isLightBg ? '#f5f5f5' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center' as const, justifyContent: 'center' as const }}>
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.product_title} style={{ width: '100%', height: '100%', objectFit: 'cover' as const }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div style={{ fontSize: 32, opacity: 0.3 }}>📦</div>
                      )}
                    </div>
                    <div style={{ padding: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, overflow: 'hidden' as const, textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{copyProduct?.seo_title || p.product_title}</div>
                      <div style={{ fontSize: 11, color: mutedColor, marginBottom: 6 }}>★★★★★ ({reviewCount})</div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: primaryColor, marginBottom: 8 }}>${(p.price_aud || 49.95).toFixed(2)}</div>
                      <button style={{ width: '100%', padding: '8px', borderRadius: 6, border: 'none', background: btnColor, color: isLightBg ? '#fff' : bgColor, fontSize: 12, fontWeight: 700, cursor: 'pointer' as const }}>Add to Cart</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Trust badges */}
        {copy.trust_badges && (
          <div style={{ display: 'flex', justifyContent: 'center' as const, gap: 24, padding: '20px 24px', borderTop: `1px solid ${borderColor}` }}>
            {copy.trust_badges.slice(0, 4).map((badge, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center' as const, gap: 6, fontSize: 11, color: mutedColor }}>
                <span>✓</span> {badge}
              </div>
            ))}
          </div>
        )}

        {/* How it works */}
        <div style={{ padding: '30px 24px', background: surfaceColor }}>
          <h3 style={{ fontFamily: brico, fontSize: 18, fontWeight: 700, marginBottom: 16, textAlign: 'center' as const }}>How It Works</h3>
          <div style={{ display: 'flex', justifyContent: 'center' as const, gap: 32 }}>
            {['Browse products', 'Add to cart', 'We ship to you'].map((step, i) => (
              <div key={i} style={{ textAlign: 'center' as const }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: primaryColor, color: isLightBg ? '#fff' : bgColor, display: 'flex', alignItems: 'center' as const, justifyContent: 'center' as const, fontWeight: 700, fontSize: 14, margin: '0 auto 8px' }}>{i + 1}</div>
                <div style={{ fontSize: 12 }}>{step}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Reviews */}
        <div style={{ padding: '30px 24px' }}>
          <h3 style={{ fontFamily: brico, fontSize: 18, fontWeight: 700, marginBottom: 16, textAlign: 'center' as const }}>What Our Customers Say</h3>
          <div style={{ display: 'grid', gridTemplateColumns: isMobilePreview ? '1fr' : 'repeat(3, 1fr)', gap: 12 }}>
            {getStoreReviews(storeName).map((review, i) => (
              <div key={i} style={{ padding: 14, borderRadius: 10, border: `1px solid ${borderColor}`, background: surfaceColor }}>
                <div style={{ fontSize: 12, color: primaryColor, marginBottom: 6 }}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
                <div style={{ fontSize: 12, color: textColor, marginBottom: 8, lineHeight: 1.5 }}>{review.text}</div>
                <div style={{ fontSize: 11, color: mutedColor }}>{review.name} · {review.date}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        {copy.faq && copy.faq.length > 0 && (
          <div style={{ padding: '30px 24px', background: surfaceColor }}>
            <h3 style={{ fontFamily: brico, fontSize: 18, fontWeight: 700, marginBottom: 16, textAlign: 'center' as const }}>FAQ</h3>
            {copy.faq.slice(0, 5).map((item, i) => (
              <div key={i} style={{ borderBottom: `1px solid ${borderColor}`, padding: '12px 0' }}>
                <div onClick={() => setExpandedFaq(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])} style={{ display: 'flex', justifyContent: 'space-between' as const, cursor: 'pointer' as const, fontSize: 13, fontWeight: 600 }}>
                  {item.question}
                  <span>{expandedFaq.includes(i) ? '−' : '+'}</span>
                </div>
                {expandedFaq.includes(i) && <div style={{ fontSize: 12, color: mutedColor, marginTop: 8 }}>{item.answer}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: '30px 24px', borderTop: `1px solid ${borderColor}`, textAlign: 'center' as const, fontSize: 11, color: mutedColor }}>
          © 2026 {storeName}. All rights reserved. · Privacy Policy · Terms of Service
        </div>
      </div>
    </div>
  );
}

// ── Confetti animation CSS ─────────────────────────────────────
const confettiCSS = `
@keyframes confetti-fall {
  0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
@keyframes progress-fill {
  0% { width: 0%; }
  100% { width: 100%; }
}
`;

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════
export default function StoreBuilder() {
  const { session, subPlan, subStatus } = useAuth();
  const [, setLocation] = useLocation();

  // ── Auth & subscription ──────────────────────────────────────
  const isAdmin = session?.user?.email === 'maximusmajorka@gmail.com';
  const isBuilder = (subPlan === 'builder' && subStatus === 'active') || isAdmin;
  const isScale = (subPlan === 'scale' && subStatus === 'active') || isAdmin;
  const isPaid = isBuilder || isScale;
  const storeLimit = isScale ? Infinity : isBuilder ? 3 : 0;

  // ── Mode state ───────────────────────────────────────────────
  const [mode, setMode] = useState<Mode>('select');
  const [upgradeModal, setUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('');

  // ── AI wizard state ──────────────────────────────────────────
  const [aiStep, setAiStep] = useState<AIStep>('setup');
  const [storeName, setStoreName] = useState('');
  const [niche, setNiche] = useState('');
  const [targetMarket, setTargetMarket] = useState('Australia');
  const [tone, setTone] = useState('Professional');
  const [primaryColor, setPrimaryColor] = useState('#6366F1');

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

  // Template
  const [selectedTemplate, setSelectedTemplate] = useState('bold');

  // Preview
  const [isMobilePreview, setIsMobilePreview] = useState(false);

  // Publish
  const [subdomain, setSubdomain] = useState('');
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);
  const [customDomain, setCustomDomain] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{ success: boolean; liveUrl?: string; storeId?: string } | null>(null);

  // Shopify sync
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

  // ── Fetch existing stores on mount ───────────────────────────
  useEffect(() => {
    if (!authToken) return;
    fetch('/api/shopify/status', { headers: authHeaders })
      .then(r => r.json())
      .then(d => { if (d.connected) setShopifyStatus({ connected: true, shop: d.shop }); })
      .catch(() => {});

    // Load existing stores from generated_stores
    const supabaseUrl = (import.meta as unknown as Record<string, Record<string, string>>).env?.VITE_SUPABASE_URL;
    const supabaseKey = (import.meta as unknown as Record<string, Record<string, string>>).env?.VITE_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      fetch(`${supabaseUrl}/rest/v1/generated_stores?select=id,store_name,subdomain,created_at,published&order=created_at.desc&limit=10&subdomain=not.ilike.*test*&subdomain=not.ilike.*qa*`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${authToken}` },
      })
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setExistingStores(data.filter((s: any) => s.store_name && !s.store_name.toLowerCase().includes('test'))); })
        .catch(() => {});
    }
  }, [authToken]);

  // ── Subscription gate ────────────────────────────────────────
  if (!isPaid) {
    return <UpgradeModal isOpen={true} onClose={() => setLocation('/app/dashboard')} feature="Store Builder" reason="Build and launch your dropshipping store" />;
  }

  // ── Fetch products for niche ─────────────────────────────────
  const fetchNicheProducts = async (selectedNiche: string) => {
    setLoadingProducts(true);
    try {
      const res = await fetch(`/api/store-builder/products-for-niche?niche=${encodeURIComponent(selectedNiche)}`, { headers: authHeaders });
      const data = await res.json();
      setNicheProducts(data.products || []);
    } catch { /* silent */ }
    setLoadingProducts(false);
  };

  // ── Generate copy ────────────────────────────────────────────
  const generateCopy = async () => {
    setGenerating(true);
    setAiStep('generating');
    setGenStep(0);

    const steps = [
      { msg: 'Analysing your niche...', delay: 0 },
      { msg: 'Writing your store copy...', delay: 1500 },
      { msg: 'Optimising product descriptions...', delay: 3000 },
      { msg: 'Almost ready...', delay: 4500 },
    ];
    steps.forEach((s, i) => { setTimeout(() => setGenStep(i), s.delay); });

    try {
      const res = await fetch('/api/store-builder/generate-copy', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          storeName, niche, targetMarket, tone,
          products: selectedProducts.map(p => ({ id: p.id, product_title: p.product_title, price_aud: p.price_aud })),
        }),
      });
      const data = await res.json();
      if (data.copy) {
        setGeneratedCopy(data.copy);
        setTimeout(() => { setAiStep('template'); setGenerating(false); }, 1000);
      } else {
        setGenerating(false);
        setAiStep('products');
      }
    } catch {
      setGenerating(false);
      setAiStep('products');
    }
  };

  // ── Check subdomain ──────────────────────────────────────────
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
    const t = setTimeout(() => checkSubdomain(subdomain), 500);
    return () => clearTimeout(t);
  }, [subdomain]);

  // ── Publish store ────────────────────────────────────────────
  const publishStore = async () => {
    if (!subdomainAvailable) return;
    setPublishing(true);
    try {
      const res = await fetch('/api/store-builder/publish', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          storeName, niche, targetMarket, tone, primaryColor,
          templateId: selectedTemplate,
          selectedProducts: selectedProducts.map(p => ({ id: p.id, product_title: p.product_title, price_aud: p.price_aud, image_url: p.image_url })),
          generatedCopy, subdomain, customDomain, mode: 'ai',
        }),
      });
      const data = await res.json();
      setPublishResult(data);
    } catch {
      setPublishResult({ success: false });
    }
    setPublishing(false);
  };

  // ── Shopify handlers ─────────────────────────────────────────
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

  // ── Marketplace handlers ─────────────────────────────────────
  const fetchMpProfile = async () => {
    try {
      const res = await fetch('/api/marketplace/profile', { headers: authHeaders });
      const data = await res.json();
      if (data.profile) {
        setMpProfile(data.profile);
        setMpStep('dashboard');
        // Fetch listings + orders + earnings
        const [listRes, ordRes, earnRes] = await Promise.all([
          fetch('/api/marketplace/listings', { headers: authHeaders }),
          fetch('/api/marketplace/orders', { headers: authHeaders }),
          fetch('/api/marketplace/earnings', { headers: authHeaders }),
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
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ username: mpUsername, display_name: mpDisplayName, bio: mpBio }),
      });
      const data = await res.json();
      if (data.profile) { setMpProfile(data.profile); setMpStep('dashboard'); }
    } catch { /* silent */ }
  };

  // ── Input style ──────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.04)', color: textPrimary, fontSize: 14,
    fontFamily: dmSans, outline: 'none', boxSizing: 'border-box',
  };

  const btnPrimary: React.CSSProperties = {
    padding: '14px 28px', borderRadius: 10, border: 'none', cursor: 'pointer',
    background: accent, color: '#fff', fontFamily: brico, fontWeight: 700, fontSize: 15,
    transition: 'all 150ms',
  };

  const btnSecondary: React.CSSProperties = {
    padding: '14px 28px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)',
    background: 'transparent', color: textSecondary, fontFamily: brico, fontWeight: 600,
    fontSize: 14, cursor: 'pointer', transition: 'all 150ms',
  };

  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: '100vh', background: bgDark, color: textPrimary, fontFamily: dmSans }}>
      <Helmet><title>Store Builder — Majorka</title><meta name="robots" content="noindex, nofollow" /></Helmet>
      <style>{confettiCSS}</style>

      {/* Upgrade modal */}
      {upgradeModal && <UpgradeModal isOpen={true} onClose={() => setUpgradeModal(false)} scaleOnly={true} reason={upgradeReason} feature="Majorka Marketplace" />}

      {/* ══════ MODE SELECTION ══════ */}
      {mode === 'select' && (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '60px 24px' }}>
          <div style={{ textAlign: 'center' as const, marginBottom: 48 }}>
            <h1 style={{ fontFamily: brico, fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 700, marginBottom: 12 }}>Store Builder</h1>
            <p style={{ color: textSecondary, fontSize: 16 }}>Zero to live dropshipping store in under 7 minutes.</p>
          </div>

          {/* Three mode cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 40 }}>
            {/* Mode A — Build with AI */}
            <div
              onClick={() => { setMode('ai'); setAiStep('setup'); }}
              style={{ background: cardBg, border: cardBorder, borderRadius: 24, padding: 32, cursor: 'pointer', transition: 'all 200ms' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ fontSize: 36, marginBottom: 16 }}>🤖</div>
              <div style={{ fontFamily: brico, fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Build with AI</div>
              <div style={{ fontSize: 13, color: accent, marginBottom: 8 }}>Zero to store in 7 minutes</div>
              <div style={{ fontSize: 14, color: textSecondary, marginBottom: 20, lineHeight: 1.5 }}>AI builds your store from your niche and products</div>
              <button style={{ ...btnPrimary, width: '100%' }}>Start Building →</button>
            </div>

            {/* Mode B — Connect Shopify */}
            <div
              onClick={() => { setMode('shopify'); syncShopify(); fetchTopProducts(); }}
              style={{ background: cardBg, border: cardBorder, borderRadius: 24, padding: 32, cursor: 'pointer', transition: 'all 200ms' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ fontSize: 36, marginBottom: 16 }}>🛍️</div>
              <div style={{ fontFamily: brico, fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Connect Shopify</div>
              <div style={{ fontSize: 13, color: accent, marginBottom: 8 }}>Already on Shopify?</div>
              <div style={{ fontSize: 14, color: textSecondary, marginBottom: 20, lineHeight: 1.5 }}>Sync your products and orders. Keep Shopify, add Majorka's intelligence layer.</div>
              <button style={{ ...btnPrimary, width: '100%' }}>Connect Store →</button>
            </div>

            {/* Mode C — Sell on Majorka */}
            <div
              onClick={() => {
                if (!isScale) { setUpgradeReason('Majorka Marketplace is available on Scale plan'); setUpgradeModal(true); return; }
                setMode('marketplace'); fetchMpProfile();
              }}
              style={{ background: cardBg, border: cardBorder, borderRadius: 24, padding: 32, cursor: 'pointer', transition: 'all 200ms', position: 'relative' as const }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ position: 'absolute' as const, top: 16, right: 16, background: 'rgba(139,92,246,0.15)', color: violet, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999 }}>Scale Only</div>
              <div style={{ fontSize: 36, marginBottom: 16 }}>🏪</div>
              <div style={{ fontFamily: brico, fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Sell on Majorka</div>
              <div style={{ fontSize: 13, color: violet, marginBottom: 8 }}>No Shopify needed</div>
              <div style={{ fontSize: 14, color: textSecondary, marginBottom: 20, lineHeight: 1.5 }}>List products. We handle the storefront. 5% platform fee per sale.</div>
              <button style={{ ...btnPrimary, width: '100%', background: violet }}>Start Selling →</button>
            </div>
          </div>

          {/* Existing stores */}
          {existingStores.length > 0 && (
            <div>
              <div style={{ textAlign: 'center' as const, color: textMuted, fontSize: 13, marginBottom: 16, cursor: 'pointer' }}>Or continue to your existing stores ↓</div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                {existingStores.map(store => (
                  <div key={store.id} style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center' as const, justifyContent: 'space-between' as const }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{store.store_name}</div>
                      <div style={{ fontSize: 12, color: textMuted }}>{store.subdomain ? `${store.subdomain}.majorka.io` : 'Not published'} · {new Date(store.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</div>
                    </div>
                    {store.published && store.subdomain && (
                      <a href={`https://${store.subdomain}.majorka.io`} target="_blank" rel="noopener noreferrer" style={{ color: accent, fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center' as const, gap: 4 }}>
                        <ExternalLink size={12} /> View
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state competitive copy */}
          {existingStores.length === 0 && isBuilder && (
            <div style={{ textAlign: 'center' as const, padding: 32, background: 'rgba(99,102,241,0.05)', borderRadius: 16, border: '1px solid rgba(99,102,241,0.1)' }}>
              <p style={{ fontFamily: brico, fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Shopify takes hours and charges 2% on every sale.</p>
              <p style={{ color: textSecondary, fontSize: 14 }}>Majorka takes 7 minutes and charges nothing. Build your first store →</p>
            </div>
          )}
        </div>
      )}

      {/* ══════ MODE A: AI WIZARD ══════ */}
      {mode === 'ai' && (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
          {/* Back button */}
          <button onClick={() => setMode('select')} style={{ ...btnSecondary, padding: '8px 16px', fontSize: 13, marginBottom: 24 }}>← Back</button>

          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
            {(['setup', 'products', 'generating', 'template', 'preview', 'publish'] as AIStep[]).map((step, i) => (
              <div key={step} style={{ flex: 1, height: 4, borderRadius: 2, background: (['setup', 'products', 'generating', 'template', 'preview', 'publish'] as AIStep[]).indexOf(aiStep) >= i ? accent : 'rgba(255,255,255,0.08)' }} />
            ))}
          </div>

          {/* ── STEP 1: STORE SETUP ── */}
          {aiStep === 'setup' && (
            <div>
              <h2 style={{ fontFamily: brico, fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Set up your store</h2>
              <p style={{ color: textSecondary, marginBottom: 32 }}>Tell us about your brand. AI will generate everything from this.</p>

              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: textSecondary, marginBottom: 6 }}>Store Name *</label>
                  <input value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="e.g. PawsAustralia" style={inputStyle} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: textSecondary, marginBottom: 6 }}>Niche *</label>
                  <select value={niche} onChange={e => setNiche(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' as const }}>
                    <option value="">Select a niche...</option>
                    {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: textSecondary, marginBottom: 8 }}>Target Market</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                    {MARKETS.map(m => <PillButton key={m} label={m} selected={targetMarket === m} onClick={() => setTargetMarket(m)} />)}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: textSecondary, marginBottom: 8 }}>Brand Tone</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                    {TONES.map(t => <PillButton key={t} label={t} selected={tone === t} onClick={() => setTone(t)} />)}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: textSecondary, marginBottom: 8 }}>Primary Colour</label>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' as const }}>
                    {COLOR_SWATCHES.map(s => (
                      <div key={s.color} onClick={() => setPrimaryColor(s.color)} style={{
                        width: 32, height: 32, borderRadius: '50%', background: s.color, cursor: 'pointer' as const,
                        border: primaryColor === s.color ? '3px solid #fff' : '3px solid transparent',
                        boxShadow: primaryColor === s.color ? `0 0 0 2px ${s.color}` : 'none',
                        transition: 'all 150ms',
                      }} title={s.label} />
                    ))}
                    <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} style={{ width: 32, height: 32, border: 'none', background: 'transparent', cursor: 'pointer' }} />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' as const }}>
                <button
                  onClick={() => { if (storeName && niche) { setAiStep('products'); fetchNicheProducts(niche); } }}
                  disabled={!storeName || !niche}
                  style={{ ...btnPrimary, opacity: !storeName || !niche ? 0.4 : 1, cursor: !storeName || !niche ? 'not-allowed' : 'pointer' }}
                >Continue → Products</button>
              </div>
            </div>
          )}

          {/* ── STEP 2: PRODUCT SELECTION ── */}
          {aiStep === 'products' && (
            <div>
              <h2 style={{ fontFamily: brico, fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Select products</h2>
              <p style={{ color: textSecondary, marginBottom: 24 }}>Choose 1-10 products for your store. These are top performers in {niche}.</p>

              {loadingProducts ? (
                <div style={{ textAlign: 'center' as const, padding: 40 }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} color={accent} /></div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
                  {nicheProducts.map(p => {
                    const isSelected = selectedProducts.some(sp => sp.id === p.id);
                    const scoreColor = (p.winning_score || 0) > 70 ? '#10B981' : (p.winning_score || 0) > 50 ? '#F59E0B' : textMuted;
                    return (
                      <div key={p.id} onClick={() => {
                        if (isSelected) setSelectedProducts(prev => prev.filter(sp => sp.id !== p.id));
                        else if (selectedProducts.length < 10) setSelectedProducts(prev => [...prev, p]);
                      }} style={{
                        background: cardBg, border: isSelected ? `2px solid ${accent}` : cardBorder, borderRadius: 14, padding: 12,
                        cursor: 'pointer' as const, transition: 'all 150ms', position: 'relative' as const,
                      }}>
                        {isSelected && (
                          <div style={{ position: 'absolute' as const, top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center' as const, justifyContent: 'center' as const }}>
                            <Check size={14} color="#fff" />
                          </div>
                        )}
                        <div style={{ width: 80, height: 80, borderRadius: 8, overflow: 'hidden' as const, background: 'rgba(255,255,255,0.05)', marginBottom: 8 }}>
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.product_title} style={{ width: '100%', height: '100%', objectFit: 'cover' as const }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' as const, justifyContent: 'center' as const, fontSize: 24, opacity: 0.3 }}>📦</div>
                          )}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, overflow: 'hidden' as const, textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, lineHeight: 1.3 }}>{p.product_title}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: accent, marginBottom: 4 }}>${(p.price_aud || 0).toFixed(2)}</div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' as const }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: scoreColor, background: `${scoreColor}15`, padding: '2px 6px', borderRadius: 4 }}>{p.winning_score || 0}</span>
                          {p.trend === 'rising' && <span style={{ fontSize: 11 }}>🔥 Trending</span>}
                        </div>
                      </div>
                    );
                  })}

                  {/* Add manually card */}
                  <div onClick={() => setCustomProductModal(true)} style={{
                    background: 'transparent', border: '2px dashed rgba(255,255,255,0.12)', borderRadius: 14, padding: 12,
                    cursor: 'pointer' as const, display: 'flex', flexDirection: 'column' as const, alignItems: 'center' as const, justifyContent: 'center' as const, minHeight: 180,
                  }}>
                    <Plus size={24} color={textMuted} style={{ marginBottom: 8 }} />
                    <div style={{ fontSize: 13, color: textMuted }}>Add Custom Product</div>
                  </div>
                </div>
              )}

              <div style={{ fontSize: 13, color: textMuted, marginBottom: 16 }}>{selectedProducts.length} of 10 products selected</div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setAiStep('setup')} style={btnSecondary}>← Back</button>
                <button onClick={generateCopy} disabled={selectedProducts.length === 0} style={{ ...btnPrimary, flex: 1, opacity: selectedProducts.length === 0 ? 0.4 : 1 }}>Generate Store Copy →</button>
              </div>
            </div>
          )}

          {/* ── STEP 3: AI GENERATION ── */}
          {aiStep === 'generating' && (
            <div style={{ textAlign: 'center' as const, padding: '60px 0' }}>
              <Loader2 size={32} color={accent} style={{ animation: 'spin 1s linear infinite', marginBottom: 24 }} />
              <h2 style={{ fontFamily: brico, fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Building your store...</h2>
              <div style={{ maxWidth: 400, margin: '0 auto', marginBottom: 24 }}>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' as const }}>
                  <div style={{ height: '100%', background: `linear-gradient(90deg, ${accent}, ${violet})`, borderRadius: 999, animation: 'progress-fill 6s ease-out forwards' }} />
                </div>
              </div>
              {['Analysing your niche...', 'Writing your store copy...', 'Optimising product descriptions...', 'Almost ready...'].map((msg, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center' as const, gap: 10, justifyContent: 'center' as const, marginBottom: 8 }}>
                  <span style={{ fontSize: 14 }}>{i < genStep ? '✅' : i === genStep ? '⏳' : '○'}</span>
                  <span style={{ fontSize: 14, color: i <= genStep ? textPrimary : textMuted }}>{msg}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── STEP 4: TEMPLATE SELECTION ── */}
          {aiStep === 'template' && (
            <div>
              <h2 style={{ fontFamily: brico, fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Choose a template</h2>
              <p style={{ color: textSecondary, marginBottom: 24 }}>Each template is optimised for conversions. Pick one that matches your brand.</p>

              {/* Competitive callout */}
              {generatedCopy && (
                <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
                  <p style={{ fontSize: 13, color: accent }}>✅ Store copy generated! Built in under 7 minutes. Powered by the same product data that found your winners.</p>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
                {TEMPLATES.map(tpl => (
                  <div key={tpl.id} onClick={() => setSelectedTemplate(tpl.id)} style={{
                    background: cardBg, border: selectedTemplate === tpl.id ? `2px solid ${accent}` : cardBorder, borderRadius: 16, overflow: 'hidden' as const,
                    cursor: 'pointer' as const, transition: 'all 150ms',
                  }}>
                    <TemplatePreview preview={tpl.preview} />
                    <div style={{ padding: 14 }}>
                      <div style={{ fontFamily: brico, fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{tpl.name}</div>
                      <div style={{ fontSize: 12, color: textSecondary, marginBottom: 8 }}>{tpl.style}</div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const }}>
                        {tpl.bestFor.map(tag => (
                          <span key={tag} style={{ fontSize: 10, fontWeight: 600, color: accent, background: 'rgba(99,102,241,0.1)', padding: '2px 6px', borderRadius: 4 }}>{tag}</span>
                        ))}
                      </div>
                      {selectedTemplate === tpl.id && (
                        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center' as const, gap: 6, color: accent, fontSize: 12, fontWeight: 700 }}>
                          <Check size={14} /> Selected
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Competitive callout */}
              <div style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.1)', borderRadius: 10, padding: '12px 16px', marginBottom: 24 }}>
                <p style={{ fontSize: 12, color: textMuted }}>Every template includes urgency triggers, trust badges, and mobile-first layouts that PageFly charges $99/mo for. Included on every Majorka store.</p>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setAiStep('products')} style={btnSecondary}>← Back</button>
                <button onClick={() => setAiStep('preview')} style={{ ...btnPrimary, flex: 1 }}>Preview Store →</button>
              </div>
            </div>
          )}

          {/* ── STEP 5: PREVIEW & EDIT ── */}
          {aiStep === 'preview' && generatedCopy && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 20 }}>
                <h2 style={{ fontFamily: brico, fontSize: 28, fontWeight: 700 }}>Preview your store</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setIsMobilePreview(false)} style={{ padding: '6px 10px', borderRadius: 6, border: !isMobilePreview ? `1px solid ${accent}` : '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: !isMobilePreview ? accent : textMuted, cursor: 'pointer' as const }}><Monitor size={16} /></button>
                  <button onClick={() => setIsMobilePreview(true)} style={{ padding: '6px 10px', borderRadius: 6, border: isMobilePreview ? `1px solid ${accent}` : '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: isMobilePreview ? accent : textMuted, cursor: 'pointer' as const }}><Smartphone size={16} /></button>
                  <button onClick={generateCopy} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: textSecondary, cursor: 'pointer' as const, fontSize: 12, display: 'flex', alignItems: 'center' as const, gap: 4 }}><RefreshCw size={12} /> Regenerate</button>
                </div>
              </div>

              {/* Colour palette switcher */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' as const }}>
                <span style={{ fontSize: 12, color: textMuted }}>Colour:</span>
                {COLOR_SWATCHES.map(s => (
                  <div key={s.color} onClick={() => setPrimaryColor(s.color)} style={{
                    width: 24, height: 24, borderRadius: '50%', background: s.color, cursor: 'pointer' as const,
                    border: primaryColor === s.color ? '2px solid #fff' : '2px solid transparent',
                  }} />
                ))}
              </div>

              {/* Preview */}
              <div style={{ display: 'flex', justifyContent: 'center' as const, marginBottom: 24 }}>
                <StorePreview
                  copy={generatedCopy}
                  template={TEMPLATES.find(t => t.id === selectedTemplate) || TEMPLATES[1]}
                  products={selectedProducts}
                  storeName={storeName}
                  primaryColor={primaryColor}
                  isMobilePreview={isMobilePreview}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setAiStep('template')} style={btnSecondary}>← Back</button>
                <button onClick={() => setAiStep('publish')} style={{ ...btnPrimary, flex: 1 }}>Go Live →</button>
              </div>
            </div>
          )}

          {/* ── STEP 6: GO LIVE ── */}
          {aiStep === 'publish' && !publishResult && (
            <div>
              <h2 style={{ fontFamily: brico, fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Go live</h2>
              <p style={{ color: textSecondary, marginBottom: 24 }}>Choose your store URL and publish.</p>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: textSecondary, marginBottom: 6 }}>Subdomain</label>
                <div style={{ display: 'flex', alignItems: 'center' as const, gap: 0 }}>
                  <input
                    value={subdomain}
                    onChange={e => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="yourstore"
                    style={{ ...inputStyle, borderTopRightRadius: 0, borderBottomRightRadius: 0, flex: 1 }}
                  />
                  <div style={{ background: 'rgba(255,255,255,0.08)', padding: '12px 14px', borderRadius: '0 8px 8px 0', border: '1px solid rgba(255,255,255,0.12)', borderLeft: 'none', fontSize: 14, color: textMuted }}>.majorka.io</div>
                </div>
                {subdomain.length >= 3 && (
                  <div style={{ marginTop: 6, fontSize: 12, color: subdomainAvailable === true ? '#10B981' : subdomainAvailable === false ? '#EF4444' : textMuted }}>
                    {checkingSubdomain ? 'Checking...' : subdomainAvailable === true ? '✓ Available' : subdomainAvailable === false ? '✗ Already taken' : ''}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: textSecondary, marginBottom: 6 }}>Custom domain (optional)</label>
                <p style={{ fontSize: 12, color: textMuted, marginBottom: 8 }}>Point your CNAME to: stores.majorka.io</p>
                <input value={customDomain} onChange={e => setCustomDomain(e.target.value)} placeholder="shop.yourdomain.com" style={inputStyle} />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setAiStep('preview')} style={btnSecondary}>← Back</button>
                <button
                  onClick={publishStore}
                  disabled={!subdomainAvailable || publishing}
                  style={{ ...btnPrimary, flex: 1, opacity: !subdomainAvailable ? 0.4 : 1, display: 'flex', alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8 }}
                >
                  {publishing ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Publishing...</> : 'Publish Store 🚀'}
                </button>
              </div>
            </div>
          )}

          {/* ── PUBLISH SUCCESS ── */}
          {aiStep === 'publish' && publishResult && (
            <div style={{ textAlign: 'center' as const, padding: '40px 0' }}>
              {/* Confetti */}
              <div style={{ position: 'fixed' as const, inset: 0, pointerEvents: 'none' as const, zIndex: 100 }}>
                {Array.from({ length: 30 }).map((_, i) => (
                  <div key={i} style={{
                    position: 'absolute' as const,
                    left: `${(i * 37) % 100}%`,
                    top: '-10px',
                    width: 8, height: 8,
                    borderRadius: i % 2 === 0 ? '50%' : '0',
                    background: [accent, violet, '#F43F5E', '#10B981', '#F59E0B', '#06B6D4'][i % 6],
                    animation: `confetti-fall ${2 + (i % 3)}s ease-in ${(i * 0.1)}s forwards`,
                  }} />
                ))}
              </div>

              <div style={{ fontSize: 64, marginBottom: 16 }}>🚀</div>
              <h2 style={{ fontFamily: brico, fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Your store is live!</h2>
              {publishResult.liveUrl && (
                <a href={publishResult.liveUrl} target="_blank" rel="noopener noreferrer" style={{ color: accent, fontSize: 16, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' as const, gap: 6, marginBottom: 24 }}>
                  {publishResult.liveUrl} <ExternalLink size={16} />
                </a>
              )}

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' as const, marginTop: 24 }}>
                <button onClick={() => {
                  if (publishResult.liveUrl) navigator.clipboard.writeText(publishResult.liveUrl);
                }} style={{ ...btnSecondary, display: 'flex', alignItems: 'center' as const, gap: 6 }}>
                  <Copy size={14} /> Share your store
                </button>
                <button onClick={() => setLocation('/app/ads-manager')} style={btnPrimary}>Launch an Ad Campaign →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════ MODE B: SHOPIFY SYNC ══════ */}
      {mode === 'shopify' && (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
          <button onClick={() => setMode('select')} style={{ ...btnSecondary, padding: '8px 16px', fontSize: 13, marginBottom: 24 }}>← Back</button>

          <div style={{ textAlign: 'center' as const, marginBottom: 32 }}>
            <h2 style={{ fontFamily: brico, fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Already on Shopify? Good — keep it.</h2>
            <p style={{ color: textSecondary, fontSize: 15 }}>Majorka gives you the product intelligence, profit tracking, and Meta ads that Shopify doesn't.</p>
          </div>

          {!shopifyStatus.connected ? (
            <div style={{ background: cardBg, border: cardBorder, borderRadius: 20, padding: 32 }}>
              <div style={{ fontSize: 36, marginBottom: 16, textAlign: 'center' as const }}>🛍️</div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: textSecondary, marginBottom: 6 }}>Enter your Shopify store URL</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input value={shopifyDomain} onChange={e => setShopifyDomain(e.target.value)} placeholder="yourstore.myshopify.com" style={{ ...inputStyle, flex: 1 }} />
                <button onClick={connectShopify} style={btnPrimary}>Connect Store →</button>
              </div>
              <p style={{ fontSize: 12, color: textMuted }}>We request read access to products, orders, and inventory. We never modify your store without permission.</p>
            </div>
          ) : (
            <div>
              {/* Connected status */}
              <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 16, padding: 20, marginBottom: 24, display: 'flex', alignItems: 'center' as const, justifyContent: 'space-between' as const }}>
                <div style={{ display: 'flex', alignItems: 'center' as const, gap: 10 }}>
                  <Check size={18} color="#10B981" />
                  <span style={{ fontWeight: 600 }}>Connected to {shopifyStatus.shop}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={syncShopify} disabled={syncing} style={{ ...btnSecondary, padding: '8px 14px', fontSize: 12, display: 'flex', alignItems: 'center' as const, gap: 4 }}>
                    {syncing ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={12} />} Sync Now
                  </button>
                </div>
              </div>

              {/* Synced products */}
              {shopifyCatalog.length > 0 && (
                <div style={{ marginBottom: 32 }}>
                  <h3 style={{ fontFamily: brico, fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Your Shopify Products</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                    {shopifyCatalog.map(p => (
                      <div key={p.id} style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: 12 }}>
                        <div style={{ width: '100%', height: 100, borderRadius: 8, overflow: 'hidden' as const, background: 'rgba(255,255,255,0.05)', marginBottom: 8 }}>
                          {p.image_url && <img src={p.image_url} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' as const }} />}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, overflow: 'hidden' as const, textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{p.title}</div>
                        <div style={{ fontSize: 12, color: accent, fontWeight: 700 }}>${p.price_aud?.toFixed(2)}</div>
                        <span style={{ fontSize: 10, color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: 4, marginTop: 4, display: 'inline-block' }}>In Your Shopify</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Push winning products to Shopify */}
              {topProducts.length > 0 && (
                <div>
                  <h3 style={{ fontFamily: brico, fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Push winning products to your Shopify store</h3>
                  <p style={{ color: textSecondary, fontSize: 13, marginBottom: 12 }}>Add Majorka's top products directly as drafts in your Shopify catalog.</p>
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                    {topProducts.map(p => (
                      <div key={p.id} style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center' as const, gap: 12 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden' as const, background: 'rgba(255,255,255,0.05)', flexShrink: 0 }}>
                          {p.image_url && <img src={p.image_url} alt={p.product_title} style={{ width: '100%', height: '100%', objectFit: 'cover' as const }} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden' as const, textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{p.product_title}</div>
                          <div style={{ fontSize: 12, color: accent }}>${(p.price_aud || 0).toFixed(2)}</div>
                        </div>
                        <button onClick={async () => {
                          try {
                            await fetch('/api/shopify/push-product', {
                              method: 'POST', headers: authHeaders,
                              body: JSON.stringify({ productId: p.id }),
                            });
                          } catch { /* silent */ }
                        }} style={{ ...btnPrimary, padding: '8px 14px', fontSize: 12 }}>Add to Shopify</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════ MODE C: MARKETPLACE ══════ */}
      {mode === 'marketplace' && (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
          <button onClick={() => setMode('select')} style={{ ...btnSecondary, padding: '8px 16px', fontSize: 13, marginBottom: 24 }}>← Back</button>

          {/* Competitive copy */}
          <div style={{ textAlign: 'center' as const, marginBottom: 32 }}>
            <h2 style={{ fontFamily: brico, fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Sell on Majorka</h2>
            <p style={{ color: textSecondary, fontSize: 14, marginBottom: 8 }}>No Shopify subscription. No monthly fees. Just a 5% platform fee when you make a sale.</p>
            <p style={{ color: textMuted, fontSize: 12 }}>Shopify Basic costs $29/mo + 2% per transaction. Majorka Marketplace costs $0/mo + 5% per sale.</p>
          </div>

          {/* Onboarding */}
          {mpStep === 'onboarding' && (
            <div style={{ background: cardBg, border: cardBorder, borderRadius: 20, padding: 32 }}>
              <h3 style={{ fontFamily: brico, fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Create your seller profile</h3>

              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: textSecondary, marginBottom: 6 }}>Display Name *</label>
                  <input value={mpDisplayName} onChange={e => setMpDisplayName(e.target.value)} placeholder="Your brand name" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: textSecondary, marginBottom: 6 }}>Username *</label>
                  <input value={mpUsername} onChange={e => { const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''); setMpUsername(v); checkMpUsername(v); }} placeholder="your-shop-name" style={inputStyle} />
                  <div style={{ fontSize: 12, color: textMuted, marginTop: 4 }}>Your shop URL: /shop/{mpUsername || 'username'}</div>
                  {mpUsernameAvail !== null && <div style={{ fontSize: 12, color: mpUsernameAvail ? '#10B981' : '#EF4444', marginTop: 4 }}>{mpUsernameAvail ? '✓ Available' : '✗ Taken'}</div>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: textSecondary, marginBottom: 6 }}>Bio</label>
                  <textarea value={mpBio} onChange={e => setMpBio(e.target.value)} placeholder="Tell buyers about your brand..." rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} />
                </div>

                {/* Stripe placeholder */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Connect Stripe to receive payments</div>
                  <p style={{ fontSize: 12, color: textMuted, marginBottom: 12 }}>Stripe Connect setup required — contact support to enable payouts.</p>
                  <button disabled style={{ ...btnPrimary, opacity: 0.4, cursor: 'not-allowed' as const, padding: '10px 20px', fontSize: 13 }}>Connect Stripe →</button>
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <button onClick={createMpProfile} disabled={!mpUsername || !mpDisplayName || mpUsernameAvail === false} style={{ ...btnPrimary, width: '100%', opacity: (!mpUsername || !mpDisplayName) ? 0.4 : 1 }}>Create Profile</button>
              </div>
            </div>
          )}

          {/* Seller Dashboard */}
          {mpStep === 'dashboard' && (
            <div>
              {/* Stats */}
              {mpEarnings && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
                  {[
                    { label: 'Products', value: String(mpListings.length) },
                    { label: 'Total Sales', value: String(mpEarnings.total_sales) },
                    { label: 'Earnings', value: `$${(mpEarnings.net_earnings || 0).toFixed(2)}` },
                    { label: 'Pending', value: String(mpEarnings.pending_orders) },
                  ].map(stat => (
                    <div key={stat.label} style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: 16, textAlign: 'center' as const }}>
                      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: brico, color: accent }}>{stat.value}</div>
                      <div style={{ fontSize: 11, color: textMuted }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Listings */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 12 }}>
                  <h3 style={{ fontFamily: brico, fontSize: 18, fontWeight: 700 }}>Your Listings</h3>
                  <button style={{ ...btnPrimary, padding: '8px 16px', fontSize: 13 }}>+ Add New Listing</button>
                </div>
                {mpListings.length === 0 ? (
                  <div style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: 32, textAlign: 'center' as const, color: textMuted }}>No listings yet. Add your first product to start selling.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                    {mpListings.map(l => (
                      <div key={l.id} style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center' as const, justifyContent: 'space-between' as const }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{l.title}</div>
                          <div style={{ fontSize: 12, color: textMuted }}>${l.price_aud?.toFixed(2)} · {l.inventory_qty} in stock</div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: l.status === 'active' ? '#10B981' : textMuted, background: l.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: 4 }}>{l.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Orders */}
              <div>
                <h3 style={{ fontFamily: brico, fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Orders</h3>
                {mpOrders.length === 0 ? (
                  <div style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: 32, textAlign: 'center' as const, color: textMuted }}>No orders yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                    {mpOrders.map(o => (
                      <div key={o.id} style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center' as const, justifyContent: 'space-between' as const }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{o.buyer_name}</div>
                          <div style={{ fontSize: 12, color: textMuted }}>${o.subtotal?.toFixed(2)} · {new Date(o.created_at).toLocaleDateString('en-AU')}</div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: o.status === 'shipped' ? '#10B981' : '#F59E0B', background: o.status === 'shipped' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', padding: '3px 8px', borderRadius: 4 }}>{o.status}</span>
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
        <div style={{ position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center' as const, justifyContent: 'center' as const, zIndex: 1000, padding: 24 }}>
          <div style={{ background: '#0D1117', borderRadius: 20, padding: 32, maxWidth: 440, width: '90%', border: cardBorder }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 20 }}>
              <h3 style={{ fontFamily: brico, fontSize: 20, fontWeight: 700 }}>Add Custom Product</h3>
              <button onClick={() => setCustomProductModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
              <input value={customTitle} onChange={e => setCustomTitle(e.target.value)} placeholder="Product title *" style={inputStyle} />
              <input value={customImageUrl} onChange={e => setCustomImageUrl(e.target.value)} placeholder="Image URL (optional)" style={inputStyle} />
              <input value={customPrice} onChange={e => setCustomPrice(e.target.value)} placeholder="Price (AUD)" type="number" style={inputStyle} />
              <textarea value={customDesc} onChange={e => setCustomDesc(e.target.value)} placeholder="Description (optional)" rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} />
            </div>
            <button onClick={() => {
              if (!customTitle) return;
              const product: CustomProduct = {
                id: `custom-${Date.now()}`,
                product_title: customTitle,
                image_url: customImageUrl || null,
                price_aud: parseFloat(customPrice) || null,
                winning_score: null,
                trend: null,
                category: null,
                isCustom: true,
              };
              setSelectedProducts(prev => [...prev, product]);
              setCustomTitle(''); setCustomImageUrl(''); setCustomPrice(''); setCustomDesc('');
              setCustomProductModal(false);
            }} disabled={!customTitle} style={{ ...btnPrimary, width: '100%', marginTop: 16, opacity: !customTitle ? 0.4 : 1 }}>Add Product</button>
          </div>
        </div>
      )}
    </div>
  );
}
