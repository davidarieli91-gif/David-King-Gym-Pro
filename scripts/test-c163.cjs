/* c163 test — nutrition redesign completion: kiosk template cards + photo log tiles. */
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

/* ---------- STATIC: templates tab → kiosk cards ---------- */
const tplList = extractFn(trainer, 'renderList');
ok('templates render as a food-grid of cards', tplList.indexOf("'<div class=\"food-grid\">' + sorted.map") >= 0);
ok('template card has a 2×2 photo collage of its foods', tplList.indexOf('for (let i = 0; i < 4; i++)') >= 0 && tplList.indexOf('grid-cols-2 grid-rows-2') >= 0 && tplList.indexOf('window.dkFoodImgTag') >= 0);
ok('template card shows total kcal over the photo', tplList.indexOf('font-display font-extrabold text-lg') >= 0 && tplList.indexOf('totalCal') >= 0);
ok('template card shows P/C/F target chips in ring colours', tplList.indexOf("'#10b981'") >= 0 && tplList.indexOf("'#f59e0b'") >= 0 && tplList.indexOf("'#ef4444'") >= 0 && tplList.indexOf('macroChip') >= 0);
ok('template actions preserved (edit/apply/delete)', tplList.indexOf('data-nt-edit') >= 0 && tplList.indexOf('data-nt-apply') >= 0 && tplList.indexOf('data-nt-delete') >= 0);
ok('old icon+row template card removed', tplList.indexOf('w-10 h-10 rounded-lg bg-primary/15') < 0 && tplList.indexOf('shadow-card p-4 hover:border-primary/30') < 0);

/* ---------- STATIC: daily log meals → photo mini-tiles ---------- */
const rm = extractFn(trainer, 'renderMeals');
ok('meal items render as photo mini-tiles grid', rm.indexOf('food-grid p-2.5') >= 0);
ok('log tile: photo by stored food_id, plate placeholder for legacy entries', rm.indexOf('it.food_id') >= 0 && rm.indexOf('window.dkFoodImgTag') >= 0 && rm.indexOf('🥗') >= 0);
ok('log tile: grams · kcal line + P/C/F badge chips', rm.indexOf('fmtNumber(it.grams)') >= 0 && rm.indexOf('${fmtNumber(it.protein)}P') >= 0 && rm.indexOf('${fmtNumber(it.carbs)}C') >= 0 && rm.indexOf('${fmtNumber(it.fat)}F') >= 0);
ok('log tile: ✕ overlay delete keeps data-delete-food', rm.indexOf('data-delete-food=') >= 0 && rm.indexOf('food-tile-x') >= 0);
ok('old text-row item list removed from meals', rm.indexOf('divide-y divide-border') < 0 && rm.indexOf('p-3 flex items-center gap-3') < 0);

/* ---------- STATIC: entries now carry the product photo ---------- */
const addFn = extractFn(trainer, 'addPendingToMeal');
ok('log entries store food_id + image_url', addFn.indexOf("food_id: _pendingFood.id || ''") >= 0 && addFn.indexOf("image_url: _pendingFood.image_url || ''") >= 0);
ok('existing entry fields intact', addFn.indexOf('calories: (_pendingFood.calories || 0) * ratio') >= 0 && addFn.indexOf('created_at: Date.now()') >= 0);

/* ---------- STATIC: no leftovers of the old style ---------- */
ok('templates list container no longer forces space-y-2 stack', trainer.indexOf('<div id="nutrition-templates-list" class="space-y-2"></div>') < 0);

/* ---------- versions ---------- */
ok('sw cache at least v190', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 190; })());
ok('sw has v190 comment for c163', sw.indexOf('// v190: c163') >= 0);
ok('RUNNING / dk-build at least c163', (function () {
  const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
  return !!r && !!b && Number(r[1]) >= 163 && Number(b[1]) >= 163;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
