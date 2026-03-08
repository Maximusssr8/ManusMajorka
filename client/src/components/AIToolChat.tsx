import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Markdown } from "@/components/Markdown";
import { Download, Copy, Send, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { DefaultChatTransport } from "ai";

interface AIToolChatProps {
  toolId: string;
  toolName: string;
  toolDescription: string;
  toolIcon: React.ReactNode;
  systemPrompt: string;
  placeholder?: string;
  /** If true, extract HTML code blocks and show preview panel */
  showHTMLPreview?: boolean;
}

export default function AIToolChat({
  toolId,
  toolName,
  toolDescription,
  toolIcon,
  systemPrompt,
  placeholder = "Type your message...",
  showHTMLPreview = false,
}: AIToolChatProps) {
  const [generatedHTML, setGeneratedHTML] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    id: toolId,
    messages: [],
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest({ messages }) {
        return {
          body: {
            messages,
            systemPrompt,
          },
        };
      },
    }),
  });

  // Extract HTML from assistant messages (for Website Generator)
  useEffect(() => {
    if (!showHTMLPreview) return;
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
  }, [messages, showHTMLPreview]);

  // Auto-scroll
  useEffect(() => {
    if (scrollAreaRef.current) {
      const el = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const msg = input;
    setInput("");
    await sendMessage({ text: msg });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const copyLastMessage = () => {
    const last = messages[messages.length - 1];
    if (last?.role === "assistant") {
      const text = last.parts
        .filter((p) => p.type === "text")
        .map((p) => (p as any).text)
        .join("");
      copyToClipboard(text);
    }
  };

  const downloadHTML = () => {
    const el = document.createElement("a");
    el.setAttribute("href", "data:text/html;charset=utf-8," + encodeURIComponent(generatedHTML));
    el.setAttribute("download", "landing-page.html");
    el.style.display = "none";
    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);
    toast.success("Downloaded!");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-background">
      {/* Tool Header */}
      <div className="flex-shrink-0 border-b px-5 py-3" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(212,175,55,0.15)", color: "#d4af37" }}
          >
            {toolIcon}
          </div>
          <div>
            <h1 className="font-black text-sm" style={{ fontFamily: "Syne, sans-serif" }}>
              {toolName}
            </h1>
            <p className="text-xs text-muted-foreground">{toolDescription}</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <ScrollArea ref={scrollAreaRef} className="flex-1">
            <div className="space-y-4 p-5">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center py-16">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: "rgba(212,175,55,0.08)" }}
                  >
                    <Sparkles className="w-7 h-7" style={{ color: "#d4af37", opacity: 0.4 }} />
                  </div>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    {toolDescription}. Start by describing what you need.
                  </p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center" style={{ background: "rgba(212,175,55,0.1)" }}>
                      <Sparkles className="w-3.5 h-3.5" style={{ color: "#d4af37" }} />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-xl px-4 py-3 ${
                      msg.role === "user"
                        ? "text-sm"
                        : "text-foreground"
                    }`}
                    style={
                      msg.role === "user"
                        ? { background: "rgba(212,175,55,0.15)", color: "#f5f0e0" }
                        : { background: "rgba(255,255,255,0.03)" }
                    }
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

              {status === "streaming" && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex gap-3 justify-start">
                  <div className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center" style={{ background: "rgba(212,175,55,0.1)" }}>
                    <Sparkles className="w-3.5 h-3.5" style={{ color: "#d4af37" }} />
                  </div>
                  <div className="rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#d4af37" }} />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Bar */}
          <div className="flex-shrink-0 border-t p-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="flex gap-2 items-end">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={placeholder}
                className="resize-none text-sm"
                rows={2}
                style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.1)" }}
              />
              <div className="flex flex-col gap-1.5">
                <Button
                  onClick={handleSend}
                  disabled={status === "streaming" || !input.trim()}
                  size="icon"
                  className="h-9 w-9 rounded-lg"
                  style={{ background: "linear-gradient(135deg, #d4af37, #c09a28)", color: "#080a0e" }}
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
          </div>
        </div>

        {/* HTML Preview Panel (Website Generator only) */}
        {showHTMLPreview && generatedHTML && (
          <div className="w-[380px] flex-shrink-0 flex flex-col border-l" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <Card className="flex-1 flex flex-col overflow-hidden rounded-none border-0" style={{ background: "transparent" }}>
              <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <span className="text-xs font-bold" style={{ fontFamily: "Syne, sans-serif" }}>Generated HTML</span>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-xs px-2 py-1 rounded hover:bg-white/5 transition-colors"
                  style={{ color: "#d4af37" }}
                >
                  {showPreview ? "Code" : "Preview"}
                </button>
              </div>
              <div className="flex-1 overflow-auto p-3">
                {showPreview ? (
                  <iframe
                    srcDoc={generatedHTML}
                    className="w-full h-full border-0 rounded"
                    title="Preview"
                  />
                ) : (
                  <pre className="text-xs overflow-auto text-muted-foreground font-mono whitespace-pre-wrap">
                    <code>{generatedHTML.substring(0, 800)}...</code>
                  </pre>
                )}
              </div>
              <div className="flex gap-2 p-3 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <Button
                  size="sm"
                  className="flex-1 gap-2 text-xs"
                  onClick={() => copyToClipboard(generatedHTML)}
                  variant="outline"
                  style={{ borderColor: "rgba(212,175,55,0.3)", color: "#d4af37" }}
                >
                  <Copy className="w-3 h-3" /> Copy
                </Button>
                <Button
                  size="sm"
                  className="flex-1 gap-2 text-xs"
                  onClick={downloadHTML}
                  style={{ background: "linear-gradient(135deg, #d4af37, #c09a28)", color: "#080a0e" }}
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
