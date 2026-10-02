/* c158 test — full portal translation audit + adaptive layout hardening.
   Audit: EVERY literal key used by t()/T()/data-i18n in client.html must exist
   in the main islands (I18N.ru/en/he) OR the settings dictionary (L.ru/en/he).
   Layout: applyFontScale toggles html.dk-fs-big/dk-fs-small, exposes the test
   hook, and the CSS block makes truncate/rows/chips wrap at large fonts. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const trainer = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const html = fs.readFileSync(path.join(root, 'client.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }

function braceObj(src, startMarker) {
  const start = src.indexOf(startMarker);
  if (start < 0) throw new Error('marker not found: ' + startMarker);
  const i = src.indexOf('{', start);
  let depth = 0;
  let inStr = null, inLine = false, inBlock = false, esc = false;
  for (let k = i; k < src.length; k++) {
    const c = src[k], n = src[k + 1];
    if (inLine) { if (c === '\n') inLine = false; continue; }
    if (inBlock) { if (c === '*' && n === '/') { inBlock = false; k++; } continue; }
    if (inStr) { if (esc) { esc = false; continue; } if (c === '\\') { esc = true; continue; } if (c === inStr) inStr = null; continue; }
    if (c === '/' && n === '/') { inLine = true; k++; continue; }
    if (c === '/' && n === '*') { inBlock = true; k++; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (!depth) return src.slice(i, k + 1); }
  }
  throw new Error('unbalanced: ' + startMarker);
}

/* ---------- 1. translation audit ---------- */
const I18N = new Function('return (' + braceObj(html, 'const I18N = {') + ')')();
const L = new Function('return (' + braceObj(html, 'var L = {') + ')')();
const DYNAMIC = new Set(['ptex', 'voiceHelp_']); /* built by string concatenation */
const keys = new Set();
const push = (k) => { if (k && /^[\w.]+$/.test(k) && !DYNAMIC.has(k)) keys.add(k); };
let m;
const reT = /\bt\(\s*'([^']+)'/g;
while ((m = reT.exec(html))) push(m[1]);
const reTT = /\bT\(\s*'([^']+)'/g;
while ((m = reTT.exec(html))) push(m[1]);
const reDI = /data-i18n(?:-ph|-html)?="([^"]+)"/g;
while ((m = reDI.exec(html))) push(m[1]);
for (const lang of ['ru', 'en', 'he']) {
  const missing = [];
  keys.forEach((k) => {
    if (!((I18N[lang] && I18N[lang][k]) || (L[lang] && L[lang][k]))) missing.push(k);
  });
  ok(lang + ': every literal key exists in islands ∪ L (' + keys.size + ' keys)' + (missing.length ? ' — missing: ' + missing.slice(0, 8).join(', ') : ''), missing.length === 0);
}

/* ---------- 2. the settings-sheet translator ---------- */
ok('T() falls back to the main islands + supports {vars}', html.indexOf("(typeof t === 'function' ? t(k) : '') || k") >= 0 && html.indexOf("s.replace(/\\{(\\w+)\\}/g") >= 0);
ok('autolock select uses T with vars', html.indexOf("T('autolockMin', { n: o.value })") >= 0);
ok('settings labels no longer depend on L alone', html.indexOf("var s = (L[l] && L[l][k]) || L.ru[k] ||") >= 0);

/* ---------- 3. adaptive layout ---------- */
ok('applyFontScale toggles dk-fs-big / dk-fs-small', html.indexOf("classList.toggle('dk-fs-big', best >= 1.2)") >= 0 && html.indexOf("classList.toggle('dk-fs-small', best <= 0.8)") >= 0);
ok('font hook exposed for tests', html.indexOf('window.dkPortalFont = applyFontScale') >= 0);
ok('big-font CSS: truncate no longer clips', html.indexOf('html.dk-fs-big .truncate { overflow: visible !important') >= 0);
ok('big-font CSS: buttons/rows wrap', html.indexOf('html.dk-fs-big .flex.items-center.justify-between { flex-wrap: wrap;') >= 0 && html.indexOf('html.dk-fs-big button, html.dk-fs-big [role="button"] { white-space: normal;') >= 0);
ok('big-font CSS: grids adapt', html.indexOf('html.dk-fs-big .grid-cols-3 { grid-template-columns: repeat(auto-fit') >= 0 && html.indexOf('html.dk-fs-big .grid-cols-2 { grid-template-columns: repeat(auto-fit') >= 0);
ok('big-font CSS: settings + nav + banner handled', html.indexOf('html.dk-fs-big .nav-tab {') >= 0 && html.indexOf('html.dk-fs-big #portal-settings-sheet .p-4') >= 0 && html.indexOf('html.dk-fs-big #dk-install-banner { flex-wrap: wrap; }') >= 0);

/* ---------- versions ---------- */
ok('sw cache at least v185', (function () { const mm = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!mm && Number(mm[1]) >= 185; })());
ok('RUNNING / dk-build at least c158', (function () {
  const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
  return !!r && !!b && Number(r[1]) >= 158 && Number(b[1]) >= 158;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
