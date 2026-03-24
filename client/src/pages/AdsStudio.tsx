import {
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  FileJson,
  Image as ImageIcon,
  Loader2,
  Wand2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useProduct } from '../contexts/ProductContext';

// Uses /api/chat AI endpoint for campaign generation

type AdSet = {
  variation: number;
  angle: string;
  hook: string;
  primary_text: string;
  headline: string;
  description: string;
  cta: string;
  image_prompt: string;
  psychology: string;
  generated_image_url?: string;
};
type Campaign = {
  ad_sets: AdSet[];
  video_script?: { hook_3s: string; body_7s: string; cta_5s: string; caption: string };
  targeting?: {
    age_range: string;
    interests: string[];
    behaviors: string[];
    lookalike_note: string;
  };
  budget_strategy?: {
    daily_budget: number;
    testing_phase: string;
    scaling_trigger: string;
    expected_roas: string;
  };
  has_images?: boolean;
};

const ANGLE_COLORS: Record<string, string> = {
  'Pain Point': 'border-red-800/50 bg-red-900/10',
  'Social Proof': 'border-emerald-800/50 bg-emerald-900/10',
  'FOMO/Urgency': 'border-orange-800/50 bg-orange-900/10',
  Curiosity: 'border-[#6366F1]/30 bg-[#6366F1]/5',
  Transformation: 'border-[#6366F1]/20 bg-[#6366F1]/5',
};

function AdCard({ ad }: { ad: AdSet }) {
  const [open, setOpen] = useState(false);
  const colorClass = ANGLE_COLORS[ad.angle] || 'border-gray-200 bg-gray-50';
  const copy = (t: string) => {
    navigator.clipboard.writeText(t);
    toast.success('Copied!');
  };
  return (
    <div className={`border rounded-xl overflow-hidden ${colorClass}`}>
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className="text-xs text-neutral-400 uppercase tracking-wider">
              Variation {ad.variation}
            </span>
            <h3 className="text-white font-bold text-lg mt-0.5">{ad.angle}</h3>
          </div>
          <span className="text-xs bg-neutral-800 text-neutral-300 px-2 py-1 rounded-full">
            {ad.cta?.replace(/_/g, ' ')}
          </span>
        </div>
        {ad.generated_image_url ? (
          <img
            src={ad.generated_image_url}
            alt={ad.headline}
            className="w-full rounded-lg aspect-video object-cover mb-4"
          />
        ) : (
          <div className="bg-neutral-800/50 rounded-lg p-3 mb-4 flex items-start gap-2">
            <ImageIcon className="w-4 h-4 text-neutral-500 mt-0.5 flex-shrink-0" />
            <p className="text-neutral-400 text-xs italic">{ad.image_prompt}</p>
          </div>
        )}
        <div className="space-y-2">
          {[
            ['Hook', ad.hook],
            ['Primary Text', ad.primary_text],
            ['Headline', ad.headline],
          ].map(([label, val]) => (
            <div key={label} className="bg-black/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-neutral-500 uppercase">{label}</span>
                <button onClick={() => copy(val)} className="text-neutral-500 hover:text-white">
                  <Copy className="w-3 h-3" />
                </button>
              </div>
              <p
                className={`${label === 'Hook' ? 'text-white font-semibold' : 'text-neutral-300 text-sm'}`}
              >
                {val}
              </p>
            </div>
          ))}
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="mt-3 text-xs text-neutral-500 hover:text-neutral-300 flex items-center gap-1"
        >
          Why this works{' '}
          {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        {open && <p className="mt-2 text-xs text-neutral-400 italic">{ad.psychology}</p>}
      </div>
    </div>
  );
}

export default function AdsStudio() {
  const { activeProduct } = useProduct();
  const [productDesc, setProductDesc] = useState(
    activeProduct?.description || activeProduct?.name || ''
  );
  const [objective, setObjective] = useState('PURCHASE');
  const [budget, setBudget] = useState('20');
  const [loading, setLoading] = useState(false);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [showScript, setShowScript] = useState(false);

  const generate = async () => {
    const desc = productDesc.trim();
    if (!desc) {
      toast.error('Enter a product description');
      return;
    }
    setLoading(true);
    setCampaign(null);
    try {
      const product = activeProduct
        ? { title: activeProduct.name, description: activeProduct.description || desc }
        : { title: desc, description: desc };
      const prompt = `Generate a Meta (Facebook/Instagram) ad campaign for this product. Return ONLY valid JSON, no markdown, no explanation.

Product: ${product.title}
Description: ${product.description}
Objective: ${objective}
Daily budget: $${parseFloat(budget) || 20} AUD

Return this JSON structure:
{"ad_sets":[{"variation":1,"angle":"Pain Point","hook":"...","primary_text":"...","headline":"...","description":"...","cta":"SHOP_NOW","image_prompt":"...","psychology":"..."},{"variation":2,"angle":"Social Proof","hook":"...","primary_text":"...","headline":"...","description":"...","cta":"SHOP_NOW","image_prompt":"...","psychology":"..."},{"variation":3,"angle":"FOMO/Urgency","hook":"...","primary_text":"...","headline":"...","description":"...","cta":"SHOP_NOW","image_prompt":"...","psychology":"..."}],"video_script":{"hook_3s":"...","body_7s":"...","cta_5s":"...","caption":"..."},"targeting":{"age_range":"...","interests":["..."],"behaviors":["..."],"lookalike_note":"..."},"budget_strategy":{"daily_budget":${parseFloat(budget) || 20},"testing_phase":"...","scaling_trigger":"...","expected_roas":"..."}}

Use AU English. Make hooks punchy and specific to the product. Each ad_set must have a different angle.`;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolName: 'ai-chat',
          messages: [{ role: 'user', content: prompt }],
          stream: false,
        }),
      });
      const data = await res.json() as { reply?: string };
      if (!data.reply) throw new Error('No response from AI');
      const cleaned = (data.reply || '').replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
      const parsed = JSON.parse(cleaned) as Campaign;
      setCampaign(parsed);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const exportJSON = () => {
    if (!campaign) return;
    const blob = new Blob([JSON.stringify(campaign, null, 2)], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: 'meta-campaign.json',
    });
    a.click();
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <div className="lg:w-80 xl:w-96 bg-neutral-950 border-b lg:border-b-0 lg:border-r border-neutral-800 p-6 flex-shrink-0">
        <h1 className="text-xl font-bold text-white mb-1">Ads Studio</h1>
        <p className="text-neutral-400 text-sm mb-6">Generate 3 Meta ad variations with AI</p>
        <div className="space-y-5">
          <div>
            <Label className="text-neutral-300 mb-2 block text-sm">Product</Label>
            {activeProduct && (
              <div className="mb-2 text-xs text-[#6366F1] bg-[#6366F1]/10 border border-[#6366F1]/20 px-3 py-2 rounded-lg">
                Active: {activeProduct.name}
              </div>
            )}
            <textarea
              value={productDesc}
              onChange={(e) => setProductDesc(e.target.value)}
              placeholder="Describe your product..."
              rows={4}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm resize-none focus:outline-none focus:border-[#6366F1]"
            />
          </div>
          <div>
            <Label className="text-neutral-300 mb-2 block text-sm">Objective</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                ['PURCHASE', 'Purchase'],
                ['TRAFFIC', 'Traffic'],
                ['AWARENESS', 'Awareness'],
              ].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setObjective(val)}
                  className={`py-2 rounded-lg text-xs font-medium transition-colors ${objective === val ? 'bg-[#6366F1] text-black' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-neutral-300 mb-2 block text-sm">Daily Budget (AUD)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">$</span>
              <Input
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                type="number"
                className="pl-7 bg-white border-gray-300 text-gray-900"
              />
            </div>
          </div>
          <Button
            onClick={generate}
            disabled={loading}
            className="w-full text-black font-semibold py-2.5"
            style={{ background: '#6366F1' }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Campaign
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-12 h-12 border-2 border-[#6366F1]/30 border-t-[#6366F1] rounded-full animate-spin mb-4" />
            <p className="text-white font-medium">Generating your ad campaign...</p>
            <p className="text-neutral-400 text-sm mt-1">Creating 3 unique creative variations</p>
          </div>
        )}
        {!loading && !campaign && (
          <div className="flex flex-col items-center gap-8 py-8 px-4 max-w-md mx-auto">
            {/* Explanation text */}
            <div className="text-center">
              <p className="font-semibold text-white mb-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                Preview: What your ad pack looks like
              </p>
              <p className="text-sm text-neutral-400">
                Fill in your product details to generate 5 variations like this.
              </p>
            </div>

            {/* Realistic Facebook Ad Preview Card */}
            <div
              className="w-full rounded-2xl overflow-hidden"
              style={{
                background: '#1c1e21',
                border: '1px solid #6366F1',
                boxShadow: '0 0 24px rgba(99,102,241,0.12)',
                maxWidth: 360,
              }}
            >
              {/* FB Post Header */}
              <div className="flex items-center gap-3 p-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0"
                  style={{ background: '#6366F1', color: '#000', fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  M
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white leading-tight">Your Brand</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-neutral-400">Sponsored</span>
                    <span className="text-neutral-600">·</span>
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="#1877f2">
                      <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm.93 9.412l-1 4.246a.999.999 0 0 1-1.916-.162l-.9-4.083H4a1 1 0 0 1 0-2h2c.435 0 .82.279.943.696l.468 1.686.916-3.893A1 1 0 0 1 9.29 5.5h2.2a1 1 0 0 1 0 2H9.93z"/>
                    </svg>
                  </div>
                </div>
                <div className="text-neutral-500 text-xl leading-none">···</div>
              </div>

              {/* Primary text */}
              <div className="px-4 pb-3">
                <p className="text-sm text-neutral-200 leading-relaxed">
                  Tired of paying too much? This{' '}
                  <span className="text-[#6366F1] font-semibold">limited-time deal</span> ships
                  free to Australia. Join 10,000+ happy customers. 🇦🇺
                </p>
              </div>

              {/* Product image placeholder */}
              <div
                className="w-full flex flex-col items-center justify-center gap-2"
                style={{
                  height: 180,
                  background: 'linear-gradient(135deg, #F3F4F6 0%, #16213e 50%, #0f3460 100%)',
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}
                >
                  <ImageIcon className="w-6 h-6 text-[#6366F1] opacity-60" />
                </div>
                <span className="text-xs text-neutral-500">AI-generated product image</span>
              </div>

              {/* Headline + CTA row */}
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ background: '#2d2f33', borderTop: '1px solid #F9FAFB' }}
              >
                <div className="flex-1 min-w-0 pr-3">
                  <div className="text-xs text-neutral-400 uppercase tracking-wide truncate">
                    majorka.com.au
                  </div>
                  <div
                    className="text-sm font-bold text-white leading-tight mt-0.5 truncate"
                    style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                  >
                    🔥 Buy 2 Get 1 Free — Today Only
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5 truncate">
                    Free AU shipping · Afterpay available
                  </div>
                </div>
                <button
                  className="flex-shrink-0 text-xs font-bold px-4 py-2 rounded-lg"
                  style={{
                    background: '#6366F1',
                    color: '#000',
                    cursor: 'default',
                    fontFamily: "'Bricolage Grotesque', sans-serif",
                  }}
                >
                  Shop Now
                </button>
              </div>

              {/* FB reactions bar */}
              <div
                className="flex items-center justify-between px-4 py-2 text-xs text-neutral-500"
                style={{ borderTop: '1px solid #F9FAFB' }}
              >
                <span>👍 ❤️ 😮 &nbsp; 2.4k</span>
                <span>148 comments · 312 shares</span>
              </div>
            </div>

            <p className="text-xs text-neutral-600 text-center">
              This is a sample preview. Your actual ad copy and image will be AI-generated from
              your product details.
            </p>
          </div>
        )}
        {campaign && (
          <div className="space-y-6 max-w-4xl">
            {note && (
              <div className="bg-yellow-900/20 border border-yellow-800/40 rounded-lg px-4 py-3 text-yellow-300 text-sm">
                {note}
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                className="border-neutral-700 text-neutral-300"
                onClick={() => {
                  navigator.clipboard.writeText(
                    campaign.ad_sets
                      .map(
                        (a) =>
                          `[${a.angle}]\nHook: ${a.hook}\nPrimary: ${a.primary_text}\nHeadline: ${a.headline}`
                      )
                      .join('\n\n')
                  );
                  toast.success('Copied!');
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy All Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-neutral-700 text-neutral-300"
                onClick={exportJSON}
              >
                <FileJson className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              {campaign.ad_sets?.map((ad, i) => (
                <AdCard key={i} ad={ad} />
              ))}
            </div>
            {campaign.video_script && (
              <div className="border border-neutral-800 rounded-xl">
                <button
                  onClick={() => setShowScript(!showScript)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="text-white font-semibold">15-Second Video Script</span>
                  {showScript ? (
                    <ChevronUp className="w-4 h-4 text-neutral-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-neutral-400" />
                  )}
                </button>
                {showScript && (
                  <div className="px-5 pb-5 space-y-3 border-t border-neutral-800 pt-4">
                    {[
                      ['0-3s Hook', campaign.video_script.hook_3s],
                      ['3-10s Body', campaign.video_script.body_7s],
                      ['10-15s CTA', campaign.video_script.cta_5s],
                      ['Caption', campaign.video_script.caption],
                    ].map(([label, val]) => (
                      <div key={label} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-neutral-500 uppercase">{label}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(val);
                              toast.success('Copied!');
                            }}
                            className="text-neutral-500 hover:text-white"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-neutral-200 text-sm">{val}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {campaign.targeting && (
              <div className="border border-neutral-800 rounded-xl p-5">
                <h3 className="text-white font-semibold mb-4">Targeting Suggestions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-neutral-400 text-xs uppercase mb-1">Age Range</p>
                    <p className="text-white">{campaign.targeting.age_range}</p>
                  </div>
                  <div>
                    <p className="text-neutral-400 text-xs uppercase mb-1">Interests</p>
                    <div className="flex flex-wrap gap-1">
                      {campaign.targeting.interests?.map((i) => (
                        <span
                          key={i}
                          className="text-xs bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full"
                        >
                          {i}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                {campaign.targeting.lookalike_note && (
                  <p className="mt-4 text-neutral-500 text-sm bg-gray-50 rounded-lg p-3">
                    💡 {campaign.targeting.lookalike_note}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
