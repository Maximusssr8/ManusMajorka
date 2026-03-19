import JSZip from 'jszip';
import {
  AlertTriangle,
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
  Search,
  Share2,
  ShoppingBag,
  Smartphone,
  StickyNote,
  Terminal,
  X,
  Zap,
} from 'lucide-react';
import React, { lazy, useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { markOnboardingStep } from '@/lib/onboarding';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

// Lazy-load heavy syntax highlighter to keep initial bundle small
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SyntaxHighlighter = lazy<React.ComponentType<any>>(() =>
  import('react-syntax-highlighter').then((m) => ({ default: m.Prism }))
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
import { useStoreBuilderParams } from '@/hooks/useStoreBuilderParams';
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

const PROGRESS_MESSAGES_V2: Record<number, string> = {
  5: 'Fetching product images...',
  10: 'Building your brand brief...',
  15: 'Warming up the AI...',
  20: 'Writing your store copy...',
  30: 'Crafting the hero section...',
  50: 'Designing your layout...',
  70: 'Adding product pages...',
  90: 'Finishing touches...',
  98: 'Assembling final store...',
  100: 'Your store is ready! 🎉',
};

function humanizeError(error: string): string {
  const map: Record<string, string> = {
    'subscription_required': 'Upgrade your plan to generate stores',
    'rate_limit': 'Hourly limit reached — try again in 60 minutes',
    'timeout': 'Generation timed out — please try again',
    'timed out': 'Generation timed out — please try again',
    'unauthorized': 'Please sign in to continue',
    'Connection lost': 'Connection lost — click Retry to try again',
    'Failed to fetch': 'Connection lost — click Retry to try again',
    'No HTML returned': 'Generation returned empty — please retry',
  };
  for (const [key, msg] of Object.entries(map)) {
    if (error?.includes(key)) return msg;
  }
  return error || 'Something went wrong — please try again';
}

function getProgressMessage(progress: number): string {
  const keys = Object.keys(PROGRESS_MESSAGES_V2).map(Number).sort((a, b) => b - a);
  for (const k of keys) { if (progress >= k) return PROGRESS_MESSAGES_V2[k]; }
  return 'Starting...';
}

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
<html lang="en-AU">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{storeName} | AU Free Shipping</title>
  <meta name="description" content="{metaDescription}">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root { --primary: {primaryColor}; --accent: {primaryColor}; --text: #1a1a1a; --bg: #ffffff; --light: #f8f9fa; --border: #e9ecef; --dark: #111827; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; color: var(--text); background: var(--bg); }
    /* NAV */
    nav { display: flex; justify-content: space-between; align-items: center; padding: 14px 40px; background: #fff; border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 100; box-shadow: 0 1px 8px rgba(0,0,0,0.06); }
    .logo { font-weight: 900; font-size: 20px; color: var(--primary); letter-spacing: -0.5px; }
    .nav-links { display: flex; gap: 28px; }
    .nav-links a { text-decoration: none; color: #555; font-size: 14px; font-weight: 500; }
    .nav-links a:hover { color: var(--primary); }
    .cart-btn { background: var(--primary); color: #fff; padding: 8px 18px; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; border: none; }
    /* ANNOUNCEMENT */
    .announcement { background: var(--primary); color: #fff; text-align: center; padding: 8px; font-size: 12px; font-weight: 600; letter-spacing: 0.5px; }
    /* HERO */
    .hero { position: relative; min-height: 540px; display: flex; align-items: center; overflow: hidden; }
    .hero-bg { position: absolute; inset: 0; background: url('{heroBgImage}') center/cover no-repeat; filter: brightness(0.45); }
    .hero-content { position: relative; z-index: 1; padding: 60px 40px; max-width: 700px; }
    .hero-badge { display: inline-block; background: var(--primary); color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
    .hero h1 { font-size: clamp(32px, 5vw, 56px); font-weight: 900; color: #fff; line-height: 1.08; margin-bottom: 16px; letter-spacing: -1px; }
    .hero p { font-size: 17px; color: rgba(255,255,255,0.85); margin-bottom: 28px; max-width: 500px; line-height: 1.65; }
    .hero-cta { display: inline-block; background: var(--primary); color: #fff; padding: 16px 36px; border-radius: 10px; font-weight: 800; font-size: 16px; text-decoration: none; cursor: pointer; box-shadow: 0 4px 20px rgba(0,0,0,0.25); }
    /* TRUST BADGES */
    .trust-bar { background: var(--light); border-bottom: 1px solid var(--border); padding: 14px 40px; }
    .trust-badges { display: flex; gap: 32px; justify-content: center; flex-wrap: wrap; }
    .trust-badge { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: #444; }
    /* PRODUCT SECTION */
    .product-section { padding: 60px 40px; max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: start; }
    .product-image { position: relative; }
    .product-image img { width: 100%; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); }
    .product-image .badge { position: absolute; top: 16px; left: 16px; background: #ef4444; color: #fff; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; }
    .product-info { }
    .product-info h1 { font-size: 28px; font-weight: 900; line-height: 1.2; margin-bottom: 12px; }
    .rating { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    .stars { color: #f59e0b; font-size: 16px; letter-spacing: 1px; }
    .rating-count { font-size: 13px; color: #777; }
    .price-row { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
    .price-current { font-size: 36px; font-weight: 900; color: var(--primary); }
    .price-original { font-size: 20px; color: #aaa; text-decoration: line-through; }
    .price-save { background: #dcfce7; color: #16a34a; padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: 700; }
    .countdown-box { background: var(--dark); color: #fff; padding: 12px 16px; border-radius: 10px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
    .countdown-label { font-size: 12px; color: rgba(255,255,255,0.7); }
    .countdown-timer { font-size: 22px; font-weight: 900; font-family: monospace; color: #f59e0b; }
    .qty-row { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .qty-label { font-size: 13px; font-weight: 600; color: #555; }
    .qty-control { display: flex; align-items: center; border: 1.5px solid var(--border); border-radius: 8px; overflow: hidden; }
    .qty-btn { background: none; border: none; padding: 8px 14px; cursor: pointer; font-size: 18px; font-weight: 700; color: #333; }
    .qty-val { padding: 8px 16px; font-weight: 700; font-size: 15px; border-left: 1.5px solid var(--border); border-right: 1.5px solid var(--border); }
    .add-btn { width: 100%; background: var(--primary); color: #fff; border: none; padding: 18px; border-radius: 12px; font-size: 17px; font-weight: 800; cursor: pointer; margin-bottom: 12px; transition: opacity 0.2s; }
    .add-btn:hover { opacity: 0.9; }
    .buy-btn { width: 100%; background: #111; color: #fff; border: none; padding: 16px; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; margin-bottom: 20px; }
    .benefits-list { list-style: none; space-y: 8px; }
    .benefits-list li { display: flex; align-items: flex-start; gap: 8px; font-size: 14px; color: #444; line-height: 1.5; padding: 6px 0; border-bottom: 1px solid var(--border); }
    .benefits-list li::before { content: "✓"; color: var(--primary); font-weight: 800; flex-shrink: 0; }
    /* FEATURES */
    .features { padding: 80px 40px; background: var(--light); }
    .features h2 { text-align: center; font-size: 32px; font-weight: 900; margin-bottom: 48px; }
    .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; max-width: 960px; margin: 0 auto; }
    .feature-card { background: #fff; padding: 28px 22px; border-radius: 14px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
    .feature-icon { font-size: 28px; margin-bottom: 12px; }
    .feature-card h3 { font-size: 17px; font-weight: 800; margin-bottom: 8px; }
    .feature-card p { font-size: 14px; color: #666; line-height: 1.6; }
    /* TESTIMONIALS */
    .testimonials { padding: 80px 40px; }
    .testimonials h2 { text-align: center; font-size: 32px; font-weight: 900; margin-bottom: 12px; }
    .rating-summary { text-align: center; font-size: 15px; color: #666; margin-bottom: 48px; }
    .testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 960px; margin: 0 auto; }
    .testimonial-card { background: #fff; padding: 24px; border-radius: 14px; box-shadow: 0 2px 16px rgba(0,0,0,0.07); border-top: 3px solid var(--primary); }
    .t-stars { color: #f59e0b; font-size: 14px; margin-bottom: 10px; }
    .testimonial-card blockquote { font-size: 14px; color: #444; line-height: 1.65; margin-bottom: 14px; font-style: italic; }
    .t-name { font-weight: 800; font-size: 13px; }
    .t-loc { font-size: 12px; color: #999; margin-top: 2px; }
    /* FAQ */
    .faq { padding: 80px 40px; background: var(--light); }
    .faq h2 { font-size: 30px; font-weight: 900; text-align: center; margin-bottom: 40px; }
    .faq-inner { max-width: 700px; margin: 0 auto; }
    .faq-item { background: #fff; border-radius: 12px; margin-bottom: 12px; overflow: hidden; box-shadow: 0 1px 6px rgba(0,0,0,0.05); }
    .faq-q { padding: 18px 22px; font-weight: 700; font-size: 15px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
    .faq-q:hover { background: var(--light); }
    .faq-arrow { transition: transform 0.3s; font-size: 18px; }
    .faq-a { max-height: 0; overflow: hidden; transition: max-height 0.35s ease; }
    .faq-a.open { max-height: 300px; }
    .faq-a p { padding: 0 22px 18px; font-size: 14px; color: #666; line-height: 1.7; }
    /* FOOTER */
    footer { background: var(--dark); color: #fff; padding: 48px 40px; }
    .footer-inner { max-width: 960px; margin: 0 auto; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 32px; }
    .footer-brand .logo { font-size: 22px; margin-bottom: 8px; }
    .footer-brand p { font-size: 13px; color: rgba(255,255,255,0.5); max-width: 240px; line-height: 1.6; }
    .footer-links { display: flex; flex-direction: column; gap: 8px; }
    .footer-links a { font-size: 13px; color: rgba(255,255,255,0.5); text-decoration: none; }
    .footer-links a:hover { color: #fff; }
    .footer-bottom { border-top: 1px solid rgba(255,255,255,0.08); margin-top: 32px; padding-top: 20px; text-align: center; font-size: 12px; color: rgba(255,255,255,0.35); }
    /* VARIANTS */
    .variant-row { margin-bottom: 16px; }
    .variant-label { font-size: 13px; font-weight: 600; color: #555; display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .variant-options { display: flex; gap: 8px; flex-wrap: wrap; }
    .variant-btn { padding: 8px 16px; border: 1.5px solid #ddd; border-radius: 8px; background: #fff; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.15s; }
    .variant-btn.active { border-color: var(--primary); background: var(--primary); color: #fff; }
    .variant-btn:hover:not(.active) { border-color: var(--primary); }
    .size-guide-link { font-size: 11px; color: var(--primary); text-decoration: underline; cursor: pointer; background: none; border: none; font-weight: 600; padding: 0; }
    #cartCount { background: #ef4444; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 11px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; margin-left: 4px; vertical-align: middle; }
    /* RESPONSIVE */
    @media (max-width: 768px) {
      nav { padding: 12px 20px; }
      .nav-links { display: none; }
      .product-section { grid-template-columns: 1fr; gap: 32px; padding: 32px 20px; }
      .features-grid, .testimonials-grid { grid-template-columns: 1fr; }
      .hero { min-height: 420px; }
      .hero-content { padding: 40px 20px; }
      .hero h1 { font-size: 32px; }
      .features, .testimonials, .faq { padding: 48px 20px; }
      .trust-bar { padding: 12px 20px; }
      .trust-badges { gap: 16px; justify-content: flex-start; }
      .footer-inner { flex-direction: column; }
    }
  </style>
</head>
<body>
  <div class="announcement">🇦🇺 Free AU Shipping on Orders Over $79 | Afterpay Available | 30-Day Returns</div>
  <nav>
    <div class="logo">{storeName}</div>
    <div class="nav-links">
      <a href="#product">Product</a>
      <a href="#reviews">Reviews</a>
      <a href="#faq">FAQ</a>
      <a href="#contact">Contact</a>
    </div>
    <button class="cart-btn" onclick="showCart()">🛒 Cart <span id="cartCount"></span></button>
  </nav>

  <!-- HERO -->
  <section class="hero">
    <div class="hero-bg"></div>
    <div class="hero-content">
      <div class="hero-badge">🇦🇺 Australian Store</div>
      <h1>{headline}</h1>
      <p>{subheadline}</p>
      <a href="#product" class="hero-cta">{ctaText} →</a>
    </div>
  </section>

  <!-- TRUST BAR -->
  <div class="trust-bar">
    <div class="trust-badges">
      <div class="trust-badge">🇦🇺 Ships from AU</div>
      <div class="trust-badge">⭐ 4.9 Stars (247 reviews)</div>
      <div class="trust-badge">🔒 Secure Checkout</div>
      <div class="trust-badge">↩️ 30-Day Returns</div>
      <div class="trust-badge">💳 Afterpay Available</div>
    </div>
  </div>

  <!-- PRODUCT SECTION -->
  <div class="product-section" id="product">
    <div class="product-image">
      <div class="badge">SALE</div>
      <img src="{productImage}" alt="{headline}" id="mainProductImg" onerror="this.src='https://placehold.co/600x500/f3f4f6/94a3b8?text=Product+Image'" />
    </div>
    <div class="product-info">
      <h1>{headline}</h1>
      <div class="rating">
        <span class="stars">★★★★★</span>
        <span class="rating-count">4.9/5 (247 reviews)</span>
      </div>
      <div class="price-row">
        <span class="price-current">$89.99 AUD</span>
        <span class="price-original">$129.99</span>
        <span class="price-save">Save 31%</span>
      </div>
      <div class="countdown-box">
        <div>
          <div class="countdown-label">⚡ Limited offer ends in:</div>
          <div class="countdown-timer" id="countdown">02:14:33</div>
        </div>
      </div>
      {SIZES_HTML}
      {COLORS_HTML}
      <div class="qty-row">
        <span class="qty-label">Quantity:</span>
        <div class="qty-control">
          <button class="qty-btn" onclick="changeQty(-1)">−</button>
          <span class="qty-val" id="qtyVal">1</span>
          <button class="qty-btn" onclick="changeQty(1)">+</button>
        </div>
      </div>
      <button class="add-btn" onclick="addToCart()">Add to Cart</button>
      <button class="buy-btn" onclick="buyNow()">Buy Now — Afterpay Available</button>
      <ul class="benefits-list">
        {BENEFITS_HTML}
      </ul>
    </div>
  </div>

  <!-- FEATURES -->
  <section class="features">
    <h2>Why Australians Love {storeName}</h2>
    <div class="features-grid">{FEATURES_HTML}</div>
  </section>

  <!-- BRAND STORY -->
  <section style="padding:60px 40px;max-width:760px;margin:0 auto;text-align:center">
    <h2 style="font-size:28px;font-weight:900;margin-bottom:20px">Our Story</h2>
    <p style="font-size:16px;color:#555;line-height:1.8">{brandStory}</p>
  </section>

  <!-- TESTIMONIALS -->
  <section class="testimonials" id="reviews">
    <h2>Real Reviews From Real Aussies</h2>
    <div class="rating-summary">⭐⭐⭐⭐⭐ <strong>4.9/5</strong> from 247 verified Australian customers</div>
    <div class="testimonials-grid">{TESTIMONIALS_HTML}</div>
  </section>

  <!-- FAQ -->
  <section class="faq" id="faq">
    <h2>Frequently Asked Questions</h2>
    <div class="faq-inner">{FAQS_HTML}</div>
  </section>

  <!-- FOOTER -->
  <footer id="contact">
    <div class="footer-inner">
      <div class="footer-brand">
        <div class="logo">{storeName}</div>
        <p>{tagline}</p>
      </div>
      <div class="footer-links">
        <a href="#">Privacy Policy</a>
        <a href="#">Terms & Conditions</a>
        <a href="#">Shipping Policy</a>
        <a href="#">Returns & Refunds</a>
        <a href="mailto:hello@{storeNameSlug}.com.au">Contact Us</a>
      </div>
    </div>
    <div class="footer-bottom">&copy; 2025 {storeName}. All rights reserved. ABN: XX XXX XXX XXX | 🇦🇺 Australian Business</div>
  </footer>

  <script>
    // ── Cart State ────────────────────────────────────────────────────────────
    var cart = JSON.parse(localStorage.getItem('maj_cart') || '[]');
    var qty = 1;
    var selectedSize = '';
    var selectedColor = '';
    var colorImages = {COLOR_VARIANT_MAP_JSON};
    var sizeChartImg = '{sizeChartImage}';

    // ── Variant Selection ─────────────────────────────────────────────────────
    function selectVariant(btn, type) {
      document.querySelectorAll('.variant-btn[data-type="' + type + '"]').forEach(function(b) {
        b.classList.remove('active');
      });
      btn.classList.add('active');
      if (type === 'size') selectedSize = btn.textContent.trim();
      if (type === 'color') {
        selectedColor = btn.textContent.trim();
        var img = colorImages[selectedColor];
        if (img) {
          var mainImg = document.getElementById('mainProductImg');
          if (mainImg) mainImg.src = img;
        }
      }
    }

    // ── Quantity ──────────────────────────────────────────────────────────────
    function changeQty(delta) {
      qty = Math.max(1, qty + delta);
      var el = document.getElementById('qtyVal');
      if (el) el.textContent = qty;
    }

    // ── Add to Cart ───────────────────────────────────────────────────────────
    function addToCart() {
      var nameEl = document.querySelector('.product-info h1');
      var priceEl = document.querySelector('.price-current');
      var product = {
        name: nameEl ? nameEl.textContent : 'Product',
        price: priceEl ? parseFloat(priceEl.textContent.replace(/[^0-9.]/g, '')) || 0 : 0,
        qty: qty,
        size: selectedSize,
        color: selectedColor,
        id: Date.now()
      };
      cart.push(product);
      try { localStorage.setItem('maj_cart', JSON.stringify(cart)); } catch(e) {}
      updateCartCount();
      var btn = document.querySelector('.add-btn');
      if (btn) {
        btn.textContent = '✓ Added to Cart!';
        btn.style.background = '#16a34a';
        setTimeout(function() { btn.textContent = 'Add to Cart'; btn.style.background = ''; }, 2000);
      }
    }

    function buyNow() { addToCart(); showCart(); }

    // ── Cart Count ────────────────────────────────────────────────────────────
    function updateCartCount() {
      var total = cart.reduce(function(s, i) { return s + i.qty; }, 0);
      var el = document.getElementById('cartCount');
      if (el) el.textContent = total > 0 ? String(total) : '';
    }

    // ── Cart Modal ────────────────────────────────────────────────────────────
    function showCart() {
      var modal = document.getElementById('cartModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'cartModal';
        modal.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:flex-start;justify-content:flex-end;padding:0';
        document.body.appendChild(modal);
      }
      var total = cart.reduce(function(s, i) { return s + (i.price * i.qty); }, 0).toFixed(2);
      var itemsHtml = cart.length === 0
        ? '<p style="color:#999;text-align:center;padding:40px 0">Your cart is empty</p>'
        : cart.map(function(item, i) {
            return '<div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f0f0f0">'
              + '<div><div style="font-weight:600;font-size:14px">' + item.name + '</div>'
              + (item.size ? '<div style="font-size:12px;color:#888">Size: ' + item.size + '</div>' : '')
              + (item.color ? '<div style="font-size:12px;color:#888">Colour: ' + item.color + '</div>' : '')
              + '<div style="font-size:12px;color:#888">Qty: ' + item.qty + '</div></div>'
              + '<div style="font-weight:700">$' + (item.price * item.qty).toFixed(2) + '</div></div>';
          }).join('');
      modal.innerHTML = '<div style="background:rgba(0,0,0,0.5);position:fixed;inset:0;" onclick="closeCart()"></div>'
        + '<div style="background:#fff;width:380px;height:100vh;overflow-y:auto;position:relative;z-index:1;padding:24px;box-shadow:-4px 0 24px rgba(0,0,0,0.15)">'
        + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">'
        + '<h2 style="font-size:20px;font-weight:800">Your Cart (' + cart.length + ')</h2>'
        + '<button onclick="closeCart()" style="background:none;border:none;font-size:24px;cursor:pointer">×</button></div>'
        + itemsHtml
        + (cart.length > 0
          ? '<div style="margin-top:20px;padding-top:16px;border-top:2px solid #f0f0f0">'
            + '<div style="display:flex;justify-content:space-between;font-size:18px;font-weight:800;margin-bottom:16px"><span>Total</span><span>$' + total + ' AUD</span></div>'
            + '<button onclick="alert(\'This is a preview store. Connect Shopify to enable real checkout.\')" style="width:100%;background:var(--primary);color:#fff;border:none;padding:16px;border-radius:10px;font-size:16px;font-weight:800;cursor:pointer">Checkout →</button>'
            + '<button onclick="closeCart()" style="width:100%;background:transparent;border:1px solid #ddd;color:#555;padding:12px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;margin-top:8px">Continue Shopping</button>'
            + '</div>'
          : '')
        + '</div>';
    }

    function closeCart() {
      var modal = document.getElementById('cartModal');
      if (modal) modal.remove();
    }

    // ── Size Guide Modal ──────────────────────────────────────────────────────
    function showSizeGuide() {
      if (!sizeChartImg || sizeChartImg === 'null' || sizeChartImg === '{sizeChartImage}') {
        alert('Size Guide: XS≈6, S≈8-10, M≈12, L≈14, XL≈16 (approximate AU sizing)');
        return;
      }
      var modal = document.createElement('div');
      modal.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.8)';
      modal.innerHTML = '<div style="max-width:600px;width:90%;background:#fff;border-radius:16px;padding:24px;position:relative">'
        + '<button onclick="this.closest(\'[style*=fixed]\').remove()" style="position:absolute;top:12px;right:12px;background:none;border:none;font-size:22px;cursor:pointer">×</button>'
        + '<h3 style="font-size:18px;font-weight:800;margin-bottom:16px">Size Guide</h3>'
        + '<img src="' + sizeChartImg + '" style="width:100%;border-radius:8px" onerror="this.parentElement.innerHTML=\'<p style=padding:20px>Size guide not available</p>\'" /></div>';
      document.body.appendChild(modal);
      modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });
    }

    // ── Assign data-type to variant buttons on load ───────────────────────────
    document.querySelectorAll('.variant-btn').forEach(function(btn) {
      var row = btn.closest('.variant-row');
      var label = row ? (row.querySelector('.variant-label') ? row.querySelector('.variant-label').textContent.toLowerCase() : '') : '';
      btn.setAttribute('data-type', label.indexOf('size') !== -1 ? 'size' : 'color');
    });
    // Init default selections
    var firstSize = document.querySelector('.variant-btn[data-type="size"]');
    if (firstSize) selectedSize = firstSize.textContent.trim();
    var firstColor = document.querySelector('.variant-btn[data-type="color"]');
    if (firstColor) selectedColor = firstColor.textContent.trim();

    // ── Countdown Timer ───────────────────────────────────────────────────────
    (function() {
      var s = 3600 * 4 + 1800;
      var el = document.getElementById('countdown');
      if (!el) return;
      setInterval(function() {
        if (s <= 0) return;
        s--;
        var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sc = s % 60;
        el.textContent = h + ':' + (m<10?'0':'') + m + ':' + (sc<10?'0':'') + sc;
      }, 1000);
    })();

    // ── FAQ Accordion ─────────────────────────────────────────────────────────
    document.querySelectorAll('.faq-q').forEach(function(q) {
      q.addEventListener('click', function() {
        var ans = q.nextElementSibling;
        var arrow = q.querySelector('.faq-arrow');
        if (ans) ans.classList.toggle('open');
        if (arrow) arrow.style.transform = ans && ans.classList.contains('open') ? 'rotate(45deg)' : '';
      });
    });

    // ── Smooth Scroll ─────────────────────────────────────────────────────────
    document.querySelectorAll('a[href^="#"]').forEach(function(a) {
      a.addEventListener('click', function(e) {
        e.preventDefault();
        var target = document.querySelector(a.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    });

    updateCartCount();
  </script>
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

// ── Category hero images (fallback only when no product images) ───────────────
const CATEGORY_HERO_IMAGES: Record<string, string> = {
  fitness:    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1400&q=80',
  athletic:   'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1400&q=80',
  streetwear: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1400&q=80',
  fashion:    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1400&q=80',
  health:     'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=1400&q=80',
  beauty:     'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=1400&q=80',
  pet:        'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1400&q=80',
  tech:       'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1400&q=80',
  home:       'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1400&q=80',
  outdoor:    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1400&q=80',
  baby:       'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=1400&q=80',
};

function pickCategoryFallbackImage(niche: string): string {
  const n = niche.toLowerCase();
  const map: [string[], string][] = [
    [['gym', 'fit', 'sport', 'workout', 'athletic', 'train'], CATEGORY_HERO_IMAGES.fitness],
    [['wear', 'cloth', 'street', 'fashion', 'apparel', 'garment'], CATEGORY_HERO_IMAGES.streetwear],
    [['beauty', 'skin', 'hair', 'makeup', 'cosmetic'], CATEGORY_HERO_IMAGES.beauty],
    [['health', 'supplement', 'vitamin', 'wellness'], CATEGORY_HERO_IMAGES.health],
    [['pet', 'dog', 'cat', 'animal'], CATEGORY_HERO_IMAGES.pet],
    [['tech', 'gadget', 'electronic', 'smart', 'device'], CATEGORY_HERO_IMAGES.tech],
    [['home', 'kitchen', 'decor', 'furniture'], CATEGORY_HERO_IMAGES.home],
    [['outdoor', 'camping', 'hiking', 'adventure'], CATEGORY_HERO_IMAGES.outdoor],
    [['baby', 'kid', 'child', 'infant', 'toddler'], CATEGORY_HERO_IMAGES.baby],
  ];
  for (const [keywords, img] of map) {
    if (keywords.some(k => n.includes(k))) return img;
  }
  return 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1400&q=80';
}

// ── Build Store Preview HTML ──────────────────────────────────────────────────
// ── Premium Template Builder — uses the WEBSITE_TEMPLATES (DTC Minimal / Dropship Bold / Premium Brand) ──
function buildPremiumStore(templateId: string, data: GeneratedData, productData?: Record<string, any>): string {
  const tpl = WEBSITE_TEMPLATES.find((t) => t.id === templateId) || WEBSITE_TEMPLATES[0];
  const storeName = data.storeName || (productData?.brand_name as string) || 'My Store';
  const brandSlug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
  const primaryColor = data.primaryColor || tpl.palette.accent;
  const headline = data.headline || (productData?.hero_headline as string) || 'Built for Australia';
  const subheadline = data.subheadline || (productData?.hero_subheading as string) || 'Quality products delivered to your door.';
  const niche = (productData?.product_type as string) || data.heroImageKeyword || 'lifestyle';
  const price = (productData?.price as number) ? `$${productData!.price}` : '$49.95';
  const productName = (productData?.product_title as string) || storeName;
  const productDesc = (data.features && data.features.length > 0)
    ? (typeof data.features[0] === 'string' ? data.features[0] : (data.features[0] as any).description)
    : 'Premium quality product built for Australian customers.';
  const brandStory = data.brandStory || data.about_section || `${storeName} was born from a desire to bring the best ${niche} products to Australians. We're passionate about quality, fast delivery, and genuine customer service.`;
  const testimonials = data.testimonials && data.testimonials.length >= 3
    ? data.testimonials
    : [
        { text: 'Fast shipping and brilliant quality. Exactly what I needed — will definitely order again!', name: 'Jordan K.' },
        { text: 'Arrived quickly from the AU warehouse. Great value and the product is top notch.', name: 'Sarah M.' },
        { text: 'Finally a brand that delivers on its promises. Highly recommend to any Aussie.', name: 'Emma T.' },
      ];

  const featureIcons = ['⚡', '🎯', '✨', '🛡️', '🚀'];
  const featuresHtml = (data.features || []).slice(0, 3).map((f, i) => {
    const title = typeof f === 'string' ? f : f.title;
    const desc = typeof f === 'string' ? 'Quality crafted for Australian customers.' : (f as any).description;
    return `<div class="fc"><div class="fn">${featureIcons[i] || '✓'}</div><h3>${title}</h3><p>${desc}</p></div>`;
  }).join('') || `<div class="fc"><div class="fn">⚡</div><h3>Fast AU Delivery</h3><p>Ships from AU warehouse. Arrives in 3-7 business days.</p></div><div class="fc"><div class="fn">🛡️</div><h3>30-Day Returns</h3><p>Not happy? Full refund, no questions asked.</p></div><div class="fc"><div class="fn">💎</div><h3>Premium Quality</h3><p>Built to last, designed for Australian standards.</p></div>`;

  let html = tpl.html;
  html = html.replace(/{BRAND_NAME}/g, storeName);
  html = html.replace(/{BRAND_COLOR}/g, primaryColor);
  html = html.replace(/{BRAND_SLUG}/g, brandSlug);
  html = html.replace(/{PRODUCT_NAME}/g, productName);
  html = html.replace(/{NICHE}/g, niche);
  html = html.replace(/{TAGLINE}/g, data.tagline || `Premium ${niche} for Australians`);
  html = html.replace(/{PRICE}/g, price);
  html = html.replace(/{HEADLINE}/g, headline);
  html = html.replace(/{SUBHEADLINE}/g, subheadline);
  html = html.replace(/{PRODUCT_DESC}/g, productDesc);
  html = html.replace(/{CTA_TEXT}/g, data.cta_primary || 'Shop Now — Free AU Shipping');
  html = html.replace(/{BRAND_STORY}/g, brandStory);
  html = html.replace(/{TESTIMONIAL_1}/g, testimonials[0]?.text || '');
  html = html.replace(/{TESTIMONIAL_2}/g, testimonials[1]?.text || '');
  html = html.replace(/{TESTIMONIAL_3}/g, testimonials[2]?.text || '');
  html = html.replace(/{FEATURES_HTML}/g, featuresHtml);
  return html;
}

function buildStorePreview(data: GeneratedData, productData?: Record<string, any>): string {
  const primaryColor = data.primaryColor || '#d4af37';
  const featureIcons = ['⚡', '🎯', '✨', '🛡️', '🚀', '💎'];

  // ── Images: prefer real product photos over Unsplash ─────────────────────
  const productImages: string[] = (productData?.product_images as string[]) || [];
  const heroImageRaw: string = (productData?.hero_image as string) || productImages[0] || '';
  const productImageSrc: string = productImages[0] || heroImageRaw || 'https://placehold.co/600x500/f3f4f6/94a3b8?text=Product+Image';
  // Hero bg: use real product photo (2nd if available for variety) or fall back to category Unsplash
  const heroBgImage: string = productImages[1] || heroImageRaw || pickCategoryFallbackImage(
    (productData?.category as string) || (productData?.product_type as string) || data.heroImageKeyword || ''
  );

  // ── Sizes HTML ────────────────────────────────────────────────────────────
  const sizes: string[] = (productData?.sizes as string[]) || [];
  const sizeChartImage: string = (productData?.size_chart_image as string) || '';
  const sizesHtml = sizes.length > 0 ? `
  <div class="variant-row">
    <span class="variant-label">Size: ${sizeChartImage ? '<button class="size-guide-link" onclick="showSizeGuide()">Size Guide</button>' : ''}</span>
    <div class="variant-options">
      ${sizes.map((s, i) => `<button class="variant-btn${i === 0 ? ' active' : ''}" data-type="size" onclick="selectVariant(this,'size')">${s}</button>`).join('')}
    </div>
  </div>` : '';

  // ── Colors HTML ───────────────────────────────────────────────────────────
  const colors: string[] = (productData?.colors as string[]) || [];
  const colorsHtml = colors.length > 0 ? `
  <div class="variant-row">
    <span class="variant-label">Colour:</span>
    <div class="variant-options">
      ${colors.map((c, i) => `<button class="variant-btn${i === 0 ? ' active' : ''}" data-type="color" onclick="selectVariant(this,'color')">${c}</button>`).join('')}
    </div>
  </div>` : '';

  // ── Color variant image map ───────────────────────────────────────────────
  const colorVariantMap: Record<string, string> = {};
  const cvImages = (productData?.color_variant_images as {color: string; image_url: string}[]) || [];
  for (const cv of cvImages) {
    if (cv.color && cv.image_url) colorVariantMap[cv.color] = cv.image_url;
  }
  const colorVariantMapJson = JSON.stringify(colorVariantMap);

  // ── Features / benefits (use key_features from productData if available) ──
  const featuresHtml = (data.features || []).slice(0, 3).map((f, i) => {
    const title = typeof f === 'string' ? f : f.title;
    const description = typeof f === 'string'
      ? 'Quality product for Australian customers.'
      : f.description;
    return `<div class="feature-card"><div class="feature-icon">${featureIcons[i] || '✓'}</div><h3>${title}</h3><p>${description}</p></div>`;
  }).join('');

  const keyFeatures = (productData?.key_features as string[]) || [];
  const benefits = keyFeatures.length > 0
    ? keyFeatures
    : data.productBenefits || (data.features || []).slice(0, 5).map(featureToStr);
  const benefitsHtml = benefits.slice(0, 6).map(b => `<li>${b}</li>`).join('');

  const testimonials = data.testimonials || [];
  const testimonialsHtml = testimonials.length > 0
    ? testimonials.map(t => `<div class="testimonial-card"><div class="t-stars">★★★★★</div><blockquote>"${t.text}"</blockquote><div class="t-name">${t.name}</div><div class="t-loc">${t.location}, Australia</div></div>`).join('')
    : `<div class="testimonial-card"><div class="t-stars">★★★★★</div><blockquote>"Fast shipping and brilliant quality. Exactly what I needed — will definitely order again!"</blockquote><div class="t-name">Jordan K.</div><div class="t-loc">Brisbane, Australia</div></div><div class="testimonial-card"><div class="t-stars">★★★★★</div><blockquote>"Arrived quickly from the AU warehouse. Great value and the product is top notch."</blockquote><div class="t-name">Sarah M.</div><div class="t-loc">Sydney, Australia</div></div><div class="testimonial-card"><div class="t-stars">★★★★★</div><blockquote>"Finally a brand that delivers on its promises. Highly recommend to any Aussie."</blockquote><div class="t-name">Marcus T.</div><div class="t-loc">Melbourne, Australia</div></div>`;

  const faqs = data.faqs || [];
  const faqsHtml = faqs.length > 0
    ? faqs.map(f => `<div class="faq-item"><div class="faq-q">${f.question}<span class="faq-arrow">+</span></div><div class="faq-a"><p>${f.answer}</p></div></div>`).join('')
    : `<div class="faq-item"><div class="faq-q">Do you ship to all of Australia?<span class="faq-arrow">+</span></div><div class="faq-a"><p>Yes! We ship Australia-wide via Australia Post. Free shipping on orders over $79.</p></div></div><div class="faq-item"><div class="faq-q">How long does delivery take?<span class="faq-arrow">+</span></div><div class="faq-a"><p>Typically 3-7 business days for metro areas, 5-10 business days for regional Australia.</p></div></div><div class="faq-item"><div class="faq-q">What is your return policy?<span class="faq-arrow">+</span></div><div class="faq-a"><p>30-day hassle-free returns as per Australian Consumer Law. If you're not happy, we'll sort it — no questions asked.</p></div></div><div class="faq-item"><div class="faq-q">Is this product compatible with Australian standards?<span class="faq-arrow">+</span></div><div class="faq-a"><p>Yes — all our products meet Australian safety standards and electrical compliance (where applicable). We import only AU-certified products.</p></div></div>`;

  const storeName = data.storeName || 'My Store';
  const storeNameSlug = storeName.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Use AI-extracted headline/subheadline from product analysis if AI didn't write one
  const headline = data.headline || (productData?.hero_headline as string) || 'Built for Australia';
  const subheadline = data.subheadline || (productData?.hero_subheading as string) || 'Quality products delivered to your door.';

  let html = PREVIEW_TEMPLATE;
  html = html.replace(/{storeName}/g, storeName);
  html = html.replace(/{storeNameSlug}/g, storeNameSlug);
  html = html.replace(/{tagline}/g, data.tagline || 'Quality products for Australians');
  html = html.replace(/{headline}/g, headline);
  html = html.replace(/{subheadline}/g, subheadline);
  html = html.replace(/{metaDescription}/g, data.metaDescription || data.meta_description || `${storeName} — premium Australian products with free shipping and 30-day returns.`);
  html = html.replace(/{ctaText}/g, data.ctaText || data.cta_primary || 'Shop Now');
  html = html.replace(/{brandStory}/g, data.brandStory || data.about_section || 'An Australian brand built on quality, value, and exceptional service.');
  html = html.replace(/{primaryColor}/g, primaryColor);
  html = html.replace('{heroBgImage}', heroBgImage);
  html = html.replace('{productImage}', productImageSrc);
  html = html.replace('{SIZES_HTML}', sizesHtml);
  html = html.replace('{COLORS_HTML}', colorsHtml);
  html = html.replace('{COLOR_VARIANT_MAP_JSON}', colorVariantMapJson);
  html = html.replace('{sizeChartImage}', sizeChartImage || 'null');
  html = html.replace('{FEATURES_HTML}', featuresHtml);
  html = html.replace('{BENEFITS_HTML}', benefitsHtml);
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

// ── Feature Constants ─────────────────────────────────────────────────────────
const QUICK_THEMES = {
  dark:  { bg: '#08080f', surface: '#0f1018', text: '#f2efe9', accent: null as string | null },
  light: { bg: '#ffffff', surface: '#f8f8f6', text: '#111111', accent: null as string | null },
  bold:  { bg: '#000000', surface: '#111111', text: '#ffffff', accent: null as string | null },
  muted: { bg: '#f5f2ec', surface: '#ece9e2', text: '#2c2c2c', accent: '#8b7355' },
} as const;

const DEVICE_WIDTHS = { desktop: '100%', tablet: '768px', mobile: '375px' } as const;

const GEN_STEPS = [
  { threshold: 5, label: 'Finding the perfect images...' },
  { threshold: 10, label: 'Building your brand brief...' },
  { threshold: 25, label: 'Crafting your brand story...' },
  { threshold: 30, label: 'Your store is being written...' },
  { threshold: 75, label: 'Sections coming together...' },
  { threshold: 90, label: 'Applying your design...' },
  { threshold: 98, label: 'Wiring everything up...' },
  { threshold: 100, label: 'Your store is ready!' },
];

interface SiteHistoryItem {
  id: string;
  storeName: string;
  niche: string;
  direction: string;
  timestamp: number;
  html: string;
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
  const [fromDatabaseBanner, setFromDatabaseBanner] = useState<{
    productName: string;
    niche: string;
    price: string;
  } | null>(null);
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
  const [manualFallback, setManualFallback] = useState<{
    platform: string;
    message: string;
    tip: string;
    productId: string | null;
  } | null>(null);

  // Form fields
  const [storeName, setStoreName] = useState('');
  const [niche, setNiche] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [tagline, setTagline] = useState('');
  const [priceAUD, setPriceAUD] = useState('');
  const [vibe, setVibe] = useState('premium');
  const [accentColor, setAccentColor] = useState('#d4af37');
  const [designDirection, setDesignDirection] = useState<string>('default');
  const [storeManifest, setStoreManifest] = useState<string | null>(null);
  const [platform, setPlatform] = useState<Platform>('shopify');

  // Palette generator
  const [palette, setPalette] = useState<{ primary: string; secondary: string; accent: string; background: string; surface: string; text: string; muted: string; swatches: string[]; rationale?: string } | null>(null);
  const [paletteLoading, setPaletteLoading] = useState(false);

  // Description enhancer
  const [rawDesc, setRawDesc] = useState('');
  const [descVariants, setDescVariants] = useState<{ benefit: string; story: string; urgency: string } | null>(null);
  const [selectedDesc, setSelectedDesc] = useState<string>('');
  const [enhancingDesc, setEnhancingDesc] = useState(false);

  // Template selection
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [premiumTemplateId, setPremiumTemplateId] = useState<string>(WEBSITE_TEMPLATES[0].id);

  // Output
  const [generating, setGenerating] = useState(false);
  const generatingRef = useRef(false);
  const genTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeReaderRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
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

  // ── Vercel Deploy State ───────────────────────────────────────────────────
  const [vercelDeploying, setVercelDeploying] = useState(false);
  const [vercelResult, setVercelResult] = useState<{ url: string; deployId: string } | null>(null);
  const [vercelError, setVercelError] = useState('');

  // ── Product URL Analyzer State ────────────────────────────────────────────
  const [analyzeUrl, setAnalyzeUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  // Rich product data from Firecrawl + Claude — includes images, sizes, colors, copy
  const [analysisResult, setAnalysisResult] = useState<Record<string, any> | null>(null);
  const [directHtml, setDirectHtml] = useState<string | null>(null);
  const [analyzeError, setAnalyzeError] = useState('');

  // B3 — Headline variants
  const [headlines, setHeadlines] = useState<{painPoint:string;benefit:string;socialProof:string}|null>(null);
  // B4 — Theme switcher
  const [activeTheme, setActiveTheme] = useState<string>('dark');
  // C1 — Progress checklist
  const [progressSteps, setProgressSteps] = useState<{label:string;done:boolean}[]>([]);
  const [genStartTime, setGenStartTime] = useState(0);
  const [eta, setEta] = useState(90);
  // C2 — Device preview
  const [previewDevice, setPreviewDevice] = useState<'desktop'|'tablet'|'mobile'>('desktop');
  const [editMode, setEditMode] = useState(false);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  // C3 — Site history
  const [siteHistory, setSiteHistory] = useState<SiteHistoryItem[]>([]);
  // genStartRef for stale-closure-safe elapsed time
  const genStartRef = useRef(0);
  // Quick-start templates toggle
  const [quickStartOpen, setQuickStartOpen] = useState(false);

  // Task 1 — Live preview
  const [livePreviewNiche, setLivePreviewNiche] = useState('');
  const [livePreviewStoreName, setLivePreviewStoreName] = useState('');
  const livePreviewNicheTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const livePreviewStoreNameTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Task 8 — Mobile responsive
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Task 2 — Template auto-suggest
  const [userPickedTemplate, setUserPickedTemplate] = useState(false);
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);
  const lastAutoMatchedNiche = useRef('');

  // Task 3 — Import auto-fill tracking
  const [importAutoFilledStore, setImportAutoFilledStore] = useState(false);
  const [importAutoFilledNiche, setImportAutoFilledNiche] = useState(false);

  // Task 4 — Shopify connect
  const [shopifyConnected, setShopifyConnected] = useState(false);
  const [shopifyShop, setShopifyShop] = useState('');
  const [shopifyPushing, setShopifyPushing] = useState(false);
  const [shopifyPushResult, setShopifyPushResult] = useState<Record<string, any> | null>(null);
  const [shopifyDomainInput, setShopifyDomainInput] = useState('');
  const [showShopifyInput, setShowShopifyInput] = useState(false);

  // Task 5 — Elapsed timer
  const [elapsedMs, setElapsedMs] = useState(0);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Task 7 — Store history (Supabase)
  const [savedStoreId, setSavedStoreId] = useState<string | null>(null);

  // Task 2C — Auto-suggest template based on niche
  const NICHE_TEMPLATE_MAP: Record<string, string> = {
    beauty: 'bloom-beauty', skincare: 'bloom-beauty', cosmetics: 'bloom-beauty',
    fashion: 'gc-fashion', clothing: 'gc-fashion', apparel: 'gc-fashion', streetwear: 'gc-fashion',
    tech: 'tech-mono', gadgets: 'tech-mono', electronics: 'tech-mono',
    outdoor: 'coastal-au', lifestyle: 'coastal-au', sport: 'coastal-au', pets: 'coastal-au',
    luxury: 'premium-brand', premium: 'premium-brand', jewellery: 'premium-brand',
  };
  useEffect(() => {
    if (!niche.trim() || generating || userPickedTemplate) return;
    const lower = niche.toLowerCase();
    let matchedId = '';
    for (const [key, templateId] of Object.entries(NICHE_TEMPLATE_MAP)) {
      if (lower.includes(key)) { matchedId = templateId; break; }
    }
    if (matchedId && matchedId !== premiumTemplateId && lastAutoMatchedNiche.current !== niche) {
      setPremiumTemplateId(matchedId);
      lastAutoMatchedNiche.current = niche;
      toast.success('Template auto-matched to your niche');
    }
  }, [niche, generating, userPickedTemplate, premiumTemplateId]);

  // Task 4B — Check Shopify connection on mount
  useEffect(() => {
    if (!session?.access_token) return;
    fetch('/api/shopify/status', { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then(r => r.json())
      .then((d: any) => { if (d.connected) { setShopifyConnected(true); setShopifyShop(d.shop || ''); } })
      .catch(() => {});
  }, [session]);

  // Task 4C — Handle OAuth return (?shopify_connected=true)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('shopify_connected') === 'true') {
      setShopifyConnected(true);
      toast.success('Shopify store connected!');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Task 5 — Elapsed timer while generating
  useEffect(() => {
    if (generating) {
      setElapsedMs(0);
      elapsedTimerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - genStartRef.current);
      }, 1000);
    } else {
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    }
    return () => { if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current); };
  }, [generating]);

  // Debounced auto-analyze on URL paste (1s debounce)
  useEffect(() => {
    if (!analyzeUrl.trim() || analyzeUrl.length < 10) return;
    const timer = setTimeout(() => {
      handleAnalyzeProduct(analyzeUrl);
    }, 1000);
    return () => clearTimeout(timer);
  }, [analyzeUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── URL params — read ONCE via hook (parsed before URL is cleaned) ─────────
  const urlParams = useStoreBuilderParams();
  const hasAutoTriggered = useRef(false);

  // Auto-fill from URL params (crash-proof — handles encoded/raw values safely)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);

      // Helper: safe decode — returns '' on error
      const sd = (raw: string | null): string => {
        if (raw === null || raw.trim() === '') return '';
        try { return decodeURIComponent(raw); } catch { return raw; }
      };

      const nicheParam = sd(params.get('niche'));
      const demoParam = params.get('demo');

      if (nicheParam) setNiche(nicheParam);

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

      // fromDatabase or fromTrend — full product context pre-fill (Effect 1)
      if (urlParams.fromDatabase) {
        const { productName: pn, price: pr, niche: ni, imageUrl: img, description: desc } = urlParams;

        if (pn) setProductName(pn);
        if (pr) { setPriceAUD(String(pr)); setProductPrice(String(pr)); }
        if (ni) setNiche(ni);
        if (img) setProductImageUrl(img);

        // Auto-set store name from product name if not already set
        if (pn && (!storeName || storeName.trim() === '')) {
          setStoreName(pn.split(' ').slice(0, 3).join(' ') + ' AU');
        }

        if (desc) {
          setImportedProduct(prev => prev ? { ...prev, description: desc } : {
            title: pn,
            description: desc,
            features: [],
            price: String(pr),
            images: img ? [img] : [],
            sourceUrl: '',
          });
        }

        setFromDatabaseBanner({ productName: pn, niche: ni, price: String(pr) });
        toast.success(`⚡ Building store for: ${pn}`);
        window.history.replaceState({}, '', '/app/website-generator');
      }
    } catch (err) {
      console.warn('[WebsiteGenerator] Failed to read URL params:', err);
    }

    // Maya prefill — check sessionStorage for agentic navigation
    const mayaPrefill = sessionStorage.getItem('maya_prefill_website-generator');
    if (mayaPrefill) {
      try {
        const data = JSON.parse(mayaPrefill);
        if (data.productUrl) setAnalyzeUrl(data.productUrl);
        if (data.productTitle) setStoreName(data.productTitle);
        if (data.niche) setNiche(data.niche);
        if (data.price) setPriceAUD(String(data.price));
        sessionStorage.removeItem('maya_prefill_website-generator');
        if (data.productUrl) {
          setTimeout(() => handleAnalyzeProduct(data.productUrl), 800);
        }
      } catch {
        /* ignore malformed data */
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load site history from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('majorka_site_history') || '[]');
      setSiteHistory(saved);
    } catch { /* ignore */ }
  }, []);

  // EFFECT 2 — Auto-trigger generation once state has settled (fromDatabase flow)
  // Runs every time productName/niche/storeName update, but fires generation exactly once
  useEffect(() => {
    if (!urlParams.fromDatabase) return;
    if (hasAutoTriggered.current) return;
    if (!productName || !niche) return; // wait until state is settled

    hasAutoTriggered.current = true;

    // Small debounce to ensure all setState calls from Effect 1 have flushed
    const timer = setTimeout(() => {
      handleGenerateWithParamsRef.current?.({
        storeName: storeName || productName,
        productName,
        price: Number(priceAUD) || urlParams.price,
        niche,
        imageUrl: urlParams.imageUrl,
        description: urlParams.description,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [productName, niche, storeName, priceAUD, urlParams.fromDatabase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Progress message cycling
  useEffect(() => {
    if (!generating) { setProgressMsgIdx(0); return; }
    const interval = setInterval(() => {
      setProgressMsgIdx((i) => (i + 1) % PROGRESS_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [generating]);

  // Cmd+Enter keyboard shortcut — use ref so we don't depend on handleGenerate before it's declared
  const handleGenerateRef = useRef<(() => void) | null>(null);
  const handleGenerateWithParamsRef = useRef<((p: { storeName: string; productName: string; price: number; niche: string; imageUrl?: string; description?: string }) => void) | null>(null);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === 'Enter' && !generating && (storeName || niche)) {
        e.preventDefault();
        handleGenerateRef.current?.();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [generating, storeName, niche]);

  // Preview HTML (memoised) — passes productData so images/variants are injected
  const previewHTML = useMemo(() => {
    if (directHtml) return directHtml;
    if (!generatedData) return '';
    return buildPremiumStore(premiumTemplateId, generatedData, analysisResult || undefined);
  }, [generatedData, analysisResult, premiumTemplateId, directHtml]);

  const hasOutput = generatedData || rawResponse || directHtml;

  // Write HTML into preview iframe via doc.write so Google Fonts load correctly
  useEffect(() => {
    const html = previewHTML || directHtml || '';
    if (!html || !previewIframeRef.current) return;
    const iframe = previewIframeRef.current;
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return;
      doc.open();
      doc.write(html);
      doc.close();
    } catch { /* cross-origin guard */ }
  }, [previewHTML, directHtml]);

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
        if (errData.manual) {
          // Smart manual fallback — show amber helper, not red error
          setImportError('');
          setManualFallback({
            platform: errData.platform || 'This site',
            message: errData.message || `${errData.platform || 'This site'} blocks automated import. Enter details below.`,
            tip: errData.tip || 'Copy the product name and price and paste below.',
            productId: errData.productId || null,
          });
          setImporting(false);
          setTimeout(() => {
            const input = document.querySelector<HTMLInputElement>('input[placeholder*="product" i], input[name="productName"], input[data-field="productName"]');
            if (input) input.focus();
          }, 200);
          return;
        }
        throw new Error(errData.error || `Scrape failed: ${response.status}`);
      }
      const data = (await response.json()) as { productTitle: string; description: string; bulletPoints: string[]; price: string; imageUrls: string[]; brand?: string; extractionError?: string; };
      // Handle manual fallback returned with 200 status
      if ((data as any).manual) {
        const d = data as any;
        setImportError('');
        setManualFallback({
          platform: d.platform || 'This site',
          message: d.message || 'Could not auto-import. Enter details below.',
          tip: d.tip || 'Copy the product details and paste below.',
          productId: d.productId || null,
        });
        setImporting(false);
        return;
      }
      // Handle ZenRows/mobile-fetch success path (different field names from direct scrape)
      if ((data as any).productName) {
        const d = data as any;
        const finalTitle = cleanProductTitle(d.productName || 'Imported Product');
        setImportedProduct({
          title: finalTitle,
          description: d.description || '',
          features: [],
          price: String(d.price || ''),
          images: d.imageUrl ? [d.imageUrl] : [],
          sourceUrl: importUrl,
        });
        setManualFallback(null);
        if (!storeName.trim()) {
          setStoreName(finalTitle.split(' ').slice(0, 2).join(' ') + ' AU');
        }
        if (d.niche && !niche) setNiche(d.niche);
        setImporting(false);
        toast.success('Product imported — ready to generate');
        return;
      }
      if (data.extractionError) throw new Error(data.extractionError);
      const finalTitle = cleanProductTitle(data.productTitle || 'Imported Product');
      setImportedProduct({ title: finalTitle, description: data.description, features: data.bulletPoints, price: data.price, images: data.imageUrls, sourceUrl: importUrl });
      setManualFallback(null);
      // Task 3B — Auto-fill store name
      setImportAutoFilledStore(false);
      setImportAutoFilledNiche(false);
      if (!storeName.trim()) {
        const suggested = data.brand
          ? `${data.brand} AU`
          : finalTitle.split(' ').slice(0, 2).join(' ') + ' AU';
        setStoreName(suggested.slice(0, 40));
        setImportAutoFilledStore(true);
      }
      // Task 3B — Auto-detect niche
      if (!niche.trim()) {
        const productText = (finalTitle + ' ' + (data.description || '')).toLowerCase();
        const nicheDetect: [string, string][] = [
          ['skincare|moisturiser|serum|cleanser|toner', 'Skincare'],
          ['supplement|protein|vitamin|collagen|probiotic', 'Health Supplements'],
          ['gym|workout|fitness|leggings|activewear', 'Fitness'],
          ['pet|dog|cat|puppy|paw', 'Pet Accessories'],
          ['tech|gadget|usb|wireless|bluetooth|charger', 'Tech Gadgets'],
          ['home|kitchen|organis|storage|decor', 'Home & Living'],
          ['fashion|dress|shirt|shoes|bag|jewel', 'Fashion'],
          ['baby|toddler|infant|kid|child', 'Baby & Kids'],
          ['coffee|tea|brew|pour|espresso', 'Coffee & Tea'],
          ['outdoor|hiking|camping|trail|adventure', 'Outdoor & Adventure'],
        ];
        for (const [pattern, detected] of nicheDetect) {
          if (new RegExp(pattern).test(productText)) {
            setNiche(detected);
            setImportAutoFilledNiche(true);
            break;
          }
        }
      }
      toast.success(`Imported: ${finalTitle}${data.price ? ` · $${data.price} AUD` : ''}`);
    } catch (err: any) {
      setImportError(err?.message || 'Could not import. Try a different URL or fill in details manually.');
    } finally {
      setImporting(false);
    }
  }, [importUrl, storeName, niche]);

  // Task 4D — Push to Shopify
  const handleShopifyPush = useCallback(async () => {
    if (!shopifyConnected || !directHtml) return;
    setShopifyPushing(true);
    try {
      const res = await fetch('/api/store-builder/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({
          brief: {
            brandName: storeName || (storeManifest ? JSON.parse(storeManifest)?.brand_name : undefined) || 'My Store',
            heroHeadline: storeName,
            tagline: tagline || niche,
            uniqueValueProp: niche,
            colourPalette: { primary: accentColor },
          },
          selectedStoreName: storeName || 'My Store',
        }),
      });
      const data = await res.json();
      setShopifyPushResult(data);
      if (data.success) toast.success('Store pushed to Shopify!');
      else toast.error('Push completed with some errors');
    } catch (e: any) {
      toast.error('Shopify push failed: ' + e.message);
    } finally {
      setShopifyPushing(false);
    }
  }, [shopifyConnected, directHtml, session, storeName, tagline, niche, accentColor, storeManifest]);

  const killGeneration = useCallback(() => {
    // Cancel in-flight stream reader
    try { activeReaderRef.current?.cancel(); } catch {}
    activeReaderRef.current = null;
    // Clear timeout
    if (genTimeoutRef.current) { clearTimeout(genTimeoutRef.current); genTimeoutRef.current = null; }
    // Reset state
    generatingRef.current = false;
    setGenerating(false);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!niche.trim()) { toast.error('Please enter a niche first'); return; }
    // Hard double-fire guard
    if (generatingRef.current) {
      console.log('[generate] blocked — already in progress');
      return;
    }

    // Kill any leftover state first
    killGeneration();

    // Set generating
    generatingRef.current = true;
    setGenerating(true);
    setGenError('');
    setGenProgress(0);
    setParseWarning(false);
    setDirectHtml(null);
    setStoreManifest(null);
    setGenStartTime(Date.now());
    genStartRef.current = Date.now();
    setProgressSteps(GEN_STEPS.map(s => ({ label: s.label, done: false })));
    setEta(90);
    setHeadlines(null);

    // 90s hard timeout
    genTimeoutRef.current = setTimeout(() => {
      if (generatingRef.current) {
        killGeneration();
        setGenError('Generation timed out — please try again.');
        toast.error('Generation timed out — please try again');
      }
    }, 90_000);

    try {
      // ── Stream from /api/website/generate via SSE ─────────────────────
      const response = await fetch('/api/website/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          niche,
          storeName: storeName || niche,
          targetAudience: targetAudience || undefined,
          vibe: vibe || undefined,
          accentColor: accentColor || undefined,
          designDirection: designDirection !== 'default' ? designDirection : undefined,
          price: importedProduct?.price ? `$${importedProduct.price}` : undefined,
          productData: analysisResult
            ? { ...analysisResult, ...(selectedDesc ? { description: selectedDesc } : {}) }
            : (importedProduct ? {
                product_title: importedProduct.title || (importedProduct as any).name,
                description: selectedDesc || importedProduct.description,
                price_aud: importedProduct.price,
                category: (importedProduct as any).category || niche,
                hero_image: importedProduct.images?.[0] || productImageUrl || undefined,
                product_images: importedProduct.images?.length ? importedProduct.images : (productImageUrl ? [productImageUrl] : undefined),
              } : (selectedDesc ? { description: selectedDesc } : undefined)),
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as any).error || `Generation failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');
      activeReaderRef.current = reader;

      const decoder = new TextDecoder();
      let buffer = '';
      let finalHtml = '';

      while (true) {
        // Check if we were killed mid-stream
        if (!generatingRef.current) break;

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: progress')) continue;
          if (line.startsWith('data: ')) {
            try {
              const payload = JSON.parse(line.slice(6));
              if (payload.pct !== undefined) {
                setGenProgress(payload.pct);
                setProgressSteps(GEN_STEPS.map(s => ({ label: s.label, done: payload.pct >= s.threshold })));
                const elapsed = (Date.now() - genStartRef.current) / 1000;
                setEta(Math.max(0, Math.round(90 - elapsed)));
              }
              if (payload.html) finalHtml = payload.html;
              if (payload.manifest) setStoreManifest(payload.manifest);
              if (payload.error) throw new Error(payload.error);
            } catch (e: any) {
              if (e?.message && !e.message.includes('JSON')) throw e;
            }
          }
        }
      }

      activeReaderRef.current = null;
      if (!finalHtml) throw new Error('No HTML returned — please try again.');

      setGenProgress(100);
      setRawResponse(finalHtml);
      const minData: GeneratedData = {
        storeName: storeName || niche,
        headline: niche,
        features: [],
        primaryColor: accentColor || '#d4af37',
      };
      setGeneratedData(minData);
      setDirectHtml(finalHtml);
      setActiveTab('preview');
      toast.success('Store generated! 🎉');

      // Mark onboarding step
      markOnboardingStep('generated_store', session?.user?.id).catch(() => {});

      // B3 — Auto-fetch headline variants
      if (session?.access_token) {
        fetch('/api/website/headline-variants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ niche, storeName: storeName || niche, productData: analysisResult }),
        }).then(r => r.json()).then(data => {
          if (data.painPoint) setHeadlines(data);
        }).catch(() => {});
      }

      // Save to history
      const newItem: SiteHistoryItem = {
        id: Date.now().toString(),
        storeName: storeName || niche,
        niche,
        direction: designDirection || 'default',
        html: finalHtml,
        timestamp: Date.now(),
      };
      setSiteHistory(prev => {
        const next = [newItem, ...prev.filter(h => h.storeName !== newItem.storeName)].slice(0, 10);
        localStorage.setItem('majorka_site_history', JSON.stringify(next));
        return next;
      });

      // Task 7 — Save to Supabase generated_stores
      setSavedStoreId(null);
      if (session?.access_token) {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const sb = createClient(
            import.meta.env.VITE_SUPABASE_URL,
            import.meta.env.VITE_SUPABASE_ANON_KEY,
          );
          const { data: insertData } = await sb.from('generated_stores').insert({
            user_id: session.user?.id,
            store_name: storeName || storeManifest || niche,
            niche,
            template_id: premiumTemplateId,
            html_preview: finalHtml.slice(0, 5000),
            manifest: storeManifest ? JSON.parse(storeManifest) : null,
            created_at: new Date().toISOString(),
          }).select('id').single();
          if (insertData?.id) setSavedStoreId(insertData.id);
        } catch (e) {
          console.warn('[store-history] save failed:', e);
        }
      }

      trackWebsiteGenerated({ niche, platform, vibe, market: getStoredMarket() });
      localStorage.setItem('majorka_milestone_site', 'true');
    } catch (err: any) {
      if (!generatingRef.current) return; // Was killed — ignore error
      const msg = err?.message || 'Generation failed';
      const safe = msg.length < 200 && !msg.includes(' at ') ? msg : 'Generation failed — please try again.';
      setGenError(safe);
      toast.error(safe);
    } finally {
      killGeneration();
    }
  }, [niche, storeName, targetAudience, vibe, accentColor, designDirection, importedProduct, analysisResult, selectedDesc, session, killGeneration, platform, premiumTemplateId, storeManifest]);
  // Keep ref in sync so keyboard shortcut can call it without circular deps
  useEffect(() => { handleGenerateRef.current = handleGenerate; }, [handleGenerate]);

  // handleGenerateWithParams — accepts explicit values so auto-trigger doesn't read stale state
  const handleGenerateWithParams = useCallback(async (params: {
    storeName: string;
    productName: string;
    price: number;
    niche: string;
    imageUrl?: string;
    description?: string;
  }) => {
    if (!params.niche.trim()) { toast.error('Niche is required'); return; }
    if (generatingRef.current) return;

    killGeneration();
    generatingRef.current = true;
    setGenerating(true);
    setGenError('');
    setGenProgress(0);
    setParseWarning(false);
    setDirectHtml(null);
    setStoreManifest(null);
    setGenStartTime(Date.now());
    genStartRef.current = Date.now();
    setProgressSteps(GEN_STEPS.map(s => ({ label: s.label, done: false })));
    setEta(90);
    setHeadlines(null);

    genTimeoutRef.current = setTimeout(() => {
      if (generatingRef.current) {
        killGeneration();
        setGenError('Generation timed out — please try again.');
        toast.error('Generation timed out');
      }
    }, 90_000);

    try {
      const productData: Record<string, unknown> = {};
      if (params.description) productData.description = params.description;
      if (params.imageUrl) { productData.hero_image = params.imageUrl; productData.product_images = [params.imageUrl]; }
      if (params.productName) productData.product_title = params.productName;
      if (params.price) productData.price_aud = params.price;

      const response = await fetch('/api/website/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          niche: params.niche,
          storeName: params.storeName || params.productName,
          accentColor: accentColor || undefined,
          designDirection: designDirection !== 'default' ? designDirection : undefined,
          price: `$${params.price}`,
          productData: Object.keys(productData).length ? productData : undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as any).error || `Generation failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');
      activeReaderRef.current = reader;

      const decoder = new TextDecoder();
      let buffer = '';
      let finalHtml = '';

      while (true) {
        if (!generatingRef.current) break;
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: progress')) continue;
          if (line.startsWith('data: ')) {
            try {
              const payload = JSON.parse(line.slice(6));
              if (payload.pct !== undefined) {
                setGenProgress(payload.pct);
                setProgressSteps(GEN_STEPS.map(s => ({ label: s.label, done: payload.pct >= s.threshold })));
                if (payload.msg) toast(payload.msg, { id: 'gen-progress', duration: 2000 });
              }
              if (payload.html) {
                finalHtml = payload.html;
                setDirectHtml(payload.html);
                if (payload.manifest) setStoreManifest(payload.manifest);
                setGenProgress(100);
                setProgressSteps(GEN_STEPS.map(s => ({ label: s.label, done: true })));
                toast.success('🚀 Store generated!');
                const elapsed = ((Date.now() - genStartRef.current) / 1000).toFixed(1);
                console.log(`[gen] Done in ${elapsed}s — ${finalHtml.length} chars`);
              }
              if (payload.error) throw new Error(payload.error);
            } catch (parseErr) {
              if ((parseErr as Error).message?.startsWith('Generation failed') || (parseErr as Error).message?.startsWith('No ')) throw parseErr;
            }
          }
        }
      }
    } catch (err: any) {
      if (generatingRef.current) {
        setGenError(err.message || 'Generation failed');
        toast.error(err.message || 'Generation failed');
      }
    } finally {
      killGeneration();
    }
  }, [accentColor, designDirection, session, killGeneration]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep handleGenerateWithParams ref in sync for auto-trigger effect
  useEffect(() => { handleGenerateWithParamsRef.current = handleGenerateWithParams; }, [handleGenerateWithParams]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { killGeneration(); };
  }, [killGeneration]);

  // B4 — Theme switcher
  const applyTheme = useCallback((themeKey: string) => {
    if (!directHtml) return;
    const t = QUICK_THEMES[themeKey as keyof typeof QUICK_THEMES];
    let html = directHtml;
    html = html.replace(/(--bg\s*:\s*)[^;]+;/, '$1' + t.bg + ';');
    html = html.replace(/(--surface\s*:\s*)[^;]+;/, '$1' + t.surface + ';');
    html = html.replace(/(--text\s*:\s*)[^;]+;/, '$1' + t.text + ';');
    if (t.accent) html = html.replace(/(--accent\s*:\s*)[^;]+;/, '$1' + t.accent + ';');
    setDirectHtml(html);
    setActiveTheme(themeKey);
  }, [directHtml]);

  // B5 — Bundle download handler
  const handleDownloadFullBundle = useCallback(() => {
    if (!directHtml) return;
    const htmlBlob = new Blob([directHtml], { type: 'text/html' });
    const htmlA = document.createElement('a');
    htmlA.href = URL.createObjectURL(htmlBlob);
    htmlA.download = `${storeName || niche || 'store'}-store.html`;
    htmlA.click();
    if (storeManifest) {
      setTimeout(() => {
        const mBlob = new Blob([storeManifest], { type: 'application/json' });
        const mA = document.createElement('a');
        mA.href = URL.createObjectURL(mBlob);
        mA.download = 'manifest.json';
        mA.click();
      }, 500);
    }
    const readme = `# ${storeName || niche} Store\n\nGenerated by Majorka AI Store Builder\n\n## Files\n- index.html — Your complete store\n- manifest.json — PWA manifest (optional)\n\n## Deployment\n1. Netlify: Drag index.html to netlify.com/drop\n2. Vercel: vercel deploy --prebuilt\n3. GitHub Pages: push to /docs folder\n\n## Customisation\nOpen index.html in any text editor or Cursor AI.\n\nBuilt with Majorka — majorka.io`;
    setTimeout(() => {
      const rBlob = new Blob([readme], { type: 'text/markdown' });
      const rA = document.createElement('a');
      rA.href = URL.createObjectURL(rBlob);
      rA.download = 'README.md';
      rA.click();
    }, 1000);
    toast.success('Downloading 3 files...');
  }, [directHtml, storeManifest, storeName, niche]);

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
      zip.file('index.html', directHtml || buildPremiumStore(premiumTemplateId, generatedData, analysisResult || undefined));
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

  // ── Inline Editor ────────────────────────────────────────────────────────────
  const enableEditMode = useCallback((iframe: HTMLIFrameElement | null) => {
    if (!iframe?.contentDocument) return;
    const doc = iframe.contentDocument;
    if (!doc.getElementById('claw-edit-styles')) {
      const style = doc.createElement('style');
      style.id = 'claw-edit-styles';
      style.textContent = `
        .claw-editable { outline: 2px dashed rgba(212,175,55,0.45) !important; cursor: text !important; border-radius: 4px; }
        .claw-editable:hover { outline: 2px solid #d4af37 !important; background: rgba(212,175,55,0.06) !important; }
        .claw-editable:focus { outline: 2px solid #d4af37 !important; background: rgba(212,175,55,0.08) !important; box-shadow: 0 0 0 4px rgba(212,175,55,0.1); }
        .claw-img-wrap { position: relative !important; cursor: pointer !important; }
        .claw-img-wrap::after { content: "📷 Replace Image"; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.55); color: #d4af37; font-size: 14px; font-weight: 700; opacity: 0; transition: opacity 0.2s; pointer-events: none; font-family: sans-serif; border-radius: inherit; }
        .claw-img-wrap:hover::after { opacity: 1; }
        .claw-img-wrap img { pointer-events: none !important; }
      `;
      doc.head.appendChild(style);
    }
    const editSel = 'h1, h2, h3, h4, p, .hero-sub, .hero-badge, .btn-primary, .btn-secondary, .btn-cart, .btn-buy-now, .nav-logo, .nav-cta, .trust-strip span, .social-proof span, .product-price, .product-price-orig, .stock-warning, .feature-card h3, .feature-card p, .testimonial-quote, .testimonial-author, .testimonial-city, .footer-tagline, .faq-question span:first-child';
    try {
      doc.querySelectorAll<HTMLElement>(editSel).forEach(el => {
        if (el.querySelector('img')) return; // skip elements containing images
        el.contentEditable = 'true';
        el.classList.add('claw-editable');
        el.spellcheck = false;
      });
    } catch (_) { /* ignore selector errors */ }
    doc.querySelectorAll<HTMLImageElement>('img').forEach(img => {
      const wrap = img.parentElement as HTMLElement;
      if (!wrap || wrap.classList.contains('claw-img-wrap')) return;
      wrap.classList.add('claw-img-wrap');
      (wrap as HTMLElement).addEventListener('click', () => {
        const input = doc.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';
        doc.body.appendChild(input);
        input.onchange = () => {
          const file = input.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => { if (e.target?.result) img.src = e.target.result as string; };
            reader.readAsDataURL(file);
          }
          input.remove();
        };
        input.click();
      });
    });
  }, []);

  const disableEditMode = useCallback((iframe: HTMLIFrameElement | null) => {
    if (!iframe?.contentDocument) return;
    const doc = iframe.contentDocument;
    doc.getElementById('claw-edit-styles')?.remove();
    doc.querySelectorAll<HTMLElement>('.claw-editable').forEach(el => {
      el.removeAttribute('contenteditable');
      el.classList.remove('claw-editable');
    });
    doc.querySelectorAll<HTMLElement>('.claw-img-wrap').forEach(el => {
      el.classList.remove('claw-img-wrap');
    });
  }, []);

  const getEditedHtml = useCallback((): string => {
    const iframe = previewIframeRef.current;
    if (!iframe?.contentDocument) return directHtml || rawResponse || '';
    const doc = iframe.contentDocument;
    doc.getElementById('claw-edit-styles')?.remove();
    doc.querySelectorAll<HTMLElement>('.claw-editable').forEach(el => { el.removeAttribute('contenteditable'); el.classList.remove('claw-editable'); });
    doc.querySelectorAll<HTMLElement>('.claw-img-wrap').forEach(el => { el.classList.remove('claw-img-wrap'); });
    return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
  }, [directHtml, rawResponse]);

  const handleToggleEdit = useCallback(() => {
    const iframe = previewIframeRef.current;
    if (!editMode) {
      enableEditMode(iframe);
      setEditMode(true);
      toast.success('Edit mode ON — click any text to edit · click images to replace');
    } else {
      disableEditMode(iframe);
      setEditMode(false);
      toast('Edit mode off');
    }
  }, [editMode, enableEditMode, disableEditMode]);

  const handleSaveEdits = useCallback(() => {
    const html = getEditedHtml();
    setDirectHtml(html);
    setEditMode(false);
    toast.success('Changes saved!');
  }, [getEditedHtml]);
  // ─────────────────────────────────────────────────────────────────────────────

  const handleDownloadHTML = useCallback(() => {
    if (!generatedData) return;
    const html = directHtml || buildPremiumStore(premiumTemplateId, generatedData, analysisResult || undefined);
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

  // ── Vercel Deploy Handler ──────────────────────────────────────────────────
  const handleVercelDeploy = useCallback(async () => {
    if (!generatedData) return;
    setVercelDeploying(true);
    setVercelError('');
    setVercelResult(null);
    try {
      const html = directHtml || buildPremiumStore(premiumTemplateId, generatedData, analysisResult || undefined);
      const response = await fetch('/api/website/deploy-vercel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ html, storeName: storeName || generatedData.storeName || 'my-store' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Deployment failed');
      setVercelResult(data);
      toast.success('🚀 Store deployed to Vercel!');
    } catch (err: any) {
      setVercelError(err?.message || 'Deployment failed. Please try again.');
    } finally {
      setVercelDeploying(false);
    }
  }, [generatedData, storeName, session]);

  // ── Product Analyzer Handler ───────────────────────────────────────────────
  const handleAnalyzeProduct = useCallback(async (urlToAnalyze?: string) => {
    const url = urlToAnalyze || analyzeUrl;
    if (!url.trim()) return;
    setAnalyzing(true);
    setAnalyzeError('');
    setAnalysisResult(null);
    try {
      const response = await fetch('/api/website/analyze-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Analysis failed');
      setAnalysisResult(data);
    } catch (err: any) {
      setAnalyzeError(err?.message || 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  }, [analyzeUrl, session]);

  // ── New-tab editor toolbar injected into the opened HTML ─────────────────
  const buildNewTabToolbar = useCallback((): string => {
    const apiOrigin = window.location.origin;
    return `
<style id="majorka-toolbar-styles">
  #majorka-toolbar {
    position: fixed; top: 0; left: 0; right: 0; z-index: 99999;
    background: rgba(8,10,14,0.96); backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(212,175,55,0.25);
    display: flex; align-items: center; gap: 8px; padding: 9px 16px;
    font-family: 'Syne', 'DM Sans', sans-serif; box-shadow: 0 2px 24px rgba(0,0,0,0.5);
  }
  #majorka-toolbar .tb-brand { color: #d4af37; font-weight: 900; font-size: 13px; margin-right: 4px; white-space: nowrap; }
  #majorka-toolbar .tb-div { width: 1px; height: 18px; background: rgba(255,255,255,0.1); flex-shrink: 0; }
  #majorka-toolbar .tb-btn { padding: 5px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; font-family: inherit; transition: all 0.15s; white-space: nowrap; }
  #majorka-toolbar .tb-edit { background: rgba(212,175,55,0.12); border: 1px solid rgba(212,175,55,0.3); color: #d4af37; }
  #majorka-toolbar .tb-edit.active { background: rgba(212,175,55,0.22); border-color: #d4af37; }
  #majorka-toolbar .tb-save { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(240,237,232,0.7); }
  #majorka-toolbar .tb-save:hover { background: rgba(255,255,255,0.1); color: #fff; }
  #majorka-toolbar .tb-color-wrap { display: flex; align-items: center; gap: 6px; }
  #majorka-toolbar .tb-color-label { font-size: 11px; color: rgba(240,237,232,0.4); }
  #majorka-toolbar input[type=color] { width: 26px; height: 26px; border: 1px solid rgba(255,255,255,0.15); background: none; cursor: pointer; border-radius: 4px; padding: 1px; }
  #majorka-toolbar .tb-hint { font-size: 10px; color: rgba(240,237,232,0.25); margin-left: auto; display: flex; gap: 12px; }
  #majorka-toolbar .tb-hint span::before { margin-right: 4px; }
  .claw-editable { box-shadow: 0 0 0 2px rgba(212,175,55,0.5) !important; cursor: text !important; border-radius: 3px; transition: box-shadow 0.15s !important; }
  .claw-editable:hover { box-shadow: 0 0 0 2px #d4af37, 0 0 12px rgba(212,175,55,0.2) !important; background: rgba(212,175,55,0.06) !important; }
  .claw-editable:focus { box-shadow: 0 0 0 2px #d4af37, 0 0 16px rgba(212,175,55,0.25) !important; background: rgba(212,175,55,0.09) !important; outline: none !important; }
  .claw-img-wrap { position: relative !important; cursor: pointer !important; }
  .claw-img-wrap::after { content: "📷 Replace Image"; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.55); color: #d4af37; font-size: 13px; font-weight: 700; opacity: 0; transition: opacity 0.2s; pointer-events: none; font-family: sans-serif; border-radius: inherit; z-index: 10; }
  .claw-img-wrap:hover::after { opacity: 1; }
  .claw-img-wrap img { pointer-events: none !important; }
  #ai-tooltip { position: fixed; z-index: 100000; background: rgba(8,10,14,0.97); border: 1px solid rgba(212,175,55,0.35); border-radius: 8px; padding: 5px 6px; display: none; gap: 4px; align-items: center; }
  #ai-tooltip button { padding: 4px 10px; border-radius: 5px; font-size: 11px; font-weight: 700; background: rgba(212,175,55,0.1); border: 1px solid rgba(212,175,55,0.2); color: #d4af37; cursor: pointer; font-family: 'Syne', sans-serif; }
  #ai-tooltip button:hover { background: rgba(212,175,55,0.2); }
  #ai-spinner { display: none; color: #d4af37; font-size: 11px; padding: 4px 8px; }
  body { padding-top: 50px !important; }
</style>
<div id="majorka-toolbar">
  <span class="tb-brand">⚡ Majorka Editor</span>
  <div class="tb-div"></div>
  <button class="tb-btn tb-edit" id="tb-edit-btn" onclick="clawToggleEdit()">✏️ Edit Mode</button>
  <div class="tb-div"></div>
  <div class="tb-color-wrap">
    <span class="tb-color-label">🎨 Accent</span>
    <input type="color" id="tb-color" value="#d4af37" oninput="clawChangeColor(this.value)" title="Change accent colour">
  </div>
  <div class="tb-div"></div>
  <button class="tb-btn tb-save" onclick="clawSaveHtml()" title="Download edited HTML file">💾 Save HTML</button>
  <div class="tb-hint">
    <span>✏️ Click text to edit</span>
    <span>📷 Click images to replace</span>
    <span>✨ Select text for AI rewrite</span>
    <span>💾 Save when done</span>
  </div>
</div>
<div id="ai-tooltip">
  <span id="ai-spinner">⏳</span>
  <button onclick="clawAI('improve')">✨ Improve</button>
  <button onclick="clawAI('shorten')">✂️ Shorten</button>
  <button onclick="clawAI('urgent')">🔥 Add Urgency</button>
  <button onclick="clawAI('au')">🇦🇺 AU Voice</button>
  <button onclick="document.getElementById('ai-tooltip').style.display='none'" style="background:none;border:none;color:rgba(240,237,232,0.3);font-size:16px;padding:2px 6px;">×</button>
</div>
<script>
(function(){
  var editing=false, selEl=null, selText='', selTimer;
  var API='${apiOrigin}';

  window.clawToggleEdit=function(){
    editing=!editing;
    var btn=document.getElementById('tb-edit-btn');
    btn.textContent=editing?'✏️ Editing...':'✏️ Edit Mode';
    btn.classList.toggle('active',editing);
    if(editing){clawEnableEdit();clawToast('Edit mode ON — click any text to edit · click images to replace');}
    else{clawDisableEdit();clawToast('Edit mode off');}
  };

  // Re-apply edit indicators when navigating between pages
  document.addEventListener('clawPageChange', function(){
    if(editing){ clawEnableEdit(); }
  });

  window.clawToast=function(msg){
    var t=document.createElement('div');
    t.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:100002;background:rgba(8,10,14,0.95);border:1px solid rgba(212,175,55,0.4);border-radius:10px;padding:12px 20px;color:#d4af37;font-size:13px;font-weight:700;font-family:Syne,sans-serif;white-space:nowrap;pointer-events:none;';
    t.textContent=msg; document.body.appendChild(t);
    setTimeout(function(){t.style.opacity='0';t.style.transition='opacity 0.4s';setTimeout(function(){t.remove();},400);},2500);
  };

  window.clawEnableEdit=function(){
    var count=0;
    // Text editing — try each selector individually so one bad selector doesn't block others
    ['h1','h2','h3','h4','p','.hero-sub','.hero-badge','.btn-primary','.btn-secondary',
     '.btn-cart','.btn-buy-now','.nav-logo','.nav-cta','.product-price','.product-price-orig',
     '.stock-warning','.feature-card h3','.feature-card p','.testimonial-quote',
     '.testimonial-author','.testimonial-city','.footer-tagline','.trust-strip span',
     '.social-proof span','.afterpay-row','.section-header p'].forEach(function(sel){
      try{
        document.querySelectorAll(sel).forEach(function(el){
          if(el.querySelector('img')||el.isContentEditable)return;
          el.contentEditable='true'; el.classList.add('claw-editable'); el.spellcheck=false; count++;
        });
      }catch(e){}
    });
    // Image replacement
    document.querySelectorAll('img').forEach(function(img){
      var w=img.parentElement; if(!w||w.classList.contains('claw-img-wrap'))return;
      w.classList.add('claw-img-wrap'); w.style.position='relative';
      w.addEventListener('click',function(e){
        if(e.target===img||e.target===w){
          var inp=document.createElement('input'); inp.type='file'; inp.accept='image/*'; inp.style.display='none';
          document.body.appendChild(inp);
          inp.onchange=function(){ var f=inp.files[0]; if(f){var r=new FileReader();r.onload=function(ev){img.src=ev.target.result;};r.readAsDataURL(f);} inp.remove(); };
          inp.click();
        }
      });
    });
    document.addEventListener('mouseup',clawSelHandler);
    console.log('[Majorka Editor] Edit mode: '+count+' elements made editable');
  };

  window.clawDisableEdit=function(){
    document.querySelectorAll('.claw-editable').forEach(function(el){el.removeAttribute('contenteditable');el.classList.remove('claw-editable');});
    document.querySelectorAll('.claw-img-wrap').forEach(function(el){el.classList.remove('claw-img-wrap');});
    document.getElementById('ai-tooltip').style.display='none';
    document.removeEventListener('mouseup',clawSelHandler);
  };

  window.clawSelHandler=function(){
    clearTimeout(selTimer);
    selTimer=setTimeout(function(){
      var s=window.getSelection(); if(!s||s.isCollapsed||s.toString().trim().length<4){document.getElementById('ai-tooltip').style.display='none';return;}
      selText=s.toString().trim(); selEl=s.anchorNode?s.anchorNode.parentElement:null;
      var rect=s.getRangeAt(0).getBoundingClientRect();
      var tip=document.getElementById('ai-tooltip');
      tip.style.display='flex'; tip.style.top=(rect.top-46+window.scrollY)+'px'; tip.style.left=Math.max(10,rect.left)+'px';
    },250);
  };

  window.clawAI=function(type){
    if(!selEl||!selText)return;
    var tip=document.getElementById('ai-tooltip'); var spin=document.getElementById('ai-spinner');
    tip.querySelectorAll('button').forEach(function(b){b.disabled=true;});
    spin.style.display='block';
    var prompts={
      improve:'Rewrite to be more compelling for AU ecommerce. Keep same length. Return ONLY rewritten text: ',
      shorten:'Cut to half the words, keep key message, AU English. Return ONLY result: ',
      urgent:'Add urgency and FOMO for AU shoppers. Return ONLY result: ',
      au:'Rewrite in authentic Australian voice (casual, direct, no US-isms). Return ONLY result: '
    };
    fetch(API+'/api/website/improve-text',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({text:selText,instruction:prompts[type]+selText})
    })
    .then(function(r){return r.json();})
    .then(function(d){
      if(d.result&&selEl){selEl.textContent=d.result;}
    })
    .catch(function(){
      if(selEl)selEl.style.outline='2px solid #ef4444';
      setTimeout(function(){if(selEl)selEl.style.outline='';},1500);
    })
    .finally(function(){
      spin.style.display='none';
      tip.querySelectorAll('button').forEach(function(b){b.disabled=false;});
      tip.style.display='none';
      window.getSelection().removeAllRanges();
    });
  };

  window.clawChangeColor=function(c){
    var r=parseInt(c.slice(1,3),16),g=parseInt(c.slice(3,5),16),b=parseInt(c.slice(5,7),16);
    var s=document.getElementById('claw-clr');
    if(!s){s=document.createElement('style');s.id='claw-clr';document.head.appendChild(s);}
    s.textContent=':root{--accent:'+c+' !important;} [style*="#d4af37"]{color:'+c+' !important;}';
  };

  window.clawSaveHtml=function(){
    document.querySelectorAll('.claw-editable').forEach(function(el){el.removeAttribute('contenteditable');el.classList.remove('claw-editable');});
    document.querySelectorAll('.claw-img-wrap').forEach(function(el){el.classList.remove('claw-img-wrap');});
    document.getElementById('ai-tooltip').style.display='none';
    var html='<!DOCTYPE html>\n'+document.documentElement.outerHTML;
    var a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([html],{type:'text/html'}));
    a.download='my-store.html'; a.click(); URL.revokeObjectURL(a.href);
  };
})();
</script>`;
  }, []);

  const handleOpenPreviewNewTab = useCallback(() => {
    const html = directHtml || previewHTML;
    if (!html) return;
    const toolbar = buildNewTabToolbar();
    const full = html.replace(/<\/body\s*>/i, toolbar + '\n</body>');
    // Use Blob URL — avoids document.write timing issues, scripts execute reliably
    const blob = new Blob([full], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 120000); // clean up after 2 min
  }, [directHtml, previewHTML, buildNewTabToolbar]);

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
      <div className="flex-1 overflow-auto flex flex-col md:flex-row">
        {/* ── LEFT PANEL ── */}
        <div className="flex-shrink-0 overflow-y-auto p-5 space-y-4 w-full md:w-[400px]" style={{ borderRight: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>

          {/* 3-Step Wizard Indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 24, padding: "0 4px" }}>
            {[
              { n: 1, label: "Import" },
              { n: 2, label: "Customize" },
              { n: 3, label: "Generate" },
            ].map((s, i) => {
              const done = (s.n === 1 && !!analysisResult) || (s.n === 2 && !!storeName && !!niche) || (s.n === 3 && !!hasOutput);
              const active = (s.n === 1 && !analysisResult) || (s.n === 2 && !!analysisResult && !hasOutput) || (s.n === 3 && (generating || !!hasOutput));
              return (
                <React.Fragment key={s.n}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, fontFamily: "Syne, sans-serif", background: done ? "#d4af37" : active ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.05)", color: done ? "#08080f" : active ? "#d4af37" : "rgba(255,255,255,0.3)", border: `1px solid ${done ? "#d4af37" : active ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.08)"}`, transition: "all 0.3s" }}>
                      {done ? "✓" : s.n}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: active ? "#d4af37" : "rgba(255,255,255,0.3)", fontFamily: "Syne, sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</span>
                  </div>
                  {i < 2 && <div style={{ flex: 1, height: 1, background: done ? "#d4af37" : "rgba(255,255,255,0.06)", marginBottom: 16, transition: "background 0.4s" }} />}
                </React.Fragment>
              );
            })}
          </div>

          {/* Design Template Selector */}
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1.5px solid rgba(212,175,55,0.2)', position: 'relative' }}>
            <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#d4af37', fontFamily: 'Syne, sans-serif' }}>Design Template</div>
            <div style={isMobile ? { display: 'flex', gap: 8, overflowX: 'auto', flexWrap: 'nowrap', paddingBottom: 4, scrollbarWidth: 'none' } : { display: 'flex', flexDirection: 'column', gap: 6 }}>
              {WEBSITE_TEMPLATES.map((t) => {
                const isSelected = premiumTemplateId === t.id;
                const isHovered = hoveredTemplate === t.id;
                const dirMap: Record<string, string> = {
                  'dtc-minimal': 'dark-minimal', 'dropship-bold': 'bold-cta',
                  'premium-brand': 'luxury-editorial', 'coastal-au': 'coastal-lifestyle',
                  'tech-mono': 'tech-minimal', 'bloom-beauty': 'organic-wellness',
                };
                return (
                  <button key={t.id}
                    onClick={() => { setPremiumTemplateId(t.id); setUserPickedTemplate(true); if (dirMap[t.id]) setDesignDirection(dirMap[t.id]); }}
                    onMouseEnter={() => setHoveredTemplate(t.id)}
                    onMouseLeave={() => setHoveredTemplate(null)}
                    className="w-full rounded-xl text-left transition-all"
                    style={{ background: isSelected ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.02)', border: `1.5px solid ${isSelected ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.06)'}`, borderLeft: isSelected ? '3px solid #d4af37' : `1.5px solid ${isSelected ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', padding: '9px 11px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: `linear-gradient(135deg, ${t.palette.accent}dd, ${t.palette.accent}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>
                      {t.emoji || '●'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: isSelected ? '#d4af37' : 'rgba(240,237,232,0.85)', fontFamily: 'Syne, sans-serif', marginBottom: 2, lineHeight: 1 }}>{t.name}</div>
                      <div style={{ fontSize: 10, color: 'rgba(240,237,232,0.35)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>{t.bestFor || t.description}</div>
                    </div>
                    {/* Task 2B — Colour palette dots */}
                    <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.palette.bg, border: '1px solid rgba(255,255,255,0.15)' }} />
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.palette.accent, border: '1px solid rgba(255,255,255,0.15)' }} />
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.palette.text, border: '1px solid rgba(255,255,255,0.15)' }} />
                    </div>
                    {isSelected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#d4af37', flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
            {/* Task 2D — Hover thumbnail preview */}
            {hoveredTemplate && (() => {
              const ht = WEBSITE_TEMPLATES.find(t => t.id === hoveredTemplate);
              if (!ht) return null;
              return (
                <div style={{ position: 'absolute', right: -220, top: 40, width: 200, zIndex: 100, background: '#0c0e12', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', pointerEvents: 'none' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#f0ede8', fontFamily: 'Syne, sans-serif', marginBottom: 8 }}>{ht.name}</div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                    {[ht.palette.bg, ht.palette.accent, ht.palette.text].map((c, i) => (
                      <div key={i} style={{ width: 20, height: 20, borderRadius: '50%', background: c, border: '1px solid rgba(255,255,255,0.15)' }} />
                    ))}
                  </div>
                  {/* Mini wireframe */}
                  <div style={{ borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ height: 8, background: ht.palette.bg, borderBottom: `1px solid ${ht.palette.accent}40` }} />
                    <div style={{ height: 32, background: ht.palette.accent + '30', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ fontSize: 8, color: ht.palette.text, fontWeight: 700 }}>HERO</div>
                    </div>
                    <div style={{ height: 24, background: ht.palette.bg, display: 'flex', gap: 4, padding: 4, justifyContent: 'center' }}>
                      {[1, 2, 3].map(n => (
                        <div key={n} style={{ width: 24, height: 16, background: ht.palette.accent + '20', borderRadius: 2 }} />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
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
                {/* Task 3D — Feature tags + auto-fill badges */}
                {importedProduct.features && importedProduct.features.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                    {importedProduct.features.slice(0, 2).map((f, i) => (
                      <span key={i} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(240,237,232,0.45)' }}>{typeof f === 'string' ? f.slice(0, 50) : f}</span>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  {importAutoFilledStore && <span style={{ fontSize: 10, color: 'rgba(45,202,114,0.7)', fontWeight: 600 }}>✓ Store name auto-filled</span>}
                  {importAutoFilledNiche && <span style={{ fontSize: 10, color: 'rgba(45,202,114,0.7)', fontWeight: 600 }}>✓ Niche detected</span>}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex gap-1.5">
                  <input value={importUrl} onChange={(e) => { setImportUrl(e.target.value); setManualFallback(null); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleImport(); } }} placeholder="Paste product URL (AliExpress, Amazon…)" className="flex-1 text-xs px-3 py-2 rounded-lg outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)', color: '#f0ede8' }} />
                  <button onClick={handleImport} disabled={importing || !importUrl.trim()} className="text-xs font-bold px-3 py-2 rounded-lg flex-shrink-0 flex items-center gap-1 disabled:opacity-50" style={{ background: 'rgba(45,202,114,0.12)', border: '1.5px solid rgba(45,202,114,0.35)', color: 'rgba(45,202,114,0.9)', fontFamily: 'Syne, sans-serif', cursor: 'pointer' }}>
                    {importing ? <Loader2 size={10} className="animate-spin" /> : null}{importing ? '…' : 'Import'}
                  </button>
                </div>
                {/* Task 3A — Better loading state */}
                {importing && <span style={{ fontSize: 11, color: 'rgba(240,237,232,0.5)', marginTop: 4, display: 'block' }}>Analyzing product...</span>}
                {importError && (
                  <div>
                    <div className="text-xs mt-1.5" style={{ color: 'rgba(255,150,100,0.8)' }}>{importError}</div>
                    {/* Task 3C — Supported sources */}
                    <div style={{ fontSize: 11, color: 'rgba(240,237,232,0.35)', marginTop: 4 }}>
                      Supported: AliExpress, Amazon AU, eBay AU, CJDropshipping, DHgate
                    </div>
                  </div>
                )}
                {/* Manual fallback amber banner */}
                {manualFallback && !importedProduct && (
                  <div style={{
                    marginTop: 12,
                    padding: '12px 16px',
                    borderRadius: 8,
                    background: 'rgba(251,191,36,0.08)',
                    border: '1px solid rgba(251,191,36,0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14 }}>&#9888;&#65039;</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(251,191,36,0.9)' }}>
                        Auto-import unavailable — enter details below
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: 'rgba(240,237,232,0.55)', margin: 0, lineHeight: 1.5 }}>
                      {manualFallback.message}
                    </p>
                    {manualFallback.tip && (
                      <p style={{ fontSize: 12, color: 'rgba(251,191,36,0.6)', margin: 0 }}>
                        {manualFallback.tip}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Product URL Quality Analyzer — Hero Input */}
          <div className="rounded-xl p-4" style={{ background: analysisResult ? 'rgba(212,175,55,0.04)' : 'rgba(255,255,255,0.02)', border: `1.5px solid ${analysisResult ? 'rgba(212,175,55,0.25)' : 'rgba(212,175,55,0.15)'}` }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#d4af37', fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              ✦ Step 1: Import a product
            </div>
            <div className="flex gap-1.5 mb-2">
              <input
                value={analyzeUrl}
                onChange={(e) => setAnalyzeUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAnalyzeProduct(); } }}
                placeholder="https://aliexpress.com/item/..."
                className="flex-1 text-sm rounded-lg outline-none"
                style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)', color: '#f0ede8' }}
              />
              <button
                onClick={() => handleAnalyzeProduct()}
                disabled={analyzing || !analyzeUrl.trim()}
                className="text-xs font-bold px-4 rounded-lg flex-shrink-0 flex items-center gap-1.5 disabled:opacity-50"
                style={{ background: '#d4af37', border: '1.5px solid #d4af37', color: '#08080f', fontFamily: 'Syne, sans-serif', fontWeight: 800, cursor: 'pointer' }}
              >
                {analyzing ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                {analyzing ? 'Analyzing…' : 'Analyze'}
              </button>
            </div>
            {!analysisResult && <p className="text-xs" style={{ color: 'rgba(240,237,232,0.25)' }}>Paste a URL — AI scores your product before you build</p>}

            {/* Product Summary Card */}
            {analysisResult && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(212,175,55,0.15)', marginBottom: 8 }}>
                <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {((analysisResult.product_images as string[]) || []).length > 0 ? (
                    <img src={proxyImage((analysisResult.product_images as string[])[0])} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                  ) : <span style={{ fontSize: 20 }}>📦</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#f0ede8', fontFamily: 'Syne, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {analysisResult.product_title || analysisResult.suggested_title || 'Product'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: ((analysisResult.overall_score ?? analysisResult.score ?? 0) as number) >= 80 ? 'rgba(74,222,128,0.15)' : 'rgba(245,158,11,0.15)', color: ((analysisResult.overall_score ?? analysisResult.score ?? 0) as number) >= 80 ? '#4ade80' : '#f59e0b', border: `1px solid ${((analysisResult.overall_score ?? analysisResult.score ?? 0) as number) >= 80 ? 'rgba(74,222,128,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
                      {(analysisResult.overall_score ?? analysisResult.score ?? '?') as number}/100
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Check size={9} /> Product imported
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Analysis Result Panel */}
            {analyzeError && (
              <div className="mt-3 text-xs p-2.5 rounded-lg" style={{ background: 'rgba(255,100,100,0.08)', border: '1px solid rgba(255,100,100,0.2)', color: 'rgba(255,150,150,0.9)' }}>{analyzeError}</div>
            )}
            {analysisResult && (
              <div className="mt-3 rounded-xl p-4 space-y-3" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(99,102,241,0.25)' }}>
                {/* Score badge */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider" style={{ color: 'rgba(240,237,232,0.6)', fontFamily: 'Syne, sans-serif' }}>
                    🔍 Product Analysis
                  </span>
                  <div className="flex items-center justify-center w-10 h-10 rounded-full font-black text-sm" style={{
                    background: ((analysisResult.overall_score ?? analysisResult.score ?? 0) as number) >= 80 ? 'rgba(74,222,128,0.15)' : ((analysisResult.overall_score ?? analysisResult.score ?? 0) as number) >= 60 ? 'rgba(245,158,11,0.15)' : 'rgba(248,113,113,0.15)',
                    border: `2px solid ${((analysisResult.overall_score ?? analysisResult.score ?? 0) as number) >= 80 ? '#4ade80' : ((analysisResult.overall_score ?? analysisResult.score ?? 0) as number) >= 60 ? '#f59e0b' : '#f87171'}`,
                    color: ((analysisResult.overall_score ?? analysisResult.score ?? 0) as number) >= 80 ? '#4ade80' : ((analysisResult.overall_score ?? analysisResult.score ?? 0) as number) >= 60 ? '#f59e0b' : '#f87171',
                    fontFamily: 'Syne, sans-serif',
                  }}>
                    {(analysisResult.overall_score ?? analysisResult.score ?? '?') as number}
                  </div>
                </div>

                {/* Supplier badge */}
                {analysisResult.supplier && (
                  <div className="text-xs px-2 py-0.5 inline-flex rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(240,237,232,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {analysisResult.supplier}
                  </div>
                )}

                {/* Quality signals */}
                {(['image', 'title', 'description'] as const).map((signal) => {
                  const quality = signal === 'image' ? analysisResult.image_quality : signal === 'title' ? analysisResult.title_quality : analysisResult.description_quality;
                  const issues = signal === 'image' ? analysisResult.image_issues : signal === 'title' ? analysisResult.title_issues : analysisResult.description_issues;
                  const icon = quality === 'good' ? '✅' : quality === 'bad' ? '❌' : '⚠️';
                  const color = quality === 'good' ? '#4ade80' : quality === 'bad' ? '#f87171' : '#f59e0b';
                  const label = signal === 'image' ? 'Image Quality' : signal === 'title' ? 'Title Quality' : 'Description';
                  return (
                    <div key={signal}>
                      <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color }}>
                        <span>{icon}</span>
                        <span style={{ color: 'rgba(240,237,232,0.7)' }}>{label}:</span>
                        <span>{quality === 'good' ? 'Looks good' : quality === 'bad' ? 'Needs fixing' : 'Issues found'}</span>
                      </div>
                      {issues && issues.length > 0 && (
                        <ul className="ml-5 mt-1 space-y-0.5">
                          {issues.map((issue: string, i: number) => (
                            <li key={i} className="text-xs" style={{ color: 'rgba(240,237,232,0.4)' }}>• {issue}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}

                {/* Product intel summary */}
                {(analysisResult.hero_headline || analysisResult.suggested_title || analysisResult.au_suggested_title) && (
                  <div className="rounded-lg p-2.5 space-y-1.5" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                    {(analysisResult.au_suggested_title || analysisResult.suggested_title) && (
                      <div>
                        <div className="text-xs font-bold mb-0.5" style={{ color: 'rgba(99,102,241,0.9)', fontFamily: 'Syne, sans-serif' }}>💡 AU Title:</div>
                        <div className="text-xs italic" style={{ color: 'rgba(240,237,232,0.7)', lineHeight: 1.5 }}>"{analysisResult.au_suggested_title || analysisResult.suggested_title}"</div>
                      </div>
                    )}
                    {analysisResult.hero_headline && (
                      <div>
                        <div className="text-xs font-bold mb-0.5" style={{ color: 'rgba(99,102,241,0.9)', fontFamily: 'Syne, sans-serif' }}>🎯 Hero Headline:</div>
                        <div className="text-xs italic" style={{ color: 'rgba(240,237,232,0.7)', lineHeight: 1.5 }}>"{analysisResult.hero_headline}"</div>
                      </div>
                    )}
                    {analysisResult.hero_benefit && (
                      <div className="text-xs" style={{ color: 'rgba(240,237,232,0.5)' }}>⚡ Hero benefit: <span style={{ color: '#d4af37' }}>{analysisResult.hero_benefit}</span></div>
                    )}
                    {((analysisResult.sizes as string[]) || []).length > 0 && (
                      <div className="text-xs" style={{ color: 'rgba(240,237,232,0.5)' }}>📐 Sizes: {((analysisResult.sizes as string[]) || []).join(', ')}</div>
                    )}
                    {((analysisResult.colors as string[]) || []).length > 0 && (
                      <div className="text-xs" style={{ color: 'rgba(240,237,232,0.5)' }}>🎨 Colours: {((analysisResult.colors as string[]) || []).join(', ')}</div>
                    )}
                    {((analysisResult.product_images as string[]) || []).length > 0 && (
                      <div className="text-xs" style={{ color: 'rgba(45,202,114,0.8)' }}>✓ {((analysisResult.product_images as string[]) || []).length} product image(s) extracted</div>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-1.5 flex-wrap">
                  {(analysisResult.suggested_title || analysisResult.au_suggested_title || analysisResult.product_title) && (
                    <button
                      onClick={() => {
                        const title = analysisResult.au_suggested_title || analysisResult.suggested_title;
                        if (title) setStoreName(title.slice(0, 40));
                        const desc = analysisResult.description || analysisResult.suggested_description;
                        if (desc) setTagline(desc.slice(0, 80));
                        const productName = analysisResult.product_title || analysisResult.product_name;
                        if (productName) setNiche(productName.slice(0, 60));
                        if (analysisResult.target_customer) setTargetAudience(analysisResult.target_customer.slice(0, 80));
                        if (analysisResult.price_aud) setPriceAUD(String(analysisResult.price_aud));
                        toast.success('Product data applied! Hit Generate to build your store.');
                      }}
                      className="text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                      style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)', color: 'rgba(99,102,241,0.9)', cursor: 'pointer' }}
                    >
                      <Check size={9} /> Use Suggested →
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (analyzeUrl) setImportUrl(analyzeUrl);
                      setAnalysisResult(null);
                      toast.info('URL moved to Import — click Import to load product data');
                    }}
                    className="text-xs font-bold px-2.5 py-1.5 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(240,237,232,0.5)', cursor: 'pointer' }}
                  >
                    Import Anyway
                  </button>
                  <button
                    onClick={() => { setAnalysisResult(null); setAnalyzeUrl(''); }}
                    className="text-xs font-bold px-2.5 py-1.5 rounded-lg"
                    style={{ background: 'rgba(255,100,100,0.08)', border: '1px solid rgba(255,100,100,0.15)', color: 'rgba(255,150,150,0.7)', cursor: 'pointer' }}
                  >
                    Find Better
                  </button>
                </div>

                {/* Recommendation */}
                {analysisResult.recommendation && (
                  <div className="text-xs font-semibold" style={{ color: 'rgba(240,237,232,0.4)' }}>
                    Recommendation: <span style={{ color: '#f0c040' }}>{analysisResult.recommendation}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick-start Templates — Task 6 */}
          <div>
            <button
              onClick={() => setQuickStartOpen(!quickStartOpen)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(212,175,55,0.7)', fontSize: 11, fontWeight: 700, fontFamily: 'Syne, sans-serif', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <ChevronRight size={11} style={{ transform: quickStartOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
              Quick start with an example →
            </button>
            {quickStartOpen && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {([
                  { emoji: '🧍', label: 'Posture Corrector', niche: 'Health', storeName: 'AlignAU', targetAudience: 'AU desk workers 25-45', tagline: 'Stand tall, feel great', price: '49.95', color: '#10b981', templateId: 'bondi-wellness' },
                  { emoji: '💄', label: 'Glow LED Face Mask', niche: 'Beauty & Skincare', storeName: 'GlowMist AU', targetAudience: 'AU women 20-35', tagline: 'Clinic-grade glow at home', price: '79.95', color: '#ec4899', templateId: 'bloom-beauty' },
                  { emoji: '🖥', label: 'Monitor Stand', niche: 'Home Office Tech', storeName: 'DeskPro AU', targetAudience: 'AU remote workers', tagline: 'Level up your workspace', price: '59.95', color: '#3b82f6', templateId: 'tech-mono' },
                  { emoji: '🐕', label: 'Dog Harness', niche: 'Pet Accessories', storeName: 'TrailPaws AU', targetAudience: 'AU dog owners', tagline: 'Built for AU adventures', price: '39.95', color: '#f59e0b', templateId: 'au-pet-collective' },
                ] as const).map((ex) => (
                  <button
                    key={ex.label}
                    onClick={() => {
                      setNiche(ex.niche);
                      setStoreName(ex.storeName);
                      setAccentColor(ex.color);
                      setTargetAudience(ex.targetAudience);
                      setTagline(ex.tagline);
                      setPriceAUD(ex.price);
                      setPremiumTemplateId(ex.templateId);
                      setUserPickedTemplate(false);
                      setQuickStartOpen(false);
                      toast.success(`"${ex.label}" example loaded — generating…`);
                      setTimeout(() => handleGenerate(), 200);
                    }}
                    style={{ padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(240,237,232,0.7)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = ex.color; e.currentTarget.style.color = ex.color; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(240,237,232,0.7)'; }}
                  >
                    {ex.emoji} {ex.label}
                    <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', color: 'rgba(240,237,232,0.4)' }}>EXAMPLE</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

          {/* From Database banner */}
          {fromDatabaseBanner && (
            <div style={{
              marginBottom: 4,
              padding: '12px 16px',
              borderRadius: 10,
              background: 'rgba(212,175,55,0.1)',
              border: '1.5px solid rgba(212,175,55,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>⚡</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#d4af37', fontFamily: 'Syne, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Building store for: {fromDatabaseBanner.productName}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(212,175,55,0.65)', marginTop: 2 }}>
                    {fromDatabaseBanner.niche}{fromDatabaseBanner.price ? ` · $${fromDatabaseBanner.price} AUD` : ''}
                    {' · '}Just enter a store name below and hit Generate
                  </div>
                </div>
              </div>
              <button
                onClick={() => setFromDatabaseBanner(null)}
                style={{ flexShrink: 0, background: 'none', border: 'none', color: 'rgba(212,175,55,0.5)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px' }}
              >
                ×
              </button>
            </div>
          )}

          {/* Store Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(240,237,232,0.4)', fontFamily: 'Syne, sans-serif' }}>Store Name</label>
            <input data-field="storeName" value={storeName} onChange={(e) => { setStoreName(e.target.value); clearTimeout(livePreviewStoreNameTimer.current); livePreviewStoreNameTimer.current = setTimeout(() => setLivePreviewStoreName(e.target.value), 400); }} placeholder="e.g. MaxFit Supplements" className="w-full text-sm px-3 py-2.5 rounded-lg outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)', color: '#f0ede8' }} onFocus={(e) => (e.target.style.borderColor = 'rgba(212,175,55,0.45)')} onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')} />
          </div>

          {/* Niche */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(240,237,232,0.4)', fontFamily: 'Syne, sans-serif' }}>Niche <span style={{ color: '#d4af37', fontWeight: 700 }}>*</span></label>
            <input value={niche} onChange={(e) => { setNiche(e.target.value); clearTimeout(livePreviewNicheTimer.current); livePreviewNicheTimer.current = setTimeout(() => setLivePreviewNiche(e.target.value), 400); }} list="niche-list" placeholder="e.g. gym clothing" className="w-full text-sm px-3 py-2.5 rounded-lg outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)', color: '#f0ede8' }} onFocus={(e) => (e.target.style.borderColor = 'rgba(212,175,55,0.45)')} onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')} />
            <datalist id="niche-list">
              {['Beauty & Skincare','Fitness & Gym','Home & Living','Pet Accessories','Tech Gadgets','Outdoor & Adventure','Women\'s Fashion','Men\'s Fashion','Baby & Kids','Health Supplements','Jewellery','Coffee & Tea'].map(n => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </div>

          {/* Design Direction — moved up for prominence */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(240,237,232,0.4)', fontFamily: 'Syne, sans-serif' }}>Design Direction</label>
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {[
                { id: 'default', emoji: '✦', label: 'Dark DTC' },
                { id: 'luxury',  emoji: '✦', label: 'Luxury' },
                { id: 'brutalist', emoji: '⬛', label: 'Brutalist' },
                { id: 'editorial', emoji: '📰', label: 'Editorial' },
                { id: 'saas', emoji: '⚡', label: 'SaaS' },
                { id: 'minimal', emoji: '○', label: 'Minimal' },
              ].map((d) => (
                <button key={d.id} onClick={() => setDesignDirection(d.id)} style={{ padding: '8px 6px', borderRadius: 8, background: designDirection === d.id ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.03)', border: `1.5px solid ${designDirection === d.id ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.07)'}`, color: designDirection === d.id ? '#d4af37' : 'rgba(240,237,232,0.45)', fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700, cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ fontSize: 14, marginBottom: 3 }}>{d.emoji}</div>
                  {d.label}
                </button>
              ))}
            </div>
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
              <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'rgba(240,237,232,0.3)' }}>$</span>
              <input value={priceAUD} onChange={(e) => setPriceAUD(e.target.value)} placeholder="e.g. 59.99" className="w-full text-sm py-2.5 rounded-lg outline-none" style={{ paddingLeft: 22, paddingRight: 12, background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)', color: '#f0ede8' }} onFocus={(e) => (e.target.style.borderColor = 'rgba(212,175,55,0.45)')} onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; const num = parseFloat(priceAUD.replace(/[^0-9.]/g, '')); if (!isNaN(num)) setPriceAUD(num.toFixed(2)); }} />
            </div>
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
              <button
                onClick={async () => {
                  if (!niche.trim()) { toast.error('Enter a niche first'); return; }
                  setPaletteLoading(true);
                  try {
                    const res = await fetch('/api/website/palette', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
                      body: JSON.stringify({ niche, brandColor: accentColor, direction: designDirection !== 'default' ? designDirection : undefined }),
                    });
                    if (!res.ok) throw new Error('Failed');
                    const data = await res.json();
                    setPalette(data);
                  } catch { toast.error('Palette generation failed'); }
                  finally { setPaletteLoading(false); }
                }}
                disabled={paletteLoading}
                style={{ marginLeft: 'auto', padding: '6px 12px', borderRadius: 8, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: '#d4af37', fontSize: 11, fontWeight: 700, fontFamily: 'Syne, sans-serif', cursor: paletteLoading ? 'not-allowed' : 'pointer', opacity: paletteLoading ? 0.6 : 1 }}
              >
                {paletteLoading ? '...' : '🎨 Generate Palette'}
              </button>
            </div>
            {palette && (
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {palette.swatches.map((s: string, i: number) => (
                  <button key={i} onClick={() => setAccentColor(s)} title={s}
                    style={{ width: 28, height: 28, borderRadius: 6, background: s, border: accentColor === s ? '2px solid #fff' : '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', flexShrink: 0 }} />
                ))}
                {palette.rationale && <span style={{ fontSize: 11, color: 'rgba(240,237,232,0.35)', marginLeft: 4 }}>{palette.rationale}</span>}
              </div>
            )}
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

          {/* Description Enhancer */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(240,237,232,0.4)', fontFamily: 'Syne, sans-serif' }}>Product Description</label>
            <textarea
              value={rawDesc}
              onChange={(e) => setRawDesc(e.target.value)}
              placeholder="Paste your raw product description here..."
              rows={3}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)', color: '#f0ede8', fontSize: 13, resize: 'vertical', fontFamily: 'DM Sans, sans-serif' }}
            />
            <div className="flex items-center gap-2" style={{ marginTop: 6 }}>
              <button
                onClick={async () => {
                  if (!rawDesc.trim()) { toast.error('Enter a description first'); return; }
                  setEnhancingDesc(true);
                  try {
                    const res = await fetch('/api/website/enhance-description', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
                      body: JSON.stringify({ description: rawDesc, niche: niche || undefined }),
                    });
                    if (!res.ok) throw new Error('Failed');
                    const data = await res.json();
                    setDescVariants(data);
                  } catch { toast.error('Enhancement failed'); }
                  finally { setEnhancingDesc(false); }
                }}
                disabled={enhancingDesc || !rawDesc.trim()}
                style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: '#d4af37', fontSize: 11, fontWeight: 700, fontFamily: 'Syne, sans-serif', cursor: enhancingDesc || !rawDesc.trim() ? 'not-allowed' : 'pointer', opacity: enhancingDesc || !rawDesc.trim() ? 0.5 : 1 }}
              >
                {enhancingDesc ? '...' : 'Enhance'}
              </button>
              {selectedDesc && <span style={{ fontSize: 10, color: 'rgba(212,175,55,0.6)' }}>Selected</span>}
            </div>
            {descVariants && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(Object.entries(descVariants) as [string, string][]).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedDesc(val)}
                    style={{
                      textAlign: 'left', padding: '8px 10px', borderRadius: 8, fontSize: 12, lineHeight: 1.5, cursor: 'pointer',
                      background: selectedDesc === val ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${selectedDesc === val ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.07)'}`,
                      color: selectedDesc === val ? '#f0ede8' : 'rgba(240,237,232,0.6)',
                    }}
                  >
                    <span style={{ fontWeight: 700, textTransform: 'capitalize', color: '#d4af37', fontSize: 10, marginRight: 6 }}>{key}</span>
                    {val}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* C3 — Recent Sites */}
          {siteHistory.length === 0 ? (
            <div style={{
              padding: '16px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 10,
              textAlign: 'center'
            }}>
              <p style={{ fontSize: 11, color: 'rgba(240,237,232,0.3)', marginBottom: 8 }}>No stores generated yet</p>
              <p style={{ fontSize: 10, color: 'rgba(212,175,55,0.5)' }}>Try a quick start example below →</p>
            </div>
          ) : (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, marginTop: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(240,237,232,0.3)', fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Recent Sites</div>
              {siteHistory.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(240,237,232,0.8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.storeName}</div>
                    <div style={{ fontSize: 11, color: 'rgba(240,237,232,0.35)' }}>{item.direction} · {new Date(item.timestamp).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</div>
                  </div>
                  {/* Load — restore preview */}
                  <button
                    onClick={() => {
                      setDirectHtml(item.html);
                      setStoreName(item.storeName);
                      setNiche(item.niche);
                      setActiveTab('preview');
                      setGeneratedData({ storeName: item.storeName, headline: item.niche, features: [], primaryColor: '#d4af37' });
                    }}
                    style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', color: '#d4af37', cursor: 'pointer', flexShrink: 0 }}
                  >Load</button>
                  {/* Edit — restore form inputs, clear preview so user can regenerate */}
                  <button
                    onClick={() => {
                      setStoreName(item.storeName);
                      setNiche(item.niche);
                      if (item.direction && item.direction !== 'default') setDesignDirection(item.direction as any);
                      setDirectHtml(null);
                      setGeneratedData(null);
                      setGenError('');
                      setGenProgress(0);
                      setActiveTab('preview');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      toast('Loaded into editor — tweak and regenerate ✏️');
                    }}
                    style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(240,237,232,0.6)', cursor: 'pointer', flexShrink: 0 }}
                  >✏️</button>
                  {/* Delete */}
                  <button
                    onClick={() => {
                      const next = siteHistory.filter(h => h.id !== item.id);
                      setSiteHistory(next);
                      localStorage.setItem('majorka_site_history', JSON.stringify(next));
                    }}
                    style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(240,237,232,0.3)', cursor: 'pointer', flexShrink: 0 }}
                  >✕</button>
                </div>
              ))}
            </div>
          )}

          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

          {/* Generate Button */}
          <style>{`
            @keyframes mjk-fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
            .mjk-gen-btn:not(:disabled):hover {
              background: #c9a227 !important;
              opacity: 1 !important;
              transform: none !important;
              box-shadow: 0 4px 24px rgba(212,175,55,0.35) !important;
              animation: none !important;
              background-image: none !important;
            }
            .mjk-gen-btn:disabled {
              opacity: 0.6 !important;
              cursor: not-allowed !important;
              transform: none !important;
            }
            .mjk-gen-btn:active:not(:disabled) {
              background: #b8911f !important;
              transform: none !important;
              animation: none !important;
            }
          `}</style>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="mjk-gen-btn w-full rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              style={{ height: 56, background: generating ? 'rgba(212,175,55,0.25)' : 'linear-gradient(135deg, #d4af37, #f0c040)', color: '#080a0e', fontFamily: 'Syne, sans-serif', boxShadow: generating ? 'none' : '0 4px 24px rgba(212,175,55,0.35)', cursor: generating ? 'not-allowed' : 'pointer', border: 'none', fontSize: 14 }}
            >
              {generating ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Generating{genProgress > 0 ? ` ${genProgress}%` : ''}
                  <span style={{ display: 'inline-flex', width: 18, letterSpacing: 1 }}>
                    <span className="animate-pulse">.</span><span className="animate-pulse" style={{ animationDelay: '0.2s' }}>.</span><span className="animate-pulse" style={{ animationDelay: '0.4s' }}>.</span>
                  </span>
                </>
              ) : (
                <><Globe size={15} />{hasOutput ? 'Regenerate' : 'Generate'}</>
              )}
            </button>
            <span style={{ fontSize: 10, color: 'rgba(240,237,232,0.25)', fontFamily: 'Syne, sans-serif' }}>⌘↵ Generate</span>
          </div>

          {/* Task 4E — Shopify Connect / Push */}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            {shopifyConnected ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#22c55e', flex: 1 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
                  {shopifyShop || 'Shopify connected'}
                </div>
                {hasOutput && (
                  <button
                    onClick={handleShopifyPush}
                    disabled={shopifyPushing}
                    style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(34,197,94,0.35)', background: 'rgba(34,197,94,0.08)', color: '#22c55e', fontSize: 11, fontWeight: 700, cursor: shopifyPushing ? 'not-allowed' : 'pointer', fontFamily: 'Syne, sans-serif', display: 'flex', alignItems: 'center', gap: 6, opacity: shopifyPushing ? 0.6 : 1 }}
                  >
                    {shopifyPushing ? <Loader2 size={11} className="animate-spin" /> : null}
                    {shopifyPushing ? 'Pushing...' : '↑ Push to Shopify'}
                  </button>
                )}
              </>
            ) : (
              showShopifyInput ? (
                <div style={{ display: 'flex', gap: 6, width: '100%' }}>
                  <input
                    value={shopifyDomainInput}
                    onChange={(e) => setShopifyDomainInput(e.target.value)}
                    placeholder="mystore.myshopify.com"
                    onKeyDown={(e) => { if (e.key === 'Enter') { const d = shopifyDomainInput.trim().replace(/^https?:\/\//, '').replace(/\/$/, ''); if (d.includes('.myshopify.com')) window.location.href = `/api/shopify/auth?shop=${encodeURIComponent(d)}`; } }}
                    style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#f0ede8', fontSize: 11, outline: 'none' }}
                  />
                  <button
                    onClick={() => { const d = shopifyDomainInput.trim().replace(/^https?:\/\//, '').replace(/\/$/, ''); if (d.includes('.myshopify.com')) window.location.href = `/api/shopify/auth?shop=${encodeURIComponent(d)}`; else toast.error('Enter a valid .myshopify.com domain'); }}
                    style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: '#d4af37', color: '#080a0e', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}
                  >Go</button>
                  <button onClick={() => setShowShopifyInput(false)} style={{ padding: '7px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'rgba(240,237,232,0.4)', fontSize: 11, cursor: 'pointer' }}>✕</button>
                </div>
              ) : (
                <button
                  onClick={() => setShowShopifyInput(true)}
                  style={{ width: '100%', padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: 'rgba(240,237,232,0.5)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  🔗 Connect Shopify store
                </button>
              )
            )}
          </div>
          {shopifyPushResult && shopifyPushResult.success && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.18)', fontSize: 11 }}>
              <div style={{ color: '#22c55e', fontWeight: 700, marginBottom: 4 }}>✓ Pushed to Shopify</div>
              {shopifyPushResult.storeUrl && <a href={shopifyPushResult.storeUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#22c55e', textDecoration: 'none' }}>Open store →</a>}
            </div>
          )}

          {genError && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, color: '#ef4444', flex: 1 }}>{genError}</span>
              <button onClick={() => setGenError('')} style={{ background: 'none', border: 'none', color: 'rgba(239,68,68,0.5)', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>×</button>
              <button onClick={handleGenerate}
                style={{ fontSize: 12, fontWeight: 700, padding: '6px 12px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 7, color: '#ef4444', cursor: 'pointer', flexShrink: 0 }}>
                Retry →
              </button>
            </div>
          )}

          {hasOutput && (
            <SaveToProduct toolId="website-generator" toolName="Website Generator" outputData={JSON.stringify(generatedData || rawResponse)} />
          )}
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-[600px] md:min-h-0">
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
                {hasOutput && genStartTime > 0 && !generating && (
                  <div style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(212,175,55,0.6)', fontFamily: 'Syne, sans-serif' }}>
                    Generated in {Math.round(elapsedMs / 1000)}s
                  </div>
                )}
                {savedStoreId && (
                  <div style={{ marginLeft: hasOutput && genStartTime > 0 && !generating ? 8 : 'auto', fontSize: 10, color: 'rgba(45,202,114,0.7)', fontFamily: 'Syne, sans-serif' }}>
                    ✓ Saved
                  </div>
                )}
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
                      {directHtml && (
                        <button onClick={handleDownloadHTML} className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: '#d4af37', fontFamily: 'Syne, sans-serif', cursor: 'pointer' }}>
                          <Download size={11} /> Download HTML
                        </button>
                      )}
                      <div className="flex items-center gap-1">
                        {(['desktop','tablet','mobile'] as const).map(d => (
                          <button key={d} onClick={() => { setPreviewDevice(d); setMobilePreview(d !== 'desktop'); }} style={{ padding: '4px 10px', fontSize: 11, borderRadius: 6, background: previewDevice === d ? 'rgba(212,175,55,0.15)' : 'transparent', border: `1px solid ${previewDevice === d ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.06)'}`, color: previewDevice === d ? '#d4af37' : 'rgba(240,237,232,0.4)', cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontWeight: 700, textTransform: 'capitalize' as const }}>{d === 'desktop' ? '🖥' : d === 'tablet' ? '📱' : '📲'} {d}</button>
                        ))}
                      </div>
                      {/* B4 — Theme switcher + Edit mode */}
                      {directHtml && (
                        <div className="ml-auto flex items-center gap-1 flex-wrap">
                          {(['dark','light','bold','muted'] as const).map(t => (
                            <button key={t} onClick={() => applyTheme(t)} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, fontFamily: 'Syne, sans-serif', background: activeTheme === t ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${activeTheme === t ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.08)'}`, color: activeTheme === t ? '#d4af37' : 'rgba(240,237,232,0.5)', cursor: 'pointer', textTransform: 'capitalize' as const }}>{t}</button>
                          ))}
                          <span style={{ fontSize: 11, color: 'rgba(240,237,232,0.3)', marginLeft: 4 }}>theme</span>
                          <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.08)', margin: '0 6px' }} />
                          <button
                            onClick={handleToggleEdit}
                            title="Click text to edit, click images to upload your own"
                            style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, fontFamily: 'Syne, sans-serif', background: editMode ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.04)', border: `1px solid ${editMode ? '#d4af37' : 'rgba(255,255,255,0.1)'}`, color: editMode ? '#d4af37' : 'rgba(240,237,232,0.5)', cursor: 'pointer' }}
                          >
                            ✏️ {editMode ? 'Editing...' : 'Edit'}
                          </button>
                          {editMode && (
                            <button
                              onClick={handleSaveEdits}
                              style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 800, fontFamily: 'Syne, sans-serif', background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.5)', color: '#d4af37', cursor: 'pointer' }}
                            >
                              💾 Save
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {(generatedData || directHtml) ? (
                      <div className={`flex-1 overflow-auto ${previewDevice !== 'desktop' ? 'flex justify-center' : ''}`} style={{ background: '#060608', padding: previewDevice !== 'desktop' ? '20px 0' : 0, display: 'flex', flexDirection: 'column' }}>
                        {/* Quick action bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                          <button
                            onClick={handleOpenPreviewNewTab}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 6, color: '#d4af37', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                            Full Screen
                          </button>
                          <button
                            onClick={handleDownloadHTML}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            Download
                          </button>
                          <span style={{ flex: 1 }} />
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
                            {previewDevice === 'desktop' ? '55% scale' : previewDevice}
                          </span>
                        </div>
                        <div style={previewDevice !== 'desktop'
                          ? { width: previewDevice === 'tablet' ? 768 : 390, flexShrink: 0, margin: '0 auto' }
                          : { flex: 1, overflow: 'hidden', position: 'relative' }
                        }>
                          {previewDevice === 'desktop' ? (
                            // Desktop: scaled 55% view showing full 1440px store
                            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
                              <iframe
                                title="Store Preview"
                                style={{
                                  width: 1440,
                                  height: '181.8%', // 100/0.55 = 181.8%
                                  transform: 'scale(0.55)',
                                  transformOrigin: 'top left',
                                  border: 'none',
                                  pointerEvents: 'none',
                                  display: 'block',
                                }}
                                sandbox="allow-scripts allow-same-origin allow-popups"
                                ref={previewIframeRef}
                              />
                            </div>
                          ) : (
                            <iframe
                              title="Store Preview"
                              className="border-0"
                              style={{
                                width: DEVICE_WIDTHS[previewDevice],
                                maxWidth: '100%',
                                margin: '0 auto',
                                display: 'block',
                                height: previewDevice === 'mobile' ? 844 : 1024,
                                borderRadius: 20,
                                border: '2px solid rgba(255,255,255,0.12)',
                                boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
                                animation: 'mjk-fadeIn 0.4s ease',
                              }}
                              sandbox="allow-scripts allow-same-origin allow-popups"
                              ref={previewIframeRef}
                            />
                          )}
                        </div>
                        {/* B3 — Headline variants panel */}
                        {headlines && directHtml && (
                          <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, zIndex: 10 }}>
                            <div style={{ padding: '16px 20px', background: 'rgba(12,14,18,0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 12 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(240,237,232,0.4)', fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Headline Variants — click to swap</div>
                              {[
                                { key: 'painPoint', label: 'Pain-point', value: headlines.painPoint },
                                { key: 'benefit', label: 'Benefit-led', value: headlines.benefit },
                                { key: 'socialProof', label: 'Social proof', value: headlines.socialProof },
                              ].map(({ key, label, value }) => (
                                <button key={key} onClick={() => {
                                  const newHtml = directHtml.replace(/<h1[^>]*>[\s\S]*?<\/h1>/, `<h1 style="font-size:clamp(44px,7vw,72px);font-weight:900;color:#fff;margin:0 0 24px;line-height:1.08">${value}</h1>`);
                                  setDirectHtml(newHtml);
                                }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', marginBottom: 6, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', color: 'rgba(240,237,232,0.75)', fontSize: 13 }}>
                                  <span style={{ fontSize: 11, color: '#d4af37', fontWeight: 700, display: 'block', marginBottom: 3 }}>{label}</span>
                                  {value}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
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
                      {(directHtml || rawResponse || generatedData) ? (
                        <Suspense fallback={<pre className="text-xs p-4" style={{ color: 'rgba(240,237,232,0.7)', fontFamily: 'monospace', background: '#080a0e', minHeight: '100%' }}>{directHtml || rawResponse || previewHTML}</pre>}>
                          <SyntaxHighlighter
                            language="html"
                            style={vscDarkPlus ?? {}}
                            customStyle={{ margin: 0, background: 'transparent', fontSize: 12, lineHeight: 1.5, padding: 16, minHeight: '100%' }}
                            wrapLines
                            wrapLongLines
                          >
                            {directHtml || rawResponse || previewHTML || ''}
                          </SyntaxHighlighter>
                        </Suspense>
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
                  <div className="h-full overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: 'thin' }}>
                    {/* 1-Click Deploy Section */}
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#d4af37', fontFamily: 'Syne, sans-serif' }}>🚀 Deploy Your Store</div>
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        {/* Vercel Deploy Button */}
                        <div className="col-span-3 sm:col-span-1">
                          <button
                            onClick={handleVercelDeploy}
                            disabled={!generatedData || vercelDeploying}
                            className="w-full p-4 rounded-xl text-left transition-all disabled:opacity-40 flex flex-col gap-2"
                            style={{ background: '#000', border: '1px solid rgba(255,255,255,0.15)', cursor: (!generatedData || vercelDeploying) ? 'not-allowed' : 'pointer' }}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-black text-base">▲</span>
                              <span className="text-sm font-black" style={{ fontFamily: 'Syne, sans-serif', color: '#fff' }}>
                                {vercelDeploying ? 'Deploying…' : vercelResult ? 'Re-deploy' : 'Deploy to Vercel'}
                              </span>
                              {vercelDeploying && <Loader2 size={13} className="animate-spin ml-auto" style={{ color: 'rgba(255,255,255,0.6)' }} />}
                            </div>
                            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Live in ~30 seconds</div>
                          </button>
                        </div>
                        {/* Netlify — Available Soon */}
                        <div className="col-span-3 sm:col-span-1" title="Available soon">
                          <button
                            disabled
                            className="w-full p-4 rounded-xl text-left flex flex-col gap-2"
                            style={{ background: 'rgba(0,173,164,0.1)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'not-allowed', opacity: 0.55 }}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-black text-base">◆</span>
                              <span className="text-sm font-black" style={{ fontFamily: 'Syne, sans-serif', color: '#6b7280' }}>Netlify</span>
                            </div>
                            <div className="text-xs" style={{ color: '#6b7280' }}>Available soon</div>
                          </button>
                        </div>
                        {/* Shopify Export */}
                        <div className="col-span-3 sm:col-span-1">
                          <button
                            onClick={handleShopifyExport}
                            disabled={!generatedData}
                            className="w-full p-4 rounded-xl text-left transition-all disabled:opacity-40 flex flex-col gap-2"
                            style={{ background: 'rgba(150,191,74,0.1)', border: '1px solid rgba(150,191,74,0.2)', cursor: !generatedData ? 'not-allowed' : 'pointer' }}
                          >
                            <div className="flex items-center gap-2">
                              <ShoppingBag size={14} style={{ color: '#96bf4a' }} />
                              <span className="text-sm font-black" style={{ fontFamily: 'Syne, sans-serif', color: '#96bf4a' }}>Shopify CSV</span>
                            </div>
                            <div className="text-xs" style={{ color: 'rgba(150,191,74,0.6)' }}>Download CSV</div>
                          </button>
                        </div>
                      </div>

                      {/* Vercel Result / Error */}
                      {vercelResult && (
                        <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.3)' }}>
                          <div className="flex items-center gap-2 text-sm font-bold" style={{ color: '#4ade80', fontFamily: 'Syne, sans-serif' }}>
                            <Check size={14} /> Deployed successfully!
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <a
                              href={vercelResult.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg"
                              style={{ background: '#d4af37', color: '#0c0e12', textDecoration: 'none', fontFamily: 'Syne, sans-serif' }}
                            >
                              <ExternalLink size={11} /> 🌐 Visit Store →
                            </a>
                            <button
                              onClick={() => { navigator.clipboard.writeText(vercelResult.url); toast.success('URL copied!'); }}
                              className="text-xs px-3 py-2 rounded-lg flex items-center gap-1"
                              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(240,237,232,0.6)', cursor: 'pointer' }}
                            >
                              <Copy size={10} /> Copy URL
                            </button>
                          </div>
                          <div className="text-xs font-mono truncate" style={{ color: 'rgba(240,237,232,0.4)' }}>{vercelResult.url}</div>
                        </div>
                      )}
                      {vercelError && (
                        <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: 'rgba(255,100,100,0.08)', border: '1px solid rgba(255,100,100,0.2)' }}>
                          <AlertTriangle size={13} style={{ color: '#f87171', flexShrink: 0, marginTop: 1 }} />
                          <div>
                            <div className="text-xs font-bold mb-0.5" style={{ color: '#f87171' }}>Deployment failed</div>
                            <div className="text-xs" style={{ color: 'rgba(255,150,150,0.8)' }}>{vercelError}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

                    {/* Download Options */}
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(240,237,232,0.4)', fontFamily: 'Syne, sans-serif' }}>Download & Export</div>
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

                      {/* Download Manifest */}
                      {storeManifest && (
                        <button onClick={() => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([storeManifest], { type: 'application/json' })); a.download = 'manifest.json'; a.click(); }} className="p-5 rounded-xl text-left transition-all" style={{ background: 'rgba(59,130,246,0.05)', border: '1.5px solid rgba(59,130,246,0.2)', cursor: 'pointer' }}>
                          <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.12)' }}><span style={{ fontSize: 20 }}>📱</span></div>
                          <div className="text-sm font-black mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>Download manifest.json</div>
                          <div className="text-xs leading-relaxed" style={{ color: 'rgba(240,237,232,0.4)' }}>PWA manifest for your store — enables "Add to Home Screen" on mobile.</div>
                        </button>
                      )}

                      {/* B5a — Copy Embed Code */}
                      <button onClick={() => { navigator.clipboard.writeText(`<iframe src="your-store-url" width="100%" height="800" frameborder="0" style="border:none;border-radius:12px;"></iframe>`); toast.success('Embed code copied!'); }} disabled={!generatedData} className="p-5 rounded-xl text-left transition-all disabled:opacity-40" style={{ background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>
                        <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.12)' }}><Code2 size={20} style={{ color: '#d4af37' }} /></div>
                        <div className="text-sm font-black mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>Copy Embed Code</div>
                        <div className="text-xs leading-relaxed" style={{ color: 'rgba(240,237,232,0.4)' }}>Embed your store in Shopify, Wix, or any website via iframe.</div>
                      </button>

                      {/* B5b — Download Bundle */}
                      <button onClick={handleDownloadFullBundle} disabled={!directHtml} className="p-5 rounded-xl text-left transition-all disabled:opacity-40" style={{ background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>
                        <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.12)' }}><Package size={20} style={{ color: '#d4af37' }} /></div>
                        <div className="text-sm font-black mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>Download Bundle (3 files)</div>
                        <div className="text-xs leading-relaxed" style={{ color: 'rgba(240,237,232,0.4)' }}>HTML + manifest.json + README — everything to deploy.</div>
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
            /* ── Empty / Loading state — Task 1 + Task 5 ── */
            <div className="flex-1 flex flex-col items-center justify-center p-8" style={{ overflow: 'auto' }}>
              <style>{`
                @keyframes mjk-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
                @keyframes mjk-fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
              `}</style>
              {generating ? (
                /* Task 5 — Progress overlay */
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: 520, gap: 20 }}>
                  <div style={{ width: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', background: '#d4af37', width: `${genProgress}%`, transition: 'width 0.6s ease', borderRadius: 2 }} />
                    </div>
                    <div style={{ padding: '28px 32px', textAlign: 'center' }}>
                      <div style={{ fontSize: 32, marginBottom: 12 }}>&#9889;</div>
                      <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: '#f0ede8', marginBottom: 8 }}>{genProgress}%</div>
                      <div style={{ fontSize: 14, color: 'rgba(240,237,232,0.6)', marginBottom: 20 }}>
                        {(() => {
                          const PM: Record<number, string> = { 5: 'Fetching product images...', 10: 'Building your brand brief...', 15: 'Warming up the AI...', 20: 'Writing your store copy...', 30: 'Crafting the hero section...', 50: 'Designing your layout...', 70: 'Adding product pages...', 90: 'Finishing touches...', 98: 'Assembling final store...', 100: 'Your store is ready!' };
                          const keys = Object.keys(PM).map(Number).sort((a, b) => b - a);
                          for (const k of keys) { if (genProgress >= k) return PM[k]; }
                          return 'Starting...';
                        })()}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left' }}>
                        {progressSteps.map((step, i) => {
                          const isCurrent = !step.done && (i === 0 || progressSteps[i - 1]?.done);
                          return (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, background: step.done ? 'rgba(212,175,55,0.06)' : isCurrent ? 'rgba(212,175,55,0.03)' : 'transparent' }}>
                              <div style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, border: `1.5px solid ${step.done ? '#d4af37' : isCurrent ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: step.done ? '#d4af37' : 'transparent' }}>
                                {step.done ? '\u2713' : ''}
                              </div>
                              <span style={{ fontSize: 12, color: step.done ? '#d4af37' : isCurrent ? 'rgba(240,237,232,0.8)' : 'rgba(240,237,232,0.35)' }}>{step.label}</span>
                              {isCurrent && <Loader2 size={11} className="animate-spin" style={{ color: '#d4af37', marginLeft: 'auto' }} />}
                            </div>
                          );
                        })}
                      </div>
                      {genStartTime > 0 && (
                        <div style={{ marginTop: 16, fontSize: 11, color: 'rgba(240,237,232,0.3)', fontFamily: 'Syne, sans-serif' }}>
                          Elapsed: {Math.round(elapsedMs / 1000)}s
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Task 1 — Live Skeleton Preview */
                (() => {
                  const tpl = WEBSITE_TEMPLATES.find(t => t.id === premiumTemplateId) || WEBSITE_TEMPLATES[0];
                  const skBg = tpl.palette.bg;
                  const skAccent = tpl.palette.accent;
                  const skText = tpl.palette.text;
                  const skName = livePreviewStoreName || storeName || 'Your Store';
                  return (
                    <div style={{ width: '100%', maxWidth: 520, animation: 'mjk-fadeIn 0.4s ease' }}>
                      <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: skBg }}>
                        <div style={{ height: 28, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px' }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5f56' }} />
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffbd2e' }} />
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#27c93f' }} />
                          <div style={{ flex: 1, height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.06)', marginLeft: 12 }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: `1px solid ${skAccent}20` }}>
                          <div style={{ fontSize: 13, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: skAccent }}>{skName}</div>
                          <div style={{ display: 'flex', gap: 12 }}>
                            {['Home', 'Shop', 'About'].map(l => <div key={l} style={{ fontSize: 10, color: skText + '60' }}>{l}</div>)}
                            <div style={{ padding: '3px 10px', borderRadius: 4, background: skAccent, fontSize: 9, fontWeight: 700, color: skBg }}>Cart</div>
                          </div>
                        </div>
                        <div style={{ padding: '32px 24px', background: `linear-gradient(135deg, ${skBg}, ${skAccent}12)` }}>
                          <div style={{ width: '75%', height: 18, borderRadius: 4, background: skAccent + '40', marginBottom: 10, position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, transparent, ${skAccent}30, transparent)`, animation: 'mjk-shimmer 2s ease-in-out infinite' }} />
                          </div>
                          <div style={{ width: '55%', height: 10, borderRadius: 3, background: skText + '15', marginBottom: 18 }} />
                          <div style={{ display: 'flex', gap: 8 }}>
                            <div style={{ padding: '6px 16px', borderRadius: 6, background: skAccent, fontSize: 9, fontWeight: 700, color: skBg }}>Shop Now</div>
                            <div style={{ padding: '6px 16px', borderRadius: 6, border: `1px solid ${skAccent}50`, fontSize: 9, color: skAccent }}>Learn More</div>
                          </div>
                        </div>
                        <div style={{ padding: '16px 20px' }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: skText + '40', marginBottom: 10, fontFamily: 'Syne, sans-serif', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Products</div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                            {[0, 1, 2].map(idx => (
                              <div key={idx} style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${skText}10` }}>
                                <div style={{ aspectRatio: '1', background: skText + '08', position: 'relative', overflow: 'hidden' }}>
                                  <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, transparent, ${skText}08, transparent)`, animation: `mjk-shimmer 2s ease-in-out ${idx * 0.3}s infinite` }} />
                                </div>
                                <div style={{ padding: 8 }}>
                                  <div style={{ width: '80%', height: 6, borderRadius: 2, background: skText + '15', marginBottom: 4 }} />
                                  <div style={{ width: '40%', height: 8, borderRadius: 2, background: skAccent + '30' }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div style={{ padding: '12px 20px', borderTop: `1px solid ${skText}08` }}>
                          <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
                            {[0, 1, 2].map(idx => (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 20, height: 20, borderRadius: '50%', background: skAccent + '20' }} />
                                <div>
                                  <div style={{ width: 40, height: 4, borderRadius: 2, background: skText + '12', marginBottom: 3 }} />
                                  <div style={{ width: 28, height: 3, borderRadius: 2, background: skText + '08' }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', padding: '10px 0 14px' }}>
                          {[skBg, skAccent, skText].map((c, idx) => (
                            <div key={idx} style={{ width: 18, height: 18, borderRadius: '50%', background: c, border: '1.5px solid rgba(255,255,255,0.15)' }} />
                          ))}
                        </div>
                      </div>
                      <div style={{ textAlign: 'center', marginTop: 16 }}>
                        <div className="text-xs" style={{ color: 'rgba(240,237,232,0.35)' }}>
                          Fill in a niche and hit <strong style={{ color: 'rgba(212,175,55,0.6)' }}>Generate</strong> to build your store.
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Cursor Modal ── */}      {/* ── Cursor Modal ── */}
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

      {/* ── Maya Contextual Bar ── */}
      {(() => {
        const shopPushUrl = shopifyPushResult?.storeUrl || (shopifyShop ? `https://${shopifyShop}` : null);
        const suggestion = shopifyPushResult?.success && shopPushUrl
          ? { text: 'View your live store →', href: shopPushUrl, external: true }
          : directHtml
            ? { text: `Calculate margin for "${(storeName || niche || 'your store').slice(0, 22)}" →`, href: `/app/profit-check?store=${encodeURIComponent(storeName || niche || '')}`, external: false }
            : importedProduct
              ? { text: `Find suppliers for "${(importedProduct.title || '').slice(0, 28)}" →`, href: `/app/suppliers?q=${encodeURIComponent(importedProduct.title || '')}`, external: false }
              : { text: 'Paste a product URL above to get started', href: null, external: false };

        return (
          <div style={{
            height: 44, borderTop: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(8,10,14,0.97)', display: 'flex', alignItems: 'center',
            paddingLeft: 16, paddingRight: 16, gap: 10, flexShrink: 0,
          }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 }}>🤖</div>
            <span style={{ fontSize: 11, color: 'rgba(240,237,232,0.4)', fontFamily: 'DM Sans, sans-serif', marginRight: 4, flexShrink: 0 }}>Maya</span>
            {suggestion.href ? (
              <a
                href={suggestion.href}
                {...(suggestion.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                style={{ fontSize: 12, color: '#d4af37', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                {suggestion.text}
              </a>
            ) : (
              <span style={{ fontSize: 12, color: 'rgba(240,237,232,0.4)', fontFamily: 'DM Sans, sans-serif' }}>{suggestion.text}</span>
            )}
          </div>
        );
      })()}
    </div>
  );
}

// ── System Prompt Builder ─────────────────────────────────────────────────────
function buildSystemPrompt(vibe: string, platform: Platform, accentColor: string): string {
  return `You are a world-class Shopify store designer and AU copywriter. Return ONLY valid JSON — no markdown, no code fences, no explanation text. Start with { and end with }.

CRITICAL RULE: If PRODUCT DATA is provided in the user message, write ALL copy specifically for THAT product. Every word of copy — headline, features, testimonials, FAQs — must be specific to that actual product. DO NOT write generic placeholder content. DO NOT make up a different product.

Return this exact JSON structure (all keys required):
{
  "storeName": "string — brand name for this specific product/niche",
  "tagline": "string — punchy 8-word max tagline specific to the product",
  "headline": "string — hero H1 based on the product's #1 benefit, max 10 words, bold and specific",
  "subheadline": "string — 1-2 sentences: who this product is for + the outcome they get",
  "features": [
    { "title": "string — specific product feature, not generic", "description": "string — 1 concrete sentence about this feature" },
    { "title": "string — specific product feature", "description": "string — 1 concrete sentence" },
    { "title": "string — specific product feature", "description": "string — 1 concrete sentence" }
  ],
  "ctaText": "string — action verb + outcome, e.g. 'Shop Now', 'Get Yours Today'",
  "brandStory": "string — 2-3 sentences, AU brand mission connected to this specific product category",
  "metaTitle": "string — SEO title 60 chars max, include product type + AU",
  "metaDescription": "string — SEO description 155 chars max, specific to this product",
  "primaryColor": "${accentColor || '#d4af37'}",
  "secondaryColor": "#hexcode",
  "fontStyle": "${vibe || 'modern'}",
  "heroImageKeyword": "string — 3-word description of the product for image search",
  "productBenefits": ["string — specific benefit from product features", "string — specific benefit 2", "string — specific benefit 3", "string — specific benefit 4", "string — specific benefit 5"],
  "testimonials": [
    { "name": "Jordan K.", "text": "string — 1-2 sentences referencing this specific product type and a real result", "location": "Brisbane" },
    { "name": "Sarah M.", "text": "string — 1-2 sentences referencing this specific product", "location": "Sydney" },
    { "name": "Marcus T.", "text": "string — 1-2 sentences referencing this specific product", "location": "Melbourne" }
  ],
  "faqs": [
    { "question": "Do you ship to all of Australia?", "answer": "string — AU shipping answer with AusPost and business day timeframes" },
    { "question": "string — product-specific question e.g. about sizing/fit/compatibility", "answer": "string — specific answer about this product" },
    { "question": "What is your return policy?", "answer": "string — ACCC-compliant 30-day return policy" },
    { "question": "string — another product-specific FAQ", "answer": "string — specific answer" }
  ]
}

Platform: ${platform}. Vibe: ${vibe || 'premium'}.
RULES:
- Copy must be authentically Australian — direct, confident, no American corporate speak
- Use AUD pricing. Mention Afterpay where relevant
- All 3 testimonials MUST reference the specific product and have Brisbane, Sydney, Melbourne as locations
- Features must come from the actual product — not "fast shipping" or "great quality" filler
- If product has specific sizes/materials/tech (e.g. "squat-proof", "4-way stretch", "80% nylon") — mention them`;
}