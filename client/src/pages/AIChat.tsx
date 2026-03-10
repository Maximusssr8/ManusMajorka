import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Markdown } from "@/components/Markdown";
import { Copy, Send, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ActiveProductBanner } from "@/components/ActiveProductBanner";

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

type Message = { role: "user" | "assistant"; content: string; isError?: boolean };

export default function AIChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<"idle" | "streaming">("idle");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || status === "streaming") return;
    const userMsg: Message = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
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
        try {
          for (const line of chunk.split("\n")) {
            if (line.startsWith("0:")) {
              try { fullText += JSON.parse(line.slice(2)); } catch (parseErr) {
                console.warn("Malformed chunk line, skipping:", parseErr);
              }
            }
          }
        } catch (chunkErr) {
          console.warn("Error processing chunk, continuing stream:", chunkErr);
        }
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: fullText };
          return updated;
        });
      }
    } catch (err) {
      console.error("Stream error:", err);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "Something went wrong. Please try again.", isError: true };
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

      <ActiveProductBanner />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 mb-4">
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
                      : msg.isError
                      ? "text-foreground"
                      : "bg-muted text-foreground"
                  }`}
                  style={msg.isError ? { background: "rgba(255,100,100,0.12)", border: "1px solid rgba(255,100,100,0.2)" } : undefined}
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
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="flex-shrink-0 border-t p-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask me anything about your business..."
              className="resize-none"
              rows={1}
              style={{ overflowY: 'auto', maxHeight: '200px', resize: 'none' }}
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
