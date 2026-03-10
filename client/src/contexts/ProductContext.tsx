import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import type { ProductIntelligence } from "@/lib/buildToolPrompt";

export type { ProductIntelligence };

export interface ActiveProduct {
  id?: string;
  name: string;
  niche: string;
  summary: string;
  source: "research" | "validate" | "manual";
  savedAt: number;
  price?: string;
  currency?: string;
  images?: string[];
  description?: string;
  variants?: {
    colors?: string[];
    sizes?: string[];
  };
  category?: string;
  sourceUrl?: string;
  intelligence?: ProductIntelligence;
}

interface ProductContextValue {
  activeProduct: ActiveProduct | null;
  setActiveProduct: (product: ActiveProduct | null) => void;
  savedProducts: ActiveProduct[];
  saveProduct: (product: ActiveProduct) => void;
  removeProduct: (id: string) => void;
}

const STORAGE_KEY = "majorka_active_product";
const PRODUCTS_KEY = "majorka_saved_products";

const ProductContext = createContext<ProductContextValue | null>(null);

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function ProductProvider({ children }: { children: ReactNode }) {
  const [activeProduct, setActiveProductState] = useState<ActiveProduct | null>(
    () => readStorage<ActiveProduct | null>(STORAGE_KEY, null)
  );

  const [savedProducts, setSavedProducts] = useState<ActiveProduct[]>(
    () => readStorage<ActiveProduct[]>(PRODUCTS_KEY, [])
  );

  const setActiveProduct = useCallback((product: ActiveProduct | null) => {
    setActiveProductState(product);
    if (product) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(product));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const saveProduct = useCallback((product: ActiveProduct) => {
    setSavedProducts(prev => {
      const updated = [product, ...prev.filter(p => p.id !== product.id)];
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeProduct = useCallback((id: string) => {
    setSavedProducts(prev => {
      const updated = prev.filter(p => p.id !== id);
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <ProductContext.Provider value={{ activeProduct, setActiveProduct, savedProducts, saveProduct, removeProduct }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProduct(): ProductContextValue {
  const ctx = useContext(ProductContext);
  if (!ctx) throw new Error("useProduct must be used inside ProductProvider");
  return ctx;
}
