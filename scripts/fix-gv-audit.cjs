#!/usr/bin/env node
// GV audit: group fixes, canonical group labels, equipment RU/HE, synergist cleanup.
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DB_PATH = path.join(ROOT, 'exercise-db.json');

const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
const byId = {};
db.forEach(x => { byId[x.id] = x; });

// Canonical group labels (copied from bf records)
const GROUP_LABEL = {
  abdominals: ['Мышцы кора', 'בטן'], shoulders: ['Плечи', 'כתפיים'],
  legs: ['Ноги', 'רגליים'], back: ['Спина', 'גב'], chest: ['Грудь', 'חזה'],
  elbow_flexors: ['Сгибатели локтя', 'כופפי מרפק'], warmup: ['Разминка', 'חימום'],
  forearms: ['Предплечья', 'אמות'], triceps: ['Трицепс', 'יד אחורית'],
  fullbody: ['Всё тело', 'כל הגוף'], stretching: ['Растяжка', 'מתיחות'],
};
// Canonical target group per key (mirrors SYNERGIST_CANONICAL in muscle-map.js)
const CANON = (() => {
  const m = {
    chest: ['chest', 'upper chest', 'upper_chest', 'pectorals', 'pec', 'pecs', 'serratus anterior'],
    back: ['back', 'lats', 'lat', 'latissimus dorsi', 'middle back', 'middle_back', 'lower back', 'lower_back',
      'upper back', 'upper_back', 'trapezius', 'traps', 'rhomboids', 'teres minor', 'infraspinatus',
      'levator scapulae', 'levator_scapulae', 'spinal erectors', 'spinal_erectors', 'spine',
      'quadratus lumborum', 'quadratus_lumborum', 'rotator cuff', 'rotator_cuff'],
    shoulders: ['shoulders', 'deltoids', 'delts', 'delt', 'front deltoids', 'front_deltoids', 'front delts',
      'front_delts', 'front shoulders', 'rear deltoids', 'rear_deltoids', 'rear delts', 'rear_delts',
      'rear shoulders', 'rear_delt'],
    elbow_flexors: ['biceps', 'brachialis', 'brachioradialis', 'elbow flexors', 'elbow_flexors', 'arms'],
    triceps: ['triceps', 'anconeus'],
    forearms: ['forearms', 'forearm', 'grip', 'wrists', 'wrist extensors', 'wrist flexors'],
    abdominals: ['abdominals', 'abs', 'core', 'obliques', 'rectus abdominis', 'rectus_abdominis', 'upper_abs', 'upper abs'],
    legs: ['legs', 'quadriceps', 'quads', 'hamstrings', 'glutes', 'calves', 'calf', 'adductors', 'abductors',
      'gastrocnemius', 'soleus', 'hip flexors', 'hip_flexors', 'hip abductors', 'hips', 'shins',
      'tibialis anterior', 'groin', 'inner thighs'],
  };
  const rev = {};
  Object.entries(m).forEach(([canon, keys]) => keys.forEach(k => { rev[k] = canon; }));
  return rev;
})();
const canonOf = (s) => CANON[String(s).trim().toLowerCase()] || null;

// 1. Group moves
const MOVES = {
  'gv_0040': 'shoulders', // barbell front raise and pullover
  'gv_1772': 'chest',     // elbow lift - reverse push-up
  'gv_3664': 'shoulders', // dumbbell side plank with rear fly
  'gv_1343': 'legs',      // exercise ball prone leg raise
  'gv_1775': 'abdominals',// side plank hip adduction
};
let moved = 0, labeled = 0;
db.filter(x => x.src === 'gv').forEach(x => {
  if (MOVES[x.id] && x.g !== MOVES[x.id]) { x.g = MOVES[x.id]; moved++; }
  const lbl = GROUP_LABEL[x.g];
  if (lbl && (x.gR !== lbl[0] || x.gH !== lbl[1])) { x.gR = lbl[0]; x.gH = lbl[1]; labeled++; }
});

// 2. Equipment RU/HE
const EQUIP = {
  'body weight': ['Вес тела', 'משקל גוף'], 'cable': ['Трос', 'כבל'],
  'leverage machine': ['Рычажный тренажёр', 'מכשיר מנוף'], 'assisted': ['С поддержкой', 'בסיוע'],
  'medicine ball': ['Медбол', 'כדור כוח'], 'stability ball': ['Фитбол', 'כדור פיזיו'],
  'band': ['Эспандер', 'גומייה'], 'barbell': ['Штанга', 'מוט'], 'rope': ['Канат', 'חבל'],
  'dumbbell': ['Гантель', 'משקולת'], 'ez barbell': ['EZ-гриф', 'מוט EZ'],
  'sled machine': ['Санки (тренажёр)', 'מזחלת'], 'upper body ergometer': ['Эргометр для рук', 'ארגומטר ידיים'],
  'kettlebell': ['Гиря', 'קטלבל'], 'olympic barbell': ['Олимпийская штанга', 'מוט אולימפי'],
  'bosu ball': ['Босу', 'בוסו'], 'resistance band': ['Резиновая лента', 'רצועת התנגדות'],
  'roller': ['Ролик', 'גלגלת'], 'hammer': ['Молот', 'פטיש'], 'smith machine': ['Тренажёр Смита', 'מכשיר סמית'],
  'wheel roller': ['Колесо для пресса', 'גלגל בטן'], 'stationary bike': ['Велотренажёр', 'אופני כושר'],
  'elliptical machine': ['Эллипсоид', 'אליפטיקל'], 'stepmill machine': ['Степмилл', 'סטפמיל'],
  'weighted': ['С отягощением', 'עם משקל'],
};
let equiped = 0;
db.filter(x => x.src === 'gv').forEach(x => {
  const m = EQUIP[x.eE];
  if (m && (x.eR !== m[0] || x.eH !== m[1])) { x.eR = m[0]; x.eH = m[1]; equiped++; }
});

// 3. Synergists: drop non-muscles, normalize, dedupe vs target
const DROP = new Set(['cardiovascular system', 'feet', 'hands', 'ankles', 'ankle stabilizers', 'sternocleidomastoid']);
const NORM = { quads: 'quadriceps', 'inner thighs': 'adductors', groin: 'adductors' };
let synTouched = 0, synDropped = 0;
db.filter(x => x.src === 'gv').forEach(x => {
  const target = canonOf(x.g) || x.g;
  const seen = new Set();
  const out = [];
  (x.synergists || []).forEach(s => {
    const key = String(s).trim().toLowerCase();
    if (DROP.has(key)) { synDropped++; return; }
    const norm = NORM[key] || String(s).trim();
    const c = canonOf(norm);
    if (!c) { synDropped++; return; }
    if (c === target) return; // same as target — not secondary
    if (seen.has(c + '|' + norm.toLowerCase())) return;
    seen.add(c + '|' + norm.toLowerCase());
    out.push(norm);
  });
  if (JSON.stringify(out) !== JSON.stringify(x.synergists)) { x.synergists = out; synTouched++; }
});

fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 1) + '\n');
console.log('moved:', moved, '| labeled:', labeled, '| equiped:', equiped,
  '| synTouched:', synTouched, '| synDropped:', synDropped);
const empty = db.filter(x => x.src === 'gv' && (!x.synergists || !x.synergists.length));
console.log('gv with empty synergists:', empty.length);
