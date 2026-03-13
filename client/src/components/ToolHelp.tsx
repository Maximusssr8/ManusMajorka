/**
 * ToolHelp — contextual help popover for each AI tool.
 * Shows on hover/click of a ? icon next to the tool heading.
 */
import { useState, useRef, useEffect } from "react";
import { HelpCircle } from "lucide-react";

interface ToolHelpProps {
  description: string;
  bestUseCase: string;
  exampleInput: string;
  expectedOutput: string;
}

export default function ToolHelp({
  description,
  bestUseCase,
  exampleInput,
  expectedOutput,
}: ToolHelpProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative inline-flex" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        className="w-5 h-5 rounded-full flex items-center justify-center transition-all"
        style={{
          background: open ? "rgba(212,175,55,0.1)" : "transparent",
          border: "none",
          cursor: "pointer",
          color: open ? "#d4af37" : "#52525b",
        }}
        aria-label="Tool help"
      >
        <HelpCircle size={13} />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-2 z-50 animate-scale-in"
          style={{
            background: "#161620",
            border: "1px solid rgba(212,175,55,0.2)",
            borderRadius: 12,
            boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
            width: 280,
            padding: 16,
          }}
        >
          <div className="space-y-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#d4af37", fontFamily: "Syne, sans-serif" }}>
                What it does
              </div>
              <p className="text-xs" style={{ color: "rgba(245,245,245,0.65)", lineHeight: 1.5 }}>
                {description}
              </p>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#d4af37", fontFamily: "Syne, sans-serif" }}>
                Best for
              </div>
              <p className="text-xs" style={{ color: "rgba(245,245,245,0.65)", lineHeight: 1.5 }}>
                {bestUseCase}
              </p>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#d4af37", fontFamily: "Syne, sans-serif" }}>
                Example input
              </div>
              <p
                className="text-xs px-2.5 py-1.5 rounded-lg"
                style={{ color: "rgba(245,245,245,0.5)", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", fontStyle: "italic" }}
              >
                &ldquo;{exampleInput}&rdquo;
              </p>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#d4af37", fontFamily: "Syne, sans-serif" }}>
                You get
              </div>
              <p className="text-xs" style={{ color: "rgba(245,245,245,0.65)", lineHeight: 1.5 }}>
                {expectedOutput}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
