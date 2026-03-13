/**
 * Pexels API integration — free stock photos for Majorka.
 * Reads VITE_PEXELS_API_KEY from env.
 * All images are free to use per Pexels license, with attribution.
 */

const API_KEY = import.meta.env.VITE_PEXELS_API_KEY as string | undefined;
const BASE_URL = 'https://api.pexels.com/v1';

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

/** Search Pexels for photos by query */
export async function searchPhotos(query: string, perPage: number = 8): Promise<PexelsPhoto[]> {
  if (!API_KEY) {
    console.warn('[Pexels] No API key configured');
    return [];
  }
  try {
    const params = new URLSearchParams({
      query,
      per_page: String(perPage),
      orientation: 'landscape',
    });
    const res = await fetch(`${BASE_URL}/search?${params}`, {
      headers: { Authorization: API_KEY },
    });
    if (!res.ok) throw new Error(`Pexels API error: ${res.status}`);
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
  if (!API_KEY) return [];
  try {
    const params = new URLSearchParams({
      query,
      per_page: String(perPage),
      orientation: 'portrait',
    });
    const res = await fetch(`${BASE_URL}/search?${params}`, {
      headers: { Authorization: API_KEY },
    });
    if (!res.ok) throw new Error(`Pexels API error: ${res.status}`);
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
