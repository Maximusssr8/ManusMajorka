import { useState, useCallback } from 'react';

export interface ProductFilters {
  page: number;
  limit: number;
  sort: string;
  filter: string;
  search: string;
  niche: string;
}

const DEFAULT_FILTERS: ProductFilters = {
  page: 1, limit: 50, sort: 'orders', filter: 'all', search: '', niche: '',
};

export function useProductFilters() {
  const [filters, setFiltersState] = useState<ProductFilters>(DEFAULT_FILTERS);

  const setFilters = useCallback((updates: Partial<ProductFilters>) => {
    setFiltersState(prev => ({
      ...prev, ...updates,
      page: 'page' in updates ? (updates.page as number) : 1,
    }));
  }, []);

  const resetFilters = useCallback(() => setFiltersState(DEFAULT_FILTERS), []);
  return { filters, setFilters, resetFilters };
}
