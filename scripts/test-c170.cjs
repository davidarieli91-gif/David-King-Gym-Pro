/* c170 test — picker=kiosk bridge + hardened stale-search guard. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const trainer = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }
function count(s, sub) { let n = 0, i = 0; for (;;) { i = s.indexOf(sub, i); if (i < 0) return n; n++; i += sub.length; } }
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

/* ---------- STATIC: picker mounts the kiosk ---------- */
ok('picker engine exists in the kiosk module', trainer.indexOf('function pickerMount(rootEl, foods)') >= 0 && trainer.indexOf('function pickerTileHTML(f)') >= 0 && trainer.indexOf('function pickerRender()') >= 0 && trainer.indexOf('function wirePicker()') >= 0);
ok('engine is exposed', trainer.indexOf('pickerMount, pickerTileHTML,') >= 0);
ok('picker reuses the kiosk builders + data', (function () {
  const f = extractFn(trainer, 'pickerRender');
  return f.indexOf('smartShelfItems(') >= 0 && f.indexOf('smartTileHTML(') >= 0 && f.indexOf('shelfTileHTML(') >= 0 && f.indexOf('shelfCollageHTML(') >= 0 && f.indexOf('SUB_EMOJI[') >= 0 && f.indexOf('FOOD_SHELVES') >= 0;
})());
ok('picker tiles carry data-fp-pick + badges', (function () {
  const f = extractFn(trainer, 'pickerTileHTML');
  return f.indexOf('data-fp-pick=') >= 0 && f.indexOf('foodBadgeHTML(f)') >= 0;
})());
ok('picker grid pages like the kiosk', (function () {
  const f = extractFn(trainer, 'pickerGridHTML');
  return f.indexOf('PAGE_SIZE') >= 0 && f.indexOf('data-pfp-page="prev"') >= 0 && f.indexOf('data-pfp-page="next"') >= 0;
})());
ok('wirePicker wires kiosk tiles as picker actions', (function () {
  const f = extractFn(trainer, 'wirePicker');
  return f.indexOf("'[data-pfp-smart], [data-fdb-smart]'") >= 0 && f.indexOf("'[data-pfp-shelf], [data-fdb-shelf]'") >= 0 && f.indexOf('[data-pfp-sub]') >= 0;
})());

/* ---------- STATIC: renderFoodResults uses it ---------- */
ok('empty query mounts the kiosk into #fp-results', (function () {
  const f = extractFn(trainer, 'renderFoodResults');
  return f.indexOf('foodDatabase.pickerMount(container, _foods)') >= 0 && f.indexOf('wireFoodPickTiles(container)') >= 0;
})());
ok('search renders the same tiles (no more macro tree)', (function () {
  const f = extractFn(trainer, 'renderFoodResults');
  return f.indexOf('pickerTileHTML') >= 0 && f.indexOf('data-fp-toggle-macro') < 0 && f.indexOf('renderFoodRow') < 0 && f.indexOf('data-fp-toggle-cat') < 0;
})());
ok('picking opens the portion calculator (c165 kept)', (function () {
  const f = extractFn(trainer, 'wireFoodPickTiles');
  return f.indexOf('showFpPortion(food)') >= 0;
})());
ok('picker source chips removed too', trainer.indexOf('fp-src-btn') < 0 && trainer.indexOf('data-food-source="FoodsDictionary_IL"') < 0);

/* ---------- STATIC: hardened stale-search guard ---------- */
ok('search is disarmed until the first real gesture', trainer.indexOf('let _dkSearchArmed = false;') >= 0 && trainer.indexOf("['pointerdown', 'keydown', 'touchstart']") >= 0 && trainer.indexOf('setTimeout(dkArmSearch, 4000)') >= 0);
ok('pre-gesture input is wiped and never arms the filter', (function () {
  const i = trainer.indexOf('function dkSearchGuard(e)');
  const body = trainer.slice(i, i + 400);
  return body.indexOf('_dkSearchArmed') >= 0 && body.indexOf('e.target.value = \'\'') >= 0 && body.indexOf('dkClearClientSearch()') >= 0;
})());
ok('both input handlers go through the guard', count(trainer, 'if (dkSearchGuard(e)) return;') === 2);
ok('delayed sweeps clean late restores', trainer.indexOf('[300, 1200, 3000].forEach(ms => setTimeout(dkClearClientSearch, ms))') >= 0);
ok('render() keeps box == filter', (function () {
  const f = extractFn(trainer, 'render');
  return f.indexOf('if (ds && ds.value !== _search) ds.value = _search;') >= 0 && f.indexOf('if (as && as.value !== _search) as.value = _search;') >= 0;
})());

/* ---------- versions ---------- */
ok('sw cache at least v197', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 197; })());
ok('sw keeps c169 history and adds v197 c170', sw.indexOf('// v196: c169') >= 0 && sw.indexOf('// v197: c170') >= 0);
ok('RUNNING / dk-build at least c170', (function () {
  const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
  return !!r && !!b && Number(r[1]) >= 170 && Number(b[1]) >= 170;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
