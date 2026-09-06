#!/usr/bin/env node
// Step 2: convert GymImpulse records into exercise-db.json entries (src:"gi").
// Reads reports/gi-dryrun.json: imports `fresh` only (exact+fuzzy skipped).
// Names/descriptions EN now (nR/nH/tRu/tHe = EN placeholders for later phases).
// Idempotent: skips existing gi_<id>. Writes reports/gi-import.json summary.
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DB_PATH = path.join(ROOT, 'exercise-db.json');
const DS_PATH = path.join(ROOT, 'gymimpulse', 'data', 'exercises.en.jsonl');
const DRY = path.join(ROOT, 'reports', 'gi-dryrun.json');
const OUT = path.join(ROOT, 'reports', 'gi-import.json');

// canonical equipment key (mirrors GV EQ2E vocabulary)
const EQ2E = {
  'body weight': 'bodyweight', 'dumbbell': 'dumbbell', 'cable': 'cable', 'barbell': 'barbell',
  'leverage machine': 'machine', 'band': 'band', 'resistance band': 'band', 'kettlebell': 'kettlebell',
  'ez barbell': 'ez_bar', 'stability ball': 'stability_ball', 'medicine ball': 'medicine_ball',
  'smith machine': 'smith_machine', 'bosu ball': 'bosu', 'assisted': 'assisted', 'weighted': 'weighted',
  'rope': 'rope', 'roller': 'roller', 'roll': 'roller', 'rollball': 'roller',
  'olympic barbell': 'olympic_barbell', 'trap bar': 'trap_bar', 'sled machine': 'sled_machine',
  'power sled': 'sled_machine', 'hammer': 'hammer', 'suspension': 'other', 'stick': 'other',
  'battling rope': 'other', 'vibrate plate': 'other', 'wheel roller': 'wheel_roller',
  'body weight, bosu ball': 'bodyweight', 'other': 'other',
};
const EQUIP_RU_HE = {
  'body weight': ['Вес тела', 'משקל גוף'], 'dumbbell': ['Гантель', 'משקולת'],
  'cable': ['Трос', 'כבל'], 'barbell': ['Штанга', 'מוט'],
  'leverage machine': ['Рычажный тренажёр', 'מכשיר מנוף'], 'band': ['Эспандер', 'גומייה'],
  'resistance band': ['Резиновая лента', 'רצועת התנגדות'], 'kettlebell': ['Гиря', 'קטלבל'],
  'ez barbell': ['EZ-гриф', 'מוט EZ'], 'stability ball': ['Фитбол', 'כדור פיזיו'],
  'medicine ball': ['Медбол', 'כדור כוח'], 'smith machine': ['Тренажёр Смита', 'מכשיר סמית'],
  'bosu ball': ['Босу', 'בוסו'], 'assisted': ['С поддержкой', 'בסיוע'],
  'weighted': ['С отягощением', 'עם משקל'], 'rope': ['Канат', 'חבל'],
  'roller': ['Ролик', 'גלגלת'], 'roll': ['Ролик', 'גלגלת'], 'rollball': ['Роллбол', 'רולבול'],
  'olympic barbell': ['Олимпийская штанга', 'מוט אולימפי'], 'trap bar': ['Трэп-гриф', 'מוט טראפ'],
  'sled machine': ['Санки (тренажёр)', 'מזחלת'], 'power sled': ['Силовые санки', 'מזחלת כוח'],
  'hammer': ['Молот', 'פטיש'], 'suspension': ['Подвесные петли', 'רצועות אימון'],
  'stick': ['Палка', 'מקל'], 'battling rope': ['Канаты', 'חבלי באטל'],
  'vibrate plate': ['Виброплатформа', 'פלטפורמה רוטטת'], 'wheel roller': ['Колесо для пресса', 'גלגל בטן'],
};
// bodyParts -> canonical group
const BP2G = {
  'waist': 'abdominals', 'hips': 'legs', 'thighs': 'legs', 'calves': 'legs', 'back': 'back',
  'chest': 'chest', 'shoulders': 'shoulders', 'upper arms': 'elbow_flexors', 'forearms': 'forearms',
  'neck': 'back', 'cardio': 'warmup', 'plyometrics': 'legs', 'stretching': 'stretching',
  'yoga': 'stretching', 'full body': 'fullbody', 'weightlifting': 'legs', 'hands': 'forearms', 'feet': 'legs',
};
// anatomical target -> group keyword rules (order matters)
const TARGET_RULES = [
  [/chest|pectoralis|serratus/i, 'chest'],
  [/dorsi|rhomboid|trapezius|erector|spinae|lats?\b|teres|infraspinatus|levator|neck|scalene|sternocleidomastoid/i, 'back'],
  [/deltoid/i, 'shoulders'],
  [/biceps|brachialis|brachioradialis/i, 'elbow_flexors'],
  [/triceps|anconeus/i, 'triceps'],
  [/glute|quadriceps|hamstring|calf|calves|soleus|gastrocnemius|adductor|abductor|hip|thigh|iliopsoas|sartorius|tensor fasciae|tibialis|peroneus|popliteus|plantar/i, 'legs'],
  [/forearm|wrist|flexor|extensor|grip|hand/i, 'forearms'],
  [/abdominis|oblique|rectus|core\b/i, 'abdominals'],
  [/cardio|heart/i, 'warmup'],
];
function groupFromTarget(t) {
  if (!t) return null;
  for (const [re, g] of TARGET_RULES) if (re.test(t)) return g;
  return null;
}
// Canonical group labels (same as bf records)
const GROUP_LABEL = {
  abdominals: ['Мышцы кора', 'בטן'], shoulders: ['Плечи', 'כתפיים'],
  legs: ['Ноги', 'רגליים'], back: ['Спина', 'גב'], chest: ['Грудь', 'חזה'],
  elbow_flexors: ['Сгибатели локтя', 'כופפי מרפק'], warmup: ['Разминка', 'חימום'],
  forearms: ['Предплечья', 'אמות'], triceps: ['Трицепс', 'יד אחורית'],
  fullbody: ['Всё тело', 'כל הגוף'], stretching: ['Растяжка', 'מתיחות'],
};
function normEquip(e) {
  if (!e) return { key: 'other', eE: 'Other', eR: 'Другое', eH: 'אחר' };
  const raw = String(e).split(',')[0].trim();
  const key = raw.toLowerCase();
  const lbl = EQUIP_RU_HE[raw] || EQUIP_RU_HE[key] || [raw, raw];
  return { key: EQ2E[key] || 'other', eE: raw, eR: lbl[0], eH: lbl[1] };
}

const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
const ds = fs.readFileSync(DS_PATH, 'utf8').trim().split('\n').map(l => JSON.parse(l));
const dry = JSON.parse(fs.readFileSync(DRY, 'utf8'));
const byId = new Map(ds.map(x => [String(x.id), x]));
const have = new Set(db.filter(x => x.src === 'gi').map(x => x.id));

const steps = arr => (arr || []).map(s => String(s).trim()).filter(Boolean).join(' | ');
let imported = 0, skipped = 0;
const noBP = [], comboEq = [];
const freshIds = new Set(dry.fresh.map(f => f.dsId));

for (const f of dry.fresh) {
  const x = byId.get(f.dsId);
  if (!x) { skipped++; continue; }
  const gid = 'gi_' + x.id;
  if (have.has(gid)) { skipped++; continue; }
  // group: targetMuscle keywords -> bodyParts[0] -> type
  let g = groupFromTarget(x.targetMuscle);
  if (!g && x.bodyParts && x.bodyParts.length) {
    g = BP2G[String(x.bodyParts[0]).toLowerCase().trim()] || null;
    if (g === 'elbow_flexors' && /triceps/i.test(x.targetMuscle || '')) g = 'triceps';
  }
  if (!g) {
    if (x.type === 'Aerobic') g = 'warmup';
    else if (x.type === 'Stretching') g = 'stretching';
    else { g = 'fullbody'; noBP.push(gid + '|' + x.name); }
  }
  const eq = normEquip(x.equipment);
  if (String(x.equipment || '').includes(',')) comboEq.push(gid);
  const gl = GROUP_LABEL[g] || [g, g];
  const syn = [...(x.synergists || [])];
  if (x.targetMuscle && !syn.some(s => String(s).toLowerCase() === String(x.targetMuscle).toLowerCase())) syn.push(x.targetMuscle);
  db.push({
    id: gid, src: 'gi',
    g, gE: g, gR: gl[0], gH: gl[1],
    sE: '', sR: '', sH: '',
    e: eq.key, eE: eq.eE, eR: eq.eR, eH: eq.eH,
    nE: x.name, nR: x.name, nH: x.name,
    t: steps(x.instructions),
    tRu: steps(x.instructions),
    tHe: steps(x.instructions),
    i: ['images/gi_' + x.id + '.webp'],
    media_id: 'gi-' + x.id,
    source_url: x.source_url || '',
    attribution: '© GymImpulse — https://gymimpulse.com/',
    synergists: syn,
    pg: { pose: 'standing' },
  });
  imported++;
}

fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 1) + '\n');
fs.writeFileSync(OUT, JSON.stringify({ date: new Date().toISOString(), imported, skipped, total: db.length, noBP, comboEq: comboEq.length }, null, 1));
console.log(`imported=${imported} skipped=${skipped} total=${db.length} noBP=${noBP.length} comboEq=${comboEq.length}`);
console.log('summary:', OUT);
