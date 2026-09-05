#!/usr/bin/env node
// Step 1: dry-run dedup report for GymVisual import.
// Compares exercises-dataset-main/data/exercises.json against exercise-db.json (nE).
// Output: reports/gv-dryrun.json { exact:[...], fuzzy:[{ds, ours, score}], fresh:[...] }
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DB_PATH = path.join(ROOT, 'exercise-db.json');
const DS_PATH = path.join(ROOT, 'exercises-dataset-main', 'data', 'exercises.json');
const OUT = path.join(ROOT, 'reports', 'gv-dryrun.json');

const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const toks = s => new Set(norm(s).split(' ').filter(w => w.length > 2));
function tokenScore(a, b) {
  const A = toks(a), B = toks(b);
  if (!A.size || !B.size) return 0;
  let inter = 0; for (const w of A) if (B.has(w)) inter++;
  return inter / Math.max(A.size, B.size);
}

const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
const ds = JSON.parse(fs.readFileSync(DS_PATH, 'utf8'));

const oursByNorm = new Map();
for (const x of db) {
  const n = norm(x.nE || '');
  if (!n) continue;
  if (!oursByNorm.has(n)) oursByNorm.set(n, []);
  oursByNorm.get(n).push({ id: x.id, src: x.src, nE: x.nE });
}

const exact = [], fuzzy = [], fresh = [];
for (const x of ds) {
  const n = norm(x.name);
  if (oursByNorm.has(n)) { exact.push({ dsId: x.id, name: x.name, ours: oursByNorm.get(n).map(o => o.id) }); continue; }
  // fuzzy: best token score against our names
  let best = null;
  for (const [on, list] of oursByNorm) {
    const s = tokenScore(x.name, list[0].nE || '');
    if (s >= 0.85 && (!best || s > best.score)) best = { score: +s.toFixed(2), ours: list[0].id, oursName: list[0].nE };
  }
  if (best) fuzzy.push({ dsId: x.id, name: x.name, ...best });
  else fresh.push({ dsId: x.id, name: x.name, category: x.category, equipment: x.equipment });
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ date: new Date().toISOString(), dsTotal: ds.length, exact, fuzzy, fresh }, null, 1));
console.log(`ds=${ds.length} exact=${exact.length} fuzzy=${fuzzy.length} fresh=${fresh.length}`);
console.log('report:', OUT);
