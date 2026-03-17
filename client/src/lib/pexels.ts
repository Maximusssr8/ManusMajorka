/**
 * Pexels API integration — free stock photos for Majorka.
 * Routes through server-side proxy to keep API key secure.
 * All images are free to use per Pexels license, with attribution.
 */

export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string; // Pexels page URL (for attribution)
  photographer: string;
  photographer_url: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  alt: string;
}

interface PexelsSearchResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
}

/** Search Pexels for photos by query (via server proxy) */
export async function searchPhotos(query: string, perPage: number = 8): Promise<PexelsPhoto[]> {
  try {
    const params = new URLSearchParams({
      query,
      per_page: String(perPage),
      orientation: 'landscape',
    });
    const res = await fetch(`/api/pexels/search?${params}`);
    if (!res.ok) throw new Error(`Pexels proxy error: ${res.status}`);
    const data: PexelsSearchResponse = await res.json();
    return data.photos;
  } catch (err) {
    console.error('[Pexels] Search failed:', err);
    return [];
  }
}

/** Get a single curated photo for a query */
export async function getRandomPhoto(query: string): Promise<PexelsPhoto | null> {
  const photos = await searchPhotos(query, 5);
  if (!photos.length) return null;
  return photos[Math.floor(Math.random() * photos.length)];
}

/** Get portrait-oriented photos (for TikTok/Reels backgrounds) */
export async function searchPortraitPhotos(
  query: string,
  perPage: number = 6
): Promise<PexelsPhoto[]> {
  try {
    const params = new URLSearchParams({
      query,
      per_page: String(perPage),
      orientation: 'portrait',
    });
    const res = await fetch(`/api/pexels/search?${params}`);
    if (!res.ok) throw new Error(`Pexels proxy error: ${res.status}`);
    const data: PexelsSearchResponse = await res.json();
    return data.photos;
  } catch (err) {
    console.error('[Pexels] Portrait search failed:', err);
    return [];
  }
}

/** Pexels attribution component text */
export function getAttribution(photo: PexelsPhoto): string {
  return `Photo by ${photo.photographer} on Pexels`;
}
