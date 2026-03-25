import { useIsMobile } from '@/hooks/useIsMobile';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  Loader2,
  Megaphone,
  Package,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { useActiveProduct } from '@/hooks/useActiveProduct';

// ── Types ────────────────────────────────────────────────────────────────────

interface Ad {
  platform: 'Facebook' | 'TikTok' | 'Instagram';
  hook: string;
  bodyText: string;
  cta: string;
  angle: 'Pain Point' | 'Curiosity' | 'Social Proof' | 'Benefit' | 'Scarcity';
  whyItWorks: string;
  targetAudience: string;
}

interface AdsResult {
  ads: Ad[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const AD_SPY_SYSTEM_PROMPT = `You are an ad intelligence researcher. When given a product niche, find and describe winning ads from Facebook, TikTok, and Instagram.

For each ad found (return 6 total, 2 per platform), provide this JSON:
{
  "ads": [
    {
      "platform": "Facebook|TikTok|Instagram",
      "hook": "First line or hook of the ad",
      "bodyText": "Main ad copy (2-3 sentences)",
      "cta": "CTA button text",
      "angle": "Pain Point|Curiosity|Social Proof|Benefit|Scarcity",
      "whyItWorks": "Brief explanation of why this ad format works",
      "targetAudience": "Who this ad targets"
    }
  ]
}
Return ONLY valid JSON.`;

const PLATFORM_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> =
  {
    Facebook: {
      bg: 'rgba(24,119,242,0.12)',
      text: '#1877f2',
      border: 'rgba(24,119,242,0.3)',
      label: 'Facebook',
    },
    TikTok: {
      bg: 'rgba(255,0,80,0.1)',
      text: '#ff0050',
      border: 'rgba(255,0,80,0.3)',
      label: 'TikTok',
    },
    Instagram: {
      bg: 'rgba(193,53,132,0.12)',
      text: '#c13584',
      border: 'rgba(193,53,132,0.3)',
      label: 'Instagram',
    },
  };

const ANGLE_COLORS: Record<string, string> = {
  'Pain Point': '#ef4444',
  Curiosity: '#8b5cf6',
  'Social Proof': '#10b981',
  Benefit: '#f59e0b',
  Scarcity: '#f97316',
};

// ── Utilities ─────────────────────────────────────────────────────────────────

function parseAds(text: string): AdsResult | null {
  try {
    const stripped = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    const start = stripped.indexOf('{');
    const end = stripped.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    const parsed = JSON.parse(stripped.slice(start, end + 1));
    if (!parsed.ads || !Array.isArray(parsed.ads)) return null;
    return parsed as AdsResult;
  } catch {
    return null;
  }
}

// ── Shimmer skeleton ──────────────────────────────────────────────────────────

function ShimmerCard() {
  return (
    <div
      className="rounded-2xl p-5 space-y-3"
      style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-16 h-5 rounded-full animate-pulse"
          style={{ background: '#F5F5F5' }}
        />
        <div
          className="w-20 h-5 rounded-full animate-pulse"
          style={{ background: '#F5F5F5' }}
        />
      </div>
      <div
        className="w-full h-5 rounded animate-pulse"
        style={{ background: '#F9FAFB' }}
      />
      <div
        className="w-5/6 h-5 rounded animate-pulse"
        style={{ background: '#F9FAFB' }}
      />
      <div
        className="w-3/4 h-4 rounded animate-pulse"
        style={{ background: '#F9FAFB' }}
      />
      <div
        className="w-3/4 h-4 rounded animate-pulse"
        style={{ background: '#F9FAFB' }}
      />
      <div className="flex gap-2 mt-2">
        <div
          className="flex-1 h-8 rounded-lg animate-pulse"
          style={{ background: '#F9FAFB' }}
        />
        <div
          className="flex-1 h-8 rounded-lg animate-pulse"
          style={{ background: '#F9FAFB' }}
        />
      </div>
    </div>
  );
}

// ── Ad Card ───────────────────────────────────────────────────────────────────

function AdCard({
  ad,
  searchInput,
  activeProductName,
}: {
  ad: Ad;
  searchInput: string;
  activeProductName?: string;
}) {
  const isMobile = useIsMobile();
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [, navigate] = useLocation();

  const platform = PLATFORM_STYLES[ad.platform] ?? PLATFORM_STYLES.Facebook;
  const angleColor = ANGLE_COLORS[ad.angle] ?? '#f59e0b';

  const handleCopy = () => {
    const text = `Hook: ${ad.hook}\n\n${ad.bodyText}\n\nCTA: ${ad.cta}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Ad copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAnalyse = () => {
    const productRef = activeProductName ?? searchInput;
    const prefilledPrompt = `Here's a winning ad I found for ${searchInput}. Help me write a better version for my specific product: ${productRef}. Original ad: ${ad.hook} | ${ad.bodyText} | CTA: ${ad.cta}`;
    // Store the prompt in sessionStorage so AIChat can pick it up
    sessionStorage.setItem('majorka_prefill_chat', prefilledPrompt);
    navigate('/app/ai-chat');
  };

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}
    >
      <div className="p-5 flex-1 space-y-3">
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{
              background: platform.bg,
              color: platform.text,
              border: `1px solid ${platform.border}`,
            }}
          >
            {platform.label}
          </span>
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{
              background: angleColor + '18',
              color: angleColor,
              border: `1px solid ${angleColor}33`,
            }}
          >
            {ad.angle}
          </span>
        </div>

        {/* Hook */}
        <p
          className="text-sm font-extrabold leading-snug"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#374151' }}
        >
          {ad.hook}
        </p>

        {/* Body */}
        <p className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>
          {ad.bodyText}
        </p>

        {/* CTA */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs" style={{ color: '#9CA3AF' }}>
            CTA:
          </span>
          <span
            className="text-xs font-bold px-2.5 py-0.5 rounded-lg"
            style={{
              background: 'rgba(99,102,241,0.1)',
              color: '#6366F1',
              border: '1px solid rgba(99,102,241,0.25)',
            }}
          >
            {ad.cta}
          </span>
        </div>

        {/* Audience */}
        <div className="text-xs" style={{ color: '#6B7280' }}>
          <span className="font-semibold" style={{ color: '#374151' }}>
            Targets:{' '}
          </span>
          {ad.targetAudience}
        </div>

        {/* Why it works (collapsible) */}
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-xs font-semibold transition-all"
            style={{
              color: '#9CA3AF',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: 0,
            }}
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Why it works
          </button>
          {expanded && (
            <div
              className="mt-2 p-3 rounded-xl text-xs leading-relaxed"
              style={{
                background: '#FAFAFA',
                color: '#374151',
                border: '1px solid #F9FAFB',
              }}
            >
              {ad.whyItWorks}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 pb-5 flex gap-2">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all"
          style={{
            background: copied ? '#EEF2FF' : '#F9FAFB',
            border: `1px solid ${copied ? '#C7D2FE' : '#F5F5F5'}`,
            color: copied ? '#6366F1' : '#6B7280',
            cursor: 'pointer',
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy Ad'}
        </button>
        <button
          onClick={handleAnalyse}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all"
          style={{
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.25)',
            color: '#6366F1',
            cursor: 'pointer',
          }}
        >
          <Eye size={12} />
          Analyse &amp; Improve
        </button>
      </div>
    </div>
  );
}

// ── Main Content ───────────────────────────────────────────────────────────────

function AdSpyContent() {
  const { activeProduct } = useActiveProduct();
  const [searchInput, setSearchInput] = useState('');
  const [result, setResult] = useState<AdsResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  
  const [lastSearchInput, setLastSearchInput] = useState('');

  // Pre-fill from active product if nothing typed
  useEffect(() => {
    if (activeProduct && !searchInput) {
      setSearchInput(activeProduct.name + (activeProduct.niche ? ' ' + activeProduct.niche : ''));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProduct]);


  const doSearch = async (query: string) => {
    if (!query.trim()) return;
    setGenerating(true);
    setGenError('');
    setResult(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000); // 25s timeout
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          stream: false,
          messages: [{ role: 'user', content: `Find winning ads for: ${query}` }],
          systemPrompt: AD_SPY_SYSTEM_PROMPT,
        }),
      });
      clearTimeout(timeout);
      if (!res.ok) {
        setGenError(`Search failed (${res.status}). Please try again.`);
        return;
      }
      const data = await res.json();
      const text = data.response || data.message || data.content || '';
      const parsed = parseAds(text);
      if (parsed) {
        setResult(parsed);
      } else {
        setGenError('No results found for that keyword. Try a different niche or product type.');
      }
    } catch (err: any) {
      clearTimeout(timeout);
      if (err?.name === 'AbortError') {
        setGenError('Search timed out. The AI took too long — please try a shorter keyword.');
      } else {
        setGenError('Network error. Please check your connection and try again.');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleSearch = useCallback(async () => {
    if (!searchInput.trim()) {
      toast.error('Enter a niche or keyword first');
      return;
    }
    setLastSearchInput(searchInput.trim());
    void doSearch(searchInput.trim());
  }, [searchInput]);

  const isLoading = generating;

  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{ background: '#FAFAFA', color: '#0A0A0A', fontFamily: 'DM Sans, sans-serif' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-3 border-b flex-shrink-0"
        style={{ borderColor: '#E5E7EB', background: 'white' }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}
        >
          <Megaphone size={15} style={{ color: '#f59e0b' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-sm font-extrabold leading-tight"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Ad Spy
          </div>
          <div className="text-xs" style={{ color: '#9CA3AF' }}>
            Find winning ads in your niche
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
              border: '1px solid #F5F5F5',
              color: '#6B7280',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={11} /> New Search
          </button>
        )}
      </div>

      {/* Active Product Banner */}
      {activeProduct && (
        <div
          className="flex items-center gap-3 mx-5 mt-3 px-4 py-2.5 rounded-lg flex-shrink-0"
          style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.18)' }}
        >
          <Package size={13} style={{ color: '#6366F1' }} />
          <span className="text-xs flex-1" style={{ color: '#374151' }}>
            Using:{' '}
            <span className="font-bold" style={{ color: '#374151' }}>
              {activeProduct.name}
            </span>
          </span>
          <button
            onClick={() =>
              setSearchInput(
                activeProduct.name + (activeProduct.niche ? ' ' + activeProduct.niche : '')
              )
            }
            className="text-xs font-bold px-2.5 py-1 rounded-lg transition-all"
            style={{
              background: 'rgba(99,102,241,0.12)',
              color: '#6366F1',
              border: '1px solid rgba(99,102,241,0.28)',
              cursor: 'pointer',
            }}
          >
            Pre-fill
          </button>
        </div>
      )}

      {/* Search bar */}
      <div className="px-5 pt-4 pb-4 flex-shrink-0">
        <div className="flex gap-2">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
            placeholder="Enter product niche or keyword (e.g. 'yoga pants', 'LED lights')..."
            className="flex-1 text-sm px-4 py-3 rounded-xl outline-none"
            style={{
              background: '#F9FAFB',
              border: '1px solid #F0F0F0',
              color: '#374151',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'rgba(245,158,11,0.45)')}
            onBlur={(e) => (e.target.style.borderColor = '#F0F0F0')}
          />
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-extrabold transition-all disabled:opacity-60"
            style={{
              background: isLoading
                ? 'rgba(245,158,11,0.25)'
                : 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: isLoading ? '#6B7280' : '#FAFAFA',
              fontFamily: "'Bricolage Grotesque', sans-serif",
              cursor: isLoading ? 'not-allowed' : 'pointer',
              border: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Searching…
              </>
            ) : (
              <>
                <Search size={15} /> Search Ads
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {/* Loading skeletons */}
        {isLoading && !result && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <ShimmerCard key={i} />
            ))}
          </div>
        )}

        {/* Error state */}
        {genError && !isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div
              className="p-4 rounded-xl text-sm text-center max-w-sm"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#ef4444',
              }}
            >
              {genError}
            </div>
            <button
              onClick={handleSearch}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold"
              style={{
                background: '#F9FAFB',
                border: '1px solid #F0F0F0',
                color: '#374151',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={13} /> Try Again
            </button>
          </div>
        )}

        {/* Results */}
        {result && !isLoading && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: '#9CA3AF', fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                {result.ads.length} Winning Ads Found — "{lastSearchInput}"
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {result.ads.map((ad, i) => (
                <AdCard
                  key={i}
                  ad={ad}
                  searchInput={lastSearchInput}
                  activeProductName={activeProduct?.name}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !result && !genError && (
          <div className="flex flex-col items-center justify-center py-24 gap-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.18)',
              }}
            >
              <Megaphone size={28} style={{ color: '#f59e0b', opacity: 0.6 }} />
            </div>
            <div className="text-center">
              <div className="text-base font-extrabold mb-2" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                Spy on winning ads
              </div>
              <div
                className="text-xs max-w-xs leading-relaxed"
                style={{ color: '#9CA3AF' }}
              >
                Enter a product niche or keyword above to discover high-performing ads from
                Facebook, TikTok, and Instagram.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

export default function AdSpy() {
  return <AdSpyContent />;
}
