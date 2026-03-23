import { createContext, useContext, useState, useEffect } from 'react';
import { SUPPORTED_REGIONS, DEFAULT_REGION, getStoredRegion, setStoredRegion } from '../lib/regions';
import type { RegionCode, RegionConfig } from '../lib/regions';

interface RegionContextType {
  regionCode: RegionCode;
  region: RegionConfig;
  setRegionCode: (code: RegionCode) => void;
  fxRates: Record<string, number>;
  formatPrice: (usdAmount: number) => string;
}

const RegionContext = createContext<RegionContextType>({
  regionCode: DEFAULT_REGION,
  region: SUPPORTED_REGIONS[DEFAULT_REGION],
  setRegionCode: () => {},
  fxRates: {},
  formatPrice: (v) => `$${v}`,
});

// Static fallback FX rates (USD base)
const FALLBACK_RATES: Record<string, number> = {
  USD: 1.0,
  AUD: 1.57,
  GBP: 0.79,
  EUR: 0.92,
  CAD: 1.36,
  NZD: 1.66,
  SGD: 1.34,
};

export function RegionProvider({ children }: { children: React.ReactNode }) {
  const [regionCode, setRegionCodeState] = useState<RegionCode>(getStoredRegion);
  const [fxRates, setFxRates] = useState<Record<string, number>>(FALLBACK_RATES);

  // Load FX rates on mount
  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(r => r.json())
      .then(d => { if (d.rates) setFxRates(d.rates); })
      .catch(() => {}); // fallback rates stay
  }, []);

  const setRegionCode = (code: RegionCode) => {
    setRegionCodeState(code);
    setStoredRegion(code);
    // Save to user preferences if logged in
    fetch('/api/user/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ region_code: code, currency_code: SUPPORTED_REGIONS[code].currency }),
    }).catch(() => {});
  };

  const formatPrice = (usdAmount: number): string => {
    const region = SUPPORTED_REGIONS[regionCode];
    const rate = fxRates[region.currency] || FALLBACK_RATES[region.currency] || 1;
    const converted = Math.round(usdAmount * rate);
    try {
      return new Intl.NumberFormat(region.locale, {
        style: 'currency',
        currency: region.currency,
        maximumFractionDigits: 0,
      }).format(converted);
    } catch {
      return `${region.currency_symbol}${converted}`;
    }
  };

  return (
    <RegionContext.Provider value={{
      regionCode,
      region: SUPPORTED_REGIONS[regionCode],
      setRegionCode,
      fxRates,
      formatPrice,
    }}>
      {children}
    </RegionContext.Provider>
  );
}

export const useRegion = () => useContext(RegionContext);
