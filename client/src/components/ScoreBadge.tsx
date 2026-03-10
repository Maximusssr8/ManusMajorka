import { scoreProduct } from "@/lib/scoreProduct";

interface ScoreBadgeProps {
  product: {
    name: string;
    niche?: string;
    price?: number | string;
    description?: string;
    source?: string;
  };
  showLabel?: boolean;
}

export function ScoreBadge({ product, showLabel = false }: ScoreBadgeProps) {
  const score = scoreProduct(product);
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
      style={{
        background: score.color + "20",
        color: score.color,
        border: `1px solid ${score.color}40`,
      }}
      title={score.label}
    >
      {score.total}
      {showLabel && <span className="hidden sm:inline"> · {score.label}</span>}
    </span>
  );
}
