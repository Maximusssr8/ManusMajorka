export interface CategoryStyle { gradient: string; emoji: string }

/**
 * Returns a gradient + matching emoji for a product category, used as a
 * fallback when a product has no image_url.
 */
export function getCategoryStyle(category: string | null | undefined): CategoryStyle {
  const c = (category ?? '').toLowerCase();
  if (c.includes('kid') || c.includes('toy') || c.includes('baby'))                            return { gradient: 'linear-gradient(135deg,#4c1d95,#7c3aed)', emoji: '🧸' };
  if (c.includes('fitness') || c.includes('sport') || c.includes('health') || c.includes('beauty')) return { gradient: 'linear-gradient(135deg,#14532d,#16a34a)', emoji: '💪' };
  if (c.includes('electron') || c.includes('phone') || c.includes('tech') || c.includes('mobile')) return { gradient: 'linear-gradient(135deg,#1e1b4b,#3730a3)', emoji: '⚡' };
  if (c.includes('kitchen') || c.includes('food') || c.includes('cook'))                        return { gradient: 'linear-gradient(135deg,#7c2d12,#c2410c)', emoji: '🍳' };
  if (c.includes('cloth') || c.includes('fashion') || c.includes('apparel'))                   return { gradient: 'linear-gradient(135deg,#831843,#be185d)', emoji: '👗' };
  if (c.includes('home') || c.includes('garden') || c.includes('storage') || c.includes('furniture')) return { gradient: 'linear-gradient(135deg,#1c1917,#44403c)', emoji: '🏠' };
  if (c.includes('outdoor') || c.includes('travel') || c.includes('auto'))                     return { gradient: 'linear-gradient(135deg,#052e16,#166534)', emoji: '🌿' };
  if (c.includes('tool') || c.includes('hardware') || c.includes('industrial'))                return { gradient: 'linear-gradient(135deg,#1c1917,#57534e)', emoji: '🔧' };
  if (c.includes('jewel') || c.includes('accessor') || c.includes('watch'))                    return { gradient: 'linear-gradient(135deg,#78350f,#d97706)', emoji: '💍' };
  if (c.includes('stationery') || c.includes('office') || c.includes('craft'))                 return { gradient: 'linear-gradient(135deg,#1e3a5f,#2563eb)', emoji: '✏️' };
  if (c.includes('pet'))                                                                         return { gradient: 'linear-gradient(135deg,#0f1a14,#1c3b2a)', emoji: '🐾' };
  return { gradient: 'linear-gradient(135deg,#0f172a,#1e293b)', emoji: '📦' };
}

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
