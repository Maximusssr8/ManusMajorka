import { Check, Copy, Download, Loader2, RefreshCw, Send, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ActiveProductBanner } from '@/components/ActiveProductBanner';
import { Markdown } from '@/components/Markdown';
import OutputToolbar from '@/components/OutputToolbar';
import RelatedTools from '@/components/RelatedTools';
import { SaveToProduct } from '@/components/SaveToProduct';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useMarket } from '@/contexts/MarketContext';
import { useActiveProduct } from '@/hooks/useActiveProduct';
import { trackToolUsed } from '@/lib/analytics';

/** Tool-specific loading messages — shown while AI is generating */
const TOOL_LOADING_MESSAGES: Record<string, string> = {
  'product-discovery': 'Scanning AU market demand signals...',
  'meta-ads': 'Writing AU ad copy for your audience...',
  'ads-studio': 'Crafting scroll-stopping creative hooks...',
  validate: 'Running profit calculations for AU market...',
  'supplier-finder': 'Searching Alibaba, Dropshipzone, and CJ AU...',
  'keyword-miner': 'Mining AU buyer-intent keywords...',
  'audience-profiler': 'Building your AU customer personas...',
  copywriter: 'Writing AU-optimised sales copy...',
  'email-sequences': 'Building your Klaviyo email flow...',
  'tiktok-builder': 'Scripting your AU TikTok slideshow...',
  'scaling-playbook': 'Mapping your AU scaling strategy...',
  'website-generator': 'Generating your AU store layout...',
  'competitor-breakdown': 'Analysing AU competitor landscape...',
  'trend-radar': 'Reading AU trend signals...',
  'niche-scorer': 'Scoring AU market opportunity...',
  'au-trending': 'Pulling live AU trending data...',
  'market-intel': 'Gathering AU market intelligence...',
  'financial-modeler': 'Building your AU financial model...',
  'ai-chat': 'Maya is thinking...',
};

interface AIToolChatProps {
  toolId: string;
  toolName: string;
  toolDescription: string;
  toolIcon: React.ReactNode;
  systemPrompt: string;
  placeholder?: string;
  /** If true, extract HTML code blocks and show preview panel */
  showHTMLPreview?: boolean;
  examplePrompts?: string[];
  /** If set, auto-sends this message on mount */
  initialMessage?: string;
}

type Message = { role: 'user' | 'assistant'; content: string; isError?: boolean };

export default function AIToolChat({
  toolId,
  toolName,
  toolDescription,
  toolIcon,
  systemPrompt,
  placeholder = 'Type your message...',
  showHTMLPreview = false,
  examplePrompts,
  initialMessage,
}: AIToolChatProps) {
  const [generatedHTML, setGeneratedHTML] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<'idle' | 'streaming'>('idle');
  const { activeProduct } = useActiveProduct();
  const { market } = useMarket();
  const { session } = useAuth();

  // Build system prompt with active product context injected
  const buildSystemPrompt = useCallback(() => {
    if (!activeProduct) return systemPrompt;
    const productCtx = `\n\nACTIVE PRODUCT CONTEXT:\n- Product: ${activeProduct.name}${activeProduct.niche ? `\n- Niche: ${activeProduct.niche}` : ''}${activeProduct.summary ? `\n- Details: ${activeProduct.summary}` : ''}\n\nAlways tailor your advice specifically to this product and niche. Reference it directly in your response.`;
    return systemPrompt + productCtx;
  }, [systemPrompt, activeProduct]);
  // Extract HTML from assistant messages (for Website Generator)
  useEffect(() => {
    if (!showHTMLPreview) return;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant') {
      const htmlMatch = lastMessage.content.match(/```html\n([\s\S]*?)\n```/);
      if (htmlMatch && htmlMatch[1]) {
        try {
          setGeneratedHTML(htmlMatch[1]);
          setPreviewError(false);
        } catch (err) {
          setPreviewError(true);
        }
      }
    }
  }, [messages, showHTMLPreview]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (overrideText?: string) => {
    const msg = (overrideText ?? input).trim();
    if (!msg || status === 'streaming') return;
    if (!overrideText) setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    const newMessages = [...messages, { role: 'user' as const, content: msg }];
    setMessages([...newMessages, { role: 'assistant' as const, content: '' }]);
    setStatus('streaming');
    trackToolUsed(toolId, market);

    try {
      const response = await fetch('/api/chat?stream=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          systemPrompt: buildSystemPrompt(),
          stream: true,
          market,
        }),
      });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      // Parse SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

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
            try {
              const payload = JSON.parse(line.slice(6));
              if (payload.text !== undefined) {
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

      // If streaming didn't produce output, fall back to plain JSON
      if (!accumulated) {
        try {
          const text = await response.text();
          const data = JSON.parse(text);
          accumulated = data.reply ?? '';
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'assistant', content: accumulated };
            return updated;
          });
        } catch {
          /* already handled */
        }
      }
    } catch (err) {
      console.error('Stream error:', err);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: "I couldn't reach the model just now. Try again, or email support@majorka.io if this keeps happening.",
          isError: true,
        };
        return updated;
      });
    } finally {
      setStatus('idle');
    }
  };

  // Auto-send initialMessage on mount
  const initialSent = useRef(false);
  useEffect(() => {
    if (initialMessage && !initialSent.current && messages.length === 0) {
      initialSent.current = true;
      handleSend(initialMessage);
    }
  }, [initialMessage, messages.length, handleSend]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleRegenerate = () => {
    if (status === 'streaming' || messages.length < 2) return;
    // Find the last user message
    const lastUserIdx = messages.map((m) => m.role).lastIndexOf('user');
    if (lastUserIdx === -1) return;
    const lastUserMsg = messages[lastUserIdx].content;
    // Remove the last assistant message and re-send
    const trimmed = messages.slice(0, lastUserIdx);
    setMessages(trimmed);
    // Small delay so state update propagates
    setTimeout(() => handleSend(lastUserMsg), 50);
  };

  const getAllAssistantText = () => {
    return messages
      .filter((m) => m.role === 'assistant')
      .map((m) => m.content)
      .join('\n\n');
  };

  const copyLastMessage = () => {
    const last = messages[messages.length - 1];
    if (last?.role === 'assistant') {
      copyToClipboard(last.content);
    }
  };

  const downloadHTML = () => {
    const el = document.createElement('a');
    el.setAttribute('href', 'data:text/html;charset=utf-8,' + encodeURIComponent(generatedHTML));
    el.setAttribute('download', 'landing-page.html');
    el.style.display = 'none';
    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);
    toast.success('Downloaded!');
  };

  const hasOutput = messages.some((m) => m.role === 'assistant');

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Tool Header */}
      <div
        className="flex-shrink-0 border-b px-5 py-3"
        style={{ borderColor: '#F5F5F5' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(79,142,247,0.15)', color: '#4f8ef7' }}
          >
            {toolIcon}
          </div>
          <div className="flex-1">
            <h1 className="font-extrabold text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>
              {toolName}
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">{toolDescription}</p>
          </div>
          {hasOutput && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <OutputToolbar allContent={getAllAssistantText()} toolName={toolName} />
              <SaveToProduct
                toolId={toolId}
                toolName={toolName}
                outputData={getAllAssistantText()}
              />
            </div>
          )}
        </div>
      </div>

      {/* Active Product Banner */}
      <ActiveProductBanner
        ctaLabel="Load into chat"
        onUseProduct={(summary) => {
          setInput(`I want to work on this product:\n\n${summary}`);
        }}
      />

      {/* Chat Area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <ScrollArea className="flex-1 min-h-0" style={{ height: 0 }}>
            <div className="space-y-4 p-5">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center py-16">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: 'rgba(79,142,247,0.08)' }}
                  >
                    <Sparkles className="w-7 h-7" style={{ color: '#4f8ef7', opacity: 0.4 }} />
                  </div>
                  <p className="text-sm text-muted-foreground max-w-sm mb-6">
                    {toolDescription}. Start by describing what you need.
                  </p>
                  {examplePrompts && examplePrompts.length > 0 && (
                    <div className="flex flex-col gap-2 w-full max-w-md">
                      <p
                        className="text-xs font-bold uppercase tracking-widest mb-1"
                        style={{ color: '#9CA3AF', fontFamily: "'Syne', sans-serif" }}
                      >
                        Try an example
                      </p>
                      {examplePrompts.map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setInput(prompt);
                          }}
                          className="text-left text-xs px-4 py-2.5 rounded-xl border transition-all hover:border-blue-500/40 hover:bg-blue-500/5"
                          style={{
                            borderColor: 'rgba(79,142,247,0.2)',
                            color: 'rgba(79,142,247,0.75)',
                            background: 'rgba(79,142,247,0.03)',
                          }}
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  )}
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
                      style={{ background: 'rgba(79,142,247,0.1)' }}
                    >
                      <Sparkles className="w-3.5 h-3.5" style={{ color: '#4f8ef7' }} />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-lg px-4 py-3 ${
                      msg.role === 'user' ? 'text-sm' : 'text-foreground'
                    }`}
                    style={
                      msg.role === 'user'
                        ? {
                            background: 'rgba(79,142,247,0.06)',
                            border: '1px solid rgba(79,142,247,0.2)',
                            color: '#F8FAFC',
                          }
                        : msg.isError
                          ? {
                              background: 'rgba(255,100,100,0.12)',
                              border: '1px solid rgba(255,100,100,0.2)',
                            }
                          : { background: '#0d0d10', border: '1px solid rgba(255,255,255,0.08)' }
                    }
                  >
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <Markdown mode="static">{msg.content}</Markdown>
                    </div>
                    {/* Per-message copy + export buttons */}
                    {msg.role === 'assistant' && msg.content && (
                      <div className="mt-2 flex justify-end gap-1">
                        <CopyMsgBtn text={msg.content} />
                        <ExportMsgBtn text={msg.content} toolId={toolId} />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {status === 'streaming' && messages[messages.length - 1]?.content === '' && (
                <div className="flex gap-3 justify-start">
                  <div
                    className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(79,142,247,0.1)' }}
                  >
                    <Sparkles className="w-3.5 h-3.5" style={{ color: '#4f8ef7' }} />
                  </div>
                  <div
                    className="rounded-lg px-4 py-3"
                    style={{ background: '#0d0d10', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <div className="flex items-center gap-2">
                      {/* Pulsing gold dot */}
                      <span
                        className="inline-block w-2 h-2 rounded-full animate-pulse"
                        style={{ background: '#4f8ef7', boxShadow: '0 0 6px #4f8ef7' }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {TOOL_LOADING_MESSAGES[toolId] ?? 'Generating...'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* GO/NO-GO verdict action buttons */}
              {(() => {
                const lastAssistantMsg = [...messages]
                  .reverse()
                  .find((m) => m.role === 'assistant');
                const lastContent = lastAssistantMsg?.content || '';
                const verdict = lastContent
                  .match(/Verdict:\s*\*?\*?\s*(GO|NO-GO|PIVOT)/i)?.[1]
                  ?.toUpperCase();
                if (!verdict || status !== 'idle') return null;
                return (
                  <div
                    className="flex gap-3 mt-2 p-4 rounded-2xl"
                    style={{
                      background: '#05070F',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <div className="flex-1">
                      <div
                        className="text-xs font-bold uppercase tracking-widest mb-2"
                        style={{ color: '#9CA3AF', fontFamily: "'Syne', sans-serif" }}
                      >
                        What's next?
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {(verdict === 'GO' || verdict === 'PIVOT') && (
                          <button
                            onClick={() => (window.location.href = '/app/website-generator')}
                            className="text-xs font-bold px-4 py-2 rounded-xl"
                            style={{
                              background: 'linear-gradient(135deg, #4f8ef7, #3B82F6)',
                              color: '#FAFAFA',
                              cursor: 'pointer',
                            }}
                          >
                            Build landing page →
                          </button>
                        )}
                        {verdict === 'NO-GO' && (
                          <button
                            onClick={() => {
                              setInput('');
                            }}
                            className="text-xs font-bold px-4 py-2 rounded-xl"
                            style={{
                              background: 'rgba(79,142,247,0.1)',
                              border: '1px solid rgba(79,142,247,0.25)',
                              color: '#4f8ef7',
                              cursor: 'pointer',
                            }}
                          >
                            Try different idea →
                          </button>
                        )}
                      </div>
                    </div>
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center font-extrabold text-sm"
                      style={{
                        background:
                          verdict === 'GO'
                            ? 'rgba(79,142,247,0.18)'
                            : verdict === 'NO-GO'
                              ? 'rgba(224,92,122,0.12)'
                              : 'rgba(79,142,247,0.12)',
                        color:
                          verdict === 'GO'
                            ? '#4f8ef7'
                            : verdict === 'NO-GO'
                              ? '#e05c7a'
                              : '#4f8ef7',
                        fontFamily: "'Syne', sans-serif",
                        border: `1px solid ${verdict === 'GO' ? '#C7D2FE' : verdict === 'NO-GO' ? 'rgba(224,92,122,0.25)' : 'rgba(79,142,247,0.25)'}`,
                      }}
                    >
                      {verdict}
                    </div>
                  </div>
                );
              })()}

              {/* Regenerate button */}
              {status === 'idle' &&
                messages.length >= 2 &&
                messages[messages.length - 1]?.role === 'assistant' && (
                  <div className="flex justify-center pt-1 pb-2">
                    <button
                      onClick={handleRegenerate}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all hover:bg-[#0d0d10]/5"
                      style={{
                        color: '#9CA3AF',
                        cursor: 'pointer',
                        border: '1px solid #F5F5F5',
                        background: 'transparent',
                      }}
                    >
                      <RefreshCw size={11} />
                      Regenerate
                    </button>
                  </div>
                )}
            </div>
          </ScrollArea>

          {/* Input Bar */}
          <div
            className="flex-shrink-0 border-t p-3 pb-safe"
            style={{ borderColor: '#F5F5F5', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
          >
            <div className="flex gap-2 items-end">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={placeholder}
                className="resize-none text-sm"
                rows={1}
                style={{
                  background: '#0d0d10',
                  borderColor: '#F0F0F0',
                  overflowY: 'auto',
                  maxHeight: '200px',
                  resize: 'none',
                }}
              />
              <div className="flex flex-col gap-1.5">
                <Button
                  onClick={() => handleSend()}
                  disabled={status === 'streaming' || !input.trim()}
                  size="icon"
                  className="h-9 w-9 rounded-lg"
                  style={{
                    background: 'linear-gradient(135deg, #4f8ef7, #3B82F6)',
                    color: '#FAFAFA',
                    border: 'none',
                  }}
                >
                  <Send className="w-4 h-4" />
                </Button>
                {messages.length > 0 && (
                  <Button
                    onClick={copyLastMessage}
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
            <div className="text-xs mt-1.5" style={{ color: '#D1D5DB' }}>
              Press Enter to send · Shift+Enter for new line
            </div>
          </div>

          {/* Related Tools */}
          <RelatedTools currentToolId={toolId} />
        </div>

        {/* HTML Preview Panel (Website Generator only) */}
        {showHTMLPreview && generatedHTML && (
          <div
            className="hidden md:flex w-[380px] flex-shrink-0 flex-col border-l"
            style={{ borderColor: '#F5F5F5' }}
          >
            <Card
              className="flex-1 flex flex-col overflow-hidden rounded-none border-0"
              style={{ background: 'transparent' }}
            >
              <div
                className="p-3 border-b flex items-center justify-between"
                style={{ borderColor: '#F5F5F5' }}
              >
                <span className="text-xs font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>
                  Generated HTML
                </span>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-xs px-2 py-1 rounded hover:bg-[#0d0d10]/5 transition-colors"
                  style={{ color: '#4f8ef7' }}
                >
                  {showPreview ? 'Code' : 'Preview'}
                </button>
              </div>
              <div className="flex-1 overflow-auto p-3">
                {showPreview ? (
                  previewError ? (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                      Preview unavailable
                    </div>
                  ) : (
                    <iframe
                      srcDoc={generatedHTML}
                      className="w-full h-full border-0 rounded"
                      title="Preview"
                      onError={() => setPreviewError(true)}
                    />
                  )
                ) : (
                  <pre className="text-xs overflow-auto text-muted-foreground font-mono whitespace-pre-wrap">
                    <code>{generatedHTML.substring(0, 800)}...</code>
                  </pre>
                )}
              </div>
              <div
                className="flex gap-2 p-3 border-t"
                style={{ borderColor: '#F5F5F5' }}
              >
                <Button
                  size="sm"
                  className="flex-1 gap-2 text-xs"
                  onClick={() => copyToClipboard(generatedHTML)}
                  variant="outline"
                  style={{ borderColor: 'rgba(79,142,247,0.3)', color: '#4f8ef7' }}
                >
                  <Copy className="w-3 h-3" /> Copy
                </Button>
                <Button
                  size="sm"
                  className="flex-1 gap-2 text-xs"
                  onClick={downloadHTML}
                  style={{
                    background: 'linear-gradient(135deg, #4f8ef7, #3B82F6)',
                    color: '#FAFAFA',
                  }}
                >
                  <Download className="w-3 h-3" /> Download
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

/** Small per-message copy button */
function CopyMsgBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success('Copied!');
        setTimeout(() => setCopied(false), 2000);
      }}
      className="text-xs flex items-center gap-1 px-2 py-1 rounded-md transition-all"
      style={{
        background: copied ? 'rgba(79,142,247,0.08)' : 'transparent',
        color: copied ? '#4f8ef7' : '#D1D5DB',
        cursor: 'pointer',
        border: 'none',
      }}
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
      {copied ? 'Copied ✓' : 'Copy'}
    </button>
  );
}

/** Small per-message export (.txt) button */
function ExportMsgBtn({ text, toolId }: { text: string; toolId: string }) {
  const handleExport = () => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `majorka-${toolId}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported!');
  };
  return (
    <button
      onClick={handleExport}
      className="text-xs flex items-center gap-1 px-2 py-1 rounded-md transition-all"
      style={{
        background: 'transparent',
        color: '#D1D5DB',
        cursor: 'pointer',
        border: 'none',
      }}
    >
      <Download size={10} />
      Export
    </button>
  );
}
