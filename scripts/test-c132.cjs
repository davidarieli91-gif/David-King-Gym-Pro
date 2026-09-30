/* c132 unit test — analytics render speed + range honesty.
   Static analysis of the REAL client.html: the renderers must consume ONE
   localStorage snapshot per render, the hidden tab must not re-render, the
   calendar tooltips must not re-parse history per day, the day panel must
   show EVERY set, and the whole-history cards must carry the «за всё время»
   badge in all three languages. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'client.html'), 'utf8');

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; console.log('PASS ' + name); }
  else { fail++; console.log('FAIL ' + name); }
}

/* --- extract a function by name with a brace-balanced, string-aware scanner --- */
function extractFn(src, name) {
  const start = src.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('function not found: ' + name);
  let depth = 0, i = src.indexOf('{', start);
  let inStr = null, inLine = false, inBlock = false, esc = false;
  for (; i < src.length; i++) {
    const c = src[i], n = src[i + 1];
    if (inLine) { if (c === '\n') inLine = false; continue; }
    if (inBlock) { if (c === '*' && n === '/') { inBlock = false; i++; } continue; }
    if (inStr) { if (esc) { esc = false; continue; } if (c === '\\') { esc = true; continue; } if (c === inStr) inStr = null; continue; }
    if (c === '/' && n === '/') { inLine = true; i++; continue; }
    if (c === '/' && n === '*') { inBlock = true; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (!depth) return src.slice(start, i + 1); }
  }
  throw new Error('unbalanced braces in ' + name);
}
function count(s, needle) { return s.split(needle).length - 1; }
function stripComments(s) { return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, ''); }

const bodyAnalytics = extractFn(html, 'renderAnalytics');
const bodyCalendar = extractFn(html, 'renderACalendar');
const bodyMuscles = extractFn(html, 'renderAMuscles');
const bodyAnalyticsFn = extractFn(html, 'aAnalytics');
const bodyDayRecs = extractFn(html, 'aDayRecs');

/* ---------- 1. hidden-tab guard ---------- */
ok('renderAnalytics: hidden-tab guard present',
  bodyAnalytics.indexOf("classList.contains('hidden')") >= 0 && bodyAnalytics.indexOf('return') >= 0);
ok('renderAnalytics: guard checks the analytics tab',
  bodyAnalytics.indexOf("getElementById('tab-analytics')") >= 0);

/* ---------- 2. ONE snapshot per render ---------- */
ok('renderAnalytics: exactly ONE loadHistory() snapshot', count(bodyAnalytics, 'loadHistory(') === 1);
ok('renderAnalytics: exactly ONE loadCheckins() snapshot', count(bodyAnalytics, 'loadCheckins(') === 1);
ok('renderAnalytics: snapshot threaded into every renderer',
  bodyAnalytics.indexOf('renderACalendar(hist, checks)') >= 0 &&
  bodyAnalytics.indexOf('renderAMuscles(a, hist)') >= 0 &&
  bodyAnalytics.indexOf('renderAWeight(checks)') >= 0 &&
  bodyAnalytics.indexOf('renderARecent(hist)') >= 0 &&
  bodyAnalytics.indexOf('renderATrend(hist)') >= 0 &&
  bodyAnalytics.indexOf('renderAProgress(hist)') >= 0 &&
  bodyAnalytics.indexOf('renderAPRs(hist)') >= 0);
ok('aAnalytics(hist, checks): accepts the snapshot',
  bodyAnalyticsFn.indexOf('function aAnalytics(hist, checks)') >= 0 &&
  bodyAnalyticsFn.indexOf('Array.isArray(hist) ? hist : loadHistory()') >= 0);

/* ---------- 3. renderer signatures accept snapshots ---------- */
ok('renderACalendar(hist, checks) signature', extractFn(html, 'renderACalendar').indexOf('function renderACalendar(hist, checks)') === 0);
ok('renderAMuscles(a, hist) signature', extractFn(html, 'renderAMuscles').indexOf('function renderAMuscles(a, hist)') === 0);
ok('renderAWeight(checks) signature', extractFn(html, 'renderAWeight').indexOf('function renderAWeight(checks)') === 0);
ok('renderARecent(hist) signature', extractFn(html, 'renderARecent').indexOf('function renderARecent(hist)') === 0);
ok('renderATrend(hist) signature', extractFn(html, 'renderATrend').indexOf('function renderATrend(hist)') === 0);
ok('renderAProgress(hist) signature', extractFn(html, 'renderAProgress').indexOf('function renderAProgress(hist)') === 0);
ok('renderAPRs(hist) signature', extractFn(html, 'renderAPRs').indexOf('function renderAPRs(hist)') === 0);
ok('aProgExList(hist) signature', extractFn(html, 'aProgExList').indexOf('function aProgExList(hist)') === 0);
ok('aDayRecs(k, hist) signature', bodyDayRecs.indexOf('function aDayRecs(k, hist)') === 0);

/* ---------- 4. calendar: no per-day loadHistory ---------- */
ok('renderACalendar: tooltip uses the day→tonnage map', bodyCalendar.indexOf('volByDay[k]') >= 0);
ok('renderACalendar: no aDayVolumeK() call in the cells', bodyCalendar.indexOf('aDayVolumeK(') === -1);
ok('renderACalendar: history parsed at most once (fallback only)', count(stripComments(bodyCalendar), 'loadHistory()') <= 1);
ok('renderACalendar: check-ins parsed at most once (fallback only)', count(stripComments(bodyCalendar), 'loadCheckins()') <= 1);
ok('renderAMuscles: day mode uses the snapshot', bodyMuscles.indexOf('aDayRecs(aDaySel, hist)') >= 0);

/* ---------- 5. day panel: EVERY set (the report's 3-set preview stays) ---------- */
ok('day panel: 4-set cap removed', html.indexOf('ds.slice(0, 4)') === -1 && html.indexOf('ds.length > 4') === -1);
ok("day panel: ellipsis removed from the DAY rows (report preview untouched)",
  html.indexOf('ds.length > 3') >= 0 && /* report preview still present */
  html.indexOf('ds.length > 4') === -1);
ok('day panel: set list wraps on its own line', html.indexOf('text-muted mt-0.5 break-words') >= 0);
ok('day panel: still escapes the parts', html.indexOf('esc(parts.join(\' · \'))') >= 0);

/* ---------- 6. «за всё время» badges ×3 cards ×3 langs ---------- */
ok('badge: trend card id', html.indexOf('id="txt-a-trend-all"') >= 0);
ok('badge: progress card id', html.indexOf('id="txt-a-progress-all"') >= 0);
ok('badge: PRs card id', html.indexOf('id="txt-a-prs-all"') >= 0);
ok('badge: updateLabels fills all three', count(html, "txt-a-trend-all', 'txt-a-progress-all', 'txt-a-prs-all") >= 1);
ok('i18n ×3: aAllTime', count(html, "aAllTime:") === 3);

/* ---------- 7. regression: callers outside renderAnalytics still valid ---------- */
ok('tab click still triggers renderAnalytics()', html.indexOf("if (tab.dataset.tab === 'analytics') renderAnalytics();") >= 0);
ok('drill-down passes one snapshot (2 vars, reused)', count(html, 'const _h = loadHistory(), _c = loadCheckins();') >= 2);
ok('progress picker still calls renderAProgress() (fallback load)', html.indexOf('renderAProgress();') >= 0);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
