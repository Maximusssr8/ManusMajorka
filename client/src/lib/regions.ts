// client/src/lib/regions.ts — Region definitions for global market support (client)

export type RegionCode = 'AU' | 'US' | 'UK' | 'CA' | 'NZ' | 'DE' | 'SG';

export interface RegionConfig {
  code: RegionCode;
  name: string;
  flag: string;
  currency: string;
  currency_symbol: string;
  locale: string;
  gst_rate: number;
  avg_shipping_days: number;
  popular_niches: string[];
}

export const SUPPORTED_REGIONS: Record<RegionCode, RegionConfig> = {
  US: {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    currency_symbol: '$',
    locale: 'en-US',
    gst_rate: 0.08,
    avg_shipping_days: 7,
    popular_niches: ['Tech', 'Fashion', 'Fitness', 'Home'],
  },
  AU: {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    currency: 'AUD',
    currency_symbol: 'A$',
    locale: 'en-AU',
    gst_rate: 0.10,
    avg_shipping_days: 10,
    popular_niches: ['Outdoor', 'Beauty', 'Pet', 'Fitness'],
  },
  UK: {
    code: 'UK',
    name: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP',
    currency_symbol: '£',
    locale: 'en-GB',
    gst_rate: 0.20,
    avg_shipping_days: 8,
    popular_niches: ['Fashion', 'Home', 'Beauty', 'Tech'],
  },
  CA: {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    currency: 'CAD',
    currency_symbol: 'C$',
    locale: 'en-CA',
    gst_rate: 0.05,
    avg_shipping_days: 9,
    popular_niches: ['Outdoor', 'Tech', 'Home', 'Fitness'],
  },
  NZ: {
    code: 'NZ',
    name: 'New Zealand',
    flag: '🇳🇿',
    currency: 'NZD',
    currency_symbol: 'NZ$',
    locale: 'en-NZ',
    gst_rate: 0.15,
    avg_shipping_days: 12,
    popular_niches: ['Outdoor', 'Pet', 'Baby', 'Home'],
  },
  DE: {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    currency: 'EUR',
    currency_symbol: '€',
    locale: 'de-DE',
    gst_rate: 0.19,
    avg_shipping_days: 9,
    popular_niches: ['Tech', 'Home', 'Auto', 'Fashion'],
  },
  SG: {
    code: 'SG',
    name: 'Singapore',
    flag: '🇸🇬',
    currency: 'SGD',
    currency_symbol: 'S$',
    locale: 'en-SG',
    gst_rate: 0.09,
    avg_shipping_days: 5,
    popular_niches: ['Tech', 'Beauty', 'Fashion', 'Supplements'],
  },
};

export const DEFAULT_REGION: RegionCode = 'US';

export const REGION_LIST = Object.values(SUPPORTED_REGIONS);

export const getRegion = (code: string): RegionConfig => {
  return SUPPORTED_REGIONS[code as RegionCode] || SUPPORTED_REGIONS.US;
};

export const formatCurrency = (amount: number, regionCode: string): string => {
  const region = getRegion(regionCode);
  return new Intl.NumberFormat(region.locale, {
    style: 'currency',
    currency: region.currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const getStoredRegion = (): RegionCode => {
  if (typeof window === 'undefined') return DEFAULT_REGION;
  return (localStorage.getItem('majorka_region') as RegionCode) || DEFAULT_REGION;
};

export const setStoredRegion = (code: RegionCode) => {
  localStorage.setItem('majorka_region', code);
};
