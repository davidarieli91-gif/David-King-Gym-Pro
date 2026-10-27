/* c178 unit test — the client portal's TOP PANELS = THE TRAINER'S (user:
   «Теперь в портале тренера прям так как надо работают эти панели, но в портале
   подопечного хуже работает… Сделай верхние панели для портала подопечного с
   гантелькой и с таймером, так же, как в портале тренера»).
   (1) THIN APP BAR — controls only in one trainer-style row; the profile
       identity scrolls away in the content. (2) REST BANNER — fixed UNDER the
       bar via measured --dk-appH (trainer #rest-timer parity). (3) The trainer
       portal is untouched. Static checks + inline JS syntax. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'client.html'), 'utf8');
const trainer = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }
function between(src, a, b) { const i = src.indexOf(a), j = src.indexOf(b, i + 1); return (i >= 0 && j > i) ? src.slice(i, j) : ''; }

/* ---------- 1. client: thin app bar = trainer structure ---------- */
const hdr = between(html, '<header class="sticky top-0 z-40 glass-strong', '</header>');
ok('portal: thin sticky app bar kept (z-40 glass-strong)', html.indexOf('<header class="sticky top-0 z-40 glass-strong') >= 0);
ok('portal: bar is ONE trainer-style row (dk-topbar-row + ms-auto controls, px-3)', hdr.indexOf('dk-topbar-row flex items-center gap-2 px-3') >= 0 && hdr.indexOf('ms-auto flex items-center gap-1.5') >= 0);
ok('portal: bar no longer wraps with the old profile row (no flex-wrap/justify-between/py-3)', hdr.indexOf('flex-wrap') < 0 && hdr.indexOf('justify-between') < 0 && hdr.indexOf('py-3') < 0 && hdr.indexOf('px-4') < 0);
ok('portal: bar holds ALL six controls (dumbbell %, lang, A−, A+, theme, settings)', ['id="dk-dumbbell-btn"', 'id="lang-select"', 'id="font-dec-btn"', 'id="font-inc-btn"', 'id="theme-toggle"', 'id="portal-settings-btn"'].every(s => hdr.indexOf(s) >= 0));
ok('portal: dumbbell keeps dot + pct (same pill as the trainer)', hdr.indexOf('id="dk-dumbbell-dot"') >= 0 && hdr.indexOf('id="dk-dumbbell-pct"') >= 0);
ok('portal: lang select = trainer look (appearance-none + custom chevron)', hdr.indexOf('appearance-none') >= 0 && hdr.indexOf('M6 9l6 6 6-6') >= 0);
ok('portal: NO profile identity inside the bar (hdr-name/hdr-goal moved out)', hdr.indexOf('id="hdr-name"') < 0 && hdr.indexOf('id="hdr-goal"') < 0 && hdr.indexOf('from-indigo-500 to-cyan-400 grid place-items-center font-display') < 0);

/* ---------- 2. client: profile identity lives in the scrolling content ---------- */
const mainSeg = html.slice(html.indexOf('<main class="flex-1 max-w-lg'), html.indexOf('<!-- ===== TAB: WORKOUTS'));
ok('portal: profile row sits in <main> BEFORE the workouts tab (scrolls away, all tabs)', mainSeg.indexOf('id="hdr-name"') >= 0 && mainSeg.indexOf('id="hdr-goal"') >= 0 && mainSeg.indexOf('DK</div>') >= 0);
ok('portal: hdr-name/hdr-goal kept exactly once (JS fill still works)', (html.match(/id="hdr-name"/g) || []).length === 1 && (html.match(/id="hdr-goal"/g) || []).length === 1);

/* ---------- 3. client: rest banner = trainer #rest-timer placement ---------- */
ok('portal: banner fixed under the bar via measured --dk-appH', html.indexOf('#rest-banner { z-index: 60; top: var(--dk-appH, 3.5rem); border-top: 0; border-left: 0; border-right: 0; }') >= 0);
ok('portal: banner markup = trainer narrow strip (glass-strong px-4 py-2, no top-0 overlay)', html.indexOf('<div id="rest-banner" class="hidden fixed inset-x-0 glass-strong px-4 py-2 flex items-center gap-3">') >= 0 && html.indexOf('rest-banner" class="hidden fixed top-0') < 0);
ok('portal: old banner decorations gone (indigo border-b, sat inline padding)', html.indexOf('border-indigo-500/30 px-4 flex items-center gap-3" style="padding-top: calc(0.5rem + var(--sat))') < 0);
ok('portal: banner keeps icon + label + 01:30 + progress + −15/+30/✕ chips', ['id="rest-banner-display"', 'id="rest-banner-progress"', 'id="txt-rest-label"', 'id="btn-timer-minus15"', 'id="btn-timer-plus30"', 'id="btn-timer-skip"'].every(s => html.indexOf(s) >= 0));

/* ---------- 4. client: --dk-appH measuring + notch + scroll margins ---------- */
ok('portal: measureAppH defined + exposed to harness/applyFontScale', html.indexOf('function measureAppH()') >= 0 && html.indexOf('window.dkMeasureAppH = measureAppH') >= 0);
ok('portal: bar measured on load, resize and orientation change', /document\.addEventListener\('DOMContentLoaded', measureAppH\)/.test(html) && html.indexOf("window.addEventListener('load', measureAppH)") >= 0 && html.indexOf("window.addEventListener('resize', measureAppH)") >= 0 && html.indexOf("window.addEventListener('orientationchange', measureAppH)") >= 0);
ok('portal: startRest re-measures the bar before showing the banner', (() => { const seg = between(html, 'function startRest(sec)', "updateRestDisplay();"); return seg.indexOf('measureAppH();') >= 0 && seg.indexOf("classList.remove('hidden')") > seg.indexOf('measureAppH();'); })());
ok('portal: font-scale change re-measures (applyFontScale hook)', html.indexOf('if (window.dkMeasureAppH) window.dkMeasureAppH();') >= 0);
ok('portal: notch inset moved INTO the bar (body > header.sticky padding-top)', html.indexOf('body > header.sticky { padding-top: var(--sat); }') >= 0 && html.indexOf('      padding-top: var(--sat);\n      padding-bottom: var(--sab);') < 0);
ok('portal: trainer row rules mirrored (min-height 2.5rem + big-font wrap)', html.indexOf('html .dk-topbar-row { height: auto; min-height: 2.5rem; }') >= 0 && html.indexOf('html.dk-fs-big .dk-topbar-row, html.dk-fs-big .dk-topbar-row > div { flex-wrap: wrap; }') >= 0);
ok('portal: auto-scroll stops below the bar (#tab-workouts, #client-card)', html.indexOf('#tab-workouts, #client-card { scroll-margin-top: calc(var(--dk-appH, 3.5rem) + 0.5rem); }') >= 0);

/* ---------- 5. trainer: untouched (the reference the user approved) ---------- */
ok('trainer: thin app bar + live head + rest banner unchanged', trainer.indexOf('<header class="sticky top-0 z-30 glass"') >= 0 && trainer.indexOf('<div id="live-workout-head" class="relative z-0"') >= 0 && trainer.indexOf('<div id="rest-timer" class="hidden fixed top-14 inset-x-0 z-40 glass px-4 py-2"') >= 0);
ok('trainer: --dk-appH rules + measuring intact', trainer.indexOf('#rest-timer { top: var(--dk-appH, 3.5rem); }') >= 0 && trainer.indexOf("document.documentElement.style.setProperty('--dk-appH', _bar175.offsetHeight + 'px')") >= 0);

/* ---------- 6. versions ---------- */
ok('sw cache bumped for c203', sw.indexOf("const CACHE_NAME = 'dk-gym-v230'; // c203") >= 0);
ok('trainer build c203 (meta + footer + RUNNING)', trainer.indexOf('content="c203"') >= 0 && /var RUNNING = 203;/.test(trainer));
ok('c176 sticky breakout fix intact (both portals)', /html \{ height: 100%; \}/.test(html) && /body \{ min-height: 100%; overscroll-behavior-y: none; \}/.test(html) && /html \{ height: 100%; \}/.test(trainer) && /body \{ min-height: 100%; overscroll-behavior-y: none; \}/.test(trainer));

/* ---------- 7. inline JS syntax of the touched script blocks ---------- */
function scriptBlocks(src) {
  const out = [];
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(src)) !== null) out.push(m[1]);
  return out;
}
[['portal', html, ['measureAppH', 'dkMeasureAppH']], ['trainer', trainer, ['--dk-appH']]].forEach(([name, src, markers]) => {
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
