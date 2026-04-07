/**
 * Wraps an AliExpress CDN URL through our server-side image proxy
 * to bypass hotlink protection.
 *
 * Non-AE URLs are returned unchanged.
 */
export function proxyImage(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('/api/image-proxy')) return url;
  if (url.includes('aliexpress-media.com') || url.includes('alicdn.com')) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}
