/* c175 unit test — sticky workout headers (portal + trainer) and the narrow
   trainer rest banner (portal parity). Static checks + inline JS syntax. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'client.html'), 'utf8');
const trainer = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }
function count(s, needle) { return s.split(needle).length - 1; }

/* ---------- 1. client portal — sticky workout header ---------- */
ok('portal: dock wrapper present', html.indexOf('<div id="client-head-dock">') >= 0 && html.indexOf('</div><!-- /client-head-dock (c175) -->') >= 0);
ok('portal: dock wraps the hero card (client-card inside)', (() => {
  const a = html.indexOf('<div id="client-head-dock">');
  const b = html.indexOf('<div id="client-card"');
  const c = html.indexOf('/client-head-dock (c175)');
  return a >= 0 && b > a && c > b;
})());
ok('portal: sticky CSS (top from --dk-hdrH, frosted stuck state)', html.indexOf('#client-head-dock { position: sticky; top: var(--dk-hdrH, 60px); z-index: 30;') >= 0 && html.indexOf('#client-head-dock.dk-stuck { background: rgb(var(--c-surface) / 0.90);') >= 0);
ok('portal: header height measured into --dk-hdrH', html.indexOf("document.documentElement.style.setProperty('--dk-hdrH', hdr.offsetHeight + 'px')") >= 0);
ok('portal: stuck state synced on scroll (rAF-throttled)', html.indexOf("dock.classList.toggle('dk-stuck', dock.getBoundingClientRect().top <= hdr.offsetHeight + 1)") >= 0 && html.indexOf("window.addEventListener('scroll', sync, { passive: true })") >= 0);
ok('portal: ResizeObserver re-measures the wrapping header', html.indexOf('new ResizeObserver(() => { measure(); sync(); }).observe(hdr)') >= 0);

/* ---------- 2. trainer live workout — sticky head ---------- */
ok('trainer: sticky head block exists', trainer.indexOf('<div id="live-workout-head" class="sticky top-14 z-10 glass"') >= 0);
ok('trainer: head holds back + name + duration + stats + progress', (() => {
  const a = trainer.indexOf('<div id="live-workout-head"');
  const b = trainer.indexOf('<div class="p-4 sm:p-6 lg:p-8 max-w-3xl xl:max-w-5xl mx-auto pt-3">');
  if (a < 0 || b < a) return false;
  const seg = trainer.slice(a, b);
  return ['id="live-workout-back"', 'id="live-workout-name"', 'id="live-workout-duration"', 'id="live-stat-exercises"', 'id="live-stat-sets"', 'id="live-stat-volume"', 'id="workout-progress-bar"', 'id="workout-progress-label"', 'id="workout-progress-pct"'].every(s => seg.indexOf(s) >= 0);
})());
ok('trainer: scroll-margin reads app bar + measured head height', trainer.indexOf('#live-workout-exercises [data-exercise-idx] { scroll-margin-top: calc(var(--dk-appH, 3.5rem) + var(--dk-lw-headH, 7.5rem) + 0.5rem); }') >= 0);
ok('trainer: head + rest banner pin to the measured app bar (--dk-appH)', trainer.indexOf('#live-workout-head { top: var(--dk-appH, 3.5rem); }') >= 0 && trainer.indexOf('#rest-timer { top: var(--dk-appH, 3.5rem); }') >= 0 && trainer.indexOf("document.documentElement.style.setProperty('--dk-appH', _bar175.offsetHeight + 'px')") >= 0);
ok('trainer: head height measured in render() with hidden-screen guard', trainer.indexOf("if (_head175 && _head175.offsetHeight > 0) document.documentElement.style.setProperty('--dk-lw-headH', _head175.offsetHeight + 'px');") >= 0);
ok('trainer: head re-measured on resize', trainer.indexOf("startDurationTimer._r175") >= 0 && trainer.indexOf("'--dk-lw-headH', h.offsetHeight + 'px'") >= 0);
ok('trainer: progress bar now really renders (element + pct)', trainer.indexOf('<div class="prog-bar"><div id="workout-progress-bar" class="prog-bar-fill" style="width:0%"></div></div>') >= 0 && trainer.indexOf("if (pctEl) pctEl.textContent = pct + '%'; /* c175: portal-hero parity */") >= 0);

/* ---------- 3. trainer rest banner — the portal's narrow design ---------- */
ok('rest banner: fixed narrow strip (portal parity)', trainer.indexOf('<div id="rest-timer" class="hidden fixed top-14 inset-x-0 z-40 glass px-4 py-2"') >= 0);
ok('rest banner: icon + padded 01:30 + thin progress', trainer.indexOf('rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 grid place-items-center shrink-0 pulse-ring') >= 0 && trainer.indexOf('class="prog-bar mt-1"><div id="rest-timer-progress" class="prog-bar-fill"') >= 0 && trainer.indexOf('font-mono font-extrabold text-lg text-cyan-300 leading-none') >= 0);
ok('rest banner: −15 / +30 / ✕ chips', ['id="btn-timer-minus15"', 'id="rest-timer-add30"', 'id="rest-timer-skip"'].every(s => trainer.indexOf(s) >= 0));
ok('restTimer: minus15 exported + wired', trainer.indexOf('return { start, stop, skip, add30, minus15 };') >= 0 && trainer.indexOf("if (restMinus15) restMinus15.addEventListener('click', () => restTimer.minus15());") >= 0);
ok('restTimer: minus15 trims remaining only (portal semantics)', trainer.indexOf('function minus15() {\n      _remaining = Math.max(0, _remaining - 15);\n      updateDisplay();\n    }') >= 0);
ok('restTimer: display padded like the portal (01:30)', trainer.indexOf("display.textContent = String(Math.floor(r / 60)).padStart(2, '0') + ':' + String(r % 60).padStart(2, '0');") >= 0);
ok('trainer: prog-bar / pulse-ring CSS exists (portal parity)', trainer.indexOf('.prog-bar { height: 6px; border-radius: 999px;') >= 0 && trainer.indexOf('@keyframes dk-pulse-ring') >= 0);
ok('trainer: old tall gradient banner is gone', trainer.indexOf('bg-gradient-to-r from-primary to-accent text-white px-4 py-3') < 0);

/* ---------- 4. i18n ---------- */
['ru', 'en', 'he'].forEach(function (lng) {
  const j = JSON.parse(fs.readFileSync(path.join(root, 'src', 'i18n', lng + '.json'), 'utf8'));
  ok('trainer i18n ' + lng + ': restMinus15 next to add30s', !!(j.workouts && typeof j.workouts.restMinus15 === 'string' && j.workouts.add30s));
});

/* ---------- 5. versions ---------- */
ok('sw cache bumped to v203', sw.indexOf("const CACHE_NAME = 'dk-gym-v203'; // c176") >= 0 && sw.indexOf('// v203: c176') >= 0);
ok('trainer build c176 (meta + footer + RUNNING)', trainer.indexOf('content="c176"') >= 0 && trainer.indexOf('· c176</p>') >= 0 && /var RUNNING = 176;/.test(trainer));
ok('body grows with content (sticky breakout fix, both portals)', /html \{ height: 100%; \}/.test(html) && /body \{ min-height: 100%; overscroll-behavior-y: none; \}/.test(html) && /html \{ height: 100%; \}/.test(trainer) && /body \{ min-height: 100%; overscroll-behavior-y: none; \}/.test(trainer));

/* ---------- 6. inline JS syntax of the touched script blocks ---------- */
function scriptBlocks(src) {
  const out = [];
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(src)) !== null) out.push(m[1]);
  return out;
}
[['portal', html, ['client-head-dock', "--dk-hdrH"]], ['trainer', trainer, ['btn-timer-minus15', '--dk-appH']]].forEach(([name, src, markers]) => {
  const blocks = scriptBlocks(src).filter(b => markers.some(mk => b.indexOf(mk) >= 0));
  ok(name + ': touched script blocks found (' + blocks.length + ')', blocks.length >= 1);
  blocks.forEach((b, i) => {
    let bad = null;
    try { new vm.Script(b); } catch (e) { bad = e.message; }
    ok(name + ': inline block #' + i + ' compiles' + (bad ? ' — ' + bad : ''), !bad);
  });
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
