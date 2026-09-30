/* c136 unit test — voice workout mode wiring (static analysis). */
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
['voiceStart', 'voiceResume', 'voiceSetWord', 'voiceSetDone', 'voiceSetUndone', 'voiceNextSet',
 'voiceKg', 'voiceLb', 'voiceReps', 'voiceRest', 'voiceRestSec', 'voiceFinish', 'voiceSetAdded', 'voiceSetRemoved'
].forEach(function (k) { ok('i18n ×3: ' + k, count(html, k + ":'") === 3); });

/* ---------- 2. helpers ---------- */
ok('voiceFull helper', html.indexOf('function voiceFull()') >= 0);
ok('wake-lock helper + release listener', html.indexOf('async function voiceWakeLock(on)') >= 0 && html.indexOf("navigator.wakeLock.request('screen')") >= 0);
ok('wake-lock re-acquired on visibilitychange', html.indexOf('if (!document.hidden && voiceOn() && getSession(activeDayIndex)) voiceWakeLock(true)') >= 0);

/* ---------- 3. workout events ---------- */
ok('start/resume announcement', html.indexOf("(_resumed136 ? t('voiceResume') : t('voiceStart')) + '. ' + dayLabel(idx) + '. ' + t('statEx') + ': ' + _n136") >= 0);
ok('start acquires the wake lock', html.indexOf('voiceWakeLock(true);') >= 0);
ok('rest start announcement', html.indexOf("voiceSay(t('voiceRest') + ' ' + timerTotal + ' ' + t('voiceRestSec'), 'info')") >= 0);
ok('set-done announcement', html.indexOf("let _m136 = t('voiceSetWord') + ' ' + (si + 1) + ' ' + t('voiceSetDone')") >= 0);
ok('next-set hint only at FULL', html.indexOf("if (voiceLevel() === 'full' && _nxt136 && (_nw136 != null || _nr136 != null))") >= 0);
ok('next-set hint falls back to the prescription (prev_*)', html.indexOf('(_nxt136.weight != null ? _nxt136.weight : _nxt136.prev_weight)') >= 0);
ok('next-set hint uses the unit word', html.indexOf("t('voiceNextSet') + ': '") >= 0 && html.indexOf("(ex.unit === 'lb') ? t('voiceLb') : t('voiceKg')") >= 0);
ok('un-done announcement (FULL)', html.indexOf("t('voiceSetUndone')") >= 0);
ok('add/remove set announcements (FULL)', html.indexOf("if (voiceFull()) voiceSay(t('voiceSetAdded'), 'info')") >= 0 && html.indexOf("if (voiceFull()) voiceSay(t('voiceSetRemoved'), 'info')") >= 0);
ok('type cycle announcement (FULL)', html.indexOf("if (voiceFull()) voiceSay(t(TYPE_I18N[set.type] || 'setNormal'), 'info')") >= 0);
ok('finish summary with sets + volume', html.indexOf("t('voiceFinish') + '. ' + t('sumDone') + ': ' + done + ' ' + t('voiceStepOf') + ' ' + total + '. ' + t('sumVolume') + ': ' + aNum(dispVolKg(volume))") >= 0);
ok('finish releases the wake lock', html.indexOf('voiceWakeLock(false);') >= 0);

/* ---------- 4. voice-mode UI + focus ---------- */
ok('voice-mode CSS block', html.indexOf('body.voice-mode .set-check') >= 0 && html.indexOf('body.voice-mode .rpe-btn') >= 0 && html.indexOf('body.voice-mode .set-input') >= 0);
ok('voiceApply toggles the body class', html.indexOf("document.body.classList.toggle('voice-mode', voiceOn())") >= 0);
ok('exercise modal focuses its close button', html.indexOf('if (!_exPrevFocus136 && document.activeElement && document.activeElement !== document.body)') >= 0 && html.indexOf("_xc136.focus({ preventScroll: true })") >= 0);
ok('card tap captures the opener for focus restore', html.indexOf("opener.setAttribute('tabindex', '-1'); _exPrevFocus136 = opener;") >= 0);
ok('modal close restores focus', html.indexOf('if (_exPrevFocus136 && document.contains(_exPrevFocus136)) _exPrevFocus136.focus') >= 0);

/* ---------- 5. versions ---------- */
ok('sw cache at least v163', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 163; })());
ok('RUNNING / dk-build at least c136', (function () {
  const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
  return !!r && !!b && Number(r[1]) >= 136 && Number(b[1]) >= 136;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
