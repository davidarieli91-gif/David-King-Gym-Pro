/* c161: curate the merged food database into ONE quality set.
   Rules (user-approved):
     • one product per UNIQUE image (the merged DB had one photo shared by up
       to 159 products), keep the best of each group;
     • calories must be > 0;
     • USDA_SR_Legacy is dropped entirely — its images were fuzzy-matched to
       OTHER products (wrong pictures);
     • removed products and their files are deleted completely (no archive).
   Output: a rewritten food-db.json + food-images cleaned of orphans.
   Run: node scripts/curate-food-db.cjs [--dry] */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const dbPath = path.join(root, 'food-db.json');
const imgDir = path.join(root, 'food-images');
const DRY = process.argv.includes('--dry');

const SOURCE_RANK = { FoodsDictionary_IL: 0, OpenFoodFacts_IL: 1, OpenFoodFacts_Global: 2 };

function imgHash(id) {
  const p = path.join(imgDir, id + '.jpg');
  if (!fs.existsSync(p)) return null;
  const b = fs.readFileSync(p);
  return { h: crypto.createHash('md5').update(b).digest('hex'), size: b.length };
}

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const validKcal = (f) => Number((f.nutrition || {}).calories) > 0;
const nutritionScore = (f) => Object.keys(f.nutrition || {}).length;
const nameQuality = (f) => {
  const n = String(f.name_en || f.name_ru || f.name_he || '');
  return /^[A-Za-z0-9\s\-,'%().]+$/.test(n) ? 0 : 1; /* prefer latin/clean names */
};

const groups = new Map(); /* hash → best item */
let droppedNoFile = 0, droppedNoKcal = 0, droppedUsda = 0, droppedDup = 0;

for (const f of db) {
  if (f.source === 'USDA_SR_Legacy') { droppedUsda++; continue; }
  const hi = imgHash(f.id);
  if (!hi) { droppedNoFile++; continue; }
  if (!validKcal(f)) { droppedNoKcal++; continue; }
  const cur = groups.get(hi.h);
  if (!cur) { groups.set(hi.h, { f, size: hi.size }); continue; }
  droppedDup++;
  /* keep the better product of the same-photo group */
  const a = cur.f, b = f;
  const better =
    (SOURCE_RANK[a.source] ?? 9) - (SOURCE_RANK[b.source] ?? 9) ||
    nutritionScore(b) - nutritionScore(a) ||
    nameQuality(a) - nameQuality(b) ||
    String(a.name_en || '').length - String(b.name_en || '').length;
  if (better > 0) groups.set(hi.h, { f: b, size: hi.size });
}

const kept = [...groups.values()].map((g) => g.f);
const keptIds = new Set(kept.map((f) => f.id));

/* clean images: keep exactly the winners' files */
const removedFiles = [];
if (fs.existsSync(imgDir)) {
  for (const file of fs.readdirSync(imgDir)) {
    if (!/\.jpg$/i.test(file)) continue;
    const id = file.replace(/\.jpg$/i, '');
    if (!keptIds.has(id)) removedFiles.push(file);
  }
}

const perSrc = {}, perCat = {};
for (const f of kept) {
  perSrc[f.source] = (perSrc[f.source] || 0) + 1;
  perCat[f.category || 'none'] = (perCat[f.category || 'none'] || 0) + 1;
}
console.log('kept ' + kept.length + ' of ' + db.length);
console.log('dropped — USDA ' + droppedUsda + ', no image file ' + droppedNoFile + ', no calories ' + droppedNoKcal + ', duplicate photo ' + droppedDup);
console.log('by source ' + JSON.stringify(perSrc));
console.log('by category ' + JSON.stringify(perCat));
console.log('image files to delete ' + removedFiles.length);

if (DRY) { console.log('DRY RUN — nothing written'); process.exit(0); }

fs.writeFileSync(dbPath, JSON.stringify(kept), 'utf8');
let bytes = 0;
for (const file of removedFiles) {
  const p = path.join(imgDir, file);
  bytes += fs.statSync(p).size;
  fs.unlinkSync(p);
}
console.log('wrote food-db.json (' + (fs.statSync(dbPath).size / 1048576).toFixed(2) + ' MB), removed ' + (bytes / 1048576).toFixed(1) + ' MB of orphan images');
