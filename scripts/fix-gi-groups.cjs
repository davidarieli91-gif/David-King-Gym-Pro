#!/usr/bin/env node
// GI audit: manual group/equipment for the 26 records with empty source metadata.
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DB_PATH = path.join(ROOT, 'exercise-db.json');

const GROUP_LABEL = {
  abdominals: ['Мышцы кора', 'בטן'], shoulders: ['Плечи', 'כתפיים'],
  legs: ['Ноги', 'רגליים'], back: ['Спина', 'גב'], chest: ['Грудь', 'חזה'],
  elbow_flexors: ['Сгибатели локтя', 'כופפי מרפק'], warmup: ['Разминка', 'חימום'],
  forearms: ['Предплечья', 'אמות'], triceps: ['Трицепс', 'יד אחורית'],
  fullbody: ['Всё тело', 'כל הגוף'], stretching: ['Растяжка', 'מתיחות'],
};
const EQ = {
  bodyweight: ['bodyweight', 'Body weight', 'Вес тела', 'משקל גוף'],
  machine: ['machine', 'Machine', 'Тренажёр', 'מכשיר'],
  smith_machine: ['smith_machine', 'Smith machine', 'Тренажёр Смита', 'מכשיר סמית'],
  medicine_ball: ['medicine_ball', 'Medicine ball', 'Медбол', 'כדור כוח'],
};
// id -> [group, equipKey]
const FIX = {
  'gi_3180': ['back', 'machine'], 'gi_5029': ['back', 'bodyweight'],
  'gi_1785': ['stretching', 'bodyweight'], 'gi_6747': ['legs', 'bodyweight'],
  'gi_6771': ['legs', 'bodyweight'], 'gi_4693': ['legs', 'bodyweight'],
  'gi_4656': ['legs', 'bodyweight'], 'gi_6770': ['legs', 'bodyweight'],
  'gi_7176': ['legs', 'machine'], 'gi_3760': ['abdominals', 'machine'],
  'gi_1035': ['legs', 'machine'], 'gi_1882': ['legs', 'bodyweight'],
  'gi_5050': ['abdominals', 'bodyweight'], 'gi_2852': ['legs', 'bodyweight'],
  'gi_3475': ['legs', 'bodyweight'], 'gi_3476': ['legs', 'bodyweight'],
  'gi_1842': ['back', 'bodyweight'], 'gi_4383': ['fullbody', 'medicine_ball'],
  'gi_3395': ['legs', 'bodyweight'], 'gi_1050': ['legs', 'smith_machine'],
  'gi_6038': ['legs', 'smith_machine'], 'gi_3874': ['legs', 'smith_machine'],
  'gi_4171': ['back', 'smith_machine'], 'gi_4840': ['abdominals', 'bodyweight'],
  'gi_4405': ['stretching', 'bodyweight'], 'gi_1891': ['legs', 'bodyweight'],
};

const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
const byId = {};
db.forEach(x => { byId[x.id] = x; });
let n = 0;
for (const [id, [g, ek]] of Object.entries(FIX)) {
  const x = byId[id];
  if (!x) { console.log('MISS ' + id); continue; }
  x.g = g; x.gE = g; x.gR = GROUP_LABEL[g][0]; x.gH = GROUP_LABEL[g][1];
  const e = EQ[ek]; x.e = e[0]; x.eE = e[1]; x.eR = e[2]; x.eH = e[3];
  n++;
}
fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 1) + '\n');
console.log('fixed:', n);
const left = db.filter(x => x.src === 'gi' && x.g === 'fullbody');
console.log('gi still fullbody:', left.length, left.map(x => x.id).join(','));
