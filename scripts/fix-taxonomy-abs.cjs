/* c185: apply the curated taxonomy corrections from taxonomy-fixes-c185.cjs.
   Dry-run by default:  node scripts/fix-taxonomy-abs.cjs
   Write:               node scripts/fix-taxonomy-abs.cjs --write
*/
const fs = require('fs');
const { GROUPS, SUBGROUPS, FIXES } = require('./taxonomy-fixes-c185.cjs');
const db = JSON.parse(fs.readFileSync('exercise-db.json', 'utf8'));
const write = process.argv.includes('--write');
const byId = new Map(db.map(r => [r.id, r]));
const changed = [];
const missing = [];

for (const fix of FIXES) {
  const r = byId.get(fix.id);
  if (!r) { missing.push(fix.id); continue; }
  const group = GROUPS[fix.group];
  const sub = SUBGROUPS[fix.sub];
  if (!group || !sub) throw new Error('bad taxonomy descriptor for ' + fix.id);
  const before = {
    id: r.id, src: r.src, g: r.g, s: r.sE || r.s,
    nE: r.nE, nR: r.nR, syn: (r.synergists || []).slice()
  };
  const dirty = r.g !== group.g || r.gE !== group.gE || r.gR !== group.gR || r.gH !== group.gH ||
    r.s !== sub.s || r.sE !== sub.sE || r.sR !== sub.sR || r.sH !== sub.sH ||
    JSON.stringify(r.synergists || []) !== JSON.stringify(fix.syn);
  if (!dirty) continue;
  Object.assign(r, group, sub);
  r.synergists = fix.syn.slice();
  changed.push({ cat: fix.cat, before, after: { g: r.g, s: r.sE, syn: r.synergists } });
}

const abs = changed.filter(c => c.cat === 'abs');
const other = changed.filter(c => c.cat === 'other');
console.log(`would change ${changed.length} (abs inversions ${abs.length}, other inversions ${other.length})`);
for (const c of changed) console.log(JSON.stringify(c));
if (missing.length) {
  console.error('MISSING IDS:', missing.join(', '));
  process.exitCode = 1;
}
if (write && changed.length) {
  fs.writeFileSync('exercise-db.json', JSON.stringify(db));
  console.log('WROTE exercise-db.json');
}
