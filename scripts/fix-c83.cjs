#!/usr/bin/env node
/* ============================================================================
 * fix-c83.cjs — header «dumbbell» button: one-tap return to the live workout
 *
 * User request (RU): «в шапке программы, там, где язык системы меняем, слева
 * от этой кнопки нужно добавить кнопку „гантелька" с картинкой гантели. Эта
 * кнопка будет возвращать к тренировке, если я вышел в настройки, либо в
 * аналитику, либо в другое место погулять. В любой момент я через эту кнопку
 * мог бы вернуться к тренировке и даже к тому упражнению, где я сейчас
 * нахожусь... И даже если я в самой программе листаю, но тренируюсь в
 * середине, чтобы эта же гантелька меня даже изнутри live-режима
 * перенаправляла к рабочему месту».
 *
 * Implementation:
 *  1. Header: #dk-dumbbell-btn (lucide dumbbell SVG) as the FIRST control of
 *     the ms-auto group — left of the language selector (mirrored in RTL).
 *     Always visible; hidden on the lock screen via body.auth-locked CSS.
 *     Green pulse dot (#dk-dumbbell-dot) marks a running live session.
 *  2. Behavior: live session active → screens.liveWorkout.returnToPosition()
 *     (open live-workout + smooth-scroll to the exercise the user is actually
 *     working on + short flash ring); no session → open Workouts screen.
 *  3. Working-position tracking: one delegated listener on the static
 *     #live-workout-exercises container records the last exercise whose SET
 *     the user touched (input/change only — viewing/scrolling never moves the
 *     position). Resolution priority: last touched set of THIS session
 *     (guarded by started_at so a finished/restored session can't reuse a
 *     stale index) → first exercise with unfinished sets → last exercise.
 *  4. router.show() now calls dkDumbbellSync() on every navigation so the
 *     active tint + dot follow the session state; back() with an empty
 *     session (which bypasses router.show) syncs explicitly.
 *  5. i18n: aria.dumbbell added to RU/EN/HE dicts (button keeps a sensible
 *     English default until dicts load — c81 rule keeps defaults on miss).
 *  6. Versions: meta dk-build c82→c83, RUNNING 82→83, login footer c82→c83,
 *     sw dk-gym-v109→v110 (+history line).
 * ==========================================================================*/
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FILE = path.join(ROOT, 'fitness-crm.html');
const SW = path.join(ROOT, 'sw.js');
let html = fs.readFileSync(FILE, 'utf8');
let sw = fs.readFileSync(SW, 'utf8');
const fails = [];
let patched = 0;

function repOnce(name, anchor, replacement) {
  const idx = html.indexOf(anchor);
  if (idx === -1) { fails.push(`[${name}] anchor NOT FOUND`); return; }
  if (html.indexOf(anchor, idx + 1) !== -1) { fails.push(`[${name}] anchor NOT UNIQUE`); return; }
  html = html.slice(0, idx) + replacement + html.slice(idx + anchor.length);
  patched++;
  console.log(`OK  ${name}`);
}

function repOnceSw(name, anchor, replacement) {
  const idx = sw.indexOf(anchor);
  if (idx === -1) { fails.push(`[${name}] anchor NOT FOUND (sw)`); return; }
  if (sw.indexOf(anchor, idx + 1) !== -1) { fails.push(`[${name}] anchor NOT UNIQUE (sw)`); return; }
  sw = sw.slice(0, idx) + replacement + sw.slice(idx + anchor.length);
  patched++;
  console.log(`OK  ${name} (sw.js)`);
}

function repOnceJson(name, file, anchor, replacement) {
  let s;
  try { s = fs.readFileSync(file, 'utf8'); } catch (e) { fails.push(`[${name}] READ FAIL ${e.message}`); return; }
  const idx = s.indexOf(anchor);
  if (idx === -1) { fails.push(`[${name}] anchor NOT FOUND (${path.basename(file)})`); return; }
  if (s.indexOf(anchor, idx + 1) !== -1) { fails.push(`[${name}] anchor NOT UNIQUE (${path.basename(file)})`); return; }
  fs.writeFileSync(file, s.slice(0, idx) + replacement + s.slice(idx + anchor.length));
  patched++;
  console.log(`OK  ${name} (${path.basename(file)})`);
}

/* ============================================================
 * 1) CSS — button, active tint, pulse dot, lock-screen hide,
 *    flash ring on the exercise the dumbbell lands on
 * ============================================================ */
repOnce(
  'dumbbell CSS block',
  `.atlas-restore-all:hover { filter: brightness(1.12); }
</style>`,
  `.atlas-restore-all:hover { filter: brightness(1.12); }
/* ===== c83: header dumbbell — one-tap return to the live workout ===== */
#dk-dumbbell-btn {
  position: relative; width: 2.25rem; height: 2.25rem; flex: none;
  display: grid; place-items: center;
  border-radius: .5rem;
  background: rgb(var(--c-surface-2));
  border: 1px solid rgb(var(--c-border));
  color: rgb(var(--c-text));
  cursor: pointer;
  transition: background .15s ease, border-color .15s ease, color .15s ease;
}
#dk-dumbbell-btn:hover { background: rgb(var(--c-border) / .4); }
#dk-dumbbell-btn.dk-dumbbell-active {
  background: rgb(var(--c-primary) / .18);
  color: rgb(var(--c-primary-2));
  border-color: rgb(var(--c-primary) / .5);
}
#dk-dumbbell-dot {
  position: absolute; inset-inline-end: 5px; top: 5px;
  width: 8px; height: 8px; border-radius: 9999px;
  background: #22c55e; box-shadow: 0 0 0 2px rgb(var(--c-surface));
  animation: dk-dot-pulse 1.6s ease infinite;
}
@keyframes dk-dot-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
body.auth-locked #dk-dumbbell-btn { display: none; }
#live-workout-exercises [data-exercise-idx] { scroll-margin-top: 4.25rem; }
.dk-pos-flash { animation: dk-pos-flash-kf 2.4s ease; }
@keyframes dk-pos-flash-kf {
  0%, 55% { box-shadow: 0 0 0 3px rgb(var(--c-primary) / .55); }
  100% { box-shadow: 0 0 0 0 rgb(var(--c-primary) / 0); }
}
</style>`
);

/* ============================================================
 * 2) Header markup — dumbbell as the first control of the
 *    ms-auto group (left of the language selector; RTL mirrors)
 * ============================================================ */
repOnce(
  'header dumbbell button',
  `        <div class="ms-auto flex items-center gap-1.5">
          <!-- Language selector — populated by i18n engine in Step 3 -->`,
  `        <div class="ms-auto flex items-center gap-1.5">
          <!-- c83: dumbbell — one-tap return to the live workout at your current exercise -->
          <button id="dk-dumbbell-btn" class="shrink-0" aria-label="Back to workout" title="Back to workout" data-i18n-attr="aria-label:aria.dumbbell,title:aria.dumbbell">
            <svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.4 14.4 9.6 9.6"/><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/><path d="m21.5 21.5-1.4-1.4"/><path d="M3.9 3.9 2.5 2.5"/><path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"/></svg>
            <span id="dk-dumbbell-dot" class="hidden" aria-hidden="true"></span>
          </button>
          <!-- Language selector — populated by i18n engine in Step 3 -->`
);

/* ============================================================
 * 3) Dumbbell module — defined before the router so router.show
 *    can call dkDumbbellSync() on every navigation
 * ============================================================ */
repOnce(
  'dumbbell module (sync + go + wire)',
  `  const router = (function () {`,
  `  /* =====================================================================
     c83 — HEADER DUMBBELL: one-tap return to the live workout.
     The button sits in the sticky header (left of the language selector),
     so it is reachable from ANY screen (settings, analytics, atlas...) and
     even while scrolling deep inside the live workout itself.
       • live session active → screens.liveWorkout.returnToPosition():
         opens live-workout and scrolls to the exercise the user is actually
         working on (flash highlight marks it);
       • no live session → opens the Workouts screen (where sessions start).
     A green pulse dot + primary tint mark a running session; the button
     hides on the lock screen (body.auth-locked CSS rule).
     ===================================================================== */
  function dkDumbbellActive() {
    try {
      return !!(typeof screens !== 'undefined' && screens.liveWorkout && screens.liveWorkout._workout);
    } catch (_e) { return false; }
  }
  function dkDumbbellSync() {
    var btn = document.getElementById('dk-dumbbell-btn');
    if (!btn) return;
    var active = dkDumbbellActive();
    btn.classList.toggle('dk-dumbbell-active', active);
    var dot = document.getElementById('dk-dumbbell-dot');
    if (dot) dot.classList.toggle('hidden', !active);
  }
  function dkDumbbellGo() {
    if (dkDumbbellActive() && screens.liveWorkout.returnToPosition) {
      try { screens.liveWorkout.returnToPosition(); return; } catch (e) { console.warn('[dumbbell] returnToPosition failed', e); }
    }
    router.show('workouts');
  }
  (function dkDumbbellWire() {
    var b = document.getElementById('dk-dumbbell-btn');
    if (!b || b.dataset.dkWired) return;
    b.dataset.dkWired = '1';
    b.addEventListener('click', dkDumbbellGo);
  })();

  const router = (function () {`
);

/* ============================================================
 * 4) router.show — sync the dumbbell state on EVERY navigation
 *    (covers session start/finish/cancel which all route)
 * ============================================================ */
repOnce(
  'router.show sync hook',
  `      try { refreshCurrent(); } catch (e) { console.warn('[router] refreshCurrent failed', e); }`,
  `      try { if (typeof dkDumbbellSync === 'function') dkDumbbellSync(); } catch (_e) {}
      try { refreshCurrent(); } catch (e) { console.warn('[router] refreshCurrent failed', e); }`
);

/* ============================================================
 * 5) liveWorkout — position-tracking state vars
 * ============================================================ */
repOnce(
  'liveWorkout position vars',
  `    let _exMapSize = -1;     // track cache size to invalidate Map`,
  `    let _exMapSize = -1;     // track cache size to invalidate Map
    let _lastPosIdx = -1;    // c83: last exercise whose SET the user touched (dumbbell target)
    let _lastPosStamp = null; // c83: started_at of that session — stale after finish/restore`
);

/* ============================================================
 * 6) back() with an empty session bypasses router.show —
 *    sync the dumbbell dot there too
 * ============================================================ */
repOnce(
  'back() empty-session sync',
  `        // Force-show the workouts screen
        document.querySelectorAll('[data-screen]').forEach(el => {
          el.classList.toggle('hidden', el.getAttribute('data-screen') !== 'workouts');
        });
        return;`,
  `        // Force-show the workouts screen
        document.querySelectorAll('[data-screen]').forEach(el => {
          el.classList.toggle('hidden', el.getAttribute('data-screen') !== 'workouts');
        });
        try { if (typeof dkDumbbellSync === 'function') dkDumbbellSync(); } catch (_e) {}
        return;`
);

/* ============================================================
 * 7) liveWorkout — delegation + resolver + returnToPosition +
 *    export. Clicks (view/remove) never move the working
 *    position; only real set interactions (input/change) do.
 * ============================================================ */
repOnce(
  'liveWorkout returnToPosition + export',
  `    return { start, startFromTemplate, startFromProgram, openPicker, finish, cancel, back, saveAsTemplate, applyTemplateToClient, checkDraft, render, get _workout() { return _workout; } };`,
  `    /* c83: header dumbbell support — track WHERE the user is actually working.
       One delegated listener on the static exercises container records the
       exercise block of the last touched set control (weight/reps/rpe/done/
       rest — 'input' and 'change'). Clicks (view/remove buttons) and plain
       scrolling deliberately do NOT move the working position. */
    (function () {
      const c = document.getElementById('live-workout-exercises');
      if (!c || c.dataset.dkPosWired) return;
      c.dataset.dkPosWired = '1';
      const mark = (ev) => {
        const block = ev.target && ev.target.closest ? ev.target.closest('[data-exercise-idx]') : null;
        if (!block || !_workout) return;
        const i = parseInt(block.getAttribute('data-exercise-idx'), 10);
        if (!isNaN(i)) { _lastPosIdx = i; _lastPosStamp = _workout.started_at; }
      };
      c.addEventListener('input', mark);
      c.addEventListener('change', mark);
    })();

    /** c83: resolve the exercise the dumbbell should land on.
     *  Priority: last set touched in THIS session (started_at-guarded so a
     *  finished/restored session can't reuse a stale index) → first exercise
     *  with unfinished sets → last exercise (everything done) → none. */
    function _resolvePosIdx() {
      if (!_workout || !_workout.exercises || !_workout.exercises.length) return -1;
      if (_lastPosIdx >= 0 && _lastPosIdx < _workout.exercises.length && _lastPosStamp === _workout.started_at) return _lastPosIdx;
      for (let i = 0; i < _workout.exercises.length; i++) {
        const sets = _workout.exercises[i].sets || [];
        if (sets.some(s => !s.done)) return i;
      }
      return _workout.exercises.length - 1;
    }

    /** c83: dumbbell — (re)open the live workout and scroll to the exercise
     *  the user is working on. Returns false when no session is running. */
    function returnToPosition() {
      if (!_workout) return false;
      render();
      router.show('live-workout');
      const idx = _resolvePosIdx();
      const target = idx >= 0 ? document.querySelector('#live-workout-exercises [data-exercise-idx="' + idx + '"]') : null;
      requestAnimationFrame(() => {
        if (target) {
          try { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
          catch (_) { try { target.scrollIntoView(); } catch (_e) {} }
          target.classList.add('dk-pos-flash');
          setTimeout(() => target.classList.remove('dk-pos-flash'), 2400);
        } else {
          const main = document.getElementById('main');
          if (main) main.scrollTop = 0;
          window.scrollTo(0, 0);
        }
      });
      return true;
    }

    return { start, startFromTemplate, startFromProgram, openPicker, finish, cancel, back, saveAsTemplate, applyTemplateToClient, checkDraft, render, returnToPosition, get _workout() { return _workout; } };`
);

/* ============================================================
 * 8) Version bumps
 * ============================================================ */
repOnce(
  'meta c83',
  `<meta name="dk-build" content="c82" />`,
  `<meta name="dk-build" content="c83" />`
);

repOnce(
  'login footer c83',
  `· IndexedDB · 3 languages · c82</p>`,
  `· IndexedDB · 3 languages · c83</p>`
);

repOnce(
  'RUNNING = 83',
  `var RUNNING = 82; /* numeric part of dk-build c82 */`,
  `var RUNNING = 83; /* numeric part of dk-build c83 */`
);

/* ============================================================
 * 9) sw.js — version bump + history
 * ============================================================ */
repOnceSw(
  'sw cache v110 + history',
  `// v109: c82 — mobile Exercise DB browse repaired: revealed body map = own full-width wrapped row (tree+cards no longer pushed off-screen, no stretch-to-list-height), .exb-map-open CSS fallback for :has-less WebViews, 3D widget/SVG capped to column width, Report button label follows language
const CACHE_NAME = 'dk-gym-v109';`,
  `// v109: c82 — mobile Exercise DB browse repaired: revealed body map = own full-width wrapped row (tree+cards no longer pushed off-screen, no stretch-to-list-height), .exb-map-open CSS fallback for :has-less WebViews, 3D widget/SVG capped to column width, Report button label follows language
// v110: c83 — header dumbbell button (left of the language selector): one-tap return to the live workout at the exercise the user is actually working on (last set touched → first unfinished → last), from any screen and from inside the live scroll itself; green pulse dot marks a running session
const CACHE_NAME = 'dk-gym-v110';`
);

/* ============================================================
 * 10) i18n — aria.dumbbell in all three dictionaries
 * ============================================================ */
repOnceJson(
  'i18n en aria.dumbbell',
  path.join(ROOT, 'src/i18n/en.json'),
  `    "lock": "Lock",`,
  `    "lock": "Lock",
    "dumbbell": "Back to workout",`
);

repOnceJson(
  'i18n ru aria.dumbbell',
  path.join(ROOT, 'src/i18n/ru.json'),
  `    "lock": "Заблокировать",`,
  `    "lock": "Заблокировать",
    "dumbbell": "Вернуться к тренировке",`
);

repOnceJson(
  'i18n he aria.dumbbell',
  path.join(ROOT, 'src/i18n/he.json'),
  `    "lock": "נעל",`,
  `    "lock": "נעל",
    "dumbbell": "חזרה לאימון",`
);

/* ============================================================
 * Sanity + write
 * ============================================================ */
console.log('--- sanity ---');
function must(cond, msg) {
  if (cond) { console.log('OK  ' + msg); } else { fails.push('SANITY: ' + msg); }
}
must((html.match(/id="dk-dumbbell-btn"/g) || []).length === 1, 'dumbbell button markup once');
must((html.match(/function dkDumbbellSync/g) || []).length === 1, 'dkDumbbellSync defined once');
must((html.match(/dkDumbbellSync\(\);/g) || []).length === 2, 'dkDumbbellSync called from router.show + back()');
must((html.match(/data-i18n-attr="aria-label:aria\.dumbbell,title:aria\.dumbbell"/g) || []).length === 1, 'i18n-attr on button');
must((html.match(/returnToPosition/g) || []).length >= 3, 'returnToPosition def + call + export');
must((html.match(/_lastPosIdx/g) || []).length >= 4, 'position tracking vars used');
must(html.includes('body.auth-locked #dk-dumbbell-btn'), 'lock-screen hide rule');
must(html.includes('.dk-pos-flash { animation: dk-pos-flash-kf 2.4s ease; }'), 'flash ring CSS');
must(html.includes('#live-workout-exercises [data-exercise-idx] { scroll-margin-top: 4.25rem; }'), 'scroll-margin rule');
must(html.includes('content="c83"') && !html.includes('content="c82"'), 'meta = c83 only');
must((html.match(/· c83<\/p>/g) || []).length === 1, 'login footer = c83');
must(html.includes('var RUNNING = 83;'), 'RUNNING = 83');
must(sw.includes("const CACHE_NAME = 'dk-gym-v110';") && !sw.includes("'dk-gym-v109'"), 'sw CACHE_NAME = v110');
try {
  ['en', 'ru', 'he'].forEach(l => {
    const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/i18n/' + l + '.json'), 'utf8'));
    must(!!(d.aria && d.aria.dumbbell), 'i18n ' + l + '.aria.dumbbell = ' + d.aria.dumbbell);
  });
} catch (e) { fails.push('SANITY: i18n json parse fail ' + e.message); }
must(!fails.length, 'no failures');

if (fails.length) {
  console.error('\nFAILED:\n' + fails.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
fs.writeFileSync(FILE, html);
fs.writeFileSync(SW, sw);
console.log(`\nDone. ${patched} patches written.\n`);
