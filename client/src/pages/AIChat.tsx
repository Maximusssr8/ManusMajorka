import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Markdown } from "@/components/Markdown";
import { Copy, Send, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

const AI_CHAT_SYSTEM_PROMPT = `You are Majorka AI — a straight-talking ecommerce co-founder who's been in the trenches.

You give direct, opinionated advice. You don't hedge. If someone's plan is bad, you say so and tell them what to do instead. You're the experienced mate who's built and scaled stores, not a consultant padding a report.

Default to Australia unless told otherwise: prices in AUD, reference AU suppliers, AU shipping costs, AU Facebook/TikTok ad benchmarks, and the realities of selling to 26 million people instead of 330 million.

Your areas:
- Finding and validating winning products
- Margins, unit economics, and whether something is actually worth pursuing
- Meta, TikTok, and Google ads — what's working right now
- Store setup, CRO, and conversion fundamentals
- Scaling decisions: when to hire, when to expand, when to cut losses

How you communicate:
- Give real numbers. If you don't have exact data, give a reasonable range and say so.
- If they're vague, ask ONE sharp clarifying question. Not five. One.
- Skip the preamble. Lead with the answer.
- End with the 2-3 most important next actions — concrete, not generic.`;

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const el = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [messages, streamingContent]);

  const handleSend = async () => {
    if (!input.trim() || streaming) return;
    const userText = input.trim();
    setInput("");

    const newMessages: Message[] = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setStreaming(true);
    setStreamingContent("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          systemPrompt: AI_CHAT_SYSTEM_PROMPT,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Server error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (line.startsWith("0:")) {
            try {
              fullText += JSON.parse(line.slice(2));
              setStreamingContent(fullText);
            } catch { /* skip malformed lines */ }
          }
        }
      }

      if (fullText) {
        setMessages(prev => [...prev, { role: "assistant", content: fullText }]);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to get a response. Try again.");
    } finally {
      setStreaming(false);
      setStreamingContent("");
    }
  };

  const copyLastMessage = () => {
    const last = messages[messages.length - 1];
    if (last?.role === "assistant") {
      navigator.clipboard.writeText(last.content);
      toast.success("Copied to clipboard!");
    }
  };

  const displayMessages = streaming
    ? [...messages, { role: "assistant" as const, content: streamingContent }]
    : messages;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b p-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
            style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)", color: "#080a0e" }}
          >
            A
          </div>
          <div>
            <h1 className="font-black text-sm" style={{ fontFamily: "Syne, sans-serif" }}>
              AI Chat
            </h1>
            <p className="text-xs text-muted-foreground">Your straight-talking ecommerce co-founder</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea ref={scrollAreaRef} className="flex-1 mb-4">
          <div className="space-y-4 p-4">
            {displayMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Sparkles className="w-12 h-12 mb-4" style={{ color: "#d4af37", opacity: 0.3 }} />
                <p className="text-sm text-muted-foreground max-w-xs">
                  Ask me anything about your ecommerce business. I'll give you a straight answer.
                </p>
              </div>
            )}

            {displayMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" style={{ color: "#d4af37" }} />
                  </div>
                )}

                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2.5 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <Markdown mode="static">{msg.content}</Markdown>
                  </div>
                </div>
              </div>
            ))}

            {streaming && !streamingContent && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" style={{ color: "#d4af37" }} />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="flex-shrink-0 border-t p-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask me anything about your business..."
              className="resize-none"
              rows={3}
            />
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleSend}
                disabled={streaming || !input.trim()}
                size="sm"
                style={{ background: "linear-gradient(135deg, #d4af37, #c09a28)", color: "#080a0e" }}
              >
                <Send className="w-4 h-4" />
              </Button>
              {messages.length > 0 && (
                <Button
                  onClick={copyLastMessage}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="text-xs mt-1.5" style={{ color: "rgba(240,237,232,0.2)" }}>
            Press Enter to send · Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
}
