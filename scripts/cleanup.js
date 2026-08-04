// DK Gym — Data Cleanup (Phase 3)
const fs = require('fs');

// ---------- 1. Канонические ключи оборудования ----------
const EQUIP_MERGE = {
  dumbbells: 'dumbbell',
  kettlebells: 'kettlebell',
  bands: 'band',
  'ez-bar': 'ez_bar'
};

const exercises = JSON.parse(fs.readFileSync('exercise-db.json', 'utf8'));
const equipChanges = {};
let equipFixed = 0;

for (const x of exercises) {
  const cur = x.e || x.equipment || x.equipment_type;
  if (!cur || !EQUIP_MERGE[cur]) continue;
  const target = EQUIP_MERGE[cur];
  if ('e' in x) x.e = target;
  if ('equipment' in x) x.equipment = target;
  if ('equipment_type' in x) x.equipment_type = target;
  if (Array.isArray(x.folder_path) && x.folder_path.length >= 3) x.folder_path[2] = target;
  if (Array.isArray(x.folder) && x.folder.length >= 3) x.folder[2] = target;
  equipFixed++;
  const k = cur + ' -> ' + target;
  equipChanges[k] = (equipChanges[k] || 0) + 1;
}
fs.writeFileSync('exercise-db.json', JSON.stringify(exercises));

// ---------- 2. Дедупликация продуктов (мягкий архив) ----------
const foods = JSON.parse(fs.readFileSync('food-db.json', 'utf8'));
const byName = {};
for (const f of foods) {
  if (f.is_archived) continue;
  const key = String(f.name_en || f.name_he || '').toLowerCase().trim();
  if (!key) continue;
  (byName[key] = byName[key] || []).push(f);
}

function richness(f) {
  const n = f.nutrition || {};
  let s = Object.keys(n).filter((k) => n[k] !== 0 && n[k] !== null && n[k] !== '').length;
  if (f.image_url) s += 50;
  if (f.barcode) s += 10;
  return s;
}

const archivedFoods = [];
for (const [name, arr] of Object.entries(byName)) {
  if (arr.length < 2) continue;
  arr.sort((a, b) => richness(b) - richness(a));
  for (let i = 1; i < arr.length; i++) {
    arr[i].is_archived = true;
    arr[i].archived_at = Date.now();
    arr[i].archived_reason = 'duplicate-name-cleanup-phase3';
    archivedFoods.push({ name: name, kept: arr[0].id, archived: arr[i].id });
  }
}
fs.writeFileSync('food-db.json', JSON.stringify(foods));

// ---------- 3. Отчёт ----------
fs.mkdirSync('reports', { recursive: true });
const lines = [];
lines.push('# Cleanup Report (Phase 3)');
lines.push('');
lines.push('**Generated:** ' + new Date().toISOString());
lines.push('');
lines.push('## Equipment canonicalization (' + equipFixed + ' exercises)');
for (const [k, v] of Object.entries(equipChanges)) lines.push('- ' + k + ': ' + v + ' records');
lines.push('');
lines.push('## Foods archived as duplicates (' + archivedFoods.length + ')');
for (const r of archivedFoods) lines.push('- "' + r.name + '" kept `' + r.kept + '`, archived `' + r.archived + '`');
lines.push('');
fs.writeFileSync('reports/cleanup-report.md', lines.join('\n'));

console.log('=== CLEANUP COMPLETE ===');
console.log('Equipment records fixed:', equipFixed);
console.log(JSON.stringify(equipChanges));
console.log('Foods archived:', archivedFoods.length);
