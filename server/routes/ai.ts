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

export default router;
