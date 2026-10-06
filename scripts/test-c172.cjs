/* c172 test — subgroup recovery: engine math (real module), UI wiring, SVG zones. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const trainer = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const portal = fs.readFileSync(path.join(root, 'client.html'), 'utf8');
const engineSrc = fs.readFileSync(path.join(root, 'src', 'recovery-engine.js'), 'utf8');
const muscleMap = fs.readFileSync(path.join(root, 'src', 'muscle-map.js'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }
function eq(name, got, want) { const g = JSON.stringify(got), w = JSON.stringify(want); if (g === w) { pass++; console.log('PASS ' + name + ' = ' + g); } else { fail++; console.log('FAIL ' + name + ' got ' + g + ' want ' + w); } }
function count(s, sub) { let n = 0, i = 0; for (;;) { i = s.indexOf(sub, i); if (i < 0) return n; n++; i += sub.length; } }

/* ---------- UNIT: the REAL engine computes per-subgroup recovery ---------- */
require(path.join(root, 'src', 'recovery-engine.js'));
const E = globalThis.dkRecoveryEngine;
ok('engine exposes compute', !!E && typeof E.compute === 'function');
const DAY = 86400000;
const now = Date.parse('2026-10-04T12:00:00');
const mk = (daysAgo, exId, sets) => ({ date: now - daysAgo * DAY, exercises: [{ exercise_id: exId, sets }] });
const RES = {
  squat:    { group: 'legs',          sub: 'Quadriceps', syn: ['abdominals'] },
  curl:     { group: 'elbow_flexors', sub: 'Biceps' },
  pushdown: { group: 'triceps',       sub: 'Compound' },
  latraise: { group: 'shoulders',     sub: 'Middle' },
  wrist:    { group: 'forearms',      sub: 'Grip' }
};
const resolveEx = (ex) => {
  const r = RES[ex.exercise_id];
  return r ? { group: r.group, synergists: r.syn || [], sub: r.sub, names: [ex.exercise_id], equipment: '' } : null;
};
const workouts = [
  mk(0, 'squat', [{ weight: 100, reps: 5, done: true }, { weight: 100, reps: 5, done: true }]),
  mk(0, 'curl', [{ weight: 20, reps: 10, done: true }]),
  mk(1, 'pushdown', [{ weight: 30, reps: 10, done: true }]),
  mk(1, 'latraise', [{ weight: 10, reps: 12, done: true }]),
  mk(2, 'wrist', [{ weight: 10, reps: 15, done: true }])
];
const res = E.compute({ workouts, resolveEx, bodyWeightKg: 80, now });
ok('subgroups object returned', !!res.subgroups && typeof res.subgroups === 'object');
ok('legs:Quadriceps present', !!res.subgroups['legs:Quadriceps']);
eq('quads recovery after today (cold-start capacity = hardest day ×1.5)', res.subgroups['legs:Quadriceps'].recovery, 33);
eq('quads sets today counted', res.subgroups['legs:Quadriceps'].sets7d, 2);
ok('elbow_flexors:Biceps present', !!res.subgroups['elbow_flexors:Biceps']);
eq('biceps recovery (cold-start capacity floor 2)', res.subgroups['elbow_flexors:Biceps'].recovery, 50);
ok('shoulders:Middle present', !!res.subgroups['shoulders:Middle']);
ok('positional subgroup «Compound» excluded', !res.subgroups['triceps:Compound']);
ok('«Grip» excluded', !res.subgroups['forearms:Grip']);
ok('synergists never create subgroup entries', !res.subgroups['legs:Glutes'] && !res.subgroups['abdominals:Upper']);
ok('groups still returned unchanged', !!res.groups.legs && res.groups.legs.recovery < 100 && res.groups.triceps.sets7d >= 1);
eq('meta counts subgroups', res.meta.subgroupsComputed, 3);

/* ---------- STATIC: engine source ---------- */
ok('engine has the subgroup machinery', engineSrc.indexOf('SUB_EXCLUDED') >= 0 && engineSrc.indexOf('function subKeyFor(') >= 0 && engineSrc.indexOf('subgroups: subs') >= 0);
ok('subgroup capacity falls back to hardest day ×1.5', engineSrc.indexOf('dailyLoads90[dailyLoads90.length - 1] * 1.5') >= 0);

/* ---------- STATIC: trainer app ---------- */
ok('exCache carries the subgroup', trainer.indexOf("subgroup: ex.subgroup_en || ''") >= 0);
ok('resolveExCtx passes sub', (function () { const i = trainer.indexOf('function resolveExCtx(ex)'); return trainer.slice(i, i + 600).indexOf("sub: c.subgroup || ''") >= 0; })());
ok('resolveExCrm passes sub', (function () { const i = trainer.indexOf('function resolveExCrm(ex)'); return trainer.slice(i, i + 1000).indexOf('sub: sub') >= 0; })());
ok('map keeps _subData from the engine result', trainer.indexOf('let _subData = null;') >= 0 && trainer.indexOf('subgroups: res122.subgroups || {}') >= 0);
ok('SVG paths are filled by their own subgroup', (function () {
  /* two renderBodySVG definitions exist — take the recovery map's one */
  let idx = -1;
  for (;;) {
    idx = trainer.indexOf('function renderBodySVG()', idx + 1);
    if (idx < 0) return false;
    const body = trainer.slice(idx, idx + 4500);
    if (body.indexOf('rec-svg-container') >= 0) {
      return body.indexOf("getAttribute('data-subgroup')") >= 0 && body.indexOf('_subData[skey]') >= 0 && body.indexOf('subgroupLabel(subName)') >= 0;
    }
  }
})());
ok('muscle list shows indented subgroup rows', (function () { const i = trainer.indexOf('function renderMuscleList()'); const body = trainer.slice(i, i + 5200); return body.indexOf('rec-sub-row') >= 0 && body.indexOf('subgroupLabel(s.sub)') >= 0; })());
ok('Wrist Curls label added', trainer.indexOf("'Wrist Curls': { en: 'Wrist Curls'") >= 0);

/* ---------- STATIC: portal resolver ---------- */
ok('portal passes the subgroup through', portal.indexOf('sub: (exd && (exd.subgroup || exd.subgroup_en || exd.sE))') >= 0);

/* ---------- STATIC: SVG zones ---------- */
eq('Brachioradialis zones drawn (front×2, back×2, side×1)', count(muscleMap, 'data-subgroup="Brachioradialis"'), 5);
eq('Abductors zones drawn (back×2, side×1)', count(muscleMap, 'data-subgroup="Abductors"'), 3);

/* ---------- versions ---------- */
ok('sw cache at least v199', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 199; })());
ok('sw keeps c171 history and adds v199 c172', sw.indexOf('// v198: c171') >= 0 && sw.indexOf('// v199: c172') >= 0);
ok('RUNNING / dk-build at least c172', (function () {
  const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
  return !!r && !!b && Number(r[1]) >= 172 && Number(b[1]) >= 172;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
