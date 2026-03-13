/**
 * Admin Leads Intelligence — /admin/leads
 * Only visible to maximusmajorka@gmail.com
 * Generates outreach templates and shows signup analytics.
 */
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Search, Loader2, Copy, Download, Users, Mail, MessageSquare, Globe, RefreshCw } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getStoredMarket } from "@/contexts/MarketContext";
import { supabase } from "@/lib/supabase";

interface LeadIntelResult {
  places: string[];
  outreachTemplates: Record<string, string>;
  weeklySchedule: string;
}

export default function AdminLeads() {
  const { user } = useAuth();
  const [keywords, setKeywords] = useState("looking for dropshipping supplier australia");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<LeadIntelResult | null>(null);

  // Gate access
  if (user?.email !== "maximusmajorka@gmail.com") {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: "#080a0e" }}>
        <div className="text-center">
          <div className="text-4xl mb-3">🔒</div>
          <h2 className="text-lg font-bold" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8" }}>Admin Only</h2>
          <p className="text-sm" style={{ color: "rgba(240,237,232,0.4)" }}>This page is restricted.</p>
        </div>
      </div>
    );
  }

  const handleGenerate = async () => {
    if (!keywords.trim()) return;
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: `You are a growth hacker specialising in finding early customers for SaaS products. Majorka is an AI ecommerce OS for Australian dropshippers and DTC brands. Price: $49/mo Builder, $149/mo Scale.

Keywords our ideal customers use: "${keywords}"

Generate a lead intelligence report in STRICT JSON format:
{
  "places": [
    "20 specific places where our ideal customers are posting right now, each as a string with platform name and specifics. Include: specific subreddits (r/AusEntrepreneur, r/dropship, r/shopify, r/AusBusiness), Facebook groups (names + typical post patterns), TikTok hashtags where buyers congregate, LinkedIn search strings that find DTC founders, Twitter/X search operators to find people asking about ecom tools"
  ],
  "outreachTemplates": {
    "reddit_comment": "Reddit comment template — adds value, mentions Majorka naturally. 3-4 sentences.",
    "facebook_post": "Facebook group post template — helpful, leads with value.",
    "twitter_reply": "Twitter reply template — short, helpful, casual.",
    "dm_template": "DM template — personal, not salesy, offers genuine help.",
    "linkedin_message": "LinkedIn connection message — professional, mentions AU ecom."
  },
  "weeklySchedule": "A weekly lead generation schedule as formatted text. Mon/Wed/Fri: Reddit engagement plan. Tue/Thu: TikTok comment strategy. Weekend: Facebook group participation. Be specific about what to post where."
}

Be extremely specific. Real subreddit names, real Facebook group names, real hashtags. Not generic.` }],
          toolId: "admin-leads",
          skipMemory: true,
          market: getStoredMarket(),
        }),
      });

      const data = await res.json();
      const text = data?.response || data?.content || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Could not parse response");
      const parsed = JSON.parse(jsonMatch[0]) as LeadIntelResult;
      setResult(parsed);
      toast.success("Lead intelligence generated!");
    } catch (err: any) {
      toast.error(err?.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    toast.success(`${label} copied!`);
  };

  return (
    <div className="h-full overflow-y-auto p-6" style={{ background: "#080a0e", scrollbarWidth: "thin" }}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-black flex items-center gap-2" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8" }}>
            <Users size={20} style={{ color: "#d4af37" }} />
            Lead Intelligence
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(240,237,232,0.4)" }}>
            Find where your ideal customers are and how to reach them.
          </p>
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleGenerate()}
            placeholder="Keywords your ideal customers use..."
            className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)", color: "#f0ede8" }}
          />
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)", color: "#080a0e", fontFamily: "Syne, sans-serif", cursor: "pointer", border: "none" }}
          >
            {generating ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            {generating ? "Finding..." : "Find Leads"}
          </button>
        </div>

        {result && (
          <div className="space-y-6">
            {/* Places */}
            <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ fontFamily: "Syne, sans-serif", color: "#d4af37" }}>
                <Globe size={14} /> Where Your Customers Are (Top 20)
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {result.places.map((place, i) => (
                  <div key={i} className="text-xs p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", color: "rgba(240,237,232,0.6)" }}>
                    {i + 1}. {place}
                  </div>
                ))}
              </div>
            </div>

            {/* Outreach templates */}
            <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ fontFamily: "Syne, sans-serif", color: "#d4af37" }}>
                <Mail size={14} /> Outreach Templates
              </h2>
              <div className="space-y-3">
                {Object.entries(result.outreachTemplates).map(([key, template]) => (
                  <div key={key} className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase" style={{ color: "rgba(240,237,232,0.5)", fontFamily: "Syne, sans-serif", letterSpacing: "0.05em" }}>
                        {key.replace(/_/g, " ")}
                      </span>
                      <button onClick={() => copyText(template, key)} className="text-xs flex items-center gap-1 px-2 py-0.5 rounded transition-all" style={{ background: "rgba(212,175,55,0.08)", color: "#d4af37", cursor: "pointer", border: "none" }}>
                        <Copy size={9} /> Copy
                      </button>
                    </div>
                    <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: "rgba(240,237,232,0.6)" }}>{template}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly schedule */}
            <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold flex items-center gap-2" style={{ fontFamily: "Syne, sans-serif", color: "#d4af37" }}>
                  <MessageSquare size={14} /> Weekly Schedule
                </h2>
                <button onClick={() => copyText(result.weeklySchedule, "Schedule")} className="text-xs flex items-center gap-1 px-2 py-0.5 rounded transition-all" style={{ background: "rgba(212,175,55,0.08)", color: "#d4af37", cursor: "pointer", border: "none" }}>
                  <Copy size={9} /> Copy
                </button>
              </div>
              <pre className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: "rgba(240,237,232,0.6)" }}>{result.weeklySchedule}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
