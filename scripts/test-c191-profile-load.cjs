/* c202 profile client-switch race regression.
   A slow async load/render/program query for client A must never paint into
   client B's profile after the trainer switches clients. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const crm = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { cond ? pass++ : fail++; console.log((cond ? 'PASS ' : 'FAIL ') + name); }
function has(s, x) { return s.indexOf(x) >= 0; }

/** Extract one function body by brace matching (static assertion helper). */
function bodyOf(src, signature) {
  const start = src.indexOf(signature);
  if (start < 0) return '';
  const open = src.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return src.slice(open, i + 1);
    }
  }
  return '';
}

const profileStart = crm.indexOf('screens.profile = (function');
const profile = crm.slice(profileStart, profileStart + 90000);
ok('profile has render token', has(profile, 'let _renderSeq = 0;'));
ok('profile has separate load token', has(profile, 'let _loadSeq = 0;'));
ok('profile has programs token', has(profile, 'let _programsSeq = 0;'));

const load = bodyOf(profile, 'async function load(clientId)');
ok('load captures requested id', has(load, 'const requestedId = String(clientId || \'\');'));
ok('load checks newer load (not render)', has(load, 'if (seq !== _loadSeq || String(_clientId || \'\') !== requestedId) return;'));
ok('router render cannot cancel an in-flight load', !load.includes('seq !== _renderSeq'));
ok('load drops previous client in the gap', has(load, "if (_client && String(_client.id || '') !== requestedId) _client = null;"));
ok('load sets client only after guard', has(load, '_client = client;'));

const render = bodyOf(profile, 'function render()');
ok('render starts a new token', has(render, 'const seq = ++_renderSeq;'));
ok('render passes token', has(render, 'renderAsync(seq)'));

const renderAsync = bodyOf(profile, 'async function renderAsync(seq)');
ok('renderAsync rejects a record for another client', has(renderAsync, "if (String(c.id || '') !== requestedId) return;"));
ok('renderAsync checks token before header', has(renderAsync, 'if (seq !== _renderSeq || String(_clientId || \'\') !== requestedId) return;'));
ok('renderAsync re-checks after layout await', (renderAsync.match(/if \(seq !== _renderSeq/g) || []).length >= 2);
ok('renderAsync checks before pfPaint', /if \(seq !== _renderSeq \|\| String\(_clientId \|\| ''\) !== requestedId\) return;\s*pfPaint/.test(renderAsync));

const loadPrograms = bodyOf(profile, 'async function loadPrograms(clientId)');
ok('loadPrograms checks target client first', has(loadPrograms, 'if (!targetId || targetId !== String(_clientId || \'\')) return;'));
ok('loadPrograms owns a sequence token', has(loadPrograms, 'const seq = ++_programsSeq;'));
ok('loadPrograms still() guard', has(loadPrograms, 'const still = () => seq === _programsSeq &&'));
ok('loadPrograms checks after programs query', has(loadPrograms, 'if (!still()) return;'));
ok('loadPrograms checks after exercise cache', (loadPrograms.match(/if \(!still\(\)\) return;/g) || []).length >= 2);
ok('loadPrograms checks after rotation awaits', has(loadPrograms, 'await Promise.all(actives.map') && loadPrograms.indexOf('if (!still()) return;', loadPrograms.indexOf('await Promise.all')) >= 0);
ok('loadPrograms checks before archived paint', loadPrograms.indexOf('if (!still()) return;', loadPrograms.indexOf('// Archived')) >= 0);
ok('loadPrograms captures activeSection before await', loadPrograms.indexOf('const activeSection = document.getElementById(\'programs-active-section\')') < loadPrograms.indexOf('await db.find'));
ok('loadPrograms uses only captured activeSection', (profile.match(/document\.getElementById\('programs-active-section'\)/g) || []).length === 1);
ok('program load uses target id for query', has(loadPrograms, "db.find('client_programs', 'by_clientId', targetId)"));
ok('nutrition plans have client-switch token', has(crm, 'let _plansSeq = 0;') && has(crm, 'let _plansClientId = null;'));
ok('nutrition plans guard stale query', (function () {
  const fn = bodyOf(crm, 'async function loadPlans(clientId)');
  return has(fn, 'const seq = ++_plansSeq;') && has(fn, 'if (seq !== _plansSeq) return;');
})());

ok('profile render still wires programs', has(crm, 'loadPrograms(c.id);'));
ok('trainer build c204', has(crm, 'name="dk-build" content="c204"'));
ok('trainer RUNNING 204', has(crm, 'var RUNNING = 204;'));
ok('SW cache v231', has(sw, "CACHE_NAME = 'dk-gym-v231'"));

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exitCode = 1;
