import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';

const STEP_LABELS = ['Choose a Template', 'Pick Your Niche', 'Customise Your Store', 'Connect & Launch'];
const accent = '#6366F1';
const brico = "'Bricolage Grotesque', sans-serif";

// ── Template data ──────────────────────────────────────────────

interface StoreTemplate {
  id: string;
  name: string;
  niche: string;
  description: string;
  accentColor: string;
  bgGradient: string;
  tags: string[];
  aov: string;
  cr: string;
  typeUISkill?: string;
}

const TEMPLATES: StoreTemplate[] = [
  {
    id: "prestige",
    name: "Prestige",
    niche: "Luxury & Premium",
    description: "Dark, elegant aesthetic for high-ticket products. Bold typography, gold accents, full-screen hero.",
    accentColor: "#B8860B",
    bgGradient: "linear-gradient(135deg, #F3F4F6 0%, #16213e 100%)",
    tags: ["Luxury", "High-ticket", "Premium"],
    aov: "$180–$420",
    cr: "2.8%",
    typeUISkill: "luxury",
  },
  {
    id: "aurora",
    name: "Aurora",
    niche: "Beauty & Skincare",
    description: "Soft gradients, clean product photography focus. Perfect for cosmetics and wellness brands.",
    accentColor: "#EC4899",
    bgGradient: "linear-gradient(135deg, #fdf4ff 0%, #fce7f3 100%)",
    tags: ["Beauty", "Skincare", "Wellness"],
    aov: "$65–$120",
    cr: "3.4%",
    typeUISkill: "gradient",
  },
  {
    id: "velocity",
    name: "Velocity",
    niche: "Sports & Fitness",
    description: "High energy, bold typography, dark hero with electric accents. Built for performance brands.",
    accentColor: "#10B981",
    bgGradient: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)",
    tags: ["Fitness", "Sports", "Performance"],
    aov: "$85–$160",
    cr: "3.1%",
    typeUISkill: "energetic",
  },
  {
    id: "minimal",
    name: "Minimal",
    niche: "Home & Lifestyle",
    description: "Clean whitespace, editorial layout. Products speak for themselves. Timeless and trustworthy.",
    accentColor: "#374151",
    bgGradient: "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)",
    tags: ["Home", "Minimal", "Lifestyle"],
    aov: "$55–$130",
    cr: "3.8%",
    typeUISkill: "minimal",
  },
  {
    id: "neonpulse",
    name: "Neon Pulse",
    niche: "Tech & Gadgets",
    description: "Futuristic dark UI with neon highlights. Converts exceptionally for electronic gadgets.",
    accentColor: "#6366F1",
    bgGradient: "linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)",
    tags: ["Tech", "Gadgets", "Electronics"],
    aov: "$95–$250",
    cr: "2.6%",
    typeUISkill: "neon",
  },
  {
    id: "botanical",
    name: "Botanical",
    niche: "Eco & Sustainable",
    description: "Earth tones, natural textures, sustainability-focused copy. Perfect for eco-friendly products.",
    accentColor: "#16A34A",
    bgGradient: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
    tags: ["Eco", "Sustainable", "Natural"],
    aov: "$45–$95",
    cr: "4.1%",
    typeUISkill: "paper",
  },
  {
    id: "metro",
    name: "Metro",
    niche: "Fashion & Apparel",
    description: "Urban, editorial fashion layout. Magazine-style grid with strong typography hierarchy.",
    accentColor: "#FAFAFA",
    bgGradient: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
    tags: ["Fashion", "Apparel", "Streetwear"],
    aov: "$70–$180",
    cr: "3.2%",
    typeUISkill: "editorial",
  },
  {
    id: "playful",
    name: "Playful",
    niche: "Kids & Toys",
    description: "Bright, fun, high-trust design. Rounded corners and friendly typography for family products.",
    accentColor: "#F59E0B",
    bgGradient: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
    tags: ["Kids", "Toys", "Family"],
    aov: "$35–$85",
    cr: "4.5%",
    typeUISkill: "colorful",
  },
  {
    id: "heritage",
    name: "Heritage",
    niche: "Food & Gourmet",
    description: "Warm, artisanal aesthetic. Serif typography and rich photography for premium food brands.",
    accentColor: "#92400E",
    bgGradient: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
    tags: ["Food", "Gourmet", "Artisan"],
    aov: "$55–$110",
    cr: "3.9%",
    typeUISkill: "vintage",
  },
  {
    id: "storm",
    name: "Storm",
    niche: "Outdoor & Adventure",
    description: "Rugged, bold photography-first layout. Built for outdoor gear and adventure equipment.",
    accentColor: "#0EA5E9",
    bgGradient: "linear-gradient(135deg, #0c4a6e 0%, #075985 100%)",
    tags: ["Outdoor", "Adventure", "Gear"],
    aov: "$110–$280",
    cr: "2.9%",
    typeUISkill: "dramatic",
  },
  {
    id: "rose",
    name: "Rose",
    niche: "Jewellery & Accessories",
    description: "Feminine, elegant, luxury feel without the high-ticket price point. Perfect for accessories.",
    accentColor: "#BE185D",
    bgGradient: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)",
    tags: ["Jewellery", "Accessories", "Gifts"],
    aov: "$60–$150",
    cr: "3.6%",
    typeUISkill: "elegant",
  },
  {
    id: "clinical",
    name: "Clinical",
    niche: "Health & Supplements",
    description: "Clean, clinical, high-trust layout. Medical-grade credibility for health and wellness products.",
    accentColor: "#0891B2",
    bgGradient: "linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)",
    tags: ["Health", "Supplements", "Wellness"],
    aov: "$80–$200",
    cr: "3.3%",
    typeUISkill: "corporate",
  },
  {
    id: "coastal",
    name: "Coastal",
    niche: "Beach & Summer",
    description: "Fresh ocean vibes. Light and airy with sand and sky tones. Perfect for summer lifestyle brands.",
    accentColor: "#0284C7",
    bgGradient: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)",
    tags: ["Beach", "Summer", "Lifestyle"],
    aov: "$40–$90",
    cr: "4.2%",
    typeUISkill: "spacious",
  },
  {
    id: "autozone",
    name: "AutoZone",
    niche: "Auto & Car Accessories",
    description: "Dark, masculine design for car accessories, detailing products, and automotive gear.",
    accentColor: "#EF4444",
    bgGradient: "linear-gradient(135deg, #1c1917 0%, #0c0a09 100%)",
    tags: ["Auto", "Cars", "Accessories"],
    aov: "$70–$200",
    cr: "2.7%",
    typeUISkill: "bold",
  },
  {
    id: "crafthaven",
    name: "CraftHaven",
    niche: "Art & Craft Supplies",
    description: "Creative, artsy aesthetic for craft supplies, stationery, and DIY products.",
    accentColor: "#7C3AED",
    bgGradient: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)",
    tags: ["Art", "Craft", "DIY"],
    aov: "$25–$75",
    cr: "3.9%",
    typeUISkill: "artistic",
  },
  {
    id: "noir",
    name: "Noir",
    niche: "Photography & Creative",
    description: "Moody, high-contrast editorial. Dramatic black and white with single bold accent color.",
    accentColor: "#DC2626",
    bgGradient: "linear-gradient(135deg, #0a0a0a 0%, #171717 100%)",
    tags: ["Photography", "Creative", "Art"],
    aov: "$95–$350",
    cr: "2.4%",
    typeUISkill: "mono",
  },
  {
    id: "sunrise",
    name: "Sunrise",
    niche: "Coffee & Beverages",
    description: "Warm, energetic morning aesthetic. Perfect for coffee, tea, and beverage brands.",
    accentColor: "#EA580C",
    bgGradient: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
    tags: ["Coffee", "Tea", "Beverages"],
    aov: "$45–$95",
    cr: "4.0%",
    typeUISkill: "cafe",
  },
];

// ── Niche data ────────────────────────────────────────────────

const NICHES = [
  { id: "pets", emoji: "\u{1F43E}", label: "Pet Accessories", examples: "Collars, beds, toys, grooming" },
  { id: "kitchen", emoji: "\u{1F3E0}", label: "Kitchen & Home", examples: "Gadgets, organizers, decor" },
  { id: "fitness", emoji: "\u{1F4AA}", label: "Fitness & Wellness", examples: "Resistance bands, yoga, supplements" },
  { id: "beauty", emoji: "\u2728", label: "Beauty & Skincare", examples: "Serums, tools, makeup accessories" },
  { id: "tech", emoji: "\u{1F4F1}", label: "Tech Gadgets", examples: "Wireless, smart home, accessories" },
  { id: "outdoor", emoji: "\u{1F3D5}\uFE0F", label: "Outdoor & Adventure", examples: "Camping, hiking, water sports" },
  { id: "baby", emoji: "\u{1F476}", label: "Baby & Kids", examples: "Toys, clothes, nursery" },
  { id: "fashion", emoji: "\u{1F45C}", label: "Fashion Accessories", examples: "Jewellery, bags, sunglasses" },
];

// ── Template Card ──────────────────────────────────────────────

function TemplateCard({ template, selected, onClick }: { template: StoreTemplate; selected: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: 16,
        border: selected ? "2px solid #6366F1" : "2px solid #F0F0F0",
        boxShadow: selected
          ? "0 0 0 4px rgba(99,102,241,0.12), 0 12px 32px rgba(99,102,241,0.12)"
          : "0 2px 8px #F5F5F5",
        cursor: "pointer",
        overflow: "hidden",
        transition: "all 250ms cubic-bezier(0.4,0,0.2,1)",
        background: "white",
        position: "relative" as const,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-4px)";
        if (!selected) e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.10)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        if (!selected) e.currentTarget.style.boxShadow = "0 2px 8px #F5F5F5";
      }}
    >
      {/* Preview panel */}
      <div style={{ height: 180, background: template.bgGradient, position: "relative", padding: 14, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: brico, fontWeight: 800, fontSize: 13, color: template.accentColor, letterSpacing: "0.04em" }}>STORE</div>
          <div style={{ fontSize: 9, color: template.accentColor, opacity: 0.7 }}>Shop · About · Cart</div>
        </div>
        <div>
          <div style={{ fontFamily: brico, fontWeight: 700, fontSize: 16, color: template.accentColor, marginBottom: 8, lineHeight: 1.2 }}>Featured Collection</div>
          <div style={{ display: "inline-block", background: template.accentColor, color: "white", fontSize: 10, fontWeight: 700, padding: "4px 12px", borderRadius: 4 }}>
            Shop Now
          </div>
        </div>
        {selected && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#6366F1", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 18, fontWeight: 700 }}>{"\u2713"}</div>
          </div>
        )}
        <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.6)", color: "white", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>
          {template.cr} CR
        </div>
      </div>

      {/* Info panel */}
      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 }}>
          <div style={{ fontFamily: brico, fontWeight: 700, fontSize: 15, color: "#0A0A0A" }}>{template.name}</div>
          <div style={{ fontSize: 11, color: "#9CA3AF", whiteSpace: "nowrap" as const, marginLeft: 8 }}>AOV {template.aov}</div>
        </div>
        <div style={{ fontSize: 10, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 6 }}>{template.niche}</div>
        <div style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.55, marginBottom: 10 }}>{template.description}</div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const, marginBottom: 10 }}>
          {template.tags.map(tag => (
            <span key={tag} style={{ fontSize: 10, fontWeight: 600, color: "#6366F1", background: "#EEF2FF", padding: "2px 7px", borderRadius: 999 }}>{tag}</span>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid #F5F5F5", fontSize: 12, fontWeight: 600, color: "#374151" }}>
          <span>AOV {template.aov}</span>
          <span>CR ~{template.cr}</span>
        </div>
        <button
          onClick={async (e) => {
            e.stopPropagation();
            // Open window synchronously (must be in user-event call stack for popup-blocker to allow)
            const win = window.open('about:blank', '_blank');
            if (!win) { alert('Please allow popups for this site to preview templates.'); return; }
            win.document.write('<html><body style="background:#0f0f0f;color:white;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><p>⚡ Loading preview…</p></body></html>');
            try {
              const res = await fetch('/api/store-builder/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ template: template.id, storeName: template.name + ' Store', niche: template.niche, storeTagline: template.description.slice(0, 60) }),
              });
              const html = await res.text();
              win.document.open();
              win.document.write(html);
              win.document.close();
            } catch (err) {
              win.document.write('<html><body style="padding:40px;font-family:sans-serif"><h2>Preview failed</h2><p>' + String(err) + '</p></body></html>');
            }
          }}
          style={{ width: '100%', marginTop: 10, height: 32, background: '#F5F5F5', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
        >
          Preview →
        </button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────

export default function StoreBuilder() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedNiche, setSelectedNiche] = useState('');
  const [customNiche, setCustomNiche] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeTagline, setStoreTagline] = useState('');
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateFilter, setTemplateFilter] = useState('All');
  const [buildState, setBuildState] = useState<'idle' | 'building' | 'done'>('idle');
  const [buildStep, setBuildStep] = useState(0);
  const [shopifyModal, setShopifyModal] = useState(false);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);
  const [shopDomain, setShopDomain] = useState('');
  const [shopDomainError, setShopDomainError] = useState('');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const { session } = useAuth();

  const previewTemplate = async (templateId: string) => {
    try {
      const res = await fetch('/api/store-builder/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: templateId,
          storeName: storeName || 'Demo Store',
          storeTagline: 'Trending products, fast delivery',
          niche: NICHES.find(n => n.id === selectedNiche)?.label || 'General',
        }),
      });
      const html = await res.text();
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.warn('[StoreBuilder] Preview failed:', err);
    }
  };

  const generatePreview = useCallback(async () => {
    if (!selectedTemplate) return;
    setPreviewLoading(true);
    try {
      const tpl = TEMPLATES.find(t => t.id === selectedTemplate);
      const res = await fetch('/api/store-builder/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: selectedTemplate,
          storeName: storeName || 'My Store',
          storeTagline: storeTagline || 'Trending products delivered fast',
          niche: NICHES.find(n => n.id === selectedNiche)?.label || customNiche || 'General',
          primaryColor: tpl?.accentColor || '#6366F1',
        }),
      });
      const html = await res.text();
      setPreviewHtml(html);
    } catch {
      // silent fail
    }
    setPreviewLoading(false);
  }, [selectedTemplate, storeName, storeTagline, selectedNiche, customNiche]);

  useEffect(() => {
    if (currentStep === 2 && selectedTemplate) generatePreview();
  }, [currentStep, selectedTemplate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'true') {
      setCurrentStep(3);
      window.history.replaceState({}, '', '/store-builder');
    }
    if (params.get('error')) {
      console.warn('[StoreBuilder] OAuth error:', params.get('error'));
    }
  }, []);

  const filteredTemplates = TEMPLATES.filter(t => {
    const matchSearch = templateSearch === '' ||
      t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
      t.niche.toLowerCase().includes(templateSearch.toLowerCase());
    const matchFilter = templateFilter === 'All' ||
      t.tags.some(tag => tag.toLowerCase().includes(templateFilter.toLowerCase()));
    return matchSearch && matchFilter;
  });

  const selectedTpl = TEMPLATES.find(t => t.id === selectedTemplate);

  const BUILD_STEPS = [
    "Selecting products for your niche...",
    "Writing product descriptions...",
    "Configuring theme and colours...",
    "Setting up pages and navigation...",
    "Finalising store settings...",
    "Store ready! \u{1F389}",
  ];

  const startBuild = () => {
    setBuildState('building');
    setBuildStep(0);
    BUILD_STEPS.forEach((_, i) => {
      setTimeout(() => setBuildStep(i), i * 1800);
    });
    setTimeout(() => setBuildState('done'), BUILD_STEPS.length * 1800);
  };

  const handleDownloadZip = () => {
    const tpl = TEMPLATES.find(t => t.id === selectedTemplate);
    if (!tpl) return;

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${storeName || tpl.name + ' Store'}</title>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'DM Sans', sans-serif; background: #fff; color: #0A0A0A; }
nav { display: flex; justify-content: space-between; align-items: center; padding: 16px 48px; border-bottom: 1px solid #F0F0F0; position: sticky; top: 0; background: white; z-index: 100; }
.logo { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: 22px; color: ${tpl.accentColor}; }
.nav-links { display: flex; gap: 32px; font-size: 14px; font-weight: 500; color: #374151; }
.nav-links a { text-decoration: none; color: inherit; }
.cta-btn { background: ${tpl.accentColor}; color: white; padding: 10px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; text-decoration: none; border: none; cursor: pointer; }
.hero { background: ${tpl.bgGradient}; min-height: 70vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 80px 48px; }
.hero h1 { font-family: 'Bricolage Grotesque', sans-serif; font-size: clamp(32px,6vw,72px); font-weight: 800; color: ${tpl.accentColor}; margin-bottom: 16px; }
.hero p { font-size: 18px; max-width: 560px; margin: 0 auto 32px; opacity: 0.8; color: ${tpl.accentColor}; }
.products { padding: 80px 48px; max-width: 1100px; margin: 0 auto; }
.products h2 { font-family: 'Bricolage Grotesque', sans-serif; font-size: 36px; font-weight: 800; margin-bottom: 40px; text-align: center; }
.product-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.product-card { border: 1px solid #F0F0F0; border-radius: 16px; overflow: hidden; }
.product-img { width: 100%; height: 200px; object-fit: cover; background: #F5F5F5; }
.product-body { padding: 16px; }
.product-name { font-weight: 600; font-size: 15px; margin-bottom: 8px; }
.product-price { font-weight: 700; font-size: 18px; color: ${tpl.accentColor}; margin-bottom: 12px; }
.trust-bar { background: #F9FAFB; border-top: 1px solid #F0F0F0; border-bottom: 1px solid #F0F0F0; padding: 24px 48px; display: flex; justify-content: center; gap: 48px; font-size: 13px; font-weight: 500; color: #6B7280; }
footer { background: #0A0A0A; color: white; padding: 40px 48px; text-align: center; font-size: 13px; opacity: 0.8; }
@media (max-width: 768px) { nav { padding: 16px 24px; } .nav-links { display: none; } .hero { padding: 60px 24px; } .products { padding: 60px 24px; } .product-grid { grid-template-columns: 1fr; } .trust-bar { flex-direction: column; gap: 12px; text-align: center; } }
</style>
</head>
<body>
<nav>
  <div class="logo">${storeName || tpl.name}</div>
  <div class="nav-links"><a href="#">Shop</a><a href="#">About</a><a href="#">Contact</a></div>
  <button class="cta-btn">Shop Now</button>
</nav>
<section class="hero">
  <h1>${storeName || 'Your Store'}</h1>
  <p>${storeTagline || 'Discover amazing products curated for you'}</p>
  <button class="cta-btn" style="font-size:16px;padding:14px 40px;">Shop the Collection \\u2192</button>
</section>
<div class="trust-bar">
  <span>\\u{1F69A} Free Shipping Over $75</span>
  <span>\\u2B50 4.9/5 from 2,400+ Reviews</span>
  <span>\\u{1F512} Secure Checkout</span>
  <span>\\u{1F1E6}\\u{1F1FA} Australian Owned</span>
</div>
<section class="products">
  <h2>Featured Products</h2>
  <div class="product-grid">
    <div class="product-card"><div class="product-img" style="aspect-ratio:4/3;background:linear-gradient(135deg,${tpl.accentColor}22,${tpl.accentColor}44);display:flex;align-items:center;justify-content:center;font-size:32px;color:${tpl.accentColor}">&#128722;</div><div class="product-body"><div class="product-name">Premium Product 1</div><div class="product-price">$89.00 AUD</div><button class="cta-btn" style="width:100%">Add to Cart</button></div></div>
    <div class="product-card"><div class="product-img" style="aspect-ratio:4/3;background:linear-gradient(135deg,${tpl.accentColor}22,${tpl.accentColor}44);display:flex;align-items:center;justify-content:center;font-size:32px;color:${tpl.accentColor}">&#128722;</div><div class="product-body"><div class="product-name">Premium Product 2</div><div class="product-price">$65.00 AUD</div><button class="cta-btn" style="width:100%">Add to Cart</button></div></div>
    <div class="product-card"><div class="product-img" style="aspect-ratio:4/3;background:linear-gradient(135deg,${tpl.accentColor}22,${tpl.accentColor}44);display:flex;align-items:center;justify-content:center;font-size:32px;color:${tpl.accentColor}">&#128722;</div><div class="product-body"><div class="product-name">Premium Product 3</div><div class="product-price">$120.00 AUD</div><button class="cta-btn" style="width:100%">Add to Cart</button></div></div>
  </div>
</section>
<footer><p>\\u00A9 2026 ${storeName || tpl.name}. Built with Majorka. All rights reserved.</p></footer>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(storeName || tpl.name).toLowerCase().replace(/\s+/g, '-')}-store.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', color: '#0A0A0A', fontFamily: "'DM Sans', sans-serif" }}>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Store Builder AI — Majorka</title>
      </Helmet>
      <style>{`
        .customise-grid > *:last-child { }
        @media (max-width: 640px) {
          .sb-topbar { padding: 12px 16px !important; }
          .sb-step-label { display: none !important; }
          .sb-content { padding: 24px 16px 80px !important; }
          .sb-template-grid { grid-template-columns: 1fr !important; }
          .sb-customise-grid { grid-template-columns: 1fr !important; }
          .customise-grid { grid-template-columns: 1fr !important; }
          .customise-grid > *:last-child { display: none !important; }
          .sb-launch-grid { grid-template-columns: 1fr !important; }
          .sb-step4-inner { padding: 16px !important; }
          .sb-step-label { font-size: 10px !important; max-width: 60px !important; overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important; }
        }
      `}</style>

      {/* Top bar */}
      <div className="sb-topbar" style={{ borderBottom: '1px solid #E5E7EB', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white' }}>
        <span style={{ fontFamily: brico, fontWeight: 800, fontSize: 18, color: accent, letterSpacing: '-0.02em' }}>
          Store Builder AI
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          {STEP_LABELS.map((label, i) => {
            const isActive = currentStep === i;
            const isDone = currentStep > i;
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isActive ? accent : isDone ? 'rgba(99,102,241,0.15)' : '#F3F4F6',
                  color: isActive ? 'white' : isDone ? accent : '#9CA3AF',
                  fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}>
                  {isDone ? '\u2713' : i + 1}
                </div>
                <span className="sb-step-label" style={{ fontSize: 12, color: isActive ? accent : '#9CA3AF' }}>
                  {label}
                </span>
                {i < STEP_LABELS.length - 1 && (
                  <div style={{ width: 16, height: 1, background: '#E5E7EB', margin: '0 2px' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="sb-content" style={{ maxWidth: currentStep === 0 ? 1100 : currentStep === 2 ? 900 : 680, margin: '0 auto', padding: '40px 24px 80px', transition: 'max-width 300ms' }}>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40 }}>
          {STEP_LABELS.map((label, i) => (
            <React.Fragment key={i}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 80 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: i <= currentStep ? '#6366F1' : '#F3F4F6',
                  color: i <= currentStep ? 'white' : '#9CA3AF',
                  fontSize: 14, fontWeight: 700,
                  boxShadow: i === currentStep ? '0 0 0 4px rgba(99,102,241,0.15)' : 'none',
                  transition: 'all 200ms',
                }}>
                  {i < currentStep ? '\u2713' : i + 1}
                </div>
                <span className="sb-step-label" style={{
                  fontSize: 12,
                  fontWeight: i === currentStep ? 600 : 400,
                  color: i <= currentStep ? '#6366F1' : '#9CA3AF',
                  whiteSpace: 'nowrap',
                }}>
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div style={{
                  flex: 1, height: 2,
                  background: i < currentStep ? '#6366F1' : '#F3F4F6',
                  transition: 'background 300ms',
                  marginBottom: 28,
                }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ── Step 1: Choose a Template ── */}
        {currentStep === 0 && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontFamily: brico, fontWeight: 800, fontSize: "clamp(22px,4vw,32px)", color: "#0A0A0A", marginBottom: 8 }}>
                Choose a template
              </h2>
              <p style={{ fontSize: 14, color: "#6B7280" }}>
                Each template is built for a specific niche and pre-optimised for AU conversions. You can customise colours and copy after selecting.
              </p>
            </div>

            {/* Search + filter bar */}
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 24 }}>
              <input
                type="text"
                placeholder="Search templates..."
                value={templateSearch}
                onChange={e => setTemplateSearch(e.target.value)}
                style={{ height: 38, padding: "0 14px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14, color: "#374151", background: "white", outline: "none", minWidth: 'min(200px, 100%)', flex: "0 0 auto" }}
                onFocus={e => (e.currentTarget.style.borderColor = "#6366F1")}
                onBlur={e => (e.currentTarget.style.borderColor = "#E5E7EB")}
              />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["All", "Luxury", "Fashion", "Tech", "Beauty", "Food", "Outdoor", "Kids", "Fitness", "Eco"].map(f => (
                  <button
                    key={f}
                    onClick={() => setTemplateFilter(f)}
                    style={{ height: 32, padding: "0 14px", borderRadius: 999, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500, transition: "all 150ms",
                      background: templateFilter === f ? "#6366F1" : "#F5F5F5",
                      color: templateFilter === f ? "white" : "#374151",
                    }}
                  >{f}</button>
                ))}
              </div>
            </div>

            {/* Selected banner */}
            {selectedTemplate && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: 10, marginBottom: 20 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#6366F1" }}>
                  {"\u2713"} Template selected: {TEMPLATES.find(t => t.id === selectedTemplate)?.name} — ready for Step 2
                </span>
                <button
                  onClick={() => setCurrentStep(1)}
                  style={{ height: 36, padding: "0 20px", background: "#6366F1", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  Continue to Niche Selection {"\u2192"}
                </button>
              </div>
            )}

            {/* Template grid */}
            <div className="sb-template-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
              {filteredTemplates.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  selected={selectedTemplate === template.id}
                  onClick={() => {
                    setSelectedTemplate(template.id);
                    setTimeout(() => setCurrentStep(1), 500);
                  }}
                />
              ))}
              {filteredTemplates.length === 0 && (
                <div style={{ gridColumn: "1/-1", padding: "60px 24px", textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>
                  No templates match "{templateSearch}" — <button onClick={() => { setTemplateSearch(""); setTemplateFilter("All"); }} style={{ color: "#6366F1", background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>Clear filters</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 2: Pick Your Niche ── */}
        {currentStep === 1 && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <button onClick={() => setCurrentStep(0)} style={{ fontSize: 13, color: "#6B7280", background: "none", border: "none", cursor: "pointer", marginBottom: 12, display: "flex", alignItems: "center", gap: 4 }}>
                {"\u2190"} Back to templates
              </button>
              <h2 style={{ fontFamily: brico, fontWeight: 800, fontSize: "clamp(22px,4vw,32px)", color: "#0A0A0A", marginBottom: 8 }}>
                Pick your niche
              </h2>
              <p style={{ fontSize: 14, color: "#6B7280" }}>
                Choose the product category your store will focus on. This helps Majorka AI generate the right copy and product selections.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginBottom: 20 }}>
              {NICHES.map(niche => (
                <div
                  key={niche.id}
                  onClick={() => setSelectedNiche(niche.id)}
                  style={{
                    padding: "20px", borderRadius: 14, cursor: "pointer", transition: "all 200ms",
                    border: selectedNiche === niche.id ? "2px solid #6366F1" : "2px solid #F0F0F0",
                    background: selectedNiche === niche.id ? "#EEF2FF" : "white",
                    boxShadow: selectedNiche === niche.id ? "0 0 0 3px rgba(99,102,241,0.1)" : "none",
                  }}
                  onMouseEnter={e => { if (selectedNiche !== niche.id) { e.currentTarget.style.borderColor = "#C7D2FE"; e.currentTarget.style.background = "#FAFAFA"; } }}
                  onMouseLeave={e => { if (selectedNiche !== niche.id) { e.currentTarget.style.borderColor = "#F0F0F0"; e.currentTarget.style.background = "white"; } }}
                >
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{niche.emoji}</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#0A0A0A", marginBottom: 4 }}>{niche.label}</div>
                  <div style={{ fontSize: 12, color: "#9CA3AF" }}>{niche.examples}</div>
                </div>
              ))}
            </div>

            {/* Custom niche input */}
            <div style={{ padding: "16px 20px", border: "2px dashed #E5E7EB", borderRadius: 14, display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ fontSize: 20 }}>{"\u270F\uFE0F"}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Enter a custom niche</div>
                <input
                  type="text"
                  placeholder="e.g. 'LED lighting for gamers'"
                  value={customNiche}
                  onChange={e => { setCustomNiche(e.target.value); setSelectedNiche("custom"); }}
                  style={{ width: "100%", height: 36, padding: "0 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, color: "#374151", background: "white", outline: "none", boxSizing: "border-box" as const }}
                  onFocus={e => { e.currentTarget.style.borderColor = "#6366F1"; setSelectedNiche("custom"); }}
                  onBlur={e => (e.currentTarget.style.borderColor = "#E5E7EB")}
                />
              </div>
            </div>

            {/* Next button */}
            <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => { if (selectedNiche) setCurrentStep(2); }}
                disabled={!selectedNiche}
                style={{ height: 44, padding: "0 32px", background: selectedNiche ? "#6366F1" : "#E5E7EB", color: selectedNiche ? "white" : "#9CA3AF", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: selectedNiche ? "pointer" : "not-allowed", transition: "all 200ms" }}
              >
                Continue {"\u2192"}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Customise Your Store ── */}
        {currentStep === 2 && (
          <div className="sb-customise-grid customise-grid" style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 32, alignItems: "flex-start" }}>
            {/* Left: Form */}
            <div>
              <button onClick={() => setCurrentStep(1)} style={{ fontSize: 13, color: "#6B7280", background: "none", border: "none", cursor: "pointer", marginBottom: 20, display: "flex", alignItems: "center", gap: 4 }}>{"\u2190"} Back</button>
              <h2 style={{ fontFamily: brico, fontWeight: 800, fontSize: 28, color: "#0A0A0A", marginBottom: 8 }}>Customise your store</h2>
              <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 28 }}>Give your store its identity. You can change all of this later.</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Store Name</label>
                  <input
                    type="text"
                    placeholder="e.g. PawsAustralia"
                    value={storeName}
                    onChange={e => setStoreName(e.target.value)}
                    style={{ width: "100%", height: 44, padding: "0 14px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14, color: "#0A0A0A", background: "white", outline: "none", boxSizing: "border-box" as const }}
                    onFocus={e => (e.currentTarget.style.borderColor = "#6366F1")}
                    onBlur={e => (e.currentTarget.style.borderColor = "#E5E7EB")}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Store Tagline</label>
                  <input
                    type="text"
                    placeholder="e.g. Premium pet products, delivered to your door"
                    value={storeTagline}
                    onChange={e => setStoreTagline(e.target.value)}
                    style={{ width: "100%", height: 44, padding: "0 14px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14, color: "#0A0A0A", background: "white", outline: "none", boxSizing: "border-box" as const }}
                    onFocus={e => (e.currentTarget.style.borderColor = "#6366F1")}
                    onBlur={e => (e.currentTarget.style.borderColor = "#E5E7EB")}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Currency</label>
                  <select
                    style={{ width: "100%", height: 44, padding: "0 14px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14, color: "#0A0A0A", background: "white", outline: "none", boxSizing: "border-box" as const, cursor: "pointer" }}
                    defaultValue="AUD"
                  >
                    <option value="AUD">{"\u{1F1E6}\u{1F1FA}"} Australian Dollar (AUD)</option>
                    <option value="USD">{"\u{1F1FA}\u{1F1F8}"} US Dollar (USD)</option>
                    <option value="GBP">{"\u{1F1EC}\u{1F1E7}"} British Pound (GBP)</option>
                    <option value="NZD">{"\u{1F1F3}\u{1F1FF}"} New Zealand Dollar (NZD)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: 28, display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={() => { if (storeName.trim()) setCurrentStep(3); }}
                  disabled={!storeName.trim()}
                  style={{ height: 44, padding: "0 32px", background: storeName.trim() ? "#6366F1" : "#E5E7EB", color: storeName.trim() ? "white" : "#9CA3AF", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: storeName.trim() ? "pointer" : "not-allowed", transition: "all 200ms" }}
                >
                  Continue to Launch {"\u2192"}
                </button>
              </div>
            </div>

            {/* Right: Live preview */}
            <div style={{ position: "sticky" as const, top: 80 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 10 }}>Live Preview</div>
              <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid #E5E7EB", boxShadow: "0 8px 32px rgba(0,0,0,0.10)" }}>
                {/* Browser chrome */}
                <div style={{ background: "#F5F5F5", padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", gap: 5 }}>
                    {["#EF4444", "#F59E0B", "#22C55E"].map((c, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
                  </div>
                  <div style={{ flex: 1, background: "white", borderRadius: 4, padding: "3px 8px", fontSize: 10, color: "#9CA3AF" }}>
                    {storeName ? storeName.toLowerCase().replace(/\s/g, "") : "yourstore"}.myshopify.com
                  </div>
                  <button onClick={generatePreview} style={{ fontSize: 10, color: "#6366F1", background: "none", border: "none", cursor: "pointer", fontWeight: 700, padding: "2px 6px" }}>
                    {"\u21BB"} Refresh
                  </button>
                </div>
                {previewLoading ? (
                  <div style={{ height: 400, display: "flex", alignItems: "center", justifyContent: "center", background: "#FAFAFA", fontSize: 13, color: "#9CA3AF" }}>
                    {"\u2728"} Generating preview{"\u2026"}
                  </div>
                ) : previewHtml ? (
                  <iframe
                    srcDoc={previewHtml}
                    style={{ width: "100%", height: 400, border: "none", display: "block" }}
                    title="Store Preview"
                    sandbox="allow-scripts allow-same-origin"
                  />
                ) : (
                  <div style={{ height: 400, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", background: "#FAFAFA", gap: 12 }}>
                    <div style={{ fontSize: 32 }}>{"\u{1F3EA}"}</div>
                    <div style={{ fontSize: 13, color: "#9CA3AF" }}>Click Refresh to preview your store</div>
                  </div>
                )}
              </div>
              {/* Sub-pages notice */}
              <div style={{ marginTop: 10, display: "flex", gap: 8, justifyContent: "center" }}>
                {["\u{1F3E0} Home", "\u{1F6CD}\uFE0F Products", "\u2139\uFE0F About", "\u2709\uFE0F Contact"].map(p => (
                  <span key={p} style={{ fontSize: 10, color: "#6366F1", background: "#EEF2FF", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>{p}</span>
                ))}
              </div>
              <div style={{ marginTop: 6, fontSize: 11, color: "#9CA3AF", textAlign: "center" as const }}>
                4 pages included {"\u00B7"} Scroll inside preview to explore
              </div>
              {/* Open Full Preview button */}
              <button onClick={() => {
                if (!previewHtml) return;
                const win = window.open('about:blank', '_blank');
                if (!win) return;
                win.document.open(); win.document.write(previewHtml); win.document.close();
              }} style={{ width: "100%", height: 38, background: "none", border: "1px solid #6366F1", color: "#6366F1", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", marginTop: 10 }}>
                ↗ Open Full Preview
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Connect & Launch ── */}
        {currentStep === 3 && (
          <div className="sb-step4-inner" style={{ maxWidth: 600, margin: "0 auto" }}>
            <div style={{ marginBottom: 32, textAlign: "center" }}>
              <h2 style={{ fontFamily: brico, fontWeight: 800, fontSize: 28, color: "#0A0A0A", marginBottom: 8 }}>
                {buildState === "done" ? "Your store is ready! \u{1F389}" : "Connect & Launch"}
              </h2>
              <p style={{ fontSize: 14, color: "#6B7280" }}>
                {buildState === "done"
                  ? "Majorka has built your complete Shopify store. Connect it or download the files."
                  : "Final step \u2014 choose how to launch your store."}
              </p>
            </div>

            {buildState === "idle" && (
              <>
                {/* Summary card */}
                <div style={{ background: "#FAFAFA", border: "1px solid #E5E7EB", borderRadius: 14, padding: "20px 24px", marginBottom: 24 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 12 }}>Store Summary</div>
                  {[
                    { label: "Template", value: TEMPLATES.find(t => t.id === selectedTemplate)?.name ?? "\u2014" },
                    { label: "Niche", value: NICHES.find(n => n.id === selectedNiche)?.label ?? customNiche ?? "\u2014" },
                    { label: "Store Name", value: storeName || "\u2014" },
                    { label: "Currency", value: "AUD \u{1F1E6}\u{1F1FA}" },
                  ].map((row, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", paddingBottom: i < 3 ? 10 : 0, marginBottom: i < 3 ? 10 : 0, borderBottom: i < 3 ? "1px solid #F3F4F6" : "none" }}>
                      <span style={{ fontSize: 13, color: "#6B7280" }}>{row.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#0A0A0A" }}>{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* Launch options */}
                <div className="sb-launch-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                  <div style={{ padding: "20px", border: "2px solid #6366F1", borderRadius: 12, textAlign: "center", background: "#EEF2FF" }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{"\u{1F3EA}"}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0A0A0A", marginBottom: 4 }}>Connect Shopify</div>
                    <div style={{ fontSize: 12, color: "#6B7280" }}>OAuth connection — store deploys directly</div>
                  </div>
                  <div style={{ padding: "20px", border: "2px solid #E5E7EB", borderRadius: 12, textAlign: "center", background: "white" }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{"\u{1F4E6}"}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0A0A0A", marginBottom: 4 }}>Download Files</div>
                    <div style={{ fontSize: 12, color: "#6B7280" }}>ZIP export — upload to any Shopify store</div>
                  </div>
                </div>

                <button
                  onClick={startBuild}
                  style={{ width: "100%", height: 52, background: "#6366F1", color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", transition: "all 150ms" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#4F46E5")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#6366F1")}
                >
                  Build My Store {"\u2192"}
                </button>
              </>
            )}

            {buildState === "building" && (
              <div style={{ background: "white", border: "1px solid #F0F0F0", borderRadius: 16, padding: 32 }}>
                <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>Building your store...</div>
                  <div style={{ fontSize: 13, color: "#6366F1" }}>{Math.round((buildStep / (BUILD_STEPS.length - 1)) * 100)}%</div>
                </div>
                <div style={{ height: 6, background: "#F3F4F6", borderRadius: 999, marginBottom: 24 }}>
                  <div style={{ height: "100%", width: `${(buildStep / (BUILD_STEPS.length - 1)) * 100}%`, background: "linear-gradient(90deg, #6366F1, #8B5CF6)", borderRadius: 999, transition: "width 0.8s ease" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {BUILD_STEPS.map((step, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 8, background: i === buildStep ? "rgba(99,102,241,0.06)" : "transparent", border: i === buildStep ? "1px solid rgba(99,102,241,0.15)" : "1px solid transparent" }}>
                      <span style={{ fontSize: 16, minWidth: 20 }}>
                        {i < buildStep ? "\u2705" : i === buildStep ? "\u27F3" : "\u25CB"}
                      </span>
                      <span style={{ fontSize: 13, color: i < buildStep ? "#374151" : i === buildStep ? "#6366F1" : "#9CA3AF", fontWeight: i === buildStep ? 500 : 400 }}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {buildState === "done" && (
              <div style={{ background: "white", border: "1px solid #F0F0F0", borderRadius: 16, padding: 32, textAlign: "center" }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>{"\u{1F389}"}</div>
                <div style={{ fontFamily: brico, fontWeight: 800, fontSize: 24, color: "#0A0A0A", marginBottom: 8 }}>{storeName} is live!</div>
                <div style={{ fontSize: 14, color: "#6B7280", marginBottom: 24 }}>Your Majorka-built store is ready. Connect to Shopify or download your store files.</div>
                <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                  <button
                    onClick={() => setShopifyModal(true)}
                    style={{ height: 44, padding: "0 24px", background: "#6366F1", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
                  >
                    Connect Shopify {"\u2192"}
                  </button>
                  <button
                    onClick={handleDownloadZip}
                    style={{ height: 44, padding: "0 24px", background: "white", color: "#374151", border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
                  >
                    Download Store HTML
                  </button>
                </div>
                <button
                  onClick={async () => {
                    // Use cached preview HTML if available, else fetch fresh
                    let html = previewHtml;
                    const tpl = TEMPLATES.find(t => t.id === selectedTemplate);
                    if (!html && tpl) {
                      setDownloadToast('⏳ Fetching HTML…');
                      try {
                        const res = await fetch('/api/store-builder/preview', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ template: selectedTemplate, storeName: storeName || tpl.name + ' Store', storeTagline: storeTagline || 'Trending products, fast delivery', niche: NICHES.find(n => n.id === selectedNiche)?.label || customNiche || 'General', primaryColor: tpl.accentColor }),
                        });
                        html = await res.text();
                      } catch { setDownloadToast('❌ Could not fetch HTML'); setTimeout(() => setDownloadToast(null), 3000); return; }
                    }
                    if (html) {
                      await navigator.clipboard.writeText(html);
                      setDownloadToast('📋 Copied to clipboard! (' + Math.round(html.length / 1024) + 'KB)');
                      setTimeout(() => setDownloadToast(null), 3500);
                    }
                  }}
                  style={{ marginTop: 16, background: 'none', border: 'none', color: '#9CA3AF', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  or copy store HTML to clipboard
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Download / Clipboard toast */}
      {downloadToast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#0A0A0A', color: 'white', padding: '12px 24px', borderRadius: 10, fontSize: 13, fontWeight: 500, zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', whiteSpace: 'nowrap' as const }}>
          {downloadToast}
        </div>
      )}

      {/* Shopify Connect Modal */}
      {shopifyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 40, maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 28, marginBottom: 16, textAlign: 'center' }}>{"\u{1F3EA}"}</div>
            <h3 style={{ fontFamily: brico, fontWeight: 800, fontSize: 22, color: '#0A0A0A', textAlign: 'center', marginBottom: 8 }}>Connect your Shopify store</h3>
            <p style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 }}>Enter your Shopify store URL to publish directly.</p>

            {!import.meta.env.VITE_SHOPIFY_CLIENT_ID ? (
              <div>
                <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#C2410C', marginBottom: 4 }}>Shopify Integration Coming Soon</div>
                  <div style={{ fontSize: 13, color: '#7C2D12' }}>
                    Direct Shopify publishing is being set up. For now, download your store files below and import them via Shopify Admin → Online Store → Themes.
                  </div>
                </div>
                <button
                  onClick={() => setShopifyModal(false)}
                  style={{ width: '100%', height: 44, background: '#F5F5F5', color: '#374151', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >
                  Got it
                </button>
              </div>
            ) : (
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Shopify Store URL</label>
                <input
                  type="text"
                  placeholder="yourstore.myshopify.com"
                  value={shopDomain}
                  onChange={e => { setShopDomain(e.target.value); setShopDomainError(''); }}
                  style={{ width: '100%', height: 44, padding: '0 14px', border: shopDomainError ? '1px solid #EF4444' : '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, color: '#0A0A0A', outline: 'none', boxSizing: 'border-box' as const, marginBottom: 6 }}
                  onFocus={e => { if (!shopDomainError) e.currentTarget.style.borderColor = '#6366F1'; }}
                  onBlur={e => { if (!shopDomainError) e.currentTarget.style.borderColor = '#E5E7EB'; }}
                />
                {shopDomainError && <div style={{ fontSize: 12, color: '#EF4444', marginBottom: 12 }}>{shopDomainError}</div>}
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button
                    onClick={() => { setShopifyModal(false); setShopDomain(''); setShopDomainError(''); }}
                    style={{ flex: 1, height: 44, background: '#F5F5F5', color: '#374151', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const domain = shopDomain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
                      if (!domain) { setShopDomainError('Please enter your store URL'); return; }
                      if (!domain.includes('.')) { setShopDomainError('Please enter a valid Shopify store URL'); return; }
                      const nonce = Math.random().toString(36).substring(2);
                      const redirectUri = encodeURIComponent('https://majorka.io/api/shopify/callback');
                      window.location.href = `https://${domain}/admin/oauth/authorize?client_id=${import.meta.env.VITE_SHOPIFY_CLIENT_ID}&scope=write_products,write_themes,read_orders&redirect_uri=${redirectUri}&state=${nonce}`;
                    }}
                    style={{ flex: 2, height: 44, background: '#6366F1', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Connect Store {"\u2192"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
