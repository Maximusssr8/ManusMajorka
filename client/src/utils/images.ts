/**
 * Deterministic image URLs via picsum.photos
 * Same seed = same image every time. Zero API key. Never goes down.
 */
export function getProductImage(productName: string, size = 80): string {
  const seed = productName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 40);
  return `https://picsum.photos/seed/${seed}/${size}/${size}`;
}

export function getNicheImage(niche: string, size = 200): string {
  const seed = niche.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30);
  return `https://picsum.photos/seed/${seed}-niche/${size}/${size}`;
}

// Shops: use letter avatar (no picsum for shop logos — cleaner look)
export function getShopInitials(shopName: string): string {
  return shopName.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');
}

export function getShopColor(shopName: string): string {
  const colors = ['#d4af37','#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899'];
  let hash = 0;
  for (let i = 0; i < shopName.length; i++) hash = shopName.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}
