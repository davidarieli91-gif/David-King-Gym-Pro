// Service Worker - David King Gym PWA
// v46: GI translations RU 90-91 + HE 55-56, seed v54 (c19)
// v47: GI translations RU 92-93 + HE 57-58, seed v55 (c20)
// v48: GI translations RU 94-95 + HE 59-60, seed v56 (c21)
// v49: GI translations RU 96-97 + HE 61-62, seed v57 (c22)
// v50: GI translations RU 98-99 + HE 63-64, seed v58 (c23)
// v51: GI translations RU 100-101 + HE 65-66, seed v59 (c24)
// v52: GI translations RU 102-103 + HE 67-68, seed v60 (c25)
// v53: short cloud portal link #c= (portal_shares), seed v61 (c26)
// v54: portal rules copy button visible when signed in (c27)
// v55: GI translations RU 104-105 + HE 69-70, seed v62 (c28)
// v56: GI translations RU 106-107 + HE 71-72, seed v63 (c29)
// v57: GI translations RU 108-109 + HE 73-74, seed v64 (c30)
// v58: GI translations RU 110-111 + HE 75-76, seed v65 (c31)
// v59: GI translations RU 112-113 + HE 77-78, seed v66 (c32)
// v60: GI translations RU 114-115 + HE 79-80, seed v67 (c33)
// v61: GI translations RU 116-117 + HE 81-82, seed v68 (c34)
// v62: GI translations RU 118-119 + HE 83-84, seed v69 (c35)
// v63: GI translations RU 120-121 RU COMPLETE 100% + HE 85-86, seed v70 (c36)
// v64: GI translations HE 87-88, seed v71 (c37)
// v65: GI translations HE 89-90, seed v72 (c38)
// v66: GI translations HE 91-92, seed v73 (c39)
// v67: GI translations HE 93-94, seed v74 (c40)
// v68: GI translations HE 95-96, seed v75 (c41)
// v69: GI translations HE 97-98, seed v76 (c42)
const CACHE_NAME = 'dk-gym-v70'; // v70: GI translations HE 99-100, seed v77 (c43)
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
  './logo-web.webp',
  './assets/logo-web.webp',
  './assets/icon-192.png',
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
