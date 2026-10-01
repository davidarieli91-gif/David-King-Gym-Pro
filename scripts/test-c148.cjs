/* c148 unit + static test — nutrition bridge (client → coach).
   Unit part extracts the REAL functions out of fitness-crm.html (brace-balanced
   scanner) and checks the cloud-day → log conversion + date merge; static part
   pins the portal marks/rings/push, the trainer card/fetch and the doc writers. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const trainer = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const html = fs.readFileSync(path.join(root, 'client.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }
function eq(name, got, want) { const g = JSON.stringify(got), w = JSON.stringify(want); if (g === w) { pass++; console.log('PASS ' + name + ' = ' + g); } else { fail++; console.log('FAIL ' + name + ' got ' + g + ' want ' + w); } }
const count = (s, n) => s.split(n).length - 1;

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
  throw new Error('unbalanced: ' + name);
}

/* ---------- UNIT: extracted trainer functions ---------- */
const src = [extractFn(trainer, 'dateKey'), extractFn(trainer, 'computeAdherence'), extractFn(trainer, 'nutrToLogs'), extractFn(trainer, 'dkMergeNutrition')]
  .join('\n') + '\n;globalThis.__T148 = { dateKey, computeAdherence, nutrToLogs, dkMergeNutrition };';
new Function(src)();
const T = globalThis.__T148;

const cloudRows = [
  { date: '2026-09-28', ts: Date.parse('2026-09-28T12:00:00'), plan: 'Сушка', target: { c: 2000, p: 150, cb: 200, f: 60 }, totals: { c: 2000, p: 150, cb: 200, f: 60 }, items: [{ n: 'Творог', g: 200, k: 300 }], diary: [] },
  { date: '2026-09-29', ts: Date.parse('2026-09-29T12:00:00'), plan: 'Сушка', target: { c: 2000, p: 150, cb: 200, f: 60 }, totals: { c: 1600, p: 120, cb: 160, f: 48 }, items: [], diary: [{ n: 'Яблоко', g: 150, k: 80 }] }
];

const logs = T.nutrToLogs(cloudRows);
eq('cloud days → logs (count)', logs.length, 2);
eq('log target_* mapping', [logs[0].target_calories, logs[0].target_protein, logs[0].target_carbs, logs[0].target_fat], [2000, 150, 200, 60]);
eq('totals → ONE 100 g item (neutral ×g/100)', [logs[0].meals[0].items[0].grams, logs[0].meals[0].items[0].nutrition.calories], [100, 2000]);
eq('date kept as ts', logs[0].date, Date.parse('2026-09-28T12:00:00'));
eq('junk rows dropped', T.nutrToLogs([null, { date: 'x' }, { date: '2026-09-28', target: {}, totals: {} }, { date: '2026-09-28' }]).length, 1);

/* adherence: day1 perfect (100), day2 −20% on every macro (80) → 90 */
eq('adherence over cloud days (90%)', T.computeAdherence(logs), 90);

/* merge: the portal day WINS for the same date, local-only dates survive */
const localLog = { date: Date.parse('2026-09-29T12:00:00'), target_calories: 2500, meals: [{ items: [{ grams: 100, nutrition: { calories: 1000, protein: 100, carbs: 100, fat: 30 } }] }] };
const localOnly = { date: Date.parse('2026-09-27T12:00:00'), target_calories: 2200, meals: [{ items: [{ grams: 100, nutrition: { calories: 2200, protein: 150, carbs: 210, fat: 70 } }] }] };
const merged = T.dkMergeNutrition([localLog, localOnly], cloudRows);
eq('merge count (2 cloud + 1 local-only)', merged.length, 3);
const m29 = merged.find(l => T.dateKey(new Date(l.date)) === '2026-09-29');
ok('portal day wins over the trainer log for the same date', m29 && m29._cloud148 === true);
const m27 = merged.find(l => T.dateKey(new Date(l.date)) === '2026-09-27');
ok('local-only day survives the merge', m27 && !m27._cloud148);
ok('merge tolerates empty cloud side', T.dkMergeNutrition([localOnly], []).length === 1 && T.dkMergeNutrition(null, cloudRows).length === 2);

/* ---------- STATIC: portal ---------- */
ok('portal per-day state key (dk_nutr_ + date)', html.indexOf("nsKey('dk_nutr_' + todayKey())") >= 0);
ok('checkbox carries data-nutr-key per meal:item', html.indexOf('data-nutr-key="${mi}:${ii}"') >= 0);
ok('checkbox re-render restores checked state', html.indexOf('nutrChecked(_st148, mi, ii)') >= 0);
ok('checkbox change persists to the state', html.indexOf("c.querySelectorAll('input[data-nutr-key]')") >= 0 && html.indexOf('saveNutrState(st)') >= 0);
ok('plan switch resets stale marks', html.indexOf('_st148.plan !== currentPlan.id') >= 0);
ok('rings renderer + card ids', html.indexOf('function renderNutrProgress()') >= 0 && html.indexOf('id="nutr-rings"') >= 0 && html.indexOf('id="nutr-progress"') >= 0);
ok('over-target ring turns red', html.indexOf("over ? '#ef4444'") >= 0);
ok('micronutrients card + RDI table', html.indexOf('function renderNutrMicro()') >= 0 && html.indexOf('const NUTR_RDI = { fiber:') >= 0 && html.indexOf('id="nutr-micro-list"') >= 0);
ok('snapshot shape exposed', html.indexOf('window.dkNutrSnapshot = dkNutrSnapshot') >= 0 && html.indexOf('items: items.slice(0, 40)') >= 0 && html.indexOf('diary: diary.slice(0, 30)') >= 0);
ok('cloud push exposed + cap 90 + merge by date', html.indexOf('window.dkPushNutr = dkPushNutr') >= 0 && html.indexOf('list.slice(-90)') >= 0 && html.indexOf("r.date !== snap.date") >= 0);
ok('all portal doc writers preserve nutr', html.indexOf('nutr: Array.isArray(p.nutr) ? p.nutr : []') >= 0 && count(html, 'nutr: pay.nutr') >= 2);
ok('push triggers: flush + boot + online', count(html, 'dkPushNutr()') >= 4);
ok('diary add/remove re-render + schedule a push', count(html, 'dkNutrAfterChange()') >= 3);
ok('renderAll refreshes rings + micro', html.indexOf('renderNutrProgress(); renderNutrMicro();') >= 0);
ok('debounced push (1.5 s)', html.indexOf('}, 1500);') >= 0);
ok('legacy #data= link decodes UTF-8 (no mojibake)', html.indexOf("new TextDecoder('utf-8').decode(bytes)") >= 0 && html.indexOf('const bin = atob(decodeURIComponent(hash.substring(6)))') >= 0);

/* ---------- STATIC: trainer ---------- */
ok('trainer fetch exposed', trainer.indexOf('window.dkFetchClientNutr = async function') >= 0);
ok('fetch validates date/target/totals + caps', trainer.indexOf("/^\\d{4}-\\d{2}-\\d{2}$/.test(String(r.date || ''))") >= 0 && trainer.indexOf('.slice(-90)') >= 0);
ok('nutrition card HTML next to the body card', trainer.indexOf('id="analytics-nutr"') >= 0 && trainer.indexOf('id="analytics-nutr-days"') >= 0 && trainer.indexOf('id="analytics-nutr-last"') >= 0);
ok('renderClientNutr wired in render + on resolve', trainer.indexOf('renderClientNutr(nutr148)') >= 0 && trainer.indexOf('renderClientNutr(_cloudNutr148)') >= 0);
ok('stale-client guard for the fetched days', trainer.indexOf('_cloudNutrCid148 === _clientId') >= 0);
ok('metrics + calendar re-render with the merge', trainer.indexOf('dkMergeNutrition(nutrition, nutr148)') >= 0 && trainer.indexOf('renderCalendar(_lastWorkouts, merged148)') >= 0);
ok('adherence bars color-coded (emerald/amber/red)', trainer.indexOf('bg-emerald-500') >= 0 && trainer.indexOf('bg-amber-500') >= 0 && trainer.indexOf('bg-red-500/70') >= 0);
ok('trainer writers preserve nutr (push + backfill)', trainer.indexOf('checks: checks, nutr: nutr') >= 0 && trainer.indexOf('checks: remoteChecks, nutr: remoteNutr') >= 0);

/* ---------- STATIC: i18n ×3 ---------- */
for (const lang of ['ru', 'en', 'he']) {
  let d = null;
  try { d = JSON.parse(fs.readFileSync(path.join(root, 'src', 'i18n', lang + '.json'), 'utf8')); } catch (e) {}
  ok(lang + '.json parses + analytics.nutr* keys', !!(d && d.analytics && d.analytics.nutrTitle && d.analytics.nutrHint && d.analytics.nutrAvg && d.analytics.nutrLast));
}
ok('portal islands have the nutrition keys ×3', count(html, 'nutrProgressTitle:') === 3 && count(html, 'fiberLbl:') === 3 && count(html, 'vitCLbl:') === 3);

/* ---------- versions ---------- */
ok('sw cache at least v175', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 175; })());
ok('RUNNING / dk-build at least c148', (function () {
  const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
  return !!r && !!b && Number(r[1]) >= 148 && Number(b[1]) >= 148;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
