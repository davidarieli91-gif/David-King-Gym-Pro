/* c230 unit test — the general client analytics hub.
   The portal (server/public/portal-full.html) and the trainer-share client
   (client.html) must stay byte-identical for the whole analytics block:
   markup, dashboard CSS, RU/EN/HE labels and the renderer JS. Also asserts
   the honest-data contract: no invented calories/water targets. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const P = fs.readFileSync(path.join(root, 'server/public/portal-full.html'), 'utf8');
const C = fs.readFileSync(path.join(root, 'client.html'), 'utf8');

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; console.log('PASS ' + name); }
  else { fail++; console.log('FAIL ' + name); }
}
function sliceBetween(s, a, b, from) {
  const i = s.indexOf(a, from || 0);
  if (i < 0) return null;
  const j = s.indexOf(b, i);
  if (j < 0) return null;
  return s.slice(i, j);
}
function count(s, needle) { return s.split(needle).length - 1; }

/* ---------- 1. the two apps mirror the same dashboard ---------- */
const pMarkup = sliceBetween(P, '<section id="tab-analytics"', '<section id="tab-recovery"');
const cMarkup = sliceBetween(C, '<section id="tab-analytics"', '<section id="tab-recovery"');
ok('portal has the analytics section', !!pMarkup);
ok('client has the analytics section', !!cMarkup);
ok('analytics markup is byte-identical in portal and client', pMarkup === cMarkup);

const pCss = sliceBetween(P, '/* ================= c230: GENERAL ANALYTICS DASHBOARD', '</style>');
const cCss = sliceBetween(C, '/* ================= c230: GENERAL ANALYTICS DASHBOARD', '</style>');
ok('dashboard CSS is byte-identical in portal and client', pCss === cCss);

const pI18n = sliceBetween(P, '/* ============ c230: GENERAL ANALYTICS LABELS', 'const t = k =>');
const cI18n = sliceBetween(C, '/* ============ c230: GENERAL ANALYTICS LABELS', 'const t = k =>');
ok('dashboard i18n merge block is byte-identical', pI18n === cI18n);

const pJs = sliceBetween(P, "let analyticsRange = 'month';", '/* ============ c93: TWO-WAY WORKOUT-HISTORY SYNC');
const cJs = sliceBetween(C, "let analyticsRange = 'month';", '/* ============ c93: TWO-WAY WORKOUT-HISTORY SYNC');
ok('dashboard renderer JS is byte-identical', pJs === cJs);

/* ---------- 2. information architecture (5 KPI + every system panel) ---------- */
const ids = [
  'analytics-metrics', 'ana-systems', 'ana-chart-modes', 'ana-chart-legend',
  'ana-weight-range', 'ana-weight-now', 'ana-goal', 'ana-strength-card',
  'ana-strength-ring', 'ana-strength', 'ana-body', 'analytics-calendar',
  'analytics-muscles', 'a-progress', 'analytics-recent', 'ana-recovery-ring',
  'ana-recovery', 'ana-recovery-body', 'ana-last', 'ana-nutrition', 'ana-plan',
  'ana-plan-card', 'ana-checkin', 'a-prs', 'analytics-weight-chart'
];
ok('every dashboard panel id is present', ids.every(id => pMarkup.indexOf('id="' + id + '"') >= 0));

const ranges = ['week', 'month', 'quarter', 'year', 'all'];
ok('all five range chips exist', ranges.every(r => pMarkup.indexOf('data-range="' + r + '"') >= 0));
const modes = ['general', 'strength', 'endurance', 'volume'];
ok('four training-chart modes exist', modes.every(m => pMarkup.indexOf('data-ana-mode="' + m + '"') >= 0));
const wranges = ['1m', '3m', '6m', '1y'];
ok('four form-trend windows exist', wranges.every(r => pMarkup.indexOf('data-ana-wrange="' + r + '"') >= 0));
ok('systems strip links to every section', ['workouts', 'recovery', 'nutrition'].every(g => pMarkup.indexOf('data-ana-go="' + g + '"') >= 0) && pMarkup.indexOf('data-ana-scroll="ana-plan-card"') >= 0);

/* ---------- 3. renderers exist and are wired ---------- */
const fns = [
  'anaRenderBodyHeat', 'anaStrengthStats', 'anaRingSVG', 'renderAStrength',
  'renderARecoveryCard', 'anaRenderRecoveryBody', 'renderALastWorkout',
  'renderANutritionCard', 'renderAPlanCard', 'renderARangeCaption',
  'updateAnalyticsLabels', 'anaBucketList', 'anaBarsLineSVG', 'anaStrengthChoice'
];
ok('every new dashboard renderer is defined', fns.every(f => pJs.indexOf('function ' + f + '(') >= 0));
ok('renderAnalytics calls the new cards',
  ['renderAStrength(hist)', 'renderARecoveryCard(hist)', 'renderALastWorkout(hist)',
   'renderANutritionCard()', 'renderAPlanCard(hist)', 'renderARangeCaption(hist)']
    .every(x => pJs.indexOf(x) >= 0));
ok('recovery card reuses the shared snapshotted engine', pJs.indexOf('recpCompute(H)') >= 0);
ok('recpCompute accepts a history snapshot', P.indexOf('function recpCompute(histArg)') >= 0 && C.indexOf('function recpCompute(histArg)') >= 0);
ok('recpCompute exposes the model meta (tau for ETA)', P.indexOf('subgroups: res.subgroups || {}, meta: res.meta') >= 0 && C.indexOf('subgroups: res.subgroups || {}, meta: res.meta') >= 0);
ok('updateLabels re-localizes the dashboard', count(P, 'updateAnalyticsLabels();') >= 1 && count(C, 'updateAnalyticsLabels();') >= 1);

/* ---------- 4. interactions ---------- */
ok('chart-mode + form-window + systems handlers exist',
  P.indexOf("querySelectorAll('[data-ana-mode]')") >= 0 &&
  P.indexOf("querySelectorAll('[data-ana-wrange]')") >= 0 &&
  P.indexOf("querySelectorAll('[data-ana-go]')") >= 0 &&
  P.indexOf("querySelectorAll('[data-ana-scroll]')") >= 0);
ok('last-workout opens the real report', P.indexOf('openReportModal(_anaLastRec, findPrevWorkout(_anaLastRec))') >= 0);
ok('analytics tab toggles the wide desktop layout', P.indexOf("document.body.classList.toggle('ana-wide', tab.dataset.tab === 'analytics')") >= 0);
ok('default range is month in state + chip', P.indexOf("let analyticsRange = 'month';") >= 0 && P.indexOf("getElementById('a-chip-month')") >= 0);

/* ---------- 5. honest metrics: no fabricated system ---------- */
const analyticsOnly = (pJs + pMarkup).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
ok('no invented burned-calorie metric', analyticsOnly.indexOf('calories_burned') < 0 && analyticsOnly.indexOf('burned') < 0);
ok('no invented water target', analyticsOnly.indexOf('target_water') < 0 && analyticsOnly.indexOf('waterTarget') < 0);
ok('nutrition card only uses plan targets', pJs.indexOf('plan.target_calories') >= 0 && pJs.indexOf('plan.target_protein') >= 0);

/* ---------- 6. every key exists in all three languages ---------- */
const keys = ['anaEyebrow', 'anaSubtitle', 'anaRangeQuarter', 'anaRangeYear', 'anaSysWorkouts',
  'anaChartGeneral', 'anaChartStrength', 'anaChartEndurance', 'anaChartVolume',
  'anaChartTitle', 'anaFormTitle', 'anaStrengthTitle', 'anaRecoveryTitle',
  'anaLastTitle', 'anaNutritionTitle', 'anaPlanTitle', 'anaKpiWorkouts',
  'anaKpiTime', 'anaKpiVolume', 'anaKpiStrength', 'anaKpiPR', 'anaW1m', 'anaW3m',
  'anaW6m', 'anaW1y', 'anaGoalEta', 'anaPlanDone'];
const missing = keys.filter(k => count(P, k + ':') !== 3);
ok('all dashboard keys are in RU + EN + HE' + (missing.length ? ' (missing: ' + missing.join(', ') + ')' : ''), missing.length === 0);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
