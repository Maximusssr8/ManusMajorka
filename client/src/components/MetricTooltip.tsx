import {
  useFloating,
  useHover,
  useInteractions,
  offset,
  flip,
  shift,
  FloatingPortal,
} from "@floating-ui/react";
import { useState } from "react";
import { HelpCircle } from "lucide-react";

const METRIC_DEFINITIONS: Record<string, string> = {
  ROAS: "Return on Ad Spend — revenue generated per dollar spent on ads. A ROAS of 3x means $3 revenue per $1 spent.",
  COGS: "Cost of Goods Sold — total cost to produce/source a product including raw materials, manufacturing, and shipping to your warehouse.",
  AOV: "Average Order Value — the average dollar amount per transaction. Higher AOV = more profit per customer.",
  CTR: "Click-Through Rate — percentage of people who click your ad/link after seeing it. Higher = more engaging creative.",
  LTV: "Lifetime Value — total revenue a customer generates over their entire relationship with your brand.",
  CPA: "Cost Per Acquisition — how much you spend to acquire one paying customer through advertising.",
};

interface MetricTooltipProps {
  term: string;
  children?: React.ReactNode;
}

export function MetricTooltip({ term, children }: MetricTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const definition = METRIC_DEFINITIONS[term];

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    placement: "top",
  });

  const hover = useHover(context, { delay: { open: 150, close: 0 } });
  const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

  if (!definition) return <>{children ?? term}</>;

  return (
    <>
      <span
        ref={refs.setReference}
        {...getReferenceProps()}
        className="inline-flex items-center gap-1 cursor-help"
        style={{
          borderBottom: "1px dotted rgba(212,175,55,0.4)",
          color: "inherit",
        }}
      >
        {children ?? term}
        <HelpCircle size={10} style={{ color: "#d4af37", opacity: 0.6 }} />
      </span>
      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            {...getFloatingProps()}
            className="px-3 py-2 rounded-lg text-xs max-w-[260px] z-[400]"
            role="tooltip"
            aria-label={`${term} definition`}
            style={{
              ...floatingStyles,
              background: "#1a1a20",
              border: "1px solid rgba(212,175,55,0.2)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              color: "#e4e4e7",
              fontFamily: "DM Sans, sans-serif",
              lineHeight: 1.6,
            }}
          >
            <span className="font-bold" style={{ color: "#d4af37" }}>
              {term}
            </span>
            : {definition}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
