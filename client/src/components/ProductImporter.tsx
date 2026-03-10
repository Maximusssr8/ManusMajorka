/**
 * ProductImporter — reusable product URL import flow.
 * Calls POST /api/scrape-product, shows shimmer loading, previews result,
 * and sets the active product via useActiveProduct.
 */
import { useState } from "react";
import { Package, Check, X, ExternalLink, ArrowRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useActiveProduct } from "@/hooks/useActiveProduct";
import { useLocation } from "wouter";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ImportedProduct {
  productTitle: string;
  cleanTitle?: string;
  description: string;
  bulletPoints: string[];
  price: string;
  imageUrls: string[];
  sourceUrl?: string;
  sourcePlatform?: string;
}

interface ProductImporterProps {
  onSuccess?: (product: ImportedProduct) => void;
  compact?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function cleanProductTitle(title: string): string {
  let cleaned = title
    // Strip platform suffixes after - | –
    .replace(/\s*[-|–]\s*(aliexpress|amazon|shopify|ebay|etsy|walmart|temu|wish|dhgate|alibaba|lazada|shopee|taobao|jd\.com|rakuten|overstock|target|bestbuy|homedepot|wayfair|newegg)[^]*/gi, "")
    // Strip pure alphanumeric 6+ char tokens (SKU-like codes)
    .replace(/\b[A-Z0-9]{6,}\b/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (cleaned.length > 60) {
    cleaned = cleaned.slice(0, 57) + "...";
  }
  return cleaned || title.slice(0, 60);
}

function detectPlatform(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes("aliexpress")) return "AliExpress";
  if (lower.includes("amazon")) return "Amazon";
  if (lower.includes("shopify") || lower.includes("myshopify")) return "Shopify";
  if (lower.includes("ebay")) return "eBay";
  if (lower.includes("etsy")) return "Etsy";
  if (lower.includes("walmart")) return "Walmart";
  if (lower.includes("temu")) return "Temu";
  if (lower.includes("dhgate")) return "DHgate";
  if (lower.includes("alibaba")) return "Alibaba";
  if (lower.includes("lazada")) return "Lazada";
  if (lower.includes("taobao")) return "Taobao";
  if (lower.includes("newegg")) return "Newegg";
  if (lower.includes("target.com")) return "Target";
  if (lower.includes("wayfair")) return "Wayfair";
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "Unknown";
  }
}

// ── Shimmer Skeleton ──────────────────────────────────────────────────────────

function ShimmerBlock({ height = 16, width = "100%" }: { height?: number; width?: string | number }) {
  return (
    <div
      className="rounded-lg shimmer-block"
      style={{
        height,
        width,
        background: "linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s infinite",
      }}
    />
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ProductImporter({ onSuccess, compact = false }: ProductImporterProps) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "result" | "saved">("idle");
  const [result, setResult] = useState<ImportedProduct | null>(null);
  const { setProduct } = useActiveProduct();
  const [, setLocation] = useLocation();

  const handleImport = async () => {
    if (!url.trim()) return;
    setStatus("loading");
    setResult(null);

    try {
      const res = await fetch("/api/scrape-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const importedProduct: ImportedProduct = {
        productTitle: data.productTitle || "Imported Product",
        cleanTitle: cleanProductTitle(data.productTitle || "Imported Product"),
        description: data.description || "",
        bulletPoints: data.bulletPoints || [],
        price: data.price || "",
        imageUrls: data.imageUrls || [],
        sourceUrl: url.trim(),
        sourcePlatform: detectPlatform(url.trim()),
      };

      setResult(importedProduct);
      setStatus("result");
    } catch {
      setStatus("error");
    }
  };

  const handleSetActive = () => {
    if (!result) return;
    const name = result.cleanTitle || result.productTitle;
    setProduct({
      name,
      niche: result.sourcePlatform || "imported",
      summary: [
        result.description,
        result.price ? `Price: ${result.price}` : "",
        result.bulletPoints.slice(0, 3).join(" | "),
      ]
        .filter(Boolean)
        .join(" — ")
        .slice(0, 500),
      source: "research",
      savedAt: Date.now(),
    });
    toast.success(`${name} is now your active product`);
    setStatus("saved");
    if (onSuccess) onSuccess(result);
  };

  const handleDiscard = () => {
    setResult(null);
    setStatus("idle");
    setUrl("");
  };

  const handleRetry = () => {
    setStatus("idle");
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const inputBlock = (
    <div className="flex gap-2">
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleImport()}
        placeholder="Paste AliExpress, Amazon, or any product URL..."
        className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#f5f5f5",
          fontFamily: "DM Sans, sans-serif",
        }}
        onFocus={(e) => (e.target.style.borderColor = "rgba(245,158,11,0.5)")}
        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
      />
      <button
        onClick={handleImport}
        disabled={!url.trim()}
        className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex-shrink-0"
        style={{
          background: url.trim()
            ? "linear-gradient(135deg, #f59e0b, #d97706)"
            : "rgba(245,158,11,0.15)",
          color: url.trim() ? "#0a0a0a" : "rgba(245,158,11,0.4)",
          border: "none",
          cursor: url.trim() ? "pointer" : "not-allowed",
          fontFamily: "Syne, sans-serif",
        }}
      >
        Import
      </button>
    </div>
  );

  const loadingBlock = (
    <div className="space-y-3">
      <p
        className="text-xs font-semibold mb-3"
        style={{ color: "rgba(245,158,11,0.7)", fontFamily: "Syne, sans-serif" }}
      >
        Analysing product...
      </p>
      <ShimmerBlock height={20} width="70%" />
      <ShimmerBlock height={14} width="100%" />
      <ShimmerBlock height={14} width="85%" />
      <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
    </div>
  );

  const errorBlock = (
    <div>
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl mb-3"
        style={{
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.2)",
        }}
      >
        <X size={14} style={{ color: "#ef4444", flexShrink: 0 }} />
        <span className="text-sm flex-1" style={{ color: "#f5f5f5" }}>
          Failed to import product. Check the URL and try again.
        </span>
        <button
          onClick={handleRetry}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
          style={{
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.25)",
            color: "#ef4444",
            cursor: "pointer",
            fontFamily: "Syne, sans-serif",
          }}
        >
          <RefreshCw size={11} /> Retry
        </button>
      </div>
    </div>
  );

  const resultCard = result && (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "#111111",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Hero image */}
      {result.imageUrls.length > 0 ? (
        <div
          className="w-full overflow-hidden"
          style={{ height: 160, background: "#1a1a1a" }}
        >
          <img
            src={result.imageUrls[0]}
            alt={result.cleanTitle || result.productTitle}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      ) : (
        <div
          className="w-full flex items-center justify-center"
          style={{ height: 160, background: "#1a1a1a" }}
        >
          <Package size={48} style={{ color: "rgba(255,255,255,0.12)" }} />
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Title + badges */}
        <div className="flex items-start gap-2 flex-wrap">
          <h3
            className="text-sm font-black flex-1 min-w-0"
            style={{ color: "#f5f5f5", fontFamily: "Syne, sans-serif", lineHeight: 1.35 }}
          >
            {result.cleanTitle || result.productTitle}
          </h3>
          {result.price && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0"
              style={{
                background: "rgba(245,158,11,0.15)",
                color: "#f59e0b",
                border: "1px solid rgba(245,158,11,0.25)",
                fontFamily: "Syne, sans-serif",
              }}
            >
              {result.price}
            </span>
          )}
          {result.sourcePlatform && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
              style={{
                background: "rgba(255,255,255,0.07)",
                color: "#a1a1aa",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {result.sourcePlatform}
            </span>
          )}
        </div>

        {/* Description */}
        {result.description && (
          <p className="text-xs leading-relaxed" style={{ color: "#a1a1aa" }}>
            {result.description.length > 120
              ? result.description.slice(0, 117) + "..."
              : result.description}
          </p>
        )}

        {/* Bullet points */}
        {result.bulletPoints.length > 0 && (
          <ul className="space-y-1">
            {result.bulletPoints.slice(0, 3).map((bp, i) => (
              <li key={i} className="flex items-start gap-2">
                <Check size={11} style={{ color: "#f59e0b", flexShrink: 0, marginTop: 2 }} />
                <span className="text-xs" style={{ color: "#a1a1aa" }}>
                  {bp}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Image thumbnails */}
        {result.imageUrls.length > 1 && (
          <div className="flex gap-1.5">
            {result.imageUrls.slice(0, 4).map((imgUrl, i) => (
              <div
                key={i}
                className="rounded-lg overflow-hidden flex-shrink-0"
                style={{
                  width: 48,
                  height: 48,
                  background: "#1a1a1a",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <img
                  src={imgUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSetActive}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              color: "#0a0a0a",
              border: "none",
              cursor: "pointer",
              fontFamily: "Syne, sans-serif",
            }}
          >
            <Check size={14} />
            Set as Active Product
          </button>
          <button
            onClick={handleDiscard}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#a1a1aa",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );

  const savedMessage = result && (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{
        background: "rgba(245,158,11,0.08)",
        border: "1px solid rgba(245,158,11,0.2)",
      }}
    >
      <Check size={14} style={{ color: "#f59e0b", flexShrink: 0 }} />
      <span className="text-sm flex-1" style={{ color: "#f5f5f5" }}>
        <span style={{ color: "#f59e0b", fontWeight: 700 }}>
          {result.cleanTitle || result.productTitle}
        </span>{" "}
        is now your active product
      </span>
      <button
        onClick={() => setLocation("/app/product-discovery")}
        className="flex items-center gap-1.5 text-xs font-bold transition-all flex-shrink-0"
        style={{
          color: "#f59e0b",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontFamily: "Syne, sans-serif",
        }}
      >
        Open in tools <ArrowRight size={11} />
      </button>
    </div>
  );

  // ── Compact mode ───────────────────────────────────────────────────────────

  if (compact) {
    return (
      <div className="space-y-3">
        {status === "idle" && inputBlock}
        {status === "loading" && loadingBlock}
        {status === "error" && (
          <>
            {errorBlock}
            {inputBlock}
          </>
        )}
        {status === "result" && resultCard}
        {status === "saved" && savedMessage}
      </div>
    );
  }

  // ── Full card mode ─────────────────────────────────────────────────────────

  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{
        background: "#111111",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div>
        <h3
          className="text-sm font-black mb-0.5"
          style={{ fontFamily: "Syne, sans-serif", color: "#f5f5f5" }}
        >
          Import Product
        </h3>
        <p className="text-xs" style={{ color: "#a1a1aa" }}>
          Paste any product URL to auto-fill details
        </p>
      </div>

      {(status === "idle" || status === "error") && (
        <>
          {status === "error" && errorBlock}
          {inputBlock}
        </>
      )}

      {status === "loading" && loadingBlock}

      {status === "result" && resultCard}

      {status === "saved" && (
        <>
          {savedMessage}
          <button
            onClick={handleDiscard}
            className="w-full py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#a1a1aa",
              cursor: "pointer",
            }}
          >
            Import another product
          </button>
        </>
      )}

      {/* Source link */}
      {(status === "result" || status === "saved") && result?.sourceUrl && (
        <a
          href={result.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs transition-all"
          style={{ color: "#a1a1aa" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#f59e0b")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#a1a1aa")}
        >
          <ExternalLink size={11} />
          View original listing
        </a>
      )}
    </div>
  );
}

export default ProductImporter;
