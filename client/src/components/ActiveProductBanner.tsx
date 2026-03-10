import { useActiveProduct } from "@/hooks/useActiveProduct";
import { useLocation } from "wouter";
import { X, ArrowRight, Package } from "lucide-react";

const STAGE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  research:  { bg: "rgba(0,180,216,0.12)",   text: "#00b4d8",  label: "Research"  },
  validate:  { bg: "rgba(124,106,245,0.12)",  text: "#7c6af5",  label: "Validate"  },
  manual:    { bg: "rgba(212,175,55,0.12)",   text: "#d4af37",  label: "Manual"    },
  build:     { bg: "rgba(45,202,114,0.12)",   text: "#2dca72",  label: "Build"     },
  launch:    { bg: "rgba(255,100,100,0.12)",  text: "#ff6b6b",  label: "Launch"    },
  optimize:  { bg: "rgba(244,114,182,0.12)",  text: "#f472b6",  label: "Optimize"  },
  scale:     { bg: "rgba(139,92,246,0.12)",   text: "#8b5cf6",  label: "Scale"     },
};

interface Props {
  onUseProduct?: (summary: string) => void;
  ctaLabel?: string;
}

export function ActiveProductBanner({ onUseProduct, ctaLabel = "Use this product" }: Props) {
  const { activeProduct, setProduct } = useActiveProduct();
  const [, setLocation] = useLocation();

  if (!activeProduct) return null;

  const stage = STAGE_COLORS[activeProduct.source] ?? STAGE_COLORS.manual;

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 mx-5 mt-3 rounded-lg"
      style={{
        background: "rgba(212,175,55,0.05)",
        border: "1px solid rgba(212,175,55,0.18)",
      }}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(212,175,55,0.12)" }}
      >
        <Package size={13} style={{ color: "#d4af37" }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black truncate" style={{ color: "#f0ede8", fontFamily: "Syne, sans-serif" }}>
            {activeProduct.name}
          </span>
          {activeProduct.niche && (
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: stage.bg, color: stage.text, fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
              {activeProduct.niche}
            </span>
          )}
          <span
            className="text-xs px-1.5 py-0.5 rounded hidden sm:inline"
            style={{ background: stage.bg, color: stage.text, fontSize: 9, fontWeight: 700, flexShrink: 0 }}
          >
            {stage.label}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => setLocation("/app/my-products")}
          className="text-xs px-2.5 py-1 rounded-md transition-all"
          style={{ color: "rgba(240,237,232,0.4)", background: "transparent", border: "none", cursor: "pointer" }}
          onMouseEnter={e => (e.currentTarget.style.color = "rgba(240,237,232,0.7)")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(240,237,232,0.4)")}
        >
          Switch
        </button>

        {onUseProduct && (
          <button
            onClick={() => onUseProduct(activeProduct.summary)}
            className="flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-lg transition-all"
            style={{
              background: "rgba(212,175,55,0.12)",
              border: "1px solid rgba(212,175,55,0.28)",
              color: "#d4af37",
              cursor: "pointer",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(212,175,55,0.18)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(212,175,55,0.12)")}
          >
            {ctaLabel} <ArrowRight size={10} />
          </button>
        )}

        <button
          onClick={() => setProduct(null)}
          style={{ color: "rgba(240,237,232,0.25)", cursor: "pointer", background: "none", border: "none", padding: "2px" }}
          onMouseEnter={e => (e.currentTarget.style.color = "rgba(240,237,232,0.6)")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(240,237,232,0.25)")}
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}
