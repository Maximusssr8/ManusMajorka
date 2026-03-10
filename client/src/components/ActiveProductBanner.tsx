import { useActiveProduct } from "@/hooks/useActiveProduct";
import { X, ArrowRight } from "lucide-react";

interface Props {
  onUseProduct?: (summary: string) => void;
  ctaLabel?: string;
}

export function ActiveProductBanner({ onUseProduct, ctaLabel = "Use this product" }: Props) {
  const { activeProduct, setProduct } = useActiveProduct();
  if (!activeProduct) return null;

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 mx-5 mt-3 rounded-xl"
      style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)" }}
    >
      <div className="text-xs" style={{ color: "#d4af37" }}>★</div>
      <div className="flex-1 min-w-0">
        <span className="text-xs font-bold" style={{ color: "rgba(240,237,232,0.6)", fontFamily: "Syne, sans-serif" }}>
          Active:{" "}
        </span>
        <span className="text-xs font-black" style={{ color: "#f0ede8", fontFamily: "Syne, sans-serif" }}>
          {activeProduct.name}
        </span>
        <span className="text-xs ml-2" style={{ color: "rgba(240,237,232,0.3)" }}>
          from {activeProduct.source}
        </span>
      </div>
      {onUseProduct && (
        <button
          onClick={() => onUseProduct(activeProduct.summary)}
          className="flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-lg"
          style={{
            background: "rgba(212,175,55,0.12)",
            border: "1px solid rgba(212,175,55,0.3)",
            color: "#d4af37",
            cursor: "pointer",
          }}
        >
          {ctaLabel} <ArrowRight size={10} />
        </button>
      )}
      <button
        onClick={() => setProduct(null)}
        style={{ color: "rgba(240,237,232,0.3)", cursor: "pointer", background: "none", border: "none" }}
      >
        <X size={12} />
      </button>
    </div>
  );
}
