import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

import { checkRateLimit, aiLimiter, chatLimiter } from '../lib/ratelimit';
import { requireAuth } from '../middleware/requireAuth';
import { buildMayaContext, renderMayaContext, renderTierLine } from '../lib/mayaContext';
import { getSupabaseAdmin } from '../_core/supabase';
import {
  generateAdImage,
  getImageProviderHealth,
  type ImageStyle,
  type ImageAspect,
} from '../lib/imageGen';
import { checkUsageLimit, incrementUsage } from '../lib/usageLimits';

const router = Router();

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// POST /api/ai/chat — Majorka product-research chat (Maya AI).
// Uses claude-sonnet-4-6 for quality answers on niche/product/strategy questions.
const chatInputSchema = z.object({
  message: z.string().min(1).max(10000),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(10000),
      })
    )
    .max(50)
    .optional(),
  demo: z.boolean().optional(),
});

router.post('/chat', chatLimiter, async (req, res) => {
  try {
    const parsed = chatInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'invalid_input', details: parsed.error.flatten() });
    }
    const { message, history, demo } = parsed.data;

    if (demo) {
      return res.json({
        response:
          'Demo mode: top AU dropshipping niches right now are Pet Accessories, Home Organisation, and Kitchen Gadgets. Sign in to get real-time intelligence.',
      });
    }

    // Resolve authenticated user (optional — chat works anonymously too)
    let userId: string | null = null;
    let userEmail: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7);
        const { data: { user } } = await getSupabaseAdmin().auth.getUser(token);
        if (user) {
          userId = user.id;
          userEmail = user.email ?? null;
        }
      } catch {
        /* not authenticated */
      }
    }

    const ctx = await buildMayaContext(userId, userEmail);

    const systemPrompt = `You are Maya, the Majorka product-research AI.
You have real data in the context below — use it.
When the user asks "find me a winner for AU in pets", query the context for matching products and return real ones by title + price + orders + why-it-might-win reasoning.
Never make up products. If the context doesn't have a match, say so and suggest a broader filter.
${renderTierLine(ctx.tier)}
Always use AU English. Be specific, data-driven, and concise — 3 short paragraphs max unless asked for depth.
${renderMayaContext(ctx)}`;

    const client = getClient();
    const priorMessages = Array.isArray(history)
      ? history
          .slice(-10)
          .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }))
      : [];

    const resp = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [...priorMessages, { role: 'user', content: message.slice(0, 4000) }],
    });

    const text = resp.content[0]?.type === 'text' ? resp.content[0].text : '';
    return res.json({ response: text || 'No response generated — try rephrasing your question.' });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('[/api/ai/chat]', err);
    }
    return res.status(500).json({ error: 'Chat failed. Try again in a moment.' });
  }
});

router.post('/generate-ads', requireAuth, async (req, res) => {
  const { productName, price, audience } = req.body;
  if (!productName) return res.status(400).json({ error: 'productName required' });

  try {
    const client = getClient();
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1200,
      messages: [{
        role: 'user',
        content: `You are an expert Facebook/Meta ads copywriter for Australian ecommerce.

Product: ${String(productName).slice(0, 100)}
Price: AUD $${String(price || '49.95').slice(0, 10)}
Target audience: ${String(audience || 'Australian shoppers 25-44').slice(0, 100)}

Write 3 different Facebook ad variations. Each must have:
1. HOOK: One powerful opening line (max 15 words, creates curiosity or pain point)
2. BODY: 2-3 sentences (problem → solution → social proof). Use AU English. No emojis in body.
3. CTA: Button text (max 4 words, action-oriented)

Format as JSON array:
[{"hook":"...","body":"...","cta":"..."},{"hook":"...","body":"...","cta":"..."},{"hook":"...","body":"...","cta":"..."}]

Only output the JSON array. No markdown.`
      }]
    });

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    const cleaned = text.replace(/^```[\w]*\n?/m, '').replace(/\n?```\s*$/m, '').trim();
    const ads = JSON.parse(cleaned);
    res.json({ ads });
  } catch (err) {
    console.error('[ad-studio]', err);
    res.status(500).json({ error: 'Generation failed. Try again.' });
  }
});

router.post('/generate-copy', requireAuth, aiLimiter, async (req, res) => {
  const { productName, price, niche } = req.body;
  if (!productName) return res.status(400).json({ error: 'productName required' });

  try {
    const client = getClient();
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `You are an expert ecommerce copywriter for the Australian market.

Product: ${String(productName).slice(0, 100)}
Price: AUD $${String(price || '49.95').slice(0, 10)}
Niche: ${String(niche || 'general').slice(0, 50)}

Generate the following copy assets. Use AU English (not US spelling). Format as JSON:
{
  "productDescription": "2-3 sentence product description with key benefits and pain points addressed. Natural tone.",
  "emailSubjects": ["subject 1", "subject 2", "subject 3"],
  "email1": {"subject": "...", "body": "3-paragraph welcome/abandon cart email in plain text"},
  "instagramCaption": "Instagram post caption with line breaks. 3-4 lines + 5 relevant hashtags.",
  "tiktokHook": "First 3 seconds TikTok script hook. Max 2 sentences. Must create immediate curiosity."
}

Only output the JSON. No markdown. No code blocks.`
      }]
    });

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    const cleaned = text.replace(/^```[\w]*\n?/m, '').replace(/\n?```\s*$/m, '').trim();
    const copy = JSON.parse(cleaned);
    res.json({ copy });
  } catch (err) {
    console.error('[copy-studio]', err);
    res.status(500).json({ error: 'Generation failed. Try again.' });
  }
});

// Unified /generate endpoint for Growth Tools
router.post('/generate', requireAuth, async (req, res) => {
  try {
    // Input size guard — reject oversized payloads before any processing
    const MAX_INPUT_CHARS = 10000;
    const inputStr = JSON.stringify(req.body);
    if (inputStr.length > MAX_INPUT_CHARS * 3) {
      return res.status(400).json({ error: 'Request payload too large' });
    }

    // Rate limit: 10 AI calls per user per 60s (Upstash sliding window)
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]) || req.ip || req.socket?.remoteAddress || 'anon';
    const userId = (req as any).user?.userId || (req as any).user?.sub || clientIp;
    const rl = await checkRateLimit(String(userId));
    if (!rl.allowed) {
      res.setHeader('Retry-After', String(rl.retryAfter ?? 60));
      return res.status(429).json({ error: 'Too many requests. Please wait before generating more content.' });
    }
    const { tool, platform, tone, features, audience, templateType, brandName, niche } = req.body;
    const productName = req.body.productName || req.body.product || req.body.name || "the product";

    const client = getClient();

    let prompt = '';

    if (tool === 'ad-copy' || tool === 'ad_copy') {
      prompt = `Write a high-converting ${platform || 'Facebook'} ad for an Australian dropshipping store selling "${productName}".
Tone: ${tone || 'Urgent'}. Target: Australian shoppers.
Format:
Headline: [attention-grabbing headline]
Body: [2-3 sentences, include social proof, free AU shipping mention]
CTA: [clear call to action with price hint if possible]
Hook: [first 3 words that stop the scroll]`;
    } else if (tool === 'description') {
      prompt = `Write a Shopify product description for "${productName}" targeting ${audience || 'Australian shoppers'}.
Key features: ${features || 'premium quality, fast shipping'}.
Format: Bold title, 2-paragraph benefit-focused description, bullet points (5 benefits), shipping note.
Keep it under 300 words. Make it conversion-focused for AU ecommerce.`;
    } else if (tool === 'email') {
      prompt = `Write a ${templateType || 'abandoned cart'} email for "${brandName || 'an Australian store'}".
Subject: [compelling subject line]
[email body - 3-4 paragraphs, friendly AU tone, clear CTA button text]
Make it feel personal, not spammy. Include free shipping mention and easy returns.`;
    } else if (tool === 'name') {
      prompt = `Generate 8 creative store name ideas for a ${niche || 'general'} dropshipping store targeting Australian customers.
Requirements: memorable, .com.au available likely, professional, not generic.
Format: numbered list, one name per line, no explanations.`;
    } else if (tool === 'product-analysis') {
      prompt = `Analyse this product for Australian dropshipping:
Product: ${productName}
Orders: ${(req.body as any).orders || 0}+ lifetime orders
Margin: ${(req.body as any).margin || 50}%
Niche: ${niche || 'General'}

In 4 sections (Target Customer / Best Ad Angle / Seasonal / Risk Factors):
Be specific to the Australian market. Keep each section 2-3 sentences. No bullet points.`;
    } else if (tool === 'tiktok_hooks' || tool === 'tiktok-hooks') {
      const p = req.body.product || req.body.productName || req.body.name || 'the product';
      const n = req.body.niche || '';
      prompt = `Generate 5 high-converting TikTok hooks for "${p}"${n ? ` in the ${n} niche` : ''}.
Each hook is 3-7 words. Trigger curiosity, FOMO, or strong emotion. No [brackets] or placeholders.
Format:
Hook 1: [hook text]
Hook 2: [hook text]
Hook 3: [hook text]
Hook 4: [hook text]
Hook 5: [hook text]
Why it works: [1 sentence per hook]`;
    } else if (tool === 'product_description' || tool === 'product-description') {
      const p = req.body.product || req.body.productName || 'the product';
      const aud = req.body.audience || 'Australian shoppers';
      prompt = `Write a Shopify product description for "${p}" targeting ${aud}.
Format: Bold title, 2 benefit-focused paragraphs, 5 bullet points, shipping note. Under 300 words.`;
    } else if (tool === 'email_subject_lines' || tool === 'email-subject-lines') {
      const p = req.body.product || req.body.productName || 'the product';
      const brand = req.body.brand || 'our store';
      prompt = `Write 5 high open-rate email subject lines for a ${req.body.type || 'launch'} email about "${p}" from "${brand}".
Format: numbered list, one subject line per line. Include emojis. Target Australian shoppers.`;
    } else if (tool === 'hashtags') {
      const p = req.body.product || req.body.productName || '';
      const n = req.body.niche || p;
      prompt = `Generate hashtag packs for the "${n}" niche targeting Australian TikTok and Instagram audiences.
Format:
MEGA (10M+ posts): #tag1 #tag2 #tag3 #tag4 #tag5
MACRO (1M-10M posts): #tag1 #tag2 #tag3 #tag4 #tag5
MICRO (100K-1M posts): #tag1 #tag2 #tag3 #tag4 #tag5
NICHE (under 100K posts): #tag1 #tag2 #tag3 #tag4 #tag5
AU-SPECIFIC: #tag1 #tag2 #tag3 #tag4 #tag5`;
    } else if (tool === 'store_name' || tool === 'store-name') {
      const n = req.body.niche || req.body.product || 'general';
      prompt = `Generate 5 memorable store name ideas for a ${n} dropshipping store targeting Australian customers.
Requirements: memorable, likely .com.au available, professional, not generic.
Format: numbered list, one name per line, include a brief (3-word) tagline after each name.`;
    } else if (tool === 'ads_studio') {
      // Ads Studio: client sends both `system` (expert direct-response prompt)
      // and `prompt` (user message with product details). Pass through directly
      // so the new PRIMARY HOOK / HEADLINE / PRIMARY TEXT / etc. label format
      // survives into the response.
      const { productName: pn, platforms: plats, creativeType: ct, prompt: userPrompt, system: clientSystem } = req.body;
      const FALLBACK_SYSTEM = `You are an elite direct-response copywriter who specialises in Australian dropshipping. You write copy that sounds human, specific, and urgent — never generic. Always output with the exact section labels requested in the user message.`;
      const message2 = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1400,
        system: clientSystem || FALLBACK_SYSTEM,
        messages: [{
          role: 'user',
          content: userPrompt || `Generate a ${ct} ad for ${pn} targeting ${(plats || ['Facebook', 'Instagram']).join(', ')}`,
        }],
      });
      const result2 = message2.content[0].type === 'text' ? message2.content[0].text : '';
      return res.json({ result: result2 });
    } else {
      return res.status(400).json({ error: 'Unknown tool: ' + tool });
    }

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    });

    const result = message.content[0].type === 'text' ? message.content[0].text : '';
    res.json({ result });
  } catch (err: any) {
    const { tool, productName, brandName, niche } = req.body;
    const fallbacks: Record<string, string> = {
      'ad-copy': `Headline: Australians Can't Stop Talking About This ${productName || 'Product'}\n\nBody: Join 10,000+ AU customers who made the switch. Free shipping Australia-wide. 30-day money-back guarantee. Stock is running out fast.\n\nCTA: Shop Now — Limited Stock\n\nHook: "Wait, what is..."`,
      'description': `**${productName || 'Premium Product'}**\n\nAustralians love this product for good reason — it delivers exceptional quality at an unbeatable price point. Perfect for everyday use.\n\n**Why customers love it:**\n• Premium build quality that lasts\n• Fast AU shipping (3-7 business days)\n• 30-day hassle-free returns\n• Trusted by 10,000+ Australian customers\n• 100% satisfaction guaranteed\n\nOrder today and receive free shipping on orders over $75.`,
      'email': `Subject: Did you forget something?\n\nHey there,\n\nYou left something amazing in your cart at ${brandName || 'our store'}!\n\nDon't miss out — your cart is saved but stock is limited.\n\n[Complete Your Order]\n\nFree shipping on orders over $75\n30-day returns, no questions asked.\n\nBest,\nThe ${brandName || 'Team'}`,
      'name': `1. ${niche || 'Shop'}Direct AU\n2. The${niche || 'Store'}Hub\n3. AU${niche || 'Goods'}Co\n4. Prime${niche || 'Shop'}\n5. ${niche || 'Quality'}Store\n6. ${niche || 'Best'}Finds AU\n7. True${niche || 'Quality'}\n8. ${niche || 'Shop'}Market`,
    };
    res.json({ result: fallbacks[tool] || 'Generated content will appear here.' });
  }
});

// Content Creator tools endpoint
router.post('/generate-content', requireAuth, aiLimiter, async (req, res) => {
  try {
    const { tool, productName, benefit, niche, audience, platform } = req.body;

    // Simple in-memory cache (1 hour)
    const cacheKey = `${tool}:${productName}:${niche}:${platform}`;
    const cached = (global as any).__contentCache?.[cacheKey];
    if (cached && (Date.now() - cached.ts) < 3600000) {
      return res.json({ result: cached.result });
    }

    const client = getClient();

    let prompt = '';

    if (tool === 'tiktok-script') {
      prompt = `Write a TikTok video script for an Australian dropshipper selling "${productName}".
Key benefit: ${benefit || 'solves a common problem'}
Style: Short, punchy, TikTok-native. Use Australian slang where appropriate.

Format exactly like this:
HOOK (0-3 seconds): [3-5 words that stop the scroll — start with "POV:" or "Wait..." or a shocking statement]

MAIN CONTENT (3-45 seconds): [3-4 punchy sentences showing the product in action. Reference common AU pain points.]

CALL TO ACTION (last 5 seconds): [One clear CTA — "Link in bio", "Shop now", "Get yours today"]

CAPTION: [Caption with 5 relevant hashtags for AU audience]`;
    } else if (tool === 'youtube-short') {
      prompt = `Write a YouTube Shorts script for selling "${productName}" to Australian customers.

Format exactly like this:
TITLE: [Clickbait title under 60 chars, include "Australia" or "AU" if relevant]

THUMBNAIL IDEA: [Describe the thumbnail visual in one sentence]

HOOK (0-5 seconds): [Shocking statement or question that makes them stay]

SCRIPT (60 seconds total):
[Write the full 60-second script broken into 5-10 second segments. Include when to show product, when to zoom, when to show text overlay.]

END SCREEN CTA: [What to say in final 5 seconds]`;
    } else if (tool === 'ad-pack') {
      prompt = `Create a complete ad copy pack for "${productName}" targeting Australian customers. Audience: ${audience || 'Australian shoppers 25-45'}.

Format exactly like this:
FACEBOOK AD:
Headline: [Under 40 chars]
Primary text: [2-3 sentences, include free AU shipping, social proof]
CTA button: [Shop Now / Learn More / Get Offer]

TIKTOK CAPTION:
[2-3 lines max, conversational, 5-7 hashtags at end]

INSTAGRAM CAPTION:
[3-4 lines, lifestyle-focused, 8-10 hashtags]

GOOGLE SEARCH AD:
Headline 1: [30 chars max]
Headline 2: [30 chars max]
Description: [90 chars max, include AU shipping]

EMAIL SUBJECT LINE:
[Under 50 chars, create urgency without being spammy]`;
      } else if (tool === 'lesson-content') {
      prompt = `Write a detailed educational lesson titled "${productName || 'Dropshipping Fundamentals'}".

Topic overview: ${niche || 'ecommerce and dropshipping in Australia'}

Format:
- Use ## for section headings
- Use **bold** for key terms
- Use bullet lists for tips and features
- Include 2-3 Australian examples with AUD pricing where relevant
- End with ## Key Takeaways containing 3 numbered actionable points

Length: 400-600 words. Start with a brief intro, then dive into the content.`;
    } else if (tool === 'hook-generator') {
      prompt = `Generate 5 high-converting TikTok video hooks for "${productName || niche || 'this product'}".
Each hook must be 3-7 words. No brackets, no placeholders, write real hooks.
Trigger one of: curiosity, FOMO, social proof, or shock.
Format exactly:
Hook 1: [actual hook text here]
Hook 2: [actual hook text here]
Hook 3: [actual hook text here]
Hook 4: [actual hook text here]
Hook 5: [actual hook text here]
Why it works: [one sentence per hook explaining the psychology]`;
    } else if (tool === 'livestream-script') {
      prompt = `Write a 5-minute TikTok livestream script for selling "${productName || niche || 'this product'}" to Australian dropshipping customers.
Structure: Opening hook (30s) → Product demo (2min) → Testimonials/social proof (1min) → Scarcity close (90s) → CTA.
Use conversational Australian English. Include stage directions in [brackets].`;
    } else if (tool === 'hashtags') {
      prompt = `Research and generate hashtags for the "${niche || productName}" niche targeting Australian audiences on TikTok and Instagram.

Format exactly like this:
MEGA (10M+ posts): [5 hashtags]
MACRO (1M-10M posts): [5 hashtags]
MICRO (100K-1M posts): [5 hashtags]
NICHE (under 100K posts): [5 hashtags]
AU-SPECIFIC: [5 Australia-specific hashtags]

STRATEGY TIP: [One sentence on the best hashtag mix for reach vs engagement]`;
    } else {
      return res.status(400).json({ error: 'Unknown content tool' });
    }

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });

    const result = message.content[0].type === 'text' ? message.content[0].text : '';

    // Cache the result
    if (!(global as any).__contentCache) (global as any).__contentCache = {};
    (global as any).__contentCache[cacheKey] = { result, ts: Date.now() };

    res.json({ result });
  } catch (err: any) {
    const { tool, productName, niche } = req.body;
    const fallbacks: Record<string, string> = {
      'tiktok-script': `HOOK (0-3 seconds): POV: You just found the best ${productName || 'product'} in Australia

MAIN CONTENT (3-45 seconds): I've been searching for this for months and I can't believe how good it is. Every Australian who works from home needs this. The quality is actually insane for the price — and yes, it ships free within Australia.

CALL TO ACTION (last 5 seconds): Link in bio, limited stock — grab it before it sells out!

CAPTION: This is a game changer #australia #${(niche || 'product').replace(/\s/g, '')} #australianfinds #fyp #shopaustralia`,
      'youtube-short': `TITLE: This ${productName || 'Product'} Changed My Life (Australian Find)\n\nTHUMBNAIL IDEA: Person holding product with shocked expression, text overlay: "WHY DIDN'T I FIND THIS SOONER?"\n\nHOOK: I can't believe Australians are sleeping on this...\n\nSCRIPT: [0-10s] Open with the problem. [10-30s] Introduce the product, show it in use. [30-50s] Show the before/after or results. [50-60s] Where to get it, free AU shipping.\n\nEND SCREEN CTA: Check the description for the link — free shipping Australia-wide!`,
      'ad-pack': `FACEBOOK AD:\nHeadline: ${productName || 'Top Product'} — Free AU Shipping\nPrimary text: Join 10,000+ Australians who upgraded their life with ${productName || 'this product'}. Fast shipping across Australia. 30-day hassle-free returns. Don't miss out — stock is limited.\nCTA button: Shop Now\n\nTIKTOK CAPTION:\nAustralians are obsessed with this and I get it Free shipping, arrives in days\n#australia #australianshopping #${(productName || 'product').replace(/\s/g, '').toLowerCase()} #fyp #trending\n\nINSTAGRAM CAPTION:\nLevel up your everyday with ${productName}. Real Australians, real results. Free AU-wide shipping + 30 day returns. Shop via link in bio\n#australia #australianlife #shopaustralia #lifestyle #${(productName || 'product').replace(/\s/g, '').toLowerCase()}\n\nGOOGLE SEARCH AD:\nHeadline 1: ${(productName || 'Best Product').substring(0, 30)}\nHeadline 2: Free AU Shipping Today\nDescription: Top-rated in Australia. Fast delivery. 30-day returns. Order today!\n\nEMAIL SUBJECT LINE:\n${productName || 'This'} is selling out fast — free AU shipping today only`,
      'hashtags': `MEGA (10M+ posts): #australia #shopping #trending #viral #tiktokmademebuyit\n\nMACRO (1M-10M posts): #australianshopping #shopaustralia #australianfinds #aussiefinds #shoppinghaul\n\nMICRO (100K-1M posts): #${(niche || 'product').replace(/\s/g, '')}australia #aussielifestyle #australianproducts #shoplocal #onlineshoppingaustralia\n\nNICHE (under 100K posts): #${(niche || 'product').replace(/\s/g, '')}AU #aussiebusiness #madeinaustralia #australianowned #discoveryaustralia\n\nAU-SPECIFIC: #aussiemums #australianbusiness #goldcoast #sydney #melbourne\n\nSTRATEGY TIP: Use 2 mega + 3 macro + 4 micro + 1-2 niche hashtags per post for the best reach-to-engagement ratio on both TikTok and Instagram.`,
    };
    res.json({ result: fallbacks[tool] || 'Content will appear here.' });
  }
});

export default router;

// POST /api/ai/supplier-search — Tavily live supplier search
router.post('/supplier-search', requireAuth, aiLimiter, async (req, res) => {
  try {
    const { product } = req.body;
    if (!product) return res.status(400).json({ error: 'product required' });

    const TAVILY_KEY = process.env.TAVILY_API_KEY || '';
    const query = `${product} supplier wholesale dropship AliExpress buy bulk`;

    const r = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: TAVILY_KEY, query, search_depth: 'basic', max_results: 6 }),
    });

    if (!r.ok) return res.json({ results: [] } as any);
    const data = await r.json();

    const results = (data.results || []).map((r: any) => ({
      title: r.title || '',
      url: r.url || '',
      snippet: r.content?.slice(0, 120) || '',
    }));

    res.json({ results, product } as any);
  } catch (err: any) {
    res.status(500).json({ error: err.message, results: [] } as any);
  }
});

// ── GET /api/ai/saved-outputs — load saved ad creatives ──────────────────
router.get('/saved-outputs', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.sub;
    if (!userId) return res.status(401).json({ error: 'auth required' });
    const { getSupabaseAdmin } = await import('../_core/supabase');
    const sb = getSupabaseAdmin();
    const { data } = await sb
      .from('saved_outputs')
      .select('id, product_name, creative_type, output, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    res.json({ outputs: data || [] } as any);
  } catch (err: any) {
    res.json({ outputs: [] } as any);
  }
});

// ── GET /api/health/image — surface image provider state to the UI ────────
// Also exposed as /api/ai/health/image (mounted under /api/ai).
router.get('/health/image', (_req, res) => {
  res.json(getImageProviderHealth());
});

// ── POST /api/ai/generate-image — real ad creative image generation ───────
const generateImageSchema = z.object({
  productId: z.string().max(64).optional(),
  productTitle: z.string().min(2).max(300),
  adCopy: z.string().max(4000).optional().default(''),
  style: z.enum(['lifestyle', 'product', 'ugc', 'flatlay']).optional().default('lifestyle'),
  aspect: z.enum(['1:1', '9:16', '4:5']).optional().default('1:1'),
  prompt: z.string().max(1500).optional(),
});

router.post('/generate-image', requireAuth, aiLimiter, async (req, res) => {
  const parsed = generateImageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, reason: 'invalid_input', details: parsed.error.flatten() });
  }

  const userId =
    (req as unknown as { user?: { userId?: string; sub?: string } }).user?.userId ||
    (req as unknown as { user?: { sub?: string } }).user?.sub;
  const rawPlan =
    ((req as unknown as { user?: { plan?: 'free' | 'builder' | 'scale' } }).user?.plan) ||
    'builder';
  const plan: import('../../shared/plans').Plan = rawPlan === 'scale' ? 'scale' : 'builder';

  if (userId) {
    try {
      const usage = await checkUsageLimit(userId, 'image_generation', plan);
      if (!usage.allowed) {
        return res.status(429).json({
          ok: false,
          reason: 'usage_limit',
          used: usage.used,
          limit: usage.limit,
        });
      }
    } catch {
      // Non-fatal: continue if usage tracking is unavailable
    }
  }

  const health = getImageProviderHealth();
  if (!health.ok) {
    return res.json({ ok: false, reason: 'no_provider' });
  }

  const result = await generateAdImage({
    prompt: parsed.data.prompt ?? '',
    productTitle: parsed.data.productTitle,
    adCopy: parsed.data.adCopy,
    style: parsed.data.style as ImageStyle,
    aspect: parsed.data.aspect as ImageAspect,
  });

  if (!result.ok) {
    return res.json(result);
  }

  if (userId) {
    try { await incrementUsage(userId, 'image_generation'); } catch { /* non-fatal */ }
  }

  return res.json({
    ok: true,
    imageUrl: result.imageUrl,
    provider: result.provider,
    model: result.model,
    warning: result.warning,
  });
});

// ── POST /api/ai/save-output — save an ad creative ────────────────────────
router.post('/save-output', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.sub;
    if (!userId) return res.status(401).json({ error: 'auth required' });
    const { productName, creativeType, output } = req.body;
    if (!output) return res.status(400).json({ error: 'output required' } as any);
    const { getSupabaseAdmin } = await import('../_core/supabase');
    const sb = getSupabaseAdmin();
    const { error } = await sb.from('saved_outputs').insert({
      user_id: userId,
      product_name: productName || 'Untitled',
      creative_type: creativeType || 'general',
      output,
    });
    if (error) throw error;
    res.json({ ok: true } as any);
  } catch (err: any) {
    res.status(500).json({ error: err.message } as any);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/generate-store-concept
// Generates a complete store concept for the Store Builder AI mode.
// Model: claude-haiku-4-5-20251001. Returns JSON matching storeConceptSchema.
// Fetches 5 real products from winning_products matching the niche, then asks
// Claude to pick copy + palette + fonts + per-product rationale.
// ─────────────────────────────────────────────────────────────────────────────
const storeConceptInputSchema = z.object({
  niche: z.string().min(2).max(120),
  market: z.string().min(2).max(60).optional().default('Australia'),
  tone: z.string().min(2).max(60).optional(),
});

interface WinningProductRow {
  id: string;
  product_title: string;
  image_url: string | null;
  price_aud: number | null;
  category: string | null;
  winning_score: number | null;
  sold_count: number | null;
}

async function fetchNicheProducts(niche: string, limit = 8): Promise<WinningProductRow[]> {
  try {
    const sb = getSupabaseAdmin();
    // Case-insensitive match on category OR title — DB is small enough
    const term = niche.trim();
    const like = `%${term}%`;
    const { data } = await sb
      .from('winning_products')
      .select('id, product_title, image_url, price_aud, category, winning_score, sold_count')
      .or(`category.ilike.${like},product_title.ilike.${like}`)
      .not('image_url', 'is', null)
      .gt('price_aud', 0)
      .order('winning_score', { ascending: false, nullsFirst: false })
      .limit(limit);
    return (data as WinningProductRow[] | null) ?? [];
  } catch {
    return [];
  }
}

const storeConceptSchemaLines = `{
  "names": ["string", "string", "string"],  // 3 candidate store names, 2-4 words each, brandable
  "tagline": "string (max 80 chars)",
  "palette": {
    "primary": "#RRGGBB",
    "secondary": "#RRGGBB",
    "accent": "#RRGGBB"
  },
  "fonts": {
    "heading": "one of: Syne, Inter, Playfair Display, DM Serif Display, Space Grotesk, Poppins, Manrope",
    "body": "one of: DM Sans, Inter, Manrope, Nunito, Work Sans"
  },
  "audience": "one sentence describing the target AU buyer",
  "productRationales": [  // MUST have exactly 5 entries, one per input product (in same order)
    { "id": "product id as string", "rationale": "one sentence starting with 'This fits because' explaining why it belongs in this store" }
  ]
}`;

router.post('/generate-store-concept', requireAuth, aiLimiter, async (req, res) => {
  try {
    const parsed = storeConceptInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: 'invalid_input', details: parsed.error.flatten() });
    }
    const { niche, market, tone } = parsed.data;

    const candidates = await fetchNicheProducts(niche, 8);
    const chosen = candidates.slice(0, 5);

    if (chosen.length === 0) {
      return res.json({
        ok: false,
        reason: 'no_products',
        message: `No products in our database match "${niche}" yet. Try a broader niche.`,
      });
    }

    const client = getClient();
    const productLines = chosen
      .map((p, i) => `${i + 1}. id=${p.id} · "${p.product_title}" · $${p.price_aud ?? '?'} AUD · category=${p.category ?? 'n/a'}`)
      .join('\n');

    const systemPrompt = `You are a senior e-commerce brand director.
Return ONLY valid JSON. No prose before or after. No markdown fences.
Output shape:
${storeConceptSchemaLines}
Rules:
- AU English. ${tone ? `Tone: ${tone}. ` : ''}Target market: ${market}.
- Store names must be distinctive, pronounceable, 2-4 words. No generic words like "Shop", "Store", "World" on their own.
- Colour palette must read well on a dark luxury background and pass basic contrast checks.
- The productRationales array MUST include exactly one entry per product listed, in the same order, with the exact id string.`;

    const userPrompt = `Niche: ${niche}
Market: ${market}
Candidate products (use these exact IDs in productRationales):
${productLines}`;

    const completion = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1400,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textBlock = completion.content.find((c) => c.type === 'text');
    const raw = textBlock && textBlock.type === 'text' ? textBlock.text : '';
    const jsonStart = raw.indexOf('{');
    const jsonEnd = raw.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) {
      return res.status(502).json({ ok: false, reason: 'parse_error', message: 'Model did not return JSON.' });
    }
    let concept: unknown;
    try {
      concept = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
    } catch (parseErr: unknown) {
      const msg = parseErr instanceof Error ? parseErr.message : 'parse_error';
      return res.status(502).json({ ok: false, reason: 'parse_error', message: msg });
    }

    const conceptSchema = z.object({
      names: z.array(z.string()).min(1).max(5),
      tagline: z.string().min(1).max(200),
      palette: z.object({
        primary: z.string().regex(/^#?[0-9a-fA-F]{6}$/),
        secondary: z.string().regex(/^#?[0-9a-fA-F]{6}$/),
        accent: z.string().regex(/^#?[0-9a-fA-F]{6}$/),
      }),
      fonts: z.object({ heading: z.string(), body: z.string() }),
      audience: z.string().min(1),
      productRationales: z.array(z.object({
        id: z.string(),
        rationale: z.string().min(1),
      })),
    });
    const check = conceptSchema.safeParse(concept);
    if (!check.success) {
      return res.status(502).json({ ok: false, reason: 'schema_error', message: 'Concept did not match schema.', issues: check.error.flatten() });
    }

    const rationalesById = new Map(check.data.productRationales.map((r) => [String(r.id), r.rationale]));
    const products = chosen.map((p) => ({
      id: String(p.id),
      product_title: p.product_title,
      image_url: p.image_url,
      price_aud: p.price_aud,
      rationale: rationalesById.get(String(p.id)) ?? 'Strong fit for this niche based on category match.',
    }));

    return res.json({
      ok: true,
      concept: {
        names: check.data.names,
        tagline: check.data.tagline,
        palette: check.data.palette,
        fonts: check.data.fonts,
        audience: check.data.audience,
      },
      products,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown';
    return res.status(500).json({ ok: false, error: message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/generate-meta-ad
// Produces a 3×3×3 Meta ad variants pack + hook + audience + interests.
// Model: claude-haiku-4-5-20251001. JSON-only output validated by Zod.
// ─────────────────────────────────────────────────────────────────────────────
const metaAdInputSchema = z.object({
  productTitle: z.string().min(1).max(300),
  productUrl: z.string().url().optional(),
  pricePoint: z.string().max(60).optional(),
  benefit: z.string().max(500).optional(),
  audience: z.string().max(500).optional(),
  format: z.enum(['feed', 'reels', 'stories']).optional().default('feed'),
});

const META_CTAS = [
  'Shop Now',
  'Learn More',
  'Get Offer',
  'Order Now',
  'Sign Up',
  'See More',
  'Get Quote',
  'Subscribe',
] as const;

router.post('/generate-meta-ad', requireAuth, aiLimiter, async (req, res) => {
  try {
    const parsed = metaAdInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: 'invalid_input', details: parsed.error.flatten() });
    }
    const { productTitle, pricePoint, benefit, audience, format } = parsed.data;

    const client = getClient();
    const systemPrompt = `You are a senior Meta Ads direct-response copywriter for the AU market.
Return ONLY valid JSON matching this shape (no prose, no markdown):
{
  "headlines": ["string (max 40 chars)", "string", "string"],
  "bodies": ["string (max 125 chars)", "string", "string"],
  "ctas": ["one of: ${META_CTAS.join(', ')}", "different from #1", "different from #1 and #2"],
  "hook": "first-3-seconds hook line (max 120 chars) — scroll-stopping, specific",
  "audience": "1 paragraph describing the ideal AU buyer for Meta targeting",
  "interests": ["exactly 5 Meta interest-targeting keywords"]
}
Rules:
- AU English. Specific, benefit-led. No em-dashes, no hype words ("amazing", "game-changing").
- Headlines ≤ 40 chars; bodies ≤ 125 chars. Count carefully.
- CTAs must be exact matches from the Meta allowed list provided.
- Interests must be plausible Meta Ads Manager interest categories.`;

    const userPrompt = `PRODUCT: ${productTitle}
PRICE: ${pricePoint ?? 'n/a'}
BENEFIT: ${benefit ?? 'not specified'}
AUDIENCE HINT: ${audience ?? 'AU buyers 25-45'}
FORMAT: Meta ${format}`;

    const completion = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textBlock = completion.content.find((c) => c.type === 'text');
    const raw = textBlock && textBlock.type === 'text' ? textBlock.text : '';
    const jsonStart = raw.indexOf('{');
    const jsonEnd = raw.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) {
      return res.status(502).json({ ok: false, reason: 'parse_error', message: 'Model did not return JSON.' });
    }
    let payload: unknown;
    try {
      payload = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
    } catch (parseErr: unknown) {
      const msg = parseErr instanceof Error ? parseErr.message : 'parse_error';
      return res.status(502).json({ ok: false, reason: 'parse_error', message: msg });
    }

    const allowedCtas = [...META_CTAS] as string[];
    const metaAdSchema = z.object({
      headlines: z.array(z.string().min(1)).length(3),
      bodies: z.array(z.string().min(1)).length(3),
      ctas: z.array(z.string().refine((c) => allowedCtas.includes(c), 'cta not allowed')).length(3),
      hook: z.string().min(1),
      audience: z.string().min(1),
      interests: z.array(z.string().min(1)).length(5),
    });
    const check = metaAdSchema.safeParse(payload);
    if (!check.success) {
      return res.status(502).json({ ok: false, reason: 'schema_error', issues: check.error.flatten() });
    }

    return res.json({ ok: true, ad: check.data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown';
    return res.status(500).json({ ok: false, error: message });
  }
});
