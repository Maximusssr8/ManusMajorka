import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Trash2, Copy, Package, Loader2, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, useParams } from "wouter";

const stageOrder = ["research", "validate", "build", "launch", "optimize", "scale"];
const stageLabels: Record<string, string> = {
  research: "Research", validate: "Validate", build: "Build",
  launch: "Launch", optimize: "Optimize", scale: "Scale",
};
const stageColors: Record<string, string> = {
  research: "#00b4d8", validate: "#7c6af5", build: "#d4af37",
  launch: "#ff6b6b", optimize: "#2dca72", scale: "#f472b6",
};

export default function ProductHub() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const productId = params.id || "";
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [expandedOutput, setExpandedOutput] = useState<string | null>(null);

  const { data: product, isLoading: loadingProduct } = trpc.products.get.useQuery({ id: productId }, { enabled: !!productId });
  const { data: outputs, isLoading: loadingOutputs } = trpc.savedOutputs.list.useQuery({ productId }, { enabled: !!productId });
  const utils = trpc.useUtils();
  const deleteMut = trpc.savedOutputs.delete.useMutation({
    onSuccess: () => { utils.savedOutputs.list.invalidate({ productId }); toast.success("Output deleted."); },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: "#080a0e" }}>
        <Loader2 size={24} className="animate-spin" style={{ color: "#d4af37" }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: "#080a0e", color: "#f0ede8" }}>
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <div className="text-sm font-bold" style={{ fontFamily: "Syne, sans-serif" }}>Sign in to view product hub</div>
        </div>
      </div>
    );
  }

  if (loadingProduct || loadingOutputs) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: "#080a0e" }}>
        <Loader2 size={24} className="animate-spin" style={{ color: "#d4af37" }} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: "#080a0e", color: "#f0ede8" }}>
        <div className="text-center">
          <div className="text-4xl mb-4">📦</div>
          <div className="text-sm font-bold" style={{ fontFamily: "Syne, sans-serif" }}>Product not found</div>
          <button onClick={() => navigate("/app/my-products")} className="mt-3 text-xs underline" style={{ color: "#d4af37", cursor: "pointer" }}>
            Back to My Products
          </button>
        </div>
      </div>
    );
  }

  const outputsByStage = stageOrder.reduce((acc, stage) => {
    acc[stage] = (outputs || []).filter(o => o.stage === stage);
    return acc;
  }, {} as Record<string, typeof outputs extends (infer T)[] | undefined ? T[] : never[]>);

  const totalOutputs = outputs?.length || 0;

  return (
    <div className="h-full overflow-y-auto p-6" style={{ background: "#080a0e", color: "#f0ede8", fontFamily: "DM Sans, sans-serif", scrollbarWidth: "thin" }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/app/my-products")} className="p-2 rounded-lg hover:bg-white/5 transition-all" style={{ cursor: "pointer", color: "rgba(240,237,232,0.5)" }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Package size={16} style={{ color: stageColors[product.status] || "#d4af37" }} />
              <h1 className="text-xl font-black" style={{ fontFamily: "Syne, sans-serif" }}>{product.name}</h1>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "rgba(240,237,232,0.4)" }}>
              {product.niche ? `${product.niche} · ` : ""}{totalOutputs} saved output{totalOutputs !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Stage Accordion */}
        <div className="space-y-3">
          {stageOrder.map(stage => {
            const stageOutputs = outputsByStage[stage] || [];
            const isExpanded = expandedStage === stage;
            const color = stageColors[stage];
            return (
              <div key={stage} className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <button
                  onClick={() => setExpandedStage(isExpanded ? null : stage)}
                  className="w-full flex items-center justify-between p-4 transition-all hover:bg-white/3"
                  style={{ cursor: "pointer" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                    <span className="text-sm font-bold" style={{ fontFamily: "Syne, sans-serif" }}>{stageLabels[stage]}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${color}15`, color }}>{stageOutputs.length}</span>
                  </div>
                  {isExpanded ? <ChevronUp size={14} style={{ color: "rgba(240,237,232,0.4)" }} /> : <ChevronDown size={14} style={{ color: "rgba(240,237,232,0.4)" }} />}
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4">
                    {stageOutputs.length === 0 ? (
                      <div className="text-xs py-6 text-center" style={{ color: "rgba(240,237,232,0.25)" }}>
                        No outputs saved for this stage yet. Run a {stageLabels[stage]} tool and click "Save to Product".
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {stageOutputs.map(output => {
                          const isOpen = expandedOutput === output.id;
                          let parsed: any = null;
                          try { parsed = JSON.parse(output.outputJson); } catch {}
                          return (
                            <div key={output.id} className="rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                              <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => setExpandedOutput(isOpen ? null : output.id)}>
                                <div className="flex items-center gap-2">
                                  <FileText size={12} style={{ color }} />
                                  <span className="text-xs font-bold">{output.toolName}</span>
                                  <span className="text-xs" style={{ color: "rgba(240,237,232,0.3)" }}>
                                    {new Date(output.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(output.outputJson); toast.success("Copied JSON!"); }}
                                    className="p-1 rounded hover:bg-white/5 transition-all" style={{ cursor: "pointer", color: "rgba(240,237,232,0.4)" }}
                                  >
                                    <Copy size={11} />
                                  </button>
                                  <button
                                    onClick={e => { e.stopPropagation(); if (confirm("Delete this output?")) deleteMut.mutate({ id: output.id }); }}
                                    className="p-1 rounded hover:bg-white/5 transition-all" style={{ cursor: "pointer", color: "rgba(255,100,100,0.5)" }}
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              </div>
                              {isOpen && (
                                <div className="px-3 pb-3">
                                  <pre className="text-xs p-3 rounded-lg overflow-x-auto" style={{ background: "rgba(0,0,0,0.3)", color: "rgba(240,237,232,0.6)", maxHeight: 300, scrollbarWidth: "thin" }}>
                                    {parsed ? JSON.stringify(parsed, null, 2) : output.outputJson}
                                  </pre>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
