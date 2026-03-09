import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { stages } from "@/lib/tools";
import { Save, Plus, Check, ChevronDown, Package, FolderPlus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SaveToProductProps {
  /** The tool ID from tools.ts (e.g. "brand-dna") */
  toolId: string;
  /** Human-readable tool name (e.g. "Brand DNA Analyzer") */
  toolName: string;
  /** The output data to save — will be JSON.stringify'd */
  outputData: any;
  /** Optional className for the wrapper */
  className?: string;
}

/** Resolve the stage name for a given toolId from the stages config */
function getStageForTool(toolId: string): string {
  for (const s of stages) {
    if (s.tools.some((t) => t.id === toolId)) return s.stage;
  }
  return "Research";
}

export function SaveToProduct({
  toolId,
  toolName,
  outputData,
  className = "",
}: SaveToProductProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [saved, setSaved] = useState(false);

  const productsQuery = trpc.products.list.useQuery(undefined, {
    enabled: !!user && open,
  });

  const saveMutation = trpc.savedOutputs.save.useMutation({
    onSuccess: () => {
      setSaved(true);
      setOpen(false);
      toast.success(`Saved to product`, {
        description: `${toolName} output saved successfully.`,
      });
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (err) => {
      toast.error("Failed to save", { description: err.message });
    },
  });

  const createProductMutation = trpc.products.create.useMutation({
    onSuccess: (product) => {
      setCreating(false);
      setNewName("");
      productsQuery.refetch();
      // Auto-save to the newly created product
      if (product) handleSave(product.id);
    },
    onError: (err) => {
      toast.error("Failed to create product", { description: err.message });
    },
  });

  const handleSave = (productId: string) => {
    const stage = getStageForTool(toolId);
    const outputJson =
      typeof outputData === "string"
        ? outputData
        : JSON.stringify(outputData, null, 2);

    saveMutation.mutate({
      productId,
      toolId,
      toolName,
      stage,
      outputJson,
    });
  };

  const handleCreateAndSave = () => {
    if (!newName.trim()) return;
    createProductMutation.mutate({ name: newName.trim() });
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={saved ? "default" : "outline"}
          size="sm"
          className={`gap-2 ${saved ? "bg-green-600 hover:bg-green-700 text-white" : ""} ${className}`}
          disabled={saveMutation.isPending}
        >
          {saved ? (
            <>
              <Check className="h-4 w-4" />
              Saved
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save to Product
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <div className="p-3 border-b border-border">
          <p className="text-sm font-medium">Save to Product</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Choose a product or create a new one
          </p>
        </div>

        {/* Product list */}
        <div className="max-h-48 overflow-y-auto">
          {productsQuery.isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading products...
            </div>
          ) : productsQuery.data && productsQuery.data.length > 0 ? (
            <div className="p-1">
              {productsQuery.data.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleSave(product.id)}
                  disabled={saveMutation.isPending}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-sm hover:bg-accent transition-colors disabled:opacity-50"
                >
                  <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{product.name}</p>
                    {product.niche && (
                      <p className="text-xs text-muted-foreground truncate">
                        {product.niche}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                    {product.status}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center">
              <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No products yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Create one below to start saving outputs
              </p>
            </div>
          )}
        </div>

        {/* Create new product section */}
        <div className="border-t border-border p-3">
          {creating ? (
            <div className="flex gap-2">
              <Input
                placeholder="Product name..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateAndSave();
                  if (e.key === "Escape") {
                    setCreating(false);
                    setNewName("");
                  }
                }}
                className="h-8 text-sm"
                autoFocus
              />
              <Button
                size="sm"
                className="h-8 px-3 shrink-0"
                onClick={handleCreateAndSave}
                disabled={
                  !newName.trim() || createProductMutation.isPending
                }
              >
                {createProductMutation.isPending ? (
                  <span className="animate-spin">⟳</span>
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <FolderPlus className="h-4 w-4" />
              Create new product & save
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
