/* c135 unit test — voice-coach core with a stubbed speechSynthesis.
   Hand-computed expectations: chunking, cleaning, language/voice pick, queue,
   interrupt, dedupe (info only), step lifecycle, watchdog recovery. */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'voice-coach.js'), 'utf8');

let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }
function eq(name, got, want) { const g = JSON.stringify(got); const w = JSON.stringify(want); const c = g === w; if (c) { pass++; console.log('PASS ' + name + ' = ' + g); } else { fail++; console.log('FAIL ' + name + ' got ' + g + ' want ' + w); } }
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async function main() {
  /* ---------- stubs ---------- */
  const voices = [
    { name: 'Google русский', lang: 'ru-RU', localService: true, default: true },
    { name: 'Samantha', lang: 'en-US', localService: true },
    { name: 'Carmit', lang: 'he-IL', localService: true },
    { name: 'Maged', lang: 'ar-EG', localService: false }
  ];
  const said = [];
  let cancels = 0;
  const synth = {
    paused: false,
    getVoices() { return voices; },
    speak(u) {
      said.push(u);
      if (u.text === 'STUCK') return; /* the watchdog case: onend never fires */
      setTimeout(() => {
        try { u.onend && u.onend(); } catch (e) {}
      }, 5);
    },
    cancel() { cancels++; },
    resume() {},
    pause() {}
  };
  class FakeUtter {
    constructor(text) { this.text = text; this.lang = ''; this.rate = 1; this.voice = null; }
  }
  globalThis.speechSynthesis = synth;
  globalThis.SpeechSynthesisUtterance = FakeUtter;
  new Function(src)();
  const VC = globalThis.dkVoiceCoach;

  ok('engine exported', !!VC);
  ok('version c137', VC.version === 'c137');
  ok('isSupported with stub', VC.isSupported() === true);

  /* ---------- 1. chunking ---------- */
  eq('chunk: short text untouched', VC.chunkText('Привет мир'), ['Привет мир']);
  eq('chunk: empty → []', VC.chunkText('   '), []);
  const long = 'Первое предложение про технику. Второе предложение чуть длиннее первого. Третье предложение завершает описание упражнения целиком.';
  const chunks = VC.chunkText(long, 60);
  ok('chunk: splits into multiple ≤60', chunks.length >= 3 && chunks.every(c => c.length <= 60));
  ok('chunk: joined content preserved', chunks.join(' ').replace(/\s+/g, ' ').indexOf('Третье предложение') >= 0);
  const hugeWord = 'а'.repeat(250);
  eq('chunk: oversized single word kept intact', VC.chunkText(hugeWord, 60), [hugeWord]);

  /* ---------- 2. speech cleaning ---------- */
  eq('clean: emoji/arrows/checkmarks stripped', VC.cleanForSpeech('🎉 Тренировка сохранена ✓ ▲ +5 kg'), 'Тренировка сохранена +5 kg');
  ok('clean: hebrew survives', VC.cleanForSpeech('🎧 אימון הושלם ✓').indexOf('אימון') >= 0);
  ok('clean: collapse whitespace', VC.cleanForSpeech('a   b\n c') === 'a b c');

  /* ---------- 3. language tags + voices ---------- */
  eq('langTag ru', VC.langTag('ru'), 'ru-RU');
  eq('langTag he', VC.langTag('he'), 'he-IL');
  eq('langTag unknown → en', VC.langTag('xx'), 'en-US');
  eq('listVoices ru', VC.listVoices('ru').map(v => v.name), ['Google русский']);
  eq('hasVoiceFor he', VC.hasVoiceFor('he-IL'), true);
  eq('hasVoiceFor fr (none)', VC.hasVoiceFor('fr-FR'), false);

  /* ---------- 4. speak: voice pick, rate, lang ---------- */
  VC.configure({ lang: 'ru-RU', rate: 1.2, voiceName: '', watchdogMs: 3000 });
  said.length = 0;
  VC.speak('Привет', { priority: 'nav' });
  await sleep(150);
  eq('speak: utterance created', said.length, 1);
  eq('speak: lang applied', said[0].lang, 'ru-RU');
  eq('speak: rate applied', said[0].rate, 1.2);
  eq('speak: local voice picked first', said[0].voice && said[0].voice.name, 'Google русский');

  /* ---------- 5. queue order + interrupt ---------- */
  said.length = 0;
  VC.speak('Первая фраза', { priority: 'info' });
  VC.speak('Вторая фраза', { priority: 'info' });
  await sleep(250);
  eq('queue: both spoken in order', said.map(u => u.text), ['Первая фраза', 'Вторая фраза']);

  said.length = 0;
  VC.speak('Долгая фраза которую мы прервём', { priority: 'info' });
  VC.speak('Срочно', { priority: 'nav' });
  await sleep(250);
  ok('interrupt: nav lands immediately, old cancelled', said.some(u => u.text === 'Срочно') && cancels > 0);
  await sleep(150);
  ok('interrupt: old phrase does not continue after cancel', said.filter(u => u.text.indexOf('Долгая') === 0).length <= 1);

  /* ---------- 6. dedupe: info yes, nav/step never ---------- */
  said.length = 0;
  const first = VC.speak('Одинаковый тост', { priority: 'info' });
  await sleep(150);
  const second = VC.speak('Одинаковый тост', { priority: 'info' });
  eq('dedupe: repeated info suppressed', [first, second], [true, false]);
  await sleep(150);
  said.length = 0;
  VC.speak('Повтор', { priority: 'nav' });
  VC.speak('Повтор', { priority: 'nav' });
  await sleep(250);
  eq('dedupe: nav repeats always spoken', said.filter(u => u.text === 'Повтор').length, 2);

  /* ---------- 7. steps: AUTO continuation (c137 — the real-device bug) ---------- */
  const autoEvents = [];
  said.length = 0;
  const st0 = VC.speakSteps('Займите положение | Опускайте медленно | Вернитесь вверх', {
    gapMs: 25,
    stepLabel: (i, t) => 'Шаг ' + (i + 1) + ' из ' + t,
    onStep: (i) => autoEvents.push('s' + i),
    onDone: () => autoEvents.push('done')
  });
  eq('steps: initial status', st0, { active: true, index: 0, total: 3, finished: false });
  await sleep(450);
  eq('steps: AUTO plays all three in order', said.map(u => u.text), [
    'Шаг 1 из 3 Займите положение', 'Шаг 2 из 3 Опускайте медленно', 'Шаг 3 из 3 Вернитесь вверх']);
  eq('steps: onStep order', autoEvents.filter(e => e[0] === 's'), ['s0', 's1', 's2']);
  ok('steps: onDone fired at the end', autoEvents.indexOf('done') >= 0);
  eq('steps: finished status keeps the last position', VC.stepStatus(), { active: true, index: 2, total: 3, finished: true });

  /* ---------- 8. goto / pause / resume / reset (c137) ---------- */
  said.length = 0;
  VC.stepGoto(1);
  await sleep(30);
  ok('goto: plays step 2 after a finished run', said.some(u => u.text === 'Шаг 2 из 3 Опускайте медленно'));
  await sleep(350);
  eq('goto: auto continued to the end', said[said.length - 1].text, 'Шаг 3 из 3 Вернитесь вверх');

  said.length = 0;
  VC.speakSteps('X старт | Y середина | Z финал', { gapMs: 150 });
  await sleep(250); /* X done, Y speaking */
  VC.stopSteps();
  const pausedStatus = VC.stepStatus();
  eq('pause: keeps the current position', [pausedStatus.active, pausedStatus.index, pausedStatus.total], [true, 1, 3]);
  const saidAtPause = said.length;
  await sleep(300);
  eq('pause: auto-advance cancelled (no Z)', [said.length, said.some(u => u.text.indexOf('Z финал') >= 0)], [saidAtPause, false]);
  said.length = 0;
  VC.stepResume();
  await sleep(120);
  ok('resume: re-speaks the CURRENT step (Y), not step 1', said.some(u => u.text.indexOf('Y середина') >= 0) && !said.some(u => u.text.indexOf('X старт') >= 0));
  VC.resetSteps();
  eq('reset: player cleared', VC.stepStatus(), { active: false, index: -1, total: 0, finished: false });

  /* ---------- 9. manual mode (auto:false) steps by button only ---------- */
  said.length = 0;
  VC.speakSteps('Первый | Второй', { auto: false });
  await sleep(150);
  eq('manual: only step 1 spoken', said.map(u => u.text), ['Первый']);
  VC.stepNext();
  await sleep(150);
  eq('manual: Далее → step 2', said[said.length - 1].text, 'Второй');
  ok('manual: finished after the last step', VC.stepStatus().finished === true);
  VC.resetSteps();

  /* ---------- 8. watchdog: stuck utterance must not block the queue ---------- */
  VC.configure({ watchdogMs: 120 });
  said.length = 0;
  VC.speak('STUCK', { priority: 'nav' });
  VC.speak('После зависшей', { priority: 'info' });
  await sleep(500);
  ok('watchdog: queued phrase still spoken after a stuck utterance',
    said.some(u => u.text === 'После зависшей'));

  /* ---------- 9. stopAll ---------- */
  said.length = 0;
  VC.configure({ watchdogMs: 3000 });
  VC.speak('Первая', { priority: 'info' });
  VC.speak('Вторая', { priority: 'info' });
  VC.stopAll();
  await sleep(200);
  eq('stopAll: pending drained', VC._pending(), 0);
  ok('stopAll: only the in-flight utterance got out', said.length <= 1);

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})();
