#!/usr/bin/env node
// BurnFit audit fixes: correct group/subgroup placement + synergists for all.
// Canonical subgroup RU/HE labels follow existing bf records.
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DB_PATH = path.join(ROOT, 'exercise-db.json');

const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
const byId = {};
db.forEach(x => { byId[x.id] = x; });
let fixed = 0, syned = 0;
const log = [];

// id -> { g?, sE? }  (sR/sH derived from canonical labels below)
const SUB_LABEL = {
  'Upper': ['Верхний', 'עליון'], 'Middle': ['Средний', 'אמצעי'], 'Lower': ['Нижний', 'תחתון'],
  'Obliques': ['Косые мышцы', 'אלכסוני'], 'Seated': ['Сидя', 'ישיבה'], 'Lying': ['Лёжа', 'שכיבה'],
  'Compound': ['Базовое', 'בסיסי'], 'Rear': ['Задний', 'אחורי'], 'Trapezius': ['Трапеции', 'טרפז'],
  'Lower Back': ['Поясница', 'גב תחתון'], 'Row': ['Тяга', 'חתירה'], 'Abductors': ['Отводящие', 'מרחיקים'],
  'Brachioradialis': ['Брахиорадиалис', 'ברכיורדיאליס'],
};
const FIX = {
  // chest
  'bf_assisted-dip-machine': { sE: 'Lower' },
  'bf_barbell-incline-bench-press': { sE: 'Upper' },
  'bf_decline-chest-press-machine': { sE: 'Lower' },
  'bf_decline-dumbbell-fly': { sE: 'Lower' },
  'bf_decline-push-up': { sE: 'Lower' },
  'bf_handstand-push-up': { g: 'shoulders', sE: 'Middle' },
  'bf_incline-bench-press-machine': { sE: 'Upper' },
  'bf_incline-chest-press-machine': { sE: 'Upper' },
  'bf_incline-dumbbell-bench-press': { sE: 'Upper' },
  'bf_incline-dumbbell-fly': { sE: 'Upper' },
  'bf_incline-push-up': { sE: 'Upper' },
  'bf_low-pulley-cable-fly': { sE: 'Upper' },
  'bf_pike-push-up': { g: 'shoulders', sE: 'Middle' },
  'bf_seated-dips-machine': { sE: 'Lower' },
  'bf_smith-machine-incline-bench-press': { sE: 'Upper' },
  'bf_weighted-dips': { sE: 'Lower' },
  // back
  'bf_sumo-deadlift-high-pull': { sE: 'Trapezius' },
  // shoulders
  'bf_Bentover-Dumbbell-Lateral-Raise': { sE: 'Rear' },
  'bf_y-raise': { sE: 'Rear' },
  'bf_seated-dumbbell-rear-lateral-raise': { sE: 'Rear' },
  // arms
  'bf_reverse-barbell-curl': { sE: 'Brachioradialis' },
  // triceps distribution
  'bf_cable-overhead-tricep-extension': { sE: 'Seated' },
  'bf_seated-dumbbell-tricep-extension': { sE: 'Seated' },
  'bf_lying-tricep-extension': { sE: 'Lying' },
  'bf_skull-crusher': { sE: 'Lying' },
  'bf_cable-lying-tricep-extension': { sE: 'Lying' },
  // abs
  'bf_ab-coaster-machine': { sE: 'Lower' },
  'bf_bird-dog': { g: 'back', sE: 'Lower Back' },
  'bf_decline-reverse-crunch': { sE: 'Lower' },
  'bf_plank-twist': { sE: 'Obliques' },
  'bf_reverse-crunch': { sE: 'Lower' },
  'bf_seated-knee-up': { sE: 'Lower' },
  'bf_side-crunch': { sE: 'Obliques' },
  'bf_toes-to-bar': { sE: 'Lower' },
  // legs
  'bf_hang-clean': { sE: 'Quadriceps' },
  'bf_side-lying-clam': { sE: 'Abductors' },
  // names
  'bf_captains-chair-knee-raise': { nE: "Captain's Chair Knee Raise" },
};
for (const [id, patch] of Object.entries(FIX)) {
  const x = byId[id];
  if (!x) { log.push('MISS ' + id); continue; }
  if (patch.g && x.g !== patch.g) { x.g = patch.g; fixed++; log.push('group ' + id + ' -> ' + patch.g); }
  if (patch.sE && x.sE !== patch.sE) {
    x.sE = patch.sE;
    const lbl = SUB_LABEL[patch.sE];
    if (lbl) { x.sR = lbl[0]; x.sH = lbl[1]; }
    fixed++; log.push('sub ' + id + ' -> ' + patch.sE);
  }
  if (patch.nE && x.nE !== patch.nE) { x.nE = patch.nE; fixed++; log.push('name ' + id); }
}
// Handstand/pike group labels follow canonical mapping (seed overrides at unpack)
const GROUP_LABEL = {
  'shoulders': ['Плечи', 'כתפיים'], 'back': ['Спина', 'גב'],
};
for (const id of ['bf_handstand-push-up', 'bf_pike-push-up', 'bf_bird-dog']) {
  const x = byId[id];
  if (x && GROUP_LABEL[x.g]) { x.gR = GROUP_LABEL[x.g][0]; x.gH = GROUP_LABEL[x.g][1]; }
}

// Synergists for the 114 empty (canonical keys)
const SYN = {
  'bf_45-degree-side-bend': ['core'],   'bf_Bentover-Dumbbell-Lateral-Raise': ['trapezius', 'core'],
  'bf_Dumbbell-Romanian-Deadlift': ['glutes', 'core'], 'bf_EZ-Bar-Front-Raise': ['trapezius', 'core'],
  'bf_Good-morning': ['glutes', 'core'], 'bf_T-bar-Row-Machine': ['biceps', 'rear_delts'],
  'bf_V-Squat': ['glutes', 'hamstrings', 'core'], 'bf_ab-coaster-machine': ['hip_flexors'],
  'bf_abdominal-crunch-machine': ['obliques'], 'bf_abdominal-hip-thrust': ['hamstrings', 'core'],
  'bf_abs-roll-out': ['shoulders', 'back'], 'bf_air-bicycle-abs': ['hip_flexors'],
  'bf_air-squat': ['glutes', 'core'], 'bf_archer-push-up': ['triceps', 'shoulders'],
  'bf_arm-curl-machine': ['forearms'], 'bf_arnold-dumbbell-press': ['triceps', 'core'],
  'bf_assault-bike': ['legs', 'shoulders'], 'bf_assisted-dip-machine': ['triceps', 'shoulders'],
  'bf_assisted-pull-up-machine': ['biceps', 'core'], 'bf_back-extension': ['glutes', 'hamstrings'],
  'bf_back-squat': ['glutes', 'hamstrings', 'core'], 'bf_bar-muscle-up': ['chest', 'triceps', 'core'],
  'bf_barbbell-preacher-curl': ['forearms'], 'bf_barbell-bench-press': ['triceps', 'shoulders'],
  'bf_plank-twist': ['shoulders'], 'bf_plate-shoulder-press': ['triceps', 'trapezius'],
  'bf_preacher-curl-machine': ['forearms'], 'bf_pull-up': ['biceps', 'core'],
  'bf_push-press': ['triceps', 'core', 'legs'], 'bf_push-up': ['triceps', 'shoulders', 'core'],
  'bf_reverse-barbell-curl': ['forearms'], 'bf_reverse-barbell-wrist-curl': ['forearms'],
  'bf_reverse-crunch': ['hip_flexors'], 'bf_reverse-dumbbell-wrist-curl': ['forearms'],
  'bf_reverse-pec-deck-fly-machine': ['trapezius'], 'bf_reverse-v-squat': ['glutes', 'hamstrings'],
  'bf_ring-muscle-up': ['chest', 'triceps', 'core'], 'bf_rkc-plank': ['glutes', 'back'],
  'bf_romanian-deadlift': ['glutes', 'core'], 'bf_rowing-machine': ['legs', 'back', 'biceps'],
  'bf_running': ['legs'], 'bf_russian-twist': ['core', 'hip_flexors'],
  'bf_seated-barbell-shoulder-press': ['triceps', 'trapezius'], 'bf_seated-cable-row': ['biceps', 'rear_delts'],
  'bf_seated-calf-raise': ['soleus'], 'bf_seated-dips-machine': ['triceps', 'shoulders'],
  'bf_seated-dumbbell-rear-lateral-raise': ['trapezius'], 'bf_seated-dumbbell-shoulder-press': ['triceps', 'trapezius'],
  'bf_seated-dumbbell-tricep-extension': ['shoulders'], 'bf_seated-knee-up': ['hip_flexors'],
  'bf_seated-leg-curl': ['glutes'], 'bf_seated-row-machine': ['biceps', 'rear_delts'],
  'bf_seated-single-leg-leg-curl': ['glutes'], 'bf_shoulder-press-machine': ['triceps', 'trapezius'],
  'bf_shoulder-tap': ['core', 'chest'], 'bf_shrug-machine': ['forearms'],
  'bf_side-crunch': ['core'], 'bf_side-lying-clam': ['glutes'],
  'bf_side-plank': ['shoulders', 'glutes'], 'bf_single-leg-glute-bridge': ['hamstrings', 'core'],
  'bf_single-leg-horizontal-leg-press': ['glutes', 'hamstrings'], 'bf_single-leg-leg-curl': ['glutes'],
  'bf_single-leg-leg-extension': ['glutes'], 'bf_single-leg-leg-press': ['glutes', 'hamstrings'],
  'bf_sit-up': ['hip_flexors'], 'bf_ski-ergometer': ['legs', 'back', 'shoulders'],
  'bf_skull-crusher': ['shoulders'], 'bf_smith-machine-bench-press': ['triceps', 'shoulders'],
  'bf_smith-machine-deadlift': ['glutes', 'back', 'trapezius'], 'bf_smith-machine-incline-bench-press': ['triceps', 'shoulders'],
  'bf_smith-machine-row': ['biceps', 'rear_delts'], 'bf_smith-machine-shrug': ['forearms'],
  'bf_smith-machine-split-squat': ['glutes', 'hamstrings'], 'bf_smith-machine-squat': ['glutes', 'hamstrings', 'core'],
  'bf_snatch': ['legs', 'back', 'shoulders', 'trapezius'], 'bf_snatch-balance': ['legs', 'shoulders', 'core'],
  'bf_snatch-high-pull': ['trapezius', 'back', 'legs'], 'bf_spoto-bench-press': ['triceps', 'shoulders'],
  'bf_stand-to-stand-bridge': ['shoulders', 'core'], 'bf_standing-cable-fly': ['shoulders'],
  'bf_standing-calf-raise': ['soleus'], 'bf_step-up': ['glutes', 'hamstrings', 'core'],
  'bf_stepmill-machine': ['glutes', 'hamstrings'], 'bf_stiff-leg-deadlift': ['glutes', 'core'],
  'bf_sumo-air-squat': ['glutes', 'hamstrings'], 'bf_sumo-deadlift-high-pull': ['trapezius', 'shoulders', 'quadriceps'],
  'bf_swimming': ['legs', 'shoulders'], 'bf_thruster': ['shoulders', 'triceps', 'core'],
  'bf_toes-to-bar': ['hip_flexors', 'forearms'], 'bf_torso-rotation-machine': ['core'],
  'bf_trap-bar-deadlift': ['glutes', 'trapezius', 'quadriceps'], 'bf_treadmill': ['legs'],
  'bf_tricep-extension-machine': ['shoulders'], 'bf_turkish-get-up': ['shoulders', 'core', 'legs', 'glutes'],
  'bf_underhand-barbell-row': ['biceps', 'rear_delts'], 'bf_underhand-high-row-machine': ['biceps', 'rear_delts'],
  'bf_underhand-lat-pulldown': ['biceps', 'core'], 'bf_v-up': ['hip_flexors'],
  'bf_walking': ['legs'], 'bf_wallball-shot': ['shoulders', 'triceps', 'core'],
  'bf_weight-hyperextension': ['glutes', 'hamstrings'], 'bf_weighted-abdominal-hip-thrust': ['hamstrings', 'core'],
  'bf_weighted-chin-up': ['biceps', 'core'], 'bf_weighted-decline-crunch': ['hip_flexors'],
  'bf_weighted-decline-sit-up': ['hip_flexors'], 'bf_weighted-dips': ['triceps', 'shoulders'],
  'bf_weighted-hanging-knee-raise': ['forearms'], 'bf_weighted-pull-up': ['biceps', 'core'],
  'bf_weighted-push-up': ['triceps', 'shoulders', 'core'], 'bf_weighted-step-up': ['glutes', 'hamstrings', 'core'],
  'bf_wrist-roller': ['forearms'], 'bf_y-raise': ['trapezius', 'core'],
  'bf_yoga': ['core', 'back', 'legs'], 'bf_zercher-squat': ['glutes', 'hamstrings', 'core', 'back'],
};
for (const [id, syn] of Object.entries(SYN)) {
  const x = byId[id];
  if (!x) { log.push('MISS syn ' + id); continue; }
  if (!x.synergists || !x.synergists.length) { x.synergists = syn; syned++; }
}
fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 1) + '\n');
const left = db.filter(x => x.src === 'bf' && (!x.synergists || !x.synergists.length));
console.log('fixed:', fixed, '| syned:', syned, '| still empty:', left.length, left.map(x => x.id).join(','));
log.slice(0, 60).forEach(l => console.log(' ', l));
