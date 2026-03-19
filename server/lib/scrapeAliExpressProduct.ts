/**
 * Scrapes real product data from an AliExpress product URL via ZenRows.
 * Uses JS rendering + premium proxy to bypass AliExpress bot protection.
 */

export interface AliExpressProductData {
  title: string | null;
  images: string[];
  priceUsd: number | null;
  rating: number | null;
  orders: number | null;
}

export async function scrapeAliExpressProduct(url: string): Promise<AliExpressProductData | null> {
  const apiKey = process.env.ZENROWS_API_KEY;
  if (!apiKey) {
    console.error('[scrape-ae] ZENROWS_API_KEY not set');
    return null;
  }

  try {
    const zenrowsUrl = `https://api.zenrows.com/v1/?apikey=${apiKey}&url=${encodeURIComponent(url)}&js_render=true&premium_proxy=true`;

    console.log('[scrape-ae] Fetching:', url.slice(0, 80));
    const res = await fetch(zenrowsUrl, {
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      console.error('[scrape-ae] ZenRows HTTP', res.status, await res.text().catch(() => ''));
      return null;
    }

    const html = await res.text();
    console.log('[scrape-ae] Got HTML, length:', html.length);

    // ── Title ────────────────────────────────────────────────────────────────
    const titleMatch =
      html.match(/<h1[^>]*class="[^"]*product-title[^"]*"[^>]*>\s*([^<]+)/i) ||
      html.match(/<h1[^>]*>\s*([^<]{10,})/i) ||
      html.match(/<title>\s*([^<|–\-]{10,})/i);
    const title = titleMatch?.[1]?.trim().replace(/&amp;/g, '&').replace(/&quot;/g, '"') || null;

    // ── Images ───────────────────────────────────────────────────────────────
    // AliExpress stores product images in JSON blobs inside script tags
    const imgMatches = html.match(/"imageUrl"\s*:\s*"([^"]+\.jpg[^"]*)"/g) || [];
    const imgMatchesAlt = html.match(/"image"\s*:\s*"(\/\/ae\d+\.alicdn\.com[^"]+)"/g) || [];
    const allImgMatches = [...imgMatches, ...imgMatchesAlt];

    const images: string[] = allImgMatches
      .map(m => m.match(/"([^"]*alicdn\.com[^"]*\.jpg[^"]*)"/)?.[1] || m.match(/"([^"]+\.jpg[^"]*)"/)?.[1])
      .filter((img): img is string => !!img && !img.includes('thumbnail') && !img.includes('50x50'))
      .slice(0, 5)
      .map(img => img.startsWith('//') ? `https:${img}` : img);

    // ── Price ─────────────────────────────────────────────────────────────────
    const priceMatch =
      html.match(/["']discountPrice["']\s*:\s*["']([0-9.]+)["']/) ||
      html.match(/["']minAmount["']\s*:\s*["']([0-9.]+)["']/) ||
      html.match(/["']price["']\s*:\s*["']([0-9.]+)["']/) ||
      html.match(/\$\s*([0-9]+\.[0-9]{2})/);
    const priceUsd = priceMatch ? parseFloat(priceMatch[1]) : null;

    // ── Rating ────────────────────────────────────────────────────────────────
    const ratingMatch =
      html.match(/["']averageStarRate["']\s*:\s*["']([0-9.]+)["']/) ||
      html.match(/["']starRate["']\s*:\s*["']([0-9.]+)["']/) ||
      html.match(/([0-9]\.[0-9])\s*(?:out of|\/)\s*5/i);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;

    // ── Orders ────────────────────────────────────────────────────────────────
    const ordersMatch =
      html.match(/([0-9,]+)\+?\s*(?:sold|orders|purchases)/i) ||
      html.match(/["']tradeCount["']\s*:\s*["']([0-9,+]+)["']/);
    const orders = ordersMatch
      ? parseInt(ordersMatch[1].replace(/[^0-9]/g, ''), 10)
      : null;

    console.log('[scrape-ae] Parsed:', { title: title?.slice(0, 40), priceUsd, rating, orders, imageCount: images.length });

    return { title, images, priceUsd, rating, orders };
  } catch (err: any) {
    console.error('[scrape-ae] Failed:', url.slice(0, 80), err.message);
    return null;
  }
}
