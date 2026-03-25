import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

router.post('/generate-ads', async (req, res) => {
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

router.post('/generate-copy', async (req, res) => {
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
router.post('/generate', async (req, res) => {
  try {
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
router.post('/generate-content', async (req, res) => {
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
router.post('/supplier-search', async (req: Request, res: Response) => {
  try {
    const { product } = req.body;
    if (!product) return res.status(400).json({ error: 'product required' });

    const TAVILY_KEY = process.env.TAVILY_API_KEY || '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';
    const query = `${product} supplier wholesale dropship AliExpress buy bulk`;

    const r = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: TAVILY_KEY, query, search_depth: 'basic', max_results: 6 }),
    });

    if (!r.ok) return res.json({ results: [] });
    const data = await r.json();

    const results = (data.results || []).map((r: any) => ({
      title: r.title || '',
      url: r.url || '',
      snippet: r.content?.slice(0, 120) || '',
    }));

    res.json({ results, product });
  } catch (err: any) {
    res.status(500).json({ error: err.message, results: [] });
  }
});
