/* c165 test — portion calculator in the plan editor: day totals, remaining-to-target, picker bar. */
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

/* ---------- UNIT: pure calculator math ---------- */
const unitSrc = [
  extractFn(trainer, 'npDayTotals'),
  extractFn(trainer, 'npRemaining'),
  ';globalThis.__K165 = { npDayTotals, npRemaining };'
].join('\n');
new Function(unitSrc)();
const K = globalThis.__K165;

const meals = [
  { foods: [{ grams: 200, nutrition: { calories: 100, protein: 10, carbs: 5, fat: 2 } }, { grams: 50, nutrition: { calories: 200, protein: 20, carbs: 40, fat: 10 } }] },
  { foods: [{ grams: 100, nutrition: { calories: 300, protein: 25, carbs: 30, fat: 15 } }] }
];
const tot = K.npDayTotals(meals);
eq('day totals calories', Math.round(tot.calories * 10) / 10, 600);
eq('day totals protein', Math.round(tot.protein * 10) / 10, 55);
eq('day totals carbs', Math.round(tot.carbs * 10) / 10, 60);
eq('day totals fat', Math.round(tot.fat * 10) / 10, 24);
eq('empty meals → zeros', K.npDayTotals([]), { calories: 0, protein: 0, carbs: 0, fat: 0 });
eq('null meals → zeros', K.npDayTotals(null), { calories: 0, protein: 0, carbs: 0, fat: 0 });

const targets = { calories: 2000, protein: 150, carbs: 200, fat: 65 };
const rem0 = K.npRemaining({ calories: 1450, protein: 120, carbs: 90, fat: 40 }, targets, null);
eq('remaining without extra', rem0, { calories: 550, protein: 30, carbs: 110, fat: 25 });
const rem1 = K.npRemaining({ calories: 1450, protein: 120, carbs: 90, fat: 40 }, targets, { calories: 100, protein: 10, carbs: 20, fat: 5 });
eq('remaining after adding a portion', rem1, { calories: 450, protein: 20, carbs: 90, fat: 20 });
const rem2 = K.npRemaining({ calories: 1950, protein: 140, carbs: 90, fat: 40 }, targets, { calories: 100, protein: 20, carbs: 0, fat: 0 });
eq('over-target goes negative (honest)', rem2, { calories: -50, protein: -10, carbs: 110, fat: 25 });
eq('missing targets counted as 0', K.npRemaining({ calories: 100 }, {}, null).calories, -100);

/* ---------- STATIC: day-progress strip ---------- */
ok('day-progress strip exists in the plan modal', trainer.indexOf('id="np-day-progress"') >= 0);
ok('renderDayProgress shows totals/targets + remaining group', (function () {
  const f = extractFn(trainer, 'renderDayProgress');
  return f.indexOf('npDayTotals(_editing.meals)') >= 0 && f.indexOf('npReadTargets()') >= 0 && f.indexOf('npRemainGroup(rem)') >= 0;
})());
ok('strip recomputed on every renderMeals + target input', (function () {
  /* the diary module has its own renderMeals — take the plan editor's one */
  const reStart = trainer.indexOf('function renderEditor(');
  const rm = trainer.slice(trainer.indexOf('function renderMeals()', reStart));
  const re = extractFn(trainer, 'renderEditor');
  return rm.indexOf('renderDayProgress();') >= 0 && re.indexOf('renderDayProgress') >= 0 && re.indexOf("dataset.wired165") >= 0;
})());
ok('remaining group colours over-values red with + sign', (function () {
  const f = extractFn(trainer, 'npRemainGroup');
  return f.indexOf("'text-danger'") >= 0 && f.indexOf("(over ? '+' : '−')") >= 0;
})());

/* ---------- STATIC: portion bar in the picker ---------- */
ok('portion bar markup exists', trainer.indexOf('id="fp-portion"') >= 0 && trainer.indexOf('id="fp-portion-grams"') >= 0 && trainer.indexOf('id="fp-portion-add"') >= 0 && trainer.indexOf('id="fp-portion-remain"') >= 0 && trainer.indexOf('id="fp-portion-chips"') >= 0);
ok('picker pick opens the calculator instead of instant add', (function () {
  const wire = trainer.slice(trainer.indexOf("querySelectorAll('[data-fp-pick]')"));
  const block = wire.slice(0, wire.indexOf('});') + 3);
  return block.indexOf('showFpPortion(food)') >= 0 && block.indexOf('_fpCallback(food, g)') < 0;
})());
ok('calculator starts from the REAL serving size', (function () {
  const f = extractFn(trainer, 'fpServingGrams');
  return f.indexOf('food.serving_quantity || food.package_grams') >= 0 && f.indexOf(': 100') >= 0;
})());
ok('quick chips include serving + 50/100/150/200', (function () {
  const f = extractFn(trainer, 'showFpPortion');
  return f.indexOf('data-fp-g=') >= 0 && f.indexOf('[50, 100, 150, 200]') >= 0 && f.indexOf("t('food.portionServing')") >= 0;
})());
ok('live macros + remaining-to-target in the bar', (function () {
  const f = extractFn(trainer, 'fpUpdatePortion');
  return f.indexOf('fp-portion-macros') >= 0 && f.indexOf('npRemaining(tot, tg, add)') >= 0 && f.indexOf("t('nutrition.afterAdd')") >= 0;
})());
ok('confirm passes the chosen grams to the callback and closes the picker', (function () {
  const f = extractFn(trainer, 'fpConfirmPortion');
  return f.indexOf('cb(f, Math.round(g))') >= 0 && f.indexOf("classList.add('hidden')") >= 0 && f.indexOf('_fpCallback = null') >= 0;
})());
ok('openFoodPicker resets + wires the bar', (function () {
  const f = extractFn(trainer, 'openFoodPicker');
  return f.indexOf('hideFpPortion()') >= 0 && f.indexOf('wireFpPortion()') >= 0 && f.indexOf('_fpPendingFood = null') >= 0;
})());

/* ---------- i18n ×3 ---------- */
for (const lang of ['ru', 'en', 'he']) {
  let d = null;
  try { d = JSON.parse(fs.readFileSync(path.join(root, 'src', 'i18n', lang + '.json'), 'utf8')); } catch (e) {}
  const N = d && d.nutrition;
  const need = ['afterAdd', 'remaining', 'over'];
  const missing = N ? need.filter((k) => !N[k]) : need;
  ok(lang + '.json has calculator keys' + (missing.length ? ' — missing ' + missing.join(', ') : ''), missing.length === 0);
}

/* ---------- versions ---------- */
ok('sw cache at least v192', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 192; })());
ok('sw keeps c164 history and adds v192 c165', sw.indexOf('// v191: c164') >= 0 && sw.indexOf('// v192: c165') >= 0);
ok('RUNNING / dk-build at least c165', (function () {
  const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
  return !!r && !!b && Number(r[1]) >= 165 && Number(b[1]) >= 165;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
