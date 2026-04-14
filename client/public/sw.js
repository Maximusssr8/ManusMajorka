/**
 * Self-destructing Service Worker.
 *
 * The previous SW (majorka-v2) cached bundles including /index.html and the
 * hashed /assets/index-*.js entry. Across deploys the old HTML → old chunk
 * hashes got served to returning users, causing post-deploy black screens
 * that hard-refresh couldn't fix because the SW intercepted the refresh too.
 *
 * This replacement has one job: wipe every cache and unregister itself on
 * activate. After one round-trip there is no SW at all; the browser fetches
 * the current HTML + current chunks from the network cleanly.
 */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch {}
    try {
      await self.registration.unregister();
    } catch {}
    try {
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((c) => c.navigate(c.url));
    } catch {}
  })());
});

// Never serve from cache. Let every request hit the network.
self.addEventListener('fetch', () => {});
