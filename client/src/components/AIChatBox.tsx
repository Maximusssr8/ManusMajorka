/**
 * AIChatBox Component
 *
 * Production-ready chat component using custom SSE streaming.
 * Parses server's `data: {"text":"..."}` format directly.
 * Used for the AI Chat tool and component showcase.
 */

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Markdown } from "@/components/Markdown";
import { cn } from "@/lib/utils";
import { Loader2, Send, Sparkles } from "lucide-react";
import { useState, useRef, useEffect, ReactNode } from "react";

// ============================================================================
// TYPES
// ============================================================================

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
}

export interface AIChatBoxProps {
  /** API endpoint for chat (default: "/api/chat") */
  api?: string;

  /** Unique chat ID - used for conversation namespacing */
  chatId: string;

  /** Optional auth token for authenticated requests */
  authToken?: string;

  /** Optional tool name for server-side memory */
  toolName?: string;

  /** Optional market code */
  market?: string;

  /** Optional system prompt override */
  systemPrompt?: string;

  /** Called when a message exchange completes */
  onFinish?: (messages: Message[]) => void;

  /** Placeholder text for the input field */
  placeholder?: string;

  /** Additional CSS classes for the container */
  className?: string;

  /** Message shown when chat is empty */
  emptyStateMessage?: string;

  /** Suggested prompts shown in empty state */
  suggestedPrompts?: string[];

  /** Custom renderer for a message (optional) */
  renderMessage?: (msg: Message) => ReactNode | null;
}

// ============================================================================
// THINKING INDICATOR
// ============================================================================

function ThinkingIndicator() {
  return (
    <div className="flex gap-3 justify-start items-start">
      <div className="size-8 shrink-0 mt-1 rounded-full bg-primary/10 flex items-center justify-center">
        <Sparkles className="size-4 text-primary" />
      </div>
      <div className="bg-muted rounded-lg px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Thinking...</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MESSAGE BUBBLE
// ============================================================================

function MessageBubble({
  message,
  isStreaming,
}: {
  message: Message;
  isStreaming: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end items-start" : "justify-start items-start")}>
      {!isUser && (
        <div className="size-8 shrink-0 mt-1 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="size-4 text-primary" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2.5",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
        )}
      >
        {!message.content && isStreaming ? (
          <div className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Thinking...</span>
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <Markdown mode={isStreaming && !isUser ? "streaming" : "static"}>
              {message.content}
            </Markdown>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

let _msgIdCounter = 0;
const genId = () => `msg-${++_msgIdCounter}-${Date.now()}`;

export function AIChatBox({
  api = "/api/chat",
  chatId,
  authToken,
  toolName = "ai-chat",
  market = "AU",
  systemPrompt,
  onFinish,
  renderMessage,
  placeholder = "Type your message...",
  className,
  emptyStateMessage = "Start a conversation with AI",
  suggestedPrompts,
}: AIChatBoxProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<"idle" | "streaming" | "submitted">("idle");
  const [error, setError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLDivElement;
    if (viewport) {
      requestAnimationFrame(() => {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
      });
    }
  }, [messages, status]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || status !== "idle") return;

    setError(null);
    const userMsg: Message = { id: genId(), role: "user", content: trimmed };
    const assistantMsg: Message = { id: genId(), role: "assistant", content: "" };

    const newMessages = [...messages, userMsg];
    setMessages([...newMessages, assistantMsg]);
    setStatus("submitted");

    abortRef.current = new AbortController();

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

      const response = await fetch(`${api}?stream=1`, {
        method: "POST",
        headers,
        signal: abortRef.current.signal,
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          toolName,
          market,
          stream: true,
          ...(systemPrompt ? { systemPrompt } : {}),
        }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      setStatus("streaming");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      if (reader) {
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6);
            if (raw === "[DONE]") continue;
            try {
              const payload = JSON.parse(raw);
              if (payload.text !== undefined) {
                accumulated += payload.text;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { ...assistantMsg, content: accumulated };
                  return updated;
                });
              }
            } catch { /* skip malformed */ }
          }
        }
      }

      // Fallback: if streaming produced nothing, try non-streaming
      if (!accumulated) {
        const fallback = await fetch(api, {
          method: "POST",
          headers,
          body: JSON.stringify({
            messages: newMessages.map(m => ({ role: m.role, content: m.content })),
            toolName,
            market,
            stream: false,
            ...(systemPrompt ? { systemPrompt } : {}),
          }),
        });
        if (fallback.ok) {
          const data = await fallback.json();
          accumulated = data.reply ?? "";
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...assistantMsg, content: accumulated };
            return updated;
          });
        }
      }

      const finalMessages = [...newMessages, { ...assistantMsg, content: accumulated }];
      onFinish?.(finalMessages);
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setError(err.message || "Something went wrong");
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...assistantMsg,
          content: "Something went wrong. Please try again.",
          isError: true,
        };
        return updated;
      });
    } finally {
      setStatus("idle");
      abortRef.current = null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
      setInput("");
    }
  };

  const canSend = status === "idle";
  const isStreaming = status === "streaming";
  const isWaiting = status === "submitted";
  const lastMsg = messages[messages.length - 1];
  const showThinking = isWaiting || (isStreaming && lastMsg?.role === "assistant" && !lastMsg.content);

  return (
    <div className={cn("flex flex-col flex-1 min-h-0", className)}>
      {/* Messages */}
      <div ref={scrollAreaRef} className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="mx-auto max-w-3xl space-y-4 p-4">
            {messages.length === 0 && !showThinking ? (
              <div className="flex h-[60vh] flex-col items-center justify-center gap-6 text-muted-foreground">
                <Sparkles className="size-12 opacity-20" />
                <p className="text-center max-w-md">{emptyStateMessage}</p>
                {suggestedPrompts && suggestedPrompts.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                    {suggestedPrompts.map((prompt, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          setInput(prompt);
                          textareaRef.current?.focus();
                        }}
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => {
                  const isLast = idx === messages.length - 1;
                  if (renderMessage) {
                    const custom = renderMessage(msg);
                    if (custom !== null) return <div key={msg.id}>{custom}</div>;
                  }
                  return (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isStreaming={isStreaming && isLast && msg.role === "assistant"}
                    />
                  );
                })}
                {showThinking && <ThinkingIndicator />}
              </>
            )}
            {error && (
              <div className="rounded-lg bg-destructive/10 p-4 text-destructive text-sm">
                Error: {error}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t bg-background/50 p-4">
        <div className="mx-auto max-w-3xl">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="min-h-[44px] max-h-32 resize-none"
              rows={1}
              disabled={!canSend}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!canSend || !input.trim()}
              className="shrink-0 h-[44px] w-[44px]"
            >
              {!canSend ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default AIChatBox;
