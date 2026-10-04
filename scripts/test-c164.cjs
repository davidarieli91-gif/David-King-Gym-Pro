/* c164 test — editable recipes: edit flow, live ingredient resolution, NOVA badge. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const trainer = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
let pass = 0, fail = 0;
const pend = [];
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

/* ---------- UNIT: recipeTotals / recipeNova / resolveIngredient ---------- */
const unitSrc = [
  'globalThis.currentLang = () => "en";',
  'const baseStore = { a: { id: "a", calories: 50, protein: 5, carbs: 1, fat: 2, fiber: 3, nova: 2 },',
  '                    b: { id: "b", name_en: "B", calories: 80, protein: 8, carbs: 2, fat: 4, fiber: 1, nova: null } };',
  'const refStore = { c: { id: "c", name_en: "C", nutrition: { calories: 300, protein: 30, carbs: 5, fat: 20, fiber: 1 }, nova: 4 } };',
  'globalThis.db = { get: async (store, id) => { if (store === "food_base") return baseStore[id] || null; if (store === "food_database") return refStore[id] || null; return null; } };',
  extractFn(trainer, 'recipeTotals'),
  extractFn(trainer, 'recipeNova'),
  extractFn(trainer, 'resolveIngredient'),
  ';globalThis.__K164 = { recipeTotals, recipeNova, resolveIngredient };'
].join('\n');
new Function(unitSrc)();
const K = globalThis.__K164;

const t = K.recipeTotals({ ingredients: [{ grams: 100, calories: 100, protein: 10, carbs: 0, fat: 0, fiber: 0 }, { grams: 50, calories: 200, protein: 20, carbs: 40, fat: 10, fiber: 4 }] });
eq('totals.grams', Math.round(t.totals.grams * 10) / 10, 150);
eq('totals.calories', Math.round(t.totals.calories * 10) / 10, 200);
eq('totals.protein', Math.round(t.totals.protein * 10) / 10, 20);
eq('totals.carbs', Math.round(t.totals.carbs * 10) / 10, 20);
eq('totals.fat', Math.round(t.totals.fat * 10) / 10, 5);
eq('per100.calories', Math.round(t.per100.calories * 10) / 10, 133.3);
eq('empty recipe → zero grams, per100 zero', K.recipeTotals({ ingredients: [] }).per100.calories, 0);
eq('recipeNova takes max of known', K.recipeNova([{ nova: 2 }, { nova: 4 }, { nova: 3 }]), 4);
eq('recipeNova null when nothing known', K.recipeNova([{ nova: null }, {}]), null);
eq('recipeNova ignores out-of-range', K.recipeNova([{ nova: 0 }, { nova: 9 }, { nova: 1 }]), 1);

(async () => {
  const r1 = await K.resolveIngredient({ id: 'a', name: 'A', grams: 120 });
  eq('ingredient from food_base keeps flat macros', [r1.calories, r1.protein, r1.carbs, r1.fat, r1.fiber, r1.nova], [50, 5, 1, 2, 3, 2]);
  eq('ingredient grams preserved', r1.grams, 120);
  const r2 = await K.resolveIngredient({ id: 'c', grams: 30 });
  eq('ingredient from reference DB uses nested nutrition', [r2.calories, r2.protein, r2.nova, r2.name], [300, 30, 4, 'C']);
  const r3 = await K.resolveIngredient({ id: 'zzz', name: 'Lost', grams: 10 });
  eq('missing ingredient flagged _gone with legacy zeros', [r3._gone, r3.calories, r3.name], [true, 0, 'Lost']);

  /* ---------- STATIC: edit flow ---------- */
  const open = extractFn(trainer, 'openRecipe');
  ok('openRecipe takes an item and remembers the editing id', open.indexOf('async function openRecipe(item)') >= 0 && open.indexOf('_recipeEditingId = item.id') >= 0);
  ok('openRecipe resolves ingredients live (legacy thin saves recompute)', open.indexOf('resolveIngredient(it)') >= 0 && open.indexOf('food.recipeIngredientGone') >= 0);
  ok('openRecipe prefills name + switches title/save label', open.indexOf("document.getElementById('recipe-name')") >= 0 && open.indexOf("document.getElementById('recipe-title')") >= 0 && open.indexOf("t('food.recipeEditTitle')") >= 0 && open.indexOf("t('food.recipeSaveEdit')") >= 0);
  const save = extractFn(trainer, 'saveRecipe');
  ok('save keeps the same id when editing', save.indexOf("id: _recipeEditingId || ('recipe_' + db.uuid())") >= 0);
  ok('save preserves created_at, stamps updated_at only on edit', save.indexOf('created_at: (prev && prev.created_at) || Date.now()') >= 0 && save.indexOf('if (editing) item.updated_at = Date.now()') >= 0);
  ok('ingredients stored with full macros + nova', save.indexOf('calories: Number(it.calories) || 0, protein: Number(it.protein) || 0') >= 0 && save.indexOf('nova: Number(it.nova) || null') >= 0);
  ok('recipe carries honest NOVA badge (max ingredient)', save.indexOf('nova: recipeNova(_recipe.ingredients)') >= 0);
  ok('edit save refreshes open list, no portion modal', save.indexOf('if (editing)') >= 0 && save.indexOf('performSearch(inp.value)') >= 0 && save.indexOf("toast(t('food.recipeUpdated')") >= 0);
  ok('editor total line shows the NOVA chip', (function () { const rt = extractFn(trainer, 'renderRecipeTotal'); return rt.indexOf('recipeNova') >= 0 && rt.indexOf('N${nova}') >= 0; })());
  ok('add-ingredient carries nova from the picked product', (function () { const ai = extractFn(trainer, 'recipeAddIngredient'); return ai.indexOf('nova: Number(f.nova) || null') >= 0; })());

  /* ---------- STATIC: pencil entry point ---------- */
  const card = extractFn(trainer, 'foodResultCardHTML');
  ok('recipe cards get a pencil overlay', card.indexOf("f.source === 'recipe' ?") >= 0 && card.indexOf('data-rec-edit=') >= 0);
  const wire = extractFn(trainer, 'wireFoodResultCards');
  ok('pencil click loads the recipe and opens the editor', wire.indexOf("querySelectorAll('[data-rec-edit]')") >= 0 && wire.indexOf("db.get('food_base', id)") >= 0 && wire.indexOf('openRecipe(item)') >= 0);
  ok('recipe modal title has an id for dynamic text', trainer.indexOf('<h3 id="recipe-title"') >= 0);

  /* ---------- i18n ×3 ---------- */
  for (const lang of ['ru', 'en', 'he']) {
    let d = null;
    try { d = JSON.parse(fs.readFileSync(path.join(root, 'src', 'i18n', lang + '.json'), 'utf8')); } catch (e) {}
    const F = d && d.food;
    const need = ['recipeEditTitle', 'recipeSaveEdit', 'recipeUpdated', 'recipeIngredientGone'];
    const missing = F ? need.filter((k) => !F[k]) : need;
    ok(lang + '.json has recipe-edit keys' + (missing.length ? ' — missing ' + missing.join(', ') : ''), missing.length === 0);
  }

  /* ---------- versions ---------- */
  ok('sw cache at least v191', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 191; })());
  ok('sw keeps c163 history and adds v191 c164', sw.indexOf('// v190: c163') >= 0 && sw.indexOf('// v191: c164') >= 0);
  ok('RUNNING / dk-build at least c164', (function () {
    const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
    return !!r && !!b && Number(r[1]) >= 164 && Number(b[1]) >= 164;
  })());

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})();
