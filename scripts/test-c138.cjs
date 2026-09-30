/* c138 unit test — the narrator speaks EVERYTHING (static analysis). */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'client.html'), 'utf8');
const trainer = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }
function count(s, needle) { return s.split(needle).length - 1; }

/* ---------- 1. i18n ×3 ---------- */
['voiceRpe', 'voiceMinutes', 'voiceMeters', 'voiceKm', 'voiceCm', 'voiceUnitKg', 'voiceUnitLb'].forEach(function (k) {
  ok('i18n ×3: ' + k, count(html, k + ":'") === 3);
});

/* ---------- 2. generic tap reader ---------- */
ok('voiceSay stamps the anti-double-speak timestamp', html.indexOf('let _lastVoiceSayAt = 0;') >= 0 && html.indexOf('_lastVoiceSayAt = Date.now();') >= 0);
ok('narrator exported to script2 (apply + say)', html.indexOf('window.dkVoiceApply = voiceApply;') >= 0 && html.indexOf('window.dkVoiceSay = voiceSay;') >= 0);
ok('generic click reader exists (FULL only)', html.indexOf("document.addEventListener('click', function (e) {") >= 0 && html.indexOf("if (!voiceFull()) return;") >= 0);
ok('tap label precedence: hint → aria → title → text', html.indexOf("el.getAttribute('data-voice-hint') || el.getAttribute('aria-label') || el.getAttribute('title') || (el.textContent || '')") >= 0);
ok('specific handlers suppress the generic one', html.indexOf('if (Date.now() - _lastVoiceSayAt < 500) return; /* a specific handler already spoke for this tap */') >= 0);
ok('reader targets buttons/roles/links/tabs', html.indexOf("e.target.closest('button, [role=\"button\"], a[href], .nav-tab')") >= 0);

/* ---------- 3. fields: focus + values ---------- */
ok('focusin wiring', html.indexOf("document.addEventListener('focusin', function (e) { try { voiceFieldFocus(e.target); }") >= 0);
ok('weight focus says label + unit', html.indexOf("text = t('weightLabel') + ', ' + voiceUnitLabel(voiceSessionExUnit(el))") >= 0);
ok('reps focus says the label + value', html.indexOf("else if (f === 'reps') text = t('tileReps')") >= 0);
ok('check-in fields introduced', html.indexOf("el.id === 'input-checkin-weight') text = t('morningWeight') + ', ' + voiceUnitLabel(dispUnitGet())") >= 0 && html.indexOf("el.id === 'input-checkin-waist') text = t('reportWaist')") >= 0);
ok('entered weight read back with the unit', html.indexOf("if (f === 'weight') text = val + ' ' + voiceUnitFull(voiceSessionExUnit(el));") >= 0);
ok('entered reps read back', html.indexOf("else if (f === 'reps') text = val + ' ' + t('voiceReps');") >= 0);
ok('time respects the exercise tunit', html.indexOf("voiceSessionTimeUnit(el); text = val + ' ' + (u === 'sec' ? t('voiceRestSec') : t('voiceMinutes'))") >= 0);
ok('distance uses the exposed cardio unit', html.indexOf('window.dkCUnitGetPortal ? window.dkCUnitGetPortal().d : \'m\'') >= 0);
ok('check-in weight value read w/ unit; note NEVER read', html.indexOf("el.id === 'input-checkin-weight') text = val + ' ' + voiceUnitFull(dispUnitGet())") >= 0 && html.indexOf("el.id === 'input-checkin-note') return; /* free text") >= 0);
ok('change listener for inputs + selects', html.indexOf("document.addEventListener('change', function (e) { try { voiceFieldChange(e.target); }") >= 0);
ok('select announces the chosen option', html.indexOf('const opt = el.options && el.options[el.selectedIndex];') >= 0);
ok('typing has a 900ms debounced read', html.indexOf('el._vTimer138 = setTimeout(function () { try { voiceFieldValue(el); } catch (e138) {} }, 900);') >= 0);

/* ---------- 4. RPE 1–10 ---------- */
ok('RPE announced on the 1–10 scale', html.indexOf("voiceSay(t('voiceRpe') + ' ' + set.rpe + ' ' + t('voiceStepOf') + ' 10', 'nav')") >= 0);
ok('RPE clearing announced', html.indexOf("voiceSay(t('voiceRpe') + ' ' + t('voiceSetUndone'), 'info')") >= 0);

/* ---------- 5. unit switches ---------- */
ok('kg/lb chip carries the current unit as a hint', html.indexOf("ch.setAttribute('data-voice-hint', wLabel(u));") >= 0);
ok('unit sheet selection speaks the unit', html.indexOf("if (window.dkVoiceSay) window.dkVoiceSay(wLabel(u), 'nav');") >= 0);
ok('cardio time/distance units speak', html.indexOf("window.dkVoiceSay(T(u === 'sec' ? 'wunitSec' : 'wunitMin'), 'nav')") >= 0 && html.indexOf("window.dkVoiceSay(T(u === 'km' ? 'wunitKm' : 'wunitM'), 'nav')") >= 0);
ok('cardio units exposed for the narrator', html.indexOf('window.dkCUnitGetPortal = function () { return { t: cuTGet(), d: cuDGet() }; };') >= 0);

/* ---------- 6. versions ---------- */
ok('sw cache at least v165', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 165; })());
ok('RUNNING / dk-build at least c138', (function () {
  const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
  return !!r && !!b && Number(r[1]) >= 138 && Number(b[1]) >= 138;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
