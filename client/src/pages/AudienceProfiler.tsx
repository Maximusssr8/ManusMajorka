import { useChat } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import { DefaultChatTransport } from 'ai';
import { Check, Copy, Loader2, RefreshCw, Users } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { SaveToProduct } from '@/components/SaveToProduct';

interface Persona {
  name: string;
  age: string;
  gender: string;
  location: string;
  occupation: string;
  income: string;
  painPoints: string[];
  desires: string[];
  buyingTriggers: string[];
  objections: string[];
  preferredChannels: string[];
  contentTypes: string[];
  messagingAngle: string;
  adHook: string;
  estimatedSize: string;
}

interface AudienceResult {
  productSummary: string;
  personas: Persona[];
  primaryPersona: string;
  messagingFramework: string;
  channelStrategy: string;
}

const SYSTEM_PROMPT = `You are an expert ecommerce audience strategist and consumer psychologist.
When given a product/niche, return a JSON object with this EXACT structure (no markdown, just raw JSON):
{"productSummary":"Brief product summary","personas":[{"name":"Persona name (e.g. 'Busy Mum Sarah')","age":"e.g. 28-38","gender":"e.g. Female","location":"e.g. Suburban Australia","occupation":"e.g. Part-time nurse, mother of 2","income":"e.g. $60K-90K household","painPoints":["Pain 1","Pain 2","Pain 3"],"desires":["Desire 1","Desire 2","Desire 3"],"buyingTriggers":["Trigger 1","Trigger 2","Trigger 3"],"objections":["Objection 1","Objection 2"],"preferredChannels":["Facebook","Instagram","etc"],"contentTypes":["Video testimonials","Before/after","etc"],"messagingAngle":"Core message that resonates with this persona","adHook":"Scroll-stopping ad hook for this persona","estimatedSize":"e.g. 2-5M in Australia"}],"primaryPersona":"Name of the highest-value persona and why","messagingFramework":"Overall messaging strategy across personas","channelStrategy":"Channel prioritisation and budget split recommendation"}
Return 3 distinct personas. Return ONLY raw JSON.`;

function parseResult(text: string): AudienceResult | null {
  try {
    const stripped = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    const start = stripped.indexOf('{');
    const end = stripped.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    const parsed = JSON.parse(stripped.slice(start, end + 1));
    if (!parsed.personas || !Array.isArray(parsed.personas)) return null;
    return parsed as AudienceResult;
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
        background: copied ? 'rgba(79,142,247,0.08)' : '#F9FAFB',
        border: `1px solid ${copied ? '#C7D2FE' : '#F5F5F5'}`,
        color: copied ? 'rgba(79,142,247,1.00)' : '#9CA3AF',
        cursor: 'pointer',
      }}
    >
      {copied ? <Check size={9} /> : <Copy size={9} />}
    </button>
  );
}

const PERSONA_COLORS = [
  { accent: '#9c5fff', bg: 'rgba(156,95,255,0.06)', border: 'rgba(156,95,255,0.2)' },
  { accent: '#e05c7a', bg: 'rgba(224,92,122,0.06)', border: 'rgba(224,92,122,0.2)' },
  { accent: '#4ab8f5', bg: 'rgba(74,184,245,0.06)', border: 'rgba(74,184,245,0.2)' },
];

function PersonaCard({ persona, index }: { persona: Persona; index: number }) {
  const [tab, setTab] = useState<'profile' | 'psychology' | 'messaging'>('profile');
  const c = PERSONA_COLORS[index % PERSONA_COLORS.length]!;
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: c.bg, border: `1.5px solid ${c.border}` }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div
              className="text-sm font-extrabold"
              style={{ fontFamily: "'Syne', sans-serif", color: '#CBD5E1' }}
            >
              {persona.name}
            </div>
            <div className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
              {persona.age} · {persona.gender} · {persona.location}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold" style={{ color: c.accent }}>
              {persona.occupation}
            </div>
            <div className="text-xs" style={{ color: '#9CA3AF' }}>
              {persona.income}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-3 p-1 rounded-lg" style={{ background: 'rgba(0,0,0,0.2)' }}>
          {(['profile', 'psychology', 'messaging'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 text-xs py-1.5 rounded-md capitalize font-semibold transition-all"
              style={{
                background: tab === t ? c.accent : 'transparent',
                color: tab === t ? '#FAFAFA' : '#9CA3AF',
                cursor: 'pointer',
                fontFamily: "'Syne', sans-serif",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl" style={{ background: 'rgba(0,0,0,0.15)' }}>
                <div
                  className="text-xs font-bold uppercase tracking-wider mb-1.5"
                  style={{ color: '#9CA3AF', fontFamily: "'Syne', sans-serif" }}
                >
                  Pain Points
                </div>
                {persona.painPoints.map((p, i) => (
                  <div
                    key={i}
                    className="text-xs flex items-start gap-1.5 mb-1"
                    style={{ color: '#CBD5E1' }}
                  >
                    <span style={{ color: '#e05c7a', flexShrink: 0 }}>✕</span>
                    {p}
                  </div>
                ))}
              </div>
              <div className="p-2.5 rounded-xl" style={{ background: 'rgba(0,0,0,0.15)' }}>
                <div
                  className="text-xs font-bold uppercase tracking-wider mb-1.5"
                  style={{ color: '#9CA3AF', fontFamily: "'Syne', sans-serif" }}
                >
                  Desires
                </div>
                {persona.desires.map((d, i) => (
                  <div
                    key={i}
                    className="text-xs flex items-start gap-1.5 mb-1"
                    style={{ color: '#CBD5E1' }}
                  >
                    <span style={{ color: '#4f8ef7', flexShrink: 0 }}>✓</span>
                    {d}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-2.5 rounded-xl" style={{ background: 'rgba(0,0,0,0.15)' }}>
              <div
                className="text-xs font-bold uppercase tracking-wider mb-1.5"
                style={{ color: '#9CA3AF', fontFamily: "'Syne', sans-serif" }}
              >
                Audience Size
              </div>
              <div
                className="text-sm font-extrabold"
                style={{ color: c.accent, fontFamily: "'Syne', sans-serif" }}
              >
                {persona.estimatedSize}
              </div>
            </div>
          </div>
        )}

        {tab === 'psychology' && (
          <div className="space-y-3">
            <div className="p-2.5 rounded-xl" style={{ background: 'rgba(0,0,0,0.15)' }}>
              <div
                className="text-xs font-bold uppercase tracking-wider mb-1.5"
                style={{ color: '#9CA3AF', fontFamily: "'Syne', sans-serif" }}
              >
                Buying Triggers
              </div>
              {persona.buyingTriggers.map((t, i) => (
                <div
                  key={i}
                  className="text-xs flex items-start gap-1.5 mb-1"
                  style={{ color: '#CBD5E1' }}
                >
                  <span style={{ color: '#4f8ef7', flexShrink: 0 }}>→</span>
                  {t}
                </div>
              ))}
            </div>
            <div className="p-2.5 rounded-xl" style={{ background: 'rgba(0,0,0,0.15)' }}>
              <div
                className="text-xs font-bold uppercase tracking-wider mb-1.5"
                style={{ color: '#9CA3AF', fontFamily: "'Syne', sans-serif" }}
              >
                Objections to Overcome
              </div>
              {persona.objections.map((o, i) => (
                <div
                  key={i}
                  className="text-xs flex items-start gap-1.5 mb-1"
                  style={{ color: '#CBD5E1' }}
                >
                  <span style={{ color: '#e05c7a', flexShrink: 0 }}>!</span>
                  {o}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl" style={{ background: 'rgba(0,0,0,0.15)' }}>
                <div
                  className="text-xs font-bold uppercase tracking-wider mb-1.5"
                  style={{ color: '#9CA3AF', fontFamily: "'Syne', sans-serif" }}
                >
                  Channels
                </div>
                <div className="flex flex-wrap gap-1">
                  {persona.preferredChannels.map((ch, i) => (
                    <span
                      key={i}
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{ background: `${c.accent}18`, color: c.accent }}
                    >
                      {ch}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-2.5 rounded-xl" style={{ background: 'rgba(0,0,0,0.15)' }}>
                <div
                  className="text-xs font-bold uppercase tracking-wider mb-1.5"
                  style={{ color: '#9CA3AF', fontFamily: "'Syne', sans-serif" }}
                >
                  Content Types
                </div>
                <div className="flex flex-wrap gap-1">
                  {persona.contentTypes.map((ct, i) => (
                    <span
                      key={i}
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        color: '#94A3B8',
                      }}
                    >
                      {ct}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'messaging' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <div className="flex items-center justify-between mb-1.5">
                <div
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: c.accent, fontFamily: "'Syne', sans-serif" }}
                >
                  Messaging Angle
                </div>
                <CopyBtn text={persona.messagingAngle} />
              </div>
              <div className="text-xs leading-relaxed" style={{ color: '#CBD5E1' }}>
                {persona.messagingAngle}
              </div>
            </div>
            <div
              className="p-3 rounded-xl"
              style={{
                background: 'rgba(79,142,247,0.06)',
                border: '1px solid rgba(79,142,247,0.15)',
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: '#4f8ef7', fontFamily: "'Syne', sans-serif" }}
                >
                  🎣 Ad Hook
                </div>
                <CopyBtn text={persona.adHook} />
              </div>
              <div className="text-sm font-semibold leading-relaxed" style={{ color: '#CBD5E1' }}>
                {persona.adHook}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AudienceProfiler() {
  const [product, setProduct] = useState('');
  const [pricePoint, setPricePoint] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<AudienceResult | null>(null);
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
    if (!product.trim()) {
      toast.error('Please enter a product');
      return;
    }
    setGenerating(true);
    setGenError('');
    setResult(null);

    const searchQuery = `${product} target audience customer demographics Australia`;
    searchQueryRef.current = searchQuery;

    const prompt = [`Product: ${product}`, pricePoint && `Price point: $${pricePoint}`]
      .filter(Boolean)
      .join('\n');
    sendMessage({ text: prompt });
    setWaitingForResponse(true);
  }, [product, pricePoint, sendMessage]);

  const isLoading = generating || status === 'streaming' || status === 'submitted';

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
          style={{ background: 'rgba(156,95,255,0.15)', border: '1px solid rgba(156,95,255,0.3)' }}
        >
          <Users size={15} style={{ color: '#9c5fff' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-sm font-extrabold leading-tight"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Audience Profiler
          </div>
          <div className="text-xs" style={{ color: '#9CA3AF' }}>
            3 buyer personas · Pain points · Ad hooks · Channel strategy
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
            <RefreshCw size={11} /> New Profile
          </button>
        )}
      </div>

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
                placeholder="e.g. Posture corrector belt…"
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
                Price Point (AUD)
              </label>
              <input
                value={pricePoint}
                onChange={(e) => setPricePoint(e.target.value)}
                placeholder="e.g. 49"
                className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid #F0F0F0',
                  color: '#CBD5E1',
                }}
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-extrabold text-sm transition-all"
            style={{
              background: isLoading ? 'rgba(156,95,255,0.25)' : '#9c5fff',
              color: '#fff',
              fontFamily: "'Syne', sans-serif",
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Profiling…
              </>
            ) : (
              <>
                <Users size={14} /> Build Audience Profile
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
                <Users size={24} style={{ color: '#9c5fff' }} className="animate-pulse" />
              </div>
              <div className="text-center">
                <div className="text-sm font-extrabold mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
                  Building audience profiles…
                </div>
                <div className="text-xs" style={{ color: '#9CA3AF' }}>
                  Analysing buyer psychology and demographics
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
                <div
                  className="text-xs font-bold uppercase tracking-widest mb-2"
                  style={{ color: '#9c5fff', fontFamily: "'Syne', sans-serif" }}
                >
                  Primary Persona
                </div>
                <div className="text-sm leading-relaxed" style={{ color: '#E2E8F0' }}>
                  {result.primaryPersona}
                </div>
              </div>

              <div className="space-y-4">
                {result.personas.map((p, i) => (
                  <PersonaCard key={i} persona={p} index={i} />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div
                  className="p-4 rounded-2xl"
                  style={{
                    background: '#05070F',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div
                    className="text-xs font-bold uppercase tracking-widest mb-2"
                    style={{ color: '#9CA3AF', fontFamily: "'Syne', sans-serif" }}
                  >
                    Messaging Framework
                  </div>
                  <div
                    className="text-xs leading-relaxed"
                    style={{ color: '#94A3B8' }}
                  >
                    {result.messagingFramework}
                  </div>
                </div>
                <div
                  className="p-4 rounded-2xl"
                  style={{
                    background: '#05070F',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div
                    className="text-xs font-bold uppercase tracking-widest mb-2"
                    style={{ color: '#9CA3AF', fontFamily: "'Syne', sans-serif" }}
                  >
                    Channel Strategy
                  </div>
                  <div
                    className="text-xs leading-relaxed"
                    style={{ color: '#94A3B8' }}
                  >
                    {result.channelStrategy}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !result && (
            <div className="h-full flex flex-col items-center justify-center gap-4 p-8">
              <div className="text-5xl">👥</div>
              <div className="text-center">
                <div
                  className="text-base font-extrabold mb-2"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  Know your buyer inside out
                </div>
                <div
                  className="text-xs max-w-xs leading-relaxed"
                  style={{ color: '#9CA3AF' }}
                >
                  Enter a product to get 3 detailed buyer personas with pain points, buying
                  triggers, ad hooks, and channel strategy.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
