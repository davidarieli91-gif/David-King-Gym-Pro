#!/usr/bin/env node
// Merges ru/gi-desc-N.json | he-gi-desc-N.json batches ({idx: translation} over gi-sentences.json order) into exercise-db.json tRu/tHe (gi only, per-sentence, EN fallback).
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const which = process.argv[2] === 'he' ? 'he' : 'ru';
const field = which === 'he' ? 'tHe' : 'tRu';
const sentences = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'gi-sentences.json'), 'utf8'));
const TM = {};
const files = fs.readdirSync(path.join(ROOT, 'scripts')).filter(f => new RegExp(`^${which}-gi-desc-\\d+\\.json$`).test(f)).sort();
files.forEach(f => {
  const batch = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', f), 'utf8'));
  Object.entries(batch).forEach(([idx, tr]) => {
    const s = sentences[parseInt(idx, 10)];
    if (!s) { console.log('WARN bad idx ' + idx + ' in ' + f); return; }
    if (!tr || !String(tr).trim()) return;
    TM[s.en] = String(tr).trim();
  });
});
console.log(`batches: ${files.length} | TM entries (${which}): ${Object.keys(TM).length}`);
const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'exercise-db.json'), 'utf8'));
let full = 0, part = 0, none = 0;
const missing = {};
db.filter(x => x.src === 'gi').forEach(x => {
  const parts = String(x.t || '').split('|').map(s => s.trim()).filter(Boolean);
  const out = parts.map(t => {
    if (TM[t]) return TM[t];
    missing[t] = (missing[t] || 0) + 1;
    return t; // EN fallback for untranslated sentences
  });
  x[field] = out.join(' | ');
  const hit = parts.filter(s => TM[s]).length;
  if (parts.length && hit === parts.length) full++;
  else if (hit > 0) part++;
  else none++;
});
fs.writeFileSync(path.join(ROOT, 'exercise-db.json'), JSON.stringify(db, null, 1) + '\n');
console.log(`gi records fully ${which}: ${full} | partial: ${part} | EN-only: ${none}`);
const missArr = Object.entries(missing).sort((a, b) => b[1] - a[1]);
console.log('missing unique sentences:', missArr.length);
console.log('top missing:', missArr.slice(0, 5).map(([s, n]) => n + 'x ' + s.slice(0, 80)).join('\n'));
