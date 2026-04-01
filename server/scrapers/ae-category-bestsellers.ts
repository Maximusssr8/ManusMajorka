/**
 * AliExpress Category Bestsellers
 * Scrapes AE category pages sorted by total orders
 * Uses pintostudio actor when available, fire-and-forget
 */
import { startApifyActor, ALIEXPRESS_ACTOR } from '../services/apify';

const AE_CATEGORIES = [
  { url: 'https://www.aliexpress.com/category/200000343/pet-products.html?SortType=total_tranpro_desc', name: 'Pet' },
  { url: 'https://www.aliexpress.com/category/200003655/beauty-health.html?SortType=total_tranpro_desc', name: 'Beauty' },
  { url: 'https://www.aliexpress.com/category/200000783/home-garden.html?SortType=total_tranpro_desc', name: 'Home' },
  { url: 'https://www.aliexpress.com/category/200000506/sports-entertainment.html?SortType=total_tranpro_desc', name: 'Fitness' },
  { url: 'https://www.aliexpress.com/category/200000340/consumer-electronics.html?SortType=total_tranpro_desc', name: 'Electronics' },
  { url: 'https://www.aliexpress.com/category/200000345/mother-kids.html?SortType=total_tranpro_desc', name: 'Kids' },
  { url: 'https://www.aliexpress.com/category/200000344/apparel-accessories.html?SortType=total_tranpro_desc', name: 'Fashion' },
  { url: 'https://www.aliexpress.com/gcp/300000512/nnmixchannel.html', name: 'Hot' },
  { url: 'https://www.aliexpress.com/p/aliexpress-choice/index.html', name: 'Home' },
];

/**
 * Launch AE category scrapes via pintostudio actor.
 * Fire-and-forget — harvest cron picks up results.
 * Returns array of started runIds.
 */
export async function launchAECategoryBestsellerScrapes(): Promise<string[]> {
  const runIds: string[] = [];

  for (const cat of AE_CATEGORIES) {
    const runId = await startApifyActor(ALIEXPRESS_ACTOR, {
      startUrls: [{ url: cat.url }],
      maxItems: 100,
      sortBy: 'ORDERS',
      shipTo: 'AU',
    }, 300).catch(() => null);

    if (runId) {
      runIds.push(runId);
      console.info(`[ae-category] Started ${cat.name}: ${runId}`);
    }
    await new Promise(r => setTimeout(r, 500));
  }

  return runIds;
}
