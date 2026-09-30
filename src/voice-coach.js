/* ============================================================================
   c135 — VOICE COACH (shared TTS coordinator for the trainee portal)
   ----------------------------------------------------------------------------
   Mechanics ONLY — no DOM, no wording. The app composes phrases through its
   own i18n layer and calls speak()/speakSteps(); this module owns the speech
   engine quirks so every screen behaves the same way:
     • queue with priorities — 'nav'/'alert' interrupt, 'info'/'step' queue;
     • rapid-repeat dedupe (toasts cannot stutter) — only for 'info'+;
     • long text chunking (≤180 chars, sentence-aware) because mobile engines
       drop long utterances;
     • a WATCHDOG per utterance — iOS sometimes never fires onend after the
       screen locks or a call arrives; without it the queue died silently;
     • step-by-step technique playback (split on « | », the existing format):
       next/prev/repeat/stop driven by the app's buttons, stepLabel composed
       by the app (localized «Шаг 2 из 5»), onStep/onDone callbacks for
       haptics and UI;
     • voice discovery per language (ru-RU/en-US/he-IL), local voices first,
       automatic graceful no-voice return (the app shows an honest warning);
     • works offline — device voices only, zero assets, zero network.
   API: window.dkVoiceCoach (same load pattern as the shared engines).
   ============================================================================ */
(function () {
  'use strict';

  var VERSION = 'c145';
  var MAX_CHUNK = 180;
  var QUEUE_CAP = 8;
  var DEDUP_MS = 2000;
  var P = { nav: 0, alert: 0, info: 1, step: 2 };

  var cfg = { lang: 'ru-RU', rate: 1, voiceName: '', watchdogMs: 15000, strictVoice: false, onMissingVoice: null };
  var queue = [];
  var current = null;
  var lastText = '', lastAt = 0;
  var seq = 0;
  var stepState = null;

  function win() {
    if (typeof window !== 'undefined') return window;
    if (typeof globalThis !== 'undefined') return globalThis;
    return null;
  }
  function synth() {
    var w = win();
    return (w && w.speechSynthesis) ? w.speechSynthesis : null;
  }
  function UtterCls() {
    var w = win();
    return (w && w.SpeechSynthesisUtterance) ? w.SpeechSynthesisUtterance : null;
  }
  function isSupported() { return !!(synth() && UtterCls()); }
  function clampRate(r) { r = Number(r); if (!isFinite(r)) r = 1; return Math.max(0.5, Math.min(1.6, r)); }

  var LANG_TAGS = { ru: 'ru-RU', en: 'en-US', he: 'he-IL' };
  function langTag(code) { return LANG_TAGS[String(code || '').toLowerCase()] || 'en-US'; }

  /* emoji / decorative symbols must never reach the TTS engine */
  function cleanForSpeech(text) {
    var t = String(text == null ? '' : text);
    try {
      t = t.replace(/[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{25A0}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu, ' ');
    } catch (e) {
      t = t.replace(/[^\x00-\x7F\u0400-\u04FF\u0590-\u05FF\u00A0-\u024F]/g, ' ');
    }
    return t.replace(/\s+/g, ' ').trim();
  }

  /* sentence-aware chunking — long utterances die on mobile engines */
  function splitSentences(t) {
    var out = [], cur = '';
    for (var i = 0; i < t.length; i++) {
      var ch = t[i];
      cur += ch;
      if ((ch === '.' || ch === '!' || ch === '?' || ch === '…' || ch === ';' || ch === ':') && t[i + 1] === ' ') {
        out.push(cur); cur = '';
      }
    }
    if (cur.trim()) out.push(cur);
    return out;
  }
  function chunkText(text, max) {
    max = max || MAX_CHUNK;
    var t = String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
    if (!t) return [];
    if (t.length <= max) return [t];
    var out = [], cur = '';
    var sentences = splitSentences(t);
    sentences.forEach(function (s) {
      if (cur && (cur + ' ' + s).length > max) { out.push(cur); cur = ''; }
      if (s.length <= max) { cur = cur ? cur + ' ' + s : s; return; }
      /* single sentence longer than max → split at spaces */
      var words = s.split(' ');
      words.forEach(function (w) {
        if (cur && (cur + ' ' + w).length > max) { out.push(cur); cur = ''; }
        cur = cur ? cur + ' ' + w : w;
      });
    });
    if (cur) out.push(cur);
    return out;
  }

  function mapVoice(v) { return { name: v.name, lang: v.lang, local: !!v.localService, def: !!v.default }; }
  function allVoices() {
    var s = synth();
    if (!s || !s.getVoices) return [];
    try { return s.getVoices() || []; } catch (e) { return []; }
  }
  function listVoices(langPrefix) {
    var pre = String(langPrefix || '').toLowerCase();
    var all = allVoices();
    if (!pre) return all.map(mapVoice);
    return all.filter(function (v) { return String(v.lang || '').toLowerCase().indexOf(pre) === 0; }).map(mapVoice);
  }
  function pickVoice(langName, voiceName) {
    var all = allVoices();
    if (!all.length) return null;
    if (voiceName) {
      var exact = null;
      all.forEach(function (v) { if (v.name === voiceName) exact = v; });
      if (exact) return exact;
    }
    var pre = String(langName || '').toLowerCase().slice(0, 2);
    var match = all.filter(function (v) { return String(v.lang || '').toLowerCase().indexOf(pre) === 0; });
    if (!match.length) return null;
    var local = null;
    match.forEach(function (v) { if (!local && v.localService) local = v; });
    return local || match[0];
  }
  function hasVoiceFor(langName) { return !!pickVoice(langName, ''); }
  /* c145: the app can demand a REAL voice for the language. Without one the
     utterance must NOT be spoken at all — an English engine reading Hebrew
     produces gibberish («странные звуки»); instead the app is notified ONCE
     per attempt so it can show install instructions. */
  function missingVoice(langTag) {
    if (!cfg.strictVoice) return false;
    if (hasVoiceFor(langTag)) return false;
    if (typeof cfg.onMissingVoice === 'function') {
      try { cfg.onMissingVoice(String(langTag || cfg.lang)); } catch (e) {}
    }
    return true;
  }

  function buildUtterance(text, opts) {
    var U = UtterCls();
    if (!U) return null;
    var u = new U(text);
    u.lang = (opts && opts.lang) || cfg.lang;
    try { u.rate = clampRate((opts && opts.rate != null) ? opts.rate : cfg.rate); } catch (e) {}
    var v = pickVoice(u.lang, (opts && opts.voiceName != null) ? opts.voiceName : cfg.voiceName);
    if (v) { try { u.voice = v; } catch (e) {} }
    return u;
  }

  function finishCurrent() {
    var task = current;
    current = null;
    if (task && task.opts && task.opts.onend) { try { task.opts.onend(); } catch (e) {} }
    nextFromQueue();
  }
  function nextFromQueue() {
    if (current) return true;
    while (queue.length) {
      var t = queue.shift();
      return speakTextNow(t);
    }
    return false;
  }
  function speakTextNow(task) {
    var s = synth();
    if (!s) { current = null; return false; }
    current = task;
    var chunks = chunkText(task.text);
    if (!chunks.length) { finishCurrent(); return false; }
    if (task.opts && task.opts.onstart) { try { task.opts.onstart(); } catch (e) {} }
    var i = 0;
    var sayNext = function () {
      if (current !== task) return;
      if (i >= chunks.length) { finishCurrent(); return; }
      var u = buildUtterance(chunks[i], task.opts);
      if (!u) { finishCurrent(); return; }
      var advanced = false;
      var advance = function () {
        if (advanced || current !== task) return;
        advanced = true;
        clearTimeout(task._watch);
        i++;
        setTimeout(sayNext, 60);
      };
      u.onend = function () {
        if (task.opts && task.opts.onchunk) { try { task.opts.onchunk(i, chunks.length); } catch (e) {} }
        advance();
      };
      u.onerror = function () { advance(); };
      /* watchdog: iOS may never fire onend (lock screen / calls) */
      task._watch = setTimeout(function () {
        try { s.cancel(); } catch (e) {}
        advance();
      }, cfg.watchdogMs);
      try { if (s.paused && s.resume) s.resume(); } catch (e) {}
      try { s.speak(u); } catch (e) { advance(); }
    };
    sayNext();
    return true;
  }
  function cancelCurrent() {
    var task = current;
    current = null;
    if (task) {
      clearTimeout(task._watch);
      if (task.opts && task.opts.onend) { try { task.opts.onend(); } catch (e) {} }
    }
    try { var s = synth(); if (s) s.cancel(); } catch (e) {}
  }

  function speak(text, opts) {
    if (!isSupported()) return false;
    opts = opts || {};
    var clean = cleanForSpeech(text);
    if (!clean) return false;
    if (missingVoice(opts.lang || cfg.lang)) return false;
    var prio = (P[opts.priority] != null) ? P[opts.priority] : P.info;
    var now = Date.now();
    /* dedupe exists ONLY for queued informational toasts (they may repeat);
       explicit user navigation ('nav') and technique steps must NEVER be
       swallowed — pressing «Повторить» must always re-speak the step */
    if (prio === P.info && clean === lastText && (now - lastAt) < DEDUP_MS) return false;
    lastText = clean; lastAt = now;
    var task = { text: clean, opts: opts, priority: prio, id: ++seq };
    if (prio === 0) {
      cancelCurrent();
      queue.length = 0;
      return speakTextNow(task);
    }
    if (current || queue.length) {
      if (queue.length >= QUEUE_CAP) queue.shift();
      queue.push(task);
      return true;
    }
    return speakTextNow(task);
  }

  function stopAll() {
    queue.length = 0;
    cancelCurrent();
    resetSteps();
  }

  var STEP_GAP_MS = 800;
  /* Steps AUTO-CONTINUE by default (c137: on a real device the first version
     read step 1 and went silent — the technique must play through). Every
     step speaks as its own utterance; after it ends a gapMs pause lets the
     trainee breathe, then the next one starts. «Стоп» PAUSES (keeps the
     position), «▶» resumes from it, tapping a step jumps (stepGoto), and a
     finished run restarts from step 1 on the next play. */
  function sayStep(interrupt) {
    if (!stepState) return null;
    var st = stepState;
    clearTimeout(st._timer);
    var total = st.steps.length;
    var i = st.idx;
    var label = (st.opts && typeof st.opts.stepLabel === 'function') ? st.opts.stepLabel(i, total) : '';
    var text = (label ? label + ' ' : '') + st.steps[i];
    st.finished = false;
    st._paused = false;
    if (st.opts && st.opts.onStep) { try { st.opts.onStep(i, total); } catch (e) {} }
    speak(text, {
      priority: interrupt ? 'nav' : 'step',
      lang: st.opts && st.opts.lang, rate: st.opts && st.opts.rate, voiceName: st.opts && st.opts.voiceName,
      onend: function () {
        if (stepState !== st || st._paused) return;
        if (i >= total - 1) {
          st.finished = true;
          if (st.opts && st.opts.onDone) { try { st.opts.onDone(); } catch (e) {} }
          return;
        }
        if (st.opts && st.opts.auto === false) return;
        st._timer = setTimeout(function () {
          if (stepState === st && st.idx === i && !st._paused && !st.finished) { st.idx = i + 1; sayStep(false); }
        }, (st.opts && st.opts.gapMs != null) ? st.opts.gapMs : STEP_GAP_MS);
      }
    });
    return stepStatus();
  }
  function speakSteps(text, opts) {
    if (!isSupported()) return null;
    opts = opts || {};
    if (missingVoice(opts.lang || cfg.lang)) return null; /* c145: never garble */
    var raw = String(text == null ? '' : text);
    var parts = raw.indexOf(' | ') !== -1 ? raw.split(' | ') : raw.split('|');
    var steps = parts.map(function (s) { return String(s || '').trim(); }).filter(Boolean);
    if (!steps.length) return null;
    if (stepState) clearTimeout(stepState._timer);
    var start = parseInt(opts.startIndex, 10);
    if (!isFinite(start) || start < 0) start = 0;
    if (start > steps.length - 1) start = steps.length - 1;
    stepState = { steps: steps, idx: start, opts: opts, finished: false, _paused: false };
    return sayStep(false);
  }
  function stepNext() {
    if (!stepState) return stepStatus();
    clearTimeout(stepState._timer);
    if (stepState.idx < stepState.steps.length - 1) stepState.idx++;
    return sayStep(true);
  }
  function stepPrev() {
    if (!stepState) return stepStatus();
    clearTimeout(stepState._timer);
    if (stepState.idx > 0) stepState.idx--;
    return sayStep(true);
  }
  function stepRepeat() { if (!stepState) return stepStatus(); return sayStep(true); }
  function stepGoto(i) {
    if (!stepState) return stepStatus();
    i = parseInt(i, 10);
    if (!isFinite(i) || i < 0 || i > stepState.steps.length - 1) return stepStatus();
    clearTimeout(stepState._timer);
    stepState.idx = i;
    stepState.finished = false;
    return sayStep(true);
  }
  /* resume from the paused position (no-op when finished) */
  function stepResume() { if (!stepState || stepState.finished) return stepStatus(); return sayStep(false); }
  /* PAUSE: keep the selection + position (c137 — «Стоп» used to wipe it) */
  function stopSteps() {
    if (stepState) { stepState._paused = true; clearTimeout(stepState._timer); }
    cancelCurrent();
    return stepStatus();
  }
  function resetSteps() {
    if (stepState) { stepState._paused = true; clearTimeout(stepState._timer); }
    stepState = null;
    cancelCurrent();
    return stepStatus();
  }
  function stepStatus() {
    return stepState
      ? { active: true, index: stepState.idx, total: stepState.steps.length, finished: !!stepState.finished }
      : { active: false, index: -1, total: 0, finished: false };
  }

  function configure(o) {
    o = o || {};
    if (o.lang) cfg.lang = String(o.lang);
    if (o.rate != null) cfg.rate = clampRate(o.rate);
    if (o.voiceName != null) cfg.voiceName = String(o.voiceName);
    if (o.watchdogMs != null) cfg.watchdogMs = Math.max(100, Number(o.watchdogMs) || 15000);
    if (o.strictVoice != null) cfg.strictVoice = !!o.strictVoice;
    if (o.onMissingVoice !== undefined) cfg.onMissingVoice = (typeof o.onMissingVoice === 'function') ? o.onMissingVoice : null;
    return { lang: cfg.lang, rate: cfg.rate, voiceName: cfg.voiceName, strictVoice: cfg.strictVoice };
  }

  var api = {
    version: VERSION,
    isSupported: isSupported,
    configure: configure,
    getConfig: function () { return { lang: cfg.lang, rate: cfg.rate, voiceName: cfg.voiceName }; },
    speak: speak,
    stopAll: stopAll,
    speakSteps: speakSteps,
    stepNext: stepNext,
    stepPrev: stepPrev,
    stepRepeat: stepRepeat,
    stepGoto: stepGoto,
    stepResume: stepResume,
    stopSteps: stopSteps,
    resetSteps: resetSteps,
    stepStatus: stepStatus,
    listVoices: listVoices,
    hasVoiceFor: hasVoiceFor,
    langTag: langTag,
    chunkText: chunkText,
    cleanForSpeech: cleanForSpeech,
    _pending: function () { return queue.length + (current ? 1 : 0); }
  };
  if (typeof window !== 'undefined') window.dkVoiceCoach = api;
  else if (typeof globalThis !== 'undefined') globalThis.dkVoiceCoach = api;
})();
