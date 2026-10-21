const fs = require('fs');
const db = JSON.parse(fs.readFileSync('exercise-db.json', 'utf8'));
const norm = s => String(s || '')
  .toLowerCase()
  .replace(/\([^)]*version[^)]*\)/g, '')
  .replace(/\([^)]*\)/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();
const byName = new Map();
for (const r of db) {
  const k = norm(r.nE);
  if (!k) continue;
  if (!byName.has(k)) byName.set(k, []);
  byName.get(k).push(r);
}
const candidates = [];
for (const [k, rows] of byName) {
  if (rows.length < 2) continue;
  const groups = [...new Set(rows.map(r => String(r.g || '').toLowerCase()))];
  if (groups.length > 1) {
    candidates.push({ name: k, groups, rows: rows.map(r => ({ id: r.id, src: r.src, g: r.g, gE: r.gE, s: r.s, sE: r.sE, nR: r.nR, syn: r.synergists })) });
  }
}
candidates.sort((a, b) => b.rows.length - a.rows.length);
console.log('duplicate name groups with different primary:', candidates.length);
for (const c of candidates.slice(0, 80)) {
  console.log('\n### ' + c.name + ' -> ' + c.groups.join(' / '));
  for (const r of c.rows) console.log(JSON.stringify(r));
}
