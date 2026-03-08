import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Markdown } from "@/components/Markdown";
import { Copy, Send, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { DefaultChatTransport } from "ai";

const BRAND_DNA_SYSTEM_PROMPT = `You are a brand strategist specializing in uncovering and articulating brand DNA.

Your role is to help users discover and define their brand's core identity by analyzing:
1. Brand values and mission
2. Target audience psychographics
3. Unique value proposition
4. Brand personality and tone
5. Visual identity guidelines
6. Brand story and origin
7. Competitive differentiation
8. Long-term vision

When a user describes their brand, conduct a deep analysis and provide:
- Brand DNA Profile (values, mission, personality)
- Target Audience Avatar (detailed psychographics)
- Unique Selling Proposition
- Brand Voice Guidelines
- Visual Identity Recommendations
- Brand Story Framework
- Competitive Positioning Statement

Ask clarifying questions to uncover authentic brand DNA.`;

export default function BrandDNA() {
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { messages, sendMessage, status } = useChat({
    id: "brand-dna",
    messages: [],
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest({ messages }) {
        return {
          body: {
            message: messages[messages.length - 1],
            chatId: "brand-dna",
            systemPrompt: BRAND_DNA_SYSTEM_PROMPT,
          },
        };
      },
    }),
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    setInput("");
    await sendMessage({ role: "user", parts: [{ type: "text", text: input }] } as any);
  };

  const copyLastMessage = () => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "assistant") {
      const text = lastMessage.parts
        .filter((p) => p.type === "text")
        .map((p) => (p as any).text)
        .join("");
      navigator.clipboard.writeText(text);
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
            B
          </div>
          <div>
            <h1 className="font-black text-sm" style={{ fontFamily: "Syne, sans-serif" }}>
              Brand DNA Analyzer
            </h1>
            <p className="text-xs text-muted-foreground">Discover your brand's core identity and values</p>
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
                  Tell me about your brand, and I'll help you uncover and articulate your brand DNA.
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
                  {msg.parts.map((part, j) => {
                    if (part.type === "text") {
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

            {status === "streaming" && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" style={{ color: "#d4af37" }} />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Analyzing brand DNA...</span>
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
                if (e.key === "Enter" && e.ctrlKey) {
                  handleSend();
                }
              }}
              placeholder="Describe your brand, mission, and values..."
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
