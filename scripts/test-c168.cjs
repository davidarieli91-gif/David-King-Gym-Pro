/* c168 test — manual barcode → OFF badges + two new smart shelves. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const trainer = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }
function eq(name, got, want) { const g = JSON.stringify(got), w = JSON.stringify(want); if (g === w) { pass++; console.log('PASS ' + name + ' = ' + g); } else { fail++; console.log('FAIL ' + name + ' got ' + g + ' want ' + w); } }

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
function extractArr(src, name) {
  const start = src.indexOf('const ' + name + ' = [');
  if (start < 0) throw new Error('array not found: ' + name);
  const i = src.indexOf('[', start);
  let depth = 0, inStr = null, esc = false;
  for (let k = i; k < src.length; k++) {
    const c = src[k];
    if (inStr) { if (esc) { esc = false; continue; } if (c === '\\') { esc = true; continue; } if (c === inStr) inStr = null; continue; }
    if (c === "'" || c === '"') { inStr = c; continue; }
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (!depth) return src.slice(i, k + 1); }
  }
  throw new Error('unbalanced: ' + name);
}

/* ---------- UNIT: OFF grade + sub mapping ---------- */
const unitSrc = [
  'const FD_OFF_SUB_RULES = ' + extractArr(trainer, 'FD_OFF_SUB_RULES') + ';',
  extractFn(trainer, 'fdOffGrade'),
  extractFn(trainer, 'fdOffSubOf'),
  ';globalThis.__K168 = { fdOffGrade, fdOffSubOf };'
].join('\n');
new Function(unitSrc)();
const K = globalThis.__K168;
eq('grade a → a', K.fdOffGrade('a'), 'a');
eq('grade B → b (case)', K.fdOffGrade('B'), 'b');
eq('grade junk → empty', K.fdOffGrade('x9'), '');
eq('grade null → empty', K.fdOffGrade(null), '');
eq('sub: cheeses', K.fdOffSubOf(['en:cheeses']), 'cheeses');
eq('sub: yogurts beats milk? no — yogurts', K.fdOffSubOf(['en:dairies', 'en:yogurts']), 'yogurts');
eq('sub: breads', K.fdOffSubOf(['en:breads']), 'breads');
eq('sub: olive oil', K.fdOffSubOf(['en:olive-oils']), 'olive-oil');
eq('sub: unknown → empty', K.fdOffSubOf(['en:whatever']), '');
eq('sub: empty tags → empty', K.fdOffSubOf([]), '');

/* ---------- UNIT: new smart shelves ---------- */
const shelfSrc = [
  'function fdbList() { return []; }',
  extractFn(trainer, 'smartShelfItems'),
  ';globalThis.__K168s = { smartShelfItems };'
].join('\n');
new Function(shelfSrc)();
const S = globalThis.__K168s;
const pool = [
  { id: 'a', nutrition: { calories: 50 }, eco: 'a' },
  { id: 'b', nutrition: { calories: 100 }, eco: 'b' },
  { id: 'c', nutrition: { calories: 101 }, eco: 'c' },
  { id: 'd', nutrition: { calories: 0 }, eco: 'd' },
  { id: 'e', nutrition: { calories: 80 }, eco: null }
];
eq('lowCal shelf ≤100 kcal, zero excluded', S.smartShelfItems('lowCal', pool).map(f => f.id), ['a', 'b', 'e']);
eq('ecoAB shelf = eco a/b only', S.smartShelfItems('ecoAB', pool).map(f => f.id), ['a', 'b']);
eq('unknown shelf still safe', S.smartShelfItems('nope', pool).length, 0);

/* ---------- STATIC: 6 smart shelves wired ---------- */
ok('SMART_SHELVES has 6 incl. lowCal + ecoAB', (function () {
  const arr = extractArr(trainer, 'SMART_SHELVES');
  return (arr.match(/id: '/g) || []).length === 6 && arr.indexOf("'lowCal'") >= 0 && arr.indexOf("'ecoAB'") >= 0;
})());

/* ---------- STATIC: OFF fetch in the product card ---------- */
ok('edit form has the OFF button + status + hidden badge fields', trainer.indexOf('id="fd-off-fetch"') >= 0 && trainer.indexOf('id="fd-off-status"') >= 0 && trainer.indexOf('<input type="hidden" name="nutri" /><input type="hidden" name="eco" /><input type="hidden" name="nova" /><input type="hidden" name="forest" /><input type="hidden" name="sub" />') >= 0);
ok('fetch uses the OFF v2 endpoint with the enrichment fields', (function () {
  const f = extractFn(trainer, 'fdFetchOffScores');
  return f.indexOf('api/v2/product/') >= 0 && f.indexOf('nutriscore_grade,nova_group,ecoscore_grade,categories_tags,ingredients_analysis_tags') >= 0;
})());
ok('fetch fills all five fields + honest status', (function () {
  const f = extractFn(trainer, 'fdFetchOffScores');
  return f.indexOf("set('nutri', nutri)") >= 0 && f.indexOf("set('eco', eco)") >= 0 && f.indexOf("set('nova', nova)") >= 0 && f.indexOf("set('forest', forest)") >= 0 && f.indexOf("set('sub', sub)") >= 0 && f.indexOf("t('food.offNotFound')") >= 0 && f.indexOf("t('food.offNoScores')") >= 0 && f.indexOf("t('food.offOffline')") >= 0;
})());
ok('palm oil → none/risk like the enrich script', (function () {
  const f = extractFn(trainer, 'fdFetchOffScores');
  return f.indexOf('/palm-oil-free/') >= 0 && f.indexOf('/palm-oil(?!-free)/') >= 0;
})());
ok('save merges badges with the old record', (function () {
  const f = extractFn(trainer, 'saveFoodDetail');
  return f.indexOf("nutri: obj.nutri || (food && food.nutri) || null") >= 0 && f.indexOf("nova: Number(obj.nova) || (food && Number(food.nova)) || null") >= 0 && f.indexOf("sub: obj.sub || (food && food.sub) || ''") >= 0;
})());
ok('form prefill keeps badges through an edit', trainer.indexOf('if (form.elements.nutri) form.elements.nutri.value = food.nutri') >= 0);
ok('button wired with a dataset guard', trainer.indexOf("fdOffBtn.dataset.wired168") >= 0);

/* ---------- i18n ×3 ---------- */
for (const lang of ['ru', 'en', 'he']) {
  let d = null;
  try { d = JSON.parse(fs.readFileSync(path.join(root, 'src', 'i18n', lang + '.json'), 'utf8')); } catch (e) {}
  const F = d && d.food;
  const need = ['offFetch', 'offNeedBarcode', 'offLoading', 'offNotFound', 'offFound', 'offNoScores', 'offOffline', 'smartLowCal', 'smartEco'];
  const missing = F ? need.filter((k) => !F[k]) : need;
  ok(lang + '.json has OFF + shelf keys' + (missing.length ? ' — missing ' + missing.join(', ') : ''), missing.length === 0);
}

/* ---------- versions ---------- */
ok('sw cache at least v195', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 195; })());
ok('sw keeps c167 history and adds v195 c168', sw.indexOf('// v194: c167') >= 0 && sw.indexOf('// v195: c168') >= 0);
ok('RUNNING / dk-build at least c168', (function () {
  const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
  return !!r && !!b && Number(r[1]) >= 168 && Number(b[1]) >= 168;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
