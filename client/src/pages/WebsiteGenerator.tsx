import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Markdown } from "@/components/Markdown";
import { Download, Copy, Send, Loader2, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { DefaultChatTransport } from "ai";

const WEBSITE_GENERATOR_SYSTEM_PROMPT = `You are an expert Shopify landing page generator. Your role is to help users create high-converting product landing pages in HTML + Tailwind CSS.

When a user provides product details, you will:
1. Ask clarifying questions about their product, target audience, and key selling points
2. Generate a complete, production-ready HTML landing page with embedded Tailwind CSS
3. Include sections: hero, features, benefits, testimonials, pricing, FAQ, CTA
4. Use a dark gold aesthetic (#d4af37 accent, dark background #0a0a0b)
5. Ensure mobile responsiveness and accessibility
6. Include conversion optimization best practices

When generating HTML, wrap the complete code in a code block with \`\`\`html tags.

Always ask for:
- Product name and category
- Target audience
- Key benefits (top 3)
- Price point
- Call-to-action text
- Any specific brand colors or images

Generate clean, semantic HTML with inline Tailwind CSS utilities. Make it copy-paste ready.`;

export default function WebsiteGenerator() {
  const [generatedHTML, setGeneratedHTML] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { messages, sendMessage, status } = useChat({
    id: "website-generator",
    messages: [],
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest({ messages }) {
        return {
          body: {
            message: messages[messages.length - 1],
            chatId: "website-generator",
            systemPrompt: WEBSITE_GENERATOR_SYSTEM_PROMPT,
          },
        };
      },
    }),
  });

  // Extract HTML from assistant messages
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "assistant") {
      const textContent = lastMessage.parts
        .filter((p) => p.type === "text")
        .map((p) => (p as any).text)
        .join("");

      const htmlMatch = textContent.match(/```html\n([\s\S]*?)\n```/);
      if (htmlMatch && htmlMatch[1]) {
        setGeneratedHTML(htmlMatch[1]);
      }
    }
  }, [messages]);

  // Auto-scroll to latest message
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedHTML);
    toast.success("HTML copied to clipboard!");
  };

  const downloadHTML = () => {
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/html;charset=utf-8," + encodeURIComponent(generatedHTML));
    element.setAttribute("download", "landing-page.html");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Landing page downloaded!");
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b p-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
            style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)", color: "#080a0e" }}
          >
            W
          </div>
          <div>
            <h1 className="font-black text-sm" style={{ fontFamily: "Syne, sans-serif" }}>
              Website Generator
            </h1>
            <p className="text-xs text-muted-foreground">Create high-converting Shopify landing pages with AI</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 overflow-hidden p-4">
        {/* Chat Section */}
        <div className="flex-1 flex flex-col min-w-0">
          <ScrollArea ref={scrollAreaRef} className="flex-1 mb-4">
            <div className="space-y-4 p-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <Zap className="w-12 h-12 mb-4" style={{ color: "#d4af37", opacity: 0.3 }} />
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Tell me about your product, and I'll generate a high-converting landing page for you.
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
              placeholder="Describe your product..."
              className="resize-none"
              rows={3}
            />
            <Button
              onClick={handleSend}
              disabled={status === "streaming" || !input.trim()}
              size="sm"
              className="self-end"
              style={{ background: "linear-gradient(135deg, #d4af37, #c09a28)", color: "#080a0e" }}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Preview/Output Section */}
        {generatedHTML && (
          <div className="w-96 flex flex-col gap-3">
            <Card className="flex-1 flex flex-col overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" style={{ color: "#d4af37" }} />
                  <span className="text-xs font-bold">Generated HTML</span>
                </div>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-xs px-2 py-1 rounded hover:bg-white/5 transition-colors"
                >
                  {showPreview ? "Code" : "Preview"}
                </button>
              </div>

              <div className="flex-1 overflow-auto p-3">
                {showPreview ? (
                  <iframe
                    srcDoc={generatedHTML}
                    className="w-full h-full border-0 rounded"
                    title="Landing page preview"
                  />
                ) : (
                  <pre className="text-xs overflow-auto text-muted-foreground font-mono">
                    <code>{generatedHTML.substring(0, 500)}...</code>
                  </pre>
                )}
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 gap-2"
                onClick={copyToClipboard}
                style={{ background: "rgba(212,175,55,0.1)", color: "#d4af37", border: "1px solid rgba(212,175,55,0.25)" }}
              >
                <Copy className="w-4 h-4" />
                Copy
              </Button>
              <Button
                size="sm"
                className="flex-1 gap-2"
                onClick={downloadHTML}
                style={{ background: "linear-gradient(135deg, #d4af37, #c09a28)", color: "#080a0e" }}
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
