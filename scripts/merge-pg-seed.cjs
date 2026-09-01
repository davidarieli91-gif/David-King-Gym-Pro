#!/usr/bin/env node
// Merge PG seed (484, эталон орфографии) в нашу exercise-db.json
// - Разбивает наши "бוסו / פיטבול" в два как у них
// - Обновляет name_he у совпадений к их орфографии (сохраняя id/ru/en/technique)
// - Добавляет их уникальные (с автогенерацией ru/en/technique)
// - Сохраняет station_default/source_ref
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const DB='G:/Antigravity/DavidKingGym/exercise-db.json';
const SEED='G:/Antigravity/DavidKingGym/scripts/pg-seed.json';
const REPORT='G:/Antigravity/DavidKingGym/reports/pg-diff-'+new Date().toISOString().slice(0,10)+'.json';

function normHe(s){
  return String(s||'').replace(/\s+/g,' ').trim()
    .replace(/[,"'.()]/g,'')
    .replace(/בוסו\s*\/\s*פיטבול/g,'בוסו')
    .replace(/פיטבול\s*\/\s*בוסו/g,'פיטבול')
    .replace(/כייבל קרוס כבל|כייבל קרוס|קרוסאובר|קרוס/g,'כבל')
    .replace(/פולי/g,'כבל')
    .replace(/\s+/g,' ').trim();
}
function genId(){ return crypto.randomUUID(); }

const db=JSON.parse(fs.readFileSync(DB,'utf8'));
const seed=JSON.parse(fs.readFileSync(SEED,'utf8'));
const pgDb=db.filter(x=>x.src==='pg' || x.source==='private_gym');
const other=db.filter(x=>!(x.src==='pg' || x.source==='private_gym'));

console.log(`Наша PG: ${pgDb.length}, их сид: ${seed.length}`);

// Map our normalized names to exercises
const ourByNorm=new Map();
pgDb.forEach(ex=>{
  const n=normHe(ex.name_he||ex.nH||'');
  if(!ourByNorm.has(n)) ourByNorm.set(n, []);
  ourByNorm.get(n).push(ex);
});
const theirByNorm=new Map();
seed.forEach(ex=>{
  const n=normHe(ex.name_he);
  if(!theirByNorm.has(n)) theirByNorm.set(n, []);
  theirByNorm.get(n).push(ex);
});

// 1) Разбить наши "בוסו / פיטבול"
let splitCount=0;
const expandedPg=[];
for(const ex of pgDb){
  const he=String(ex.name_he||ex.nH||'');
  if(he.includes(' / ') && he.includes('בוסו') && he.includes('פיטבול')){
    // Пример: "לחיצת חזה בשכיבה על בוסו / פיטבול כנגד משקולות"
    // -> "לחיצת חזה בשכיבה על בוסו כנגד משקולות" и "לחיצת חזה בשכיבה על פיטבול כנגד משקולות"
    const first=he.replace(' / פיטבול','').replace(' /פיטבול','');
    const second=he.replace('בוסו / ','').replace('בוסו/','');
    // first уже содержит "בוסו", second содержит "פיטבול"
    const ex1={...ex, id: ex.id, name_he: first, nH: first};
    const ex2={...ex, id: genId(), name_he: second, nH: second, source_ref: (ex.source_ref||'')+'-bosu-split'};
    // Обновим ru/en для второй тоже (копируем с заменой слова)
    if(ex.name_ru) ex2.name_ru=ex.name_ru.replace('босу','фитбол').replace('Босу','Фитбол');
    if(ex.name_en) ex2.name_en=ex.name_en.replace('Bosu','Fitball');
    expandedPg.push(ex1, ex2);
    splitCount++;
  } else {
    expandedPg.push(ex);
  }
}
console.log(`Разбито слэшей בוסו/פיטבול: ${splitCount} -> +${splitCount} записей`);

// Перестроим карту после разбивки
const expandedByNorm=new Map();
expandedPg.forEach(ex=>{
  const n=normHe(ex.name_he||ex.nH||'');
  if(!expandedByNorm.has(n)) expandedByNorm.set(n, []);
  expandedByNorm.get(n).push(ex);
});

// 2) Сопоставление
let identical=0, reword=0;
const theirUnique=[];
const ourMatchedIds=new Set();

for(const s of seed){
  const n=normHe(s.name_he);
  const ours=expandedByNorm.get(n);
  if(ours && ours.length){
    // есть точное совпадение после нормализации
    identical++;
    // Обновим орфографию у первого совпадения к их эталону (сохраняя id/ru)
    const target=ours[0];
    if(target.name_he !== s.name_he){
      target.name_he=s.name_he; target.nH=s.name_he;
      reword++;
    }
    // Обновим служебные поля из их сида
    target.muscle_group=s.muscle_group;
    target.sub_category=s.sub_category;
    target.equipment=s.equipment;
    target.station_default=s.station_default ?? target.station_default ?? null;
    target.source_ref=s.source_ref;
    // Маппинг групп: у нас 11, у них 9 — оставим как есть, pgTargetRow уже мапит
    ourMatchedIds.add(target.id);
  } else {
    theirUnique.push(s);
  }
}

// 3) Наши уникальные (не в их сиде) — оставляем как есть (308 после разбивки? пересчитаем)
const ourUnique=expandedPg.filter(ex=>!ourMatchedIds.has(ex.id) && !theirByNorm.has(normHe(ex.name_he||ex.nH||'')));
console.log(`Идентичных (нормализовано): ${identical}, переписано орфографии: ${reword}, их уникальных для добавления: ${theirUnique.length}, наших уникальных оставляем: ${ourUnique.length}`);

// 4) Добавить их уникальные
let added=0;
for(const s of theirUnique){
  // Проверим, не дубль ли по нормализованному имени уже добавленному
  const n=normHe(s.name_he);
  if(expandedByNorm.has(n)) continue; // уже есть (вариант слэша)
  const newEx={
    id: genId(),
    src: 'pg',
    source: 'private_gym',
    g: s.muscle_group,
    gE: s.muscle_group, gR: s.muscle_group, gH: s.muscle_group,
    sE: s.sub_category, sR: s.sub_category, sH: s.sub_category,
    e: s.equipment, eE: s.equipment, eR: s.equipment, eH: s.equipment,
    nE: s.name_he, nR: s.name_he, nH: s.name_he,
    name_en: s.name_he, name_ru: s.name_he, name_he: s.name_he,
    group_canonical: s.muscle_group,
    subgroup_en: s.sub_category,
    equipment_type: s.equipment,
    station_default: s.station_default,
    source_ref: s.source_ref,
    // Техника — автогенерация (как у остальных PG): поза + шаги
    t: `Техника: выполните ${s.name_he}. Контролируйте движение, держите корпус стабильно.`,
    tRu: `Техника: выполните ${s.name_he}. Контролируйте движение, держите корпус стабильно.`,
    tHe: `טכניקה: בצע ${s.name_he} בצורה מבוקרת.`,
    i: [],
    synergists: [],
    pg: { pose: 'standing' },
    is_archived: false
  };
  expandedPg.push(newEx);
  added++;
}

console.log(`Добавлено их уникальных: ${added}`);

// 5) Сборка итоговой БД
const finalDb=[...other, ...expandedPg];
console.log(`Итого PG: ${expandedPg.length} (было ${pgDb.length}), всего в БД: ${finalDb.length}`);

// Отчёт
const report={
  date: new Date().toISOString(),
  ourBefore: pgDb.length,
  theirSeed: seed.length,
  splitCount,
  identical,
  reword,
  theirUniqueTotal: theirUnique.length,
  added,
  ourUniqueKept: ourUnique.length,
  finalPg: expandedPg.length,
  finalTotal: finalDb.length
};
fs.mkdirSync(path.dirname(REPORT), {recursive:true});
fs.writeFileSync(REPORT, JSON.stringify(report,null,2));
console.log(`Отчёт: ${REPORT}`, report);

// Запись
fs.writeFileSync(DB, JSON.stringify(finalDb,null,1));
console.log(`Записано ${DB}`);
