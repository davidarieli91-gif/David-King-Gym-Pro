/* c169 test — source chips removed, category cleanup + migration, stale client search cleared. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const trainer = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const dbJson = JSON.parse(fs.readFileSync(path.join(root, 'food-db.json'), 'utf8'));
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }
function eq(name, got, want) { const g = JSON.stringify(got), w = JSON.stringify(want); if (g === w) { pass++; console.log('PASS ' + name + ' = ' + g); } else { fail++; console.log('FAIL ' + name + ' got ' + g + ' want ' + w); } }
const byId = {};
dbJson.forEach(f => { byId[f.id] = f; });

/* ---------- DATA: the 14 corrections ---------- */
eq('goat milk → dairy/milks', [byId['fd_fd_7697608262698622'].category, byId['fd_fd_7697608262698622'].sub], ['dairy', 'milks']);
eq('bread → bakery', byId['off_3760049794298'].category, 'bakery');
eq('kefir → dairy', byId['off_8436547770137'].category, 'dairy');
eq('feta → dairy', byId['fd_il_5247d2586fcab650'].category, 'dairy');
eq('pringles 1 → sweets, no sub', [byId['off_5053990127740'].category, byId['off_5053990127740'].sub || ''], ['sweets', '']);
eq('pringles 2 → sweets', byId['off_il_0038000845536'].category, 'sweets');
for (const id of ['off_il_7290114310536', 'off_il_1901104321680', 'off_il_7290119370177', 'off_il_7290102393060']) {
  eq('yogurt ' + id.slice(-6) + ' → dairy', byId[id].category, 'dairy');
}
eq('chicken soup mix → sauces', byId['off_il_7290100685136'].category, 'sauces');
eq('beef soup mix → sauces', byId['off_il_0077544528406'].category, 'sauces');
eq('instant noodles → grains/pastas', [byId['off_il_7290000073767'].category, byId['off_il_7290000073767'].sub], ['grains', 'pastas']);
eq('cereal bar sub fish → cereals', byId['off_il_7296073226680'].sub, 'cereals');

/* ---------- DATA: vegan is honest now ---------- */
const vegan = dbJson.filter(f => f.category === 'vegan');
eq('vegan holds exactly the 2 plant milks', vegan.length, 2);
ok('vegan items are plant milks', vegan.every(f => /кокос|овс|coconut|oat/i.test((f.name_ru || '') + (f.name_en || ''))));

/* ---------- STATIC: source chips removed ---------- */
ok('source chips block is gone from the HTML', trainer.indexOf('food-db-source-group') < 0 && trainer.indexOf('food-db-src-btn') < 0 && trainer.indexOf('data-food-db-source') < 0);
ok('search + count + add buttons survive', trainer.indexOf('id="food-db-count"') >= 0 && trainer.indexOf('id="food-db-search"') >= 0 && trainer.indexOf('id="food-db-add-btn"') >= 0);

/* ---------- STATIC: category migration (surgical, no reseed) ---------- */
ok('migration function exists with its own flag', trainer.indexOf('async function migrateFoodCategoriesC169()') >= 0 && trainer.indexOf("const flagKey = 'dk_food_cat_fix_v1'") >= 0);
ok('migration syncs category + sub and bulk-puts only changed rows', (function () {
  const i = trainer.indexOf('async function migrateFoodCategoriesC169()');
  const body = trainer.slice(i, i + 1600);
  return body.indexOf('src.category !== f.category') >= 0 && body.indexOf('srcSub !== (f.sub || \'\')') >= 0 && body.indexOf('await db.bulkPut(\'food_database\', updates)') >= 0;
})());
ok('migration runs right after the food seed at boot', (function () {
  const i = trainer.indexOf('await seedFoodDatabase(false);');
  const after = trainer.slice(i, i + 220);
  return after.indexOf('migrateFoodCategoriesC169()') >= 0;
})());
ok('no full reseed / no clear in the migration', (function () {
  const i = trainer.indexOf('async function migrateFoodCategoriesC169()');
  const body = trainer.slice(i, i + 1600);
  return body.indexOf("db.clear('food_database')") < 0;
})());

/* ---------- STATIC: stale client search ---------- */
ok('search inputs got autocomplete=off', trainer.indexOf('id="aside-search" placeholder="Search clients…" autocomplete="off"') >= 0 && trainer.indexOf('id="dash-search" autocomplete="off"') >= 0);
ok('boot clears both search boxes + the filter', trainer.indexOf('function dkClearClientSearch()') >= 0 && trainer.indexOf('[dashSearch, asideSearch].forEach(el => { if (el && el.value) el.value = \'\'; })') >= 0 && trainer.indexOf("screens.dashboard.setSearch('')") >= 0);
ok('a pageshow guard catches late browser restores', trainer.indexOf("window.addEventListener('pageshow'") >= 0 && trainer.indexOf('if (!e.persisted) dkClearClientSearch();') >= 0);

/* ---------- versions ---------- */
ok('sw cache at least v196', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 196; })());
ok('sw keeps c168 history and adds v196 c169', sw.indexOf('// v195: c168') >= 0 && sw.indexOf('// v196: c169') >= 0);
ok('RUNNING / dk-build at least c169', (function () {
  const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
  return !!r && !!b && Number(r[1]) >= 169 && Number(b[1]) >= 169;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
