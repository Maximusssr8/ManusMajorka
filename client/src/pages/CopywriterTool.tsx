import { useState, useCallback, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { toast } from "sonner";
import { PenTool, Copy, Check, Loader2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { SaveToProduct } from "@/components/SaveToProduct";
import { useActiveProduct } from "@/hooks/useActiveProduct";
import { ActiveProductBanner } from "@/components/ActiveProductBanner";
import { injectProductIntelligence } from "@/lib/buildToolPrompt";

interface CopyOutput {
  headline: string;
  subheadline: string;
  productDescription: string;
  bulletPoints: string[];
  heroHook: string;
  socialProof: string;
  cta: string;
  emailSubjectLines: string[];
  adHeadlines: string[];
  adPrimaryTexts: string[];
  seoTitle: string;
  seoMetaDescription: string;
  tiktokHook: string;
  usp: string;
}

const SYSTEM_PROMPT = `You are an elite ecommerce copywriter who has generated $100M+ in sales. Write high-converting copy using proven frameworks (PAS, AIDA, FAB).
When given a product, return a JSON object with this EXACT structure (no markdown, just raw JSON):
{"headline":"Main product headline (benefit-driven, max 10 words)","subheadline":"Supporting subheadline (max 20 words)","productDescription":"2-3 sentence product description for website","bulletPoints":["Benefit bullet 1","Benefit bullet 2","Benefit bullet 3","Benefit bullet 4","Benefit bullet 5"],"heroHook":"Scroll-stopping opening line for ads/landing page","socialProof":"Social proof statement (e.g. 'Join 12,000+ Australians who...')","cta":"Call-to-action button text","emailSubjectLines":["Subject line 1","Subject line 2","Subject line 3","Subject line 4","Subject line 5"],"adHeadlines":["Ad headline 1","Ad headline 2","Ad headline 3","Ad headline 4","Ad headline 5"],"adPrimaryTexts":["Short ad primary text 1 (2-3 sentences)","Short ad primary text 2 (2-3 sentences)","Short ad primary text 3 (2-3 sentences)"],"seoTitle":"SEO page title (max 60 chars)","seoMetaDescription":"SEO meta description (max 155 chars)","tiktokHook":"TikTok video hook (first 3 seconds, max 15 words)","usp":"Unique selling proposition (one sentence)"}
Return ONLY raw JSON.`;

function parseResult(text: string): CopyOutput | null {
  try {
    const stripped = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const start = stripped.indexOf("{");
    const end = stripped.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    const parsed = JSON.parse(stripped.slice(start, end + 1));
    if (!parsed.headline) return null;
    return parsed as CopyOutput;
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

function CopySection({ title, accent = "rgba(240,237,232,0.4)", children }: { title: string; accent?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3" style={{ background: "rgba(255,255,255,0.02)", cursor: "pointer" }}>
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent, fontFamily: "Syne, sans-serif" }}>{title}</span>
        {open ? <ChevronUp size={12} style={{ color: "rgba(240,237,232,0.3)" }} /> : <ChevronDown size={12} style={{ color: "rgba(240,237,232,0.3)" }} />}
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

function CopyItem({ label, text }: { label?: string; text: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="flex-1 min-w-0">
        {label && <div className="text-xs mb-0.5" style={{ color: "rgba(240,237,232,0.3)", fontFamily: "Syne, sans-serif" }}>{label}</div>}
        <div className="text-sm leading-relaxed" style={{ color: "#f0ede8" }}>{text}</div>
      </div>
      <CopyBtn text={text} />
    </div>
  );
}

const TONES = ["Conversational", "Professional", "Urgent", "Playful", "Luxury", "Empathetic"];
const FRAMEWORKS = ["PAS (Problem-Agitate-Solve)", "AIDA (Attention-Interest-Desire-Action)", "FAB (Features-Advantages-Benefits)", "Before/After/Bridge"];

export default function CopywriterTool() {
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("Conversational");
  const [framework, setFramework] = useState("PAS (Problem-Agitate-Solve)");
  const [pricePoint, setPricePoint] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<CopyOutput | null>(null);
  const [genError, setGenError] = useState("");
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const { activeProduct } = useActiveProduct();

  useEffect(() => {
    if (activeProduct && !product) {
      const prefill = activeProduct.name + (activeProduct.summary ? "\n" + activeProduct.summary : "");
      setProduct(prefill);
    }
  }, [activeProduct]);

  const getSystemPrompt = () => {
    return injectProductIntelligence(SYSTEM_PROMPT, activeProduct as any);
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

  const handleGenerate = useCallback(() => {
    if (!product.trim()) { toast.error("Please enter a product"); return; }
    setGenerating(true); setGenError(""); setResult(null);
    const prompt = [
      `Product: ${product}`,
      audience && `Target audience: ${audience}`,
      `Tone: ${tone}`,
      `Framework: ${framework}`,
      pricePoint && `Price: $${pricePoint}`,
    ].filter(Boolean).join("\n");
    sendMessage({ text: prompt });
    setWaitingForResponse(true);
  }, [product, audience, tone, framework, pricePoint, sendMessage]);

  const isLoading = generating || status === "streaming" || status === "submitted";

  return (
    <div className="h-full flex flex-col" style={{ background: "#080a0e", color: "#f0ede8", fontFamily: "DM Sans, sans-serif" }}>
      <div className="flex items-center gap-3 px-5 py-3 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)", background: "#0c0e12" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(224,92,122,0.15)", border: "1px solid rgba(224,92,122,0.3)" }}>
          <PenTool size={15} style={{ color: "#e05c7a" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black leading-tight" style={{ fontFamily: "Syne, sans-serif" }}>Copywriter</div>
          <div className="text-xs" style={{ color: "rgba(240,237,232,0.35)" }}>Headlines · Ad copy · Email subjects · SEO · TikTok hooks</div>
        </div>
        {result && (
          <button onClick={() => { setResult(null); setGenError(""); }} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(240,237,232,0.5)", cursor: "pointer" }}>
            <RefreshCw size={11} /> New Copy
          </button>
        )}
      </div>

      <ActiveProductBanner ctaLabel="Load into tool" onUseProduct={(summary) => setProduct(summary)} />

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        <div className="w-full lg:w-72 flex-shrink-0 overflow-y-auto border-b lg:border-b-0 lg:border-r p-4 space-y-4" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(240,237,232,0.6)", fontFamily: "Syne, sans-serif" }}>Product / Offer *</label>
              <textarea value={product} onChange={e => setProduct(e.target.value)} rows={3}
                placeholder="Describe your product, key features, and what makes it special…"
                className="w-full text-sm px-3 py-2.5 rounded-xl outline-none resize-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#f0ede8" }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(240,237,232,0.6)", fontFamily: "Syne, sans-serif" }}>Target Audience</label>
              <input value={audience} onChange={e => setAudience(e.target.value)}
                placeholder="e.g. Busy mums aged 28-40…"
                className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#f0ede8" }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(240,237,232,0.6)", fontFamily: "Syne, sans-serif" }}>Tone</label>
              <div className="flex flex-wrap gap-1.5">
                {TONES.map(t => (
                  <button key={t} onClick={() => setTone(t)}
                    className="text-xs px-2.5 py-1 rounded-lg transition-all"
                    style={{ background: tone === t ? "rgba(224,92,122,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${tone === t ? "rgba(224,92,122,0.3)" : "rgba(255,255,255,0.07)"}`, color: tone === t ? "#e05c7a" : "rgba(240,237,232,0.45)", cursor: "pointer" }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(240,237,232,0.6)", fontFamily: "Syne, sans-serif" }}>Framework</label>
              <select value={framework} onChange={e => setFramework(e.target.value)}
                className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#f0ede8" }}>
                {FRAMEWORKS.map(f => <option key={f} value={f} style={{ background: "#0c0e12" }}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(240,237,232,0.6)", fontFamily: "Syne, sans-serif" }}>Price Point (AUD)</label>
              <input value={pricePoint} onChange={e => setPricePoint(e.target.value)}
                placeholder="e.g. 79"
                className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#f0ede8" }} />
            </div>
          </div>

          <button onClick={handleGenerate} disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm transition-all"
            style={{ background: isLoading ? "rgba(224,92,122,0.25)" : "#e05c7a", color: "#fff", fontFamily: "Syne, sans-serif", cursor: isLoading ? "not-allowed" : "pointer" }}>
            {isLoading ? <><Loader2 size={14} className="animate-spin" /> Writing…</> : <><PenTool size={14} /> Generate Copy Pack</>}
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
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(224,92,122,0.1)", border: "1px solid rgba(224,92,122,0.2)" }}>
                <PenTool size={24} style={{ color: "#e05c7a" }} className="animate-pulse" />
              </div>
              <div className="text-center">
                <div className="text-sm font-black mb-1" style={{ fontFamily: "Syne, sans-serif" }}>Writing your copy pack…</div>
                <div className="text-xs" style={{ color: "rgba(240,237,232,0.35)" }}>Crafting high-converting copy across all formats</div>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-3 max-w-2xl">
              {/* Hero section */}
              <div className="p-5 rounded-2xl" style={{ background: "rgba(224,92,122,0.05)", border: "1.5px solid rgba(224,92,122,0.2)" }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="text-xl font-black leading-tight" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8" }}>{result.headline}</div>
                  <CopyBtn text={result.headline} />
                </div>
                <div className="text-sm mb-3" style={{ color: "rgba(240,237,232,0.6)" }}>{result.subheadline}</div>
                <div className="text-xs px-3 py-1.5 rounded-lg inline-block font-black" style={{ background: "#e05c7a", color: "#fff", fontFamily: "Syne, sans-serif" }}>{result.cta}</div>
              </div>

              <CopySection title="Website Copy" accent="#e05c7a">
                <CopyItem label="USP" text={result.usp} />
                <CopyItem label="Hero Hook" text={result.heroHook} />
                <CopyItem label="Product Description" text={result.productDescription} />
                <CopyItem label="Social Proof" text={result.socialProof} />
                <div className="mt-3">
                  <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "rgba(240,237,232,0.35)", fontFamily: "Syne, sans-serif" }}>Bullet Points</div>
                  {result.bulletPoints.map((bp, i) => (
                    <div key={i} className="flex items-start justify-between gap-2 py-1.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <div className="text-sm flex items-start gap-2" style={{ color: "#f0ede8" }}>
                        <span style={{ color: "#e05c7a", flexShrink: 0 }}>✓</span>{bp}
                      </div>
                      <CopyBtn text={bp} />
                    </div>
                  ))}
                </div>
              </CopySection>

              <CopySection title="Ad Headlines (Meta/Google)" accent="#4ab8f5">
                {result.adHeadlines.map((h, i) => <CopyItem key={i} label={`Headline ${i + 1}`} text={h} />)}
              </CopySection>

              <CopySection title="Ad Primary Texts" accent="#4ab8f5">
                {result.adPrimaryTexts.map((t, i) => <CopyItem key={i} label={`Version ${i + 1}`} text={t} />)}
              </CopySection>

              <CopySection title="Email Subject Lines" accent="#d4af37">
                {result.emailSubjectLines.map((s, i) => <CopyItem key={i} label={`Subject ${i + 1}`} text={s} />)}
              </CopySection>

              <CopySection title="TikTok & Social" accent="#9c5fff">
                <CopyItem label="TikTok Hook (first 3 seconds)" text={result.tiktokHook} />
              </CopySection>

              <CopySection title="SEO" accent="#2dca72">
                <CopyItem label="Page Title" text={result.seoTitle} />
                <CopyItem label="Meta Description" text={result.seoMetaDescription} />
              </CopySection>
            </div>
          )}

          {!isLoading && !result && (
            <div className="h-full flex flex-col items-center justify-center gap-4 p-8">
              <div className="text-5xl">✍️</div>
              <div className="text-center">
                <div className="text-base font-black mb-2" style={{ fontFamily: "Syne, sans-serif" }}>Generate a full copy pack in seconds</div>
                <div className="text-xs max-w-xs leading-relaxed" style={{ color: "rgba(240,237,232,0.35)" }}>
                  Headlines, ad copy, email subjects, SEO titles, and TikTok hooks — all tailored to your product and audience.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
