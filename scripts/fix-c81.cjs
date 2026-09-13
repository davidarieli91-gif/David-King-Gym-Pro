#!/usr/bin/env node
/* ============================================================================
 * fix-c81.cjs — «не доделал» fix: blank labels after a release (mixed SW cache)
 *
 * Symptom (user screenshot): Tools screen + nav.tools button rendered with
 * EMPTY labels; user: «я так понимаю что ты не доделал». Actually c80 shipped
 * correct dicts, but the PWA served NEW fitness-crm.html (network-first)
 * against the OLD precached src/i18n/ru.json (stale-while-revalidate) — the
 * waiting SW v107 never activated, so the mixed state persisted. t() returned
 * '' for every key the old dict never had and applyI18n wiped the HTML's
 * English defaults → blank button + blank screen.
 *
 * Fixes:
 *  1. applyI18n: a missing key keeps the element's default text instead of
 *     blanking it (textContent / placeholder / innerHTML / attr variants).
 *  2. Dict adoption: dk:i18n-ready + DOMContentLoaded now adopt a freshly
 *     fetched dictionary whenever it is RICHER than the running one (old code
 *     only adopted when the running dict was empty, so a stale dict blocked
 *     fresh keys forever).
 *  3. sw.js: *.json (i18n dicts) become NETWORK-FIRST like HTML.
 *  4. SW registration: auto postMessage('SKIP_WAITING') for a waiting update
 *     + one guarded controllerchange reload → new HTML and precache always
 *     converge to the same release within one automatic reload.
 *  5. Versions: meta dk-build c80→c81, RUNNING 80→81, login footer c80→c81,
 *     sw dk-gym-v107→v108 (+history line)
 * ==========================================================================*/
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FILE = path.join(ROOT, 'fitness-crm.html');
const SW = path.join(ROOT, 'sw.js');
let html = fs.readFileSync(FILE, 'utf8');
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

function repOnceSw(name, anchor, replacement) {
  const idx = sw.indexOf(anchor);
  if (idx === -1) { fails.push(`[${name}] anchor NOT FOUND`); return; }
  if (sw.indexOf(anchor, idx + 1) !== -1) { fails.push(`[${name}] anchor NOT UNIQUE`); return; }
  sw = sw.slice(0, idx) + replacement + sw.slice(idx + anchor.length);
  patched++;
  console.log(`OK  ${name} (sw.js)`);
}

/* ============================================================
 * 1) Version bumps (html)
 * ============================================================ */
repOnce(
  'meta dk-build c81',
  `<meta name="dk-build" content="c80" />`,
  `<meta name="dk-build" content="c81" />`
);

repOnce(
  'login footer c81',
  `· IndexedDB · 3 languages · c80</p>`,
  `· IndexedDB · 3 languages · c81</p>`
);

repOnce(
  'RUNNING = 81',
  `var RUNNING = 80; /* numeric part of dk-build c80 */`,
  `var RUNNING = 81; /* numeric part of dk-build c81 */`
);

/* ============================================================
 * 2) Dict adoption helper — fresh dict wins whenever it is richer
 * ============================================================ */
repOnce(
  'dict adopt helper',
  `  var I18N = window.__I18N__ || { en: {}, ru: {}, he: {} };`,
  `  var I18N = window.__I18N__ || { en: {}, ru: {}, he: {} };
  /* c81: adopt a freshly fetched dictionary whenever it is richer than the
     running one. The old guard only adopted when the running dict was EMPTY,
     so a stale precached dict (mixed SW cache right after a release) kept
     blocking the new keys forever — every key it never saw rendered blank. */
  function __dkCountDictKeys(o) {
    var n = 0;
    (function walk(x) {
      if (!x || typeof x !== 'object') return;
      Object.keys(x).forEach(function (k) {
        n++;
        if (x[k] && typeof x[k] === 'object') walk(x[k]);
      });
    })(o);
    return n;
  }
  function dkAdoptFreshDict() {
    try {
      var fresh = window.__I18N__;
      if (!fresh) return false;
      if (__dkCountDictKeys(fresh.ru || {}) > __dkCountDictKeys(I18N.ru || {}) ||
          __dkCountDictKeys(fresh.en || {}) > __dkCountDictKeys(I18N.en || {})) {
        I18N.en = fresh.en; I18N.ru = fresh.ru; I18N.he = fresh.he;
        return true;
      }
    } catch (e) { /* noop */ }
    return false;
  }`
);

repOnce(
  'dk:i18n-ready richer adopt',
  `  document.addEventListener('dk:i18n-ready', function () {
    try {
      if (window.__I18N__ && !Object.keys(I18N.ru || {}).length) {
        I18N.en = window.__I18N__.en; I18N.ru = window.__I18N__.ru; I18N.he = window.__I18N__.he;
        if (typeof applyI18n === 'function' && SUPPORTED_LANGS.includes(_lang)) applyI18n(_lang);
      }
    } catch (e) { console.warn('[i18n] late apply failed', e); }
  }, true);`,
  `  document.addEventListener('dk:i18n-ready', function () {
    try {
      /* c81: adopt whenever the fetched dict is richer (was: only when empty) */
      if (window.__I18N__ && dkAdoptFreshDict()) {
        if (typeof applyI18n === 'function' && SUPPORTED_LANGS.includes(_lang)) applyI18n(_lang);
      }
    } catch (e) { console.warn('[i18n] late apply failed', e); }
  }, true);`
);

repOnce(
  'DOMContentLoaded richer adopt',
  `  if (window.__I18N__ && !Object.keys(I18N.ru || {}).length) {
    I18N.en = window.__I18N__.en; I18N.ru = window.__I18N__.ru; I18N.he = window.__I18N__.he;
  }
}, true);;`,
  `  dkAdoptFreshDict(); /* c81: richer dict wins (was: only when empty) */
}, true);;`
);

/* ============================================================
 * 3) applyI18n never blanks labels — keep HTML default on missing key
 * ============================================================ */
repOnce(
  'applyI18n text keep-default',
  `    // text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      // Support data-i18n-vars attribute for interpolation: data-i18n-vars="3"
      const varsAttr = el.getAttribute('data-i18n-vars');
      if (varsAttr) {
        el.textContent = t(key, { n: varsAttr });
      } else {
        el.textContent = t(key);
      }
    });`,
  `    // text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      // Support data-i18n-vars attribute for interpolation: data-i18n-vars="3"
      const varsAttr = el.getAttribute('data-i18n-vars');
      const str = varsAttr ? t(key, { n: varsAttr }) : t(key);
      // c81: a key the running dict doesn't know yet (mixed SW cache right
      // after a release) must never blank a label — keep the default text.
      if (str) el.textContent = str;
    });`
);

repOnce(
  'applyI18n placeholder keep-default',
  `    // placeholders
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const key = el.getAttribute('data-i18n-ph');
      el.setAttribute('placeholder', t(key));
    });`,
  `    // placeholders
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const key = el.getAttribute('data-i18n-ph');
      const str = t(key);
      if (str) el.setAttribute('placeholder', str); /* c81: keep default on miss */
    });`
);

repOnce(
  'applyI18n html keep-default',
  `    // html content (rare — used for technique descriptions with markdown later)
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      el.innerHTML = t(key);
    });`,
  `    // html content (rare — used for technique descriptions with markdown later)
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      const str = t(key);
      if (str) el.innerHTML = str; /* c81: keep default on miss */
    });`
);

repOnce(
  'applyI18n attr keep-default',
  `    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
      const spec = el.getAttribute('data-i18n-attr');
      spec.split(',').forEach(pair => {
        const [attr, key] = pair.split(':').map(s => s.trim());
        if (attr && key) el.setAttribute(attr, t(key));
      });
    });`,
  `    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
      const spec = el.getAttribute('data-i18n-attr');
      spec.split(',').forEach(pair => {
        const [attr, key] = pair.split(':').map(s => s.trim());
        if (attr && key) {
          const str = t(key);
          if (str) el.setAttribute(attr, str); /* c81: keep default on miss */
        }
      });
    });`
);

/* ============================================================
 * 4) SW registration — auto-activate waiting update + one reload
 * ============================================================ */
repOnce(
  'sw registration auto-update',
  `        navigator.serviceWorker.register('sw.js').then(function(reg) {
          console.log('[PWA] Service Worker registered:', reg.scope);
        }).catch(function(err) {
          console.warn('[PWA] SW registration failed:', err);
        });`,
  `        navigator.serviceWorker.register('sw.js').then(function(reg) {
          console.log('[PWA] Service Worker registered:', reg.scope);
          /* c81: never sit on a waiting update — activate it immediately so the
             new HTML cannot run for a whole release cycle against the old
             precache (that mixed state blanked every new screen's labels). */
          try {
            if (reg.waiting) reg.waiting.postMessage('SKIP_WAITING');
            reg.addEventListener('waiting', function (e) {
              if (e.target && e.target.postMessage) e.target.postMessage('SKIP_WAITING');
            });
          } catch (e) { /* noop */ }
          var hadController = !!navigator.serviceWorker.controller;
          var reloaded = false;
          navigator.serviceWorker.addEventListener('controllerchange', function () {
            /* first install claims the page — nothing new to pick up */
            if (!hadController || reloaded) return;
            reloaded = true;
            window.location.reload(); /* one clean pass on the consistent precache */
          });
        }).catch(function(err) {
          console.warn('[PWA] SW registration failed:', err);
        });`
);

/* ============================================================
 * 5) sw.js — version bump + history line
 * ============================================================ */
repOnceSw(
  'sw cache v108 + history',
  `// v87: subgroup pass — hammer→brachioradialis / reverse→brachialis + 35 fixes, muscle kept on source switch, seed v95 (c60)
const CACHE_NAME = 'dk-gym-v107';`,
  `// v87: subgroup pass — hammer→brachioradialis / reverse→brachialis + 35 fixes, muscle kept on source switch, seed v95 (c60)
// v108: c81 — mixed-cache blank labels fixed: i18n/*.json now NETWORK-FIRST, waiting SW auto-activates (SKIP_WAITING) + one guarded controllerchange reload, applyI18n keeps default text when a key is missing
const CACHE_NAME = 'dk-gym-v108';`
);

/* ============================================================
 * 6) sw.js — JSON network-first (i18n dicts gate new screens' labels)
 * ============================================================ */
repOnceSw(
  'sw json network-first',
  `  if (isHtml) {
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
  }`,
  `  if (isHtml) {
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
  const isDict = /\\.json($|\\?)/i.test(url.pathname) || url.pathname.indexOf('/src/i18n/') !== -1;
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
  }`
);

/* ============================================================
 * Sanity + write
 * ============================================================ */
console.log('--- sanity ---');
function must(cond, msg) {
  if (cond) { console.log('OK  ' + msg); } else { fails.push('SANITY: ' + msg); }
}
must(html.includes('content="c81"') && !html.includes('content="c80"'), 'meta = c81 only');
must((html.match(/· c81<\/p>/g) || []).length === 1, 'login footer = c81');
must(html.includes('var RUNNING = 81;'), 'RUNNING = 81');
must((html.match(/dkAdoptFreshDict/g) || []).length >= 3, 'dkAdoptFreshDict declared + used');
must((html.match(/SKIP_WAITING/g) || []).length >= 2, 'SKIP_WAITING registration hooks');
must(html.includes("hadController = !!navigator.serviceWorker.controller"), 'controllerchange guard');
must(sw.includes("const CACHE_NAME = 'dk-gym-v108';") && !sw.includes("'dk-gym-v107'"), 'sw CACHE_NAME = v108');
must(sw.includes("const isDict ="), 'sw JSON network-first block');
must(!fails.length, 'no failures');

if (fails.length) {
  console.error('\nFAILED:\n' + fails.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
fs.writeFileSync(FILE, html);
fs.writeFileSync(SW, sw);
console.log(`\nDone. ${patched} patches written.\n`);
