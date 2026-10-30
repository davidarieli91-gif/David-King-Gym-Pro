/* c206 test — one dark glass image plate for all four exercise sources and
   both portals, a solid rest field, and the c206 build/cache version. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const crm = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const portal = fs.readFileSync(path.join(root, 'client.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src', 'input.css'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }

/* ---------- all four source families are covered ---------- */
ok('dark glass stage for every picker card', css.indexOf('html[data-ui="v2"][data-mode="dark"] .bm-ex-card .aspect-square') >= 0 && css.indexOf('radial-gradient(ellipse 80% 80% at 50% 35%, #101c3a 0%, #070d1e 72%, #040713 100%) !important') >= 0);
ok('BF/GV white-background art is inverted and screened', css.indexOf('img[src*="images/bf_"]') >= 0 && css.indexOf('img[src*="images/gv_"]') >= 0 && css.indexOf('[data-src="bf"] img') >= 0 && css.indexOf('.v2-src-gv img') >= 0);
ok('RepDB flat art gets invert + hue rotation', css.indexOf('img[src*="images/rdb/"]') >= 0 && css.indexOf('[data-src="rdb"] img') >= 0 && css.indexOf('.v2-src-rdb img') >= 0 && css.indexOf('filter: invert(1) hue-rotate(180deg)') >= 0);
ok('GymImpulse black-background renders are screened', css.indexOf('img[src*="images/gi_"]') >= 0 && css.indexOf('[data-src="gi"] img') >= 0 && css.indexOf('.v2-src-gi img') >= 0);
ok('filters only run in dark mode', (css.match(/html\[data-ui="v2"\]\[data-mode="dark"\]/g) || []).length >= 5);
ok('the picker card stays glass in every theme', crm.indexOf('html[data-ui="v2"] .bm-ex-card') >= 0 && crm.indexOf('background: linear-gradient(155deg, rgba(255,255,255,.065), rgba(255,255,255,.012)), var(--v2-surface) !important') >= 0);

/* ---------- every renderer reaches the same treatment ---------- */
ok('picker renderer tags the source class', crm.indexOf('class="bm-ex-card v2-src-') >= 0);
ok('exercise DB tab renderer tags the source class', crm.indexOf("'<div class=\"bm-ex-card v2-src-'") >= 0);
ok('live trainer cards tag the source class', crm.indexOf('class="glass rounded-2xl p-4 space-y-3 fade-in v2-src-') >= 0);
ok('exercise modal stamps data-src for the big media', crm.indexOf("gifSlot.setAttribute('data-src', _srcCode)") >= 0);
ok('client live thumbnails stamp data-src in both branches', (portal.match(/data-src="\$\{_srcCode\}"/g) || []).length >= 2);
ok('pre-workout preview and builder draw from the same image paths', crm.indexOf('id="program-day-preview-body"') >= 0 && crm.indexOf('data-pb-view-ex=') >= 0);

/* ---------- rest field is a solid plate, not a gradient panel ---------- */
ok('rest field uses the solid v2 input plate', css.indexOf('html[data-ui="v2"] .rest-sec-input') >= 0 && css.indexOf('background: var(--v2-input-bg) !important') >= 0 && css.indexOf('color: rgb(var(--c-text)) !important') >= 0);
ok('rest field exists in both portals and the builder', (crm.match(/class="rest-sec-input/g) || []).length >= 3 && portal.indexOf('class="rest-sec-input') >= 0);

/* ---------- light mode is untouched ---------- */
ok('no light-mode image filter overrides', css.indexOf('[data-mode="light"] .bm-ex-card') < 0 || css.indexOf('[data-mode="light"] .bm-ex-card .aspect-square img') < 0);
ok('portal light-mode text rules still exist', portal.indexOf('[data-mode="light"] #workout-exercises-list') >= 0);

/* ---------- versions ---------- */
ok('trainer build c213', crm.indexOf('<meta name="dk-build" content="c213" />') >= 0);
ok('trainer RUNNING 213', crm.indexOf('var RUNNING = 213;') >= 0);
ok('sidebar + login show c206', crm.indexOf('id="v2-side-version">c213') >= 0 && crm.indexOf('3 languages · c213') >= 0);
ok('SW cache v244', sw.indexOf("CACHE_NAME = 'dk-gym-v244'") >= 0);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
