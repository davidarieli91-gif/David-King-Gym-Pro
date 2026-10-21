/* c184 — one muscle core: performed, effective kg, primary/synergist/stabilizer,
   local days, warm-up exclusion. Hand-computed expectations. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
new Function(fs.readFileSync(path.join(root, 'src', 'muscle-core.js'), 'utf8'))();
new Function(fs.readFileSync(path.join(root, 'src', 'analytics-engine.js'), 'utf8'))();
new Function(fs.readFileSync(path.join(root, 'src', 'recovery-engine.js'), 'utf8'))();
const CORE = globalThis.dkMuscleCore;
const A = globalThis.dkAnalyticsEngine;
const R = globalThis.dkRecoveryEngine;
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }
function eq(name, got, want, tol) {
  const good = tol != null ? Math.abs(got - want) <= tol : got === want;
  if (good) { pass++; console.log('PASS ' + name + ' = ' + got); }
  else { fail++; console.log('FAIL ' + name + ' got ' + got + ' want ' + want); }
}

ok('core exported', !!CORE && CORE.version === 'c185');
ok('analytics engine version', A.version === 'c184');
ok('recovery engine version', R.version === 'c184');

/* performed = done OR touched; explicit undone prescription excluded */
eq('performed touched-only counts', CORE.performedSets([{ weight: 50, reps: 5, done: false, touched: true }]).length, 1);
eq('performed untouched prescription excluded', CORE.performedSets([{ weight: 50, reps: 5, done: false, performed: false }]).length, 0);
eq('legacy no flags counts', CORE.performedSets([{ weight: 50, reps: 5 }]).length, 1);
eq('warmup excluded from working sets', CORE.workingSets([{ weight: 50, reps: 20, type: 'warmup', done: true }, { weight: 100, reps: 5, done: true }]).length, 1);

/* weighted bodyweight: 80 kg body + 20 kg added = 100 kg per rep */
const ex = { exercise_id: 'pull', name: 'Pull-up', unit: 'kg' };
const set = { weight: 20, reps: 8, rpe: 8, done: true };
const info = { group: 'back', synergists: ['elbow_flexors'], names: ['Pull-up'], equipment: 'bodyweight', mt: 'compound' };
const m = CORE.setMetrics(ex, set, info, { bodyWeightKg: 80 });
eq('weighted pull-up effective kg', m.effectiveKg, 100);
eq('barbell squat stays external', CORE.setMetrics({ unit: 'kg' }, { weight: 140, reps: 5 }, { names: ['Barbell Squat'], equipment: 'barbell' }, { bodyWeightKg: 80 }).effectiveKg, 140);

const att = CORE.attribution(info, ex);
eq('primary', att.primary, 'back');
eq('synergist credit', att.synergists[0].credit, 0.30);
eq('stabilizers count', att.stabilizers.length, 2);
eq('stabilizer total credit', att.stabilizers.reduce((s, a) => s + a.credit, 0), 0.10, 0.0001);
ok('stabilizers include core + grip', att.stabilizers.some(a => a.group === 'abdominals') && att.stabilizers.some(a => a.group === 'forearms'));

const rec = { date: Date.now() - 3600000, exercises: [{ exercise_id: 'pull', name: 'Pull-up', unit: 'kg', sets: [set] }] };
const resolveEx = () => info;
const vm = A.volumeByMuscle([rec], { resolveEx, bodyWeightKg: 80 });
eq('analytics primary volume kg', Math.round(vm.byGroup.back.volumeKg), 800);
eq('analytics synergist 30%', Math.round(vm.byGroup.elbow_flexors.volumeKg), 240);
eq('analytics stabilizer 10% total', Math.round(vm.byGroup.abdominals.volumeKg + vm.byGroup.forearms.volumeKg), 80);
eq('analytics totalKg primary', vm.totalKg, 800);
eq('analytics totalSets primary', vm.totalSets, 1);
ok('analytics role breakdown', vm.byGroup.back.primaryKg === 800 && vm.byGroup.elbow_flexors.synergistKg === 240);

const rr = R.compute({ workouts: [rec], bodyWeightKg: 80, now: Date.now(), resolveEx });
eq('recovery primary volume', Math.round(rr.groups.back.primaryVolume7d), 800);
eq('recovery synergist volume', Math.round(rr.groups.elbow_flexors.synergistVolume7d), 240);
eq('recovery stabilizer volume', Math.round(rr.groups.abdominals.stabilizerVolume7d + rr.groups.forearms.stabilizerVolume7d), 80);
eq('recovery stabilizer sets not working sets', rr.groups.abdominals.sets7d, 0);
ok('recovery role fields exist', rr.groups.back.primaryLoad7d > 0 && rr.groups.elbow_flexors.synergistLoad7d > 0 && rr.groups.abdominals.stabilizerLoad7d > 0);

/* warm-up excluded from PR/e1RM/series */
const rec2 = { date: Date.now() - 1000, exercises: [{ exercise_id: 'bench', name: 'Bench', unit: 'kg', sets: [
  { weight: 50, reps: 20, type: 'warmup', done: true },
  { weight: 100, reps: 5, done: true }
] }] };
const series = A.exerciseSeries([rec2], { match: ex2 => ex2.exercise_id === 'bench', bodyWeightKg: 80 });
eq('series top set skips warmup', series[0].topKg, 100);
eq('series e1rm skips warmup', series[0].e1rm, Math.round(100 * (1 + 5 / 30) * 10) / 10, 0.01);
const pr = A.prs([rec2], { now: Date.now(), windowDays: 30 });
eq('PR best weight skips warmup', pr.byKey['id:bench'].bestWeight.v, 100);

/* local day helpers */
const d = new Date(); d.setHours(1, 0, 0, 0);
const ds = CORE.dayStart(d.getTime());
eq('local dayStart hour', new Date(ds).getHours(), 0);
eq('local dayDiff same day', CORE.dayDiff(d.getTime(), ds), 0);
eq('addDays', new Date(CORE.addDays(ds, 1)).getHours(), 0);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
