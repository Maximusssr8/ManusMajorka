/**
 * Chat API Handler
 *
 * Express endpoint for AI chat with persistent memory via chat_messages table.
 * Supports SSE streaming (pass ?stream=1 or stream:true in body) for real-time
 * token display, with plain JSON { reply } fallback for non-streaming clients.
 */

import type { Application } from "express";
import { getAnthropicClient, CLAUDE_MODEL } from "../lib/anthropic";
import { getSupabaseAdmin } from "./supabase";
import { type MarketCode, MARKETS, buildMarketContext, DEFAULT_MARKET } from "../../shared/markets";

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
/** Server-side fallback prompts for tools that require specific output formats */
const TOOL_FALLBACK_PROMPTS: Record<string, string> = {
  "website-generator": `CRITICAL: Respond ONLY with a valid JSON object starting with { — absolutely no markdown, no text before or after, no code fences. RAW JSON ONLY starting with {.

You are an elite AU Shopify builder (200+ stores built). Generate a website theme as a JSON object with EXACTLY these keys:
{"headline":"<10 words, benefit-driven>","subheadline":"<objection-busting, 1 sentence>","features":["<benefit 1>","<benefit 2>","<benefit 3>","<benefit 4>","<benefit 5>"],"cta_primary":"<CTA text>","cta_secondary":"<secondary CTA>","trust_badges":["Australian Owned","Afterpay & Zip Available","Free AU Shipping $79+","30-Day Returns (ACCC Protected)","Secure Checkout","Fast AusPost Delivery"],"about_section":"<2 sentences, AU brand story>","email_subject":"<welcome email subject>","meta_description":"<SEO meta, max 155 chars>","files":{"index.html":"<complete self-contained HTML landing page with inline CSS, Afterpay messaging, GST-inclusive prices, AusPost shipping copy, trust badges, AU English. Must have: hero, features, social proof, CTA sections>","styles.css":"<additional CSS variables and utility classes for the theme, AU-specific colour palette>"}}

Keep files compact but functional. Total JSON must be under 3000 tokens. Output ONLY the JSON object — no other text.`,
  "validate": `You are a DTC financial analyst for the AU market. ALWAYS output: (1) Full COGS breakdown in AUD table, (2) Gross margin %, (3) Break-even ROAS formula, (4) Monthly units needed for $5K and $10K AUD profit, (5) GO/NO-GO/PIVOT verdict. Use AUD throughout. Show all maths.`,
  "email-sequences": `You are an AU email specialist. Every sequence MUST include Spam Act 2003 compliance (unsubscribe link, sender identity, physical address). Use Klaviyo format, AEST timings, AU English. Include Afterpay reminders and EOFY seasonal hooks.`,
  "tiktok-builder": `You are an AU TikTok content strategist. Create faceless TikTok slideshow scripts with AU-specific hooks, AU hashtags, and AEST posting times. Output slide-by-slide with text overlays, captions, and audio recommendations.`,
};

function buildSystemPrompt(customPrompt: string | undefined, profile: Record<string, string> | null, toolName: string, marketCode?: MarketCode): string {
  const isAIChat = !customPrompt || toolName === "ai-chat";

  // Use custom prompt if provided, else check for tool-specific fallback, else use generic
  const base = customPrompt || TOOL_FALLBACK_PROMPTS[toolName] || `You are Majorka AI — a sharp, direct ecommerce co-founder.`;

  // Inject user profile context for ALL tools so responses are personalised
  const goals = profile?.main_goal?.includes(",")
    ? profile.main_goal.split(",").map((g: string) => g.trim()).join(", ")
    : profile?.main_goal;

  const experienceMap: Record<string, string> = {
    beginner: "just starting out, never sold online",
    intermediate: "has a store, some experience",
    advanced: "experienced seller, looking to scale",
  };

  const mc = marketCode ? MARKETS[marketCode] : MARKETS[DEFAULT_MARKET];
  const marketCtx = buildMarketContext(marketCode || DEFAULT_MARKET);

  const profileCtx = profile
    ? `\n\nUSER PROFILE (tailor ALL responses to this context):\n- Name: ${profile.display_name || profile.full_name || "there"}\n- Country: ${profile.country || mc.name}\n- Niche: ${profile.target_niche || profile.business_niche || "not set"}\n- Experience: ${experienceMap[profile.experience_level] || profile.experience_level || "unknown"}\n- Primary goals: ${goals || "grow ecommerce business"}\n- Budget: ${profile.budget || "not set"}\n- Store URL: ${profile.business_name || "not provided"}\n${marketCtx}\nIMPORTANT: You are speaking to a ${mc.name} ecommerce operator. Use ${mc.currency} for all currency, reference ${mc.name}-specific shipping (${mc.shipping.slice(0, 2).join(", ")}), BNPL (${mc.bnpl.slice(0, 2).join(", ")}), and ${mc.compliance.slice(0, 2).join(", ")} compliance where relevant. Tailor product suggestions, pricing, and strategies to the ${mc.name} market. Reference their specific niche and experience level in every response.`
    : `\n${marketCtx}`;

  // AI Chat gets full personality rules; tool pages get profile context + lighter memory rules
  if (!isAIChat) {
    const toolMemoryRules = `\n\nSESSION MEMORY RULES:
- Remember what the user has told you in this conversation — their product, niche, budget, store URL.
- Build on previous answers. If they asked about a posture corrector earlier, reference it.
- Never repeat the same advice. If you already covered something, reference it and move forward.
- Relate all answers to their specific product/niche when known.`;
    return base + profileCtx + toolMemoryRules;
  }

  const personality = `\n\nBEHAVIOUR RULES:
- You remember everything this user has told you and build on it over time.
- Never repeat advice you've already given. Reference past context naturally.
- Be direct and specific. No fluff, no generic advice.
- If you know their niche, always relate answers to it.
- Use ${mc.name} context (${mc.currency}, local platforms, ${mc.name} shipping) by default.
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
      const { messages: rawMessages, message, systemPrompt, toolName = "ai-chat", searchQuery, market: rawMarket } = req.body;
      const market = (rawMarket && rawMarket in MARKETS ? rawMarket : DEFAULT_MARKET) as MarketCode;

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

            // Load persistent history for all tools so users get session continuity
            const history = await loadHistory(userId, toolName);
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
      const system = buildSystemPrompt(systemPrompt, profile, toolName, market) + webContext;

      // ── Determine if client wants streaming (default: true) ──────────
      const wantStream = req.body.stream !== false && req.query.stream !== "0";
      // Detect AI SDK requests (CopywriterTool, AudienceProfiler, etc. send aiSdk:true)
      const useAiSdkProtocol = req.body.aiSdk === true;
      // Tools that need more tokens for complex outputs
      const maxTokens = toolName === "website-generator" ? 8192 : 4096;

      if (wantStream) {
        const client = getAnthropicClient();
        let fullReply = "";

        if (useAiSdkProtocol) {
          // ── AI SDK Data Stream Protocol ─────────────────────────────
          // Format: `0:"text"\n` for chunks, `d:{...}\n` for finish
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.setHeader("Cache-Control", "no-cache");
          res.setHeader("X-Accel-Buffering", "no");
          res.flushHeaders();

          const stream = await client.messages.stream({
            model: CLAUDE_MODEL,
            max_tokens: maxTokens,
            system,
            messages,
          });

          for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              const text = event.delta.text;
              fullReply += text;
              res.write(`0:${JSON.stringify(text)}\n`);
            }
          }

          res.write(`d:${JSON.stringify({ finishReason: "stop" })}\n`);
          res.end();
        } else {
          // ── Custom SSE streaming response (AIChat, AIToolChat) ──────
          res.setHeader("Content-Type", "text/event-stream");
          res.setHeader("Cache-Control", "no-cache");
          res.setHeader("Connection", "keep-alive");
          res.setHeader("X-Accel-Buffering", "no");
          res.flushHeaders();

          const stream = await client.messages.stream({
            model: CLAUDE_MODEL,
            max_tokens: maxTokens,
            system,
            messages,
          });

          for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              const text = event.delta.text;
              fullReply += text;
              res.write(`data: ${JSON.stringify({ text })}\n\n`);
            }
          }

          res.write(`data: [DONE]\n\n`);
          res.end();
        }

        // Save to memory (fire-and-forget)
        if (userId && fullReply) {
          const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
          if (lastUserMsg) {
            saveMessage(userId, toolName, "user", lastUserMsg.content).catch(() => {});
            saveMessage(userId, toolName, "assistant", fullReply).catch(() => {});
          }
        }
      } else {
        // ── Non-streaming response (legacy) ─────────────────────────────
        const client = getAnthropicClient();
        const aiResponse = await client.messages.create({
          model: CLAUDE_MODEL,
          max_tokens: maxTokens,
          system,
          messages,
        });

        let reply = aiResponse.content[0]?.type === "text" ? aiResponse.content[0].text : "";

        // For JSON-expected tools, extract the JSON object from the response
        // even if the model wraps it in markdown fences or prefixes it with text
        const jsonTools = ["website-generator"];
        if (jsonTools.includes(toolName)) {
          // Try fence stripping first
          const fenceMatch = reply.match(/```(?:json|JSON)?\s*\n?([\s\S]*?)```/);
          if (fenceMatch) {
            reply = fenceMatch[1].trim();
          } else {
            // Extract from first { to matching } (handles truncated responses too)
            const firstBrace = reply.indexOf("{");
            if (firstBrace !== -1) {
              let depth = 0;
              let end = -1;
              for (let i = firstBrace; i < reply.length; i++) {
                if (reply[i] === "{") depth++;
                else if (reply[i] === "}") { depth--; if (depth === 0) { end = i; break; } }
              }
              // If we found a balanced JSON object, use it
              if (end !== -1) reply = reply.slice(firstBrace, end + 1);
              // If no closing brace (truncated), extract from first { to end and close it
              else if (firstBrace !== -1) reply = reply.slice(firstBrace);
            }
          }
        }

        // Save to memory (fire-and-forget)
        if (userId && reply) {
          const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
          if (lastUserMsg) {
            saveMessage(userId, toolName, "user", lastUserMsg.content).catch(() => {});
            saveMessage(userId, toolName, "assistant", reply).catch(() => {});
          }
        }

        res.json({ reply });
      }

    } catch (error: any) {
      console.error("[/api/chat] Error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || "Internal server error" });
      }
    }
  });
}
