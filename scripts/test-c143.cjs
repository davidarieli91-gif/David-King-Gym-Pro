/* c143 unit test — cardio fields per machine (extracted detection + static). */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'client.html'), 'utf8');
const trainer = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }
function eq(name, got, want) { const g = JSON.stringify(got), w = JSON.stringify(want); if (g === w) { pass++; console.log('PASS ' + name + ' = ' + g); } else { fail++; console.log('FAIL ' + name + ' got ' + g + ' want ' + w); } }
function count(s, needle) { return s.split(needle).length - 1; }
function extractFn(src, name) {
  const start = src.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('function not found: ' + name);
  let depth = 0, i = src.indexOf('{', start);
  let inStr = null, inLine = false, inBlock = false, esc = false;
  for (; i < src.length; i++) {
    const c = src[i], n = src[i + 1];
    if (inLine) { if (c === '\n') inLine = false; continue; }
    if (inBlock) { if (c === '*' && n === '/') { inBlock = false; i++; } continue; }
    if (inStr) { if (esc) { esc = false; continue; } if (c === '\\') { esc = true; continue; } if (c === inStr) inStr = null; continue; }
    if (c === '/' && n === '/') { inLine = true; i++; continue; }
    if (c === '/' && n === '*') { inBlock = true; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (!depth) return src.slice(start, i + 1); }
  }
  throw new Error('unbalanced: ' + name);
}

/* ---------- 1. detection (portal copy) ---------- */
new Function(extractFn(html, 'cardioMachineOf') + '\n;globalThis.__cm = cardioMachineOf;')();
const cm = globalThis.__cm;
eq('treadmill (ru name)', cm({ name_ru: 'Беговая дорожка' }), 'treadmill');
eq('treadmill (en name)', cm({ name_en: 'Treadmill Run' }), 'treadmill');
eq('treadmill (he)', cm({ name_he: 'הליכון' }), 'treadmill');
eq('bike (велотренажёр)', cm({ name_ru: 'Велотренажёр' }), 'bike');
eq('bike (spin)', cm({ name_en: 'Spin Bike' }), 'bike');
eq('bike (эргометр)', cm({ name_ru: 'Гребной эргометр' }), 'rower'); /* rowing wins via /греб/ */
eq('elliptical (ru)', cm({ name_ru: 'Эллиптический тренажёр' }), 'elliptical');
eq('elliptical (en)', cm({ name_en: 'Elliptical Cross Trainer' }), 'elliptical');
eq('rower', cm({ name_en: 'Rowing Machine' }), 'rower');
eq('stepper', cm({ name_en: 'Stair Stepper' }), 'stepper');
eq('generic cardio → level', cm({ name_en: 'Cardio Machine' }), 'level');
eq('empty → level', cm(null), 'level');
eq('equipment wins when name is generic', cm({ name_en: 'Cardio', equipment_ru: 'Беговая дорожка' }), 'treadmill');

/* ---------- 2. trainer wiring ---------- */
ok('trainer has the shared detector', trainer.indexOf('window.dkCardioMachine = function (ex, base)') >= 0);
ok('pb computes the machine + renders its fields', trainer.indexOf("const machineB = isCardioB ? window.dkCardioMachine(ex, exBase) : '';") >= 0 && trainer.indexOf("data-pb-set=\"${ei}.${si}.speed\"") >= 0 && trainer.indexOf("data-pb-set=\"${ei}.${si}.incline\"") >= 0 && trainer.indexOf("data-pb-set=\"${ei}.${si}.level\"") >= 0);
ok('pb effort input only for non-cardio', trainer.indexOf(": `<input type=\"text\" inputmode=\"numeric\" pattern=\"[0-9\\\\-]*\" placeholder=\"${t('workouts.effortScale')}\"") >= 0);
ok('live computes the machine + renders the extras line', trainer.indexOf("const _machine = isC ? window.dkCardioMachine(_liveExRef, _liveFull) : '';") >= 0 && trainer.indexOf('style="grid-column:1/-1"') >= 0);
ok('live parser accepts the new numeric fields', trainer.indexOf("field === 'incline' || field === 'level' ? parseInt(val, 10)") >= 0);
ok('pb parser accepts the new numeric fields', trainer.indexOf("field === 'speed' || field === 'incline' || field === 'level') {") >= 0);
ok('all 8 set mappings carry the fields', count(trainer, 'speed: s.speed') >= 8);
['ru', 'en', 'he'].forEach(function (lng) {
  const j = JSON.parse(fs.readFileSync(path.join(root, 'src', 'i18n', lng + '.json'), 'utf8'));
  ok('trainer i18n ' + lng + ': speed/incline/level', !!(j.workouts && j.workouts.speed && j.workouts.incline && j.workouts.level));
});

/* ---------- 3. portal wiring ---------- */
ok('portal detector + machine at render', html.indexOf('function cardioMachineOf(ex)') >= 0 && html.indexOf("const machineP = isCardioEx ? cardioMachineOf(exData || ex) : '';") >= 0);
ok('portal renders speed+incline for treadmill', html.indexOf("machineP === 'treadmill'") >= 0 && html.indexOf('data-field="speed"') >= 0 && html.indexOf('data-field="incline"') >= 0);
ok('portal renders level for the rest', html.indexOf('data-field="level"') >= 0);
ok('portal input handler stores the fields', html.indexOf("else if (f === 'speed' || f === 'incline' || f === 'level') set[f] = v === '' ? null : parseFloat(v);") >= 0);
ok('portal finish record keeps the fields', html.indexOf('speed: s.speed != null ? s.speed : null, incline: s.incline != null ? s.incline : null, level: s.level != null ? s.level : null, rpe: s.rpe') >= 0);
ok('portal i18n ×3 labels', count(html, "speedLabel:'") === 3 && count(html, "inclineLabel:'") === 3 && count(html, "levelLabel:'") === 3);

/* ---------- 4. versions ---------- */
ok('sw cache at least v170', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 170; })());
ok('RUNNING / dk-build at least c143', (function () {
  const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
  return !!r && !!b && Number(r[1]) >= 143 && Number(b[1]) >= 143;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
