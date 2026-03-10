import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Markdown } from "@/components/Markdown";
import { Download, Copy, Send, Loader2, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";
import OutputToolbar from "@/components/OutputToolbar";
import RelatedTools from "@/components/RelatedTools";
import { SaveToProduct } from "@/components/SaveToProduct";

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
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIToolChat({
  toolId,
  toolName,
  toolDescription,
  toolIcon,
  systemPrompt,
  placeholder = "Type your message...",
  showHTMLPreview = false,
  examplePrompts,
}: AIToolChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [generatedHTML, setGeneratedHTML] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollAreaRef.current) {
      const el = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [messages, streamingContent]);

  // Extract HTML from last assistant message (for Website Generator)
  useEffect(() => {
    if (!showHTMLPreview) return;
    const lastAssistant = [...messages].reverse().find(m => m.role === "assistant");
    if (lastAssistant) {
      const htmlMatch = lastAssistant.content.match(/```html\n([\s\S]*?)\n```/);
      if (htmlMatch?.[1]) setGeneratedHTML(htmlMatch[1]);
    }
  }, [messages, showHTMLPreview]);

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
        body: JSON.stringify({ messages: newMessages, systemPrompt }),
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
            } catch { /* skip malformed */ }
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const getAllAssistantText = () =>
    messages.filter(m => m.role === "assistant").map(m => m.content).join("\n\n");

  const copyLastMessage = () => {
    const last = messages[messages.length - 1];
    if (last?.role === "assistant") copyToClipboard(last.content);
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

  const hasOutput = messages.some(m => m.role === "assistant");

  const displayMessages = streaming
    ? [...messages, { role: "assistant" as const, content: streamingContent }]
    : messages;

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
          <div className="flex-1">
            <h1 className="font-black text-sm" style={{ fontFamily: "Syne, sans-serif" }}>
              {toolName}
            </h1>
            <p className="text-xs text-muted-foreground">{toolDescription}</p>
          </div>
          {hasOutput && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <OutputToolbar allContent={getAllAssistantText()} toolName={toolName} />
              <SaveToProduct toolId={toolId} toolName={toolName} outputData={getAllAssistantText()} />
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <ScrollArea ref={scrollAreaRef} className="flex-1">
            <div className="space-y-4 p-5">
              {displayMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center py-16">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: "rgba(212,175,55,0.08)" }}
                  >
                    <Sparkles className="w-7 h-7" style={{ color: "#d4af37", opacity: 0.4 }} />
                  </div>
                  <p className="text-sm text-muted-foreground max-w-sm mb-6">
                    {toolDescription}. Start by describing what you need.
                  </p>
                  {examplePrompts && examplePrompts.length > 0 && (
                    <div className="flex flex-col gap-2 w-full max-w-md">
                      <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(240,237,232,0.3)", fontFamily: "Syne, sans-serif" }}>Try an example</p>
                      {examplePrompts.map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => setInput(prompt)}
                          className="text-left text-xs px-4 py-2.5 rounded-xl border transition-all hover:border-yellow-500/40 hover:bg-yellow-500/5"
                          style={{
                            borderColor: "rgba(212,175,55,0.2)",
                            color: "rgba(212,175,55,0.75)",
                            background: "rgba(212,175,55,0.03)",
                          }}
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {displayMessages.map((msg, i) => (
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
                    className={`max-w-[75%] rounded-xl px-4 py-3 ${msg.role === "user" ? "text-sm" : "text-foreground"}`}
                    style={
                      msg.role === "user"
                        ? { background: "rgba(212,175,55,0.15)", color: "#f5f0e0" }
                        : { background: "rgba(255,255,255,0.03)" }
                    }
                  >
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none"
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={() => {/* Allow inline text editing */}}
                      style={{ outline: "none" }}
                    >
                      <Markdown mode="static">{msg.content}</Markdown>
                    </div>
                    {msg.role === "assistant" && !streaming && (
                      <div className="mt-2 flex justify-end">
                        <CopyMsgBtn text={msg.content} />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {streaming && !streamingContent && (
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
                  disabled={streaming || !input.trim()}
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
            <div className="text-xs mt-1.5" style={{ color: "rgba(240,237,232,0.2)" }}>
              Press Enter to send · Shift+Enter for new line
            </div>
          </div>

          {/* Related Tools */}
          <RelatedTools currentToolId={toolId} />
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

/** Small per-message copy button */
function CopyMsgBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Copied!");
        setTimeout(() => setCopied(false), 2000);
      }}
      className="text-xs flex items-center gap-1 px-2 py-1 rounded-md transition-all"
      style={{
        background: copied ? "rgba(45,202,114,0.1)" : "transparent",
        color: copied ? "#2dca72" : "rgba(240,237,232,0.25)",
        cursor: "pointer",
        border: "none",
      }}
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}
