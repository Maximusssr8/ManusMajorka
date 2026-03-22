/**
 * Find ad creatives for a product using Tavily
 */

export async function findAdCreatives(productName: string) {
  const TAVILY_KEY = process.env.TAVILY_API_KEY || process.env.VITE_TAVILY_API_KEY;
  if (!TAVILY_KEY) throw new Error("TAVILY_API_KEY not set");

  const [tiktokRes, adRes] = await Promise.allSettled([
    fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: `${productName} tiktok viral video shop buy`,
        max_results: 5,
        search_depth: "advanced",
        include_domains: ["tiktok.com", "vm.tiktok.com"],
      }),
      signal: AbortSignal.timeout(10000),
    }).then(r => r.json()),

    fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: `${productName} facebook ad copy dropship winning australia`,
        max_results: 5,
        search_depth: "advanced",
      }),
      signal: AbortSignal.timeout(10000),
    }).then(r => r.json()),
  ]);

  const tiktokVideos = tiktokRes.status === "fulfilled"
    ? (tiktokRes.value.results || [])
        .filter((r: any) => r.url?.includes("tiktok"))
        .map((r: any) => ({ url: r.url, title: r.title, snippet: r.content?.slice(0, 150) }))
    : [];

  const adInsights = adRes.status === "fulfilled"
    ? (adRes.value.results || [])
        .map((r: any) => ({ url: r.url, hook: r.title, copy: r.content?.slice(0, 200) }))
    : [];

  return { tiktokVideos, adInsights };
}

export async function generateAdCopy(productName: string, priceAud: number): Promise<{
  tiktokHook: string;
  facebookAd: string;
  instagramCaption: string;
  emailSubject: string;
}> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    messages: [{
      role: "user",
      content: `You are an expert dropshipping marketer for the Australian market.
Generate winning ad creatives for: ${productName}
Price: $${priceAud} AUD
Target: Australian buyers aged 18-45

Generate:
1. TIKTOK_HOOK: First 3 seconds, pattern interrupt, starts with action word (under 20 words)
2. FACEBOOK_AD: One punchy headline + 3 bullet benefits + CTA (under 80 words total)
3. INSTAGRAM_CAPTION: Casual, 2-3 sentences + emojis + 5 hashtags (AU-focused)
4. EMAIL_SUBJECT: Curiosity-driven, under 50 chars

Return ONLY valid JSON with keys: tiktokHook, facebookAd, instagramCaption, emailSubject`,
    }],
  });

  const text = (msg.content[0] as any).text || "{}";
  try {
    const json = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
    return {
      tiktokHook: json.tiktokHook || "",
      facebookAd: json.facebookAd || "",
      instagramCaption: json.instagramCaption || "",
      emailSubject: json.emailSubject || "",
    };
  } catch {
    return { tiktokHook: text.slice(0, 100), facebookAd: "", instagramCaption: "", emailSubject: "" };
  }
}
