#!/usr/bin/env node
// Merges he-desc-N.json batches ({idx: he} over gv-sentences.json order) into exercise-db.json tHe.
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const sentences = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'gv-sentences.json'), 'utf8'));
const TM = {};
fs.readdirSync(path.join(ROOT, 'scripts')).filter(f => /^he-desc-\d+\.json$/.test(f)).sort().forEach(f => {
  const batch = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', f), 'utf8'));
  Object.entries(batch).forEach(([idx, he]) => {
    const s = sentences[parseInt(idx, 10)];
    if (!s) { console.log('WARN bad idx ' + idx + ' in ' + f); return; }
    TM[s.en] = he;
  });
});
console.log('TM entries:', Object.keys(TM).length);
const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'exercise-db.json'), 'utf8'));
let full = 0, part = 0, none = 0, missing = {};
db.filter(x => x.src === 'gv').forEach(x => {
  const parts = x.t.split(' | ');
  const heParts = parts.map(s => {
    const t = s.trim();
    if (TM[t]) return TM[t];
    missing[t] = (missing[t] || 0) + 1;
    return t; // EN fallback for untranslated sentences
  });
  x.tHe = heParts.join(' | ');
  const hit = parts.filter(s => TM[s.trim()]).length;
  if (hit === parts.length) full++;
  else if (hit > 0) part++;
  else none++;
});
fs.writeFileSync(path.join(ROOT, 'exercise-db.json'), JSON.stringify(db, null, 1) + '\n');
console.log('records fully HE:', full, '| partial:', part, '| EN-only:', none);
const missArr = Object.entries(missing).sort((a, b) => b[1] - a[1]);
console.log('missing unique sentences:', missArr.length);
console.log('top missing:', missArr.slice(0, 10).map(([s, n]) => n + 'x ' + s).join('\n'));
