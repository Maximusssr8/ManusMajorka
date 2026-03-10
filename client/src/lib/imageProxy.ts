/**
 * Image proxy helper — routes CDN images that block cross-origin requests
 * (AliExpress, Alibaba CDN, etc.) through the local /api/proxy-image endpoint.
 */
const PROXY_DOMAINS = [
  "aliexpress-media.com",
  "ae-pic",
  "alicdn.com",
  "ae01.alicdn.com",
  "ae04.alicdn.com",
  "gloimg.alicdn.com",
];

export function proxyImage(url: string): string {
  if (!url) return "";
  const needsProxy = PROXY_DOMAINS.some(d => url.includes(d));
  if (needsProxy) {
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  }
  return url;
}
