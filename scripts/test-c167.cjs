/* c167 test — first-try login: password-aware unlock screen + hardened phone login. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const portal = fs.readFileSync(path.join(root, 'client.html'), 'utf8');
const trainer = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }
function eq(name, got, want) { const g = JSON.stringify(got), w = JSON.stringify(want); if (g === w) { pass++; console.log('PASS ' + name + ' = ' + g); } else { fail++; console.log('FAIL ' + name + ' got ' + g + ' want ' + w); } }
function count(s, sub) { let n = 0, i = 0; for (;;) { i = s.indexOf(sub, i); if (i < 0) return n; n++; i += sub.length; } }

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

/* ---------- UNIT: unlock mode classification ---------- */
new Function(extractFn(portal, 'dkUnlockModeFor') + ';globalThis.__K167 = { dkUnlockModeFor };')();
const K = globalThis.__K167;
eq('password share → pass mode', K.dkUnlockModeFor({ v: 2, d: 'x', wsk: 'y', setup: false }), 'pass');
eq('setup-code share → code mode', K.dkUnlockModeFor({ v: 2, d: 'x', wsk: 'y', setup: true }), 'code');
eq('share without wsk → code mode', K.dkUnlockModeFor({ v: 2, d: 'x', wsk: '', setup: false }), 'code');
eq('legacy blob → code mode', K.dkUnlockModeFor({ v: 1, blobB64: 'x' }), 'code');
eq('no doc → code mode', K.dkUnlockModeFor(null), 'code');

/* ---------- STATIC client.html: mode-aware screen ---------- */
ok('unlock input accepts 4-10 digits (maxlength 10 + sanitizer)', portal.indexOf('maxlength="10" id="unlock-code-input"') >= 0 && portal.indexOf("replace(/\\D/g,'').slice(0,10)") >= 0);
ok('attemptUnlock no longer demands exactly 6', (function () { const f = extractFn(portal, 'attemptUnlock'); return f.indexOf('!== 6') < 0 && f.indexOf('code.length < 4') >= 0; })());
ok('attemptUnlock is mode-aware (wrong password vs wrong code)', (function () { const f = extractFn(portal, 'attemptUnlock'); return f.indexOf("'pass' ? 'unlockWrongPass' : 'unlockWrongCode'") >= 0 && f.indexOf('dkUnlockMode()') >= 0; })());
ok('apply function sets password texts + placeholder', (function () { const f = extractFn(portal, 'dkApplyUnlockMode'); return f.indexOf("t('unlockPassTitle')") >= 0 && f.indexOf("t('unlockPassBtn')") >= 0 && f.indexOf("'••••'") >= 0 && f.indexOf("'••••••'") >= 0; })());
ok('mode re-applied on showUnlock + after the share fetch + both cached branches', count(portal, 'dkApplyUnlockMode()') >= 4 && portal.indexOf('try { dkApplyUnlockMode(); } catch (e167) {}') >= 0);
ok('test hooks exposed', portal.indexOf('window.dkUnlockModeFor = dkUnlockModeFor') >= 0 && portal.indexOf('window.dkApplyUnlockMode = dkApplyUnlockMode') >= 0 && portal.indexOf('window.dkTestSetShareDoc') >= 0);

/* ---------- STATIC client.html: hardened phone login ---------- */
const ph = extractFn(portal, 'dkPhoneLogin');
ok('phone login flushes the pending password key BEFORE reading the cloud', ph.indexOf('await dkSyncPendingWsk()') >= 0 && ph.indexOf('await dkSyncPendingWsk()') < ph.indexOf('dkDirDocId(phone)'));
ok('directory fetch retries once with 10 s windows', ph.indexOf('attempt < 2 && !snap') >= 0 && ph.indexOf('setTimeout(() => res(null), 10000)') >= 0);
ok('stale cloud key: pending + cached payloads are tried before «wrong password»', ph.indexOf('dkWskPendingGet()') >= 0 && ph.indexOf('dkShareCacheGet()') >= 0 && ph.indexOf('dkUnwrapKey152(secret, c.wsk)') >= 0);
ok('working fallback key is pushed back to the cloud', ph.indexOf('dkSyncPendingWsk(); /* push the working key up') >= 0);
ok('unresolved stays an honest wrong-password', ph.indexOf("throw { code: 'wrong' }") >= 0);

/* ---------- client.html i18n islands ×3 ---------- */
for (const k of ['unlockPassTitle', 'unlockPassSubtitle', 'unlockPassBtn', 'unlockWrongPass']) {
  ok('client.html islands have ' + k + ' ×3', count(portal, k + ':') === 3);
}

/* ---------- STATIC fitness-crm.html: the modal shows the real secret ---------- */
ok('effective secret captured when the card holds the password', trainer.indexOf("effPass160 = cardPass160") >= 0);
ok('modal shows the card password instead of ••••••', trainer.indexOf("setupMode ? accessCode : (effPass160 || '••••••')") >= 0);
ok('label switches to «Пароль клиента»', trainer.indexOf("t('portal.passLabel')") >= 0);
ok('copy button copies the effective secret', trainer.indexOf('const secret = setupMode ? accessCode : (effPass160 || accessCode);') >= 0);
ok('WhatsApp invite includes the password when known', trainer.indexOf('t(\'clients.waInviteAppPass\', { name: client.full_name || \'\', url: clientUrl, code: effPass160 })') >= 0);

/* ---------- src/i18n ×3 ---------- */
for (const lang of ['ru', 'en', 'he']) {
  let d = null;
  try { d = JSON.parse(fs.readFileSync(path.join(root, 'src', 'i18n', lang + '.json'), 'utf8')); } catch (e) {}
  ok(lang + '.json has portal.passLabel + clients.waInviteAppPass', !!(d && d.portal && d.portal.passLabel && d.clients && d.clients.waInviteAppPass));
}

/* ---------- versions ---------- */
ok('sw cache at least v194', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 194; })());
ok('sw keeps c166 history and adds v194 c167', sw.indexOf('// v193: c166') >= 0 && sw.indexOf('// v194: c167') >= 0);
ok('RUNNING / dk-build at least c167', (function () {
  const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
  return !!r && !!b && Number(r[1]) >= 167 && Number(b[1]) >= 167;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
