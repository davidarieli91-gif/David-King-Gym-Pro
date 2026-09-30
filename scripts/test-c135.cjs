/* c135 unit test — voice coach wiring (static analysis of the REAL files). */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'client.html'), 'utf8');
const trainer = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }
function count(s, needle) { return s.split(needle).length - 1; }

/* ---------- 1. module wired everywhere ---------- */
ok('voice-coach.js exists', fs.existsSync(path.join(root, 'src', 'voice-coach.js')));
ok('portal loads the module', html.indexOf('<script type="module" src="src/voice-coach.js"></script>') >= 0);
ok('SW precaches the module', sw.indexOf("'./src/voice-coach.js'") >= 0);
ok('copy-assets ships the module', fs.readFileSync(path.join(root, 'scripts', 'copy-assets.js'), 'utf8').indexOf("'src/voice-coach.js'") >= 0);

/* ---------- 2. portal voice helpers ---------- */
['voiceOn', 'voiceLevel', 'voiceRate', 'voiceName', 'voiceSupported', 'voiceApply', 'voiceSay',
 'voiceStepLabel', 'voiceHaptic', 'exTechniqueSteps', 'voiceStepsStart', 'voiceTechByEi',
 'voiceAnnounceDay', 'renderVoiceBar', 'renderVoiceBarStep', 'voiceTechFromModal', 'voiceOnModalOpen'
].forEach(function (f) { ok('helper ' + f, html.indexOf('function ' + f) >= 0); });

/* ---------- 3. trigger points ---------- */
ok('toast() speaks through the coach', html.indexOf("try { voiceSay(msg, 'info'); } catch (e) {}") >= 0);
ok('nav tabs announce the section', html.indexOf("_vk135 = { workouts: 'navWorkouts'") >= 0 && html.indexOf("voiceSay(t(_vk135), 'nav')") >= 0);
ok('day tabs announce the day', html.indexOf('try { voiceAnnounceDay(activeDayIndex); } catch (e135) {}') >= 0);
ok('day announcement reads «Упражнения: N»', html.indexOf("voiceSay(dayLabel(idx) + '. ' + t('statEx') + ': ' + n, 'nav')") >= 0);
ok('setLang re-applies the narrator', html.indexOf('try { voiceApply(); } catch(e) {} /* c135: the narrator follows the new language */') >= 0);
ok('voiceApply re-renders ONLY on state flip', html.indexOf('_voiceLastOn !== on && currentClient') >= 0);

/* ---------- 4. technique reader: card + modal ---------- */
ok('card renders the 🔊 button in voice mode', html.indexOf('data-voice-tech="${ei}"') >= 0 && html.indexOf('window.dkVoiceCoach.isSupported() && voiceOn()') >= 0);
ok('card handler wired in wireExerciseEvents', html.indexOf("list.querySelectorAll('[data-voice-tech]')") >= 0 && html.indexOf('voiceTechByEi(+btn.dataset.voiceTech)') >= 0);
ok('modal player panel exists', html.indexOf('id="voice-tech-bar"') >= 0 && ['vt-play', 'vt-next', 'vt-repeat', 'vt-stop', 'vt-step'].every(id => html.indexOf('id="' + id + '"') >= 0));
ok('modal player buttons wired', ["vt-play')?.addEventListener('click', voiceTechFromModal", "vt-next')?.addEventListener", "vt-repeat')?.addEventListener", "vt-stop')?.addEventListener"].every(s => html.indexOf(s) >= 0));
ok('closing the modal clears the narration (c137 uses resetSteps)', html.indexOf('dkVoiceCoach.resetSteps(); } catch (e135) {}') >= 0);
ok('modal open caches steps + auto-reads in FULL', html.indexOf('voiceTechStepsCache = { key: exerciseId, name: name, steps: exTechniqueSteps(ex) };') >= 0 && html.indexOf('voiceOnModalOpen(ex);') >= 0);
ok('auto-read only at FULL level', html.indexOf("voiceLevel() !== 'full' || !voiceSupported()") >= 0);
ok('steps split on the existing « | » format', html.indexOf("indexOf(' | ') !== -1 ? String(raw).split(' | ') : String(raw).split('|')") >= 0);
ok('step label localized (Шаг N из M)', html.indexOf("t('voiceStepWord') + ' ' + (i + 1) + ' ' + t('voiceStepOf') + ' ' + total + '.'") >= 0);

/* ---------- 5. settings UI (script2) ---------- */
['cps-voice-toggle', 'cps-voice-rate', 'cps-voice-voice', 'cps-voice-novoice', 'cps-voice-test'].forEach(function (id) {
  ok('settings control ' + id, html.indexOf("id=\"" + id + "\"") >= 0);
});
ok('level buttons brief/full', html.indexOf('data-voice-level="brief"') >= 0 && html.indexOf('data-voice-level="full"') >= 0);
ok('wireVoiceSettings called on sheet build', html.indexOf('try { wireVoiceSettings(w); } catch (e) {}') >= 0);
ok('toggle writes opt-out (user choice beats trainer preset)', html.indexOf("localStorage.setItem('dk_voice_optout', '1')") >= 0 && html.indexOf("if (on) localStorage.removeItem('dk_voice_optout');") >= 0);
ok('enabling speaks the test phrase immediately', html.indexOf("window.dkVoiceCoach.speak(T('voiceTestPhrase')") >= 0);
ok('voices refresh on onvoiceschanged', html.indexOf('speechSynthesis.onvoiceschanged') >= 0);
ok('fillLabels fills the voice section', html.indexOf("set('cps-voice-label', T('voiceTitle'))") >= 0 && html.indexOf("set('cps-voice-test-lbl', T('voiceTest'))") >= 0);

/* ---------- 6. i18n ×3 ---------- */
['voiceTechPlay', 'voiceTechNext', 'voiceTechRepeat', 'voiceTechStop', 'voiceStepWord', 'voiceStepOf'].forEach(function (k) {
  ok('portal i18n ×3: ' + k, count(html, k + ":'") === 3);
});
['voiceTitle', 'voiceHint', 'voiceLevelBrief', 'voiceLevelFull', 'voiceRate', 'voiceVoice', 'voiceVoiceAuto',
 'voiceNoVoice', 'voiceTest', 'voiceTestPhrase', 'voiceOnToast', 'voiceOffToast', 'voiceOn', 'voiceOff'
].forEach(function (k) {
  ok('settings L ×3: ' + k, count(html, k + ":'") === 3);
});

/* ---------- 7. trainer preset ---------- */
ok('trainer checkbox exists', trainer.indexOf('id="chk-blind-voice"') >= 0);
ok('trainer label has data-i18n', trainer.indexOf('data-i18n="portal.blindLabel"') >= 0);
ok('payload carries blind_voice', trainer.indexOf('blind_voice: !!client.portal_blind') >= 0);
ok('checkbox stores the flag on the client + regenerates the link', trainer.indexOf('client.portal_blind = !!_chkBlind135.checked') >= 0 && trainer.indexOf('openClientPortalModal(clientId);') >= 0);
ok('portal auto-enables from blind_voice', html.indexOf("if (d.blind_voice && localStorage.getItem('dk_voice_optout') !== '1')") >= 0);
ok('auto-enable uses the FULL level', html.indexOf("localStorage.setItem('dk_voice_level', 'full');") >= 0);
['ru', 'en', 'he'].forEach(function (lng) {
  const j = JSON.parse(fs.readFileSync(path.join(root, 'src', 'i18n', lng + '.json'), 'utf8'));
  ok('i18n json ' + lng + ': blindLabel + blindRegen', !!(j.portal && j.portal.blindLabel && j.portal.blindRegen));
});

/* ---------- 8. versions ---------- */
ok('sw cache at least v162', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 162; })());
ok('RUNNING / dk-build at least c135', (function () {
  const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
  return !!r && !!b && Number(r[1]) >= 135 && Number(b[1]) >= 135;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
