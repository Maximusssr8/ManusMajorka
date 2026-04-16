import { Router, type Request, type Response } from 'express';

const router = Router();

const ALLOWED_HOSTS = [
  'ae-pic-a1.aliexpress-media.com',
  'ae01.alicdn.com',
  'ae02.alicdn.com',
  'ae03.alicdn.com',
  'ae04.alicdn.com',
  'aliexpress-media.com',
  'alicdn.com',
];

// Tiny dark SVG placeholder with subtle cobalt dot — served on upstream
// failure so <img onError> handlers stay quiet and layout doesn't jump.
const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><rect width="64" height="64" fill="#0d1117"/><circle cx="32" cy="32" r="6" fill="#4f8ef7" fill-opacity="0.45"/></svg>`;

function sendPlaceholder(res: Response): void {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).send(PLACEHOLDER_SVG);
}

function isAllowedHost(hostname: string): boolean {
  return ALLOWED_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
}

async function handleImageProxy(req: Request, res: Response): Promise<void> {
  const url = (req.query.url as string | undefined) ?? '';
  if (!url) {
    res.status(400).json({ error: 'Missing url param' });
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    res.status(400).json({ error: 'Invalid url' });
    return;
  }

  if (parsed.protocol !== 'https:') {
    res.status(400).json({ error: 'Only https URLs are allowed' });
    return;
  }

  if (!isAllowedHost(parsed.hostname)) {
    res.status(400).json({ error: 'Domain not allowed' });
    return;
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://www.aliexpress.com/',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'sec-fetch-dest': 'image',
        'sec-fetch-mode': 'no-cors',
        'sec-fetch-site': 'cross-site',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!upstream.ok) {
      sendPlaceholder(res);
      return;
    }

    const contentType = upstream.headers.get('content-type') ?? 'image/jpeg';
    const upstreamEtag = upstream.headers.get('etag');
    const buffer = await upstream.arrayBuffer();

    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (upstreamEtag) res.setHeader('ETag', upstreamEtag);
    res.send(Buffer.from(buffer));
  } catch {
    sendPlaceholder(res);
  }
}

// Canonical endpoint requested by the products page rebuild.
router.get('/proxy/image', handleImageProxy);
// Back-compat alias — existing client helpers and bookmarks still call /api/image-proxy.
router.get('/image-proxy', handleImageProxy);

export default router;
