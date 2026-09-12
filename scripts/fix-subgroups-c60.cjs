// c60 subgroup-fix: trainer-grade SUBGROUP pass (c58/c59 fixed groups; this fixes subgroups)
// 1) Elbow flexors grip rules (all sources): hammer (neutral grip) → Brachioradialis,
//    reverse (pronated grip) → Brachialis. EMG: brachioradialis peaks in neutral,
//    brachialis takes over when biceps is disadvantaged by pronation.
//    Zottman stays Brachioradialis; named "Brachialis Pull-ups" stay Brachialis.
// 2) Chest incline/decline chair press → Upper/Lower.
// 3) Shoulders: pike/handstand press family → Front; pull-aparts, face pull,
//    Powell raises, reverse fly → Rear; rotations & full-can → Rotator Cuff;
//    forward raise & shoulder flexion drills → Front.
// 4) Abs: hip lift → Lower; rotations (incl. anti-rotation) → Obliques.
// 5) Back: behind-neck pulldown → Lats; cervical extensions → Neck.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'exercise-db.json'), 'utf8'));

// Custom-exercise snapshot (guard, per release protocol)
const customs = db.filter(x => /^gi_9100[1-9]$/.test(x.id));
fs.writeFileSync(path.join(ROOT, 'reports', 'customs-snapshot-c60.json'), JSON.stringify(customs, null, 1));
console.log('customs snapshot:', customs.map(c => c.id).join(', ') || 'none');

// Learn canonical subgroup display translations (sR/sH) per group+subgroup from existing rows
const fmt = {};
for (const x of db) {
  if (!x.sE) continue;
  const k = x.g + '|' + x.sE;
  if (!fmt[k] && x.sR && x.sH) fmt[k] = { sR: x.sR, sH: x.sH };
}

// [id, newSubgroupEn] — translations auto-learned; group stays unchanged
const BY_ID = [
  // Chest
  ['Seated Incline Chest Press on a Chair', 'Upper'],
  ['Seated Decline Chest Press on a Chair', 'Lower'],
  // Shoulders → Front (vertical press family = anterior delt)
  ['Handstand Push Up', 'Front'],
  ['Pike Push Up', 'Front'],
  ['Pike Push-up (between Benches)', 'Front'],
  ['Pike Push-up (between Chairs)', 'Front'],
  ['Kipping Handstand Push-up', 'Front'],
  ['Ring Elevanted Pike Push-up from deficit', 'Front'],
  ['cable forward raise', 'Front'],
  ['Alternate Shoulder Flexion Back to Wall', 'Front'],
  ['Resistance Band Standing Single Arm Shoulder Flexion', 'Front'],
  // Shoulders → Rear (rear-delt family)
  ['cable cross-over revers fly', 'Rear'],
  ['Suspension Face Pul', 'Rear'],
  ['Dumbbell Powell Raise', 'Rear'],
  ['Dumbbell Incline Powell Raise', 'Rear'],
  ['Band Pull Apart', 'Rear'],
  ['Resistance Band Pull Apart', 'Rear'],
  ['Resistance Band Pull Apart (45 degrees)', 'Rear'],
  ['Resistance Band Pullapart (Pronated at 90 Degrees)', 'Rear'],
  // Shoulders → Rotator Cuff (rotations + supraspinatus full/empty can)
  ['dumbbell lying external shoulder rotation', 'Rotator Cuff'],
  ['Dumbbell Seated External Shoulder Rotation', 'Rotator Cuff'],
  ['dumbbell upright shoulder external rotation', 'Rotator Cuff'],
  ['Dumbbell Empty Can Exercise', 'Rotator Cuff'],
  ['Weighted Full Can Exercise', 'Rotator Cuff'],
  // Abs
  ['Hip Lift - Low Back Off Floor', 'Lower'],
  ['Chest Lift with Rotation', 'Obliques'],
  ['Lever Torso Rotation', 'Obliques'],
  ['Lever Trunk Rotation', 'Obliques'],
  ['Medicine Ball Rotational Throw', 'Obliques'],
  ['Resistance Band Anti Rotation Dead Bug', 'Obliques'],
  ['Seated Upper Body Rotation', 'Obliques'],
  ['Standing Upper Body Rotation', 'Obliques'],
  // Back
  ['cable wide grip rear pulldown behind neck', 'Lats'],
  ['Prone Cervical Extension', 'Neck'],
  ['Prone Cervical Extension Isometric Hold', 'Neck'],
];

// Elbow flexors swap by pattern (all sources)
const hammerMoves = [], reverseMoves = [];
for (const x of db) {
  if (x.g !== 'elbow_flexors') continue;
  const n = x.nE || '';
  if (x.sE === 'Brachialis' && /hammer/i.test(n)) hammerMoves.push([x.id, 'Brachioradialis']);
  else if (x.sE === 'Brachialis' && /with rope/i.test(n)) hammerMoves.push([x.id, 'Brachioradialis']); // rope curl = neutral grip
  else if (x.sE === 'Brachioradialis' && /reverse/i.test(n)) reverseMoves.push([x.id, 'Brachialis']);
}

const log = [];
function apply(idOrName, newSub) {
  const it = db.find(x => x.id === idOrName) || db.find(x => x.nE === idOrName);
  if (!it) { log.push('ERROR missing id: ' + idOrName); return false; }
  if (it.sE === newSub) { log.push('SKIP already ' + newSub + ': ' + idOrName + ' ' + it.nE); return true; }
  const key = it.g + '|' + newSub;
  const f = fmt[key];
  if (!f) { log.push('ERROR no format for ' + key); return false; }
  const from = it.g + '/' + it.sE;
  it.sE = newSub; it.sR = f.sR; it.sH = f.sH;
  log.push(it.id + ' | ' + it.nE + ' | ' + from + ' → ' + it.g + '/' + newSub);
  return true;
}

let failed = 0;
for (const [id, sub] of BY_ID) if (!apply(id, sub)) failed++;
for (const [id, sub] of [...hammerMoves, ...reverseMoves]) if (!apply(id, sub)) failed++;
if (failed) { console.error('FAILED: ' + failed); console.error(log.filter(l => l.startsWith('ERROR')).join('\n')); process.exit(1); }

const errors = log.filter(l => l.startsWith('ERROR'));
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }

// Customs intact check
const after = db.filter(x => /^gi_9100[1-9]$/.test(x.id));
const intact = JSON.stringify(customs) === JSON.stringify(after);
console.log('customs intact after merge:', intact);
if (!intact) process.exit(1);

fs.writeFileSync(path.join(ROOT, 'exercise-db.json'), JSON.stringify(db, null, 1) + '\n');
fs.writeFileSync(path.join(ROOT, 'reports', 'group-fix-c60-subgroups.txt'),
  '# c60 subgroup-fix — trainer-grade subgroup pass\n' +
  '# 1) elbow flexors grip split: hammer/rope → Brachioradialis (' + hammerMoves.length + '), reverse → Brachialis (' + reverseMoves.length + ')\n' +
  '# 2) ' + BY_ID.length + ' explicit subgroup dispositions (chest/shoulders/abs/back)\n' +
  log.join('\n') + '\n');
// summary
const db2 = JSON.parse(fs.readFileSync(path.join(ROOT, 'exercise-db.json'), 'utf8'));
const cnt = {};
for (const x of db2) if (x.g === 'elbow_flexors') cnt[x.sE] = (cnt[x.sE] || 0) + 1;
console.log('elbow_flexors after:', JSON.stringify(cnt));
console.log('TOTAL moved:', log.filter(l => l.includes('→')).length, '| total exercises:', db2.length);
