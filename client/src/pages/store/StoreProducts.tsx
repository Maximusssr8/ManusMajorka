import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "sonner";
import { ExternalLink, Copy, Eye, EyeOff, Package, Store } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Switch } from "../../components/ui/switch";
import { Label } from "../../components/ui/label";

export default function StoreProducts() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { isAuthenticated } = useAuth();

  const store = trpc.storefront.getMyStore.useQuery(undefined, { enabled: isAuthenticated });
  const myProducts = trpc.products.list.useQuery(undefined, { enabled: isAuthenticated });
  const sfProducts = trpc.storefront.getStorefrontProducts.useQuery(undefined, { enabled: isAuthenticated });

  const upsert = trpc.storefront.upsertStorefrontProduct.useMutation({
    onSuccess: () => { utils.storefront.getStorefrontProducts.invalidate(); toast.success("Saved!"); },
    onError: (e) => toast.error(e.message),
  });

  const [prices, setPrices] = useState<Record<string, { price: string; comparePrice: string }>>({});

  if (!store.data && !store.isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Store className="w-12 h-12 text-neutral-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">No store yet</h2>
        <p className="text-neutral-400 mb-6">Set up your store first to start selling.</p>
        <Button onClick={() => navigate("/app/store/setup")} className="bg-violet-600 hover:bg-violet-700 text-white">
          Set Up My Store
        </Button>
      </div>
    );
  }

  const sfMap: Record<string, any> = {};
  (sfProducts.data || []).forEach(sfp => { sfMap[sfp.productId] = sfp; });

  const priceFor = (productId: string) => prices[productId] ?? { price: sfMap[productId]?.price ?? "", comparePrice: sfMap[productId]?.comparePrice ?? "" };

  const handleToggle = (productId: string, published: boolean) => {
    const p = priceFor(productId);
    upsert.mutate({ productId, price: p.price, comparePrice: p.comparePrice, published });
  };

  const storeUrl = store.data ? `${window.location.origin}/store/${store.data.storeSlug}` : "";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Storefront</h1>
          {store.data && <p className="text-neutral-400 text-sm mt-1">{store.data.storeName}</p>}
        </div>
        {store.data && (
          <div className="flex gap-3">
            <Button variant="outline" size="sm" className="border-neutral-700 text-neutral-300"
              onClick={() => { navigator.clipboard.writeText(storeUrl); toast.success("Link copied!"); }}>
              <Copy className="w-4 h-4 mr-2" />Copy Link
            </Button>
            <Button variant="outline" size="sm" className="border-neutral-700 text-neutral-300"
              onClick={() => window.open(storeUrl, "_blank")}>
              <ExternalLink className="w-4 h-4 mr-2" />View Store
            </Button>
          </div>
        )}
      </div>

      {myProducts.isLoading ? (
        <div className="text-neutral-400">Loading products...</div>
      ) : !myProducts.data?.length ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
          <p className="text-neutral-400">No products yet. Import products in <button onClick={() => navigate("/app/my-products")} className="text-violet-400 hover:underline">My Products</button>.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {myProducts.data.map(product => {
            const sfp = sfMap[product.id];
            const published = sfp?.published ?? false;
            const p = priceFor(product.id);

            return (
              <div key={product.id} className={`bg-neutral-900 border rounded-xl p-5 transition-colors ${published ? "border-violet-800/50" : "border-neutral-800"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${published ? "bg-emerald-400" : "bg-neutral-600"}`} />
                    <div>
                      <p className="text-white font-medium">{product.name}</p>
                      <p className="text-neutral-500 text-xs">{product.niche || "No niche"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {published ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-neutral-500" />}
                    <Switch
                      checked={published}
                      onCheckedChange={checked => handleToggle(product.id, checked)}
                    />
                  </div>
                </div>

                {(published || prices[product.id]) && (
                  <div className="mt-4 pt-4 border-t border-neutral-800 flex gap-4">
                    <div>
                      <Label className="text-neutral-400 text-xs mb-1 block">Price (AUD)</Label>
                      <Input
                        value={p.price}
                        onChange={e => setPrices(prev => ({ ...prev, [product.id]: { ...priceFor(product.id), price: e.target.value } }))}
                        onBlur={() => upsert.mutate({ productId: product.id, price: p.price, comparePrice: p.comparePrice, published })}
                        placeholder="49.00"
                        className="bg-neutral-800 border-neutral-700 text-white w-32 h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-neutral-400 text-xs mb-1 block">Compare at (crossed out)</Label>
                      <Input
                        value={p.comparePrice}
                        onChange={e => setPrices(prev => ({ ...prev, [product.id]: { ...priceFor(product.id), comparePrice: e.target.value } }))}
                        onBlur={() => upsert.mutate({ productId: product.id, price: p.price, comparePrice: p.comparePrice, published })}
                        placeholder="99.00"
                        className="bg-neutral-800 border-neutral-700 text-white w-32 h-8 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
