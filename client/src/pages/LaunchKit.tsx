/**
 * LaunchKit — flagship "killer feature" page.
 * Runs all tools in sequence for the active product and produces
 * a complete launch package (Brand DNA, Copy, Website, Ads, Email, Financials).
 */
import { useState, useCallback } from "react";
import {
  Rocket,
  Check,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  Copy,
  ClipboardCopy,
  Package,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Markdown } from "@/components/Markdown";
import { useActiveProduct } from "@/hooks/useActiveProduct";

// ── Types ──────────────────────────────────────────────────────────────────────

type StepStatus = "pending" | "running" | "done" | "error";

type LaunchKitStep = {
  id: string;
  label: string;
  status: StepStatus;
  result?: string;
};

// ── System Prompts ─────────────────────────────────────────────────────────────

const PROMPTS: Record<string, string> = {
  "brand-dna":
    "You are a brand strategist. Given a product, output: Brand Name (3 options), Tagline (3 options), Brand Voice (3 adjectives), Target Customer (1 sentence), Colour Palette (3 hex codes). Be specific and commercial.",
  "product-copy":
    "You are an ecommerce copywriter. Output: Product Title (max 60 chars), Description (100 words), 5 Bullet Points (feature → benefit), Facebook Ad Hook (1 sentence).",
  "website-html":
    "Generate the key sections for a Shopify-style product landing page: Hero headline, Sub-headline, 3 key benefits, Social proof statement, FAQ (3 Qs), CTA text.",
  "ad-copy":
    "Write ad copy for Facebook (3 variations: pain/curiosity/social proof) and TikTok (hook + 15-sec script). Product: ",
  "email-sequence":
    "Write a 3-email post-purchase sequence: Order Confirmation, Product Tips, Review Request. Include subject, preview text, and 100-word body each.",
};

const INITIAL_STEPS: LaunchKitStep[] = [
  { id: "validation", label: "Product Analysis", status: "pending" },
  { id: "brand-dna", label: "Brand DNA", status: "pending" },
  { id: "product-copy", label: "Product Copy", status: "pending" },
  { id: "website-html", label: "Website Sections", status: "pending" },
  { id: "ad-copy", label: "Ad Copy", status: "pending" },
  { id: "email-sequence", label: "Email Sequence", status: "pending" },
  { id: "financial-model", label: "Financial Model", status: "pending" },
];

// ── AI call helper ─────────────────────────────────────────────────────────────

async function callAI(systemPrompt: string, userMessage: string): Promise<string> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: userMessage }],
      systemPrompt,
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`API error ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split("\n")) {
      if (line.startsWith("0:")) {
        try {
          fullText += JSON.parse(line.slice(2));
        } catch {
          // skip malformed chunk
        }
      }
    }
  }

  return fullText;
}

// ── Financial model (pure math, no API) ──────────────────────────────────────

function computeFinancialModel(summary: string, name: string): string {
  const priceMatch = summary.match(/\$(\d+(?:\.\d{2})?)/);
  if (!priceMatch) {
    return `## Financial Model — ${name}\n\n> Could not extract a price from the product data. Please add a price to your product summary to generate financial projections.`;
  }

  const price = parseFloat(priceMatch[1]);
  const cogs = price * 0.3;
  const margin = price - cogs;
  const adSpend = 8;
  const profit = margin - adSpend;
  const breakEven = profit > 0 ? Math.ceil(500 / profit) : null;
  const monthly50 = profit > 0 ? (50 * profit).toFixed(2) : null;
  const monthly200 = profit > 0 ? (200 * profit).toFixed(2) : null;

  return `## Financial Model — ${name}

| Metric | Value |
|--------|-------|
| Selling Price | $${price.toFixed(2)} |
| COGS (est. 30%) | $${cogs.toFixed(2)} |
| Gross Margin | $${margin.toFixed(2)} |
| Ad Spend (est.) | $${adSpend.toFixed(2)} |
| Net Profit/Unit | $${profit > 0 ? profit.toFixed(2) : "0.00"} |

### Break-even & Projections
${breakEven ? `- **Break-even point:** ${breakEven} sales to recover $500 launch budget` : "- Cannot calculate break-even (margin ≤ ad spend)"}
${monthly50 ? `- **50 sales/month:** ~$${monthly50} net profit` : ""}
${monthly200 ? `- **200 sales/month:** ~$${monthly200} net profit` : ""}

> *Estimates based on 30% COGS and $8 avg ad spend per sale.*`;
}

// ── Copy Button ───────────────────────────────────────────────────────────────

function CopyBtn({ text, small = false }: { text: string; small?: boolean }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handle}
      className="flex items-center gap-1.5 rounded-lg transition-all"
      style={{
        padding: small ? "4px 8px" : "6px 12px",
        fontSize: small ? 11 : 12,
        background: copied ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.05)",
        border: `1px solid ${copied ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.1)"}`,
        color: copied ? "#f59e0b" : "#a1a1aa",
        cursor: "pointer",
        fontFamily: "DM Sans, sans-serif",
      }}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// ── Section Result Card ───────────────────────────────────────────────────────

function ResultSection({ step }: { step: LaunchKitStep }) {
  const [open, setOpen] = useState(true);

  if (step.status !== "done" || !step.result) return null;

  return (
    <div
      className="rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-400"
      style={{
        background: "#111111",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left"
        style={{ background: "rgba(245,158,11,0.05)", border: "none", cursor: "pointer" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(245,158,11,0.2)" }}
          >
            <Check size={11} style={{ color: "#f59e0b" }} />
          </div>
          <span
            className="text-xs font-black uppercase tracking-widest"
            style={{ fontFamily: "Syne, sans-serif", color: "#f59e0b" }}
          >
            {step.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <CopyBtn text={step.result} small />
          {open ? (
            <ChevronUp size={14} style={{ color: "#a1a1aa" }} />
          ) : (
            <ChevronDown size={14} style={{ color: "#a1a1aa" }} />
          )}
        </div>
      </button>
      {open && (
        <div
          className="px-5 py-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <Markdown
            className="text-sm"
            shikiTheme={["github-dark", "github-dark"]}
          >
            {step.result}
          </Markdown>
        </div>
      )}
    </div>
  );
}

// ── Step Status Icon ──────────────────────────────────────────────────────────

function StepIcon({ status, index }: { status: StepStatus; index: number }) {
  if (status === "done")
    return (
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(245,158,11,0.2)" }}
      >
        <Check size={12} style={{ color: "#f59e0b" }} />
      </div>
    );
  if (status === "running")
    return (
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)" }}
      >
        <Loader2 size={12} style={{ color: "#f59e0b" }} className="animate-spin" />
      </div>
    );
  if (status === "error")
    return (
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(239,68,68,0.15)" }}
      >
        <X size={12} style={{ color: "#ef4444" }} />
      </div>
    );
  return (
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black"
      style={{
        background: "rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.25)",
        fontFamily: "Syne, sans-serif",
      }}
    >
      {index + 1}
    </div>
  );
}

// ── Main content ──────────────────────────────────────────────────────────────

function LaunchKitContent() {
  const { activeProduct } = useActiveProduct();
  const [, setLocation] = useLocation();
  const [steps, setSteps] = useState<LaunchKitStep[]>(INITIAL_STEPS);
  const [isRunning, setIsRunning] = useState(false);
  const [started, setStarted] = useState(false);

  const updateStep = useCallback(
    (id: string, patch: Partial<LaunchKitStep>) => {
      setSteps((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
      );
    },
    []
  );

  const handleGenerate = useCallback(async () => {
    if (!activeProduct) return;
    setIsRunning(true);
    setStarted(true);
    // Reset all steps to pending
    setSteps(INITIAL_STEPS.map((s) => ({ ...s, status: "pending", result: undefined })));

    const productName = activeProduct.name;
    const niche = activeProduct.niche || "";
    const summary = activeProduct.summary || "";
    const userMessage = `${productName} — ${niche} — ${summary}`.slice(0, 800);

    const aiSteps: Array<{ id: string; systemPrompt: string }> = [
      { id: "brand-dna", systemPrompt: PROMPTS["brand-dna"] },
      { id: "product-copy", systemPrompt: PROMPTS["product-copy"] },
      { id: "website-html", systemPrompt: PROMPTS["website-html"] },
      { id: "ad-copy", systemPrompt: PROMPTS["ad-copy"] + productName },
      { id: "email-sequence", systemPrompt: PROMPTS["email-sequence"] },
    ];

    try {
      // Step 1: validation (immediate)
      updateStep("validation", { status: "running" });
      await new Promise((r) => setTimeout(r, 400));
      updateStep("validation", {
        status: "done",
        result: `## Product Analysis\n\n**Product:** ${productName}\n**Niche:** ${niche || "Not specified"}\n\n${summary ? `**Summary:** ${summary}\n\n` : ""}Product validated and ready for launch kit generation.`,
      });

      // Steps 2–6: AI calls
      for (const step of aiSteps) {
        updateStep(step.id, { status: "running" });
        try {
          const result = await callAI(step.systemPrompt, userMessage);
          updateStep(step.id, { status: "done", result });
        } catch {
          updateStep(step.id, { status: "error" });
        }
      }

      // Step 7: Financial model (pure math)
      updateStep("financial-model", { status: "running" });
      await new Promise((r) => setTimeout(r, 300));
      const financialResult = computeFinancialModel(summary, productName);
      updateStep("financial-model", { status: "done", result: financialResult });

      toast.success("Launch Kit generated successfully!");
    } catch {
      toast.error("Generation failed. Please try again.");
    } finally {
      setIsRunning(false);
    }
  }, [activeProduct, updateStep]);

  const handleCopyAll = () => {
    const allText = steps
      .filter((s) => s.status === "done" && s.result)
      .map((s) => `# ${s.label}\n\n${s.result}`)
      .join("\n\n---\n\n");
    if (!allText) {
      toast.error("Nothing to copy yet.");
      return;
    }
    navigator.clipboard.writeText(allText);
    toast.success("All sections copied to clipboard!");
  };

  const completedCount = steps.filter((s) => s.status === "done").length;
  const hasAnyDone = completedCount > 0;

  return (
    <div className="flex h-full overflow-hidden" style={{ background: "#0a0a0a" }}>
      {/* ── Left Panel ── */}
      <div
        className="flex flex-col flex-shrink-0 overflow-y-auto"
        style={{
          width: 288,
          background: "#0d0d0d",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.08) transparent",
        }}
      >
        {/* Header */}
        <div
          className="px-5 pt-6 pb-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Rocket size={14} style={{ color: "#f59e0b" }} />
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "rgba(245,158,11,0.6)", fontFamily: "Syne, sans-serif" }}
            >
              Launch
            </span>
          </div>
          <h1
            className="text-lg font-black"
            style={{ fontFamily: "Syne, sans-serif", color: "#f5f5f5", letterSpacing: "-0.02em" }}
          >
            Launch Kit
          </h1>
          <p className="text-xs mt-1" style={{ color: "#a1a1aa" }}>
            Generate a complete launch package from your active product in one click.
          </p>
        </div>

        {/* Active product status */}
        <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          {activeProduct ? (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{
                background: "rgba(245,158,11,0.07)",
                border: "1px solid rgba(245,158,11,0.18)",
              }}
            >
              <Package size={12} style={{ color: "#f59e0b", flexShrink: 0 }} />
              <span
                className="text-xs font-bold truncate"
                style={{ color: "#f5f5f5", fontFamily: "Syne, sans-serif" }}
              >
                {activeProduct.name}
              </span>
            </div>
          ) : (
            <div
              className="flex flex-col gap-2 px-3 py-2.5 rounded-xl"
              style={{
                background: "rgba(239,68,68,0.07)",
                border: "1px solid rgba(239,68,68,0.18)",
              }}
            >
              <span className="text-xs" style={{ color: "#a1a1aa" }}>
                No active product.
              </span>
              <button
                onClick={() => setLocation("/app/my-products")}
                className="flex items-center gap-1.5 text-xs font-bold"
                style={{
                  color: "#f59e0b",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  fontFamily: "Syne, sans-serif",
                }}
              >
                Import a product first <ArrowRight size={10} />
              </button>
            </div>
          )}
        </div>

        {/* Steps list */}
        <div className="flex-1 px-4 py-4 space-y-1.5">
          {steps.map((step, i) => (
            <div
              key={step.id}
              className="flex items-center gap-2.5 px-2 py-2 rounded-lg"
              style={{
                background:
                  step.status === "running"
                    ? "rgba(245,158,11,0.07)"
                    : "transparent",
                transition: "background 0.2s",
              }}
            >
              <StepIcon status={step.status} index={i} />
              <span
                className="text-xs font-medium truncate flex-1"
                style={{
                  color:
                    step.status === "done"
                      ? "#f5f5f5"
                      : step.status === "running"
                      ? "#f59e0b"
                      : step.status === "error"
                      ? "#ef4444"
                      : "#a1a1aa",
                  fontFamily: "DM Sans, sans-serif",
                }}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {/* Progress indicator */}
        {started && (
          <div className="px-4 pb-2">
            <div
              className="rounded-full overflow-hidden"
              style={{ height: 3, background: "rgba(255,255,255,0.06)" }}
            >
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${(completedCount / steps.length) * 100}%`,
                  background: "linear-gradient(90deg, #f59e0b, #d97706)",
                  borderRadius: 9999,
                }}
              />
            </div>
            <p className="text-xs mt-1.5" style={{ color: "#a1a1aa" }}>
              {completedCount}/{steps.length} steps complete
            </p>
          </div>
        )}

        {/* Generate button */}
        <div className="px-4 pb-6 pt-2">
          <button
            onClick={handleGenerate}
            disabled={!activeProduct || isRunning}
            className="w-full py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            style={{
              fontFamily: "Syne, sans-serif",
              background:
                !activeProduct || isRunning
                  ? "rgba(245,158,11,0.1)"
                  : "linear-gradient(135deg, #f59e0b, #d97706)",
              color:
                !activeProduct || isRunning ? "rgba(245,158,11,0.4)" : "#0a0a0a",
              border: "none",
              cursor: !activeProduct || isRunning ? "not-allowed" : "pointer",
            }}
          >
            {isRunning ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Rocket size={14} />
                {started ? "Regenerate" : "Generate Launch Kit"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div
        className="flex-1 flex flex-col overflow-hidden"
        style={{ minWidth: 0 }}
      >
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-6 py-3.5 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "#0a0a0a" }}
        >
          <div>
            <h2
              className="text-base font-black"
              style={{ fontFamily: "Syne, sans-serif", color: "#f5f5f5" }}
            >
              {activeProduct ? `Launch Kit — ${activeProduct.name}` : "Launch Kit"}
            </h2>
            {activeProduct?.niche && (
              <p className="text-xs mt-0.5" style={{ color: "#a1a1aa" }}>
                {activeProduct.niche}
              </p>
            )}
          </div>
          {hasAnyDone && (
            <button
              onClick={handleCopyAll}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{
                background: "rgba(245,158,11,0.1)",
                border: "1px solid rgba(245,158,11,0.2)",
                color: "#f59e0b",
                cursor: "pointer",
                fontFamily: "Syne, sans-serif",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(245,158,11,0.18)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(245,158,11,0.1)")
              }
            >
              <ClipboardCopy size={12} />
              Copy All
            </button>
          )}
        </div>

        {/* Scrollable content */}
        <div
          className="flex-1 overflow-y-auto px-6 py-6 space-y-4"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255,255,255,0.08) transparent",
          }}
        >
          {/* Empty state */}
          {!started && (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
                style={{
                  background: "rgba(245,158,11,0.08)",
                  border: "1px solid rgba(245,158,11,0.18)",
                }}
              >
                <Rocket size={36} style={{ color: "#f59e0b" }} />
              </div>
              <h3
                className="text-2xl font-black mb-2"
                style={{ fontFamily: "Syne, sans-serif", color: "#f5f5f5" }}
              >
                Your Launch Kit awaits
              </h3>
              <p className="text-sm max-w-md mb-8" style={{ color: "#a1a1aa" }}>
                {activeProduct
                  ? `Click "Generate Launch Kit" to create a complete brand, copy, website, ads, email and financial package for ${activeProduct.name}.`
                  : "Import a product first, then generate your complete launch package in seconds."}
              </p>
              {!activeProduct && (
                <button
                  onClick={() => setLocation("/app/my-products")}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
                  style={{
                    background: "linear-gradient(135deg, #f59e0b, #d97706)",
                    color: "#0a0a0a",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "Syne, sans-serif",
                  }}
                >
                  Import a Product <ArrowRight size={14} />
                </button>
              )}
              <div className="grid grid-cols-3 gap-3 mt-6 max-w-lg w-full">
                {[
                  { icon: "🧬", label: "Brand DNA" },
                  { icon: "✍️", label: "Product Copy" },
                  { icon: "🌐", label: "Website Sections" },
                  { icon: "📢", label: "Ad Copy" },
                  { icon: "📧", label: "Email Sequence" },
                  { icon: "📊", label: "Financial Model" },
                ].map(({ icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <span className="text-base">{icon}</span>
                    <span className="text-xs font-medium" style={{ color: "#a1a1aa" }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Running / completed results */}
          {started && (
            <>
              {steps.map((step) => {
                if (step.status === "done") {
                  return <ResultSection key={step.id} step={step} />;
                }
                if (step.status === "running") {
                  return (
                    <div
                      key={step.id}
                      className="rounded-2xl px-5 py-4 flex items-center gap-3"
                      style={{
                        background: "#111111",
                        border: "1px solid rgba(245,158,11,0.15)",
                      }}
                    >
                      <Loader2
                        size={16}
                        style={{ color: "#f59e0b", flexShrink: 0 }}
                        className="animate-spin"
                      />
                      <div>
                        <p
                          className="text-xs font-bold"
                          style={{ color: "#f59e0b", fontFamily: "Syne, sans-serif" }}
                        >
                          {step.label}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "#a1a1aa" }}>
                          Generating...
                        </p>
                      </div>
                    </div>
                  );
                }
                if (step.status === "error") {
                  return (
                    <div
                      key={step.id}
                      className="rounded-2xl px-5 py-4 flex items-center gap-3"
                      style={{
                        background: "#111111",
                        border: "1px solid rgba(239,68,68,0.2)",
                      }}
                    >
                      <X size={14} style={{ color: "#ef4444", flexShrink: 0 }} />
                      <p
                        className="text-xs"
                        style={{ color: "#a1a1aa" }}
                      >
                        <span style={{ color: "#ef4444", fontWeight: 700 }}>
                          {step.label}
                        </span>{" "}
                        failed. Try regenerating.
                      </p>
                    </div>
                  );
                }
                return null;
              })}

              {/* All done summary */}
              {!isRunning && completedCount === steps.length && (
                <div
                  className="rounded-2xl px-5 py-4 flex items-center gap-3"
                  style={{
                    background: "rgba(245,158,11,0.05)",
                    border: "1px solid rgba(245,158,11,0.18)",
                  }}
                >
                  <Check size={16} style={{ color: "#f59e0b" }} />
                  <p className="text-sm font-bold" style={{ color: "#f5f5f5", fontFamily: "Syne, sans-serif" }}>
                    Launch Kit complete! Click "Copy All" to export.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

export default function LaunchKit() {
  return <LaunchKitContent />;
}
