#!/usr/bin/env node
// Applies ru-gi-names-N.json / he-gi-names-N.json batches ({id, en, ru|he}) into exercise-db.json.
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const which = process.argv[2] === 'he' ? 'he' : 'ru';
const field = which === 'he' ? 'nH' : 'nR';
const files = fs.readdirSync(path.join(ROOT, 'scripts'))
  .filter(f => new RegExp(`^${which}-gi-names-\\d+\\.json$`).test(f)).sort();
const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'exercise-db.json'), 'utf8'));
const byId = {};
db.forEach(x => { byId[x.id] = x; });
let applied = 0, missing = 0;
files.forEach(f => {
  const batch = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', f), 'utf8'));
  batch.forEach(b => {
    if (!b[field === 'nH' ? 'he' : 'ru']) return;
    const x = byId[b.id];
    if (!x) { missing++; return; }
    x[field] = b[field === 'nH' ? 'he' : 'ru'];
    applied++;
  });
});
fs.writeFileSync(path.join(ROOT, 'exercise-db.json'), JSON.stringify(db, null, 1) + '\n');
console.log(`batches: ${files.length} | applied ${which}: ${applied} | missing ids: ${missing}`);
const gi = db.filter(x => x.src === 'gi');
const done = gi.filter(x => x[field] && x[field] !== x.nE).length;
console.log(`gi with real ${field}: ${done}/${gi.length}`);
