import { Check, ChevronDown, ChevronUp, Copy, Loader2, RefreshCw, Target } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ActiveProductBanner } from '@/components/ActiveProductBanner';
import { SaveToProduct } from '@/components/SaveToProduct';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveProduct } from '@/hooks/useActiveProduct';

interface Competitor {
  name: string;
  url: string;
  priceRange: string;
  strengths: string[];
  weaknesses: string[];
  targetAudience: string;
  marketingChannels: string[];
  estimatedMonthlyRevenue: string;
  threatLevel: 'Low' | 'Medium' | 'High';
  keyDifferentiator: string;
}

interface BreakdownResult {
  marketSummary: string;
  competitors: Competitor[];
  opportunityGaps: string[];
  entryStrategy: string;
  pricingIntel: string;
}

const SYSTEM_PROMPT = `You are an expert ecommerce competitive intelligence analyst.
When given a product/niche and any competitor data, return a JSON object with this EXACT structure (no markdown, just raw JSON):
{"marketSummary":"Overview of competitive landscape","competitors":[{"name":"Brand name","url":"website url or N/A","priceRange":"e.g. $29-99","strengths":["strength 1","strength 2","strength 3"],"weaknesses":["weakness 1","weakness 2","weakness 3"],"targetAudience":"Who they target","marketingChannels":["Facebook Ads","Instagram","etc"],"estimatedMonthlyRevenue":"e.g. $50K-200K","threatLevel":"Low|Medium|High","keyDifferentiator":"What makes them unique"}],"opportunityGaps":["Gap 1","Gap 2","Gap 3","Gap 4"],"entryStrategy":"How to enter this market and win","pricingIntel":"Pricing strategy insights and recommendations"}
Return 3-5 competitors. Return ONLY raw JSON.`;

function parseResult(text: string): BreakdownResult | null {
  try {
    const stripped = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    const start = stripped.indexOf('{');
    const end = stripped.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    const parsed = JSON.parse(stripped.slice(start, end + 1));
    if (!parsed.competitors || !Array.isArray(parsed.competitors)) return null;
    return parsed as BreakdownResult;
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
        background: copied ? '#EEF2FF' : '#F9FAFB',
        border: `1px solid ${copied ? '#C7D2FE' : '#E5E7EB'}`,
        color: copied ? 'rgba(99,102,241,1.00)' : '#9CA3AF',
        cursor: 'pointer',
      }}
    >
      {copied ? <Check size={9} /> : <Copy size={9} />}
    </button>
  );
}

const THREAT_COLORS: Record<string, string> = {
  Low: '#6366F1',
  Medium: '#6366F1',
  High: '#e05c7a',
};

function CompetitorCard({ competitor, index }: { competitor: Competitor; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);
  const tc = THREAT_COLORS[competitor.threatLevel] || '#6366F1';
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left"
        style={{ cursor: 'pointer' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
          style={{
            background: 'rgba(156,95,255,0.12)',
            color: '#9c5fff',
            fontFamily: "'Bricolage Grotesque', sans-serif",
          }}
        >
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-sm font-black leading-tight"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#0A0A0A' }}
          >
            {competitor.name}
          </div>
          <div className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
            {competitor.priceRange} · {competitor.estimatedMonthlyRevenue}/mo
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: `${tc}18`, color: tc, border: `1px solid ${tc}33` }}
          >
            {competitor.threatLevel} Threat
          </span>
          {expanded ? (
            <ChevronUp size={13} style={{ color: '#D1D5DB' }} />
          ) : (
            <ChevronDown size={13} style={{ color: '#D1D5DB' }} />
          )}
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <div style={{ height: 1, background: '#F0F0F0' }} />
          <div className="grid grid-cols-2 gap-3">
            <div
              className="p-3 rounded-xl"
              style={{
                background: 'rgba(99,102,241,0.06)',
                border: '1px solid #EEF2FF',
              }}
            >
              <div
                className="text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color: '#6366F1', fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                Strengths
              </div>
              <div className="space-y-1">
                {competitor.strengths.map((s, i) => (
                  <div
                    key={i}
                    className="text-xs flex items-start gap-1.5"
                    style={{ color: '#374151' }}
                  >
                    <span style={{ color: '#6366F1', flexShrink: 0 }}>+</span>
                    {s}
                  </div>
                ))}
              </div>
            </div>
            <div
              className="p-3 rounded-xl"
              style={{
                background: 'rgba(224,92,122,0.04)',
                border: '1px solid rgba(224,92,122,0.1)',
              }}
            >
              <div
                className="text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color: '#e05c7a', fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                Weaknesses
              </div>
              <div className="space-y-1">
                {competitor.weaknesses.map((w, i) => (
                  <div
                    key={i}
                    className="text-xs flex items-start gap-1.5"
                    style={{ color: '#374151' }}
                  >
                    <span style={{ color: '#e05c7a', flexShrink: 0 }}>−</span>
                    {w}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl" style={{ background: '#F9FAFB' }}>
              <div
                className="text-xs font-bold uppercase tracking-wider mb-1"
                style={{ color: '#9CA3AF', fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                Target Audience
              </div>
              <div className="text-xs" style={{ color: '#374151' }}>
                {competitor.targetAudience}
              </div>
            </div>
            <div className="p-3 rounded-xl" style={{ background: '#F9FAFB' }}>
              <div
                className="text-xs font-bold uppercase tracking-wider mb-1"
                style={{ color: '#9CA3AF', fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                Marketing Channels
              </div>
              <div className="flex flex-wrap gap-1">
                {competitor.marketingChannels.map((ch, i) => (
                  <span
                    key={i}
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(156,95,255,0.1)', color: 'rgba(156,95,255,0.8)' }}
                  >
                    {ch}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div
            className="p-3 rounded-xl"
            style={{
              background: 'rgba(99,102,241,0.04)',
              border: '1px solid rgba(99,102,241,0.1)',
            }}
          >
            <div
              className="text-xs font-bold uppercase tracking-wider mb-1"
              style={{ color: '#6366F1', fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Key Differentiator
            </div>
            <div className="text-xs" style={{ color: '#374151' }}>
              {competitor.keyDifferentiator}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CompetitorBreakdown() {
  const [product, setProduct] = useState('');
  const [competitorUrls, setCompetitorUrls] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<BreakdownResult | null>(null);
  const [genError, setGenError] = useState('');
  const { activeProduct } = useActiveProduct();
  const { session } = useAuth();

  useEffect(() => {
    if (activeProduct && !product) {
      setProduct(activeProduct.name);
    }
  }, [activeProduct]);

  const getSystemPrompt = (basePrompt: string) => {
    if (!activeProduct) return basePrompt;
    return (
      basePrompt +
      `\n\nACTIVE PRODUCT CONTEXT:\n- Product: ${activeProduct.name}${activeProduct.niche ? '\n- Niche: ' + activeProduct.niche : ''}${activeProduct.summary ? '\n- Summary: ' + activeProduct.summary : ''}\n\nAll advice and output must be specifically tailored to this product. Reference it by name.`
    );
  };

  const handleGenerate = useCallback(async () => {
    if (!product.trim()) {
      toast.error('Please enter a product or niche');
      return;
    }
    setGenerating(true);
    setGenError('');
    setResult(null);

    const searchQuery = `${product} competitors brands ecommerce Australia 2025`;
    const prompt = [
      `Product/Niche: ${product}`,
      competitorUrls && `Competitor URLs to analyse: ${competitorUrls}`,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          systemPrompt: getSystemPrompt(SYSTEM_PROMPT),
          searchQuery,
        }),
      });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();
      const text = data.reply ?? '';
      const parsed = parseResult(text);
      if (parsed) setResult(parsed);
      else setGenError('Could not parse results. Please try again.');
    } catch (err: any) {
      setGenError(err.message || 'Failed to generate. Please try again.');
    } finally {
      setGenerating(false);
    }
  }, [product, competitorUrls, activeProduct]);

  const isLoading = generating;

  return (
    <div
      className="h-full flex flex-col"
      style={{ background: '#FAFAFA', color: '#0A0A0A', fontFamily: 'DM Sans, sans-serif' }}
    >
      <div
        className="flex items-center gap-3 px-5 py-3 border-b flex-shrink-0"
        style={{ borderColor: '#E5E7EB', background: 'white' }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(156,95,255,0.15)', border: '1px solid rgba(156,95,255,0.3)' }}
        >
          <Target size={15} style={{ color: '#9c5fff' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-sm font-black leading-tight"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Competitor Breakdown
          </div>
          <div className="text-xs" style={{ color: '#9CA3AF' }}>
            Deep competitive intelligence · Opportunity gaps · Entry strategy
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
            <RefreshCw size={11} /> New Analysis
          </button>
        )}
      </div>

      <ActiveProductBanner
        ctaLabel="Load into tool"
        onUseProduct={(summary) => setProduct(summary)}
      />

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        <div
          className="w-full lg:w-72 flex-shrink-0 overflow-y-auto border-b lg:border-b-0 lg:border-r p-4 space-y-4"
          style={{ borderColor: '#E5E7EB' }}
        >
          <div className="space-y-3">
            <div>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: '#6B7280', fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                Product / Niche *
              </label>
              <input
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
                placeholder="e.g. Posture corrector, Yoga mats…"
                className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                style={{
                  background: '#F9FAFB',
                  border: '1px solid #F0F0F0',
                  color: '#0A0A0A',
                }}
              />
            </div>
            <div>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: '#6B7280', fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                Competitor URLs (optional)
              </label>
              <textarea
                value={competitorUrls}
                onChange={(e) => setCompetitorUrls(e.target.value)}
                placeholder="Paste competitor URLs, one per line…"
                rows={4}
                className="w-full text-sm px-3 py-2.5 rounded-xl outline-none resize-none"
                style={{
                  background: '#F9FAFB',
                  border: '1px solid #F0F0F0',
                  color: '#0A0A0A',
                }}
              />
              <div className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                We'll scrape and analyse these pages
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm transition-all"
            style={{
              background: isLoading ? 'rgba(156,95,255,0.25)' : '#9c5fff',
              color: '#fff',
              fontFamily: "'Bricolage Grotesque', sans-serif",
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Analysing…
              </>
            ) : (
              <>
                <Target size={14} /> Analyse Competitors
              </>
            )}
          </button>

          {genError && (
            <div
              className="text-xs p-3 rounded-xl"
              style={{
                background: 'rgba(224,92,122,0.1)',
                border: '1px solid rgba(224,92,122,0.25)',
                color: 'rgba(224,92,122,0.9)',
              }}
            >
              {genError}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {isLoading && !result && (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'rgba(156,95,255,0.1)',
                  border: '1px solid rgba(156,95,255,0.2)',
                }}
              >
                <Target size={24} style={{ color: '#9c5fff' }} className="animate-pulse" />
              </div>
              <div className="text-center">
                <div className="text-sm font-black mb-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                  Analysing competitors…
                </div>
                <div className="text-xs" style={{ color: '#9CA3AF' }}>
                  Scanning market data and competitor profiles
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4 max-w-3xl">
              <div
                className="p-4 rounded-2xl"
                style={{
                  background: 'rgba(156,95,255,0.05)',
                  border: '1px solid rgba(156,95,255,0.15)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: '#9c5fff', fontFamily: "'Bricolage Grotesque', sans-serif" }}
                  >
                    Market Summary
                  </div>
                  <CopyBtn text={result.marketSummary} />
                </div>
                <div className="text-sm leading-relaxed" style={{ color: '#374151' }}>
                  {result.marketSummary}
                </div>
              </div>

              <div>
                <div
                  className="text-xs font-bold uppercase tracking-widest mb-3"
                  style={{ color: '#9CA3AF', fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  {result.competitors.length} Competitors Analysed
                </div>
                <div className="space-y-3">
                  {result.competitors.map((c, i) => (
                    <CompetitorCard key={i} competitor={c} index={i} />
                  ))}
                </div>
              </div>

              <div
                className="p-4 rounded-2xl"
                style={{
                  background: 'rgba(99,102,241,0.06)',
                  border: '1px solid rgba(99,102,241,0.18)',
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: '#6366F1', fontFamily: "'Bricolage Grotesque', sans-serif" }}
                  >
                    Opportunity Gaps
                  </div>
                  <CopyBtn text={result.opportunityGaps.join('\n')} />
                </div>
                <div className="space-y-2">
                  {result.opportunityGaps.map((gap, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs"
                      style={{ color: '#374151' }}
                    >
                      <span
                        className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5 font-black text-xs"
                        style={{
                          background: '#EEF2FF',
                          color: '#6366F1',
                          fontFamily: "'Bricolage Grotesque', sans-serif",
                        }}
                      >
                        {i + 1}
                      </span>
                      {gap}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                    Entry Strategy
                  </div>
                  <div
                    className="text-xs leading-relaxed"
                    style={{ color: '#374151' }}
                  >
                    {result.entryStrategy}
                  </div>
                </div>
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
                    Pricing Intel
                  </div>
                  <div
                    className="text-xs leading-relaxed"
                    style={{ color: '#374151' }}
                  >
                    {result.pricingIntel}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !result && (
            <div className="h-full flex flex-col items-center justify-center gap-4 p-8">
              <div className="text-5xl">🎯</div>
              <div className="text-center">
                <div
                  className="text-base font-black mb-2"
                  style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  Understand your competition
                </div>
                <div
                  className="text-xs max-w-xs leading-relaxed"
                  style={{ color: '#9CA3AF' }}
                >
                  Enter a product or niche to get a full competitive intelligence report with
                  opportunity gaps and entry strategy.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
