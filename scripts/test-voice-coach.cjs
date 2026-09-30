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
  ok('version c135', VC.version === 'c135');
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

  /* ---------- 7. steps lifecycle ---------- */
  const stepEvents = [];
  said.length = 0;
  const st0 = VC.speakSteps('Займите положение | Опускайте медленно | Вернитесь вверх', {
    stepLabel: (i, t) => 'Шаг ' + (i + 1) + ' из ' + t,
    onStep: (i, t) => stepEvents.push('s' + i + '/' + t),
    onDone: () => stepEvents.push('done')
  });
  eq('steps: initial status', st0, { active: true, index: 0, total: 3 });
  await sleep(150);
  eq('steps: step 1 spoken with label', said[said.length - 1].text, 'Шаг 1 из 3 Займите положение');
  VC.stepNext();
  await sleep(150);
  eq('steps: next → step 2', said[said.length - 1].text, 'Шаг 2 из 3 Опускайте медленно');
  VC.stepRepeat();
  await sleep(150);
  eq('steps: repeat re-speaks step 2 (never deduped)', said[said.length - 1].text, 'Шаг 2 из 3 Опускайте медленно');
  VC.stepPrev();
  await sleep(150);
  eq('steps: prev → step 1', said[said.length - 1].text, 'Шаг 1 из 3 Займите положение');
  VC.stepNext(); VC.stepNext();
  await sleep(200);
  eq('steps: onStep sequence', stepEvents.filter(e => e[0] === 's'), ['s0/3', 's1/3', 's1/3', 's0/3', 's1/3', 's2/3']);
  ok('steps: onDone fired at the end', stepEvents.indexOf('done') >= 0);
  VC.stopSteps();
  eq('steps: stop → inactive', VC.stepStatus(), { active: false, index: -1, total: 0 });
  eq('steps: next after stop is a no-op', VC.stepNext(), { active: false, index: -1, total: 0 });

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
