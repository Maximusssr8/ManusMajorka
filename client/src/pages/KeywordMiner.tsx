import { useChat } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import { DefaultChatTransport } from 'ai';
import { Check, Copy, Hash, Loader2, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ActiveProductBanner } from '@/components/ActiveProductBanner';
import { SaveToProduct } from '@/components/SaveToProduct';
import { useActiveProduct } from '@/hooks/useActiveProduct';

interface Keyword {
  keyword: string;
  searchVolume: string;
  competition: 'Low' | 'Medium' | 'High';
  cpc: string;
  intent: 'Informational' | 'Commercial' | 'Transactional' | 'Navigational';
  difficulty: number;
  opportunity: number;
  useCase: string;
}

interface KeywordResult {
  seed: string;
  summary: string;
  keywords: Keyword[];
  topOpportunity: string;
  contentIdeas: string[];
  adGroupSuggestions: string[];
}

const SYSTEM_PROMPT = `You are an expert ecommerce SEO and keyword research specialist.
When given a seed keyword/product, return a JSON object with this EXACT structure (no markdown, just raw JSON):
{"seed":"The seed keyword","summary":"Brief keyword landscape overview","keywords":[{"keyword":"exact keyword phrase","searchVolume":"e.g. 1K-10K/mo","competition":"Low|Medium|High","cpc":"e.g. $0.85","intent":"Informational|Commercial|Transactional|Navigational","difficulty":45,"opportunity":78,"useCase":"Where/how to use this keyword"}],"topOpportunity":"The single best keyword opportunity and why","contentIdeas":["Blog/content idea 1","Blog/content idea 2","Blog/content idea 3"],"adGroupSuggestions":["Ad group 1: keywords","Ad group 2: keywords","Ad group 3: keywords"]}
Return 12-15 keywords. Mix head terms, long-tail, and question keywords. Return ONLY raw JSON.`;

function parseResult(text: string): KeywordResult | null {
  try {
    const stripped = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    const start = stripped.indexOf('{');
    const end = stripped.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    const parsed = JSON.parse(stripped.slice(start, end + 1));
    if (!parsed.keywords || !Array.isArray(parsed.keywords)) return null;
    return parsed as KeywordResult;
  } catch {
    return null;
  }
}

function CopyBtn({ text, label }: { text: string; label?: string }) {
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
        background: copied ? 'rgba(79,142,247,0.08)' : '#F9FAFB',
        border: `1px solid ${copied ? '#C7D2FE' : '#F5F5F5'}`,
        color: copied ? 'rgba(79,142,247,1.00)' : '#9CA3AF',
        cursor: 'pointer',
      }}
    >
      {copied ? <Check size={9} /> : <Copy size={9} />}
      {label && <span className="ml-0.5">{label}</span>}
    </button>
  );
}

const COMPETITION_COLORS: Record<string, string> = {
  Low: '#4f8ef7',
  Medium: '#4f8ef7',
  High: '#e05c7a',
};
const INTENT_COLORS: Record<string, string> = {
  Transactional: '#4f8ef7',
  Commercial: '#4f8ef7',
  Informational: '#4ab8f5',
  Navigational: '#9c5fff',
};

export default function KeywordMiner() {
  const [seed, setSeed] = useState('');
  const [platform, setPlatform] = useState('Google');
  const [market, setMarket] = useState('Australia');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<KeywordResult | null>(null);
  const [genError, setGenError] = useState('');
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const [sortBy, setSortBy] = useState<'opportunity' | 'difficulty' | 'volume'>('opportunity');
  const searchQueryRef = useRef('');
  const { activeProduct } = useActiveProduct();

  useEffect(() => {
    if (activeProduct && !seed) {
      setSeed(activeProduct.name);
    }
  }, [activeProduct]);

  const getSystemPrompt = () => {
    if (!activeProduct) return SYSTEM_PROMPT;
    return (
      SYSTEM_PROMPT +
      `\n\nACTIVE PRODUCT CONTEXT:\n- Product: ${activeProduct.name}${activeProduct.niche ? '\n- Niche: ' + activeProduct.niche : ''}${activeProduct.summary ? '\n- Summary: ' + activeProduct.summary : ''}\n\nAll advice and output must be specifically tailored to this product. Reference it by name.`
    );
  };

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
            systemPrompt: getSystemPrompt(),
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
    if (!seed.trim()) {
      toast.error('Please enter a seed keyword');
      return;
    }
    setGenerating(true);
    setGenError('');
    setResult(null);

    const searchQuery = `${seed} keywords SEO ${market} ecommerce search volume`;
    searchQueryRef.current = searchQuery;

    const prompt = [`Seed keyword: ${seed}`, `Platform: ${platform}`, `Market: ${market}`]
      .filter(Boolean)
      .join('\n');
    sendMessage({ text: prompt });
    setWaitingForResponse(true);
  }, [seed, platform, market, sendMessage]);

  const isLoading = generating || status === 'streaming' || status === 'submitted';

  const sortedKeywords =
    result?.keywords.slice().sort((a, b) => {
      if (sortBy === 'opportunity') return b.opportunity - a.opportunity;
      if (sortBy === 'difficulty') return a.difficulty - b.difficulty;
      return 0;
    }) || [];

  return (
    <div
      className="h-full flex flex-col"
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
          <Hash size={15} style={{ color: '#4ab8f5' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-sm font-extrabold leading-tight"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Keyword Miner
          </div>
          <div className="text-xs" style={{ color: '#9CA3AF' }}>
            SEO & PPC keyword research · Opportunity scoring · Ad group suggestions
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
              border: '1px solid #F5F5F5',
              color: '#94A3B8',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={11} /> New Search
          </button>
        )}
      </div>

      <ActiveProductBanner ctaLabel="Load into tool" onUseProduct={(summary) => setSeed(summary)} />

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        <div
          className="w-full lg:w-72 flex-shrink-0 overflow-y-auto border-b lg:border-b-0 lg:border-r p-4 space-y-4"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <div className="space-y-3">
            <div>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: '#CBD5E1', fontFamily: "'Syne', sans-serif" }}
              >
                Seed Keyword *
              </label>
              <input
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
                placeholder="e.g. posture corrector, yoga mat…"
                className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid #F0F0F0',
                  color: '#CBD5E1',
                }}
              />
            </div>
            <div>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: '#CBD5E1', fontFamily: "'Syne', sans-serif" }}
              >
                Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid #F0F0F0',
                  color: '#CBD5E1',
                }}
              >
                {['Google', 'Amazon', 'Meta Ads', 'TikTok'].map((p) => (
                  <option key={p} value={p} style={{ background: '#0d0d10' }}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: '#CBD5E1', fontFamily: "'Syne', sans-serif" }}
              >
                Market
              </label>
              <select
                value={market}
                onChange={(e) => setMarket(e.target.value)}
                className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid #F0F0F0',
                  color: '#CBD5E1',
                }}
              >
                {['Australia', 'United States', 'United Kingdom', 'Global'].map((m) => (
                  <option key={m} value={m} style={{ background: '#0d0d10' }}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-extrabold text-sm transition-all"
            style={{
              background: isLoading ? 'rgba(74,184,245,0.25)' : '#4ab8f5',
              color: '#FAFAFA',
              fontFamily: "'Syne', sans-serif",
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Mining…
              </>
            ) : (
              <>
                <Hash size={14} /> Mine Keywords
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
                  background: 'rgba(74,184,245,0.1)',
                  border: '1px solid rgba(74,184,245,0.2)',
                }}
              >
                <Hash size={24} style={{ color: '#4ab8f5' }} className="animate-pulse" />
              </div>
              <div className="text-center">
                <div className="text-sm font-extrabold mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
                  Mining keywords for "{seed}"…
                </div>
                <div className="text-xs" style={{ color: '#9CA3AF' }}>
                  Analysing search intent and opportunity
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4 max-w-4xl">
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
                    style={{ color: '#4ab8f5', fontFamily: "'Syne', sans-serif" }}
                  >
                    Keyword Landscape
                  </div>
                  <CopyBtn text={result.summary} />
                </div>
                <div className="text-sm leading-relaxed" style={{ color: '#E2E8F0' }}>
                  {result.summary}
                </div>
              </div>

              {/* Keyword table */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{
                    background: '#05070F',
                    borderBottom: '1px solid #F9FAFB',
                  }}
                >
                  <div
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: '#9CA3AF', fontFamily: "'Syne', sans-serif" }}
                  >
                    {result.keywords.length} Keywords
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: '#9CA3AF' }}>
                      Sort:
                    </span>
                    {(['opportunity', 'difficulty'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setSortBy(s)}
                        className="text-xs px-2 py-0.5 rounded capitalize"
                        style={{
                          background: sortBy === s ? 'rgba(74,184,245,0.15)' : 'transparent',
                          color: sortBy === s ? '#4ab8f5' : '#9CA3AF',
                          cursor: 'pointer',
                        }}
                      >
                        {s}
                      </button>
                    ))}
                    <CopyBtn text={result.keywords.map((k) => k.keyword).join('\n')} label="All" />
                  </div>
                </div>
                <div className="divide-y" style={{ borderColor: '#F9FAFB' }}>
                  {sortedKeywords.map((kw, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[#0d0d10]/[0.02] transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold" style={{ color: '#CBD5E1' }}>
                          {kw.keyword}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                          {kw.useCase}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 text-xs">
                        <span
                          style={{
                            color: '#94A3B8',
                            minWidth: '70px',
                            textAlign: 'right',
                          }}
                        >
                          {kw.searchVolume}
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded text-xs"
                          style={{
                            background: `${INTENT_COLORS[kw.intent]}15`,
                            color: INTENT_COLORS[kw.intent],
                          }}
                        >
                          {kw.intent.slice(0, 4)}
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded text-xs"
                          style={{
                            background: `${COMPETITION_COLORS[kw.competition]}15`,
                            color: COMPETITION_COLORS[kw.competition],
                          }}
                        >
                          {kw.competition}
                        </span>
                        <span
                          className="font-extrabold"
                          style={{
                            color:
                              kw.opportunity >= 70
                                ? '#4f8ef7'
                                : kw.opportunity >= 50
                                  ? '#4f8ef7'
                                  : '#e05c7a',
                            fontFamily: "'Syne', sans-serif",
                            minWidth: '28px',
                            textAlign: 'right',
                          }}
                        >
                          {kw.opportunity}
                        </span>
                        <CopyBtn text={kw.keyword} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top opportunity */}
              <div
                className="p-4 rounded-2xl"
                style={{
                  background: 'rgba(79,142,247,0.05)',
                  border: '1px solid rgba(79,142,247,0.15)',
                }}
              >
                <div
                  className="text-xs font-bold uppercase tracking-widest mb-2"
                  style={{ color: '#4f8ef7', fontFamily: "'Syne', sans-serif" }}
                >
                  Top Opportunity
                </div>
                <div className="text-sm leading-relaxed" style={{ color: '#E2E8F0' }}>
                  {result.topOpportunity}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div
                  className="p-4 rounded-2xl"
                  style={{
                    background: '#05070F',
                    border: '1px solid #F9FAFB',
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{ color: '#9CA3AF', fontFamily: "'Syne', sans-serif" }}
                    >
                      Content Ideas
                    </div>
                    <CopyBtn text={result.contentIdeas.join('\n')} />
                  </div>
                  <div className="space-y-1.5">
                    {result.contentIdeas.map((idea, i) => (
                      <div
                        key={i}
                        className="text-xs flex items-start gap-1.5"
                        style={{ color: '#94A3B8' }}
                      >
                        <span style={{ color: '#4ab8f5', flexShrink: 0 }}>→</span>
                        {idea}
                      </div>
                    ))}
                  </div>
                </div>
                <div
                  className="p-4 rounded-2xl"
                  style={{
                    background: '#05070F',
                    border: '1px solid #F9FAFB',
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{ color: '#9CA3AF', fontFamily: "'Syne', sans-serif" }}
                    >
                      Ad Groups
                    </div>
                    <CopyBtn text={result.adGroupSuggestions.join('\n')} />
                  </div>
                  <div className="space-y-1.5">
                    {result.adGroupSuggestions.map((ag, i) => (
                      <div
                        key={i}
                        className="text-xs flex items-start gap-1.5"
                        style={{ color: '#94A3B8' }}
                      >
                        <span style={{ color: '#4f8ef7', flexShrink: 0 }}>→</span>
                        {ag}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !result && (
            <div className="h-full flex flex-col items-center justify-center gap-4 p-8">
              <div className="text-5xl">#️⃣</div>
              <div className="text-center">
                <div
                  className="text-base font-extrabold mb-2"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  Uncover high-value keywords
                </div>
                <div
                  className="text-xs max-w-xs leading-relaxed"
                  style={{ color: '#9CA3AF' }}
                >
                  Enter a seed keyword to get 12-15 scored keywords with search volume, competition,
                  intent, and ad group suggestions.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
