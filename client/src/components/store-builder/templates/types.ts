export interface StoreProduct {
  name: string;
  description: string;
  price: number;
  image: string;
  stripePriceId?: string;
}

export interface StoreTemplateProps {
  storeName: string;
  tagline: string;
  heroHeadline: string;
  heroSubheadline: string;
  aboutText: string;
  colorPrimary: string;
  colorSecondary: string;
  products: StoreProduct[];
  stripeKey?: string;
  isPreview?: boolean;
  onBuyNow?: (product: StoreProduct) => void;
}
