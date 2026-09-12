// c59 hinge-fix: RDL family → Hamstrings, pull-through/hip-hinge family → Glutes
// Trainer-biomechanics pass: hip hinge = posterior chain (never Quadriceps/Lats/Lower Back).
// Rules: RDL family → Hamstrings (user rule: румынская → бицепс бедра);
//        pull-through / generic hip hinge (deadlift pattern) → Glutes (user rule: становая → таз; ExRx: gluteus maximus).
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'exercise-db.json'), 'utf8'));

const LEGS = { g: 'legs', gE: 'Legs', gR: 'Ноги', gH: 'רגליים' };
const HAM = { s: 'Hamstrings', sE: 'Hamstrings', sR: 'Бицепс бедра', sH: 'המסטרינג' };
const GLU = { s: 'Glutes', sE: 'Glutes', sR: 'Ягодицы', sH: 'ישבן' };

// [id, newSubgroup, needGroupMove, note]
const FIXES = [
  ['gi_10047', HAM, false, 'RDL (split stance) = hip hinge → hamstrings'],
  ['gi_3652', HAM, false, 'RDL (trap bar, split stance) = hip hinge → hamstrings'],
  ['gi_3651', HAM, false, 'RDL death march (single-leg hinge) → hamstrings'],
  ['gi_4971', HAM, false, 'single-leg RDL = hip hinge → hamstrings'],
  ['bf_Good-morning', HAM, true, 'good morning = hip hinge → hamstrings (ExRx; was back/Lower Back)'],
  ['gi_3918', HAM, true, 'landmine single-leg RDL = hip hinge → hamstrings (was back/Lats)'],
  ['gi_1157', GLU, false, 'hip hinge drill (deadlift pattern) → glutes'],
  ['gi_4605', GLU, false, 'hip hinge drill (deadlift pattern) → glutes'],
  ['gi_2324', GLU, false, 'pull-through = hip extension → glutes'],
  ['gi_3352', GLU, false, 'pull-through = hip extension → glutes'],
  ['gi_5837', GLU, false, 'pull-through = hip extension → glutes'],
  ['gv_0196', GLU, false, 'pull-through = hip extension → glutes'],
  ['gv_0991', GLU, false, 'pull-through = hip extension → glutes'],
  ['gv_2808', GLU, false, 'pull-through = hip extension → glutes'],
  ['gi_1087', GLU, true, 'suspension pull-through = hip extension → glutes (was back/Lats)'],
  ['bf_cable-pull-through', GLU, false, 'pull-through = hip extension → glutes (was Hamstrings; ExRx: gluteus maximus; deadlift pattern → таз)'],
];

// Custom-exercise snapshot (guard, per release protocol)
const customs = db.filter(x => /^gi_9100[1-9]$/.test(x.id));
fs.writeFileSync(path.join(ROOT, 'reports', 'customs-snapshot-c59.json'), JSON.stringify(customs, null, 1));
console.log('customs snapshot:', customs.map(c => c.id).join(', ') || 'none');

const log = [];
const seen = new Set();
for (const [id, sub, needGroupMove, note] of FIXES) {
  const it = db.find(x => x.id === id);
  if (!it) { log.push(`ERROR: id not found: ${id}`); continue; }
  if (seen.has(id)) { log.push(`ERROR: duplicate fix entry: ${id}`); continue; }
  seen.add(id);
  const from = `${it.g}/${it.sE}`;
  Object.assign(it, sub);
  if (needGroupMove) Object.assign(it, LEGS);
  const to = `${it.g}/${it.sE}`;
  log.push(`${id} | ${it.nE} | ${from} → ${to} | ${note}`);
}

// Verify all 16 matched, and customs intact
const missing = FIXES.filter(([id]) => !seen.has(id));
if (missing.length) { console.error('MISSING IDS:', missing.map(m => m[0])); process.exit(1); }
const after = db.filter(x => /^gi_9100[1-9]$/.test(x.id));
const intact = JSON.stringify(customs) === JSON.stringify(after);
console.log('customs intact after merge:', intact);

fs.writeFileSync(path.join(ROOT, 'exercise-db.json'), JSON.stringify(db, null, 1) + '\n');
fs.writeFileSync(path.join(ROOT, 'reports', 'group-fix-c59-hinge.txt'),
  '# c59 hinge-fix — 16 trainer-biomechanics moves\n' +
  '# Rules: RDL family → Hamstrings; pull-through / generic hip hinge → Glutes (deadlift pattern → таз)\n' +
  log.join('\n') + '\n');
console.log(log.join('\n'));
console.log('TOTAL fixed:', log.length, '| total exercises:', db.length);
