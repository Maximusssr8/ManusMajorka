/**
 * TikTok data pipeline via Apify REST API.
 * Same raw-fetch pattern as apifyAliExpress.ts — no apify-client dependency.
 */
import { getSupabaseAdmin } from '../_core/supabase';

const POLL_INTERVAL_MS = 2500;
const MAX_POLLS = 15;

function getToken(): string | null {
  return process.env.APIFY_API_KEY || process.env.APIFY_API_TOKEN || null;
}

// ── Apify run helper ────────────────────────────────────────────────────────

async function runApifyActor(actorId: string, input: Record<string, unknown>): Promise<any[]> {
  const token = getToken();
  if (!token) { console.error('[apify-tiktok] No APIFY_API_KEY/TOKEN'); return []; }

  try {
    console.log(`[apify-tiktok] Starting actor ${actorId}`);

    const startRes = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/runs?token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, memory: 256 }),
        signal: AbortSignal.timeout(15000),
      }
    );
    if (!startRes.ok) {
      console.error('[apify-tiktok] Start failed:', startRes.status, await startRes.text().catch(() => ''));
      return [];
    }
    const startData = await startRes.json() as { data?: { id: string } };
    const runId = startData?.data?.id;
    if (!runId) { console.error('[apify-tiktok] No run ID'); return []; }
    console.log(`[apify-tiktok] Run started: ${runId}`);

    // Poll for completion
    for (let i = 0; i < MAX_POLLS; i++) {
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));

      const statusRes = await fetch(
        `https://api.apify.com/v2/acts/${actorId}/runs/${runId}?token=${token}`,
        { signal: AbortSignal.timeout(10000) }
      );
      const statusData = await statusRes.json() as { data?: { status: string } };
      const status = statusData?.data?.status;
      console.log(`[apify-tiktok] Poll ${i + 1}: ${status}`);

      if (status === 'SUCCEEDED') {
        const itemsRes = await fetch(
          `https://api.apify.com/v2/acts/${actorId}/runs/${runId}/dataset/items?token=${token}`,
          { signal: AbortSignal.timeout(10000) }
        );
        const items = await itemsRes.json();
        return Array.isArray(items) ? items : [];
      }

      if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
        console.error(`[apify-tiktok] Run ${status}`);
        return [];
      }
    }

    console.error('[apify-tiktok] Timed out waiting for run');
    return [];
  } catch (err: any) {
    console.error('[apify-tiktok] Error:', err.message);
    return [];
  }
}

// ── Supabase cache helper ───────────────────────────────────────────────────

async function getCachedOrFetch(cacheKey: string, fetcher: () => Promise<any>, ttlHours = 6): Promise<any> {
  try {
    const sb = getSupabaseAdmin();

    // Check cache
    const { data: cached, error: cacheErr } = await sb
      .from('apify_cache')
      .select('data, expires_at')
      .eq('cache_key', cacheKey)
      .single();

    if (!cacheErr && cached && new Date(cached.expires_at) > new Date()) {
      console.log(`[apify-tiktok] Cache hit: ${cacheKey}`);
      return cached.data;
    }
  } catch {
    // Table may not exist — skip cache, fetch fresh
  }

  // Cache miss — fetch fresh
  const result = await fetcher();

  // Try to upsert into cache (ignore errors)
  try {
    const sb = getSupabaseAdmin();
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();
    await sb.from('apify_cache').upsert(
      { cache_key: cacheKey, data: result, fetched_at: new Date().toISOString(), expires_at: expiresAt },
      { onConflict: 'cache_key' }
    );
  } catch {
    // Silently skip if table doesn't exist
  }

  return result;
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Enrich creators with real TikTok profile data.
 * Actor: apify/tiktok-profile-scraper
 */
export async function enrichCreatorProfiles(handles: string[]): Promise<any[]> {
  if (!handles.length) return [];

  return getCachedOrFetch('creators_au', async () => {
    const items = await runApifyActor('apify~tiktok-profile-scraper', {
      profiles: handles,
      resultsLimit: 50,
    });
    return items;
  }, 6);
}

/**
 * Fetch trending TikTok Shop products for a region.
 * Actor: charitable_aquarium/tiktok-shop-scraper
 * Fails gracefully — returns [] on any error.
 */
export async function fetchTrendingShopProducts(region: string, limit: number): Promise<any[]> {
  return getCachedOrFetch(`products_${region.toLowerCase()}`, async () => {
    const items = await runApifyActor('charitable_aquarium~tiktok-shop-scraper', {
      region,
      limit,
    });
    return items;
  }, 6);
}

/**
 * Check cache freshness for the status endpoint.
 */
export async function getCacheStatus(): Promise<{
  creators_cached_at: string | null;
  products_cached_at: string | null;
  creators_fresh: boolean;
  products_fresh: boolean;
}> {
  const result = {
    creators_cached_at: null as string | null,
    products_cached_at: null as string | null,
    creators_fresh: false,
    products_fresh: false,
  };

  try {
    const sb = getSupabaseAdmin();
    const { data: rows } = await sb
      .from('apify_cache')
      .select('cache_key, fetched_at, expires_at')
      .in('cache_key', ['creators_au', 'products_au']);

    if (rows) {
      for (const row of rows) {
        const fresh = new Date(row.expires_at) > new Date();
        if (row.cache_key === 'creators_au') {
          result.creators_cached_at = row.fetched_at;
          result.creators_fresh = fresh;
        } else if (row.cache_key === 'products_au') {
          result.products_cached_at = row.fetched_at;
          result.products_fresh = fresh;
        }
      }
    }
  } catch {
    // Table may not exist
  }

  return result;
}
