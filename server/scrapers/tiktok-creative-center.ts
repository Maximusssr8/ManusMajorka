/**
 * TikTok Creative Center top ads scraper.
 * Uses Apify Playwright to extract top-performing ads from the public Creative Center.
 */
import { startApifyRun } from '../lib/apifyFireForget';

const CC_PAGE_FUNCTION = `
async function pageFunction(context) {
  const { page, request, log } = context;
  await page.waitForTimeout(4000);

  const results = await page.evaluate(() => {
    const ads = [];
    const cards = document.querySelectorAll('[class*="topAds"] [class*="card"], [class*="top-ads"] [class*="item"], [data-testid*="ad-card"]');

    for (const card of Array.from(cards).slice(0, 50)) {
      try {
        const title = card.querySelector('[class*="title"], [class*="desc"], p')?.textContent?.trim() || '';
        const ctr = card.querySelector('[class*="ctr"], [class*="CTR"]')?.textContent?.trim() || '';
        const thumb = card.querySelector('img')?.src || '';
        const link = card.querySelector('a')?.href || '';
        const brand = card.querySelector('[class*="brand"], [class*="advertiser"]')?.textContent?.trim() || '';

        if (title || thumb) ads.push({ title, ctr, thumbnail: thumb, link, brand });
      } catch(e) {}
    }

    if (ads.length < 3) {
      const allText = document.querySelectorAll('[class*="AdInspiration"] li, [class*="ad-list"] li');
      for (const el of Array.from(allText).slice(0, 30)) {
        const text = el.textContent?.trim() || '';
        if (text.length > 10) ads.push({ title: text, ctr: '', thumbnail: '', link: '', brand: '' });
      }
    }

    return ads;
  });

  log.info(\\\`TikTok CC: extracted \\\${results.length} ads from \\\${request.url}\\\`);
  return { url: request.url, ads: results, timestamp: new Date().toISOString() };
}
`.trim();

export async function launchTikTokCCScrape(): Promise<string | null> {
  const result = await startApifyRun(
    'apify~playwright-scraper',
    'tiktok_cc',
    {
      startUrls: [{ url: 'https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en' }],
      pageFunction: CC_PAGE_FUNCTION,
      maxRequestsPerCrawl: 1,
      maxConcurrency: 1,
      navigationTimeout: 60,
      pageLoadTimeoutSecs: 45,
      proxyConfiguration: { useApifyProxy: true, apifyProxyGroups: ['RESIDENTIAL'] },
    },
    512
  );
  return result?.runId || null;
}

export function extractCCItems(items: any[]): Array<{ title: string; thumbnail: string; source: string }> {
  const results: Array<{ title: string; thumbnail: string; source: string }> = [];
  for (const item of items) {
    const ads = item.ads || (Array.isArray(item) ? item : []);
    for (const ad of ads) {
      if (ad.title && ad.title.length > 5) {
        results.push({ title: ad.title, thumbnail: ad.thumbnail || '', source: 'tiktok_cc' });
      }
    }
  }
  return results;
}
