/* c161: enrich the curated food DB from OpenFoodFacts (by barcode):
     • nutri — official Nutri-Score grade (a–e)
     • eco   — Green-Score (ecoscore_grade)
     • nova  — processing level (1–4)
     • forest — 'none' when the product is palm-oil-free, 'risk' otherwise
     • category — REMAPPED from the real OFF categories_tags to our canonical
       categories (the smart grouping), keeping the old one when nothing matches
     • sub — a second level (cheeses, yogurts, poultry, breads, …) from OFF tags
       with a name-keyword fallback for products without a barcode
   Resume-safe: results are cached in scripts/food-enrich-cache.json; the cache
   is deleted after a fully successful run. Run:
     node scripts/enrich-food-db.cjs [--limit N] */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dbPath = path.join(root, 'food-db.json');
const cachePath = path.join(__dirname, 'food-enrich-cache.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const LIMIT = (() => { const i = process.argv.indexOf('--limit'); return i > 0 ? parseInt(process.argv[i + 1], 10) : 0; })();

const CAT_RULES = [
  ['drinks', ['water', 'beverage', 'juice', 'soda', 'coffee', 'tea', 'drink', 'smoothie', 'beer', 'wine', 'spirit', 'kombucha', 'lemonade']],
  ['baby', ['baby', 'infant', 'toddler']],
  ['dairy', ['dairy', 'cheese', 'yogurt', 'milk', 'butter', 'cream', 'kefir', 'quark', 'custard']],
  ['eggs', ['egg']],
  ['meat', ['meat', 'poultr', 'chicken', 'beef', 'pork', 'turkey', 'lamb', 'sausage', 'ham', 'bacon', 'salami', 'hot-dog', 'burger']],
  ['fish', ['seafood', 'fish', 'salmon', 'tuna', 'shrimp', 'sardine', 'mackerel', 'anchovy', 'herring', 'cod', 'crab', 'lobster', 'mussel', 'oyster', 'squid']],
  ['legumes', ['legume', 'pulse', 'bean', 'lentil', 'chickpea', 'peas', 'soy', 'tofu', 'hummus', 'falafel']],
  ['nuts', ['nut', 'almond', 'walnut', 'cashew', 'pistachio', 'peanut', 'hazelnut', 'seed', 'tahini', 'sesame']],
  ['oils', ['oil', 'margarine', 'ghee', 'lard']],
  ['grains', ['cereal', 'grain', 'rice', 'pasta', 'noodle', 'oat', 'quinoa', 'buckwheat', 'couscous', 'flour', 'semolina', 'barley', 'millet']],
  ['bakery', ['bread', 'bakery', 'viennoiserie', 'pastr', 'croissant', 'biscuit', 'cookie', 'cake', 'pie', 'cracker', 'brioche', 'dough']],
  ['sweets', ['sweet', 'chocolate', 'candy', 'confection', 'dessert', 'ice-cream', 'honey', 'jam', 'sugar', 'syrup', 'snack']],
  ['greens', ['leaf', 'lettuce', 'spinach', 'herb', 'arugula', 'celery', 'kale', 'salad']],
  ['vegetable', ['vegetable', 'tomato', 'potato', 'carrot', 'onion', 'cucumber', 'pepper', 'corn', 'pumpkin', 'zucchini', 'beet', 'mushroom', 'eggplant', 'avocado']],
  ['fruit', ['fruit', 'apple', 'banana', 'orange', 'berr', 'grape', 'mango', 'peach', 'pear', 'melon', 'citrus', 'dates', 'fig', 'pomegranate']],
  ['sauces', ['sauce', 'condiment', 'spice', 'season', 'dressing', 'ketchup', 'mustard', 'mayonnaise', 'vinegar', 'stock', 'broth', 'soup']],
  ['vegan', ['vegan', 'vegetarian', 'plant-based']]
];
const SUB_RULES = [
  ['cheeses', ['cheese']], ['yogurts', ['yogurt']], ['milks', ['milk']], ['butter', ['butter']], ['creams', ['cream']],
  ['poultry', ['poultr', 'chicken', 'turkey']], ['beef', ['beef']], ['pork', ['pork', 'ham', 'bacon']], ['sausages', ['sausage', 'salami', 'hot-dog']],
  ['fish', ['fish', 'salmon', 'tuna', 'cod', 'herring', 'sardine', 'anchovy', 'mackerel']], ['seafood', ['seafood', 'shrimp', 'crab', 'lobster', 'mussel', 'oyster', 'squid']],
  ['breads', ['bread']], ['pastas', ['pasta', 'noodle']], ['rices', ['rice']], ['cereals', ['cereal', 'oat', 'breakfast']],
  ['chocolates', ['chocolate']], ['candies', ['candi', 'confection']], ['biscuits', ['biscuit', 'cookie', 'cracker']], ['cakes', ['cake', 'pastr', 'viennoiserie']], ['icecream', ['ice-cream']],
  ['olive-oil', ['olive-oil', 'olive oil']], ['vegetable-oils', ['vegetable-oil', 'oil']],
  ['nuts', ['nut']], ['seeds', ['seed']],
  ['waters', ['water']], ['juices', ['juice']], ['sodas', ['soda', 'cola']], ['coffees', ['coffee']], ['teas', ['tea']]
];
const NAME_SUB = [
  ['cheeses', ['cheese', 'גבינה', 'сыр']], ['yogurts', ['yogurt', 'יוגורט', 'йогурт']], ['milks', ['milk', 'חלב', 'молоко']],
  ['butter', ['butter', 'חמאה', 'масло слив']], ['creams', ['cream', 'שמנת', 'сливк']],
  ['poultry', ['chicken', 'עוף', 'куриц', 'turkey', 'הודו', 'индейк']], ['beef', ['beef', 'בקר', 'говядин']], ['pork', ['pork', 'חזיר', 'свинин']],
  ['fish', ['fish', 'דג', 'рыба', 'salmon', 'סלמון', 'лосос']], ['seafood', ['shrimp', 'שרימפ', 'креветк', 'tuna', 'טונה', 'тунец']],
  ['breads', ['bread', 'לחם', 'хлеб']], ['rices', ['rice', 'אורז', 'рис']], ['pastas', ['pasta', 'פסטה', 'макарон']], ['cereals', ['oat', 'שיבולת', 'овсян', 'cereal', 'גרנולה', 'granola']],
  ['chocolates', ['chocolate', 'שוקולד', 'шоколад']], ['biscuits', ['cookie', 'עוגי', 'печень', 'cracker', 'קרקר', 'крекер']], ['cakes', ['cake', 'עוגה', 'торт', 'ביסקוויט']],
  ['icecream', ['ice cream', 'גלידה', 'мороженое']],
  ['oils', ['oil', 'שמן', 'масло']], ['nuts', ['nut', 'אגוז', 'орех', 'almond', 'שקד', 'миндаль']],
  ['eggs', ['eggs', 'egg ', 'ביצ', 'яйц', 'חלמון']],
  ['waters', ['water', 'מים', 'вода']], ['juices', ['juice', 'מיץ', 'сок']], ['coffees', ['coffee', 'קפה', 'кофе']], ['teas', ['tea', 'תה', 'чай']]
];

function mapByRules(text, rules) {
  const t = String(text || '').toLowerCase();
  if (!t) return null;
  for (const [key, kws] of rules) { for (const k of kws) if (t.includes(k)) return key; }
  return null;
}
function offCategory(tags) { return mapByRules((tags || []).join(' '), CAT_RULES); }
function offSub(tags) { return mapByRules((tags || []).join(' '), SUB_RULES); }
function nameSub(f) {
  const names = ((f.name_en || '') + ' ' + (f.name_ru || '') + ' ' + (f.name_he || '')).toLowerCase();
  return mapByRules(names, NAME_SUB);
}
function grade(v) { const s = String(v || '').toLowerCase(); return /^[a-e]$/.test(s) ? s : null; }

const cache = fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath, 'utf8')) : {};
let fetched = 0, fromCache = 0, failed = 0, waits429 = 0;
const argNum = (name, dflt) => { const i = process.argv.indexOf(name); return i > 0 ? parseInt(process.argv[i + 1], 10) : dflt; };
const WORKERS = Math.max(1, argNum('--workers', 1));
const DELAY_MS = Math.max(0, argNum('--delay', 1500));

async function fetchBarcode(barcode, attempt) {
  const url = 'https://world.openfoodfacts.org/api/v2/product/' + encodeURIComponent(barcode) +
    '.json?fields=code,nutriscore_grade,nova_group,ecoscore_grade,categories_tags,ingredients_analysis_tags';
  const res = await fetch(url, { headers: { 'User-Agent': 'DavidKingGym/1.0 (personal fitness app; contact: trainer)' } });
  if (res.status === 429) {
    waits429++;
    const ra = parseInt(res.headers.get('retry-after'), 10);
    const wait = (isFinite(ra) && ra > 0 ? ra * 1000 : 20000 * (attempt || 1)) + Math.floor(Math.random() * 3000);
    if (waits429 % 10 === 1) console.log('429 — waiting ' + Math.round(wait / 1000) + 's (till now ' + waits429 + ' waits)');
    await new Promise((r) => setTimeout(r, wait));
    if ((attempt || 1) >= 6) throw new Error('HTTP 429');
    return fetchBarcode(barcode, (attempt || 1) + 1);
  }
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const j = await res.json();
  return j && j.status === 1 ? j.product : null;
}

(async () => {
  let targets = db.filter((f) => f.barcode);
  if (LIMIT > 0) targets = targets.slice(0, LIMIT);
  console.log('products with barcode: ' + targets.length);
  /* workers fetch into the cache */
  let idx = 0;
  async function worker() {
    while (idx < targets.length) {
      const f = targets[idx++];
      const bc = String(f.barcode);
      if (cache[bc]) { fromCache++; continue; }
      try {
        const p = await fetchBarcode(bc, 1);
        if (p) {
          cache[bc] = {
            nutri: grade(p.nutriscore_grade),
            nova: (Number(p.nova_group) >= 1 && Number(p.nova_group) <= 4) ? Number(p.nova_group) : null,
            eco: grade(p.ecoscore_grade),
            palm: Array.isArray(p.ingredients_analysis_tags) ? (p.ingredients_analysis_tags.some((x) => /palm-oil-free/.test(x)) ? 'free' : (p.ingredients_analysis_tags.some((x) => /palm-oil(?!-free)/.test(x)) ? 'has' : null)) : null,
            tags: Array.isArray(p.categories_tags) ? p.categories_tags.slice(0, 12) : []
          };
        } else {
          cache[bc] = { empty: true };
        }
        fetched++;
      } catch (e) {
        failed++;
        if (failed <= 5) console.log('FAIL ' + bc + ': ' + (e && e.message));
      }
      if ((fetched + fromCache + failed) % 25 === 0) {
        console.log('progress ' + (fetched + fromCache + failed) + '/' + targets.length + ' (fetched ' + fetched + ', cache ' + fromCache + ', failed ' + failed + ')');
        fs.writeFileSync(cachePath, JSON.stringify(cache), 'utf8');
      }
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }
  await Promise.all(Array.from({ length: WORKERS }, worker));
  fs.writeFileSync(cachePath, JSON.stringify(cache), 'utf8');

  /* apply to the DB */
  let nutri = 0, eco = 0, nova = 0, forest = 0, recat = 0, subbed = 0;
  for (const f of db) {
    const c = f.barcode && cache[String(f.barcode)];
    if (c && !c.empty) {
      if (c.nutri) { f.nutri = c.nutri; nutri++; }
      if (c.eco) { f.eco = c.eco; eco++; }
      if (c.nova) { f.nova = c.nova; nova++; }
      if (c.palm === 'free') { f.forest = 'none'; forest++; }
      else if (c.palm === 'has') { f.forest = 'risk'; forest++; }
      const cat = offCategory(c.tags);
      if (cat && cat !== f.category) { f.category = cat; recat++; }
      const sub = offSub(c.tags);
      if (sub) { f.sub = sub; subbed++; }
    }
    if (!f.sub) { const s = nameSub(f); if (s) { f.sub = s; subbed++; } }
  }
  fs.writeFileSync(dbPath, JSON.stringify(db), 'utf8');
  console.log('enrichment applied — nutri ' + nutri + ', eco ' + eco + ', nova ' + nova + ', forest ' + forest + ', recategorised ' + recat + ', sub ' + subbed);
  if (failed === 0 && LIMIT === 0) {
    try { fs.unlinkSync(cachePath); console.log('cache removed'); } catch (e) {}
  } else {
    console.log('NOTE: cache kept at scripts/food-enrich-cache.json (re-run to resume)');
  }
})().catch((e) => { console.error(e); process.exit(1); });
