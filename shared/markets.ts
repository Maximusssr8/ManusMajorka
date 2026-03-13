export type MarketCode = 'AU' | 'US' | 'EU' | 'UK' | 'ASIA' | 'GLOBAL'

export interface Market {
  code: MarketCode
  name: string
  flag: string
  currency: string
  currencySymbol: string
  language: string
  shipping: string[]
  bnpl: string[]
  compliance: string[]
  taxLabel: string
  taxRate: number
  english: 'AU' | 'US' | 'UK' | 'NEUTRAL'
  seasonalPeaks: string[]
  platforms: string[]
}

export const MARKETS: Record<MarketCode, Market> = {
  AU: {
    code: 'AU', name: 'Australia', flag: '\u{1F1E6}\u{1F1FA}',
    currency: 'AUD', currencySymbol: 'A$',
    language: 'Australian English',
    shipping: ['Australia Post', 'Sendle', 'CouriersPlease', 'Aramex AU'],
    bnpl: ['Afterpay', 'Zip', 'Humm', 'Laybuy'],
    compliance: ['ACCC', 'TGA', 'ASIC', 'Australian Consumer Law'],
    taxLabel: 'GST', taxRate: 0.10,
    english: 'AU',
    seasonalPeaks: ['EOFY (Jun)', 'Click Frenzy (Nov)', 'Boxing Day (Dec 26)', 'Black Friday (Nov)'],
    platforms: ['Shopify AU', 'eBay AU', 'Amazon AU', 'Kogan', 'Catch'],
  },
  US: {
    code: 'US', name: 'United States', flag: '\u{1F1FA}\u{1F1F8}',
    currency: 'USD', currencySymbol: '$',
    language: 'American English',
    shipping: ['USPS', 'FedEx', 'UPS', 'ShipBob'],
    bnpl: ['Klarna', 'Afterpay US', 'Affirm', 'Sezzle'],
    compliance: ['FTC', 'FDA', 'CPSC'],
    taxLabel: 'Sales Tax', taxRate: 0.08,
    english: 'US',
    seasonalPeaks: ['Black Friday (Nov)', 'Cyber Monday (Nov)', 'Prime Day (Jul)', 'Back to School (Aug)'],
    platforms: ['Shopify', 'Amazon US', 'Walmart', 'eBay US', 'Etsy'],
  },
  EU: {
    code: 'EU', name: 'Europe', flag: '\u{1F1EA}\u{1F1FA}',
    currency: 'EUR', currencySymbol: '\u20AC',
    language: 'British English',
    shipping: ['DHL', 'DPD', 'PostNL', 'GLS'],
    bnpl: ['Klarna', 'PayPal Pay Later', 'Scalapay'],
    compliance: ['GDPR', 'CE Marking', 'VAT OSS'],
    taxLabel: 'VAT', taxRate: 0.20,
    english: 'UK',
    seasonalPeaks: ['Black Friday (Nov)', 'Singles Day (Nov 11)', 'Summer Sales (Jul)', 'Winter Sales (Jan)'],
    platforms: ['Amazon DE/FR/IT/ES', 'Shopify EU', 'Zalando', 'Cdiscount', 'Bol.com'],
  },
  UK: {
    code: 'UK', name: 'United Kingdom', flag: '\u{1F1EC}\u{1F1E7}',
    currency: 'GBP', currencySymbol: '\u00A3',
    language: 'British English',
    shipping: ['Royal Mail', 'DPD UK', 'Hermes', 'DHL UK'],
    bnpl: ['Klarna', 'Clearpay', 'PayPal Pay Later'],
    compliance: ['Trading Standards', 'ASA', 'UK VAT'],
    taxLabel: 'VAT', taxRate: 0.20,
    english: 'UK',
    seasonalPeaks: ['Black Friday (Nov)', 'Boxing Day (Dec 26)', 'January Sales', 'Summer Sales (Jun)'],
    platforms: ['Amazon UK', 'Shopify UK', 'eBay UK', 'ASOS Marketplace', 'Etsy UK'],
  },
  ASIA: {
    code: 'ASIA', name: 'Asia Pacific', flag: '\u{1F30F}',
    currency: 'USD', currencySymbol: '$',
    language: 'American English',
    shipping: ['Ninja Van', 'J&T Express', 'SF Express', 'Japan Post'],
    bnpl: ['Paidy', 'GrabPay', 'GoPay', 'Atome'],
    compliance: ['Country-specific'],
    taxLabel: 'Tax', taxRate: 0.09,
    english: 'NEUTRAL',
    seasonalPeaks: ['Singles Day (Nov 11)', '12.12 Sale (Dec 12)', 'Chinese New Year', 'Mid-Year Sale (Jun)'],
    platforms: ['Shopee', 'Lazada', 'Tokopedia', 'Rakuten', 'Amazon JP'],
  },
  GLOBAL: {
    code: 'GLOBAL', name: 'Global', flag: '\u{1F30D}',
    currency: 'USD', currencySymbol: '$',
    language: 'English',
    shipping: ['DHL Express', 'FedEx International', 'UPS Worldwide'],
    bnpl: ['PayPal', 'Klarna'],
    compliance: ['Local laws apply'],
    taxLabel: 'Tax', taxRate: 0.10,
    english: 'NEUTRAL',
    seasonalPeaks: ['Black Friday (Nov)', 'Cyber Monday (Nov)', 'Singles Day (Nov 11)', 'Christmas (Dec)'],
    platforms: ['Shopify', 'Amazon', 'eBay', 'Etsy'],
  }
}

export const DEFAULT_MARKET: MarketCode = 'AU'

export const MARKET_CODES = Object.keys(MARKETS) as MarketCode[]

/** Build market context string for AI system prompts */
export function buildMarketContext(code: MarketCode): string {
  const m = MARKETS[code]
  return `
MARKET CONTEXT:
- Target market: ${m.name} (${m.flag})
- Currency: ${m.currency} (${m.currencySymbol})
- BNPL options: ${m.bnpl.join(', ')}
- Shipping carriers: ${m.shipping.join(', ')}
- Tax system: ${m.taxLabel} (${(m.taxRate * 100).toFixed(0)}%)
- Compliance: ${m.compliance.join(', ')}
- English variant: ${m.english}
- Seasonal peaks: ${m.seasonalPeaks.join(', ')}
- Key platforms: ${m.platforms.join(', ')}
- ALL prices, shipping, compliance, and cultural references must be specific to ${m.name}
`
}

/** Alias for buildMarketContext */
export const getMarketPromptContext = buildMarketContext
