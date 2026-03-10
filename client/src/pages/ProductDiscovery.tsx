import { useState, useCallback, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { toast } from "sonner";
import { Search, Copy, Check, Loader2, TrendingUp, DollarSign, Package, Star, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { SaveToProduct } from "@/components/SaveToProduct";

interface ProductIdea {
  name: string;
  niche: string;
  problemSolved: string;
  targetAudience: string;
  estimatedMargin: string;
  competitionLevel: "Low" | "Medium" | "High";
  trendDirection: "Rising" | "Stable" | "Declining";
  avgPrice: string;
  whyNow: string;
  suppliers: string;
  score: number;
}

interface DiscoveryResult {
  summary: string;
  products: ProductIdea[];
  topPick: string;
  marketContext: string;
}

const SYSTEM_PROMPT = `You are an expert ecommerce product researcher specialising in finding winning dropshipping and private label products.
When given a niche/category, return a JSON object with this EXACT structure (no markdown, no explanation, just raw JSON):
{"summary":"Brief market overview","products":[{"name":"Product name","niche":"Sub-niche","problemSolved":"Problem it solves","targetAudience":"Who buys this","estimatedMargin":"e.g. 40-60%","competitionLevel":"Low|Medium|High","trendDirection":"Rising|Stable|Declining","avgPrice":"e.g. $29-49","whyNow":"Why this is a good opportunity right now","suppliers":"Where to source (AliExpress/Alibaba/etc)","score":85}],"topPick":"Name of the best product and why","marketContext":"Key market insight"}
Return exactly 5 product ideas. Score each from 0-100 based on opportunity. Return ONLY raw JSON.`;

function parseResult(text: string): DiscoveryResult | null {
  try {
    const stripped = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const start = stripped.indexOf("{");
    const end = stripped.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    const parsed = JSON.parse(stripped.slice(start, end + 1));
    if (!parsed.products || !Array.isArray(parsed.products)) return null;
    return parsed as DiscoveryResult;
  } catch { return null; }
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); toast.success("Copied!"); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all flex-shrink-0"
      style={{ background: copied ? "rgba(45,202,114,0.1)" : "rgba(255,255,255,0.05)", border: `1px solid ${copied ? "rgba(45,202,114,0.3)" : "rgba(255,255,255,0.08)"}`, color: copied ? "rgba(45,202,114,0.8)" : "rgba(240,237,232,0.4)", cursor: "pointer" }}>
      {copied ? <Check size={9} /> : <Copy size={9} />}
    </button>
  );
}

const COMPETITION_COLORS: Record<string, string> = {
  Low: "#2dca72", Medium: "#d4af37", High: "#e05c7a",
};
const TREND_ICONS: Record<string, string> = {
  Rising: "↑", Stable: "→", Declining: "↓",
};

function ProductCard({ product, index }: { product: ProductIdea; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);
  const cc = COMPETITION_COLORS[product.competitionLevel] || "#d4af37";
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-3 p-4 text-left" style={{ cursor: "pointer" }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0" style={{
          background: product.score >= 75 ? "rgba(45,202,114,0.15)" : product.score >= 50 ? "rgba(212,175,55,0.12)" : "rgba(224,92,122,0.15)",
          color: product.score >= 75 ? "#2dca72" : product.score >= 50 ? "#d4af37" : "#e05c7a",
          fontFamily: "Syne, sans-serif",
        }}>
          {product.score}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black leading-tight" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8" }}>{product.name}</div>
          <div className="text-xs mt-0.5" style={{ color: "rgba(240,237,232,0.4)" }}>{product.niche} · {product.avgPrice}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${cc}18`, color: cc, border: `1px solid ${cc}33` }}>{product.competitionLevel}</span>
          <span className="text-xs font-bold" style={{ color: product.trendDirection === "Rising" ? "#2dca72" : product.trendDirection === "Declining" ? "#e05c7a" : "#d4af37" }}>
            {TREND_ICONS[product.trendDirection]} {product.trendDirection}
          </span>
          {expanded ? <ChevronUp size={13} style={{ color: "rgba(240,237,232,0.3)" }} /> : <ChevronDown size={13} style={{ color: "rgba(240,237,232,0.3)" }} />}
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl" style={{ background: "rgba(0,0,0,0.2)" }}>
              <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(240,237,232,0.35)", fontFamily: "Syne, sans-serif" }}>Problem Solved</div>
              <div className="text-xs leading-relaxed" style={{ color: "rgba(240,237,232,0.75)" }}>{product.problemSolved}</div>
            </div>
            <div className="p-3 rounded-xl" style={{ background: "rgba(0,0,0,0.2)" }}>
              <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(240,237,232,0.35)", fontFamily: "Syne, sans-serif" }}>Target Audience</div>
              <div className="text-xs leading-relaxed" style={{ color: "rgba(240,237,232,0.75)" }}>{product.targetAudience}</div>
            </div>
            <div className="p-3 rounded-xl" style={{ background: "rgba(0,0,0,0.2)" }}>
              <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(240,237,232,0.35)", fontFamily: "Syne, sans-serif" }}>Est. Margin</div>
              <div className="text-sm font-black" style={{ color: "#2dca72", fontFamily: "Syne, sans-serif" }}>{product.estimatedMargin}</div>
            </div>
            <div className="p-3 rounded-xl" style={{ background: "rgba(0,0,0,0.2)" }}>
              <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(240,237,232,0.35)", fontFamily: "Syne, sans-serif" }}>Suppliers</div>
              <div className="text-xs" style={{ color: "rgba(240,237,232,0.75)" }}>{product.suppliers}</div>
            </div>
          </div>
          <div className="p-3 rounded-xl" style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.12)" }}>
            <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#d4af37", fontFamily: "Syne, sans-serif" }}>Why Now</div>
            <div className="text-xs leading-relaxed" style={{ color: "rgba(240,237,232,0.75)" }}>{product.whyNow}</div>
          </div>
        </div>
      )}
    </div>
  );
}

const EXAMPLE_NICHES = ["Pet accessories", "Home gym equipment", "Eco-friendly kitchen", "Baby & toddler", "Outdoor & camping"];

export default function ProductDiscovery() {
  const [niche, setNiche] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [targetMarket, setTargetMarket] = useState("Australia");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [genError, setGenError] = useState("");
  const [searchResults, setSearchResults] = useState<string>("");
  const searchMutation = trpc.research.search.useMutation();

  const handleGenerate = useCallback(async () => {
    if (!niche.trim()) { toast.error("Please enter a niche or category"); return; }
    setGenerating(true); setGenError(""); setResult(null);
    
    // First do a real Tavily search for context
    let context = "";
    try {
      const searchData = await searchMutation.mutateAsync({
        query: `${niche} trending products ${targetMarket} 2025 dropshipping`,
        maxResults: 3,
        searchDepth: "basic",
      });
      context = searchData.results.map(r => `${r.title}: ${r.content}`).join("\n\n");
      setSearchResults(context);
    } catch { /* ignore search errors */ }

    const prompt = [
      `Niche/Category: ${niche}`,
      priceRange && `Price Range: $${priceRange}`,
      `Target Market: ${targetMarket}`,
      context && `\nRecent market data:\n${context.slice(0, 1500)}`,
    ].filter(Boolean).join("\n");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          systemPrompt: SYSTEM_PROMPT,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${response.status}`);
      }

      // Read the streaming response line by line
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        // Parse line-delimited format: 0:"text"\n
        for (const line of chunk.split("\n")) {
          if (line.startsWith("0:")) {
            try {
              const text = JSON.parse(line.slice(2));
              fullText += text;
            } catch { /* skip malformed lines */ }
          } else if (line.startsWith("e:")) {
            try {
              const err = JSON.parse(line.slice(2));
              throw new Error(err.error || "Stream error");
            } catch (e: any) {
              if (e.message !== "Stream error") throw e;
            }
          }
        }
      }

      if (!fullText.trim()) {
        setGenError("No response received. Please try again.");
      } else {
        const parsed = parseResult(fullText);
        if (parsed) {
          setResult(parsed);
          localStorage.setItem("majorka_milestone_research", "true");
        } else {
          setGenError("Could not parse results. Please try again.");
        }
      }
    } catch (err: any) {
      console.error("ProductDiscovery error:", err);
      setGenError(err.message || "Failed to generate. Please try again.");
    } finally {
      setGenerating(false);
    }
  }, [niche, priceRange, targetMarket, searchMutation]);

  const isLoading = generating;

  return (
    <div className="h-full flex flex-col" style={{ background: "#080a0e", color: "#f0ede8", fontFamily: "DM Sans, sans-serif" }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)", background: "#0c0e12" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(45,202,114,0.15)", border: "1px solid rgba(45,202,114,0.3)" }}>
          <Search size={15} style={{ color: "#2dca72" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black leading-tight" style={{ fontFamily: "Syne, sans-serif" }}>Product Discovery</div>
          <div className="text-xs" style={{ color: "rgba(240,237,232,0.35)" }}>AI-powered product research · Real-time market data · Opportunity scoring</div>
        </div>
        {result && (
          <button onClick={() => { setResult(null); setGenError(""); }} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(240,237,232,0.5)", cursor: "pointer" }}>
            <RefreshCw size={11} /> New Search
          </button>
        )}
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* LEFT: Input panel */}
        <div className="w-72 flex-shrink-0 overflow-y-auto border-r p-4 space-y-4" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "Syne, sans-serif" }}>Research Parameters</div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(240,237,232,0.6)", fontFamily: "Syne, sans-serif" }}>Niche / Category *</label>
                <input value={niche} onChange={e => setNiche(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !isLoading && handleGenerate()}
                  placeholder="e.g. Pet accessories, Home gym…"
                  className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#f0ede8" }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(240,237,232,0.6)", fontFamily: "Syne, sans-serif" }}>Price Range (AUD)</label>
                <input value={priceRange} onChange={e => setPriceRange(e.target.value)}
                  placeholder="e.g. 20-80"
                  className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#f0ede8" }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(240,237,232,0.6)", fontFamily: "Syne, sans-serif" }}>Target Market</label>
                <select value={targetMarket} onChange={e => setTargetMarket(e.target.value)}
                  className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#f0ede8" }}>
                  {["Australia", "United States", "United Kingdom", "Canada", "Global"].map(m => (
                    <option key={m} value={m} style={{ background: "#0c0e12" }}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Example chips */}
          <div>
            <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(240,237,232,0.3)", fontFamily: "Syne, sans-serif" }}>Quick Start</div>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLE_NICHES.map(n => (
                <button key={n} onClick={() => setNiche(n)}
                  className="text-xs px-2.5 py-1 rounded-lg transition-all"
                  style={{ background: niche === n ? "rgba(45,202,114,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${niche === n ? "rgba(45,202,114,0.3)" : "rgba(255,255,255,0.07)"}`, color: niche === n ? "#2dca72" : "rgba(240,237,232,0.45)", cursor: "pointer" }}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleGenerate} disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm transition-all"
            style={{ background: isLoading ? "rgba(45,202,114,0.25)" : "#2dca72", color: "#080a0e", fontFamily: "Syne, sans-serif", cursor: isLoading ? "not-allowed" : "pointer" }}>
            {isLoading ? <><Loader2 size={14} className="animate-spin" /> Researching…</> : <><Search size={14} /> Discover Products</>}
          </button>

          {genError && (
            <div className="text-xs p-3 rounded-xl" style={{ background: "rgba(224,92,122,0.1)", border: "1px solid rgba(224,92,122,0.25)", color: "rgba(224,92,122,0.9)" }}>
              {genError}
            </div>
          )}
        </div>

        {/* RIGHT: Output panel */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading && !result && (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(45,202,114,0.1)", border: "1px solid rgba(45,202,114,0.2)" }}>
                <TrendingUp size={24} style={{ color: "#2dca72" }} className="animate-pulse" />
              </div>
              <div className="text-center">
                <div className="text-sm font-black mb-1" style={{ fontFamily: "Syne, sans-serif" }}>Researching {niche}…</div>
                <div className="text-xs" style={{ color: "rgba(240,237,232,0.35)" }}>Scanning market trends and opportunity data</div>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4 max-w-3xl">
              {/* Summary */}
              <div className="p-4 rounded-2xl" style={{ background: "rgba(45,202,114,0.05)", border: "1px solid rgba(45,202,114,0.15)" }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "#2dca72", fontFamily: "Syne, sans-serif" }}>Market Overview</div>
                  <CopyBtn text={result.summary} />
                </div>
                <div className="text-sm leading-relaxed" style={{ color: "rgba(240,237,232,0.8)" }}>{result.summary}</div>
              </div>

              {/* Top pick highlight */}
              <div className="p-4 rounded-2xl" style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <Star size={12} style={{ color: "#d4af37" }} />
                  <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "#d4af37", fontFamily: "Syne, sans-serif" }}>Top Pick</div>
                </div>
                <div className="text-sm leading-relaxed" style={{ color: "rgba(240,237,232,0.8)" }}>{result.topPick}</div>
              </div>

              {/* Product cards */}
              <div>
                <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "Syne, sans-serif" }}>
                  {result.products.length} Product Opportunities
                </div>
                <div className="space-y-3">
                  {result.products.map((p, i) => <ProductCard key={i} product={p} index={i} />)}
                </div>
              </div>

              {/* Market context */}
              {result.marketContext && (
                <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "Syne, sans-serif" }}>Market Context</div>
                  <div className="text-xs leading-relaxed" style={{ color: "rgba(240,237,232,0.6)" }}>{result.marketContext}</div>
                </div>
              )}
            </div>
          )}

          {!isLoading && !result && (
            <div className="h-full flex flex-col items-center justify-center gap-5 p-8">
              <div className="text-5xl">🔍</div>
              <div className="text-center">
                <div className="text-base font-black mb-2" style={{ fontFamily: "Syne, sans-serif" }}>Find your next winning product</div>
                <div className="text-xs max-w-xs leading-relaxed" style={{ color: "rgba(240,237,232,0.35)" }}>
                  Enter a niche or category and get 5 scored product opportunities with margin estimates, competition analysis, and supplier leads.
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 max-w-sm w-full">
                {[
                  { icon: <TrendingUp size={14} />, label: "Trend analysis" },
                  { icon: <DollarSign size={14} />, label: "Margin estimates" },
                  { icon: <Package size={14} />, label: "Supplier leads" },
                  { icon: <Star size={14} />, label: "Opportunity score" },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ color: "#2dca72" }}>{icon}</span>
                    <span className="text-xs" style={{ color: "rgba(240,237,232,0.5)" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
