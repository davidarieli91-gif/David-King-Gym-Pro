// Загружается как ES-модуль до основного скрипта (deferred)
import './muscle-map.js';

/**
 * i18n dictionaries loader (c55 hardening).
 * Static `import x from './i18n/*.json'` died silently in engines that
 * enforce module MIME checks (JSON is served as application/json → the whole
 * module aborted → window.__I18N__ stayed undefined and ALL t() calls
 * returned ''). fetch() works everywhere; we try the module-relative base
 * first, then the document-relative one, so the loader is base-agnostic.
 * After the dictionaries arrive we dispatch 'dk:i18n-ready'; the main script
 * listens for it, copies the dicts into its I18N var and re-applies the
 * current language to the DOM.
 */
(function () {
  const NAMES = ['en', 'ru', 'he'];
  let baseFromModule = null;
  try { baseFromModule = new URL('./i18n/', import.meta.url).href; } catch (e) { /* older engines */ }
  const baseFromDoc = new URL('./src/i18n/', document.baseURI || location.href).href;

  async function loadDict(name) {
    const tries = [];
    if (baseFromModule) tries.push(new URL(name + '.json', baseFromModule).href);
    tries.push(new URL(name + '.json', baseFromDoc).href);
    let lastErr = null;
    for (const url of tries) {
      try {
        const res = await fetch(url, { cache: 'no-cache' });
        if (!res.ok) { lastErr = new Error(url + ' → HTTP ' + res.status); continue; }
        return await res.json();
      } catch (e) { lastErr = e; }
    }
    throw lastErr || new Error('no URLs to try');
  }

  Promise.all(NAMES.map(async (n) => [n, await loadDict(n)]))
    .then((pairs) => {
      window.__I18N__ = Object.fromEntries(pairs);
      document.dispatchEvent(new Event('dk:i18n-ready'));
      console.info('[i18n] dictionaries ready (en/ru/he) via fetch');
    })
    .catch((e) => console.error('[i18n] dictionary load failed:', e));
})();
