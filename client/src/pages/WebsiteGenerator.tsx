import JSZip from 'jszip';
import {
  Check,
  ChevronRight,
  Clipboard,
  Code2,
  Copy,
  Download,
  ExternalLink,
  FileArchive,
  FileCode,
  FileText,
  FolderOpen,
  Globe,
  Loader2,
  Monitor,
  Package,
  Rocket,
  Share2,
  ShoppingBag,
  Smartphone,
  StickyNote,
  Terminal,
  X,
  Zap,
} from 'lucide-react';
import { lazy, useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

// Lazy-load heavy syntax highlighter to keep initial bundle small
const SyntaxHighlighter = lazy(() =>
  import('react-syntax-highlighter').then((m) => ({ default: m.Prism as any }))
);
// vscDarkPlus style — loaded lazily via dynamic import where used
let _vscDarkPlus: any = null;
async function getVscDarkPlus() {
  if (!_vscDarkPlus) {
    const mod = await import('react-syntax-highlighter/dist/esm/styles/prism');
    _vscDarkPlus = mod.vscDarkPlus;
  }
  return _vscDarkPlus;
}
// Preload style eagerly but non-blocking
getVscDarkPlus();
// Synchronous fallback — populated after first async load
function useVscDarkPlus() {
  const [style, setStyle] = useState<any>(_vscDarkPlus);
  useEffect(() => { getVscDarkPlus().then(setStyle); }, []);
  return style;
}
import { SaveToProduct } from '@/components/SaveToProduct';
import { getStoredMarket } from '@/contexts/MarketContext';
import { useProduct } from '@/contexts/ProductContext';
import { useActiveProduct } from '@/hooks/useActiveProduct';
import { trackWebsiteGenerated } from '@/lib/analytics';
import { proxyImage } from '@/lib/imageProxy';
import { WEBSITE_TEMPLATES } from '@/lib/website-templates';

// ── AU Store Templates ────────────────────────────────────────────────────────
interface TemplateConfig {
  id: string;
  name: string;
  niche: string;
  audience: string;
  vibe: string;
  color: string;
  emoji: string;
}

const TEMPLATES: TemplateConfig[] = [
  { id: 'bondi-wellness', name: 'Bondi Wellness Co', niche: 'health supplements', audience: '25-40 AU health-conscious women', vibe: 'clean-minimal', color: '#2dd4bf', emoji: '🌿' },
  { id: 'au-pet-collective', name: 'AU Pet Collective', niche: 'pet accessories', audience: 'AU pet owners', vibe: 'warm-playful', color: '#f59e0b', emoji: '🐾' },
  { id: 'gc-fashion', name: 'Gold Coast Fashion', niche: 'streetwear and fashion', audience: '18-30 AU youth', vibe: 'bold-edgy', color: '#7c3aed', emoji: '👟' },
  { id: 'tradie-gear', name: 'Tradie Gear AU', niche: 'workwear and tools', audience: 'AU tradespeople', vibe: 'rugged-functional', color: '#dc2626', emoji: '🔧' },
  { id: 'eco-edit', name: 'The Eco Edit', niche: 'sustainable homeware', audience: '30-45 eco-conscious AU buyers', vibe: 'earthy-minimal', color: '#65a30d', emoji: '🌱' },
  { id: 'aussie-sports', name: 'Aussie Sports Hub', niche: 'sports and outdoor gear', audience: 'AU fitness enthusiasts', vibe: 'energetic', color: '#0ea5e9', emoji: '⚡' },
];

// ── Progress Messages ─────────────────────────────────────────────────────────
const PROGRESS_MESSAGES = [
  '🔍 Analysing your niche...',
  '✍️ Writing AU-optimised copy...',
  '🎨 Applying your template...',
  '🏗️ Building your store preview...',
  '⚡ Almost ready...',
];

// ── Types ─────────────────────────────────────────────────────────────────────
interface GeneratedData {
  storeName?: string;
  tagline?: string;
  headline?: string;
  subheadline?: string;
  features?: ({ title: string; description: string } | string)[];
  ctaText?: string;
  brandStory?: string;
  metaTitle?: string;
  metaDescription?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontStyle?: string;
  heroImageKeyword?: string;
  productBenefits?: string[];
  testimonials?: { name: string; text: string; location: string }[];
  faqs?: { question: string; answer: string }[];
  // Legacy fields (backward compat)
  files?: Record<string, string>;
  about_section?: string;
  cta_primary?: string;
  cta_secondary?: string;
  trust_badges?: string[];
  email_subject?: string;
  meta_description?: string;
}

type Platform = 'shopify' | 'nextjs' | 'react';
type ActiveTab = 'preview' | 'code' | 'copy' | 'deploy' | 'launch';

// ── Preview HTML Template ─────────────────────────────────────────────────────
const PREVIEW_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{storeName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
    body { background: #fff; color: #111; }
    nav { display: flex; justify-content: space-between; align-items: center; padding: 16px 40px; background: #fff; border-bottom: 1px solid #eee; position: sticky; top: 0; z-index: 10; }
    .nav-logo { font-weight: 900; font-size: 20px; color: {primaryColor}; }
    .nav-links { display: flex; gap: 24px; list-style: none; }
    .nav-links a { text-decoration: none; color: #333; font-size: 14px; cursor: pointer; }
    .nav-btn { background: {primaryColor}; color: #fff; padding: 8px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; cursor: pointer; }
    .hero { position: relative; min-height: 520px; display: flex; align-items: center; overflow: hidden; }
    .hero-bg { position: absolute; inset: 0; background: url('https://source.unsplash.com/1200x600/?{heroImageKeyword}') center/cover no-repeat; filter: brightness(0.55); }
    .hero-content { position: relative; z-index: 1; padding: 60px 40px; max-width: 680px; }
    .hero h1 { font-size: 52px; font-weight: 900; color: #fff; line-height: 1.1; margin-bottom: 16px; }
    .hero p { font-size: 18px; color: rgba(255,255,255,0.85); margin-bottom: 32px; max-width: 480px; line-height: 1.6; }
    .hero-cta { display: inline-block; background: {primaryColor}; color: #fff; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 16px; text-decoration: none; cursor: pointer; }
    .features { padding: 80px 40px; background: #f9f9f9; }
    .features h2 { text-align: center; font-size: 32px; font-weight: 800; margin-bottom: 48px; }
    .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; max-width: 960px; margin: 0 auto; }
    .feature-card { background: #fff; padding: 32px 24px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.07); }
    .feature-icon { width: 48px; height: 48px; background: {primaryColor}20; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; font-size: 24px; }
    .feature-card h3 { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
    .feature-card p { font-size: 14px; color: #666; line-height: 1.6; }
    .brand-story { padding: 80px 40px; max-width: 700px; margin: 0 auto; text-align: center; }
    .brand-story h2 { font-size: 28px; font-weight: 800; margin-bottom: 20px; }
    .brand-story p { font-size: 16px; color: #555; line-height: 1.8; }
    .testimonials { padding: 80px 40px; background: {primaryColor}08; }
    .testimonials h2 { text-align: center; font-size: 28px; font-weight: 800; margin-bottom: 48px; }
    .testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 960px; margin: 0 auto; }
    .testimonial-card { background: #fff; padding: 24px; border-radius: 12px; border-left: 4px solid {primaryColor}; }
    .testimonial-card p { font-size: 14px; color: #444; line-height: 1.6; margin-bottom: 16px; font-style: italic; }
    .testimonial-name { font-weight: 700; font-size: 13px; color: #111; }
    .testimonial-location { font-size: 12px; color: #999; }
    .faq { padding: 80px 40px; max-width: 700px; margin: 0 auto; }
    .faq h2 { font-size: 28px; font-weight: 800; margin-bottom: 32px; text-align: center; }
    .faq-item { border-bottom: 1px solid #eee; padding: 20px 0; }
    .faq-q { font-weight: 700; font-size: 15px; margin-bottom: 8px; }
    .faq-a { font-size: 14px; color: #666; line-height: 1.6; }
    footer { background: #111; color: #fff; padding: 40px; text-align: center; }
    footer .footer-logo { font-size: 20px; font-weight: 900; color: {primaryColor}; margin-bottom: 8px; }
    footer p { font-size: 13px; color: #888; }
    @media (max-width: 768px) {
      .features-grid, .testimonials-grid { grid-template-columns: 1fr; }
      .hero h1 { font-size: 34px; }
      nav { padding: 14px 20px; }
      .nav-links { display: none; }
      .features { padding: 60px 20px; }
    }
  </style>
</head>
<body>
  <nav>
    <div class="nav-logo">{storeName}</div>
    <ul class="nav-links">
      <li><a href="#">Shop</a></li>
      <li><a href="#">About</a></li>
      <li><a href="#">Reviews</a></li>
    </ul>
    <a href="#" class="nav-btn">{ctaText}</a>
  </nav>
  <section class="hero">
    <div class="hero-bg"></div>
    <div class="hero-content">
      <h1>{headline}</h1>
      <p>{subheadline}</p>
      <a href="#" class="hero-cta">{ctaText}</a>
    </div>
  </section>
  <section class="features">
    <h2>Why Australians Love {storeName}</h2>
    <div class="features-grid">{FEATURES_HTML}</div>
  </section>
  <section class="brand-story">
    <h2>Our Story</h2>
    <p>{brandStory}</p>
  </section>
  <section class="testimonials">
    <h2>Real Reviews From Real Aussies</h2>
    <div class="testimonials-grid">{TESTIMONIALS_HTML}</div>
  </section>
  <section class="faq">
    <h2>Frequently Asked Questions</h2>
    {FAQS_HTML}
  </section>
  <footer>
    <div class="footer-logo">{storeName}</div>
    <p>{tagline}</p>
    <p style="margin-top:16px;font-size:11px">&copy; 2025 {storeName}. All rights reserved. Australia.</p>
  </footer>
</body>
</html>`;

// ── Helpers ───────────────────────────────────────────────────────────────────
function cleanProductTitle(raw: string): string {
  const platforms = ['AliExpress', 'Amazon', 'Shopify', 'eBay', 'Etsy', 'Walmart', 'Temu', 'DHgate', 'Alibaba'];
  let title = raw;
  for (const platform of platforms) {
    title = title.replace(new RegExp(`\\s*[-|]\\s*${platform}.*$`, 'i'), '');
  }
  title = title.replace(/\b[A-Z0-9]{6,}\b/g, '').replace(/\bSKU[-\s]?[A-Z0-9]+\b/gi, '');
  title = title.slice(0, 60).replace(/[-|,\s]+$/, '').trim();
  return title || raw.slice(0, 60).trim();
}

function getLanguage(filePath: string): string {
  if (filePath.endsWith('.liquid')) return 'markup';
  if (filePath.endsWith('.json')) return 'json';
  if (filePath.endsWith('.html')) return 'markup';
  if (filePath.endsWith('.md')) return 'markdown';
  if (filePath.endsWith('.css')) return 'css';
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) return 'typescript';
  if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) return 'javascript';
  return 'markup';
}

function featureToStr(f: { title: string; description: string } | string): string {
  return typeof f === 'string' ? f : `${f.title}: ${f.description}`;
}

// ── Parse Store Data ──────────────────────────────────────────────────────────
function parseStoreData(raw: string): GeneratedData | null {
  try {
    const clean = raw
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/gi, '')
      .trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start === -1 || end <= start) return null;
    const parsed = JSON.parse(clean.slice(start, end + 1));
    if (!parsed.headline && !parsed.storeName) return null;
    return parsed as GeneratedData;
  } catch {
    return null;
  }
}

// ── Build Store Preview HTML ──────────────────────────────────────────────────
function buildStorePreview(data: GeneratedData): string {
  const primaryColor = data.primaryColor || '#d4af37';
  const featureIcons = ['⚡', '🎯', '✨'];

  const featuresHtml = (data.features || []).map((f, i) => {
    const title = typeof f === 'string' ? f : f.title;
    const description = typeof f === 'string'
      ? 'Quality product for Australian customers.'
      : f.description;
    return `<div class="feature-card"><div class="feature-icon">${featureIcons[i] || '✓'}</div><h3>${title}</h3><p>${description}</p></div>`;
  }).join('');

  const testimonials = data.testimonials || [];
  const testimonialsHtml = testimonials.length > 0
    ? testimonials.map(t => `<div class="testimonial-card"><p>"${t.text}"</p><div class="testimonial-name">${t.name}</div><div class="testimonial-location">${t.location}, Australia</div></div>`).join('')
    : `<div class="testimonial-card"><p>"Fast shipping and brilliant quality. Exactly what I needed — will definitely order again!"</p><div class="testimonial-name">Sarah M.</div><div class="testimonial-location">Sydney, Australia</div></div><div class="testimonial-card"><p>"Arrived quickly from the AU warehouse. Great value and the product is top notch."</p><div class="testimonial-name">James K.</div><div class="testimonial-location">Melbourne, Australia</div></div><div class="testimonial-card"><p>"Finally a brand that delivers on its promises. Highly recommend to any Aussie."</p><div class="testimonial-name">Emma T.</div><div class="testimonial-location">Brisbane, Australia</div></div>`;

  const faqs = data.faqs || [];
  const faqsHtml = faqs.length > 0
    ? faqs.map(f => `<div class="faq-item"><div class="faq-q">${f.question}</div><div class="faq-a">${f.answer}</div></div>`).join('')
    : `<div class="faq-item"><div class="faq-q">Do you ship to all of Australia?</div><div class="faq-a">Yes! We ship Australia-wide via Australia Post. Free shipping on orders over $80.</div></div><div class="faq-item"><div class="faq-q">Is Afterpay available?</div><div class="faq-a">Absolutely. Pay in 4 interest-free instalments with Afterpay at checkout.</div></div><div class="faq-item"><div class="faq-q">What is your returns policy?</div><div class="faq-a">30-day hassle-free returns. If you're not happy, we'll sort it out — no questions asked.</div></div>`;

  const heroKeyword = encodeURIComponent(data.heroImageKeyword || data.tagline || 'Australian lifestyle product');

  let html = PREVIEW_TEMPLATE;
  html = html.replace(/{storeName}/g, data.storeName || 'My Store');
  html = html.replace(/{tagline}/g, data.tagline || 'Quality products for Australians');
  html = html.replace(/{headline}/g, data.headline || 'Built for Australia');
  html = html.replace(/{subheadline}/g, data.subheadline || 'Quality products delivered to your door.');
  html = html.replace(/{ctaText}/g, data.ctaText || data.cta_primary || 'Shop Now');
  html = html.replace(/{brandStory}/g, data.brandStory || data.about_section || 'An Australian brand built on quality, value, and exceptional service.');
  html = html.replace(/{primaryColor}/g, primaryColor);
  html = html.replace(/{heroImageKeyword}/g, heroKeyword);
  html = html.replace('{FEATURES_HTML}', featuresHtml);
  html = html.replace('{TESTIMONIALS_HTML}', testimonialsHtml);
  html = html.replace('{FAQS_HTML}', faqsHtml);
  return html;
}

// ── Copy Button Hook ──────────────────────────────────────────────────────────
function useCopyBtn() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const copy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedKey(key);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopiedKey(null), 2000);
  }, []);

  return { copiedKey, copy };
}

// ── File Tree Component ───────────────────────────────────────────────────────
function FileTree({
  files,
  activeFile,
  onSelect,
}: {
  files: Record<string, string>;
  activeFile: string | null;
  onSelect: (path: string) => void;
}) {
  const tree = useMemo(() => {
    const folders: Record<string, string[]> = {};
    for (const path of Object.keys(files)) {
      const parts = path.split('/');
      if (parts.length > 1) {
        const folder = parts.slice(0, -1).join('/');
        if (!folders[folder]) folders[folder] = [];
        folders[folder].push(path);
      } else {
        if (!folders['.']) folders['.'] = [];
        folders['.'].push(path);
      }
    }
    return folders;
  }, [files]);

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const k of Object.keys(tree)) init[k] = true;
    return init;
  });

  return (
    <div className="py-2" style={{ minWidth: 180 }}>
      {Object.entries(tree).map(([folder, paths]) => (
        <div key={folder}>
          {folder !== '.' && (
            <button
              onClick={() => setExpanded((p) => ({ ...p, [folder]: !p[folder] }))}
              className="flex items-center gap-1.5 w-full px-3 py-1 text-xs hover:bg-white/5 transition-colors"
              style={{ color: 'rgba(240,237,232,0.55)', cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'DM Sans, sans-serif' }}
            >
              <FolderOpen size={12} style={{ color: '#d4af37' }} />
              <span className="font-semibold">{folder}</span>
            </button>
          )}
          {(folder === '.' || expanded[folder]) && paths.map((path) => {
            const fileName = path.split('/').pop()!;
            const isActive = activeFile === path;
            return (
              <button
                key={path}
                onClick={() => onSelect(path)}
                className="flex items-center gap-1.5 w-full py-1 text-xs transition-colors"
                style={{
                  paddingLeft: folder === '.' ? 12 : 28,
                  paddingRight: 12,
                  background: isActive ? 'rgba(212,175,55,0.1)' : 'transparent',
                  color: isActive ? '#d4af37' : 'rgba(240,237,232,0.5)',
                  borderLeft: `2px solid ${isActive ? '#d4af37' : 'transparent'}`,
                  cursor: 'pointer',
                  border: 'none',
                  borderLeftWidth: 2,
                  borderLeftStyle: 'solid',
                  borderLeftColor: isActive ? '#d4af37' : 'transparent',
                  fontFamily: 'monospace',
                }}
              >
                <FileCode size={12} style={{ color: fileName.endsWith('.json') ? '#f0c040' : '#9c5fff' }} />
                <span>{fileName}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── Modal Component ───────────────────────────────────────────────────────────
function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div className="relative w-full max-w-lg mx-4 rounded-2xl p-6" style={{ background: '#0f1118', border: '1px solid rgba(255,255,255,0.1)' }} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4" style={{ color: 'rgba(240,237,232,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}>
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}

// ── Shopify CSV Export ────────────────────────────────────────────────────────
function generateShopifyCSV(data: GeneratedData, storeName: string, price: string): string {
  const handle = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const title = data.headline || storeName;
  const bodyParts = [
    (data.brandStory || data.about_section) ? `<p>${data.brandStory || data.about_section}</p>` : '',
    data.features?.length
      ? `<ul>${data.features.map((f) => `<li>${featureToStr(f)}</li>`).join('')}</ul>`
      : '',
  ].filter(Boolean);
  const body = bodyParts.join('');
  const vendor = storeName;
  const variantPrice = price || '49.00';
  const header = 'Handle,Title,Body (HTML),Vendor,Type,Tags,Published,Option1 Name,Option1 Value,Variant SKU,Variant Grams,Variant Inventory Tracker,Variant Inventory Qty,Variant Inventory Policy,Variant Fulfillment Service,Variant Price,Variant Compare At Price,Variant Requires Shipping,Variant Taxable,Image Src,Image Position,Status';
  const row = `${handle},"${title.replace(/"/g, '""')}","${body.replace(/"/g, '""')}","${vendor}",,,"true",Title,Default Title,,,shopify,100,deny,manual,${variantPrice},,TRUE,TRUE,,1,active`;
  return header + '\n' + row;
}

// ── GoLive Launch Panel ───────────────────────────────────────────────────────
interface GoLiveLaunchPanelProps {
  generatedData: GeneratedData | null;
  storeName: string;
  priceAUD: string;
  niche: string;
}

function GoLiveLaunchPanel({ generatedData, storeName, priceAUD, niche }: GoLiveLaunchPanelProps) {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<'choose' | 'majorka-wizard' | 'done'>('choose');
  const [wizardStep, setWizardStep] = useState(1);
  const [stripePublishable, setStripePublishable] = useState('');
  const [stripeSecret, setStripeSecret] = useState('');
  const [productName, setProductName] = useState(generatedData?.headline || storeName || '');
  const [productPrice, setProductPrice] = useState(priceAUD || '49.00');
  const [productDesc, setProductDesc] = useState(generatedData?.brandStory || generatedData?.about_section || '');
  const [productImageUrl, setProductImageUrl] = useState('');
  const slug = (storeName || productName || 'my-store').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
  const [liveSlug, setLiveSlug] = useState('');
  const [copied, setCopied] = useState(false);

  const createStoreMutation = trpc.storefront.createStore.useMutation();
  const createProductMutation = trpc.products.create.useMutation();

  useEffect(() => {
    if (generatedData?.headline && !productName) setProductName(generatedData.headline);
    if ((generatedData?.brandStory || generatedData?.about_section) && !productDesc)
      setProductDesc(generatedData.brandStory || generatedData.about_section || '');
  }, [generatedData]);

  useEffect(() => {
    if (priceAUD && !productPrice) setProductPrice(priceAUD);
  }, [priceAUD]);

  const handleStep1Next = () => {
    if (!stripePublishable.trim() || !stripeSecret.trim()) { toast.error('Please enter both Stripe keys'); return; }
    localStorage.setItem('majorka_stripe_pk', stripePublishable.trim());
    localStorage.setItem('majorka_stripe_sk', stripeSecret.trim());
    setWizardStep(2);
  };

  const handleGoLive = async () => {
    if (!productName.trim()) { toast.error('Product name is required'); return; }
    if (!productPrice.trim()) { toast.error('Price is required'); return; }
    try {
      let finalSlug = slug;
      try {
        await createStoreMutation.mutateAsync({ storeName: storeName || productName, storeSlug: finalSlug });
      } catch (storeErr: any) {
        if (!storeErr?.message?.includes('unique') && !storeErr?.message?.includes('already')) throw storeErr;
      }
      await createProductMutation.mutateAsync({ name: productName.trim(), niche: niche || undefined, description: productDesc.trim() || undefined });
      setLiveSlug(finalSlug);
      setWizardStep(3);
      setMode('done');
    } catch (err: any) {
      toast.error(err?.message || 'Something went wrong. Please try again.');
    }
  };

  const handleShopifyExport = () => {
    if (!generatedData) return;
    const csv = generateShopifyCSV(generatedData, storeName, priceAUD);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${storeName || 'majorka-store'}-shopify-import.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Shopify CSV downloaded! Import it at Shopify → Products → Import');
  };

  const storeUrl = `majorka.io/store/${liveSlug || slug}`;
  const handleCopyUrl = () => { navigator.clipboard.writeText(`https://${storeUrl}`); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  if (!generatedData) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 p-8" style={{ color: 'rgba(240,237,232,0.4)' }}>
        <Rocket size={40} style={{ opacity: 0.3 }} />
        <p className="text-sm font-medium" style={{ fontFamily: 'Syne, sans-serif' }}>Generate your website first, then launch it here.</p>
      </div>
    );
  }

  if (mode === 'choose') {
    return (
      <div className="h-full overflow-y-auto p-6" style={{ scrollbarWidth: 'thin' }}>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#d4af37', fontFamily: 'Syne, sans-serif' }}>Ready to sell?</p>
            <h2 className="text-xl font-bold" style={{ color: 'rgba(240,237,232,0.95)', fontFamily: 'Syne, sans-serif' }}>Choose your launch path</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button onClick={() => setMode('majorka-wizard')} className="group relative text-left p-6 rounded-2xl transition-all duration-200" style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', cursor: 'pointer' }} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.border = '1px solid rgba(212,175,55,0.6)'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(212,175,55,0.1)'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.border = '1px solid rgba(212,175,55,0.2)'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(212,175,55,0.06)'; }}>
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.15)' }}><Zap size={20} style={{ color: '#d4af37' }} /></div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm" style={{ color: 'rgba(240,237,232,0.95)', fontFamily: 'Syne, sans-serif' }}>Sell on Majorka</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(212,175,55,0.2)', color: '#d4af37' }}>Recommended</span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'rgba(240,237,232,0.5)', lineHeight: 1.5 }}>Your store is hosted here. Add Stripe and start selling in minutes. Free.</p>
                </div>
                <div className="text-xs font-bold flex items-center gap-1" style={{ color: '#d4af37' }}>Set Up Store <ChevronRight size={12} /></div>
              </div>
            </button>
            <button onClick={handleShopifyExport} className="group relative text-left p-6 rounded-2xl transition-all duration-200" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.border = '1px solid rgba(255,255,255,0.18)'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.border = '1px solid rgba(255,255,255,0.08)'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)'; }}>
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}><ShoppingBag size={20} style={{ color: 'rgba(240,237,232,0.6)' }} /></div>
                <div>
                  <span className="font-bold text-sm" style={{ color: 'rgba(240,237,232,0.95)', fontFamily: 'Syne, sans-serif' }}>Export to Shopify</span>
                  <p className="text-xs mt-1" style={{ color: 'rgba(240,237,232,0.5)', lineHeight: 1.5 }}>Download a Shopify-ready product CSV and import it to your Shopify store in one click.</p>
                </div>
                <div className="text-xs font-bold flex items-center gap-1" style={{ color: 'rgba(240,237,232,0.5)' }}><Download size={12} /> Export CSV</div>
              </div>
            </button>
          </div>
          <div className="text-center text-xs" style={{ color: 'rgba(240,237,232,0.3)', fontFamily: 'DM Sans, sans-serif' }}>
            Your store will be hosted at <span style={{ color: 'rgba(212,175,55,0.7)' }}>majorka.io/store/{slug}</span>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'majorka-wizard') {
    return (
      <div className="h-full overflow-y-auto p-6" style={{ scrollbarWidth: 'thin' }}>
        <div className="max-w-lg mx-auto space-y-6">
          {wizardStep < 3 && (
            <button onClick={() => { if (wizardStep === 1) setMode('choose'); else setWizardStep((s) => s - 1); }} className="flex items-center gap-1 text-xs transition-opacity hover:opacity-80" style={{ color: 'rgba(240,237,232,0.4)', cursor: 'pointer' }}>
              <ChevronRight size={12} style={{ transform: 'rotate(180deg)' }} /> Back
            </button>
          )}
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="rounded-full transition-all duration-200" style={{ width: s === wizardStep ? 24 : 8, height: 8, background: s === wizardStep ? '#d4af37' : s < wizardStep ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.12)' }} />
            ))}
          </div>

          {wizardStep === 1 && (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold" style={{ color: 'rgba(240,237,232,0.95)', fontFamily: 'Syne, sans-serif' }}>Connect Stripe</h3>
                <p className="text-xs" style={{ color: 'rgba(240,237,232,0.45)' }}>Required to accept payments on your store.</p>
              </div>
              <div className="space-y-3">
                {[{ label: 'Publishable Key', value: stripePublishable, setter: setStripePublishable, placeholder: 'pk_live_...', type: 'text' }, { label: 'Secret Key', value: stripeSecret, setter: setStripeSecret, placeholder: 'sk_live_...', type: 'password' }].map(({ label, value, setter, placeholder, type }) => (
                  <div key={label} className="space-y-1.5">
                    <label className="text-xs font-medium" style={{ color: 'rgba(240,237,232,0.6)', fontFamily: 'Syne, sans-serif' }}>{label}</label>
                    <input type={type} value={value} onChange={(e) => setter(e.target.value)} placeholder={placeholder} className="w-full px-3 py-2.5 rounded-lg text-xs outline-none transition-all" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(240,237,232,0.9)', fontFamily: 'monospace' }} onFocus={(e) => { e.target.style.border = '1px solid rgba(212,175,55,0.4)'; }} onBlur={(e) => { e.target.style.border = '1px solid rgba(255,255,255,0.1)'; }} />
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <p className="text-xs" style={{ color: 'rgba(240,237,232,0.35)' }}>Saved locally. We never transmit your secret key to third parties.</p>
                <p className="text-xs" style={{ color: 'rgba(240,237,232,0.35)' }}>No Stripe account? <a href="https://stripe.com/au" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#d4af37', cursor: 'pointer' }}>Create a free account →</a></p>
              </div>
              <button onClick={handleStep1Next} className="w-full py-3 rounded-xl text-sm font-bold transition-all duration-200" style={{ background: '#d4af37', color: '#0c0e12', fontFamily: 'Syne, sans-serif', cursor: 'pointer' }}>
                Next: Set Your Product →
              </button>
            </div>
          )}

          {wizardStep === 2 && (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold" style={{ color: 'rgba(240,237,232,0.95)', fontFamily: 'Syne, sans-serif' }}>What are you selling?</h3>
                <p className="text-xs" style={{ color: 'rgba(240,237,232,0.45)' }}>Pre-filled from your generated store. Edit as needed.</p>
              </div>
              <div className="space-y-3">
                {[{ label: 'Product Name', value: productName, setter: setProductName, placeholder: 'e.g. Bondi Glow Supplement', type: 'text' }, { label: 'Price (AUD)', value: productPrice, setter: setProductPrice, placeholder: '49.00', type: 'text' }, { label: 'Product Image URL (optional)', value: productImageUrl, setter: setProductImageUrl, placeholder: 'https://...', type: 'text' }].map(({ label, value, setter, placeholder, type }) => (
                  <div key={label} className="space-y-1.5">
                    <label className="text-xs font-medium" style={{ color: 'rgba(240,237,232,0.6)', fontFamily: 'Syne, sans-serif' }}>{label}</label>
                    <input type={type} value={value} onChange={(e) => setter(e.target.value)} placeholder={placeholder} className="w-full px-3 py-2.5 rounded-lg text-xs outline-none transition-all" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(240,237,232,0.9)' }} onFocus={(e) => { e.target.style.border = '1px solid rgba(212,175,55,0.4)'; }} onBlur={(e) => { e.target.style.border = '1px solid rgba(255,255,255,0.1)'; }} />
                  </div>
                ))}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium" style={{ color: 'rgba(240,237,232,0.6)', fontFamily: 'Syne, sans-serif' }}>Description</label>
                  <textarea value={productDesc} onChange={(e) => setProductDesc(e.target.value)} placeholder="Describe your product..." rows={3} className="w-full px-3 py-2.5 rounded-lg text-xs outline-none transition-all resize-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(240,237,232,0.9)' }} onFocus={(e) => { e.target.style.border = '1px solid rgba(212,175,55,0.4)'; }} onBlur={(e) => { e.target.style.border = '1px solid rgba(255,255,255,0.1)'; }} />
                </div>
              </div>
              <button onClick={handleGoLive} disabled={createStoreMutation.isPending || createProductMutation.isPending} className="w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2" style={{ background: '#d4af37', color: '#0c0e12', fontFamily: 'Syne, sans-serif', cursor: createStoreMutation.isPending || createProductMutation.isPending ? 'not-allowed' : 'pointer', opacity: createStoreMutation.isPending || createProductMutation.isPending ? 0.7 : 1 }}>
                {createStoreMutation.isPending || createProductMutation.isPending ? (<><Loader2 size={14} className="animate-spin" /> Creating your store...</>) : (<><Rocket size={14} /> Create Product &amp; Go Live →</>)}
              </button>
            </div>
          )}

          {wizardStep === 3 && (
            <div className="space-y-5 text-center">
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.15)', border: '2px solid #d4af37' }}><Check size={28} style={{ color: '#d4af37' }} /></div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold" style={{ color: 'rgba(240,237,232,0.95)', fontFamily: 'Syne, sans-serif' }}>Your store is live!</h3>
                <p className="text-xs" style={{ color: 'rgba(240,237,232,0.45)' }}>Share this link to start selling immediately.</p>
              </div>
              <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.35)' }}>
                <p className="text-xs" style={{ color: 'rgba(212,175,55,0.8)' }}>Your store URL</p>
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-left text-sm font-bold truncate" style={{ color: '#d4af37', fontFamily: 'monospace' }}>majorka.io/store/{liveSlug || slug}</span>
                  <button onClick={handleCopyUrl} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200" style={{ background: copied ? 'rgba(212,175,55,0.3)' : 'rgba(212,175,55,0.15)', color: '#d4af37', cursor: 'pointer' }}>
                    {copied ? <Check size={11} /> : <Copy size={11} />}{copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <a href={`https://majorka.io/store/${liveSlug || slug}`} target="_blank" rel="noopener noreferrer" className="py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200" style={{ background: '#d4af37', color: '#0c0e12', fontFamily: 'Syne, sans-serif', cursor: 'pointer' }}>
                  <ExternalLink size={12} /> Open My Store
                </a>
                <button onClick={() => navigate('/app/store/products')} className="py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(240,237,232,0.8)', fontFamily: 'Syne, sans-serif', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Package size={12} /> Manage Store
                </button>
              </div>
              <button onClick={() => { const text = `Check out my new store: https://majorka.io/store/${liveSlug || slug}`; navigator.clipboard.writeText(text); toast.success('Link copied — paste it anywhere to share!'); }} className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(240,237,232,0.5)', fontFamily: 'Syne, sans-serif', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.07)' }}>
                <Share2 size={12} /> Share
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function WebsiteGenerator() {
  const { activeProduct: contextProduct } = useProduct();
  const { activeProduct: legacyProduct } = useActiveProduct();
  const activeProduct = contextProduct ?? legacyProduct;
  const { session } = useAuth();
  const vscDarkPlus = useVscDarkPlus();

  // Product import
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importedProduct, setImportedProduct] = useState<{
    title: string;
    description?: string;
    features?: string[];
    images?: string[];
    price?: string;
    sourceUrl?: string;
  } | null>(() => {
    if (activeProduct) {
      return {
        title: activeProduct.name,
        description: (activeProduct as any).description || activeProduct.summary || undefined,
        features: [],
        images: (activeProduct as any).images || [],
        sourceUrl: (activeProduct as any).sourceUrl,
      };
    }
    return null;
  });
  const [importError, setImportError] = useState('');

  // Form fields
  const [storeName, setStoreName] = useState('');
  const [niche, setNiche] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [tagline, setTagline] = useState('');
  const [priceAUD, setPriceAUD] = useState('');
  const [vibe, setVibe] = useState('premium');
  const [accentColor, setAccentColor] = useState('#d4af37');
  const [platform, setPlatform] = useState<Platform>('shopify');

  // Template selection
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [premiumTemplateId, setPremiumTemplateId] = useState<string>(WEBSITE_TEMPLATES[0].id);

  // Output
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [progressMsgIdx, setProgressMsgIdx] = useState(0);
  const [generatedData, setGeneratedData] = useState<GeneratedData | null>(null);
  const [rawResponse, setRawResponse] = useState<string | null>(null);
  const [parseWarning, setParseWarning] = useState(false);
  const [genError, setGenError] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('preview');

  // Preview
  const [mobilePreview, setMobilePreview] = useState(false);

  // Code tab
  const [activeFile, setActiveFile] = useState<string | null>(null);

  // Deploy modals
  const [cursorModal, setCursorModal] = useState(false);
  const [shopifyModal, setShopifyModal] = useState(false);

  // Copy
  const { copiedKey, copy } = useCopyBtn();

  // Demo mode state
  const [demoMode, setDemoMode] = useState(false);
  const [demoBannerVisible, setDemoBannerVisible] = useState(true);

  // Auto-fill from URL params (e.g. from Winning Products quick actions or demo links)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nicheParam = params.get('niche');
    const productParam = params.get('product');
    const demoParam = params.get('demo');

    if (nicheParam) setNiche(nicheParam);
    if (productParam) setStoreName(productParam);

    if (demoParam) {
      setDemoMode(true);
      const demoNiches: Record<string, string> = {
        'beauty-gadgets': 'Beauty & Skincare Gadgets',
        'fitness': 'Fitness & Wellness',
        'home-decor': 'Home Decor & Lifestyle',
      };
      const demoNiche = demoNiches[demoParam] || demoParam.replace(/-/g, ' ');
      setNiche(demoNiche);
    }
  }, []);

  // Progress message cycling
  useEffect(() => {
    if (!generating) { setProgressMsgIdx(0); return; }
    const interval = setInterval(() => {
      setProgressMsgIdx((i) => (i + 1) % PROGRESS_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [generating]);

  // Preview HTML (memoised)
  const previewHTML = useMemo(() => {
    if (!generatedData) return '';
    return buildStorePreview(generatedData);
  }, [generatedData]);

  const hasOutput = generatedData || rawResponse;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleImport = useCallback(async () => {
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportError('');
    try {
      const response = await fetch('/api/scrape-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Scrape failed: ${response.status}`);
      }
      const data = (await response.json()) as { productTitle: string; description: string; bulletPoints: string[]; price: string; imageUrls: string[]; brand?: string; extractionError?: string; };
      if (data.extractionError) throw new Error(data.extractionError);
      const finalTitle = cleanProductTitle(data.productTitle || 'Imported Product');
      setImportedProduct({ title: finalTitle, description: data.description, features: data.bulletPoints, price: data.price, images: data.imageUrls, sourceUrl: importUrl });
      if (!storeName.trim() && data.brand) setStoreName(data.brand.slice(0, 40));
      toast.success('Product imported successfully');
    } catch (err: any) {
      setImportError(err?.message || 'Could not import. Try a different URL or fill in details manually.');
    } finally {
      setImporting(false);
    }
  }, [importUrl, storeName]);

  const handleGenerate = useCallback(async () => {
    if (!niche.trim()) { toast.error('Please enter a niche first'); return; }
    setGenerating(true);
    setGenError('');
    setGenProgress(0);
    setParseWarning(false);

    try {
      const selectedPremiumTemplate = WEBSITE_TEMPLATES.find((t) => t.id === premiumTemplateId);
      const templateNote = selectedPremiumTemplate
        ? `\nDesign Template: ${selectedPremiumTemplate.name} (${selectedPremiumTemplate.category}) — ${selectedPremiumTemplate.description}`
        : '';

      const userMessage = [
        `Generate a complete store for:`,
        `Store name: ${storeName || 'My AU Store'}`,
        `Niche: ${niche}`,
        `Target audience: ${targetAudience}`,
        vibe ? `Style/vibe: ${vibe}` : '',
        accentColor ? `Brand color: ${accentColor}` : '',
        platform ? `Platform: ${platform}` : '',
        importedProduct ? `Featured product: ${JSON.stringify(importedProduct)}` : '',
        `Location: Australia`,
        templateNote,
      ].filter(Boolean).join('\n');

      const response = await fetch('/api/chat?stream=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userMessage }],
          toolName: 'website-generator',
          systemPrompt: buildSystemPrompt(vibe, platform, accentColor),
          market: getStoredMarket(),
          stream: true,
        }),
      });

      if (!response.ok) throw new Error(`Generation failed: ${response.status}`);

      // Collect SSE stream
      let fullText = '';
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const payload = JSON.parse(line.slice(6));
              if (payload.text !== undefined) {
                fullText += payload.text;
                setGenProgress(Math.min(90, Math.floor((fullText.length / 800) * 90)));
              }
            } catch { /* skip malformed */ }
          }
        }
      }
      if (!fullText) {
        const text = await response.text().catch(() => '');
        try { const d = JSON.parse(text); fullText = d.reply || d.content || ''; } catch { fullText = text; }
      }

      setGenProgress(100);
      setRawResponse(fullText);

      const parsed = parseStoreData(fullText);
      if (parsed) {
        // Inject accent colour if AI didn't return one
        if (!parsed.primaryColor && accentColor) parsed.primaryColor = accentColor;
        setGeneratedData(parsed);
        setActiveTab('preview');
        if (parsed.files) {
          const firstFile = Object.keys(parsed.files)[0];
          if (firstFile) setActiveFile(firstFile);
        }
        toast.success('Store generated!');
        trackWebsiteGenerated({ niche, platform, vibe, market: getStoredMarket() });
        localStorage.setItem('majorka_milestone_site', 'true');
      } else {
        setParseWarning(true);
        setActiveTab('copy');
        toast.warning('Generated content could not be parsed. Showing raw output.');
      }
    } catch (err: any) {
      setGenError(err?.message || 'Generation failed. Please try again.');
    } finally {
      setGenerating(false);
      setGenProgress(0);
    }
  }, [storeName, niche, targetAudience, vibe, accentColor, platform, importedProduct, premiumTemplateId, session]);

  // ── Export handlers ────────────────────────────────────────────────────────

  const handleDownloadZip = useCallback(async () => {
    if (!generatedData) return;
    const zip = new JSZip();
    if (generatedData.files && Object.keys(generatedData.files).length > 0) {
      for (const [path, content] of Object.entries(generatedData.files)) {
        zip.file(path, content);
      }
    } else {
      // New format: zip the preview HTML
      zip.file('index.html', buildStorePreview(generatedData));
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(storeName || generatedData.storeName || 'store').replace(/\s+/g, '-').toLowerCase()}-website.zip`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('ZIP downloaded!');
  }, [generatedData, storeName]);

  const handleDownloadHTML = useCallback(() => {
    if (!generatedData) return;
    const html = buildStorePreview(generatedData);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(storeName || generatedData.storeName || 'store').replace(/\s+/g, '-').toLowerCase()}-website.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('HTML file downloaded!');
  }, [generatedData, storeName]);

  const handleShopifyExport = useCallback(async () => {
    if (!generatedData) return;
    const zip = new JSZip();
    const name = storeName || generatedData.storeName || 'My Store';
    const accent = generatedData.primaryColor || accentColor;
    const hl = generatedData.headline || '';
    const sub = generatedData.subheadline || '';
    const feats = (generatedData.features || []).map(featureToStr);
    const badges = generatedData.trust_badges || ['Australian Owned', 'Free AU Shipping', 'Afterpay Available', 'Secure Payments', '30-Day Returns'];
    const ctaPrimary = generatedData.ctaText || generatedData.cta_primary || 'Shop Now';
    const ctaSecondary = generatedData.cta_secondary || 'Learn More';
    const about = generatedData.brandStory || generatedData.about_section || '';

    if (generatedData.files) {
      for (const [path, content] of Object.entries(generatedData.files)) {
        zip.file(path, content);
      }
    }

    zip.file('layout/theme.liquid', `<!DOCTYPE html>
<html lang="en-AU">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{{ page_title }} — ${name}</title>
  {{ content_for_header }}
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800;900&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  {{ 'theme.css' | asset_url | stylesheet_tag }}
</head>
<body>
  <header class="site-header"><div class="header-inner"><a href="/" class="logo">{{ shop.name }}</a><nav><a href="/collections/all">Shop</a><a href="/pages/about">About</a><a href="/cart">Cart ({{ cart.item_count }})</a></nav></div></header>
  <main>{{ content_for_layout }}</main>
  {% section 'footer' %}
  <script src="https://portal.afterpay.com/afterpay.js" defer></script>
</body>
</html>`);

    zip.file('sections/hero.liquid', `<section class="hero" style="background:${accent}08">
  <div class="hero-inner">
    <h1>${hl}</h1>
    <p>${sub}</p>
    <div class="hero-ctas">
      <a href="/collections/all" class="btn-primary">${ctaPrimary}</a>
      <a href="/pages/about" class="btn-secondary">${ctaSecondary}</a>
    </div>
  </div>
</section>
{% schema %}{"name":"Hero Banner","settings":[{"type":"text","id":"heading","label":"Heading","default":"${hl}"}]}{% endschema %}`);

    zip.file('assets/theme.css', `/* ${name} Theme — Generated by Majorka AI */
:root{--accent:${accent};--bg:#080a0e;--text:#f2efe9;--surface:#111114}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;line-height:1.6}
h1,h2,h3,h4{font-family:'Syne',sans-serif;font-weight:800}
.site-header{border-bottom:1px solid rgba(255,255,255,.06);padding:16px 24px}
.header-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between}
.logo{font-family:'Syne',sans-serif;font-weight:900;font-size:20px;color:var(--text);text-decoration:none}
nav a{color:rgba(255,255,255,.6);text-decoration:none;margin-left:24px;font-size:14px}
nav a:hover{color:var(--accent)}
.hero{min-height:70vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:80px 24px}
.hero-inner{max-width:800px}
h1{font-size:clamp(32px,5vw,56px);letter-spacing:-1.5px;line-height:1.08;margin-bottom:20px}
.btn-primary{display:inline-flex;align-items:center;padding:18px 40px;background:var(--accent);color:#fff;font-family:'Syne',sans-serif;font-weight:800;font-size:17px;border:none;border-radius:14px;cursor:pointer;text-decoration:none}
.btn-secondary{display:inline-flex;align-items:center;padding:16px 32px;background:transparent;color:var(--text);font-family:'Syne',sans-serif;font-weight:700;font-size:15px;border:2px solid rgba(255,255,255,.15);border-radius:14px;cursor:pointer;text-decoration:none;margin-left:12px}
.site-footer{border-top:1px solid rgba(255,255,255,.06);padding:48px 24px;text-align:center;font-size:12px;opacity:.4}
`);

    zip.file('config/settings_schema.json', JSON.stringify([{ name: 'theme_info', theme_name: name, theme_version: '1.0.0', theme_author: 'Majorka AI' }, { name: 'Colors', settings: [{ type: 'color', id: 'accent_color', label: 'Accent Color', default: accent }] }], null, 2));

    zip.file('README.md', `# ${name} — Shopify Theme\nGenerated by Majorka AI\n\n## Install\n1. Shopify Admin → Online Store → Themes\n2. Add theme → Upload zip file\n3. Customise → Publish\n\nAll prices AUD incl. GST. Afterpay/Zip included. AU Consumer Law footer.\n`);

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/\s+/g, '-').toLowerCase()}-shopify-theme.zip`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Shopify theme ZIP downloaded!');
    setShopifyModal(true);
  }, [generatedData, storeName, accentColor]);

  const handleCopyNotion = useCallback(() => {
    if (!generatedData) return;
    const md = `# ${generatedData.headline}\n\n## ${generatedData.subheadline}\n\n### Features\n${(generatedData.features || []).map((f) => `- ${featureToStr(f)}`).join('\n')}\n\n### CTA\n- **Primary:** ${generatedData.ctaText || generatedData.cta_primary}\n\n### Brand Story\n${generatedData.brandStory || generatedData.about_section || ''}\n\n### Meta Title\n${generatedData.metaTitle || ''}\n\n### Meta Description\n${generatedData.metaDescription || generatedData.meta_description || ''}`;
    navigator.clipboard.writeText(md).catch(() => {});
    toast.success('Copied to clipboard in Notion format!');
  }, [generatedData]);

  const handleOpenCursor = useCallback(async () => {
    await handleDownloadZip();
    setCursorModal(true);
  }, [handleDownloadZip]);

  const handleOpenPreviewNewTab = useCallback(() => {
    if (!previewHTML) return;
    const win = window.open('', '_blank');
    if (win) { win.document.write(previewHTML); win.document.close(); }
  }, [previewHTML]);

  const cursorInstructions = `1. Unzip the downloaded file\n2. Open Cursor (cursor.com)\n3. File → Open Folder → select unzipped folder\n4. In Cursor chat: "I have a Shopify theme. Help me customise it for ${storeName || '[store name]'}"\n5. Cursor will read all files and help you build`;

  // ── Render ─────────────────────────────────────────────────────────────────
  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'preview', label: 'Preview', icon: <Globe size={12} /> },
    { id: 'code', label: 'Code', icon: <Code2 size={12} /> },
    { id: 'copy', label: 'Copy All', icon: <FileText size={12} /> },
    { id: 'deploy', label: 'Deploy', icon: <Package size={12} /> },
    { id: 'launch', label: 'Launch', icon: <Rocket size={12} /> },
  ];

  return (
    <div className="h-full flex flex-col" style={{ background: '#080a0e', color: '#f0ede8', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Demo mode banner */}
      {demoMode && demoBannerVisible && (
        <div style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 0, padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: '#d4af37', fontFamily: "'DM Sans', sans-serif" }}>
            ✦ Demo mode — see how Majorka builds your store
          </span>
          <button onClick={() => setDemoBannerVisible(false)} style={{ background: 'none', border: 'none', color: 'rgba(212,175,55,0.6)', cursor: 'pointer', padding: '0 4px', fontSize: 14, lineHeight: 1 }}>✕</button>
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.07)', background: '#0c0e12' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)' }}>
          <Globe size={15} style={{ color: '#d4af37' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black leading-tight" style={{ fontFamily: 'Syne, sans-serif' }}>Website Generator</div>
          <div className="text-xs" style={{ color: 'rgba(240,237,232,0.35)' }}>AI-powered Shopify store builder for AU market</div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden flex">
        {/* ── LEFT PANEL ── */}
        <div className="flex-shrink-0 overflow-y-auto p-5 space-y-4" style={{ width: 400, borderRight: '1px solid rgba(255,255,255,0.07)', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>

          {/* Premium Template Selector */}
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1.5px solid rgba(212,175,55,0.2)' }}>
            <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#d4af37', fontFamily: 'Syne, sans-serif' }}>Design Template</div>
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
              {WEBSITE_TEMPLATES.map((t) => {
                const isSelected = premiumTemplateId === t.id;
                const isDark = t.palette.bg.startsWith('#0') || t.palette.bg.startsWith('#1');
                return (
                  <button key={t.id} onClick={() => setPremiumTemplateId(t.id)} className="flex flex-col w-full rounded-lg text-left transition-all overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: `2px solid ${isSelected ? '#d4af37' : 'rgba(255,255,255,0.08)'}`, cursor: 'pointer', padding: 0 }}>
                    <div style={{ height: 68, background: `linear-gradient(135deg, ${t.palette.bg} 0%, ${t.palette.accent}55 100%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, position: 'relative' }}>
                      <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase', color: isDark ? t.palette.accent : t.palette.text, lineHeight: 1 }}>{t.name}</span>
                      <div style={{ display: 'flex', gap: 3 }}>{[t.palette.bg, t.palette.accent, t.palette.text].map((c, i) => (<div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: c, border: '1px solid rgba(128,128,128,0.3)' }} />))}</div>
                    </div>
                    <div style={{ padding: '8px 8px 10px' }}>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 10, color: isSelected ? '#d4af37' : '#f0ede8', marginBottom: 3, lineHeight: 1.2 }}>{t.name}</div>
                      <div style={{ display: 'inline-flex', fontSize: 8, fontWeight: 700, letterSpacing: 0.5, textTransform: 'capitalize', padding: '2px 6px', borderRadius: 3, background: isSelected ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.06)', color: isSelected ? '#d4af37' : 'rgba(240,237,232,0.45)', border: `1px solid ${isSelected ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.08)'}` }}>{t.category}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* AU Store Templates */}
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1.5px solid rgba(255,255,255,0.08)' }}>
            <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(240,237,232,0.4)', fontFamily: 'Syne, sans-serif' }}>AU Store Templates</div>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedTemplate(t.id);
                    setNiche(t.niche);
                    setTargetAudience(t.audience);
                    setVibe(t.vibe);
                    setAccentColor(t.color);
                    toast.success(`"${t.name}" loaded`);
                  }}
                  style={{
                    border: selectedTemplate === t.id ? '2px solid #d4af37' : '1px solid rgba(255,255,255,0.08)',
                    background: selectedTemplate === t.id ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                    borderRadius: 10,
                    padding: '10px 12px',
                    transition: 'all 150ms ease',
                  }}
                >
                  <div className="text-xs font-bold" style={{ color: selectedTemplate === t.id ? '#d4af37' : 'rgba(240,237,232,0.8)', fontFamily: 'Syne, sans-serif' }}>{t.emoji} {t.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(240,237,232,0.35)', fontSize: 10 }}>{t.niche}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Product URL Import */}
          <div className="rounded-xl p-4" style={{ background: importedProduct ? 'rgba(45,202,114,0.05)' : 'rgba(255,255,255,0.03)', border: `1.5px solid ${importedProduct ? 'rgba(45,202,114,0.35)' : 'rgba(255,255,255,0.09)'}` }}>
            <div className="text-xs font-bold uppercase tracking-widest mb-2.5" style={{ color: 'rgba(240,237,232,0.4)', fontFamily: 'Syne, sans-serif' }}>Import Product</div>
            {importedProduct ? (
              <div>
                <div className="flex gap-2.5 items-start mb-2">
                  <div className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center text-lg" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    {importedProduct.images && importedProduct.images.length > 0 ? (
                      <img src={proxyImage(importedProduct.images[0])} alt="" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                    ) : '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate" style={{ fontFamily: 'Syne, sans-serif' }}>{importedProduct.title}</div>
                    {importedProduct.price && <div className="text-xs mt-0.5" style={{ color: 'rgba(45,202,114,0.75)' }}>${importedProduct.price} AUD</div>}
                  </div>
                  <button onClick={() => { setImportedProduct(null); setImportUrl(''); }} style={{ color: 'rgba(240,237,232,0.3)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={14} /></button>
                </div>
                <div className="text-xs font-semibold" style={{ color: 'rgba(45,202,114,0.75)' }}>✓ Product data imported</div>
              </div>
            ) : (
              <div>
                <div className="flex gap-1.5">
                  <input value={importUrl} onChange={(e) => setImportUrl(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleImport(); } }} placeholder="Paste product URL (AliExpress, Amazon…)" className="flex-1 text-xs px-3 py-2 rounded-lg outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)', color: '#f0ede8' }} />
                  <button onClick={handleImport} disabled={importing || !importUrl.trim()} className="text-xs font-bold px-3 py-2 rounded-lg flex-shrink-0 flex items-center gap-1 disabled:opacity-50" style={{ background: 'rgba(45,202,114,0.12)', border: '1.5px solid rgba(45,202,114,0.35)', color: 'rgba(45,202,114,0.9)', fontFamily: 'Syne, sans-serif', cursor: 'pointer' }}>
                    {importing ? <Loader2 size={10} className="animate-spin" /> : null}{importing ? '…' : 'Import'}
                  </button>
                </div>
                {importError && <div className="text-xs mt-1.5" style={{ color: 'rgba(255,150,100,0.8)' }}>{importError}</div>}
              </div>
            )}
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

          {/* Store Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(240,237,232,0.4)', fontFamily: 'Syne, sans-serif' }}>Store Name</label>
            <input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="e.g. MaxFit Supplements" className="w-full text-sm px-3 py-2.5 rounded-lg outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)', color: '#f0ede8' }} onFocus={(e) => (e.target.style.borderColor = 'rgba(212,175,55,0.45)')} onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')} />
          </div>

          {/* Niche */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(240,237,232,0.4)', fontFamily: 'Syne, sans-serif' }}>Niche <span style={{ color: '#d4af37', fontWeight: 700 }}>*</span></label>
            <input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="e.g. gym clothing" className="w-full text-sm px-3 py-2.5 rounded-lg outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)', color: '#f0ede8' }} onFocus={(e) => (e.target.style.borderColor = 'rgba(212,175,55,0.45)')} onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')} />
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(240,237,232,0.4)', fontFamily: 'Syne, sans-serif' }}>Target Audience</label>
            <input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="e.g. AU men 18-35" className="w-full text-sm px-3 py-2.5 rounded-lg outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)', color: '#f0ede8' }} onFocus={(e) => (e.target.style.borderColor = 'rgba(212,175,55,0.45)')} onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')} />
          </div>

          {/* Tagline + Price */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(240,237,232,0.4)', fontFamily: 'Syne, sans-serif' }}>Tagline <span style={{ opacity: 0.4, fontWeight: 400, textTransform: 'none' }}>(opt)</span></label>
              <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="e.g. Made for Aussies" className="w-full text-sm px-3 py-2.5 rounded-lg outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)', color: '#f0ede8' }} onFocus={(e) => (e.target.style.borderColor = 'rgba(212,175,55,0.45)')} onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(240,237,232,0.4)', fontFamily: 'Syne, sans-serif' }}>Price AUD <span style={{ opacity: 0.4, fontWeight: 400, textTransform: 'none' }}>(opt)</span></label>
              <input value={priceAUD} onChange={(e) => setPriceAUD(e.target.value)} placeholder="e.g. 59.99" className="w-full text-sm px-3 py-2.5 rounded-lg outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)', color: '#f0ede8' }} onFocus={(e) => (e.target.style.borderColor = 'rgba(212,175,55,0.45)')} onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')} />
            </div>
          </div>

          {/* Vibe Toggle */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(240,237,232,0.4)', fontFamily: 'Syne, sans-serif' }}>Vibe</label>
            <div className="flex gap-2">
              {['bold', 'minimal', 'premium'].map((v) => (
                <button key={v} onClick={() => setVibe(v)} className="flex-1 py-2 rounded-full text-xs font-bold capitalize transition-all" style={{ background: vibe === v ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.03)', border: `1.5px solid ${vibe === v ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.08)'}`, color: vibe === v ? '#d4af37' : 'rgba(240,237,232,0.45)', fontFamily: 'Syne, sans-serif', cursor: 'pointer' }}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Colour Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(240,237,232,0.4)', fontFamily: 'Syne, sans-serif' }}>Brand Colour</label>
            <div className="flex items-center gap-3">
              <label className="relative cursor-pointer flex-shrink-0">
                <div className="w-9 h-9 rounded-lg" style={{ background: accentColor, border: '2px solid rgba(255,255,255,0.15)', boxShadow: `0 4px 12px ${accentColor}44` }} />
                <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
              </label>
              <span className="text-sm font-mono" style={{ color: 'rgba(240,237,232,0.5)' }}>{accentColor}</span>
            </div>
          </div>

          {/* Platform */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(240,237,232,0.4)', fontFamily: 'Syne, sans-serif' }}>Platform</label>
            <select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)} className="w-full text-sm px-3 py-2.5 rounded-lg outline-none appearance-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)', color: '#f0ede8', cursor: 'pointer' }}>
              <option value="shopify" style={{ background: '#0c0e12' }}>Shopify</option>
              <option value="nextjs" style={{ background: '#0c0e12' }}>Next.js</option>
              <option value="react" style={{ background: '#0c0e12' }}>React</option>
            </select>
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            style={{ background: generating ? 'rgba(212,175,55,0.25)' : 'linear-gradient(135deg, #d4af37, #f0c040)', color: '#080a0e', fontFamily: 'Syne, sans-serif', boxShadow: generating ? 'none' : '0 4px 24px rgba(212,175,55,0.35)', cursor: generating ? 'not-allowed' : 'pointer' }}
          >
            {generating ? (
              <><Loader2 size={15} className="animate-spin" />Generating… {genProgress > 0 ? `${genProgress}%` : ''}</>
            ) : (
              <><Globe size={15} />{hasOutput ? 'Regenerate' : 'Generate'}</>
            )}
          </button>

          {genError && (
            <div className="text-xs p-3 rounded-lg" style={{ background: 'rgba(255,100,100,0.08)', border: '1px solid rgba(255,100,100,0.2)', color: 'rgba(255,150,150,0.9)' }}>{genError}</div>
          )}

          {hasOutput && (
            <SaveToProduct toolId="website-generator" toolName="Website Generator" outputData={JSON.stringify(generatedData || rawResponse)} />
          )}
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {hasOutput ? (
            <>
              {/* Tab bar */}
              <div className="flex items-center gap-1 px-4 py-2.5 border-b flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.07)', background: '#0c0e12' }}>
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="px-4 py-1.5 text-xs font-bold rounded-lg capitalize transition-all flex items-center gap-1.5"
                    style={{
                      background: activeTab === tab.id ? 'rgba(212,175,55,0.12)' : 'transparent',
                      color: activeTab === tab.id ? '#d4af37' : tab.id === 'launch' ? 'rgba(212,175,55,0.7)' : 'rgba(240,237,232,0.4)',
                      borderBottom: `2px solid ${activeTab === tab.id ? '#d4af37' : 'transparent'}`,
                      fontFamily: 'Syne, sans-serif',
                      cursor: 'pointer',
                    }}
                  >
                    {tab.icon}{tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-hidden">
                {/* ── PREVIEW TAB ── */}
                {activeTab === 'preview' && (
                  <div className="relative h-full flex flex-col overflow-hidden">
                    {/* Toolbar */}
                    <div className="flex items-center gap-2 px-4 py-2 border-b flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#0a0c10' }}>
                      <button onClick={handleOpenPreviewNewTab} className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: '#d4af37', fontFamily: 'Syne, sans-serif', cursor: 'pointer' }}>
                        <ExternalLink size={11} /> Open in new tab
                      </button>
                      <div className="ml-auto flex rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                        <button onClick={() => setMobilePreview(false)} title="Desktop" className="flex items-center gap-1 px-3 py-1.5 text-xs" style={{ background: !mobilePreview ? 'rgba(212,175,55,0.12)' : 'transparent', color: !mobilePreview ? '#d4af37' : 'rgba(240,237,232,0.4)', border: 'none', cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontWeight: !mobilePreview ? 700 : 400 }}>
                          <Monitor size={12} />
                        </button>
                        <button onClick={() => setMobilePreview(true)} title="Mobile" className="flex items-center gap-1 px-3 py-1.5 text-xs" style={{ background: mobilePreview ? 'rgba(212,175,55,0.12)' : 'transparent', color: mobilePreview ? '#d4af37' : 'rgba(240,237,232,0.4)', border: 'none', cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontWeight: mobilePreview ? 700 : 400 }}>
                          <Smartphone size={12} />
                        </button>
                      </div>
                    </div>
                    {generatedData ? (
                      <div className={`flex-1 overflow-auto ${mobilePreview ? 'flex justify-center' : ''}`} style={{ background: '#060608', padding: mobilePreview ? '20px 0' : 0 }}>
                        <div style={mobilePreview ? { width: 390, flexShrink: 0 } : { width: '100%', height: '100%' }}>
                          <iframe
                            srcDoc={previewHTML}
                            title="Store Preview"
                            className="border-0"
                            style={{
                              width: '100%',
                              height: mobilePreview ? 844 : '100%',
                              minHeight: 600,
                              borderRadius: mobilePreview ? 20 : 0,
                              border: mobilePreview ? '2px solid rgba(255,255,255,0.12)' : 'none',
                              boxShadow: mobilePreview ? '0 8px 40px rgba(0,0,0,0.5)' : 'none',
                            }}
                            sandbox="allow-same-origin"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-sm" style={{ color: 'rgba(240,237,232,0.3)' }}>Raw response could not be parsed. Check Copy All tab.</div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── CODE TAB ── */}
                {activeTab === 'code' && (
                  <div className="h-full flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 border-b flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                      <span className="text-xs font-mono" style={{ color: 'rgba(240,237,232,0.6)' }}>store-preview.html</span>
                      <button
                        onClick={() => { copy(previewHTML, 'html-source'); toast.success('HTML copied!'); }}
                        className="text-xs flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all"
                        style={{ color: copiedKey === 'html-source' ? '#2dca72' : 'rgba(240,237,232,0.4)', background: 'rgba(255,255,255,0.04)', cursor: 'pointer', border: 'none' }}
                      >
                        {copiedKey === 'html-source' ? <Check size={10} /> : <Copy size={10} />}
                        {copiedKey === 'html-source' ? 'Copied!' : 'Copy HTML'}
                      </button>
                    </div>
                    <div className="flex-1 overflow-auto" style={{ scrollbarWidth: 'thin' }}>
                      {generatedData ? (
                        <Suspense fallback={<pre className="text-xs p-4" style={{ color: 'rgba(240,237,232,0.7)', fontFamily: 'monospace', background: '#080a0e', minHeight: '100%' }}>{previewHTML}</pre>}>
                          <SyntaxHighlighter
                            language="markup"
                            style={vscDarkPlus ?? {}}
                            customStyle={{ margin: 0, padding: 16, background: '#080a0e', fontSize: 12, lineHeight: 1.6, minHeight: '100%' }}
                            showLineNumbers
                            lineNumberStyle={{ color: 'rgba(240,237,232,0.15)', minWidth: 36 }}
                            wrapLongLines
                          >
                            {previewHTML}
                          </SyntaxHighlighter>
                        </Suspense>
                      ) : rawResponse ? (
                        <pre className="text-xs p-4" style={{ color: 'rgba(240,237,232,0.7)', fontFamily: 'monospace', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#080a0e', minHeight: '100%' }}>
                          {rawResponse}
                        </pre>
                      ) : (
                        <div className="flex-1 flex items-center justify-center p-8"><div className="text-sm" style={{ color: 'rgba(240,237,232,0.3)' }}>Generate a store to view its HTML source.</div></div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── COPY ALL TAB ── */}
                {activeTab === 'copy' && (
                  <div className="h-full overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: 'thin' }}>
                    {parseWarning && (
                      <div className="p-3 rounded-lg text-xs" style={{ background: 'rgba(255,200,50,0.08)', border: '1px solid rgba(255,200,50,0.2)', color: 'rgba(255,220,100,0.9)' }}>
                        JSON parsing failed. Raw AI output below — copy what you need.
                      </div>
                    )}

                    {generatedData ? (
                      <>
                        {/* Helper for copy row */}
                        {[
                          { key: 'hl', label: 'Headline', value: generatedData.headline, large: true },
                          { key: 'sub', label: 'Subheadline', value: generatedData.subheadline },
                          { key: 'cta', label: 'CTA Text', value: generatedData.ctaText || generatedData.cta_primary },
                          { key: 'story', label: 'Brand Story', value: generatedData.brandStory || generatedData.about_section },
                          { key: 'mt', label: 'Meta Title', value: generatedData.metaTitle },
                          { key: 'md', label: 'Meta Description', value: generatedData.metaDescription || generatedData.meta_description },
                        ].map(({ key, label, value, large }) => value ? (
                          <div key={key}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(240,237,232,0.4)', fontFamily: 'Syne, sans-serif' }}>{label}</span>
                              <button onClick={() => copy(value, key)} className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg" style={{ color: copiedKey === key ? '#2dca72' : 'rgba(240,237,232,0.4)', background: 'rgba(255,255,255,0.04)', cursor: 'pointer', border: 'none' }}>
                                {copiedKey === key ? <Check size={10} /> : <Copy size={10} />}{copiedKey === key ? 'Copied' : 'Copy'}
                              </button>
                            </div>
                            <div className={large ? 'text-xl font-black' : 'text-sm leading-relaxed'} style={{ fontFamily: large ? 'Syne, sans-serif' : undefined, color: large ? undefined : 'rgba(240,237,232,0.7)', lineHeight: large ? 1.2 : undefined }}>
                              {value}
                            </div>
                          </div>
                        ) : null)}

                        {/* Features */}
                        {generatedData.features && generatedData.features.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(240,237,232,0.4)', fontFamily: 'Syne, sans-serif' }}>Features</span>
                              <button onClick={() => copy(generatedData.features!.map(featureToStr).join('\n'), 'feats')} className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg" style={{ color: copiedKey === 'feats' ? '#2dca72' : 'rgba(240,237,232,0.4)', background: 'rgba(255,255,255,0.04)', cursor: 'pointer', border: 'none' }}>
                                {copiedKey === 'feats' ? <Check size={10} /> : <Copy size={10} />}{copiedKey === 'feats' ? 'Copied' : 'Copy All'}
                              </button>
                            </div>
                            <div className="space-y-2">
                              {generatedData.features.map((f, i) => {
                                const title = typeof f === 'string' ? f : f.title;
                                const desc = typeof f === 'string' ? '' : f.description;
                                return (
                                  <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black" style={{ background: 'rgba(212,175,55,0.15)', color: '#d4af37' }}>{i + 1}</div>
                                    <div className="flex-1">
                                      <div className="text-sm font-semibold" style={{ color: 'rgba(240,237,232,0.85)' }}>{title}</div>
                                      {desc && <div className="text-xs mt-0.5" style={{ color: 'rgba(240,237,232,0.45)' }}>{desc}</div>}
                                    </div>
                                    <button onClick={() => copy(featureToStr(f), `feat-${i}`)} style={{ color: copiedKey === `feat-${i}` ? '#2dca72' : 'rgba(240,237,232,0.3)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                                      {copiedKey === `feat-${i}` ? <Check size={10} /> : <Copy size={10} />}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* FAQs */}
                        {generatedData.faqs && generatedData.faqs.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(240,237,232,0.4)', fontFamily: 'Syne, sans-serif' }}>FAQs</span>
                              <button onClick={() => copy(generatedData.faqs!.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n'), 'faqs')} className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg" style={{ color: copiedKey === 'faqs' ? '#2dca72' : 'rgba(240,237,232,0.4)', background: 'rgba(255,255,255,0.04)', cursor: 'pointer', border: 'none' }}>
                                {copiedKey === 'faqs' ? <Check size={10} /> : <Copy size={10} />}{copiedKey === 'faqs' ? 'Copied' : 'Copy All'}
                              </button>
                            </div>
                            <div className="space-y-2">
                              {generatedData.faqs.map((f, i) => (
                                <div key={i} className="px-3 py-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                  <div className="text-xs font-bold mb-1" style={{ color: 'rgba(240,237,232,0.85)' }}>{f.question}</div>
                                  <div className="text-xs" style={{ color: 'rgba(240,237,232,0.5)' }}>{f.answer}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Testimonials */}
                        {generatedData.testimonials && generatedData.testimonials.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(240,237,232,0.4)', fontFamily: 'Syne, sans-serif' }}>Testimonials</span>
                              <button onClick={() => copy(generatedData.testimonials!.map(t => `"${t.text}" — ${t.name}, ${t.location}`).join('\n\n'), 'tests')} className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg" style={{ color: copiedKey === 'tests' ? '#2dca72' : 'rgba(240,237,232,0.4)', background: 'rgba(255,255,255,0.04)', cursor: 'pointer', border: 'none' }}>
                                {copiedKey === 'tests' ? <Check size={10} /> : <Copy size={10} />}Copy All
                              </button>
                            </div>
                            <div className="space-y-2">
                              {generatedData.testimonials.map((t, i) => (
                                <div key={i} className="px-3 py-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderLeft: '3px solid #d4af37' }}>
                                  <div className="text-xs italic mb-1" style={{ color: 'rgba(240,237,232,0.7)' }}>"{t.text}"</div>
                                  <div className="text-xs font-bold" style={{ color: 'rgba(240,237,232,0.4)' }}>— {t.name}, {t.location}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Trust badges (legacy) */}
                        {generatedData.trust_badges && generatedData.trust_badges.length > 0 && (
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(240,237,232,0.4)', fontFamily: 'Syne, sans-serif' }}>Trust Badges 🇦🇺</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {generatedData.trust_badges.map((b, i) => (
                                <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: 'rgba(45,202,114,0.08)', border: '1px solid rgba(45,202,114,0.2)', color: 'rgba(45,202,114,0.85)' }}>
                                  <Check size={10} /> {b}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : rawResponse ? (
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(240,237,232,0.4)', fontFamily: 'Syne, sans-serif' }}>Raw AI Output</div>
                        <pre className="text-xs p-4 rounded-xl overflow-x-auto" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(240,237,232,0.6)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {rawResponse}
                        </pre>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* ── DEPLOY TAB ── */}
                {activeTab === 'deploy' && (
                  <div className="h-full overflow-y-auto p-6" style={{ scrollbarWidth: 'thin' }}>
                    <div className="grid grid-cols-2 gap-4 max-w-2xl">
                      {/* Download HTML */}
                      <button onClick={handleDownloadHTML} disabled={!generatedData} className="p-5 rounded-xl text-left transition-all disabled:opacity-40" style={{ background: 'rgba(212,175,55,0.06)', border: '1.5px solid rgba(212,175,55,0.2)', cursor: 'pointer' }}>
                        <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.15)' }}><Download size={20} style={{ color: '#d4af37' }} /></div>
                        <div className="text-sm font-black mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>Download HTML</div>
                        <div className="text-xs leading-relaxed" style={{ color: 'rgba(240,237,232,0.4)' }}>Self-contained HTML file. Host anywhere — Netlify, Vercel, or your own server.</div>
                      </button>

                      {/* Download ZIP */}
                      <button onClick={handleDownloadZip} disabled={!generatedData} className="p-5 rounded-xl text-left transition-all disabled:opacity-40" style={{ background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>
                        <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.12)' }}><FileArchive size={20} style={{ color: '#d4af37' }} /></div>
                        <div className="text-sm font-black mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>Download ZIP</div>
                        <div className="text-xs leading-relaxed" style={{ color: 'rgba(240,237,232,0.4)' }}>Download all generated files as a ZIP archive with folder structure preserved.</div>
                      </button>

                      {/* Open in Cursor */}
                      <button onClick={handleOpenCursor} disabled={!generatedData} className="p-5 rounded-xl text-left transition-all disabled:opacity-40" style={{ background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>
                        <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center" style={{ background: 'rgba(156,95,255,0.12)' }}><Terminal size={20} style={{ color: '#9c5fff' }} /></div>
                        <div className="text-sm font-black mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>Open in Cursor</div>
                        <div className="text-xs leading-relaxed" style={{ color: 'rgba(240,237,232,0.4)' }}>Download ZIP + get step-by-step instructions to customise with Cursor AI.</div>
                      </button>

                      {/* Export to Shopify */}
                      <button onClick={handleShopifyExport} disabled={!generatedData} className="p-5 rounded-xl text-left transition-all disabled:opacity-40" style={{ background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>
                        <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center" style={{ background: 'rgba(45,202,114,0.12)' }}><ShoppingBag size={20} style={{ color: '#2dca72' }} /></div>
                        <div className="text-sm font-black mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>Export to Shopify</div>
                        <div className="text-xs leading-relaxed" style={{ color: 'rgba(240,237,232,0.4)' }}>Download Shopify-compatible theme ZIP with layout, sections, and config included.</div>
                      </button>

                      {/* Copy to Notion */}
                      <button onClick={handleCopyNotion} disabled={!generatedData} className="p-5 rounded-xl text-left transition-all disabled:opacity-40" style={{ background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>
                        <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}><StickyNote size={20} style={{ color: 'rgba(240,237,232,0.6)' }} /></div>
                        <div className="text-sm font-black mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>Copy to Notion</div>
                        <div className="text-xs leading-relaxed" style={{ color: 'rgba(240,237,232,0.4)' }}>Copy headline, features, CTAs, and brand story as clean Markdown for Notion.</div>
                      </button>

                      {/* Coming soon: Vercel/Netlify deploy */}
                      <div className="p-5 rounded-xl text-left" style={{ background: 'rgba(255,255,255,0.02)', border: '1.5px dashed rgba(255,255,255,0.06)' }}>
                        <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)' }}><Rocket size={20} style={{ color: 'rgba(240,237,232,0.25)' }} /></div>
                        <div className="text-sm font-black mb-1" style={{ fontFamily: 'Syne, sans-serif', color: 'rgba(240,237,232,0.35)' }}>1-Click Deploy</div>
                        <div className="text-xs leading-relaxed" style={{ color: 'rgba(240,237,232,0.25)' }}>Direct deploy to Vercel, Netlify, or Shopify — coming soon.</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── LAUNCH TAB ── */}
                {activeTab === 'launch' && (
                  <GoLiveLaunchPanel generatedData={generatedData} storeName={storeName} priceAUD={priceAUD} niche={niche} />
                )}
              </div>
            </>
          ) : (
            /* ── Empty / Loading state ── */
            <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8">
              {generating ? (
                <div className="text-center space-y-4">
                  <div className="relative w-16 h-16 mx-auto">
                    <div className="absolute inset-0 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: '#d4af37', borderRightColor: 'rgba(212,175,55,0.5)' }} />
                    <div className="absolute inset-3 rounded-full flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.1)' }}>
                      <Globe size={16} style={{ color: '#d4af37' }} />
                    </div>
                  </div>
                  <div className="text-sm font-bold" style={{ fontFamily: 'Syne, sans-serif', color: '#d4af37' }}>{PROGRESS_MESSAGES[progressMsgIdx]}</div>
                  {genProgress > 0 && (
                    <div className="w-48 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(212,175,55,0.12)' }}>
                      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${genProgress}%`, background: 'linear-gradient(90deg, #d4af37, #f0c040)' }} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center space-y-4 max-w-xs">
                  <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.1)', border: '1.5px solid rgba(212,175,55,0.2)' }}>
                    <Globe size={24} style={{ color: 'rgba(212,175,55,0.5)' }} />
                  </div>
                  <div>
                    <div className="text-base font-black mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>AU Store Generator</div>
                    <div className="text-xs leading-relaxed" style={{ color: 'rgba(240,237,232,0.35)' }}>
                      Fill in a niche and hit <strong style={{ color: 'rgba(212,175,55,0.6)' }}>Generate</strong> to build a complete Shopify-ready store with AU copy, hero, features, reviews, and FAQs.
                    </div>
                  </div>
                  <div className="text-xs" style={{ color: 'rgba(240,237,232,0.2)' }}>Tip: click an AU Template to auto-fill the form</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Cursor Modal ── */}
      <Modal open={cursorModal} onClose={() => setCursorModal(false)}>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(156,95,255,0.12)', border: '1px solid rgba(156,95,255,0.25)' }}><Terminal size={16} style={{ color: '#9c5fff' }} /></div>
            <div>
              <div className="text-sm font-black" style={{ fontFamily: 'Syne, sans-serif' }}>Open in Cursor AI</div>
              <div className="text-xs" style={{ color: 'rgba(240,237,232,0.4)' }}>Your ZIP has been downloaded</div>
            </div>
          </div>
          <pre className="text-xs rounded-xl p-4 leading-relaxed" style={{ background: 'rgba(0,0,0,0.3)', color: 'rgba(240,237,232,0.7)', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{cursorInstructions}</pre>
          <div className="flex gap-2">
            <button onClick={() => { copy(cursorInstructions, 'cursor-inst'); }} className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(240,237,232,0.6)', cursor: 'pointer', border: 'none' }}>
              {copiedKey === 'cursor-inst' ? <Check size={11} /> : <Clipboard size={11} />}{copiedKey === 'cursor-inst' ? 'Copied!' : 'Copy Instructions'}
            </button>
            <a href="https://cursor.com" target="_blank" rel="noopener noreferrer" className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5" style={{ background: 'rgba(156,95,255,0.15)', color: '#9c5fff', border: '1px solid rgba(156,95,255,0.3)', textDecoration: 'none' }}>
              <ExternalLink size={11} /> Download Cursor
            </a>
          </div>
        </div>
      </Modal>

      {/* ── Shopify Modal ── */}
      <Modal open={shopifyModal} onClose={() => setShopifyModal(false)}>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(45,202,114,0.12)', border: '1px solid rgba(45,202,114,0.25)' }}><ShoppingBag size={16} style={{ color: '#2dca72' }} /></div>
            <div>
              <div className="text-sm font-black" style={{ fontFamily: 'Syne, sans-serif' }}>Shopify Theme Downloaded</div>
              <div className="text-xs" style={{ color: 'rgba(240,237,232,0.4)' }}>Upload the ZIP to your Shopify store</div>
            </div>
          </div>
          <ol className="space-y-2 text-xs" style={{ color: 'rgba(240,237,232,0.6)' }}>
            {['Log into your Shopify Admin', 'Go to Online Store → Themes', 'Click "Add theme" → "Upload zip file"', 'Select the downloaded ZIP file', 'Preview, then click "Publish"'].map((step, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-black flex-shrink-0" style={{ color: '#d4af37' }}>{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <a href="https://admin.shopify.com" target="_blank" rel="noopener noreferrer" className="block w-full py-2.5 rounded-xl text-xs font-bold text-center" style={{ background: 'rgba(45,202,114,0.15)', color: '#2dca72', border: '1px solid rgba(45,202,114,0.3)', textDecoration: 'none' }}>
            <ExternalLink size={11} className="inline mr-1.5" />Open Shopify Admin
          </a>
        </div>
      </Modal>
    </div>
  );
}

// ── System Prompt Builder ─────────────────────────────────────────────────────
function buildSystemPrompt(vibe: string, platform: Platform, accentColor: string): string {
  return `You are a Shopify store copywriter for Australian DTC brands and dropshippers. Return ONLY valid JSON. No markdown, no code fences, no explanation text before or after. Return exactly this JSON structure:

{
  "storeName": "string",
  "tagline": "string — punchy, 8 words max",
  "headline": "string — hero section H1, bold claim, 10 words max",
  "subheadline": "string — 1-2 sentences expanding the headline",
  "features": [
    { "title": "string", "description": "string — 1 sentence" },
    { "title": "string", "description": "string — 1 sentence" },
    { "title": "string", "description": "string — 1 sentence" }
  ],
  "ctaText": "string — action verb + outcome, e.g. Shop Now",
  "brandStory": "string — 2-3 sentences, AU brand origin story",
  "metaTitle": "string — SEO title 60 chars max",
  "metaDescription": "string — SEO description 155 chars max",
  "primaryColor": "${accentColor || '#d4af37'}",
  "secondaryColor": "#hexcode",
  "fontStyle": "${vibe || 'modern'}",
  "heroImageKeyword": "string — 3-word Unsplash search term for hero image",
  "productBenefits": ["string", "string", "string"],
  "testimonials": [
    { "name": "string — Australian name", "text": "string — 1 sentence review", "location": "string — AU city" },
    { "name": "string", "text": "string", "location": "string" },
    { "name": "string", "text": "string", "location": "string" }
  ],
  "faqs": [
    { "question": "string", "answer": "string" },
    { "question": "string", "answer": "string" },
    { "question": "string", "answer": "string" }
  ]
}

Platform: ${platform}. Make copy feel authentically Australian — direct, confident, not American-corporate. Reference AU lifestyle where relevant. Use AUD pricing references. Mention Afterpay where appropriate.`;
}