import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ExternalLink, Package, Loader2, X, Star, Link2, RefreshCw, Check, ArrowUpDown } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useActiveProduct } from "@/hooks/useActiveProduct";
import { ScoreBadge } from "@/components/ScoreBadge";
import { scoreProduct } from "@/lib/scoreProduct";

interface Product {
  id: string;
  name: string;
  url?: string | null;
  niche?: string | null;
  description?: string | null;
  stage?: string;
  status?: string;
}

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  research: { bg: "rgba(0,180,216,0.12)", text: "#00b4d8", label: "Research" },
  validate: { bg: "rgba(124,106,245,0.12)", text: "#7c6af5", label: "Validate" },
  build: { bg: "rgba(212,175,55,0.12)", text: "#d4af37", label: "Build" },
  launch: { bg: "rgba(255,100,100,0.12)", text: "#ff6b6b", label: "Launch" },
  optimize: { bg: "rgba(45,202,114,0.12)", text: "#2dca72", label: "Optimize" },
  scale: { bg: "rgba(244,114,182,0.12)", text: "#f472b6", label: "Scale" },
};

interface ImportedProduct {
  productTitle: string;
  description: string;
  bulletPoints: string[];
  price: string;
  imageUrls: string[];
}

export default function MyProducts() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { activeProduct, setProduct } = useActiveProduct();
  const [sortByScore, setSortByScore] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [niche, setNiche] = useState("");
  const [description, setDescription] = useState("");

  // URL importer state
  const [showImporter, setShowImporter] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [importedProduct, setImportedProduct] = useState<ImportedProduct | null>(null);

  const utils = trpc.useUtils();
  const { data: products, isLoading, error } = trpc.products.list.useQuery();
  const createMut = trpc.products.create.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); setShowCreate(false); resetForm(); setIsSubmitting(false); toast.success("Product created!"); },
    onError: () => { setIsSubmitting(false); toast.error("Failed to create product."); },
  });
  const updateMut = trpc.products.update.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); setEditId(null); resetForm(); setIsSubmitting(false); toast.success("Product updated!"); },
    onError: () => { setIsSubmitting(false); toast.error("Failed to update product."); },
  });
  const deleteMut = trpc.products.delete.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); setPendingDeleteId(null); toast.success("Product deleted."); },
  });

  const resetForm = () => { setName(""); setUrl(""); setNiche(""); setDescription(""); };

  const handleImport = useCallback(async () => {
    if (!importUrl.trim()) { toast.error("Enter a product URL first."); return; }
    setImporting(true);
    setImportError("");
    setImportedProduct(null);
    try {
      const response = await fetch("/api/scrape-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Failed: ${response.status}`);
      }
      const data = await response.json() as ImportedProduct;
      setImportedProduct(data);
    } catch (err: any) {
      setImportError(err?.message || "Could not import this URL. Try again or create manually.");
    } finally {
      setImporting(false);
    }
  }, [importUrl]);

  const handleSaveImported = () => {
    if (!importedProduct) return;
    setIsSubmitting(true);
    const productName = importedProduct.productTitle || "Imported Product";
    const productDesc = importedProduct.description || (importedProduct.bulletPoints.length > 0 ? importedProduct.bulletPoints.join(". ") : "");
    createMut.mutate({
      name: productName,
      url: importUrl || undefined,
      niche: undefined,
      description: productDesc || undefined,
    });
    setShowImporter(false);
    setImportUrl("");
    setImportedProduct(null);
  };

  const handleCreate = () => {
    if (!name.trim()) { toast.error("Product name is required."); return; }
    setIsSubmitting(true);
    createMut.mutate({ name, url: url || undefined, niche: niche || undefined, description: description || undefined });
  };

  const handleUpdate = () => {
    if (!editId || !name.trim()) return;
    setIsSubmitting(true);
    updateMut.mutate({ id: editId, name, url: url || undefined, niche: niche || undefined, description: description || undefined });
  };

  const startEdit = (p: Product) => {
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortByScore(s => !s)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: sortByScore ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${sortByScore ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.08)"}`,
                color: sortByScore ? "#d4af37" : "rgba(240,237,232,0.55)",
                cursor: "pointer",
              }}
            >
              <ArrowUpDown size={12} /> Sort by Score
            </button>
            <button
              onClick={() => { setShowCreate(true); setEditId(null); resetForm(); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
              style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)", color: "#080a0e", fontFamily: "Syne, sans-serif", cursor: "pointer" }}
            >
              <Plus size={14} /> New Product
            </button>
          </div>
        </div>

        {/* URL Importer */}
        <div className="mb-4">
          {!showImporter ? (
            <button
              onClick={() => { setShowImporter(true); setShowCreate(false); setEditId(null); setImportedProduct(null); setImportError(""); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(240,237,232,0.55)", cursor: "pointer" }}
            >
              <Link2 size={13} /> Import from URL
            </button>
          ) : (
            <div className="rounded-xl p-5 mb-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-black" style={{ fontFamily: "Syne, sans-serif" }}>Import Product from URL</div>
                <button onClick={() => { setShowImporter(false); setImportedProduct(null); setImportError(""); }} style={{ cursor: "pointer", color: "rgba(240,237,232,0.4)", background: "none", border: "none" }}><X size={16} /></button>
              </div>
              <div className="flex gap-2 mb-4">
                <input
                  value={importUrl}
                  onChange={e => setImportUrl(e.target.value)}
                  placeholder="https://aliexpress.com/item/... or any product URL"
                  className="flex-1 text-xs px-3 py-2.5 rounded-lg outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)", color: "#f0ede8" }}
                  onKeyDown={e => e.key === "Enter" && handleImport()}
                  onFocus={e => (e.target.style.borderColor = "rgba(212,175,55,0.45)")}
                  onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                />
                <button
                  onClick={handleImport}
                  disabled={importing || !importUrl.trim()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)", color: "#080a0e", fontFamily: "Syne, sans-serif", cursor: importing ? "not-allowed" : "pointer" }}
                >
                  {importing ? <Loader2 size={13} className="animate-spin" /> : <Link2 size={13} />}
                  {importing ? "Importing..." : "Import"}
                </button>
              </div>

              {importError && (
                <div className="text-xs p-3 rounded-lg mb-3" style={{ background: "rgba(224,92,122,0.1)", border: "1px solid rgba(224,92,122,0.25)", color: "#e05c7a" }}>
                  {importError}
                  <button onClick={handleImport} className="ml-2 underline" style={{ cursor: "pointer", background: "none", border: "none", color: "#e05c7a" }}>Retry</button>
                </div>
              )}

              {importedProduct && (
                <div className="rounded-xl p-4" style={{ background: "rgba(45,202,114,0.05)", border: "1px solid rgba(45,202,114,0.2)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Check size={14} style={{ color: "#2dca72" }} />
                    <div className="text-xs font-bold uppercase tracking-wider" style={{ color: "#2dca72", fontFamily: "Syne, sans-serif" }}>Product Extracted</div>
                  </div>
                  <div className="mb-2">
                    <div className="text-sm font-black mb-1" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8" }}>{importedProduct.productTitle || "Product"}</div>
                    {importedProduct.price && <div className="text-xs font-bold" style={{ color: "#d4af37" }}>{importedProduct.price}</div>}
                  </div>
                  {importedProduct.description && (
                    <div className="text-xs mb-3 line-clamp-3" style={{ color: "rgba(240,237,232,0.6)" }}>{importedProduct.description}</div>
                  )}
                  {importedProduct.bulletPoints.length > 0 && (
                    <ul className="text-xs mb-3 space-y-1" style={{ color: "rgba(240,237,232,0.55)" }}>
                      {importedProduct.bulletPoints.slice(0, 4).map((bp, i) => (
                        <li key={i} className="flex items-start gap-1.5"><span style={{ color: "#2dca72", flexShrink: 0 }}>•</span>{bp}</li>
                      ))}
                    </ul>
                  )}
                  {importedProduct.imageUrls.length > 0 && (
                    <div className="flex gap-2 mb-3 overflow-x-auto">
                      {importedProduct.imageUrls.slice(0, 4).map((img, i) => (
                        <img key={i} src={img} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                      ))}
                    </div>
                  )}
                  <button
                    onClick={handleSaveImported}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)", color: "#080a0e", fontFamily: "Syne, sans-serif", cursor: isSubmitting ? "not-allowed" : "pointer" }}
                  >
                    {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                    Add to My Products
                  </button>
                </div>
              )}
            </div>
          )}
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
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)", color: "#080a0e", fontFamily: "Syne, sans-serif", cursor: isSubmitting ? "not-allowed" : "pointer" }}
            >
              {isSubmitting ? (
                <div className="w-4 h-4 rounded-full border-2 border-[#080a0e]/30 border-t-[#080a0e] animate-spin" />
              ) : null}
              {editId ? "Save Changes" : "Create Product"}
            </button>
          </div>
        )}

        {/* Product List */}
        {error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="text-4xl">⚠️</div>
            <div className="text-sm font-black" style={{ fontFamily: "Syne, sans-serif" }}>Database not connected</div>
            <div className="text-xs max-w-xs text-center" style={{ color: "rgba(240,237,232,0.35)" }}>
              Run your database migrations and check DATABASE_URL in .env
            </div>
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
            {(sortByScore
              ? [...products].sort((a, b) =>
                  scoreProduct({ name: b.name, niche: b.niche ?? undefined, description: b.description ?? undefined }).total -
                  scoreProduct({ name: a.name, niche: a.niche ?? undefined, description: a.description ?? undefined }).total
                )
              : products
            ).map(p => {
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
                    <div className="flex items-center gap-1.5">
                      <ScoreBadge product={{ name: p.name, niche: p.niche ?? undefined, description: p.description ?? undefined }} showLabel={false} />
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: sc.bg, color: sc.text }}>{sc.label}</span>
                    </div>
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
                      {activeProduct?.id === p.id ? (
                        <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-bold" style={{ color: "#d4af37" }}>
                          <Star size={10} fill="#d4af37" />
                          Active
                        </span>
                      ) : (
                        <button
                          onClick={() => setProduct({ id: p.id, name: p.name, niche: p.niche ?? "", summary: p.description ?? p.name, source: "manual", savedAt: Date.now() })}
                          className="text-xs px-2 py-1 rounded-lg transition-all hover:bg-white/5"
                          style={{ cursor: "pointer", color: "rgba(240,237,232,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
                        >
                          Set Active
                        </button>
                      )}
                      <button onClick={() => startEdit(p)} className="p-1.5 rounded-lg transition-all hover:bg-white/5" style={{ cursor: "pointer", color: "rgba(240,237,232,0.4)" }}>
                        <Pencil size={12} />
                      </button>
                      {pendingDeleteId === String(p.id) ? (
                        <>
                          <button
                            onClick={() => { deleteMut.mutate({ id: p.id }); }}
                            className="text-xs px-2 py-1 rounded-lg font-bold transition-all"
                            style={{ background: "rgba(255,100,100,0.15)", color: "#ff6b6b", border: "1px solid rgba(255,100,100,0.3)", cursor: "pointer" }}
                          >
                            Confirm delete
                          </button>
                          <button
                            onClick={() => setPendingDeleteId(null)}
                            className="text-xs px-2 py-1 rounded-lg transition-all hover:bg-white/5"
                            style={{ color: "rgba(240,237,232,0.4)", cursor: "pointer" }}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setPendingDeleteId(String(p.id))}
                          className="p-1.5 rounded-lg transition-all hover:bg-white/5"
                          style={{ cursor: "pointer", color: "rgba(255,100,100,0.6)" }}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
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
