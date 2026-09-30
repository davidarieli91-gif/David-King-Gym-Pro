/* c139 unit test — portal modal scroll + card-open gesture (static). */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'client.html'), 'utf8');
const trainer = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }
function count(s, needle) { return s.split(needle).length - 1; }

/* ---------- 1. modal scroll ---------- */
ok('exercise view can actually scroll (flex-1 + min-h-0 + overscroll)', html.indexOf('id="exercise-view" class="p-4 space-y-4 overflow-y-auto flex-1 min-h-0 overscroll-contain"') >= 0);
ok('modal container still clips + flex column', html.indexOf('max-h-[92vh] flex flex-col rounded-t-3xl') >= 0);

/* ---------- 2. open gesture: eye/image only ---------- */
ok('title is inert (no data-open-exercise)', html.indexOf('leading-snug flex-1 min-w-0" data-exercise-title') >= 0);
ok('eye button added with a localized name', html.indexOf('data-open-exercise aria-label="${esc(t(\'a11yOpenCard\'))}"') >= 0);
ok('thumbnail wrappers still open the card', count(html, 'shrink-0 cursor-pointer" data-open-exercise') >= 2);
ok('handler requires the opener attribute', html.indexOf("const opener = e.target.closest('[data-open-exercise]');") >= 0 && html.indexOf('if(!opener) return; /* only the eye 👁 / the thumbnail */') >= 0);
ok('old whole-card condition gone', html.indexOf('if(e.target.closest(\'input,button\')) return;') === -1);
ok('i18n ×3: a11yOpenCard', count(html, "a11yOpenCard:'") === 3);

/* ---------- 3. versions ---------- */
ok('sw cache at least v166', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 166; })());
ok('RUNNING / dk-build at least c139', (function () {
  const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
  return !!r && !!b && Number(r[1]) >= 139 && Number(b[1]) >= 139;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
