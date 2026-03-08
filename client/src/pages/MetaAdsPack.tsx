import { useState, useCallback } from "react";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { toast } from "sonner";
import { Copy, RefreshCw, Loader2, Zap, ChevronDown, ChevronUp, Check } from "lucide-react";
import { cn } from "@/lib/utils";

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
When given a product, generate a complete Meta Ads Pack as a JSON object with this EXACT structure (no markdown, no explanation, just the JSON):
{"productSummary":"One-line product summary","angles":[{"angle":"Angle name","hook":"Scroll-stopping first line","primaryTexts":["Long-form 150-300 words","Short-form 50-80 words"],"headlines":["Headline 1","Headline 2","Headline 3"],"creativeBrief":"Visual/video creative direction","targetAudience":"Specific audience targeting","objective":"Conversions"}],"plan48h":["Hour 0-4: ...","Hour 4-24: ...","Hour 24-48: ...","Day 3+: ..."],"budgetSplit":"Budget allocation across angles","kpis":["KPI 1","KPI 2","KPI 3"]}
Generate exactly 5 angles. Use these angle types: Pain Point, Social Proof, Curiosity, Urgency, Transformation. Return ONLY the JSON object.`;

function parseAdsPack(text: string): AdsPack | null {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    if (!parsed.angles || !Array.isArray(parsed.angles)) return null;
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
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-3 p-4 text-left" style={{ cursor: "pointer", background: "none", border: "none" }}>
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
      </button>
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

  const { sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest({ messages }) {
        return {
          body: {
            messages: messages.map((m: UIMessage) => ({ role: m.role, content: m.parts.filter((p: any) => p.type === "text").map((p: any) => p.text).join("") })),
            systemPrompt: META_SYSTEM_PROMPT,
          },
        };
      },
    }),
    onFinish: ({ messages: finalMessages }) => {
      const lastMsg = finalMessages[finalMessages.length - 1];
      if (!lastMsg) return;
      const text = lastMsg.parts.filter((p: any) => p.type === "text").map((p: any) => p.text).join("");
      const parsed = parseAdsPack(text);
      if (parsed) { setPack(parsed); setGenerating(false); }
      else { setGenError("Could not parse the generated ads pack. Please try again."); setGenerating(false); }
    },
  });

  const handleGenerate = useCallback(() => {
    if (!productName.trim()) { toast.error("Please enter a product name"); return; }
    setGenerating(true); setGenError(""); setPack(null);
    const prompt = [`Product: ${productName}`, productDesc && `Description: ${productDesc}`, targetPrice && `Price: $${targetPrice}`, targetAudience && `Target Audience: ${targetAudience}`, budget && `Ad Budget: $${budget}/day`].filter(Boolean).join("\n");
    sendMessage({ text: prompt });
  }, [productName, productDesc, targetPrice, targetAudience, budget, sendMessage]);

  const copyAllPack = useCallback(() => {
    if (!pack) return;
    const text = pack.angles.map((a, i) => [`=== ANGLE ${i + 1}: ${a.angle} ===`, `HOOK: ${a.hook}`, `PRIMARY TEXT 1:\n${a.primaryTexts[0]}`, `PRIMARY TEXT 2:\n${a.primaryTexts[1]}`, `HEADLINES:\n${a.headlines.join("\n")}`, `CREATIVE BRIEF: ${a.creativeBrief}`, `TARGET AUDIENCE: ${a.targetAudience}`].join("\n\n")).join("\n\n" + "=".repeat(50) + "\n\n");
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
        {pack && <button onClick={copyAllPack} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0" style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.25)", color: "rgba(212,175,55,0.9)", fontFamily: "Syne, sans-serif", cursor: "pointer" }}><Copy size={11} /> Copy Full Pack</button>}
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* LEFT: Input panel */}
        <div className="w-72 flex-shrink-0 overflow-y-auto border-r p-4 space-y-4" style={{ borderColor: "rgba(255,255,255,0.07)", scrollbarWidth: "thin" }}>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(240,237,232,0.38)", fontFamily: "Syne, sans-serif" }}>Product Details</div>
            <div className="space-y-3">
              {[
                { label: "Product Name *", value: productName, set: setProductName, placeholder: "e.g. Posture Corrector Belt" },
                { label: "Sell Price (AUD)", value: targetPrice, set: setTargetPrice, placeholder: "e.g. 49.99" },
              ].map(({ label, value, set, placeholder }) => (
                <div key={label}>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(240,237,232,0.5)" }}>{label}</label>
                  <input value={value} onChange={e => set(e.target.value)} placeholder={placeholder} className="w-full text-xs px-2.5 py-2 rounded-lg outline-none" style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)", color: "#f0ede8" }} onFocus={e => (e.target.style.borderColor = "rgba(212,175,55,0.45)")} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(240,237,232,0.5)" }}>Product Description</label>
                <textarea value={productDesc} onChange={e => setProductDesc(e.target.value)} placeholder="Key features, benefits, what makes it unique…" rows={3} className="w-full text-xs px-2.5 py-2 rounded-lg outline-none resize-none" style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)", color: "#f0ede8" }} onFocus={e => (e.target.style.borderColor = "rgba(212,175,55,0.45)")} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />
              </div>
            </div>
          </div>
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
          <div>
            <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(240,237,232,0.38)", fontFamily: "Syne, sans-serif" }}>Campaign Settings</div>
            <div className="space-y-3">
              {[
                { label: "Target Audience", value: targetAudience, set: setTargetAudience, placeholder: "e.g. Women 25-45, back pain sufferers" },
                { label: "Daily Budget (AUD)", value: budget, set: setBudget, placeholder: "e.g. 50" },
              ].map(({ label, value, set, placeholder }) => (
                <div key={label}>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(240,237,232,0.5)" }}>{label}</label>
                  <input value={value} onChange={e => set(e.target.value)} placeholder={placeholder} className="w-full text-xs px-2.5 py-2 rounded-lg outline-none" style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)", color: "#f0ede8" }} onFocus={e => (e.target.style.borderColor = "rgba(212,175,55,0.45)")} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />
                </div>
              ))}
            </div>
          </div>
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
          <button onClick={handleGenerate} disabled={isLoading || !productName.trim()} className="w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60" style={{ background: isLoading ? "rgba(212,175,55,0.25)" : "linear-gradient(135deg, #d4af37, #f0c040)", color: "#080a0e", fontFamily: "Syne, sans-serif", boxShadow: isLoading ? "none" : "0 4px 20px rgba(212,175,55,0.35)", cursor: isLoading || !productName.trim() ? "not-allowed" : "pointer" }}>
            {isLoading ? <><Loader2 size={14} className="animate-spin" />Generating…</> : <><Zap size={14} />{pack ? "Regenerate Pack" : "Generate Ads Pack"}</>}
          </button>
          {pack && !isLoading && (
            <button onClick={() => { setPack(null); setProductName(""); setProductDesc(""); setTargetPrice(""); setTargetAudience(""); setBudget(""); }} className="w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(240,237,232,0.35)", cursor: "pointer" }}>
              <RefreshCw size={10} /> Start New Pack
            </button>
          )}
          {genError && <div className="text-xs p-3 rounded-lg" style={{ background: "rgba(255,100,100,0.08)", border: "1px solid rgba(255,100,100,0.2)", color: "rgba(255,150,150,0.9)" }}>{genError}</div>}
        </div>

        {/* RIGHT: Output panel */}
        <div className="flex-1 overflow-y-auto p-5" style={{ scrollbarWidth: "thin" }}>
          {isLoading && !pack ? (
            <div className="flex flex-col items-center justify-center h-full gap-5">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(212,175,55,0.15)", borderTopColor: "#d4af37" }} />
                <div className="absolute inset-0 flex items-center justify-center text-2xl">⚡</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-black mb-1.5" style={{ fontFamily: "Syne, sans-serif" }}>Generating your Meta Ads Pack…</div>
                <div className="text-xs" style={{ color: "rgba(240,237,232,0.35)" }}>Creating 5 creative angles, primary texts, headlines, and 48-hour launch plan</div>
              </div>
            </div>
          ) : pack ? (
            <div className="space-y-5 max-w-4xl">
              <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: "rgba(212,175,55,0.05)", border: "1.5px solid rgba(212,175,55,0.2)" }}>
                <div className="text-2xl flex-shrink-0">📦</div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(212,175,55,0.7)", fontFamily: "Syne, sans-serif" }}>Product Summary</div>
                  <div className="text-sm leading-relaxed" style={{ color: "rgba(240,237,232,0.8)" }}>{pack.productSummary}</div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(240,237,232,0.38)", fontFamily: "Syne, sans-serif" }}>5 Creative Angles</div>
                  <CopyBtn text={pack.angles.map((a, i) => `=== ANGLE ${i+1}: ${a.angle} ===\nHOOK: ${a.hook}\n\nPRIMARY TEXT 1:\n${a.primaryTexts[0]}\n\nPRIMARY TEXT 2:\n${a.primaryTexts[1]}\n\nHEADLINES:\n${a.headlines.join("\n")}`).join("\n\n" + "=".repeat(40) + "\n\n")} label="Copy All 5 Angles" />
                </div>
                <div className="space-y-3">{pack.angles.map((a, i) => <AngleCard key={i} angle={a} index={i} />)}</div>
              </div>
              <div className="rounded-2xl p-4" style={{ background: "rgba(156,95,255,0.05)", border: "1.5px solid rgba(156,95,255,0.2)" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(156,95,255,0.7)", fontFamily: "Syne, sans-serif" }}>⏱ 48-Hour Launch Plan</div>
                  <CopyBtn text={pack.plan48h.join("\n")} label="Copy Plan" />
                </div>
                <div className="space-y-2">{pack.plan48h.map((step, i) => <div key={i} className="flex gap-3 text-xs" style={{ color: "rgba(240,237,232,0.75)" }}><div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: "rgba(156,95,255,0.6)" }} /><span className="leading-relaxed">{step}</span></div>)}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl p-4" style={{ background: "rgba(45,202,114,0.05)", border: "1.5px solid rgba(45,202,114,0.2)" }}>
                  <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(45,202,114,0.7)", fontFamily: "Syne, sans-serif" }}>💰 Budget Split</div>
                  <div className="text-xs leading-relaxed" style={{ color: "rgba(240,237,232,0.7)" }}>{pack.budgetSplit}</div>
                </div>
                <div className="rounded-2xl p-4" style={{ background: "rgba(74,184,245,0.05)", border: "1.5px solid rgba(74,184,245,0.2)" }}>
                  <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(74,184,245,0.7)", fontFamily: "Syne, sans-serif" }}>📊 KPIs to Track</div>
                  <div className="space-y-1">{pack.kpis.map((kpi, i) => <div key={i} className="text-xs flex items-center gap-2" style={{ color: "rgba(240,237,232,0.7)" }}><div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: "rgba(74,184,245,0.6)" }} />{kpi}</div>)}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-5 p-8">
              <div className="text-5xl">⚡</div>
              <div className="text-center">
                <div className="text-base font-black mb-2" style={{ fontFamily: "Syne, sans-serif" }}>Your Meta Ads Pack will appear here</div>
                <div className="text-xs max-w-xs leading-relaxed" style={{ color: "rgba(240,237,232,0.35)" }}>Enter your product details on the left and hit <strong style={{ color: "#d4af37" }}>Generate Ads Pack</strong> to get 5 creative angles with full copy.</div>
              </div>
              <div className="flex flex-col gap-2 text-xs text-left max-w-xs w-full">
                {[{ n: "1", t: "Enter product name and description" }, { n: "2", t: "Set your target audience and daily budget" }, { n: "3", t: "Generate — get 5 angles with full ad copy" }, { n: "4", t: "Copy individual texts or the full pack" }].map(({ n, t }) => (
                  <div key={n} className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black" style={{ background: "rgba(212,175,55,0.15)", color: "#d4af37", fontFamily: "Syne, sans-serif" }}>{n}</div>
                    <span style={{ color: "rgba(240,237,232,0.55)" }}>{t}</span>
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
