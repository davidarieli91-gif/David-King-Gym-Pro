/* c183 — Prev column integrity test.
   The Prev column must ALWAYS be the SAME set number from the last workout
   that actually contains the exercise. It must never be filled from the
   current session's previous set (the old lwChainPrev behavior), and add-set
   must not copy the current last set into Prev. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const trainer = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const portal = fs.readFileSync(path.join(root, 'client.html'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }

/* Trainer */
ok('trainer: chain-fill function removed', trainer.indexOf('function lwChainPrev(') < 0);
ok('trainer: no call copies the done set into the next Prev', trainer.indexOf('lwChainPrev(xi, si)') < 0 && trainer.indexOf('lwChainPrev(p, si)') < 0);
ok('trainer: applyLastRef uses the exact set index', trainer.indexOf('const r = ref[si];') >= 0);
ok('trainer: applyLastRef rewrites (does not skip) existing Prev', trainer.indexOf('if (s.prev_weight == null && s.prev_reps == null') < 0);
ok('trainer: performed/touched helper exists', trainer.indexOf('function lwSetPerformed(') >= 0 && trainer.indexOf("if (s.touched === true) return true;") >= 0);
ok('trainer: history keeps ALL sets (no done-only filter)', trainer.indexOf('const allSets = Array.isArray(ex.sets) ? ex.sets : [];') >= 0);
ok('trainer: add-set no longer copies last set into Prev', trainer.indexOf('prev_weight: lastSet ? lastSet.weight : null') < 0);
ok('trainer: add-set starts with blank Prev', trainer.indexOf('prev_weight: null, prev_reps: null, prev_time: null') >= 0);
ok('trainer: finish stores performed/touched', trainer.indexOf('performed: !!(s.done || s.touched)') >= 0 && trainer.indexOf('touched: !!s.touched') >= 0);
ok('trainer: draft restore refreshes Prev', trainer.indexOf('ensureLastRef(); /* c183') >= 0);

/* Portal */
ok('portal: no copy of the done set into the next Prev', portal.indexOf('next.prev_weight = set.weight != null ? set.weight') < 0);
ok('portal: no partner chain copy', portal.indexOf('pNext.prev_weight = pSet.weight') < 0);
ok('portal: findPrev uses the exact set index', portal.indexOf('const s = hit.sets[setIndex];') >= 0);
ok('portal: Math.min(setIndex) fallback removed', portal.indexOf('Math.min(setIndex, hit.sets.length - 1)') < 0);
ok('portal: performed/touched helper exists', portal.indexOf('function psSetPerformed(') >= 0);
ok('portal: history keeps ALL sets', portal.indexOf('const allSets = he && Array.isArray(he.sets) ? he.sets : [];') >= 0);
ok('portal: add-set no longer copies last set into Prev', portal.indexOf('prev_weight: last ? last.weight : null') < 0);
ok('portal: add-set starts with blank Prev', portal.indexOf('prev_weight: null,') >= 0 && portal.indexOf('prev_rpe: null,') >= 0);
ok('portal: remote history refreshes Prev', portal.indexOf('try { psRefreshPrev(); } catch (ePrev) {}') >= 0);
ok('portal: finish stores performed/touched', portal.indexOf('performed: !!(s.done || s.touched)') >= 0);

/* Version / cache */
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
ok('sw cache bumped for c205', sw.indexOf("const CACHE_NAME = 'dk-gym-v238'; // c211") >= 0);
ok('trainer build c211 (meta + RUNNING)', trainer.indexOf('content="c211"') >= 0 && /var RUNNING = 211;/.test(trainer));

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
