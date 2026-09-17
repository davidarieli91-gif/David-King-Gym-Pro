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
// v109: c82 — mobile Exercise DB browse repaired: revealed body map = own full-width wrapped row (tree+cards no longer pushed off-screen, no stretch-to-list-height), .exb-map-open CSS fallback for :has-less WebViews, 3D widget/SVG capped to column width, Report button label follows language
// v110: c83 — header dumbbell button (left of the language selector): one-tap return to the live workout at the exercise the user is actually working on (last set touched → first unfinished → last), from any screen and from inside the live scroll itself; green pulse dot marks a running session
// v111: c84 — Workouts ▸ Exercise DB = THE SAME Quick Pick component as the «Выбор упражнений» modal (single shared #bm-root DOM, mounted inline in browse mode: cards never auto-add — a click opens details; title «Тренировки»); manage row keeps Edit-tree/Archive/Add-exercise; Add Client moved from the desktop aside into the Clients screen header (same as mobile)
// v112: c85 — trainer live workout: kg⇄lb weight-unit picker (tap any weight input or the header chip; the unit is displayed at the top of the live screen and on every weight column); client portal (client.html): header now matches the trainer app (dumbbell return-to-workout, A−/A+ font steps, theme quick menu with 33 themes, settings sheet with textures v2 + opacity + share), the full theme CSS pack ported 1:1, 16-step font scale, and the same kg⇄lb unit picker
// v113: c86 — textures: the portal's panels stay clean (no texture painted on .glass/.glass-strong; the texture lives on the background overlay and shows through the translucent glass, same as the trainer app); weight units: the picker moved OFF the weight inputs — it opens only from the top labels (header chip + weight column header) in both apps
// v114: c87 — profile-loss fix: a new service worker NO LONGER force-reloads the running app (user-gated «Обновить · Update» banner instead), and the cloud boot-sync refuses to silently wipe local records newer than the last completed sync (conflict banner instead — profile «אור וינקלר» report); portal: the «Вес» column label opens ONLY the unit sheet, never the exercise card (the whole-card tap-to-open delegation now excludes [data-wunit-col]/[data-wunit-chip])
// v115: c88 — cardio units: the cardio columns of a live workout (Время/Дистанция) open ONE unit sheet (minutes<->seconds, meters<->kilometers) in BOTH apps; a Category select in the custom exercise form marks cardio exercises; ALL units (weight + time + distance) now live in ONE cloud doc (portal_shares/ps_units_global_v1) — change in one app, both change
// v116: c89 — cloud-account fix: ONE shared Firebase-compat loader (window.dkFbEnsure) for the units-sync / portal-shares / cloud-account modules — the eager units loader booted app+firestore WITHOUT auth, the cloud loader's «firebase exists» early-return then skipped firebase-auth-compat and firebase.auth() threw «Ошибка облака: firebase.auth is not a function» on every boot (sign-in + cloud backup dead since c88)
// v117: c90 — previous working weights: the live workout's «Пред.» column now prefills from the LAST workout_history record of the selected client (weight×reps, cardio time×dist, + colored 1–10 effort badge — before it only chained set→set inside the current session, so the first set always showed «—»); orphan-history fallback for profiles restored under a new id; «Сделал всё» button marks every set done (live + portal); last-workout effort badge in the portal Prev cell (findPrev now returns rpe/time/dist); time/dist/type finally SAVED to workout_history in both apps (cardio history was silently dropped); recover.html re-links workout/nutrition history rows from the pre-restore client id
// v120: c93 — «Объём по группам мышц» identical + interconnected: the trainee portal's analytics now uses the EXACT trainer CRM formula (ALL sets × weight×reps, «kg·reps» — it used to sum DONE sets only in «кг», which is why the portal showed a single «Другое 200 кг» bar while the trainer saw Ноги 2352 / Грудь 1280 …); ONE shared cloud history doc per client (portal_shares/ps_hist_<16hex>, the same SHA-256 derivative as the portal share id): CRM live-workout finish pushes the record, portal workout save pushes the record, the portal merges via onSnapshot (dedupe by ts, last 60), the CRM analytics merges remote records in-memory (5s offline guard, not persisted) — both sides always show the same workouts; legacy #e= links / demo skip the sync.
// v119: c92 — personal analytics in the trainee portal: the third bottom-nav tab («Прогресс», which was only a morning check-in form) is now «Аналитика» — range chips (week/month/all) + 4 metric cards (workouts/active days/streak 🔥/volume+minutes), activity heatmap (workout vs check-in), volume per muscle group (canonical groups + 3-language labels, same dictionary as CRM c91 — resolves via share exerciseDB → program day → legacy reverse map), body-weight SVG trend from check-ins (dashed target line + delta chip), recent-workouts list; the check-in form + measurement history stay at the bottom of the tab; check-in card labels got ids + i18n (were hard-coded RU).
// v118: c91 — rest seconds finally survive every path: program day → live workout (startWorkoutFromProgram dropped rest_sec, always fell back to 90), program editor re-open (openProgramEditor dropped rest_sec/cardio/superset/set types — re-saving baked 90 into the stored program, which the portal then also showed), template save/start/apply, history reuse (finish() didn't store rest_sec) — and every reader is 0-safe now (a stored 0 no longer flips to 90). Analytics «התפלגות שרירים» muscle names follow the UI language (RU/HE/EN) instead of echoing the build-time frozen string; records built under different languages merge by canonical group.
// v122: c95 — 10 save slots («ячейки сохранения»): slot 1 AUTO (boot/15 min/before every restore + after cloud save), slots 2–10 manual save/load/clear with dates, local IndexedDB v10 'snapshots' store + Firestore mirror (users/{uid}/snapshots/slot_N + parts) so slots load cross-device, restore replaces ONLY user stores and force-saves the current state into the AUTO slot first, empty-device guard, plus a lost-profile orphan scanner (revives clients whose programs/history survived in IndexedDB — the «אסי בורג» case) under the ORIGINAL id
// v121: c94 — cloud-sync clobber fence (a stale device can no longer overwrite newer cloud data), portal analytics backfill (FULL trainer history → ps_hist doc, caps 60→200), recover.html cloud-account restore (Google sign-in, original ids + history) + on-device portal blob restore, portal picks up new releases via controllerchange
// v123: c96 — live workout polish: (1) the weight inputs got min-width — a two-digit working weight ("30") no longer gets squeezed out of the cell; (2) the weight unit became PER-EXERCISE (Hevy parity): the weight column header of an exercise opens the unit sheet for THAT exercise, switching converts its weights + prev-weights automatically (kg⇄lb calculator rounded to 0.5), optional «apply to all exercises» checkbox, the top chip now sets only the DEFAULT for new exercises; the per-exercise unit travels through templates, finish/history and the ps_hist portal mirror — and the trainee portal got the same system + a RECOVERY MAP tab (10 save slots, slot 1 AUTO + 9 manual, IDB + cloud mirror ps_slots_<16hex>) as the fourth bottom-nav button
// v124: c97 — portal UX polish: (1) the recovery map re-translates INSTANTLY on a language switch (setLang now re-renders the 10 slot rows — before, only the static title/subtitle changed and the rows kept the old language until the tab was re-opened); (2) the per-exercise weight-unit header (кг/фт) and the cardio time/distance headers became REAL buttons with a visible outline in BOTH apps — tapping them opens only the unit sheet, never the whole exercise card anymore (the c96 header was a plain span whose tap bubbled to the card-open handler); (3) «Техника» became a real expand/collapse button that shows the technique in place — it used to be a <details><summary> whose tap opened the exercise card first, with the technique expanding only after the card was closed; (4) per-exercise unit header tooltips now say «unit of THIS exercise».
// v125: c98 — the portal's «Карта восстановления» is now the REAL recovery map, identical to the trainer CRM's (recoveryMap): same SVG body (front/back/side) with per-muscle heat colors, same 6-day exponential decay (100·(1−e^(−days/3))), same status buckets (fresh ≥85 / recovering ≥50 / fatigued), same done-sets-only volume and 30% synergist credit, mode tabs Recovery/7d/30d; data = the shared ps_hist workout history, and the trainer's map now ALSO merges the portal's cloud history (in-memory, 4s guard) — identical & interconnected in BOTH directions; portal workout records + CRM backfills carry canonical group + synergists (g/syn) so the credit matches exactly; the 10 save slots stay under «Ячейки сохранения» below the map.
// v126: c99 — portal recovery tab polish: the 10 save slots moved into Settings, the recovery-map tabs/subtitle re-translate instantly on a language switch
// v127: c100 — «Выбор упражнений» body map: the embedded 3D body and the SVG body now render at the SAME box (same width source + the SVG's 160:360 ratio) in BOTH places they appear together (Quick Pick modal ≥1440px and the Exercise DB panel incl. the ≤1023px reveal) — before, the 3D box answered to the --ui-atlas slider, had no intrinsic height and was flex-crushed to a 142px sliver next to a 488px SVG in the modal, and sat at a fixed 19:31 box in the panel; the embedded camera now fits BOTH box dimensions at a fixed ~6% margin (no longer zoomed/cropped by the atlas slider — that slider keeps controlling the big standalone Atlas only)
// v128: c101 — (1) the trainee portal stopped mixing clients: all per-client localStorage data (workout history, check-ins, done days, diary, water) is namespaced by the portal share id, the old shared keys are quarantined (dk_legacy_*) — the recovery map and analytics of a client who never trained no longer show another client's workouts; (2) the 10 save slots are REMOVED from the portal (trainer-only feature, the trainee keeps visual settings); (3) the picker's SVG body + 3D body sit flush (4px gap) and share the column height 50/50 (panel: 44vh cap) — both always fully on screen, camera re-fits on resize
// v129: c102 — (1) stretching exercises became TIME-first: the live workout (trainer + portal) renders THREE inputs per set — hold time (highlighted, first), optional working weight, optional reps — the program builder also gets a time cell (before weight) and carries it through to the portal, the Prev cell chains time×weight×reps; (2) a back-swipe with the exercise card open now closes ONLY the card: the trainer's back-trap debounces double popstate dispatch and never leaves/ends a running live workout, the portal's guard closes the topmost overlay (card/viewer/settings/units/report) instead of asking «Закрыть портал?»; (3) every modal ✕ close button got a visible frame (border + surface chip) in BOTH apps
// v130: c103 — live workout cards are now IDENTICAL to the client portal (portal design is the base): glass cards, big animated thumbnails (w-20/24, crossfade), equipment chip, per-exercise mini progress, CSS-grid set rows (the <table> is gone) with the portal's set-input/set-check/type-badge styling, framed Add-set/Done-all buttons, inline «Техника» toggle; NEW trainer-only button «Заменить упражнение» on every live card (body-map picker, single pick swaps the exercise in place, sets reset, prev re-fetched by client history); the trainer's exercise-viewer modal now matches the portal's compact size (max-w-lg bottom sheet, single column); the portal's thumbnail grew to the same w-20/24
// v131: c104 — the program builder got per-exercise units: a kg/lb chip on every weighted exercise and a min/sec chip on every cardio machine & stretch (switching converts the set values ×60/÷60); cardio sets now render time/distance cells in the builder too (they were weight×reps only); a bulk «Отдых для всех упражнений» row applies one rest value to the whole program; exercises can move ACROSS days — drop them on a day letter (A–E) tab or use the ⇄ selector on the card; superset pairs are highlighted amber in the builder, live workout AND portal (the ⚡ flag now travels into live sessions and portal sessions, per-exercise weight unit + time unit travel through program → template → live/portal as well)
const CACHE_NAME = 'dk-gym-v131'; // c104
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
