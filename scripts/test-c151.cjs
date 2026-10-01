/* c151 unit + static test — portal foundation (session/continue/lock/logout, SW, install, rules).
   Unit part extracts dkLockDue from client.html (brace-balanced scanner). */
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

/* ---------- UNIT: dkLockDue ---------- */
const src = extractFn(html, 'dkLockDue') + '\n;globalThis.__T151 = { dkLockDue };';
new Function(src)();
const T = globalThis.__T151;
eq('no hidden timestamp → no lock', T.dkLockDue(0, Date.now(), 10), false);
eq('auto-lock off (0 min) → no lock', T.dkLockDue(Date.now() - 3600000, Date.now(), 0), false);
eq('11 min in background, 10-min limit → lock', T.dkLockDue(Date.now() - 11 * 60000, Date.now(), 10), true);
eq('9 min in background, 10-min limit → no lock', T.dkLockDue(Date.now() - 9 * 60000, Date.now(), 10), false);
eq('exactly at the limit → no lock (strict)', T.dkLockDue(1000000, 1000000 + 600000, 10), false);

/* ---------- STATIC: security rules (trainer) ---------- */
ok('rules: portal_shares get-only (no list)', trainer.indexOf('match /portal_shares/{id} {\\n      allow get: if true;') >= 0 && trainer.indexOf('allow get, list: if true') < 0);
ok('rules: delete denied', trainer.indexOf('allow delete: if false;') >= 0 && trainer.indexOf('allow delete: if true') < 0);
ok('rules: size-guarded writes kept', trainer.indexOf('request.resource.data.d.size() < 1000000') >= 0);

/* ---------- STATIC: portal SW registration ---------- */
ok('portal registers the service worker itself', html.indexOf("navigator.serviceWorker.register('sw.js'") >= 0 && html.indexOf("window.addEventListener('load'") >= 0);
ok('SW install is per-entry best-effort (no all-or-nothing addAll)', sw.indexOf('Promise.all(APP_SHELL.map((u) => cache.add(u).catch(() => null)))') >= 0 && sw.indexOf('cache.addAll(APP_SHELL)') < 0);

/* ---------- STATIC: session / continue / lock / logout ---------- */
ok('session helpers', html.indexOf("const DK_SESSION_KEY = 'dk_portal_session'") >= 0 && html.indexOf('function dkSessionGet()') >= 0 && html.indexOf('function dkSessionSet(shareId, code, name)') >= 0 && html.indexOf('function dkSessionClear()') >= 0);
ok('successful unlock remembers the session', html.indexOf('function dkUnlockSuccess(parsed, code, shareId)') >= 0 && html.indexOf('dkSessionSet(shareId || dkCurrentShareId(), code,') >= 0);
ok('one-tap resume decrypts cache then refreshes cloud', html.indexOf('async function dkResumeSession()') >= 0 && html.indexOf('await fetchAndCacheShare(s.shareId)') >= 0);
ok('continue screen HTML (button + use-code fallback)', html.indexOf('id="unlock-continue"') >= 0 && html.indexOf('id="btn-continue"') >= 0 && html.indexOf('id="btn-use-code"') >= 0 && html.indexOf('id="unlock-code-block"') >= 0);
ok('boot offers continue for a remembered share', html.indexOf('_sess151.shareId === sh.id') >= 0 && html.indexOf('showContinue(); return;') >= 0);
ok('lock + no-portal screens', html.indexOf('function showLocked()') >= 0 && html.indexOf('function showNoPortal()') >= 0 && html.indexOf("t('lockedTitle')") >= 0 && html.indexOf("t('noPortalTitle')") >= 0);
ok('logout erases session + data and lands on no-portal', html.indexOf('function dkPortalLogout()') >= 0 && html.indexOf("localStorage.setItem(DK_LOGGED_OUT_KEY, '1')") >= 0 && html.indexOf('dkWipeData();') >= 0 && html.indexOf("if (localStorage.getItem(DK_LOGGED_OUT_KEY) === '1') { showNoPortal(); return; }") >= 0);
ok('session is wiped by the device wipe too', html.indexOf("'dk_live_draft', 'dk_portal_session'") >= 0);
ok('auto-lock (visibility + pure dkLockDue + selectable minutes)', html.indexOf('function dkAutoLockMin()') >= 0 && html.indexOf('dkLockDue(t0, Date.now(), dkAutoLockMin())') >= 0 && html.indexOf("sessionStorage.setItem('dk_hidden_at'") >= 0);
ok('cached blob fallback on ANY fetch error', html.indexOf('fall back to the cached blob for ANY fetch failure') >= 0 && html.indexOf("e.code === 'offline' && cached") < 0);
ok('back-guard during a workout + beforeunload', html.indexOf("window.addEventListener('beforeunload'") >= 0 && html.indexOf("history.pushState({ dk151: 1 }") >= 0 && html.indexOf("t('exitWorkoutConfirm')") >= 0);
ok('install banner + persistent storage', html.indexOf('function dkInstallBanner()') >= 0 && html.indexOf('beforeinstallprompt') >= 0 && html.indexOf('function dkInstallNow()') >= 0 && html.indexOf('navigator.storage.persist()') >= 0);

/* ---------- STATIC: settings sheet app section ---------- */
ok('settings sheet: app section controls', html.indexOf('id="cps-install"') >= 0 && html.indexOf('id="cps-autolock"') >= 0 && html.indexOf('id="cps-lock"') >= 0 && html.indexOf('id="cps-logout"') >= 0);
ok('handlers wired (install/lock/logout/autolock)', html.indexOf("e.target.closest('#cps-install')") >= 0 && html.indexOf("e.target.closest('#cps-lock')") >= 0 && html.indexOf("e.target.closest('#cps-logout')") >= 0 && html.indexOf("e.target.id === 'cps-autolock'") >= 0);
ok('labels filled (incl. autolock options)', html.indexOf("set('cps-app-label', T('appSection'))") >= 0 && html.indexOf("T('autolockMin', { n: o.value })") >= 0);

/* ---------- STATIC: i18n ×3 ---------- */
ok('portal islands have the c151 keys ×3', count(html, 'continueTitle:') === 3 && count(html, 'lockedTitle:') === 3 && count(html, 'noPortalTitle:') === 3 && count(html, 'appSection:') === 3 && count(html, 'logoutBtn:') === 3 && count(html, 'autolockTitle:') === 3 && count(html, 'exitWorkoutConfirm:') === 3);

/* ---------- versions ---------- */
ok('sw cache at least v178', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 178; })());
ok('RUNNING / dk-build at least c151', (function () {
  const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
  return !!r && !!b && Number(r[1]) >= 151 && Number(b[1]) >= 151;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
