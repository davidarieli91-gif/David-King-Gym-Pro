/* c169: fix misplaced products in food-db.json (high-precision, explicit list).
   Categories were audited by name (3 languages); only contradictions and
   clearly-wrong shelves are corrected here. */
const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, '..', 'food-db.json');
const items = JSON.parse(fs.readFileSync(p, 'utf8'));

const FIXES = [
  /* id, new category, new sub ('' = clear, null = keep) */
  ['fd_fd_7697608262698622', 'dairy', null, 'козье молоко было в веганском'],
  ['off_3760049794298', 'bakery', null, 'хлеб был в напитках'],
  ['off_8436547770137', 'dairy', null, 'кефир был в напитках'],
  ['off_5053990127740', 'sweets', '', 'Pringles были в напитках'],
  ['off_il_0038000845536', 'sweets', '', 'Pringles были в напитках'],
  ['fd_il_5247d2586fcab650', 'dairy', null, 'фета была в израильском'],
  ['off_il_7290114310536', 'dairy', null, 'йогурт был в сладком'],
  ['off_il_1901104321680', 'dairy', null, 'йогурт был в сладком'],
  ['off_il_7290119370177', 'dairy', null, 'йогурт был в сладком'],
  ['off_il_7290102393060', 'dairy', null, 'йогурт был в сладком'],
  ['off_il_7290100685136', 'sauces', '', 'суп-смесь был в крупах'],
  ['off_il_0077544528406', 'sauces', '', 'суп-смесь была в крупах'],
  ['off_il_7290000073767', 'grains', 'pastas', 'лапша была в соусах'],
  ['off_il_7296073226680', 'sweets', 'cereals', 'зерновой батончик: папка «рыба» → «злаки»']
];

const byId = {};
items.forEach((f) => { byId[f.id] = f; });
let changed = 0;
for (const [id, cat, sub, why] of FIXES) {
  const f = byId[id];
  if (!f) { console.log('MISSING ' + id + ' — ' + why); continue; }
  const before = f.category + '/' + (f.sub || '');
  f.category = cat;
  if (sub !== null) f.sub = sub;
  const after = f.category + '/' + (f.sub || '');
  if (before !== after) { changed++; console.log('FIX ' + (f.name_ru || f.name_en || id) + '  ' + before + ' → ' + after + '  (' + why + ')'); }
}
fs.writeFileSync(p, JSON.stringify(items), 'utf8');
console.log('\nchanged: ' + changed);

/* verify: vegan is now only plant milks */
const vegan = items.filter((f) => f.category === 'vegan');
console.log('vegan now: ' + vegan.map((f) => f.name_ru).join(', '));
