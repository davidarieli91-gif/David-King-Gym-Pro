/* c153 unit + static test — local reminders (page scheduler + SW background check).
   Unit part extracts dkReminderDueTs from BOTH client.html and sw.js and pins
   the identical behavior (workout days/time, meal window, water interval). */
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

/* ---------- UNIT: dkReminderDueTs — page copy AND sw copy ---------- */
const FRI = new Date(2026, 9, 2); /* Fri Oct 2 2026 (env date) */
const at = (h, mi) => new Date(2026, 9, 2, h, mi, 0, 0);
const sat = (h, mi) => new Date(2026, 9, 3, h, mi, 0, 0);
const tsOf = (h, mi) => at(h, mi).getTime();

for (const [label, src] of [['page', html], ['sw', sw]]) {
  const f = extractFn(src, 'dkReminderDueTs') + '\n;globalThis.__R153 = { dkReminderDueTs };';
  new Function(f)();
  const R = globalThis.__R153;
  const wk = { on: true, time: '18:00', days: [FRI.getDay()] };
  eq(label + ': workout off → null', R.dkReminderDueTs({ on: false, time: '18:00', days: [5] }, 'workout', at(18, 30)), null);
  eq(label + ': workout due at its time (same day)', R.dkReminderDueTs(wk, 'workout', at(18, 30)), tsOf(18, 0));
  eq(label + ': workout before time → null', R.dkReminderDueTs(wk, 'workout', at(17, 59)), null);
  eq(label + ': workout 5.5 h late still fires', R.dkReminderDueTs(wk, 'workout', at(23, 30)), tsOf(18, 0));
  eq(label + ': workout 6.5 h late is stale', R.dkReminderDueTs(wk, 'workout', sat(0, 30)), null);
  eq(label + ': wrong weekday → null', R.dkReminderDueTs({ on: true, time: '18:00', days: [1] }, 'workout', at(18, 30)), null);
  eq(label + ': empty days → null', R.dkReminderDueTs({ on: true, time: '18:00', days: [] }, 'workout', at(18, 30)), null);
  const ml = { on: true, time: '13:00' };
  eq(label + ': meal due', R.dkReminderDueTs(ml, 'meal', at(13, 5)), tsOf(13, 0));
  eq(label + ': meal 3.5 h late ok', R.dkReminderDueTs(ml, 'meal', at(16, 30)), tsOf(13, 0));
  eq(label + ': meal 4.5 h late stale', R.dkReminderDueTs(ml, 'meal', at(17, 30)), null);
  const wa = { on: true, every: 2, from: '10:00', to: '20:00' };
  eq(label + ': water tick 12:00 at 12:45', R.dkReminderDueTs(wa, 'water', at(12, 45)), tsOf(12, 0));
  eq(label + ': water tick 12:00 at 13:30 is stale', R.dkReminderDueTs(wa, 'water', at(13, 30)), null);
  eq(label + ': water exactly at from', R.dkReminderDueTs(wa, 'water', at(10, 0)), tsOf(10, 0));
  eq(label + ': water before window → null', R.dkReminderDueTs(wa, 'water', at(9, 59)), null);
  eq(label + ': water after window → null', R.dkReminderDueTs(wa, 'water', at(20, 30)), null);
  eq(label + ': bad time string → null', R.dkReminderDueTs({ on: true, time: '25:99' }, 'meal', at(13, 0)), null);
}

/* ---------- STATIC: portal ---------- */
ok('portal: config defaults + storage', html.indexOf("const DK_REM_KEY = 'dk_reminders'") >= 0 && html.indexOf('function dkRemGet()') >= 0 && html.indexOf('function dkRemSave(cfg)') >= 0 && html.indexOf('function dkRemAnyOn(cfg)') >= 0);
ok('portal: shared IndexedDB state (dk-sw/kv)', html.indexOf("indexedDB.open('dk-sw', 1)") >= 0 && html.indexOf('function dkSwKvGet(k)') >= 0 && html.indexOf('function dkSwKvSet(k, v)') >= 0 && html.indexOf('function dkRemStateSet(cfg)') >= 0);
ok('portal: scheduler + visibility + interval', html.indexOf('async function dkRemTick()') >= 0 && html.indexOf('setInterval(dkRemTick, 60000)') >= 0 && html.indexOf("document.addEventListener('visibilitychange', function () { if (!document.hidden) dkRemTick(); })") >= 0 && html.indexOf('window.dkRemTick = dkRemTick') >= 0);
ok('portal: notification path + permission', html.indexOf('function dkRemShow(kind)') >= 0 && html.indexOf('reg.showNotification(m.title') >= 0 && html.indexOf('function dkRemPermission()') >= 0 && html.indexOf('function dkRemTest()') >= 0);
ok('portal: settings UI (workout/meal/water/test)', html.indexOf('id="cps-rem-w-on"') >= 0 && html.indexOf('id="cps-rem-w-time"') >= 0 && html.indexOf('id="cps-rem-w-days"') >= 0 && html.indexOf('id="cps-rem-m-on"') >= 0 && html.indexOf('id="cps-rem-wa-on"') >= 0 && html.indexOf('id="cps-rem-wa-every"') >= 0 && html.indexOf('id="cps-rem-test"') >= 0);
ok('portal: UI sync + day chips + test wiring', html.indexOf('function dkRemFillUI()') >= 0 && html.indexOf('function dkRemSyncUI()') >= 0 && html.indexOf('function dkRemToggleFromUI()') >= 0 && html.indexOf("e.target.closest('#cps-rem-w-days [data-day]')") >= 0 && html.indexOf("e.target.closest('#cps-rem-test')") >= 0 && html.indexOf("e.target.id.indexOf('cps-rem-') === 0") >= 0);
ok('portal: periodic sync registration (on/off)', html.indexOf("reg.periodicSync.register('dk-reminders', { minInterval: 3600000 })") >= 0 && html.indexOf("reg.periodicSync.unregister('dk-reminders')") >= 0 && html.indexOf("reg.active.postMessage({ type: 'dk-rem-config'") >= 0);
ok('portal: labels filled in the settings sheet', html.indexOf("set('cps-rem-label', T('remTitle'))") >= 0 && html.indexOf("set('cps-rem-test-lbl', T('remTest'))") >= 0 && html.indexOf('try { dkRemFillUI(); }') >= 0);

/* ---------- STATIC: service worker ---------- */
ok('sw: due-check copy present', sw.indexOf('function dkReminderDueTs(rem, kind, now)') >= 0);
ok('sw: localized reminder texts ×3', sw.indexOf('const DK_REM_I18N = {') >= 0 && sw.indexOf("ru: { workout:") >= 0 && sw.indexOf("en: { workout:") >= 0 && sw.indexOf("he: { workout:") >= 0);
ok('sw: message handler syncs config + checks', sw.indexOf("self.addEventListener('message'") >= 0 && sw.indexOf("d.type === 'dk-rem-config'") >= 0 && sw.indexOf('await dkRemCheck();') >= 0);
ok('sw: periodicsync handler', sw.indexOf("self.addEventListener('periodicsync'") >= 0 && sw.indexOf("event.tag === 'dk-reminders'") >= 0 && sw.indexOf('async function dkRemCheck()') >= 0);
ok('sw: notificationclick focuses/opens the portal', sw.indexOf("self.addEventListener('notificationclick'") >= 0 && sw.indexOf("self.clients.openWindow('./client.html')") >= 0 && sw.indexOf("clients.matchAll({ type: 'window', includeUncontrolled: true })") >= 0);
ok('sw: notifications carry tag/icon/badge', sw.indexOf("tag: 'dk-' + kind") >= 0 && sw.indexOf("icon: './icon-192.png'") >= 0);

/* ---------- STATIC: i18n ×3 ---------- */
ok('portal islands have the c153 keys ×3', count(html, 'remTitle:') === 3 && count(html, 'remWorkoutTitle:') === 3 && count(html, 'remWaterBody:') === 3 && count(html, 'remMon:') === 3 && count(html, 'remNeedPerm:') === 3);

/* ---------- versions ---------- */
ok('sw cache at least v180', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 180; })());
ok('RUNNING / dk-build at least c153', (function () {
  const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
  return !!r && !!b && Number(r[1]) >= 153 && Number(b[1]) >= 153;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
