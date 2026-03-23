// server/lib/fx-rates.ts
// Fetches live USD FX rates from open.er-api.com (free, no key)

export const FALLBACK_RATES: Record<string, number> = {
  USD: 1.0, AUD: 1.57, GBP: 0.79, EUR: 0.92, CAD: 1.36, NZD: 1.66, SGD: 1.34,
};

let cachedRates: Record<string, number> = FALLBACK_RATES;
let lastFetched = 0;

export const getFxRates = async (): Promise<Record<string, number>> => {
  // Cache for 6 hours
  if (Date.now() - lastFetched < 6 * 3600 * 1000) return cachedRates;

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!res.ok) return cachedRates;
    const data = await res.json();
    if (data.rates) {
      cachedRates = data.rates;
      lastFetched = Date.now();
    }
  } catch {
    // use cached/fallback
  }
  return cachedRates;
};

export const convertUsdTo = (usdAmount: number, toCurrency: string, rates = cachedRates): number => {
  const rate = rates[toCurrency] || 1;
  return Math.round(usdAmount * rate * 100) / 100;
};
