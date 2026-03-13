import { useState, useEffect } from "react";

const STORAGE_KEY = "majorka_beginner_mode";

export function useBeginnerMode(accountCreatedAt?: string | null) {
  const [isBeginnerMode, setIsBeginnerMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) return stored === "true";
      // Default ON for new users (account < 7 days old)
      if (accountCreatedAt) {
        const created = new Date(accountCreatedAt).getTime();
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        return created > sevenDaysAgo;
      }
      return false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(isBeginnerMode));
    } catch { /* ignore */ }
  }, [isBeginnerMode]);

  const toggleBeginnerMode = () => setIsBeginnerMode((prev) => !prev);

  return { isBeginnerMode, toggleBeginnerMode };
}

/**
 * Beginner-friendly labels for specific tool IDs.
 * When Beginner Mode is ON, these labels replace the default ones in the sidebar.
 */
export const BEGINNER_LABELS: Record<string, string> = {
  "product-discovery": "Find Products to Sell",
  "meta-ads": "Create Facebook & Instagram Ads",
  "website-generator": "Build Your Store",
  "brand-dna": "Design Your Brand",
  "validation-plan": "Check If It's Worth It",
  "supplier-finder": "Find Product Suppliers",
};

/**
 * Plain-language tooltips shown when Beginner Mode is ON.
 */
export const BEGINNER_TOOLTIPS: Record<string, string> = {
  "product-discovery": "AI finds products that are trending and profitable in Australia right now.",
  "meta-ads": "Generates ready-to-use Facebook and Instagram ad copy for your product.",
  "website-generator": "Creates a complete Shopify store layout and copy for your product.",
  "brand-dna": "Defines your brand name, colours, tone of voice, and identity.",
  "validation-plan": "Tells you if a product idea is worth investing money in.",
  "supplier-finder": "Finds reliable suppliers on AliExpress, Alibaba, and Australian wholesalers.",
};
