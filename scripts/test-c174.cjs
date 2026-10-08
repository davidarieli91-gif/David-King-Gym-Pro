/* c174 test — body composition in the recovery model + the portal weight-profile fix. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const portal = fs.readFileSync(path.join(root, 'client.html'), 'utf8');
const trainer = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const enginePath = path.join(root, 'src', 'recovery-engine.js');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }

/* ---------- ENGINE: real unit tests (node, no DOM) ---------- */
global.window = undefined;
require(enginePath);
const E = globalThis.dkRecoveryEngine;
const NOW = Date.now();
const DAY = 86400000;
const RES = function (ex) { return { group: ex.group, synergists: [], names: [ex.name] }; }; /* tests need a resolver */
function mkW(daysAgo, w, r, rpe, unit) {
  return { date: NOW - daysAgo * DAY, exercises: [{ exercise_id: 'e1', name: 'Bench Press', group: 'chest', unit: unit || 'kg', sets: [{ weight: w, reps: r, rpe: rpe, done: true }] }] };
}
ok('fat unknown → v2-identical meta (null modifiers)', (function () {
  const m = E.compute({ workouts: [mkW(1, 80, 10, 8)], bodyWeightKg: 75, now: NOW }).meta;
  return m.bodyFatPct === null && m.leanKg === null && m.compTauMod === null;
})());
ok('fat 20% → neutral lean ratio (×1.0, leanKg 60)', (function () {
  const m = E.compute({ workouts: [mkW(1, 80, 10, 8)], bodyWeightKg: 75, bodyFatPct: 20, now: NOW }).meta;
  return m.bodyFatPct === 20 && m.leanKg === 60 && m.compTauMod === 1;
})());
ok('fat 40% → τ clamped ×1.15 (slower recovery)', (function () {
  const m = E.compute({ workouts: [mkW(1, 80, 10, 8)], bodyWeightKg: 75, bodyFatPct: 40, now: NOW }).meta;
  return m.compTauMod === 1.15 && m.tauDays === 3.85;
})());
ok('fat 10% → τ ×0.9 (faster recovery)', (function () {
  const m = E.compute({ workouts: [mkW(1, 80, 10, 8)], bodyWeightKg: 75, bodyFatPct: 10, now: NOW }).meta;
  return m.compTauMod === 0.9;
})());
ok('fat 40% → cold-start capacity shrinks (40 → 30)', (function () {
  const g = E.compute({ workouts: [mkW(1, 80, 10, 8)], bodyWeightKg: 75, bodyFatPct: 40, now: NOW }).groups.chest;
  return g.capacity === 30;
})());
ok('fat 10% → cold-start capacity grows (40 → 45)', (function () {
  const g = E.compute({ workouts: [mkW(1, 80, 10, 8)], bodyWeightKg: 75, bodyFatPct: 10, now: NOW }).groups.chest;
  return g.capacity === 45;
})());
ok('personal capacity wins over the composition default', (function () {
  const w = [mkW(40, 80, 10, 8), mkW(30, 82, 10, 8), mkW(20, 84, 10, 8), mkW(10, 86, 10, 8)];
  const g = E.compute({ workouts: w, bodyWeightKg: 75, bodyFatPct: 40, now: NOW, resolveEx: RES }).groups.chest;
  /* p90 of [80,82,84,86]×10×0.714/100 = 86×10×(8-3)/7/100 = 6.14 → 6.1 —
     the PERSONAL p90, NOT the composition-scaled default (30) */
  return g.capacity === 6.1;
})());
ok('insane fat values are ignored (2, 71, NaN, string junk)', (function () {
  const m1 = E.compute({ workouts: [mkW(1, 80, 10, 8)], bodyWeightKg: 75, bodyFatPct: 2, now: NOW }).meta;
  const m2 = E.compute({ workouts: [mkW(1, 80, 10, 8)], bodyWeightKg: 75, bodyFatPct: 71, now: NOW }).meta;
  const m3 = E.compute({ workouts: [mkW(1, 80, 10, 8)], bodyWeightKg: 75, bodyFatPct: 'abc', now: NOW }).meta;
  const m4 = E.compute({ workouts: [mkW(1, 80, 10, 8)], bodyWeightKg: 75, bodyFatPct: null, now: NOW }).meta;
  return m1.bodyFatPct === null && m2.bodyFatPct === null && m3.bodyFatPct === null && m4.bodyFatPct === null;
})());
ok('bodyweight load stays TOTAL weight (physics), not lean', (function () {
  /* push-ups (patternF 0.64) at 100 kg: load = 100×0.64×10×intensity/100 —
     identical with and without fat (only τ/capacity adapt) */
  const mk = () => ({ date: NOW - DAY, exercises: [{ exercise_id: 'e2', name: 'Push-up', group: 'chest', unit: 'kg', sets: [{ weight: 0, reps: 10, rpe: 8, done: true }] }] });
  const a = E.compute({ workouts: [mk()], bodyWeightKg: 100, now: NOW, resolveEx: RES }).groups.chest.volume7d;
  const b = E.compute({ workouts: [mk()], bodyWeightKg: 100, bodyFatPct: 35, now: NOW, resolveEx: RES }).groups.chest.volume7d;
  return a === b && a === 640;
})());
ok('trend() meta carries composition too', (function () {
  const m = E.trend({ workouts: [mkW(1, 80, 10, 8)], bodyWeightKg: 75, bodyFatPct: 30, now: NOW, days: 14 }).meta;
  return m.bodyFatPct === 30 && m.leanKg === 52.5;
})());
ok('composition stacks with the c125 energy modifier, τ clamp holds', (function () {
  /* energy 1 (×1.1) + fat 40% (×1.15) → 3.4×1.1×1.15 = 4.301 → clamp 3.85 */
  const m = E.compute({ workouts: [mkW(1, 80, 10, 8)], bodyWeightKg: 75, bodyFatPct: 40, energy: 1, energyTauMod: true, now: NOW }).meta;
  return m.tauDays === 3.85 && m.tauMod === 1.1 && m.compTauMod === 1.15;
})());

/* ---------- TRAINER: ctx + engine wiring ---------- */
ok('trainer buildCtx reads the profile fat (client-card body_fat_pct)', trainer.indexOf("const fv = parseFloat(cw && cw.body_fat_pct);") >= 0 && trainer.indexOf("fat = fv; fatSource = 'profile';") >= 0);
ok('trainer buildCtx: latest check-in fat overrides the profile', trainer.indexOf("const fv174 = parseFloat(checks[i] && checks[i].body_fat);") >= 0 && trainer.indexOf("fat = fv174; fatSource = 'checkin';") >= 0);
ok('trainer ctx carries fat to the engine (compute + trend)', trainer.indexOf('bodyFatPct: ctx.fat,           /* c174: body composition */') >= 0 && (trainer.match(/bodyFatPct: ctx\.fat/g) || []).length === 2);
ok('trainer strip shows 🔥 fat%', trainer.indexOf("' · 🔥 <b class=\"text-text\">' + (Math.round(_ctx.fat * 10) / 10) + '%</b>'") >= 0);
ok('trainer share payload includes client.body_fat', trainer.indexOf('target_weight: client.target_weight, body_fat: client.body_fat_pct') >= 0);
ok('trainer dkFetchClientChecks passes body_fat (3..70 sanity)', trainer.indexOf('const pf = v => { const n = parseFloat(v); return (isFinite(n) && n >= 3 && n <= 70) ? Math.round(n * 10) / 10 : null; };') >= 0 && trainer.indexOf('if (bf174 != null) out174.body_fat = bf174;') >= 0);

/* ---------- PORTAL: the «54 kg vs 75 kg» fix ---------- */
ok('portal recpBodyWeight falls back to the payload profile weight', portal.indexOf("if (source !== 'checkin' && cc) {") >= 0 && portal.indexOf("bw = pw; source = 'profile';") >= 0);
ok('portal reads payload client.body_fat as the fat base', portal.indexOf("const pf = parseFloat(cc.body_fat);") >= 0 && portal.indexOf("fat = pf; fatSource = 'profile';") >= 0);
ok('portal latest check-in fat wins (3..70)', portal.indexOf("const fv = parseFloat(cks[i] && cks[i].body_fat);") >= 0);
ok('portal passes fat to compute AND trend', (portal.match(/bodyFatPct: pers125\.fat/g) || []).length === 2);
ok('portal strip renders the «профиль» label + 🔥 fat%', portal.indexOf("p.source === 'profile' ? esc(t('mapBwProfile')) : ''") >= 0 && portal.indexOf("' · 🔥 <b class=\"text-text\">' + (Math.round(p.fat * 10) / 10) + '%</b>'") >= 0);
ok('portal check-in form has the fat field', portal.indexOf('id="input-checkin-fat"') >= 0 && portal.indexOf("body_fat:num(document.getElementById('input-checkin-fat').value)") >= 0);
ok('portal check-in fat travels to the cloud doc', portal.indexOf('if (bf != null) out.body_fat = bf;') >= 0 && portal.indexOf("{ body_fat: local.body_fat }") >= 0);
ok('portal fat field is translated (3 islands)', portal.indexOf("aFat:'Жир (%)'") >= 0 && portal.indexOf("aFat:'Body fat (%)'") >= 0 && portal.indexOf("aFat:'אחוז שומן'") >= 0);
ok('portal hint mentions composition (3 islands)', (portal.match(/Состав тела \(жир %\) масштабирует/g) || []).length === 1 && (portal.match(/Body composition \(fat %\) scales the ceiling/g) || []).length === 1 && (portal.match(/הרכב הגוף \(אחוז שומן\) מתאים/g) || []).length === 1);
ok('portal check-in fat prefill falls back to the profile value', portal.indexOf('isFinite(parseFloat(currentClient.body_fat))') >= 0);
ok('portal voice announces the fat field', portal.indexOf("el.id === 'input-checkin-fat'") >= 0);
ok('demo client carries body_fat', portal.indexOf("target_weight:84, body_fat:18.5") >= 0);

/* ---------- i18n JSON (trainer) ---------- */
const ru = JSON.parse(fs.readFileSync(path.join(root, 'src/i18n/ru.json'), 'utf8'));
const en = JSON.parse(fs.readFileSync(path.join(root, 'src/i18n/en.json'), 'utf8'));
const he = JSON.parse(fs.readFileSync(path.join(root, 'src/i18n/he.json'), 'utf8'));
ok('trainer i18n: recovery.bwFat ×3', ru.recovery.bwFat === 'жир' && en.recovery.bwFat === 'fat' && he.recovery.bwFat === 'שומן');
ok('trainer i18n: hint mentions composition ×3', ru.recovery.hint.indexOf('Состав тела') >= 0 && en.recovery.hint.indexOf('Body composition') >= 0 && he.recovery.hint.indexOf('הרכב הגוף') >= 0);

/* ---------- versions ---------- */
ok('sw cache v201 (c174)', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) === 201; })());
ok('sw keeps the c173 history line + adds v201', sw.indexOf('// v200: c173') >= 0 && sw.indexOf('// v201: c174') >= 0);
ok('RUNNING / dk-build = c174', (function () {
  const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
  return !!r && !!b && Number(r[1]) === 174 && Number(b[1]) === 174;
})());
ok('footer shows c174', trainer.indexOf('· c174') >= 0);

/* ---------- ENGINE regressions (spot re-run of the c122 math) ---------- */
ok('recovery math unchanged without fat (spot: push-ups at 82.5 kg)', (function () {
  const mk = () => ({ date: NOW - DAY, exercises: [{ exercise_id: 'e3', name: 'Push-up', group: 'chest', unit: 'kg', sets: [{ weight: 0, reps: 15, rpe: 8, done: true }] }] });
  const g = E.compute({ workouts: [mk()], bodyWeightKg: 82.5, now: NOW, resolveEx: RES }).groups.chest;
  /* c125-verified exact math: 82.5×0.64×15×(8-3)/7/100 = 5.657 load units */
  return g.load7d === 5.7 && g.volume7d === 792;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
