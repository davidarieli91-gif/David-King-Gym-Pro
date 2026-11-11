/* c231 unit test — the general ANALYTICS INGRESS for the trainer app
   (fitness-crm.html): the same dashboard the client portal got in c230,
   wired to the trainer's data layer. Static assertions — the heavy lifting
   is done by visual QA; this guards against regressions/removals. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const CRM = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; console.log('PASS ' + name); }
  else { fail++; console.log('FAIL ' + name); }
}
function stripComments(s) { return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, ''); }
function count(s, needle) { return s.split(needle).length - 1; }

/* ---------- 1. information architecture ---------- */
const ids = [
  'ana-kpis', 'kpi-workouts', 'kpi-time', 'kpi-volume', 'kpi-strength', 'kpi-pr',
  'ana-chart', 'ana-chart-modes', 'ana-chart-legend', 'ana-chart-rpe',
  'ana-weight-chart', 'ana-weight-now', 'ana-weight-delta', 'ana-goal', 'ana-weight-range',
  'ana-strength-ring', 'ana-strength-list', 'ana-strength-badge',
  'ana-recovery-card', 'ana-recovery-ring', 'ana-recovery-list', 'ana-recovery-body', 'ana-recovery-eta',
  'ana-last', 'ana-last-open', 'ana-nutrition', 'ana-nutrition-date',
  'ana-plan-days', 'ana-plan-count', 'ana-plan-sub'
];
ok('every dashboard panel id is present', ids.every(id => CRM.indexOf('id="' + id + '"') >= 0));
ok('old 4-card KPI grid removed', CRM.indexOf('metric-active-days') < 0 && CRM.indexOf('metric-adherence') < 0);

/* ---------- 2. ranges ---------- */
const rangeButtons = ['day', 'week', 'month', 'quarter', 'year', 'all'].map(r => 'data-range="' + r + '"');
ok('six range chips exist', rangeButtons.every(f => CRM.indexOf(f) >= 0));
ok('range buttons wired to the shared setRange()', CRM.indexOf("getAttribute('data-range')") >= 0);

const modes = ['general', 'strength', 'endurance', 'volume'];
ok('four training-chart modes exist', modes.every(m => CRM.indexOf('data-ana-mode="' + m + '"') >= 0));
const wranges = ['1m', '3m', '6m', '1y'];
ok('four form-trend windows exist', wranges.every(r => CRM.indexOf('data-ana-wrange="' + r + '"') >= 0));

/* ---------- 3. renderers exist and are wired ---------- */
const fns = ['renderTrChart', 'renderTrStrength', 'renderTrForm', 'renderTrRecovery',
             'renderTrLast', 'renderTrNutritionToday', 'renderTrPlan', 'trRangeDays', 'trRangeFromTs',
             'c231BucketList', 'c231StrengthList', 'c231BarsLineSVG', 'c231RingSVG'];
ok('every c231 renderer is defined', fns.every(f => CRM.indexOf('function ' + f + '(') >= 0));
ok('renderers are called inside render()', ['renderTrChart(workoutsAll)', 'renderTrStrength(workoutsAll)', 'renderTrLast(workoutsAll)',
             'renderTrNutritionToday()', 'renderTrForm()', 'renderTrRecovery()', 'renderTrPlan()'].every(x => CRM.indexOf(x) >= 0));
ok('one combined async fetch (checks+client+programs+plans)',
  CRM.indexOf('Promise.all([checksP, clientP, programsP, plansP])') >= 0
  && CRM.indexOf("db.find('client_programs', 'by_clientId', cid231)") >= 0
  && CRM.indexOf("db.find('nutrition_plans', 'by_clientId', cid231)") >= 0);
ok('recovery card reuses the shared engine',
  CRM.indexOf('eng.compute({ workouts: H') >= 0 && CRM.indexOf('eng.advise({ groups: groups })') >= 0);
ok('KPIs use the shared metrics helper', CRM.indexOf('totalMinutes') >= 0 && CRM.indexOf('totalVolume') >= 0);
ok('mode tabs wired', CRM.indexOf("querySelectorAll('[data-ana-mode]')") >= 0);
ok('weight-range tabs wired', CRM.indexOf("querySelectorAll('[data-ana-wrange]')") >= 0);
ok('last workout opens the day panel', CRM.indexOf('renderDayDetail(_daySel)') >= 0 && CRM.indexOf("document.getElementById('ana-last-open')") >= 0);

/* ---------- 4. honest metrics ---------- */
const analyticsOnly = stripComments(CRM);
ok('no invented burned-calorie metric', analyticsOnly.indexOf('calories_burned') < 0 && analyticsOnly.indexOf('burned') < 0);
ok('no invented water target', analyticsOnly.indexOf('target_water') < 0 && analyticsOnly.indexOf('waterTarget') < 0);

/* ---------- 5. i18n: RU/EN/HE dictionaries carry the new keys ---------- */
const KEYS = ['rangeQuarter', 'rangeYear', 'rangeAll', 'chartTitle', 'chartGeneral', 'chartStrength',
              'chartEndurance', 'chartVolume', 'legendE1rm', 'legendTopSet', 'kpiWorkouts', 'kpiTime',
              'kpiVolume', 'kpiStrength', 'kpiPr', 'strengthTitle', 'formTitle', 'goalEta',
              'recoveryTitle', 'readiness', 'readyHigh', 'readyMed', 'readyLow', 'noRecovery',
              'lastTitle', 'lastDetails', 'nutrTodayTitle', 'nutrKcal', 'waterTitle',
              'planTitle', 'planDone', 'planNoProgram'];
let i18nOk = true;
const missing = [];
for (const lang of ['ru', 'en', 'he']) {
  const j = JSON.parse(fs.readFileSync(path.join(root, 'src', 'i18n', lang + '.json'), 'utf8'));
  const a = (j && j.analytics) || {};
  for (const k of KEYS) if (a[k] == null) { i18nOk = false; missing.push(lang + ':' + k); }
}
ok('all c231 keys exist in RU + EN + HE' + (missing.length ? ' (missing: ' + missing.slice(0, 8).join(', ') + ')' : ''), i18nOk);

/* ---------- 6. SW bumped ---------- */
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
ok('SW cache v248', sw.includes("CACHE_NAME = 'dk-gym-v248'"));

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
