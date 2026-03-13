import { useState } from 'react';

export interface ActiveProduct {
  id?: string;
  name: string;
  niche: string;
  summary: string;
  source: 'research' | 'validate' | 'manual';
  savedAt: number;
}

const STORAGE_KEY = 'majorka_active_product';

export function useActiveProduct() {
  const [activeProduct, setActiveProduct] = useState<ActiveProduct | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const setProduct = (product: ActiveProduct | null) => {
    setActiveProduct(product);
    if (product) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(product));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return { activeProduct, setProduct };
}
