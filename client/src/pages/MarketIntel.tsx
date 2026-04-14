import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Copy, Loader2, Send, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ActiveProductBanner } from '@/components/ActiveProductBanner';
import { Markdown } from '@/components/Markdown';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useActiveProduct } from '@/hooks/useActiveProduct';

const MARKET_INTEL_SYSTEM_PROMPT = `You are a market research and competitive intelligence expert.

Your role is to help users understand their market landscape by providing:
1. Market size and growth trends
2. Competitive landscape analysis
3. Customer pain points and needs
4. Emerging market opportunities
5. Pricing strategy benchmarks
6. Distribution channel analysis
7. Market entry barriers and risks
8. Growth acceleration strategies

When a user describes their market/product, provide:
- Market Overview (size, growth rate, trends)
- Competitive Analysis (top 5 competitors, strengths/weaknesses)
- Customer Insights (demographics, psychographics, pain points)
- Market Opportunities (underserved segments, gaps)
- Pricing Benchmarks (competitive pricing analysis)
- Go-to-Market Strategy Recommendations
- Risk Assessment and Mitigation

Ask clarifying questions about their target market, geography, and customer segment.`;

export default function MarketIntel() {
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { activeProduct } = useActiveProduct();

  const getSystemPrompt = () => {
    if (!activeProduct) return MARKET_INTEL_SYSTEM_PROMPT;
    return (
      MARKET_INTEL_SYSTEM_PROMPT +
      `\n\nACTIVE PRODUCT CONTEXT:\n- Product: ${activeProduct.name}${activeProduct.niche ? '\n- Niche: ' + activeProduct.niche : ''}${activeProduct.summary ? '\n- Summary: ' + activeProduct.summary : ''}\n\nAll advice and output must be specifically tailored to this product. Reference it by name.`
    );
  };

  const { messages, sendMessage, status } = useChat({
    id: 'market-intel',
    messages: [],
    transport: new DefaultChatTransport({
      api: '/api/chat',
      prepareSendMessagesRequest({ messages }) {
        return {
          body: {
            message: messages[messages.length - 1],
            chatId: 'market-intel',
            systemPrompt: getSystemPrompt(),
            aiSdk: true,
          },
        };
      },
    }),
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      );
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    setInput('');
    await sendMessage({ role: 'user', parts: [{ type: 'text', text: input }] } as any);
  };

  const copyLastMessage = () => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant') {
      const text = lastMessage.parts
        .filter((p) => p.type === 'text')
        .map((p) => (p as any).text)
        .join('');
      navigator.clipboard.writeText(text);
      toast.success('Message copied to clipboard!');
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <ActiveProductBanner
        ctaLabel="Load into tool"
        onUseProduct={(summary) => setInput(summary)}
      />
      {/* Header */}
      <div className="flex-shrink-0 border-b p-4" style={{ borderColor: '#F5F5F5' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-sm"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#FAFAFA' }}
          >
            I
          </div>
          <div>
            <h1 className="font-extrabold text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>
              Market Intelligence
            </h1>
            <p className="text-xs text-muted-foreground">
              Analyze market trends and competitive landscape
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea ref={scrollAreaRef} className="flex-1 mb-4">
          <div className="space-y-4 p-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Sparkles className="w-12 h-12 mb-4" style={{ color: '#6366F1', opacity: 0.3 }} />
                <p className="text-sm text-muted-foreground max-w-xs">
                  Tell me about your market or product, and I'll provide competitive intelligence
                  and market insights.
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" style={{ color: '#6366F1' }} />
                  </div>
                )}

                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2.5 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {msg.parts.map((part, j) => {
                    if (part.type === 'text') {
                      return (
                        <div key={j} className="prose prose-sm dark:prose-invert max-w-none">
                          <Markdown mode="static">{(part as any).text}</Markdown>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            ))}

            {status === 'streaming' && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" style={{ color: '#6366F1' }} />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      Researching market intelligence...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div
          className="flex-shrink-0 border-t p-4"
          style={{ borderColor: '#F5F5F5' }}
        >
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleSend();
                }
              }}
              placeholder="Describe your market, competitors, or product..."
              className="resize-none"
              rows={3}
            />
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleSend}
                disabled={status === 'streaming' || !input.trim()}
                size="sm"
                style={{
                  background: 'linear-gradient(135deg, #6366F1, #c09a28)',
                  color: '#FAFAFA',
                }}
              >
                <Send className="w-4 h-4" />
              </Button>
              {messages.length > 0 && (
                <Button onClick={copyLastMessage} variant="outline" size="sm" className="gap-2">
                  <Copy className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
