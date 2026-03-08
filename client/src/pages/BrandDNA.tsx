import React, { useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { Copy, Check, Sparkles, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { SaveToProduct } from "@/components/SaveToProduct";

// ─── Types ────────────────────────────────────────────────────────────────────
interface BrandDNAResult {
  brandName: string;
  missionStatement: string;
  coreValues: string[];
  brandPersonality: {
    archetype: string;
    traits: string[];
    toneOfVoice: string;
  };
  targetAudience: {
    primarySegment: string;
    psychographics: string[];
    painPoints: string[];
    desires: string[];
  };
  uniqueValueProposition: string;
  brandStory: string;
  visualIdentity: {
    colorPalette: string[];
    typography: string;
    aestheticDirection: string;
  };
  competitiveDifferentiation: string;
  taglines: string[];
  keyMessages: string[];
}

// ─── Copy Button ──────────────────────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg transition-all duration-150 flex-shrink-0"
      style={{
        background: copied ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.05)",
        border: `1px solid ${copied ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.1)"}`,
        color: copied ? "#d4af37" : "rgba(240,237,232,0.4)",
      }}
      title="Copy to clipboard"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({
  title,
  accent = "#d4af37",
  children,
  defaultOpen = true,
}: {
  title: string;
  accent?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className="rounded-2xl overflow-hidden mb-4"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left"
        style={{ background: `${accent}08` }}
      >
        <span className="text-xs font-black uppercase tracking-widest" style={{ fontFamily: "Syne, sans-serif", color: accent }}>
          {title}
        </span>
        {open ? <ChevronUp size={14} style={{ color: accent }} /> : <ChevronDown size={14} style={{ color: accent }} />}
      </button>
      {open && <div className="px-5 py-4">{children}</div>}
    </div>
  );
}

// ─── Tag Pill ─────────────────────────────────────────────────────────────────
function TagPill({ text, accent = "#d4af37" }: { text: string; accent?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}30` }}
    >
      {text}
    </span>
  );
}

// ─── Text Row ─────────────────────────────────────────────────────────────────
function TextRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <span className="text-xs font-semibold uppercase tracking-wider flex-shrink-0 mt-0.5" style={{ color: "rgba(240,237,232,0.35)", minWidth: "120px" }}>
        {label}
      </span>
      <span className="text-sm leading-relaxed flex-1" style={{ color: "#f0ede8" }}>{value}</span>
      <CopyBtn text={value} />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BrandDNA() {
  const [brandName, setBrandName] = useState("");
  const [productType, setProductType] = useState("");
  const [targetMarket, setTargetMarket] = useState("");
  const [brandVibe, setBrandVibe] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [result, setResult] = useState<BrandDNAResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const SYSTEM_PROMPT = `You are an expert brand strategist specialising in ecommerce brand building. When given brand details, you MUST respond with ONLY a valid JSON object (no markdown, no code blocks, no explanation) in this exact format:

{
  "brandName": "string",
  "missionStatement": "string - one powerful sentence",
  "coreValues": ["value1", "value2", "value3", "value4"],
  "brandPersonality": {
    "archetype": "string - e.g. The Hero, The Creator, The Sage",
    "traits": ["trait1", "trait2", "trait3", "trait4", "trait5"],
    "toneOfVoice": "string - describe the voice and tone"
  },
  "targetAudience": {
    "primarySegment": "string - demographic description",
    "psychographics": ["insight1", "insight2", "insight3"],
    "painPoints": ["pain1", "pain2", "pain3"],
    "desires": ["desire1", "desire2", "desire3"]
  },
  "uniqueValueProposition": "string - one compelling sentence",
  "brandStory": "string - 2-3 sentence brand origin/purpose story",
  "visualIdentity": {
    "colorPalette": ["#hex1 - Primary: name", "#hex2 - Secondary: name", "#hex3 - Accent: name"],
    "typography": "string - font pairing recommendation",
    "aestheticDirection": "string - visual style description"
  },
  "competitiveDifferentiation": "string - what makes this brand unique vs competitors",
  "taglines": ["tagline1", "tagline2", "tagline3"],
  "keyMessages": ["message1", "message2", "message3", "message4"]
}`;

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

  // Parse result when generation completes
  useEffect(() => {
    if (status === "ready" && isGenerating) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === "assistant") {
        const text = lastMsg.parts
          .filter((p: any) => p.type === "text")
          .map((p: any) => p.text)
          .join("");
        try {
          let content = text.trim();
          content = content.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");
          const parsed = JSON.parse(content) as BrandDNAResult;
          setResult(parsed);
          setIsGenerating(false);
        } catch {
          toast.error("Failed to parse brand analysis. Please try again.");
          setIsGenerating(false);
        }
      }
    }
  }, [status, isGenerating, messages]);

  const handleGenerate = async () => {
    if (!brandName.trim() || !productType.trim()) {
      toast.error("Please enter a brand name and product type.");
      return;
    }
    setResult(null);
    setIsGenerating(true);

    const prompt = `Analyse and build the complete Brand DNA for:

Brand Name: ${brandName}
Product / Niche: ${productType}
Target Market: ${targetMarket || "Not specified"}
Brand Vibe / Aesthetic: ${brandVibe || "Not specified"}
Competitors / Inspiration: ${competitors || "Not specified"}

Generate a comprehensive brand identity document as JSON.`;

    sendMessage({ text: prompt });
  };

  const handleReset = () => {
    setResult(null);
    setIsGenerating(false);
    setBrandName("");
    setProductType("");
    setTargetMarket("");
    setBrandVibe("");
    setCompetitors("");
  };

  return (
    <div className="flex h-full" style={{ background: "#0a0b0d" }}>
      {/* ── Left Panel ── */}
      <div
        className="flex flex-col flex-shrink-0 overflow-y-auto"
        style={{
          width: "320px",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          background: "#0d0e10",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.1) transparent",
        }}
      >
        {/* Header */}
        <div className="px-5 pt-6 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#d4af37" }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(212,175,55,0.6)", fontFamily: "Syne, sans-serif" }}>
              Brand Strategy
            </span>
          </div>
          <h1 className="text-lg font-black" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8", letterSpacing: "-0.02em" }}>
            Brand DNA Analyzer
          </h1>
          <p className="text-xs mt-1" style={{ color: "rgba(240,237,232,0.4)" }}>
            Extract your brand's core identity, personality, and positioning.
          </p>
        </div>

        {/* Form */}
        <div className="flex-1 px-5 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(240,237,232,0.5)" }}>
              Brand Name *
            </label>
            <input
              value={brandName}
              onChange={e => setBrandName(e.target.value)}
              placeholder="e.g. Lumière Skin"
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#f0ede8",
              }}
              onFocus={e => (e.target.style.borderColor = "rgba(212,175,55,0.5)")}
              onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(240,237,232,0.5)" }}>
              Product / Niche *
            </label>
            <input
              value={productType}
              onChange={e => setProductType(e.target.value)}
              placeholder="e.g. Premium skincare for women 30-45"
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#f0ede8",
              }}
              onFocus={e => (e.target.style.borderColor = "rgba(212,175,55,0.5)")}
              onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(240,237,232,0.5)" }}>
              Target Market
            </label>
            <input
              value={targetMarket}
              onChange={e => setTargetMarket(e.target.value)}
              placeholder="e.g. Professional women, health-conscious, 30-45"
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#f0ede8",
              }}
              onFocus={e => (e.target.style.borderColor = "rgba(212,175,55,0.5)")}
              onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(240,237,232,0.5)" }}>
              Brand Vibe / Aesthetic
            </label>
            <textarea
              value={brandVibe}
              onChange={e => setBrandVibe(e.target.value)}
              placeholder="e.g. Luxurious, minimalist, science-backed, empowering"
              rows={2}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all resize-none"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#f0ede8",
              }}
              onFocus={e => (e.target.style.borderColor = "rgba(212,175,55,0.5)")}
              onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(240,237,232,0.5)" }}>
              Competitors / Inspiration
            </label>
            <input
              value={competitors}
              onChange={e => setCompetitors(e.target.value)}
              placeholder="e.g. The Ordinary, Drunk Elephant, Tatcha"
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#f0ede8",
              }}
              onFocus={e => (e.target.style.borderColor = "rgba(212,175,55,0.5)")}
              onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </div>
        </div>

        {/* Generate Button */}
        <div className="px-5 pb-6 space-y-2">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !brandName.trim() || !productType.trim()}
            className="w-full py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2"
            style={{
              fontFamily: "Syne, sans-serif",
              background: isGenerating ? "rgba(212,175,55,0.15)" : "linear-gradient(135deg, #d4af37 0%, #b8941f 100%)",
              color: isGenerating ? "#d4af37" : "#0a0b0d",
              border: isGenerating ? "1px solid rgba(212,175,55,0.3)" : "none",
              opacity: (!brandName.trim() || !productType.trim()) ? 0.4 : 1,
              cursor: (!brandName.trim() || !productType.trim()) ? "not-allowed" : "pointer",
            }}
          >
            {isGenerating ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Analysing Brand DNA...
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Analyse Brand DNA
              </>
            )}
          </button>
          {result && (
            <button
              onClick={handleReset}
              className="w-full py-2 rounded-xl text-xs font-semibold transition-all duration-150"
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(240,237,232,0.4)",
              }}
            >
              Reset & Start Over
            </button>
          )}
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}
      >
        {!result && !isGenerating && (
          <div className="flex flex-col items-center justify-center h-full px-8 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)" }}>
              <span className="text-3xl">🧬</span>
            </div>
            <h2 className="text-xl font-black mb-2" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8" }}>
              Discover Your Brand DNA
            </h2>
            <p className="text-sm max-w-md" style={{ color: "rgba(240,237,232,0.4)" }}>
              Enter your brand details on the left and let AI extract your core identity — mission, personality, audience, visual direction, and competitive positioning.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-8 max-w-sm w-full">
              {[
                { icon: "🎯", label: "Brand Archetype" },
                { icon: "👥", label: "Target Audience" },
                { icon: "💎", label: "Value Proposition" },
                { icon: "🎨", label: "Visual Identity" },
                { icon: "✍️", label: "Taglines" },
                { icon: "📖", label: "Brand Story" },
              ].map(({ icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <span className="text-base">{icon}</span>
                  <span className="text-xs font-medium" style={{ color: "rgba(240,237,232,0.5)" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isGenerating && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="relative w-16 h-16 mb-6">
              <div className="absolute inset-0 rounded-full animate-ping" style={{ background: "rgba(212,175,55,0.2)" }} />
              <div className="relative w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)" }}>
                <Sparkles size={24} style={{ color: "#d4af37" }} className="animate-pulse" />
              </div>
            </div>
            <p className="text-sm font-semibold" style={{ color: "#d4af37" }}>Analysing brand identity...</p>
            <p className="text-xs mt-1" style={{ color: "rgba(240,237,232,0.3)" }}>Building your complete brand DNA</p>
          </div>
        )}

        {result && (
          <div className="max-w-3xl mx-auto px-6 py-8">
            {/* Brand Header */}
            <div className="mb-8 pb-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#d4af37" }} />
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(212,175,55,0.6)", fontFamily: "Syne, sans-serif" }}>
                  Brand DNA Report
                </span>
              </div>
              <h2 className="text-3xl font-black mb-2" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8" }}>
                {result.brandName}
              </h2>
              <div className="flex items-start gap-3">
                <p className="text-sm leading-relaxed flex-1" style={{ color: "rgba(240,237,232,0.6)", fontStyle: "italic" }}>
                  "{result.missionStatement}"
                </p>
                <CopyBtn text={result.missionStatement} />
              </div>
            </div>

            {/* Brand Personality */}
            <SectionCard title="Brand Personality" accent="#d4af37">
              <TextRow label="Archetype" value={result.brandPersonality.archetype} />
              <TextRow label="Tone of Voice" value={result.brandPersonality.toneOfVoice} />
              <div className="pt-3">
                <span className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: "rgba(240,237,232,0.35)" }}>
                  Personality Traits
                </span>
                <div className="flex flex-wrap gap-2">
                  {result.brandPersonality.traits.map(t => <TagPill key={t} text={t} accent="#d4af37" />)}
                </div>
              </div>
              <div className="pt-3">
                <span className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: "rgba(240,237,232,0.35)" }}>
                  Core Values
                </span>
                <div className="flex flex-wrap gap-2">
                  {result.coreValues.map(v => <TagPill key={v} text={v} accent="#b8941f" />)}
                </div>
              </div>
            </SectionCard>

            {/* Target Audience */}
            <SectionCard title="Target Audience" accent="#9c5fff">
              <TextRow label="Primary Segment" value={result.targetAudience.primarySegment} />
              <div className="pt-3 space-y-3">
                {[
                  { label: "Psychographics", items: result.targetAudience.psychographics, accent: "#9c5fff" },
                  { label: "Pain Points", items: result.targetAudience.painPoints, accent: "#ef4444" },
                  { label: "Desires", items: result.targetAudience.desires, accent: "#2dca72" },
                ].map(({ label, items, accent }) => (
                  <div key={label}>
                    <span className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: "rgba(240,237,232,0.35)" }}>
                      {label}
                    </span>
                    <ul className="space-y-1.5">
                      {items.map(item => (
                        <li key={item} className="flex items-start gap-2">
                          <div className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ background: accent }} />
                          <span className="text-sm" style={{ color: "#f0ede8" }}>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Positioning */}
            <SectionCard title="Positioning & Differentiation" accent="#2dca72">
              <TextRow label="UVP" value={result.uniqueValueProposition} />
              <TextRow label="Differentiation" value={result.competitiveDifferentiation} />
              <div className="pt-3">
                <span className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: "rgba(240,237,232,0.35)" }}>
                  Brand Story
                </span>
                <div className="flex items-start gap-3">
                  <p className="text-sm leading-relaxed flex-1" style={{ color: "#f0ede8" }}>{result.brandStory}</p>
                  <CopyBtn text={result.brandStory} />
                </div>
              </div>
            </SectionCard>

            {/* Visual Identity */}
            <SectionCard title="Visual Identity" accent="#f59e0b">
              <TextRow label="Typography" value={result.visualIdentity.typography} />
              <TextRow label="Aesthetic" value={result.visualIdentity.aestheticDirection} />
              <div className="pt-3">
                <span className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: "rgba(240,237,232,0.35)" }}>
                  Colour Palette
                </span>
                <div className="space-y-2">
                  {result.visualIdentity.colorPalette.map(color => {
                    const hexMatch = color.match(/#[0-9A-Fa-f]{3,6}/);
                    const hex = hexMatch ? hexMatch[0] : "#d4af37";
                    return (
                      <div key={color} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ background: hex, border: "1px solid rgba(255,255,255,0.15)" }} />
                        <span className="text-sm flex-1" style={{ color: "#f0ede8" }}>{color}</span>
                        <CopyBtn text={hex} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </SectionCard>

            {/* Taglines & Key Messages */}
            <SectionCard title="Taglines & Key Messages" accent="#06b6d4">
              <div className="mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider block mb-3" style={{ color: "rgba(240,237,232,0.35)" }}>
                  Taglines
                </span>
                <div className="space-y-2">
                  {result.taglines.map((tagline, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl"
                      style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.15)" }}
                    >
                      <span className="text-xs font-black" style={{ color: "rgba(6,182,212,0.5)", minWidth: "20px" }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-sm font-semibold flex-1" style={{ color: "#f0ede8", fontStyle: "italic" }}>
                        "{tagline}"
                      </span>
                      <CopyBtn text={tagline} />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider block mb-3" style={{ color: "rgba(240,237,232,0.35)" }}>
                  Key Messages
                </span>
                <div className="space-y-2">
                  {result.keyMessages.map((msg, i) => (
                    <div key={i} className="flex items-start gap-3 py-2">
                      <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: "#06b6d4" }} />
                      <span className="text-sm flex-1" style={{ color: "#f0ede8" }}>{msg}</span>
                      <CopyBtn text={msg} />
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
          </div>
        )}
      </div>
    </div>
  );
}
