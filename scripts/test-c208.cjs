/* c208 test — premium client workspace: dashboard cards, profile hero,
   quick rail, stats chart and meal cards. Also guards the c208 build bump. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const crm = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src', 'dashboard-v3.css'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const copy = fs.readFileSync(path.join(root, 'scripts', 'copy-assets.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }

/* ---------- dashboard ---------- */
ok('dashboard uses the new head + five KPI tiles', crm.indexOf('class="dk-dash-head"') >= 0 && (crm.match(/class="v2-kpi dk-kpi"/g) || []).length >= 5);
ok('KPI strip includes the six-week dynamics spark', crm.indexOf('id="v2-kpi-spark"') >= 0 && crm.indexOf('v2-kpi-dyn-sub') >= 0);
ok('client roster has status chips, grid/list toggle and group select', crm.indexOf('id="dash-status"') >= 0 && crm.indexOf('id="dash-view-grid"') >= 0 && crm.indexOf('id="dash-view-list"') >= 0 && crm.indexOf('id="dash-group"') >= 0);
ok('client list is a card grid', crm.indexOf('id="dash-list" class="dk-client-grid"') >= 0);
ok('activity rail exists', crm.indexOf('id="dash-activity"') >= 0 && crm.indexOf('function renderActivity()') >= 0);
ok('photo-first card renderer exists', crm.indexOf('function cardHTML(c)') >= 0 && crm.indexOf('dk-client-photo') >= 0 && crm.indexOf('dk-client-ring-row') >= 0);
ok('card shows photo, initials, status, goal, ring and metrics', ['dk-client-photo-fallback', 'dk-client-photo-badge', 'dk-client-goal', 'dk-client-ring', 'dk-client-metrics'].every(k => crm.indexOf(k) >= 0));
ok('new clients remember their starting body numbers', crm.indexOf('obj.start_weight = obj.weight') >= 0 && crm.indexOf('obj.start_waist') >= 0 && crm.indexOf('obj.start_body_fat') >= 0);

/* ---------- client screen ---------- */
ok('profile paints a cinematic hero', crm.indexOf('class="dk-hero"') >= 0 && crm.indexOf('profile-hero-program-slot') >= 0 && crm.indexOf('profile-goal-ring') >= 0);
ok('hero has the four reference actions', ['message', 'call', 'note', 'history'].every(a => crm.indexOf('data-hero-action="' + a + '"') >= 0));
ok('profile has a quick rail', crm.indexOf('function quickCard(c)') >= 0 && crm.indexOf('data-quick-action="workout"') >= 0 && crm.indexOf('profile-quick-activity') >= 0);
ok('profile has the stats + weight chart card', crm.indexOf('function statsCard(c)') >= 0 && crm.indexOf('id="profile-weight-chart"') >= 0 && crm.indexOf('function drawProfileChart') >= 0);
ok('profile has four meal cards', crm.indexOf('id="profile-meal-cards"') >= 0 && crm.indexOf('function profileMealCardsHTML') >= 0 && crm.indexOf('dk-meal-card') >= 0);
ok('new panels are in the layout order', crm.indexOf("PF_PANELS = ['hero', 'stats', 'quick'") >= 0 && crm.indexOf("col2: ['quick', 'programs'") >= 0);
ok('active program loads into the hero', crm.indexOf('function loadProfileHeroProgram') >= 0 && crm.indexOf('profile-hero-program-open') >= 0);
ok('quick rail actions reuse the existing program/nutrition buttons', crm.indexOf("data-quick-action=\\\"program\\\"") >= 0 || crm.indexOf('data-quick-action="program"') >= 0);

/* ---------- styles ---------- */
ok('dashboard-v3 stylesheet is linked', crm.indexOf('href="src/dashboard-v3.css"') >= 0);
ok('dashboard-v3 stylesheet ships in copy-assets', copy.indexOf("'src/dashboard-v3.css'") >= 0);
ok('dashboard CSS covers five KPIs, card grid and rail', css.indexOf('.dk-kpi-grid') >= 0 && css.indexOf('.dk-client-grid') >= 0 && css.indexOf('.dk-rail-hero') >= 0);
ok('profile CSS covers hero, ring, stats, chart and meals', ['.dk-hero', '.dk-hero-ring', '.dk-stats-grid', '.dk-chart', '.dk-meal-grid'].every(k => css.indexOf(k) >= 0));
ok('light mode has theme-aware cards', css.indexOf('html[data-ui="v2"] .dk-client-card') >= 0 && crm.indexOf('[data-mode="light"]') >= 0);

/* ---------- versions ---------- */
ok('trainer build c211', crm.indexOf('<meta name="dk-build" content="c211" />') >= 0);
ok('trainer RUNNING 211', crm.indexOf('var RUNNING = 211;') >= 0);
ok('sidebar + login show c208', crm.indexOf('id="v2-side-version">c211') >= 0 && crm.indexOf('3 languages · c211') >= 0);
ok('SW cache v238', sw.indexOf("CACHE_NAME = 'dk-gym-v238'") >= 0);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
