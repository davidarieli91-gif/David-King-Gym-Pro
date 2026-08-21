// Service Worker - David King Gym PWA
// v22: NETWORK-FIRST for pages/HTML (updates reach users immediately),
//      cache-first only for static assets. Fixes stale-HTML lock-in.
const CACHE_NAME = 'dk-gym-v22';
const APP_SHELL = [
  './',
  './index.html',
  './fitness-crm.html',
  './client.html',
  './exercise-db.json',
  './food-db.json',
  './manifest.json',
  './assets/manifest.json',
  './vendor/qrcode.min.js',
  './icon-192.png',
  './icon-512.png',
  './assets/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(req).catch(() =>
        caches.match(req).then((cached) =>
          cached || new Response('', { status: 503 })
        )
      )
    );
    return;
  }

  // HTML / navigations: NETWORK-FIRST with cache fallback (offline support).
  const isHtml = req.mode === 'navigate'
    || (req.headers.get('accept') || '').includes('text/html')
    || /\.html?$/.test(url.pathname);

  if (isHtml) {
    event.respondWith(
      fetch(req).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return res;
      }).catch(() =>
        caches.match(req).then((cached) => cached || caches.match('./index.html'))
      )
    );
    return;
  }

  // Static assets: cache-first, refresh in background (stale-while-revalidate)
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => {
        if (res.ok && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
