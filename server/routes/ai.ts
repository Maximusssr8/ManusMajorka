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
    const { tool, productName, platform, tone, features, audience, templateType, brandName, niche } = req.body;

    const client = getClient();

    let prompt = '';

    if (tool === 'ad-copy') {
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
    } else {
      return res.status(400).json({ error: 'Unknown tool' });
    }

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
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

export default router;
