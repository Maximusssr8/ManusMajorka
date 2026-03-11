/**
 * Chat API Handler
 *
 * Express endpoint for AI chat with persistent memory via chat_messages table.
 * Returns plain JSON { reply } — streaming not used (Vercel serverless limitation).
 */

import type { Application } from "express";
import { getAnthropicClient, CLAUDE_MODEL } from "../lib/anthropic";
import { getSupabaseAdmin } from "./supabase";

const MAX_HISTORY = 20;

/** Load last N messages for this user+tool from chat_messages */
async function loadHistory(userId: string, toolName: string): Promise<Array<{ role: "user" | "assistant"; content: string }>> {
  try {
    const sb = getSupabaseAdmin();
    const { data } = await sb
      .from("chat_messages")
      .select("role, content")
      .eq("user_id", userId)
      .eq("tool_name", toolName)
      .order("created_at", { ascending: false })
      .limit(MAX_HISTORY);
    if (!data || data.length === 0) return [];
    return (data as Array<{ role: string; content: string }>)
      .reverse()
      .map(m => ({ role: m.role as "user" | "assistant", content: m.content }));
  } catch {
    return [];
  }
}

/** Save a single message to chat_messages */
async function saveMessage(userId: string, toolName: string, role: "user" | "assistant", content: string): Promise<void> {
  try {
    const sb = getSupabaseAdmin();
    await sb.from("chat_messages").insert({ user_id: userId, tool_name: toolName, role, content });
    // Trim to MAX_HISTORY — delete oldest beyond limit
    const { data: all } = await sb
      .from("chat_messages")
      .select("id")
      .eq("user_id", userId)
      .eq("tool_name", toolName)
      .order("created_at", { ascending: false });
    if (all && all.length > MAX_HISTORY) {
      const toDelete = all.slice(MAX_HISTORY).map((r: { id: string }) => r.id);
      await sb.from("chat_messages").delete().in("id", toDelete);
    }
  } catch { /* non-fatal */ }
}

/** Fetch user profile from profiles or userProfiles table */
async function fetchUserProfile(userId: string) {
  try {
    const sb = getSupabaseAdmin();
    const { data } = await sb
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    return data;
  } catch {
    return null;
  }
}

/** Build personalised system prompt */
function buildSystemPrompt(customPrompt: string | undefined, profile: Record<string, string> | null, toolName: string): string {
  const isAIChat = !customPrompt || toolName === "ai-chat";

  const base = customPrompt || `You are Majorka AI — a sharp, direct ecommerce co-founder.`;

  // Only inject profile + personality for the main AI Chat, not structured tool pages
  // Tool pages send their own precise system prompts (JSON schemas etc) that must not be overridden
  if (!isAIChat) return base;

  const profileCtx = profile
    ? `\n\nUSER PROFILE:\n- Name: ${profile.display_name || profile.full_name || "there"}\n- Niche: ${profile.target_niche || profile.business_niche || "not set"}\n- Experience: ${profile.experience_level || "unknown"}\n- Goal: ${profile.main_goal || "grow ecommerce business"}\n- Country: ${profile.country || "Australia"}`
    : "";

  const personality = `\n\nBEHAVIOUR RULES:
- You remember everything this user has told you and build on it over time.
- Never repeat advice you've already given. Reference past context naturally.
- Be direct and specific. No fluff, no generic advice.
- If you know their niche, always relate answers to it.
- Use Australian context (AUD, local platforms, AU shipping) by default.
- Occasionally reference things they've mentioned before to show you remember.
- Format responses with bullet points and **bold headers** where useful.
- Max 400 words per response unless asked for something detailed.
- When the user mentions a product idea or budget, reference it in future replies.
- If the user seems frustrated, acknowledge it directly.`;

  return base + profileCtx + personality;
}

export function registerChatRoutes(app: Application) {
  // ── Clear chat history ──────────────────────────────────────────────────
  app.delete("/api/chat/history", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
      const toolName = (req.query.tool as string) || "ai-chat";
      if (!token) { res.status(401).json({ error: "Unauthorized" }); return; }
      const { data: { user } } = await getSupabaseAdmin().auth.getUser(token);
      if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
      await getSupabaseAdmin().from("chat_messages").delete().eq("user_id", user.id).eq("tool_name", toolName);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Main chat endpoint ──────────────────────────────────────────────────
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages: rawMessages, message, systemPrompt, toolName = "ai-chat", searchQuery } = req.body;

      // Accept both formats: messages array or singular message
      let messages = rawMessages;
      if (!messages && message) {
        const text = Array.isArray(message.parts)
          ? message.parts.filter((p: any) => p.type === "text").map((p: any) => p.text).join("")
          : (typeof message.content === "string" ? message.content : "");
        messages = [{ role: message.role || "user", content: text }];
      }

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ error: "messages array is required" });
        return;
      }

      // Normalise messages
      messages = messages
        .map((m: any) => ({
          role: m.role === "user" ? "user" as const : "assistant" as const,
          content: Array.isArray(m.parts)
            ? m.parts.filter((p: any) => p.type === "text").map((p: any) => p.text).join("")
            : (typeof m.content === "string" ? m.content : JSON.stringify(m.content)),
        }))
        .filter((m: any) => m.role === "user" || m.role === "assistant");

      if (messages.length > 0 && messages[0].role !== "user") messages = messages.slice(1);
      if (messages.length === 0) { res.status(400).json({ error: "At least one user message is required" }); return; }

      // ── Auth + memory ───────────────────────────────────────────────────
      let userId: string | null = null;
      let profile: Record<string, string> | null = null;

      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        try {
          const token = authHeader.slice(7);
          const { data: { user }, error } = await getSupabaseAdmin().auth.getUser(token);
          if (!error && user) {
            userId = user.id;
            profile = await fetchUserProfile(userId);

            // Load persistent history only for AI Chat (not structured tool pages)
            const history = toolName === "ai-chat" ? await loadHistory(userId, toolName) : [];
            if (history.length > 0) {
              messages = [...history, ...messages];
              // Deduplicate consecutive same-role messages
              const cleaned: typeof messages = [];
              for (const m of messages) {
                if (cleaned.length === 0) { if (m.role === "user") cleaned.push(m); continue; }
                if (m.role !== cleaned[cleaned.length - 1]!.role) cleaned.push(m);
              }
              messages = cleaned.length > 0 ? cleaned : messages;
            }
          }
        } catch { /* not authenticated */ }
      }

      // ── Web search context ──────────────────────────────────────────────
      let webContext = "";
      if (searchQuery && typeof searchQuery === "string" && searchQuery.trim()) {
        try {
          const tavilyKey = process.env.TAVILY_API_KEY;
          if (tavilyKey) {
            const sr = await fetch("https://api.tavily.com/search", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ api_key: tavilyKey, query: searchQuery, search_depth: "basic", max_results: 4 }),
            }).then(r => r.json()).catch(() => null);
            if (sr?.results?.length > 0) {
              webContext = `\n\nLIVE WEB DATA:\n${sr.results.map((r: any, i: number) => `[${i+1}] ${r.title}: ${r.content}`).join("\n")}`;
            }
          }
        } catch { /* non-fatal */ }
      }

      // ── Build system prompt ─────────────────────────────────────────────
      const system = buildSystemPrompt(systemPrompt, profile, toolName) + webContext;

      // ── Claude call ─────────────────────────────────────────────────────
      const client = getAnthropicClient();
      const aiResponse = await client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1500,
        system,
        messages,
      });

      const reply = aiResponse.content[0]?.type === "text" ? aiResponse.content[0].text : "";

      // ── Save to memory (fire-and-forget) ────────────────────────────────
      if (userId && reply) {
        const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
        if (lastUserMsg) {
          saveMessage(userId, toolName, "user", lastUserMsg.content).catch(() => {});
          saveMessage(userId, toolName, "assistant", reply).catch(() => {});
        }
      }

      res.json({ reply });

    } catch (error: any) {
      console.error("[/api/chat] Error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || "Internal server error" });
      }
    }
  });
}
