/* c188 muscle-work model: per-muscle percentages, card rendering, analytics
   and recovery credit. Hand-computed Bulgarian split squat expectations. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const db = JSON.parse(fs.readFileSync(path.join(root, 'exercise-db.json'), 'utf8'));
const byId = new Map(db.map(r => [r.id, r]));
for (const f of ['src/muscle-core.js', 'src/muscle-roles.js', 'src/recovery-engine.js', 'src/analytics-engine.js']) {
  new Function(fs.readFileSync(path.join(root, f), 'utf8'))();
}
const CORE = globalThis.dkMuscleCore;
const ROLES = globalThis.dkMuscleRoles;
const REC = globalThis.dkRecoveryEngine;
const ANA = globalThis.dkAnalyticsEngine;
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('PASS ' + name); }
  else { fail++; console.log('FAIL ' + name + (extra == null ? '' : ' -> ' + extra)); }
}
function eq(name, got, want) {
  ok(name, JSON.stringify(got) === JSON.stringify(want),
    'got ' + JSON.stringify(got) + ' want ' + JSON.stringify(want));
}

ok('core c188', CORE.version === 'c188');
ok('roles c188', ROLES.version === 'c188');
ok('analytics c188', ANA.version === 'c188');
ok('recovery c188', REC.version === 'c188');
ok('DB still 5623', db.length === 5623, db.length);

/* ---------- every exercise has a complete, sane profile ---------- */
const VALID = new Set(['legs', 'chest', 'back', 'shoulders', 'elbow_flexors', 'triceps', 'forearms', 'abdominals']);
let sumBad = 0, noStab = 0, noSyn = 0, lowPrimary = 0, dup = 0, badGroup = 0, tooLong = 0;
let filledNoSyn = 0;
for (const ex of db) {
  const r = ROLES.forExercise(ex);
  const sum = r.muscles.reduce((s, x) => s + x.pct, 0);
  if (sum !== 100) sumBad++;
  if (!r.muscles.some(x => x.role === 'stabilizer')) noStab++;
  if (!r.muscles.some(x => x.role === 'synergist')) noSyn++;
  if (!r.primary || r.primary.pct < 20) lowPrimary++;
  if (new Set(r.muscles.map(x => x.key)).size !== r.muscles.length) dup++;
  if (r.muscles.some(x => !VALID.has(x.group))) badGroup++;
  if (r.muscles.length > 8) tooLong++;
  if (!(ex.synergists || []).length && r.muscles.length > 2) filledNoSyn++;
}
eq('all role profiles sum to 100', sumBad, 0);
eq('all profiles have a stabilizer', noStab, 0);
eq('all profiles have a synergist', noSyn, 0);
eq('all profiles have a dominant primary', lowPrimary, 0);
eq('no duplicate muscle rows', dup, 0);
eq('all role groups canonical', badGroup, 0);
eq('max 8 listed muscles', tooLong, 0);
ok('exercises with no DB synergists get inferred helpers', filledNoSyn > 3000, filledNoSyn);

/* ---------- the user's screenshot exercise ---------- */
const bss = byId.get('bf_barbell-bulgarian-split-squat');
const bssRoles = ROLES.forExercise(bss);
eq('Bulgarian split squat shares', bssRoles.muscles.map(x => [x.key, x.pct, x.role]), [
  ['Quads', 40, 'primary'],
  ['Glutes', 25, 'synergist'],
  ['Hams', 10, 'synergist'],
  ['Adductors', 8, 'synergist'],
  ['Calves', 5, 'synergist'],
  ['Abs', 12, 'stabilizer']
]);
ok('Bulgarian primary is Quadriceps', bssRoles.primary.key === 'Quads' && bssRoles.primary.group === 'legs');

/* an exercise with an empty DB synergist list still gets a full profile */
const emptySyn = byId.get('gi_3533');
const emptyRoles = ROLES.forExercise(emptySyn);
ok('empty-synergist Bulgarian still gets glutes+core',
  emptyRoles.muscles.some(x => x.key === 'Glutes') && emptyRoles.muscles.some(x => x.group === 'abdominals'));
ok('empty-synergist primary is still Quadriceps', emptyRoles.primary.key === 'Quads');

/* old history snapshot without subgroup/id details still works */
const oldSnapshot = { name: 'Dumbbell Bulgarian Split Squat', g: 'legs', syn: ['quadriceps', 'hamstrings'] };
const oldRoles = ROLES.forExercise(oldSnapshot);
ok('old history snapshot resolves', oldRoles.primary.key === 'Quads' && oldRoles.muscles.length >= 4);

/* full-body work is split across several canonical groups, not swallowed by
   the "fullbody" bucket (recovery now receives those contributions) */
const fullbody = db.filter(x => x.g === 'fullbody').map(x => ROLES.forExercise(x))
  .find(r => r.muscles.some(x => x.group === 'chest') && r.muscles.some(x => x.group === 'legs'));
ok('full-body profile spans legs + chest', !!fullbody);
ok('full-body primary is a real muscle group', !!fullbody && fullbody.primary.group !== 'fullbody');
ok('full-body has multiple major muscles', !!fullbody && fullbody.muscles.filter(x => x.major).length >= 2);

/* ---------- renderer ---------- */
const detail = ROLES.renderChips(bss, 'ru', { detailed: true });
ok('detailed card has work title', detail.includes('Работа мышц'));
ok('detailed card has stabilizer role', detail.includes('Стабилизатор'));
ok('detailed card has percentages', detail.includes('40%') && detail.includes('25%') && detail.includes('12%'));
const compact = ROLES.renderChips(bss, 'en', { maxAux: 2 });
ok('compact card has primary percentage', compact.includes('40%'));
ok('compact card has a stabilizer', compact.includes('Stabilizer') || compact.includes('○'));
ok('compact card wraps all labels', compact.includes('Quadriceps') && compact.includes('Glutes'));

/* ---------- attribution + engines ---------- */
const info = {
  group: 'legs', sub: 'Quadriceps', names: [bss.nE], equipment: 'barbell', mt: 'compound',
  contributions: bssRoles.muscles
};
const att = CORE.attribution(info, bss);
ok('attribution uses percentage model', att.model === 'pct');
ok('attribution keeps every contribution', att.contributions.length === 6);
ok('attribution primary group legs', att.primary === 'legs');
ok('contribution credits sum to 1', Math.abs(att.contributions.reduce((s, c) => s + c.credit, 0) - 1) < 1e-9);

const rec = {
  date: Date.now() - 3600000,
  exercises: [{ exercise_id: bss.id, name: bss.nE, unit: 'kg', sets: [{ weight: 100, reps: 10, done: true }] }]
};
const resolveEx = () => info;
const vol = ANA.volumeByMuscle([rec], { resolveEx, bodyWeightKg: 80 });
eq('analytics leg volume is 88% of 1000kg', Math.round(vol.byGroup.legs.volumeKg), 880);
eq('analytics abs stabilizer volume', Math.round(vol.byGroup.abdominals.volumeKg), 120);
eq('analytics primary quad volume', Math.round(vol.byGroup.legs.primaryKg), 400);
eq('analytics synergist leg volume', Math.round(vol.byGroup.legs.synergistKg), 480);
eq('analytics raw total stays 1000', vol.totalKg, 1000);
eq('analytics primary sets only', vol.byGroup.legs.sets, 1);

const rr = REC.compute({ workouts: [rec], bodyWeightKg: 80, now: Date.now(), resolveEx });
eq('recovery leg volume is 88%', Math.round(rr.groups.legs.volume30d), 880);
eq('recovery abs stabilizer volume', Math.round(rr.groups.abdominals.stabilizerVolume30d), 120);
eq('recovery leg sets count once', rr.groups.legs.sets7d, 1);
ok('recovery has quadriceps subgroup', !!rr.subgroups['legs:Quadriceps']);
ok('recovery has glutes subgroup', !!rr.subgroups['legs:Glutes']);
ok('recovery has hamstrings subgroup', !!rr.subgroups['legs:Hamstrings']);
ok('recovery has calves subgroup', !!rr.subgroups['legs:Calves']);
eq('recovery quad subgroup load = 40% of 1000/100', Math.round(rr.subgroups['legs:Quadriceps'].load30d * 10) / 10, 2);
eq('recovery glute subgroup load = 25%', Math.round(rr.subgroups['legs:Glutes'].load30d * 10) / 10, 1.3);
ok('recovery glutes are recovering, not untrained', rr.subgroups['legs:Glutes'].status !== 'untrained');

/* legacy fallback still works */
const legacy = CORE.attribution({ group: 'back', synergists: ['elbow_flexors'], stabilizers: ['abdominals'] }, {});
ok('legacy fallback retained', legacy.model === 'legacy' && legacy.synergists[0].credit === 0.3);

/* ---------- static wiring ---------- */
const crm = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const portal = fs.readFileSync(path.join(root, 'client.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const map = fs.readFileSync(path.join(root, 'src', 'muscle-map.js'), 'utf8');
const copy = fs.readFileSync(path.join(root, 'scripts', 'copy-assets.js'), 'utf8');
ok('trainer loads roles module', crm.includes('src/muscle-roles.js'));
ok('portal loads roles module', portal.includes('src/muscle-roles.js'));
ok('trainer modal asks for detailed breakdown', crm.includes('getExerciseMuscleChips(e, currentLang(), { detailed: true })'));
ok('portal modal asks for detailed breakdown', portal.includes('getExerciseMuscleChips(ex, currentLang, { detailed: true })'));
ok('trainer resolver passes contributions', crm.includes('contributions: roles ? roles.muscles : null'));
ok('trainer recovery cache computes roles', crm.includes('window.dkMuscleRoles.forExercise(ex)'));
ok('portal analytics resolver passes contributions', portal.includes('contributions: roles ? roles.muscles : null'));
ok('portal recovery resolver passes contributions', portal.includes('contributions: roles ? roles.muscles : null'));
ok('chips delegate to role model', map.includes('window.dkMuscleRoles.renderChips'));
ok('SW precaches roles module', sw.includes("'./src/muscle-roles.js'"));
ok('copy-assets ships roles module', copy.includes("'src/muscle-roles.js'"));
ok('trainer build c189', crm.includes('name="dk-build" content="c189"'));
ok('SW cache v216', sw.includes("dk-gym-v216"));

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exitCode = 1;
