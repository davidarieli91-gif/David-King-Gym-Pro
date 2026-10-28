/* c204 test - one 14-group food catalog + seven new art themes. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const crm = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const portal = fs.readFileSync(path.join(root, 'client.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src', 'nutrition-dashboard.css'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }

/* ---------- one catalog ---------- */
ok('both IndexedDB stores merge into one catalog', crm.indexOf('function dkNormalizeFood(') >= 0 && crm.indexOf("db.all('food_database')") >= 0 && crm.indexOf("db.all('food_base')") >= 0);
ok('the catalog has exactly the 14 shared groups', (crm.match(/\{ id: '(veg|fruit|meat|fish|eggs|dairy|grains|legumes|nuts|oils|drinks|sweets|sauces|other)'/g) || []).length >= 14);
ok('group mapping covers meat/fish/eggs separately', crm.indexOf("cats: ['meat']") >= 0 && crm.indexOf("cats: ['fish']") >= 0 && crm.indexOf("cats: ['eggs']") >= 0);
ok('recipes are excluded from the product catalog', crm.indexOf("f.source === 'recipe'") >= 0);
ok('products tab has All + 14 group chips', crm.indexOf('id="food-db-groups"') >= 0 && crm.indexOf('renderGroupChips') >= 0 && crm.indexOf('setCategoryFilter') >= 0);
ok('group tiles are one equal grid (no tiers)', crm.indexOf('food-group-grid') >= 0 && crm.indexOf("tier === 1 ? ' food-tile-hero'") < 0 && crm.indexOf('data-fdb-page') < 0);
ok('group cards show four whole photos', crm.indexOf('dk-group-img') >= 0 && css.indexOf('.dk-food-img') >= 0 && css.indexOf('object-fit: contain') >= 0);
ok('product cards are equal and fully visible', crm.indexOf('dk-product-card') >= 0 && css.indexOf('min-height: 2.5em') >= 0 && css.indexOf('content-visibility: auto') >= 0);
ok('picker uses the same group/card system', crm.indexOf('function pickerTileHTML(f)') >= 0 && crm.indexOf('pickerGridHTML(list)') >= 0 && crm.indexOf('food-group-grid') >= 0);
ok('right rail lists all products, not eight', crm.indexOf('id="nutri-food-preview"') >= 0 && crm.indexOf('nutri-food-total') >= 0 && crm.indexOf('pool.slice(0, 8)') < 0 && css.indexOf('max-height: 468px') >= 0);
ok('right rail has the 14 group chips', crm.indexOf('nutri-food-cats') >= 0 && crm.indexOf('DK_FOOD_GROUPS.map') >= 0);
ok('right rail cards preview the same detail modal', crm.indexOf('openFoodDetailModal(id)') >= 0 && crm.indexOf('id="food-detail-add"') >= 0);
ok('detail modal can add the previewed product to the plan', crm.indexOf('fdAdd') >= 0 && crm.indexOf('screens.nutrition.openPortionModal(_foodDetailFood)') >= 0);
ok('drag product into a meal is wired', crm.indexOf('dropFoodIntoMeal') >= 0 && crm.indexOf('data-meal-index') >= 0 && crm.indexOf('draggable="true"') >= 0 && css.indexOf('.nutri-meal-row.is-drop-target') >= 0);
ok('drop feedback + meal add toast', crm.indexOf('nutri-drop-hint') >= 0 && crm.indexOf("t('nutrition.dropHere')") >= 0 && crm.indexOf("t('nutrition.foodAdded')") >= 0);
ok('right rail widened for the bigger catalog', css.indexOf('grid-template-columns: minmax(0, 1fr) 372px') >= 0);
ok('food edits/deletes respect the source store', crm.indexOf('let _foodDetailStore') >= 0 && crm.indexOf('await db.put(_foodDetailStore, food)') >= 0);

/* ---------- seven new themes ---------- */
const newThemes = ['v2-honey', 'v2-apricot', 'v2-jade', 'v2-plum', 'v2-horizon', 'v2-sand', 'v2-sky'];
for (const id of newThemes) {
  ok('trainer lists ' + id, crm.indexOf("id:'" + id + "'") >= 0);
  ok('trainer styles ' + id, crm.indexOf('data-theme="' + id + '"') >= 0);
  ok('portal lists ' + id, portal.indexOf("id:'" + id + "'") >= 0);
  ok('portal styles ' + id, portal.indexOf('data-theme="' + id + '"') >= 0);
}
ok('trainer now has 13 presets', (crm.match(/\{ id:'v2-[a-z-]+'/g) || []).length >= 13);
ok('portal now has 13 presets', (portal.match(/\{id:'v2-[a-z-]+'/g) || []).length >= 13);
ok('scene layer carries soft conic light beams', crm.indexOf('conic-gradient(from 215deg at 50% -18%') >= 0 && portal.indexOf('conic-gradient(from 215deg at 50% -18%') >= 0);
ok('13 theme previews + active sheen', crm.indexOf('.v2-theme-preview::before') >= 0 && crm.indexOf('min-height: 132px') >= 0);
ok('theme hint says 13 worlds', /13 /.test(JSON.parse(fs.readFileSync(path.join(root, 'src', 'i18n', 'en.json'), 'utf8')).settings.themesHint));
ok('new palettes use warm gold and apricot', crm.indexOf('data-theme="v2-honey"') >= 0 && crm.indexOf('data-theme="v2-apricot"') >= 0 && crm.indexOf('#facc15') >= 0 && crm.indexOf('#fb923c') >= 0);

/* ---------- i18n ---------- */
for (const lang of ['en', 'ru', 'he']) {
  const d = JSON.parse(fs.readFileSync(path.join(root, 'src', 'i18n', lang + '.json'), 'utf8'));
  const need = ['groupMeat', 'groupFish', 'groupEggs', 'groupGrains', 'groupNuts', 'groupOils', 'product', 'products', 'backHome'];
  ok(lang + ': all 14-group labels', need.every(k => !!(d.food && d.food[k])));
  ok(lang + ': drag/drop/add-to-plan copy', !!(d.nutrition.dragHint && d.nutrition.dropHere && d.nutrition.addToPlan));
  ok(lang + ': no corrupted catalog copy', !/\?{2,}/.test([d.food.groupMeat, d.food.groupFish, d.nutrition.dragHint].join(' ')));
}

/* ---------- versions ---------- */
ok('build c211', crm.indexOf('<meta name="dk-build" content="c211" />') >= 0);
ok('RUNNING 211', crm.indexOf('var RUNNING = 211;') >= 0);
ok('SW cache v238', sw.indexOf("CACHE_NAME = 'dk-gym-v238'") >= 0);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
