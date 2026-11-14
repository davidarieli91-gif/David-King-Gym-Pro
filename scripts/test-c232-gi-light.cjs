/* c232 test — GymImpulse transparent line art on light themes:
   cards get dark ink, the trainer modal gets a light media plate, and the
   dark-theme x-ray treatment stays exactly as it was. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const crm = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src', 'input.css'), 'utf8');
const portal = fs.readFileSync(path.join(root, 'server', 'public', 'portal-full.html'), 'utf8');
const client = fs.readFileSync(path.join(root, 'client.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }

const lightGi = 'html[data-ui="v2"][data-mode="light"] img[src*="images/gi_"]';
const lightThumbs = 'html[data-ui="v2"][data-mode="light"] img[src*="images/thumbs/gi_"]';
const lightModal = 'html[data-ui="v2"][data-mode="light"] #exercise-gif-slot';
const lightFilter = 'filter: invert(1) hue-rotate(180deg) brightness(.82) contrast(1.08)';

/* ---------- trainer app ---------- */
ok('trainer light theme inverts GI images', crm.indexOf(lightGi) >= 0 && crm.indexOf(lightThumbs) >= 0 && crm.indexOf('videos/gi_') >= 0 && crm.indexOf(lightFilter) >= 0);
ok('inverted GI ink multiplies onto the light plate', crm.indexOf(lightFilter) >= 0 && crm.substr(crm.indexOf(lightFilter), 220).indexOf('mix-blend-mode: multiply') >= 0);
ok('trainer modal keeps the dark plate as the default', crm.indexOf('html[data-ui="v2"] #exercise-gif-slot') >= 0 && crm.indexOf('#050b1a !important') >= 0);
ok('trainer modal gets a light plate in light themes', crm.indexOf(lightModal) >= 0 && crm.substr(crm.indexOf(lightModal), 600).indexOf('#f5faff !important') >= 0);
ok('light plate override comes after the dark default', crm.indexOf(lightModal) > crm.indexOf('html[data-ui="v2"] #exercise-gif-slot'));
ok('dark theme GI screening still intact', crm.indexOf('html[data-mode="dark"] img[src*="images/gi_"]') >= 0 && crm.indexOf('invert(1) hue-rotate(180deg) brightness(.98) saturate(1.12) contrast(1.05)') >= 0);
ok('print output still disables image filters', crm.indexOf('filter: none !important') >= 0 && crm.indexOf('mix-blend-mode: normal !important') >= 0);

/* ---------- shared stylesheet (portal + client + compiled trainer css) ---------- */
ok('shared css inverts GI by path in light themes', css.indexOf(lightGi) >= 0 && css.indexOf(lightThumbs) >= 0 && css.indexOf('videos/gi_') >= 0 && css.indexOf(lightFilter) >= 0);
ok('shared css covers renderer source classes', css.indexOf('html[data-ui="v2"][data-mode="light"] [data-src="gi"] img') >= 0 && css.indexOf('html[data-ui="v2"][data-mode="light"] .v2-src-gi img') >= 0);
ok('shared css keeps the dark GI screen blend', css.indexOf('html[data-ui="v2"][data-mode="dark"] .v2-src-gi img') >= 0 && css.substr(css.indexOf('html[data-ui="v2"][data-mode="dark"] .v2-src-gi img'), 150).indexOf('mix-blend-mode: screen') >= 0);
ok('light rules do not touch BF/GV/RepDB art', css.indexOf('[data-mode="light"] img[src*="images/bf_"]') < 0 && css.indexOf('[data-mode="light"] img[src*="images/gv_"]') < 0 && css.indexOf('[data-mode="light"] img[src*="images/rdb/"]') < 0);
ok('fullscreen black viewer keeps the original GI ink', css.indexOf('#viewer-img[src*="images/gi_"]') >= 0 && portal.indexOf('id="viewer-img"') >= 0 && client.indexOf('id="viewer-img"') >= 0);

/* ---------- both client apps consume the shared css ---------- */
ok('portal loads the compiled shared css', portal.indexOf('/assets/analytics-engine.css') >= 0);
ok('client app loads the shared source css', client.indexOf('src/input.css') >= 0);

/* ---------- cache ---------- */
ok('SW cache v251', sw.indexOf("CACHE_NAME = 'dk-gym-v251'") >= 0);
ok('SW documents c232', sw.indexOf('c232') >= 0 && sw.indexOf('GYMIMPULSE LIGHT-THEME ART') >= 0);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
