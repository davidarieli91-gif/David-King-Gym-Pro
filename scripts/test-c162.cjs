/* c162/c204 test - unified 14-group food catalog: equal tiles, all products, shared picker. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const trainer = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src', 'nutrition-dashboard.css'), 'utf8');
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

/* ---------- UNIT: 14 groups + smart shelves ---------- */
const unitSrc = [
  'const DK_FOOD_GROUPS = ' + extractArr(trainer, 'DK_FOOD_GROUPS') + ';',
  'const FOOD_SHELVES = DK_FOOD_GROUPS;',
  'globalThis.__K162_store = {};',
  'const localStorage = { getItem: (k) => (globalThis.__K162_store[k] != null ? globalThis.__K162_store[k] : null) };',
  extractFn(trainer, 'fdbList'),
  extractFn(trainer, 'foodShelfOf'),
  extractFn(trainer, 'smartShelfItems'),
  ';globalThis.__K162 = { DK_FOOD_GROUPS, FOOD_SHELVES, foodShelfOf, smartShelfItems, localStorage };'
].join('\n');
new Function(unitSrc)();
const K = globalThis.__K162;
eq('14 product groups defined', K.FOOD_SHELVES.length, 14);
eq('every group has cats', K.FOOD_SHELVES.every((g) => Array.isArray(g.cats) && g.cats.length > 0), true);
eq('vegetable -> veg', K.foodShelfOf('vegetable'), 'veg');
eq('greens -> veg', K.foodShelfOf('greens'), 'veg');
eq('fruit -> fruit', K.foodShelfOf('fruit'), 'fruit');
eq('meat -> meat', K.foodShelfOf('meat'), 'meat');
eq('fish -> fish', K.foodShelfOf('fish'), 'fish');
eq('eggs -> eggs', K.foodShelfOf('eggs'), 'eggs');
eq('dairy -> dairy', K.foodShelfOf('dairy'), 'dairy');
eq('grains -> grains', K.foodShelfOf('grains'), 'grains');
eq('bakery -> grains', K.foodShelfOf('bakery'), 'grains');
eq('oils -> oils', K.foodShelfOf('oils'), 'oils');
eq('nuts -> nuts', K.foodShelfOf('nuts'), 'nuts');
eq('international -> other', K.foodShelfOf('international'), 'other');
eq('unknown category -> other', K.foodShelfOf('whatsthis'), 'other');
eq('empty -> other', K.foodShelfOf(''), 'other');
const pool = [
  { id: 'a', nutri: 'a', nutrition: { protein: 20 } },
  { id: 'b', nutri: 'b', nutrition: { protein: 5 } },
  { id: 'c', nutri: 'e', nutrition: { protein: 30 } },
  { id: 'd', nutrition: { protein: 16 } }
];
eq('healthy shelf = A/B only', K.smartShelfItems('healthy', pool).map((f) => f.id), ['a', 'b']);
eq('high-protein shelf >=15 g', K.smartShelfItems('proteinHigh', pool).map((f) => f.id).sort(), ['a', 'c', 'd']);
globalThis.__K162_store.dk_food_favs = JSON.stringify([{ id: 'c' }, { id: 'a' }]);
eq('favorites shelf maps ids back to products', K.smartShelfItems('favs', pool).map((f) => f.id), ['c', 'a']);

/* ---------- STATIC: one merged catalog, equal cards ---------- */
ok('both stores merge into one catalog', trainer.indexOf('async function load()') >= 0 && trainer.indexOf("db.all('food_database')") >= 0 && trainer.indexOf("db.all('food_base')") >= 0 && trainer.indexOf('dkNormalizeFood') >= 0);
ok('recipes stay out of the product catalog', trainer.indexOf("f.source === 'recipe'") >= 0);
ok('14 group tiles use one equal grid', trainer.indexOf('food-group-grid') >= 0 && trainer.indexOf('food-group-card') >= 0 && trainer.indexOf('shelfCollageHTML') >= 0);
ok('group tiles render all four photos inside (object-contain)', trainer.indexOf('dk-group-img') >= 0 && css.indexOf('object-fit: contain') >= 0);
ok('product cards use whole-photo object-contain', trainer.indexOf('dk-food-img') >= 0 && trainer.indexOf('dk-product-card') >= 0 && css.indexOf('.dk-product-card') >= 0);
ok('no bento tiers in markup', trainer.indexOf("tier === 1 ? ' food-tile-hero'") < 0 && trainer.indexOf('data-fdb-page') < 0 && trainer.indexOf('subIds.length >= 2') < 0);
ok('smart shelves stay as compact pills', trainer.indexOf('const SMART_SHELVES = [') >= 0 && trainer.indexOf('food-smart-pill') >= 0 && trainer.indexOf('data-fdb-smart="') >= 0);
ok('group chips exist and sync active state', trainer.indexOf('id="food-db-groups"') >= 0 && trainer.indexOf('renderGroupChips') >= 0 && trainer.indexOf('syncGroupChips') >= 0);
ok('picker uses the same groups/cards', trainer.indexOf('function pickerTileHTML(f)') >= 0 && trainer.indexOf('food-group-grid') >= 0 && trainer.indexOf('data-fp-pick') >= 0);
ok('right rail lists every product with scrolling', trainer.indexOf('id="nutri-food-preview"') >= 0 && trainer.indexOf('nutri-food-total') >= 0 && trainer.indexOf('function renderFoodPreview()') >= 0 && trainer.indexOf('pool.slice(0, 8)') < 0 && css.indexOf('max-height: 468px') >= 0);
ok('right rail card opens the same detail modal', trainer.indexOf('openFoodDetailModal(id)') >= 0 && trainer.indexOf('id="food-detail-add"') >= 0);
ok('drag product -> meal is wired', trainer.indexOf('dropFoodIntoMeal') >= 0 && trainer.indexOf('data-meal-index') >= 0 && trainer.indexOf('draggable="true"') >= 0 && css.indexOf('is-drop-target') >= 0);
ok('badges: Nutri/Green/NOVA/forest colours', trainer.indexOf('const NUTRI_COLORS = { a:') >= 0 && trainer.indexOf('const NOVA_COLORS =') >= 0 && trainer.indexOf("f.forest === 'none'") >= 0 && trainer.indexOf("f.forest === 'risk'") >= 0);
ok('badges help button + modal + wiring', trainer.indexOf('id="food-db-badges-help"') >= 0 && trainer.indexOf('id="food-badges-modal"') >= 0 && trainer.indexOf("getElementById('food-db-badges-help')") >= 0);
ok('nutrition screen widened for large displays', trainer.indexOf('<div data-screen="nutrition" class="hidden p-4 sm:p-6 lg:p-8 max-w-[1600px]') >= 0);

/* ---------- i18n x3 ---------- */
for (const lang of ['ru', 'en', 'he']) {
  let d = null;
  try { d = JSON.parse(fs.readFileSync(path.join(root, 'src', 'i18n', lang + '.json'), 'utf8')); } catch (e) {}
  const F = d && d.food;
  const need = ['shelfVeg', 'shelfFruit', 'shelfDairy', 'shelfDrinks', 'shelfSweets', 'shelfLegumes', 'shelfSauces', 'shelfOther', 'groupMeat', 'groupFish', 'groupEggs', 'groupGrains', 'groupNuts', 'groupOils', 'product', 'products', 'backHome', 'smartFavs', 'smartRecent', 'smartHealthy', 'smartProtein', 'badgesTitle', 'badgesClose', 'badgesNutriTitle', 'badgesNutri', 'badgesEcoTitle', 'badgesEco', 'badgesNovaTitle', 'badgesNova', 'badgesForestTitle', 'badgesForest'];
  const missing = F ? need.filter((k) => !F[k]) : need;
  ok(lang + '.json has all catalog keys' + (missing.length ? ' - missing ' + missing.join(', ') : ''), missing.length === 0);
  ok(lang + '.json has drag/drop + add-to-plan keys', !!(d && d.nutrition && d.nutrition.dragHint && d.nutrition.dropHere && d.nutrition.addToPlan));
  ok(lang + '.json catalog values are not corrupted', !/\?{2,}/.test([F && F.groupMeat, F && F.groupFish, d && d.nutrition && d.nutrition.dragHint].join(' ')));
}

/* ---------- versions ---------- */
ok('sw cache at least v231', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 230; })());
ok('RUNNING / dk-build at least c204', (function () {
  const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
  return !!r && !!b && Number(r[1]) >= 204 && Number(b[1]) >= 204;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
