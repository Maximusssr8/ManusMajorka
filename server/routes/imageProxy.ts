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

router.get('/image-proxy', async (req: Request, res: Response) => {
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

  const allowed = ALLOWED_HOSTS.some((host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`));
  if (!allowed) {
    res.status(403).json({ error: 'Domain not allowed' });
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
    });

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: `Upstream ${upstream.status}` });
      return;
    }

    const contentType = upstream.headers.get('content-type') ?? 'image/jpeg';
    const buffer = await upstream.arrayBuffer();

    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(Buffer.from(buffer));
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Proxy error' });
  }
});

export default router;
