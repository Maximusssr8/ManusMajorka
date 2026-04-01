const CATEGORIES = ['Pet', 'Beauty', 'Home', 'Kitchen', 'Fitness', 'Health', 'Kids', 'Electronics', 'Automotive', 'Office', 'Outdoor', 'Fashion'];

interface ProductForCategorization {
  title: string;
  orders?: number;
  priceUsd?: number;
  source: string;
}

export async function assignCategoryAndEnrich(products: ProductForCategorization[]): Promise<Array<{
  category: string;
  why_trending: string;
  best_ad_angle: string;
  target_audience: string;
}>> {
  if (!products.length) return [];
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return products.map(() => ({ category: 'Home', why_trending: '', best_ad_angle: '', target_audience: '' }));

  const prompt = `Categorize each product and provide enrichment. Return a JSON array ONLY.

Categories: ${CATEGORIES.join(', ')}

For each product, return:
{
  "category": "one of the categories above",
  "why_trending": "one sentence why this is selling now",
  "best_ad_angle": "one sentence ad hook",
  "target_audience": "specific buyer persona"
}

Products:
${products.map((p, i) => `${i + 1}. "${p.title}" | orders:${p.orders || '?'} | price:$${p.priceUsd || '?'} | from:${p.source}`).join('\n')}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(30000),
    });
    const data = await res.json() as { content?: Array<{ text?: string }> };
    const text = data.content?.[0]?.text || '[]';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error('[aiCategoryAssign] Error:', e instanceof Error ? e.message : e);
  }
  return products.map(() => ({ category: 'Home', why_trending: '', best_ad_angle: '', target_audience: '' }));
}
