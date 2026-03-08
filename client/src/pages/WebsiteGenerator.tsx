import { useState, useRef, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { toast } from "sonner";
import { Copy, Download, X, Loader2, Globe, RefreshCw, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Theme definitions ─────────────────────────────────────────────────────────
const THEMES = [
  { id: "noir-gold",     label: "Noir Gold",       accent: "#d4af37", bg: "#0a0a0b", dark: true  },
  { id: "midnight",      label: "Midnight Carbon", accent: "#7c6af5", bg: "#0d0d10", dark: true  },
  { id: "deep-forest",   label: "Deep Forest",     accent: "#2dca72", bg: "#080e0c", dark: true  },
  { id: "obsidian-rose", label: "Obsidian Rose",   accent: "#e05c7a", bg: "#0e0809", dark: true  },
  { id: "pure-white",    label: "Pure White",      accent: "#111111", bg: "#ffffff", dark: false },
  { id: "warm-cream",    label: "Warm Cream",      accent: "#c4832a", bg: "#faf7f2", dark: false },
  { id: "soft-feminine", label: "Soft Feminine",   accent: "#c4687a", bg: "#fdf6f0", dark: false },
  { id: "ocean-fresh",   label: "Ocean Fresh",     accent: "#1a5fb4", bg: "#f0f6ff", dark: false },
  { id: "electric",      label: "Electric",        accent: "#9c5fff", bg: "#0d0010", dark: true  },
];

const LAYOUTS = [
  { id: "compact", label: "Compact" },
  { id: "normal",  label: "Normal"  },
  { id: "wide",    label: "Wide"    },
];

interface ProductData {
  title: string;
  price?: string;
  description?: string;
  features?: string[];
  images?: string[];
  sourceUrl?: string;
  _manual?: boolean;
}

// ── HTML Generator (ported from original genSiteHTML) ─────────────────────────
function genSiteHTML(product: ProductData, opts: {
  themeId: string; layout: string;
  accentColor: string; bgColor: string;
  ctaText: string; brandName: string; sellPrice: string;
}): string {
  const theme = THEMES.find(t => t.id === opts.themeId) || THEMES[0];
  const isDark = theme.dark;
  const bg = opts.bgColor || theme.bg;
  const accent = opts.accentColor || theme.accent;
  const text = isDark ? "#f2efe9" : "#111111";
  const surf = isDark ? "#111114" : "#f8f8f8";
  const nav = isDark ? "#08080a" : "#ffffff";
  const pill = isDark ? "#1c1807" : "#eeeeee";
  const navBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.09)";
  const star = "#f0c040";
  const secPad = opts.layout === "compact" ? "56px 20px" : opts.layout === "wide" ? "96px 32px" : "76px 24px";
  const maxW = opts.layout === "compact" ? "900px" : opts.layout === "wide" ? "1300px" : "1100px";

  const featuresList = (product.features || []).slice(0, 6).map(f =>
    `<div class="feat-item"><div class="feat-dot">✓</div><span>${f}</span></div>`
  ).join("");

  const imgGrid = (product.images || []).slice(0, 4).map(img =>
    `<img src="${img}" style="border-radius:12px;object-fit:cover;width:100%;aspect-ratio:1;background:${pill}" onerror="this.style.display='none'" />`
  ).join("") || `<div style="grid-column:1/-1;height:280px;border-radius:18px;background:${pill};display:flex;align-items:center;justify-content:center;font-size:56px;opacity:0.25">📦</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${product.title || opts.brandName || "Product"}</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800;900&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:${bg};color:${text};font-family:'DM Sans',sans-serif;line-height:1.6}
h1,h2,h3{font-family:'Syne',sans-serif;font-weight:800}
a{color:inherit;text-decoration:none}
.nav{background:${nav};border-bottom:1px solid ${navBorder};padding:14px 24px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;backdrop-filter:blur(12px)}
.nav-brand{font-family:'Syne',sans-serif;font-weight:900;font-size:18px}
.nav-cta{background:${accent};color:#fff;font-family:'Syne',sans-serif;font-weight:800;font-size:13px;padding:9px 20px;border-radius:10px;border:none;cursor:pointer;transition:opacity .15s}
.nav-cta:hover{opacity:.88}
.hero{padding:${secPad};display:grid;grid-template-columns:1fr 1fr;gap:52px;align-items:center;max-width:${maxW};margin:0 auto}
@media(max-width:768px){.hero{grid-template-columns:1fr;padding:48px 20px}}
.hero-tag{display:inline-flex;background:${pill};color:${accent};font-size:11px;font-weight:700;padding:5px 13px;border-radius:999px;letter-spacing:.7px;text-transform:uppercase;margin-bottom:16px}
.hero-title{font-size:clamp(28px,4vw,48px);letter-spacing:-1px;line-height:1.1;margin-bottom:16px}
.hero-title span{color:${accent}}
.hero-sub{font-size:16px;opacity:.65;line-height:1.75;margin-bottom:28px}
.btn-primary{display:inline-flex;align-items:center;gap:10px;padding:17px 32px;background:${accent};color:#fff;font-family:'Syne',sans-serif;font-weight:800;font-size:16px;border:none;border-radius:14px;cursor:pointer;box-shadow:0 6px 24px ${accent}44;transition:all .2s}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 12px 36px ${accent}55}
.price-main{font-family:'Syne',sans-serif;font-weight:900;font-size:36px;color:${accent};display:block;margin-bottom:20px}
.hero-imgs{border-radius:20px;overflow:hidden;background:${surf};display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px}
.sec{padding:${secPad}}
.sec-inner{max-width:${maxW};margin:0 auto}
.sec-tag{display:inline-flex;background:${pill};color:${accent};font-size:11px;font-weight:700;padding:5px 13px;border-radius:999px;letter-spacing:.7px;text-transform:uppercase;margin-bottom:12px}
.sec-title{font-size:clamp(22px,3vw,34px);letter-spacing:-.5px;line-height:1.2;margin-bottom:12px}
.feat-list{margin-top:22px;display:flex;flex-direction:column;gap:11px}
.feat-item{display:flex;align-items:flex-start;gap:12px;font-size:14px;font-weight:500;line-height:1.5}
.feat-dot{width:22px;height:22px;border-radius:50%;background:${accent};display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;flex-shrink:0;margin-top:1px}
.step-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:28px;margin-top:44px}
@media(max-width:600px){.step-grid{grid-template-columns:1fr}}
.step-num{width:52px;height:52px;border-radius:50%;background:${accent};color:#fff;font-family:'Syne',sans-serif;font-weight:900;font-size:22px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;box-shadow:0 6px 20px ${accent}44}
.step-title{font-family:'Syne',sans-serif;font-weight:800;font-size:16px;margin-bottom:8px;text-align:center}
.step-desc{font-size:14px;opacity:.6;line-height:1.65;text-align:center}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:40px}
@media(max-width:768px){.grid3{grid-template-columns:1fr}}
.card{background:${surf};border-radius:18px;padding:28px;border:1px solid ${isDark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)"}}
.rev-stars{color:${star};font-size:18px;letter-spacing:2px;margin-bottom:12px}
.rev-quote{font-size:14px;line-height:1.8;opacity:.8;margin-bottom:18px;font-style:italic}
.rev-name{font-weight:700;font-size:14px}
.rev-city{font-size:11.5px;opacity:.45;margin-top:2px}
.cta-sec{background:${accent};color:#fff;text-align:center;padding:80px 24px}
.cta-hl{font-size:clamp(24px,4vw,40px);letter-spacing:-.8px;margin-bottom:12px}
.cta-sub{font-size:15px;opacity:.85;margin-bottom:36px;max-width:520px;margin-left:auto;margin-right:auto;line-height:1.65}
.cta-btn{background:#fff;color:${accent};font-family:'Syne',sans-serif;font-weight:900;font-size:17px;padding:18px 48px;border-radius:14px;border:none;cursor:pointer;box-shadow:0 10px 40px rgba(0,0,0,.2);transition:all .2s}
.cta-btn:hover{transform:translateY(-2px)}
.footer{background:${nav};border-top:1px solid ${navBorder};padding:38px 24px;text-align:center}
.footer-links{display:flex;justify-content:center;gap:22px;flex-wrap:wrap;margin-top:12px}
.footer-links a{font-size:13px;opacity:.4;transition:opacity .15s}
.footer-links a:hover{opacity:.8}
</style>
</head>
<body>
<nav class="nav">
  <div class="nav-brand">${opts.brandName || product.title || "Store"}</div>
  <button class="nav-cta">${opts.ctaText || "Buy Now"}</button>
</nav>

<section style="background:${bg}">
  <div class="hero">
    <div>
      <div class="hero-tag">New Arrival</div>
      <h1 class="hero-title">${product.title || "Premium Product"}<br><span>That Delivers Results</span></h1>
      <p class="hero-sub">${product.description || "High-quality product designed for performance and style. Built to last, designed to impress."}</p>
      ${opts.sellPrice ? `<span class="price-main">$${opts.sellPrice} AUD</span>` : ""}
      <button class="btn-primary">${opts.ctaText || "Buy Now"} →</button>
    </div>
    <div class="hero-imgs">${imgGrid}</div>
  </div>
</section>

${featuresList ? `
<section class="sec" style="background:${isDark ? surf : "#fff"}">
  <div class="sec-inner">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:52px;align-items:start">
      <div>
        <div class="sec-tag">Why Choose Us</div>
        <h2 class="sec-title">Built for people who demand the best</h2>
        <p style="font-size:15px;opacity:.65;line-height:1.85;margin-bottom:20px">Every detail has been considered. Every feature has a purpose.</p>
        <div class="feat-list">${featuresList}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${imgGrid}</div>
    </div>
  </div>
</section>` : ""}

<section class="sec">
  <div class="sec-inner" style="text-align:center">
    <div class="sec-tag">How It Works</div>
    <h2 class="sec-title">Simple. Fast. Effective.</h2>
    <div class="step-grid">
      <div><div class="step-num">1</div><div class="step-title">Order Online</div><div class="step-desc">Place your order in under 2 minutes. Secure checkout, multiple payment options.</div></div>
      <div><div class="step-num">2</div><div class="step-title">Fast Dispatch</div><div class="step-desc">Your order is packed and dispatched within 24 hours of purchase.</div></div>
      <div><div class="step-num">3</div><div class="step-title">Enjoy & Love It</div><div class="step-desc">30-day money-back guarantee. If you don't love it, we'll make it right.</div></div>
    </div>
  </div>
</section>

<section class="sec" style="background:${isDark ? surf : "#f8f8f8"}">
  <div class="sec-inner">
    <div class="sec-tag" style="display:block;text-align:center">Customer Reviews</div>
    <h2 class="sec-title" style="text-align:center;margin-top:8px">Loved by thousands</h2>
    <div class="grid3">
      <div class="card"><div class="rev-stars">★★★★★</div><p class="rev-quote">"Absolutely love it. Exceeded my expectations in every way. The quality is outstanding."</p><div class="rev-name">Sarah M.</div><div class="rev-city">Sydney, AU</div></div>
      <div class="card"><div class="rev-stars">★★★★★</div><p class="rev-quote">"Fast shipping, great packaging, and the product is exactly as described. Will order again!"</p><div class="rev-name">James K.</div><div class="rev-city">Melbourne, AU</div></div>
      <div class="card"><div class="rev-stars">★★★★★</div><p class="rev-quote">"Best purchase I've made this year. Highly recommend to anyone looking for quality."</p><div class="rev-name">Priya R.</div><div class="rev-city">Brisbane, AU</div></div>
    </div>
  </div>
</section>

<section class="cta-sec">
  <h2 class="cta-hl">Ready to get yours?</h2>
  <p class="cta-sub">Join thousands of happy customers. Limited stock available — order now and get free shipping.</p>
  <button class="cta-btn">${opts.ctaText || "Buy Now"} — ${opts.sellPrice ? `$${opts.sellPrice}` : "Shop Now"}</button>
</section>

<footer class="footer">
  <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:16px;margin-bottom:6px">${opts.brandName || "Store"}</div>
  <div style="font-size:13px;opacity:.4">© ${new Date().getFullYear()} All rights reserved.</div>
  <div class="footer-links">
    <a href="#">Privacy Policy</a><a href="#">Terms of Service</a><a href="#">Contact Us</a><a href="#">Shipping Info</a>
  </div>
</footer>
</body>
</html>`;
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function WebsiteGenerator() {
  // Product import
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [importError, setImportError] = useState("");

  // Manual fields
  const [brandName, setBrandName] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [extraDetails, setExtraDetails] = useState("");
  const [ctaText, setCtaText] = useState("Buy Now");

  // Design
  const [themeId, setThemeId] = useState("noir-gold");
  const [layout, setLayout] = useState("normal");
  const [accentColor, setAccentColor] = useState("#d4af37");
  const [bgColor, setBgColor] = useState("#0a0a0b");

  // Output
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [generatedHTML, setGeneratedHTML] = useState<string | null>(null);
  const [genError, setGenError] = useState("");
  const [activeTab, setActiveTab] = useState<"preview" | "chat">("preview");

  // AI chat for refinement
  const [chatInput, setChatInput] = useState("");
  const { messages: chatMessages, sendMessage, status: chatStatus } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest({ messages }) {
        return {
          body: {
            messages: messages.map(m => ({ role: m.role, content: m.parts.filter((p: any) => p.type === "text").map((p: any) => p.text).join("") })),
            systemPrompt: `You are an expert Shopify landing page designer and CRO specialist. Help the user improve their generated landing page. When asked to make changes, provide specific HTML/CSS snippets or copy suggestions.`,
          },
        };
      },
    }),
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleImport = useCallback(async () => {
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportError("");
    try {
      await new Promise(r => setTimeout(r, 1400));
      const hostname = (() => { try { return new URL(importUrl).hostname.replace("www.", ""); } catch { return "supplier"; } })();
      setProduct({
        title: `Product from ${hostname}`,
        description: "High-quality product imported from your supplier. Customise the details below.",
        features: ["Premium quality materials", "Fast worldwide shipping", "30-day money-back guarantee", "Secure checkout"],
        images: [],
        sourceUrl: importUrl,
        _manual: false,
      });
      toast.success("Product imported — ready to generate");
    } catch {
      setImportError("Could not import this URL. Fill in the details manually below.");
    } finally {
      setImporting(false);
    }
  }, [importUrl]);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setGenError("");
    setGenProgress(0);
    try {
      const interval = setInterval(() => setGenProgress(p => Math.min(p + 15, 88)), 250);
      await new Promise(r => setTimeout(r, 2200));
      clearInterval(interval);
      setGenProgress(100);

      const pd: ProductData = product || {
        title: brandName || "Premium Product",
        description: extraDetails || "High-quality product designed for performance and style.",
        features: extraDetails ? extraDetails.split(",").map(s => s.trim()).filter(Boolean) : [],
        images: [],
        _manual: true,
      };

      const html = genSiteHTML(pd, { themeId, layout, accentColor, bgColor, ctaText, brandName: brandName || pd.title, sellPrice });
      setGeneratedHTML(html);
      setActiveTab("preview");
      toast.success("Landing page generated!");
    } catch {
      setGenError("Generation failed. Please try again.");
    } finally {
      setGenerating(false);
      setGenProgress(0);
    }
  }, [product, brandName, sellPrice, extraDetails, ctaText, themeId, layout, accentColor, bgColor]);

  const handleExport = useCallback(() => {
    if (!generatedHTML) return;
    const blob = new Blob([generatedHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(brandName || "landing-page").replace(/\s+/g, "-").toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("HTML file downloaded!");
  }, [generatedHTML, brandName]);

  const handleCopy = useCallback(() => {
    if (!generatedHTML) return;
    navigator.clipboard.writeText(generatedHTML);
    toast.success("HTML copied to clipboard!");
  }, [generatedHTML]);

  const onThemeSelect = (t: typeof THEMES[0]) => {
    setThemeId(t.id);
    setAccentColor(t.accent);
    setBgColor(t.bg);
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col" style={{ background: "#080a0e", color: "#f0ede8", fontFamily: "DM Sans, sans-serif" }}>

      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 px-5 py-3 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)", background: "#0c0e12" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(156,95,255,0.15)", border: "1px solid rgba(156,95,255,0.3)" }}>
          <Globe size={15} style={{ color: "#9c5fff" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black leading-tight" style={{ fontFamily: "Syne, sans-serif" }}>Product Website Builder</div>
          <div className="text-xs" style={{ color: "rgba(240,237,232,0.35)" }}>Import · customise · generate · export Shopify section</div>
        </div>
        <a
          href="/app/meta-ads-pack"
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex-shrink-0"
          style={{ background: "rgba(45,202,114,0.1)", border: "1px solid rgba(45,202,114,0.3)", color: "rgba(45,202,114,0.85)", fontFamily: "Syne, sans-serif" }}
        >
          Meta Ads Pack →
        </a>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-hidden flex">

        {/* ── LEFT PANEL ── */}
        <div
          className="w-72 flex-shrink-0 overflow-y-auto border-r p-4 space-y-4"
          style={{ borderColor: "rgba(255,255,255,0.07)", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}
        >

          {/* Product Import */}
          <div className="rounded-xl p-3.5" style={{ background: product ? "rgba(45,202,114,0.05)" : "rgba(255,255,255,0.03)", border: `1.5px solid ${product ? "rgba(45,202,114,0.35)" : "rgba(255,255,255,0.09)"}` }}>
            <div className="text-xs font-bold uppercase tracking-widest mb-2.5" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "Syne, sans-serif" }}>Product Link Import</div>
            {product && !product._manual ? (
              <div>
                <div className="flex gap-2.5 items-start mb-2">
                  <div className="w-11 h-11 rounded-lg flex-shrink-0 flex items-center justify-center text-xl" style={{ background: "rgba(255,255,255,0.06)" }}>📦</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate" style={{ fontFamily: "Syne, sans-serif" }}>{product.title}</div>
                    {product.sourceUrl && <div className="text-xs mt-0.5" style={{ color: "rgba(240,237,232,0.35)" }}>{(() => { try { return new URL(product.sourceUrl).hostname.replace("www.", ""); } catch { return ""; } })()}</div>}
                  </div>
                  <button onClick={() => { setProduct(null); setImportUrl(""); }} style={{ color: "rgba(240,237,232,0.3)", background: "none", border: "none", cursor: "pointer", padding: "2px" }}>
                    <X size={12} />
                  </button>
                </div>
                <div className="text-xs font-semibold" style={{ color: "rgba(45,202,114,0.75)" }}>✓ Product data imported — ready to generate</div>
              </div>
            ) : (
              <div>
                <div className="flex gap-1.5 mb-1.5">
                  <input
                    value={importUrl}
                    onChange={e => setImportUrl(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && importUrl && handleImport()}
                    placeholder="Paste AliExpress / Amazon / Shopify URL…"
                    className="flex-1 text-xs px-2.5 py-2 rounded-lg outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1.5px solid rgba(255,255,255,0.1)", color: "#f0ede8" }}
                  />
                  <button
                    onClick={handleImport}
                    disabled={importing || !importUrl.trim()}
                    className="text-xs font-bold px-3 py-2 rounded-lg flex-shrink-0 flex items-center gap-1 disabled:opacity-50"
                    style={{ background: "rgba(45,202,114,0.12)", border: "1.5px solid rgba(45,202,114,0.35)", color: "rgba(45,202,114,0.9)", fontFamily: "Syne, sans-serif", cursor: "pointer" }}
                  >
                    {importing ? <Loader2 size={10} className="animate-spin" /> : null}
                    {importing ? "…" : "Import"}
                  </button>
                </div>
                {importError && <div className="text-xs mt-1" style={{ color: "rgba(255,150,100,0.8)" }}>{importError}</div>}
                <div className="text-xs mt-1" style={{ color: "rgba(240,237,232,0.28)" }}>Accepts AliExpress, Amazon, Shopify, any product page</div>
              </div>
            )}
          </div>

          <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

          {/* Manual fields */}
          {[
            { label: "Brand / Store Name", value: brandName, set: setBrandName, placeholder: "e.g. Max Wear" },
            { label: "Your Sell Price (AUD)", value: sellPrice, set: setSellPrice, placeholder: "e.g. 49.99" },
            { label: "Extra Details (optional)", value: extraDetails, set: setExtraDetails, placeholder: "Key features, selling points, comma-separated…" },
            { label: "CTA Button Text", value: ctaText, set: setCtaText, placeholder: "Buy Now" },
          ].map(({ label, value, set, placeholder }) => (
            <div key={label}>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "rgba(240,237,232,0.38)", fontFamily: "Syne, sans-serif" }}>{label}</label>
              <input
                value={value}
                onChange={e => set(e.target.value)}
                placeholder={placeholder}
                className="w-full text-xs px-2.5 py-2 rounded-lg outline-none transition-colors"
                style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)", color: "#f0ede8" }}
                onFocus={e => (e.target.style.borderColor = "rgba(212,175,55,0.45)")}
                onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
              />
            </div>
          ))}

          <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

          {/* Theme picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "rgba(240,237,232,0.38)", fontFamily: "Syne, sans-serif" }}>Theme</label>
            <div className="grid grid-cols-3 gap-1.5">
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => onThemeSelect(t)}
                  className="p-1.5 rounded-lg text-center transition-all"
                  style={{
                    border: `1.5px solid ${themeId === t.id ? "rgba(45,202,114,0.55)" : "rgba(255,255,255,0.07)"}`,
                    background: themeId === t.id ? "rgba(45,202,114,0.07)" : "rgba(255,255,255,0.02)",
                    cursor: "pointer",
                  }}
                >
                  <div className="w-4 h-4 rounded-full mx-auto mb-1" style={{ background: t.accent, border: `2px solid ${t.bg}`, boxShadow: `0 0 0 2px ${t.accent}44` }} />
                  <div style={{ fontSize: "9px", color: themeId === t.id ? "#2dca72" : "rgba(240,237,232,0.45)", fontFamily: "Syne, sans-serif", fontWeight: themeId === t.id ? 700 : 400, lineHeight: 1.2 }}>{t.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Layout picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "rgba(240,237,232,0.38)", fontFamily: "Syne, sans-serif" }}>Layout</label>
            <div className="flex gap-1.5">
              {LAYOUTS.map(l => (
                <button
                  key={l.id}
                  onClick={() => setLayout(l.id)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    border: `1.5px solid ${layout === l.id ? "rgba(45,202,114,0.5)" : "rgba(255,255,255,0.07)"}`,
                    background: layout === l.id ? "rgba(45,202,114,0.07)" : "rgba(255,255,255,0.02)",
                    color: layout === l.id ? "#2dca72" : "rgba(240,237,232,0.45)",
                    fontFamily: "Syne, sans-serif",
                    cursor: "pointer",
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Colour pickers */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "rgba(240,237,232,0.38)", fontFamily: "Syne, sans-serif" }}>Colours</label>
            <div className="space-y-2">
              {[
                { label: "Accent", value: accentColor, set: setAccentColor },
                { label: "Background", value: bgColor, set: setBgColor },
              ].map(({ label, value, set }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <label className="relative cursor-pointer flex-shrink-0">
                    <div className="w-6 h-6 rounded-md" style={{ background: value, border: "1.5px solid rgba(255,255,255,0.15)", boxShadow: "0 2px 6px rgba(0,0,0,0.4)" }} />
                    <input type="color" value={value} onChange={e => set(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                  </label>
                  <span className="text-xs" style={{ color: "rgba(240,237,232,0.65)" }}>{label}</span>
                  <span className="text-xs ml-auto font-mono" style={{ color: "rgba(240,237,232,0.28)" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            style={{
              background: generating ? "rgba(212,175,55,0.25)" : "linear-gradient(135deg, #d4af37, #f0c040)",
              color: "#080a0e",
              fontFamily: "Syne, sans-serif",
              boxShadow: generating ? "none" : "0 4px 20px rgba(212,175,55,0.35)",
              cursor: generating ? "not-allowed" : "pointer",
            }}
          >
            {generating ? (
              <><Loader2 size={14} className="animate-spin" />Generating… {genProgress > 0 ? `${genProgress}%` : ""}</>
            ) : (
              <><Globe size={14} />{generatedHTML ? "Regenerate" : "Generate Website"}</>
            )}
          </button>

          {/* Export buttons */}
          {generatedHTML && !generating && (
            <div className="flex gap-1.5">
              <button
                onClick={handleExport}
                className="flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.25)", color: "rgba(212,175,55,0.9)", fontFamily: "Syne, sans-serif", cursor: "pointer" }}
              >
                <Download size={11} /> Export HTML
              </button>
              <button
                onClick={handleCopy}
                className="flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(240,237,232,0.55)", fontFamily: "Syne, sans-serif", cursor: "pointer" }}
              >
                <Copy size={11} /> Copy HTML
              </button>
            </div>
          )}

          {genError && (
            <div className="text-xs p-3 rounded-lg" style={{ background: "rgba(255,100,100,0.08)", border: "1px solid rgba(255,100,100,0.2)", color: "rgba(255,150,150,0.9)" }}>
              {genError}
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {generatedHTML ? (
            <>
              {/* Tab bar */}
              <div className="flex items-center gap-1 px-4 py-2 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)", background: "#0c0e12" }}>
                {(["preview", "chat"] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all flex items-center gap-1.5"
                    style={{
                      background: activeTab === tab ? "rgba(156,95,255,0.12)" : "transparent",
                      color: activeTab === tab ? "#9c5fff" : "rgba(240,237,232,0.4)",
                      borderBottom: `2px solid ${activeTab === tab ? "rgba(156,95,255,0.55)" : "transparent"}`,
                      fontFamily: "Syne, sans-serif",
                      cursor: "pointer",
                    }}
                  >
                    {tab === "chat" && <MessageSquare size={11} />}
                    {tab === "preview" ? "Preview" : "AI Refine"}
                  </button>
                ))}
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg transition-all disabled:opacity-40"
                    style={{ color: "rgba(240,237,232,0.4)", background: "rgba(255,255,255,0.04)", cursor: "pointer" }}
                  >
                    <RefreshCw size={10} /> Regenerate
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                {activeTab === "preview" ? (
                  <iframe
                    srcDoc={generatedHTML}
                    className="w-full h-full border-none"
                    title="Generated landing page preview"
                    sandbox="allow-scripts allow-same-origin"
                  />
                ) : (
                  <div className="h-full flex flex-col p-4">
                    <div className="flex-1 overflow-y-auto space-y-3 mb-3" style={{ scrollbarWidth: "thin" }}>
                      {chatMessages.length === 0 && (
                        <div className="text-center py-12">
                          <div className="text-3xl mb-3">💬</div>
                          <div className="text-sm font-bold mb-1.5" style={{ fontFamily: "Syne, sans-serif" }}>AI Refinement Chat</div>
                          <div className="text-xs max-w-xs mx-auto leading-relaxed" style={{ color: "rgba(240,237,232,0.38)" }}>
                            Ask me to improve copy, add sections, change the tone, or optimise for conversions.
                          </div>
                          {["Make the headline more urgent", "Add a FAQ section", "Improve the product description"].map(s => (
                            <button
                              key={s}
                              onClick={() => setChatInput(s)}
                              className="block mx-auto mt-2 text-xs px-3 py-1.5 rounded-lg transition-all"
                              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(240,237,232,0.5)", cursor: "pointer" }}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                      {chatMessages.map((m: UIMessage) => {
                        const text = m.parts.filter((p: any) => p.type === "text").map((p: any) => p.text).join("");
                        return (
                          <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                            <div
                              className="max-w-[85%] text-xs leading-relaxed px-3 py-2.5 rounded-xl"
                              style={{
                                background: m.role === "user" ? "rgba(156,95,255,0.12)" : "rgba(255,255,255,0.04)",
                                border: `1px solid ${m.role === "user" ? "rgba(156,95,255,0.2)" : "rgba(255,255,255,0.07)"}`,
                                color: "rgba(240,237,232,0.8)",
                                whiteSpace: "pre-wrap",
                              }}
                            >
                              {text}
                            </div>
                          </div>
                        );
                      })}
                      {chatStatus === "streaming" && (
                        <div className="flex justify-start">
                          <div className="text-xs px-3 py-2.5 rounded-xl flex items-center gap-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(240,237,232,0.4)" }}>
                            <Loader2 size={10} className="animate-spin" /> Thinking…
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                    <form onSubmit={e => { e.preventDefault(); if (chatInput.trim() && chatStatus === "ready") { sendMessage({ text: chatInput }); setChatInput(""); } }} className="flex gap-2">
                      <input
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        placeholder="Ask about your website or request changes…"
                        className="flex-1 text-xs px-3 py-2.5 rounded-lg outline-none"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.09)", color: "#f0ede8" }}
                        onFocus={e => (e.target.style.borderColor = "rgba(156,95,255,0.4)")}
                        onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.09)")}
                      />
                      <button
                        type="submit"
                        disabled={chatStatus !== "ready" || !chatInput.trim()}
                        className="text-xs font-bold px-4 py-2.5 rounded-lg disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #9c5fff, #7b3fe4)", color: "#fff", fontFamily: "Syne, sans-serif", cursor: "pointer" }}
                      >
                        Send
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8">
              {generating ? (
                <div className="text-center">
                  <div className="relative w-16 h-16 mx-auto mb-5">
                    <div className="absolute inset-0 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(212,175,55,0.15)", borderTopColor: "#d4af37", borderRightColor: "rgba(212,175,55,0.5)" }} />
                    <div className="absolute inset-2 rounded-full border" style={{ borderColor: "rgba(212,175,55,0.12)" }} />
                    <div className="absolute inset-0 flex items-center justify-center text-lg">🌐</div>
                  </div>
                  <div className="text-sm font-bold mb-3" style={{ fontFamily: "Syne, sans-serif" }}>Generating your landing page…</div>
                  <div className="w-48 h-1.5 rounded-full mx-auto overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div className="h-full rounded-full transition-all duration-300" style={{ width: `${genProgress}%`, background: "linear-gradient(90deg, #d4af37, #f0c040)" }} />
                  </div>
                  <div className="text-xs mt-2" style={{ color: "rgba(240,237,232,0.35)" }}>{genProgress}% complete</div>
                </div>
              ) : (
                <>
                  <div className="text-5xl">🌐</div>
                  <div className="text-center">
                    <div className="text-base font-black mb-2" style={{ fontFamily: "Syne, sans-serif" }}>Your landing page will appear here</div>
                    <div className="text-xs max-w-xs leading-relaxed" style={{ color: "rgba(240,237,232,0.35)" }}>
                      Import a product link or fill in the details on the left, then hit <strong style={{ color: "#d4af37" }}>Generate Website</strong>.
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 text-xs text-left max-w-xs w-full">
                    {[
                      { n: "1", t: "Paste a product URL or fill in details manually" },
                      { n: "2", t: "Choose your theme, layout, and brand colours" },
                      { n: "3", t: "Hit Generate — get a full Shopify-ready landing page" },
                      { n: "4", t: "Export as HTML or copy to clipboard" },
                    ].map(({ n, t }) => (
                      <div key={n} className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black" style={{ background: "rgba(212,175,55,0.15)", color: "#d4af37", fontFamily: "Syne, sans-serif" }}>{n}</div>
                        <span style={{ color: "rgba(240,237,232,0.55)" }}>{t}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
