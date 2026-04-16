/**
 * Wraps an AliExpress CDN URL through our server-side image proxy
 * to bypass hotlink protection (Referer-checked CDNs return 403 to us).
 *
 * - Already-proxied URLs and data: URLs are returned unchanged.
 * - Non-AliExpress URLs are returned unchanged (Pexels, Unsplash, etc).
 */
export function proxyImage(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('/api/') || url.startsWith('data:')) return url;
  if (url.includes('aliexpress-media.com') || url.includes('alicdn.com')) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}
