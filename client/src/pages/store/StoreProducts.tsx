import { Copy, ExternalLink, Eye, EyeOff, Loader2, Package, Store } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { useAuth } from '../../contexts/AuthContext';
import { trpc } from '../../lib/trpc';

export default function StoreProducts() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { isAuthenticated } = useAuth();

  const store = trpc.storefront.getMyStore.useQuery(undefined, { enabled: isAuthenticated });
  const myProducts = trpc.products.list.useQuery(undefined, { enabled: isAuthenticated });
  const sfProducts = trpc.storefront.getStorefrontProducts.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const upsert = trpc.storefront.upsertStorefrontProduct.useMutation({
    onSuccess: () => {
      utils.storefront.getStorefrontProducts.invalidate();
      toast.success('Saved!');
    },
    onError: (e) => toast.error(e.message),
  });

  const [prices, setPrices] = useState<Record<string, { price: string; comparePrice: string }>>({});

  if (!store.data && !store.isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Store className="w-12 h-12 mx-auto mb-4" style={{ color: '#9CA3AF' }} />
        <h2
          className="text-xl font-bold text-slate-100 mb-2"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          No store yet
        </h2>
        <p className="mb-6" style={{ color: '#94A3B8' }}>
          Set up your store first to start selling.
        </p>
        <Button
          onClick={() => navigate('/app/store/setup')}
          className="text-slate-100 font-semibold"
          style={{ background: '#d4af37' }}
        >
          Set Up My Store
        </Button>
      </div>
    );
  }

  const sfMap: Record<string, any> = {};
  (sfProducts.data || []).forEach((sfp) => {
    sfMap[sfp.productId] = sfp;
  });

  const priceFor = (productId: string) =>
    prices[productId] ?? {
      price: sfMap[productId]?.price ?? '',
      comparePrice: sfMap[productId]?.comparePrice ?? '',
    };

  const handleToggle = (productId: string, published: boolean) => {
    const p = priceFor(productId);
    upsert.mutate({ productId, price: p.price, comparePrice: p.comparePrice, published });
  };

  const storeUrl = store.data ? `${window.location.origin}/store/${store.data.storeSlug}` : '';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100" style={{ fontFamily: "'Syne', sans-serif" }}>
            Storefront
          </h1>
          {store.data && (
            <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>
              {store.data.storeName}
            </p>
          )}
        </div>
        {store.data && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-white/[0.08] text-slate-400 hover:text-slate-100"
              onClick={() => {
                navigator.clipboard.writeText(storeUrl);
                toast.success('Store link copied!');
              }}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-white/[0.08] text-slate-400 hover:text-slate-100"
              onClick={() => window.open(storeUrl, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Store
            </Button>
          </div>
        )}
      </div>

      {myProducts.isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-xl animate-pulse"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            />
          ))}
        </div>
      ) : !myProducts.data?.length ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 mx-auto mb-4" style={{ color: '#D1D5DB' }} />
          <p className="font-semibold text-slate-100 mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
            No products yet
          </p>
          <p className="text-sm mb-4" style={{ color: '#94A3B8' }}>
            Add products in{' '}
            <button
              onClick={() => navigate('/app/my-products')}
              className="underline"
              style={{ color: '#d4af37' }}
            >
              My Products
            </button>{' '}
            to start selling.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {myProducts.data.map((product) => {
            const sfp = sfMap[product.id];
            const published = sfp?.published ?? false;
            const p = priceFor(product.id);

            return (
              <div
                key={product.id}
                className="rounded-xl p-5 transition-colors"
                style={{
                  background: '#05070F',
                  border: published
                    ? '1px solid rgba(212,175,55,0.3)'
                    : '1px solid #E5E7EB',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: published ? '#4ade80' : '#D1D5DB' }}
                    />
                    <div>
                      <p
                        className="text-slate-100 font-medium"
                        style={{ fontFamily: "'Syne', sans-serif" }}
                      >
                        {product.name}
                      </p>
                      <p className="text-xs" style={{ color: '#9CA3AF' }}>
                        {product.niche || 'No niche'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {published ? (
                      <Eye className="w-4 h-4" style={{ color: '#4ade80' }} />
                    ) : (
                      <EyeOff className="w-4 h-4" style={{ color: '#9CA3AF' }} />
                    )}
                    <Switch
                      checked={published}
                      onCheckedChange={(checked) => handleToggle(product.id, checked)}
                    />
                  </div>
                </div>

                {(published || prices[product.id]) && (
                  <div
                    className="mt-4 pt-4 flex gap-4"
                    style={{ borderTop: '1px solid #F9FAFB' }}
                  >
                    <div>
                      <Label
                        className="text-xs mb-1 block"
                        style={{ color: '#94A3B8' }}
                      >
                        Price (AUD)
                      </Label>
                      <Input
                        value={p.price}
                        onChange={(e) =>
                          setPrices((prev) => ({
                            ...prev,
                            [product.id]: { ...priceFor(product.id), price: e.target.value },
                          }))
                        }
                        onBlur={() =>
                          upsert.mutate({
                            productId: product.id,
                            price: p.price,
                            comparePrice: p.comparePrice,
                            published,
                          })
                        }
                        placeholder="49.00"
                        className="border-white/[0.08] text-slate-100 w-32 h-8 text-sm"
                        style={{ background: 'rgba(255,255,255,0.03)' }}
                      />
                    </div>
                    <div>
                      <Label
                        className="text-xs mb-1 block"
                        style={{ color: '#94A3B8' }}
                      >
                        Compare at (crossed out)
                      </Label>
                      <Input
                        value={p.comparePrice}
                        onChange={(e) =>
                          setPrices((prev) => ({
                            ...prev,
                            [product.id]: { ...priceFor(product.id), comparePrice: e.target.value },
                          }))
                        }
                        onBlur={() =>
                          upsert.mutate({
                            productId: product.id,
                            price: p.price,
                            comparePrice: p.comparePrice,
                            published,
                          })
                        }
                        placeholder="99.00"
                        className="border-white/[0.08] text-slate-100 w-32 h-8 text-sm"
                        style={{ background: 'rgba(255,255,255,0.03)' }}
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
