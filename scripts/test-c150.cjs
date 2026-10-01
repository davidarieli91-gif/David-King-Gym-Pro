/* c150 unit + static test — smart food search (favorites/recent, real portions, recipes).
   Unit part extracts recipeTotals from fitness-crm.html (brace-balanced scanner);
   static part pins the trainer + portal wiring. */
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

/* ---------- UNIT: recipeTotals ---------- */
const src = extractFn(trainer, 'recipeTotals') + '\n;globalThis.__T150 = { recipeTotals };';
new Function(src)();
const T = globalThis.__T150;

const r = { ingredients: [
  { grams: 100, calories: 350, protein: 12, carbs: 60, fat: 6, fiber: 10 },
  { grams: 200, calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 }
] };
const { totals, per100 } = T.recipeTotals(r);
eq('totals: weight 300 g', Math.round(totals.grams), 300);
eq('totals: 680 kcal', Math.round(totals.calories), 680);
eq('totals: 74 P', Math.round(totals.protein), 74);
eq('totals: 60 C', Math.round(totals.carbs), 60);
eq('totals: 13.2 F', Math.round(totals.fat * 10) / 10, 13.2);
eq('per100: 227 kcal', Math.round(per100.calories), 227);
eq('per100: 24.7 P', Math.round(per100.protein * 10) / 10, 24.7);
eq('per100: 20 C', Math.round(per100.carbs), 20);
eq('per100: 4.4 F', Math.round(per100.fat * 10) / 10, 4.4);
eq('per100: 3.3 fiber', Math.round(per100.fiber * 10) / 10, 3.3);
const empty = T.recipeTotals({ ingredients: [] });
eq('empty recipe: zero totals + zero per100', [empty.totals.grams, empty.per100.calories, empty.per100.protein], [0, 0, 0]);
const zeroG = T.recipeTotals({ ingredients: [{ grams: 0, calories: 100 }] });
eq('zero grams: no NaN (per100 all zero)', [zeroG.per100.calories, Number.isNaN(zeroG.per100.calories)], [0, false]);

/* ---------- STATIC: trainer smart search ---------- */
ok('filter chips ×4 + recipe button', count(trainer, 'data-food-filter="') === 4 && trainer.indexOf('id="food-new-recipe"') >= 0);
ok('filter logic + initial view', trainer.indexOf('function setFoodFilter(f)') >= 0 && trainer.indexOf('function showInitialFoodView()') >= 0 && trainer.indexOf("_foodFilter === 'fav'") >= 0 && trainer.indexOf("_foodFilter === 'recipe'") >= 0);
ok('result card with image chain + star toggle', trainer.indexOf('function foodResultCardHTML(f)') >= 0 && trainer.indexOf('window.dkFoodImgTag(f,') >= 0 && trainer.indexOf('data-fav-toggle=') >= 0 && trainer.indexOf('function wireFoodResultCards(root)') >= 0);
ok('favorites/recent storage helpers', trainer.indexOf("const FOOD_FAV_KEY = 'dk_food_favs'") >= 0 && trainer.indexOf("const FOOD_RECENT_KEY = 'dk_food_recent'") >= 0 && trainer.indexOf('function dkFoodFavToggle(f)') >= 0 && trainer.indexOf('function dkFoodRecentAdd(f)') >= 0);
ok('adding to a meal records it in Recent', trainer.indexOf('dkFoodRecentAdd(_pendingFood)') >= 0);
ok('local search carries real serving/package', trainer.indexOf('function searchLocalFoods(query)') >= 0 && trainer.indexOf('serving_quantity: Number(f.serving_quantity) || 0, package_grams: Number(f.package_grams) || 0,') >= 0);
ok('portion modal: units row + real default', trainer.indexOf('id="food-portion-units"') >= 0 && trainer.indexOf("gramsInput.value = sq > 0 ? String(Math.round(sq)) : '100'") >= 0 && trainer.indexOf('data-portion-g=') >= 0);
ok('portion chips: 100 / Serving / Package labels', trainer.indexOf("t('food.portion100')") >= 0 && trainer.indexOf("t('food.portionServing')") >= 0 && trainer.indexOf("t('food.portionPackage')") >= 0);

/* ---------- STATIC: recipe builder ---------- */
ok('recipe modal skeleton', trainer.indexOf('id="recipe-modal"') >= 0 && trainer.indexOf('id="recipe-name"') >= 0 && trainer.indexOf('id="recipe-search"') >= 0 && trainer.indexOf('id="recipe-search-results"') >= 0 && trainer.indexOf('id="recipe-ingredients"') >= 0 && trainer.indexOf('id="recipe-total"') >= 0 && trainer.indexOf('id="recipe-save"') >= 0);
ok('recipe builder functions', trainer.indexOf('function openRecipe()') >= 0 && trainer.indexOf('function renderRecipe()') >= 0 && trainer.indexOf('function recipeAddIngredient(f)') >= 0 && trainer.indexOf('async function saveRecipe()') >= 0 && trainer.indexOf('function wireRecipeSearch()') >= 0);
ok('recipe saved into food_base as source recipe', trainer.indexOf("source: 'recipe', category: 'recipe', per_100g: true") >= 0 && trainer.indexOf('ingredients: _recipe.ingredients.map') >= 0 && trainer.indexOf("await db.put('food_base', item)") >= 0);
ok('recipe totals drive per100 + serving = total weight', trainer.indexOf('const { totals, per100 } = recipeTotals(_recipe);') >= 0 && trainer.indexOf('serving_quantity: Math.round(totals.grams), package_grams: Math.round(totals.grams)') >= 0);
ok('recipe search dropdown reuses local search', trainer.indexOf('const items = await searchLocalFoods(q);') >= 0 && trainer.indexOf('data-rec-pick=') >= 0);
ok('module exposes recipe + filter API', trainer.indexOf('openRecipe, saveRecipe, setFoodFilter, wireRecipeSearch,') >= 0);
ok('external wiring for chips/recipe buttons', trainer.indexOf('screens.nutrition.setFoodFilter(') >= 0 && trainer.indexOf('screens.nutrition.openRecipe()') >= 0 && trainer.indexOf('screens.nutrition.saveRecipe()') >= 0 && trainer.indexOf('screens.nutrition.wireRecipeSearch()') >= 0);

/* ---------- STATIC: portal diary smart search ---------- */
ok('diary units row + renderer', html.indexOf('id="diary-food-units"') >= 0 && html.indexOf('function renderDiaryUnits(p)') >= 0 && html.indexOf('data-unit-g=') >= 0);
ok('portal fav/recent storage (namespaced)', html.indexOf("nsKey('dk_food_' + kind)") >= 0 && html.indexOf('function foodFavToggle(p)') >= 0 && html.indexOf('function foodRecentAdd(p)') >= 0);
ok('pick sets real serving + records recent + units', html.indexOf('String(sq > 0 ? Math.round(sq) : 100)') >= 0 && html.indexOf('foodRecentAdd(p)') >= 0 && html.indexOf('renderDiaryUnits(p)') >= 0);
ok('rows with star + shared renderer', html.indexOf('function diaryFoodRow(p)') >= 0 && html.indexOf('data-food-fav=') >= 0 && html.indexOf('function wireDiaryRows(box)') >= 0);
ok('empty-query view: favorites + recent + focus', html.indexOf('function showDiaryInitial()') >= 0 && html.indexOf("inp.addEventListener('focus'") >= 0 && html.indexOf("section(t('diaryFavTitle')") >= 0);
ok('flat minis still render kcal (nutrition fallback)', html.indexOf('const n = p.nutrition || p; /* stored fav/recent minis are flat */') >= 0);

/* ---------- STATIC: i18n ×3 ---------- */
for (const lang of ['ru', 'en', 'he']) {
  let d = null;
  try { d = JSON.parse(fs.readFileSync(path.join(root, 'src', 'i18n', lang + '.json'), 'utf8')); } catch (e) {}
  const need = ['filterAll', 'filterFav', 'filterRecent', 'filterRecipes', 'newRecipe', 'recipeSave', 'recipeSaved', 'recipeNeedName', 'recipeNeedItems', 'recipeTotal', 'recipeEmpty', 'portion100', 'portionServing', 'portionPackage', 'favAdd', 'favRemove', 'favTitle', 'recentTitle', 'noFavs', 'noRecent', 'noRecipes'];
  const missing = d ? need.filter(k => !(d.food && d.food[k])) : need;
  ok(lang + '.json parses + food.* smart keys', !!d && missing.length === 0);
}
ok('portal islands have diary fav/portion keys ×3', count(html, 'diaryFavTitle:') === 3 && count(html, 'diaryPortionServing:') === 3);

/* ---------- versions ---------- */
ok('sw cache at least v177', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 177; })());
ok('RUNNING / dk-build at least c150', (function () {
  const r2 = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
  return !!r2 && !!b && Number(r2[1]) >= 150 && Number(b[1]) >= 150;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
