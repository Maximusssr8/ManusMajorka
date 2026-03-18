/**
 * SociaVault API client
 * Docs: https://docs.sociavault.com
 * Auth: X-Api-Key header
 */

export interface TikTokShopProduct {
  product_id: string;
  title: string;
  image_url: string | null;
  price_usd: number | null;
  price_aud: number | null;
  sold_count: number | null;
  shop_name: string | null;
}

function extractImageUrl(product: any): string | null {
  const urlList = product?.image?.url_list ?? {};
  const urls = Object.values(urlList) as string[];
  return urls[0] ?? null;
}

export async function searchTikTokShopProducts(
  keyword: string,
  count = 5
): Promise<TikTokShopProduct[]> {
  const apiKey = process.env.SOCIAVAULT_API_KEY;
  if (!apiKey) throw new Error('SOCIAVAULT_API_KEY not set');

  const url = `https://api.sociavault.com/v1/scrape/tiktok-shop/search?query=${encodeURIComponent(keyword)}&limit=${count}`;
  const res = await fetch(url, {
    headers: { 'X-Api-Key': apiKey },
  });

  const data: any = await res.json();

  if (!res.ok || !data?.data?.products) {
    console.warn('[sociavault] unexpected response:', JSON.stringify(data).slice(0, 200));
    return [];
  }

  const productsObj: Record<string, any> = data.data.products;

  return Object.values(productsObj).map((p: any) => {
    const priceUsd = parseFloat(p?.product_price_info?.sale_price_decimal ?? '0') || null;
    return {
      product_id: p.product_id ?? '',
      title: p.title ?? '',
      image_url: extractImageUrl(p),
      price_usd: priceUsd,
      price_aud: priceUsd ? Math.round(priceUsd * 1.55 * 100) / 100 : null,
      sold_count: p?.sold_info?.sold_count ?? null,
      shop_name: p?.seller_info?.shop_name ?? null,
    };
  });
}
