import { useState, useRef, useEffect, useCallback } from "react";
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
import { ActiveProductBanner } from "@/components/ActiveProductBanner";

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

type Message = { role: "user" | "assistant"; content: string; isError?: boolean };

export default function AIToolChat({
  toolId,
  toolName,
  toolDescription,
  toolIcon,
  systemPrompt,
  placeholder = "Type your message...",
  showHTMLPreview = false,
  examplePrompts,
  initialMessage,
}: AIToolChatProps) {
  const [generatedHTML, setGeneratedHTML] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<"idle" | "streaming">("idle");
  // Extract HTML from assistant messages (for Website Generator)
  useEffect(() => {
    if (!showHTMLPreview) return;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "assistant") {
      const htmlMatch = lastMessage.content.match(/```html\n([\s\S]*?)\n```/);
      if (htmlMatch && htmlMatch[1]) {
        try {
          setGeneratedHTML(htmlMatch[1]);
          setPreviewError(false);
        } catch (err) {
          console.warn("Failed to set generated HTML:", err);
          setPreviewError(true);
        }
      }
    }
  }, [messages, showHTMLPreview]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-send initialMessage on mount
  const initialSent = useRef(false);
  useEffect(() => {
    if (initialMessage && !initialSent.current && messages.length === 0) {
      initialSent.current = true;
      sendMessage({ text: initialMessage });
    }
  }, [initialMessage, messages.length, sendMessage]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const msg = input;
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
          systemPrompt,
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
  }, [input, messages, status, systemPrompt]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const getAllAssistantText = () => {
    return messages
      .filter(m => m.role === "assistant")
      .map(m => m.content)
      .join("\n\n");
  };

  const copyLastMessage = () => {
    const last = messages[messages.length - 1];
    if (last?.role === "assistant") {
      copyToClipboard(last.content);
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

  const hasOutput = messages.some(m => m.role === "assistant");

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

      {/* Active Product Banner */}
      <ActiveProductBanner
        ctaLabel="Load into chat"
        onUseProduct={(summary) => {
          setInput(`I want to work on this product:\n\n${summary}`);
        }}
      />

      {/* Chat Area */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <ScrollArea className="flex-1">
            <div className="space-y-4 p-5">
              {messages.length === 0 && (
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
                          onClick={() => {
                            setInput(prompt);
                          }}
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
                        : msg.isError
                        ? { background: "rgba(255,100,100,0.12)", border: "1px solid rgba(255,100,100,0.2)" }
                        : { background: "rgba(255,255,255,0.03)" }
                    }
                  >
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <Markdown mode="static">{msg.content}</Markdown>
                    </div>
                    {/* Per-message copy button */}
                    {msg.role === "assistant" && (
                      <div className="mt-2 flex justify-end">
                        <CopyMsgBtn text={msg.content} />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {status === "streaming" && messages[messages.length - 1]?.content === "" && (
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

              {/* GO/NO-GO verdict action buttons */}
              {(() => {
                const lastAssistantMsg = [...messages].reverse().find(m => m.role === "assistant");
                const lastContent = lastAssistantMsg?.parts
                  .filter((p) => p.type === "text")
                  .map((p) => (p as any).text)
                  .join("") || "";
                const verdict = lastContent.match(/Verdict:\s*\*?\*?\s*(GO|NO-GO|PIVOT)/i)?.[1]?.toUpperCase();
                if (!verdict || status !== "ready") return null;
                return (
                  <div className="flex gap-3 mt-2 p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="flex-1">
                      <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(240,237,232,0.35)", fontFamily: "Syne, sans-serif" }}>What's next?</div>
                      <div className="flex gap-2 flex-wrap">
                        {(verdict === "GO" || verdict === "PIVOT") && (
                          <button onClick={() => window.location.href = "/app/website-generator"}
                            className="text-xs font-bold px-4 py-2 rounded-xl"
                            style={{ background: "linear-gradient(135deg, #d4af37, #f0c040)", color: "#080a0e", cursor: "pointer" }}>
                            Build landing page →
                          </button>
                        )}
                        {verdict === "NO-GO" && (
                          <button onClick={() => { setInput(""); }}
                            className="text-xs font-bold px-4 py-2 rounded-xl"
                            style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.25)", color: "#d4af37", cursor: "pointer" }}>
                            Try different idea →
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center font-black text-sm"
                      style={{
                        background: verdict === "GO" ? "rgba(45,202,114,0.12)" : verdict === "NO-GO" ? "rgba(224,92,122,0.12)" : "rgba(212,175,55,0.12)",
                        color: verdict === "GO" ? "#2dca72" : verdict === "NO-GO" ? "#e05c7a" : "#d4af37",
                        fontFamily: "Syne, sans-serif",
                        border: `1px solid ${verdict === "GO" ? "rgba(45,202,114,0.25)" : verdict === "NO-GO" ? "rgba(224,92,122,0.25)" : "rgba(212,175,55,0.25)"}`,
                      }}>
                      {verdict}
                    </div>
                  </div>
                );
              })()}
            </div>
          </ScrollArea>

          {/* Input Bar */}
          <div className="flex-shrink-0 border-t p-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
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
                  // Enter to send, Shift+Enter for newline, Cmd/Ctrl+Enter also sends
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={placeholder}
                className="resize-none text-sm"
                rows={1}
                style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.1)", overflowY: 'auto', maxHeight: '200px', resize: 'none' }}
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
