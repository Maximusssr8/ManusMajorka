import { useState, useCallback, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { toast } from "sonner";
import { Truck, Copy, Check, Loader2, RefreshCw, ExternalLink } from "lucide-react";
import { SaveToProduct } from "@/components/SaveToProduct";
import { useActiveProduct } from "@/hooks/useActiveProduct";
import { ActiveProductBanner } from "@/components/ActiveProductBanner";

interface Supplier {
  name: string;
  platform: string;
  location: string;
  moq: string;
  leadTime: string;
  priceRange: string;
  reliability: "High" | "Medium" | "Low";
  specialties: string[];
  searchTerms: string[];
  pros: string[];
  cons: string[];
  contactApproach: string;
}

interface SupplierResult {
  productSummary: string;
  suppliers: Supplier[];
  recommendedPlatforms: string[];
  negotiationTips: string[];
  redFlags: string[];
  sampleOrderAdvice: string;
}

const SYSTEM_PROMPT = `You are an expert ecommerce sourcing specialist with deep knowledge of global supply chains, Alibaba, and product sourcing.
When given a product, return a JSON object with this EXACT structure (no markdown, just raw JSON):
{"productSummary":"Brief product summary","suppliers":[{"name":"Supplier/platform name","platform":"Alibaba|AliExpress|DHgate|1688|Faire|Local","location":"Country/region","moq":"Minimum order quantity e.g. 50 units","leadTime":"e.g. 15-25 days","priceRange":"e.g. $3-8 USD per unit","reliability":"High|Medium|Low","specialties":["Specialty 1","Specialty 2"],"searchTerms":["Search term 1 for this platform","Search term 2"],"pros":["Pro 1","Pro 2","Pro 3"],"cons":["Con 1","Con 2"],"contactApproach":"How to approach and what to say"}],"recommendedPlatforms":["Platform 1 with reason","Platform 2 with reason"],"negotiationTips":["Tip 1","Tip 2","Tip 3","Tip 4"],"redFlags":["Red flag 1","Red flag 2","Red flag 3"],"sampleOrderAdvice":"Advice on ordering samples and what to check"}
Return 4-5 suppliers. Return ONLY raw JSON.`;

function parseResult(text: string): SupplierResult | null {
  try {
    const stripped = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const start = stripped.indexOf("{");
    const end = stripped.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    const parsed = JSON.parse(stripped.slice(start, end + 1));
    if (!parsed.suppliers || !Array.isArray(parsed.suppliers)) return null;
    return parsed as SupplierResult;
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

const RELIABILITY_COLORS: Record<string, string> = { High: "#2dca72", Medium: "#d4af37", Low: "#e05c7a" };
const PLATFORM_COLORS: Record<string, string> = {
  Alibaba: "#e05c7a", AliExpress: "#d4af37", DHgate: "#4ab8f5", "1688": "#9c5fff", Faire: "#2dca72", Local: "#2dca72",
};

function SupplierCard({ supplier }: { supplier: Supplier }) {
  const [tab, setTab] = useState<"overview" | "search" | "contact">("overview");
  const pc = PLATFORM_COLORS[supplier.platform] || "#4ab8f5";
  const rc = RELIABILITY_COLORS[supplier.reliability] || "#d4af37";

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-sm font-black" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8" }}>{supplier.name}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${pc}18`, color: pc }}>{supplier.platform}</span>
              <span className="text-xs" style={{ color: "rgba(240,237,232,0.35)" }}>{supplier.location}</span>
            </div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${rc}15`, color: rc, border: `1px solid ${rc}30` }}>
            {supplier.reliability}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
          {[
            { label: "MOQ", value: supplier.moq },
            { label: "Lead Time", value: supplier.leadTime },
            { label: "Price Range", value: supplier.priceRange },
          ].map(({ label, value }) => (
            <div key={label} className="p-2 rounded-lg text-center" style={{ background: "rgba(0,0,0,0.2)" }}>
              <div className="text-xs mb-0.5" style={{ color: "rgba(240,237,232,0.35)", fontFamily: "Syne, sans-serif" }}>{label}</div>
              <div className="text-xs font-black" style={{ color: "#f0ede8", fontFamily: "Syne, sans-serif" }}>{value}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-1 mb-3 p-1 rounded-lg" style={{ background: "rgba(0,0,0,0.2)" }}>
          {(["overview", "search", "contact"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 text-xs py-1.5 rounded-md capitalize font-semibold transition-all"
              style={{ background: tab === t ? pc : "transparent", color: tab === t ? "#080a0e" : "rgba(240,237,232,0.4)", cursor: "pointer", fontFamily: "Syne, sans-serif" }}>
              {t}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl" style={{ background: "rgba(0,0,0,0.15)" }}>
              <div className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "rgba(240,237,232,0.35)", fontFamily: "Syne, sans-serif" }}>Pros</div>
              {supplier.pros.map((p, i) => (
                <div key={i} className="text-xs flex items-start gap-1.5 mb-1" style={{ color: "rgba(240,237,232,0.7)" }}>
                  <span style={{ color: "#2dca72", flexShrink: 0 }}>+</span>{p}
                </div>
              ))}
            </div>
            <div className="p-2.5 rounded-xl" style={{ background: "rgba(0,0,0,0.15)" }}>
              <div className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "rgba(240,237,232,0.35)", fontFamily: "Syne, sans-serif" }}>Cons</div>
              {supplier.cons.map((c, i) => (
                <div key={i} className="text-xs flex items-start gap-1.5 mb-1" style={{ color: "rgba(240,237,232,0.7)" }}>
                  <span style={{ color: "#e05c7a", flexShrink: 0 }}>−</span>{c}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "search" && (
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "rgba(240,237,232,0.35)", fontFamily: "Syne, sans-serif" }}>Search Terms to Use</div>
            {supplier.searchTerms.map((term, i) => (
              <div key={i} className="flex items-center justify-between gap-2 p-2 rounded-lg" style={{ background: "rgba(0,0,0,0.2)" }}>
                <span className="text-xs font-mono" style={{ color: "#f0ede8" }}>"{term}"</span>
                <div className="flex items-center gap-1">
                  <CopyBtn text={term} />
                  <a href={`https://www.${supplier.platform.toLowerCase()}.com/search?q=${encodeURIComponent(term)}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                    style={{ background: `${pc}15`, color: pc, border: `1px solid ${pc}30` }}>
                    <ExternalLink size={9} /> Search
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "contact" && (
          <div className="p-3 rounded-xl" style={{ background: "rgba(0,0,0,0.2)" }}>
            <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "rgba(240,237,232,0.35)", fontFamily: "Syne, sans-serif" }}>Contact Approach</div>
            <div className="text-xs leading-relaxed" style={{ color: "rgba(240,237,232,0.7)" }}>{supplier.contactApproach}</div>
          </div>
        )}
      </div>
    </div>
  );
}

const PRODUCT_CATEGORIES = ["Electronics accessories", "Health & wellness", "Home & kitchen", "Beauty & skincare", "Pet products", "Sports & fitness"];

export default function SupplierFinder() {
  const [product, setProduct] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [orderQty, setOrderQty] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<SupplierResult | null>(null);
  const [genError, setGenError] = useState("");
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const searchQueryRef = useRef("");
  const { activeProduct } = useActiveProduct();

  useEffect(() => {
    if (activeProduct && !product) {
      setProduct(activeProduct.name);
    }
  }, [activeProduct]);

  const getSystemPrompt = () => {
    if (!activeProduct) return SYSTEM_PROMPT;
    return SYSTEM_PROMPT + `\n\nACTIVE PRODUCT CONTEXT:\n- Product: ${activeProduct.name}${activeProduct.niche ? '\n- Niche: ' + activeProduct.niche : ''}${activeProduct.summary ? '\n- Summary: ' + activeProduct.summary : ''}\n\nAll advice and output must be specifically tailored to this product. Reference it by name.`;
  };

  const { sendMessage, status, messages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest({ messages }) {
        return {
          body: {
            messages: messages.map((m: UIMessage) => ({
              role: m.role,
              content: m.parts.filter((p: any) => p.type === "text").map((p: any) => p.text).join(""),
            })),
            systemPrompt: getSystemPrompt(),
            searchQuery: searchQueryRef.current || undefined,
          },
        };
      },
    }),
  });

  useEffect(() => {
    if (status === "streaming" || status === "submitted") setWaitingForResponse(true);
  }, [status]);

  useEffect(() => {
    if (status !== "ready" || !generating || !waitingForResponse) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === "assistant") {
      const text = lastMsg.parts.filter((p: any) => p.type === "text").map((p: any) => p.text).join("");
      const parsed = parseResult(text);
      if (parsed) setResult(parsed);
      else setGenError("Could not parse results. Please try again.");
    } else {
      setGenError("No response received. Please try again.");
    }
    setGenerating(false);
    setWaitingForResponse(false);
  }, [status, generating, waitingForResponse, messages]);

  const handleGenerate = useCallback(async () => {
    if (!product.trim()) { toast.error("Please enter a product"); return; }
    setGenerating(true); setGenError(""); setResult(null);

    const searchQuery = `${product} supplier manufacturer wholesale China Alibaba`;
    searchQueryRef.current = searchQuery;

    const prompt = [
      `Product to source: ${product}`,
      targetPrice && `Target retail price: $${targetPrice} AUD`,
      orderQty && `Initial order quantity: ${orderQty} units`,
    ].filter(Boolean).join("\n");
    sendMessage({ text: prompt });
    setWaitingForResponse(true);
  }, [product, targetPrice, orderQty, sendMessage]);

  const isLoading = generating || status === "streaming" || status === "submitted";

  return (
    <div className="h-full flex flex-col" style={{ background: "#080a0e", color: "#f0ede8", fontFamily: "DM Sans, sans-serif" }}>
      <div className="flex items-center gap-3 px-5 py-3 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)", background: "#0c0e12" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(45,202,114,0.15)", border: "1px solid rgba(45,202,114,0.3)" }}>
          <Truck size={15} style={{ color: "#2dca72" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black leading-tight" style={{ fontFamily: "Syne, sans-serif" }}>Supplier Finder</div>
          <div className="text-xs" style={{ color: "rgba(240,237,232,0.35)" }}>Alibaba · DHgate · AliExpress · MOQ · Lead times · Search terms</div>
        </div>
        {result && (
          <button onClick={() => { setResult(null); setGenError(""); }} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(240,237,232,0.5)", cursor: "pointer" }}>
            <RefreshCw size={11} /> New Search
          </button>
        )}
      </div>

      <ActiveProductBanner ctaLabel="Load into tool" onUseProduct={(summary) => setProduct(summary)} />

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        <div className="w-full lg:w-72 flex-shrink-0 overflow-y-auto border-b lg:border-b-0 lg:border-r p-4 space-y-4" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(240,237,232,0.6)", fontFamily: "Syne, sans-serif" }}>Product to Source *</label>
              <input value={product} onChange={e => setProduct(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !isLoading && handleGenerate()}
                placeholder="e.g. Posture corrector belt…"
                className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#f0ede8" }} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(240,237,232,0.6)", fontFamily: "Syne, sans-serif" }}>Target Retail ($AUD)</label>
                <input value={targetPrice} onChange={e => setTargetPrice(e.target.value)}
                  placeholder="e.g. 79"
                  className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#f0ede8" }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(240,237,232,0.6)", fontFamily: "Syne, sans-serif" }}>Order Qty</label>
                <input value={orderQty} onChange={e => setOrderQty(e.target.value)}
                  placeholder="e.g. 100"
                  className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#f0ede8" }} />
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(240,237,232,0.3)", fontFamily: "Syne, sans-serif" }}>Quick Categories</div>
            <div className="flex flex-wrap gap-1.5">
              {PRODUCT_CATEGORIES.map(c => (
                <button key={c} onClick={() => setProduct(c)}
                  className="text-xs px-2.5 py-1 rounded-lg transition-all"
                  style={{ background: product === c ? "rgba(45,202,114,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${product === c ? "rgba(45,202,114,0.3)" : "rgba(255,255,255,0.07)"}`, color: product === c ? "#2dca72" : "rgba(240,237,232,0.45)", cursor: "pointer" }}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleGenerate} disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm transition-all"
            style={{ background: isLoading ? "rgba(45,202,114,0.25)" : "#2dca72", color: "#080a0e", fontFamily: "Syne, sans-serif", cursor: isLoading ? "not-allowed" : "pointer" }}>
            {isLoading ? <><Loader2 size={14} className="animate-spin" /> Searching…</> : <><Truck size={14} /> Find Suppliers</>}
          </button>

          {genError && (
            <div className="text-xs p-3 rounded-xl" style={{ background: "rgba(224,92,122,0.1)", border: "1px solid rgba(224,92,122,0.25)", color: "rgba(224,92,122,0.9)" }}>
              {genError}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {isLoading && !result && (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(45,202,114,0.1)", border: "1px solid rgba(45,202,114,0.2)" }}>
                <Truck size={24} style={{ color: "#2dca72" }} className="animate-pulse" />
              </div>
              <div className="text-center">
                <div className="text-sm font-black mb-1" style={{ fontFamily: "Syne, sans-serif" }}>Finding suppliers…</div>
                <div className="text-xs" style={{ color: "rgba(240,237,232,0.35)" }}>Searching global sourcing platforms</div>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl" style={{ background: "rgba(45,202,114,0.04)", border: "1px solid rgba(45,202,114,0.12)" }}>
                  <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#2dca72", fontFamily: "Syne, sans-serif" }}>Recommended Platforms</div>
                  {result.recommendedPlatforms.map((p, i) => (
                    <div key={i} className="text-xs flex items-start gap-1.5 mb-1.5" style={{ color: "rgba(240,237,232,0.7)" }}>
                      <span style={{ color: "#2dca72", flexShrink: 0 }}>→</span>{p}
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-2xl" style={{ background: "rgba(224,92,122,0.04)", border: "1px solid rgba(224,92,122,0.12)" }}>
                  <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#e05c7a", fontFamily: "Syne, sans-serif" }}>Red Flags to Watch</div>
                  {result.redFlags.map((f, i) => (
                    <div key={i} className="text-xs flex items-start gap-1.5 mb-1.5" style={{ color: "rgba(240,237,232,0.7)" }}>
                      <span style={{ color: "#e05c7a", flexShrink: 0 }}>!</span>{f}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {result.suppliers.map((s, i) => <SupplierCard key={i} supplier={s} />)}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl" style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.12)" }}>
                  <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#d4af37", fontFamily: "Syne, sans-serif" }}>Negotiation Tips</div>
                  {result.negotiationTips.map((tip, i) => (
                    <div key={i} className="text-xs flex items-start gap-1.5 mb-1.5" style={{ color: "rgba(240,237,232,0.7)" }}>
                      <span style={{ color: "#d4af37", flexShrink: 0 }}>{i + 1}.</span>{tip}
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-2xl" style={{ background: "rgba(74,184,245,0.04)", border: "1px solid rgba(74,184,245,0.12)" }}>
                  <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#4ab8f5", fontFamily: "Syne, sans-serif" }}>Sample Order Advice</div>
                  <div className="text-xs leading-relaxed" style={{ color: "rgba(240,237,232,0.65)" }}>{result.sampleOrderAdvice}</div>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !result && (
            <div className="h-full flex flex-col items-center justify-center gap-4 p-8">
              <div className="text-5xl">🚚</div>
              <div className="text-center">
                <div className="text-base font-black mb-2" style={{ fontFamily: "Syne, sans-serif" }}>Find the right supplier fast</div>
                <div className="text-xs max-w-xs leading-relaxed" style={{ color: "rgba(240,237,232,0.35)" }}>
                  Get supplier recommendations with MOQ, lead times, search terms, and negotiation tips across Alibaba, DHgate, and more.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
