import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ExternalLink, Package, Loader2, X, RefreshCw, AlertTriangle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  research: { bg: "rgba(0,180,216,0.12)", text: "#00b4d8", label: "Research" },
  validate: { bg: "rgba(124,106,245,0.12)", text: "#7c6af5", label: "Validate" },
  build: { bg: "rgba(212,175,55,0.12)", text: "#d4af37", label: "Build" },
  launch: { bg: "rgba(255,100,100,0.12)", text: "#ff6b6b", label: "Launch" },
  optimize: { bg: "rgba(45,202,114,0.12)", text: "#2dca72", label: "Optimize" },
  scale: { bg: "rgba(244,114,182,0.12)", text: "#f472b6", label: "Scale" },
};

export default function MyProducts() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [niche, setNiche] = useState("");
  const [description, setDescription] = useState("");

  const utils = trpc.useUtils();
  const { data: products, isLoading, error } = trpc.products.list.useQuery();
  const createMut = trpc.products.create.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); setShowCreate(false); resetForm(); toast.success("Product created!"); },
  });
  const updateMut = trpc.products.update.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); setEditId(null); resetForm(); toast.success("Product updated!"); },
  });
  const deleteMut = trpc.products.delete.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); toast.success("Product deleted."); },
  });

  const resetForm = () => { setName(""); setUrl(""); setNiche(""); setDescription(""); };

  const handleCreate = () => {
    if (!name.trim()) { toast.error("Product name is required."); return; }
    createMut.mutate({ name, url: url || undefined, niche: niche || undefined, description: description || undefined });
  };

  const handleUpdate = () => {
    if (!editId || !name.trim()) return;
    updateMut.mutate({ id: editId, name, url: url || undefined, niche: niche || undefined, description: description || undefined });
  };

  const startEdit = (p: any) => {
    setEditId(p.id);
    setName(p.name);
    setUrl(p.url || "");
    setNiche(p.niche || "");
    setDescription(p.description || "");
    setShowCreate(false);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: "#080a0e", color: "#f0ede8" }}>
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <div className="text-sm font-bold" style={{ fontFamily: "Syne, sans-serif" }}>Sign in to manage products</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6" style={{ background: "#080a0e", color: "#f0ede8", fontFamily: "DM Sans, sans-serif", scrollbarWidth: "thin" }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-black" style={{ fontFamily: "Syne, sans-serif" }}>My Products</h1>
            <p className="text-xs mt-1" style={{ color: "rgba(240,237,232,0.4)" }}>Track your products through every stage — from research to scale.</p>
          </div>
          <button
            onClick={() => { setShowCreate(true); setEditId(null); resetForm(); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
            style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)", color: "#080a0e", fontFamily: "Syne, sans-serif", cursor: "pointer" }}
          >
            <Plus size={14} /> New Product
          </button>
        </div>

        {/* Create / Edit Form */}
        {(showCreate || editId !== null) && (
          <div className="rounded-xl p-5 mb-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-black" style={{ fontFamily: "Syne, sans-serif" }}>{editId ? "Edit Product" : "New Product"}</div>
              <button onClick={() => { setShowCreate(false); setEditId(null); resetForm(); }} style={{ cursor: "pointer", color: "rgba(240,237,232,0.4)" }}><X size={16} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: "Product Name *", value: name, set: setName, placeholder: "e.g. EcoGlow Candles" },
                { label: "Product URL", value: url, set: setUrl, placeholder: "https://..." },
                { label: "Niche", value: niche, set: setNiche, placeholder: "e.g. Home & Living" },
                { label: "Description", value: description, set: setDescription, placeholder: "Brief description..." },
              ].map(({ label, value, set, placeholder }) => (
                <div key={label}>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(240,237,232,0.4)", fontFamily: "Syne, sans-serif" }}>{label}</label>
                  <input value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
                    className="w-full text-xs px-3 py-2.5 rounded-lg outline-none"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)", color: "#f0ede8" }}
                    onFocus={e => (e.target.style.borderColor = "rgba(212,175,55,0.45)")}
                    onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />
                </div>
              ))}
            </div>
            <button
              onClick={editId ? handleUpdate : handleCreate}
              disabled={createMut.isPending || updateMut.isPending}
              className="px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)", color: "#080a0e", fontFamily: "Syne, sans-serif", cursor: createMut.isPending || updateMut.isPending ? "not-allowed" : "pointer" }}
            >
              {(createMut.isPending || updateMut.isPending) ? <Loader2 size={12} className="animate-spin" /> : null}
              {editId ? "Save Changes" : "Create Product"}
            </button>
          </div>
        )}

        {/* Product List */}
        {error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,100,100,0.08)" }}>
              <AlertTriangle size={28} style={{ color: "#ff6b6b" }} />
            </div>
            <div className="text-sm font-black" style={{ fontFamily: "Syne, sans-serif" }}>
              Failed to load products
            </div>
            <div className="text-xs max-w-sm text-center" style={{ color: "rgba(240,237,232,0.35)" }}>
              {error.message || "Something went wrong. Check your database connection and try again."}
            </div>
            <button
              onClick={() => utils.products.list.invalidate()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all mt-2"
              style={{
                background: "rgba(212,175,55,0.1)",
                border: "1px solid rgba(212,175,55,0.25)",
                color: "#d4af37",
                fontFamily: "Syne, sans-serif",
                cursor: "pointer",
              }}
            >
              <RefreshCw size={12} /> Try Again
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin" style={{ color: "#d4af37" }} />
          </div>
        ) : !products?.length ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="text-5xl">📦</div>
            <div className="text-center">
              <div className="text-base font-black mb-2" style={{ fontFamily: "Syne, sans-serif" }}>No products yet</div>
              <div className="text-xs" style={{ color: "rgba(240,237,232,0.35)" }}>Create your first product to start tracking it through every stage.</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map(p => {
              const sc = statusColors[p.status] || statusColors.research;
              return (
                <div key={p.id} className="rounded-xl p-4 transition-all hover:border-white/10 cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
                  onClick={() => navigate(`/app/product-hub/${p.id}`)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: sc.bg }}>
                        <Package size={16} style={{ color: sc.text }} />
                      </div>
                      <div>
                        <div className="text-sm font-bold" style={{ fontFamily: "Syne, sans-serif" }}>{p.name}</div>
                        {p.niche && <div className="text-xs mt-0.5" style={{ color: "rgba(240,237,232,0.4)" }}>{p.niche}</div>}
                      </div>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: sc.bg, color: sc.text }}>{sc.label}</span>
                  </div>
                  {p.description && <div className="text-xs mb-3 line-clamp-2" style={{ color: "rgba(240,237,232,0.5)" }}>{p.description}</div>}
                  <div className="flex items-center justify-between">
                    {p.url ? (
                      <a href={p.url} target="_blank" rel="noopener" className="text-xs flex items-center gap-1 hover:underline"
                        style={{ color: "#d4af37" }} onClick={e => e.stopPropagation()}>
                        <ExternalLink size={10} /> View Product
                      </a>
                    ) : <span />}
                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      <button onClick={() => startEdit(p)} className="p-1.5 rounded-lg transition-all hover:bg-white/5" style={{ cursor: "pointer", color: "rgba(240,237,232,0.4)" }}>
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => { if (confirm("Delete this product?")) deleteMut.mutate({ id: p.id }); }}
                        className="p-1.5 rounded-lg transition-all hover:bg-white/5" style={{ cursor: "pointer", color: "rgba(255,100,100,0.6)" }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
