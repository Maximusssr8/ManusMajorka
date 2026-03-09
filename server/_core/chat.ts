/**
 * Chat API Handler
 *
 * Express endpoint for Anthropic Claude streaming chat.
 * Uses simple line-delimited JSON format: 0:"text"\n for text, d:{} for done, e:{} for error.
 */

import type { Express } from "express";
import { getAnthropicClient, CLAUDE_MODEL, BASE_SYSTEM_PROMPT } from "../lib/anthropic";

/**
 * Registers the /api/chat endpoint for streaming AI responses via Anthropic Claude.
 */
export function registerChatRoutes(app: Express) {
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages: rawMessages, message, systemPrompt } = req.body;

      // Accept both formats: messages array or singular message (legacy)
      let messages = rawMessages;
      if (!messages && message) {
        const text = Array.isArray(message.parts)
          ? message.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('')
          : (typeof message.content === 'string' ? message.content : '');
        messages = [{ role: message.role || 'user', content: text }];
      }

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ error: "messages array is required" });
        return;
      }

      // Normalise messages: convert parts-based UIMessage to plain {role, content}
      messages = messages.map((m: any) => ({
        role: m.role === "user" ? "user" as const : "assistant" as const,
        content: Array.isArray(m.parts)
          ? m.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('')
          : (typeof m.content === 'string' ? m.content : JSON.stringify(m.content)),
      }));

      // Filter out system messages and ensure alternating user/assistant
      messages = messages.filter((m: any) => m.role === "user" || m.role === "assistant");

      // Ensure messages start with a user message
      if (messages.length > 0 && messages[0].role !== "user") {
        messages = messages.slice(1);
      }

      if (messages.length === 0) {
        res.status(400).json({ error: "At least one user message is required" });
        return;
      }

      // Build the system prompt
      const system = systemPrompt
        ? `${BASE_SYSTEM_PROMPT}\n\n${systemPrompt}`
        : BASE_SYSTEM_PROMPT;

      const client = getAnthropicClient();

      // Set up streaming response headers
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Vercel-AI-Data-Stream", "v1");
      res.flushHeaders();

      // Create streaming response from Anthropic
      const stream = client.messages.stream({
        model: CLAUDE_MODEL,
        max_tokens: 4096,
        system,
        messages,
      });

      // Handle client disconnect
      let aborted = false;
      req.on("close", () => {
        aborted = true;
        try { stream.abort(); } catch { /* ignore */ }
      });

      // Stream text deltas using the line-delimited format
      stream.on("text", (text) => {
        if (!aborted) {
          try {
            res.write(`0:${JSON.stringify(text)}\n`);
          } catch { /* response closed */ }
        }
      });

      stream.on("error", (error) => {
        if (error?.name === "APIUserAbortError" || error?.message?.includes("aborted")) return;
        console.error("[/api/chat] Stream error:", error);
        if (!aborted) {
          try {
            res.write(`e:${JSON.stringify({ error: error.message || "Stream error" })}\n`);
          } catch { /* response closed */ }
        }
      });

      // Wait for stream to complete
      try {
        await stream.finalMessage();
      } catch (err: any) {
        if (err?.name !== "APIUserAbortError" && !err?.message?.includes("aborted")) {
          console.error("[/api/chat] Stream completion error:", err);
        }
      }

      // Send finish signal
      if (!aborted) {
        try {
          res.write(`d:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n`);
          res.end();
        } catch { /* response closed */ }
      }

    } catch (error: any) {
      if (error?.name === "APIUserAbortError" || error?.message?.includes("aborted")) {
        return;
      }
      console.error("[/api/chat] Error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || "Internal server error" });
      } else {
        try {
          res.write(`e:${JSON.stringify({ error: "Internal server error" })}\n`);
          res.end();
        } catch { /* ignore */ }
      }
    }
  });
}
