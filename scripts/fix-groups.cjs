#!/usr/bin/env node
/* c57: fix exercise taxonomy — groups + subgroups + display names + subgroup i18n.
 * Principles (from David):
 *  - hyperextension / back extension  → back > Lower Back
 *  - conventional/sumo/trap/suitcase deadlift → legs > Glutes (таз)
 *  - romanian / stiff-leg deadlift, good morning → legs > Hamstrings (бицепс бедра)
 *  - triceps → triceps group, biceps → elbow_flexors, wrist/forearm → forearms
 *  - every exercise must be reachable from its bodymap area
 * Data-driven: writes explicit s/sE/sR/sH into every record; unifies gE/gR/gH.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const FILE = path.join(ROOT, 'exercise-db.json');
const db = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const arr = Array.isArray(db) ? db : (db.exercises || []);

/* backup */
fs.copyFileSync(FILE, '/tmp/exercise-db-backup-c57.json');
const customs = arr.filter((e) => /^gi_9100\d$/.test(e.id));
fs.writeFileSync('/tmp/customs-backup-c57.json', JSON.stringify(customs, null, 2));

/* ---------- canonical display names ---------- */
const GROUP_DISPLAY = {
  legs: { en: 'Legs', ru: 'Ноги', he: 'רגליים' },
  back: { en: 'Back', ru: 'Спина', he: 'גב' },
  chest: { en: 'Chest', ru: 'Грудь', he: 'חזה' },
  shoulders: { en: 'Shoulders', ru: 'Плечи', he: 'כתפיים' },
  abdominals: { en: 'Abdominals', ru: 'Мышцы кора', he: 'בטן' },
  elbow_flexors: { en: 'Elbow Flexors', ru: 'Сгибатели локтя', he: 'כופפי מרפק' },
  triceps: { en: 'Triceps', ru: 'Разгибатели локтя', he: 'פושטי מרפק' },
  forearms: { en: 'Forearms', ru: 'Предплечья', he: 'אמות' },
  warmup: { en: 'Warmup', ru: 'Разминка', he: 'חימום' },
  stretching: { en: 'Stretching', ru: 'Растяжка', he: 'מתיחות' },
  fullbody: { en: 'Full Body', ru: 'Всё тело', he: 'כל הגוף' },
  neck: { en: 'Neck', ru: 'Шея', he: 'צוואר' },
};
const SUB_I18N = {
  'Quadriceps': { ru: 'Квадрицепс', he: 'ארבע ראשי' },
  'Hamstrings': { ru: 'Бицепс бедра', he: 'המסטרינג' },
  'Glutes': { ru: 'Ягодицы', he: 'ישבן' },
  'Calves': { ru: 'Икры', he: 'תאומים' },
  'Adductors': { ru: 'Приводящие', he: 'מנחים' },
  'Abductors': { ru: 'Отводящие', he: 'מרחיקים' },
  'Hip Flexors': { ru: 'Сгибатели бедра', he: 'כופפי ירך' },
  'Lats': { ru: 'Широчайшие', he: 'רחבת גב' },
  'Middle Back': { ru: 'Середина спины', he: 'גב אמצעי' },
  'Trapezius': { ru: 'Трапеции', he: 'טרפז' },
  'Lower Back': { ru: 'Поясница', he: 'גב תחתון' },
  'Neck': { ru: 'Шея', he: 'צוואר' },
  'Upper': { ru: 'Верхний', he: 'עליון' },
  'Middle': { ru: 'Средний', he: 'אמצעי' },
  'Lower': { ru: 'Нижний', he: 'תחתון' },
  'Front': { ru: 'Передний', he: 'קדמי' },
  'Rear': { ru: 'Задний', he: 'אחורי' },
  'Rotator Cuff': { ru: 'Вращательная манжета', he: 'רוטציה בכתף' },
  'Biceps': { ru: 'Бицепс', he: 'ביצפס' },
  'Brachialis': { ru: 'Брахиалис', he: 'ברכיאליס' },
  'Brachioradialis': { ru: 'Брахиорадиалис', he: 'ברכיורדיאליס' },
  'Compound': { ru: 'Базовое', he: 'בסיסי' },
  'Lying': { ru: 'Лёжа', he: 'שכיבה' },
  'Seated': { ru: 'Сидя', he: 'ישיבה' },
  'Wrist Curls': { ru: 'Сгибания запястий', he: 'כפיפות שורש כף היד' },
  'Grip': { ru: 'Хват', he: 'אחיזה' },
  'General': { ru: 'Общее', he: 'כללי' },
};
const TAXONOMY = {
  legs: ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves', 'Adductors', 'Abductors', 'Hip Flexors'],
  back: ['Lats', 'Middle Back', 'Trapezius', 'Lower Back', 'Neck'],
  chest: ['Upper', 'Middle', 'Lower'],
  shoulders: ['Front', 'Middle', 'Rear', 'Rotator Cuff'],
  abdominals: ['Upper', 'Lower', 'Obliques'],
  elbow_flexors: ['Biceps', 'Brachialis', 'Brachioradialis'],
  triceps: ['Compound', 'Lying', 'Seated'],
  forearms: ['Wrist Curls', 'Grip', 'General'],
  stretching: ['General'], warmup: ['General'], fullbody: ['General'], neck: ['Neck'],
};

/* ---------- explicit dispositions: id -> [group, subgroup] ---------- */
const D = {};
const set = (id, g, s) => { D[id] = [g, s]; };
/* --- abdominals/plank/crunch family misplaced in legs (G8) --- */
[['gi_5265', 'Obliques'], ['gi_1498', 'Upper'], ['gi_4081', 'Lower'], ['gi_4333', 'Lower'], ['gi_5741', 'Upper'], ['gi_4331', 'Upper'], ['gi_7499', 'Upper'], ['gi_3503', 'Obliques'], ['gi_4187', 'Lower'], ['gi_4188', 'Lower'], ['gi_5308', 'Obliques'], ['gi_3959', 'Upper'], ['gi_3889', 'Upper'], ['gi_3750', 'Upper'], ['gi_3814', 'Upper'], ['gi_4023', 'Upper'], ['gi_3854', 'Upper'], ['gi_3202', 'Upper'], ['gi_0482', 'Lower'], ['gi_1190', 'Obliques'], ['gi_0507', 'Lower'], ['gi_0505', 'Lower'], ['gi_1470', 'Obliques'], ['gi_3606', 'Upper'], ['gi_3982', 'Upper'], ['gi_5032', 'Obliques'], ['gi_5250', 'Obliques'], ['gi_0621', 'Lower'], ['gi_3330', 'Obliques'], ['gi_3331', 'Obliques'], ['gi_4992', 'Obliques'], ['gi_3930', 'Upper'], ['gi_5157', 'Upper'], ['gi_5158', 'Upper'], ['gi_10326', 'Upper'], ['gi_3203', 'Upper'], ['gi_2155', 'Obliques'], ['gi_2162', 'Upper'], ['gi_2164', 'Obliques'], ['gi_4330', 'Lower'], ['gi_4019', 'Lower'], ['gi_0867', 'Upper'], ['gi_3942', 'Upper'], ['gi_4022', 'Lower'], ['gi_3944', 'Upper'], ['gi_3978', 'Obliques'], ['gi_4334', 'Obliques'], ['gi_3958', 'Upper'], ['gi_0735', 'Upper'], ['gi_6092', 'Obliques'], ['gi_3813', 'Upper'], ['gi_4008', 'Upper'], ['gi_1112', 'Upper'], ['gi_1137', 'Upper'], ['gi_1147', 'Upper'], ['gi_0819', 'Obliques'], ['gi_0821', 'Obliques'], ['gi_5963', 'Upper'], ['gi_4002', 'Lower'], ['gi_1188', 'Obliques'], ['gi_1189', 'Lower'], ['gi_4500', 'Upper'], ['gi_4386', 'Upper'], ['gi_0836', 'Upper'], ['gi_2526', 'Upper']]
  .forEach(([id, s]) => set(id, 'abdominals', s));
/* --- push-up family in legs → chest / shoulders / fullbody --- */
[['gv_0642', 'chest', 'Middle'], ['gv_0661', 'chest', 'Middle'], ['gi_3979', 'chest', 'Middle'], ['gi_0468', 'chest', 'Middle'], ['gi_10882', 'chest', 'Middle'], ['gi_3977', 'chest', 'Middle'], ['gi_3784', 'chest', 'Middle'], ['gi_1467', 'chest', 'Middle'], ['gv_1421', 'chest', 'Middle'], ['gi_1421', 'chest', 'Middle'], ['gv_3662', 'shoulders', 'Front'], ['gi_6986', 'shoulders', 'Front'], ['gi_3984', 'shoulders', 'Front'], ['gi_5337', 'fullbody', 'General'], ['gi_3886', 'fullbody', 'General'], ['gi_4159', 'fullbody', 'General'], ['gi_8627', 'fullbody', 'General']]
  .forEach(([id, g, s]) => set(id, g, s));
/* --- hybrid leg-dominant keep legs; arm-dominant move out --- */
set('gi_1540', 'legs', 'Quadriceps'); set('gi_1541', 'legs', 'Quadriceps');
set('gi_4738', 'legs', 'Quadriceps'); set('gi_1553', 'legs', 'Quadriceps');
set('gi_4753', 'legs', 'Quadriceps'); set('gi_6442', 'legs', 'Glutes');
set('gi_5623', 'elbow_flexors', 'Biceps'); set('gi_1032', 'elbow_flexors', 'Biceps');
set('gi_1220', 'legs', 'Calves');
/* --- G3 forearm/wrist misplacements --- */
[['gv_0365', 'forearms'], ['gv_0366', 'forearms'], ['gv_0397', 'forearms']].forEach(([id, g]) => set(id, g, 'Wrist Curls'));
set('gi_9871', 'shoulders', 'Rear'); set('gi_8663', 'shoulders', 'Rear');
set('gi_2930', 'shoulders', 'Rear');
set('gi_2336', 'chest', 'Middle');           /* camera variant of bench press */
set('gi_1821', 'stretching', 'General'); set('gi_2091', 'stretching', 'General');
set('gi_1818', 'stretching', 'General'); set('gi_1819', 'stretching', 'General');
set('gi_2090', 'stretching', 'General'); set('gi_2094', 'stretching', 'General');
set('gi_2092', 'stretching', 'General'); set('gi_2098', 'stretching', 'General');
set('gi_2766', 'forearms', 'Wrist Curls');
set('gi_2941', 'chest', 'Middle');            /* serratus wall slide (siblings in chest) */
set('gi_10564', 'legs', 'Calves');            /* foot pronation/supination */
set('gi_4231', 'forearms', 'Wrist Curls');
set('gi_3751', 'forearms', 'Wrist Curls');    /* wrist-rotation drill, not a row */
set('gi_6982', 'chest', 'Middle');            /* knuckle push-up */
/* G1: triceps family in elbow_flexors → stretching where *Stretch* */
set('gi_1828', 'stretching', 'General'); set('gi_1829', 'stretching', 'General');
/* G12/G9 leftovers */
set('gi_1027', 'legs', 'Quadriceps');         /* assisted single leg press from chest */
set('gv_1775', 'legs', 'Adductors');          /* side plank hip adduction */
/* G13 diamond stays triceps (already triceps) */
/* G4/G6 glute work */
set('gi_3522', 'legs', 'Glutes'); set('gi_4701', 'legs', 'Glutes');
/* B15 forearms cleanup */
set('gv_0518', 'fullbody', 'General');        /* hang clean */
set('gi_1861', 'elbow_flexors', 'Biceps'); set('gi_6264', 'elbow_flexors', 'Brachialis');
set('gi_6698', 'elbow_flexors', 'Biceps');
/* B3 specials */
set('gi_3328', 'fullbody', 'General');        /* barbell complex */
/* B4 specials: cross-body / chest-supported = posterior deltoid */
set('gi_3685', 'shoulders', 'Rear');
set('gi_9872', 'shoulders', 'Rear'); set('gi_9873', 'shoulders', 'Rear');
set('gi_4013', 'shoulders', 'Rear'); set('gi_9874', 'shoulders', 'Rear');
/* stretches sitting in back */
[['gv_1341'], ['gv_2208'], ['gv_0690'], ['gv_1362'], ['gv_1363'], ['gv_3231']]
  .forEach(([id]) => set(id, 'stretching', 'General'));

/* ---------- mechanical rules ---------- */
const moved = new Set(Object.keys(D));
for (const e of arr) {
  if (moved.has(e.id)) continue;
  const nl = (e.nE || '').toLowerCase();
  const g = e.g;
  const isRdl = /romanian|rumanian|stiff|straight.?leg/.test(nl);
  if (/deadlift|dead lift/.test(nl)) {
    if (g !== 'legs') set(e.id, 'legs', isRdl ? 'Hamstrings' : 'Glutes');
    else if (isRdl) set(e.id, 'legs', 'Hamstrings');
    else set(e.id, 'legs', 'Glutes');
    continue;
  }
  if (/reverse hyperextension|reverse hyper\b/.test(nl)) { set(e.id, 'legs', 'Glutes'); continue; }
  if (/hyperextension|back extension|back extensor/.test(nl) && g !== 'back' && g !== 'stretching') { set(e.id, 'back', 'Lower Back'); continue; }
  if (g === 'back' && /glute|hip thrust|glute bridge/.test(nl)) { set(e.id, 'legs', 'Glutes'); continue; }
  if (g === 'back' && /good morning/.test(nl)) { set(e.id, 'legs', 'Hamstrings'); continue; }
  if (g === 'elbow_flexors' && /\btriceps?\b|skullcrusher|skull crusher|french press|pushdown|push-down|bench dip|kickback|overhead extension/.test(nl) && !/biceps curl/.test(nl)) { set(e.id, 'triceps', 'Compound'); continue; }
  if (g === 'shoulders' && /shrug/.test(nl)) { set(e.id, 'back', 'Trapezius'); continue; }
  if (g === 'shoulders' && /rotator|internal rotation|external rotation|cuban/.test(nl)) { set(e.id, 'shoulders', 'Rotator Cuff'); continue; }
  if (g === 'shoulders' && /lateral|side raise/.test(nl) && !/rear|bent|prone|cross|chest.?supported|face pull|reverse/.test(nl)) { set(e.id, 'shoulders', 'Middle'); continue; }
  if (g === 'shoulders' && /front raise|front delt/.test(nl)) { set(e.id, 'shoulders', 'Front'); continue; }
  if (g === 'shoulders' && /rear delt|reverse fly|reverse-fly|bent over.*raise|prone.*raise|face pull/.test(nl)) { set(e.id, 'shoulders', 'Rear'); continue; }
  if (g === 'forearms' && /\bcurl\b/.test(nl) && !/reverse|wrist|hammer|preacher/.test(nl)) { set(e.id, 'elbow_flexors', 'Biceps'); continue; }
  if (g !== 'forearms' && g !== 'stretching' && g !== 'warmup' && g !== 'fullbody' && g !== 'legs' && /wrist curl|wrist extension|hand gripper/.test(nl)) { set(e.id, 'forearms', 'Wrist Curls'); continue; }
}

/* ---------- subgroup derivation for everything else ---------- */
function derive(e) {
  const nl = (e.nE || '').toLowerCase();
  const inc = (...k) => k.some((s) => nl.includes(s));
  switch (e.g) {
    case 'elbow_flexors':
      if (inc('hammer', 'cross-body', 'cross body')) return 'Brachialis';
      if (inc('reverse', 'zottman', 'pronat', 'supinat')) return 'Brachioradialis';
      return 'Biceps';
    case 'chest':
      if (inc('incline')) return 'Upper';
      if (inc('decline', 'dip')) return 'Lower';
      return 'Middle';
    case 'shoulders':
      if (inc('front') && inc('raise')) return 'Front';
      if (inc('shrug')) return 'Trapezius';
      if (inc('rotator', 'internal rotation', 'external rotation', 'cuban')) return 'Rotator Cuff';
      if (inc('rear', 'bent over', 'face pull', 'reverse fly', 'reverse-fly', 'prone')) return 'Rear';
      if (inc('lateral', 'side raise', 'side-lying')) return 'Middle';
      return 'Middle';
    case 'abdominals':
      if (inc('oblique', 'twist', 'side', 'bicycle', 'russian', 'side-to-side', 'spider')) return 'Obliques';
      if (inc('hanging', 'leg raise', 'knee raise', 'hip raise', 'reverse', 'pelvic', 'jackknife', 'v-up', 'v-crunch', 'scissor', 'lower')) return 'Lower';
      return 'Upper';
    case 'triceps':
      if (inc('overhead', 'seated', 'sitting')) return 'Seated';
      if (inc('lying', 'skull', 'french')) return 'Lying';
      return 'Compound';
    case 'back':
      if (inc('deadlift', 'hyperextension', 'hyper ', 'good morning', 'back extension', 'superman', 'erector', 'toe-touch')) return 'Lower Back';
      if (inc('shrug')) return 'Trapezius';
      if (inc('neck')) return 'Neck';
      if (inc('row', 'rowing', 'scapula retraction', 'retraction')) return 'Middle Back';
      if (inc('pull-up', 'pullup', 'pull up', 'pulldown', 'pull down', 'chin')) return 'Lats';
      return 'Lats';
    case 'legs':
      if (inc('adduct')) return 'Adductors';
      if (inc('abduct')) return 'Abductors';
      if (inc('calf', 'toe raise', 'donkey', 'soleus', 'gastrocnemius', 'heel')) return 'Calves';
      if (inc('glute', 'bridge', 'hip thrust')) return 'Glutes';
      if (inc('romanian', 'rumanian', 'stiff', 'good morning', 'hamstring', 'leg curl')) return 'Hamstrings';
      if (inc('deadlift')) return 'Glutes';
      if (inc('hip flexor', 'iliopsoas', 'psoas')) return 'Hip Flexors';
      if (inc('lunge', 'squat', 'step', 'leg press', 'leg extension', 'quad')) return 'Quadriceps';
      return 'Quadriceps';
    case 'forearms':
      if (inc('wrist', 'finger', 'grip', 'pronat', 'supinat', 'crimp', 'hangboard', 'handboard', 'pinch', 'squeeze', 'rotate')) return 'Wrist Curls';
      return 'Wrist Curls'; /* bodymap forearm area is the only reachable bucket */
    default:
      return 'General';
  }
}
function normalizeSub(s) {
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

let changes = { group: 0, subgroup: 0, display: 0 };
for (const e of arr) {
  const oldG = e.g;
  let g = e.g, sub = '';
  if (D[e.id]) { g = D[e.id][0]; sub = D[e.id][1]; }
  else if (e.sE && e.sE.trim()) {
    sub = normalizeSub(e.sE);
    if (sub === 'General' && ['stretching', 'warmup', 'fullbody'].includes(g)) sub = 'General';
  } else sub = derive({ ...e, g });
  /* sanity: sub must belong to the group taxonomy */
  const allowed = TAXONOMY[g] || ['General'];
  if (!allowed.includes(sub)) sub = derive({ ...e, g });
  if (!allowed.includes(sub)) sub = allowed.includes('General') ? 'General' : allowed[0];
  /* write */
  if (g !== oldG) changes.group++;
  const disp = GROUP_DISPLAY[g] || { en: e.gE, ru: e.gR, he: e.gH };
  if (e.gE !== disp.en || e.gR !== disp.ru || e.gH !== disp.he) changes.display++;
  e.g = g; e.gE = disp.en; e.gR = disp.ru; e.gH = disp.he;
  if (e.s !== sub || e.sE !== sub) changes.subgroup++;
  e.s = sub; e.sE = sub; e.sR = SUB_I18N[sub] ? SUB_I18N[sub].ru : sub; e.sH = SUB_I18N[sub] ? SUB_I18N[sub].he : sub;
}

/* ---------- validate ---------- */
const problems = [];
for (const e of arr) {
  const allowed = TAXONOMY[e.g] || ['General'];
  if (!allowed.includes(e.sE)) problems.push(e.id + ' bad sub ' + e.g + '>' + e.sE);
  if (!GROUP_DISPLAY[e.g]) problems.push(e.id + ' unknown group ' + e.g);
}
const customsAfter = arr.filter((e) => /^gi_9100\d$/.test(e.id));
const customsOk = JSON.stringify(customsAfter.map((e) => [e.id, e.tRu, e.tHe])) === JSON.stringify(customs.map((e) => [e.id, e.tRu, e.tHe]));

const dist = {};
arr.forEach((e) => { const k = e.gE + ' > ' + e.sE; dist[k] = (dist[k] || 0) + 1; });

if (problems.length) { console.error('PROBLEMS:\n' + problems.join('\n')); process.exit(1); }
fs.writeFileSync(FILE, JSON.stringify(db));
console.log('OK. group moves:', changes.group, '| subgroup changes:', changes.subgroup, '| display fixes:', changes.display);
console.log('customs intact:', customsOk);
console.log('\n=== NEW DISTRIBUTION ===');
Object.entries(dist).sort((a, b) => b[1] - a[1]).forEach(([k, n]) => console.log(String(n).padStart(5), k));
