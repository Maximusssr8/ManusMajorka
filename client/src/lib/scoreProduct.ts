export interface ProductScore {
  total: number; // 0-100
  label: 'High Potential' | 'Worth Testing' | 'Risky';
  color: string; // hex
  breakdown: {
    margin: number; // 0-25
    trend: number; // 0-20
    competition: number; // 0-15
    category: number; // 0-20
    description: number; // 0-10
    reviews: number; // 0-10
  };
}

export function scoreProduct(product: {
  name: string;
  niche?: string;
  price?: number | string;
  description?: string;
  source?: string;
}): ProductScore {
  const priceNum =
    typeof product.price === 'string'
      ? parseFloat(product.price.replace(/[^0-9.]/g, ''))
      : product.price || 0;

  // Margin potential (0-25): based on price range
  const marginScore =
    priceNum >= 50 ? 25 : priceNum >= 30 ? 20 : priceNum >= 15 ? 15 : priceNum >= 5 ? 10 : 5;

  // Trend score (0-20): based on category hotness
  const hotCategories = [
    'yoga',
    'fitness',
    'wellness',
    'skincare',
    'pet',
    'baby',
    'home',
    'tech',
    'gadget',
    'beauty',
  ];
  const nameAndNiche = (product.name + ' ' + (product.niche || '')).toLowerCase();
  const trendScore = hotCategories.some((c) => nameAndNiche.includes(c)) ? 18 : 12;

  // Competition (0-15): inverse — lower competition = higher score
  const competitionKeywords = ['wholesale', 'supplier', 'factory', 'bulk', 'generic'];
  const competitionScore = competitionKeywords.some((c) => nameAndNiche.includes(c)) ? 8 : 13;

  // Category trend (0-20): fixed by category keywords
  const trendingCategories: Record<string, number> = {
    clothing: 16,
    skincare: 18,
    supplements: 14,
    electronics: 15,
    jewellery: 12,
    home: 13,
  };
  const detectedCategory = Object.keys(trendingCategories).find((cat) =>
    nameAndNiche.includes(cat)
  );
  const categoryScore = detectedCategory ? trendingCategories[detectedCategory] : 10;

  // Description quality (0-10)
  const descLen = product.description?.length || 0;
  const descScore = descLen > 200 ? 10 : descLen > 100 ? 7 : descLen > 50 ? 4 : 2;

  // Reviews (0-10): based on source — imported products score higher
  const reviewScore = product.source === 'research' ? 9 : product.source === 'validate' ? 7 : 5;

  const total =
    marginScore + trendScore + competitionScore + categoryScore + descScore + reviewScore;

  return {
    total,
    label: total >= 80 ? 'High Potential' : total >= 50 ? 'Worth Testing' : 'Risky',
    color: total >= 80 ? '#10b981' : total >= 50 ? '#f59e0b' : '#ef4444',
    breakdown: {
      margin: marginScore,
      trend: trendScore,
      competition: competitionScore,
      category: categoryScore,
      description: descScore,
      reviews: reviewScore,
    },
  };
}
