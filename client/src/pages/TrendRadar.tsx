import { useChat } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import { DefaultChatTransport } from 'ai';
import {
  Check,
  Copy,
  Loader2,
  Minus,
  Radio,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDocumentTitle } from '@/_core/hooks/useDocumentTitle';
import { toast } from 'sonner';
import { SaveToProduct } from '@/components/SaveToProduct';

interface Trend {
  name: string;
  category: string;
  momentum: 'Exploding' | 'Rising' | 'Stable' | 'Declining';
  timeframe: string;
  searchVolumeTrend: string;
  targetDemographic: string;
  monetisationPotential: 'High' | 'Medium' | 'Low';
  productOpportunities: string[];
  keyDrivers: string;
  riskFactors: string;
  score: number;
}

interface TrendResult {
  overview: string;
  trends: Trend[];
  hottest: string;
  actionableInsight: string;
}

const SYSTEM_PROMPT = `You are an expert ecommerce trend analyst with deep knowledge of consumer behaviour, social media trends, and market movements.
When given a category/market and current data, return a JSON object with this EXACT structure (no markdown, just raw JSON):
{"overview":"Brief trend landscape overview","trends":[{"name":"Trend name","category":"Sub-category","momentum":"Exploding|Rising|Stable|Declining","timeframe":"e.g. Last 3 months","searchVolumeTrend":"e.g. +340% YoY","targetDemographic":"Who is driving this trend","monetisationPotential":"High|Medium|Low","productOpportunities":["Product idea 1","Product idea 2","Product idea 3"],"keyDrivers":"What is driving this trend","riskFactors":"Potential risks or saturation signals","score":88}],"hottest":"Name of the hottest trend and why","actionableInsight":"Most important action to take right now"}
Return exactly 5 trends sorted by score descending. Return ONLY raw JSON.`;

function parseResult(text: string): TrendResult | null {
  try {
    const stripped = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    const start = stripped.indexOf('{');
    const end = stripped.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    const parsed = JSON.parse(stripped.slice(start, end + 1));
    if (!parsed.trends || !Array.isArray(parsed.trends)) return null;
    return parsed as TrendResult;
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

const MOMENTUM_CONFIG: Record<string, { color: string; icon: React.ReactNode; bg: string }> = {
  Exploding: { color: '#e05c7a', icon: <TrendingUp size={11} />, bg: 'rgba(224,92,122,0.1)' },
  Rising: { color: '#6366F1', icon: <TrendingUp size={11} />, bg: '#EEF2FF' },
  Stable: { color: '#6366F1', icon: <Minus size={11} />, bg: 'rgba(99,102,241,0.1)' },
  Declining: {
    color: '#9CA3AF',
    icon: <TrendingDown size={11} />,
    bg: '#F9FAFB',
  },
};

const POTENTIAL_COLORS: Record<string, string> = {
  High: '#6366F1',
  Medium: '#6366F1',
  Low: '#e05c7a',
};

function TrendCard({ trend, index }: { trend: Trend; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);
  const mc = MOMENTUM_CONFIG[trend.momentum] || MOMENTUM_CONFIG.Stable!;
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #F0F0F0' }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left"
        style={{ cursor: 'pointer' }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm flex-shrink-0"
          style={{
            background: 'rgba(74,184,245,0.12)',
            color: '#4ab8f5',
            fontFamily: "'Bricolage Grotesque', sans-serif",
          }}
        >
          {trend.score}
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-sm font-extrabold leading-tight"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#F8FAFC' }}
          >
            {trend.name}
          </div>
          <div className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
            {trend.category} · {trend.searchVolumeTrend}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: mc.bg, color: mc.color, border: `1px solid ${mc.color}33` }}
          >
            {mc.icon}
            {trend.momentum}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              background: `${POTENTIAL_COLORS[trend.monetisationPotential]}18`,
              color: POTENTIAL_COLORS[trend.monetisationPotential],
              border: `1px solid ${POTENTIAL_COLORS[trend.monetisationPotential]}33`,
            }}
          >
            {trend.monetisationPotential}
          </span>
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <div style={{ height: 1, background: '#F0F0F0' }} />
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div
                className="text-xs font-bold uppercase tracking-wider mb-1"
                style={{ color: '#9CA3AF', fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                Key Drivers
              </div>
              <div className="text-xs leading-relaxed" style={{ color: '#CBD5E1' }}>
                {trend.keyDrivers}
              </div>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div
                className="text-xs font-bold uppercase tracking-wider mb-1"
                style={{ color: '#9CA3AF', fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                Target Demographic
              </div>
              <div className="text-xs leading-relaxed" style={{ color: '#CBD5E1' }}>
                {trend.targetDemographic}
              </div>
            </div>
          </div>
          <div
            className="p-3 rounded-xl"
            style={{
              background: 'rgba(74,184,245,0.04)',
              border: '1px solid rgba(74,184,245,0.1)',
            }}
          >
            <div
              className="text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: '#4ab8f5', fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Product Opportunities
            </div>
            <div className="space-y-1">
              {trend.productOpportunities.map((opp, i) => (
                <div
                  key={i}
                  className="text-xs flex items-center gap-2"
                  style={{ color: '#CBD5E1' }}
                >
                  <span style={{ color: '#4ab8f5' }}>→</span>
                  {opp}
                </div>
              ))}
            </div>
          </div>
          {trend.riskFactors && (
            <div
              className="p-3 rounded-xl"
              style={{
                background: 'rgba(224,92,122,0.04)',
                border: '1px solid rgba(224,92,122,0.1)',
              }}
            >
              <div
                className="text-xs font-bold uppercase tracking-wider mb-1"
                style={{ color: '#e05c7a', fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                Risk Factors
              </div>
              <div className="text-xs leading-relaxed" style={{ color: '#CBD5E1' }}>
                {trend.riskFactors}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const CATEGORIES = [
  'Health & Wellness',
  'Home & Living',
  'Beauty & Skincare',
  'Fitness & Sports',
  'Tech Accessories',
  'Pet Products',
  'Sustainable/Eco',
];

export default function TrendRadar() {
  useDocumentTitle('Trend Radar');
  const [category, setCategory] = useState('');
  const [region, setRegion] = useState('Australia');
  const [timeframe, setTimeframe] = useState('Last 3 months');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<TrendResult | null>(null);
  const [genError, setGenError] = useState('');
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const searchQueryRef = useRef('');

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
            aiSdk: true,
          },
        };
      },
    }),
  });

  useEffect(() => {
    if (status === 'streaming' || status === 'submitted') setWaitingForResponse(true);
  }, [status]);

  useEffect(() => {
    if (status !== 'ready' || !generating || !waitingForResponse) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === 'assistant') {
      const text = lastMsg.parts
        .filter((p: any) => p.type === 'text')
        .map((p: any) => p.text)
        .join('');
      const parsed = parseResult(text);
      if (parsed) setResult(parsed);
      else setGenError('Could not parse results. Please try again.');
    } else {
      setGenError('No response received. Please try again.');
    }
    setGenerating(false);
    setWaitingForResponse(false);
  }, [status, generating, waitingForResponse, messages]);

  const handleGenerate = useCallback(async () => {
    if (!category.trim()) {
      toast.error('Please enter a category');
      return;
    }
    setGenerating(true);
    setGenError('');
    setResult(null);

    const searchQuery = `${category} trending products ${region} ${timeframe} 2025`;
    searchQueryRef.current = searchQuery;

    const prompt = [`Category: ${category}`, `Region: ${region}`, `Timeframe: ${timeframe}`]
      .filter(Boolean)
      .join('\n');
    sendMessage({ text: prompt });
    setWaitingForResponse(true);
  }, [category, region, timeframe, sendMessage]);

  const isLoading = generating || status === 'streaming' || status === 'submitted';

  return (
    <div
      className="page-transition h-full flex flex-col"
      style={{ background: '#05070F', color: '#F8FAFC', fontFamily: 'DM Sans, sans-serif' }}
    >
      <div
        className="flex items-center gap-3 px-5 py-3 border-b flex-shrink-0"
        style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#0d0d10' }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(74,184,245,0.15)', border: '1px solid rgba(74,184,245,0.3)' }}
        >
          <Radio size={15} style={{ color: '#4ab8f5' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-sm font-extrabold leading-tight"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Trend Radar
          </div>
          <div className="text-xs" style={{ color: '#9CA3AF' }}>
            Real-time trend analysis · Momentum scoring · Product opportunities
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
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#94A3B8',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={11} /> New Scan
          </button>
        )}
      </div>

      <div className="flex-1 overflow-hidden" style={{ display: 'grid', gridTemplateColumns: '35% 65%', gap: '24px', padding: '24px 28px' }}>
        <div
          className="overflow-y-auto space-y-4"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <div className="space-y-3">
            <div>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: '#94A3B8', fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                Category *
              </label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
                placeholder="e.g. Health & Wellness, Beauty…"
                className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                style={{
                  background: '#1a2236',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.8)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                }}
              />
            </div>
            <div>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: '#94A3B8', fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                Region
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                style={{
                  background: '#1a2236',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.8)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                }}
              >
                {['Australia', 'United States', 'United Kingdom', 'Global'].map((r) => (
                  <option key={r} value={r} style={{ background: '#0d0d10' }}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: '#94A3B8', fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                Timeframe
              </label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                style={{
                  background: '#1a2236',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.8)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                }}
              >
                {['Last month', 'Last 3 months', 'Last 6 months', 'Last year'].map((t) => (
                  <option key={t} value={t} style={{ background: '#0d0d10' }}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div
              className="text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: '#9CA3AF', fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Quick Categories
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className="text-xs px-2.5 py-1 rounded-lg transition-all"
                  style={{
                    background: category === c ? 'rgba(74,184,245,0.1)' : '#F9FAFB',
                    border: `1px solid ${category === c ? 'rgba(74,184,245,0.3)' : '#E5E7EB'}`,
                    color: category === c ? '#4ab8f5' : '#6B7280',
                    cursor: 'pointer',
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-extrabold text-sm transition-all"
            style={{
              background: isLoading ? 'rgba(74,184,245,0.25)' : '#4ab8f5',
              color: '#FAFAFA',
              fontFamily: "'Bricolage Grotesque', sans-serif",
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Scanning…
              </>
            ) : (
              <>
                <Radio size={14} /> Scan Trends
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
            <div className="space-y-4 max-w-3xl">
              <div
                className="p-4 rounded-2xl animate-pulse"
                style={{
                  background: 'rgba(74,184,245,0.05)',
                  border: '1px solid rgba(74,184,245,0.15)',
                }}
              >
                <div className="h-4 bg-slate-700 rounded w-24 mb-3"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-700 rounded w-full"></div>
                  <div className="h-3 bg-slate-700 rounded w-5/6"></div>
                </div>
              </div>

              {[1, 2, 3, 4].map((idx) => (
                <div
                  key={idx}
                  className="rounded-2xl overflow-hidden animate-pulse"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #F0F0F0' }}
                >
                  <div className="flex items-center gap-3 p-4">
                    <div
                      className="w-10 h-10 rounded-xl flex-shrink-0"
                      style={{ background: 'rgba(74,184,245,0.2)' }}
                    ></div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                    </div>
                    <div className="w-20 h-8 bg-slate-700 rounded flex-shrink-0"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {result && (
            <div className="space-y-4 max-w-3xl">
              <div
                className="p-4 rounded-2xl"
                style={{
                  background: 'rgba(74,184,245,0.05)',
                  border: '1px solid rgba(74,184,245,0.15)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: '#4ab8f5', fontFamily: "'Bricolage Grotesque', sans-serif" }}
                  >
                    Trend Overview
                  </div>
                  <CopyBtn text={result.overview} />
                </div>
                <div className="text-sm leading-relaxed" style={{ color: '#CBD5E1' }}>
                  {result.overview}
                </div>
              </div>

              <div
                className="p-4 rounded-2xl"
                style={{
                  background: 'rgba(224,92,122,0.05)',
                  border: '1px solid rgba(224,92,122,0.2)',
                }}
              >
                <div
                  className="text-xs font-bold uppercase tracking-widest mb-1"
                  style={{ color: '#e05c7a', fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  🔥 Hottest Right Now
                </div>
                <div className="text-sm leading-relaxed" style={{ color: '#CBD5E1' }}>
                  {result.hottest}
                </div>
              </div>

              <div>
                <div
                  className="text-xs font-bold uppercase tracking-widest mb-3"
                  style={{ color: '#9CA3AF', fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  {result.trends.length} Trends Detected
                </div>
                <div className="space-y-3">
                  {result.trends.map((t, i) => (
                    <TrendCard key={i} trend={t} index={i} />
                  ))}
                </div>
              </div>

              <div
                className="p-4 rounded-2xl"
                style={{
                  background: 'rgba(99,102,241,0.05)',
                  border: '1px solid rgba(99,102,241,0.15)',
                }}
              >
                <div
                  className="text-xs font-bold uppercase tracking-widest mb-2"
                  style={{ color: '#6366F1', fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  Actionable Insight
                </div>
                <div className="text-sm leading-relaxed" style={{ color: '#CBD5E1' }}>
                  {result.actionableInsight}
                </div>
              </div>
            </div>
          )}

          {!isLoading && !result && (
            <div className="h-full flex flex-col items-center justify-center gap-4 p-8">
              <div className="text-5xl">📡</div>
              <div className="text-center">
                <div
                  className="text-base font-extrabold mb-2"
                  style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  Spot trends before they peak
                </div>
                <div
                  className="text-xs max-w-xs leading-relaxed"
                  style={{ color: '#9CA3AF' }}
                >
                  Select a category to get 5 scored trends with momentum analysis, product
                  opportunities, and real-time market signals.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
