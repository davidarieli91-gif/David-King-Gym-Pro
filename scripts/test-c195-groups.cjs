/* c202 — canonical equipment taxonomy + RepDB subgroup/group cleanup.
   Validates the dataset, the shared taxonomy module, and the UI wiring. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const legacy = JSON.parse(fs.readFileSync(path.join(root, 'exercise-db.json'), 'utf8'));
const rdb = JSON.parse(fs.readFileSync(path.join(root, 'exercise-db-rdb.json'), 'utf8'));
const crm = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const tax = require('./exercise-taxonomy.cjs');
let pass = 0, fail = 0;
function ok(name, cond) { cond ? pass++ : fail++; console.log((cond ? 'PASS ' : 'FAIL ') + name); }
function has(s, x) { return s.indexOf(x) >= 0; }
function countBy(list, fn) {
  const out = {};
  for (const item of list) { const k = fn(item); out[k] = (out[k] || 0) + 1; }
  return out;
}

/* ---------- taxonomy module ---------- */
ok('canonical taxonomy has 33 equipment types', Object.keys(tax.EQUIPMENT_TAXONOMY).length === 33);
ok('equipment order has no duplicates', new Set(tax.EQUIPMENT_ORDER).size === tax.EQUIPMENT_ORDER.length);
ok('every ordered key is defined', tax.EQUIPMENT_ORDER.every(k => tax.EQUIPMENT_TAXONOMY[k]));
ok('every taxonomy key is ordered', Object.keys(tax.EQUIPMENT_TAXONOMY).every(k => tax.EQUIPMENT_ORDER.includes(k)));
ok('free weights come first', tax.EQUIPMENT_ORDER.slice(0, 8).join(',') === 'barbell,ez_bar,trap_bar,plate,dumbbell,kettlebell,cable,machine');
ok('Other is last', tax.EQUIPMENT_ORDER[tax.EQUIPMENT_ORDER.length - 1] === 'other');
ok('all labels have EN/RU/HE', Object.values(tax.EQUIPMENT_TAXONOMY).every(v => v.en && v.ru && v.he));
ok('all RU/HE labels are translated', Object.values(tax.EQUIPMENT_TAXONOMY).every(v => v.ru !== v.en && v.he !== v.en));
ok('no corrupted question-mark labels', !Object.values(tax.EQUIPMENT_TAXONOMY).some(v => /\?{3,}/.test(v.ru + v.he)));

/* ---------- every record maps to a real canonical type ---------- */
const all = [...legacy, ...rdb];
const mapped = all.map(e => tax.canonicalEquipment(e.e, e.nE, e.is_bodyweight));
ok('all 6273 records normalise', mapped.length === 6273);
ok('no record falls into Other', mapped.every(k => k !== 'other'));
ok('no unknown canonical keys', mapped.every(k => tax.EQUIPMENT_TAXONOMY[k]));

const bySource = countBy(legacy, e => e.src);
ok('legacy source counts unchanged (bf=324 gv=1030 gi=4269)', bySource.bf === 324 && bySource.gv === 1030 && bySource.gi === 4269);
ok('RepDB remains 650', rdb.length === 650);

const eqBySource = {};
for (const src of ['bf', 'gv', 'gi']) {
  eqBySource[src] = countBy(legacy.filter(e => e.src === src), e => tax.canonicalEquipment(e.e, e.nE, e.is_bodyweight));
}
eqBySource.rdb = countBy(rdb, e => tax.canonicalEquipment(e.e, e.nE, e.is_bodyweight));

ok('Burnfit has 6 equipment groups', Object.keys(eqBySource.bf).length === 6);
ok('Burnfit groups: machine/dumbbell/barbell/bodyweight/ez/kettlebell',
  eqBySource.bf.machine === 94 && eqBySource.bf.dumbbell === 53 && eqBySource.bf.barbell === 62 &&
  eqBySource.bf.bodyweight === 97 && eqBySource.bf.ez_bar === 5 && eqBySource.bf.kettlebell === 13);
ok('GymVisual no longer hides exercise_ball/foam_roll in Bodyweight',
  eqBySource.gv.stability_ball === 28 && eqBySource.gv.foam_roller === 8 && eqBySource.gv.ab_wheel === 2 && eqBySource.gv.weighted === 29);
ok('GymImpulse separates bar band/suspension/rings/battling ropes',
  eqBySource.gi.band === 341 && eqBySource.gi.suspension === 111 && eqBySource.gi.rings === 6 &&
  eqBySource.gi.battle_rope === 19 && eqBySource.gi.mobility_stick === 24);
ok('GymImpulse separates Strongman/Sandbag/Sled/Plate',
  eqBySource.gi.strongman === 23 && eqBySource.gi.sandbag === 10 && eqBySource.gi.sled === 32 && eqBySource.gi.plate === 18);
ok('RepDB equipment groups are all real',
  eqBySource.rdb.bodyweight === 197 && eqBySource.rdb.pull_up_bar === 25 && eqBySource.rdb.dip_station === 3 &&
  eqBySource.rdb.rings === 9 && eqBySource.rdb.kettlebell === 62 && eqBySource.rdb.cable === 31 &&
  eqBySource.rdb.ab_wheel === 1 && eqBySource.rdb.jump_rope === 1 && eqBySource.rdb.sled === 2);
ok('RepDB JSON equipment fields already canonical', rdb.every(e => e.e in tax.EQUIPMENT_TAXONOMY));
ok('RepDB JSON labels match taxonomy', rdb.every(e => {
  const t = tax.EQUIPMENT_TAXONOMY[e.e];
  return t && e.eE === t.en && e.eR === t.ru && e.eH === t.he;
}));

/* ---------- RepDB leg split ---------- */
const legs = rdb.filter(e => e.g === 'legs');
const legSubs = countBy(legs, e => e.sE);
ok('RepDB legs total stays 142', legs.length === 142);
ok('RepDB Quads 67', legSubs.Quadriceps === 67);
ok('RepDB Hamstrings 21', legSubs.Hamstrings === 21);
ok('RepDB Glutes 19', legSubs.Glutes === 19);
ok('RepDB Calves 13', legSubs.Calves === 13);
ok('RepDB Abductors 15', legSubs.Abductors === 15);
ok('RepDB Adductors 7', legSubs.Adductors === 7);
ok('no leg exercise hides in General', !legSubs.General);
ok('squats/lunges are Quadriceps', ['rdb_bodyweight-squat', 'rdb_squat', 'rdb_lunge', 'rdb_barbell-lunge', 'rdb_leg-press', 'rdb_step-ups'].every(id => {
  const e = rdb.find(x => x.id === id);
  return e && e.sE === 'Quadriceps';
}));
ok('hinges/curls are Hamstrings', ['rdb_romanian-deadlift', 'rdb_cable-pull-through', 'rdb_kettlebell-swing', 'rdb_leg-curl', 'rdb_good-morning'].every(id => {
  const e = rdb.find(x => x.id === id);
  return e && e.sE === 'Hamstrings';
}));
ok('bridges/thrusts/kickbacks are Glutes', ['rdb_glute-bridge', 'rdb_hip-thrust', 'rdb_cable-kickback', 'rdb_stability-ball-hip-bridge'].every(id => {
  const e = rdb.find(x => x.id === id);
  return e && e.sE === 'Glutes';
}));

/* ---------- every visible group/subgroup has exercises ---------- */
const groupCounts = countBy(rdb, e => e.g);
const groupsWithZero = Object.keys(groupCounts).filter(g => !groupCounts[g]);
ok('no RepDB group has zero exercises', groupsWithZero.length === 0);
ok('every RepDB subgroup count is positive', Object.keys(countBy(rdb, e => e.g + '|' + (e.sE || 'General'))).every(k => {
  const [g, s] = k.split('|');
  return rdb.some(e => e.g === g && (e.sE || 'General') === s);
}));
ok('all subgroup values have translations', [...new Set(all.map(e => e.sE).filter(Boolean))].every(s => crm.includes("'" + s + "':")));

/* ---------- app wiring ---------- */
ok('app has canonical taxonomy', has(crm, 'const EQUIPMENT_TAXONOMY = {') && has(crm, 'const EQUIPMENT_ORDER = ['));
ok('app has canonical converter', has(crm, 'function canonicalEquipmentKey(raw, nameEn, isBodyweight)'));
ok('app uses converter in unpack', has(crm, 'const equipmentKey = canonicalEquipmentKey(e.e, e.nE, e.is_bodyweight)'));
ok('app stores explicit canonical equipment type', has(crm, 'equipment_type: equipmentKey'));
ok('app uses converter for chips/filters', has(crm, 'function equipOf(e)') && has(crm, 'equipOf(e) === _equipFilter'));
ok('one canonical group order', (crm.match(/const GROUP_ORDER = \[/g) || []).length === 1);
ok('leg subgroup order is Quads→Hams→Glutes', has(crm, "legs: ['Quadriceps', 'Hamstrings', 'Glutes', 'Adductors', 'Abductors', 'Calves', 'Hip Flexors', 'Glutes + Quads']"));
ok('subgroups are counted and sorted', has(crm, 'groups[g].subgroups.set(s, (groups[g].subgroups.get(s) || 0) + 1)') && has(crm, 'subgroupOrderIndex(groupKey, a.name)'));
ok('picker renders subgroup counts', has(crm, '${item.count}</span>'));
ok('equipment chips show counts', has(crm, "${item.count}</span></button>"));
ok('stale equipment filter is dropped when chip disappears', has(crm, "!types.some(t => t.type === _equipFilter)") && has(crm, "_equipFilter = 'all';"));
ok('group click resets equipment', has(crm, "_equipFilter = 'all'; // c195: never keep an equipment chip across groups"));
ok('subgroup click resets equipment', has(crm, "_equipFilter = 'all'; // c195: subgroup switch resets equipment"));
ok('body-map click resets equipment', has(crm, "_equipFilter = 'all'; // c195: body-map selection resets equipment"));
ok('3D body-map click resets equipment', has(crm, "_equipFilter = 'all'; // c195: 3D body selection resets equipment"));
ok('external muscle filter resets equipment', has(crm, "_equipFilter = 'all'; // c195: external muscle jump starts with all equipment"));
ok('second exercise browser uses canonical taxonomy too', has(crm, 'var ORDER = (typeof GROUP_ORDER !== \'undefined\') ? GROUP_ORDER') && has(crm, 'return canonicalEquipmentKey(e.equipment_type || e.equipment_en || e.e'));
ok('second browser chips use canonical order', has(crm, 'var EQ_ORDER = (typeof EQUIPMENT_ORDER !== \'undefined\') ? EQUIPMENT_ORDER'));
ok('second browser drops stale equipment', has(crm, "if (_equip !== 'all' && !types[_equip]) _equip = 'all';"));
ok('auto-generator uses canonical equipment keys', has(crm, "home: ['dumbbell','band','bodyweight','weighted','assisted','bench','other']") && has(crm, "'mobility_stick','strongman','sandbag','wrist_roller','other'"));
ok('equipment form saves canonical fields', has(crm, 'obj.equipment_type = eqKey;') && has(crm, 'obj.equipment_en = eq.en;'));
ok('migration preserves trainer edits and patches in place', has(crm, 'async function migrateExerciseTaxonomyC195()') && has(crm, "const FLAG = 'migrated_taxonomy_c195';") && has(crm, 'r.updated_at = Date.now();'));
ok('migration runs on boot', has(crm, 'await migrateExerciseTaxonomyC195();'));
ok('seed syncs subgroup + folder + equipment into RepDB rows', has(crm, "'subgroup_en', 'subgroup_ru', 'subgroup_he',") && has(crm, "'folder_path', 'equipment_type', 'equipment_en', 'equipment_ru',") && has(crm, "const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);"));
ok('RepDB JSON is cache-busted', has(crm, "const EXERCISE_DB_BUST = 'v57';"));

/* ---------- build/deploy ---------- */
ok('trainer build c202', has(crm, 'name="dk-build" content="c202"'));
ok('login build c202', has(crm, '3 languages · c202'));
ok('RUNNING 202', has(crm, 'var RUNNING = 202;'));
ok('SW cache v229', has(sw, "CACHE_NAME = 'dk-gym-v229'"));
ok('SW keeps RepDB precache', has(sw, "'./exercise-db-rdb.json'"));

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exitCode = 1;
