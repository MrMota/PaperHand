/* Paperhand service worker. Generated at build time by vite.config.ts, which fills in the version and the file list. */
const VERSION = '__VERSION__';
const SHELL = `paperhand-shell-${VERSION}`;
const RUNTIME = 'paperhand-runtime';
const PRECACHE = __PRECACHE__;

self.addEventListener('install', (event) => {
  // Cache every file the app needs to start offline. Do not take over yet: the page asks first.
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll(PRECACHE)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith('paperhand-shell-') && key !== SHELL) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => { if (event.data === 'skip-waiting') self.skipWaiting(); });

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // model downloads are cached by the library itself
  if (req.mode === 'navigate') {
    // Hash routing: every page is index.html.
    event.respondWith(caches.match('./index.html', { ignoreSearch: true }).then((hit) => hit || fetch(req)));
    return;
  }
  event.respondWith((async () => {
    const hit = await caches.match(req, { ignoreSearch: true });
    if (hit) return hit;
    const res = await fetch(req);
    // Big on-demand files (the background-removal engine) are cached the first time they are used.
    if (res.ok && /\.(wasm|mjs|js|css|woff2?|png|jpg|svg)$/.test(url.pathname)) {
      const copy = res.clone();
      caches.open(RUNTIME).then((c) => c.put(req, copy));
    }
    return res;
  })());
});
