import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Mail, Copy, Check, Loader2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { SaveToProduct } from "@/components/SaveToProduct";
import { useActiveProduct } from "@/hooks/useActiveProduct";
import { ActiveProductBanner } from "@/components/ActiveProductBanner";
import { injectProductIntelligence } from "@/lib/buildToolPrompt";

interface Email {
  emailNumber: number;
  sendTime: string;
  subject: string;
  previewText: string;
  body: string;
  cta: string;
  goal: string;
}

interface SequenceResult {
  sequenceName: string;
  overview: string;
  emails: Email[];
  automationTips: string[];
  segmentationAdvice: string;
}

const SYSTEM_PROMPT = `You are an expert ecommerce email marketer who specialises in high-converting automated sequences.
When given a product and sequence type, return a JSON object with this EXACT structure (no markdown, just raw JSON):
{"sequenceName":"Name of the sequence","overview":"Brief overview of the strategy","emails":[{"emailNumber":1,"sendTime":"e.g. Immediately after signup","subject":"Email subject line","previewText":"Preview text (max 90 chars)","body":"Full email body (use \\n for line breaks, keep it conversational and punchy, 150-250 words)","cta":"CTA button text","goal":"Purpose of this email"}],"automationTips":["Tip 1","Tip 2","Tip 3"],"segmentationAdvice":"How to segment this sequence for better results"}
Return 5 emails for the sequence. Return ONLY raw JSON.`;

function parseResult(text: string): SequenceResult | null {
  try {
    const stripped = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const start = stripped.indexOf("{");
    const end = stripped.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    const parsed = JSON.parse(stripped.slice(start, end + 1));
    if (!parsed.emails || !Array.isArray(parsed.emails)) return null;
    return parsed as SequenceResult;
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

function EmailCard({ email }: { email: Email }) {
  const [open, setOpen] = useState(email.emailNumber === 1);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 p-4 text-left" style={{ cursor: "pointer", background: "rgba(255,255,255,0.02)" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0" style={{ background: "rgba(74,184,245,0.12)", color: "#4ab8f5", fontFamily: "Syne, sans-serif" }}>
          {email.emailNumber}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate" style={{ color: "#f0ede8" }}>{email.subject}</div>
          <div className="text-xs mt-0.5" style={{ color: "rgba(240,237,232,0.35)" }}>{email.sendTime} · {email.goal}</div>
        </div>
        {open ? <ChevronUp size={13} style={{ color: "rgba(240,237,232,0.3)", flexShrink: 0 }} /> : <ChevronDown size={13} style={{ color: "rgba(240,237,232,0.3)", flexShrink: 0 }} />}
      </button>
      {open && (
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3 p-3 rounded-xl" style={{ background: "rgba(74,184,245,0.04)", border: "1px solid rgba(74,184,245,0.1)" }}>
            <div>
              <div className="text-xs font-bold mb-0.5" style={{ color: "#4ab8f5", fontFamily: "Syne, sans-serif" }}>Subject Line</div>
              <div className="text-sm font-semibold" style={{ color: "#f0ede8" }}>{email.subject}</div>
              <div className="text-xs mt-1" style={{ color: "rgba(240,237,232,0.4)" }}>Preview: {email.previewText}</div>
            </div>
            <CopyBtn text={`Subject: ${email.subject}\nPreview: ${email.previewText}`} />
          </div>
          <div className="p-3 rounded-xl" style={{ background: "rgba(0,0,0,0.2)" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "Syne, sans-serif" }}>Email Body</div>
              <CopyBtn text={email.body} />
            </div>
            <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "rgba(240,237,232,0.75)" }}>{email.body}</div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs px-3 py-1.5 rounded-lg font-black" style={{ background: "rgba(74,184,245,0.12)", color: "#4ab8f5", fontFamily: "Syne, sans-serif" }}>{email.cta}</span>
            <CopyBtn text={email.cta} />
          </div>
        </div>
      )}
    </div>
  );
}

const SEQUENCE_TYPES = [
  "Welcome Series", "Abandoned Cart", "Post-Purchase", "Win-Back", "Product Launch", "Browse Abandonment",
];

export default function EmailSequences() {
  const [product, setProduct] = useState("");
  const [sequenceType, setSequenceType] = useState("Welcome Series");
  const [brandVoice, setBrandVoice] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<SequenceResult | null>(null);
  const [genError, setGenError] = useState("");
  const { activeProduct } = useActiveProduct();

  useEffect(() => {
    if (activeProduct && !product) {
      const prefill = activeProduct.name + (activeProduct.summary ? "\n" + activeProduct.summary : "");
      setProduct(prefill);
    }
  }, [activeProduct]);

  const getSystemPrompt = () => injectProductIntelligence(SYSTEM_PROMPT, activeProduct as any);

  const handleGenerate = useCallback(async () => {
    if (!product.trim()) { toast.error("Please enter a product"); return; }
    setGenerating(true); setGenError(""); setResult(null);
    const prompt = [
      `Product/Brand: ${product}`,
      `Sequence type: ${sequenceType}`,
      brandVoice && `Brand voice: ${brandVoice}`,
    ].filter(Boolean).join("\n");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          systemPrompt: getSystemPrompt(),
        }),
      });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();
      const text = data.reply ?? "";
      const parsed = parseResult(text);
      if (parsed) setResult(parsed);
      else setGenError("Could not parse results. Please try again.");
    } catch (err: any) {
      setGenError(err.message || "Failed to generate. Please try again.");
    } finally {
      setGenerating(false);
    }
  }, [product, sequenceType, brandVoice, activeProduct]);

  const isLoading = generating;

  return (
    <div className="h-full flex flex-col" style={{ background: "#080a0e", color: "#f0ede8", fontFamily: "DM Sans, sans-serif" }}>
      <div className="flex items-center gap-3 px-5 py-3 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)", background: "#0c0e12" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(74,184,245,0.15)", border: "1px solid rgba(74,184,245,0.3)" }}>
          <Mail size={15} style={{ color: "#4ab8f5" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black leading-tight" style={{ fontFamily: "Syne, sans-serif" }}>Email Sequences</div>
          <div className="text-xs" style={{ color: "rgba(240,237,232,0.35)" }}>5-email automated flows · Subject lines · Full body copy · CTAs</div>
        </div>
        {result && (
          <button onClick={() => { setResult(null); setGenError(""); }} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(240,237,232,0.5)", cursor: "pointer" }}>
            <RefreshCw size={11} /> New Sequence
          </button>
        )}
      </div>

      <ActiveProductBanner ctaLabel="Load into tool" onUseProduct={(summary) => setProduct(summary)} />

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        <div className="w-full lg:w-72 flex-shrink-0 overflow-y-auto border-b lg:border-b-0 lg:border-r p-4 space-y-4" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(240,237,232,0.6)", fontFamily: "Syne, sans-serif" }}>Product / Brand *</label>
              <textarea value={product} onChange={e => setProduct(e.target.value)} rows={3}
                placeholder="Describe your product and brand…"
                className="w-full text-sm px-3 py-2.5 rounded-xl outline-none resize-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#f0ede8" }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(240,237,232,0.6)", fontFamily: "Syne, sans-serif" }}>Sequence Type</label>
              <div className="flex flex-wrap gap-1.5">
                {SEQUENCE_TYPES.map(t => (
                  <button key={t} onClick={() => setSequenceType(t)}
                    className="text-xs px-2.5 py-1 rounded-lg transition-all"
                    style={{ background: sequenceType === t ? "rgba(74,184,245,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${sequenceType === t ? "rgba(74,184,245,0.3)" : "rgba(255,255,255,0.07)"}`, color: sequenceType === t ? "#4ab8f5" : "rgba(240,237,232,0.45)", cursor: "pointer" }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(240,237,232,0.6)", fontFamily: "Syne, sans-serif" }}>Brand Voice</label>
              <input value={brandVoice} onChange={e => setBrandVoice(e.target.value)}
                placeholder="e.g. Friendly, expert, no-fluff…"
                className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#f0ede8" }} />
            </div>
          </div>

          <button onClick={handleGenerate} disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm transition-all"
            style={{ background: isLoading ? "rgba(74,184,245,0.25)" : "#4ab8f5", color: "#080a0e", fontFamily: "Syne, sans-serif", cursor: isLoading ? "not-allowed" : "pointer" }}>
            {isLoading ? <><Loader2 size={14} className="animate-spin" /> Writing…</> : <><Mail size={14} /> Build Sequence</>}
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
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(74,184,245,0.1)", border: "1px solid rgba(74,184,245,0.2)" }}>
                <Mail size={24} style={{ color: "#4ab8f5" }} className="animate-pulse" />
              </div>
              <div className="text-center">
                <div className="text-sm font-black mb-1" style={{ fontFamily: "Syne, sans-serif" }}>Building your {sequenceType}…</div>
                <div className="text-xs" style={{ color: "rgba(240,237,232,0.35)" }}>Writing 5 emails with full copy and strategy</div>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4 max-w-2xl">
              <div className="p-4 rounded-2xl" style={{ background: "rgba(74,184,245,0.05)", border: "1px solid rgba(74,184,245,0.15)" }}>
                <div className="text-sm font-black mb-1" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8" }}>{result.sequenceName}</div>
                <div className="text-xs leading-relaxed" style={{ color: "rgba(240,237,232,0.65)" }}>{result.overview}</div>
              </div>

              <div className="space-y-3">
                {result.emails.map((email, i) => <EmailCard key={i} email={email} />)}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "Syne, sans-serif" }}>Automation Tips</div>
                  {result.automationTips.map((tip, i) => (
                    <div key={i} className="text-xs flex items-start gap-1.5 mb-1.5" style={{ color: "rgba(240,237,232,0.65)" }}>
                      <span style={{ color: "#4ab8f5", flexShrink: 0 }}>→</span>{tip}
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "Syne, sans-serif" }}>Segmentation</div>
                  <div className="text-xs leading-relaxed" style={{ color: "rgba(240,237,232,0.65)" }}>{result.segmentationAdvice}</div>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !result && (
            <div className="h-full flex flex-col items-center justify-center gap-4 p-8">
              <div className="text-5xl">📧</div>
              <div className="text-center">
                <div className="text-base font-black mb-2" style={{ fontFamily: "Syne, sans-serif" }}>Build automated email flows</div>
                <div className="text-xs max-w-xs leading-relaxed" style={{ color: "rgba(240,237,232,0.35)" }}>
                  Select a sequence type to get 5 fully-written emails with subjects, preview text, body copy, and CTAs.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
