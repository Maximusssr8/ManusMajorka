/**
 * Returns a CSS gradient string keyed off a product category, used as a
 * fallback background when a product has no image_url.
 */
export function categoryGradient(category: string | null | undefined): string {
  const c = (category ?? '').toLowerCase();
  if (c.includes('health') || c.includes('fitness') || c.includes('beauty')) {
    return 'linear-gradient(135deg,#1a0f0f,#3b1c1c)';
  }
  if (c.includes('electron') || c.includes('phone') || c.includes('tech')) {
    return 'linear-gradient(135deg,#0f0f2e,#1e1e4a)';
  }
  if (c.includes('kitchen') || c.includes('food') || c.includes('home')) {
    return 'linear-gradient(135deg,#1a1200,#3b2d00)';
  }
  if (c.includes('kid') || c.includes('toy') || c.includes('cloth') || c.includes('baby')) {
    return 'linear-gradient(135deg,#1a0f2e,#2d1a4a)';
  }
  if (c.includes('pet')) {
    return 'linear-gradient(135deg,#0f1a14,#1c3b2a)';
  }
  return 'linear-gradient(135deg,#111114,#1c1c24)';
}
