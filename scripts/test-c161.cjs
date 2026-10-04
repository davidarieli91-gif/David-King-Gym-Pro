/* c161 test — one curated food database.
   Data audit: every product has its own local photo (unique hash), calories,
   three names; USDA gone; images ≤400px in budget; badges present; the OFF
   category/subcategory mapping rules behave. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const root = path.join(__dirname, '..');
const trainer = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const db = JSON.parse(fs.readFileSync(path.join(root, 'food-db.json'), 'utf8'));
const imgDir = path.join(root, 'food-images');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }
function eq(name, got, want) { const g = JSON.stringify(got), w = JSON.stringify(want); if (g === w) { pass++; console.log('PASS ' + name + ' = ' + g); } else { fail++; console.log('FAIL ' + name + ' got ' + g + ' want ' + w); } }

const CATEGORIES = ['bakery', 'dairy', 'meat', 'fish', 'fruit', 'vegetable', 'legumes', 'grains', 'nuts', 'greens', 'vegan', 'sauces', 'sweets', 'drinks', 'israeli', 'international', 'oils', 'eggs', 'protein', 'baby', 'other'];

(async function () {
  /* ---------- 1. set size + integrity ---------- */
  ok('curated set is 1000–1400 products (' + db.length + ')', db.length >= 1000 && db.length <= 1400);
  ok('USDA_SR_Legacy fully gone', db.every((f) => f.source !== 'USDA_SR_Legacy'));
  ok('every product has 3 names', db.every((f) => f.name_en && f.name_ru && f.name_he));
  ok('every product has calories > 0', db.every((f) => Number((f.nutrition || {}).calories) > 0));
  ok('every product has an image_url', db.every((f) => !!f.image_url));
  ok('every category is canonical', db.every((f) => CATEGORIES.indexOf(f.category) >= 0));
  const badSub = db.filter((f) => f.sub && !/^[a-z][a-z-]{1,20}$/.test(f.sub));
  ok('subcategories are clean labels (' + badSub.length + ' bad)', badSub.length === 0);

  /* ---------- 2. images: one per product, unique, ≤400px, in budget ---------- */
  const files = fs.readdirSync(imgDir).filter((f) => /\.jpg$/i.test(f));
  const ids = new Set(db.map((f) => f.id));
  ok('no orphan images (' + files.length + ' files / ' + db.length + ' products)', files.length === db.length && files.every((f) => ids.has(f.replace(/\.jpg$/i, ''))));
  const hashes = new Map();
  let maxDim = 0, totalBytes = 0, badMagic = 0;
  for (const f of files) {
    const p = path.join(imgDir, f);
    const b = fs.readFileSync(p);
    totalBytes += b.length;
    if (!(b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF)) badMagic++;
    const m = await sharp(p).metadata();
    const d = Math.max(m.width || 0, m.height || 0);
    if (d > maxDim) maxDim = d;
    const h = crypto.createHash('md5').update(b).digest('hex');
    hashes.set(h, (hashes.get(h) || 0) + 1);
  }
  ok('all files are real JPEGs', badMagic === 0);
  ok('every image ≤ 400px (max ' + maxDim + ')', maxDim <= 400);
  const dups = [...hashes.values()].filter((v) => v > 1).length;
  ok('image hashes are UNIQUE across products (dup groups ' + dups + ')', dups === 0);
  ok('mirror stays compact < 60 MB (' + (totalBytes / 1048576).toFixed(1) + ' MB)', totalBytes < 60 * 1048576);
  const failures = JSON.parse(fs.readFileSync(path.join(imgDir, 'failures.json'), 'utf8'));
  ok('failures.json exists and is empty', Array.isArray(failures) && failures.length === 0);

  /* ---------- 3. badges + smart grouping from OFF ---------- */
  const grade = (v) => typeof v === 'string' && /^[a-e]$/.test(v);
  const nutri = db.filter((f) => grade(f.nutri)).length;
  const eco = db.filter((f) => grade(f.eco)).length;
  const nova = db.filter((f) => Number(f.nova) >= 1 && Number(f.nova) <= 4).length;
  const forest = db.filter((f) => f.forest === 'none' || f.forest === 'risk').length;
  console.log('badges — nutri ' + nutri + ', eco ' + eco + ', nova ' + nova + ', forest ' + forest);
  ok('Nutri-Score present on the barcoded mass (' + nutri + ' ≥ 450)', nutri >= 450);
  ok('NOVA present (' + nova + ' ≥ 380)', nova >= 380);
  ok('Green-Score present (' + eco + ' ≥ 360)', eco >= 360);
  ok('forest (palm oil) flag present (' + forest + ' ≥ 450)', forest >= 450);
  const subbed = db.filter((f) => f.sub).length;
  ok('subcategory assigned to most products (' + subbed + ' ≥ 700)', subbed >= 700);
  const other = db.filter((f) => f.category === 'other').length;
  console.log('category "other" after remap: ' + other);
  ok('smart remap shrank "other" (≤ 130)', other <= 130);

  /* ---------- 4. mapping rules (unit) ---------- */
  const src = fs.readFileSync(path.join(root, 'scripts', 'enrich-food-db.cjs'), 'utf8');
  function extractArr(name) {
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
  const CAT_RULES = new Function('return (' + extractArr('CAT_RULES') + ')')();
  const SUB_RULES = new Function('return (' + extractArr('SUB_RULES') + ')')();
  const NAME_SUB = new Function('return (' + extractArr('NAME_SUB') + ')')();
  const mapRules = (text, rules) => {
    const t = String(text || '').toLowerCase();
    for (const [key, kws] of rules) for (const k of kws) if (t.includes(k)) return key;
    return null;
  };
  eq('dairy tags → dairy', mapRules('en:dairies en:cheeses', CAT_RULES), 'dairy');
  eq('vegetables → vegetable', mapRules('en:plant-based-foods en:vegetables en:tomatoes', CAT_RULES), 'vegetable');
  eq('leaf vegetables → greens', mapRules('en:leaf-vegetables en:spinach', CAT_RULES), 'greens');
  eq('waters → drinks', mapRules('en:beverages en:waters', CAT_RULES), 'drinks');
  eq('poultry → meat', mapRules('en:meats en:poultries', CAT_RULES), 'meat');
  eq('fishes → fish', mapRules('en:seafood en:fishes', CAT_RULES), 'fish');
  eq('breads → bakery', mapRules('en:breads en:white-breads', CAT_RULES), 'bakery');
  eq('cereals → grains', mapRules('en:cereals-and-their-products', CAT_RULES), 'grains');
  eq('chocolate → sweets', mapRules('en:chocolates en:sweet-snacks', CAT_RULES), 'sweets');
  eq('cheeses sub', mapRules('en:cheeses', SUB_RULES), 'cheeses');
  eq('yogurts sub', mapRules('en:yogurts', SUB_RULES), 'yogurts');
  eq('poultry sub', mapRules('en:poultries', SUB_RULES), 'poultry');
  eq('breakfast cereals sub', mapRules('en:breakfast-cereals', SUB_RULES), 'cereals');
  eq('hebrew name fallback → cheeses', mapRules('גבינה לבנה', NAME_SUB), 'cheeses');
  eq('russian name fallback → rices', mapRules('рис круглозерный', NAME_SUB), 'rices');

  /* ---------- 5. seeding migration + versions ---------- */
  ok('seed flag bumped to v55 (both places)', trainer.indexOf("const flagKey = 'seeded_food_db_v55';") >= 0 && trainer.indexOf("'seeded_food_db_v55']") >= 0 && trainer.indexOf('seeded_food_db_v54') < 0);
  ok('sw cache at least v188', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 188; })());
  ok('RUNNING / dk-build at least c161', (function () {
    const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
    return !!r && !!b && Number(r[1]) >= 161 && Number(b[1]) >= 161;
  })());

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('FAIL suite crashed: ' + (e && e.message)); process.exit(1); });
