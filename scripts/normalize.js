// DK Gym — Data Audit & Normalization (Phase 2)
const fs = require('fs');

function readJSON(file) {
  if (!fs.existsSync(file)) { console.error('MISSING FILE: ' + file); process.exit(1); }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const EXERCISE_MAP = {
  src: 'source', g: 'group',
  gE: 'group_en', gR: 'group_ru', gH: 'group_he',
  sE: 'subgroup_en', sR: 'subgroup_ru', sH: 'subgroup_he',
  e: 'equipment', eE: 'equipment_en', eR: 'equipment_ru', eH: 'equipment_he',
  nE: 'name_en', nR: 'name_ru', nH: 'name_he',
  t: 'technique_en', tRu: 'technique_ru', tHe: 'technique_he',
  i: 'images', mt: 'movement_type', f: 'force', lv: 'level', mc: 'mechanic', cat: 'category'
};

function normalizeExercise(x) {
  const out = { id: x.id };
  for (const [s, l] of Object.entries(EXERCISE_MAP)) {
    if (x[s] !== undefined) out[l] = x[s];
    else if (x[l] !== undefined) out[l] = x[l];
  }
  out.synergists = x.synergists || x.syn || [];
  out.is_archived = x.is_archived || false;
  return out;
}

function normalizeFood(x) {
  return {
    id: x.id,
    name_en: x.name_en || '', name_he: x.name_he || '', name_ru: x.name_ru || '',
    source: x.source || '', category: x.category || '',
    image_url: x.image_url || '', barcode: x.barcode || '', brand: x.brand || '',
    nutrition: x.nutrition || {}, is_archived: x.is_archived || false
  };
}

const exercises = readJSON('exercise-db.json').map(normalizeExercise);
const foods = readJSON('food-db.json').map(normalizeFood);

// ---------- AUDIT ----------
const count = (obj, key) => { obj[key] = (obj[key] || 0) + 1; };
const exSources = {}, exGroups = {}, exEquip = {};
const exNoName = [], exNoTech = [], exNoImg = [];
const exDupId = {}, exDupName = {};

for (const x of exercises) {
  count(exSources, x.source || 'unknown');
  count(exGroups, x.group || 'unknown');
  count(exEquip, x.equipment || 'unknown');
  if (!x.name_en && !x.name_ru && !x.name_he) exNoName.push(x.id);
  if (!x.technique_en && !x.technique_ru && !x.technique_he) exNoTech.push(x.id);
  if (!x.images || x.images.length === 0) exNoImg.push(x.id);
  count(exDupId, x.id);
  const nk = (x.name_en || '').toLowerCase();
  if (nk) count(exDupName, nk);
}

const foodSources = {}, foodCats = {};
const foodNoName = [], foodNoMacros = [], foodNoImg = [];
const foodDupId = {}, foodDupName = {};

for (const f of foods) {
  count(foodSources, f.source || 'unknown');
  count(foodCats, f.category || 'unknown');
  if (!f.name_en && !f.name_ru && !f.name_he) foodNoName.push(f.id);
  if (!f.nutrition.calories && f.nutrition.calories !== 0) foodNoMacros.push(f.id);
  if (!f.image_url) foodNoImg.push(f.id);
  count(foodDupId, f.id);
  const nk = (f.name_en || '').toLowerCase();
  if (nk) count(foodDupName, nk);
}

const dupExId = Object.entries(exDupId).filter(([, c]) => c > 1);
const dupExName = Object.entries(exDupName).filter(([, c]) => c > 1);
const dupFoodId = Object.entries(foodDupId).filter(([, c]) => c > 1);
const dupFoodName = Object.entries(foodDupName).filter(([, c]) => c > 1);

// ---------- REPORTS ----------
const sortDesc = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]);
const table = (o) => sortDesc(o).map(([k, v]) => '| ' + k + ' | ' + v + ' |').join('\n');
const list = (arr, n) => (arr.length === 0 ? 'None' : arr.slice(0, n).map((id) => '- `' + id + '`').join('\n'));

fs.mkdirSync('reports', { recursive: true });
fs.mkdirSync('data', { recursive: true });

fs.writeFileSync('reports/exercise-audit.md',
  '# Exercise Database Audit\n\n**Total:** ' + exercises.length +
  '\n\n## By Source\n| Source | Count |\n|---|---|\n' + table(exSources) +
  '\n\n## By Muscle Group\n| Group | Count |\n|---|---|\n' + table(exGroups) +
  '\n\n## By Equipment\n| Equipment | Count |\n|---|---|\n' + table(exEquip) +
  '\n\n## Quality\n- No name: ' + exNoName.length +
  '\n- No technique: ' + exNoTech.length +
  '\n- No image: ' + exNoImg.length +
  '\n- Duplicate IDs: ' + dupExId.length +
  '\n- Duplicate names: ' + dupExName.length + '\n');

fs.writeFileSync('reports/food-audit.md',
  '# Food Database Audit\n\n**Total:** ' + foods.length +
  '\n\n## By Source\n| Source | Count |\n|---|---|\n' + table(foodSources) +
  '\n\n## By Category\n| Category | Count |\n|---|---|\n' + table(foodCats) +
  '\n\n## Quality\n- No name: ' + foodNoName.length +
  '\n- No calories: ' + foodNoMacros.length +
  '\n- No image: ' + foodNoImg.length +
  '\n- Duplicate IDs: ' + dupFoodId.length +
  '\n- Duplicate names: ' + dupFoodName.length + '\n');

fs.writeFileSync('reports/duplicates.md',
  '# Duplicates Report\n\n## Exercise IDs (' + dupExId.length + ')\n' + list(dupExId.map(([k, v]) => k + ' (x' + v + ')'), 50) +
  '\n\n## Exercise names (' + dupExName.length + ')\n' + list(dupExName.map(([k, v]) => k + ' (x' + v + ')'), 50) +
  '\n\n## Food IDs (' + dupFoodId.length + ')\n' + list(dupFoodId.map(([k, v]) => k + ' (x' + v + ')'), 50) +
  '\n\n## Food names (' + dupFoodName.length + ')\n' + list(dupFoodName.map(([k, v]) => k + ' (x' + v + ')'), 50) + '\n');

fs.writeFileSync('reports/missing-data.md',
  '# Missing Data\n\n## Exercises without name\n' + list(exNoName, 20) +
  '\n\n## Exercises without technique\n' + list(exNoTech, 20) +
  '\n\n## Exercises without image\n' + list(exNoImg, 20) +
  '\n\n## Foods without name\n' + list(foodNoName, 20) +
  '\n\n## Foods without calories\n' + list(foodNoMacros, 20) +
  '\n\n## Foods without image\n' + list(foodNoImg, 20) + '\n');

// ---------- CSV ----------
const esc = (v) => {
  if (v === null || v === undefined) return '';
  const s = String(v).replace(/"/g, '""');
  return /[,"\n]/.test(s) ? '"' + s + '"' : s;
};

const exH = ['id','source','group','group_en','group_ru','group_he','equipment','name_en','name_ru','name_he','movement_type','category','has_image','has_technique'];
const exRows = exercises.map((x) => [
  x.id, x.source, x.group, x.group_en, x.group_ru, x.group_he, x.equipment,
  x.name_en, x.name_ru, x.name_he, x.movement_type, x.category,
  (x.images && x.images.length) ? 'yes' : 'no',
  (x.technique_en || x.technique_ru || x.technique_he) ? 'yes' : 'no'
].map(esc).join(','));
fs.writeFileSync('data/exercises.csv', [exH.join(','), ...exRows].join('\n'));

const fH = ['id','name_en','name_he','name_ru','source','category','brand','calories','protein','carbs','fat','fiber','sugars','sodium','has_image'];
const fRows = foods.map((f) => [
  f.id, f.name_en, f.name_he, f.name_ru, f.source, f.category, f.brand,
  f.nutrition.calories || '', f.nutrition.protein || '', f.nutrition.carbs || '',
  f.nutrition.fat || '', f.nutrition.fiber || '', f.nutrition.sugars || '',
  f.nutrition.sodium || '', f.image_url ? 'yes' : 'no'
].map(esc).join(','));
fs.writeFileSync('data/foods.csv', [fH.join(','), ...fRows].join('\n'));

// ---------- NORMALIZED JSON ----------
fs.writeFileSync('data/exercises.normalized.json', JSON.stringify(exercises, null, 2));
fs.writeFileSync('data/foods.normalized.json', JSON.stringify(foods, null, 2));

console.log('=== AUDIT COMPLETE ===');
console.log('Exercises:', exercises.length);
console.log('Foods:', foods.length);
console.log('Dup exercise IDs:', dupExId.length);
console.log('Dup food IDs:', dupFoodId.length);
console.log('Exercises missing name:', exNoName.length);
console.log('Foods missing calories:', foodNoMacros.length);
