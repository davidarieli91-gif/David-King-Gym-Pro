/* c157 test — TWO INDEPENDENT PWA IDENTITIES (trainer vs client portal).
   The bug: both manifests scoped `/David-King-Gym-Pro/`, so the installed
   trainer app captured client.html («already installed» → opened the trainer).
   Fix: exact-path scopes, distinct ids, start_url inside its own scope and
   NOT inside the other app's scope. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const trainer = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const html = fs.readFileSync(path.join(root, 'client.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const mTrainer = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const mPortal = JSON.parse(fs.readFileSync(path.join(root, 'manifest-portal.json'), 'utf8'));
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }
const within = (scope, url) => String(url).indexOf(scope) === 0;

/* ---------- trainer manifest ---------- */
ok('trainer scope is the exact app path', mTrainer.scope === '/David-King-Gym-Pro/fitness-crm.html');
ok('trainer start_url inside its scope', within(mTrainer.scope, mTrainer.start_url));
ok('trainer id unchanged (no duplicate installs)', mTrainer.id === '/David-King-Gym-Pro/');
ok('trainer scope no longer the root', mTrainer.scope !== '/David-King-Gym-Pro/');

/* ---------- portal manifest ---------- */
ok('portal scope is the exact app path', mPortal.scope === '/David-King-Gym-Pro/client.html');
ok('portal start_url inside its scope', within(mPortal.scope, mPortal.start_url));
ok('portal id unchanged', mPortal.id === '/David-King-Gym-Pro/client.html');
ok('portal scope no longer the root', mPortal.scope !== '/David-King-Gym-Pro/');

/* ---------- the conflict itself ---------- */
ok('portal page NOT inside the trainer scope (the bug)', !within(mTrainer.scope, mPortal.start_url));
ok('trainer page NOT inside the portal scope', !within(mPortal.scope, mTrainer.start_url));
ok('the two identities differ', mTrainer.id !== mPortal.id && mTrainer.scope !== mPortal.scope);

/* ---------- wiring ---------- */
ok('fitness-crm links the trainer manifest', trainer.indexOf('<link rel="manifest" href="manifest.json" />') >= 0);
ok('client.html links the portal manifest', html.indexOf('<link rel="manifest" href="manifest-portal.json" />') >= 0);

/* ---------- versions ---------- */
ok('sw cache at least v184', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 184; })());
ok('RUNNING / dk-build at least c157', (function () {
  const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
  return !!r && !!b && Number(r[1]) >= 157 && Number(b[1]) >= 157;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
