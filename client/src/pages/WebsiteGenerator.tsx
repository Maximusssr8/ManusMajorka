import { useState, useRef, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  Copy, Download, X, Loader2, Globe, Package, Code2,
  FileArchive, FolderOpen, FileText, FileCode, ChevronRight,
  ChevronDown, ExternalLink, Clipboard, Terminal, ShoppingBag,
  StickyNote, Check,
} from "lucide-react";
import JSZip from "jszip";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";
import { SaveToProduct } from "@/components/SaveToProduct";
import { useActiveProduct } from "@/hooks/useActiveProduct";
import { useProduct } from "@/contexts/ProductContext";
import { proxyImage } from "@/lib/imageProxy";

// ── Types ────────────────────────────────────────────────────────────────────
interface GeneratedData {
  headline: string;
  subheadline: string;
  features: string[];
  cta_primary: string;
  cta_secondary: string;
  trust_badges: string[];
  about_section: string;
  email_subject: string;
  meta_description: string;
  files: Record<string, string>;
}

type Vibe = "bold" | "minimal" | "premium";
type Platform = "shopify" | "nextjs" | "react";
type ActiveTab = "copy" | "code" | "preview" | "deploy";

// ── Helpers ──────────────────────────────────────────────────────────────────
function cleanProductTitle(raw: string): string {
  const platforms = ["AliExpress", "Amazon", "Shopify", "eBay", "Etsy", "Walmart", "Temu", "DHgate", "Alibaba"];
  let title = raw;
  for (const platform of platforms) {
    title = title.replace(new RegExp(`\\s*[-|]\\s*${platform}.*$`, "i"), "");
  }
  title = title.replace(/\b[A-Z0-9]{6,}\b/g, "").replace(/\bSKU[-\s]?[A-Z0-9]+\b/gi, "");
  title = title.slice(0, 60).replace(/[-|,\s]+$/, "").trim();
  return title || raw.slice(0, 60).trim();
}

function getLanguage(filePath: string): string {
  if (filePath.endsWith(".liquid")) return "markup";
  if (filePath.endsWith(".json")) return "json";
  if (filePath.endsWith(".html")) return "markup";
  if (filePath.endsWith(".md")) return "markdown";
  if (filePath.endsWith(".css")) return "css";
  if (filePath.endsWith(".tsx") || filePath.endsWith(".ts")) return "typescript";
  if (filePath.endsWith(".jsx") || filePath.endsWith(".js")) return "javascript";
  return "markup";
}

function parseAIResponse(raw: string): GeneratedData | null {
  // Try direct JSON parse
  try {
    const parsed = JSON.parse(raw);
    if (parsed.headline && parsed.files) return parsed as GeneratedData;
  } catch { /* continue */ }

  // Try extracting JSON between first { and last }
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      const parsed = JSON.parse(raw.slice(firstBrace, lastBrace + 1));
      if (parsed.headline && parsed.files) return parsed as GeneratedData;
    } catch { /* continue */ }
  }

  // Try to find JSON in code block
  const codeBlockMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1].trim());
      if (parsed.headline && parsed.files) return parsed as GeneratedData;
    } catch { /* continue */ }
  }

  return null;
}

function buildPreviewHTML(data: GeneratedData, accentColor: string): string {
  const bg = "#080a0e";
  const text = "#f2efe9";
  const surf = "#111114";
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
<section class="hero">
  <h1 class="hero-hl">${data.headline.replace(/\b(\w+)$/, '<span>$1</span>')}</h1>
  <p class="hero-sub">${data.subheadline}</p>
  <div>
    <a class="btn-primary" href="#">${data.cta_primary}</a>
    <a class="btn-secondary" href="#">${data.cta_secondary}</a>
  </div>
</section>

<section class="features">
  <div class="features-inner">
    <h2>Why Choose Us</h2>
    <div class="features-grid">
      ${(data.features || []).slice(0, 6).map((f, i) => `
      <div class="feat-card">
        <div class="feat-dot">${i + 1}</div>
        <h3>${f}</h3>
        <p>Designed for Australian customers who demand quality and reliability.</p>
      </div>`).join("")}
    </div>
  </div>
</section>

<section class="trust">
  <div class="trust-inner">
    ${(data.trust_badges || []).map(b => `<div class="trust-badge">${b}</div>`).join("")}
  </div>
</section>

<section class="cta-sec">
  <h2>Ready to Get Started?</h2>
  <p>${data.about_section ? data.about_section.slice(0, 200) : "Join thousands of happy Australian customers."}</p>
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
function FileTree({ files, activeFile, onSelect }: {
  files: Record<string, string>;
  activeFile: string | null;
  onSelect: (path: string) => void;
}) {
  const tree = useMemo(() => {
    const folders: Record<string, string[]> = {};
    for (const path of Object.keys(files)) {
      const parts = path.split("/");
      if (parts.length > 1) {
        const folder = parts.slice(0, -1).join("/");
        if (!folders[folder]) folders[folder] = [];
        folders[folder].push(path);
      } else {
        if (!folders["."]) folders["."] = [];
        folders["."].push(path);
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
          {folder !== "." && (
            <button
              onClick={() => setExpanded(p => ({ ...p, [folder]: !p[folder] }))}
              className="flex items-center gap-1.5 w-full px-3 py-1 text-xs hover:bg-white/5 transition-colors"
              style={{ color: "rgba(240,237,232,0.55)", cursor: "pointer", border: "none", background: "none", fontFamily: "DM Sans, sans-serif" }}
            >
              {expanded[folder] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <FolderOpen size={12} style={{ color: "#d4af37" }} />
              <span className="font-semibold">{folder}</span>
            </button>
          )}
          {(folder === "." || expanded[folder]) && paths.map(path => {
            const fileName = path.split("/").pop()!;
            const isActive = activeFile === path;
            return (
              <button
                key={path}
                onClick={() => onSelect(path)}
                className="flex items-center gap-1.5 w-full py-1 text-xs transition-colors"
                style={{
                  paddingLeft: folder === "." ? 12 : 32,
                  paddingRight: 12,
                  background: isActive ? "rgba(212,175,55,0.1)" : "transparent",
                  color: isActive ? "#d4af37" : "rgba(240,237,232,0.5)",
                  borderLeft: isActive ? "2px solid #d4af37" : "2px solid transparent",
                  cursor: "pointer",
                  border: "none",
                  borderLeftWidth: 2,
                  borderLeftStyle: "solid",
                  borderLeftColor: isActive ? "#d4af37" : "transparent",
                  fontFamily: "monospace",
                }}
              >
                {fileName.endsWith(".json") ? <FileCode size={12} style={{ color: "#f0c040" }} /> :
                 fileName.endsWith(".md") ? <FileText size={12} style={{ color: "#7c9fff" }} /> :
                 <FileCode size={12} style={{ color: "#9c5fff" }} />}
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
function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <div className="relative w-full max-w-lg mx-4 rounded-2xl p-6" style={{ background: "#0f1118", border: "1px solid rgba(255,255,255,0.1)" }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4" style={{ color: "rgba(240,237,232,0.4)", background: "none", border: "none", cursor: "pointer" }}>
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
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importedProduct, setImportedProduct] = useState<{
    title: string; description?: string; features?: string[]; images?: string[]; price?: string; sourceUrl?: string;
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
  const [importError, setImportError] = useState("");

  // Form fields
  const [storeName, setStoreName] = useState("");
  const [niche, setNiche] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [vibe, setVibe] = useState<Vibe>("premium");
  const [accentColor, setAccentColor] = useState("#d4af37");
  const [platform, setPlatform] = useState<Platform>("shopify");

  // Output
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [generatedData, setGeneratedData] = useState<GeneratedData | null>(null);
  const [rawResponse, setRawResponse] = useState<string | null>(null);
  const [parseWarning, setParseWarning] = useState(false);
  const [genError, setGenError] = useState("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("copy");

  // Code tab
  const [activeFile, setActiveFile] = useState<string | null>(null);

  // Deploy modals
  const [cursorModal, setCursorModal] = useState(false);
  const [shopifyModal, setShopifyModal] = useState(false);

  // Copy
  const { copiedKey, copy } = useCopyBtn();

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleImport = useCallback(async () => {
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportError("");
    try {
      const response = await fetch("/api/scrape-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Scrape failed: ${response.status}`);
      }
      const data = await response.json() as {
        productTitle: string; description: string; bulletPoints: string[];
        price: string; imageUrls: string[]; brand?: string; extractionError?: string;
      };
      if (data.extractionError) throw new Error(data.extractionError);

      const finalTitle = cleanProductTitle(data.productTitle || "Imported Product");
      setImportedProduct({
        title: finalTitle,
        description: data.description,
        features: data.bulletPoints,
        price: data.price,
        images: data.imageUrls,
        sourceUrl: importUrl,
      });
      if (!storeName.trim() && data.brand) setStoreName(data.brand.slice(0, 40));
      toast.success("Product imported successfully");
    } catch (err: any) {
      setImportError(err?.message || "Could not import. Try a different URL or fill in details manually.");
    } finally {
      setImporting(false);
    }
  }, [importUrl, storeName]);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setGenError("");
    setGenProgress(0);
    setParseWarning(false);

    const progressInterval = setInterval(() => setGenProgress(p => Math.min(p + 3, 92)), 500);

    try {
      const productContext = importedProduct
        ? `Product: ${importedProduct.title}\nDescription: ${importedProduct.description || "N/A"}\nFeatures: ${(importedProduct.features || []).join(", ")}\nPrice: ${importedProduct.price || "N/A"}`
        : "";

      const userMessage = `Generate a complete website for:
Store name: ${storeName || "My Store"}
Niche: ${niche || "general ecommerce"}
Target audience: ${targetAudience || "Australian online shoppers"}
Vibe: ${vibe}
Brand colour: ${accentColor}
Platform: ${platform}
${productContext}

Return ONLY valid JSON with the exact structure specified in your system prompt. No markdown, no code blocks, just the JSON object.`;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: userMessage }],
          systemPrompt: buildSystemPrompt(vibe, platform, accentColor),
        }),
      });

      if (!response.ok) throw new Error(`Generation failed: ${response.status}`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      let fullText = "";
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        // Parse SSE-like format: lines starting with 0:" contain text
        for (const line of chunk.split("\n")) {
          if (line.startsWith('0:"')) {
            try {
              const text = JSON.parse(line.slice(2));
              fullText += text;
            } catch { /* skip malformed chunks */ }
          } else if (line.startsWith("0:")) {
            try {
              const text = JSON.parse(line.slice(2));
              if (typeof text === "string") fullText += text;
            } catch { /* skip */ }
          }
        }
      }

      clearInterval(progressInterval);
      setGenProgress(100);
      setRawResponse(fullText);

      const parsed = parseAIResponse(fullText);
      if (parsed) {
        setGeneratedData(parsed);
        setActiveTab("copy");
        // Set active file to first file
        const firstFile = Object.keys(parsed.files)[0];
        if (firstFile) setActiveFile(firstFile);
        toast.success("Website generated!");
        localStorage.setItem("majorka_milestone_site", "true");
      } else {
        setParseWarning(true);
        setActiveTab("copy");
        toast.warning("Generated content could not be parsed as JSON. Showing raw output.");
      }
    } catch (err: any) {
      setGenError(err?.message || "Generation failed. Please try again.");
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
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(storeName || "store").replace(/\s+/g, "-").toLowerCase()}-theme.zip`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("ZIP downloaded!");
  }, [generatedData, storeName]);

  const handleShopifyExport = useCallback(async () => {
    if (!generatedData?.files) return;
    const zip = new JSZip();

    // Add generated files
    for (const [path, content] of Object.entries(generatedData.files)) {
      zip.file(path, content);
    }

    // Add Shopify wrapper files
    zip.file("layout/theme.liquid", `<!DOCTYPE html>
<html lang="en-AU">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{{ page_title }} - ${storeName || "Store"}</title>
  {{ content_for_header }}
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800;900&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  {{ 'theme.css' | asset_url | stylesheet_tag }}
</head>
<body>
  {{ content_for_layout }}
</body>
</html>`);

    zip.file("config/settings_schema.json", JSON.stringify([
      {
        name: "theme_info",
        theme_name: storeName || "Majorka Theme",
        theme_version: "1.0.0",
        theme_author: "Majorka AI",
      },
    ], null, 2));

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(storeName || "store").replace(/\s+/g, "-").toLowerCase()}-shopify-theme.zip`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Shopify theme ZIP downloaded!");
    setShopifyModal(true);
  }, [generatedData, storeName]);

  const handleCopyNotion = useCallback(() => {
    if (!generatedData) return;
    const md = `# ${generatedData.headline}

## ${generatedData.subheadline}

### Features
${generatedData.features.map(f => `- ${f}`).join("\n")}

### Call to Action
- **Primary:** ${generatedData.cta_primary}
- **Secondary:** ${generatedData.cta_secondary}

### Trust Badges
${generatedData.trust_badges.map(b => `- ${b}`).join("\n")}

### About
${generatedData.about_section}

### Meta Description
${generatedData.meta_description}

### Email Subject Line
${generatedData.email_subject}`;

    navigator.clipboard.writeText(md).catch(() => {});
    toast.success("Copied to clipboard in Notion format!");
  }, [generatedData]);

  const handleOpenCursor = useCallback(async () => {
    await handleDownloadZip();
    setCursorModal(true);
  }, [handleDownloadZip]);

  const cursorInstructions = `1. Unzip the downloaded file
2. Open Cursor (cursor.com)
3. File -> Open Folder -> select unzipped folder
4. In Cursor chat: I have a Shopify theme. Help me customise it for ${storeName || "[store name]"}
5. Cursor will read all files and help you build`;

  // ── Preview HTML ──────────────────────────────────────────────────────────
  const previewHTML = useMemo(() => {
    if (!generatedData) return "";
    return buildPreviewHTML(generatedData, accentColor);
  }, [generatedData, accentColor]);

  const handleOpenPreviewNewTab = useCallback(() => {
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(previewHTML);
      win.document.close();
    }
  }, [previewHTML]);

  // ── Render ────────────────────────────────────────────────────────────────
  const hasOutput = generatedData || rawResponse;

  return (
    <div className="h-full flex flex-col" style={{ background: "#080a0e", color: "#f0ede8", fontFamily: "DM Sans, sans-serif" }}>

      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 px-5 py-3 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)", background: "#0c0e12" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)" }}>
          <Globe size={15} style={{ color: "#d4af37" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black leading-tight" style={{ fontFamily: "Syne, sans-serif" }}>Website Generator</div>
          <div className="text-xs" style={{ color: "rgba(240,237,232,0.35)" }}>AI-powered Shopify theme builder for AU market</div>
        </div>
      </div>

      {/* ── Body: two-panel split ── */}
      <div className="flex-1 overflow-hidden flex">

        {/* ── LEFT PANEL (400px fixed) ── */}
        <div
          className="flex-shrink-0 overflow-y-auto p-5 space-y-4"
          style={{
            width: 400,
            borderRight: "1px solid rgba(255,255,255,0.07)",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255,255,255,0.1) transparent",
          }}
        >

          {/* Product URL Import */}
          <div className="rounded-xl p-4" style={{ background: importedProduct ? "rgba(45,202,114,0.05)" : "rgba(255,255,255,0.03)", border: `1.5px solid ${importedProduct ? "rgba(45,202,114,0.35)" : "rgba(255,255,255,0.09)"}` }}>
            <div className="text-xs font-bold uppercase tracking-widest mb-2.5" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "Syne, sans-serif" }}>Import Product</div>
            {importedProduct ? (
              <div>
                <div className="flex gap-2.5 items-start mb-2">
                  <div className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center text-lg" style={{ background: "rgba(255,255,255,0.06)" }}>
                    {importedProduct.images && importedProduct.images.length > 0 ? (
                      <img src={proxyImage(importedProduct.images[0])} alt="" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    ) : "📦"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate" style={{ fontFamily: "Syne, sans-serif" }}>{importedProduct.title}</div>
                    {importedProduct.price && <div className="text-xs mt-0.5" style={{ color: "rgba(45,202,114,0.75)" }}>${importedProduct.price} AUD</div>}
                  </div>
                  <button onClick={() => { setImportedProduct(null); setImportUrl(""); }} style={{ color: "rgba(240,237,232,0.3)", background: "none", border: "none", cursor: "pointer" }}>
                    <X size={14} />
                  </button>
                </div>
                <div className="text-xs font-semibold" style={{ color: "rgba(45,202,114,0.75)" }}>✓ Product data imported</div>
              </div>
            ) : (
              <div>
                <div className="flex gap-1.5">
                  <input
                    value={importUrl}
                    onChange={e => setImportUrl(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleImport(); } }}
                    placeholder="Paste product URL (AliExpress, Amazon, Shopify…)"
                    className="flex-1 text-xs px-3 py-2 rounded-lg outline-none"
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
                {importError && <div className="text-xs mt-1.5" style={{ color: "rgba(255,150,100,0.8)" }}>{importError}</div>}
              </div>
            )}
          </div>

          <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

          {/* Store Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "Syne, sans-serif" }}>Store Name</label>
            <input
              value={storeName}
              onChange={e => setStoreName(e.target.value)}
              placeholder="e.g. MaxFit Supplements"
              className="w-full text-sm px-3 py-2.5 rounded-lg outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)", color: "#f0ede8" }}
              onFocus={e => (e.target.style.borderColor = "rgba(212,175,55,0.45)")}
              onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
            />
          </div>

          {/* Niche */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "Syne, sans-serif" }}>Niche</label>
            <input
              value={niche}
              onChange={e => setNiche(e.target.value)}
              placeholder="e.g. gym supplements"
              className="w-full text-sm px-3 py-2.5 rounded-lg outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)", color: "#f0ede8" }}
              onFocus={e => (e.target.style.borderColor = "rgba(212,175,55,0.45)")}
              onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
            />
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "Syne, sans-serif" }}>Target Audience</label>
            <input
              value={targetAudience}
              onChange={e => setTargetAudience(e.target.value)}
              placeholder="e.g. AU men 18-35"
              className="w-full text-sm px-3 py-2.5 rounded-lg outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)", color: "#f0ede8" }}
              onFocus={e => (e.target.style.borderColor = "rgba(212,175,55,0.45)")}
              onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
            />
          </div>

          {/* Vibe Toggle */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "Syne, sans-serif" }}>Vibe</label>
            <div className="flex gap-2">
              {(["bold", "minimal", "premium"] as Vibe[]).map(v => (
                <button
                  key={v}
                  onClick={() => setVibe(v)}
                  className="flex-1 py-2 rounded-full text-xs font-bold capitalize transition-all"
                  style={{
                    background: vibe === v ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.03)",
                    border: `1.5px solid ${vibe === v ? "rgba(212,175,55,0.5)" : "rgba(255,255,255,0.08)"}`,
                    color: vibe === v ? "#d4af37" : "rgba(240,237,232,0.45)",
                    fontFamily: "Syne, sans-serif",
                    cursor: "pointer",
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Colour Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "Syne, sans-serif" }}>Brand Colour</label>
            <div className="flex items-center gap-3">
              <label className="relative cursor-pointer flex-shrink-0">
                <div className="w-9 h-9 rounded-lg" style={{ background: accentColor, border: "2px solid rgba(255,255,255,0.15)", boxShadow: `0 4px 12px ${accentColor}44` }} />
                <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
              </label>
              <span className="text-sm font-mono" style={{ color: "rgba(240,237,232,0.5)" }}>{accentColor}</span>
            </div>
          </div>

          {/* Platform Dropdown */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "Syne, sans-serif" }}>Platform</label>
            <select
              value={platform}
              onChange={e => setPlatform(e.target.value as Platform)}
              className="w-full text-sm px-3 py-2.5 rounded-lg outline-none appearance-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)", color: "#f0ede8", cursor: "pointer" }}
            >
              <option value="shopify" style={{ background: "#0c0e12" }}>Shopify</option>
              <option value="nextjs" style={{ background: "#0c0e12" }}>Next.js</option>
              <option value="react" style={{ background: "#0c0e12" }}>React</option>
            </select>
          </div>

          <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            style={{
              background: generating ? "rgba(212,175,55,0.25)" : "linear-gradient(135deg, #d4af37, #f0c040)",
              color: "#080a0e",
              fontFamily: "Syne, sans-serif",
              boxShadow: generating ? "none" : "0 4px 24px rgba(212,175,55,0.35)",
              cursor: generating ? "not-allowed" : "pointer",
            }}
          >
            {generating ? (
              <><Loader2 size={15} className="animate-spin" />Generating… {genProgress > 0 ? `${genProgress}%` : ""}</>
            ) : (
              <><Globe size={15} />{hasOutput ? "Regenerate" : "Generate"}</>
            )}
          </button>

          {genError && (
            <div className="text-xs p-3 rounded-lg" style={{ background: "rgba(255,100,100,0.08)", border: "1px solid rgba(255,100,100,0.2)", color: "rgba(255,150,150,0.9)" }}>
              {genError}
            </div>
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
              <div className="flex items-center gap-1 px-4 py-2.5 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)", background: "#0c0e12" }}>
                {(["copy", "code", "preview", "deploy"] as ActiveTab[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="px-4 py-1.5 text-xs font-bold rounded-lg capitalize transition-all flex items-center gap-1.5"
                    style={{
                      background: activeTab === tab ? "rgba(212,175,55,0.12)" : "transparent",
                      color: activeTab === tab ? "#d4af37" : "rgba(240,237,232,0.4)",
                      borderBottom: `2px solid ${activeTab === tab ? "#d4af37" : "transparent"}`,
                      fontFamily: "Syne, sans-serif",
                      cursor: "pointer",
                    }}
                  >
                    {tab === "copy" && <FileText size={12} />}
                    {tab === "code" && <Code2 size={12} />}
                    {tab === "preview" && <Globe size={12} />}
                    {tab === "deploy" && <Package size={12} />}
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-hidden">

                {/* ── COPY TAB ── */}
                {activeTab === "copy" && (
                  <div className="h-full overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: "thin" }}>
                    {parseWarning && (
                      <div className="p-3 rounded-lg text-xs" style={{ background: "rgba(255,200,50,0.08)", border: "1px solid rgba(255,200,50,0.2)", color: "rgba(255,220,100,0.9)" }}>
                        JSON parsing failed. Showing raw AI output below.
                      </div>
                    )}

                    {generatedData ? (
                      <>
                        {/* Headline */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "Syne, sans-serif" }}>Headline</span>
                            <button onClick={() => copy(generatedData.headline, "hl")} className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg transition-all" style={{ color: copiedKey === "hl" ? "#2dca72" : "rgba(240,237,232,0.4)", background: "rgba(255,255,255,0.04)", cursor: "pointer", border: "none" }}>
                              {copiedKey === "hl" ? <Check size={10} /> : <Copy size={10} />} {copiedKey === "hl" ? "Copied" : "Copy"}
                            </button>
                          </div>
                          <div className="text-2xl font-black" style={{ fontFamily: "Syne, sans-serif", lineHeight: 1.2 }}>{generatedData.headline}</div>
                        </div>

                        {/* Subheadline */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "Syne, sans-serif" }}>Subheadline</span>
                            <button onClick={() => copy(generatedData.subheadline, "sub")} className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg transition-all" style={{ color: copiedKey === "sub" ? "#2dca72" : "rgba(240,237,232,0.4)", background: "rgba(255,255,255,0.04)", cursor: "pointer", border: "none" }}>
                              {copiedKey === "sub" ? <Check size={10} /> : <Copy size={10} />} {copiedKey === "sub" ? "Copied" : "Copy"}
                            </button>
                          </div>
                          <div className="text-sm leading-relaxed" style={{ color: "rgba(240,237,232,0.7)" }}>{generatedData.subheadline}</div>
                        </div>

                        {/* Features */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "Syne, sans-serif" }}>Features</span>
                            <button onClick={() => copy(generatedData.features.join("\n"), "feats")} className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg transition-all" style={{ color: copiedKey === "feats" ? "#2dca72" : "rgba(240,237,232,0.4)", background: "rgba(255,255,255,0.04)", cursor: "pointer", border: "none" }}>
                              {copiedKey === "feats" ? <Check size={10} /> : <Copy size={10} />} {copiedKey === "feats" ? "Copied" : "Copy All"}
                            </button>
                          </div>
                          <div className="space-y-2">
                            {generatedData.features.map((f, i) => (
                              <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black" style={{ background: "rgba(212,175,55,0.15)", color: "#d4af37" }}>{i + 1}</div>
                                <span className="text-sm" style={{ color: "rgba(240,237,232,0.7)" }}>{f}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* CTAs */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "Syne, sans-serif" }}>Primary CTA</span>
                              <button onClick={() => copy(generatedData.cta_primary, "cta1")} className="text-xs flex items-center gap-1" style={{ color: copiedKey === "cta1" ? "#2dca72" : "rgba(240,237,232,0.4)", background: "none", border: "none", cursor: "pointer" }}>
                                {copiedKey === "cta1" ? <Check size={10} /> : <Copy size={10} />}
                              </button>
                            </div>
                            <div className="text-sm font-bold" style={{ color: "#d4af37" }}>{generatedData.cta_primary}</div>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "Syne, sans-serif" }}>Secondary CTA</span>
                              <button onClick={() => copy(generatedData.cta_secondary, "cta2")} className="text-xs flex items-center gap-1" style={{ color: copiedKey === "cta2" ? "#2dca72" : "rgba(240,237,232,0.4)", background: "none", border: "none", cursor: "pointer" }}>
                                {copiedKey === "cta2" ? <Check size={10} /> : <Copy size={10} />}
                              </button>
                            </div>
                            <div className="text-sm font-bold" style={{ color: "rgba(240,237,232,0.7)" }}>{generatedData.cta_secondary}</div>
                          </div>
                        </div>

                        {/* Trust Badges */}
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "Syne, sans-serif" }}>Trust Badges 🇦🇺</span>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {generatedData.trust_badges.map((b, i) => (
                              <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: "rgba(45,202,114,0.08)", border: "1px solid rgba(45,202,114,0.2)", color: "rgba(45,202,114,0.85)" }}>
                                <Check size={10} /> {b}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Meta + Email */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "Syne, sans-serif" }}>Meta Description 🇦🇺</span>
                              <button onClick={() => copy(generatedData.meta_description, "meta")} className="text-xs flex items-center gap-1" style={{ color: copiedKey === "meta" ? "#2dca72" : "rgba(240,237,232,0.4)", background: "none", border: "none", cursor: "pointer" }}>
                                {copiedKey === "meta" ? <Check size={10} /> : <Copy size={10} />}
                              </button>
                            </div>
                            <div className="text-xs leading-relaxed" style={{ color: "rgba(240,237,232,0.55)" }}>{generatedData.meta_description}</div>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "Syne, sans-serif" }}>Email Subject 🇦🇺</span>
                              <button onClick={() => copy(generatedData.email_subject, "email")} className="text-xs flex items-center gap-1" style={{ color: copiedKey === "email" ? "#2dca72" : "rgba(240,237,232,0.4)", background: "none", border: "none", cursor: "pointer" }}>
                                {copiedKey === "email" ? <Check size={10} /> : <Copy size={10} />}
                              </button>
                            </div>
                            <div className="text-xs leading-relaxed" style={{ color: "rgba(240,237,232,0.55)" }}>{generatedData.email_subject}</div>
                          </div>
                        </div>
                      </>
                    ) : rawResponse ? (
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "Syne, sans-serif" }}>Raw AI Output</div>
                        <pre className="text-xs p-4 rounded-xl overflow-x-auto" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(240,237,232,0.6)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                          {rawResponse}
                        </pre>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* ── CODE TAB ── */}
                {activeTab === "code" && generatedData?.files && (
                  <div className="h-full flex overflow-hidden">
                    {/* File tree sidebar */}
                    <div className="flex-shrink-0 overflow-y-auto border-r" style={{ width: 220, borderColor: "rgba(255,255,255,0.06)", background: "#0a0c10", scrollbarWidth: "thin" }}>
                      <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(240,237,232,0.3)", fontFamily: "Syne, sans-serif" }}>Files</div>
                      <FileTree files={generatedData.files} activeFile={activeFile} onSelect={setActiveFile} />
                    </div>

                    {/* Code viewer */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                      {activeFile && generatedData.files[activeFile] ? (
                        <>
                          <div className="flex items-center justify-between px-4 py-2 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                            <span className="text-xs font-mono" style={{ color: "rgba(240,237,232,0.6)" }}>{activeFile}</span>
                            <button
                              onClick={() => { copy(generatedData.files[activeFile], `file-${activeFile}`); toast.success(`Copied ${activeFile}`); }}
                              className="text-xs flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all"
                              style={{ color: copiedKey === `file-${activeFile}` ? "#2dca72" : "rgba(240,237,232,0.4)", background: "rgba(255,255,255,0.04)", cursor: "pointer", border: "none" }}
                            >
                              {copiedKey === `file-${activeFile}` ? <Check size={10} /> : <Copy size={10} />}
                              {copiedKey === `file-${activeFile}` ? "Copied" : "Copy"}
                            </button>
                          </div>
                          <div className="flex-1 overflow-auto" style={{ scrollbarWidth: "thin" }}>
                            <SyntaxHighlighter
                              language={getLanguage(activeFile)}
                              style={vscDarkPlus}
                              customStyle={{ margin: 0, padding: 16, background: "#080a0e", fontSize: 13, lineHeight: 1.6, minHeight: "100%" }}
                              showLineNumbers
                              lineNumberStyle={{ color: "rgba(240,237,232,0.15)", minWidth: 36 }}
                            >
                              {generatedData.files[activeFile]}
                            </SyntaxHighlighter>
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 flex items-center justify-center">
                          <div className="text-center">
                            <FileCode size={32} style={{ color: "rgba(240,237,232,0.15)", margin: "0 auto 12px" }} />
                            <div className="text-sm" style={{ color: "rgba(240,237,232,0.3)" }}>Select a file to view</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {activeTab === "code" && !generatedData?.files && (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-sm" style={{ color: "rgba(240,237,232,0.3)" }}>No files generated. Try regenerating.</div>
                  </div>
                )}

                {/* ── PREVIEW TAB ── */}
                {activeTab === "preview" && (
                  <div className="h-full flex flex-col">
                    <div className="flex items-center gap-2 px-4 py-2 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                      <button
                        onClick={handleOpenPreviewNewTab}
                        className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
                        style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.25)", color: "#d4af37", fontFamily: "Syne, sans-serif", cursor: "pointer" }}
                      >
                        <ExternalLink size={11} /> Open in new tab
                      </button>
                    </div>
                    {generatedData ? (
                      <iframe
                        srcDoc={previewHTML}
                        className="flex-1 w-full border-none"
                        title="Website preview"
                        sandbox="allow-scripts"
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-sm" style={{ color: "rgba(240,237,232,0.3)" }}>No preview available. Raw response could not be parsed.</div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── DEPLOY TAB ── */}
                {activeTab === "deploy" && (
                  <div className="h-full overflow-y-auto p-6" style={{ scrollbarWidth: "thin" }}>
                    <div className="grid grid-cols-2 gap-4 max-w-2xl">

                      {/* Card 1: Download ZIP */}
                      <button
                        onClick={handleDownloadZip}
                        disabled={!generatedData?.files}
                        className="p-5 rounded-xl text-left transition-all group disabled:opacity-40"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1.5px solid rgba(255,255,255,0.08)", cursor: "pointer" }}
                      >
                        <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center" style={{ background: "rgba(212,175,55,0.12)" }}>
                          <FileArchive size={20} style={{ color: "#d4af37" }} />
                        </div>
                        <div className="text-sm font-black mb-1" style={{ fontFamily: "Syne, sans-serif" }}>Download ZIP</div>
                        <div className="text-xs leading-relaxed" style={{ color: "rgba(240,237,232,0.4)" }}>
                          Download all generated theme files as a ZIP archive with folder structure preserved.
                        </div>
                      </button>

                      {/* Card 2: Open in Cursor */}
                      <button
                        onClick={handleOpenCursor}
                        disabled={!generatedData?.files}
                        className="p-5 rounded-xl text-left transition-all group disabled:opacity-40"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1.5px solid rgba(255,255,255,0.08)", cursor: "pointer" }}
                      >
                        <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center" style={{ background: "rgba(156,95,255,0.12)" }}>
                          <Terminal size={20} style={{ color: "#9c5fff" }} />
                        </div>
                        <div className="text-sm font-black mb-1" style={{ fontFamily: "Syne, sans-serif" }}>Open in Cursor</div>
                        <div className="text-xs leading-relaxed" style={{ color: "rgba(240,237,232,0.4)" }}>
                          Download ZIP + get step-by-step instructions to customise with Cursor AI.
                        </div>
                      </button>

                      {/* Card 3: Export to Shopify */}
                      <button
                        onClick={handleShopifyExport}
                        disabled={!generatedData?.files}
                        className="p-5 rounded-xl text-left transition-all group disabled:opacity-40"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1.5px solid rgba(255,255,255,0.08)", cursor: "pointer" }}
                      >
                        <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center" style={{ background: "rgba(45,202,114,0.12)" }}>
                          <ShoppingBag size={20} style={{ color: "#2dca72" }} />
                        </div>
                        <div className="text-sm font-black mb-1" style={{ fontFamily: "Syne, sans-serif" }}>Export to Shopify</div>
                        <div className="text-xs leading-relaxed" style={{ color: "rgba(240,237,232,0.4)" }}>
                          Download Shopify-compatible theme ZIP with layout and config files included.
                        </div>
                      </button>

                      {/* Card 4: Copy to Notion */}
                      <button
                        onClick={handleCopyNotion}
                        disabled={!generatedData}
                        className="p-5 rounded-xl text-left transition-all group disabled:opacity-40"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1.5px solid rgba(255,255,255,0.08)", cursor: "pointer" }}
                      >
                        <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)" }}>
                          <StickyNote size={20} style={{ color: "rgba(240,237,232,0.6)" }} />
                        </div>
                        <div className="text-sm font-black mb-1" style={{ fontFamily: "Syne, sans-serif" }}>Copy to Notion</div>
                        <div className="text-xs leading-relaxed" style={{ color: "rgba(240,237,232,0.4)" }}>
                          Copy headline, features, CTAs, and trust badges as clean Markdown for Notion.
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
                    <div className="absolute inset-0 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(212,175,55,0.15)", borderTopColor: "#d4af37", borderRightColor: "rgba(212,175,55,0.5)" }} />
                    <div className="absolute inset-2 rounded-full border" style={{ borderColor: "rgba(212,175,55,0.12)" }} />
                    <div className="absolute inset-0 flex items-center justify-center text-lg">🌐</div>
                  </div>
                  <div className="text-sm font-bold mb-3" style={{ fontFamily: "Syne, sans-serif" }}>Generating your website…</div>
                  <div className="w-48 h-1.5 rounded-full mx-auto overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div className="h-full rounded-full transition-all duration-300" style={{ width: `${genProgress}%`, background: "linear-gradient(90deg, #d4af37, #f0c040)" }} />
                  </div>
                  <div className="text-xs mt-2" style={{ color: "rgba(240,237,232,0.35)" }}>AI is generating copy, theme files, and emails…</div>
                </div>
              ) : (
                <>
                  <div className="text-5xl">🌐</div>
                  <div className="text-center">
                    <div className="text-base font-black mb-2" style={{ fontFamily: "Syne, sans-serif" }}>Build Your Store in Seconds</div>
                    <div className="text-xs max-w-sm leading-relaxed" style={{ color: "rgba(240,237,232,0.35)" }}>
                      Fill in your store details on the left and hit <strong style={{ color: "#d4af37" }}>Generate</strong>. Get copy, Shopify Liquid files, HTML emails, and a live preview — all AU-market optimised.
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 text-xs text-left max-w-sm w-full">
                    {[
                      { n: "1", t: "Enter your store name, niche, and target audience" },
                      { n: "2", t: "Choose your vibe, brand colour, and platform" },
                      { n: "3", t: "Hit Generate — AI creates copy + 8 theme files" },
                      { n: "4", t: "Download ZIP, export to Shopify, or open in Cursor" },
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

      {/* ── Cursor Modal ── */}
      <Modal open={cursorModal} onClose={() => setCursorModal(false)}>
        <div className="mb-4">
          <Terminal size={24} style={{ color: "#9c5fff", marginBottom: 12 }} />
          <div className="text-lg font-black" style={{ fontFamily: "Syne, sans-serif" }}>Open in Cursor</div>
          <div className="text-xs mt-1" style={{ color: "rgba(240,237,232,0.4)" }}>Your ZIP has been downloaded. Follow these steps:</div>
        </div>
        <pre className="text-sm leading-relaxed p-4 rounded-xl mb-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(240,237,232,0.7)", whiteSpace: "pre-wrap" }}>
          {cursorInstructions}
        </pre>
        <div className="flex gap-2">
          <button
            onClick={() => { copy(cursorInstructions, "cursor-instr"); toast.success("Instructions copied!"); }}
            className="flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
            style={{ background: "rgba(156,95,255,0.12)", border: "1px solid rgba(156,95,255,0.3)", color: "#9c5fff", fontFamily: "Syne, sans-serif", cursor: "pointer" }}
          >
            <Clipboard size={12} /> Copy Instructions
          </button>
          <button
            onClick={() => setCursorModal(false)}
            className="flex-1 py-2.5 rounded-lg text-xs font-bold"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(240,237,232,0.5)", fontFamily: "Syne, sans-serif", cursor: "pointer" }}
          >
            Close
          </button>
        </div>
      </Modal>

      {/* ── Shopify Modal ── */}
      <Modal open={shopifyModal} onClose={() => setShopifyModal(false)}>
        <div className="mb-4">
          <ShoppingBag size={24} style={{ color: "#2dca72", marginBottom: 12 }} />
          <div className="text-lg font-black" style={{ fontFamily: "Syne, sans-serif" }}>Export to Shopify</div>
          <div className="text-xs mt-1" style={{ color: "rgba(240,237,232,0.4)" }}>Your theme ZIP has been downloaded.</div>
        </div>
        <div className="text-sm leading-relaxed p-4 rounded-xl mb-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(240,237,232,0.7)" }}>
          <p className="mb-2">1. Go to <strong>Shopify Admin</strong> → <strong>Online Store</strong> → <strong>Themes</strong></p>
          <p className="mb-2">2. Click <strong>Add theme</strong> → <strong>Upload zip file</strong></p>
          <p>3. Then click <strong>Customise</strong> to edit your new theme.</p>
        </div>
        <button
          onClick={() => setShopifyModal(false)}
          className="w-full py-2.5 rounded-lg text-xs font-bold"
          style={{ background: "rgba(45,202,114,0.12)", border: "1px solid rgba(45,202,114,0.3)", color: "#2dca72", fontFamily: "Syne, sans-serif", cursor: "pointer" }}
        >
          Got it
        </button>
      </Modal>
    </div>
  );
}

// ── System Prompt Builder ────────────────────────────────────────────────────
function buildSystemPrompt(vibe: Vibe, platform: Platform, accentColor: string): string {
  const vibeDescriptions: Record<Vibe, string> = {
    bold: "Bold, high-energy, attention-grabbing. Use strong action words, punchy headlines, urgency-driven CTAs. Think Nike, Gymshark.",
    minimal: "Clean, minimal, sophisticated. Whitespace-heavy, understated elegance. Think Aesop, Apple.",
    premium: "Premium luxury, exclusive. Rich language, trust-building, aspirational. Think Net-a-Porter, MR PORTER.",
  };

  const platformInstructions: Record<Platform, string> = {
    shopify: "Generate Shopify Liquid template files (.liquid). Use Liquid syntax ({% %}, {{ }}). Files should be ready to upload as a Shopify theme.",
    nextjs: "Generate Next.js App Router files (.tsx). Use React Server Components where appropriate. Include Tailwind CSS classes.",
    react: "Generate React component files (.tsx). Use functional components with hooks. Include Tailwind CSS classes.",
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
    "sections/hero.liquid": "valid ${platform === "shopify" ? "Shopify Liquid" : platform === "nextjs" ? "Next.js TSX" : "React TSX"} hero section code",
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
