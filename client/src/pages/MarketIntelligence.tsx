import { useChat } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import { DefaultChatTransport } from 'ai';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Minus,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import OutputToolbar from '@/components/OutputToolbar';
import RelatedTools from '@/components/RelatedTools';
import { SaveToProduct } from '@/components/SaveToProduct';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Competitor {
  name: string;
  estimatedRevenue: string;
  priceRange: string;
  strengths: string[];
  weaknesses: string[];
  marketingChannels: string[];
  uniqueAngle: string;
}

interface MarketIntelResult {
  marketOverview: {
    marketSize: string;
    growthRate: string;
    trend: 'growing' | 'stable' | 'declining';
    seasonality: string;
    keyDrivers: string[];
  };
  competitors: Competitor[];
  opportunityGaps: {
    gap: string;
    potentialImpact: string;
    difficulty: 'low' | 'medium' | 'high';
  }[];
  pricingIntelligence: {
    marketLow: string;
    marketAverage: string;
    marketHigh: string;
    sweetSpot: string;
    pricingStrategy: string;
  };
  customerSentiment: {
    topComplaints: string[];
    topPraises: string[];
    unmetNeeds: string[];
  };
  strategicRecommendations: string[];
  threatAssessment: string;
  entryStrategy: string;
}

// ─── Copy Button ──────────────────────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg transition-all duration-150 flex-shrink-0"
      style={{
        background: copied ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${copied ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)'}`,
        color: copied ? '#A5B4FC' : '#94A3B8',
      }}
      title="Copy to clipboard"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({
  title,
  accent = '#8b5cf6',
  children,
  defaultOpen = true,
}: {
  title: string;
  accent?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className="rounded-2xl overflow-hidden mb-4"
      style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left"
        style={{ background: `${accent}08` }}
      >
        <span
          className="text-xs font-extrabold uppercase tracking-widest"
          style={{ fontFamily: "'Syne', sans-serif", color: accent }}
        >
          {title}
        </span>
        {open ? (
          <ChevronUp size={14} style={{ color: accent }} />
        ) : (
          <ChevronDown size={14} style={{ color: accent }} />
        )}
      </button>
      {open && <div className="px-5 py-4">{children}</div>}
    </div>
  );
}

// ─── Trend Icon ───────────────────────────────────────────────────────────────
function TrendIcon({ trend }: { trend: 'growing' | 'stable' | 'declining' }) {
  if (trend === 'growing') return <TrendingUp size={16} style={{ color: '#6366F1' }} />;
  if (trend === 'declining') return <TrendingDown size={16} style={{ color: '#ef4444' }} />;
  return <Minus size={16} style={{ color: '#f59e0b' }} />;
}

// ─── Difficulty Badge ─────────────────────────────────────────────────────────
function DifficultyBadge({ difficulty }: { difficulty: 'low' | 'medium' | 'high' }) {
  const config = {
    low: { color: '#6366F1', label: 'Low Effort' },
    medium: { color: '#f59e0b', label: 'Medium Effort' },
    high: { color: '#ef4444', label: 'High Effort' },
  };
  const { color, label } = config[difficulty];
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}
    >
      {label}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MarketIntelligence() {
  const [niche, setNiche] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [targetRegion, setTargetRegion] = useState('');
  const [pricePoint, setPricePoint] = useState('');
  const [knownCompetitors, setKnownCompetitors] = useState('');
  const [result, setResult] = useState<MarketIntelResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const searchQueryRef = useRef('');

  const SYSTEM_PROMPT = `You are a market intelligence analyst specialising in ecommerce competitive research. When given a niche/market, you MUST respond with ONLY a valid JSON object (no markdown, no code blocks, no explanation) in this exact format:

{
  "marketOverview": {
    "marketSize": "string - estimated market size",
    "growthRate": "string - annual growth rate",
    "trend": "growing" | "stable" | "declining",
    "seasonality": "string - seasonal patterns",
    "keyDrivers": ["driver1", "driver2", "driver3"]
  },
  "competitors": [
    {
      "name": "string",
      "estimatedRevenue": "string",
      "priceRange": "string",
      "strengths": ["strength1", "strength2"],
      "weaknesses": ["weakness1", "weakness2"],
      "marketingChannels": ["channel1", "channel2"],
      "uniqueAngle": "string"
    }
  ],
  "opportunityGaps": [
    {
      "gap": "string - specific opportunity",
      "potentialImpact": "string - revenue/growth potential",
      "difficulty": "low" | "medium" | "high"
    }
  ],
  "pricingIntelligence": {
    "marketLow": "string",
    "marketAverage": "string",
    "marketHigh": "string",
    "sweetSpot": "string - recommended price point",
    "pricingStrategy": "string - recommended approach"
  },
  "customerSentiment": {
    "topComplaints": ["complaint1", "complaint2", "complaint3"],
    "topPraises": ["praise1", "praise2", "praise3"],
    "unmetNeeds": ["need1", "need2", "need3"]
  },
  "strategicRecommendations": ["recommendation1", "recommendation2", "recommendation3", "recommendation4"],
  "threatAssessment": "string - key threats and how to mitigate",
  "entryStrategy": "string - recommended market entry approach"
}

Include 3-5 real or realistic competitors. Make all data specific and actionable.`;

  const { sendMessage, status, messages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      prepareSendMessagesRequest({ messages }) {
        return {
          body: {
            messages: messages.map((m: UIMessage) => ({
              role: m.role,
              content: m.parts
                .filter((p: any) => p.type === 'text')
                .map((p: any) => p.text)
                .join(''),
            })),
            systemPrompt: SYSTEM_PROMPT,
            searchQuery: searchQueryRef.current || undefined,
          },
        };
      },
    }),
  });

  // Parse result when generation completes
  useEffect(() => {
    if (status === 'ready' && isGenerating) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === 'assistant') {
        const text = lastMsg.parts
          .filter((p: any) => p.type === 'text')
          .map((p: any) => p.text)
          .join('');
        try {
          let content = text.trim();
          content = content
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```$/, '');
          const parsed = JSON.parse(content) as MarketIntelResult;
          setResult(parsed);
          setIsGenerating(false);
        } catch {
          toast.error('Failed to parse market analysis. Please try again.');
          setIsGenerating(false);
        }
      }
    }
  }, [status, isGenerating, messages]);

  const handleGenerate = async () => {
    if (!niche.trim()) {
      toast.error('Please enter a niche or market to analyse.');
      return;
    }
    setResult(null);
    setIsGenerating(true);

    const searchQuery = `${niche} ${productCategory || ''} ecommerce market analysis ${targetRegion || ''} 2025`;
    searchQueryRef.current = searchQuery;

    const prompt = `Conduct a comprehensive market intelligence analysis for:

Niche / Market: ${niche}
Product Category: ${productCategory || 'Not specified'}
Target Region: ${targetRegion || 'Global / English-speaking markets'}
Price Point: ${pricePoint || 'Not specified'}
Known Competitors: ${knownCompetitors || 'Not specified'}

Generate a full competitive intelligence report as JSON.`;

    sendMessage({ text: prompt });
  };

  const handleReset = () => {
    setResult(null);
    setIsGenerating(false);
    setNiche('');
    setProductCategory('');
    setTargetRegion('');
    setPricePoint('');
    setKnownCompetitors('');
  };

  return (
    <div className="flex h-full" style={{ background: '#0a0a0a' }}>
      {/* ── Left Panel ── */}
      <div
        className="flex flex-col flex-shrink-0 overflow-y-auto"
        style={{
          width: '320px',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          background: '#111114',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.1) transparent',
        }}
      >
        {/* Header */}
        <div
          className="px-5 pt-6 pb-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: '#8b5cf6' }}
            />
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: 'rgba(139,92,246,0.7)', fontFamily: "'Syne', sans-serif" }}
            >
              Competitive Intel
            </span>
          </div>
          <h1
            className="text-lg font-extrabold"
            style={{ fontFamily: "'Syne', sans-serif", color: '#F1F5F9', letterSpacing: '-0.02em' }}
          >
            Market Intelligence
          </h1>
          <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
            Deep competitive analysis, opportunity gaps, and market entry strategy.
          </p>
        </div>

        {/* Form */}
        <div className="flex-1 px-5 py-5 space-y-4">
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: '#94A3B8' }}
            >
              Niche / Market *
            </label>
            <input
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="e.g. Posture correctors, LED face masks"
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#F1F5F9',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(139,92,246,0.5)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>

          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: '#94A3B8' }}
            >
              Product Category
            </label>
            <input
              value={productCategory}
              onChange={(e) => setProductCategory(e.target.value)}
              placeholder="e.g. Health & Wellness, Beauty, Home"
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#F1F5F9',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(139,92,246,0.5)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>

          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: '#94A3B8' }}
            >
              Target Region
            </label>
            <input
              value={targetRegion}
              onChange={(e) => setTargetRegion(e.target.value)}
              placeholder="e.g. USA, Australia, UK, Global"
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#F1F5F9',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(139,92,246,0.5)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>

          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: '#94A3B8' }}
            >
              Your Price Point
            </label>
            <input
              value={pricePoint}
              onChange={(e) => setPricePoint(e.target.value)}
              placeholder="e.g. $29-49 USD"
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#F1F5F9',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(139,92,246,0.5)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>

          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: '#94A3B8' }}
            >
              Known Competitors
            </label>
            <textarea
              value={knownCompetitors}
              onChange={(e) => setKnownCompetitors(e.target.value)}
              placeholder="e.g. BackPainPro, PostureNow, SpineAlign"
              rows={2}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all resize-none"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#F1F5F9',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(139,92,246,0.5)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>
        </div>

        {/* Generate Button */}
        <div className="px-5 pb-6 space-y-2">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !niche.trim()}
            className="w-full py-3 rounded-xl text-sm font-extrabold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2"
            style={{
              fontFamily: "'Syne', sans-serif",
              background: isGenerating
                ? 'rgba(139,92,246,0.15)'
                : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: isGenerating ? '#8b5cf6' : '#fff',
              border: isGenerating ? '1px solid rgba(139,92,246,0.3)' : 'none',
              opacity: !niche.trim() ? 0.4 : 1,
              cursor: !niche.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {isGenerating ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Analysing Market...
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Run Market Intelligence
              </>
            )}
          </button>
          {result && (
            <button
              onClick={handleReset}
              className="w-full py-2 rounded-xl text-xs font-semibold transition-all duration-150"
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#9CA3AF',
              }}
            >
              Reset & Start Over
            </button>
          )}
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}
      >
        {!result && !isGenerating && (
          <div className="flex flex-col items-center justify-center h-full px-8 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: 'rgba(139,92,246,0.1)',
                border: '1px solid rgba(139,92,246,0.2)',
              }}
            >
              <span className="text-3xl">🔍</span>
            </div>
            <h2
              className="text-xl font-extrabold mb-2"
              style={{ fontFamily: "'Syne', sans-serif", color: '#F1F5F9' }}
            >
              Decode Your Market
            </h2>
            <p className="text-sm max-w-md" style={{ color: '#9CA3AF' }}>
              Enter your niche and let AI map the competitive landscape — market size, competitor
              analysis, opportunity gaps, pricing intelligence, and entry strategy.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-8 max-w-sm w-full">
              {[
                { icon: '📊', label: 'Market Overview' },
                { icon: '🏆', label: 'Competitor Analysis' },
                { icon: '🎯', label: 'Opportunity Gaps' },
                { icon: '💰', label: 'Pricing Intel' },
                { icon: '💬', label: 'Customer Sentiment' },
                { icon: '🚀', label: 'Entry Strategy' },
              ].map(({ icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <span className="text-base">{icon}</span>
                  <span className="text-xs font-medium" style={{ color: '#94A3B8' }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isGenerating && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="relative w-16 h-16 mb-6">
              <div
                className="absolute inset-0 rounded-full animate-ping"
                style={{ background: 'rgba(139,92,246,0.2)' }}
              />
              <div
                className="relative w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(139,92,246,0.1)',
                  border: '1px solid rgba(139,92,246,0.3)',
                }}
              >
                <Sparkles size={24} style={{ color: '#8b5cf6' }} className="animate-pulse" />
              </div>
            </div>
            <p className="text-sm font-semibold" style={{ color: '#8b5cf6' }}>
              Scanning the market...
            </p>
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
              Analysing competitors, gaps, and opportunities
            </p>
          </div>
        )}

        {result && (
          <div className="max-w-3xl mx-auto px-6 py-8">
            {/* Market Header */}
            <div className="mb-8 pb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#8b5cf6' }} />
                <span
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: 'rgba(139,92,246,0.7)', fontFamily: "'Syne', sans-serif" }}
                >
                  Market Intelligence Report
                </span>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <h2
                  className="text-2xl font-extrabold"
                  style={{ fontFamily: "'Syne', sans-serif", color: '#F1F5F9' }}
                >
                  {niche}
                </h2>
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                  style={{
                    background:
                      result.marketOverview.trend === 'growing'
                        ? 'rgba(99,102,241,0.12)'
                        : result.marketOverview.trend === 'declining'
                          ? 'rgba(239,68,68,0.1)'
                          : 'rgba(245,158,11,0.1)',
                    border: `1px solid ${result.marketOverview.trend === 'growing' ? 'rgba(99,102,241,0.3)' : result.marketOverview.trend === 'declining' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
                  }}
                >
                  <TrendIcon trend={result.marketOverview.trend} />
                  <span
                    className="text-xs font-semibold capitalize"
                    style={{
                      color:
                        result.marketOverview.trend === 'growing'
                          ? '#6366F1'
                          : result.marketOverview.trend === 'declining'
                            ? '#ef4444'
                            : '#f59e0b',
                    }}
                  >
                    {result.marketOverview.trend}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Market Size', value: result.marketOverview.marketSize },
                  { label: 'Growth Rate', value: result.marketOverview.growthRate },
                  { label: 'Seasonality', value: result.marketOverview.seasonality },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-xl px-3 py-2.5"
                    style={{
                      background: 'rgba(139,92,246,0.06)',
                      border: '1px solid rgba(139,92,246,0.15)',
                    }}
                  >
                    <div
                      className="text-xs font-semibold uppercase tracking-wider mb-1"
                      style={{ color: 'rgba(139,92,246,0.6)' }}
                    >
                      {label}
                    </div>
                    <div className="text-sm font-bold" style={{ color: '#F1F5F9' }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Market Overview */}
            <SectionCard title="Market Overview" accent="#8b5cf6">
              <div className="pt-1">
                <span
                  className="text-xs font-semibold uppercase tracking-wider block mb-2"
                  style={{ color: '#9CA3AF' }}
                >
                  Key Growth Drivers
                </span>
                <ul className="space-y-1.5">
                  {result.marketOverview.keyDrivers.map((driver) => (
                    <li key={driver} className="flex items-start gap-2">
                      <div
                        className="w-1 h-1 rounded-full mt-2 flex-shrink-0"
                        style={{ background: '#8b5cf6' }}
                      />
                      <span className="text-sm" style={{ color: '#F1F5F9' }}>
                        {driver}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </SectionCard>

            {/* Competitors */}
            <SectionCard
              title={`Competitor Analysis (${result.competitors.length})`}
              accent="#ef4444"
            >
              <div className="space-y-4">
                {result.competitors.map((comp, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-4"
                    style={{
                      background: 'rgba(239,68,68,0.04)',
                      border: '1px solid rgba(239,68,68,0.12)',
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className="text-sm font-extrabold"
                            style={{ fontFamily: "'Syne', sans-serif", color: '#F1F5F9' }}
                          >
                            {comp.name}
                          </span>
                          <CopyBtn text={comp.name} />
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs" style={{ color: '#9CA3AF' }}>
                            Rev: {comp.estimatedRevenue}
                          </span>
                          <span className="text-xs" style={{ color: '#9CA3AF' }}>
                            Price: {comp.priceRange}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p
                      className="text-xs mb-3"
                      style={{ color: '#94A3B8', fontStyle: 'italic' }}
                    >
                      "{comp.uniqueAngle}"
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span
                          className="text-xs font-semibold uppercase tracking-wider block mb-1.5"
                          style={{ color: 'rgba(99,102,241,0.90)' }}
                        >
                          Strengths
                        </span>
                        <ul className="space-y-1">
                          {comp.strengths.map((s) => (
                            <li
                              key={s}
                              className="text-xs flex items-start gap-1.5"
                              style={{ color: '#94A3B8' }}
                            >
                              <span style={{ color: '#6366F1' }}>+</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span
                          className="text-xs font-semibold uppercase tracking-wider block mb-1.5"
                          style={{ color: 'rgba(239,68,68,0.6)' }}
                        >
                          Weaknesses
                        </span>
                        <ul className="space-y-1">
                          {comp.weaknesses.map((w) => (
                            <li
                              key={w}
                              className="text-xs flex items-start gap-1.5"
                              style={{ color: '#94A3B8' }}
                            >
                              <span style={{ color: '#ef4444' }}>−</span> {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {comp.marketingChannels.map((ch) => (
                        <span
                          key={ch}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            background: 'rgba(255,255,255,0.08)',
                            color: '#94A3B8',
                            border: '1px solid rgba(255,255,255,0.1)',
                          }}
                        >
                          {ch}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Opportunity Gaps */}
            <SectionCard title="Opportunity Gaps" accent="#6366F1">
              <div className="space-y-3">
                {result.opportunityGaps.map((opp, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-4"
                    style={{
                      background: 'rgba(99,102,241,0.06)',
                      border: '1px solid rgba(99,102,241,0.18)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="text-sm font-semibold flex-1" style={{ color: '#F1F5F9' }}>
                        {opp.gap}
                      </span>
                      <DifficultyBadge difficulty={opp.difficulty} />
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp size={12} style={{ color: '#6366F1' }} />
                      <span className="text-xs" style={{ color: 'rgba(99,102,241,1.00)' }}>
                        {opp.potentialImpact}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Pricing Intelligence */}
            <SectionCard title="Pricing Intelligence" accent="#f59e0b">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                {[
                  {
                    label: 'Market Low',
                    value: result.pricingIntelligence.marketLow,
                    color: '#6366F1',
                  },
                  {
                    label: 'Average',
                    value: result.pricingIntelligence.marketAverage,
                    color: '#f59e0b',
                  },
                  {
                    label: 'Market High',
                    value: result.pricingIntelligence.marketHigh,
                    color: '#ef4444',
                  },
                  {
                    label: 'Sweet Spot',
                    value: result.pricingIntelligence.sweetSpot,
                    color: '#6366F1',
                  },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    className="rounded-xl px-3 py-2.5 text-center"
                    style={{ background: `${color}08`, border: `1px solid ${color}20` }}
                  >
                    <div
                      className="text-xs font-semibold uppercase tracking-wider mb-1"
                      style={{ color: `${color}80` }}
                    >
                      {label}
                    </div>
                    <div className="text-sm font-extrabold" style={{ color }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-3">
                <p className="text-sm leading-relaxed flex-1" style={{ color: '#F1F5F9' }}>
                  {result.pricingIntelligence.pricingStrategy}
                </p>
                <CopyBtn text={result.pricingIntelligence.pricingStrategy} />
              </div>
            </SectionCard>

            {/* Customer Sentiment */}
            <SectionCard title="Customer Sentiment" accent="#06b6d4">
              <div className="space-y-4">
                {[
                  {
                    label: 'Top Complaints',
                    items: result.customerSentiment.topComplaints,
                    color: '#ef4444',
                    icon: '😤',
                  },
                  {
                    label: 'What They Love',
                    items: result.customerSentiment.topPraises,
                    color: '#6366F1',
                    icon: '😍',
                  },
                  {
                    label: 'Unmet Needs',
                    items: result.customerSentiment.unmetNeeds,
                    color: '#06b6d4',
                    icon: '💡',
                  },
                ].map(({ label, items, color, icon }) => (
                  <div key={label}>
                    <div className="flex items-center gap-2 mb-2">
                      <span>{icon}</span>
                      <span
                        className="text-xs font-semibold uppercase tracking-wider"
                        style={{ color: `${color}80` }}
                      >
                        {label}
                      </span>
                    </div>
                    <ul className="space-y-1.5">
                      {items.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <div
                            className="w-1 h-1 rounded-full mt-2 flex-shrink-0"
                            style={{ background: color }}
                          />
                          <span className="text-sm" style={{ color: '#F1F5F9' }}>
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Strategic Recommendations & Entry */}
            <SectionCard title="Strategy & Entry Plan" accent="#6366F1">
              <div className="mb-4">
                <span
                  className="text-xs font-semibold uppercase tracking-wider block mb-3"
                  style={{ color: '#9CA3AF' }}
                >
                  Strategic Recommendations
                </span>
                <div className="space-y-2">
                  {result.strategicRecommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 px-4 py-3 rounded-xl"
                      style={{
                        background: 'rgba(99,102,241,0.05)',
                        border: '1px solid rgba(99,102,241,0.12)',
                      }}
                    >
                      <span
                        className="text-xs font-extrabold flex-shrink-0 mt-0.5"
                        style={{ color: 'rgba(99,102,241,0.5)' }}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-sm flex-1" style={{ color: '#F1F5F9' }}>
                        {rec}
                      </span>
                      <CopyBtn text={rec} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <span
                  className="text-xs font-semibold uppercase tracking-wider block mb-2"
                  style={{ color: '#9CA3AF' }}
                >
                  Threat Assessment
                </span>
                <div className="flex items-start gap-3">
                  <p className="text-sm leading-relaxed flex-1" style={{ color: '#F1F5F9' }}>
                    {result.threatAssessment}
                  </p>
                  <CopyBtn text={result.threatAssessment} />
                </div>
              </div>
              <div>
                <span
                  className="text-xs font-semibold uppercase tracking-wider block mb-2"
                  style={{ color: '#9CA3AF' }}
                >
                  Entry Strategy
                </span>
                <div
                  className="flex items-start gap-3 px-4 py-3 rounded-xl"
                  style={{
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.2)',
                  }}
                >
                  <p className="text-sm leading-relaxed flex-1" style={{ color: '#F1F5F9' }}>
                    {result.entryStrategy}
                  </p>
                  <CopyBtn text={result.entryStrategy} />
                </div>
              </div>
            </SectionCard>
          </div>
        )}
      </div>
    </div>
  );
}
