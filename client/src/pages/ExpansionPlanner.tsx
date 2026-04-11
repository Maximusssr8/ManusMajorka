import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Globe,
  Loader2,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { SaveToProduct } from '@/components/SaveToProduct';

interface Market {
  name: string;
  score: number;
  population: string;
  ecomPenetration: string;
  opportunity: string;
  challenges: string[];
  entryStrategy: string;
  timeline: string;
}
interface ExpansionResult {
  summary: string;
  markets: Market[];
  readinessChecklist: { item: string; ready: boolean }[];
}

export default function ExpansionPlanner() {
  const [currentMarket, setCurrentMarket] = useState('');
  const [productType, setProductType] = useState('');
  const [monthlyRevenue, setMonthlyRevenue] = useState('');
  const [targetRegions, setTargetRegions] = useState('');
  const [budget, setBudget] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<ExpansionResult | null>(null);

  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      prepareSendMessagesRequest({ messages }: any) {
        return {
          body: {
            messages: messages.map((m: any) => ({
              role: m.role,
              content:
                m.parts
                  ?.filter((p: any) => p.type === 'text')
                  .map((p: any) => p.text)
                  .join('') || '',
            })),
            systemPrompt: `You are a global e-commerce expansion strategist. Output JSON: {"summary":"overview","markets":[{"name":"UK","score":85,"population":"67M","ecomPenetration":"87%","opportunity":"description","challenges":["c1","c2"],"entryStrategy":"strategy","timeline":"3-6 months"}],"readinessChecklist":[{"item":"International shipping set up","ready":false}]}. Include 3-5 markets and 6-8 checklist items. Output ONLY JSON.`,
          },
        };
      },
    }),
  });

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === 'assistant') {
      const text =
        last.parts
          ?.filter((p: any) => p.type === 'text')
          .map((p: any) => p.text)
          .join('') || '';
      try {
        const parsed = JSON.parse(
          text
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim()
        );
        if (parsed.markets) {
          setResult(parsed);
          setGenerating(false);
          toast.success('Expansion plan generated!');
        }
      } catch {
        /* streaming */
      }
    }
  }, [messages]);

  const handleGenerate = useCallback(async () => {
    if (!currentMarket || !productType) {
      toast.error('Fill in current market and product type.');
      return;
    }
    setGenerating(true);
    setResult(null);
    sendMessage({
      text: `Create an expansion plan:\n- Current market: ${currentMarket}\n- Product: ${productType}\n- Revenue: $${monthlyRevenue || 'N/A'}/mo\n- Target regions: ${targetRegions || 'Open to suggestions'}\n- Budget: $${budget || 'N/A'}`,
    });
  }, [currentMarket, productType, monthlyRevenue, targetRegions, budget, sendMessage]);

  const copyAll = () => {
    if (!result) return;
    navigator.clipboard.writeText(
      `Expansion Plan\n${result.summary}\n\n${result.markets.map((m) => `${m.name} (Score: ${m.score})\nOpportunity: ${m.opportunity}\nEntry: ${m.entryStrategy}\nTimeline: ${m.timeline}`).join('\n\n')}`
    );
    toast.success('Copied!');
  };

  return (
    <div
      className="h-full flex"
      style={{ background: '#05070F', color: '#F8FAFC', fontFamily: 'DM Sans, sans-serif' }}
    >
      <div
        className="w-80 flex-shrink-0 overflow-y-auto border-r p-5 space-y-4"
        style={{ borderColor: 'rgba(255,255,255,0.08)', scrollbarWidth: 'thin' }}
      >
        <div className="flex items-center gap-2.5 mb-1">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: 'rgba(59,130,246,0.12)',
              border: '1px solid rgba(59,130,246,0.3)',
            }}
          >
            <Globe size={15} style={{ color: '#3B82F6' }} />
          </div>
          <div>
            <div className="text-sm font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              Expansion Planner
            </div>
            <div className="text-xs" style={{ color: '#9CA3AF' }}>
              New markets · Entry strategy
            </div>
          </div>
        </div>

        {[
          {
            label: 'Current Market',
            value: currentMarket,
            set: setCurrentMarket,
            placeholder: 'e.g. Australia',
            req: true,
          },
          {
            label: 'Product Type',
            value: productType,
            set: setProductType,
            placeholder: 'e.g. Skincare, Pet toys',
            req: true,
          },
          {
            label: 'Monthly Revenue ($)',
            value: monthlyRevenue,
            set: setMonthlyRevenue,
            placeholder: 'e.g. 15000',
          },
          {
            label: 'Target Regions',
            value: targetRegions,
            set: setTargetRegions,
            placeholder: 'e.g. UK, US, EU',
          },
          {
            label: 'Expansion Budget ($)',
            value: budget,
            set: setBudget,
            placeholder: 'e.g. 5000',
          },
        ].map(({ label, value, set, placeholder, req }) => (
          <div key={label}>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-1.5"
              style={{ color: '#9CA3AF', fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              {label} {req && <span style={{ color: '#3B82F6' }}>*</span>}
            </label>
            <input
              value={value}
              onChange={(e) => set(e.target.value)}
              placeholder={placeholder}
              className="w-full text-xs px-3 py-2.5 rounded-lg outline-none"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1.5px solid #F5F5F5',
                color: '#CBD5E1',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(59,130,246,0.45)')}
              onBlur={(e) => (e.target.style.borderColor = '#F5F5F5')}
            />
          </div>
        ))}

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full py-3 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
          style={{
            background: generating
              ? 'rgba(59,130,246,0.25)'
              : 'linear-gradient(135deg, #3B82F6, #F59E0B)',
            color: '#FAFAFA',
            fontFamily: "'Bricolage Grotesque', sans-serif",
            boxShadow: generating ? 'none' : '0 4px 20px rgba(59,130,246,0.3)',
            cursor: generating ? 'not-allowed' : 'pointer',
          }}
        >
          {generating ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Planning…
            </>
          ) : (
            <>
              <Globe size={14} /> Generate Plan
            </>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: 'thin' }}>
        {result ? (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                Expansion Strategy
              </h2>
              <SaveToProduct
                toolId="expansion-planner"
                toolName="Expansion Planner"
                outputData={result}
              />
              <button
                onClick={copyAll}
                className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid #F0F0F0',
                  color: '#CBD5E1',
                  cursor: 'pointer',
                }}
              >
                <Copy size={11} /> Copy All
              </button>
            </div>

            <div
              className="rounded-xl p-4"
              style={{
                background: 'rgba(59,130,246,0.06)',
                border: '1px solid rgba(59,130,246,0.2)',
              }}
            >
              <div className="text-xs leading-relaxed" style={{ color: '#CBD5E1' }}>
                {result.summary}
              </div>
            </div>

            {/* Market Cards */}
            <div className="space-y-4">
              {result.markets.map((m, i) => (
                <div
                  key={i}
                  className="rounded-xl overflow-hidden"
                  style={{
                    background: '#05070F',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div
                    className="px-4 py-3 border-b flex items-center justify-between"
                    style={{ borderColor: 'rgba(255,255,255,0.08)' }}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin size={14} style={{ color: '#3B82F6' }} />
                      <span
                        className="text-sm font-extrabold"
                        style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                      >
                        {m.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: '#9CA3AF' }}>
                        Pop: {m.population}
                      </span>
                      <span className="text-xs" style={{ color: '#9CA3AF' }}>
                        E-com: {m.ecomPenetration}
                      </span>
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background:
                            m.score >= 70 ? 'rgba(59,130,246,0.18)' : 'rgba(240,192,64,0.12)',
                          color: m.score >= 70 ? '#3B82F6' : '#F59E0B',
                        }}
                      >
                        {m.score}/100
                      </span>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <div
                        className="text-xs font-bold mb-1"
                        style={{ color: '#3B82F6', fontFamily: "'Bricolage Grotesque', sans-serif" }}
                      >
                        Opportunity
                      </div>
                      <div
                        className="text-xs leading-relaxed"
                        style={{ color: '#CBD5E1' }}
                      >
                        {m.opportunity}
                      </div>
                    </div>
                    <div>
                      <div
                        className="text-xs font-bold mb-1"
                        style={{ color: '#ff6b6b', fontFamily: "'Bricolage Grotesque', sans-serif" }}
                      >
                        Challenges
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {m.challenges.map((c, j) => (
                          <span
                            key={j}
                            className="text-xs px-2 py-1 rounded-lg"
                            style={{
                              background: 'rgba(255,100,100,0.08)',
                              border: '1px solid rgba(255,100,100,0.15)',
                              color: 'rgba(255,150,150,0.8)',
                            }}
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <div
                          className="text-xs font-bold mb-1"
                          style={{ color: '#3B82F6', fontFamily: "'Bricolage Grotesque', sans-serif" }}
                        >
                          Entry Strategy
                        </div>
                        <div
                          className="text-xs leading-relaxed"
                          style={{ color: '#CBD5E1' }}
                        >
                          {m.entryStrategy}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <div
                          className="text-xs font-bold mb-1"
                          style={{ color: '#7c6af5', fontFamily: "'Bricolage Grotesque', sans-serif" }}
                        >
                          Timeline
                        </div>
                        <div className="text-xs font-semibold" style={{ color: '#7c6af5' }}>
                          {m.timeline}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Readiness Checklist */}
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: '#05070F',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <div
                  className="text-xs font-extrabold uppercase tracking-widest"
                  style={{ color: '#00b4d8', fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  Expansion Readiness Checklist
                </div>
              </div>
              {result.readinessChecklist.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-2.5"
                  style={{
                    borderBottom:
                      i < result.readinessChecklist.length - 1
                        ? '1px solid #F9FAFB'
                        : 'none',
                  }}
                >
                  {item.ready ? (
                    <CheckCircle2 size={14} style={{ color: '#3B82F6' }} />
                  ) : (
                    <AlertTriangle size={14} style={{ color: '#F59E0B' }} />
                  )}
                  <span className="text-xs" style={{ color: '#94A3B8' }}>
                    {item.item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            {generating ? (
              <div className="text-center">
                <Loader2
                  size={32}
                  className="animate-spin mx-auto mb-4"
                  style={{ color: '#3B82F6' }}
                />
                <div className="text-sm font-bold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                  Planning your expansion…
                </div>
              </div>
            ) : (
              <>
                <div className="text-5xl">🌍</div>
                <div className="text-center">
                  <div
                    className="text-base font-extrabold mb-2"
                    style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                  >
                    Expansion Planner
                  </div>
                  <div
                    className="text-xs max-w-xs leading-relaxed"
                    style={{ color: '#9CA3AF' }}
                  >
                    Enter your current market and product details to get a ranked list of expansion
                    opportunities with entry strategies.
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
