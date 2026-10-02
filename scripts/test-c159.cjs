/* c159 unit + static test — «the password stops working after re-login».
   Diagnostics mapping, pending WSK sync, trainer directory status. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const trainer = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const html = fs.readFileSync(path.join(root, 'client.html'), 'utf8');
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

/* ---------- UNIT: dkPhoneErrKey ---------- */
const src = extractFn(html, 'dkPhoneErrKey') + '\n;globalThis.__E159 = { dkPhoneErrKey };';
new Function(src)();
const E = globalThis.__E159;
eq('permission code → rules hint', E.dkPhoneErrKey({ code: 'permission-denied' }), 'phoneRules');
eq('denied message → rules hint', E.dkPhoneErrKey(new Error('Missing or insufficient permissions')), 'phoneRules');
eq('unavailable → offline hint', E.dkPhoneErrKey({ code: 'unavailable' }), 'phoneOffline');
eq('timeout → offline hint', E.dkPhoneErrKey(new Error('timeout 7000')), 'phoneOffline');
eq('notfound → not-registered hint', E.dkPhoneErrKey({ code: 'notfound' }), 'phoneNoDir');
eq('wrong → wrong-password hint', E.dkPhoneErrKey({ code: 'wrong' }), 'phoneWrongPass');
eq('expired → link expired', E.dkPhoneErrKey({ code: 'expired' }), 'unlockExpired');
eq('unknown → generic', E.dkPhoneErrKey(new Error('boom')), 'phoneWrong');
eq('null-safe', E.dkPhoneErrKey(null), 'phoneWrong');

/* ---------- STATIC: portal diagnostics + pending sync ---------- */
ok('phone login uses the classifier', html.indexOf('err.textContent = t(dkPhoneErrKey(e));') >= 0);
ok('timeout vs notfound distinguished', html.indexOf("if (!snap) throw { code: 'offline' };") >= 0 && html.indexOf("if (!snap.exists || !snap.data() || !snap.data().shareId) throw { code: 'notfound' };") >= 0);
ok('four precise phone messages exist in all islands', ['phoneRules:', 'phoneNoDir:', 'phoneOffline:', 'phoneWrongPass:'].every(k => html.split(k).length - 1 === 3));
ok('pending wsk storage + retry helper', html.indexOf("const DK_WSK_PENDING_KEY = 'dk_wsk_pending'") >= 0 && html.indexOf('function dkWskPendingSet(shareId, doc)') >= 0 && html.indexOf('async function dkSyncPendingWsk()') >= 0 && html.indexOf('window.dkSyncPendingWsk = dkSyncPendingWsk') >= 0);
ok('password save stores the pending copy on cloud failure', html.indexOf('dkWskPendingSet(s.shareId, doc);') >= 0 && html.indexOf('dkWskPendingClear();') >= 0);
ok('pending sync runs on boot and on online', html.indexOf("setTimeout(function () { try { dkSyncPendingWsk(); } catch (e159) {} }, 2500);") >= 0 && html.indexOf("try { dkSyncPendingWsk(); } catch (e) {} try { dkSyncState(); }") >= 0);

/* ---------- STATIC: trainer directory status ---------- */
ok('trainer captures the directory result', trainer.indexOf('let dirOk152 = null;') >= 0 && trainer.indexOf('dirOk152 = await registerPortalDirectory(client, shareId);') >= 0);
ok('trainer shows success vs failure states', trainer.indexOf("_phStatus.textContent = t('portal.phoneOk', { phone: _ph152 });") >= 0 && trainer.indexOf("_phStatus.textContent = t('portal.phoneRegFail');") >= 0 && trainer.indexOf("_phStatus.className = 'text-[11px] text-danger';") >= 0);
for (const lang of ['ru', 'en', 'he']) {
  let d = null;
  try { d = JSON.parse(fs.readFileSync(path.join(root, 'src', 'i18n', lang + '.json'), 'utf8')); } catch (e) {}
  ok(lang + '.json has portal.phoneRegFail', !!(d && d.portal && d.portal.phoneRegFail));
}

/* ---------- versions ---------- */
ok('sw cache at least v186', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 186; })());
ok('RUNNING / dk-build at least c159', (function () {
  const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
  return !!r && !!b && Number(r[1]) >= 159 && Number(b[1]) >= 159;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
