import { useState, useCallback, useEffect } from "react";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { toast } from "sonner";
import { Copy, RefreshCw, Loader2, Zap, ChevronDown, ChevronUp, Check, Link2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { SaveToProduct } from "@/components/SaveToProduct";

interface AdAngle {
  angle: string; hook: string;
  primaryTexts: string[]; headlines: string[];
  creativeBrief: string; targetAudience: string; objective: string;
}
interface AdsPack {
  productSummary: string; angles: AdAngle[];
  plan48h: string[]; budgetSplit: string; kpis: string[];
}

const META_SYSTEM_PROMPT = `You are an elite Meta Ads strategist and direct-response copywriter with 10+ years experience scaling ecommerce brands to 7 figures using Facebook and Instagram ads.
When given a product, generate a complete Meta Ads Pack as a JSON object with this EXACT structure (no markdown, no explanation, just the raw JSON):
{"productSummary":"One-line product summary","angles":[{"angle":"Angle name","hook":"Scroll-stopping first line","primaryTexts":["Long-form 150-300 words","Short-form 50-80 words"],"headlines":["Headline 1","Headline 2","Headline 3"],"creativeBrief":"Visual/video creative direction","targetAudience":"Specific audience targeting","objective":"Conversions"}],"plan48h":["Hour 0-4: ...","Hour 4-24: ...","Hour 24-48: ...","Day 3+: ..."],"budgetSplit":"Budget allocation across angles","kpis":["KPI 1","KPI 2","KPI 3"]}
Generate exactly 5 angles. Use these angle types: Pain Point, Social Proof, Curiosity, Urgency, Transformation. Return ONLY the raw JSON object with no markdown formatting, no code blocks, no explanation text.`;

function parseAdsPack(text: string): AdsPack | null {
  try {
    // Strip markdown code blocks if present
    const stripped = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    // Find the outermost JSON object
    const start = stripped.indexOf("{");
    const end = stripped.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;
    const jsonStr = stripped.slice(start, end + 1);
    const parsed = JSON.parse(jsonStr);
    if (!parsed.angles || !Array.isArray(parsed.angles) || parsed.angles.length === 0) return null;
    return parsed as AdsPack;
  } catch { return null; }
}

function CopyBtn({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); toast.success("Copied!"); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-all flex-shrink-0"
      style={{ background: copied ? "rgba(45,202,114,0.1)" : "rgba(255,255,255,0.05)", border: `1px solid ${copied ? "rgba(45,202,114,0.3)" : "rgba(255,255,255,0.08)"}`, color: copied ? "rgba(45,202,114,0.8)" : "rgba(240,237,232,0.45)", cursor: "pointer" }}>
      {copied ? <Check size={10} /> : <Copy size={10} />}{label}
    </button>
  );
}

const ANGLE_COLORS = [
  { accent: "#d4af37", bg: "rgba(212,175,55,0.06)", border: "rgba(212,175,55,0.2)" },
  { accent: "#9c5fff", bg: "rgba(156,95,255,0.06)", border: "rgba(156,95,255,0.2)" },
  { accent: "#2dca72", bg: "rgba(45,202,114,0.06)", border: "rgba(45,202,114,0.2)" },
  { accent: "#e05c7a", bg: "rgba(224,92,122,0.06)", border: "rgba(224,92,122,0.2)" },
  { accent: "#4ab8f5", bg: "rgba(74,184,245,0.06)", border: "rgba(74,184,245,0.2)" },
];

function AngleCard({ angle, index }: { angle: AdAngle; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);
  const c = ANGLE_COLORS[index % ANGLE_COLORS.length]!;
  const allCopy = [`HOOK:\n${angle.hook}`, `PRIMARY TEXT 1:\n${angle.primaryTexts[0] || ""}`, `PRIMARY TEXT 2:\n${angle.primaryTexts[1] || ""}`, `HEADLINES:\n${angle.headlines.join("\n")}`, `CREATIVE BRIEF:\n${angle.creativeBrief}`, `TARGET AUDIENCE:\n${angle.targetAudience}`].join("\n\n---\n\n");
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: c.bg, border: `1.5px solid ${c.border}` }}>
      <div onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-3 p-4 text-left" style={{ cursor: "pointer" }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0" style={{ background: c.accent, color: "#080a0e", fontFamily: "Syne, sans-serif" }}>{index + 1}</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black leading-tight" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8" }}>{angle.angle}</div>
          <div className="text-xs mt-0.5 truncate" style={{ color: "rgba(240,237,232,0.45)" }}>{angle.hook}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(240,237,232,0.45)", fontFamily: "Syne, sans-serif" }}>{angle.objective}</span>
          <CopyBtn text={allCopy} label="Copy All" />
          {expanded ? <ChevronUp size={14} style={{ color: "rgba(240,237,232,0.3)" }} /> : <ChevronDown size={14} style={{ color: "rgba(240,237,232,0.3)" }} />}
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold uppercase tracking-widest" style={{ color: c.accent, fontFamily: "Syne, sans-serif" }}>🎣 Hook</div>
              <CopyBtn text={angle.hook} />
            </div>
            <div className="text-sm p-3 rounded-xl leading-relaxed" style={{ background: "rgba(0,0,0,0.2)", color: "rgba(240,237,232,0.85)", border: "1px solid rgba(255,255,255,0.06)" }}>{angle.hook}</div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest mb-2.5" style={{ color: c.accent, fontFamily: "Syne, sans-serif" }}>📝 Primary Texts</div>
            <div className="space-y-2.5">
              {angle.primaryTexts.map((pt, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold" style={{ color: "rgba(240,237,232,0.35)", fontFamily: "Syne, sans-serif" }}>{i === 0 ? "Long-form (150–300 words)" : "Short-form (50–80 words)"}</span>
                    <CopyBtn text={pt} />
                  </div>
                  <div className="text-xs p-3 rounded-xl leading-relaxed" style={{ background: "rgba(0,0,0,0.2)", color: "rgba(240,237,232,0.75)", border: "1px solid rgba(255,255,255,0.06)", whiteSpace: "pre-wrap" }}>{pt}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold uppercase tracking-widest" style={{ color: c.accent, fontFamily: "Syne, sans-serif" }}>💥 Headlines</div>
              <CopyBtn text={angle.headlines.join("\n")} label="Copy All" />
            </div>
            <div className="space-y-1.5">
              {angle.headlines.map((h, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <span className="text-xs font-black w-4 flex-shrink-0" style={{ color: c.accent, fontFamily: "Syne, sans-serif" }}>{i + 1}</span>
                  <span className="text-xs flex-1" style={{ color: "rgba(240,237,232,0.8)" }}>{h}</span>
                  <CopyBtn text={h} />
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: c.accent, fontFamily: "Syne, sans-serif" }}>🎬 Creative Brief</div>
              <div className="text-xs p-3 rounded-xl leading-relaxed" style={{ background: "rgba(0,0,0,0.15)", color: "rgba(240,237,232,0.65)", border: "1px solid rgba(255,255,255,0.05)" }}>{angle.creativeBrief}</div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: c.accent, fontFamily: "Syne, sans-serif" }}>🎯 Target Audience</div>
              <div className="text-xs p-3 rounded-xl leading-relaxed" style={{ background: "rgba(0,0,0,0.15)", color: "rgba(240,237,232,0.65)", border: "1px solid rgba(255,255,255,0.05)" }}>{angle.targetAudience}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MetaAdsPack() {
  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [budget, setBudget] = useState("");
  const [generating, setGenerating] = useState(false);
  const [pack, setPack] = useState<AdsPack | null>(null);
  const [genError, setGenError] = useState("");

  const [waitingForResponse, setWaitingForResponse] = useState(false);
  // URL import
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  // 48-hr checklist state
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());
  const extractMutation = trpc.research.extract.useMutation();

  const handleUrlImport = useCallback(async () => {
    if (!importUrl.trim()) return;
    setImporting(true);
    try {
      const extracted = await extractMutation.mutateAsync({ url: importUrl });
      const raw = extracted.rawContent || "";
      const titleStr = extracted.title || "";
      const priceMatch = raw.match(/\$([\d,]+(?:\.\d{2})?)/)?.[0] || "";
      const descMatch = raw.split("\n").find((l: string) => l.trim().length > 80 && l.trim().length < 400) || "";
      if (titleStr) setProductName(titleStr);
      if (descMatch) setProductDesc(descMatch);
      if (priceMatch) setTargetPrice(priceMatch.replace("$", ""));
      toast.success("Product details imported!");
    } catch (err: any) {
      toast.error(err?.message || "Could not import URL");
    } finally {
      setImporting(false);
    }
  }, [importUrl, extractMutation]);

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
            systemPrompt: META_SYSTEM_PROMPT,
          },
        };
      },
    }),
  });

  // Track when streaming starts
  useEffect(() => {
    if (status === "streaming" || status === "submitted") {
      setWaitingForResponse(true);
    }
  }, [status]);

  // Watch for streaming to finish, then parse the result
  useEffect(() => {
    if (status !== "ready" || !generating || !waitingForResponse) return;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== "assistant") {
      setGenError("No response received. Please try again.");
      setGenerating(false);
      setWaitingForResponse(false);
      return;
    }
    const text = lastMsg.parts
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join("");
    const parsed = parseAdsPack(text);
    if (parsed) {
      setPack(parsed);
    } else {
      setGenError("Could not parse the generated ads pack. Please try again.");
    }
    setGenerating(false);
    setWaitingForResponse(false);
  }, [status, generating, waitingForResponse, messages]);

  const handleGenerate = useCallback(() => {
    if (!productName.trim()) { toast.error("Please enter a product name"); return; }
    setGenerating(true); setGenError(""); setPack(null);
    const prompt = [
      `Product: ${productName}`,
      productDesc && `Description: ${productDesc}`,
      targetPrice && `Price: $${targetPrice} AUD`,
      targetAudience && `Target Audience: ${targetAudience}`,
      budget && `Ad Budget: $${budget}/day`,
    ].filter(Boolean).join("\n");
    sendMessage({ text: prompt });
  }, [productName, productDesc, targetPrice, targetAudience, budget, sendMessage]);

  const copyAllPack = useCallback(() => {
    if (!pack) return;
    const text = pack.angles.map((a, i) => [
      `=== ANGLE ${i + 1}: ${a.angle} ===`,
      `HOOK: ${a.hook}`,
      `PRIMARY TEXT 1:\n${a.primaryTexts[0]}`,
      `PRIMARY TEXT 2:\n${a.primaryTexts[1]}`,
      `HEADLINES:\n${a.headlines.join("\n")}`,
      `CREATIVE BRIEF: ${a.creativeBrief}`,
      `TARGET AUDIENCE: ${a.targetAudience}`,
    ].join("\n\n")).join("\n\n" + "=".repeat(50) + "\n\n");
    navigator.clipboard.writeText(text);
    toast.success("Full ads pack copied!");
  }, [pack]);

  const isLoading = generating || status === "streaming" || status === "submitted";

  return (
    <div className="h-full flex flex-col" style={{ background: "#080a0e", color: "#f0ede8", fontFamily: "DM Sans, sans-serif" }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)", background: "#0c0e12" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)" }}>
          <Zap size={15} style={{ color: "#d4af37" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black leading-tight" style={{ fontFamily: "Syne, sans-serif" }}>Meta Ads Pack</div>
          <div className="text-xs" style={{ color: "rgba(240,237,232,0.35)" }}>5 creative angles · Primary texts · Headlines · 48-hr launch plan</div>
        </div>
        {pack && (
          <div className="flex items-center gap-2">
            <button onClick={copyAllPack} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0"
              style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.25)", color: "rgba(212,175,55,0.9)", fontFamily: "Syne, sans-serif", cursor: "pointer" }}>
              <Copy size={11} /> Copy Full Pack
            </button>
            <SaveToProduct toolId="meta-ads" toolName="Meta Ads Pack" outputData={pack} />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* LEFT: Input panel */}
        <div className="w-72 flex-shrink-0 overflow-y-auto border-r p-4 space-y-4" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          {/* URL Import */}
          <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "Syne, sans-serif" }}>Import from URL</div>
            <div className="flex gap-2">
              <input
                value={importUrl}
                onChange={e => setImportUrl(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleUrlImport()}
                placeholder="Paste AliExpress / Amazon URL…"
                className="flex-1 text-xs px-2.5 py-2 rounded-lg outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", color: "#f0ede8" }}
              />
              <button
                onClick={handleUrlImport}
                disabled={importing || !importUrl.trim()}
                className="px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 flex-shrink-0 disabled:opacity-50"
                style={{ background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)", color: "#d4af37", cursor: "pointer" }}
              >
                {importing ? <Loader2 size={10} className="animate-spin" /> : <Link2 size={10} />}
                {importing ? "…" : "Import"}
              </button>
            </div>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "Syne, sans-serif" }}>Product Details</div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(240,237,232,0.6)", fontFamily: "Syne, sans-serif" }}>Product Name *</label>
                <input value={productName} onChange={e => setProductName(e.target.value)}
                  placeholder="e.g. Posture Corrector Belt"
                  className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#f0ede8" }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(240,237,232,0.6)", fontFamily: "Syne, sans-serif" }}>Sell Price (AUD)</label>
                <input value={targetPrice} onChange={e => setTargetPrice(e.target.value)}
                  placeholder="e.g. 49.99"
                  className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#f0ede8" }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(240,237,232,0.6)", fontFamily: "Syne, sans-serif" }}>Product Description</label>
                <textarea value={productDesc} onChange={e => setProductDesc(e.target.value)}
                  placeholder="Key features, benefits, what makes it unique…"
                  rows={4}
                  className="w-full text-sm px-3 py-2.5 rounded-xl outline-none resize-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#f0ede8" }} />
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "Syne, sans-serif" }}>Campaign Settings</div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(240,237,232,0.6)", fontFamily: "Syne, sans-serif" }}>Target Audience</label>
                <input value={targetAudience} onChange={e => setTargetAudience(e.target.value)}
                  placeholder="e.g. Women 25-45, back pain sufferers"
                  className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#f0ede8" }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(240,237,232,0.6)", fontFamily: "Syne, sans-serif" }}>Daily Budget (AUD)</label>
                <input value={budget} onChange={e => setBudget(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#f0ede8" }} />
              </div>
            </div>
          </div>

          <button onClick={handleGenerate} disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm transition-all"
            style={{ background: isLoading ? "rgba(212,175,55,0.3)" : "#d4af37", color: "#080a0e", fontFamily: "Syne, sans-serif", cursor: isLoading ? "not-allowed" : "pointer" }}>
            {isLoading ? <><Loader2 size={14} className="animate-spin" /> Generating…</> : <><Zap size={14} /> Generate Ads Pack</>}
          </button>

          {genError && (
            <div className="text-xs p-3 rounded-xl" style={{ background: "rgba(224,92,122,0.1)", border: "1px solid rgba(224,92,122,0.25)", color: "rgba(224,92,122,0.9)" }}>
              {genError}
            </div>
          )}
        </div>

        {/* RIGHT: Output panel */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading && !pack && (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)" }}>
                <Zap size={24} style={{ color: "#d4af37" }} className="animate-pulse" />
              </div>
              <div className="text-center">
                <div className="text-base font-black mb-1" style={{ fontFamily: "Syne, sans-serif" }}>Generating your Meta Ads Pack…</div>
                <div className="text-sm" style={{ color: "rgba(240,237,232,0.4)" }}>Creating 5 creative angles, primary texts, headlines, and 48-hour launch plan</div>
              </div>
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: "#d4af37", animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}

          {!isLoading && !pack && (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.15)" }}>
                <Zap size={24} style={{ color: "#d4af37" }} />
              </div>
              <div className="text-center max-w-sm">
                <div className="text-base font-black mb-2" style={{ fontFamily: "Syne, sans-serif" }}>Your Meta Ads Pack will appear here</div>
                <div className="text-sm mb-4" style={{ color: "rgba(240,237,232,0.4)" }}>Enter your product details on the left and hit <span style={{ color: "#d4af37" }}>Generate Ads Pack</span> to get 5 creative angles with full copy.</div>
                <div className="space-y-2 text-left max-w-xs mx-auto">
                  {["Enter product name and description", "Set your target audience and daily budget", "Generate — get 5 angles with full ad copy", "Copy individual texts or the full pack"].map((step, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(240,237,232,0.5)" }}>
                      <span className="w-5 h-5 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0" style={{ background: "rgba(212,175,55,0.15)", color: "#d4af37", fontFamily: "Syne, sans-serif" }}>{i + 1}</span>
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {pack && (
            <div className="space-y-4">
              {/* Product summary */}
              <div className="p-4 rounded-2xl" style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.15)" }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "#d4af37", fontFamily: "Syne, sans-serif" }}>Product Summary</div>
                  <CopyBtn text={pack.productSummary} />
                </div>
                <div className="text-sm" style={{ color: "rgba(240,237,232,0.8)" }}>{pack.productSummary}</div>
              </div>

              {/* Angle cards */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "Syne, sans-serif" }}>Creative Angles</div>
                  <button onClick={() => { setPack(null); setGenerating(false); }} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(240,237,232,0.4)", cursor: "pointer" }}>
                    <RefreshCw size={10} /> Regenerate
                  </button>
                </div>
                <div className="space-y-3">
                  {pack.angles.map((angle, i) => <AngleCard key={i} angle={angle} index={i} />)}
                </div>
              </div>

              {/* 48-hr plan — interactive checklist */}
              <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "Syne, sans-serif" }}>⏱ 48-Hour Launch Plan</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: "rgba(240,237,232,0.3)" }}>{checkedSteps.size}/{pack.plan48h.length} done</span>
                    <CopyBtn text={pack.plan48h.join("\n")} label="Copy Plan" />
                  </div>
                </div>
                <div className="space-y-2">
                  {pack.plan48h.map((step, i) => (
                    <button
                      key={i}
                      onClick={() => setCheckedSteps(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; })}
                      className="w-full flex gap-3 text-xs p-2.5 rounded-xl text-left transition-all"
                      style={{ background: checkedSteps.has(i) ? "rgba(45,202,114,0.06)" : "rgba(0,0,0,0.2)", border: `1px solid ${checkedSteps.has(i) ? "rgba(45,202,114,0.2)" : "transparent"}`, cursor: "pointer" }}
                    >
                      <span className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 transition-all" style={{ background: checkedSteps.has(i) ? "rgba(45,202,114,0.2)" : "rgba(212,175,55,0.15)", border: `1px solid ${checkedSteps.has(i) ? "rgba(45,202,114,0.4)" : "transparent"}` }}>
                        {checkedSteps.has(i) ? <Check size={10} style={{ color: "#2dca72" }} /> : <span style={{ color: "#d4af37", fontFamily: "Syne, sans-serif", fontSize: "10px", fontWeight: 900 }}>{i + 1}</span>}
                      </span>
                      <span style={{ color: checkedSteps.has(i) ? "rgba(240,237,232,0.35)" : "rgba(240,237,232,0.7)", textDecoration: checkedSteps.has(i) ? "line-through" : "none" }}>{step}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget + KPIs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "Syne, sans-serif" }}>💰 Budget Split</div>
                  <div className="text-xs leading-relaxed" style={{ color: "rgba(240,237,232,0.65)" }}>{pack.budgetSplit}</div>
                </div>
                <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "Syne, sans-serif" }}>📊 KPIs to Track</div>
                  <div className="space-y-1">
                    {pack.kpis.map((kpi, i) => (
                      <div key={i} className="text-xs flex items-center gap-2" style={{ color: "rgba(240,237,232,0.65)" }}>
                        <span style={{ color: "#d4af37" }}>•</span>{kpi}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
