/* Quick numeric sanity checks for the c229 nutrition helpers. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');

let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }

/* --- extract the unit + smart-weight helpers and run them --- */
const startMarker = 'const DK_UNIT_ORDER';
const endMarker = 'function dkFoodMacroBadges(n)';
const start = html.indexOf(startMarker);
const end = html.indexOf(endMarker, start);
ok('unit helpers found', start > 0 && end > start);
const snippet = html.slice(start, end);

const sandbox = { currentLang: () => 'ru', t: (k) => (k === 'nutrition.gramShort' ? 'г' : ''), console };
const fn = new Function('currentLang', 't', snippet + '\nreturn { dkFoodUnits, dkSmartUnitGrams, dkUnitLabel, DK_UNIT_LABELS, dkFoodUnitLabel };');
const api = fn(sandbox.currentLang, sandbox.t);

const egg = { name_en: 'Egg', name_ru: 'Яйцо', category: 'eggs', nutrition: {} };
const eggUnits = api.dkFoodUnits(egg);
ok('egg gets a piece unit of 50 g', eggUnits.some((u) => u.id === 'piece' && Math.round(u.grams) === 50));

const milk = { name_en: 'Milk 3%', category: 'dairy', nutrition: {} };
const milkUnits = api.dkFoodUnits(milk);
ok('dairy drink offers a glass', api.dkSmartUnitGrams(milk).glass === 200);
ok('milk keeps smart units when no manual value exists', milkUnits.length > 0);

const oil = { name_en: 'Olive oil', category: 'oils', nutrition: {} };
const oilUnits = api.dkFoodUnits(oil);
ok('oil gets tbsp 15 g and tsp 5 g', oilUnits.some((u) => u.id === 'tbsp' && u.grams === 15) && oilUnits.some((u) => u.id === 'tsp' && u.grams === 5));

const nuts = { name_en: 'Almonds', category: 'nuts', nutrition: {} };
const nutUnits = api.dkFoodUnits(nuts);
ok('nuts get a handful of 30 g', nutUnits.some((u) => u.id === 'handful' && u.grams === 30));

const cola = { name_en: 'Cola can', category: 'drinks', nutrition: {} };
ok('soda can gets a can of 330 g', api.dkFoodUnits(cola).some((u) => u.id === 'can' && u.grams === 330));

const manual = { name_en: 'Custom', category: 'other', nutrition: {}, units: [{ id: 'piece', grams: 77 }] };
ok('manual unit overrides the default', api.dkFoodUnits(manual).find((u) => u.id === 'piece').grams === 77);

const withServing = { name_en: 'Yogurt', category: 'dairy', nutrition: {}, serving_quantity: 150, package_grams: 500 };
const su = api.dkFoodUnits(withServing);
ok('serving and package are included', su.some((u) => u.id === 'serving' && u.grams === 150) && su.some((u) => u.id === 'pack' && u.grams === 500));

ok('unit labels are localized', api.dkUnitLabel('piece') === 'шт' && api.dkUnitLabel('can') === 'банка');

/* --- usefulness score / basis math (mirror of the page formula) --- */
function valueAt(f, key, basis, units) {
  const raw = Number((f.nutrition || {})[key]) || 0;
  if (!raw) return 0;
  if (basis === '100kcal') { const k = Number(f.nutrition.calories) || 0; return k > 4 ? raw / k * 100 : 0; }
  const g = basis === '1g' ? 1 : basis === '10g' ? 10 : 100;
  return raw * g / 100;
}
const spinach = { nutrition: { calories: 23, protein: 2.9, fiber: 2.2, vitamin_c: 28, iron: 2.7, calcium: 99, sugars: 0.4, saturated_fat: 0.1, sodium: 79, vitamin_k: 483 } };
ok('per-10 g is a tenth of per-100 g', Math.abs(valueAt(spinach, 'vitamin_c', '10g') - 2.8) < 1e-9);
ok('per-100-kcal scales up low-calorie food', valueAt(spinach, 'vitamin_c', '100kcal') > 100);
ok('0 kcal yields no per-100-kcal value', valueAt({ nutrition: { calories: 0, vitamin_c: 10 } }, 'vitamin_c', '100kcal') === 0);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
