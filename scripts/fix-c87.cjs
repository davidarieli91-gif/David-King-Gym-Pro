#!/usr/bin/env node
/* ============================================================================
 * fix-c87.cjs — no more surprise updates / silent data wipes + portal «Вес»
 * label must never open the exercise card
 *
 * User reports (RU, 2026-09-14):
 *  1. «У меня удалился автоматически профиль с уже созданной техникой…
 *    Я открыл программу на смартфоне в то время как она была у меня открыта
 *    на компьютере, и на компьютере она просто взяла и обновилась. И после
 *    этого мгновенного обновления профиль просто исчез… Если профиль создан,
 *    то нужно сделать так, чтобы он по какой-то непонятной причине не
 *    исчез.» — profile «אור וינקלר» vanished right after the running app
 *    force-updated itself.
 *  2. «внутри профиля, кнопка „Вес"… нажимая на неё, открывается карточка
 *    упражнения. Закрываешь её и только после этого ты видишь окошко
 *    изменения веса… При нажатии на эту кнопку… не должна открываться
 *    карточка упражнения.»
 *
 * Root causes:
 *  A. c81 SW wiring: SKIP_WAITING + controllerchange → IMMEDIATE
 *     window.location.reload() of the running app (the «просто взяла и
 *     обновилась»). That reload re-runs bootSyncCheck.
 *  B. bootSyncCheck: «cloud newer → silent restore». Its safety condition
 *     compared localAt against cloudAt — but NOT against `last` (LASTSYNC,
 *     bumped only by a COMPLETED save/restore). A profile created after the
 *     last successful upload (debounce is 20 s; closing the tab or the
 *     forced reload kills the pending upload) has created_at > last yet
 *     still passes localAt <= cloudAt, so applyPayload() CLEARS every
 *     synced store and re-puts the older cloud snapshot — the fresh profile
 *     is destroyed with no confirmation and no trace.
 *  C. client.html: the whole [data-exercise-card] is click-to-open
 *     (exList delegation excludes only input,button). The «Вес» column
 *     header is a <span data-wunit-col> → the click bubbles: exList opens
 *     the exercise modal (z-[110]) first, then the document handler opens
 *     the unit sheet (z-[95]) UNDER it — exactly the reported double-popup.
 *
 * Implementation:
 *  1. fitness-crm.html — controllerchange no longer reloads: it shows a
 *     user-gated banner (same bilingual style as the existing version
 *     banner) with «Обновить · Update» / dismiss. The running old HTML
 *     keeps working (i18n JSONs are network-first and additive; static
 *     asset names are stable), the new precache is picked up on the next
 *     natural restart. SKIP_WAITING stays (it only fixes mixed-cache).
 *  2. fitness-crm.html — bootSyncCheck: NEVER silently wipe local records
 *     newer than the last completed sync (localAt > last + 1500). Show the
 *     existing #cloud-conflict banner instead — the trainer chooses
 *     «Restore from cloud» or «Save to cloud» (upload local first).
 *  3. client.html — [data-wunit-col]/[data-wunit-chip] clicks are excluded
 *     from the exercise-card delegation; the unit sheet is the ONLY thing
 *     the «Вес» label opens.
 *  4. Versions: meta dk-build c86→c87, RUNNING 86→87, login footer c86→c87,
 *     sw dk-gym-v113→v114 (+history line).
 * ==========================================================================*/
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FILE = path.join(ROOT, 'fitness-crm.html');
const PORTAL = path.join(ROOT, 'client.html');
const SW = path.join(ROOT, 'sw.js');
let html = fs.readFileSync(FILE, 'utf8');
let portal = fs.readFileSync(PORTAL, 'utf8');
let sw = fs.readFileSync(SW, 'utf8');
const fails = [];
let patched = 0;

function repOnce(name, anchor, replacement) {
  const idx = html.indexOf(anchor);
  if (idx === -1) { fails.push(`[${name}] anchor NOT FOUND`); return; }
  if (html.indexOf(anchor, idx + 1) !== -1) { fails.push(`[${name}] anchor NOT UNIQUE`); return; }
  html = html.slice(0, idx) + replacement + html.slice(idx + anchor.length);
  patched++;
  console.log(`OK  ${name}`);
}

function repOncePortal(name, anchor, replacement) {
  const idx = portal.indexOf(anchor);
  if (idx === -1) { fails.push(`[${name}] anchor NOT FOUND (client.html)`); return; }
  if (portal.indexOf(anchor, idx + 1) !== -1) { fails.push(`[${name}] anchor NOT UNIQUE (client.html)`); return; }
  portal = portal.slice(0, idx) + replacement + portal.slice(idx + anchor.length);
  patched++;
  console.log(`OK  ${name} (client.html)`);
}

function repOnceSw(name, anchor, replacement) {
  const idx = sw.indexOf(anchor);
  if (idx === -1) { fails.push(`[${name}] anchor NOT FOUND (sw)`); return; }
  if (sw.indexOf(anchor, idx + 1) !== -1) { fails.push(`[${name}] anchor NOT UNIQUE (sw)`); return; }
  sw = sw.slice(0, idx) + replacement + sw.slice(idx + anchor.length);
  patched++;
  console.log(`OK  ${name} (sw.js)`);
}

/* ============================================================
 * 1) SW controllerchange — user-gated update banner, never a
 *    forced reload of the running app
 * ============================================================ */
repOnce(
  'SW: banner function inserted before load listener',
  `    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {`,
  `    if ('serviceWorker' in navigator) {
      /* c87: a new version must NEVER seize the running app. The old c81
         behavior reloaded the page the instant a waiting SW activated —
         that is the «просто взяла и обновилась» the trainer reported, and
         through the boot cloud-check it could silently restore an older
         snapshot, destroying freshly created clients. Instead: a banner
         with an explicit button (same bilingual style as the version
         banner). The single-file app keeps running fine — i18n JSONs are
         network-first and additive, asset names are stable — and the new
         precache is picked up on the next natural restart. */
      function dkShowUpdateBanner() {
        if (document.getElementById('dk-sw-update-banner')) return;
        var b = document.createElement('div');
        b.id = 'dk-sw-update-banner';
        b.setAttribute('role', 'alert');
        b.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);' +
          'bottom:calc(16px + env(safe-area-inset-bottom));z-index:2147483000;' +
          'display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:14px;' +
          'background:#1c1917;border:1px solid rgba(245,158,11,.4);color:#fbbf24;' +
          'font:600 13px/1.3 system-ui,-apple-system,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.45);' +
          'max-width:calc(100vw - 24px);flex-wrap:wrap;';
        var span = document.createElement('span');
        span.textContent = 'Доступна новая версия приложения · New version available';
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = 'Обновить · Update';
        btn.style.cssText = 'border:0;border-radius:10px;padding:7px 12px;cursor:pointer;' +
          'font:700 12px/1 system-ui,-apple-system,sans-serif;background:#f59e0b;color:#1c1917;';
        btn.addEventListener('click', function () {
          btn.disabled = true; btn.textContent = '…';
          try {
            if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
              navigator.serviceWorker.getRegistrations().then(function (rs) {
                rs.forEach(function (r) { try { r.update(); } catch (e) {} });
              }).catch(function () {});
            }
          } catch (e) {}
          setTimeout(function () { window.dkAllowClose(); location.reload(); }, 700);
        });
        var x = document.createElement('button');
        x.type = 'button';
        x.setAttribute('aria-label', 'Close');
        x.textContent = '✕';
        x.style.cssText = 'border:0;background:transparent;color:#fbbf24;cursor:pointer;' +
          'font:700 13px/1 system-ui,-apple-system,sans-serif;padding:4px;opacity:.8;';
        x.addEventListener('click', function () { b.remove(); });
        b.appendChild(span); b.appendChild(btn); b.appendChild(x);
        document.body.appendChild(b);
      }
      window.addEventListener('load', function() {`
);

repOnce(
  'SW: controllerchange reload → banner',
  `          var hadController = !!navigator.serviceWorker.controller;
          var reloaded = false;
          navigator.serviceWorker.addEventListener('controllerchange', function () {
            /* first install claims the page — nothing new to pick up */
            if (!hadController || reloaded) return;
            reloaded = true;
            window.location.reload(); /* one clean pass on the consistent precache */
          });`,
  `          var hadController = !!navigator.serviceWorker.controller;
          var reloaded = false;
          navigator.serviceWorker.addEventListener('controllerchange', function () {
            /* first install claims the page — nothing new to pick up */
            if (!hadController || reloaded) return;
            reloaded = true;
            /* c87: NO forced reload — ask the user instead (dkShowUpdateBanner). */
            try { dkShowUpdateBanner(); } catch (_e) { /* never break the app here */ }
          });`
);

/* ============================================================
 * 2) bootSyncCheck — never silently wipe local records newer
 *    than the last completed sync
 * ============================================================ */
repOnce(
  'cloud: boot sync refuses to wipe unsynced local records',
  `        var localAt = await localLastChange();
        if (localAt <= cloudAt + 1500) {`,
  `        var localAt = await localLastChange();
        /* c87 GUARD: \`last\` (LASTSYNC) is bumped ONLY by a completed
         * save/restore. A record created after it (20 s debounced upload
         * pending, or the tab died mid-debounce) may never have reached the
         * cloud — even when cloudAt is newer (another device uploaded in
         * between). A silent full-replace restore here is exactly how the
         * freshly created profile «אור וינקלר» vanished (report 2026-09-14).
         * Never wipe such records: surface the conflict banner and let the
         * trainer pick — «Save to cloud» keeps the local data, «Restore from
         * cloud» is an explicit choice. */
        if (localAt > last + 1500) {
          var cfNew = $('cloud-conflict');
          if (cfNew) cfNew.classList.remove('hidden');
          toastMsg(T('settings.cloudAccConflict') || 'Cloud and device data differ', 'warning', 8000);
          return;
        }
        if (localAt <= cloudAt + 1500) {`
);

/* ============================================================
 * 3) client.html — «Вес» label opens ONLY the unit sheet
 * ============================================================ */
repOncePortal(
  'portal: unit label excluded from exercise-card delegation',
  `        if(e.target.closest('input,button')) return;`,
  `        if(e.target.closest('input,button')) return;
        /* c87: the weight-unit top label opens ONLY the unit sheet (the
         * document-level picker handler deals with it) — never the exercise
         * card. Report: tapping «Вес» opened the card first (z-[110] above
         * the z-[95] sheet), and the unit dialog only showed up after the
         * card was closed. */
        if(e.target.closest('[data-wunit-col],[data-wunit-chip]')) return;`
);

/* ============================================================
 * 4) Versions
 * ============================================================ */
repOnce(
  'meta dk-build c86→c87',
  `<meta name="dk-build" content="c86" />`,
  `<meta name="dk-build" content="c87" />`
);
repOnce(
  'RUNNING 86→87',
  `var RUNNING = 86; /* numeric part of dk-build c86 */`,
  `var RUNNING = 87; /* numeric part of dk-build c87 */`
);
repOnce(
  'login footer c86→c87',
  `· IndexedDB · 3 languages · c86</p>`,
  `· IndexedDB · 3 languages · c87</p>`
);
repOnceSw(
  'sw CACHE_NAME v113→v114',
  `const CACHE_NAME = 'dk-gym-v113';`,
  `const CACHE_NAME = 'dk-gym-v114';`
);
repOnceSw(
  'sw history line v114',
  `// v113: c86 — textures: the portal's panels stay clean (no texture painted on .glass/.glass-strong; the texture lives on the background overlay and shows through the translucent glass, same as the trainer app); weight units: the picker moved OFF the weight inputs — it opens only from the top labels (header chip + weight column header) in both apps`,
  `// v113: c86 — textures: the portal's panels stay clean (no texture painted on .glass/.glass-strong; the texture lives on the background overlay and shows through the translucent glass, same as the trainer app); weight units: the picker moved OFF the weight inputs — it opens only from the top labels (header chip + weight column header) in both apps
// v114: c87 — profile-loss fix: a new service worker NO LONGER force-reloads the running app (user-gated «Обновить · Update» banner instead), and the cloud boot-sync refuses to silently wipe local records newer than the last completed sync (conflict banner instead — profile «אור וינקלר» report); portal: the «Вес» column label opens ONLY the unit sheet, never the exercise card (the whole-card tap-to-open delegation now excludes [data-wunit-col]/[data-wunit-chip])`
);

/* ============================================================
 * Sanity — assert the patches landed and nothing got mangled
 * ============================================================ */
function sanity(name, cond, detail) {
  if (cond) { console.log(`PASS  ${name}`); }
  else { fails.push(`[sanity] ${name} FAILED${detail ? ' — ' + detail : ''}`); }
}

sanity('banner function present',
  html.includes('function dkShowUpdateBanner()'));
sanity('no forced reload left in controllerchange',
  !/controllerchange'[\s\S]{0,400}location\.reload\(\)/.test(html));
sanity('banner still lets the user reload explicitly',
  /dk-sw-update-banner[\s\S]{0,2600}location\.reload\(\)/.test(html));
sanity('boot-sync guard present',
  html.includes('if (localAt > last + 1500) {'));
sanity('boot-sync guard precedes silent restore',
  html.indexOf('if (localAt > last + 1500) {') !== -1 &&
  html.indexOf('if (localAt > last + 1500) {') < html.indexOf('if (localAt <= cloudAt + 1500) {'));
sanity('portal guard present',
  portal.includes("if(e.target.closest('[data-wunit-col],[data-wunit-chip]')) return;"));
sanity('portal guard inside exList delegation (before openExerciseModal)',
  portal.indexOf("if(e.target.closest('[data-wunit-col],[data-wunit-chip]')) return;") <
  portal.indexOf('if(ex) openExerciseModal(exKey(ex));'));
sanity('RUNNING bumped exactly once',
  (html.match(/var RUNNING = 87;/g) || []).length === 1);
sanity('meta dk-build is c87',
  (html.match(/name="dk-build" content="c87"/g) || []).length === 1);
sanity('login footer is c87',
  (html.match(/3 languages · c87<\/p>/g) || []).length === 1);
sanity('sw CACHE_NAME is v114',
  (sw.match(/dk-gym-v114/g) || []).length >= 1);
sanity('sw history has v114 line',
  sw.includes('// v114: c87'));
sanity('c86 residue gone',
  !html.includes('c86</p>') && !html.includes('content="c86"'));
sanity('old c81 reload comment gone',
  !html.includes('one clean pass on the consistent precache'));

/* ============================================================
 * Report + write
 * ============================================================ */
console.log('---');
if (fails.length) {
  console.error('FAILED:');
  fails.forEach(f => console.error('  ' + f));
  process.exit(1);
}
fs.writeFileSync(FILE, html);
fs.writeFileSync(PORTAL, portal);
fs.writeFileSync(SW, sw);
console.log(`All checks passed — ${patched} patches written to fitness-crm.html, client.html, sw.js.`);
