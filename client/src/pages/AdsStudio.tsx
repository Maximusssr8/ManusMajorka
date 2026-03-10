import { useState, useCallback, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { toast } from "sonner";
import { Megaphone, Copy, Check, Loader2, RefreshCw } from "lucide-react";
import { SaveToProduct } from "@/components/SaveToProduct";

interface AdVariant {
  variant: string;
  angle: string;
  headline: string;
  primaryText: string;
  hook: string;
  cta: string;
  targetAudience: string;
  visualDescription: string;
}

interface PlatformAds {
  platform: string;
  strategy: string;
  variants: AdVariant[];
  budgetRecommendation: string;
  bestPractices: string[];
}

interface AdsResult {
  productSummary: string;
  platforms: PlatformAds[];
  testingStrategy: string;
  creativeDirectionNotes: string;
}

const SYSTEM_PROMPT = `You are an expert performance marketing creative director with $50M+ in ad spend managed.
When given a product, return a JSON object with this EXACT structure (no markdown, just raw JSON):
{"productSummary":"Brief product summary","platforms":[{"platform":"Meta (Facebook/Instagram)|TikTok|Google","strategy":"Platform-specific strategy","variants":[{"variant":"e.g. Pain Point Angle","angle":"The creative angle/hook","headline":"Ad headline","primaryText":"Full primary text (2-4 sentences)","hook":"First line/opening hook","cta":"CTA button text","targetAudience":"Who to target on this platform","visualDescription":"What the creative should look like (image/video description)"}],"budgetRecommendation":"e.g. Start with $30/day split testing","bestPractices":["Tip 1","Tip 2","Tip 3"]}],"testingStrategy":"How to A/B test these ads","creativeDirectionNotes":"Overall creative direction and what to prioritise"}
Return 3 platforms (Meta, TikTok, Google), each with 3 variants. Return ONLY raw JSON.`;

function parseResult(text: string): AdsResult | null {
  try {
    const stripped = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const start = stripped.indexOf("{");
    const end = stripped.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    const parsed = JSON.parse(stripped.slice(start, end + 1));
    if (!parsed.platforms || !Array.isArray(parsed.platforms)) return null;
    return parsed as AdsResult;
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

const PLATFORM_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  "Meta (Facebook/Instagram)": { color: "#4ab8f5", bg: "rgba(74,184,245,0.06)", border: "rgba(74,184,245,0.2)" },
  "TikTok": { color: "#e05c7a", bg: "rgba(224,92,122,0.06)", border: "rgba(224,92,122,0.2)" },
  "Google": { color: "#d4af37", bg: "rgba(212,175,55,0.06)", border: "rgba(212,175,55,0.2)" },
};

function VariantCard({ variant, platformColor }: { variant: AdVariant; platformColor: string }) {
  return (
    <div className="p-4 rounded-xl space-y-2.5" style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-black" style={{ color: platformColor, fontFamily: "Syne, sans-serif" }}>{variant.variant}</span>
        <span className="text-xs" style={{ color: "rgba(240,237,232,0.35)" }}>{variant.angle}</span>
      </div>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs mb-0.5" style={{ color: "rgba(240,237,232,0.35)", fontFamily: "Syne, sans-serif" }}>Hook</div>
          <div className="text-sm font-semibold italic" style={{ color: "#f0ede8" }}>"{variant.hook}"</div>
        </div>
        <CopyBtn text={variant.hook} />
      </div>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="text-xs mb-0.5" style={{ color: "rgba(240,237,232,0.35)", fontFamily: "Syne, sans-serif" }}>Headline</div>
          <div className="text-sm font-bold" style={{ color: "#f0ede8" }}>{variant.headline}</div>
        </div>
        <CopyBtn text={variant.headline} />
      </div>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="text-xs mb-0.5" style={{ color: "rgba(240,237,232,0.35)", fontFamily: "Syne, sans-serif" }}>Primary Text</div>
          <div className="text-xs leading-relaxed" style={{ color: "rgba(240,237,232,0.7)" }}>{variant.primaryText}</div>
        </div>
        <CopyBtn text={variant.primaryText} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs px-2.5 py-1 rounded-lg font-black" style={{ background: `${platformColor}15`, color: platformColor, fontFamily: "Syne, sans-serif" }}>{variant.cta}</span>
        <div className="text-xs" style={{ color: "rgba(240,237,232,0.3)" }}>→ {variant.targetAudience}</div>
      </div>
      <div className="p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
        <div className="text-xs" style={{ color: "rgba(240,237,232,0.3)", fontFamily: "Syne, sans-serif" }}>🎨 Visual: </div>
        <div className="text-xs mt-0.5" style={{ color: "rgba(240,237,232,0.5)" }}>{variant.visualDescription}</div>
      </div>
    </div>
  );
}

function PlatformSection({ platform }: { platform: PlatformAds }) {
  const [activeVariant, setActiveVariant] = useState(0);
  const pc = PLATFORM_COLORS[platform.platform] || { color: "#4ab8f5", bg: "rgba(74,184,245,0.06)", border: "rgba(74,184,245,0.2)" };
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: `1.5px solid ${pc.border}`, background: pc.bg }}>
      <div className="p-4 border-b" style={{ borderColor: pc.border }}>
        <div className="flex items-center justify-between mb-1">
          <div className="text-sm font-black" style={{ fontFamily: "Syne, sans-serif", color: pc.color }}>{platform.platform}</div>
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${pc.color}15`, color: pc.color }}>{platform.budgetRecommendation}</span>
        </div>
        <div className="text-xs leading-relaxed" style={{ color: "rgba(240,237,232,0.55)" }}>{platform.strategy}</div>
      </div>
      <div className="p-4">
        {/* Variant tabs */}
        <div className="flex gap-1 mb-3 p-1 rounded-lg" style={{ background: "rgba(0,0,0,0.2)" }}>
          {platform.variants.map((v, i) => (
            <button key={i} onClick={() => setActiveVariant(i)}
              className="flex-1 text-xs py-1.5 rounded-md font-semibold transition-all truncate px-1"
              style={{ background: activeVariant === i ? pc.color : "transparent", color: activeVariant === i ? "#080a0e" : "rgba(240,237,232,0.4)", cursor: "pointer", fontFamily: "Syne, sans-serif" }}>
              {v.variant.split(" ")[0]}
            </button>
          ))}
        </div>
        {platform.variants[activeVariant] && (
          <VariantCard variant={platform.variants[activeVariant]!} platformColor={pc.color} />
        )}
        <div className="mt-3 p-3 rounded-xl" style={{ background: "rgba(0,0,0,0.15)" }}>
          <div className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "rgba(240,237,232,0.35)", fontFamily: "Syne, sans-serif" }}>Best Practices</div>
          {platform.bestPractices.map((tip, i) => (
            <div key={i} className="text-xs flex items-start gap-1.5 mb-1" style={{ color: "rgba(240,237,232,0.6)" }}>
              <span style={{ color: pc.color, flexShrink: 0 }}>→</span>{tip}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const OBJECTIVES = ["Sales / Conversions", "Traffic", "Brand Awareness", "Lead Generation", "App Installs"];

export default function AdsStudio() {
  const [product, setProduct] = useState("");
  const [objective, setObjective] = useState("Sales / Conversions");
  const [budget, setBudget] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<AdsResult | null>(null);
  const [genError, setGenError] = useState("");
  const [waitingForResponse, setWaitingForResponse] = useState(false);

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
            systemPrompt: SYSTEM_PROMPT,
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
      `Objective: ${objective}`,
      budget && `Daily budget: $${budget} AUD`,
    ].filter(Boolean).join("\n");
    sendMessage({ text: prompt });
    setWaitingForResponse(true);
  }, [product, objective, budget, sendMessage]);

  const isLoading = generating || status === "streaming" || status === "submitted";

  return (
    <div className="h-full flex flex-col" style={{ background: "#080a0e", color: "#f0ede8", fontFamily: "DM Sans, sans-serif" }}>
      <div className="flex items-center gap-3 px-5 py-3 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)", background: "#0c0e12" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)" }}>
          <Megaphone size={15} style={{ color: "#d4af37" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black leading-tight" style={{ fontFamily: "Syne, sans-serif" }}>Ads Studio</div>
          <div className="text-xs" style={{ color: "rgba(240,237,232,0.35)" }}>Meta · TikTok · Google · 3 variants per platform · Visual briefs</div>
        </div>
        {result && (
          <button onClick={() => { setResult(null); setGenError(""); }} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(240,237,232,0.5)", cursor: "pointer" }}>
            <RefreshCw size={11} /> New Campaign
          </button>
        )}
      </div>

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        <div className="w-full lg:w-72 flex-shrink-0 overflow-y-auto border-b lg:border-b-0 lg:border-r p-4 space-y-4" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(240,237,232,0.6)", fontFamily: "Syne, sans-serif" }}>Product / Offer *</label>
              <textarea value={product} onChange={e => setProduct(e.target.value)} rows={3}
                placeholder="Describe your product and key selling points…"
                className="w-full text-sm px-3 py-2.5 rounded-xl outline-none resize-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#f0ede8" }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(240,237,232,0.6)", fontFamily: "Syne, sans-serif" }}>Campaign Objective</label>
              <div className="flex flex-wrap gap-1.5">
                {OBJECTIVES.map(o => (
                  <button key={o} onClick={() => setObjective(o)}
                    className="text-xs px-2.5 py-1 rounded-lg transition-all"
                    style={{ background: objective === o ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${objective === o ? "rgba(212,175,55,0.3)" : "rgba(255,255,255,0.07)"}`, color: objective === o ? "#d4af37" : "rgba(240,237,232,0.45)", cursor: "pointer" }}>
                    {o}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(240,237,232,0.6)", fontFamily: "Syne, sans-serif" }}>Daily Budget (AUD)</label>
              <input value={budget} onChange={e => setBudget(e.target.value)}
                placeholder="e.g. 50"
                className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#f0ede8" }} />
            </div>
          </div>

          <button onClick={handleGenerate} disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm transition-all"
            style={{ background: isLoading ? "rgba(212,175,55,0.25)" : "#d4af37", color: "#080a0e", fontFamily: "Syne, sans-serif", cursor: isLoading ? "not-allowed" : "pointer" }}>
            {isLoading ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : <><Megaphone size={14} /> Generate Ad Campaign</>}
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
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)" }}>
                <Megaphone size={24} style={{ color: "#d4af37" }} className="animate-pulse" />
              </div>
              <div className="text-center">
                <div className="text-sm font-black mb-1" style={{ fontFamily: "Syne, sans-serif" }}>Building your ad campaign…</div>
                <div className="text-xs" style={{ color: "rgba(240,237,232,0.35)" }}>Creating 9 ad variants across Meta, TikTok, and Google</div>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4 max-w-2xl">
              <div className="p-4 rounded-2xl" style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.15)" }}>
                <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#d4af37", fontFamily: "Syne, sans-serif" }}>Creative Direction</div>
                <div className="text-sm leading-relaxed" style={{ color: "rgba(240,237,232,0.75)" }}>{result.creativeDirectionNotes}</div>
              </div>

              {result.platforms.map((platform, i) => (
                <PlatformSection key={i} platform={platform} />
              ))}

              <div className="p-4 rounded-2xl" style={{ background: "rgba(45,202,114,0.04)", border: "1px solid rgba(45,202,114,0.12)" }}>
                <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#2dca72", fontFamily: "Syne, sans-serif" }}>Testing Strategy</div>
                <div className="text-xs leading-relaxed" style={{ color: "rgba(240,237,232,0.65)" }}>{result.testingStrategy}</div>
              </div>
            </div>
          )}

          {!isLoading && !result && (
            <div className="h-full flex flex-col items-center justify-center gap-4 p-8">
              <div className="text-5xl">📣</div>
              <div className="text-center">
                <div className="text-base font-black mb-2" style={{ fontFamily: "Syne, sans-serif" }}>Build a full ad campaign</div>
                <div className="text-xs max-w-xs leading-relaxed" style={{ color: "rgba(240,237,232,0.35)" }}>
                  Get 9 ad variants across Meta, TikTok, and Google — with hooks, headlines, copy, visual briefs, and testing strategy.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
