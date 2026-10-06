/* c173 test — subgroup recovery in the portal map. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const portal = fs.readFileSync(path.join(root, 'client.html'), 'utf8');
const trainer = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }

/* ---------- STATIC: portal state + compute ---------- */
ok('portal keeps the subgroups', portal.indexOf('let _recpSub = null;') >= 0 && portal.indexOf('return { groups: res.groups, subgroups: res.subgroups || {} };') >= 0);
ok('legacy fallback also returns both', portal.indexOf('return { groups: recpComputeLegacy(), subgroups: {} };') >= 0);
ok('renderRecMap splits groups/subgroups', portal.indexOf('_recpData = _r173 ? _r173.groups : null;') >= 0 && portal.indexOf('_recpSub = (_r173 && _r173.subgroups) || null;') >= 0);

/* ---------- STATIC: portal SVG + list ---------- */
ok('portal SVG zones follow their subgroup', (function () {
  const i = portal.indexOf('function recpRenderBody()');
  const body = portal.slice(i, i + 3200);
  return body.indexOf("getAttribute('data-subgroup')") >= 0 && body.indexOf('_recpSub[skey]') >= 0 && body.indexOf('recpSubLabel(subName)') >= 0;
})());
ok('portal list renders indented subgroup rows', (function () {
  const i = portal.indexOf('function recpRenderList()');
  const body = portal.slice(i, i + 5600);
  return body.indexOf('↳ ') >= 0 && body.indexOf('recpSubLabel(s.sub)') >= 0 && body.indexOf('_recpSub') >= 0;
})());
ok('portal has the 3-language subgroup dictionary', portal.indexOf('const RECP_SUB_I18N = {') >= 0 && portal.indexOf("'Brachioradialis': { en: 'Brachioradialis', ru: 'Брахорадиалис'") >= 0 && portal.indexOf("'Abductors': { en: 'Abductors', ru: 'Абдукторы'") >= 0 && portal.indexOf('function recpSubLabel(sub)') >= 0);

/* ---------- STATIC: labels match the trainer's ---------- */
ok('trainer and portal subgroup names agree (spot check)', trainer.indexOf("'Quadriceps': { en: 'Quadriceps', ru: 'Квадрицепс'") >= 0 && portal.indexOf("'Quadriceps': { en: 'Quadriceps', ru: 'Квадрицепс'") >= 0);

/* ---------- versions ---------- */
ok('sw cache at least v200', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 200; })());
ok('sw keeps c172 history and adds v200 c173', sw.indexOf('// v199: c172') >= 0 && sw.indexOf('// v200: c173') >= 0);
ok('RUNNING / dk-build at least c173', (function () {
  const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
  return !!r && !!b && Number(r[1]) >= 173 && Number(b[1]) >= 173;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
