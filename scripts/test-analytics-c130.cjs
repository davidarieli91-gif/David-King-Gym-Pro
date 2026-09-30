/* c130 unit test — shared SVG builders + the chart data paths they consume.
   Hand-computed expectations on the same fixture style as c127's test. */
const fs = require('fs');
const src = fs.readFileSync('/home/z/David-King-Gym-Pro/src/analytics-engine.js', 'utf8');
new Function(src)(); // IIFE sets globalThis.dkAnalyticsEngine
const E = globalThis.dkAnalyticsEngine;
if (!E) { console.log('FAIL: engine not exported'); process.exit(1); }

const NOW = new Date('2026-09-27T12:00:00Z').getTime();
const DAY = 86400000;

let pass = 0, fail = 0;
function eq(name, got, want, tol) {
  const ok = tol != null ? Math.abs(got - want) <= tol : got === want;
  if (ok) { pass++; console.log('PASS ' + name + ' = ' + got); }
  else { fail++; console.log('FAIL ' + name + ' got ' + got + ' want ' + want); }
}
function ok(name, cond) {
  if (cond) { pass++; console.log('PASS ' + name); }
  else { fail++; console.log('FAIL ' + name); }
}

/* ---------- 1. sparkBarsSVG ---------- */
ok('sparkBars: empty input → empty string', E.sparkBarsSVG([]) === '');
ok('sparkBars: all-zero weeks → empty string (app renders its own no-data)', E.sparkBarsSVG([{ v: 0 }, { v: 0 }]) === '');

const bars = E.sparkBarsSVG([
  { v: 1200, label: '01.09' }, { v: 2400, label: '08.09' },
  { v: 0, label: '15.09' }, { v: 1800, label: '22.09' }
]);
ok('sparkBars: one rect per week (zero weeks stay visible as slots)', (bars.match(/<rect/g) || []).length === 4);
ok('sparkBars: labels 4× + value labels 3× (zero week gets no value)', (bars.match(/<text/g) || []).length === 7);
ok('sparkBars: max week accent-colored', bars.indexOf('#22d3ee') >= 0);
ok('sparkBars: max value labeled (2400 → compact 2.4k)', bars.indexOf('2.4k') >= 0);
ok('sparkBars: 1200 → compact 1.2k', bars.indexOf('1.2k') >= 0);
ok('sparkBars: zero week dimmed (opacity 0.18)', bars.indexOf('opacity="0.18"') >= 0);
ok('sparkBars: ltr direction for RTL hosts', bars.indexOf('direction:ltr') >= 0);
ok('sparkBars: label escaping', E.sparkBarsSVG([{ v: 5, label: '<x&y' }]).indexOf('&lt;x&amp;y') >= 0);
ok('sparkBars: custom fmt used', E.sparkBarsSVG([{ v: 1500 }], { fmt: v => 'X' + v }).indexOf('X1500') >= 0);

/* 100k tonnage week → k formatting */
const big = E.sparkBarsSVG([{ v: 123456, label: 'a' }]);
ok('sparkBars: 123456 → 123k', big.indexOf('123k') >= 0);

/* ---------- 2. progressLinesSVG ---------- */
ok('progressLines: empty → empty string', E.progressLinesSVG([]) === '');
ok('progressLines: nulls only → empty string', E.progressLinesSVG([{ a: null, b: null }]) === '');

const two = E.progressLinesSVG([
  { a: 80, b: 70, label: '01.09' },
  { a: 92.5, b: 80, label: '15.09' }
]);
ok('progressLines: two polylines (e1RM + top set)', (two.match(/<polyline/g) || []).length === 2);
ok('progressLines: four dots', (two.match(/<circle/g) || []).length === 4);
ok('progressLines: both series colors present', two.indexOf('#22d3ee') >= 0 && two.indexOf('#f59e0b') >= 0);
ok('progressLines: axis labels drawn', (two.match(/text-anchor="end"/g) || []).length >= 2);

const single = E.progressLinesSVG([{ a: 100, b: 90, label: 'x' }]);
ok('progressLines: single point still renders both lines', (single.match(/<polyline/g) || []).length === 2);

/* line skips null segments (e1RM impossible for reps-only? still numbers —
   test a null in the middle of series a) */
const gap = E.progressLinesSVG([
  { a: 80, b: 70 },
  { a: null, b: 75 },
  { a: 85, b: 78 }
]);
ok('progressLines: null segment skipped (a has 2 pts, b has 3)',
  (gap.match(/<circle/g) || []).length === 5);
ok('progressLines: label escaping', E.progressLinesSVG([{ a: 1, b: 2, label: '<b>' }]).indexOf('&lt;b&gt;') >= 0);

/* ---------- 3. exerciseSeries → chart data path (regression on the c127 layer) ---------- */
const W0 = { ts: NOW - 28 * DAY, exercises: [
  { exercise_id: 'e1', name: 'Bench', unit: 'kg', sets: [{ weight: 80, reps: 8, done: true }] }
]};
const W1 = { ts: NOW - 14 * DAY, exercises: [
  { exercise_id: 'e1', name: 'Bench', unit: 'kg', sets: [
    { weight: 40, reps: 10, type: 'warmup', done: true },   /* warmup: not a top set */
    { weight: 85, reps: 8, rpe: 8, done: true },
    { weight: 100, reps: 6, done: false }                   /* prescription ignored */
  ]}
]};
const W2 = { ts: NOW - 2 * DAY, exercises: [
  { exercise_id: 'e1', name: 'Bench', unit: 'lb', sets: [{ weight: 198, reps: 5, done: true }] } /* 198 lb ≈ 89.81 kg */
]};
const matchBench = ex => E.exKeyOf(ex) === 'id:e1';
const series = E.exerciseSeries([W2, W0, W1], { match: matchBench });
eq('series: 3 occurrences oldest-first', series.length, 3);
eq('series[0].e1rm (80×8 Epley)', series[0].e1rm, Math.round(80 * (1 + 8 / 30) * 10) / 10, 0.01);
eq('series[1].topKg skips warmup + prescription', series[1].topKg, 85);
eq('series[2].topKg lb→kg', series[2].topKg, 89.8, 0.1);
eq('series[2].e1rm lb→kg', series[2].e1rm, 89.8 * (1 + 5 / 30), 0.1);
/* the chart consumes e1rm/topKg — feed one point pair through the builder */
const prog = E.progressLinesSVG(series.map(p => ({ a: p.e1rm, b: p.topKg })));
ok('series→chart: 3 points render 2 lines × 3 dots', (prog.match(/<polyline/g) || []).length === 2 && (prog.match(/<circle/g) || []).length === 6);

/* ---------- 4. prs → feed data path ---------- */
const prs = E.prs([W2, W0, W1], { now: NOW, windowDays: 30 });
eq('prs: bench bestWeight = latest lb→kg 89.8', prs.byKey['id:e1'].bestWeight.v, 89.8, 0.1);
ok('prs: recent has entries within 30d window', prs.recent.length > 0);
ok('prs: recent sorted newest-first', prs.recent.every((p, i) => i === 0 || prs.recent[i - 1].ts >= p.ts));

/* ---------- 5. volumeWeekly → bars path (zero-fill + bucket) ----------
   NOW = Sun 2026-09-27 (local). Monday-start weeks → W0 (Sun Aug 30) sits in
   the Aug 24 week = index 3 of the 8-week window (Aug 3 … Sep 21); W1
   (Sun Sep 13) → Sep 7 week = index 5; W2 (Fri Sep 25) → Sep 21 week = index 7. */
const weeks = E.volumeWeekly([W0, W1, W2], { now: NOW }, 8);
eq('volumeWeekly: 8 buckets oldest-first', weeks.length, 8);
eq('volumeWeekly: W0 week bucket = 640 kg (idx 3)', Math.round(weeks[3].totalKg), 640);
eq('volumeWeekly: W1 week = 1080 kg (warmup 400 counts as tonnage + 85×8=680, idx 5)', Math.round(weeks[5].totalKg), 1080);
eq('volumeWeekly: W2 week bucket = 449 kg (89.81×5, idx 7)', Math.round(weeks[7].totalKg), 449);
eq('volumeWeekly: skipped weeks stay 0 (chart slots)', weeks[4].totalKg, 0);
const trendSvg = E.sparkBarsSVG(weeks.map(w => ({ v: w.totalKg, label: 'x' })));
ok('volumeWeekly→chart: 8 bars, 3 value labels (640/1.1k/449)', (trendSvg.match(/<rect/g) || []).length === 8 && trendSvg.indexOf('640') >= 0 && trendSvg.indexOf('1.1k') >= 0 && trendSvg.indexOf('449') >= 0);

/* ---------- 6. weeklyRpe → intensity strip path ---------- */
const rpe = E.weeklyRpe([W1], { now: NOW }, 4); /* idx0=Aug31, idx1=Sep7, idx2=Sep14, idx3=Sep21 */
eq('weeklyRpe: only the ONE rpe-tagged set counts (85×8 rpe8; warmup has no rpe; prescription skipped)', rpe[1].zones.moderate.sets, 1);
eq('weeklyRpe: hard zone 0 for this week', rpe[1].zones.hard.sets, 0);
eq('weeklyRpe: avg = 8', rpe[1].rpeAvg, 8);

console.log('---');
console.log('PASS ' + pass + ' / FAIL ' + fail);
process.exit(fail ? 1 : 0);
