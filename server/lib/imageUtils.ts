/**
 * imageUtils.ts — image URL helpers for Majorka store generation
 */

/**
 * Strips Pexels w/h params to get the highest-resolution version of the image.
 * e.g. https://images.pexels.com/photos/123/photo.jpeg?auto=compress&cs=tinysrgb&w=400&h=400
 * becomes https://images.pexels.com/photos/123/photo.jpeg?auto=compress&cs=tinysrgb
 */
export function getHighResPexelsUrl(url: string): string {
  if (!url) return url;
  try {
    const u = new URL(url);
    u.searchParams.delete('h');
    u.searchParams.delete('w');
    return u.toString();
  } catch {
    return url;
  }
}
