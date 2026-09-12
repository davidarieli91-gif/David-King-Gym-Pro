#!/usr/bin/env node
/* c58: taxonomy order v2 — trainer-grade pass over all 5623 exercises.
 * Fixes the leftovers of c57: stretches/SMR/articulations scattered across
 * every group, close-grip presses & pec-deck in Biceps, glute kickbacks and
 * hip extensions in Quadriceps, leg raises in Quadriceps, supermans in legs,
 * olympic lifts in Chest/Shoulders, presses under wrong delt subgroup,
 * curls sitting in Shoulders, mountain climbers in legs, etc.
 *
 * Decision policy (professional-trainer rules, confirmed by review):
 *  - stretch / SMR (Roll, Roll Ball, Tiger Tail, Foam Roll) → stretching
 *  - '* - Articulations' mobility drills → warmup
 *  - close-grip / narrow press (barbell, smith, dumbbell, pin, push-up) → triceps
 *    (explicit 60° incline → shoulders Front; military/shoulder press excluded)
 *  - pec deck / chest press machine / neutral+hammer+twisting presses → chest
 *  - glute kickback / hip extension in legs → Glutes subgroup
 *  - leg raises: supine/hanging/chair → abdominals Lower; side → Abductors;
 *    standing → Hip Flexors; prone → Glutes
 *  - plank family in legs → abdominals (side plank → Obliques)
 *  - superman in legs/abs → back Lower Back; mountain climbers → fullbody
 *  - clean / snatch (not shrug) → fullbody; wood chops → abdominals Obliques
 *  - overhead presses → shoulders Front; prone press → Rear
 *  - reverse curls misfiled in forearms → elbow_flexors Brachioradialis
 *  - reverse hyperextension stays legs Glutes (c57 policy); RDL → Hamstrings
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const FILE = path.join(ROOT, 'exercise-db.json');
const db = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const arr = Array.isArray(db) ? db : (db.exercises || []);

fs.copyFileSync(FILE, '/tmp/exercise-db-backup-c58.json');
const customs = arr.filter((e) => /^gi_9100\d$/.test(e.id));
fs.writeFileSync('/tmp/customs-backup-c58.json', JSON.stringify(customs, null, 2));

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

/* ---------- explicit dispositions (reviewed one by one) ---------- */
const D = {};
const set = (id, g, s) => { D[id] = [g, s]; };
const sec = (title) => console.log('  ' + title);

console.log('== explicit map ==');
/* A. elbow_flexors: non-flexor work moved out */
[['gi_1817','stretching','General'],['gi_1480','stretching','General'],['gi_1830','stretching','General'],
 ['gi_1814','stretching','General'],['gi_1816','stretching','General'],['gi_1820','stretching','General'],
 ['gi_4498','stretching','General'],['gi_5374','stretching','General'],
 ['gi_2764','warmup','General'],
 ['gi_4719','triceps','Compound'],['gi_4142','triceps','Compound'],['gi_10115','triceps','Compound'],
 ['gi_4856','triceps','Compound'],['gi_10116','triceps','Compound'],['gi_5863','triceps','Seated'],
 ['gi_0525','fullbody','General'],['gi_0526','fullbody','General'],
 ['gi_1030','chest','Middle'],['gi_6151','chest','Middle'],
 ['gi_2348','forearms','Wrist Curls'],['gi_7054','forearms','Wrist Curls'],['gi_7055','forearms','Wrist Curls'],
 ['gi_5131','triceps','Seated'],['gi_8652','abdominals','Upper'],
].forEach(([id,g,s])=>set(id,g,s));
/* A2. elbow_flexors subgroup fixes (stay in group) */
set('gi_0139','elbow_flexors','Brachialis');   /* Brachialis Narrow Pull-ups */
set('gi_0140','elbow_flexors','Brachialis');   /* Brachialis Pull-up */
set('gi_3068','elbow_flexors','Brachialis');   /* rope = neutral grip */
set('gv_0382','elbow_flexors','Brachioradialis'); /* revers grip biceps curl */
set('gv_0403','elbow_flexors','Brachioradialis'); /* seated revers grip concentration curl */

/* B. triceps: presses that are not triceps + stretches + misc */
[['gv_1745','stretching','General'],['gv_0643','stretching','General'],['gi_0817','stretching','General'],
 ['gi_5375','stretching','General'],['gi_4407','stretching','General'],
 ['gv_0352','chest','Middle'],['gv_1623','chest','Upper'],['gv_1743','chest','Middle'],
 ['gv_1750','chest','Middle'],['gi_1497','chest','Middle'],['gv_0717','chest','Middle'],
 ['gi_1115','shoulders','Front'],['gi_2978','abdominals','Upper'],['gi_1031','legs','Glutes'],
].forEach(([id,g,s])=>set(id,g,s));
set('gi_0109','triceps','Compound'); /* standing overhead ext: not seated */
/* hammer presses (neutral-grip = chest pattern) */
const tricepsDb = Object.fromEntries(arr.map(e=>[e.nE,e.id]));
[['dumbbell decline one arm hammer press','Lower'],
 ['dumbbell incline hammer press on exercise ball','Upper'],
 ['dumbbell incline one arm hammer press','Upper'],
 ['dumbbell incline one arm hammer press on exercise ball','Upper'],
 ['dumbbell one arm hammer press on exercise ball','Middle'],
].forEach(([n,s])=>{ const id=tricepsDb[n]; if(id) set(id,'chest',s); else console.log('  !! name not found: '+n); });

/* C. chest: dips/pure taps out, machines in */
[['gi_1028','triceps','Compound'],['gi_1492','stretching','General'],['gi_4775','triceps','Compound'],
 ['gi_1039','legs','Quadriceps'],['gi_3707','legs','Quadriceps'],['gi_5233','fullbody','General'],
 ['gi_3823','abdominals','Upper'],['gi_3348','abdominals','Upper'],['gi_4506','abdominals','Upper'],
 ['bf_shoulder-tap','abdominals','Upper'],
 ['gi_1029','chest','Middle'],
 ['gi_8620','chest','Middle'],['gi_8622','chest','Middle'],
].forEach(([id,g,s])=>set(id,g,s));

/* D. legs: drills out, kickbacks/hip-ext/leg-raises sorted */
/* D1. mobility/pilates/squat-holds */
[['gv_3119','stretching','General'],['gi_6139','stretching','General'],
 ['gi_10906','legs','Quadriceps'],['gi_9272','legs','Calves'],['gi_4392','abdominals','Upper'],
].forEach(([id,g,s])=>set(id,g,s));
/* D2. supermans → back; climbers/combos → fullbody */
[['gi_4715','back','Lower Back'],['gi_4935','back','Lower Back'],['gi_5049','back','Lower Back'],
 ['gi_5048','back','Lower Back'],
 ['gi_4976','fullbody','General'],['gi_5156','fullbody','General'],['gi_5213','fullbody','General'],
 ['gi_7463','fullbody','General'],['gi_1084','fullbody','General'],['gi_5598','fullbody','General'],
 ['gi_9048','fullbody','General'],['gi_5161','fullbody','General'],['gi_3579','fullbody','General'],
].forEach(([id,g,s])=>set(id,g,s));
/* D3. planks/situps in legs → abdominals */
[['gi_3501','abdominals','Upper'],['gi_1469','abdominals','Obliques'],['gi_0625','abdominals','Upper'],
].forEach(([id,g,s])=>set(id,g,s));
/* D4. keepers that mechanical rules would otherwise touch */
[['gi_6442','legs','Glutes'],            /* bear plank LEG kickback */
 ['gv_1294','chest','Middle'],           /* pullover+hip-ext hybrid: pullover dominant */
 ['gi_2858','abdominals','Upper'],       /* pilates roll up */
 ['gi_2859','abdominals','Upper'],       /* rolling back */
 ['gi_2572','abdominals','Lower'],       /* roll overs into V sits */
 ['gi_5026','chest','Middle'],['gi_5027','chest','Middle'], /* serratus wall slides */
 ['gi_5349','legs','Abductors'],['gi_2746','legs','Abductors'],['gi_10113','legs','Abductors'],
 ['gi_4109','legs','Adductors'],['gi_3460','legs','Adductors'],['gi_9849','legs','Abductors'],
 ['gv_1775','legs','Adductors'],
 ['gi_8755','legs','Calves'],['gi_5880','legs','Calves'],['gv_1385','legs','Calves'],
 ['gv_1391','legs','Calves'],['gv_1392','legs','Calves'],
 ['gi_7593','legs','Glutes'],['gi_7590','legs','Glutes'],['gi_7598','legs','Glutes'],
 ['gi_8799','legs','Glutes'],['gi_2163','legs','Glutes'],['gi_9009','legs','Glutes'],
 ['gi_2745','legs','Glutes'],['gi_3178','legs','Glutes'],['gi_10861','legs','Glutes'],
 ['gi_6145','legs','Glutes'],['gi_3870','legs','Glutes'],['gi_3180','legs','Glutes'],
 ['gi_2748','legs','Glutes'],['gi_0593','legs','Glutes'],['gv_0593','legs','Glutes'],
 ['gi_4701','legs','Glutes'],
 ['gi_4547','legs','Hamstrings'],['gi_5313','legs','Hamstrings'],['gi_6733','legs','Hamstrings'],
 ['gi_9484','legs','Hamstrings'],['gi_9485','legs','Hamstrings'],['bf_glute-ham-raise','legs','Hamstrings'],
].forEach(([id,g,s])=>set(id,g,s));
/* D5. one-off leg moves */
[['gv_1397','legs','Calves'],['gi_2990','legs','Calves'],
 ['gi_6435','legs','Glutes'],['gv_1343','legs','Glutes'],
 ['gi_3494','legs','Quadriceps'],['gi_8956','legs','Quadriceps'],
 ['gi_3268','legs','Abductors'],['gi_9927','legs','Abductors'],['gi_4051','legs','Abductors'],
 ['gi_3929','legs','Abductors'],['gi_6751','legs','Abductors'],['gi_3264','legs','Abductors'],
 ['gi_4156','legs','Abductors'],
 ['gi_1021','legs','Hip Flexors'],['gi_0927','legs','Hip Flexors'],['gi_1036','legs','Hip Flexors'],
 ['gi_1563','legs','Hip Flexors'],
 ['gi_4020','abdominals','Obliques'],
].forEach(([id,g,s])=>set(id,g,s));

/* E. back */
[['gi_3204','abdominals','Upper'],
 ['gi_4800','legs','Glutes'],['gi_4553','legs','Glutes'],['bf_full-back-bridge','fullbody','General'],
].forEach(([id,g,s])=>set(id,g,s));
set('gv_0609','back','Middle Back'); /* london bridge = rope row */

/* F. abdominals */
[['gi_4977','back','Lower Back'],['gi_4798','back','Lower Back'],['gi_0679','legs','Glutes'],
 ['gi_5309','abdominals','Upper'],
].forEach(([id,g,s])=>set(id,g,s));

/* G. shoulders */
set('gi_4125','shoulders','Rear'); /* prone press = posterior deltoid */
[['gi_3687','elbow_flexors','Biceps'],['gi_4422','elbow_flexors','Biceps'],
 ['gi_5449','elbow_flexors','Biceps'],['gi_4574','elbow_flexors','Biceps'],
 ['gi_3347','elbow_flexors','Biceps'],
 ['gi_1148','abdominals','Upper'],
].forEach(([id,g,s])=>set(id,g,s));

/* H. stretching guests that are real exercises */
set('gi_10664','fullbody','General'); /* planche press */

/* ---------- apply explicit map ---------- */
const moved = new Set(Object.keys(D));
let explicitMoves = 0;
for (const e of arr) {
  if (!moved.has(e.id)) continue;
  const [g, s] = D[e.id];
  if (e.g !== g || (e.sE || '') !== s) explicitMoves++;
  e.g = g; e.sE = s;
}

/* ---------- mechanical rules (ordered) ---------- */
let ruleMoves = 0;
const log = [];
function mv(e, g, s, why) {
  if (e.g === g && (e.sE || '') === s) return;
  log.push(`${e.src} ${e.id} ${e.g}/${e.sE} -> ${g}/${s}  [${why}] ${e.nE}`);
  e.g = g; e.sE = s; ruleMoves++;
}
for (const e of arr) {
  if (moved.has(e.id)) continue;
  if (e.g === 'stretching' || e.g === 'warmup' || e.g === 'fullbody') continue;
  const n = e.nE || '';
  const nl = n.toLowerCase();
  const g = e.g;
  /* 1. joint articulation drills */
  if (/articulations/i.test(n)) { mv(e, 'warmup', 'General', 'articulation'); continue; }
  /* 2. self-myofascial release */
  if (/^Roll |Roll Ball|Tiger Tail|Foam Roll(?!.*Serratus)/i.test(n)) { mv(e, 'stretching', 'General', 'smr'); continue; }
  /* 3. stretches */
  if (/\bstretch/i.test(n) && !/outstretch/i.test(n)) { mv(e, 'stretching', 'General', 'stretch'); continue; }
  /* 4. superman family */
  if (/superman/i.test(n) && (g === 'legs' || g === 'abdominals')) { mv(e, 'back', 'Lower Back', 'superman'); continue; }
  /* 5. climbers / inchworm in legs */
  if (/(mountain climber|inchworm)/i.test(n) && g === 'legs') { mv(e, 'fullbody', 'General', 'climber'); continue; }
  /* 6. pure shoulder taps */
  if (/shoulder tap/i.test(n) && !/push.?up/i.test(n)) { mv(e, 'abdominals', 'Upper', 'tap'); continue; }
  /* 7. leg raises living in legs */
  if (g === 'legs' && /(leg raise|leg lift)/i.test(n)) {
    if (/(side|to side)/i.test(nl)) mv(e, 'legs', 'Abductors', 'legraise-side');
    else if (/standing/i.test(nl)) mv(e, 'legs', 'Hip Flexors', 'legraise-stand');
    else if (/prone/i.test(nl)) mv(e, 'legs', 'Glutes', 'legraise-prone');
    else mv(e, 'abdominals', 'Lower', 'legraise');
    continue;
  }
  /* 8. glute kickbacks in legs */
  if (g === 'legs' && /kickback/i.test(n) && !/biceps|triceps/i.test(nl)) { mv(e, 'legs', 'Glutes', 'kickback'); continue; }
  /* 9. hip extension work */
  if (/hip extension/i.test(n) && !/stretch|articulat|reverse hyper/i.test(nl)) {
    if (g !== 'legs') mv(e, 'legs', 'Glutes', 'hipext-move');
    else if (e.sE !== 'Glutes') mv(e, 'legs', 'Glutes', 'hipext-sub');
    continue;
  }
  /* 10. plank family in legs */
  if (g === 'legs' && /plank/i.test(n)) { mv(e, 'abdominals', /side plank/i.test(nl) ? 'Obliques' : 'Upper', 'plank'); continue; }
  /* 11. wood chops */
  if (/wood chop/i.test(n)) {
    if (g !== 'abdominals') mv(e, 'abdominals', 'Obliques', 'woodchop');
    else if (e.sE !== 'Obliques') mv(e, 'abdominals', 'Obliques', 'woodchop-sub');
    continue;
  }
  /* 12. overhead presses → Front (except prone press; pressdowns/rows excluded) */
  if (g === 'shoulders' && /press/i.test(n) && !/pressdown|pushdown|leg press|bench press|chest press|row/i.test(nl)) {
    if (e.sE !== 'Front' && e.sE !== 'Rotator Cuff' && e.sE !== 'Rear') mv(e, 'shoulders', 'Front', 'press-sub');
    continue;
  }
  /* 13. close-grip presses belong to triceps */
  if (/(close.?grip|narrow)/i.test(nl) && /(press|push.?up|bench)/i.test(nl) && !/military|shoulder press|chest press/i.test(nl) && g !== 'triceps') {
    mv(e, 'triceps', 'Compound', 'closegrip'); continue;
  }
  /* 14. reverse curls misfiled in forearms */
  if (g === 'forearms' && /(reverse|revers) (grip )?(biceps )?curl/i.test(n) && !/wrist/i.test(nl)) {
    mv(e, 'elbow_flexors', 'Brachioradialis', 'revcurl'); continue;
  }
  /* 15. chest press machines stuck in legs */
  if (g === 'legs' && /chest press/i.test(n)) { mv(e, 'chest', 'Middle', 'chestpress'); continue; }
  /* 16. olympic lifts */
  if (/(clean|snatch)/i.test(nl) && !/shrug/i.test(nl) && !/clean and press|clean &/i.test(nl)) {
    if (['chest','shoulders','back','elbow_flexors','triceps'].includes(g)) { mv(e, 'fullbody', 'General', 'oly'); continue; }
  }
  /* 17. elevated-heel squats stuck in Calves */
  if (g === 'legs' && e.sE === 'Calves' && /squat/i.test(n) && !/heel raise|calf/i.test(nl)) { mv(e, 'legs', 'Quadriceps', 'heelsquat'); continue; }
  /* 18. glute bridges / hip thrusts in back */
  if (g === 'back' && /(glute bridge|hip thrust|butt bridge)/i.test(nl)) { mv(e, 'legs', 'Glutes', 'bridge'); continue; }
  /* 19. grip machines in forearms → Grip subgroup */
  if (g === 'forearms' && /(gripper|plate pinch|apollons|farmer|hand squeeze|handboard|hangboard)/i.test(nl) && e.sE !== 'Grip') {
    mv(e, 'forearms', 'Grip', 'grip-sub'); continue;
  }
}

/* ---------- unify display names + write s ---------- */
let dispFix = 0;
for (const e of arr) {
  const gd = GROUP_DISPLAY[e.g];
  const sd = SUB_I18N[e.sE] || null;
  if (!gd) { console.log('  ?? unknown group ' + e.g + ' on ' + e.id); continue; }
  if (e.gE !== gd.en || e.gR !== gd.ru || e.gH !== gd.he) dispFix++;
  e.gE = gd.en; e.gR = gd.ru; e.gH = gd.he;
  if (sd) { e.sE = e.sE || 'General'; e.sR = sd.ru; e.sH = sd.he; e.s = e.sE; }
  else { e.s = e.sE; }
}

fs.writeFileSync(FILE, JSON.stringify(arr, null, 1));

/* ---------- report ---------- */
console.log('== result ==');
console.log('explicit moves: ' + explicitMoves);
console.log('rule moves: ' + ruleMoves);
console.log('display fixes: ' + dispFix);
const byG = {};
arr.forEach(e=>{ byG[e.g] = (byG[e.g]||0)+1; });
console.log('groups now: ' + JSON.stringify(byG));
fs.writeFileSync(path.join(ROOT, 'reports', 'group-audit-c58-rules.txt'), log.join('\n'));
const customs2 = arr.filter((e) => /^gi_9100\d$/.test(e.id));
console.log('customs intact: ' + (JSON.stringify(customs2) === JSON.stringify(customs) ? 'YES' : 'NO!!!'));
