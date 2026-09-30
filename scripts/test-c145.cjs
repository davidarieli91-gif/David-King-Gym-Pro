/* c145 unit test — STRICT voice mode (module) + portal diagnostics wiring. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'src', 'voice-coach.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'client.html'), 'utf8');
const trainer = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }
const count = (s, n) => s.split(n).length - 1;

/* ---------- 1. module strict mode (fresh sandbox, EN-only voices) ---------- */
(async function () {
  const said = [];
  const missing = [];
  const voices = [{ name: 'Samantha', lang: 'en-US', localService: true, default: true }];
  globalThis.speechSynthesis = {
    paused: false,
    getVoices() { return voices; },
    speak(u) { said.push(u); setTimeout(() => { try { u.onend && u.onend(); } catch (e) {} }, 5); },
    cancel() {}, resume() {}, pause() {}
  };
  globalThis.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; this.lang = ''; this.rate = 1; this.voice = null; } };
  new Function(src)();
  const VC = globalThis.dkVoiceCoach;
  ok('module version c145', VC.version === 'c145');
  VC.configure({ lang: 'ru-RU', strictVoice: true, onMissingVoice: function (tag) { missing.push(tag); } });
  const r1 = VC.speak('Привет мир', { priority: 'nav', lang: 'ru-RU' });
  ok('strict: RU phrase refused (no garbled utterance)', r1 === false && said.length === 0);
  ok('strict: onMissingVoice reported ru-RU', missing.length === 1 && missing[0] === 'ru-RU');
  const st = VC.speakSteps('Раз | Два', { lang: 'ru-RU' });
  ok('strict: speakSteps refused for a missing language', st === null && said.length === 0);
  const r2 = VC.speak('Hello world', { priority: 'nav', lang: 'en-US' });
  await new Promise(r => setTimeout(r, 100));
  ok('strict: EN phrase still speaks', r2 === true && said.some(u => u.text === 'Hello world'));
  VC.configure({ strictVoice: false });
  const r3 = VC.speak('Без строгого режима', { priority: 'nav', lang: 'ru-RU' });
  ok('non-strict keeps the legacy behaviour', r3 === true);

  /* ---------- 2. portal wiring (static) ---------- */
  ok('per-language voice memory + migration', html.indexOf('function voiceNameFor(lang)') >= 0 && html.indexOf('function voiceMigrateOldName()') >= 0 && html.indexOf("const key = 'dk_voice_name_' + currentLang;") >= 0 && html.indexOf('localStorage.setItem(key, old)') >= 0);
  ok('configure uses strictVoice + onMissingVoice', html.indexOf('strictVoice: true, onMissingVoice: voiceMissingNotice') >= 0);
  ok('hero badge exists + is wired', html.indexOf('id="voice-missing-badge"') >= 0 && html.indexOf("document.getElementById('voice-missing-badge')?.addEventListener('click'") >= 0);
  ok('one-time notices in 3 languages', count(html, "ru: 'Голос для выбранного языка не установлен") === 1 && count(html, "en: 'The voice for the selected language is not installed") === 1 && count(html, "he: 'הקול לשפה הנבחרת") === 1);
  ok('badge refreshed from voiceApply + diagnostics API exposed', html.indexOf('try { voiceMissingBadge(); } catch (e) {}') >= 0 && html.indexOf('window.dkVoiceDiagRefresh = function ()') >= 0);
  ok('diagnostics markup', ['cps-voice-status-title', 'cps-voice-status', 'cps-voice-refresh', 'cps-voice-help-toggle', 'cps-voice-help'].every(id => html.indexOf('id="' + id + '"') >= 0));
  ok('platform detection + 4 platform guides ×3 langs', html.indexOf('function voicePlatform()') >= 0 && count(html, 'voiceHelp_win:') === 3 && count(html, 'voiceHelp_android:') === 3 && count(html, 'voiceHelp_ios:') === 3 && count(html, 'voiceHelp_mac:') === 3);
  ok('copy-instructions button', html.indexOf("navigator.clipboard.writeText(txt)") >= 0);
  ok('voice select saves per language', html.indexOf("localStorage.setItem('dk_voice_name_' + curLang(), vsel.value || '')") >= 0);
  ok('enabling without a voice opens the guide instead of a test phrase', html.indexOf("if (!hasV) {") >= 0 && html.indexOf('voiceDiagRender(); voiceHelpRender(true);') >= 0);
  ok('onvoiceschanged refreshes diagnostics + badge', html.indexOf('try { voiceDiagRender(); } catch (e135) {} try { if (window.dkVoiceDiagRefresh) window.dkVoiceDiagRefresh(); }') >= 0);

  /* ---------- 3. versions ---------- */
  ok('sw cache at least v172', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 172; })());
  ok('RUNNING / dk-build at least c145', (function () {
    const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
    return !!r && !!b && Number(r[1]) >= 145 && Number(b[1]) >= 145;
  })());

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})();
