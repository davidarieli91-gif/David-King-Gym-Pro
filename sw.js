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
// v70: GI translations HE 99-100, seed v77 (c43)
// v71: GI translations HE 101-102, seed v79 (c44)
// v72: GI translations HE 103-104, seed v80 (c45)
// v73: GI translations HE 105-106, seed v81 (c46)
// v74: GI translations HE 107-108, seed v82 (c47)
// v75: GI translations HE 109-110, seed v83 (c48)
// v76: GI translations HE 111-112, seed v84 (c49)
// v77: GI translations HE 113-114, seed v85 (c50)
// v78: GI translations HE 115-116, seed v86 (c51)
// v79: GI translations HE 117-118, seed v87 (c52)
// v81: GI translations HE 121 — HE 100% (32385/32385), seed v89 (c54)
// v80: GI translations HE 119-120, seed v88 (c53)
// v82: i18n audit — trilingual render, RU tails, dict 1262 keys, seed v90 (c55)
// v83: i18n dict loader fixed for vite build (data:URI mangle killed dictionaries on Pages) + dicts precached, seed v91 (c56)
// v84: taxonomy order restored (208 group moves, explicit subgroups, seed v92, c57)
// v85: taxonomy v2 — 800+ group fixes, seed v93 (c58)
// v86: hinge-fix — RDL family → hamstrings, pull-through/hip-hinge family → glutes, seed v94 (c59)
// v87: subgroup pass — hammer→brachioradialis / reverse→brachialis + 35 fixes, muscle kept on source switch, seed v95 (c60)
// v108: c81 — mixed-cache blank labels fixed: i18n/*.json now NETWORK-FIRST, waiting SW auto-activates (SKIP_WAITING) + one guarded controllerchange reload, applyI18n keeps default text when a key is missing
const CACHE_NAME = 'dk-gym-v108'; // v107: c80 — Tools screen (sidebar+bottom nav after Nutrition): MuscleWiki-style Calorie calculator (Harris-Benedict, activity, goal+weekly slider, ∓10% cards, metric/imperial), Macro calculator (preset splits 40/30/30|20/40/40|30/40/30|5/25/70, meals/day, per-meal strip, copy, use-calorie-target bridge), 1RM calculator (Brzycki, load-zone table Warm-up/Volume/Strength/Peak, copy chart); localStorage persistence + i18n RU/HE/EN; meta dk-build repaired (c79 left c78)
// v104: c77 — UI sizes can no longer change themselves (zoom-based gif/food/cards, wheel/touch slider guards) + hard pre-login lock (Add Client included) + header theme quick menu with all 33 themes
// v103: c76 — Exercise DB tab = exact Quick Pick copy (star/eye/+ cards, favorites/recent tabs, View grouping, localized map tabs)
// v102: c75 — 3D atlas 1.5x + Settings ▸ UI sizes (atlas slider, bodymap/exercise-panel fixes) + Exercise DB tab rebuilt as picker-style browse
// v100: c73 sidebar Atlas above Settings + atlas auth-gated (no open before login)
// v99: c72 atlas subgroup filter — MSUB muscle→sE (Upper/Lower chest, Lats, Rotator Cuff…) passed into Exercise DB body-map filter
// v98: c71 i18n race — plans badge t() at render + delayed applyI18n pass for async renders
// v96: c69 x-ray ghost = dark glass shell (colour dimming)
// v95: c68 atlas peeling — hide / x-ray ghost / isolate / restore-all
// v94: c67 atlas «Показать упражнения» + technical meshes off tap
// v93: c66 3D Body Atlas (Z-Anatomy model, lazy-loaded)
// v92: c65 muscle-icons round 2 (trapezius/triceps/adductors/abductors/middle-back)
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
  './assets/icon-512.png',
  './src/i18n/en.json',
  './src/i18n/ru.json',
  './src/i18n/he.json'
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

  // c81: dictionaries / small JSON — NETWORK-FIRST. They gate the labels of
  // new screens; stale-while-revalidate kept serving an old dict against the
  // new HTML for a whole release cycle (every new label rendered blank until
  // the waiting SW finally activated).
  const isDict = /\.json($|\?)/i.test(url.pathname) || url.pathname.indexOf('/src/i18n/') !== -1;
  if (isDict) {
    event.respondWith(
      fetch(req).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return res;
      }).catch(() =>
        caches.match(req).then((cached) => cached || Response.error())
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
