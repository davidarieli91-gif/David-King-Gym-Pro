#!/usr/bin/env node
/* Big taxonomy audit for exercise-db.json — c57 prep.
 * Levels:
 *  A. group misplacement (canonical g wrong)
 *  B. subgroup misplacement (g ok, derived/explicit subgroup wrong)
 *  C. display-name inconsistencies (gE/gR/gH per canonical g)
 * Cross-checks: EN name keywords + synergists vocabulary + movement type.
 * Output: reports/group-audit.json + console summary.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'exercise-db.json'), 'utf8'));
const arr = Array.isArray(db) ? db : (db.exercises || []);

const issues = [];
function flag(id, level, code, msg, from, to) {
  issues.push({ id, level, code, msg, from, to });
}
const byCode = {};
function add(e, code, msg, from, to) {
  flag(e.id, code.startsWith('G') ? 'group' : 'subgroup', code, msg, from || '', to || '');
  byCode[code] = (byCode[code] || 0) + 1;
}

/* ---------- helpers ---------- */
const name = (e) => (e.nE || '').toLowerCase();
const syn = (e) => (e.synergists || []).map((s) => String(s).toLowerCase());
const hasSyn = (e, ...ms) => syn(e).some((s) => ms.some((m) => s.includes(m)));
const SYN_VOCAB = ['glute', 'hamstring', 'quad', 'calf', 'soleus', 'gastroc', 'adductor', 'abductor', 'iliopsoas', 'hip flexor', 'erector', 'lower back', 'spinal', 'lat', 'rhomboid', 'trapezius', 'trap', 'tricep', 'bicep', 'brachiali', 'brachioradiali', 'forearm', 'wrist', 'oblique', 'abdominis', 'core', 'deltoid', 'delt', 'rotator', 'infraspinatus', 'teres', 'pectoral', 'chest', 'upper chest', 'serratus', 'levator', 'hip', 'gluteus'];

/* Target taxonomy (canonical g -> allowed subgroups, order matters for UI) */
const TAXONOMY = {
  legs: ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves', 'Adductors', 'Abductors', 'Hip Flexors'],
  back: ['Lats', 'Middle Back', 'Trapezius', 'Lower Back', 'Neck'],
  chest: ['Upper', 'Middle', 'Lower'],
  shoulders: ['Front', 'Middle', 'Rear', 'Rotator Cuff', 'Trapezius'],
  abdominals: ['Upper', 'Lower', 'Obliques'],
  elbow_flexors: ['Biceps', 'Brachialis', 'Brachioradialis'],
  triceps: ['Compound', 'Lying', 'Seated'],
  forearms: ['Wrist Curls', 'Grip', 'General'],
  stretching: ['General'],
  warmup: ['General'],
  fullbody: ['General'],
  cardio: ['General'],
  neck: ['Neck'],
};

/* =================== A. GROUP-LEVEL =================== */
for (const e of arr) {
  const g = e.g, nl = name(e);
  const src = e.src;

  /* A1: triceps exercises filed under elbow_flexors (biceps group) */
  if (g === 'elbow_flexors') {
    if (/\btriceps?\b|triceps extension|pushdown|push-down|kickback(?!.*glute)|french press|skullcrusher|skull crusher|overhead extension|bench dip/.test(nl)) {
      add(e, 'G1-triceps-in-flexors', 'triceps extensor name in elbow_flexors', g, 'triceps');
    }
  }
  /* A2: biceps/flexor exercises filed under triceps */
  if (g === 'triceps') {
    if (/\bbiceps?\b|\bcurl\b(?!.*leg)|preacher|hammer curl|zottman|chin-up|\bflexion\b(?!.*hip)/.test(nl)) {
      add(e, 'G2-flexors-in-triceps', 'elbow flexor name in triceps', g, 'elbow_flexors');
    }
  }
  /* A3: wrist/forearm exercises in arm groups or elsewhere */
  if (g !== 'forearms' && g !== 'stretching' && g !== 'warmup' && g !== 'fullbody') {
    if (/wrist|finger extension|finger curl|finger flexion|hand gripper|grip strength|forearm(?!.*roll)|pronation|supination/.test(nl) && !/ankle|wrist roller(?!.*forearm)/.test(nl)) {
      // wrist roller is forearm too. Exclude hip/leg things.
      add(e, 'G3-forearm-elsewhere', 'wrist/forearm exercise outside forearms group', g, 'forearms');
    }
  }
  /* A4: glute exercises sitting in back group (user: ягодицы не в разгибателях спины) */
  if (g === 'back') {
    if (/glute|hip thrust|glute bridge|butt|donkey kick/.test(nl)) {
      add(e, 'G4-glutes-in-back', 'glute exercise in back group', 'back', 'legs > Glutes');
    }
    /* A5: deadlift variants in back group → user rule: deadlift = таз (glutes), RDL/stiff = hamstrings */
    if (/deadlift|dead lift/.test(nl)) {
      const to = /romanian|rumanian|stiff|stiff-leg|stiff leg|straight/.test(nl) ? 'legs > Hamstrings' : 'legs > Glutes';
      add(e, 'G5-deadlift-in-back', 'deadlift variant in back group (user rule: таз/бицепс бедра)', 'back', to);
    }
    if (/reverse hyperextension|reverse hyper\b/.test(nl)) {
      add(e, 'G6-reverse-hyp-in-back', 'reverse hyperextension = glutes/hamstrings, not lower back', 'back', 'legs > Glutes');
    }
  }
  /* A7: hyperextension / back extension must live in back > Lower Back */
  if (g !== 'back' && g !== 'stretching' && /hyperextension|back extension|back extensor/.test(nl) && !/reverse/.test(nl)) {
    add(e, 'G7-hyperextension-outside-back', 'hyperextension must be back > Lower Back (user rule)', g, 'back > Lower Back');
  }
  /* A8: obvious cross-family names in legs group */
  if (g === 'legs') {
    if (/\btriceps?\b|\bbiceps?\b|lat pulldown|bench press(?!.*leg)|lateral raise|shoulder press|upright row|\bshrug\b|face pull|crunch|sit-up|situp|push-up|pushup|plank(?!.*leg)/.test(nl)) {
      add(e, 'G8-upper-body-name-in-legs', 'upper-body exercise name in legs group', 'legs', '?');
    }
  }
  /* A9: leg exercises filed in upper-body groups */
  if (['chest', 'shoulders', 'abdominals', 'back'].includes(g)) {
    if (/leg curl|leg extension|leg press|calf raise|heel raise|toe press|hip abduction|hip adduction|thigh(?!.*upper)/.test(nl) && !/neck/.test(nl)) {
      add(e, 'G9-leg-exercise-in-upper-group', 'leg exercise filed in upper-body group', g, 'legs');
    }
  }
  /* A10: display-name mismatch gE vs canonical g */
  const GDISPLAY = { legs: 'Legs', back: 'Back', abdominals: 'Abdominals', chest: 'Chest', shoulders: 'Shoulders', elbow_flexors: 'Elbow Flexors', triceps: 'Triceps', forearms: 'Forearms', warmup: 'Warmup', stretching: 'Stretching', fullbody: 'Full Body' };
  if (GDISPLAY[g] && e.gE && e.gE !== GDISPLAY[g]) {
    add(e, 'G10-gE-mismatch', `display gE="${e.gE}" for canonical g="${g}"`, g, GDISPLAY[g]);
  }
  /* A11: synergists sanity — group vs synergist vocabulary conflicts */
  if (g === 'back' && syn(e).length) {
    const latish = hasSyn(e, 'lat', 'rhomboid', 'trap', 'upper back', 'middle back', 'lower back', 'erector', 'levator', 'teres', 'infraspinatus', 'spinal');
    const legish = hasSyn(e, 'glute', 'hamstring', 'quad', 'calf', 'adductor');
    if (!latish && legish) {
      add(e, 'G11-back-no-back-syn', 'filed as back but synergists only mention leg muscles', 'back', '?');
    }
  }
  if (g === 'elbow_flexors' && syn(e).length && hasSyn(e, 'tricep') && !hasSyn(e, 'bicep', 'brachiali', 'forearm', 'brachioradiali')) {
    add(e, 'G12-flexors-syn-triceps', 'elbow_flexors with only triceps synergists', 'elbow_flexors', '?');
  }
  if (g === 'triceps' && syn(e).length && hasSyn(e, 'bicep') && !hasSyn(e, 'tricep')) {
    add(e, 'G13-triceps-syn-biceps', 'triceps group with only biceps synergists', 'triceps', '?');
  }
}

/* =================== B. SUBGROUP-LEVEL =================== */
/* c57: subgroups are now explicit data (sE written into every record) — read them */
function currentSubgroup(e) {
  const s = normalizeSubgroupAudit(e.sE || '');
  return s || 'General';
}
function normalizeSubgroupAudit(s) {
  if (!s) return '';
  const t = String(s).toLowerCase().trim();
  const map = {
    'quads': 'Quadriceps', 'quadriceps': 'Quadriceps', 'hamstring': 'Hamstrings', 'hamstrings': 'Hamstrings',
    'glute': 'Glutes', 'glutes': 'Glutes', 'calf': 'Calves', 'calves': 'Calves',
    'adduct': 'Adductors', 'adductors': 'Adductors', 'abduct': 'Abductors', 'abductors': 'Abductors',
    'lat': 'Lats', 'lats': 'Lats', 'middle back': 'Middle Back', 'lower back': 'Lower Back',
    'trapezius': 'Trapezius', 'traps': 'Trapezius', 'neck': 'Neck',
    'upper': 'Upper', 'middle': 'Middle', 'lower': 'Lower', 'front': 'Front', 'rear': 'Rear',
    'obliques': 'Obliques', 'rotator cuff': 'Rotator Cuff', 'biceps': 'Biceps', 'brachialis': 'Brachialis',
    'brachioradialis': 'Brachioradialis', 'compound': 'Compound', 'lying': 'Lying', 'seated': 'Seated',
    'wrist curls': 'Wrist Curls', 'grip': 'Wrist Curls', 'general': 'General',
    'upper back': 'Middle Back', 'hip flexors': 'Hip Flexors',
  };
  return map[t] || String(s).trim();
}

for (const e of arr) {
  const g = e.g, nl = name(e), sub = currentSubgroup(e);
  if (['stretching', 'warmup', 'fullbody', 'cardio'].includes(g)) continue;

  /* B1: glute-dominant exercises stuck in back > Lower Back (user: ягодицы в разгибателях спины) */
  if (g === 'back' && sub === 'Lower Back') {
    if (/deadlift|dead lift/.test(nl)) {
      const to = /romanian|rumanian|stiff|straight/.test(nl) ? 'legs > Hamstrings' : 'legs > Glutes';
      add(e, 'B1-deadlift-sub-in-back', 'deadlift in back>Lower Back (user rule: таз/бицепс бедра)', 'back > Lower Back', to);
    } else if (/glute|hip thrust|bridge/.test(nl)) {
      add(e, 'B1-glute-sub-in-back', 'glute exercise in back>Lower Back', 'back > Lower Back', 'legs > Glutes');
    }
  }
  /* B2: legs group — conventional/sumo deadlift classified Hamstrings should be Glutes (user rule) */
  if (g === 'legs' && sub === 'Hamstrings' && /deadlift|dead lift/.test(nl) && !/romanian|rumanian|stiff|straight/.test(nl)) {
    add(e, 'B2-deadlift-hams-to-glutes', 'conventional/sumo deadlift: Hamstrings → Glutes (user rule)', 'legs > Hamstrings', 'legs > Glutes');
  }
  /* B3: RDL / stiff-leg must be Hamstrings wherever they are */
  if (/romanian|rumanian|stiff-leg|stiff leg|stiffleg/.test(nl) && !(g === 'legs' && sub === 'Hamstrings')) {
    add(e, 'B3-rdl-not-hamstrings', 'romanian/stiff-leg deadlift must be legs > Hamstrings', g + ' > ' + sub, 'legs > Hamstrings');
  }
  /* B4: shoulders — lateral raises must be Middle (gv rule sends 'lateral' to Rear!) */
  if (g === 'shoulders' && sub === 'Rear') {
    const latRaise = /lateral|side raise/.test(nl) && !/rear|bent|prone|reverse|face pull|incline/.test(nl);
    if (latRaise) add(e, 'B4-lateral-as-rear', 'lateral raise classified Rear, must be Middle', 'shoulders > Rear', 'shoulders > Middle');
  }
  if (g === 'shoulders' && sub === 'Middle') {
    if (/rear delt|rear deltoid|reverse fly|reverse-fly|bent over.*raise|prone.*raise|face pull/.test(nl)) {
      add(e, 'B5-rear-as-middle', 'rear-delt exercise classified Middle', 'shoulders > Middle', 'shoulders > Rear');
    }
    if (/shrug/.test(nl)) add(e, 'B6-shrug-as-middle', 'shrug classified Middle → Trapezius', 'shoulders > Middle', 'shoulders > Trapezius');
  }
  if (g === 'shoulders' && /shrug/.test(nl) && sub !== 'Trapezius') {
    add(e, 'B6-shrug-not-traps', `shrug classified ${sub} → Trapezius`, 'shoulders > ' + sub, 'shoulders > Trapezius');
  }
  /* B7: front raises / front-delts as Middle */
  if (g === 'shoulders' && sub === 'Middle') {
    if (/front raise|front delt|anterior delt|front press/.test(nl)) add(e, 'B7-front-as-middle', 'front-delt exercise classified Middle', 'shoulders > Middle', 'shoulders > Front');
  }
  /* B8: rotator cuff work misfiled */
  if (g === 'shoulders' && /rotator|external rotation|internal rotation|cuban/.test(nl) && sub !== 'Rotator Cuff') {
    add(e, 'B8-rotator-misfiled', `rotator-cuff exercise classified ${sub}`, 'shoulders > ' + sub, 'shoulders > Rotator Cuff');
  }
  /* B9: abdominals — oblique work as Upper/Lower */
  if (g === 'abdominals' && sub === 'Upper' && /oblique|twist|side bend|side crunch|russian/.test(nl)) {
    add(e, 'B9-oblique-as-upper', 'oblique exercise classified Upper', 'abdominals > Upper', 'abdominals > Obliques');
  }
  /* B10: abdominals — leg/knee raises as Upper */
  if (g === 'abdominals' && sub === 'Upper' && /leg raise|knee raise|hanging|lying leg|reverse crunch|hip raise|pelvic/.test(nl)) {
    add(e, 'B10-lower-abs-as-upper', 'lower-abs exercise classified Upper', 'abdominals > Upper', 'abdominals > Lower');
  }
  /* B11: chest — incline as Middle / decline as Middle */
  if (g === 'chest') {
    if (sub === 'Middle' && /incline/.test(nl)) add(e, 'B11-incline-as-middle', 'incline classified Middle → Upper', 'chest > Middle', 'chest > Upper');
    if (sub === 'Middle' && /decline/.test(nl)) add(e, 'B11-decline-as-middle', 'decline classified Middle → Lower', 'chest > Middle', 'chest > Lower');
  }
  /* B12: back — rows/pulldowns sanity */
  if (g === 'back') {
    if (sub === 'Lats' && /\brow\b(?!ing)/.test(nl) && !/pull|lat|chin/.test(nl)) {
      add(e, 'B12-row-as-lats', `row exercise classified Lats → Middle Back`, 'back > Lats', 'back > Middle Back');
    }
    if (sub === 'Middle Back' && /pulldown|pull down|pull-up|pullup|chin-up/.test(nl)) {
      add(e, 'B13-pulldown-as-middle', 'pulldown classified Middle Back → Lats', 'back > Middle Back', 'back > Lats');
    }
    if (sub === 'Lats' && /shrug|neck/.test(nl)) add(e, 'B14-shrug-as-lats', 'shrug/neck classified Lats → Trapezius', 'back > Lats', 'back > Trapezius');
  }
  /* B15: forearms — everything must be reachable: non-wrist names → General (unreachable from bodymap forearm area) */
  if (g === 'forearms' && sub === 'General') {
    add(e, 'B15-forearm-general', 'forearm exercise classified General (unreachable from bodymap)', 'forearms > General', 'forearms > Wrist Curls');
  }
  /* B16: wrist EXTENSIONS as "Wrist Curls" — taxonomy label only; skip (label fix separately) */
  /* B17: legs — calf/soleus work not in Calves */
  if (g === 'legs' && /calf|soleus|gastroc|heel raise|toe raise/.test(nl) && sub !== 'Calves') {
    add(e, 'B17-calf-not-calves', `calf exercise classified ${sub}`, 'legs > ' + sub, 'legs > Calves');
  }
  /* B18: legs — adductor/abductor machines */
  if (g === 'legs' && /adduct/.test(nl) && sub !== 'Adductors') add(e, 'B18-adductor-misfiled', `adductor classified ${sub}`, 'legs > ' + sub, 'legs > Adductors');
  if (g === 'legs' && /abduct/.test(nl) && !/adduct/.test(nl) && sub !== 'Abductors') add(e, 'B19-abductor-misfiled', `abductor classified ${sub}`, 'legs > ' + sub, 'legs > Abductors');
  /* B20: hip flexor work */
  if (g === 'legs' && /hip flexor|psoas|iliopsoas/.test(nl) && sub !== 'Hip Flexors') add(e, 'B20-hipflexor-misfiled', `hip-flexor classified ${sub}`, 'legs > ' + sub, 'legs > Hip Flexors');
  /* B21: glute-dominant in legs as Quadriceps (names) */
  if (g === 'legs' && sub === 'Quadriceps' && /glute bridge|hip thrust|glute kickback|donkey kick|glute raise/.test(nl)) {
    add(e, 'B21-glute-as-quad', 'glute-dominant classified Quadriceps', 'legs > Quadriceps', 'legs > Glutes');
  }
  /* B22: leg curl / hamstring-dominant as Quadriceps */
  if (g === 'legs' && sub === 'Quadriceps' && /leg curl|hamstring/.test(nl)) {
    add(e, 'B22-hamstring-as-quad', 'hamstring exercise classified Quadriceps', 'legs > Quadriceps', 'legs > Hamstrings');
  }
  /* B23: elbow_flexors — regular curls as Brachialis/Brachioradialis */
  if (g === 'elbow_flexors' && sub === 'Brachialis' && !/hammer|cross.?body/.test(nl)) {
    add(e, 'B23-brachialis-no-hammer', `non-hammer curl classified Brachialis`, 'elbow_flexors > Brachialis', 'elbow_flexors > Biceps');
  }
  if (g === 'elbow_flexors' && sub === 'Brachioradialis' && !/reverse|zottman|pronat|supinat/.test(nl)) {
    add(e, 'B24-brachiorad-no-reverse', `non-reverse curl classified Brachioradialis`, 'elbow_flexors > Brachioradialis', 'elbow_flexors > Biceps');
  }
  /* B25: triceps — overhead as 'Seated' label is odd but keep; lying playouts ok. Pushdowns as Seated? */
  if (g === 'triceps' && sub === 'Seated' && !/overhead|seated|sitting/.test(nl)) {
    add(e, 'B25-triceps-seated-odd', `triceps classified Seated without overhead/seated name`, 'triceps > Seated', 'triceps > Compound');
  }
}

/* =================== C. TAXONOMY REACHABILITY =================== */
/* subgroups produced but absent from bodymap/derivation targets */
const reachable = new Set(Object.entries(TAXONOMY).flatMap(([g, subs]) => subs.map((s) => g + ' > ' + s)));
const produced = {};
for (const e of arr) {
  const sub = currentSubgroup(e);
  const k = e.g + ' > ' + sub;
  if (!reachable.has(k)) produced[k] = (produced[k] || 0) + 1;
}

/* =================== OUTPUT =================== */
const report = {
  generated: new Date().toISOString(),
  total: arr.length,
  issueCount: issues.length,
  byCode,
  unreachableCombinations: produced,
  issues: issues,
};
fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'reports/group-audit.json'), JSON.stringify(report, null, 2));

console.log('TOTAL EXERCISES:', arr.length);
console.log('TOTAL ISSUES:', issues.length);
console.log('\n=== BY CODE ===');
Object.entries(byCode).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => console.log(String(n).padStart(5), c));
console.log('\n=== UNREACHABLE g>sub combos (not in bodymap/target taxonomy) ===');
Object.entries(produced).forEach(([k, n]) => console.log(String(n).padStart(5), k));
console.log('\nReport → reports/group-audit.json');
