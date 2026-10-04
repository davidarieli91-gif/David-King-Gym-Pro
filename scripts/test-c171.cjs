/* c171 test — picker picking works everywhere, full photos, root-fixed stale search. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const trainer = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }
function extractFn(src, name) {
  let start = src.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('function not found: ' + name);
  if (start >= 6 && src.slice(start - 6, start) === 'async ') start -= 6;
  let depth = 0, i = src.indexOf('{', start);
  let inStr = null, inLine = false, inBlock = false, esc = false;
  for (; i < src.length; i++) {
    const c = src[i], n = src[i + 1];
    if (inLine) { if (c === '\n') inLine = false; continue; }
    if (inBlock) { if (c === '*' && n === '/') { inBlock = false; i++; } continue; }
    if (inStr) { if (esc) { esc = false; continue; } if (c === '\\') { esc = true; continue; } if (c === inStr) inStr = null; continue; }
    if (c === '/' && n === '/') { inLine = true; i++; continue; }
    if (c === '/' && n === '*') { inBlock = true; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (!depth) return src.slice(start, i + 1); }
  }
  throw new Error('unbalanced: ' + name);
}

/* ---------- 1. PICKING WORKS AFTER EVERY RENDER ---------- */
ok('pick callback stored at mount', trainer.indexOf('let _pickOnPick = null;') >= 0 && trainer.indexOf('function pickerMount(rootEl, foods, onPick)') >= 0 && trainer.indexOf('_pickOnPick = (typeof onPick === \'function\') ? onPick : null;') >= 0);
ok('wirePicker re-attaches product clicks on every render', (function () {
  const f = extractFn(trainer, 'wirePicker');
  return f.indexOf("querySelectorAll('[data-fp-pick]')") >= 0 && f.indexOf('if (food) _pickOnPick(food);') >= 0;
})());
ok('pickerMount is called with the portion-calculator callback', trainer.indexOf('foodDatabase.pickerMount(container, _foods, function (food) {') >= 0 && trainer.indexOf('if (food && _fpCallback) showFpPortion(food);') >= 0);

/* ---------- 2. FULL PHOTOS (no crop) ---------- */
ok('picker tiles show the whole photo (object-contain)', (function () {
  const f = extractFn(trainer, 'pickerTileHTML');
  return f.indexOf('object-contain') >= 0 && f.indexOf('object-cover') < 0;
})());
ok('kiosk grid tiles show the whole photo too (identical look)', (function () {
  const f = extractFn(trainer, 'foodTileHTML');
  return f.indexOf('object-contain') >= 0 && f.indexOf('object-cover') < 0;
})());

/* ---------- 3. STALE SEARCH — ROOT FIX ---------- */
ok('boxes are emptied on the way out (nothing to restore)', trainer.indexOf('window.addEventListener(\'beforeunload\', dkClearClientSearch);') >= 0 && trainer.indexOf('window.addEventListener(\'pagehide\', dkClearClientSearch);') >= 0);
ok('guard accepts input only right after a real gesture', (function () {
  const f = extractFn(trainer, 'dkSearchGuard');
  return f.indexOf('const recentGesture = (Date.now() - _dkLastGesture) < 10000;') >= 0 && f.indexOf('_dkSearchArmed && recentGesture') >= 0;
})());
ok('unfocused (restored) input is wiped and never arms the filter', (function () {
  const f = extractFn(trainer, 'dkSearchGuard');
  return f.indexOf('el.value = \'\'') >= 0 && f.indexOf('dkClearClientSearch()') >= 0;
})());

/* ---------- versions ---------- */
ok('sw cache at least v198', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 198; })());
ok('sw keeps c170 history and adds v198 c171', sw.indexOf('// v197: c170') >= 0 && sw.indexOf('// v198: c171') >= 0);
ok('RUNNING / dk-build at least c171', (function () {
  const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
  return !!r && !!b && Number(r[1]) >= 171 && Number(b[1]) >= 171;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
