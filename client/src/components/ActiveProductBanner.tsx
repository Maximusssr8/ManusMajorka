import { useState } from "react";
import { useActiveProduct } from "@/hooks/useActiveProduct";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Package } from "lucide-react";

const stagePill: Record<string, { bg: string; text: string; label: string }> = {
  research: { bg: "rgba(0,180,216,0.12)", text: "#00b4d8", label: "Research" },
  validate: { bg: "rgba(124,106,245,0.12)", text: "#7c6af5", label: "Validate" },
  build: { bg: "rgba(212,175,55,0.12)", text: "#d4af37", label: "Build" },
  launch: { bg: "rgba(255,100,100,0.12)", text: "#ff6b6b", label: "Launch" },
  optimize: { bg: "rgba(45,202,114,0.12)", text: "#2dca72", label: "Optimize" },
  scale: { bg: "rgba(244,114,182,0.12)", text: "#f472b6", label: "Scale" },
};

export function ActiveProductBanner() {
  const { activeProduct, setActiveProduct, clearActiveProduct } = useActiveProduct();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const productsQuery = trpc.products.list.useQuery(undefined, {
    enabled: !!user && open,
  });

  if (!activeProduct) return null;

  const stage = activeProduct.stage?.toLowerCase() ?? "";
  const pill = stagePill[stage];

  return (
    <div
      className="flex items-center gap-3 px-4 py-2 text-sm flex-shrink-0"
      style={{ background: "rgba(212,175,55,0.06)", borderLeft: "4px solid #d4af37" }}
    >
      <span style={{ color: "rgba(240,237,232,0.5)" }}>Working on:</span>
      <span className="font-semibold" style={{ color: "#d4af37" }}>
        {activeProduct.name}
      </span>
      {activeProduct.niche && (
        <span style={{ color: "rgba(240,237,232,0.4)" }}>({activeProduct.niche})</span>
      )}
      {pill && (
        <span
          className="text-xs px-2 py-0.5 rounded-full font-bold"
          style={{ background: pill.bg, color: pill.text }}
        >
          {pill.label}
        </span>
      )}

      <div className="flex-1" />

      {/* Change popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="text-xs px-2.5 py-1 rounded-md transition-all hover:bg-white/5"
            style={{ color: "rgba(240,237,232,0.5)", cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            Change
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="end">
          <div className="p-3 border-b border-border">
            <p className="text-sm font-medium">Switch Active Product</p>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {productsQuery.isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading…
              </div>
            ) : productsQuery.data && productsQuery.data.length > 0 ? (
              <div className="p-1">
                {productsQuery.data.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setActiveProduct({
                        id: String(p.id),
                        name: p.name,
                        niche: p.niche ?? undefined,
                        stage: (p as any).stage ?? p.status ?? undefined,
                      });
                      setOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-sm hover:bg-accent transition-colors"
                  >
                    <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{p.name}</p>
                      {p.niche && (
                        <p className="text-xs text-muted-foreground truncate">{p.niche}</p>
                      )}
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                      {p.status}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No products found.
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear button */}
      <button
        onClick={clearActiveProduct}
        className="text-xs px-2 py-1 rounded-md transition-all hover:bg-white/5"
        style={{ color: "rgba(240,237,232,0.35)", cursor: "pointer", border: "none" }}
        aria-label="Clear active product"
      >
        ×
      </button>
    </div>
  );
}

export default ActiveProductBanner;
