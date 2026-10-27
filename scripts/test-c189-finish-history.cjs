/* c202 finish/save + portal-history regression.
   Root causes fixed:
   - trainer report called portal-only dispVolKg/dispUnitShort (undefined) and
     threw before showing the report, so Finish/Save looked dead;
   - trainer Workouts list only read local workout_history, while analytics and
     recovery merged the portal cloud history. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const crm = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const portal = fs.readFileSync(path.join(root, 'client.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { cond ? pass++ : fail++; console.log((cond ? 'PASS ' : 'FAIL ') + name); }
function has(s, x) { return s.indexOf(x) >= 0; }

/* trainer report helpers */
ok('trainer defines dispVolKg', has(crm, 'function dispVolKg(v)'));
ok('trainer defines dispUnitShort', has(crm, 'function dispUnitShort()'));
ok('live report uses dispVolKg', has(crm, 'dispVolKg(ev)') && has(crm, 'dispVolKg(vol)'));
ok('live report uses dispUnitShort', has(crm, "t('report.volume') + ' · ' + dispUnitShort()"));
ok('live report save is guarded', has(crm, "const _liveSaveBtn = document.getElementById('live-report-save')") && has(crm, 'catch (eSave)'));
ok('live report save error key', has(crm, "toast(t('workouts.saveFailed')"));
ok('report volume label no longer hardcodes kg', !has(crm, 'tile(Number(dispVolKg(vol)).toLocaleString(localeString()), t(\'report.volume\') + \' · kg\''));
ok('saveFailed i18n ru', has(fs.readFileSync(path.join(root, 'src/i18n/ru.json'), 'utf8'), '"saveFailed"'));
ok('saveFailed i18n en', has(fs.readFileSync(path.join(root, 'src/i18n/en.json'), 'utf8'), '"saveFailed"'));
ok('saveFailed i18n he', has(fs.readFileSync(path.join(root, 'src/i18n/he.json'), 'utf8'), '"saveFailed"'));

/* remote history identity + merge */
ok('remote history gets stable id', has(crm, "id: 'remote_' + String(clientId) + '_' + ts"));
ok('remote history gets client_id', has(crm, 'client_id: clientId'));
ok('history merges portal remote', has(crm, 'async function mergeRemoteHistory()') && has(crm, 'window.dkFetchClientHistory(c.id)'));
ok('history merge dedupes by client+date', has(crm, "String(w.client_id || '') + '|' + (Number(w.date || w.created_at) || 0)"));
ok('history merge updates last_active', has(crm, 'c.last_active = latest[id]'));
ok('history merge triggers dashboard refresh', has(crm, 'screens.dashboard.refresh'));

/* performed-set history math, not prescriptions from skipped sets */
ok('history performed helper', has(crm, 'function histPerformed(s)'));
ok('history performed count', has(crm, 'function histPerformedCount(w)'));
ok('history uses effective volume', has(crm, 'function histVolumeOf(w)') && has(crm, 'recVolumeKg({ exercises: w.exercises || [] }'));
ok('history card uses performed volume', has(crm, 'const volume = histVolumeOf(w);'));
ok('history card uses performed sets', has(crm, 'const totalSets = histPerformedCount(w);'));
ok('history detail uses performed volume', has(crm, 'const volume = histVolumeOf(w);'));
ok('history detail uses performed sets', has(crm, 'const setCount = histPerformedCount(w);'));
ok('history per-exercise uses effective volume', has(crm, 'histExVolume(ex, w.client_id)'));

/* client portal performed semantics */
ok('client sessionSetCount uses setPerformed', has(portal, 'window.dkMuscleCore.setPerformed'));
ok('client exDoneVolume uses performed', has(portal, "const perf = (window.dkMuscleCore && typeof window.dkMuscleCore.setPerformed === 'function')"));
ok('client saves performed flag on each set', has(portal, 'performed: !!(s.done || s.touched)'));

/* versions/cache */
ok('trainer build c206', has(crm, 'name="dk-build" content="c206"'));
ok('trainer RUNNING 206', has(crm, 'var RUNNING = 206;'));
ok('SW cache v233', has(sw, "CACHE_NAME = 'dk-gym-v233'"));

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exitCode = 1;
