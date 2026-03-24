import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { ArrowRight, Clock, Copy, Loader2, Settings, Zap } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { SaveToProduct } from '@/components/SaveToProduct';

interface AutomationStep {
  trigger: string;
  action: string;
  tool: string;
  details: string;
}
interface Automation {
  name: string;
  description: string;
  steps: AutomationStep[];
  timeSaved: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tools: string[];
}
interface AutoResult {
  summary: string;
  automations: Automation[];
  totalTimeSaved: string;
}

export default function AutomationBuilder() {
  const [businessType, setBusinessType] = useState('');
  const [painPoints, setPainPoints] = useState('');
  const [currentTools, setCurrentTools] = useState('');
  const [budget, setBudget] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<AutoResult | null>(null);

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
            systemPrompt: `You are an e-commerce automation expert. Output JSON: {"summary":"overview","totalTimeSaved":"15 hrs/week","automations":[{"name":"Order Fulfillment","description":"Auto-process orders","steps":[{"trigger":"New order placed","action":"Send to fulfillment","tool":"Shopify Flow","details":"details"}],"timeSaved":"3 hrs/week","difficulty":"easy","tools":["Shopify Flow","Zapier"]}]}. Include 4-6 automations. Output ONLY JSON.`,
            aiSdk: true,
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
        if (parsed.automations) {
          setResult(parsed);
          setGenerating(false);
          toast.success('Automations generated!');
        }
      } catch {
        /* streaming */
      }
    }
  }, [messages]);

  const handleGenerate = useCallback(async () => {
    if (!businessType) {
      toast.error('Describe your business type.');
      return;
    }
    setGenerating(true);
    setResult(null);
    sendMessage({
      text: `Build automations for:\n- Business: ${businessType}\n- Pain points: ${painPoints || 'General efficiency'}\n- Current tools: ${currentTools || 'Shopify'}\n- Budget: ${budget || 'Flexible'}`,
    });
  }, [businessType, painPoints, currentTools, budget, sendMessage]);

  const copyAll = () => {
    if (!result) return;
    navigator.clipboard.writeText(
      `Automation Plan\n${result.summary}\nTotal time saved: ${result.totalTimeSaved}\n\n${result.automations.map((a) => `${a.name}\n${a.description}\nSteps: ${a.steps.map((s) => `${s.trigger} → ${s.action} (${s.tool})`).join(' → ')}\nTime saved: ${a.timeSaved}\nTools: ${a.tools.join(', ')}`).join('\n\n')}`
    );
    toast.success('Copied!');
  };

  const diffColor = (d: string) =>
    d === 'easy' ? '#6366F1' : d === 'medium' ? '#f0c040' : '#ff6b6b';

  return (
    <div
      className="h-full flex"
      style={{ background: '#FAFAFA', color: '#0A0A0A', fontFamily: 'DM Sans, sans-serif' }}
    >
      <div
        className="w-80 flex-shrink-0 overflow-y-auto border-r p-5 space-y-4"
        style={{ borderColor: '#E5E7EB', scrollbarWidth: 'thin' }}
      >
        <div className="flex items-center gap-2.5 mb-1">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,180,0,0.12)', border: '1px solid rgba(255,180,0,0.3)' }}
          >
            <Zap size={15} style={{ color: '#ffb400' }} />
          </div>
          <div>
            <div className="text-sm font-black" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              Automation Builder
            </div>
            <div className="text-xs" style={{ color: '#9CA3AF' }}>
              Workflows · Triggers · Tools
            </div>
          </div>
        </div>

        {[
          {
            label: 'Business Type',
            value: businessType,
            set: setBusinessType,
            placeholder: 'e.g. Dropshipping pet products',
            req: true,
            area: false,
          },
          {
            label: 'Pain Points',
            value: painPoints,
            set: setPainPoints,
            placeholder: 'e.g. Manual order processing, slow customer replies',
            req: false,
            area: true,
          },
          {
            label: 'Current Tools',
            value: currentTools,
            set: setCurrentTools,
            placeholder: 'e.g. Shopify, Klaviyo, Gorgias',
            req: false,
            area: false,
          },
          {
            label: 'Monthly Budget ($)',
            value: budget,
            set: setBudget,
            placeholder: 'e.g. 200',
            req: false,
            area: false,
          },
        ].map(({ label, value, set, placeholder, req, area }) => (
          <div key={label}>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-1.5"
              style={{ color: '#9CA3AF', fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              {label} {req && <span style={{ color: '#ffb400' }}>*</span>}
            </label>
            {area ? (
              <textarea
                value={value}
                onChange={(e) => set(e.target.value)}
                placeholder={placeholder}
                rows={2}
                className="w-full text-xs px-3 py-2.5 rounded-lg outline-none resize-none"
                style={{
                  background: '#F9FAFB',
                  border: '1.5px solid #F5F5F5',
                  color: '#374151',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(255,180,0,0.45)')}
                onBlur={(e) => (e.target.style.borderColor = '#F5F5F5')}
              />
            ) : (
              <input
                value={value}
                onChange={(e) => set(e.target.value)}
                placeholder={placeholder}
                className="w-full text-xs px-3 py-2.5 rounded-lg outline-none"
                style={{
                  background: '#F9FAFB',
                  border: '1.5px solid #F5F5F5',
                  color: '#374151',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(255,180,0,0.45)')}
                onBlur={(e) => (e.target.style.borderColor = '#F5F5F5')}
              />
            )}
          </div>
        ))}

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
          style={{
            background: generating
              ? 'rgba(255,180,0,0.25)'
              : 'linear-gradient(135deg, #ffb400, #f0c040)',
            color: '#FAFAFA',
            fontFamily: "'Bricolage Grotesque', sans-serif",
            boxShadow: generating ? 'none' : '0 4px 20px rgba(255,180,0,0.3)',
            cursor: generating ? 'not-allowed' : 'pointer',
          }}
        >
          {generating ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Building…
            </>
          ) : (
            <>
              <Zap size={14} /> Build Automations
            </>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: 'thin' }}>
        {result ? (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                  Automation Plan
                </h2>
                <SaveToProduct
                  toolId="automation-builder"
                  toolName="Automation Builder"
                  outputData={result}
                />
                <div className="flex items-center gap-2 mt-1">
                  <Clock size={12} style={{ color: '#6366F1' }} />
                  <span className="text-xs font-bold" style={{ color: '#6366F1' }}>
                    Save {result.totalTimeSaved}
                  </span>
                </div>
              </div>
              <button
                onClick={copyAll}
                className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                style={{
                  background: '#F9FAFB',
                  border: '1px solid #F0F0F0',
                  color: '#374151',
                  cursor: 'pointer',
                }}
              >
                <Copy size={11} /> Copy All
              </button>
            </div>

            <div
              className="rounded-xl p-4"
              style={{
                background: 'rgba(255,180,0,0.06)',
                border: '1px solid rgba(255,180,0,0.2)',
              }}
            >
              <div className="text-xs leading-relaxed" style={{ color: '#374151' }}>
                {result.summary}
              </div>
            </div>

            {result.automations.map((auto, i) => (
              <div
                key={i}
                className="rounded-xl overflow-hidden"
                style={{
                  background: '#FAFAFA',
                  border: '1px solid #E5E7EB',
                }}
              >
                <div
                  className="px-4 py-3 border-b flex items-center justify-between"
                  style={{ borderColor: '#E5E7EB' }}
                >
                  <div>
                    <div className="text-sm font-black" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                      {auto.name}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                      {auto.description}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-bold"
                      style={{
                        background: `${diffColor(auto.difficulty)}12`,
                        color: diffColor(auto.difficulty),
                      }}
                    >
                      {auto.difficulty}
                    </span>
                    <span className="text-xs font-mono" style={{ color: '#6366F1' }}>
                      {auto.timeSaved}
                    </span>
                  </div>
                </div>

                {/* Flow */}
                <div className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {auto.steps.map((step, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <div
                          className="rounded-lg px-3 py-2"
                          style={{
                            background: '#F9FAFB',
                            border: '1px solid #F5F5F5',
                          }}
                        >
                          <div className="text-xs font-bold" style={{ color: '#ffb400' }}>
                            {step.trigger}
                          </div>
                          <div
                            className="text-xs mt-0.5"
                            style={{ color: '#6B7280' }}
                          >
                            {step.action}
                          </div>
                          <div
                            className="text-xs mt-0.5 flex items-center gap-1"
                            style={{ color: '#9CA3AF' }}
                          >
                            <Settings size={8} /> {step.tool}
                          </div>
                        </div>
                        {j < auto.steps.length - 1 && (
                          <ArrowRight size={14} style={{ color: '#D1D5DB' }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tools */}
                <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                  {auto.tools.map((tool, j) => (
                    <span
                      key={j}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: 'rgba(255,180,0,0.08)',
                        border: '1px solid rgba(255,180,0,0.15)',
                        color: 'rgba(255,200,80,0.8)',
                      }}
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            {generating ? (
              <div className="text-center">
                <Loader2
                  size={32}
                  className="animate-spin mx-auto mb-4"
                  style={{ color: '#ffb400' }}
                />
                <div className="text-sm font-bold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                  Building your automations…
                </div>
              </div>
            ) : (
              <>
                <div className="text-5xl">⚡</div>
                <div className="text-center">
                  <div
                    className="text-base font-black mb-2"
                    style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                  >
                    Automation Builder
                  </div>
                  <div
                    className="text-xs max-w-xs leading-relaxed"
                    style={{ color: '#9CA3AF' }}
                  >
                    Describe your business and pain points to get custom automation workflows with
                    tools, triggers, and time savings.
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
