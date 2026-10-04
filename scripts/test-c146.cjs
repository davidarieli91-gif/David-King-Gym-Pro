/* c146 unit + static test — nutrition bug sweep.
   Unit part extracts the REAL functions out of fitness-crm.html (brace-balanced
   scanner) and checks hand-computed math; static part pins the portal/wiring. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const trainer = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const html = fs.readFileSync(path.join(root, 'client.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }
function eq(name, got, want) { const g = JSON.stringify(got), w = JSON.stringify(want); if (g === w) { pass++; console.log('PASS ' + name + ' = ' + g); } else { fail++; console.log('FAIL ' + name + ' got ' + g + ' want ' + w); } }
const count = (s, n) => s.split(n).length - 1;

function extractFn(src, name) {
  const start = src.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('function not found: ' + name);
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

/* ---------- UNIT: extracted trainer functions ---------- */
const src = [extractFn(trainer, 'dkLogDateKey'), extractFn(trainer, 'macroProfile'), extractFn(trainer, 'calcMacros'), extractFn(trainer, 'computeAdherence')]
  .join('\n') + '\n;globalThis.__T146 = { dkLogDateKey, macroProfile, calcMacros, computeAdherence };';
new Function(src)();
const T = globalThis.__T146;

/* 1. local date key */
eq('date: late evening stays the same LOCAL day', T.dkLogDateKey(new Date(2026, 9, 1, 23, 40)), '2026-10-01');
eq('date: bare ts of 2026-10-01 local', T.dkLogDateKey(new Date(2026, 9, 1).getTime()), '2026-10-01');
eq('date: invalid → empty', T.dkLogDateKey('nope'), '');

/* 2. macro math (hand-computed) */
{
  const m = T.calcMacros(2000, 80, 'balanced', null);
  // protein 160 → remaining 1360; shares fat 0.28/0.70=.4, carbs .6
  eq('balanced: protein 2.0 g/kg', m.protein, 160);
  eq('balanced: fat from REMAINING (60)', m.fat, 60);
  eq('balanced: carbs from REMAINING (204)', m.carbs, 204);
  const kcal = m.protein * 4 + m.fat * 9 + m.carbs * 4;
  ok('balanced: macro kcal ≈ target (2000)', Math.abs(kcal - 2000) <= 25);
}
{
  const m = T.calcMacros(2000, 150, 'balanced', null);
  // protein 300 would be 1200 kcal → capped at 45% = 225 g (900 kcal); remaining 1100
  eq('heavy: protein capped at 45% of calories', m.protein, 225);
  const kcal = m.protein * 4 + m.fat * 9 + m.carbs * 4;
  ok('heavy: no more overshoot (was 1200+2600)', Math.abs(kcal - 2000) <= 25);
}
{
  const m = T.calcMacros(500, 60, 'balanced', null);
  ok('low calories clamped to the 800 floor', m.protein * 4 + m.fat * 9 + m.carbs * 4 <= 830);
}
{
  const m = T.calcMacros(2000, 80, 'keto', null);
  const kcal = m.protein * 4 + m.fat * 9 + m.carbs * 4;
  ok('keto: renorm fat/carb shares keep the target', Math.abs(kcal - 2000) <= 25 && m.fat > m.carbs);
}

/* 3. adherence from real items (hand-computed) */
{
  const log = {
    target_calories: 2000, target_protein: 100,
    meals: [{ items: [
      { grams: 100, nutrition: { calories: 500, protein: 20 } },  /* plan-shaped item */
      { grams: 200, calories: 300, protein: 30 }                  /* log-shaped item (portion totals) */
    ] }]
  };
  // calories: 500 + 300 = 800 → 1-|800-2000|/2000 = .4 ; protein: 20+30=50 → .5 → avg .45
  eq('adherence derived from items (45%)', T.computeAdherence([log]), 45);
  eq('adherence null without targets/items', T.computeAdherence([{ meals: [] }]), null);
}

/* ---------- STATIC: trainer fixes ---------- */
ok('timezone: loadLog uses local compare + local midnight', trainer.indexOf('dkLogDateKey(r.date) === dateStr') >= 0 && trainer.indexOf('new Date(parts[0] || 1970, (parts[1] || 1) - 1, parts[2] || 1).getTime()') >= 0);
ok('date input defaults to LOCAL today', trainer.indexOf('dateInput.value = dkLogDateKey(new Date());') >= 0);
ok('daily-log search reads BOTH stores + normalizes', trainer.indexOf("ref = await db.all('food_database')") >= 0 && trainer.indexOf('const normRef = f =>') >= 0);
ok('adherence no longer reads actual_*', trainer.indexOf("n['actual_' + f]") === -1 && trainer.indexOf('actual.calories += (it.calories != null') >= 0);
ok('calorie bands in calcMacros + calcTargetCalories', trainer.indexOf('Math.max(800, Math.min(6000, Math.round(calories || 0)))') >= 0 && trainer.indexOf('Math.max(800, Math.min(6000, Math.round(tdee * factor)))') >= 0);
ok('picker uses real serving size', trainer.indexOf('Number(food && (food.serving_quantity || food.package_grams) || 0)') >= 0);
ok('unit_amount follows grams in both adjusters', count(trainer, 'f.unit_amount = Math.round(f.unit_amount * (newGrams / oldG) * 100) / 100;') >= 2);
ok('plan targets validated + clamped', trainer.indexOf("const clampT = (id, min, max, dflt) =>") >= 0 && trainer.indexOf("_editing.target_calories = clampT('np-target-cal', 800, 6000, 2000);") >= 0);
ok('food editor has the Russian-name field', trainer.indexOf('name="name_ru"') >= 0 && trainer.indexOf('form.elements.name_ru.value = food.name_ru') >= 0);
ok('food save preserves unedited fields', trainer.indexOf('const newFood = Object.assign({}, food || {}, {') >= 0);
ok('builders search by brand/barcode/category', trainer.indexOf("(f.brand || '').toLowerCase().includes(q)") >= 0 && trainer.indexOf("(f.barcode || '').toLowerCase().includes(q)") >= 0);
ok('DB browser searches barcodes too', trainer.indexOf("(f.barcode || '') + ').toLowerCase()") >= 0 || trainer.indexOf("+ ' ' + (f.barcode || '')).toLowerCase()") >= 0);
ok('literal template strings removed from the STATIC modal HTML', trainer.indexOf("title=\"${t('nutrition.shareHint')") === -1 && trainer.indexOf("data-i18n=\"programs.share\">${t('") === -1 && trainer.indexOf("title=\"${t('nutrition.scanBarcode')") === -1);
ok('add-food button no longer hidden', trainer.indexOf('id="nutrition-add-food-btn" class="bg-primary') >= 0);
ok('double wiring guarded (4 elements)', count(trainer, 'dataset.wired146') >= 4);

/* ---------- STATIC: portal meal rendering ---------- */
ok('portal meal/item helpers exist', ['mealLabelOf', 'foodNameOf', 'foodGramsOf', 'foodCalOf'].every(f => html.indexOf('function ' + f) >= 0));
ok('portal reads localized names + per-100 nutrition', html.indexOf("f['name_' + currentLang] || f.name_ru || f.name_en") >= 0 && html.indexOf('(Number(n.calories) || 0) * foodGramsOf(f) / 100') >= 0);
ok('meal labels: customLabel → lang label → portal type map → real labelKey', html.indexOf('if (m.customLabel) return m.customLabel;') >= 0 && html.indexOf("const byType = MEAL_LABEL_KEYS[m.type] ? t(MEAL_LABEL_KEYS[m.type]) : '';") >= 0 && html.indexOf('if (lk && lk !== m.labelKey) return lk;') >= 0);
ok('portal meal i18n ×3', count(html, "mealBreakfast:'") === 3 && count(html, "mealBeforeSleep:'") === 3 && count(html, "mealSnack:'") === 3);

/* ---------- versions ---------- */
ok('sw cache at least v173', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 173; })());
ok('RUNNING / dk-build at least c146', (function () {
  const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
  return !!r && !!b && Number(r[1]) >= 146 && Number(b[1]) >= 146;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
