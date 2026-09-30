/* c141 unit test — live workout cleanup + exercise reorder (static). */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const trainer = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }
function count(s, needle) { return s.split(needle).length - 1; }

/* ---------- 1. the dead controls are gone ---------- */
ok('client selector markup removed', trainer.indexOf('id="live-workout-client"') === -1);
ok('client selector wiring removed', trainer.indexOf('const clientSel = document.getElementById(\'live-workout-client\')') === -1);
ok('global unit chip removed from the live header', trainer.indexOf('id="lw-unit-chip"') === -1);
ok('stale unit-chip CSS removed', trainer.indexOf('#lw-unit-chip {') === -1);
ok('loadClientList tolerates the missing select (kept, guarded)', count(trainer, 'const sel = document.getElementById(\'live-workout-client\');') === 0 || trainer.indexOf("if (!sel) return;") >= 0);

/* ---------- 2. reorder buttons ---------- */
ok('move buttons rendered per card', trainer.indexOf('data-move-up="${idx}"') >= 0 && trainer.indexOf('data-move-down="${idx}"') >= 0);
ok('edge buttons disabled', trainer.indexOf("${idx === 0 ? 'disabled style=\"opacity:.25\"' : ''}") >= 0 && trainer.indexOf("${idx === (_workout.exercises.length - 1) ? 'disabled style=\"opacity:.25\"' : ''}") >= 0);
ok('handlers wired next to the superset wiring', trainer.indexOf("document.querySelectorAll('[data-move-up]').forEach") >= 0 && trainer.indexOf("moveLiveExercise(parseInt(btn.getAttribute('data-move-up'), 10), -1)") >= 0 && trainer.indexOf("moveLiveExercise(parseInt(btn.getAttribute('data-move-down'), 10), 1)") >= 0);
ok('move swaps neighbours and bounds-checks', trainer.indexOf('const tmp = exs[idx]; exs[idx] = exs[j]; exs[j] = tmp;') >= 0 && trainer.indexOf('if (idx < 0 || idx >= exs.length || j < 0 || j >= exs.length) return false;') >= 0);
ok('move clears stale superset links (builder rule)', /exs\.forEach\(ex => \{\s*if \(ex && \(ex\.ss_link !== undefined \|\| ex\.is_superset\)\) \{[\s\S]*?delete ex\.ss_link;[\s\S]*?delete ex\.superset_partner;/.test(trainer));
ok('move marks the session structurally changed (save offer)', trainer.indexOf("markStruct('moved');") >= 0);
ok('move has localized feedback', trainer.indexOf("toast(t('workouts.moved') || 'Exercise moved', 'success', 1200);") >= 0);

/* ---------- 3. i18n ×3 ---------- */
['ru', 'en', 'he'].forEach(function (lng) {
  const j = JSON.parse(fs.readFileSync(path.join(root, 'src', 'i18n', lng + '.json'), 'utf8'));
  ok('i18n ' + lng + ': moveUp/moveDown/moved', !!(j.workouts && j.workouts.moveUp && j.workouts.moveDown && j.workouts.moved));
});

/* ---------- 4. versions ---------- */
ok('sw cache at least v168', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 168; })());
ok('RUNNING / dk-build at least c141', (function () {
  const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
  return !!r && !!b && Number(r[1]) >= 141 && Number(b[1]) >= 141;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
