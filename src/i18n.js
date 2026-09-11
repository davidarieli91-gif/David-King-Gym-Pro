// Загружается как ES-модуль до основного скрипта (deferred)
import './muscle-map.js';

/**
 * i18n dictionaries loader (c56 fix).
 *
 * c55 regression, root cause: vite's asset transform rewrites the syntax
 * `new URL('<static>', import.meta.url)` into an inline data:text/javascript
 * URI. Resolving '<name>.json' against a data: base then throws
 * "Failed to construct 'URL': Invalid URL" (a data: URL is not hierarchical),
 * the loader died, window.__I18N__ stayed empty and the whole UI fell back to
 * the hardcoded Russian DOM text — nothing translated on HE/EN.
 *
 * This version:
 *  - never passes import.meta.url directly to new URL (it is copied into a
 *    variable first, so vite's transform cannot match);
 *  - guards every URL build with try/catch and skips non-hierarchical bases
 *    (data:/blob:/about:);
 *  - tries both deployment layouts: './src/i18n/' (site root — repo root and
 *    deployed dist) and './i18n/' (next to the bundled loader in assets/);
 *  - delivers each dict independently (one missing JSON can no longer kill
 *    the other two).
 * After the dictionaries arrive we dispatch 'dk:i18n-ready'; the main script
 * listens for it, copies the dicts into its I18N var and re-applies the
 * current language to the DOM.
 */
(function () {
  const NAMES = ['en', 'ru', 'he'];

  /* Hierarchical bases we may resolve relative URLs against (deduped later). */
  const bases = [];
  function addBase(raw) {
    try {
      if (typeof raw !== 'string' || !raw) return;
      if (!/^https?:/i.test(raw)) return; /* data:/blob:/about: → skip */
      const u = new URL(raw);
      if (u.protocol === 'http:' || u.protocol === 'https:') bases.push(u.href);
    } catch (e) { /* malformed → skip */ }
  }
  try { addBase(document.baseURI); } catch (e) { /* older engines */ }
  try { addBase(location.href); } catch (e) { /* no location? */ }
  try { addBase(import.meta.url); } catch (e) { /* engines without import.meta */ }

  function candidateUrls(name) {
    const urls = [];
    const rels = ['./src/i18n/', './i18n/'];
    for (const rel of rels) {
      for (const base of bases) {
        try { urls.push(new URL(rel + name + '.json', base).href); } catch (e) { /* skip */ }
      }
    }
    return urls.filter((u, i) => urls.indexOf(u) === i);
  }

  async function loadDict(name) {
    let lastErr = null;
    for (const url of candidateUrls(name)) {
      try {
        const res = await fetch(url, { cache: 'no-cache' });
        if (!res.ok) { lastErr = new Error(url + ' → HTTP ' + res.status); continue; }
        return await res.json();
      } catch (e) { lastErr = e; }
    }
    console.warn('[i18n] ' + name + '.json unreachable:', lastErr);
    return {}; /* one missing dict must not kill the others */
  }

  Promise.all(NAMES.map(async (n) => [n, await loadDict(n)]))
    .then((pairs) => {
      window.__I18N__ = Object.fromEntries(pairs);
      document.dispatchEvent(new Event('dk:i18n-ready'));
      console.info('[i18n] dictionaries ready (en/ru/he) via fetch');
    })
    .catch((e) => console.error('[i18n] dictionary load failed:', e));
})();
