/* c212 test — dark native search, larger technique/food rails on 21:9. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const crm = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src', 'responsive-v4.css'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }

ok('dark mode declares a dark color-scheme', css.indexOf('html[data-mode="dark"] { color-scheme: dark; }') >= 0);
ok('global search uses the themed input plate', css.indexOf('.v2-global-search') >= 0 && css.indexOf('background: var(--v2-input-bg) !important') >= 0);
ok('search text and placeholder are themed', css.indexOf('-webkit-text-fill-color: rgb(var(--c-text))') >= 0 && css.indexOf('input::placeholder') >= 0);
ok('profile technique rail is 1.6x wider', css.indexOf('clamp(380px, 28vw, 760px)') >= 0);
ok('nutrition product rail is wider too', css.indexOf('clamp(400px, 29vw, 780px)') >= 0);
ok('nutrition rail keeps 3 large product cards', css.indexOf('.nutri-rail .nutri-food-grid') >= 0 && css.indexOf('repeat(3, minmax(0, 1fr))') >= 0);
ok('wide meal list uses 2/3 columns', css.indexOf('.nutri-meal-list') >= 0);

ok('trainer build c213', crm.indexOf('<meta name="dk-build" content="c213" />') >= 0);
ok('trainer RUNNING 213', crm.indexOf('var RUNNING = 213;') >= 0);
ok('sidebar + login show c212', crm.indexOf('id="v2-side-version">c213') >= 0 && crm.indexOf('3 languages · c213') >= 0);
ok('SW cache v244', sw.indexOf("CACHE_NAME = 'dk-gym-v244'") >= 0);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
