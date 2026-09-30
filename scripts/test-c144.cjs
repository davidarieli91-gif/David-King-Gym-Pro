/* c144 unit test — set timer + loud bell + progress chime (static). */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'client.html'), 'utf8');
const trainer = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }
function count(s, needle) { return s.split(needle).length - 1; }

/* ---------- 1. portal ---------- */
ok('portal helpers exist', ['bellLoud', 'progressChime', 'maybeProgressChime', 'fmtClock', 'setTimerStop', 'setTimerStopAll', 'setTimerToggle'].every(f => html.indexOf('function ' + f) >= 0));
ok('rest beep volume doubled (0.18 → 0.36)', html.indexOf('gain.gain.setValueAtTime(0.36, ctx.currentTime); /* c144: twice as loud (user request) */') >= 0);
ok('timer button rendered on time-based rows', html.indexOf('const timerBtnP = (si) => `<button type="button" data-set-timer') >= 0 && count(html, '${timerBtnP(si)}') >= 2);
ok('timer click wired (tunit-aware seconds)', html.indexOf("const sec = (lex.tunit === 'sec') ? v : v * 60;") >= 0 && html.indexOf("toast(t('timerNoTime'), 'warn')") >= 0);
ok('timer rings the loud bell + announces', html.indexOf('bellLoud();') >= 0 && html.indexOf("toast(t('voiceTimeUp'));") >= 0);
ok('progress chime on ✓ (weight×reps vs prev)', html.indexOf('better = (w * (r || 0)) > (pw * (pr || 0));') >= 0 && html.indexOf("else if (r != null && pr != null) better = r > pr; /* bodyweight: reps only */") >= 0);
ok('progress hook in the done handler', html.indexOf('try { if (set.done) maybeProgressChime(set); } catch (e144) {}') >= 0);
ok('timers stopped on save', html.indexOf('try { setTimerStopAll(); } catch (e144) {}') >= 0);
ok('portal i18n ×3', count(html, "a11ySetTimer:'") === 3 && count(html, "voiceTimerStart:'") === 3 && count(html, "voiceTimeUp:'") === 3 && count(html, "voiceProgress:'") === 3 && count(html, "timerNoTime:'") === 3);

/* ---------- 2. trainer ---------- */
ok('trainer live helpers exist', ['window.dkLiveBell', 'window.dkLiveProgress', 'window.dkLiveProgressCheck', 'window.dkLiveTimerToggle', 'window.dkLiveTimerStop'].every(s => trainer.indexOf(s) >= 0));
ok('trainer rest beep doubled (0.3 → 0.6)', trainer.indexOf('gain.gain.setValueAtTime(0.6, ctx.currentTime); /* c144: twice as loud (user request) */') >= 0);
ok('live timer button on time-based rows', trainer.indexOf('data-live-set-timer="${exIdx}.${setIdx}"') >= 0 && count(trainer, '${timerBtn}') >= 2);
ok('live timer click wired', trainer.indexOf("window.dkLiveTimerToggle(exIdx + '-' + setIdx, sec, btn);") >= 0 && trainer.indexOf("const sec = (ex.tunit === 'sec') ? v : v * 60;") >= 0);
ok('live progress check on ✓', trainer.indexOf('try { window.dkLiveProgressCheck(set); } catch (e144) {}') >= 0);
ok('live progress compares like the portal', trainer.indexOf('better = (w * (r || 0)) > (pw * (pr || 0));') >= 0);
['ru', 'en', 'he'].forEach(function (lng) {
  const j = JSON.parse(fs.readFileSync(path.join(root, 'src', 'i18n', lng + '.json'), 'utf8'));
  ok('trainer i18n ' + lng + ': setTimer/timeUp/progress/noTime', !!(j.workouts && j.workouts.setTimer && j.workouts.timeUp && j.workouts.progress && j.workouts.noTime));
});

/* ---------- 3. versions ---------- */
ok('sw cache at least v171', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 171; })());
ok('RUNNING / dk-build at least c144', (function () {
  const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
  return !!r && !!b && Number(r[1]) >= 144 && Number(b[1]) >= 144;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
