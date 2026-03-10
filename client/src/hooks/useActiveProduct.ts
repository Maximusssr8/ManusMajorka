import { useState, useCallback } from 'react';

const STORAGE_KEY = 'majorka_active_product';

export interface ActiveProduct {
  id: string;
  name: string;
  niche?: string;
  stage?: string;
}

export function useActiveProduct() {
  const [activeProduct, setActiveProductState] = useState<ActiveProduct | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as ActiveProduct) : null;
    } catch {
      return null;
    }
  });

  const setActiveProduct = useCallback((product: ActiveProduct) => {
    setActiveProductState(product);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(product));
  }, []);

  const clearActiveProduct = useCallback(() => {
    setActiveProductState(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { activeProduct, setActiveProduct, clearActiveProduct };
}

export default useActiveProduct;
