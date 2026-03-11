import { useState, useRef, useEffect, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Markdown } from "@/components/Markdown";
import { Send, Loader2, Sparkles, Trash2, Package } from "lucide-react";
import { useActiveProduct } from "@/hooks/useActiveProduct";

const BASE_SYSTEM_PROMPT = `You are an elite ecommerce advisor with 15 years experience scaling 7-figure Shopify stores. You give specific, actionable advice tailored to the user's exact situation. Never give generic answers.

Default to Australia unless told otherwise: prices in AUD, reference AU suppliers, AU shipping costs, AU Facebook/TikTok ad benchmarks.

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
  const { activeProduct } = useActiveProduct();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Build context-aware system prompt
  const buildSystemPrompt = useCallback(() => {
    const productCtx = activeProduct
      ? `\n\nACTIVE PRODUCT: ${activeProduct.name} | Niche: ${activeProduct.niche} | Stage: ${activeProduct.source}\n\nAlways reference this product specifically when answering questions. Give advice tailored to exactly this product and niche.`
      : "";
    return BASE_SYSTEM_PROMPT + productCtx;
  }, [activeProduct]);

  // Context-aware suggested prompts
  const suggestedPrompts = activeProduct
    ? [
        `What's the best ad angle for ${activeProduct.name}?`,
        `Who is the ideal customer for ${activeProduct.name}?`,
        `What price point should I sell ${activeProduct.name} at?`,
        `How do I validate demand for ${activeProduct.name} quickly?`,
      ]
    : [
        "How do I find a winning product to dropship?",
        "What's a realistic margin for a Shopify store?",
        "How much should I spend on Meta ads to test a product?",
        "What's the fastest way to validate a product idea?",
      ];

  const handleSend = useCallback(async (overrideText?: string) => {
    const msg = (overrideText ?? input).trim();
    if (!msg || status === "streaming") return;
    if (!overrideText) setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const userMsg: Message = { role: "user", content: msg };
    const newMessages = [...messages, userMsg];
    setMessages([...newMessages, { role: "assistant", content: "" }]);
    setStatus("streaming");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          systemPrompt: buildSystemPrompt(),
        }),
      });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();
      const reply = data.reply ?? "";
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: reply };
        return updated;
      });
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
  }, [input, messages, status, buildSystemPrompt]);

  return (
    <div className="flex flex-col h-full" style={{ background: "#080a0e" }}>
      {/* Header */}
      <div
        className="flex-shrink-0 px-5 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#0d0f12" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
            style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)", color: "#080a0e", fontFamily: "Syne, sans-serif" }}
          >
            A
          </div>
          <div className="flex-1">
            <h1 className="font-black text-sm" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8" }}>
              AI Chat
            </h1>
            <p className="text-xs" style={{ color: "rgba(240,237,232,0.35)", fontFamily: "DM Sans, sans-serif" }}>
              {activeProduct ? `Advising on ${activeProduct.name}` : "Ask Majorka anything"}
            </p>
          </div>
          {/* Active product chip */}
          {activeProduct && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
              style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.25)" }}
            >
              <Package size={11} style={{ color: "#d4af37" }} />
              <span className="text-xs font-bold" style={{ color: "#d4af37", fontFamily: "Syne, sans-serif" }}>{activeProduct.name}</span>
              {activeProduct.niche && (
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(212,175,55,0.15)", color: "rgba(212,175,55,0.7)", fontSize: 9 }}>{activeProduct.niche}</span>
              )}
            </div>
          )}
          {/* Clear chat */}
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all"
              style={{ color: "rgba(240,237,232,0.35)", background: "transparent", border: "none", cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
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
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center py-12">
                <Sparkles className="w-10 h-10 mb-4" style={{ color: "#d4af37", opacity: 0.25 }} />
                <p className="text-sm mb-1 font-bold" style={{ fontFamily: "Syne, sans-serif", color: "#f0ede8" }}>
                  {activeProduct ? `Let's talk about ${activeProduct.name}` : "What can I help you with?"}
                </p>
                <p className="text-xs mb-8 max-w-xs" style={{ color: "rgba(240,237,232,0.35)", fontFamily: "DM Sans, sans-serif" }}>
                  {activeProduct
                    ? `I have full context on your ${activeProduct.niche} product and can give you specific, targeted advice.`
                    : "Ask me anything about growing your ecommerce business."}
                </p>
                {/* Suggested prompts */}
                <div className="flex flex-col gap-2 w-full max-w-md">
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(240,237,232,0.25)", fontFamily: "Syne, sans-serif" }}>Suggested</p>
                  {suggestedPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(prompt)}
                      className="text-left text-xs px-4 py-2.5 rounded-lg border transition-all"
                      style={{
                        borderColor: "rgba(212,175,55,0.18)",
                        color: "rgba(212,175,55,0.7)",
                        background: "rgba(212,175,55,0.04)",
                        cursor: "pointer",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(212,175,55,0.35)")}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(212,175,55,0.18)")}
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
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div
                    className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(212,175,55,0.12)", flexShrink: 0 }}
                  >
                    <Sparkles className="w-3.5 h-3.5" style={{ color: "#d4af37" }} />
                  </div>
                )}

                <div
                  className="max-w-[72%] rounded-lg px-4 py-3"
                  style={
                    msg.role === "user"
                      ? {
                          background: "#1a1600",
                          border: "1px solid rgba(212,175,55,0.3)",
                          color: "#f0ede8",
                        }
                      : msg.isError
                      ? { background: "rgba(255,100,100,0.12)", border: "1px solid rgba(255,100,100,0.2)" }
                      : {
                          background: "#0d0f12",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }
                  }
                >
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <Markdown mode="static">{msg.content}</Markdown>
                  </div>
                </div>

                {msg.role === "user" && (
                  <div
                    className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center font-black text-xs"
                    style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)", color: "#080a0e", fontFamily: "Syne, sans-serif", flexShrink: 0 }}
                  >
                    U
                  </div>
                )}
              </div>
            ))}

            {status === "streaming" && messages[messages.length - 1]?.content === "" && (
              <div className="flex gap-3 justify-start">
                <div className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center" style={{ background: "rgba(212,175,55,0.12)" }}>
                  <Sparkles className="w-3.5 h-3.5" style={{ color: "#d4af37" }} />
                </div>
                <div className="rounded-lg px-4 py-3" style={{ background: "#0d0f12", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "#d4af37" }} />
                    <span className="text-xs" style={{ color: "rgba(240,237,232,0.4)" }}>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="flex-shrink-0 px-4 pb-4 pt-2">
          <div
            className="flex items-end gap-2 px-4 py-3 rounded-lg"
            style={{
              background: "#0d0f12",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
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
              placeholder={activeProduct ? `Ask about ${activeProduct.name}...` : "Ask Majorka anything..."}
              rows={1}
              className="flex-1 bg-transparent text-sm outline-none resize-none"
              style={{ color: "#f0ede8", fontFamily: "DM Sans, sans-serif", lineHeight: "1.5", maxHeight: "120px" }}
            />
            <button
              onClick={() => handleSend()}
              disabled={status === "streaming" || !input.trim()}
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 disabled:opacity-30 transition-all"
              style={{
                background: input.trim() ? "linear-gradient(135deg, #d4af37, #c09a28)" : "rgba(255,255,255,0.06)",
                color: input.trim() ? "#080a0e" : "rgba(240,237,232,0.3)",
                cursor: "pointer",
                border: "none",
              }}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs mt-1.5 text-center" style={{ color: "rgba(240,237,232,0.12)" }}>
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
