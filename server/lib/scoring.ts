export function calculateWinningScore(product: {
  orders?: number;
  real_orders_count?: number;
  rating?: number;
  real_rating?: number;
  price?: number;
  real_price_aud?: number;
  commission_rate?: number;
}): number {
  const orders = product.orders ?? product.real_orders_count ?? 0;
  const rating = product.rating ?? product.real_rating ?? 0;
  const price = product.price ?? product.real_price_aud ?? 0;
  const origPrice = price * 1.3; // estimated 30% markup
  const orderScore = Math.min((orders / 10000) * 40, 40);
  const ratingScore = (rating / 5) * 30;
  const discountPct = origPrice > price ? ((origPrice - price) / origPrice) * 100 : 0;
  const discountScore = Math.min((discountPct / 100) * 20, 20);
  const commissionScore = Math.min(((product.commission_rate || 0) / 10) * 10, 10);
  return Math.min(Math.round(orderScore + ratingScore + discountScore + commissionScore), 100);
}
