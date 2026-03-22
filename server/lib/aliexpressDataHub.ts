/**
 * AliExpress DataHub via RapidAPI
 * https://rapidapi.com/aliexpress-datahub/api/aliexpress-datahub
 * No OAuth needed — just RAPIDAPI_KEY
 */

const RAPIDAPI_HOST = 'aliexpress-datahub.p.rapidapi.com';

function getHeaders() {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) throw new Error('RAPIDAPI_KEY not set');
  return {
    'x-rapidapi-key': key,
    'x-rapidapi-host': RAPIDAPI_HOST,
    'Content-Type': 'application/json',
  };
}

// ── Search products ────────────────────────────────────────────────────────────

export async function searchAliExpressProducts(
  keyword: string,
  options: {
    page?: number;
    limit?: number;
    sort?: string;
    shipTo?: string;
    currency?: string;
  } = {}
) {
  try {
    const params = new URLSearchParams({
      q: keyword,
      page: String(options.page || 1),
      pageSize: String(Math.min(50, options.limit || 20)),
      sort: options.sort || 'default',
      shipTo: options.shipTo || 'AU',
      currency: options.currency || 'AUD',
      locale: 'en_US',
    });

    const res = await fetch(
      `https://${RAPIDAPI_HOST}/item_search_3?${params}`,
      { headers: getHeaders(), signal: AbortSignal.timeout(10000) }
    );

    if (!res.ok) {
      console.error('[datahub] search HTTP', res.status, await res.text().then(t => t.slice(0, 200)));
      return [];
    }

    const data = await res.json() as any;
    const items: any[] = data?.result?.resultList || data?.result?.items || [];
    console.log(`[datahub] search "${keyword}": ${items.length} results`);

    return items.map((item: any) => {
      const it = item.item || item;
      const promoPrice = it.sku?.def?.promotionPrice;
      const basePrice = it.sku?.def?.price;
      const rawPrice = parseFloat(promoPrice || basePrice || item.price || '0');
      const rawOriginal = parseFloat(basePrice || '0');
      return {
        id: String(it.itemId || item.itemId || ''),
        name: (it.title || item.title || '').slice(0, 200),
        image_url: it.image || item.image || '',
        images: it.images || (it.image ? [it.image] : [item.image].filter(Boolean)),
        price_usd: rawPrice,
        price_aud: Math.round(rawPrice * 1.55),
        original_price_aud: rawOriginal ? Math.round(rawOriginal * 1.55) : 0,
        discount_pct: rawOriginal && rawPrice < rawOriginal
          ? Math.round((1 - rawPrice / rawOriginal) * 100) : 0,
        orders_count: parseInt((it.tradeDesc || '').replace(/[^0-9]/g, '') || '0'),
        rating: parseFloat(it.averageStar || '0'),
        reviews_count: parseInt(it.evaluate || '0'),
        aliexpress_url: `https://www.aliexpress.com/item/${it.itemId || item.itemId}.html`,
        supplier_name: it.store?.storeName || 'AliExpress',
        shop_url: it.store?.storeUrl || '',
        shipping_au: 'Ships to AU',
        source: 'rapidapi_datahub',
      };
    }).filter((p: any) => p.id && p.name && p.image_url);

  } catch (err: any) {
    console.error('[datahub] search error:', err.message);
    return [];
  }
}

// ── Product detail by ID ───────────────────────────────────────────────────────

export async function getAliExpressProductDetail(itemId: string) {
  try {
    const res = await fetch(
      `https://${RAPIDAPI_HOST}/item_detail_3?itemId=${itemId}&currency=AUD&locale=en_US`,
      { headers: getHeaders(), signal: AbortSignal.timeout(10000) }
    );

    if (!res.ok) return null;
    const data = await res.json() as any;
    const item = data?.result?.item;
    if (!item) return null;

    const promoPrice = item.sku?.def?.promotionPrice;
    const basePrice = item.sku?.def?.price;
    const rawPrice = parseFloat(promoPrice || basePrice || '0');

    return {
      id: String(item.itemId),
      name: item.title || '',
      description: item.description || '',
      images: item.images || [item.image].filter(Boolean),
      price_aud: Math.round(rawPrice * 1.55),
      original_price_aud: basePrice ? Math.round(parseFloat(basePrice) * 1.55) : 0,
      orders_count: parseInt((item.tradeDesc || '').replace(/[^0-9]/g, '') || '0'),
      rating: parseFloat(item.averageStar || '0'),
      reviews_count: parseInt(item.evaluate || '0'),
      aliexpress_url: `https://www.aliexpress.com/item/${item.itemId}.html`,
      supplier_name: item.store?.storeName || 'AliExpress',
      shop_url: item.store?.storeUrl || '',
      source: 'rapidapi_datahub',
    };
  } catch (err: any) {
    console.error('[datahub] detail error:', err.message);
    return null;
  }
}

// ── Trending by niche ──────────────────────────────────────────────────────────

const NICHE_KEYWORDS: Record<string, string> = {
  fitness:   'gym fitness resistance bands workout',
  beauty:    'skincare face serum beauty',
  tech:      'wireless gadgets electronics',
  home:      'home decor organisation storage',
  pets:      'pet accessories dog cat',
  fashion:   'fashion accessories jewellery',
  outdoor:   'outdoor camping hiking',
  kitchen:   'kitchen gadgets cooking',
  baby:      'baby products toddler',
  jewellery: 'rings necklace earrings jewellery',
  wellness:  'massage health sleep wellness',
  gaming:    'gaming accessories keyboard',
  car:       'car accessories phone mount',
  yoga:      'yoga mat pilates',
};

export async function getTrendingByNiche(niche: string, limit = 20) {
  const keyword = NICHE_KEYWORDS[niche.toLowerCase()] || niche;
  return searchAliExpressProducts(keyword, { limit, shipTo: 'AU', sort: 'default' });
}

// ── Quick connectivity test ────────────────────────────────────────────────────

export async function testConnection() {
  const products = await searchAliExpressProducts('posture corrector', { limit: 3 });
  return {
    ok: products.length > 0,
    count: products.length,
    sample: products[0] ? {
      id: products[0].id,
      name: products[0].name?.slice(0, 60),
      price_aud: products[0].price_aud,
      image: products[0].image_url?.slice(0, 80),
    } : null,
  };
}
