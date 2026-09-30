/* c127 engine unit test — hand-computed expectations */
const fs = require('fs');
const src = fs.readFileSync('/home/z/David-King-Gym-Pro/src/analytics-engine.js', 'utf8');
new Function(src)(); // IIFE sets globalThis.dkAnalyticsEngine
const E = globalThis.dkAnalyticsEngine;
if (!E) { console.log('FAIL: engine not exported'); process.exit(1); }

const NOW = new Date('2026-09-27T12:00:00Z').getTime();
const DAY = 86400000;
const D0 = NOW - 21 * DAY, D1 = NOW - 14 * DAY, D2 = NOW - 7 * DAY, D3 = NOW - 1 * DAY;

const W0 = { ts: D0, date: 'd0', exercises: [
  { exercise_id: 'e1', name: 'Bench Press', unit: 'kg', g: 'chest', syn: ['triceps'],
    sets: [{ weight: 90, reps: 10, done: true }] },
  { exercise_id: 'e3', name: 'Squat', unit: 'kg', g: 'legs', syn: [],
    sets: [{ weight: 140, reps: 5, done: true }, { weight: 140, reps: 5, done: true }, { weight: 140, reps: 5, done: true }] }
]};
const W1 = { ts: D2, date: 'd2', exercises: [
  { exercise_id: 'e1', name: 'Bench Press', unit: 'kg', g: 'chest', syn: ['triceps', 'shoulders'],
    sets: [{ weight: 100, reps: 10, rpe: 9, done: true }, { weight: 100, reps: 8, rpe: 8, done: true },
           { weight: 120, reps: 6, done: false }] }, /* prescription — must be ignored */
  { exercise_id: 'e2', name: 'Lat Pulldown', unit: 'lb', g: 'back', syn: ['biceps'],
    sets: [{ weight: 100, reps: 10, done: true }] } /* lb → 45.36 kg */
]};
const ALL = [W1, W0];
const RES = { chest: { group: 'chest', synergists: ['triceps', 'shoulders'] }, legs: { group: 'legs', synergists: [] },
              back: { group: 'back', synergists: ['biceps'] } };
const resolveEx = (ex) => RES[ex.g] || null;

let pass = 0, fail = 0;
function eq(name, got, want, tol) {
  const ok = tol != null ? Math.abs(got - want) <= tol : got === want;
  if (ok) { pass++; console.log('PASS ' + name + ' = ' + got); }
  else { fail++; console.log('FAIL ' + name + ' got ' + got + ' want ' + want); }
}

/* 1. recVolumeKg — done-only + lb→kg */
eq('recVolumeKg W1 (1800 + 453.6, prescription 120×6 ignored)', E.recVolumeKg(W1), 2254);
eq('recVolumeKg W0', E.recVolumeKg(W0), 3000);

/* legacy record WITHOUT done flags counts (tolerant rule) */
const LEG = { ts: D1, exercises: [{ exercise_id: 'e4', name: 'Lunge', unit: 'kg', g: 'legs', syn: [], sets: [{ weight: 20, reps: 10 }, { weight: 22, reps: 10 }] }] };
eq('legacy no-flags counts', E.recVolumeKg(LEG), 420);

/* 2. volumeByMuscle */
const vm = E.volumeByMuscle(ALL, { resolveEx, now: NOW });
eq('chest 2700', Math.round(vm.byGroup.chest.volumeKg), 2700);
eq('triceps 810 (30%)', Math.round(vm.byGroup.triceps.volumeKg), 810);
eq('shoulders 810 (30%)', Math.round(vm.byGroup.shoulders.volumeKg), 810);
eq('back 454 (lb)', Math.round(vm.byGroup.back.volumeKg), 454);
eq('biceps 136 (30% of 454)', Math.round(vm.byGroup.biceps.volumeKg), 136);
eq('legs 2100', Math.round(vm.byGroup.legs.volumeKg), 2100);
eq('totalKg pure primary', Math.round(vm.totalKg), 2700 + 2100 + 454);
eq('totalSets primary', vm.totalSets, 7);
eq('chest lastTs = D2', vm.byGroup.chest.lastTs, D2);

/* 3. exerciseSeries (bench) */
const series = E.exerciseSeries(ALL, { match: (ex) => ex.exercise_id === 'e1' });
eq('bench series length', series.length, 2);
eq('bench[0] topKg', series[0].topKg, 90);
eq('bench[0] e1rm 90×(1+10/30)', series[0].e1rm, 120);
eq('bench[1] topKg', series[1].topKg, 100);
eq('bench[1] e1rm 133.3', series[1].e1rm, 133.3, 0.06);
eq('bench[1] rpeAvg 8.5', series[1].rpeAvg, 8.5);
eq('bench[1] volumeKg 1800 (undone 720 ignored)', series[1].volumeKg, 1800);
eq('bench[1] setsDone', series[1].setsDone, 2);
eq('bench[1] avgWorkKg', series[1].avgWorkKg, 100);
eq('oldest-first', series[0].ts < series[1].ts, true);

/* 4. prs */
const pr = E.prs(ALL, { now: NOW, windowDays: 30 });
eq('bench bestWeight 100', pr.byKey['id:e1'].bestWeight.v, 100);
eq('bench bestE1rm 133.3', pr.byKey['id:e1'].bestE1rm.v, 133.3, 0.06);
eq('squat bestWeight 140', pr.byKey['id:e3'].bestWeight.v, 140);
eq('recent = weight PR + e1rm PR (baseline squat excluded)', pr.recent.length, 2);
eq('recent[0] type weight 100 prev 90', pr.recent.some(r => r.type === 'weight' && r.value === 100 && r.prev === 90), true);
eq('recent has e1rm 133.3 prev 120', pr.recent.some(r => r.type === 'e1rm' && r.value === 133.3 && r.prev === 120), true);

/* 5. weeklyRpe */
const wr = E.weeklyRpe(ALL, { resolveEx, now: NOW }, 8);
const wkD2 = wr.find(w => D2 >= w.weekStart && D2 < w.weekStart + 7 * DAY);
eq('week of D2 rpeAvg 8.5', wkD2 && wkD2.rpeAvg, 8.5);
eq('week of D2 hard sets 1 (rpe9)', wkD2 && wkD2.zones.hard.sets, 1);
eq('week of D2 moderate sets 1 (rpe8)', wkD2 && wkD2.zones.moderate.sets, 1);
const wkD0 = wr.find(w => D0 >= w.weekStart && D0 < w.weekStart + 7 * DAY);
eq('week of D0 sets 0 (no rpe recorded)', wkD0 && wkD0.sets, 0);
eq('8 weeks filled', wr.length, 8);

/* 6. bodySeries — slope hand-computed: weights 80/80.5/81/80.8 at 21/14/7/1d → 0.31 kg/wk */
const checks = [
  { ts: D0, date: 'c0', weight: 80 },
  { ts: D1, date: 'c1', weight: 80.5, waist: 80 },
  { ts: D2, date: 'c2', weight: 81, waist: 79, hip: 99 },
  { ts: D3, date: 'c3', weight: 80.8, waist: 78.5, hip: 98 }
];
const bs = E.bodySeries(checks, { now: NOW, days: 90 });
eq('deltaKg 0.8', bs.deltaKg, 0.8, 0.001);
eq('ratePerWeekKg 0.31', bs.ratePerWeekKg, 0.31, 0.01);
eq('waistDelta -1.5', bs.waistDelta, -1.5, 0.001);
eq('waistRatePerWeek -0.81', bs.waistRatePerWeek, -0.81, 0.02);
eq('ratioWaistHip 0.80', bs.ratioWaistHip, 0.8, 0.005);
eq('points 4', bs.points.length, 4);
/* c129: hip parity fields — 99→98 over 6d → -1/6 per day → -1.17/wk */
eq('hipDelta -1', bs.hipDelta, -1, 0.001);
eq('hipRatePerWeek -1.17', bs.hipRatePerWeek, -1.17, 0.02);
eq('waist/hip slope independence (waist rate unchanged)', bs.waistRatePerWeek, -0.81, 0.02);

/* 7. toKg / doneSets primitives */
eq('toKg lb', Math.round(E.toKg(100, 'lb') * 1000) / 1000, 45.359);
eq('toKg kg', E.toKg(100, 'kg'), 100);
eq('doneSets tolerant', E.doneSets([{ done: true }, { done: false }, {}]).length, 2);

console.log('---');
console.log('PASS ' + pass + ' / FAIL ' + fail);
process.exit(fail ? 1 : 0);
