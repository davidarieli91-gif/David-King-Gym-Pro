/* c166 test — trainer reminders: agenda build, due logic, settings UI, SW channel. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const trainer = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }
function eq(name, got, want) { const g = JSON.stringify(got), w = JSON.stringify(want); if (g === w) { pass++; console.log('PASS ' + name + ' = ' + g); } else { fail++; console.log('FAIL ' + name + ' got ' + g + ' want ' + w); } }

function extractFn(src, name) {
  let start = src.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('function not found: ' + name);
  if (start >= 6 && src.slice(start - 6, start) === 'async ') start -= 6;
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

/* ---------- UNIT: agenda build + due logic (pure) ---------- */
const unitSrc = [
  extractFn(trainer, 'dkTremYmd'),
  extractFn(trainer, 'dkTremBuildAgenda'),
  extractFn(trainer, 'dkTremDue'),
  ';globalThis.__K166 = { dkTremBuildAgenda, dkTremDue, dkTremYmd };'
].join('\n');
new Function(unitSrc)();
const K = globalThis.__K166;

const now = new Date(2026, 9, 4, 12, 0, 0); /* Sun Oct 4 2026, dow=0 */
eq('dow sanity (Sunday)', now.getDay(), 0);
const clients = [
  { full_name: 'A', training_days: [0] },
  { full_name: 'B', training_days: [2] },
  { full_name: 'C', training_days: ['0'], birth_date: '1990-10-04' },
  { full_name: 'D', training_days: [0], archived: true },
  { full_name: 'E', birth_date: '1985-10-04' },
  { full_name: 'F', birth_date: '1995-10-05' }
];
const items = K.dkTremBuildAgenda(clients, now);
eq('agenda date is today', items.date, '2026-10-04');
eq('training = clients training today, archived skipped', items.training, ['A', 'C']);
eq('birthdays = matching month-day with age', items.birthdays, [{ name: 'C', age: 36 }, { name: 'E', age: 41 }]);
eq('empty clients → empty agenda', K.dkTremBuildAgenda([], now), { date: '2026-10-04', training: [], birthdays: [] });
eq('missing training_days is safe', K.dkTremBuildAgenda([{ full_name: 'X' }], now).training, []);

const cfg = { agenda: { on: true }, birth: { on: false }, time: '08:00' };
eq('nothing due before the set time', K.dkTremDue(cfg, items, {}, new Date(2026, 9, 4, 7, 59)), []);
eq('agenda due after the set time', K.dkTremDue(cfg, items, {}, new Date(2026, 9, 4, 8, 1)), ['agenda']);
eq('agenda not repeated same day', K.dkTremDue(cfg, items, { agenda: '2026-10-04' }, new Date(2026, 9, 4, 9, 0)), []);
eq('stale snapshot (yesterday) is ignored', K.dkTremDue(cfg, { date: '2026-10-03', training: ['A'], birthdays: [] }, {}, now), []);
const cfgB = { agenda: { on: false }, birth: { on: true }, time: '08:00' };
eq('birthdays due after the time', K.dkTremDue(cfgB, items, {}, new Date(2026, 9, 4, 8, 1)), ['birth']);
eq('both kinds can be due together', K.dkTremDue({ agenda: { on: true }, birth: { on: true }, time: '08:00' }, items, {}, new Date(2026, 9, 4, 8, 1)), ['agenda', 'birth']);
eq('no training today → no agenda ping', K.dkTremDue(cfg, { date: '2026-10-04', training: [], birthdays: [] }, {}, new Date(2026, 9, 4, 8, 1)), []);
eq('invalid time falls back to 08:00', K.dkTremDue({ agenda: { on: true }, birth: { on: false }, time: 'nope' }, items, {}, new Date(2026, 9, 4, 8, 1)), ['agenda']);

/* ---------- STATIC: settings panel + module ---------- */
ok('settings panel markup', trainer.indexOf('id="trem-agenda-on"') >= 0 && trainer.indexOf('id="trem-birth-on"') >= 0 && trainer.indexOf('id="trem-time"') >= 0 && trainer.indexOf('id="trem-enable"') >= 0 && trainer.indexOf('id="trem-test"') >= 0 && trainer.indexOf('id="trem-status"') >= 0);
ok('module exposed + init/tick wired', trainer.indexOf('window.dkTrainerReminders = {') >= 0 && trainer.indexOf('setInterval(dkTremTick, 60000)') >= 0 && trainer.indexOf("visibilitychange") >= 0);
ok('page pushes the agenda snapshot to the SW', trainer.indexOf("postMessage({ type: 'dk-trem-config'") >= 0 && trainer.indexOf("dkTremKvSet('trem'") >= 0);
ok('notifications use dk-t-* tags and SW-first path', trainer.indexOf("'dk-t-' + kind") >= 0 && trainer.indexOf('reg.showNotification') >= 0);
ok('client form has the birth date field + load + profile row', trainer.indexOf('name="birth_date"') >= 0 && trainer.indexOf('form.elements.birth_date.value') >= 0 && trainer.indexOf("icon === 'cake'") >= 0);
ok('periodic sync registered', trainer.indexOf("periodicSync.register('dk-reminders'") >= 0);

/* ---------- STATIC: sw.js trainer channel ---------- */
ok('sw has DK_TREM_I18N x3 + dkTremCheck', sw.indexOf('const DK_TREM_I18N = {') >= 0 && sw.indexOf('ru:') >= 0 && sw.indexOf('en:') >= 0 && sw.indexOf('he:') >= 0 && sw.indexOf('async function dkTremCheck()') >= 0);
ok('sw handles dk-trem-config messages', sw.indexOf("d.type === 'dk-trem-config'") >= 0);
ok('sw periodicsync runs both checks', sw.indexOf('await dkRemCheck(); await dkTremCheck();') >= 0);
ok('sw notificationclick routes trainer taps to fitness-crm', sw.indexOf("isTrainer ? './fitness-crm.html' : './client.html'") >= 0 && sw.indexOf("indexOf('dk-t-') === 0") >= 0);

/* ---------- i18n ×3 ---------- */
for (const lang of ['ru', 'en', 'he']) {
  let d = null;
  try { d = JSON.parse(fs.readFileSync(path.join(root, 'src', 'i18n', lang + '.json'), 'utf8')); } catch (e) {}
  const S = d && d.settings, C = d && d.client;
  const need = ['remTitle', 'remDesc', 'remAgenda', 'remBirthdays', 'remTime', 'remEnable', 'remTest', 'remAgendaTitle', 'remBirthTitle', 'remAllowed', 'remDenied', 'remUnsupported', 'remTestSent'];
  const missing = S ? need.filter((k) => !S[k]) : need;
  ok(lang + '.json has trainer-reminder keys' + (missing.length ? ' — missing ' + missing.join(', ') : ''), missing.length === 0 && !!(C && C.birthDate));
}

/* ---------- versions ---------- */
ok('sw cache at least v193', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 193; })());
ok('sw keeps c165 history and adds v193 c166', sw.indexOf('// v192: c165') >= 0 && sw.indexOf('// v193: c166') >= 0);
ok('RUNNING / dk-build at least c166', (function () {
  const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
  return !!r && !!b && Number(r[1]) >= 166 && Number(b[1]) >= 166;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
