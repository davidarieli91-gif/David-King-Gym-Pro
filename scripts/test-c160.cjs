/* c160 test — the portal password lives in the client card (visible, editable)
   and the trainer is the single source of truth. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const trainer = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const html = fs.readFileSync(path.join(root, 'client.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }

/* ---------- trainer: form field ---------- */
ok('client form has the portal password field', trainer.indexOf('name="portal_pass"') >= 0 && trainer.indexOf('id="client-gen-pass"') >= 0);
ok('field is labelled + hinted (i18n keys)', trainer.indexOf('data-i18n="client.portalPass"') >= 0 && trainer.indexOf('data-i18n="client.portalPassHint"') >= 0 && trainer.indexOf('data-i18n="client.portalPassGen"') >= 0);
ok('generate button fills a random 6-digit password', trainer.indexOf("inp.value = String(Math.floor(100000 + Math.random() * 900000));") >= 0);
ok('openEdit/openCreate carry the field', trainer.indexOf('form.elements.portal_pass.value = c.portal_pass || \'\';') >= 0 && trainer.indexOf('form.elements.portal_pass.value = \'\';') >= 0);
ok('save validates 4–10 digits', trainer.indexOf("obj.portal_pass = String(fd.get('portal_pass') || '').trim();") >= 0 && trainer.indexOf("!/^\\d{4,10}$/.test(obj.portal_pass)") >= 0);
ok('save publishes the password to the cloud share', trainer.indexOf('window.dkTrainerSetClientPassword(saved.id, saved.portal_pass)') >= 0);

/* ---------- trainer: publish helper + share modal ---------- */
ok('dkTrainerSetClientPassword wraps + writes setup:false', trainer.indexOf('window.dkTrainerSetClientPassword = async function (clientId, pass)') >= 0 && trainer.indexOf('const wsk = await dkWrapKey152(String(pass), b64uDecode(client.portal_sk));') >= 0 && trainer.indexOf('await ref.set({ d: snap.data().d, v: 2, ts: Date.now(), wsk: wsk, setup: false });') >= 0);
ok('share modal wraps with the CARD password first', trainer.indexOf('const cardPass160 = String(client.portal_pass || \'\').trim();') >= 0 && trainer.indexOf('wsk = await dkWrapKey152(cardPass160, skBytes152); setup = false;') >= 0);
ok('reset refuses when the card has a password', trainer.indexOf("if (client.portal_pass) { toast(t('portal.resetUseCard')") >= 0);

/* ---------- trainer: profile card row ---------- */
ok('profile card shows the password permanently', trainer.indexOf("rows.push([t('client.portalPassShort'), hasPass ? String(c.portal_pass) : t('client.portalPassNone'), 'lock']);") >= 0);
ok('profile card renders even with only a password', trainer.indexOf('if (!c.phone && !c.email && !hasPass && !c.birth_date) return \'\';') >= 0);
ok('profile card labels translated (phone/email/pass)', trainer.indexOf("rows.push([t('client.phone'), c.phone, 'phone']);") >= 0 && trainer.indexOf("rows.push([t('client.email'), c.email, 'mail']);") >= 0);

/* ---------- portal: client change removed ---------- */
ok('portal no longer offers a change-password button', html.indexOf('id="cps-pass"') < 0 && html.indexOf("e.target.closest('#cps-pass')") < 0 && html.indexOf('dkPassSetupOpen(true)') < 0);

/* ---------- i18n ×3 ---------- */
for (const lang of ['ru', 'en', 'he']) {
  let d = null;
  try { d = JSON.parse(fs.readFileSync(path.join(root, 'src', 'i18n', lang + '.json'), 'utf8')); } catch (e) {}
  const need = ['portalPass', 'portalPassShort', 'portalPassGen', 'portalPassHint', 'portalPassInvalid', 'portalPassSaved', 'portalPassLocal', 'portalPassNone'];
  const missing = d ? need.filter(k => !(d.client && d.client[k])) : need;
  ok(lang + '.json has all client.portalPass* keys + portal.resetUseCard', missing.length === 0 && !!(d && d.portal && d.portal.resetUseCard));
}

/* ---------- versions ---------- */
ok('sw cache at least v187', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 187; })());
ok('RUNNING / dk-build at least c160', (function () {
  const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
  return !!r && !!b && Number(r[1]) >= 160 && Number(b[1]) >= 160;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
