import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Markdown } from "@/components/Markdown";
import { Send, Loader2, Sparkles } from "lucide-react";
import { DefaultChatTransport } from "ai";

const AI_CHAT_SYSTEM_PROMPT = `You are Majorka AI, a helpful ecommerce business advisor.

Your role is to provide strategic guidance on:
1. Ecommerce business growth and scaling
2. Product development and positioning
3. Marketing and customer acquisition strategies
4. Operational efficiency and automation
5. Financial planning and metrics
6. Team building and delegation
7. Technology stack recommendations
8. Industry trends and best practices

Be conversational, insightful, and actionable. Ask clarifying questions to provide tailored advice.
Focus on practical, implementable strategies that drive business results.`;

export default function AIChat() {
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { messages, sendMessage, status } = useChat({
    id: "ai-chat",
    messages: [],
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest({ messages }) {
        return {
          body: {
            message: messages[messages.length - 1],
            chatId: "ai-chat",
            systemPrompt: AI_CHAT_SYSTEM_PROMPT,
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
            <p className="text-xs text-muted-foreground">Ask Majorka anything — I know your products and market</p>
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
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="flex-shrink-0 px-4 pb-4 pt-2">
          <div className="flex items-end gap-2 rounded-2xl px-4 py-3"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
              placeholder="Ask Majorka anything..."
              rows={1}
              className="flex-1 bg-transparent text-sm outline-none resize-none"
              style={{ color: "#f0ede8", fontFamily: "DM Sans, sans-serif", lineHeight: "1.5", maxHeight: "120px" }}
            />
            <button onClick={handleSend}
              disabled={status === "streaming" || !input.trim()}
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-30 transition-all"
              style={{ background: input.trim() ? "linear-gradient(135deg, #d4af37, #c09a28)" : "rgba(255,255,255,0.06)", color: input.trim() ? "#080a0e" : "rgba(240,237,232,0.3)", cursor: "pointer" }}>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs mt-1.5 text-center" style={{ color: "rgba(240,237,232,0.15)" }}>
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
