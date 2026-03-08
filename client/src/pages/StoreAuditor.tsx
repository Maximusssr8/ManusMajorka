import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Copy, ShieldCheck, Loader2, CheckCircle2, XCircle, AlertTriangle, ExternalLink } from "lucide-react";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { trpc } from "@/lib/trpc";

interface AuditItem { category: string; item: string; status: "pass" | "fail" | "warning"; note: string; priority: "high" | "medium" | "low"; }
interface AuditResult { score: number; items: AuditItem[]; summary: string; topFixes: string[]; }

export default function StoreAuditor() {
  const [storeUrl, setStoreUrl] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);

  const extractMutation = trpc.research.extract.useMutation();

  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest({ messages }: any) {
        return {
          body: {
            messages: messages.map((m: any) => ({ role: m.role, content: m.parts?.filter((p: any) => p.type === "text").map((p: any) => p.text).join("") || "" })),
            systemPrompt: `You are an expert Shopify store auditor. Analyze the provided store data and output a JSON object with this exact structure: {"score":75,"summary":"one paragraph","topFixes":["fix1","fix2","fix3"],"items":[{"category":"SEO","item":"Meta descriptions","status":"pass","note":"All pages have unique meta descriptions","priority":"high"}]}. Categories: SEO, Speed, Trust, UX, Conversion, Mobile. Status: pass/fail/warning. Include 12-18 items. Output ONLY JSON.`,
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
        if (parsed.items) {
          setResult(parsed);
          setGenerating(false);
          toast.success("Store audit complete!");
        }
      } catch { /* still streaming */ }
    }
  }, [messages]);

  const handleAudit = useCallback(async () => {
    if (!storeUrl.trim()) { toast.error("Enter a store URL."); return; }
    setGenerating(true);
    setResult(null);

    let storeData = "";
    try {
      const extracted = await extractMutation.mutateAsync({ url: storeUrl });
      storeData = `Title: ${extracted.title}\nContent: ${(extracted.rawContent || "").slice(0, 3000)}`;
    } catch {
      storeData = `URL: ${storeUrl} (could not scrape — analyze based on URL and common Shopify patterns)`;
    }

    sendMessage({ text: `Audit this e-commerce store:\nURL: ${storeUrl}\n\nScraped data:\n${storeData}\n\nProvide a comprehensive store audit with scores across SEO, Speed, Trust, UX, Conversion, and Mobile categories.` });
  }, [storeUrl, extractMutation, sendMessage]);

  const copyAll = () => {
    if (!result) return;
    const text = `Store Audit: ${storeUrl}\nScore: ${result.score}/100\n\n${result.summary}\n\nTop Fixes:\n${result.topFixes.map((f, i) => `${i + 1}. ${f}`).join("\n")}\n\nDetailed Items:\n${result.items.map(i => `[${i.status.toUpperCase()}] ${i.category} — ${i.item}: ${i.note}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  const statusIcon = (s: string) => s === "pass" ? <CheckCircle2 size={14} style={{ color: "#2dca72" }} /> : s === "fail" ? <XCircle size={14} style={{ color: "#ff6b6b" }} /> : <AlertTriangle size={14} style={{ color: "#f0c040" }} />;
  const categories = result ? Array.from(new Set(result.items.map(i => i.category))) : [];

  return (
    <div className="h-full flex" style={{ background: "#080a0e", color: "#f0ede8", fontFamily: "DM Sans, sans-serif" }}>
      {/* LEFT */}
      <div className="w-80 flex-shrink-0 overflow-y-auto border-r p-5 space-y-4" style={{ borderColor: "rgba(255,255,255,0.07)", scrollbarWidth: "thin" }}>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,180,216,0.12)", border: "1px solid rgba(0,180,216,0.3)" }}>
            <ShieldCheck size={15} style={{ color: "#00b4d8" }} />
          </div>
          <div>
            <div className="text-sm font-black" style={{ fontFamily: "Syne, sans-serif" }}>Store Auditor</div>
            <div className="text-xs" style={{ color: "rgba(240,237,232,0.35)" }}>SEO · Speed · Trust · UX · CRO</div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "Syne, sans-serif" }}>
            Store URL <span style={{ color: "#00b4d8" }}>*</span>
          </label>
          <input
            value={storeUrl}
            onChange={e => setStoreUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && storeUrl && handleAudit()}
            placeholder="https://your-store.myshopify.com"
            className="w-full text-xs px-3 py-2.5 rounded-lg outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)", color: "#f0ede8" }}
            onFocus={e => (e.target.style.borderColor = "rgba(0,180,216,0.45)")}
            onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
          />
        </div>

        <button
          onClick={handleAudit}
          disabled={generating}
          className="w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
          style={{
            background: generating ? "rgba(0,180,216,0.25)" : "linear-gradient(135deg, #00b4d8, #0096c7)",
            color: "#fff", fontFamily: "Syne, sans-serif",
            boxShadow: generating ? "none" : "0 4px 20px rgba(0,180,216,0.3)",
            cursor: generating ? "not-allowed" : "pointer",
          }}
        >
          {generating ? <><Loader2 size={14} className="animate-spin" /> Auditing…</> : <><ShieldCheck size={14} /> Run Audit</>}
        </button>

        <div className="text-xs leading-relaxed" style={{ color: "rgba(240,237,232,0.3)" }}>
          Analyzes your store across 6 categories: SEO, Speed, Trust Signals, User Experience, Conversion Rate, and Mobile Optimization.
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: "thin" }}>
        {result ? (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black" style={{ fontFamily: "Syne, sans-serif" }}>Store Audit Report</h2>
              <button onClick={copyAll} className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(240,237,232,0.6)", cursor: "pointer" }}>
                <Copy size={11} /> Copy All
              </button>
            </div>

            {/* Score */}
            <div className="flex items-center gap-6 rounded-xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="16" fill="none" stroke={result.score >= 70 ? "#2dca72" : result.score >= 40 ? "#f0c040" : "#ff6b6b"} strokeWidth="3" strokeDasharray={`${result.score} ${100 - result.score}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-lg font-black" style={{ fontFamily: "Syne, sans-serif", color: result.score >= 70 ? "#2dca72" : result.score >= 40 ? "#f0c040" : "#ff6b6b" }}>{result.score}</div>
              </div>
              <div className="flex-1">
                <div className="text-xs leading-relaxed" style={{ color: "rgba(240,237,232,0.6)" }}>{result.summary}</div>
              </div>
            </div>

            {/* Top Fixes */}
            <div className="rounded-xl p-4" style={{ background: "rgba(255,100,100,0.05)", border: "1px solid rgba(255,100,100,0.15)" }}>
              <div className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: "#ff6b6b", fontFamily: "Syne, sans-serif" }}>Priority Fixes</div>
              {result.topFixes.map((fix, i) => (
                <div key={i} className="flex items-start gap-2.5 mb-2 text-xs" style={{ color: "rgba(240,237,232,0.7)" }}>
                  <span className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black" style={{ background: "rgba(255,100,100,0.15)", color: "#ff6b6b", fontFamily: "Syne, sans-serif" }}>{i + 1}</span>
                  <span>{fix}</span>
                </div>
              ))}
            </div>

            {/* Category breakdown */}
            {categories.map(cat => {
              const items = result.items.filter(i => i.category === cat);
              const passed = items.filter(i => i.status === "pass").length;
              return (
                <div key={cat} className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                    <div className="text-xs font-black uppercase tracking-widest" style={{ color: "#00b4d8", fontFamily: "Syne, sans-serif" }}>{cat}</div>
                    <span className="text-xs" style={{ color: "rgba(240,237,232,0.4)" }}>{passed}/{items.length} passed</span>
                  </div>
                  {items.map((item, j) => (
                    <div key={j} className="flex items-start gap-3 px-4 py-2.5" style={{ borderBottom: j < items.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      {statusIcon(item.status)}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold" style={{ color: "rgba(240,237,232,0.7)" }}>{item.item}</div>
                        <div className="text-xs mt-0.5" style={{ color: "rgba(240,237,232,0.4)" }}>{item.note}</div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{
                        background: item.priority === "high" ? "rgba(255,100,100,0.1)" : item.priority === "medium" ? "rgba(240,192,64,0.1)" : "rgba(255,255,255,0.05)",
                        color: item.priority === "high" ? "#ff6b6b" : item.priority === "medium" ? "#f0c040" : "rgba(240,237,232,0.4)",
                      }}>{item.priority}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            {generating ? (
              <div className="text-center">
                <Loader2 size={32} className="animate-spin mx-auto mb-4" style={{ color: "#00b4d8" }} />
                <div className="text-sm font-bold" style={{ fontFamily: "Syne, sans-serif" }}>Auditing your store…</div>
                <div className="text-xs mt-1" style={{ color: "rgba(240,237,232,0.35)" }}>Scraping and analyzing across 6 categories</div>
              </div>
            ) : (
              <>
                <div className="text-5xl">🔍</div>
                <div className="text-center">
                  <div className="text-base font-black mb-2" style={{ fontFamily: "Syne, sans-serif" }}>Store Auditor</div>
                  <div className="text-xs max-w-xs leading-relaxed" style={{ color: "rgba(240,237,232,0.35)" }}>
                    Enter your store URL to get a comprehensive audit across SEO, Speed, Trust, UX, Conversion, and Mobile.
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
