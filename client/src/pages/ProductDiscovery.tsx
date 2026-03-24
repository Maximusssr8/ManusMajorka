import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  DollarSign,
  Loader2,
  Package,
  RefreshCw,
  Search,
  Star,
  TrendingUp,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ActiveProductBanner } from '@/components/ActiveProductBanner';
import { SaveToProduct } from '@/components/SaveToProduct';
import { ProductScoreCard } from '@/components/ProductScoreCard';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveProduct } from '@/hooks/useActiveProduct';
import { searchPhotos } from '@/lib/pexels';

interface ProductIdea {
  name: string;
  niche: string;
  problemSolved: string;
  targetAudience: string;
  estimatedMargin: string;
  competitionLevel: 'Low' | 'Medium' | 'High';
  trendDirection: 'Rising' | 'Stable' | 'Declining';
  avgPrice: string;
  whyNow: string;
  suppliers: string;
  score: number;
}

interface DiscoveryResult {
  summary: string;
  products: ProductIdea[];
  topPick: string;
  marketContext: string;
}

const SYSTEM_PROMPT = `You are an expert ecommerce product researcher specialising in finding winning dropshipping and private label products.
When given a niche/category, return a JSON object with this EXACT structure (no markdown, no explanation, just raw JSON):
{"summary":"Brief market overview","products":[{"name":"Product name","niche":"Sub-niche","problemSolved":"Problem it solves","targetAudience":"Who buys this","estimatedMargin":"e.g. 40-60%","competitionLevel":"Low|Medium|High","trendDirection":"Rising|Stable|Declining","avgPrice":"e.g. $29-49","whyNow":"Why this is a good opportunity right now","suppliers":"Where to source (AliExpress/Alibaba/etc)","score":85}],"topPick":"Name of the best product and why","marketContext":"Key market insight"}
Return exactly 5 product ideas. Score each from 0-100 based on opportunity. Return ONLY raw JSON.`;

function parseResult(text: string): DiscoveryResult | null {
  try {
    const stripped = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    const start = stripped.indexOf('{');
    const end = stripped.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    const parsed = JSON.parse(stripped.slice(start, end + 1));
    if (!parsed.products || !Array.isArray(parsed.products)) return null;
    return parsed as DiscoveryResult;
  } catch {
    return null;
  }
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success('Copied!');
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all flex-shrink-0"
      style={{
        background: copied ? '#D1FAE5' : '#F5F7FF',
        border: `1px solid ${copied ? '#A7F3D0' : '#E0E7FF'}`,
        color: copied ? '#065F46' : '#6366F1',
        cursor: 'pointer',
      }}
    >
      {copied ? <Check size={9} /> : <Copy size={9} />}
    </button>
  );
}

const COMPETITION_COLORS: Record<string, string> = {
  Low: '#6366F1',
  Medium: '#6366F1',
  High: '#e05c7a',
};
const TREND_ICONS: Record<string, string> = {
  Rising: '↑',
  Stable: '→',
  Declining: '↓',
};

function ProductCard({ product, index }: { product: ProductIdea; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);
  const [photos, setPhotos] = useState<string[]>([]);
  const { setProduct } = useActiveProduct();
  const cc = COMPETITION_COLORS[product.competitionLevel] || '#6366F1';

  useEffect(() => {
    searchPhotos(product.name, 3)
      .then((results) => {
        setPhotos(results.map((p) => p.src.medium));
      })
      .catch(() => {});
  }, [product.name]);
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left"
        style={{ cursor: 'pointer' }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-base flex-shrink-0"
          style={{
            background:
              product.score >= 75
                ? '#D1FAE5'
                : product.score >= 50
                  ? 'rgba(99,102,241,0.15)'
                  : 'rgba(224,92,122,0.15)',
            color: product.score >= 75 ? '#6366F1' : product.score >= 50 ? '#6366F1' : '#e05c7a',
            border: `1px solid ${product.score >= 75 ? '#6EE7B7' : product.score >= 50 ? '#C7D2FE' : '#FECACA'}`,
            fontFamily: "'Bricolage Grotesque', sans-serif",
          }}
        >
          {product.score}
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-sm font-black leading-tight"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#374151' }}
          >
            {product.name}
          </div>
          <div className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
            {product.niche} · {product.avgPrice}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: `${cc}18`, color: cc, border: `1px solid ${cc}33` }}
          >
            {product.competitionLevel}
          </span>
          <span
            className="text-xs font-bold"
            style={{
              color:
                product.trendDirection === 'Rising'
                  ? '#6366F1'
                  : product.trendDirection === 'Declining'
                    ? '#e05c7a'
                    : '#6366F1',
            }}
          >
            {TREND_ICONS[product.trendDirection]} {product.trendDirection}
          </span>
          {expanded ? (
            <ChevronUp size={13} style={{ color: '#9CA3AF' }} />
          ) : (
            <ChevronDown size={13} style={{ color: '#9CA3AF' }} />
          )}
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <div style={{ height: 1, background: '#E5E7EB' }} />
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <div
                className="text-xs font-bold uppercase tracking-wider mb-1"
                style={{ color: '#9CA3AF', fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                Problem Solved
              </div>
              <div className="text-xs leading-relaxed" style={{ color: '#4B5563' }}>
                {product.problemSolved}
              </div>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <div
                className="text-xs font-bold uppercase tracking-wider mb-1"
                style={{ color: '#9CA3AF', fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                Target Audience
              </div>
              <div className="text-xs leading-relaxed" style={{ color: '#4B5563' }}>
                {product.targetAudience}
              </div>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <div
                className="text-xs font-bold uppercase tracking-wider mb-1"
                style={{ color: '#9CA3AF', fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                Est. Margin
              </div>
              <div
                className="text-sm font-black"
                style={{ color: '#6366F1', fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                {product.estimatedMargin}
              </div>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <div
                className="text-xs font-bold uppercase tracking-wider mb-1"
                style={{ color: '#9CA3AF', fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                Suppliers
              </div>
              <div className="text-xs" style={{ color: '#4B5563' }}>
                {product.suppliers}
              </div>
            </div>
          </div>
          <div
            className="p-3 rounded-xl"
            style={{
              background: 'rgba(99,102,241,0.04)',
              border: '1px solid rgba(99,102,241,0.12)',
            }}
          >
            <div
              className="text-xs font-bold uppercase tracking-wider mb-1"
              style={{ color: '#6366F1', fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Why Now
            </div>
            <div className="text-xs leading-relaxed" style={{ color: '#4B5563' }}>
              {product.whyNow}
            </div>
          </div>
          {photos.length > 0 && (
            <div className="flex gap-2">
              {photos.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={product.name}
                  className="w-24 h-16 object-cover rounded-lg flex-shrink-0"
                  style={{ border: '1px solid #E5E7EB' }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              ))}
            </div>
          )}
          <div
            className="flex gap-2 pt-2 mt-1"
            style={{ borderTop: '1px solid #E5E7EB' }}
          >
            <button
              onClick={() => {
                setProduct({
                  name: product.name,
                  niche: product.niche,
                  summary: `Product: ${product.name}\nNiche: ${product.niche}\nProblem: ${product.problemSolved}\nTarget: ${product.targetAudience}\nMargin: ${product.estimatedMargin}\nPrice: ${product.avgPrice}\nCompetition: ${product.competitionLevel}\nTrend: ${product.trendDirection}\nWhy Now: ${product.whyNow}\nSuppliers: ${product.suppliers}\nScore: ${product.score}/100`,
                  source: 'research',
                  savedAt: Date.now(),
                });
                toast.success(`${product.name} set as active product`);
              }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold"
              style={{
                background: '#EEF2FF',
                border: '1px solid #C7D2FE',
                color: '#6366F1',
                cursor: 'pointer',
              }}
            >
              ★ Set Active
            </button>
            <button
              onClick={() => {
                localStorage.setItem(
                  'majorka_validate_prefill',
                  `${product.name} — ${product.niche}. Target: ${product.targetAudience}. Price: ${product.avgPrice}. ${product.problemSolved}`
                );
                window.location.href = '/app/validation-plan';
              }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold"
              style={{
                background: 'rgba(124,106,245,0.1)',
                border: '1px solid rgba(124,106,245,0.25)',
                color: '#7c6af5',
                cursor: 'pointer',
              }}
            >
              → Validate This
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const EXAMPLE_NICHES = [
  'Pet accessories',
  'Home gym equipment',
  'Eco-friendly kitchen',
  'Baby & toddler',
  'Outdoor & camping',
];

const getSystemPrompt = (
  basePrompt: string,
  activeProduct: ReturnType<typeof useActiveProduct>['activeProduct']
) => {
  if (!activeProduct) return basePrompt;
  return (
    basePrompt +
    `\n\nACTIVE PRODUCT CONTEXT:\n- Product: ${activeProduct.name}${activeProduct.niche ? '\n- Niche: ' + activeProduct.niche : ''}${activeProduct.summary ? '\n- Summary: ' + activeProduct.summary : ''}\n\nAll advice and output must be specifically tailored to this product. Reference it by name.`
  );
};

export default function ProductDiscovery() {
  const [niche, setNiche] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [targetMarket, setTargetMarket] = useState('Australia');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [genError, setGenError] = useState('');
  const { activeProduct } = useActiveProduct();
  const { session } = useAuth();

  // Load any prefill from WinningProducts "Find Suppliers →" CTA
  useEffect(() => {
    const prefill = localStorage.getItem('majorka_discover_prefill');
    if (prefill) {
      setNiche(prefill);
      localStorage.removeItem('majorka_discover_prefill');
    }
  }, []);

  const handleGenerate = useCallback(async (nicheOverride?: string) => {
    const activeNiche = nicheOverride ?? niche;
    if (!activeNiche.trim()) {
      toast.error('Please enter a niche or category');
      return;
    }
    if (nicheOverride) setNiche(nicheOverride);
    setGenerating(true);
    setGenError('');
    setResult(null);

    const prompt = [
      `Niche/Category: ${activeNiche}`,
      priceRange && `Price Range: $${priceRange}`,
      `Target Market: ${targetMarket}`,
    ]
      .filter(Boolean)
      .join('\n');

    const searchQuery = `${activeNiche} trending products ${targetMarket} 2025 ecommerce dropshipping opportunity`;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          systemPrompt: getSystemPrompt(SYSTEM_PROMPT, activeProduct),
          searchQuery,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${response.status}`);
      }

      const resData = await response.json();
      const fullText = resData.reply ?? '';

      if (!fullText.trim()) {
        setGenError('No response received. Please try again.');
      } else {
        const parsed = parseResult(fullText);
        if (parsed) {
          setResult(parsed);
          localStorage.setItem('majorka_milestone_research', 'true');
        } else {
          setGenError('Could not parse results. Please try again.');
        }
      }
    } catch (err: any) {
      console.error('ProductDiscovery error:', err);
      setGenError(err.message || 'Failed to generate. Please try again.');
    } finally {
      setGenerating(false);
    }
  }, [niche, priceRange, targetMarket]);

  const isLoading = generating;

  return (
    <div
      className="h-full flex flex-col"
      style={{ background: '#FAFAFA', color: '#0A0A0A', fontFamily: 'DM Sans, sans-serif' }}
    >
      {/* Top bar */}
      <div
        className="flex items-center gap-3 px-5 py-3 border-b flex-shrink-0"
        style={{ borderColor: '#E5E7EB', background: 'white' }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: '#EEF2FF', border: '1px solid #C7D2FE' }}
        >
          <Search size={15} style={{ color: '#6366F1' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-sm font-black leading-tight"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Product Discovery
          </div>
          <div className="text-xs" style={{ color: '#9CA3AF' }}>
            AI-powered product research · Real-time market data · Opportunity scoring
          </div>
        </div>
        {result && (
          <button
            onClick={() => {
              setResult(null);
              setGenError('');
            }}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0"
            style={{
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              color: '#6B7280',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={11} /> New Search
          </button>
        )}
      </div>

      <ActiveProductBanner
        ctaLabel="Load into tool"
        onUseProduct={(summary) => setNiche(summary)}
      />

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* LEFT: Input panel */}
        <div
          className="w-full lg:w-72 flex-shrink-0 overflow-y-auto border-b lg:border-b-0 lg:border-r p-4 space-y-4"
          style={{ borderColor: '#E5E7EB' }}
        >
          <div>
            <div
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: '#9CA3AF', fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Research Parameters
            </div>
            <div className="space-y-3">
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5"
                  style={{ color: '#374151', fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  Niche / Category *
                </label>
                <input
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                  placeholder="e.g. Pet accessories, Home gym…"
                  className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                  style={{
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    color: '#374151',
                  }}
                />
              </div>
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5"
                  style={{ color: '#374151', fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  Price Range (AUD)
                </label>
                <input
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  placeholder="e.g. 20-80"
                  className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                  style={{
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    color: '#374151',
                  }}
                />
              </div>
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5"
                  style={{ color: '#374151', fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  Target Market
                </label>
                <select
                  value={targetMarket}
                  onChange={(e) => setTargetMarket(e.target.value)}
                  className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                  style={{
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    color: '#374151',
                  }}
                >
                  {['Australia', 'United States', 'United Kingdom', 'Canada', 'Global'].map((m) => (
                    <option key={m} value={m} style={{ background: 'white' }}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Example chips */}
          <div>
            <div
              className="text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: '#9CA3AF', fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Quick Start
            </div>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLE_NICHES.map((n) => (
                <button
                  key={n}
                  onClick={() => handleGenerate(n)}
                  className="text-xs px-2.5 py-1 rounded-lg transition-all"
                  style={{
                    background: niche === n ? '#EEF2FF' : '#F5F7FF',
                    border: `1px solid ${niche === n ? '#C7D2FE' : '#E5E7EB'}`,
                    color: niche === n ? '#6366F1' : '#6B7280',
                    cursor: 'pointer',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => handleGenerate()}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm transition-all"
            style={{
              background: isLoading ? '#C7D2FE' : '#6366F1',
              color: 'white',
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Researching…
              </>
            ) : (
              <>
                <Search size={14} /> Discover Products
              </>
            )}
          </button>

          {genError && (
            <div
              className="text-xs p-3 rounded-xl"
              style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#DC2626',
              }}
            >
              {genError}
            </div>
          )}
        </div>

        {/* RIGHT: Output panel */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading && !result && (
            <div className="space-y-4 animate-fade-in p-4 max-w-3xl">
              <div className="text-sm font-black mb-2" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                Researching {niche}…
              </div>
              <div className="skeleton-shimmer h-16 w-full rounded-2xl" />
              <div className="skeleton-shimmer h-20 w-full rounded-2xl" />
              <div className="skeleton-shimmer h-40 w-full rounded-2xl" />
              <div className="skeleton-shimmer h-40 w-full rounded-2xl" />
              <div className="skeleton-shimmer h-40 w-full rounded-2xl" />
            </div>
          )}

          {result && (
            <div className="space-y-4 max-w-3xl">
              {/* Summary */}
              <div
                className="p-4 rounded-2xl"
                style={{
                  background: '#F8F8FF',
                  border: '1px solid #E0E7FF',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: '#6366F1', fontFamily: "'Bricolage Grotesque', sans-serif" }}
                  >
                    Market Overview
                  </div>
                  <CopyBtn text={result.summary} />
                </div>
                <div className="text-sm leading-relaxed" style={{ color: '#374151' }}>
                  {result.summary}
                </div>
              </div>

              {/* Top pick highlight */}
              <div
                className="p-4 rounded-2xl"
                style={{
                  background: 'rgba(99,102,241,0.06)',
                  border: '1px solid rgba(99,102,241,0.2)',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Star size={12} style={{ color: '#6366F1' }} />
                  <div
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: '#6366F1', fontFamily: "'Bricolage Grotesque', sans-serif" }}
                  >
                    Top Pick
                  </div>
                </div>
                <div className="text-sm leading-relaxed" style={{ color: '#374151' }}>
                  {result.topPick}
                </div>
              </div>

              {/* AI Score Card for top product */}
              <ProductScoreCard response={`${result.topPick}\n${result.summary}\n${result.products.map(p => `${p.name}: margin ${p.estimatedMargin}, competition ${p.competitionLevel}, score ${p.score}`).join('\n')}`} />

              {/* Product cards */}
              <div>
                <div
                  className="text-xs font-bold uppercase tracking-widest mb-3"
                  style={{ color: '#9CA3AF', fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  {result.products.length} Product Opportunities
                </div>
                <div className="space-y-3">
                  {result.products.map((p, i) => (
                    <ProductCard key={i} product={p} index={i} />
                  ))}
                </div>
              </div>

              {/* Market context */}
              {result.marketContext && (
                <div
                  className="p-4 rounded-2xl"
                  style={{
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                  }}
                >
                  <div
                    className="text-xs font-bold uppercase tracking-widest mb-2"
                    style={{ color: '#9CA3AF', fontFamily: "'Bricolage Grotesque', sans-serif" }}
                  >
                    Market Context
                  </div>
                  <div
                    className="text-xs leading-relaxed"
                    style={{ color: '#374151' }}
                  >
                    {result.marketContext}
                  </div>
                </div>
              )}
            </div>
          )}

          {!isLoading && !result && (
            <div className="h-full flex flex-col items-center justify-center gap-5 p-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: '#EEF2FF',
                  border: '1px solid #C7D2FE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Search size={24} style={{ color: '#6366F1' }} />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="text-center"
              >
                <div
                  className="text-base font-black mb-2"
                  style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  Find your next winning product
                </div>
                <div
                  className="text-xs max-w-xs leading-relaxed"
                  style={{ color: '#9CA3AF' }}
                >
                  Click a quick-start chip or enter a niche to get 5 scored product opportunities
                  with margin estimates, competition analysis, and supplier leads.
                </div>
              </motion.div>
              <div className="grid grid-cols-2 gap-3 max-w-sm w-full">
                {[
                  { icon: <TrendingUp size={14} />, label: 'AU trend analysis' },
                  { icon: <DollarSign size={14} />, label: 'Margin estimates' },
                  { icon: <Package size={14} />, label: 'Supplier leads' },
                  { icon: <Star size={14} />, label: 'Opportunity score' },
                ].map(({ icon, label }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.35 }}
                    className="flex items-center gap-2 p-3 rounded-xl"
                    style={{
                      background: '#F9FAFB',
                      border: '1px solid #E5E7EB',
                    }}
                  >
                    <span style={{ color: '#6366F1' }}>{icon}</span>
                    <span className="text-xs" style={{ color: '#6B7280' }}>
                      {label}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
