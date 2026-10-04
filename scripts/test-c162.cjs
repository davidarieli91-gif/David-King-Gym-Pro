/* c162 test — food kiosk: shelf hierarchy, badges, paging, picker tiles, i18n. */
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

/* ---------- UNIT: shelf mapping + smart shelves ---------- */
const unitSrc = [
  'const FOOD_SHELVES = ' + extractArr(trainer, 'FOOD_SHELVES') + ';',
  'globalThis.__K162_store = {};',
  'const localStorage = { getItem: (k) => (globalThis.__K162_store[k] != null ? globalThis.__K162_store[k] : null) };',
  extractFn(trainer, 'fdbList'),
  extractFn(trainer, 'foodShelfOf'),
  extractFn(trainer, 'smartShelfItems'),
  ';globalThis.__K162 = { FOOD_SHELVES, foodShelfOf, smartShelfItems, localStorage };'
].join('\n');
new Function(unitSrc)();
const K = globalThis.__K162;
eq('15 shelves defined', K.FOOD_SHELVES.length, 15);
eq('4 hero shelves', K.FOOD_SHELVES.filter((s) => s.tier === 1).length, 4);
eq('vegetable → veg', K.foodShelfOf('vegetable'), 'veg');
eq('greens → veg', K.foodShelfOf('greens'), 'veg');
eq('fruit → fruit', K.foodShelfOf('fruit'), 'fruit');
eq('meat → protein', K.foodShelfOf('meat'), 'protein');
eq('fish → protein', K.foodShelfOf('fish'), 'protein');
eq('eggs → protein', K.foodShelfOf('eggs'), 'protein');
eq('dairy → dairy', K.foodShelfOf('dairy'), 'dairy');
eq('grains → carbs', K.foodShelfOf('grains'), 'carbs');
eq('bakery → carbs', K.foodShelfOf('bakery'), 'carbs');
eq('oils → fats', K.foodShelfOf('oils'), 'fats');
eq('nuts → fats', K.foodShelfOf('nuts'), 'fats');
eq('international → world', K.foodShelfOf('international'), 'world');
eq('unknown category → other', K.foodShelfOf('whatsthis'), 'other');
eq('empty → other', K.foodShelfOf(''), 'other');
K.localStorage; /* silence */
const pool = [
  { id: 'a', nutri: 'a', nutrition: { protein: 20 } },
  { id: 'b', nutri: 'b', nutrition: { protein: 5 } },
  { id: 'c', nutri: 'e', nutrition: { protein: 30 } },
  { id: 'd', nutrition: { protein: 16 } }
];
eq('healthy shelf = A/B only', K.smartShelfItems('healthy', pool).map((f) => f.id), ['a', 'b']);
eq('high-protein shelf ≥15 g', K.smartShelfItems('proteinHigh', pool).map((f) => f.id).sort(), ['a', 'c', 'd']);
globalThis.__K162_store.dk_food_favs = JSON.stringify([{ id: 'c' }, { id: 'a' }]);
eq('favorites shelf maps ids back to products', K.smartShelfItems('favs', pool).map((f) => f.id), ['c', 'a']);
globalThis.__K162_store.dk_food_recent = JSON.stringify([{ id: 'zz' }]);
eq('recent ignores unknown ids', K.smartShelfItems('recent', pool).length, 0);

/* ---------- STATIC: kiosk engine ---------- */
ok('kiosk engine present (home/shelf/grid/wiring)', ['renderHomeTiles', 'renderShelfView', 'renderProductGridHTML', 'foodTileHTML', 'foodBadgeHTML', 'shelfCollageHTML', 'shelfTileHTML', 'smartTileHTML', 'wireTree'].every((f) => trainer.indexOf('function ' + f + '(') >= 0));
ok('old thin accordion fully removed', trainer.indexOf('data-toggle-food-cat') < 0);
ok('bento spans + tiers wired', trainer.indexOf('food-tile-hero') >= 0 && trainer.indexOf('food-tile-wide') >= 0 && trainer.indexOf("tier === 1 ? ' food-tile-hero'") >= 0);
ok('paging 60 + pager buttons', trainer.indexOf('const PAGE_SIZE = 60;') >= 0 && trainer.indexOf('data-fdb-page="prev"') >= 0 && trainer.indexOf('data-fdb-page="next"') >= 0);
ok('sub-folder view with ≥2 sub-collections', trainer.indexOf('subIds.length >= 2') >= 0 && trainer.indexOf("data-fdb-sub=") >= 0);
ok('badges: Nutri/Green/NOVA/forest colours', trainer.indexOf('const NUTRI_COLORS = { a:') >= 0 && trainer.indexOf('const NOVA_COLORS =') >= 0 && trainer.indexOf("f.forest === 'none'") >= 0 && trainer.indexOf("f.forest === 'risk'") >= 0);
ok('badges travel into the picker normalizer', trainer.indexOf('nutri: f.nutri || null, eco: f.eco || null, nova: Number(f.nova) || null, forest: f.forest || null') >= 0);
ok('picker results are photo tiles in a grid', trainer.indexOf("results.innerHTML = '<div class=\"food-grid\">' + items.map") >= 0 && trainer.indexOf('function pickerBadgeHTML(f)') >= 0);
ok('smart shelves above the bento', trainer.indexOf('const SMART_SHELVES = [') >= 0 && trainer.indexOf('data-fdb-smart="') >= 0);
ok('badges help button + modal + wiring', trainer.indexOf('id="food-db-badges-help"') >= 0 && trainer.indexOf('id="food-badges-modal"') >= 0 && trainer.indexOf("getElementById('food-db-badges-help')") >= 0);
ok('kiosk CSS (grid/bento/badges) + big-font rules', trainer.indexOf('.food-bento {') >= 0 && trainer.indexOf('.food-grid {') >= 0 && trainer.indexOf('.food-badge {') >= 0 && trainer.indexOf('html.dk-fs-big .food-bento') >= 0);
ok('nutrition screen widened for large displays', trainer.indexOf('max-w-5xl xl:max-w-6xl 2xl:max-w-[1500px]') >= 0);

/* ---------- i18n ×3 ---------- */
for (const lang of ['ru', 'en', 'he']) {
  let d = null;
  try { d = JSON.parse(fs.readFileSync(path.join(root, 'src', 'i18n', lang + '.json'), 'utf8')); } catch (e) {}
  const F = d && d.food;
  const need = ['shelfVeg', 'shelfFruit', 'shelfProtein', 'shelfDairy', 'shelfCarbs', 'shelfDrinks', 'shelfSweets', 'shelfLegumes', 'shelfFats', 'shelfSauces', 'shelfBaby', 'shelfIsraeli', 'shelfWorld', 'shelfVegan', 'shelfOther', 'smartFavs', 'smartRecent', 'smartHealthy', 'smartProtein', 'allProducts', 'backHome', 'pagePrev', 'pageNext', 'badgesTitle', 'badgesClose', 'badgesNutriTitle', 'badgesNutri', 'badgesEcoTitle', 'badgesEco', 'badgesNovaTitle', 'badgesNova', 'badgesForestTitle', 'badgesForest', 'sub_milks', 'sub_cheeses', 'sub_poultry', 'sub_olive-oil'];
  const missing = F ? need.filter((k) => !F[k]) : need;
  ok(lang + '.json has all kiosk + badge keys' + (missing.length ? ' — missing ' + missing.join(', ') : ''), missing.length === 0);
}

/* ---------- versions ---------- */
ok('sw cache at least v189', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 189; })());
ok('RUNNING / dk-build at least c162', (function () {
  const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
  return !!r && !!b && Number(r[1]) >= 162 && Number(b[1]) >= 162;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
