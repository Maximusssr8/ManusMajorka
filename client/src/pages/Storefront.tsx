import { ArrowLeft, RotateCcw, Shield, ShoppingBag, X, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useLocation, useParams } from 'wouter';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

interface StoreData {
  store: {
    id: string;
    storeName: string;
    storeSlug: string;
    logoUrl?: string;
    metaPixelId?: string;
    brandColorPrimary?: string;
  };
  products: Array<{
    id: string;
    productId: string;
    price: string;
    comparePrice?: string;
    seoTitle?: string;
    seoDescription?: string;
    published: boolean;
    product?: {
      name: string;
      description?: string;
      niche?: string;
    };
  }>;
}

function MetaPixel({ pixelId }: { pixelId: string }) {
  useEffect(() => {
    if (!pixelId || (window as any).fbq) return;
    // Safe approach: load fbevents.js via src (no innerHTML), then init with sanitized pixelId
    const safePixelId = pixelId.replace(/[^0-9]/g, ''); // strip non-numeric chars
    if (!safePixelId) return;
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
    script.onload = () => {
      if ((window as any).fbq) {
        (window as any).fbq('init', safePixelId);
        (window as any).fbq('track', 'PageView');
      }
    };
  }, [pixelId]);
  return null;
}

export default function Storefront() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const [data, setData] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({ name: '', email: '', address: '' });
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/store/${slug}`)
      .then((r) => (r.ok ? r.json() : Promise.reject('Store not found')))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [slug]);

  const trackEvent = (event: string, params?: any) => {
    if ((window as any).fbq) (window as any).fbq('track', event, params);
  };

  const handleBuyNow = (sfProduct: any) => {
    setSelectedProduct(sfProduct);
    setShowCheckout(true);
    trackEvent('InitiateCheckout', { value: parseFloat(sfProduct.price || '0'), currency: 'AUD' });
  };

  const handleOrder = async () => {
    if (!checkoutForm.name || !checkoutForm.email) {
      toast.error('Name and email are required');
      return;
    }
    setOrdering(true);
    try {
      const res = await fetch('/api/store/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: data?.store.id,
          storefront_product_id: selectedProduct?.id,
          price: parseFloat(selectedProduct?.price || '0'),
          customer: {
            name: checkoutForm.name,
            email: checkoutForm.email,
            address: checkoutForm.address,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Checkout failed');
      trackEvent('Purchase', {
        value: parseFloat(selectedProduct?.price || '0'),
        currency: 'AUD',
        content_ids: [selectedProduct?.productId],
      });
      toast.success('Order placed! Check your email.');
      setShowCheckout(false);
      setSelectedProduct(null);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setOrdering(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );

  if (!data)
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <h1 className="text-3xl font-bold mb-4">Store not found</h1>
        <p className="text-neutral-400">This store doesn't exist or has been deactivated.</p>
      </div>
    );

  const { store, products } = data;
  const accent = store.brandColorPrimary || '#4f8ef7';

  return (
    <div className="min-h-screen bg-black text-white">
      {store.metaPixelId && <MetaPixel pixelId={store.metaPixelId} />}

      {/* Header */}
      <header className="border-b border-white/10 px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">{store.storeName}</h1>
          <ShoppingBag className="w-6 h-6 text-neutral-400" />
        </div>
      </header>

      {/* Hero */}
      <div className="py-16 px-6 text-center border-b border-white/5">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">{store.storeName}</h2>
          <p className="text-neutral-400 text-lg">Premium products, delivered.</p>
        </div>
      </div>

      {/* Products */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        {products.length === 0 ? (
          <div className="text-center py-20 text-neutral-500">No products published yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((sfp) => (
              <div
                key={sfp.id}
                className="group bg-[#0D1424] border border-white/[0.08] rounded-2xl overflow-hidden hover:border-white/20 transition-all"
              >
                {/* Product image placeholder */}
                <div className="aspect-square bg-[#111B2E] flex items-center justify-center">
                  <ShoppingBag className="w-16 h-16 text-neutral-700" />
                </div>
                <div className="p-5">
                  <h3 className="text-slate-100 font-semibold text-lg mb-1 line-clamp-2">
                    {sfp.product?.name || 'Product'}
                  </h3>
                  {sfp.product?.description && (
                    <p className="text-neutral-500 text-sm mb-3 line-clamp-2">
                      {sfp.product.description}
                    </p>
                  )}
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl font-bold text-slate-100">${sfp.price || '—'}</span>
                    {sfp.comparePrice && (
                      <span className="text-neutral-500 line-through text-sm">
                        ${sfp.comparePrice}
                      </span>
                    )}
                  </div>
                  <Button
                    className="w-full font-semibold"
                    style={{ backgroundColor: accent }}
                    onClick={() => {
                      handleBuyNow(sfp);
                      trackEvent('ViewContent', {
                        value: parseFloat(sfp.price || '0'),
                        currency: 'AUD',
                        content_ids: [sfp.productId],
                      });
                    }}
                  >
                    Buy Now
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Trust badges */}
      <div className="border-t border-white/5 py-8 px-6">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-6 text-center">
          {[
            { icon: Shield, label: 'Secure Checkout' },
            { icon: RotateCcw, label: 'Free Returns' },
            { icon: Zap, label: 'Fast Shipping' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <Icon className="w-6 h-6 text-neutral-400" />
              <span className="text-neutral-400 text-sm">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Checkout modal */}
      {showCheckout && selectedProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-[#0D1424] border border-white/[0.08] rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-slate-100 font-bold text-xl">Complete Order</h3>
              <button
                onClick={() => setShowCheckout(false)}
                className="text-gray-400 hover:text-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-[#111B2E] rounded-xl p-4 mb-6">
              <p className="text-slate-100 font-medium">{selectedProduct.product?.name}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-bold">${selectedProduct.price}</span>
                {selectedProduct.comparePrice && (
                  <span className="text-neutral-500 line-through text-sm">
                    ${selectedProduct.comparePrice}
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300 mb-1 block text-sm">Full Name *</Label>
                <Input
                  value={checkoutForm.name}
                  onChange={(e) => setCheckoutForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="John Smith"
                  className="bg-[#0D1424] border-white/[0.08] text-slate-100"
                />
              </div>
              <div>
                <Label className="text-slate-300 mb-1 block text-sm">Email *</Label>
                <Input
                  value={checkoutForm.email}
                  onChange={(e) => setCheckoutForm((f) => ({ ...f, email: e.target.value }))}
                  type="email"
                  placeholder="john@example.com"
                  className="bg-[#0D1424] border-white/[0.08] text-slate-100"
                />
              </div>
              <div>
                <Label className="text-slate-300 mb-1 block text-sm">Shipping Address</Label>
                <Input
                  value={checkoutForm.address}
                  onChange={(e) => setCheckoutForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="123 Main St, Sydney NSW 2000"
                  className="bg-[#0D1424] border-white/[0.08] text-slate-100"
                />
              </div>
              <Button
                className="w-full py-3 font-semibold text-base"
                style={{ backgroundColor: accent }}
                onClick={handleOrder}
                disabled={ordering}
              >
                {ordering ? 'Processing...' : `Pay $${selectedProduct.price} AUD`}
              </Button>
              <div className="flex items-center justify-center gap-2 text-neutral-600 text-xs">
                <Shield className="w-3 h-3" />
                Secured by Majorka Checkout
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
