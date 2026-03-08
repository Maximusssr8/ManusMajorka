/**
 * Chat API Handler
 *
 * Express endpoint for AI SDK streaming chat with tool calling support.
 * Uses patched fetch to fix OpenAI-compatible proxy issues.
 */

import { streamText, stepCountIs } from "ai";
import { tool } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import type { Express } from "express";
import { z } from "zod/v4";
import { ENV } from "./env";
import { createPatchedFetch } from "./patchedFetch";

/**
 * Creates an OpenAI-compatible provider with patched fetch.
 */
function createLLMProvider() {
  const baseURL = ENV.forgeApiUrl.endsWith("/v1")
    ? ENV.forgeApiUrl
    : `${ENV.forgeApiUrl}/v1`;

  return createOpenAI({
    baseURL,
    apiKey: ENV.forgeApiKey,
    fetch: createPatchedFetch(fetch),
  });
}

/**
 * Example tool registry - customize these for your app.
 */
const tools = {
  getWeather: tool({
    description: "Get the current weather for a location",
    inputSchema: z.object({
      location: z
        .string()
        .describe("The city and country, e.g. 'Tokyo, Japan'"),
      unit: z.enum(["celsius", "fahrenheit"]).optional().default("celsius"),
    }),
    execute: async ({ location, unit }) => {
      // Simulate weather API call
      const temp = Math.floor(Math.random() * 30) + 5;
      const conditions = ["sunny", "cloudy", "rainy", "partly cloudy"][
        Math.floor(Math.random() * 4)
      ] as string;
      return {
        location,
        temperature: unit === "fahrenheit" ? Math.round(temp * 1.8 + 32) : temp,
        unit,
        conditions,
        humidity: Math.floor(Math.random() * 50) + 30,
      };
    },
  }),

  calculate: tool({
    description: "Perform a mathematical calculation",
    inputSchema: z.object({
      expression: z
        .string()
        .describe("The math expression to evaluate, e.g. '2 + 2'"),
    }),
    execute: async ({ expression }) => {
      try {
        // Simple safe eval for basic math
        const sanitized = expression.replace(/[^0-9+\-*/().%\s]/g, "");
        const result = Function(
          `"use strict"; return (${sanitized})`
        )() as number;
        return { expression, result };
      } catch {
        return { expression, error: "Invalid expression" };
      }
    },
  }),
};

/**
 * Registers the /api/chat endpoint for streaming AI responses.
 *
 * @example
 * ```ts
 * // In server/_core/index.ts
 * import { registerChatRoutes } from "./chat";
 *
 * registerChatRoutes(app);
 * ```
 */
export function registerChatRoutes(app: Express) {
  const openai = createLLMProvider();

  app.post("/api/chat", async (req, res) => {
    try {
      const { messages: rawMessages, message, systemPrompt } = req.body;

      // Accept both formats: messages array (AI SDK v6) or singular message (legacy)
      let messages = rawMessages;
      if (!messages && message) {
        // Legacy format: { message: { role, parts: [{type:'text', text:'...'}] } }
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
        role: m.role,
        content: Array.isArray(m.parts)
          ? m.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('')
          : (typeof m.content === 'string' ? m.content : JSON.stringify(m.content)),
      }));

      const defaultSystem =
        "You are a helpful assistant. You have access to tools for getting weather and doing calculations. Use them when appropriate.";

      const result = streamText({
        model: openai.chat("gpt-4o"),
        system: systemPrompt || defaultSystem,
        messages,
        // Only attach tools when using the default system (not custom tool pages)
        ...(systemPrompt ? {} : { tools, stopWhen: stepCountIs(5) }),
      });

      result.pipeUIMessageStreamToResponse(res);
    } catch (error) {
      console.error("[/api/chat] Error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });
}

export { tools };
