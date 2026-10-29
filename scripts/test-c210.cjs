/* c210 test — adaptive trainer workspace for phones, 16:9, 21:9 and 32:9. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const crm = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src', 'responsive-v4.css'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const copy = fs.readFileSync(path.join(root, 'scripts', 'copy-assets.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }

ok('responsive stylesheet is linked', crm.indexOf('href="src/responsive-v4.css"') >= 0);
ok('responsive stylesheet ships in copy-assets', copy.indexOf("'src/responsive-v4.css'") >= 0);
ok('trainer screens no longer stay in a 1500px island', css.indexOf('[data-screen="dashboard"]') >= 0 && css.indexOf('max-width: none !important') >= 0);
ok('dashboard rail and client grid are fluid', css.indexOf('clamp(320px, 21vw, 450px)') >= 0 && css.indexOf('clamp(190px, 11.2vw, 300px)') >= 0);
ok('profile rail and hero are fluid', css.indexOf('clamp(380px, 28vw, 760px)') >= 0 && css.indexOf('clamp(150px, 11vw, 230px)') >= 0);
ok('stats card turns into KPI + chart strip on wide screens', css.indexOf('grid-template-columns: minmax(360px, .92fr) minmax(0, 1.25fr)') >= 0);
ok('nutrition rail and product grids are fluid', css.indexOf('.nutri-dash') >= 0 && css.indexOf('clamp(400px, 29vw, 780px)') >= 0);
ok('workouts picker columns grow on wide monitors', css.indexOf('.picker-tree-col') >= 0 && css.indexOf('.picker-map-col') >= 0);
ok('live workout uses 2/3 columns on wide monitors', css.indexOf('#live-workout-exercises {') >= 0 && css.indexOf('repeat(2, minmax(0, 1fr))') >= 0 && css.indexOf('repeat(3, minmax(0, 1fr))') >= 0);
ok('settings becomes a multi-column accordion on wide screens', css.indexOf('[data-screen="settings"]:not(.hidden)') >= 0 && css.indexOf('repeat(3, minmax(0, 1fr))') >= 0);
ok('tools uses multi-column forms on wide screens', css.indexOf('[data-screen="tools"] [class*="sm:grid-cols-2"]') >= 0);
ok('nutrition rail stays 3-up and meals use 2/3 columns', css.indexOf('.nutri-rail .nutri-food-grid') >= 0 && css.indexOf('.nutri-meal-list') >= 0 && css.indexOf('repeat(3, minmax(0, 1fr))') >= 0);
ok('mobile keeps two client columns and stacks the hero', css.indexOf('grid-template-columns: repeat(2, minmax(0, 1fr))') >= 0 && css.indexOf('.dk-hero { grid-template-columns: 1fr; }') >= 0);
ok('hidden settings never leak under another screen', css.indexOf('[data-screen="settings"]:not(.hidden)') >= 0);

ok('trainer build c212', crm.indexOf('<meta name="dk-build" content="c212" />') >= 0);
ok('trainer RUNNING 212', crm.indexOf('var RUNNING = 212;') >= 0);
ok('sidebar + login show c210', crm.indexOf('id="v2-side-version">c212') >= 0 && crm.indexOf('3 languages · c212') >= 0);
ok('SW cache v239', sw.indexOf("CACHE_NAME = 'dk-gym-v239'") >= 0);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
