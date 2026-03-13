import JSZip from 'jszip';
import {
  Check,
  ChevronDown,
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
  Package,
  ShoppingBag,
  StickyNote,
  Terminal,
  X,
} from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from 'sonner';
import { SaveToProduct } from '@/components/SaveToProduct';
import { getStoredMarket } from '@/contexts/MarketContext';
import { useProduct } from '@/contexts/ProductContext';
import { useActiveProduct } from '@/hooks/useActiveProduct';
import { trackWebsiteGenerated } from '@/lib/analytics';
import { proxyImage } from '@/lib/imageProxy';
import { cn } from '@/lib/utils';
import { buildTemplatePreview, WEBSITE_TEMPLATES } from '@/lib/website-templates';

// ── Template Definitions ─────────────────────────────────────────────────────
interface StoreTemplate {
  id: string;
  name: string;
  niche: string;
  colors: { bg: string; accent: string; text: string };
  tone: string;
  storeName: string;
  tagline: string;
}

const STORE_TEMPLATES: StoreTemplate[] = [
  {
    id: 'bondi-wellness',
    name: 'Bondi Wellness',
    niche: 'Health supplements & wellness',
    colors: { bg: '#f0faf0', accent: '#2d6a4f', text: '#1a1a2e' },
    tone: 'clean, credible, science-backed',
    storeName: 'Bondi Wellness Co',
    tagline: 'Clean Supplements for Active Australians',
  },
  {
    id: 'au-pet-collective',
    name: 'AU Pet Collective',
    niche: 'Premium pet products',
    colors: { bg: '#fff8f0', accent: '#8b4513', text: '#1a1a2e' },
    tone: 'playful, loving, premium',
    storeName: 'The AU Pet Collective',
    tagline: 'Because Your Dog Deserves Better',
  },
  {
    id: 'gold-coast-fashion',
    name: 'Gold Coast Fashion',
    niche: 'Beachwear & fashion',
    colors: { bg: '#fff9f0', accent: '#c9a227', text: '#1a1a2e' },
    tone: 'aspirational, beach lifestyle, AU summer',
    storeName: 'Sun & Salt Co',
    tagline: 'Made for the Australian Summer',
  },
  {
    id: 'tradie-gear',
    name: 'Tradie Gear AU',
    niche: 'Tools & workwear',
    colors: { bg: '#1a1a1a', accent: '#f59e0b', text: '#ffffff' },
    tone: 'no-nonsense, tough, reliable',
    storeName: 'Tradie Gear AU',
    tagline: 'Built for the Australian Tradesperson',
  },
  {
    id: 'eco-edit',
    name: 'The Eco Edit',
    niche: 'Sustainable home products',
    colors: { bg: '#f7f3ee', accent: '#5c4033', text: '#1a1a2e' },
    tone: 'conscious, minimal, warm',
    storeName: 'The Eco Edit',
    tagline: 'Sustainable Choices for Australian Homes',
  },
  {
    id: 'aussie-sports',
    name: 'Aussie Sports Hub',
    niche: 'Sports & outdoor gear',
    colors: { bg: '#0a0a2e', accent: '#00b4d8', text: '#ffffff' },
    tone: 'energetic, performance, AU outdoor culture',
    storeName: 'Aussie Sports Hub',
    tagline: 'Gear Up. Get Out. Australia.',
  },
];

// ── Types ────────────────────────────────────────────────────────────────────
interface GeneratedData {
  headline: string;
  subheadline: string;
  features: string[];
  // New simple AI content fields
  productDescription?: string;
  testimonial1?: string;
  testimonial2?: string;
  testimonial3?: string;
  ctaText?: string;
  brandStory?: string;
  // Legacy fields (backward compat)
  cta_primary?: string;
  cta_secondary?: string;
  trust_badges?: string[];
  about_section?: string;
  email_subject?: string;
  meta_description?: string;
  files?: Record<string, string>;
}

type Vibe = 'bold' | 'minimal' | 'premium';
type Platform = 'shopify' | 'nextjs' | 'react';
type ActiveTab = 'copy' | 'code' | 'preview' | 'deploy';

// ── Helpers ──────────────────────────────────────────────────────────────────
function cleanProductTitle(raw: string): string {
  const platforms = [
    'AliExpress',
    'Amazon',
    'Shopify',
    'eBay',
    'Etsy',
    'Walmart',
    'Temu',
    'DHgate',
    'Alibaba',
  ];
  let title = raw;
  for (const platform of platforms) {
    title = title.replace(new RegExp(`\\s*[-|]\\s*${platform}.*$`, 'i'), '');
  }
  title = title.replace(/\b[A-Z0-9]{6,}\b/g, '').replace(/\bSKU[-\s]?[A-Z0-9]+\b/gi, '');
  title = title
    .slice(0, 60)
    .replace(/[-|,\s]+$/, '')
    .trim();
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

function parseAIResponse(raw: string): GeneratedData | null {
  let text = raw.trim();

  // Strip markdown code fences
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (fenceMatch) text = fenceMatch[1].trim();

  // Try direct JSON parse
  try {
    const parsed = JSON.parse(text);
    if (parsed.headline) return parsed as GeneratedData;
  } catch {
    /* continue */
  }

  // Extract largest JSON object
  const firstBrace = text.indexOf('{');
  if (firstBrace !== -1) {
    let depth = 0;
    let end = -1;
    for (let i = firstBrace; i < text.length; i++) {
      if (text[i] === '{') depth++;
      else if (text[i] === '}') {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end !== -1) {
      try {
        const parsed = JSON.parse(text.slice(firstBrace, end + 1));
        if (parsed.headline) return parsed as GeneratedData;
      } catch {
        /* continue */
      }
    }
  }

  // Last resort: build from prose
  if (text.length > 200) {
    const lines = text.split('\n').filter((l) => l.trim());
    const firstLine = lines[0]?.replace(/^#+\s*/, '').slice(0, 80) || 'Your AU Ecommerce Store';
    return {
      headline: firstLine,
      subheadline: lines[1]?.slice(0, 150) || 'Built for Australian shoppers',
      features: lines
        .slice(2, 7)
        .map((l) => l.replace(/^[-*•]\s*/, '').slice(0, 100))
        .filter(Boolean),
      cta_primary: 'Shop Now',
      brandStory: 'Quality products for Australian customers.',
    } as GeneratedData;
  }

  return null;
}

function buildPreviewHTML(data: GeneratedData, accentColor: string): string {
  const bg = '#080a0e';
  const text = '#f2efe9';
  const surf = '#111114';
  const accent = accentColor;

  return `<!DOCTYPE html>
<html lang="en-AU">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${data.headline}</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800;900&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:${bg};color:${text};font-family:'DM Sans',sans-serif;line-height:1.6}
h1,h2,h3{font-family:'Syne',sans-serif;font-weight:800}
.hero{min-height:70vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:80px 24px;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at center,${accent}15 0%,transparent 70%)}
.hero-hl{font-size:clamp(32px,5vw,56px);letter-spacing:-1.5px;line-height:1.08;margin-bottom:20px;max-width:800px}
.hero-hl span{color:${accent}}
.hero-sub{font-size:18px;opacity:.6;max-width:600px;margin:0 auto 36px;line-height:1.7}
.btn-primary{display:inline-flex;align-items:center;gap:10px;padding:18px 40px;background:${accent};color:#fff;font-family:'Syne',sans-serif;font-weight:800;font-size:17px;border:none;border-radius:14px;cursor:pointer;box-shadow:0 8px 30px ${accent}44;transition:all .2s;text-decoration:none}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 14px 40px ${accent}55}
.btn-secondary{display:inline-flex;align-items:center;gap:8px;padding:16px 32px;background:transparent;color:${text};font-family:'Syne',sans-serif;font-weight:700;font-size:15px;border:2px solid rgba(255,255,255,0.15);border-radius:14px;cursor:pointer;transition:all .2s;text-decoration:none;margin-left:12px}
.features{padding:80px 24px;background:${surf}}
.features-inner{max-width:1000px;margin:0 auto}
.features h2{text-align:center;font-size:clamp(24px,3vw,36px);margin-bottom:48px;letter-spacing:-.5px}
.features-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
@media(max-width:768px){.features-grid{grid-template-columns:1fr}}
.feat-card{background:${bg};border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:28px}
.feat-dot{width:40px;height:40px;border-radius:12px;background:${accent}22;color:${accent};display:flex;align-items:center;justify-content:center;font-size:18px;margin-bottom:16px;font-weight:800}
.feat-card h3{font-size:16px;margin-bottom:8px}
.feat-card p{font-size:14px;opacity:.55;line-height:1.7}
.trust{padding:48px 24px;text-align:center;border-top:1px solid rgba(255,255,255,0.06)}
.trust-inner{max-width:900px;margin:0 auto;display:flex;flex-wrap:wrap;gap:20px;justify-content:center}
.trust-badge{display:flex;align-items:center;gap:8px;padding:10px 20px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:99px;font-size:13px;font-weight:600;color:rgba(255,255,255,0.65)}
.trust-badge::before{content:'\\2713';color:${accent};font-weight:800}
.cta-sec{padding:80px 24px;text-align:center;background:linear-gradient(180deg,${bg},${accent}11)}
.cta-sec h2{font-size:clamp(24px,4vw,42px);margin-bottom:16px;letter-spacing:-.8px}
.cta-sec p{font-size:16px;opacity:.55;max-width:500px;margin:0 auto 32px;line-height:1.7}
.cta-input{display:flex;gap:8px;max-width:420px;margin:0 auto}
.cta-input input{flex:1;padding:14px 20px;border-radius:12px;border:1.5px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);color:${text};font-size:14px;outline:none}
.cta-input button{padding:14px 28px;background:${accent};color:#fff;font-family:'Syne',sans-serif;font-weight:800;border:none;border-radius:12px;cursor:pointer;font-size:14px}
</style>
</head>
<body>
<section id="hero" class="hero">
  <h1 class="hero-hl">${data.headline.replace(/\b(\w+)$/, '<span>$1</span>')}</h1>
  <p class="hero-sub">${data.subheadline}</p>
  <div>
    <a class="btn-primary" href="#features" onclick="event.preventDefault();document.getElementById('features').scrollIntoView({behavior:'smooth'})">${data.cta_primary}</a>
    <a class="btn-secondary" href="#cta-sec" onclick="event.preventDefault();document.getElementById('cta-sec').scrollIntoView({behavior:'smooth'})">${data.cta_secondary}</a>
  </div>
</section>

<section id="features" class="features">
  <div class="features-inner">
    <h2>Why Choose Us</h2>
    <div class="features-grid">
      ${(data.features || [])
        .slice(0, 6)
        .map(
          (f, i) => `
      <div class="feat-card">
        <div class="feat-dot">${i + 1}</div>
        <h3>${f}</h3>
        <p>Designed for Australian customers who demand quality and reliability.</p>
      </div>`
        )
        .join('')}
    </div>
  </div>
</section>

<section id="trust" class="trust">
  <div class="trust-inner">
    ${(data.trust_badges || []).map((b) => `<div class="trust-badge">${b}</div>`).join('')}
  </div>
</section>

<section id="cta-sec" class="cta-sec">
  <h2>Ready to Get Started?</h2>
  <p>${data.about_section ? data.about_section.slice(0, 200) : 'Join thousands of happy Australian customers.'}</p>
  <div class="cta-input">
    <input type="email" placeholder="Enter your email" />
    <button>${data.cta_primary}</button>
  </div>
</section>
</body>
</html>`;
}

// ── Copy Button Hook ─────────────────────────────────────────────────────────
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

// ── File Tree Component ──────────────────────────────────────────────────────
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
              style={{
                color: 'rgba(240,237,232,0.55)',
                cursor: 'pointer',
                border: 'none',
                background: 'none',
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              {expanded[folder] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <FolderOpen size={12} style={{ color: '#d4af37' }} />
              <span className="font-semibold">{folder}</span>
            </button>
          )}
          {(folder === '.' || expanded[folder]) &&
            paths.map((path) => {
              const fileName = path.split('/').pop()!;
              const isActive = activeFile === path;
              return (
                <button
                  key={path}
                  onClick={() => onSelect(path)}
                  className="flex items-center gap-1.5 w-full py-1 text-xs transition-colors"
                  style={{
                    paddingLeft: folder === '.' ? 12 : 32,
                    paddingRight: 12,
                    background: isActive ? 'rgba(212,175,55,0.1)' : 'transparent',
                    color: isActive ? '#d4af37' : 'rgba(240,237,232,0.5)',
                    borderLeft: isActive ? '2px solid #d4af37' : '2px solid transparent',
                    cursor: 'pointer',
                    border: 'none',
                    borderLeftWidth: 2,
                    borderLeftStyle: 'solid',
                    borderLeftColor: isActive ? '#d4af37' : 'transparent',
                    fontFamily: 'monospace',
                  }}
                >
                  {fileName.endsWith('.json') ? (
                    <FileCode size={12} style={{ color: '#f0c040' }} />
                  ) : fileName.endsWith('.md') ? (
                    <FileText size={12} style={{ color: '#7c9fff' }} />
                  ) : (
                    <FileCode size={12} style={{ color: '#9c5fff' }} />
                  )}
                  <span>{fileName}</span>
                </button>
              );
            })}
        </div>
      ))}
    </div>
  );
}

// ── Modal Component ──────────────────────────────────────────────────────────
function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg mx-4 rounded-2xl p-6"
        style={{ background: '#0f1118', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4"
          style={{
            color: 'rgba(240,237,232,0.4)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function WebsiteGenerator() {
  const { activeProduct: contextProduct } = useProduct();
  const { activeProduct: legacyProduct } = useActiveProduct();
  const activeProduct = contextProduct ?? legacyProduct;

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
  const [vibe, setVibe] = useState<Vibe>('premium');
  const [accentColor, setAccentColor] = useState('#d4af37');
  const [platform, setPlatform] = useState<Platform>('shopify');

  // Output
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [generatedData, setGeneratedData] = useState<GeneratedData | null>(null);
  const [rawResponse, setRawResponse] = useState<string | null>(null);
  const [parseWarning, setParseWarning] = useState(false);
  const [genError, setGenError] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('copy');

  // Code tab
  const [activeFile, setActiveFile] = useState<string | null>(null);

  // Deploy modals
  const [cursorModal, setCursorModal] = useState(false);
  const [shopifyModal, setShopifyModal] = useState(false);

  // Template preview
  const [templatePreview, setTemplatePreview] = useState<StoreTemplate | null>(null);
  const [showTemplates, setShowTemplates] = useState(true);

  // Premium template selection
  const [premiumTemplateId, setPremiumTemplateId] = useState<string>(WEBSITE_TEMPLATES[0].id);

  // Preview device toggle
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Copy
  const { copiedKey, copy } = useCopyBtn();

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
      const data = (await response.json()) as {
        productTitle: string;
        description: string;
        bulletPoints: string[];
        price: string;
        imageUrls: string[];
        brand?: string;
        extractionError?: string;
      };
      if (data.extractionError) throw new Error(data.extractionError);

      const finalTitle = cleanProductTitle(data.productTitle || 'Imported Product');
      setImportedProduct({
        title: finalTitle,
        description: data.description,
        features: data.bulletPoints,
        price: data.price,
        images: data.imageUrls,
        sourceUrl: importUrl,
      });
      if (!storeName.trim() && data.brand) setStoreName(data.brand.slice(0, 40));
      toast.success('Product imported successfully');
    } catch (err: any) {
      setImportError(
        err?.message || 'Could not import. Try a different URL or fill in details manually.'
      );
    } finally {
      setImporting(false);
    }
  }, [importUrl, storeName]);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setGenError('');
    setGenProgress(0);
    setParseWarning(false);

    const progressInterval = setInterval(() => setGenProgress((p) => Math.min(p + 3, 92)), 500);

    try {
      const productContext = importedProduct
        ? `Product: ${importedProduct.title}\nDescription: ${importedProduct.description || 'N/A'}\nFeatures: ${(importedProduct.features || []).join(', ')}\nPrice: ${importedProduct.price || 'N/A'}`
        : '';

      const selectedTemplate = WEBSITE_TEMPLATES.find((t) => t.id === premiumTemplateId);
      const templateNote = selectedTemplate
        ? `\nDesign Template: ${selectedTemplate.name} (${selectedTemplate.category}) — ${selectedTemplate.description}`
        : '';

      const userMessage = `Generate a complete website for:
Store name: ${storeName || 'My Store'}
Niche: ${niche || 'general ecommerce'}
Target audience: ${targetAudience || 'Australian online shoppers'}
Vibe: ${vibe}
Brand colour: ${accentColor}
Platform: ${platform}${templateNote}
${productContext}

Return ONLY valid JSON with the exact structure specified in your system prompt. No markdown, no code blocks, just the JSON object.`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userMessage }],
          toolName: 'website-generator',
          systemPrompt: buildSystemPrompt(vibe, platform, accentColor),
          market: getStoredMarket(),
        }),
      });

      if (!response.ok) throw new Error(`Generation failed: ${response.status}`);

      const data = await response.json();
      const fullText: string = data.reply || data.response || data.content || '';

      clearInterval(progressInterval);
      setGenProgress(100);
      setRawResponse(fullText);

      const parsed = parseAIResponse(fullText);
      if (parsed) {
        setGeneratedData(parsed);
        setActiveTab('copy');
        // Set active file to first file (legacy - when files present)
        if (parsed.files) {
          const firstFile = Object.keys(parsed.files)[0];
          if (firstFile) setActiveFile(firstFile);
        }
        toast.success('Website generated!');
        trackWebsiteGenerated({ niche, platform, vibe, market: getStoredMarket() });
        localStorage.setItem('majorka_milestone_site', 'true');
      } else {
        setParseWarning(true);
        setActiveTab('copy');
        toast.warning('Generated content could not be parsed as JSON. Showing raw output.');
      }
    } catch (err: any) {
      setGenError(err?.message || 'Generation failed. Please try again.');
    } finally {
      clearInterval(progressInterval);
      setGenerating(false);
      setGenProgress(0);
    }
  }, [storeName, niche, targetAudience, vibe, accentColor, platform, importedProduct]);

  // ── Export handlers ───────────────────────────────────────────────────────

  const handleDownloadZip = useCallback(async () => {
    if (!generatedData?.files) return;
    const zip = new JSZip();
    for (const [path, content] of Object.entries(generatedData.files)) {
      zip.file(path, content);
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(storeName || 'store').replace(/\s+/g, '-').toLowerCase()}-theme.zip`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('ZIP downloaded!');
  }, [generatedData, storeName]);

  const handleShopifyExport = useCallback(async () => {
    if (!generatedData) return;
    const zip = new JSZip();
    const name = storeName || 'My Store';
    const accent = accentColor;
    const hl = generatedData.headline;
    const sub = generatedData.subheadline;
    const feats = generatedData.features || [];
    const badges = generatedData.trust_badges || [];
    const ctaPrimary = generatedData.cta_primary || 'Shop Now';
    const ctaSecondary = generatedData.cta_secondary || 'Learn More';
    const about = generatedData.about_section || '';

    // Add any AI-generated files
    for (const [path, content] of Object.entries(generatedData.files || {})) {
      zip.file(path, content);
    }

    // layout/theme.liquid
    zip.file(
      'layout/theme.liquid',
      `<!DOCTYPE html>
<html lang="en-AU">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{{ page_title }} — ${name}</title>
  {{ content_for_header }}
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800;900&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  {{ 'theme.css' | asset_url | stylesheet_tag }}
</head>
<body>
  <header class="site-header">
    <div class="header-inner">
      <a href="/" class="logo">{{ shop.name }}</a>
      <nav>
        <a href="/collections/all">Shop</a>
        <a href="/pages/about">About</a>
        <a href="/cart">Cart ({{ cart.item_count }})</a>
      </nav>
    </div>
  </header>
  <main>{{ content_for_layout }}</main>
  {% section 'footer' %}
  <!-- Afterpay Widget -->
  <script src="https://portal.afterpay.com/afterpay.js" defer></script>
</body>
</html>`
    );

    // templates/index.liquid
    zip.file(
      'templates/index.liquid',
      `{% section 'hero' %}
{% section 'featured-products' %}
{% section 'footer' %}`
    );

    // templates/product.liquid
    zip.file(
      'templates/product.liquid',
      `<div class="product-page">
  <div class="product-images">
    {% for image in product.images %}
      <img src="{{ image | img_url: '600x' }}" alt="{{ image.alt | escape }}">
    {% endfor %}
  </div>
  <div class="product-info">
    <h1>{{ product.title }}</h1>
    <p class="product-price">\${{ product.price | money }} AUD <span class="gst-badge">GST Inclusive</span></p>
    <div class="product-description">{{ product.description }}</div>
    {% form 'product', product %}
      <select name="id">
        {% for variant in product.variants %}
          <option value="{{ variant.id }}">{{ variant.title }} — \${{ variant.price | money }}</option>
        {% endfor %}
      </select>
      <button type="submit" class="btn-primary">Add to Cart</button>
    {% endform %}
    <div class="afterpay-widget">
      <afterpay-placement data-locale="en_AU" data-currency="AUD" data-amount="{{ product.price | money_without_currency }}"></afterpay-placement>
    </div>
    <div class="trust-badges">
      ${badges.map((b) => `<span class="badge">✓ ${b}</span>`).join('\n      ')}
    </div>
  </div>
</div>`
    );

    // templates/collection.liquid
    zip.file(
      'templates/collection.liquid',
      `<div class="collection-page">
  <h1>{{ collection.title }}</h1>
  <p>{{ collection.description }}</p>
  <div class="product-grid">
    {% for product in collection.products %}
      <a href="{{ product.url }}" class="product-card">
        <img src="{{ product.featured_image | img_url: '400x' }}" alt="{{ product.title | escape }}">
        <h3>{{ product.title }}</h3>
        <p>\${{ product.price | money }} AUD</p>
      </a>
    {% endfor %}
  </div>
</div>`
    );

    // templates/cart.liquid
    zip.file(
      'templates/cart.liquid',
      `<div class="cart-page">
  <h1>Your Cart</h1>
  {% if cart.item_count > 0 %}
    {% for item in cart.items %}
      <div class="cart-item">
        <img src="{{ item.image | img_url: '100x' }}" alt="{{ item.title | escape }}">
        <div>
          <h3>{{ item.title }}</h3>
          <p>\${{ item.line_price | money }} AUD</p>
          <input type="number" name="updates[]" value="{{ item.quantity }}" min="0">
        </div>
      </div>
    {% endfor %}
    <div class="cart-total">
      <strong>Total: \${{ cart.total_price | money }} AUD</strong>
      <span class="gst-note">All prices include GST</span>
    </div>
    <div class="afterpay-widget">
      <afterpay-placement data-locale="en_AU" data-currency="AUD" data-amount="{{ cart.total_price | money_without_currency }}"></afterpay-placement>
    </div>
    <button onclick="window.location='/checkout'" class="btn-primary">Checkout</button>
  {% else %}
    <p>Your cart is empty. <a href="/collections/all">Continue shopping</a></p>
  {% endif %}
</div>`
    );

    // sections/hero.liquid
    zip.file(
      'sections/hero.liquid',
      `<section class="hero" style="background:${accent}08">
  <div class="hero-inner">
    <h1 class="hero-hl">${hl}</h1>
    <p class="hero-sub">${sub}</p>
    <div class="hero-ctas">
      <a href="/collections/all" class="btn-primary">${ctaPrimary}</a>
      <a href="/pages/about" class="btn-secondary">${ctaSecondary}</a>
    </div>
  </div>
</section>
{% schema %}
{
  "name": "Hero Banner",
  "settings": [
    { "type": "text", "id": "heading", "label": "Heading", "default": "${hl}" },
    { "type": "text", "id": "subheading", "label": "Subheading", "default": "${sub}" }
  ]
}
{% endschema %}`
    );

    // sections/featured-products.liquid
    zip.file(
      'sections/featured-products.liquid',
      `<section class="featured-products">
  <h2>{{ section.settings.title | default: "Our Bestsellers" }}</h2>
  <div class="product-grid">
    {% for product in collections.all.products limit:6 %}
      <a href="{{ product.url }}" class="product-card">
        <img src="{{ product.featured_image | img_url: '400x' }}" alt="{{ product.title | escape }}">
        <h3>{{ product.title }}</h3>
        <p>\${{ product.price | money }} AUD</p>
      </a>
    {% endfor %}
  </div>
</section>
{% schema %}
{
  "name": "Featured Products",
  "settings": [
    { "type": "text", "id": "title", "label": "Section Title", "default": "Our Bestsellers" }
  ]
}
{% endschema %}`
    );

    // sections/footer.liquid
    zip.file(
      'sections/footer.liquid',
      `<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-col">
      <h4>${name}</h4>
      <p>${about || 'Australian-owned and operated.'}</p>
    </div>
    <div class="footer-col">
      <h4>Shop</h4>
      <a href="/collections/all">All Products</a>
      <a href="/pages/about">About Us</a>
      <a href="/policies/refund-policy">Returns</a>
    </div>
    <div class="footer-col">
      <h4>Support</h4>
      <a href="/pages/contact">Contact</a>
      <a href="/policies/shipping-policy">Shipping</a>
      <a href="/policies/privacy-policy">Privacy</a>
    </div>
    <div class="footer-col">
      <h4>We Accept</h4>
      <div class="payment-icons">Visa · Mastercard · Afterpay · Zip · Apple Pay</div>
    </div>
  </div>
  <div class="footer-bottom">
    <p>© {{ 'now' | date: '%Y' }} ${name}. All rights reserved. ABN: [Enter your ABN]</p>
    <p>Australian Consumer Law applies. All prices in AUD and include GST.</p>
  </div>
</footer>
{% schema %}
{
  "name": "Footer",
  "settings": [
    { "type": "text", "id": "abn", "label": "ABN", "default": "" }
  ]
}
{% endschema %}`
    );

    // assets/theme.css
    zip.file(
      'assets/theme.css',
      `/* ${name} Theme — Generated by Majorka AI */
:root { --accent: ${accent}; --bg: #080a0e; --text: #f2efe9; --surface: #111114; }
* { margin:0; padding:0; box-sizing:border-box; }
body { background:var(--bg); color:var(--text); font-family:'DM Sans',sans-serif; line-height:1.6; }
h1,h2,h3,h4 { font-family:'Syne',sans-serif; font-weight:800; }
.site-header { border-bottom:1px solid rgba(255,255,255,.06); padding:16px 24px; }
.header-inner { max-width:1200px; margin:0 auto; display:flex; align-items:center; justify-content:space-between; }
.logo { font-family:'Syne',sans-serif; font-weight:900; font-size:20px; color:var(--text); text-decoration:none; }
nav a { color:rgba(255,255,255,.6); text-decoration:none; margin-left:24px; font-size:14px; }
nav a:hover { color:var(--accent); }
.hero { min-height:70vh; display:flex; align-items:center; justify-content:center; text-align:center; padding:80px 24px; }
.hero-inner { max-width:800px; }
.hero-hl { font-size:clamp(32px,5vw,56px); letter-spacing:-1.5px; line-height:1.08; margin-bottom:20px; }
.hero-sub { font-size:18px; opacity:.6; margin-bottom:36px; line-height:1.7; }
.btn-primary { display:inline-flex; align-items:center; gap:10px; padding:18px 40px; background:var(--accent); color:#fff; font-family:'Syne',sans-serif; font-weight:800; font-size:17px; border:none; border-radius:14px; cursor:pointer; text-decoration:none; }
.btn-secondary { display:inline-flex; align-items:center; gap:8px; padding:16px 32px; background:transparent; color:var(--text); font-family:'Syne',sans-serif; font-weight:700; font-size:15px; border:2px solid rgba(255,255,255,.15); border-radius:14px; cursor:pointer; text-decoration:none; margin-left:12px; }
.product-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; max-width:1200px; margin:0 auto; padding:48px 24px; }
@media(max-width:768px) { .product-grid { grid-template-columns:repeat(2,1fr); } }
.product-card { background:var(--surface); border:1px solid rgba(255,255,255,.06); border-radius:16px; overflow:hidden; text-decoration:none; color:var(--text); transition:transform .2s; }
.product-card:hover { transform:translateY(-4px); }
.product-card img { width:100%; aspect-ratio:1; object-fit:cover; }
.product-card h3 { padding:12px 16px 0; font-size:14px; }
.product-card p { padding:4px 16px 16px; color:var(--accent); font-weight:700; }
.featured-products { padding:80px 24px; }
.featured-products h2 { text-align:center; font-size:clamp(24px,3vw,36px); margin-bottom:48px; }
.product-page { display:grid; grid-template-columns:1fr 1fr; gap:48px; max-width:1200px; margin:0 auto; padding:48px 24px; }
@media(max-width:768px) { .product-page { grid-template-columns:1fr; } }
.product-price { font-size:24px; color:var(--accent); font-weight:800; margin:12px 0; }
.gst-badge { font-size:11px; background:rgba(45,202,114,.1); color:#2dca72; padding:4px 10px; border-radius:99px; margin-left:8px; }
.trust-badges { display:flex; flex-wrap:wrap; gap:8px; margin-top:20px; }
.badge { display:flex; align-items:center; gap:6px; padding:8px 16px; background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.06); border-radius:99px; font-size:12px; color:rgba(255,255,255,.65); }
.cart-page { max-width:800px; margin:0 auto; padding:48px 24px; }
.cart-item { display:flex; gap:16px; padding:16px 0; border-bottom:1px solid rgba(255,255,255,.06); }
.cart-total { padding:24px 0; font-size:20px; }
.gst-note { font-size:12px; opacity:.5; display:block; margin-top:4px; }
.site-footer { border-top:1px solid rgba(255,255,255,.06); padding:48px 24px; }
.footer-inner { max-width:1200px; margin:0 auto; display:grid; grid-template-columns:repeat(4,1fr); gap:32px; }
@media(max-width:768px) { .footer-inner { grid-template-columns:repeat(2,1fr); } }
.footer-col h4 { font-size:14px; margin-bottom:12px; color:var(--accent); }
.footer-col a { display:block; font-size:13px; color:rgba(255,255,255,.5); text-decoration:none; margin-bottom:8px; }
.footer-bottom { max-width:1200px; margin:24px auto 0; padding-top:24px; border-top:1px solid rgba(255,255,255,.06); font-size:12px; opacity:.4; text-align:center; }
.payment-icons { font-size:12px; opacity:.6; }
.afterpay-widget { margin:16px 0; }
`
    );

    // config/settings_schema.json
    zip.file(
      'config/settings_schema.json',
      JSON.stringify(
        [
          {
            name: 'theme_info',
            theme_name: name,
            theme_version: '1.0.0',
            theme_author: 'Majorka AI',
            theme_documentation_url: 'https://majorka.ai',
            theme_support_url: 'https://majorka.ai/support',
          },
          {
            name: 'Colors',
            settings: [
              { type: 'color', id: 'accent_color', label: 'Accent Color', default: accent },
              {
                type: 'color',
                id: 'background_color',
                label: 'Background Color',
                default: '#080a0e',
              },
            ],
          },
        ],
        null,
        2
      )
    );

    // locales/en.default.json
    zip.file(
      'locales/en.default.json',
      JSON.stringify(
        {
          general: {
            currency: 'AUD',
            add_to_cart: 'Add to Cart',
            sold_out: 'Sold Out',
            shipping_note: 'Free AU shipping over $99',
            gst_note: 'All prices include GST',
          },
          cart: {
            title: 'Your Cart',
            empty: 'Your cart is empty',
            checkout: 'Checkout',
            total: 'Total',
          },
        },
        null,
        2
      )
    );

    // README.md
    zip.file(
      'README.md',
      `# ${name} — Shopify Theme

Generated by [Majorka AI](https://majorka.ai)

## How to Upload to Shopify

1. Log in to your **Shopify Admin** panel
2. Go to **Online Store** → **Themes**
3. Click **Add theme** → **Upload zip file**
4. Select this ZIP file and wait for upload to complete
5. Click **Customise** to edit your theme
6. Click **Publish** when you're ready to go live

## Theme Structure

- \`layout/theme.liquid\` — Main layout (includes Afterpay widget, AU trust badges)
- \`templates/\` — Page templates (index, product, collection, cart)
- \`sections/\` — Editable sections (hero, featured products, footer)
- \`assets/theme.css\` — Theme styles using brand colour ${accent}
- \`config/settings_schema.json\` — Theme settings
- \`locales/en.default.json\` — AU English strings

## Australian Compliance

- All prices in AUD with GST included
- Afterpay/Zip payment widgets included
- Australian Consumer Law footer text
- ABN placeholder (update with your real ABN)
- Privacy and returns policy links

## Customisation

Edit the theme in Shopify's theme editor or download and open in [Cursor](https://cursor.com) for AI-assisted customisation.
`
    );

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
    const md = `# ${generatedData.headline}

## ${generatedData.subheadline}

### Features
${generatedData.features.map((f) => `- ${f}`).join('\n')}

### Call to Action
- **Primary:** ${generatedData.cta_primary}
- **Secondary:** ${generatedData.cta_secondary}

### Trust Badges
${(generatedData.trust_badges ?? []).map((b) => `- ${b}`).join('\n')}

### About
${generatedData.about_section ?? generatedData.brandStory ?? ''}

### Meta Description
${generatedData.meta_description}

### Email Subject Line
${generatedData.email_subject}`;

    navigator.clipboard.writeText(md).catch(() => {});
    toast.success('Copied to clipboard in Notion format!');
  }, [generatedData]);

  const handleOpenCursor = useCallback(async () => {
    await handleDownloadZip();
    setCursorModal(true);
  }, [handleDownloadZip]);

  const cursorInstructions = `1. Unzip the downloaded file
2. Open Cursor (cursor.com)
3. File -> Open Folder -> select unzipped folder
4. In Cursor chat: I have a Shopify theme. Help me customise it for ${storeName || '[store name]'}
5. Cursor will read all files and help you build`;

  // ── Preview HTML ──────────────────────────────────────────────────────────
  const previewHTML = useMemo(() => {
    if (!generatedData) return '';
    return buildTemplatePreview(
      premiumTemplateId,
      {
        brandName: storeName || 'Your Brand',
        brandColor: accentColor,
        productName: importedProduct?.title || niche || 'Our Product',
        niche: niche || 'products',
        tagline: tagline || undefined,
        price: priceAUD || undefined,
      },
      {
        headline: generatedData.headline,
        subheadline: generatedData.subheadline,
        productDescription: generatedData.productDescription,
        features: generatedData.features,
        testimonial1: generatedData.testimonial1,
        testimonial2: generatedData.testimonial2,
        testimonial3: generatedData.testimonial3,
        ctaText: generatedData.ctaText,
        brandStory: generatedData.brandStory,
        cta_primary: generatedData.cta_primary,
        about_section: generatedData.about_section,
      }
    );
  }, [
    generatedData,
    accentColor,
    premiumTemplateId,
    storeName,
    niche,
    importedProduct,
    tagline,
    priceAUD,
  ]);

  const handleDownloadHTML = useCallback(() => {
    if (!previewHTML) return;
    const blob = new Blob([previewHTML], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(storeName || 'store').replace(/\s+/g, '-').toLowerCase()}-website.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('HTML file downloaded!');
  }, [previewHTML, storeName]);

  const handleOpenPreviewNewTab = useCallback(() => {
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(previewHTML);
      win.document.close();
    }
  }, [previewHTML]);

  // ── Render ────────────────────────────────────────────────────────────────
  const hasOutput = generatedData || rawResponse;

  return (
    <div
      className="h-full flex flex-col"
      style={{ background: '#080a0e', color: '#f0ede8', fontFamily: 'DM Sans, sans-serif' }}
    >
      {/* ── Top bar ── */}
      <div
        className="flex items-center gap-3 px-5 py-3 border-b flex-shrink-0"
        style={{ borderColor: 'rgba(255,255,255,0.07)', background: '#0c0e12' }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)' }}
        >
          <Globe size={15} style={{ color: '#d4af37' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-sm font-black leading-tight"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            Website Generator
          </div>
          <div className="text-xs" style={{ color: 'rgba(240,237,232,0.35)' }}>
            AI-powered Shopify theme builder for AU market
          </div>
        </div>
      </div>

      {/* ── Body: two-panel split ── */}
      <div className="flex-1 overflow-hidden flex">
        {/* ── LEFT PANEL (400px fixed) ── */}
        <div
          className="flex-shrink-0 overflow-y-auto p-5 space-y-4"
          style={{
            width: 400,
            borderRight: '1px solid rgba(255,255,255,0.07)',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.1) transparent',
          }}
        >
          {/* Premium Template Selector — 3-col grid */}
          <div
            className="rounded-xl p-4"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1.5px solid rgba(212,175,55,0.2)',
            }}
          >
            <div
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: '#d4af37', fontFamily: 'Syne, sans-serif' }}
            >
              Choose Template
            </div>
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
              {WEBSITE_TEMPLATES.map((t) => {
                const isSelected = premiumTemplateId === t.id;
                const isDark = t.palette.bg.startsWith('#0') || t.palette.bg.startsWith('#1');
                return (
                  <button
                    key={t.id}
                    onClick={() => setPremiumTemplateId(t.id)}
                    className="flex flex-col w-full rounded-lg text-left transition-all overflow-hidden"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: `2px solid ${isSelected ? '#d4af37' : 'rgba(255,255,255,0.08)'}`,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    {/* CSS thumbnail */}
                    <div
                      style={{
                        height: 68,
                        background: `linear-gradient(135deg, ${t.palette.bg} 0%, ${t.palette.accent}55 100%)`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        gap: 4,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'Syne, sans-serif',
                          fontWeight: 900,
                          fontSize: 8,
                          letterSpacing: 1.5,
                          textTransform: 'uppercase',
                          color: isDark ? t.palette.accent : t.palette.text,
                          lineHeight: 1,
                        }}
                      >
                        {t.name}
                      </span>
                      <div style={{ display: 'flex', gap: 3 }}>
                        {[t.palette.bg, t.palette.accent, t.palette.text].map((c, i) => (
                          <div
                            key={i}
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: '50%',
                              background: c,
                              border: '1px solid rgba(128,128,128,0.3)',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    {/* Card bottom */}
                    <div style={{ padding: '8px 8px 10px' }}>
                      <div
                        style={{
                          fontFamily: 'Syne, sans-serif',
                          fontWeight: 700,
                          fontSize: 10,
                          color: isSelected ? '#d4af37' : '#f0ede8',
                          marginBottom: 3,
                          lineHeight: 1.2,
                        }}
                      >
                        {t.name}
                      </div>
                      <div
                        style={{
                          fontSize: 9,
                          color: 'rgba(240,237,232,0.4)',
                          lineHeight: 1.4,
                          marginBottom: 5,
                        }}
                      >
                        {t.description.slice(0, 42)}…
                      </div>
                      <div
                        style={{
                          display: 'inline-flex',
                          fontSize: 8,
                          fontWeight: 700,
                          letterSpacing: 0.5,
                          textTransform: 'capitalize',
                          padding: '2px 6px',
                          borderRadius: 3,
                          background: isSelected
                            ? 'rgba(212,175,55,0.15)'
                            : 'rgba(255,255,255,0.06)',
                          color: isSelected ? '#d4af37' : 'rgba(240,237,232,0.45)',
                          border: `1px solid ${isSelected ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.08)'}`,
                        }}
                      >
                        {t.category}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Template Gallery */}
          <div
            className="rounded-xl p-4"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1.5px solid rgba(255,255,255,0.08)',
            }}
          >
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="w-full flex items-center justify-between mb-2"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <span
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: '#d4af37', fontFamily: 'Syne, sans-serif' }}
              >
                Store Templates
              </span>
              <ChevronDown
                size={14}
                style={{
                  color: 'rgba(240,237,232,0.4)',
                  transform: showTemplates ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.2s',
                }}
              />
            </button>
            {showTemplates && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {STORE_TEMPLATES.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-lg overflow-hidden transition-all"
                    style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    {/* Mini preview card */}
                    <div className="h-16 relative" style={{ background: t.colors.bg }}>
                      <div className="absolute inset-0 flex flex-col items-center justify-center px-2">
                        <div
                          className="text-xs font-black truncate w-full text-center"
                          style={{
                            color: t.colors.accent,
                            fontFamily: 'Syne, sans-serif',
                            fontSize: 9,
                          }}
                        >
                          {t.storeName}
                        </div>
                        <div
                          style={{ fontSize: 7, color: t.colors.text, opacity: 0.6 }}
                          className="truncate w-full text-center"
                        >
                          {t.tagline}
                        </div>
                        <div className="flex gap-1 mt-1">
                          {[t.colors.bg, t.colors.accent, t.colors.text].map((c, i) => (
                            <div
                              key={i}
                              className="w-3 h-3 rounded-full"
                              style={{ background: c, border: '1px solid rgba(0,0,0,0.15)' }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="px-2 py-2" style={{ background: '#0c0e12' }}>
                      <div
                        className="text-xs font-bold truncate"
                        style={{ fontFamily: 'Syne, sans-serif', color: '#f0ede8', fontSize: 10 }}
                      >
                        {t.name}
                      </div>
                      <div
                        className="text-xs truncate"
                        style={{ color: 'rgba(240,237,232,0.35)', fontSize: 9 }}
                      >
                        {t.niche}
                      </div>
                      <div className="flex gap-1.5 mt-1.5">
                        <button
                          onClick={() => {
                            setStoreName(t.storeName);
                            setNiche(t.niche);
                            setTargetAudience('Australian online shoppers');
                            setAccentColor(t.colors.accent);
                            setShowTemplates(false);
                            toast.success(`"${t.name}" template loaded`);
                          }}
                          className="flex-1 py-1 rounded text-xs font-bold"
                          style={{
                            background: 'linear-gradient(135deg, #d4af37, #f0c040)',
                            color: '#080a0e',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: 'Syne, sans-serif',
                            fontSize: 9,
                          }}
                        >
                          Use
                        </button>
                        <button
                          onClick={() => setTemplatePreview(t)}
                          className="flex-1 py-1 rounded text-xs font-bold"
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'rgba(240,237,232,0.6)',
                            cursor: 'pointer',
                            fontFamily: 'Syne, sans-serif',
                            fontSize: 9,
                          }}
                        >
                          Preview
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product URL Import */}
          <div
            className="rounded-xl p-4"
            style={{
              background: importedProduct ? 'rgba(45,202,114,0.05)' : 'rgba(255,255,255,0.03)',
              border: `1.5px solid ${importedProduct ? 'rgba(45,202,114,0.35)' : 'rgba(255,255,255,0.09)'}`,
            }}
          >
            <div
              className="text-xs font-bold uppercase tracking-widest mb-2.5"
              style={{ color: 'rgba(240,237,232,0.4)', fontFamily: 'Syne, sans-serif' }}
            >
              Import Product
            </div>
            {importedProduct ? (
              <div>
                <div className="flex gap-2.5 items-start mb-2">
                  <div
                    className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center text-lg"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    {importedProduct.images && importedProduct.images.length > 0 ? (
                      <img
                        src={proxyImage(importedProduct.images[0])}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      '📦'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-xs font-bold truncate"
                      style={{ fontFamily: 'Syne, sans-serif' }}
                    >
                      {importedProduct.title}
                    </div>
                    {importedProduct.price && (
                      <div className="text-xs mt-0.5" style={{ color: 'rgba(45,202,114,0.75)' }}>
                        ${importedProduct.price} AUD
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setImportedProduct(null);
                      setImportUrl('');
                    }}
                    style={{
                      color: 'rgba(240,237,232,0.3)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="text-xs font-semibold" style={{ color: 'rgba(45,202,114,0.75)' }}>
                  ✓ Product data imported
                </div>
              </div>
            ) : (
              <div>
                <div className="flex gap-1.5">
                  <input
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleImport();
                      }
                    }}
                    placeholder="Paste product URL (AliExpress, Amazon, Shopify…)"
                    className="flex-1 text-xs px-3 py-2 rounded-lg outline-none"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1.5px solid rgba(255,255,255,0.1)',
                      color: '#f0ede8',
                    }}
                  />
                  <button
                    onClick={handleImport}
                    disabled={importing || !importUrl.trim()}
                    className="text-xs font-bold px-3 py-2 rounded-lg flex-shrink-0 flex items-center gap-1 disabled:opacity-50"
                    style={{
                      background: 'rgba(45,202,114,0.12)',
                      border: '1.5px solid rgba(45,202,114,0.35)',
                      color: 'rgba(45,202,114,0.9)',
                      fontFamily: 'Syne, sans-serif',
                      cursor: 'pointer',
                    }}
                  >
                    {importing ? <Loader2 size={10} className="animate-spin" /> : null}
                    {importing ? '…' : 'Import'}
                  </button>
                </div>
                {importError && (
                  <div className="text-xs mt-1.5" style={{ color: 'rgba(255,150,100,0.8)' }}>
                    {importError}
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

          {/* Store Name */}
          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-1.5"
              style={{ color: 'rgba(240,237,232,0.4)', fontFamily: 'Syne, sans-serif' }}
            >
              Store Name
            </label>
            <input
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="e.g. MaxFit Supplements"
              className="w-full text-sm px-3 py-2.5 rounded-lg outline-none"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1.5px solid rgba(255,255,255,0.08)',
                color: '#f0ede8',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(212,175,55,0.45)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
          </div>

          {/* Niche */}
          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-1.5"
              style={{ color: 'rgba(240,237,232,0.4)', fontFamily: 'Syne, sans-serif' }}
            >
              Niche
            </label>
            <input
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="e.g. gym supplements"
              className="w-full text-sm px-3 py-2.5 rounded-lg outline-none"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1.5px solid rgba(255,255,255,0.08)',
                color: '#f0ede8',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(212,175,55,0.45)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
          </div>

          {/* Target Audience */}
          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-1.5"
              style={{ color: 'rgba(240,237,232,0.4)', fontFamily: 'Syne, sans-serif' }}
            >
              Target Audience
            </label>
            <input
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g. AU men 18-35"
              className="w-full text-sm px-3 py-2.5 rounded-lg outline-none"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1.5px solid rgba(255,255,255,0.08)',
                color: '#f0ede8',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(212,175,55,0.45)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
          </div>

          {/* Tagline + Price in one row */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label
                className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                style={{ color: 'rgba(240,237,232,0.4)', fontFamily: 'Syne, sans-serif' }}
              >
                Tagline{' '}
                <span
                  style={{ opacity: 0.4, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}
                >
                  (optional)
                </span>
              </label>
              <input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Made for Aussies"
                className="w-full text-sm px-3 py-2.5 rounded-lg outline-none"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1.5px solid rgba(255,255,255,0.08)',
                  color: '#f0ede8',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(212,175,55,0.45)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
              />
            </div>
            <div>
              <label
                className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                style={{ color: 'rgba(240,237,232,0.4)', fontFamily: 'Syne, sans-serif' }}
              >
                Price AUD{' '}
                <span
                  style={{ opacity: 0.4, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}
                >
                  (optional)
                </span>
              </label>
              <input
                value={priceAUD}
                onChange={(e) => setPriceAUD(e.target.value)}
                placeholder="e.g. 59.99"
                className="w-full text-sm px-3 py-2.5 rounded-lg outline-none"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1.5px solid rgba(255,255,255,0.08)',
                  color: '#f0ede8',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(212,175,55,0.45)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
              />
            </div>
          </div>

          {/* Vibe Toggle */}
          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: 'rgba(240,237,232,0.4)', fontFamily: 'Syne, sans-serif' }}
            >
              Vibe
            </label>
            <div className="flex gap-2">
              {(['bold', 'minimal', 'premium'] as Vibe[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setVibe(v)}
                  className="flex-1 py-2 rounded-full text-xs font-bold capitalize transition-all"
                  style={{
                    background: vibe === v ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1.5px solid ${vibe === v ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    color: vibe === v ? '#d4af37' : 'rgba(240,237,232,0.45)',
                    fontFamily: 'Syne, sans-serif',
                    cursor: 'pointer',
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Colour Picker */}
          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: 'rgba(240,237,232,0.4)', fontFamily: 'Syne, sans-serif' }}
            >
              Brand Colour
            </label>
            <div className="flex items-center gap-3">
              <label className="relative cursor-pointer flex-shrink-0">
                <div
                  className="w-9 h-9 rounded-lg"
                  style={{
                    background: accentColor,
                    border: '2px solid rgba(255,255,255,0.15)',
                    boxShadow: `0 4px 12px ${accentColor}44`,
                  }}
                />
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </label>
              <span className="text-sm font-mono" style={{ color: 'rgba(240,237,232,0.5)' }}>
                {accentColor}
              </span>
            </div>
          </div>

          {/* Platform Dropdown */}
          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-1.5"
              style={{ color: 'rgba(240,237,232,0.4)', fontFamily: 'Syne, sans-serif' }}
            >
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
              className="w-full text-sm px-3 py-2.5 rounded-lg outline-none appearance-none"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1.5px solid rgba(255,255,255,0.08)',
                color: '#f0ede8',
                cursor: 'pointer',
              }}
            >
              <option value="shopify" style={{ background: '#0c0e12' }}>
                Shopify
              </option>
              <option value="nextjs" style={{ background: '#0c0e12' }}>
                Next.js
              </option>
              <option value="react" style={{ background: '#0c0e12' }}>
                React
              </option>
            </select>
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            style={{
              background: generating
                ? 'rgba(212,175,55,0.25)'
                : 'linear-gradient(135deg, #d4af37, #f0c040)',
              color: '#080a0e',
              fontFamily: 'Syne, sans-serif',
              boxShadow: generating ? 'none' : '0 4px 24px rgba(212,175,55,0.35)',
              cursor: generating ? 'not-allowed' : 'pointer',
            }}
          >
            {generating ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Generating… {genProgress > 0 ? `${genProgress}%` : ''}
              </>
            ) : (
              <>
                <Globe size={15} />
                {hasOutput ? 'Regenerate' : 'Generate'}
              </>
            )}
          </button>

          {genError && (
            <div
              className="text-xs p-3 rounded-lg"
              style={{
                background: 'rgba(255,100,100,0.08)',
                border: '1px solid rgba(255,100,100,0.2)',
                color: 'rgba(255,150,150,0.9)',
              }}
            >
              {genError}
            </div>
          )}

          {hasOutput && (
            <SaveToProduct
              toolId="website-generator"
              toolName="Website Generator"
              outputData={JSON.stringify(generatedData || rawResponse)}
            />
          )}
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {hasOutput ? (
            <>
              {/* Tab bar */}
              <div
                className="flex items-center gap-1 px-4 py-2.5 border-b flex-shrink-0"
                style={{ borderColor: 'rgba(255,255,255,0.07)', background: '#0c0e12' }}
              >
                {(['copy', 'code', 'preview', 'deploy'] as ActiveTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="px-4 py-1.5 text-xs font-bold rounded-lg capitalize transition-all flex items-center gap-1.5"
                    style={{
                      background: activeTab === tab ? 'rgba(212,175,55,0.12)' : 'transparent',
                      color: activeTab === tab ? '#d4af37' : 'rgba(240,237,232,0.4)',
                      borderBottom: `2px solid ${activeTab === tab ? '#d4af37' : 'transparent'}`,
                      fontFamily: 'Syne, sans-serif',
                      cursor: 'pointer',
                    }}
                  >
                    {tab === 'copy' && <FileText size={12} />}
                    {tab === 'code' && <Code2 size={12} />}
                    {tab === 'preview' && <Globe size={12} />}
                    {tab === 'deploy' && <Package size={12} />}
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-hidden">
                {/* ── COPY TAB ── */}
                {activeTab === 'copy' && (
                  <div
                    className="h-full overflow-y-auto p-6 space-y-6"
                    style={{ scrollbarWidth: 'thin' }}
                  >
                    {parseWarning && (
                      <div
                        className="p-3 rounded-lg text-xs"
                        style={{
                          background: 'rgba(255,200,50,0.08)',
                          border: '1px solid rgba(255,200,50,0.2)',
                          color: 'rgba(255,220,100,0.9)',
                        }}
                      >
                        JSON parsing failed. Showing raw AI output below.
                      </div>
                    )}

                    {generatedData ? (
                      <>
                        {/* Headline */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className="text-xs font-bold uppercase tracking-wider"
                              style={{
                                color: 'rgba(240,237,232,0.4)',
                                fontFamily: 'Syne, sans-serif',
                              }}
                            >
                              Headline
                            </span>
                            <button
                              onClick={() => copy(generatedData.headline, 'hl')}
                              className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg transition-all"
                              style={{
                                color: copiedKey === 'hl' ? '#2dca72' : 'rgba(240,237,232,0.4)',
                                background: 'rgba(255,255,255,0.04)',
                                cursor: 'pointer',
                                border: 'none',
                              }}
                            >
                              {copiedKey === 'hl' ? <Check size={10} /> : <Copy size={10} />}{' '}
                              {copiedKey === 'hl' ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <div
                            className="text-2xl font-black"
                            style={{ fontFamily: 'Syne, sans-serif', lineHeight: 1.2 }}
                          >
                            {generatedData.headline}
                          </div>
                        </div>

                        {/* Subheadline */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className="text-xs font-bold uppercase tracking-wider"
                              style={{
                                color: 'rgba(240,237,232,0.4)',
                                fontFamily: 'Syne, sans-serif',
                              }}
                            >
                              Subheadline
                            </span>
                            <button
                              onClick={() => copy(generatedData.subheadline, 'sub')}
                              className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg transition-all"
                              style={{
                                color: copiedKey === 'sub' ? '#2dca72' : 'rgba(240,237,232,0.4)',
                                background: 'rgba(255,255,255,0.04)',
                                cursor: 'pointer',
                                border: 'none',
                              }}
                            >
                              {copiedKey === 'sub' ? <Check size={10} /> : <Copy size={10} />}{' '}
                              {copiedKey === 'sub' ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <div
                            className="text-sm leading-relaxed"
                            style={{ color: 'rgba(240,237,232,0.7)' }}
                          >
                            {generatedData.subheadline}
                          </div>
                        </div>

                        {/* Features */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className="text-xs font-bold uppercase tracking-wider"
                              style={{
                                color: 'rgba(240,237,232,0.4)',
                                fontFamily: 'Syne, sans-serif',
                              }}
                            >
                              Features
                            </span>
                            <button
                              onClick={() => copy(generatedData.features.join('\n'), 'feats')}
                              className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg transition-all"
                              style={{
                                color: copiedKey === 'feats' ? '#2dca72' : 'rgba(240,237,232,0.4)',
                                background: 'rgba(255,255,255,0.04)',
                                cursor: 'pointer',
                                border: 'none',
                              }}
                            >
                              {copiedKey === 'feats' ? <Check size={10} /> : <Copy size={10} />}{' '}
                              {copiedKey === 'feats' ? 'Copied' : 'Copy All'}
                            </button>
                          </div>
                          <div className="space-y-2">
                            {generatedData.features.map((f, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-3 px-3 py-2.5 rounded-lg"
                                style={{
                                  background: 'rgba(255,255,255,0.03)',
                                  border: '1px solid rgba(255,255,255,0.06)',
                                }}
                              >
                                <div
                                  className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black"
                                  style={{ background: 'rgba(212,175,55,0.15)', color: '#d4af37' }}
                                >
                                  {i + 1}
                                </div>
                                <span
                                  className="text-sm"
                                  style={{ color: 'rgba(240,237,232,0.7)' }}
                                >
                                  {f}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* CTAs */}
                        {(generatedData.cta_primary || generatedData.ctaText) && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span
                                  className="text-xs font-bold uppercase tracking-wider"
                                  style={{
                                    color: 'rgba(240,237,232,0.4)',
                                    fontFamily: 'Syne, sans-serif',
                                  }}
                                >
                                  CTA Text
                                </span>
                                <button
                                  onClick={() =>
                                    copy(
                                      generatedData.ctaText ?? generatedData.cta_primary ?? '',
                                      'cta1'
                                    )
                                  }
                                  className="text-xs flex items-center gap-1"
                                  style={{
                                    color:
                                      copiedKey === 'cta1' ? '#2dca72' : 'rgba(240,237,232,0.4)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                  }}
                                >
                                  {copiedKey === 'cta1' ? <Check size={10} /> : <Copy size={10} />}
                                </button>
                              </div>
                              <div className="text-sm font-bold" style={{ color: '#d4af37' }}>
                                {generatedData.ctaText ?? generatedData.cta_primary}
                              </div>
                            </div>
                            {generatedData.cta_secondary && (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span
                                    className="text-xs font-bold uppercase tracking-wider"
                                    style={{
                                      color: 'rgba(240,237,232,0.4)',
                                      fontFamily: 'Syne, sans-serif',
                                    }}
                                  >
                                    Secondary CTA
                                  </span>
                                  <button
                                    onClick={() => copy(generatedData.cta_secondary ?? '', 'cta2')}
                                    className="text-xs flex items-center gap-1"
                                    style={{
                                      color:
                                        copiedKey === 'cta2' ? '#2dca72' : 'rgba(240,237,232,0.4)',
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {copiedKey === 'cta2' ? (
                                      <Check size={10} />
                                    ) : (
                                      <Copy size={10} />
                                    )}
                                  </button>
                                </div>
                                <div
                                  className="text-sm font-bold"
                                  style={{ color: 'rgba(240,237,232,0.7)' }}
                                >
                                  {generatedData.cta_secondary}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Trust Badges */}
                        {generatedData.trust_badges && generatedData.trust_badges.length > 0 && (
                          <div>
                            <span
                              className="text-xs font-bold uppercase tracking-wider"
                              style={{
                                color: 'rgba(240,237,232,0.4)',
                                fontFamily: 'Syne, sans-serif',
                              }}
                            >
                              Trust Badges 🇦🇺
                            </span>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {generatedData.trust_badges.map((b, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                                  style={{
                                    background: 'rgba(45,202,114,0.08)',
                                    border: '1px solid rgba(45,202,114,0.2)',
                                    color: 'rgba(45,202,114,0.85)',
                                  }}
                                >
                                  <Check size={10} /> {b}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Brand Story */}
                        {(generatedData.brandStory || generatedData.about_section) && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span
                                className="text-xs font-bold uppercase tracking-wider"
                                style={{
                                  color: 'rgba(240,237,232,0.4)',
                                  fontFamily: 'Syne, sans-serif',
                                }}
                              >
                                Brand Story
                              </span>
                              <button
                                onClick={() =>
                                  copy(
                                    generatedData.brandStory ?? generatedData.about_section ?? '',
                                    'story'
                                  )
                                }
                                className="text-xs flex items-center gap-1"
                                style={{
                                  color:
                                    copiedKey === 'story' ? '#2dca72' : 'rgba(240,237,232,0.4)',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                }}
                              >
                                {copiedKey === 'story' ? <Check size={10} /> : <Copy size={10} />}
                              </button>
                            </div>
                            <div
                              className="text-xs leading-relaxed"
                              style={{ color: 'rgba(240,237,232,0.55)' }}
                            >
                              {generatedData.brandStory ?? generatedData.about_section}
                            </div>
                          </div>
                        )}

                        {/* Meta + Email (legacy) */}
                        {(generatedData.meta_description || generatedData.email_subject) && (
                          <div className="grid grid-cols-2 gap-4">
                            {generatedData.meta_description && (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span
                                    className="text-xs font-bold uppercase tracking-wider"
                                    style={{
                                      color: 'rgba(240,237,232,0.4)',
                                      fontFamily: 'Syne, sans-serif',
                                    }}
                                  >
                                    Meta Description
                                  </span>
                                  <button
                                    onClick={() =>
                                      copy(generatedData.meta_description ?? '', 'meta')
                                    }
                                    className="text-xs flex items-center gap-1"
                                    style={{
                                      color:
                                        copiedKey === 'meta' ? '#2dca72' : 'rgba(240,237,232,0.4)',
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {copiedKey === 'meta' ? (
                                      <Check size={10} />
                                    ) : (
                                      <Copy size={10} />
                                    )}
                                  </button>
                                </div>
                                <div
                                  className="text-xs leading-relaxed"
                                  style={{ color: 'rgba(240,237,232,0.55)' }}
                                >
                                  {generatedData.meta_description}
                                </div>
                              </div>
                            )}
                            {generatedData.email_subject && (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span
                                    className="text-xs font-bold uppercase tracking-wider"
                                    style={{
                                      color: 'rgba(240,237,232,0.4)',
                                      fontFamily: 'Syne, sans-serif',
                                    }}
                                  >
                                    Email Subject
                                  </span>
                                  <button
                                    onClick={() => copy(generatedData.email_subject ?? '', 'email')}
                                    className="text-xs flex items-center gap-1"
                                    style={{
                                      color:
                                        copiedKey === 'email' ? '#2dca72' : 'rgba(240,237,232,0.4)',
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {copiedKey === 'email' ? (
                                      <Check size={10} />
                                    ) : (
                                      <Copy size={10} />
                                    )}
                                  </button>
                                </div>
                                <div
                                  className="text-xs leading-relaxed"
                                  style={{ color: 'rgba(240,237,232,0.55)' }}
                                >
                                  {generatedData.email_subject}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ) : rawResponse ? (
                      <div>
                        <div
                          className="text-xs font-bold uppercase tracking-wider mb-2"
                          style={{ color: 'rgba(240,237,232,0.4)', fontFamily: 'Syne, sans-serif' }}
                        >
                          Raw AI Output
                        </div>
                        <pre
                          className="text-xs p-4 rounded-xl overflow-x-auto"
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            color: 'rgba(240,237,232,0.6)',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}
                        >
                          {rawResponse}
                        </pre>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* ── CODE TAB ── */}
                {activeTab === 'code' && generatedData?.files && (
                  <div className="h-full flex overflow-hidden">
                    {/* File tree sidebar */}
                    <div
                      className="flex-shrink-0 overflow-y-auto border-r"
                      style={{
                        width: 220,
                        borderColor: 'rgba(255,255,255,0.06)',
                        background: '#0a0c10',
                        scrollbarWidth: 'thin',
                      }}
                    >
                      <div
                        className="px-3 py-2 text-xs font-bold uppercase tracking-wider"
                        style={{ color: 'rgba(240,237,232,0.3)', fontFamily: 'Syne, sans-serif' }}
                      >
                        Files
                      </div>
                      <FileTree
                        files={generatedData.files}
                        activeFile={activeFile}
                        onSelect={setActiveFile}
                      />
                    </div>

                    {/* Code viewer */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                      {activeFile && generatedData.files?.[activeFile] ? (
                        <>
                          <div
                            className="flex items-center justify-between px-4 py-2 border-b flex-shrink-0"
                            style={{
                              borderColor: 'rgba(255,255,255,0.06)',
                              background: 'rgba(255,255,255,0.02)',
                            }}
                          >
                            <span
                              className="text-xs font-mono"
                              style={{ color: 'rgba(240,237,232,0.6)' }}
                            >
                              {activeFile}
                            </span>
                            <button
                              onClick={() => {
                                copy(generatedData.files?.[activeFile] ?? '', `file-${activeFile}`);
                                toast.success(`Copied ${activeFile}`);
                              }}
                              className="text-xs flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all"
                              style={{
                                color:
                                  copiedKey === `file-${activeFile}`
                                    ? '#2dca72'
                                    : 'rgba(240,237,232,0.4)',
                                background: 'rgba(255,255,255,0.04)',
                                cursor: 'pointer',
                                border: 'none',
                              }}
                            >
                              {copiedKey === `file-${activeFile}` ? (
                                <Check size={10} />
                              ) : (
                                <Copy size={10} />
                              )}
                              {copiedKey === `file-${activeFile}` ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <div className="flex-1 overflow-auto" style={{ scrollbarWidth: 'thin' }}>
                            <SyntaxHighlighter
                              language={getLanguage(activeFile)}
                              style={vscDarkPlus}
                              customStyle={{
                                margin: 0,
                                padding: 16,
                                background: '#080a0e',
                                fontSize: 13,
                                lineHeight: 1.6,
                                minHeight: '100%',
                              }}
                              showLineNumbers
                              lineNumberStyle={{ color: 'rgba(240,237,232,0.15)', minWidth: 36 }}
                            >
                              {generatedData.files[activeFile]}
                            </SyntaxHighlighter>
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 flex items-center justify-center">
                          <div className="text-center">
                            <FileCode
                              size={32}
                              style={{ color: 'rgba(240,237,232,0.15)', margin: '0 auto 12px' }}
                            />
                            <div className="text-sm" style={{ color: 'rgba(240,237,232,0.3)' }}>
                              Select a file to view
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {activeTab === 'code' && !generatedData?.files && (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-sm" style={{ color: 'rgba(240,237,232,0.3)' }}>
                      No files generated. Try regenerating.
                    </div>
                  </div>
                )}

                {/* ── PREVIEW TAB ── */}
                {activeTab === 'preview' && (
                  <div className="h-full flex flex-col">
                    <div
                      className="flex items-center gap-2 px-4 py-2 border-b flex-shrink-0"
                      style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                    >
                      <button
                        onClick={handleOpenPreviewNewTab}
                        className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
                        style={{
                          background: 'rgba(212,175,55,0.1)',
                          border: '1px solid rgba(212,175,55,0.25)',
                          color: '#d4af37',
                          fontFamily: 'Syne, sans-serif',
                          cursor: 'pointer',
                        }}
                      >
                        <ExternalLink size={11} /> Open in new tab
                      </button>
                      <div
                        className="flex rounded-lg overflow-hidden ml-auto"
                        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        {(['desktop', 'mobile'] as const).map((d) => (
                          <button
                            key={d}
                            onClick={() => setPreviewDevice(d)}
                            className="text-xs px-3 py-1.5 capitalize"
                            style={{
                              background:
                                previewDevice === d ? 'rgba(212,175,55,0.12)' : 'transparent',
                              color: previewDevice === d ? '#d4af37' : 'rgba(240,237,232,0.4)',
                              border: 'none',
                              cursor: 'pointer',
                              fontFamily: 'Syne, sans-serif',
                              fontWeight: previewDevice === d ? 700 : 400,
                            }}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                    {generatedData ? (
                      <div
                        className="flex-1 flex items-start justify-center overflow-auto p-4"
                        style={{ background: '#060608' }}
                      >
                        <iframe
                          srcDoc={previewHTML}
                          className="border-none transition-all duration-300"
                          style={{
                            width: previewDevice === 'mobile' ? 390 : '100%',
                            height: previewDevice === 'mobile' ? 844 : '100%',
                            maxHeight: previewDevice === 'mobile' ? 844 : undefined,
                            borderRadius: previewDevice === 'mobile' ? 24 : 0,
                            border:
                              previewDevice === 'mobile'
                                ? '3px solid rgba(255,255,255,0.1)'
                                : 'none',
                            boxShadow:
                              previewDevice === 'mobile' ? '0 8px 32px rgba(0,0,0,0.4)' : 'none',
                          }}
                          title="Website preview"
                          sandbox="allow-scripts"
                        />
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-sm" style={{ color: 'rgba(240,237,232,0.3)' }}>
                          No preview available. Raw response could not be parsed.
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── DEPLOY TAB ── */}
                {activeTab === 'deploy' && (
                  <div className="h-full overflow-y-auto p-6" style={{ scrollbarWidth: 'thin' }}>
                    <div className="grid grid-cols-2 gap-4 max-w-2xl">
                      {/* Card 1: Download ZIP */}
                      <button
                        onClick={handleDownloadZip}
                        disabled={!generatedData?.files}
                        className="p-5 rounded-xl text-left transition-all group disabled:opacity-40"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1.5px solid rgba(255,255,255,0.08)',
                          cursor: 'pointer',
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center"
                          style={{ background: 'rgba(212,175,55,0.12)' }}
                        >
                          <FileArchive size={20} style={{ color: '#d4af37' }} />
                        </div>
                        <div
                          className="text-sm font-black mb-1"
                          style={{ fontFamily: 'Syne, sans-serif' }}
                        >
                          Download ZIP
                        </div>
                        <div
                          className="text-xs leading-relaxed"
                          style={{ color: 'rgba(240,237,232,0.4)' }}
                        >
                          Download all generated theme files as a ZIP archive with folder structure
                          preserved.
                        </div>
                      </button>

                      {/* Card 2: Open in Cursor */}
                      <button
                        onClick={handleOpenCursor}
                        disabled={!generatedData?.files}
                        className="p-5 rounded-xl text-left transition-all group disabled:opacity-40"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1.5px solid rgba(255,255,255,0.08)',
                          cursor: 'pointer',
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center"
                          style={{ background: 'rgba(156,95,255,0.12)' }}
                        >
                          <Terminal size={20} style={{ color: '#9c5fff' }} />
                        </div>
                        <div
                          className="text-sm font-black mb-1"
                          style={{ fontFamily: 'Syne, sans-serif' }}
                        >
                          Open in Cursor
                        </div>
                        <div
                          className="text-xs leading-relaxed"
                          style={{ color: 'rgba(240,237,232,0.4)' }}
                        >
                          Download ZIP + get step-by-step instructions to customise with Cursor AI.
                        </div>
                      </button>

                      {/* Card 3: Export to Shopify */}
                      <button
                        onClick={handleShopifyExport}
                        disabled={!generatedData?.files}
                        className="p-5 rounded-xl text-left transition-all group disabled:opacity-40"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1.5px solid rgba(255,255,255,0.08)',
                          cursor: 'pointer',
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center"
                          style={{ background: 'rgba(45,202,114,0.12)' }}
                        >
                          <ShoppingBag size={20} style={{ color: '#2dca72' }} />
                        </div>
                        <div
                          className="text-sm font-black mb-1"
                          style={{ fontFamily: 'Syne, sans-serif' }}
                        >
                          Export to Shopify
                        </div>
                        <div
                          className="text-xs leading-relaxed"
                          style={{ color: 'rgba(240,237,232,0.4)' }}
                        >
                          Download Shopify-compatible theme ZIP with layout and config files
                          included.
                        </div>
                      </button>

                      {/* Card 4: Copy to Notion */}
                      <button
                        onClick={handleCopyNotion}
                        disabled={!generatedData}
                        className="p-5 rounded-xl text-left transition-all group disabled:opacity-40"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1.5px solid rgba(255,255,255,0.08)',
                          cursor: 'pointer',
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center"
                          style={{ background: 'rgba(255,255,255,0.08)' }}
                        >
                          <StickyNote size={20} style={{ color: 'rgba(240,237,232,0.6)' }} />
                        </div>
                        <div
                          className="text-sm font-black mb-1"
                          style={{ fontFamily: 'Syne, sans-serif' }}
                        >
                          Copy to Notion
                        </div>
                        <div
                          className="text-xs leading-relaxed"
                          style={{ color: 'rgba(240,237,232,0.4)' }}
                        >
                          Copy headline, features, CTAs, and trust badges as clean Markdown for
                          Notion.
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* ── Empty state ── */
            <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8">
              {generating ? (
                <div className="text-center">
                  <div className="relative w-16 h-16 mx-auto mb-5">
                    <div
                      className="absolute inset-0 rounded-full border-2 animate-spin"
                      style={{
                        borderColor: 'rgba(212,175,55,0.15)',
                        borderTopColor: '#d4af37',
                        borderRightColor: 'rgba(212,175,55,0.5)',
                      }}
                    />
                    <div
                      className="absolute inset-2 rounded-full border"
                      style={{ borderColor: 'rgba(212,175,55,0.12)' }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-lg">
                      🌐
                    </div>
                  </div>
                  <div
                    className="text-sm font-bold mb-3"
                    style={{ fontFamily: 'Syne, sans-serif' }}
                  >
                    Generating your website…
                  </div>
                  <div
                    className="w-48 h-1.5 rounded-full mx-auto overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${genProgress}%`,
                        background: 'linear-gradient(90deg, #d4af37, #f0c040)',
                      }}
                    />
                  </div>
                  <div className="text-xs mt-2" style={{ color: 'rgba(240,237,232,0.35)' }}>
                    AI is generating copy, theme files, and emails…
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-5xl">🌐</div>
                  <div className="text-center">
                    <div
                      className="text-base font-black mb-2"
                      style={{ fontFamily: 'Syne, sans-serif' }}
                    >
                      Build Your Store in Seconds
                    </div>
                    <div
                      className="text-xs max-w-sm leading-relaxed"
                      style={{ color: 'rgba(240,237,232,0.35)' }}
                    >
                      Fill in your store details on the left and hit{' '}
                      <strong style={{ color: '#d4af37' }}>Generate</strong>. Get copy, Shopify
                      Liquid files, HTML emails, and a live preview — all AU-market optimised.
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 text-xs text-left max-w-sm w-full">
                    {[
                      { n: '1', t: 'Enter your store name, niche, and target audience' },
                      { n: '2', t: 'Choose your vibe, brand colour, and platform' },
                      { n: '3', t: 'Hit Generate — AI creates copy + 8 theme files' },
                      { n: '4', t: 'Download ZIP, export to Shopify, or open in Cursor' },
                    ].map(({ n, t }) => (
                      <div
                        key={n}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <div
                          className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black"
                          style={{
                            background: 'rgba(212,175,55,0.15)',
                            color: '#d4af37',
                            fontFamily: 'Syne, sans-serif',
                          }}
                        >
                          {n}
                        </div>
                        <span style={{ color: 'rgba(240,237,232,0.55)' }}>{t}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Cursor Modal ── */}
      <Modal open={cursorModal} onClose={() => setCursorModal(false)}>
        <div className="mb-4">
          <Terminal size={24} style={{ color: '#9c5fff', marginBottom: 12 }} />
          <div className="text-lg font-black" style={{ fontFamily: 'Syne, sans-serif' }}>
            Open in Cursor
          </div>
          <div className="text-xs mt-1" style={{ color: 'rgba(240,237,232,0.4)' }}>
            Your ZIP has been downloaded. Follow these steps:
          </div>
        </div>
        <pre
          className="text-sm leading-relaxed p-4 rounded-xl mb-4"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            color: 'rgba(240,237,232,0.7)',
            whiteSpace: 'pre-wrap',
          }}
        >
          {cursorInstructions}
        </pre>
        <div className="flex gap-2">
          <button
            onClick={() => {
              copy(cursorInstructions, 'cursor-instr');
              toast.success('Instructions copied!');
            }}
            className="flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
            style={{
              background: 'rgba(156,95,255,0.12)',
              border: '1px solid rgba(156,95,255,0.3)',
              color: '#9c5fff',
              fontFamily: 'Syne, sans-serif',
              cursor: 'pointer',
            }}
          >
            <Clipboard size={12} /> Copy Instructions
          </button>
          <button
            onClick={() => setCursorModal(false)}
            className="flex-1 py-2.5 rounded-lg text-xs font-bold"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(240,237,232,0.5)',
              fontFamily: 'Syne, sans-serif',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </Modal>

      {/* ── Shopify Modal ── */}
      <Modal open={shopifyModal} onClose={() => setShopifyModal(false)}>
        <div className="mb-4">
          <ShoppingBag size={24} style={{ color: '#2dca72', marginBottom: 12 }} />
          <div className="text-lg font-black" style={{ fontFamily: 'Syne, sans-serif' }}>
            Export to Shopify
          </div>
          <div className="text-xs mt-1" style={{ color: 'rgba(240,237,232,0.4)' }}>
            Your theme ZIP has been downloaded.
          </div>
        </div>
        <div
          className="text-sm leading-relaxed p-4 rounded-xl mb-4"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            color: 'rgba(240,237,232,0.7)',
          }}
        >
          <p className="mb-2">
            1. Go to <strong>Shopify Admin</strong> → <strong>Online Store</strong> →{' '}
            <strong>Themes</strong>
          </p>
          <p className="mb-2">
            2. Click <strong>Add theme</strong> → <strong>Upload zip file</strong>
          </p>
          <p>
            3. Then click <strong>Customise</strong> to edit your new theme.
          </p>
        </div>
        <button
          onClick={() => setShopifyModal(false)}
          className="w-full py-2.5 rounded-lg text-xs font-bold"
          style={{
            background: 'rgba(45,202,114,0.12)',
            border: '1px solid rgba(45,202,114,0.3)',
            color: '#2dca72',
            fontFamily: 'Syne, sans-serif',
            cursor: 'pointer',
          }}
        >
          Got it
        </button>
      </Modal>

      {/* ── Template Preview Modal ── */}
      {templatePreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}
          onClick={() => setTemplatePreview(null)}
        >
          <div
            className="relative w-full max-w-4xl mx-4 rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.1)', maxHeight: '85vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setTemplatePreview(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(0,0,0,0.6)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
            <iframe
              srcDoc={`<!DOCTYPE html>
<html lang="en-AU">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800;900&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:${templatePreview.colors.bg};color:${templatePreview.colors.text};font-family:'DM Sans',sans-serif}
.hero{min-height:60vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px 24px}
h1{font-family:'Syne',sans-serif;font-size:clamp(28px,5vw,48px);font-weight:900;letter-spacing:-1px;margin-bottom:16px}
.accent{color:${templatePreview.colors.accent}}
p{font-size:18px;opacity:.7;max-width:500px;margin:0 auto 32px;line-height:1.7}
.btn{display:inline-flex;padding:16px 36px;background:${templatePreview.colors.accent};color:#fff;font-family:'Syne',sans-serif;font-weight:800;font-size:16px;border:none;border-radius:12px;cursor:pointer;text-decoration:none}
.features{padding:60px 24px;display:grid;grid-template-columns:repeat(3,1fr);gap:20px;max-width:900px;margin:0 auto}
.feat{padding:24px;border-radius:12px;border:1px solid ${templatePreview.colors.accent}22;text-align:center}
.feat h3{font-family:'Syne',sans-serif;font-size:14px;margin-bottom:8px;color:${templatePreview.colors.accent}}
.feat p{font-size:13px;opacity:.5;margin:0}
.badge-row{display:flex;gap:12px;justify-content:center;padding:32px 24px;flex-wrap:wrap}
.badge{padding:8px 20px;border-radius:99px;font-size:12px;border:1px solid ${templatePreview.colors.accent}33;color:${templatePreview.colors.accent};font-weight:600}
footer{text-align:center;padding:32px;font-size:12px;opacity:.4;border-top:1px solid ${templatePreview.colors.accent}15}
@media(max-width:600px){.features{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="hero">
<h1>${templatePreview.storeName
                .split(' ')
                .map((w, i, a) =>
                  i === a.length - 1 ? '<span class="accent">' + w + '</span>' : w
                )
                .join(' ')}</h1>
<p>${templatePreview.tagline}</p>
<a class="btn" href="#features-section" onclick="event.preventDefault();document.getElementById('features-section').scrollIntoView({behavior:'smooth'})">Shop Now</a>
</div>
<div id="features-section" class="features">
<div class="feat"><h3>Australian Made</h3><p>Quality products from local suppliers.</p></div>
<div class="feat"><h3>Free AU Shipping</h3><p>Free delivery on orders over $99 AUD.</p></div>
<div class="feat"><h3>Afterpay Available</h3><p>Buy now, pay later with Afterpay.</p></div>
</div>
<div class="badge-row">
<span class="badge">✓ Australian Owned</span>
<span class="badge">✓ GST Inclusive</span>
<span class="badge">✓ Easy Returns</span>
<span class="badge">✓ Secure Payments</span>
</div>
<footer>© 2026 ${templatePreview.storeName}. All rights reserved. ABN: [Enter your ABN]</footer>
</body>
</html>`}
              className="w-full border-none"
              style={{ height: '80vh' }}
              title={`${templatePreview.name} preview`}
              sandbox="allow-scripts"
            />
            <div
              className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-6 py-4"
              style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.9))' }}
            >
              <div>
                <div
                  className="text-sm font-black"
                  style={{ fontFamily: 'Syne, sans-serif', color: '#f0ede8' }}
                >
                  {templatePreview.name}
                </div>
                <div className="text-xs" style={{ color: 'rgba(240,237,232,0.5)' }}>
                  {templatePreview.niche} · {templatePreview.tone}
                </div>
              </div>
              <button
                onClick={() => {
                  setStoreName(templatePreview.storeName);
                  setNiche(templatePreview.niche);
                  setTargetAudience('Australian online shoppers');
                  setAccentColor(templatePreview.colors.accent);
                  setTemplatePreview(null);
                  setShowTemplates(false);
                  toast.success(`"${templatePreview.name}" template loaded`);
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold"
                style={{
                  background: 'linear-gradient(135deg, #d4af37, #f0c040)',
                  color: '#080a0e',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'Syne, sans-serif',
                }}
              >
                Use This Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── System Prompt Builder ────────────────────────────────────────────────────
function buildSystemPrompt(vibe: Vibe, platform: Platform, accentColor: string): string {
  const vibeDescriptions: Record<Vibe, string> = {
    bold: 'Bold, high-energy, attention-grabbing. Use strong action words, punchy headlines, urgency-driven CTAs. Think Nike, Gymshark.',
    minimal:
      'Clean, minimal, sophisticated. Whitespace-heavy, understated elegance. Think Aesop, Apple.',
    premium:
      'Premium luxury, exclusive. Rich language, trust-building, aspirational. Think Net-a-Porter, MR PORTER.',
  };

  const platformInstructions: Record<Platform, string> = {
    shopify:
      'Generate Shopify Liquid template files (.liquid). Use Liquid syntax ({% %}, {{ }}). Files should be ready to upload as a Shopify theme.',
    nextjs:
      'Generate Next.js App Router files (.tsx). Use React Server Components where appropriate. Include Tailwind CSS classes.',
    react:
      'Generate React component files (.tsx). Use functional components with hooks. Include Tailwind CSS classes.',
  };

  return `You are an elite Australian ecommerce website builder AI. You generate complete, production-ready website themes for Australian online stores.

CRITICAL: You MUST use Australian English throughout ALL generated content:
- colour (not color), organise (not organize), authorise (not authorize), recognise (not recognize), specialise (not specialize), centre (not center)
- All prices in AUD with dollar sign
- Reference Afterpay and Zip as payment options
- Reference Australia Post for shipping
- Mention GST-inclusive pricing
- Use trust signals: Australian-owned, AU returns policy, secure AU payments, ABN displayed
- Tone: direct, confident, genuine — NOT American marketing speak. No "awesome" or "amazing". Use "quality", "reliable", "built for Aussies".

VIBE: ${vibeDescriptions[vibe]}

PLATFORM: ${platformInstructions[platform]}

BRAND COLOUR: ${accentColor}

You MUST return a single valid JSON object with EXACTLY these keys (no markdown, no code blocks, just pure JSON):

{
  "headline": "string — punchy headline (max 10 words)",
  "subheadline": "string — addresses the main objection (1-2 sentences)",
  "features": ["array of exactly 5 feature/benefit strings"],
  "cta_primary": "string — primary call to action button text",
  "cta_secondary": "string — secondary CTA text",
  "trust_badges": ["array of 4-6 trust badge strings, AU-specific"],
  "about_section": "string — 2-3 sentence about section copy",
  "email_subject": "string — welcome email subject line",
  "meta_description": "string — SEO meta description (under 160 chars)",
  "files": {
    "sections/hero.liquid": "valid ${platform === 'shopify' ? 'Shopify Liquid' : platform === 'nextjs' ? 'Next.js TSX' : 'React TSX'} hero section code",
    "sections/features.liquid": "valid features section code",
    "templates/product.liquid": "valid product template code",
    "snippets/au-trust-badges.liquid": "valid AU trust badges snippet",
    "config/settings_data.json": "valid JSON settings",
    "emails/welcome-1.html": "complete HTML email with inline styles for welcome email",
    "emails/abandoned-cart-1.html": "complete HTML email with inline styles for abandoned cart recovery",
    "README.md": "markdown instructions on how to install the theme"
  }
}

IMPORTANT RULES FOR FILES:
- Each file must contain complete, valid, production-ready code
- HTML emails must use inline styles (no external CSS)
- Emails must reference Afterpay/Zip, Australia Post shipping, and GST-inclusive pricing
- The README must include clear installation instructions
- All Liquid files must include valid {% schema %} blocks for Shopify
- Trust badges snippet must include: Australian Owned, Free AU Shipping, Afterpay Available, Secure Payments, Easy Returns
- Use the brand colour ${accentColor} throughout all files
- All content must be specific to the store and niche — never generic placeholder text

RETURN ONLY THE JSON OBJECT. No explanation, no markdown wrapping.`;
}
