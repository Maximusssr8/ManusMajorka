import { AnimatePresence, motion } from 'framer-motion';
import { ExternalLink, Loader2, Package, RefreshCw, Send, Sparkles, Trash2 } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Markdown } from '@/components/Markdown';
import { SEO } from '@/components/SEO';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { getStoredMarket } from '@/contexts/MarketContext';
import { useActiveProduct } from '@/hooks/useActiveProduct';
import { useMaya } from '@/context/MayaContext';

const BASE_SYSTEM_PROMPT = `You are an elite ecommerce advisor with 15 years experience scaling 7-figure Shopify stores. You give specific, actionable advice tailored to the user's exact situation. Never give generic answers.

Default to Australia unless told otherwise: prices in AUD, reference AU suppliers, AU shipping costs, AU Facebook/TikTok ad benchmarks.

How you communicate:
- Give real numbers. If you don't have exact data, give a reasonable range and say so.
- If they're vague, ask ONE sharp clarifying question. Not five. One.
- Skip the preamble. Lead with the answer.
- End with the 2-3 most important next actions — concrete, not generic.`;

type Message = { role: 'user' | 'assistant'; content: string; isError?: boolean };

const TOOL_STATUS_LABELS: Record<string, string> = {
  web_search: '🔍 Searching the web...',
  product_research: '📊 Researching products...',
  competitor_analysis: '🕵️ Analysing competitor...',
  supplier_finder: '🏭 Finding suppliers...',
  trend_scout: '🔥 Scouting trends...',
  ad_angle_generator: '🎯 Generating ad angles...',
};

const QUICK_CHIPS = [
  "What's the #1 product to dropship in AU right now?",
  'Find me a low-competition product under $40 AUD',
  'Is the massage gun niche still viable in Australia?',
  'What are the best TikTok ad angles for fitness products in AU?',
  'I want to start selling LED face masks — run the full analysis',
];

const STARTER_CARDS = [
  { emoji: '🔥', label: "What's the #1 product to dropship in AU right now?" },
  { emoji: '💰', label: 'I want to start selling LED face masks — run the full analysis' },
  { emoji: '🛍️', label: 'Build me a store for [paste product URL]' },
  { emoji: '📈', label: 'Is the massage gun niche still viable in Australia?' },
];

// Parse action card JSON from Maya's response (old format: pure JSON array)
function parseActionCards(content: string): Array<{ title: string; context: string; cta: string; path: string }> | null {
  if (!content || content.trim().length < 10) return null;
  try {
    const jsonMatch = content.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      if (items.length > 0 && items[0]?.title && items[0]?.path) return items;
    }
  } catch {
    /* not valid JSON */
  }
  return null;
}

// Extract <<<ACTION>>>...<<<END_ACTION>>> blocks from text (new agentic format)
function extractAgentActions(text: string): { cleanText: string; actions: any[] } {
  const actions: any[] = [];
  const cleanText = text
    .replace(/<<<ACTION>>>([\s\S]*?)<<<END_ACTION>>>/g, (_, json) => {
      try {
        actions.push(JSON.parse(json.trim()));
      } catch {
        /* skip malformed */
      }
      return '';
    })
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return { cleanText, actions };
}

const TOOL_LABELS: Record<string, string> = {
  'website-generator': '🏪 Open Website Generator',
  'suppliers': '📦 Search Suppliers',
  'saturation-checker': '📊 Check Saturation',
  'profit-calculator': '💰 Calculate Profit',
  'winning-products': '🔥 Browse Products',
  'product-discovery': '🔍 Discover Products',
  'store-spy': '🕵️ Spy on Stores',
  'trend-signals': '📈 Trend Signals',
};

// Agentic action card (new format with navigate/workflow types)
function MayaActionCard({ action }: { action: any }) {
  const [, setLocation] = useLocation();

  const handleNavigate = (tool: string, params?: any) => {
    if (params) {
      sessionStorage.setItem(`maya_prefill_${tool}`, JSON.stringify(params));
    }
    setLocation(`/app/${tool}`);
  };

  if (action.type === 'workflow') {
    return (
      <div
        style={{
          background: 'rgba(99,102,241,0.06)',
          border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: 12,
          padding: '14px 16px',
          marginTop: 8,
        }}
      >
        <div style={{ color: '#6366F1', fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
          ⚡ WORKFLOW — {action.steps?.length ?? 0} tools
        </div>
        {(action.steps ?? []).map((step: any, i: number) => (
          <div
            key={i}
            style={{ fontSize: 13, color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}
          >
            <span style={{ color: '#6366F1' }}>{i + 1}.</span>
            {TOOL_LABELS[step.tool] || step.tool}
          </div>
        ))}
        <button
          onClick={() => {
            if (action.steps?.length > 0) {
              sessionStorage.setItem('maya_workflow', JSON.stringify(action.steps));
              const firstTool = action.steps[0].tool;
              if (action.steps[0].params) {
                sessionStorage.setItem(`maya_prefill_${firstTool}`, JSON.stringify(action.steps[0].params));
              }
              setLocation(`/app/${firstTool}`);
            }
          }}
          style={{
            marginTop: 10,
            background: '#6366F1',
            color: '#080a0e',
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            width: '100%',
            fontFamily: 'Syne, sans-serif',
          }}
        >
          Start Workflow →
        </button>
      </div>
    );
  }

  // navigate type
  const tool = action.tool ?? '';
  const params = action.params ?? {};
  return (
    <button
      onClick={() => handleNavigate(tool, params)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'rgba(99,102,241,0.06)',
        border: '1px solid rgba(99,102,241,0.25)',
        borderRadius: 10,
        padding: '10px 14px',
        marginTop: 8,
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(99,102,241,0.12)';
        e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(99,102,241,0.06)';
        e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)';
      }}
    >
      <span style={{ fontSize: 16, color: '#6366F1' }}>→</span>
      <div>
        <div style={{ color: '#6366F1', fontWeight: 700, fontSize: 13, fontFamily: 'Syne, sans-serif' }}>
          {TOOL_LABELS[tool] || tool}
        </div>
        {params.productUrl && (
          <div style={{ color: '#52525b', fontSize: 11, marginTop: 2 }}>
            Pre-loaded: {String(params.productUrl).slice(0, 40)}...
          </div>
        )}
        {params.query && (
          <div style={{ color: '#52525b', fontSize: 11, marginTop: 2 }}>
            Search: "{params.query}"
          </div>
        )}
        {params.product && (
          <div style={{ color: '#52525b', fontSize: 11, marginTop: 2 }}>
            Checking: "{params.product}"
          </div>
        )}
        {params.productName && !params.query && !params.product && !params.productUrl && (
          <div style={{ color: '#52525b', fontSize: 11, marginTop: 2 }}>
            {params.productName}
          </div>
        )}
      </div>
    </button>
  );
}

// Action card component for Maya navigation suggestions
function ActionCard({ title, context, cta, path }: { title: string; context: string; cta: string; path: string }) {
  return (
    <a
      href={path}
      style={{
        display: 'block',
        background: 'rgba(99,102,241,0.06)',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 8,
        padding: '12px 16px',
        marginBottom: 8,
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(99,102,241,0.12)';
        e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(99,102,241,0.06)';
        e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)';
      }}
    >
      <div style={{ color: '#fff', fontWeight: 600, fontSize: 14, fontFamily: 'Syne, sans-serif' }}>{title}</div>
      <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 4, lineHeight: 1.4 }}>{context}</div>
      <div style={{ color: '#6366F1', fontSize: 12, marginTop: 8, fontWeight: 500 }}>{cta} →</div>
    </a>
  );
}

// Detect product names in assistant responses
function detectProductLink(content: string): boolean {
  if (!content || content.length < 20) return false;
  const patterns = [
    /posture corrector/i, /lick mat/i, /led.*mask/i, /face mask/i,
    /neck fan/i, /resistance band/i, /fridge organis/i, /pet.*brush/i,
    /scalp massager/i, /knee brace/i, /air fryer/i, /dog.*coat/i,
    /charging dock/i, /blue light/i, /jump rope/i, /phone sanitiser/i,
    /wall planter/i, /meal prep/i,
  ];
  return patterns.some((p) => p.test(content));
}

// Extended message type to include agentic actions
type MessageWithActions = Message & { agentActions?: any[] };

export default function AIChat() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<MessageWithActions[]>([]);
  const [status, setStatus] = useState<'idle' | 'streaming'>('idle');
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { activeProduct } = useActiveProduct();
  const { session } = useAuth();
  const lastFailedMsg = useRef<string | null>(null);
  const { currentPage, currentProduct } = useMaya();
  const [location] = useLocation();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildSystemPrompt = useCallback(() => {
    const productCtx = activeProduct
      ? `\n\nACTIVE PRODUCT: ${activeProduct.name} | Niche: ${activeProduct.niche} | Stage: ${activeProduct.source}\n\nAlways reference this product specifically when answering questions. Give advice tailored to exactly this product and niche.`
      : '';
    return BASE_SYSTEM_PROMPT + productCtx;
  }, [activeProduct]);

  const suggestedPrompts = activeProduct
    ? [
        `What's the best ad angle for ${activeProduct.name}?`,
        `Who is the ideal customer for ${activeProduct.name}?`,
        `What price point should I sell ${activeProduct.name} at?`,
        `How do I validate demand for ${activeProduct.name} quickly?`,
      ]
    : [
        "What's the #1 product to dropship in AU right now?",
        'Find me a low-competition product under $40 AUD',
        'What are the best TikTok ad angles for fitness products in AU?',
        'Is the massage gun niche still viable in Australia?',
      ];

  const handleSend = useCallback(
    async (overrideText?: string, searchQuery?: string) => {
      const msg = (overrideText ?? input).trim();
      if (!msg || status === 'streaming') return;
      if (!overrideText) setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      lastFailedMsg.current = null;

      const userMsg: Message = { role: 'user', content: msg };
      const newMessages = [...messages, userMsg];
      setMessages([...newMessages, { role: 'assistant', content: '' }]);
      setStatus('streaming');

      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

        const pageCtx = (currentPage && currentPage !== '/') ? {
          page: currentPage,
          ...(currentProduct ? { currentProduct } : {}),
        } : undefined;

        const response = await fetch('/api/chat?stream=1', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
            systemPrompt: buildSystemPrompt(),
            toolName: 'ai-chat',
            stream: true,
            market: getStoredMarket(),
            ...(searchQuery ? { searchQuery } : {}),
            ...(pageCtx ? { pageContext: pageCtx } : {}),
          }),
        });
        if (!response.ok) throw new Error(`Server error: ${response.status}`);

        // Parse SSE stream
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';
        let streamedActions: any[] = [];

        if (reader) {
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const rawPayload = line.slice(6);
              if (rawPayload === '[DONE]') continue;
              try {
                const payload = JSON.parse(rawPayload);
                if (payload.toolStatus) {
                  // Show tool status pill
                  const label =
                    TOOL_STATUS_LABELS[payload.toolStatus] ||
                    payload.statusMessage ||
                    `🔧 Working...`;
                  setToolStatus(label);
                } else if (payload.actions) {
                  // Server emitted extracted actions
                  streamedActions = payload.actions;
                } else if (payload.text !== undefined) {
                  // Text is streaming — clear tool status
                  setToolStatus(null);
                  accumulated += payload.text;
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: 'assistant', content: accumulated };
                    return updated;
                  });
                }
              } catch {
                /* skip malformed lines */
              }
            }
          }
        }

        // Fallback: if streaming produced nothing, try plain JSON
        if (!accumulated) {
          try {
            const text = await response.text();
            const data = JSON.parse(text);
            accumulated = data.content ?? data.reply ?? '';
            if (data.actions) streamedActions = data.actions;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: 'assistant', content: accumulated };
              return updated;
            });
          } catch {
            /* already handled */
          }
        }

        // Extract any inline action blocks from text and clean display text
        const { cleanText, actions: inlineActions } = extractAgentActions(accumulated);
        const allActions = streamedActions.length > 0 ? streamedActions : inlineActions;

        // Update final message with clean text + actions
        if (allActions.length > 0 || cleanText !== accumulated) {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: 'assistant',
              content: cleanText || accumulated,
              agentActions: allActions.length > 0 ? allActions : undefined,
            };
            return updated;
          });
        }
      } catch (err) {
        console.error('Stream error:', err);
        lastFailedMsg.current = msg;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: 'Something went wrong — try again',
            isError: true,
          };
          return updated;
        });
      } finally {
        setStatus('idle');
        setToolStatus(null);
      }
    },
    [input, messages, status, buildSystemPrompt, session]
  );

  const handleRetry = useCallback(() => {
    if (!lastFailedMsg.current) return;
    // Remove the error message
    setMessages((prev) => prev.slice(0, -2));
    const retryMsg = lastFailedMsg.current;
    lastFailedMsg.current = null;
    handleSend(retryMsg);
  }, [handleSend]);

  const handleClearHistory = useCallback(async () => {
    setMessages([]);
    if (session?.access_token) {
      try {
        await fetch('/api/chat/history?tool=ai-chat', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        toast.success('Chat history cleared');
      } catch {
        /* non-fatal */
      }
    }
  }, [session]);

  return (
    <div className="flex flex-col h-full" style={{ background: '#FAFAFA' }}>
      <SEO
        title="Maya — Your AI Dropshipping Coach | Majorka"
        description="Ask Maya anything about dropshipping in Australia. Live market data, product research, and strategy."
        path="/app/ai-chat"
      />
      {/* Header */}
      <div
        className="flex-shrink-0 px-5 py-3"
        style={{ borderBottom: '1px solid #E5E7EB', background: 'white' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
            style={{
              background: 'linear-gradient(135deg, #6366F1, #f0c040)',
              color: '#080a0e',
              fontFamily: 'Syne, sans-serif',
            }}
          >
            A
          </div>
          <div className="flex-1">
            <h1
              className="font-black text-sm"
              style={{ fontFamily: 'Syne, sans-serif', color: '#0A0A0A' }}
            >
              AI Chat
            </h1>
            <p
              className="text-xs"
              style={{ color: 'rgba(240,237,232,0.35)', fontFamily: 'DM Sans, sans-serif' }}
            >
              {activeProduct ? `Advising on ${activeProduct.name}` : 'Ask Majorka anything'}
            </p>
          </div>
          {activeProduct && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
              style={{
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.25)',
              }}
            >
              <Package size={11} style={{ color: '#6366F1' }} />
              <span
                className="text-xs font-bold"
                style={{ color: '#6366F1', fontFamily: 'Syne, sans-serif' }}
              >
                {activeProduct.name}
              </span>
              {activeProduct.niche && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    background: 'rgba(99,102,241,0.15)',
                    color: 'rgba(99,102,241,0.7)',
                    fontSize: 9,
                  }}
                >
                  {activeProduct.niche}
                </span>
              )}
            </div>
          )}
          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all"
              style={{
                color: 'rgba(240,237,232,0.35)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              title="Clear chat"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="space-y-4 p-5">
            {/* Memory indicator — shown when user is logged in and has chat history (mem0 active) */}
            {session && messages.length > 0 && (
              <div
                className="flex items-center gap-2 text-xs mb-1"
                style={{ color: 'rgba(99,102,241,0.5)' }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: '#6366F1', flexShrink: 0 }}
                />
                <span style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  Maya is using your conversation history
                </span>
              </div>
            )}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center py-8">
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: 'linear-gradient(135deg, #6366F1, #f0c040)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <Sparkles style={{ color: '#080a0e' }} size={24} />
                </div>
                <p
                  className="text-sm mb-1 font-bold"
                  style={{ fontFamily: 'Syne, sans-serif', color: '#0A0A0A' }}
                >
                  {activeProduct
                    ? `Let's talk about ${activeProduct.name}`
                    : "I'm Maya — your AU ecommerce strategist"}
                </p>
                <p
                  className="text-xs mb-6 max-w-xs"
                  style={{ color: 'rgba(240,237,232,0.35)', fontFamily: 'DM Sans, sans-serif' }}
                >
                  {activeProduct
                    ? `I have full context on your ${activeProduct.niche} product and can give you specific, targeted advice.`
                    : 'Ask me anything about winning products, niches, ads, and scaling in Australia.'}
                </p>

                {/* 4 large starter cards */}
                {!activeProduct && (
                  <div className="grid grid-cols-2 gap-2 w-full max-w-lg mb-4">
                    {STARTER_CARDS.map((card, i) => (
                      <button
                        key={i}
                        onClick={() => void handleSend(card.label)}
                        className="text-left rounded-xl border p-3 transition-all"
                        style={{
                          borderColor: 'rgba(99,102,241,0.15)',
                          background: 'rgba(99,102,241,0.03)',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)';
                          e.currentTarget.style.background = 'rgba(99,102,241,0.07)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(99,102,241,0.15)';
                          e.currentTarget.style.background = 'rgba(99,102,241,0.03)';
                        }}
                      >
                        <div style={{ fontSize: 20, marginBottom: 6 }}>{card.emoji}</div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: 'rgba(240,237,232,0.8)',
                            fontFamily: 'DM Sans, sans-serif',
                            lineHeight: 1.4,
                          }}
                        >
                          {card.label}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Suggested prompts */}
                <div className="flex flex-col gap-2 w-full max-w-md">
                  {activeProduct && suggestedPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => void handleSend(prompt)}
                      className="text-left text-xs px-4 py-2.5 rounded-lg border transition-all"
                      style={{
                        borderColor: 'rgba(99,102,241,0.18)',
                        color: 'rgba(99,102,241,0.7)',
                        background: 'rgba(99,102,241,0.04)',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.18)')
                      }
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div
                    className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(99,102,241,0.12)', flexShrink: 0 }}
                  >
                    <Sparkles className="w-3.5 h-3.5" style={{ color: '#6366F1' }} />
                  </div>
                )}

                <div
                  className="max-w-[72%] rounded-lg px-4 py-3"
                  style={
                    msg.role === 'user'
                      ? {
                          background: '#1a1600',
                          border: '1px solid rgba(99,102,241,0.3)',
                          color: '#0A0A0A',
                        }
                      : msg.isError
                        ? {
                            background: 'rgba(255,100,100,0.12)',
                            border: '1px solid rgba(255,100,100,0.2)',
                          }
                        : {
                            background: 'white',
                            border: '1px solid #E5E7EB',
                          }
                  }
                >
                  {msg.isError ? (
                    <div className="flex items-center gap-3">
                      <span className="text-sm" style={{ color: 'rgba(255,150,150,0.9)' }}>
                        {msg.content}
                      </span>
                      <button
                        onClick={handleRetry}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg flex-shrink-0 transition-all"
                        style={{
                          background: 'rgba(99,102,241,0.12)',
                          border: '1px solid rgba(99,102,241,0.3)',
                          color: '#6366F1',
                          cursor: 'pointer',
                          fontFamily: 'Syne, sans-serif',
                          fontWeight: 700,
                        }}
                      >
                        <RefreshCw size={10} /> Retry
                      </button>
                    </div>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {(() => {
                        const isStreaming = status === 'streaming' && i === messages.length - 1 && msg.role === 'assistant';
                        const msgWithActions = msg as MessageWithActions;

                        // New agentic action cards (navigate/workflow)
                        if (!isStreaming && msg.role === 'assistant' && msgWithActions.agentActions && msgWithActions.agentActions.length > 0) {
                          return (
                            <>
                              {msg.content && (
                                <Markdown mode="static">{msg.content}</Markdown>
                              )}
                              <div style={{ marginTop: 8 }}>
                                {msgWithActions.agentActions.map((action: any, idx: number) => (
                                  <MayaActionCard key={idx} action={action} />
                                ))}
                              </div>
                            </>
                          );
                        }

                        // Old format action cards (pure JSON array)
                        const actionCards = !isStreaming && msg.role === 'assistant' ? parseActionCards(msg.content) : null;
                        if (actionCards) {
                          return (
                            <div style={{ marginTop: 4 }}>
                              {actionCards.map((card, idx) => (
                                <ActionCard key={idx} {...card} />
                              ))}
                            </div>
                          );
                        }
                        return (
                          <>
                            <Markdown mode={isStreaming ? 'streaming' : 'static'}>
                              {msg.content}
                            </Markdown>
                            {/* View in Winning Products link */}
                            {msg.role === 'assistant' &&
                              msg.content.length > 50 &&
                              detectProductLink(msg.content) && (
                                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                  <Link
                                    href="/app/winning-products"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 5,
                                      fontSize: 11,
                                      fontWeight: 700,
                                      color: '#6366F1',
                                      textDecoration: 'none',
                                      fontFamily: 'Syne, sans-serif',
                                    }}
                                  >
                                    <ExternalLink size={10} />
                                    → View in Winning Products
                                  </Link>
                                </div>
                              )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div
                    className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center font-black text-xs"
                    style={{
                      background: 'linear-gradient(135deg, #6366F1, #f0c040)',
                      color: '#080a0e',
                      fontFamily: 'Syne, sans-serif',
                      flexShrink: 0,
                    }}
                  >
                    U
                  </div>
                )}
              </div>
            ))}

            {/* Tool status pill */}
            <AnimatePresence>
              {toolStatus && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="flex justify-start"
                >
                  <div
                    className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-full w-fit ml-10"
                    style={{
                      color: '#6366F1',
                      background: 'rgba(99,102,241,0.1)',
                      border: '1px solid rgba(99,102,241,0.2)',
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ background: '#6366F1' }}
                    />
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>
                      {toolStatus}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bouncing dots typing indicator */}
            {status === 'streaming' &&
              messages[messages.length - 1]?.content === '' &&
              !toolStatus && (
                <div className="flex gap-3 justify-start">
                  <div
                    className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(99,102,241,0.12)' }}
                  >
                    <Sparkles className="w-3.5 h-3.5" style={{ color: '#6366F1' }} />
                  </div>
                  <div
                    className="rounded-lg px-4 py-3"
                    style={{ background: 'white', border: '1px solid #E5E7EB' }}
                  >
                    <div className="flex items-center gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full animate-bounce"
                          style={{
                            background: '#6366F1',
                            animationDelay: `${i * 0.15}s`,
                            animationDuration: '0.6s',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="flex-shrink-0 px-4 pb-4 pt-2">
          {/* Quick chips — shown when input is empty and there are messages */}
          {messages.length > 0 && !input.trim() && (
            <div
              style={{
                display: 'flex',
                gap: 6,
                flexWrap: 'wrap',
                marginBottom: 8,
                paddingBottom: 2,
              }}
            >
              {QUICK_CHIPS.map((chip, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (chip === "What's trending in AU this week?") {
                      void handleSend(chip, 'TikTok Shop Australia trending products this week 2025');
                    } else {
                      setInput(chip);
                    }
                  }}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 20,
                    background: 'rgba(99,102,241,0.07)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    color: 'rgba(99,102,241,0.8)',
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontFamily: 'DM Sans, sans-serif',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)';
                    e.currentTarget.style.background = 'rgba(99,102,241,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)';
                    e.currentTarget.style.background = 'rgba(99,102,241,0.07)';
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}
          <div
            className="flex items-end gap-2 px-4 py-3 rounded-lg"
            style={{
              background: 'white',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={
                activeProduct ? `Ask about ${activeProduct.name}...` : 'Ask Majorka anything...'
              }
              rows={1}
              className="flex-1 bg-transparent text-sm outline-none resize-none"
              style={{
                color: '#0A0A0A',
                fontFamily: 'DM Sans, sans-serif',
                lineHeight: '1.5',
                maxHeight: '120px',
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={status === 'streaming' || !input.trim()}
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 disabled:opacity-30 transition-all"
              style={{
                background: input.trim()
                  ? 'linear-gradient(135deg, #6366F1, #c09a28)'
                  : 'rgba(255,255,255,0.06)',
                color: input.trim() ? '#080a0e' : 'rgba(240,237,232,0.3)',
                cursor: 'pointer',
                border: 'none',
              }}
            >
              {status === 'streaming' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <p className="text-xs mt-1.5 text-center" style={{ color: 'rgba(240,237,232,0.12)' }}>
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
