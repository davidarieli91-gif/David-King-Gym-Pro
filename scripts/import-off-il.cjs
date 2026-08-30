// Importer: expands food-db.json with Israeli products from Open Food Facts.
// Usage: node scripts/import-off-il.cjs [--max 60000] [--min-nutrients 1]
// Output: rewrites food-db.json (backup created as food-db.backup.json)
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DB_PATH = path.join(ROOT, 'food-db.json');
const BACKUP_PATH = path.join(ROOT, 'food-db.backup.json');
const BASE = 'https://il.openfoodfacts.org/api/v2/search';

const args = process.argv.slice(2);
const getArg = (name, def) => { const i = args.indexOf(name); return i !== -1 ? (args[i+1] || def) : def; };
const MAX_TOTAL = parseInt(getArg('--max', '60000'), 10);
const PAGE_SIZE = 1000;

const CAT_MAP = {
  'en:beverages':'drinks','en:dairies':'dairy','en:meats':'meat','en:meals':'other',
  'en:fruits':'fruit','en:vegetables':'vegetable','en:snacks':'sweets','en:sweets':'sweets',
  'en:breads':'bakery','en:baking':'bakery','en:fats':'oils','en:sauces':'sauces',
  'en:fish':'fish','en:seafood':'fish','en:eggs':'eggs','en:nuts':'nuts',
  'en:legumes':'legumes','en:cereals':'grains','en:cereals-and-potatoes':'grains',
  'en:frozen-foods':'other','en:canned-foods':'other','en:condiments':'sauces',
  'en:desserts':'sweets','en:cheeses':'dairy','en:milks':'dairy','en:yogurts':'dairy',
  'en:plant-based-foods':'vegan','en:baby-foods':'baby','en:groceries':'other',
  'en:spreads':'sauces','en:breakfasts':'grains','en:dried-products':'other',
  'en:chicken':'meat','en:beef':'meat','en:pork':'meat','en:turkey':'meat',
  'en:olive-oils':'oils','en:cooking-helpers':'other','en:salty-snacks':'sweets',
  'en:appetizers':'other','en:fruits-and-vegetables-based-foods':'vegetable'
};

function mapCategory(tags){
  if(!Array.isArray(tags)) return 'other';
  for(const t of tags){ if(CAT_MAP[t]) return CAT_MAP[t]; }
  return 'other';
}
function num(v){ const n=parseFloat(v); return isFinite(n)&&n>=0 ? Math.round(n*100)/100 : undefined; }

function toFood(p){
  const n = p.nutriments || {};
  const kcal = num(n['energy-kcal_100g']) ?? (n['energy_100g'] ? Math.round(n['energy_100g']/4.184) : undefined);
  if(kcal == null && n.proteins_100g == null) return null; // no nutrition data at all
  const barcode = p.code || '';
  const nameHe = (p.product_name_he || '').trim();
  const nameEn = (p.product_name || '').trim();
  if(!nameHe && !nameEn) return null;
  const cats = mapCategory(p.categories_tags);
  return {
    id: 'off2_' + barcode,
    name_he: nameHe || nameEn,
    name_en: nameEn || nameHe,
    name_ru: (p.product_name_ru || nameEn || nameHe),
    source: 'OpenFoodFacts_IL',
    category: cats,
    image_url: p.image_front_url || '',
    barcode,
    brand: p.brands || '',
    nutrition: {
      calories: kcal ?? 0,
      protein: num(n['proteins_100g']) ?? 0,
      carbs: num(n['carbohydrates_100g']) ?? 0,
      fat: num(n['fat_100g']) ?? 0,
      ...(num(n['fiber_100g'])!=null ? {fiber:num(n['fiber_100g'])} : {}),
      ...(num(n['sugars_100g'])!=null ? {sugars:num(n['sugars_100g'])} : {}),
      ...(num(n['sodium_100g'])!=null ? {sodium:Math.round(num(n['sodium_100g'])*1000)} : {}),
      ...(num(n['saturated-fat_100g'])!=null ? {saturated_fat:num(n['saturated-fat_100g'])} : {})
    },
    serving_quantity: num(p.serving_quantity) || undefined,
    package_grams: num(p.quantity && parseFloat(String(p.quantity).replace(',','.'))) || undefined
  };
}

async function fetchPage(page){
  const fields = 'code,product_name,product_name_he,product_name_ru,brands,categories_tags,image_front_url,nutriments,serving_quantity,quantity';
  const url = `${BASE}?countries_tags=israel&fields=${encodeURIComponent(fields)}&page_size=${PAGE_SIZE}&page=${page}&json=1`;
  for(let attempt=1; attempt<=3; attempt++){
    try{
      const res = await fetch(url, { headers: { 'User-Agent': 'DavidKingGym-CRM/1.0 (nutrition db import)' } });
      if(!res.ok) throw new Error('HTTP '+res.status);
      return await res.json();
    }catch(e){
      console.log(`  page ${page} attempt ${attempt} failed: ${e.message}`);
      if(attempt===3) return null;
      await new Promise(r=>setTimeout(r, 2000*attempt));
    }
  }
  return null;
}

(async()=>{
  const existing = JSON.parse(fs.readFileSync(DB_PATH,'utf8'));
  if(!fs.existsSync(BACKUP_PATH)) fs.writeFileSync(BACKUP_PATH, JSON.stringify(existing));
  const byId = new Map(existing.map(f=>[f.id,f]));
  const knownBarcodes = new Set(existing.filter(f=>f.barcode).map(f=>f.barcode));
  console.log(`Existing: ${existing.length} foods. Fetching OFF Israel...`);

  let page = 1, added = 0, skippedDup = 0, skippedBad = 0, empty = 0;
  const t0 = Date.now();
  while(added + skippedDup < MAX_TOTAL){
    const j = await fetchPage(page);
    if(!j || !Array.isArray(j.products)){ console.log('stop: fetch failed'); break; }
    if(!j.products.length){ empty++; if(empty>=2) break; page++; continue; }
    for(const p of j.products){
      const f = toFood(p);
      if(!f){ skippedBad++; continue; }
      if(byId.has(f.id) || (f.barcode && knownBarcodes.has(f.barcode))){ skippedDup++; continue; }
      byId.set(f.id, f); if(f.barcode) knownBarcodes.add(f.barcode);
      added++;
      if(added >= MAX_TOTAL) break;
    }
    if(page % 10 === 0) console.log(`  page ${page}: total ${byId.size} (+${added} new, ${skippedDup} dup, ${skippedBad} no-data, ${(Date.now()-t0)/1000|0}s)`);
    page++;
    await new Promise(r=>setTimeout(r, 350)); // be polite to OFF
    if(added >= MAX_TOTAL) break;
  }

  const out = Array.from(byId.values());
  fs.writeFileSync(DB_PATH, JSON.stringify(out));
  console.log(`DONE. food-db.json now has ${out.length} foods (+${added} imported, ${skippedDup} duplicates skipped, ${skippedBad} without nutrition)`);
})().catch(e=>{ console.error('FATAL', e); process.exit(1); });
