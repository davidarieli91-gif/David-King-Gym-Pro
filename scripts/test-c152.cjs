/* c152 unit + static test — stable account (ShareKey + phone directory + password).
   Unit part extracts the REAL crypto helpers (portal + trainer) and the phone
   normalizer; Node's WebCrypto runs the actual PBKDF2/AES-GCM round trips. */
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
  if (start >= 6 && src.slice(start - 6, start) === 'async ') start -= 6; /* keep the async keyword */
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

(async function () {
  /* ---------- UNIT: phone normalization (real portal function) ---------- */
  const srcPhone = extractFn(html, 'dkNormPhone') + '\n;globalThis.__P152 = { dkNormPhone };';
  new Function(srcPhone)();
  const P = globalThis.__P152;
  eq('local 0540000000 stays', P.dkNormPhone('0540000000'), '0540000000');
  eq('+972 54-000-0000 → local', P.dkNormPhone('+972 54-000-0000'), '0540000000');
  eq('972540000000 → local', P.dkNormPhone('972540000000'), '0540000000');
  eq('9-digit 540000000 gets the 0', P.dkNormPhone('540000000'), '0540000000');
  eq('spaces/dashes stripped', P.dkNormPhone('054 000 00 00'), '0540000000');
  eq('junk rejected', P.dkNormPhone('123'), '');
  eq('too long rejected', P.dkNormPhone('05400000000'), '');
  eq('empty rejected', P.dkNormPhone(''), '');

  /* ---------- UNIT: real WebCrypto round trips ---------- */
  const srcCrypto = [
    extractFn(html, 'b64uEncode'), extractFn(html, 'b64uDecode'),
    extractFn(html, 'dkWrapKey152'), extractFn(html, 'dkUnwrapKey152'), extractFn(html, 'dkDecryptWithSk152'),
    extractFn(trainer, 'dkEncryptWithSk152')
  ].join('\n') + '\n;globalThis.__C152 = { b64uEncode, b64uDecode, dkWrapKey152, dkUnwrapKey152, dkDecryptWithSk152, dkEncryptWithSk152 };';
  new Function(srcCrypto)();
  const C = globalThis.__C152;
  const sk = crypto.getRandomValues(new Uint8Array(32));
  const wsk = await C.dkWrapKey152('135790', sk);
  const un = await C.dkUnwrapKey152('135790', wsk);
  ok('wrap → unwrap round trip returns the same ShareKey', !!un && un.length === 32 && Array.from(un).join(',') === Array.from(sk).join(','));
  const bad = await C.dkUnwrapKey152('000000', wsk);
  eq('wrong password cannot unwrap (null)', bad, null);
  const d = await C.dkEncryptWithSk152(sk, { client: { full_name: 'C152 Test' }, exp: Date.now() + 100000 });
  const parsed = await C.dkDecryptWithSk152(sk, d);
  eq('payload encrypt → decrypt with SK', parsed.client.full_name, 'C152 Test');
  let wrongKey = null;
  try { wrongKey = await C.dkDecryptWithSk152(crypto.getRandomValues(new Uint8Array(32)), d); } catch (e) { wrongKey = 'threw'; }
  eq('wrong SK cannot decrypt the payload', wrongKey, 'threw');

  /* ---------- STATIC: trainer side ---------- */
  ok('trainer: SK generated once and kept in the client record', trainer.indexOf('if (!client.portal_sk) {') >= 0 && trainer.indexOf("client.portal_sk = b64uEncode(crypto.getRandomValues(new Uint8Array(32)))") >= 0 && trainer.indexOf("await db.put('clients', client)") >= 0);
  ok('trainer: payload encrypted with SK (not the code)', trainer.indexOf('const payloadB64Sk = await dkEncryptWithSk152(skBytes152, payload)') >= 0 && trainer.indexOf('await uploadPortalShare(shareId, { d: payloadB64Sk, v: 2, ts: Date.now(), wsk: wsk, setup: setup })') >= 0);
  ok('trainer: re-share keeps the client password (setup:false preserved)', trainer.indexOf('existing.wsk && existing.setup === false && !(opts && opts.forceSetup)') >= 0 && trainer.indexOf('wsk = existing.wsk; setup = false;') >= 0);
  ok('trainer: setup code wraps SK for the first/reset login', trainer.indexOf('wsk = await dkWrapKey152(accessCode, skBytes152); setup = true;') >= 0);
  ok('trainer: directory registration on share', trainer.indexOf('await registerPortalDirectory(client, shareId)') >= 0 && trainer.indexOf("collection('portal_dir').doc(id).set({ shareId: shareId, v: 1, ts: Date.now() })") >= 0);
  ok('trainer: reset password flow + button', trainer.indexOf('async function resetPortalPassword(clientId)') >= 0 && trainer.indexOf("openClientPortalModal(clientId, { forceSetup: true })") >= 0 && trainer.indexOf('id="btn-portal-reset-pass"') >= 0 && trainer.indexOf('id="portal-phone-status"') >= 0);
  ok('trainer: legacy #e= fallback still code-encrypted', trainer.indexOf("clientUrl = `${origin}client.html#e=1.${b64uEncode(blob)}`") >= 0);
  ok('trainer: WhatsApp invite switches to password wording', trainer.indexOf("t('clients.waInviteApp'") >= 0);
  ok('rules: portal_dir get-only, immutable shareId, no list/delete', trainer.indexOf('match /portal_dir/{id}') >= 0 && trainer.indexOf('allow update: if request.resource.data.shareId == resource.data.shareId;') >= 0 && trainer.indexOf('match /portal_dir/{id} {\\n      allow get: if true;') >= 0);

  /* ---------- STATIC: portal side ---------- */
  ok('portal: doc-aware crypto helpers', html.indexOf('async function dkShareDecrypt(secret)') >= 0 && html.indexOf('if (doc.wsk) {') >= 0 && html.indexOf('_shareSk = sk;') >= 0 && html.indexOf('legacy: no wsk') >= 0);
  ok('portal: phone login (dir get → share → decrypt)', html.indexOf('async function dkPhoneLogin()') >= 0 && html.indexOf("collection('portal_dir').doc(id).get({ source: 'server' })") >= 0 && html.indexOf('const shareId = String(snap.data().shareId);') >= 0);
  ok('portal: phone UI block + back + error', html.indexOf('id="unlock-phone-block"') >= 0 && html.indexOf('id="phone-input"') >= 0 && html.indexOf('id="phone-pass"') >= 0 && html.indexOf('id="btn-phone-login"') >= 0 && html.indexOf('id="btn-phone-back"') >= 0);
  ok('portal: password setup modal (4–10 digits, confirm)', html.indexOf('id="dk-pass-modal"') >= 0 && html.indexOf('async function dkPassSave()') >= 0 && html.indexOf("if (p1.length < 4 || p1.length > 10)") >= 0 && html.indexOf("if (p1 !== p2)") >= 0 && html.indexOf("setup: false") >= 0);
  ok('portal: password saved locally first, then cloud', html.indexOf('const wsk = await dkWrapKey152(p1, _shareSk);') >= 0 && html.indexOf("localStorage.setItem(dkShareCacheKey(s.shareId), JSON.stringify(doc))") >= 0 && html.indexOf('passSavedLocal') >= 0);
  ok('portal: setup prompt after first unlock', html.indexOf('if (_shareDoc && _shareDoc.wsk && _shareDoc.setup) dkPassSetupOpen(false)') >= 0);
  ok('portal: session stores the secret (v2) with v1 migration', html.indexOf('const secret = s.secret || s.code;') >= 0 && html.indexOf('secret: String(secret || \'\')') >= 0);
  ok('portal: multi-account store + switch + picker', html.indexOf("const DK_ACCOUNTS_KEY = 'dk_portal_accounts'") >= 0 && html.indexOf('function dkSwitchAccount(shareId)') >= 0 && html.indexOf('function dkShowAccountPicker(accs)') >= 0 && html.indexOf('id="unlock-accounts"') >= 0);
  ok('portal: per-account cache + legacy fallback', html.indexOf("function dkShareCacheKey(shareId)") >= 0 && html.indexOf("localStorage.setItem(dkShareCacheKey(id), JSON.stringify(_shareDoc))") >= 0 && html.indexOf("'dk_client_data__' + ns") >= 0);
  ok('portal: logout drops the account and switches to the next', html.indexOf('if (sid) dkAccountsRemove(sid);') >= 0 && html.indexOf('if (next && next.shareId !== sid) { if (dkSwitchAccount(next.shareId)) return; }') >= 0);
  ok('portal: client-side password change REMOVED (c160: trainer owns it)', html.indexOf('id="cps-pass"') < 0 && html.indexOf('dkPassSetupOpen(true)') < 0);

  /* ---------- STATIC: i18n ×3 ---------- */
  ok('portal islands have the c152 keys ×3', count(html, 'phoneLoginBtn:') === 3 && count(html, 'passSetupTitle:') === 3 && count(html, 'accountsTitle:') === 3 && count(html, 'phoneWrong:') === 3 && count(html, 'passSaved:') === 3);
  for (const lang of ['ru', 'en', 'he']) {
    let d = null;
    try { d = JSON.parse(fs.readFileSync(path.join(root, 'src', 'i18n', lang + '.json'), 'utf8')); } catch (e) {}
    const p = d && d.portal;
    const need = ['commonLoginTitle', 'phoneOk', 'phoneMissing', 'phoneLegacy', 'resetPass', 'resetConfirm', 'resetNoShare', 'passSetNote'];
    const missing = p ? need.filter(k => !p[k]) : need;
    ok(lang + '.json parses + portal.* c152 keys', !!p && missing.length === 0 && !!(d.clients && d.clients.waInviteApp));
  }

  /* ---------- versions ---------- */
  ok('sw cache at least v179', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 179; })());
  ok('RUNNING / dk-build at least c152', (function () {
    const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
    return !!r && !!b && Number(r[1]) >= 152 && Number(b[1]) >= 152;
  })());

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FAIL suite crashed: ' + (e && e.message)); process.exit(1); });
