/**
 * EmptyState — reusable illustrated empty state for tools.
 * Dark/gold style matching Majorka design system.
 */
import { type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyState({ icon: Icon, title, description, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-xs">
        {/* Illustrated icon container */}
        <div
          className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center relative"
          style={{
            background: "rgba(212,175,55,0.06)",
            border: "1px solid rgba(212,175,55,0.12)",
            boxShadow: "0 0 40px rgba(212,175,55,0.05)",
          }}
        >
          {/* Decorative ring */}
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: "radial-gradient(circle at 30% 30%, rgba(212,175,55,0.08), transparent 60%)",
            }}
          />
          <Icon size={32} style={{ color: "#d4af37", opacity: 0.8 }} />
        </div>
        <h3
          className="text-base font-black mb-2"
          style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8" }}
        >
          {title}
        </h3>
        <p
          className="text-xs leading-relaxed mb-5"
          style={{ color: "rgba(240,237,232,0.4)" }}
        >
          {description}
        </p>
        {ctaLabel && onCta && (
          <button
            onClick={onCta}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all"
            style={{
              background: "linear-gradient(135deg, #d4af37, #f0c040)",
              color: "#080a0e",
              fontFamily: "Syne, sans-serif",
              cursor: "pointer",
              border: "none",
              boxShadow: "0 4px 16px rgba(212,175,55,0.2)",
            }}
          >
            {ctaLabel}
          </button>
        )}
      </div>
    </div>
  );
}
