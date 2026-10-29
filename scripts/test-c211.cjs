/* c211 test — readable large-monitor typography, balanced settings and a
   wider food-detail work surface. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const crm = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src', 'responsive-v4.css'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }

ok('large monitors get a fluid text scale', css.indexOf('[class*="text-[10px]"]') >= 0 && css.indexOf('clamp(15px, .58vw, 18px)') >= 0);
ok('non-Tailwind labels scale too', css.indexOf('.dk-kpi-label') >= 0 && css.indexOf('.dk-client-sub') >= 0 && css.indexOf('.dk-quick-copy b') >= 0);
ok('food detail becomes a wide work surface', css.indexOf('#food-detail-modal > .bg-surface') >= 0 && css.indexOf('clamp(960px, 52vw, 1400px)') >= 0);
ok('settings flows in balanced columns (no chessboard)', css.indexOf('column-count: 2') >= 0 && css.indexOf('column-count: 3') >= 0 && css.indexOf('break-inside: avoid') >= 0);
ok('settings never leaks when hidden', css.indexOf('[data-screen="settings"]:not(.hidden)') >= 0);
ok('nutrition custom labels scale too', css.indexOf('.nutri-meal-sub') >= 0 && css.indexOf('.nutri-food-name') >= 0);
ok('controls grow with the type scale', css.indexOf('.dk-status-chip') >= 0 && css.indexOf('height: 38px') >= 0);

ok('trainer build c213', crm.indexOf('<meta name="dk-build" content="c213" />') >= 0);
ok('trainer RUNNING 213', crm.indexOf('var RUNNING = 213;') >= 0);
ok('sidebar + login show c211', crm.indexOf('id="v2-side-version">c213') >= 0 && crm.indexOf('3 languages · c213') >= 0);
ok('SW cache v241', sw.indexOf("CACHE_NAME = 'dk-gym-v241'") >= 0);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
