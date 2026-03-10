import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Markdown } from "@/components/Markdown";
import { Copy, Send, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

const AI_CHAT_SYSTEM_PROMPT = `You are Majorka — a direct, experienced ecommerce advisor for Australian online sellers.

PERSONALITY:
- Opinionated and sharp. You give verdicts and defend them.
- You reference real Australian context: AUD pricing, Afterpay, Australia Post, Shopify AU ecosystem, TikTok AU, Meta AU CPMs, Gumtree, Catch, eBay AU.
- You sound like a 7-figure store operator giving advice to a founder — not a consultant.
- Never open with "Certainly!", "Great question!" — get straight to the point.
- If someone has a bad idea, tell them it's bad. If it's a real opportunity, get excited.

RULES:
- Ask ONE clarifying question when the request is genuinely vague
- Keep answers under 400 words unless asked for detail
- Use bullet points and tables when comparing options
- End every answer with a concrete next action
- Be conversational but always substantive

EXPERTISE: ecommerce strategy, product research, Meta/TikTok/Google ads, Shopify, supplier sourcing (Alibaba/AliExpress), email marketing, CRO, scaling DTC brands in Australia.`;

export default function AIChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<"idle" | "streaming">("idle");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || status === "streaming") return;
    const userMsg: Message = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setStatus("streaming");
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          systemPrompt: AI_CHAT_SYSTEM_PROMPT,
        }),
      });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
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
            try { fullText += JSON.parse(line.slice(2)); } catch { }
          }
        }
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: fullText };
          return updated;
        });
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "Something went wrong. Please try again." };
        return updated;
      });
    } finally {
      setStatus("idle");
    }
  }, [input, messages, status]);

  const copyLastMessage = () => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "assistant") {
      navigator.clipboard.writeText(lastMessage.content);
      toast.success("Message copied to clipboard!");
    }
  };

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
            <p className="text-xs text-muted-foreground">Get strategic advice on your ecommerce business</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea ref={scrollAreaRef} className="flex-1 mb-4">
          <div className="space-y-4 p-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Sparkles className="w-12 h-12 mb-4" style={{ color: "#d4af37", opacity: 0.3 }} />
                <p className="text-sm text-muted-foreground max-w-xs">
                  Ask me anything about growing your ecommerce business. I'm here to help!
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
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

            {status === "streaming" && messages[messages.length - 1]?.content === "" && (
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
                disabled={status === "streaming" || !input.trim()}
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
        </div>
      </div>
    </div>
  );
}
