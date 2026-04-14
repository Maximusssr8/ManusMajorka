import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { ArrowRight, BarChart3, Copy, Loader2, TrendingDown, TrendingUp } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { SaveToProduct } from '@/components/SaveToProduct';

interface KPI {
  name: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'flat';
  insight: string;
}
interface AnalyticsResult {
  kpis: KPI[];
  insights: string[];
  actions: string[];
  summary: string;
}

export default function AnalyticsDecoder() {
  const [revenue, setRevenue] = useState('');
  const [sessions, setSessions] = useState('');
  const [convRate, setConvRate] = useState('');
  const [aov, setAov] = useState('');
  const [adSpend, setAdSpend] = useState('');
  const [returnRate, setReturnRate] = useState('');
  const [bounceRate, setBounceRate] = useState('');
  const [cartAbandonment, setCartAbandonment] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<AnalyticsResult | null>(null);

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
            systemPrompt: `You are an e-commerce analytics expert. Analyze the provided metrics and output a JSON object: {"summary":"overview paragraph","kpis":[{"name":"Revenue","value":"$12,500","change":"+15%","trend":"up","insight":"Above industry average"}],"insights":["insight1","insight2"],"actions":["action1","action2"]}. Include 6-8 KPIs with benchmarks, 4-5 insights, and 3-4 action items. Output ONLY JSON.`,
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
        const cleaned = text
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.kpis) {
          setResult(parsed);
          setGenerating(false);
          toast.success('Analytics decoded!');
        }
      } catch {
        /* still streaming */
      }
    }
  }, [messages]);

  const handleGenerate = useCallback(async () => {
    if (!revenue && !sessions) {
      toast.error('Enter at least revenue or sessions.');
      return;
    }
    setGenerating(true);
    setResult(null);
    sendMessage({
      text: `Decode these e-commerce analytics:\n- Monthly Revenue: $${revenue || 'N/A'}\n- Sessions: ${sessions || 'N/A'}\n- Conversion Rate: ${convRate || 'N/A'}%\n- Average Order Value: $${aov || 'N/A'}\n- Ad Spend: $${adSpend || 'N/A'}\n- Return Rate: ${returnRate || 'N/A'}%\n- Bounce Rate: ${bounceRate || 'N/A'}%\n- Cart Abandonment: ${cartAbandonment || 'N/A'}%\n\nProvide KPIs with industry benchmarks, key insights, and recommended actions.`,
    });
  }, [
    revenue,
    sessions,
    convRate,
    aov,
    adSpend,
    returnRate,
    bounceRate,
    cartAbandonment,
    sendMessage,
  ]);

  const copyAll = () => {
    if (!result) return;
    const text = `Analytics Report\n${result.summary}\n\nKPIs:\n${result.kpis.map((k) => `${k.name}: ${k.value} (${k.change}) — ${k.insight}`).join('\n')}\n\nInsights:\n${result.insights.map((i, n) => `${n + 1}. ${i}`).join('\n')}\n\nActions:\n${result.actions.map((a, n) => `${n + 1}. ${a}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  return (
    <div
      className="h-full flex"
      style={{ background: '#05070F', color: '#F8FAFC', fontFamily: 'DM Sans, sans-serif' }}
    >
      {/* LEFT */}
      <div
        className="w-80 flex-shrink-0 overflow-y-auto border-r p-5 space-y-4"
        style={{ borderColor: 'rgba(255,255,255,0.08)', scrollbarWidth: 'thin' }}
      >
        <div className="flex items-center gap-2.5 mb-1">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: 'rgba(244,114,182,0.12)',
              border: '1px solid rgba(244,114,182,0.3)',
            }}
          >
            <BarChart3 size={15} style={{ color: '#f472b6' }} />
          </div>
          <div>
            <div className="text-sm font-extrabold" style={{ fontFamily: "'Syne', sans-serif" }}>
              Analytics Decoder
            </div>
            <div className="text-xs" style={{ color: '#9CA3AF' }}>
              KPIs · Benchmarks · Actions
            </div>
          </div>
        </div>

        {[
          {
            label: 'Monthly Revenue ($)',
            value: revenue,
            set: setRevenue,
            placeholder: 'e.g. 12500',
          },
          {
            label: 'Monthly Sessions',
            value: sessions,
            set: setSessions,
            placeholder: 'e.g. 15000',
          },
          {
            label: 'Conversion Rate (%)',
            value: convRate,
            set: setConvRate,
            placeholder: 'e.g. 2.1',
          },
          { label: 'Average Order Value ($)', value: aov, set: setAov, placeholder: 'e.g. 65' },
          {
            label: 'Monthly Ad Spend ($)',
            value: adSpend,
            set: setAdSpend,
            placeholder: 'e.g. 3000',
          },
          {
            label: 'Return Rate (%)',
            value: returnRate,
            set: setReturnRate,
            placeholder: 'e.g. 5',
          },
          {
            label: 'Bounce Rate (%)',
            value: bounceRate,
            set: setBounceRate,
            placeholder: 'e.g. 45',
          },
          {
            label: 'Cart Abandonment (%)',
            value: cartAbandonment,
            set: setCartAbandonment,
            placeholder: 'e.g. 70',
          },
        ].map(({ label, value, set, placeholder }) => (
          <div key={label}>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-1.5"
              style={{ color: '#9CA3AF', fontFamily: "'Syne', sans-serif" }}
            >
              {label}
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => set(e.target.value)}
              placeholder={placeholder}
              className="w-full text-xs px-3 py-2.5 rounded-lg outline-none"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1.5px solid #F5F5F5',
                color: '#CBD5E1',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(244,114,182,0.45)')}
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
              ? 'rgba(244,114,182,0.25)'
              : 'linear-gradient(135deg, #f472b6, #ec4899)',
            color: '#fff',
            fontFamily: "'Syne', sans-serif",
            boxShadow: generating ? 'none' : '0 4px 20px rgba(244,114,182,0.3)',
            cursor: generating ? 'not-allowed' : 'pointer',
          }}
        >
          {generating ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Analyzing…
            </>
          ) : (
            <>
              <BarChart3 size={14} /> Decode Analytics
            </>
          )}
        </button>
      </div>

      {/* RIGHT */}
      <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: 'thin' }}>
        {result ? (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold" style={{ fontFamily: "'Syne', sans-serif" }}>
                Analytics Report
              </h2>
              <SaveToProduct
                toolId="analytics-decoder"
                toolName="Analytics Decoder"
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
                background: 'rgba(244,114,182,0.06)',
                border: '1px solid rgba(244,114,182,0.2)',
              }}
            >
              <div className="text-xs leading-relaxed" style={{ color: '#CBD5E1' }}>
                {result.summary}
              </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 gap-3">
              {result.kpis.map((kpi, i) => (
                <div
                  key={i}
                  className="rounded-xl p-4"
                  style={{
                    background: '#05070F',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs" style={{ color: '#9CA3AF' }}>
                      {kpi.name}
                    </span>
                    <div
                      className="flex items-center gap-1 text-xs font-semibold"
                      style={{
                        color:
                          kpi.trend === 'up'
                            ? '#6366F1'
                            : kpi.trend === 'down'
                              ? '#ff6b6b'
                              : '#F59E0B',
                      }}
                    >
                      {kpi.trend === 'up' ? (
                        <TrendingUp size={11} />
                      ) : kpi.trend === 'down' ? (
                        <TrendingDown size={11} />
                      ) : null}
                      {kpi.change}
                    </div>
                  </div>
                  <div
                    className="text-lg font-extrabold mb-1"
                    style={{ fontFamily: "'Syne', sans-serif" }}
                  >
                    {kpi.value}
                  </div>
                  <div className="text-xs" style={{ color: '#9CA3AF' }}>
                    {kpi.insight}
                  </div>
                </div>
              ))}
            </div>

            {/* Insights */}
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
                  style={{ color: '#f472b6', fontFamily: "'Syne', sans-serif" }}
                >
                  Key Insights
                </div>
              </div>
              {result.insights.map((insight, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 px-4 py-3"
                  style={{
                    borderBottom:
                      i < result.insights.length - 1 ? '1px solid #F9FAFB' : 'none',
                  }}
                >
                  <span className="text-xs mt-0.5" style={{ color: '#f472b6' }}>
                    💡
                  </span>
                  <span
                    className="text-xs leading-relaxed"
                    style={{ color: '#94A3B8' }}
                  >
                    {insight}
                  </span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: 'rgba(99,102,241,0.06)',
                border: '1px solid #EEF2FF',
              }}
            >
              <div className="px-4 py-3 border-b" style={{ borderColor: '#EEF2FF' }}>
                <div
                  className="text-xs font-extrabold uppercase tracking-widest"
                  style={{ color: '#6366F1', fontFamily: "'Syne', sans-serif" }}
                >
                  Recommended Actions
                </div>
              </div>
              {result.actions.map((action, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 px-4 py-3"
                  style={{
                    borderBottom:
                      i < result.actions.length - 1 ? '1px solid rgba(99,102,241,0.12)' : 'none',
                  }}
                >
                  <ArrowRight
                    size={12}
                    className="mt-0.5 flex-shrink-0"
                    style={{ color: '#6366F1' }}
                  />
                  <span
                    className="text-xs leading-relaxed"
                    style={{ color: '#94A3B8' }}
                  >
                    {action}
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
                  style={{ color: '#f472b6' }}
                />
                <div className="text-sm font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>
                  Decoding your analytics…
                </div>
                <div className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                  Comparing against industry benchmarks
                </div>
              </div>
            ) : (
              <>
                <div className="text-5xl">📈</div>
                <div className="text-center">
                  <div
                    className="text-base font-extrabold mb-2"
                    style={{ fontFamily: "'Syne', sans-serif" }}
                  >
                    Analytics Decoder
                  </div>
                  <div
                    className="text-xs max-w-xs leading-relaxed"
                    style={{ color: '#9CA3AF' }}
                  >
                    Enter your store metrics to get KPI analysis with industry benchmarks, key
                    insights, and recommended actions.
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
