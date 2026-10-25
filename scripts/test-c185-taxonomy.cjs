/* c185 taxonomy regression: 39 audited inversions fixed at the DB source,
   mirrored in the shared portal override map, and migrated in place. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..');
const raw = fs.readFileSync(path.join(root, 'exercise-db.json'), 'utf8');
const db = JSON.parse(raw);
const byId = new Map(db.map(r => [r.id, r]));
const { GROUPS, SUBGROUPS, FIXES } = require('./taxonomy-fixes-c185.cjs');
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('PASS ' + name); }
  else { fail++; console.log('FAIL ' + name + (extra == null ? '' : ' -> ' + extra)); }
}
function eq(name, got, want) { ok(name, JSON.stringify(got) === JSON.stringify(want), 'got ' + JSON.stringify(got) + ' want ' + JSON.stringify(want)); }

/* shared core override map */
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'src', 'muscle-core.js'), 'utf8'), ctx);
const CORE = ctx.window.dkMuscleCore;

ok('DB still parses', db.length === 5623, db.length);
ok('DB round-trips byte-identically', JSON.stringify(db) === raw);
ok('core c188', CORE && CORE.version === 'c188');
ok('45 curated fixes', FIXES.length === 45, FIXES.length);
ok('34 abs inversions', FIXES.filter(f => f.cat === 'abs').length === 34);
ok('5 other inversions', FIXES.filter(f => f.cat === 'other').length === 5);
ok('6 subgroup fixes', FIXES.filter(f => f.cat === 'subgroup').length === 6);

for (const fix of FIXES) {
  const r = byId.get(fix.id);
  const g = GROUPS[fix.group], s = SUBGROUPS[fix.sub];
  if (!r) { ok('record exists ' + fix.id, false); continue; }
  eq('DB group ' + fix.id, [r.g, r.gE, r.gR, r.gH], [g.g, g.gE, g.gR, g.gH]);
  eq('DB subgroup ' + fix.id, [r.s, r.sE, r.sR, r.sH], [s.s, s.sE, s.sR, s.sH]);
  eq('DB syn ' + fix.id, r.synergists, fix.syn);
  const cf = CORE.taxonomyFix(fix.id);
  ok('core override ' + fix.id, !!cf &&
    cf.group === g.g && cf.subgroup === s.s && JSON.stringify(cf.synergists) === JSON.stringify(fix.syn));
}

/* the exact reported exercise */
const target = byId.get('bf_weighted-abdominal-hip-thrust');
ok('target exists', !!target);
eq('target primary', target && [target.g, target.sE], ['abdominals', 'Lower']);
eq('target synergists', target && target.synergists, ['hip flexors', 'glutes', 'hamstrings']);
ok('target no longer credits core as synergist', target && !target.synergists.includes('core'));
ok('target action is abs in core map', CORE.taxonomyFix('bf_weighted-abdominal-hip-thrust').group === 'abdominals');

/* deliberately NOT changed: ambiguous abduction / adduction / prone / row work */
const untouched = [
  ['gi_4051', 'Side Lying Leg Raise', 'legs', 'Abductors'],
  ['gi_3929', 'Standing Side Leg Raise', 'legs', 'Abductors'],
  ['gi_3264', 'Side Plank Leg raise', 'legs', 'Abductors'],
  ['gi_3268', 'Lying Leg Raise to Side', 'legs', 'Abductors'],
  ['gi_9849', 'Side Plank Clamshell', 'legs', 'Abductors'],
  ['gi_3460', 'Side Plank Hip Adduction (bent knee)', 'legs', 'Adductors'],
  ['gv_1775', 'side plank hip adduction', 'legs', 'Adductors'],
  ['gi_6423', 'Bodyweight Triceps Extension from Plank Position', 'triceps', 'Compound'],
  ['gi_3266', 'Elbow Push up', 'abdominals', 'Upper'],       /* forearm plank hold */
  ['gi_10097', 'Weighted Plate Side-up Squat', 'abdominals', 'Obliques'] /* technique = side crunch */
];
for (const [id, name, g, s] of untouched) {
  const r = byId.get(id);
  ok('untouched ' + name, r && r.g === g && (r.sE || r.s) === s,
    r ? r.g + '/' + (r.sE || r.s) : 'missing');
}

/* subgroup corrections: group stayed legs, target moved to hip flexors/glutes */
const subgroup = [
  ['gi_4287', 'Knee Raise', 'Hip Flexors'],
  ['gi_10753', 'Resistance Band Seated Knee Raise', 'Hip Flexors'],
  ['gi_0459', 'Flutter Kicks', 'Glutes'],
  ['gi_1179', 'Flutter Kicks (version 2)', 'Glutes'],
  ['gi_4779', 'Reverse Flutter Kick on Floor (hand under head)', 'Glutes'],
  ['gi_4980', 'Reverse Flutter Kick on Floor (hand under head)', 'Glutes']
];
for (const [id, name, s] of subgroup) {
  const r = byId.get(id);
  ok('subgroup fixed ' + name, r && r.g === 'legs' && (r.sE || r.s) === s,
    r ? r.g + '/' + (r.sE || r.s) : 'missing');
}

/* trainer migration + cache/version wiring */
const crm = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const portal = fs.readFileSync(path.join(root, 'client.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
ok('trainer has c185 migration', crm.includes('migrateExerciseTaxonomyC185'));
ok('trainer migration flag', crm.includes("migrated_taxonomy_c186"));
ok('trainer boot calls migration', crm.includes('await migrateExerciseTaxonomyC185()'));
ok('trainer build c194', crm.includes('name="dk-build" content="c194"'));
ok('trainer RUNNING 194', crm.includes('var RUNNING = 194'));
ok('trainer DB cache-bust v54', crm.includes("EXERCISE_DB_BUST = 'v56'"));
ok('portal applies old-snapshot fixes', portal.includes('applyTaxonomyFixesToDB'));
ok('portal has dkTaxFix', portal.includes('function dkTaxFix'));
ok('portal dedupes override synergist groups', portal.includes('Array.from(new Set(fix185.synergists'));
ok('portal analytics resolves fixed id first', /function aGroupOf\(ex\)[\s\S]{0,350}dkTaxFix\(ex\.exercise_id/.test(portal));
ok('portal recovery resolves fixed id', /function recpExInfo\(key, ex\)[\s\S]{0,350}dkTaxFix\(key\)/.test(portal));
ok('SW cache v221', sw.includes("dk-gym-v221"));

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exitCode = 1;
