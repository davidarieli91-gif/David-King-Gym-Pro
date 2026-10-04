/* c169 audit (read-only): find products whose category contradicts their name. */
const fs = require('fs');
const path = require('path');
const db = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'food-db.json'), 'utf8'));
const items = Array.isArray(db) ? db : (db.items || db.foods || []);

const ANIMAL = [
  ['dairy', ['молоко', 'козье', 'коров', 'овеч', 'сыр', 'творог', 'йогурт', 'кефир', 'сметан', 'сливк', 'масло сливоч', 'milk', 'goat', 'cheese', 'yogurt', 'cottage', 'cream', 'butter', 'חלב', 'גבינ', 'יוגורט', 'שמנת', 'חמאה']],
  ['meat', ['мясо', 'куриц', 'куриная', 'куриное', 'говядин', 'свинин', 'баранин', 'индейк', 'фарш', 'колбас', 'сосиск', 'meat', 'chicken', 'beef', 'pork', 'turkey', 'sausage', 'עוף', 'בקר', 'חזיר', 'הודו']],
  ['fish', ['рыба', 'лосос', 'тунец', 'селед', 'сельд', 'fish', 'salmon', 'tuna', 'דג', 'סלמון', 'טונה']],
  ['eggs', ['яйц', 'яичн', 'egg', 'ביצ']]
];
const PLANT_ONLY_CATS = ['vegan', 'vegetable', 'fruit', 'greens', 'legumes', 'nuts', 'grains'];

function names(f) { return [f.name_ru, f.name_en, f.name_he].filter(Boolean).join(' ').toLowerCase(); }

const suspects = [];
for (const f of items) {
  const nm = names(f);
  if (!nm) continue;
  const cat = String(f.category || '');
  for (const [animalCat, kws] of ANIMAL) {
    const hit = kws.find((k) => nm.includes(k));
    if (hit) {
      if (PLANT_ONLY_CATS.includes(cat)) {
        suspects.push({ id: f.id, name: f.name_ru || f.name_en || f.name_he, cat, suggest: animalCat, why: hit });
      } else if (cat !== animalCat && cat !== 'protein' && cat !== 'other' && cat !== 'international') {
        suspects.push({ id: f.id, name: f.name_ru || f.name_en || f.name_he, cat, suggest: animalCat, why: hit + ' (мягкое)' });
      }
      break;
    }
  }
}
console.log('suspicious:', suspects.length);
for (const s of suspects.slice(0, 80)) console.log(s.cat.padEnd(12) + ' -> ' + s.suggest.padEnd(8) + ' [' + s.why + '] ' + s.name);

/* what exactly is vegan now? */
console.log('\n--- vegan items ---');
for (const f of items.filter((x) => x.category === 'vegan')) console.log(f.id, '|', f.name_ru, '|', f.name_en, '|', f.name_he);
