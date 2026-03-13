import { useChat } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import { DefaultChatTransport } from 'ai';
import { BarChart2, Check, Copy, Loader2, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { SaveToProduct } from '@/components/SaveToProduct';

interface ScoreBreakdown {
  demandScore: number;
  competitionScore: number;
  marginScore: number;
  trendScore: number;
  entryBarrierScore: number;
  scalabilityScore: number;
}

interface NicheResult {
  nicheName: string;
  overallScore: number;
  verdict: 'Strong Go' | 'Proceed with Caution' | 'Avoid';
  scores: ScoreBreakdown;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  idealCustomer: string;
  estimatedMonthlyRevenue: string;
  timeToFirstSale: string;
  topProducts: string[];
  nextSteps: string[];
}

const SYSTEM_PROMPT = `You are Majorka — a blunt, opinionated niche evaluator for Australian ecommerce founders. You don't hedge. You give a clear GO or NO-GO and defend it with specifics.

VOICE:
- If a niche is trash, say it's trash and explain exactly why.
- If it's a goldmine, get excited and explain the upside in AUD.
- Reference Australian market realities: Australia Post shipping costs, Afterpay adoption, Shopify AU ecosystem, local competition from Catch/Kogan/eBay AU.
- Use AUD for all revenue estimates. Factor in AU shipping costs and import duties where relevant.
- Never sit on the fence. "Proceed with Caution" should still lean towards a recommendation.

SCORING RULES:
- Score harshly. A 70+ means you'd personally put money into this niche. Below 40 means walk away.
- Weight competition and margins heavier than trend — trends fade, margins don't.
- Factor in the Australian market specifically: smaller population (26M), higher shipping costs, Afterpay/BNPL culture, preference for local brands.

When given a niche, return a JSON object with this EXACT structure (no markdown, just raw JSON):
{"nicheName":"Exact niche name","overallScore":75,"verdict":"Strong Go|Proceed with Caution|Avoid","scores":{"demandScore":80,"competitionScore":65,"marginScore":70,"trendScore":85,"entryBarrierScore":60,"scalabilityScore":75},"summary":"2-3 sentence blunt assessment — give your real opinion, not a balanced overview","strengths":["Strength 1","Strength 2","Strength 3"],"weaknesses":["Weakness 1","Weakness 2","Weakness 3"],"idealCustomer":"Specific Australian customer profile with demographics","estimatedMonthlyRevenue":"e.g. $5K-20K AUD at scale","timeToFirstSale":"e.g. 2-4 weeks","topProducts":["Product 1","Product 2","Product 3","Product 4","Product 5"],"nextSteps":["Concrete action 1 they can do today","Action 2","Action 3"]}
Scores are 0-100. Overall score is weighted average. Return ONLY raw JSON.`;

function parseResult(text: string): NicheResult | null {
  try {
    const stripped = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    const start = stripped.indexOf('{');
    const end = stripped.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    const parsed = JSON.parse(stripped.slice(start, end + 1));
    if (!parsed.nicheName || typeof parsed.overallScore !== 'number') return null;
    return parsed as NicheResult;
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
        background: copied ? 'rgba(45,202,114,0.1)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${copied ? 'rgba(45,202,114,0.3)' : 'rgba(255,255,255,0.08)'}`,
        color: copied ? 'rgba(45,202,114,0.8)' : 'rgba(240,237,232,0.4)',
        cursor: 'pointer',
      }}
    >
      {copied ? <Check size={9} /> : <Copy size={9} />}
    </button>
  );
}

const VERDICT_CONFIG = {
  'Strong Go': {
    color: '#2dca72',
    bg: 'rgba(45,202,114,0.1)',
    border: 'rgba(45,202,114,0.25)',
    emoji: '🟢',
  },
  'Proceed with Caution': {
    color: '#d4af37',
    bg: 'rgba(212,175,55,0.1)',
    border: 'rgba(212,175,55,0.25)',
    emoji: '🟡',
  },
  Avoid: {
    color: '#e05c7a',
    bg: 'rgba(224,92,122,0.1)',
    border: 'rgba(224,92,122,0.25)',
    emoji: '🔴',
  },
};

const SCORE_LABELS: Record<keyof ScoreBreakdown, string> = {
  demandScore: 'Demand',
  competitionScore: 'Competition',
  marginScore: 'Margins',
  trendScore: 'Trend',
  entryBarrierScore: 'Entry Barrier',
  scalabilityScore: 'Scalability',
};

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = score >= 70 ? '#2dca72' : score >= 50 ? '#d4af37' : '#e05c7a';
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span
          className="text-xs"
          style={{ color: 'rgba(240,237,232,0.55)', fontFamily: 'Syne, sans-serif' }}
        >
          {label}
        </span>
        <span
          className={`text-xs font-black ${getScoreColor(score)}`}
          style={{ fontFamily: 'Syne, sans-serif' }}
        >
          {score}
        </span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
    </div>
  );
}

const EXAMPLE_NICHES = [
  'Posture correctors',
  'Weighted blankets',
  'LED grow lights',
  'Bamboo kitchenware',
  'Dog anxiety products',
];

export default function NicheScorer() {
  const [niche, setNiche] = useState('');
  const [context, setContext] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<NicheResult | null>(null);
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
    if (!niche.trim()) {
      toast.error('Please enter a niche');
      return;
    }
    setGenerating(true);
    setGenError('');
    setResult(null);

    const searchQuery = `${niche} ecommerce market size competition Australia 2025`;
    searchQueryRef.current = searchQuery;

    const prompt = [`Niche to evaluate: ${niche}`, context && `Additional context: ${context}`]
      .filter(Boolean)
      .join('\n');
    sendMessage({ text: prompt });
    setWaitingForResponse(true);
  }, [niche, context, sendMessage]);

  const isLoading = generating || status === 'streaming' || status === 'submitted';
  const vc = result
    ? VERDICT_CONFIG[result.verdict] || VERDICT_CONFIG['Proceed with Caution']
    : null;

  return (
    <div
      className="h-full flex flex-col"
      style={{ background: '#080a0e', color: '#f0ede8', fontFamily: 'DM Sans, sans-serif' }}
    >
      <div
        className="flex items-center gap-3 px-5 py-3 border-b flex-shrink-0"
        style={{ borderColor: 'rgba(255,255,255,0.07)', background: '#0c0e12' }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)' }}
        >
          <BarChart2 size={15} style={{ color: '#d4af37' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-sm font-black leading-tight"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            Niche Scorer
          </div>
          <div className="text-xs" style={{ color: 'rgba(240,237,232,0.35)' }}>
            6-dimension scoring · Go/No-go verdict · Product recommendations
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
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(240,237,232,0.5)',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={11} /> Score Another
          </button>
        )}
      </div>

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        <div
          className="w-full lg:w-72 flex-shrink-0 overflow-y-auto border-b lg:border-b-0 lg:border-r p-4 space-y-4"
          style={{ borderColor: 'rgba(255,255,255,0.07)' }}
        >
          <div className="space-y-3">
            <div>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: 'rgba(240,237,232,0.6)', fontFamily: 'Syne, sans-serif' }}
              >
                Niche to Score *
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
                placeholder="e.g. Posture correctors, Yoga mats…"
                className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#f0ede8',
                }}
              />
            </div>
            <div>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: 'rgba(240,237,232,0.6)', fontFamily: 'Syne, sans-serif' }}
              >
                Additional Context
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Budget, experience level, target market…"
                rows={3}
                className="w-full text-sm px-3 py-2.5 rounded-xl outline-none resize-none"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#f0ede8',
                }}
              />
            </div>
          </div>

          <div>
            <div
              className="text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: 'rgba(240,237,232,0.3)', fontFamily: 'Syne, sans-serif' }}
            >
              Examples
            </div>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLE_NICHES.map((n) => (
                <button
                  key={n}
                  onClick={() => setNiche(n)}
                  className="text-xs px-2.5 py-1 rounded-lg transition-all"
                  style={{
                    background: niche === n ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${niche === n ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.07)'}`,
                    color: niche === n ? '#d4af37' : 'rgba(240,237,232,0.45)',
                    cursor: 'pointer',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm transition-all"
            style={{
              background: isLoading ? 'rgba(212,175,55,0.25)' : '#d4af37',
              color: '#080a0e',
              fontFamily: 'Syne, sans-serif',
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Scoring…
              </>
            ) : (
              <>
                <BarChart2 size={14} /> Score This Niche
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
                  background: 'rgba(212,175,55,0.1)',
                  border: '1px solid rgba(212,175,55,0.2)',
                }}
              >
                <BarChart2 size={24} style={{ color: '#d4af37' }} className="animate-pulse" />
              </div>
              <div className="text-center">
                <div className="text-sm font-black mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
                  Scoring {niche}…
                </div>
                <div className="text-xs" style={{ color: 'rgba(240,237,232,0.35)' }}>
                  Evaluating across 6 dimensions
                </div>
              </div>
            </div>
          )}

          {result && vc && (
            <div className="space-y-4 max-w-2xl">
              {/* Verdict hero */}
              <div
                className="p-5 rounded-2xl text-center"
                style={{ background: vc.bg, border: `1.5px solid ${vc.border}` }}
              >
                <div
                  className={`text-4xl font-black mb-1 ${getScoreColor(result.overallScore)}`}
                  style={{ fontFamily: 'Syne, sans-serif' }}
                >
                  {result.overallScore}
                </div>
                <div
                  className="text-xs mb-2"
                  style={{ color: 'rgba(240,237,232,0.4)', fontFamily: 'Syne, sans-serif' }}
                >
                  Overall Score
                </div>
                <div
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-black"
                  style={{
                    background: vc.bg,
                    border: `1px solid ${vc.border}`,
                    color: vc.color,
                    fontFamily: 'Syne, sans-serif',
                  }}
                >
                  {vc.emoji} {result.verdict}
                </div>
                <div
                  className="text-sm mt-3 leading-relaxed"
                  style={{ color: 'rgba(240,237,232,0.75)' }}
                >
                  {result.summary}
                </div>
              </div>

              {/* Score breakdown */}
              <div
                className="p-4 rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <div
                  className="text-xs font-bold uppercase tracking-widest mb-4"
                  style={{ color: 'rgba(240,237,232,0.4)', fontFamily: 'Syne, sans-serif' }}
                >
                  Score Breakdown
                </div>
                <div className="space-y-3">
                  {(Object.keys(result.scores) as (keyof ScoreBreakdown)[]).map((key) => (
                    <ScoreBar key={key} label={SCORE_LABELS[key]} score={result.scores[key]} />
                  ))}
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-2 gap-3">
                <div
                  className="p-4 rounded-2xl"
                  style={{
                    background: 'rgba(45,202,114,0.04)',
                    border: '1px solid rgba(45,202,114,0.12)',
                  }}
                >
                  <div
                    className="text-xs font-bold uppercase tracking-wider mb-2"
                    style={{ color: '#2dca72', fontFamily: 'Syne, sans-serif' }}
                  >
                    Strengths
                  </div>
                  <div className="space-y-1.5">
                    {result.strengths.map((s, i) => (
                      <div
                        key={i}
                        className="text-xs flex items-start gap-1.5"
                        style={{ color: 'rgba(240,237,232,0.7)' }}
                      >
                        <span style={{ color: '#2dca72', flexShrink: 0 }}>+</span>
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
                <div
                  className="p-4 rounded-2xl"
                  style={{
                    background: 'rgba(224,92,122,0.04)',
                    border: '1px solid rgba(224,92,122,0.12)',
                  }}
                >
                  <div
                    className="text-xs font-bold uppercase tracking-wider mb-2"
                    style={{ color: '#e05c7a', fontFamily: 'Syne, sans-serif' }}
                  >
                    Weaknesses
                  </div>
                  <div className="space-y-1.5">
                    {result.weaknesses.map((w, i) => (
                      <div
                        key={i}
                        className="text-xs flex items-start gap-1.5"
                        style={{ color: 'rgba(240,237,232,0.7)' }}
                      >
                        <span style={{ color: '#e05c7a', flexShrink: 0 }}>−</span>
                        {w}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Key metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  className="p-3 rounded-xl text-center"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div
                    className="text-xs font-bold mb-1"
                    style={{ color: 'rgba(240,237,232,0.35)', fontFamily: 'Syne, sans-serif' }}
                  >
                    Est. Revenue
                  </div>
                  <div
                    className="text-xs font-black"
                    style={{ color: '#2dca72', fontFamily: 'Syne, sans-serif' }}
                  >
                    {result.estimatedMonthlyRevenue}
                  </div>
                </div>
                <div
                  className="p-3 rounded-xl text-center"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div
                    className="text-xs font-bold mb-1"
                    style={{ color: 'rgba(240,237,232,0.35)', fontFamily: 'Syne, sans-serif' }}
                  >
                    Time to Sale
                  </div>
                  <div
                    className="text-xs font-black"
                    style={{ color: '#d4af37', fontFamily: 'Syne, sans-serif' }}
                  >
                    {result.timeToFirstSale}
                  </div>
                </div>
                <div
                  className="p-3 rounded-xl text-center"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div
                    className="text-xs font-bold mb-1"
                    style={{ color: 'rgba(240,237,232,0.35)', fontFamily: 'Syne, sans-serif' }}
                  >
                    Ideal Customer
                  </div>
                  <div className="text-xs" style={{ color: 'rgba(240,237,232,0.6)' }}>
                    {result.idealCustomer.slice(0, 40)}…
                  </div>
                </div>
              </div>

              {/* Top products */}
              <div
                className="p-4 rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  className="text-xs font-bold uppercase tracking-widest mb-3"
                  style={{ color: 'rgba(240,237,232,0.4)', fontFamily: 'Syne, sans-serif' }}
                >
                  Top Product Ideas
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.topProducts.map((p, i) => (
                    <span
                      key={i}
                      className="text-xs px-3 py-1.5 rounded-lg"
                      style={{
                        background: 'rgba(212,175,55,0.08)',
                        border: '1px solid rgba(212,175,55,0.15)',
                        color: 'rgba(240,237,232,0.7)',
                      }}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* Next steps */}
              <div
                className="p-4 rounded-2xl"
                style={{
                  background: 'rgba(212,175,55,0.04)',
                  border: '1px solid rgba(212,175,55,0.12)',
                }}
              >
                <div
                  className="text-xs font-bold uppercase tracking-widest mb-3"
                  style={{ color: '#d4af37', fontFamily: 'Syne, sans-serif' }}
                >
                  Next Steps
                </div>
                <div className="space-y-2">
                  {result.nextSteps.map((step, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs"
                      style={{ color: 'rgba(240,237,232,0.75)' }}
                    >
                      <span
                        className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5 font-black text-xs"
                        style={{
                          background: 'rgba(212,175,55,0.15)',
                          color: '#d4af37',
                          fontFamily: 'Syne, sans-serif',
                        }}
                      >
                        {i + 1}
                      </span>
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!isLoading && !result && (
            <div className="h-full flex flex-col items-center justify-center gap-4 p-8">
              <div className="text-5xl">📊</div>
              <div className="text-center">
                <div
                  className="text-base font-black mb-2"
                  style={{ fontFamily: 'Syne, sans-serif' }}
                >
                  Get a data-driven go/no-go verdict
                </div>
                <div
                  className="text-xs max-w-xs leading-relaxed"
                  style={{ color: 'rgba(240,237,232,0.35)' }}
                >
                  Enter any niche to get scored across 6 dimensions: demand, competition, margins,
                  trends, entry barriers, and scalability.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
