/* c142 unit test — chip rows wrap + unit-true weight placeholder. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'client.html'), 'utf8');
const trainer = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }

/* ---------- 1. portal chip rows wrap ---------- */
ok('program-selector base wraps', html.indexOf('id="program-selector" class="hidden flex flex-wrap items-center gap-1.5 pb-1"') >= 0);
ok('days-tabs base wraps', html.indexOf('id="days-tabs-container" class="flex flex-wrap items-center gap-1.5 pb-1"') >= 0);
ok('plan-selector base wraps', html.indexOf('id="plan-selector" class="hidden flex flex-wrap items-center gap-1.5"') >= 0);
ok('renderProgramSelector wraps (both branches)', html.indexOf("c.className='flex flex-wrap items-center gap-2 pb-1';") >= 0 && html.indexOf("c.className='flex flex-wrap items-center gap-1.5 pb-1';") >= 0);
ok('renderPlanSelector wraps (both branches)', html.indexOf("c.className='flex flex-wrap items-center gap-2';") >= 0 && html.indexOf("c.className='flex flex-wrap items-center gap-1.5';") >= 0);
ok('no hidden-scrollbar rows left for these selectors', html.indexOf('overflow-x-auto no-sb pb-1') === -1 && html.indexOf('overflow-x-auto no-sb"') === -1);

/* ---------- 2. trainer placeholder follows the unit ---------- */
ok('pb weight placeholder uses the exercise unit', trainer.indexOf('placeholder="${wShortB}" title="${t(\'workouts.weight\')} · ${wShortB}"') >= 0);
ok('no hardcoded workouts.kg placeholder left', trainer.indexOf("placeholder=\"${t('workouts.kg')}\"") === -1);

/* ---------- 3. versions ---------- */
ok('sw cache at least v169', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 169; })());
ok('RUNNING / dk-build at least c142', (function () {
  const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
  return !!r && !!b && Number(r[1]) >= 142 && Number(b[1]) >= 142;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
