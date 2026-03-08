import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Copy, Rocket, Loader2, ChevronRight, Target, TrendingUp, DollarSign, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

interface Milestone { phase: string; title: string; actions: string[]; kpi: string; timeline: string; }

export default function ScalingPlaybook() {
  const [currentRevenue, setCurrentRevenue] = useState("");
  const [targetRevenue, setTargetRevenue] = useState("");
  const [niche, setNiche] = useState("");
  const [channels, setChannels] = useState("");
  const [constraints, setConstraints] = useState("");
  const [generating, setGenerating] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [summary, setSummary] = useState("");

  const { messages, sendMessage, status: chatStatus } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest({ messages }: any) {
        return {
          body: {
            messages: messages.map((m: any) => ({ role: m.role, content: m.parts?.filter((p: any) => p.type === "text").map((p: any) => p.text).join("") || "" })),
            systemPrompt: `You are a scaling strategist for e-commerce brands. When given business details, output a JSON object with this exact structure: {"summary":"one paragraph overview","milestones":[{"phase":"Phase 1","title":"title","actions":["action1","action2","action3"],"kpi":"target metric","timeline":"2-4 weeks"}]}. Include 4-6 milestones. Output ONLY the JSON, no markdown.`,
          },
        };
      },
    }),
  });

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === "assistant") {
      const text = last.parts?.filter((p: any) => p.type === "text").map((p: any) => p.text).join("") || "";
      try {
        const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.milestones) {
          setMilestones(parsed.milestones);
          setSummary(parsed.summary || "");
          setGenerating(false);
          toast.success("Scaling playbook generated!");
        }
      } catch { /* still streaming */ }
    }
  }, [messages]);

  const handleGenerate = useCallback(async () => {
    if (!currentRevenue || !targetRevenue || !niche) {
      toast.error("Please fill in revenue and niche fields.");
      return;
    }
    setGenerating(true);
    setMilestones([]);
    setSummary("");
    sendMessage({
      text: `Create a scaling playbook for my e-commerce brand:\n- Current monthly revenue: $${currentRevenue}\n- Target monthly revenue: $${targetRevenue}\n- Niche: ${niche}\n- Current channels: ${channels || "Not specified"}\n- Constraints: ${constraints || "None specified"}\n\nProvide a step-by-step scaling roadmap with 4-6 phases, each with specific actions, KPIs, and timelines.`,
    });
  }, [currentRevenue, targetRevenue, niche, channels, constraints, sendMessage]);

  const copyAll = () => {
    const text = `Scaling Playbook\n${summary}\n\n` +
      milestones.map(m => `${m.phase}: ${m.title}\nActions: ${m.actions.join(", ")}\nKPI: ${m.kpi}\nTimeline: ${m.timeline}`).join("\n\n");
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  const phaseColors = ["#2dca72", "#7c6af5", "#d4af37", "#ff6b6b", "#00b4d8", "#f472b6"];

  return (
    <div className="h-full flex" style={{ background: "#080a0e", color: "#f0ede8", fontFamily: "DM Sans, sans-serif" }}>
      {/* LEFT */}
      <div className="w-80 flex-shrink-0 overflow-y-auto border-r p-5 space-y-4" style={{ borderColor: "rgba(255,255,255,0.07)", scrollbarWidth: "thin" }}>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(124,106,245,0.12)", border: "1px solid rgba(124,106,245,0.3)" }}>
            <Rocket size={15} style={{ color: "#7c6af5" }} />
          </div>
          <div>
            <div className="text-sm font-black" style={{ fontFamily: "Syne, sans-serif" }}>Scaling Playbook</div>
            <div className="text-xs" style={{ color: "rgba(240,237,232,0.35)" }}>Revenue roadmap with milestones</div>
          </div>
        </div>

        {[
          { label: "Current Monthly Revenue ($)", value: currentRevenue, set: setCurrentRevenue, placeholder: "e.g. 5000", required: true },
          { label: "Target Monthly Revenue ($)", value: targetRevenue, set: setTargetRevenue, placeholder: "e.g. 50000", required: true },
          { label: "Niche / Product Category", value: niche, set: setNiche, placeholder: "e.g. Pet accessories", required: true },
          { label: "Current Sales Channels", value: channels, set: setChannels, placeholder: "e.g. Shopify, Meta Ads, TikTok" },
          { label: "Constraints / Notes", value: constraints, set: setConstraints, placeholder: "e.g. $3k/mo ad budget, solo founder" },
        ].map(({ label, value, set, placeholder, required }) => (
          <div key={label}>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "Syne, sans-serif" }}>
              {label} {required && <span style={{ color: "#7c6af5" }}>*</span>}
            </label>
            <input
              value={value}
              onChange={e => set(e.target.value)}
              placeholder={placeholder}
              className="w-full text-xs px-3 py-2.5 rounded-lg outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)", color: "#f0ede8" }}
              onFocus={e => (e.target.style.borderColor = "rgba(124,106,245,0.45)")}
              onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
            />
          </div>
        ))}

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
          style={{
            background: generating ? "rgba(124,106,245,0.25)" : "linear-gradient(135deg, #7c6af5, #9c5fff)",
            color: "#fff",
            fontFamily: "Syne, sans-serif",
            boxShadow: generating ? "none" : "0 4px 20px rgba(124,106,245,0.3)",
            cursor: generating ? "not-allowed" : "pointer",
          }}
        >
          {generating ? <><Loader2 size={14} className="animate-spin" /> Generating…</> : <><Rocket size={14} /> Generate Playbook</>}
        </button>
      </div>

      {/* RIGHT */}
      <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: "thin" }}>
        {milestones.length > 0 ? (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black" style={{ fontFamily: "Syne, sans-serif" }}>Your Scaling Roadmap</h2>
              <button onClick={copyAll} className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(240,237,232,0.6)", cursor: "pointer" }}>
                <Copy size={11} /> Copy All
              </button>
            </div>

            {summary && (
              <div className="rounded-xl p-4" style={{ background: "rgba(124,106,245,0.06)", border: "1px solid rgba(124,106,245,0.2)" }}>
                <div className="text-xs leading-relaxed" style={{ color: "rgba(240,237,232,0.7)" }}>{summary}</div>
              </div>
            )}

            {/* Timeline */}
            <div className="space-y-4">
              {milestones.map((m, i) => {
                const color = phaseColors[i % phaseColors.length];
                return (
                  <div key={i} className="flex gap-4">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0" style={{ background: `${color}15`, border: `2px solid ${color}`, color, fontFamily: "Syne, sans-serif" }}>
                        {i + 1}
                      </div>
                      {i < milestones.length - 1 && <div className="w-0.5 flex-1 mt-2" style={{ background: `${color}25` }} />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 rounded-xl p-4 mb-2" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${color}20` }}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider" style={{ color, fontFamily: "Syne, sans-serif" }}>{m.phase}</span>
                          <h3 className="text-sm font-bold mt-0.5" style={{ fontFamily: "Syne, sans-serif" }}>{m.title}</h3>
                        </div>
                        <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: `${color}12`, color, fontFamily: "Syne, sans-serif", fontWeight: 700 }}>{m.timeline}</span>
                      </div>

                      <div className="space-y-1.5 mb-3">
                        {m.actions.map((a, j) => (
                          <div key={j} className="flex items-start gap-2 text-xs" style={{ color: "rgba(240,237,232,0.6)" }}>
                            <ChevronRight size={10} className="mt-0.5 flex-shrink-0" style={{ color }} />
                            <span>{a}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg" style={{ background: `${color}08`, border: `1px solid ${color}15` }}>
                        <Target size={11} style={{ color }} />
                        <span style={{ color: "rgba(240,237,232,0.5)" }}>KPI:</span>
                        <span style={{ color, fontWeight: 600 }}>{m.kpi}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            {generating ? (
              <div className="text-center">
                <Loader2 size={32} className="animate-spin mx-auto mb-4" style={{ color: "#7c6af5" }} />
                <div className="text-sm font-bold" style={{ fontFamily: "Syne, sans-serif" }}>Building your scaling roadmap…</div>
                <div className="text-xs mt-1" style={{ color: "rgba(240,237,232,0.35)" }}>Analyzing your business metrics and growth potential</div>
              </div>
            ) : (
              <>
                <div className="text-5xl">🚀</div>
                <div className="text-center">
                  <div className="text-base font-black mb-2" style={{ fontFamily: "Syne, sans-serif" }}>Scaling Playbook</div>
                  <div className="text-xs max-w-xs leading-relaxed" style={{ color: "rgba(240,237,232,0.35)" }}>
                    Enter your current revenue, target, and niche to get a step-by-step scaling roadmap with milestones, actions, and KPIs.
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
