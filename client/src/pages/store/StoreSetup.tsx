import { ArrowLeft, ArrowRight, Check, CreditCard, Rocket, Store, Target } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useAuth } from '../../contexts/AuthContext';
import { trpc } from '../../lib/trpc';

const steps = [
  { id: 1, label: 'Store Info', icon: Store },
  { id: 2, label: 'Payments', icon: CreditCard },
  { id: 3, label: 'Meta Ads', icon: Target },
  { id: 4, label: 'Launch', icon: Rocket },
];

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function StoreSetup() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    storeName: '',
    storeSlug: '',
    niche: '',
    metaAdAccountId: '',
    metaPixelId: '',
    brandColorPrimary: '#000000',
  });

  const existingStore = trpc.storefront.getMyStore.useQuery();
  const createStore = trpc.storefront.createStore.useMutation({
    onSuccess: () => {
      toast.success('Store launched!');
      navigate('/app/store/products');
    },
    onError: (err) => toast.error(err.message),
  });

  if (existingStore.data) {
    navigate('/app/store/products');
    return null;
  }

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const canProceed = () => {
    if (step === 1) return form.storeName.trim() && form.storeSlug.trim();
    return true;
  };

  const handleLaunch = () => {
    if (!form.storeName || !form.storeSlug) {
      toast.error('Store name and slug required');
      return;
    }
    createStore.mutate({
      storeName: form.storeName,
      storeSlug: form.storeSlug,
      metaAdAccountId: form.metaAdAccountId || undefined,
      metaPixelId: form.metaPixelId || undefined,
      brandColorPrimary: form.brandColorPrimary,
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Step indicators */}
      <div className="flex items-center justify-between mb-10">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const done = step > s.id;
          const active = step === s.id;
          return (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors ${
                  done
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : active
                      ? 'border-[#d4af37] text-[#d4af37]'
                      : 'border-white/[0.08] text-gray-400'
                }`}
              >
                {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span
                className={`text-sm hidden sm:block ${active ? 'text-slate-100' : 'text-gray-400'}`}
              >
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <div
                  className={`h-px flex-1 mx-2 ${step > s.id ? 'bg-emerald-500' : 'bg-[#0d0d10]/[0.08]'}`}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-[#0D1424] border border-white/[0.08] rounded-xl p-8">
        {/* Step 1: Store Info */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-100">Name your store</h2>
              <p className="text-gray-500 mt-1">
                This is what customers will see when they shop with you.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300 mb-1 block">Store Name</Label>
                <Input
                  value={form.storeName}
                  onChange={(e) => {
                    set('storeName', e.target.value);
                    set('storeSlug', slugify(e.target.value));
                  }}
                  placeholder="e.g. Luxe Wellness"
                  className="bg-[#111B2E] border-white/[0.08] text-slate-100"
                />
              </div>
              <div>
                <Label className="text-slate-300 mb-1 block">Store URL</Label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm whitespace-nowrap">
                    {window.location.origin}/store/
                  </span>
                  <Input
                    value={form.storeSlug}
                    onChange={(e) => set('storeSlug', slugify(e.target.value))}
                    placeholder="luxe-wellness"
                    className="bg-[#111B2E] border-white/[0.08] text-slate-100"
                  />
                </div>
              </div>
              <div>
                <Label className="text-slate-300 mb-1 block">Niche / Category</Label>
                <Input
                  value={form.niche}
                  onChange={(e) => set('niche', e.target.value)}
                  placeholder="e.g. Home & Wellness"
                  className="bg-[#111B2E] border-white/[0.08] text-slate-100"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Payments */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-100">Connect Payments</h2>
              <p className="text-gray-500 mt-1">Get paid directly to your bank via Stripe.</p>
            </div>
            <div className="bg-[#111B2E] rounded-lg p-6 border border-white/[0.08]">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="w-6 h-6 text-[#d4af37]" />
                <span className="text-slate-100 font-medium">Stripe Payments</span>
              </div>
              <p className="text-gray-500 text-sm mb-4">
                Stripe processes your payments securely. Add your{' '}
                <code className="bg-[#0d0d10]/[0.08] px-1 rounded text-xs">STRIPE_SECRET_KEY</code> to
                your Vercel environment variables to enable live checkout.
              </p>
              <div className="flex items-center gap-2 text-sm text-emerald-400">
                <Check className="w-4 h-4" />
                <span>Orders are always saved — payments can be added later</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Meta Ads */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-100">Meta Ads Setup</h2>
              <p className="text-gray-500 mt-1">
                Connect Meta to track conversions and run ads.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300 mb-1 block">
                  Meta Ad Account ID <span className="text-gray-400">(optional)</span>
                </Label>
                <Input
                  value={form.metaAdAccountId}
                  onChange={(e) => set('metaAdAccountId', e.target.value)}
                  placeholder="act_XXXXXXXXXXXXXXX"
                  className="bg-[#111B2E] border-white/[0.08] text-slate-100"
                />
                <p className="text-gray-400 text-xs mt-1">
                  Find this in Meta Business Manager → Ad Accounts
                </p>
              </div>
              <div>
                <Label className="text-slate-300 mb-1 block">
                  Meta Pixel ID <span className="text-gray-400">(optional)</span>
                </Label>
                <Input
                  value={form.metaPixelId}
                  onChange={(e) => set('metaPixelId', e.target.value)}
                  placeholder="1234567890"
                  className="bg-[#111B2E] border-white/[0.08] text-slate-100"
                />
                <p className="text-gray-400 text-xs mt-1">
                  Tracks ViewContent, AddToCart, Purchase events automatically
                </p>
              </div>
              <a
                href="https://business.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#d4af37] text-sm hover:underline"
              >
                How to find your Meta IDs →
              </a>
            </div>
          </div>
        )}

        {/* Step 4: Launch */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-100">Ready to launch!</h2>
              <p className="text-gray-500 mt-1">Your store details:</p>
            </div>
            <div className="bg-[#111B2E] rounded-lg p-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Store Name</span>
                <span className="text-slate-100 font-medium">{form.storeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Store URL</span>
                <span className="text-[#d4af37] text-sm">/store/{form.storeSlug}</span>
              </div>
              {form.metaPixelId && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Meta Pixel</span>
                  <span className="text-slate-100">{form.metaPixelId}</span>
                </div>
              )}
            </div>
            <Button
              onClick={handleLaunch}
              disabled={createStore.isPending}
              className="w-full py-3 text-lg font-semibold text-slate-100"
              style={{ background: '#d4af37' }}
            >
              {createStore.isPending ? 'Launching...' : '🚀 Launch My Store'}
            </Button>
          </div>
        )}

        {/* Navigation */}
        {step < 4 && (
          <div className="flex justify-between mt-8">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 1}
              className="text-gray-400 hover:text-slate-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
              className="text-slate-100 font-semibold"
              style={{ background: '#d4af37' }}
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
