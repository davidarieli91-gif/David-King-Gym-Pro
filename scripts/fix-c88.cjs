#!/usr/bin/env node
/* fix-c88.cjs — cardio time/distance units (min⇄sec, m⇄km) in BOTH live workouts +
   the trainee portal, with ONE cloud-synced units doc (portal_shares/ps_units_global_v1)
   so a change in one app propagates to the other. Adds a Category select to the custom
   exercise form (cardio marking), enrichment carries category, recover.html hardened
   against service docs. Versions: c88 / RUNNING=88 / sw dk-gym-v115. repOnce discipline. */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FILES = {
  crm: path.join(ROOT, 'fitness-crm.html'),
  client: path.join(ROOT, 'client.html'),
  recover: path.join(ROOT, 'recover.html'),
  sw: path.join(ROOT, 'sw.js'),
  i18nRu: path.join(ROOT, 'src', 'i18n', 'ru.json'),
  i18nEn: path.join(ROOT, 'src', 'i18n', 'en.json'),
  i18nHe: path.join(ROOT, 'src', 'i18n', 'he.json'),
};

let failures = [];
function patch(fileKey, name, from, to, expected) {
  const p = FILES[fileKey];
  let src = fs.readFileSync(p, 'utf8');
  const parts = src.split(from);
  if (parts.length - 1 !== expected) {
    failures.push(`[${fileKey}] ${name}: anchor found ${parts.length - 1} times, expected ${expected}`);
    return;
  }
  src = parts.join(to);
  fs.writeFileSync(p, src);
  console.log(`  ok [${fileKey}] ${name}`);
}

/* ============ 1. TRAINER (fitness-crm.html) ============ */

/* T1: cloud push inside dkWUnitSet + the whole c88 cardio-units module */
patch('crm', 'T1 wunit push + c88 module',
`  function dkWUnitSet(u) {
    if (u !== 'lb') u = 'kg';
    try { localStorage.setItem(DK_WUNIT_KEY, u); } catch (_e) {}
    dkWUnitApply();
    dkWUnitClose();
  }
  /* c86: the unit is changed ONLY from the top labels — the header chip and the`,
`  function dkWUnitSet(u) {
    if (u !== 'lb') u = 'kg';
    try { localStorage.setItem(DK_WUNIT_KEY, u); } catch (_e) {}
    dkWUnitApply();
    dkWUnitClose();
    dkUnitsCloudPush();
  }
  /* ===== c88: time & distance units for cardio (minutes<->seconds, meters<->kilometers) =====
     The cardio columns of a live workout table are the ONLY triggers: tapping either the
     "Time" or the "Distance" column header opens ONE sheet with both choices. Values are
     never converted — a unit is the way a number is written (same policy as the weight
     unit). The choice is synced to the cloud doc portal_shares/ps_units_global_v1 so the
     trainer app and every trainee portal share ONE setting: change in one -> both change. */
  var DK_TUNIT_KEY = 'dk_tunit';
  var DK_DUNIT_KEY = 'dk_dunit';
  var DK_UNITS_TS_KEY = 'dk_units_ts';
  var DK_UNITS_DOC_ID = 'ps_units_global_v1';
  function dkTUnitGet() { try { return localStorage.getItem(DK_TUNIT_KEY) === 'sec' ? 'sec' : 'min'; } catch (_e) { return 'min'; } }
  function dkDUnitGet() { try { return localStorage.getItem(DK_DUNIT_KEY) === 'km' ? 'km' : 'm'; } catch (_e) { return 'm'; } }
  function dkTUnitShort(u) { if (u == null) u = dkTUnitGet(); return t('wunit.' + (u === 'sec' ? 'secShort' : 'minShort')) || (u === 'sec' ? 'сек' : 'мин'); }
  function dkDUnitShort(u) { if (u == null) u = dkDUnitGet(); return t('wunit.' + (u === 'km' ? 'kmShort' : 'mShort')) || (u === 'km' ? 'км' : 'м'); }
  function dkCardioApply() {
    var tSh = dkTUnitShort(), dSh = dkDUnitShort();
    var tTitle = t('wunit.time') || 'Time unit', dTitle = t('wunit.dist') || 'Distance unit';
    document.querySelectorAll('[data-tunit-col]').forEach(function (el) {
      el.textContent = (el.getAttribute('data-tunit-base') || '') + ' · ' + tSh;
      el.title = tTitle;
    });
    document.querySelectorAll('[data-dunit-col]').forEach(function (el) {
      el.textContent = (el.getAttribute('data-dunit-base') || '') + ' · ' + dSh;
      el.title = dTitle;
    });
  }
  function dkCUnitEnsureSheet() {
    if (document.getElementById('dk-cunit-sheet')) return;
    var wrap = document.createElement('div');
    wrap.id = 'dk-cunit-sheet';
    wrap.className = 'hidden fixed inset-0 z-[95] flex items-center justify-center p-4';
    wrap.innerHTML =
      '<div class="absolute inset-0 bg-black/60 backdrop-blur-sm" data-cunit-backdrop></div>' +
      '<div class="relative w-full max-w-xs rounded-2xl border border-border bg-surface shadow-float p-4 space-y-3" role="dialog" aria-modal="true">' +
        '<div class="text-[10px] font-bold uppercase tracking-wider text-muted" data-cunit-title></div>' +
        '<div class="text-[10px] font-semibold text-muted" data-cunit-sub="t"></div>' +
        '<div class="grid grid-cols-2 gap-2">' +
          '<button type="button" data-cunit-t="min" class="wunit-opt rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm font-bold text-text transition"><span data-cunit-t-label="min"></span></button>' +
          '<button type="button" data-cunit-t="sec" class="wunit-opt rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm font-bold text-text transition"><span data-cunit-t-label="sec"></span></button>' +
        '</div>' +
        '<div class="text-[10px] font-semibold text-muted" data-cunit-sub="d"></div>' +
        '<div class="grid grid-cols-2 gap-2">' +
          '<button type="button" data-cunit-d="m" class="wunit-opt rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm font-bold text-text transition"><span data-cunit-d-label="m"></span></button>' +
          '<button type="button" data-cunit-d="km" class="wunit-opt rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm font-bold text-text transition"><span data-cunit-d-label="km"></span></button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(wrap);
    wrap.addEventListener('click', function (e) {
      if (e.target.closest('[data-cunit-backdrop]')) { dkCUnitClose(); return; }
      var tp = e.target.closest('[data-cunit-t]');
      if (tp) { dkTUnitSet(tp.getAttribute('data-cunit-t')); return; }
      var dp = e.target.closest('[data-cunit-d]');
      if (dp) dkDUnitSet(dp.getAttribute('data-cunit-d'));
    });
  }
  function dkCUnitRefreshSheet() {
    var sheet = document.getElementById('dk-cunit-sheet');
    if (!sheet) return;
    var tt = sheet.querySelector('[data-cunit-title]');
    if (tt) tt.textContent = t('wunit.cardioTitle') || 'Cardio units';
    var st = sheet.querySelector('[data-cunit-sub="t"]');
    if (st) st.textContent = t('wunit.time') || 'Time';
    var sd = sheet.querySelector('[data-cunit-sub="d"]');
    if (sd) sd.textContent = t('wunit.dist') || 'Distance';
    [['t', 'min'], ['t', 'sec'], ['d', 'm'], ['d', 'km']].forEach(function (pair) {
      var k = pair[0], u = pair[1];
      var btn = sheet.querySelector('[data-cunit-' + k + '="' + u + '"]');
      if (!btn) return;
      var lab = btn.querySelector('[data-cunit-' + k + '-label="' + u + '"]');
      if (lab) lab.textContent = (k === 't' ? dkTUnitShort(u) : dkDUnitShort(u));
      var on = (k === 't' ? dkTUnitGet() : dkDUnitGet()) === u;
      btn.classList.toggle('wunit-opt-active', on);
    });
  }
  function dkCUnitOpen() {
    dkCUnitEnsureSheet();
    dkCUnitRefreshSheet();
    document.getElementById('dk-cunit-sheet').classList.remove('hidden');
  }
  function dkCUnitClose() {
    var sh = document.getElementById('dk-cunit-sheet');
    if (sh) sh.classList.add('hidden');
  }
  function dkTUnitSet(u) {
    try { localStorage.setItem(DK_TUNIT_KEY, u === 'sec' ? 'sec' : 'min'); } catch (_e) {}
    dkWUnitApply();
    dkCUnitRefreshSheet();
    dkUnitsCloudPush();
  }
  function dkDUnitSet(u) {
    try { localStorage.setItem(DK_DUNIT_KEY, u === 'km' ? 'km' : 'm'); } catch (_e) {}
    dkWUnitApply();
    dkCUnitRefreshSheet();
    dkUnitsCloudPush();
  }
  /* c88: cloud sync — ONE units doc shared by the trainer app and every portal.
     Self-contained Firebase compat loader (the portal-share loader lives in
     another module scope). Write on every local change; pull on boot; live watch. */
  var DK_UNITS_FB_VER = '11.8.1';
  var DK_UNITS_FB_CFG = { apiKey: 'AIzaSyCP1QVC8TqhqU4_LSG1fxirClo8KHMS9rM', authDomain: 'david-king-gym.firebaseapp.com', projectId: 'david-king-gym', appId: '1:755766426093:web:6ef22ee31139ff6175cfe4' };
  var _dkUnitsFbP = null;
  function dkUnitsEnsureFb() {
    if (window.firebase && firebase.firestore) return Promise.resolve();
    if (!_dkUnitsFbP) {
      _dkUnitsFbP = new Promise(function (res, rej) {
        var s1 = document.createElement('script');
        s1.src = 'https://www.gstatic.com/firebasejs/' + DK_UNITS_FB_VER + '/firebase-app-compat.js';
        s1.onload = function () {
          var s2 = document.createElement('script');
          s2.src = 'https://www.gstatic.com/firebasejs/' + DK_UNITS_FB_VER + '/firebase-firestore-compat.js';
          s2.onload = function () { res(); };
          s2.onerror = function () { _dkUnitsFbP = null; rej(new Error('fb-firestore')); };
          document.head.appendChild(s2);
        };
        s1.onerror = function () { _dkUnitsFbP = null; rej(new Error('fb-app')); };
        document.head.appendChild(s1);
      });
    }
    return _dkUnitsFbP;
  }
  function dkUnitsCloudPush() {
    try {
      var ts = Date.now();
      try { localStorage.setItem(DK_UNITS_TS_KEY, String(ts)); } catch (_e) {}
      var payload = JSON.stringify({ w: dkWUnitGet(), t: dkTUnitGet(), d: dkDUnitGet() });
      dkUnitsEnsureFb().then(function () {
        if (!firebase.apps.length) firebase.initializeApp(DK_UNITS_FB_CFG);
        return firebase.firestore().collection('portal_shares').doc(DK_UNITS_DOC_ID).set({ d: payload, v: 2, ts: ts });
      }).catch(function (_e) {});
    } catch (_e) {}
  }
  function dkUnitsApplyRemote(data) {
    if (!data || !data.d || !data.ts) return;
    var local = 0;
    try { local = Number(localStorage.getItem(DK_UNITS_TS_KEY) || 0); } catch (_e) {}
    if (Number(data.ts) <= local) return;
    try {
      var u = JSON.parse(data.d);
      if (u.w) { try { localStorage.setItem(DK_WUNIT_KEY, u.w === 'lb' ? 'lb' : 'kg'); } catch (_e) {} }
      if (u.t) { try { localStorage.setItem(DK_TUNIT_KEY, u.t === 'sec' ? 'sec' : 'min'); } catch (_e) {} }
      if (u.d) { try { localStorage.setItem(DK_DUNIT_KEY, u.d === 'km' ? 'km' : 'm'); } catch (_e) {} }
      try { localStorage.setItem(DK_UNITS_TS_KEY, String(Number(data.ts))); } catch (_e) {}
      dkWUnitApply();
    } catch (_e) {}
  }
  function dkUnitsCloudSync(watch) {
    dkUnitsEnsureFb().then(function () {
      if (!firebase.apps.length) firebase.initializeApp(DK_UNITS_FB_CFG);
      var ref = firebase.firestore().collection('portal_shares').doc(DK_UNITS_DOC_ID);
      if (watch && ref.onSnapshot) {
        ref.onSnapshot(function (snap) { try { dkUnitsApplyRemote(snap && snap.exists ? snap.data() : null); } catch (_e) {} }, function (_e) {});
      } else {
        ref.get({ source: 'server' }).then(function (snap) { dkUnitsApplyRemote(snap && snap.exists ? snap.data() : null); }).catch(function (_e) {});
      }
    }).catch(function (_e) {});
  }
  try { dkUnitsCloudSync(true); } catch (_e) {}
  /* c86: the unit is changed ONLY from the top labels — the header chip and the`, 1);

/* T2: dkWUnitApply also re-applies cardio columns */
patch('crm', 'T2 dkWUnitApply + cardio apply',
`    document.querySelectorAll('[data-wunit-col]').forEach(function (el) {
      var base = el.getAttribute('data-wunit-base') || '';
      el.textContent = (base && base.toLowerCase() !== sh.toLowerCase()) ? base + ' · ' + sh : base;
      el.title = wTitle;
    });
  }`,
`    document.querySelectorAll('[data-wunit-col]').forEach(function (el) {
      var base = el.getAttribute('data-wunit-base') || '';
      el.textContent = (base && base.toLowerCase() !== sh.toLowerCase()) ? base + ' · ' + sh : base;
      el.title = wTitle;
    });
    try { dkCardioApply(); } catch (_e) {}
  }`, 1);

/* T3: click delegation for the cardio column headers */
patch('crm', 'T3 delegation tunit/dunit',
`  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-wunit-chip]')) { dkWUnitOpen(null); return; }
    if (e.target.closest('[data-wunit-col]')) { dkWUnitOpen(null); return; }
  });`,
`  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-wunit-chip]')) { dkWUnitOpen(null); return; }
    if (e.target.closest('[data-wunit-col]')) { dkWUnitOpen(null); return; }
    if (e.target.closest('[data-tunit-col]')) { dkCUnitOpen(); return; }
    if (e.target.closest('[data-dunit-col]')) { dkCUnitOpen(); return; }
  });`, 1);

/* T4: exIsCardio helper */
patch('crm', 'T4 exIsCardio helper',
`    /** Build HTML for a single set row. */
    function setRowHTML(exIdx, setIdx, set) {`,
`    /** c88: is this live-workout exercise a cardio (time/distance) exercise?
       The exercise_base record is the source of truth (the trainer can mark a
       built-in machine as cardio at any time); the stored flag is a fallback
       for records whose base row is missing from the cache. */
    function exIsCardio(rec) {
      if (!rec) return false;
      if (rec.category === 'cardio') return true;
      try {
        if (!_exMap || _exMapSize !== _exerciseCache.length) {
          _exMap = buildExerciseIndex(_exerciseCache);
          _exMapSize = _exerciseCache.length;
        }
        var baseEx = rec.exercise_id ? _exMap.get(rec.exercise_id) : null;
        if (baseEx) return baseEx.category === 'cardio';
      } catch (_e) {}
      return rec.cardio === true;
    }

    /** Build HTML for a single set row. */
    function setRowHTML(exIdx, setIdx, set) {`, 1);

/* T5: exercise table head — cardio columns for cardio exercises */
patch('crm', 'T5 thead cardio columns',
`                  <th class="px-2 py-2 text-center" data-wunit-col data-wunit-base="\${t('workouts.weight')}">\${t('workouts.weight')} · \${dkWUnitShort()}</th>
                  <th class="px-2 py-2 text-center">\${t('workouts.reps')}</th>`,
`                  \${exIsCardio(ex) ? \`<th class="px-2 py-2 text-center" data-tunit-col data-tunit-base="\${t('workouts.time')}">\${t('workouts.time')} · \${dkTUnitShort()}</th>
                  <th class="px-2 py-2 text-center" data-dunit-col data-dunit-base="\${t('workouts.dist')}">\${t('workouts.dist')} · \${dkDUnitShort()}</th>\` : \`<th class="px-2 py-2 text-center" data-wunit-col data-wunit-base="\${t('workouts.weight')}">\${t('workouts.weight')} · \${dkWUnitShort()}</th>
                  <th class="px-2 py-2 text-center">\${t('workouts.reps')}</th>\`}`, 1);

/* T6: setRowHTML — cardio flag + volume dash */
patch('crm', 'T6 setRowHTML vol',
`      const setVol = Math.round((Number(set.weight) || 0) * (Number(set.reps) || 0));`,
`      const isCardioSet = exIsCardio(_workout && _workout.exercises[exIdx]);
      const setVol = isCardioSet ? '—' : Math.round((Number(set.weight) || 0) * (Number(set.reps) || 0));`, 1);

/* T7: setRowHTML — time/dist inputs for cardio rows */
patch('crm', 'T7 setRowHTML inputs',
`          <td class="px-2 py-1.5">
            <input type="number" step="0.5" min="0" value="\${set.weight || ''}" data-set-input="\${exIdx}.\${setIdx}.weight" class="w-full bg-surface-2 border border-border rounded-md px-1.5 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary/60" placeholder="—" />
          </td>
          <td class="px-2 py-1.5">
            <input type="number" min="0" value="\${set.reps || ''}" data-set-input="\${exIdx}.\${setIdx}.reps" class="w-full bg-surface-2 border border-border rounded-md px-1.5 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary/60" placeholder="\${setType === 'amrap' ? '∞' : '—'}" />
          </td>`,
`          \${isCardioSet ? \`
          <td class="px-2 py-1.5">
            <input type="number" step="0.5" min="0" value="\${set.time != null ? set.time : ''}" data-set-input="\${exIdx}.\${setIdx}.time" class="w-full bg-surface-2 border border-border rounded-md px-1.5 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary/60" placeholder="—" />
          </td>
          <td class="px-2 py-1.5">
            <input type="number" step="0.5" min="0" value="\${set.dist != null ? set.dist : ''}" data-set-input="\${exIdx}.\${setIdx}.dist" class="w-full bg-surface-2 border border-border rounded-md px-1.5 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary/60" placeholder="—" />
          </td>
          \` : \`
          <td class="px-2 py-1.5">
            <input type="number" step="0.5" min="0" value="\${set.weight || ''}" data-set-input="\${exIdx}.\${setIdx}.weight" class="w-full bg-surface-2 border border-border rounded-md px-1.5 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary/60" placeholder="—" />
          </td>
          <td class="px-2 py-1.5">
            <input type="number" min="0" value="\${set.reps || ''}" data-set-input="\${exIdx}.\${setIdx}.reps" class="w-full bg-surface-2 border border-border rounded-md px-1.5 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary/60" placeholder="\${setType === 'amrap' ? '∞' : '—'}" />
          </td>
          \`}`, 1);

/* T8: rpe-strip volume guard */
patch('crm', 'T8 rpe strip guard',
`            const strip = document.querySelector('[data-rpe-strip="' + exIdx + '.' + setIdx + '"] .lw-rpe-vol');
            if (strip) strip.textContent = Math.round((Number(st.weight) || 0) * (Number(st.reps) || 0));`,
`            const strip = document.querySelector('[data-rpe-strip="' + exIdx + '.' + setIdx + '"] .lw-rpe-vol');
            if (strip) strip.textContent = exIsCardio(_workout.exercises[exIdx]) ? '—' : Math.round((Number(st.weight) || 0) * (Number(st.reps) || 0));`, 1);

/* T9: add-set copies time/dist */
patch('crm', 'T9 add-set time/dist',
`            ex.sets.push({
              weight: lastSet ? lastSet.weight : null,
              reps: lastSet ? lastSet.reps : null,
              rpe: null,
              type: lastSet ? lastSet.type : 'normal',
              done: false
            });`,
`            ex.sets.push({
              weight: lastSet ? lastSet.weight : null,
              reps: lastSet ? lastSet.reps : null,
              time: lastSet && lastSet.time != null ? lastSet.time : null,
              dist: lastSet && lastSet.dist != null ? lastSet.dist : null,
              rpe: null,
              type: lastSet ? lastSet.type : 'normal',
              done: false
            });`, 1);

/* T10: addExerciseById — cardio flag + time/dist defaults */
patch('crm', 'T10 addExerciseById',
`      _workout.exercises.push({
        exercise_id: ex.id,
        name: ex['name_' + lang] || ex.name_en,
        group: ex['group_' + lang] || ex.group_en,
        sets: [{
          weight: null,
          reps: null,
          rpe: null,
          done: false,
          prev_weight: null,
          prev_reps: null
        }]
      });`,
`      _workout.exercises.push({
        exercise_id: ex.id,
        name: ex['name_' + lang] || ex.name_en,
        group: ex['group_' + lang] || ex.group_en,
        cardio: ex.category === 'cardio',
        sets: [{
          weight: null,
          reps: null,
          time: null,
          dist: null,
          rpe: null,
          done: false,
          prev_weight: null,
          prev_reps: null
        }]
      });`, 1);

/* T11: BOTH template->workout paths carry the cardio flag (startFromTemplate + applyTemplateToClient) */
patch('crm', 'T11 template paths cardio',
`        exercises: (tpl.exercises || []).map(ex => ({
          exercise_id: ex.exercise_id,
          name: ex.name,
          group: ex.group,
          sets: (ex.sets || []).map(s => ({ ...s, done: false }))
        })),`,
`        exercises: (tpl.exercises || []).map(ex => ({
          exercise_id: ex.exercise_id,
          name: ex.name,
          group: ex.group,
          cardio: ex.cardio === true || ex.category === 'cardio',
          sets: (ex.sets || []).map(s => ({ ...s, done: false }))
        })),`, 2);

/* T12: startFromProgram carries cardio flag + time/dist */
patch('crm', 'T12 startFromProgram',
`        exercises: (prefill.exercises || []).map(ex => ({
          exercise_id: ex.exercise_id,
          name: ex.name,
          group: ex.group,
          sets: (ex.sets || []).map(s => ({
            weight: s.weight || null,
            reps: s.reps || null,
            rpe: s.rpe || null,
            type: s.type || 'normal',
            done: false
          })),
          rest_sec: ex.rest_sec || 90
        })),`,
`        exercises: (prefill.exercises || []).map(ex => ({
          exercise_id: ex.exercise_id,
          name: ex.name,
          group: ex.group,
          cardio: ex.cardio === true,
          sets: (ex.sets || []).map(s => ({
            weight: s.weight || null,
            reps: s.reps || null,
            time: s.time != null ? s.time : null,
            dist: s.dist != null ? s.dist : null,
            rpe: s.rpe || null,
            type: s.type || 'normal',
            done: false
          })),
          rest_sec: ex.rest_sec || 90
        })),`, 1);

/* T13: startWorkoutFromProgram prefill carries cardio flag + time/dist */
patch('crm', 'T13 prefill',
`          exercises: (day.exercises || []).map(ex => ({
            exercise_id: ex.exercise_id,
            name: ex.name,
            group: ex.group,
            sets: (ex.sets || []).map(s => ({
              weight: s.weight || null,
              reps: s.reps || null,
              rpe: s.rpe || null,
              done: false
            }))
          }))`,
`          exercises: (day.exercises || []).map(ex => ({
            exercise_id: ex.exercise_id,
            name: ex.name,
            group: ex.group,
            cardio: ex.cardio === true,
            sets: (ex.sets || []).map(s => ({
              weight: s.weight || null,
              reps: s.reps || null,
              time: s.time != null ? s.time : null,
              dist: s.dist != null ? s.dist : null,
              rpe: s.rpe || null,
              done: false
            }))
          }))`, 1);

/* T14: program builder — cardio flag + time/dist defaults */
patch('crm', 'T14 program builder push',
`      day.exercises.push({
        exercise_id: ex.id,
        name: ex['name_' + lang] || ex.name_en,
        group: ex['group_' + lang] || ex.group_en,
        rest_sec: 90,
        sets: [{ weight: null, reps: null, rpe: null }]
      });`,
`      day.exercises.push({
        exercise_id: ex.id,
        name: ex['name_' + lang] || ex.name_en,
        group: ex['group_' + lang] || ex.group_en,
        cardio: ex.category === 'cardio',
        rest_sec: 90,
        sets: [{ weight: null, reps: null, rpe: null, time: null, dist: null }]
      });`, 1);

/* T15: exercise form — Category select (cardio marking) */
patch('crm', 'T15 form category select',
`          <!-- Group / Subgroup / Equipment — dropdown selectors with i18n labels -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label class="block text-[11px] uppercase tracking-wider text-muted font-semibold mb-1" data-i18n="exercise.group">Group</label>
              <select name="group_en" id="ex-form-group-select" class="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 cursor-pointer"></select>
            </div>
            <div>
              <label class="block text-[11px] uppercase tracking-wider text-muted font-semibold mb-1" data-i18n="exercise.subgroup">Subgroup</label>
              <select name="subgroup_en" id="ex-form-subgroup-select" class="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 cursor-pointer"></select>
            </div>
            <div>
              <label class="block text-[11px] uppercase tracking-wider text-muted font-semibold mb-1" data-i18n="exercise.equipment">Equipment</label>
              <select name="equipment_en" id="ex-form-equipment-select" class="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 cursor-pointer"></select>
            </div>
          </div>`,
`          <!-- Group / Subgroup / Equipment / Category — dropdown selectors with i18n labels -->
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <div>
              <label class="block text-[11px] uppercase tracking-wider text-muted font-semibold mb-1" data-i18n="exercise.group">Group</label>
              <select name="group_en" id="ex-form-group-select" class="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 cursor-pointer"></select>
            </div>
            <div>
              <label class="block text-[11px] uppercase tracking-wider text-muted font-semibold mb-1" data-i18n="exercise.subgroup">Subgroup</label>
              <select name="subgroup_en" id="ex-form-subgroup-select" class="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 cursor-pointer"></select>
            </div>
            <div>
              <label class="block text-[11px] uppercase tracking-wider text-muted font-semibold mb-1" data-i18n="exercise.equipment">Equipment</label>
              <select name="equipment_en" id="ex-form-equipment-select" class="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 cursor-pointer"></select>
            </div>
            <div>
              <label class="block text-[11px] uppercase tracking-wider text-muted font-semibold mb-1" data-i18n="exercise.category">Category</label>
              <select name="category" id="ex-form-category-select" class="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 cursor-pointer"></select>
            </div>
          </div>`, 1);

/* T16: populate the category select (+ re-lang) */
patch('crm', 'T16 populate category',
`        Array.from(eqSel.options).forEach(opt => {
          if (!opt.value) return;
          const entry = EQUIPMENT_I18N[opt.value];
          if (entry) opt.textContent = entry[lang] || entry.en || opt.value;
        });
      }
    }`,
`        Array.from(eqSel.options).forEach(opt => {
          const entry = EQUIPMENT_I18N[opt.value];
          if (entry) opt.textContent = entry[lang] || entry.en || opt.value;
        });
      }
      // Category select (c88: 'cardio' marks a time/distance exercise)
      const catSel = document.getElementById('ex-form-category-select');
      if (catSel && !catSel.options.length) {
        catSel.innerHTML = '<option value="">—</option><option value="cardio">' + escHTML(t('exercise.categoryCardio') || 'Cardio') + '</option>';
      } else if (catSel) {
        const cardioOpt = catSel.querySelector('option[value="cardio"]');
        if (cardioOpt) cardioOpt.textContent = t('exercise.categoryCardio') || 'Cardio';
      }
    }`, 1);

/* T17: edit-fill sets the category select */
patch('crm', 'T17 edit fill category',
`      form.elements.equipment_en.value = e.equipment_en || '';`,
`      form.elements.equipment_en.value = e.equipment_en || '';
      if (form.elements.category) form.elements.category.value = e.category === 'cardio' ? 'cardio' : '';`, 1);

/* T18: save normalizes empty category */
patch('crm', 'T18 save category normalize',
`      const fd = new FormData(form);
      const obj = {};
      fd.forEach((v, k) => { obj[k] = v; });
      if (!obj.name_en) {
        showFormError(t('exercise.nameRequired'));`,
`      const fd = new FormData(form);
      let obj = {}; /* c88: let — the edit path reassigns it with the merged record */
      fd.forEach((v, k) => { obj[k] = v; });
      if (!obj.category) delete obj.category; /* c88: empty category = strength */
      if (!obj.name_en) {
        showFormError(t('exercise.nameRequired'));`, 1);

/* T18b: an edit must UPDATE the record, not replace it — merge the form over the
   existing record so fields the form doesn't carry (source, group, images,
   folder_path, classification, ...) survive. Without this, marking a built-in
   machine as cardio destroyed its source/group/images. */
patch('crm', 'T18b merge on edit',
`      const isNew = !obj.id;
      if (isNew) {
        const slug = (obj.name_en || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);
        obj.id = \`custom_\${slug}_\${Date.now().toString(36)}\`;
        obj.source = 'custom';
      }
      try {
        await db.put('exercise_base', obj);`,
`      const isNew = !obj.id;
      if (isNew) {
        const slug = (obj.name_en || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);
        obj.id = \`custom_\${slug}_\${Date.now().toString(36)}\`;
        obj.source = 'custom';
      } else {
        /* c88: merge — the form only carries a subset of the record's fields */
        try {
          const existing = await db.get('exercise_base', obj.id);
          if (existing) {
            obj = Object.assign({}, existing, obj);
            if (!obj.source) obj.source = existing.src === 'bf' ? 'burnfit' : (existing.src === 'gv' ? 'gymvisual' : (existing.src === 'gi' ? 'gymimpulse' : (existing.src === 'mm' ? 'muscle_motion' : 'custom')));
          }
        } catch (_e) {}
      }
      try {
        await db.put('exercise_base', obj);`, 1);

/* T19: portal share enrichment carries category */
patch('crm', 'T19 enrichment category',
`                group: ex.group_canonical || ex.g || '',`,
`                group: ex.group_canonical || ex.g || '',
                category: ex.category || '',`, 1);

/* T20-T22: versions c87 -> c88 */
patch('crm', 'T20 meta', '<meta name="dk-build" content="c87" />', '<meta name="dk-build" content="c88" />', 1);
patch('crm', 'T21 footer', 'IndexedDB · 3 languages · c87', 'IndexedDB · 3 languages · c88', 1);
patch('crm', 'T22 RUNNING', 'var RUNNING = 87; /* numeric part of dk-build c87 */', 'var RUNNING = 88; /* numeric part of dk-build c88 */', 1);

/* ============ 2. PORTAL (client.html) ============ */

patch('client', 'C1 dict ru',
"ru: { dumbbellAria:'Вернуться к тренировке', setTitle:'Настройки', themes:'Темы', darkThemes:'Тёмные темы', lightThemes:'Светлые темы', textures:'Текстуры', texHint:'Текстурные наложения поверх любой темы — те же, что в основном приложении. Выберите эффект и настройте насыщенность.', opacity:'Насыщенность', reset:'Сброс', resetDone:'Возврат к стандартной насыщенности', applied:'Текстура применена', share:'Поделиться отчётом', themeChanged:'Тема изменена', wunitTitle:'Единица веса', wunitKg:'Килограммы', wunitLb:'Фунты', wunitKgShort:'кг', wunitLbShort:'фт' },",
"ru: { dumbbellAria:'Вернуться к тренировке', setTitle:'Настройки', themes:'Темы', darkThemes:'Тёмные темы', lightThemes:'Светлые темы', textures:'Текстуры', texHint:'Текстурные наложения поверх любой темы — те же, что в основном приложении. Выберите эффект и настройте насыщенность.', opacity:'Насыщенность', reset:'Сброс', resetDone:'Возврат к стандартной насыщенности', applied:'Текстура применена', share:'Поделиться отчётом', themeChanged:'Тема изменена', wunitTitle:'Единица веса', wunitKg:'Килограммы', wunitLb:'Фунты', wunitKgShort:'кг', wunitLbShort:'фт', wunitTime:'Единица времени', wunitMin:'Минуты', wunitSec:'Секунды', wunitMinShort:'мин', wunitSecShort:'сек', wunitDist:'Единица расстояния', wunitM:'Метры', wunitKm:'Километры', wunitMShort:'м', wunitKmShort:'км', wunitCardioTitle:'Единицы кардио', timeLabel:'Время', distLabel:'Дистанция', distShortLabel:'Дист' },", 1);

patch('client', 'C2 dict en',
"en: { dumbbellAria:'Back to workout', setTitle:'Settings', themes:'Themes', darkThemes:'Dark themes', lightThemes:'Light themes', textures:'Textures', texHint:'Texture overlays on top of any theme — the same as in the main app. Pick an effect and fine-tune its opacity.', opacity:'Opacity', reset:'Reset', resetDone:'Returned to the effect default', applied:'Texture applied', share:'Share report', themeChanged:'Theme changed', wunitTitle:'Unit of weight', wunitKg:'Kilograms', wunitLb:'Pounds', wunitKgShort:'kg', wunitLbShort:'lb' },",
"en: { dumbbellAria:'Back to workout', setTitle:'Settings', themes:'Themes', darkThemes:'Dark themes', lightThemes:'Light themes', textures:'Textures', texHint:'Texture overlays on top of any theme — the same as in the main app. Pick an effect and fine-tune its opacity.', opacity:'Opacity', reset:'Reset', resetDone:'Returned to the effect default', applied:'Texture applied', share:'Share report', themeChanged:'Theme changed', wunitTitle:'Unit of weight', wunitKg:'Kilograms', wunitLb:'Pounds', wunitKgShort:'kg', wunitLbShort:'lb', wunitTime:'Time unit', wunitMin:'Minutes', wunitSec:'Seconds', wunitMinShort:'min', wunitSecShort:'sec', wunitDist:'Distance unit', wunitM:'Meters', wunitKm:'Kilometers', wunitMShort:'m', wunitKmShort:'km', wunitCardioTitle:'Cardio units', timeLabel:'Time', distLabel:'Distance', distShortLabel:'Dist' },", 1);

patch('client', 'C2b base dict labels',
"      prevLabel:'Пред.',weightLabel:'Вес',repsLabel:'Повт.',rpeLabel:'RPE',",
"      prevLabel:'Пред.',weightLabel:'Вес',repsLabel:'Повт.',rpeLabel:'RPE',timeLabel:'Время',distLabel:'Дистанция',distShortLabel:'Дист',", 1);
patch('client', 'C2c base dict labels en',
"      prevLabel:'Prev.',weightLabel:'Weight',repsLabel:'Reps',rpeLabel:'RPE',",
"      prevLabel:'Prev.',weightLabel:'Weight',repsLabel:'Reps',rpeLabel:'RPE',timeLabel:'Time',distLabel:'Distance',distShortLabel:'Dist',", 1);
patch('client', 'C2d base dict labels he',
"      prevLabel:'קודם',weightLabel:'משקל',repsLabel:'חזרות',rpeLabel:'RPE',",
"      prevLabel:'קודם',weightLabel:'משקל',repsLabel:'חזרות',rpeLabel:'RPE',timeLabel:'זמן',distLabel:'מרחק',distShortLabel:'מרחק',", 1);

patch('client', 'C3 dict he',
"he: { dumbbellAria:'חזרה לאימון', setTitle:'הגדרות', themes:'ערכות נושא', darkThemes:'ערכות כהות', lightThemes:'ערכות בהירות', textures:'טקסטורות', texHint:'שכבות מרקף מעל כל ערכת נושא — אותן טקסטורות כמו באפליקציה הראשית. בחרו אפקט וכוונו את העוצמה.', opacity:'עוצמה', reset:'איפוס', resetDone:'חזרה לעוצמת ברירת המחדל', applied:'הטקסטורה הוחלה', share:'שתף דוח', themeChanged:'ערכת הנושא הוחלפה', wunitTitle:'יחידת משקל', wunitKg:'קילוגרמים', wunitLb:'פאונד', wunitKgShort:'ק״ג', wunitLbShort:'lb' }",
"he: { dumbbellAria:'חזרה לאימון', setTitle:'הגדרות', themes:'ערכות נושא', darkThemes:'ערכות כהות', lightThemes:'ערכות בהירות', textures:'טקסטורות', texHint:'שכבות מרקף מעל כל ערכת נושא — אותן טקסטורות כמו באפליקציה הראשית. בחרו אפקט וכוונו את העוצמה.', opacity:'עוצמה', reset:'איפוס', resetDone:'חזרה לעוצמת ברירת המחדל', applied:'הטקסטורה הוחלה', share:'שתף דוח', themeChanged:'ערכת הנושא הוחלפה', wunitTitle:'יחידת משקל', wunitKg:'קילוגרמים', wunitLb:'פאונד', wunitKgShort:'ק״ג', wunitLbShort:'lb', wunitTime:'יחידת זמן', wunitMin:'דקות', wunitSec:'שניות', wunitMinShort:'דק׳', wunitSecShort:'שנ׳', wunitDist:'יחידת מרחק', wunitM:'מטרים', wunitKm:'קילומטרים', wunitMShort:'מט', wunitKmShort:'ק״מ', wunitCardioTitle:'יחידות קרדיו', timeLabel:'זמן', distLabel:'מרחק', distShortLabel:'מרחק' }", 1);

/* C4: portal cardio-units + cloud sync module (cu* prefix to avoid collisions) */
patch('client', 'C4 portal c88 module',
`    window.dkWUnitApply = wApply;

    /* ---- dumbbell: one-tap return to the workout (portal variant of c83) ---- */`,
`    window.dkWUnitApply = wApply;

    /* ===== c88: time & distance units for cardio + ONE cloud-synced units doc ===== */
    var CU_TKEY = 'dk_tunit', CU_DKEY = 'dk_dunit', CU_TSKEY = 'dk_units_ts', CU_DOC = 'ps_units_global_v1';
    function cuTGet() { try { return localStorage.getItem(CU_TKEY) === 'sec' ? 'sec' : 'min'; } catch (e) { return 'min'; } }
    function cuDGet() { try { return localStorage.getItem(CU_DKEY) === 'km' ? 'km' : 'm'; } catch (e) { return 'm'; } }
    function cuTShort(u) { if (u == null) u = cuTGet(); return T(u === 'sec' ? 'wunitSecShort' : 'wunitMinShort') || (u === 'sec' ? 'сек' : 'мин'); }
    function cuDShort(u) { if (u == null) u = cuDGet(); return T(u === 'km' ? 'wunitKmShort' : 'wunitMShort') || (u === 'km' ? 'км' : 'м'); }
    function cuApply() {
      var tTitle = T('wunitTime') || 'Time unit', dTitle = T('wunitDist') || 'Distance unit';
      document.querySelectorAll('[data-tunit-col]').forEach(function (el) {
        el.textContent = (el.getAttribute('data-tunit-base') || '') + ' · ' + cuTShort();
        el.title = tTitle;
      });
      document.querySelectorAll('[data-dunit-col]').forEach(function (el) {
        el.textContent = (el.getAttribute('data-dunit-base') || '') + ' · ' + cuDShort();
        el.title = dTitle;
      });
    }
    function cuEnsureSheet() {
      if (document.getElementById('dk-cunit-sheet')) return;
      var wrap = document.createElement('div');
      wrap.id = 'dk-cunit-sheet';
      wrap.className = 'hidden fixed inset-0 z-[95] flex items-center justify-center p-4';
      wrap.innerHTML =
        '<div class="absolute inset-0 bg-black/60 backdrop-blur-sm" data-cunit-backdrop></div>' +
        '<div class="relative w-full max-w-xs rounded-2xl border border-border bg-[rgb(var(--c-surface))] shadow-float p-4 space-y-3" role="dialog" aria-modal="true">' +
          '<div class="text-[10px] font-bold uppercase tracking-wider text-muted" data-cunit-title></div>' +
          '<div class="text-[10px] font-semibold text-muted" data-cunit-sub="t"></div>' +
          '<div class="grid grid-cols-2 gap-2">' +
            '<button type="button" data-cunit-t="min" class="wunit-opt rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm font-bold text-text transition"><span data-cunit-t-label="min"></span></button>' +
            '<button type="button" data-cunit-t="sec" class="wunit-opt rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm font-bold text-text transition"><span data-cunit-t-label="sec"></span></button>' +
          '</div>' +
          '<div class="text-[10px] font-semibold text-muted" data-cunit-sub="d"></div>' +
          '<div class="grid grid-cols-2 gap-2">' +
            '<button type="button" data-cunit-d="m" class="wunit-opt rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm font-bold text-text transition"><span data-cunit-d-label="m"></span></button>' +
            '<button type="button" data-cunit-d="km" class="wunit-opt rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm font-bold text-text transition"><span data-cunit-d-label="km"></span></button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(wrap);
    }
    function cuRefreshSheet() {
      var sheet = document.getElementById('dk-cunit-sheet');
      if (!sheet) return;
      var tt = sheet.querySelector('[data-cunit-title]');
      if (tt) tt.textContent = T('wunitCardioTitle') || 'Cardio units';
      var st = sheet.querySelector('[data-cunit-sub="t"]');
      if (st) st.textContent = T('wunitTime') || 'Time';
      var sd = sheet.querySelector('[data-cunit-sub="d"]');
      if (sd) sd.textContent = T('wunitDist') || 'Distance';
      [['t', 'min'], ['t', 'sec'], ['d', 'm'], ['d', 'km']].forEach(function (pair) {
        var k = pair[0], u = pair[1];
        var btn = sheet.querySelector('[data-cunit-' + k + '="' + u + '"]');
        if (!btn) return;
        var lab = btn.querySelector('[data-cunit-' + k + '-label="' + u + '"]');
        if (lab) lab.textContent = (k === 't' ? cuTShort(u) : cuDShort(u));
        var on = (k === 't' ? cuTGet() : cuDGet()) === u;
        btn.classList.toggle('wunit-opt-active', on);
      });
    }
    function cuOpen() {
      cuEnsureSheet();
      cuRefreshSheet();
      document.getElementById('dk-cunit-sheet').classList.remove('hidden');
    }
    function cuClose() {
      var sh = document.getElementById('dk-cunit-sheet');
      if (sh) sh.classList.add('hidden');
    }
    function cuTSet(u) {
      try { localStorage.setItem(CU_TKEY, u === 'sec' ? 'sec' : 'min'); } catch (e) {}
      wApply();
      cuRefreshSheet();
      cuPush();
    }
    function cuDSet(u) {
      try { localStorage.setItem(CU_DKEY, u === 'km' ? 'km' : 'm'); } catch (e) {}
      wApply();
      cuRefreshSheet();
      cuPush();
    }
    /* one cloud doc for BOTH apps: write on change, watch for live propagation */
    function cuPush() {
      try {
        var ts = Date.now();
        try { localStorage.setItem(CU_TSKEY, String(ts)); } catch (e) {}
        var payload = JSON.stringify({ w: wGet(), t: cuTGet(), d: cuDGet() });
        ensureFirebaseLite().then(function () {
          if (!firebase.apps.length) firebase.initializeApp(CLOUD_CFG);
          return firebase.firestore().collection('portal_shares').doc(CU_DOC).set({ d: payload, v: 2, ts: ts });
        }).catch(function (e) {});
      } catch (e) {}
    }
    function cuApplyRemote(data) {
      if (!data || !data.d || !data.ts) return;
      var local = 0;
      try { local = Number(localStorage.getItem(CU_TSKEY) || 0); } catch (e) {}
      if (Number(data.ts) <= local) return;
      try {
        var u = JSON.parse(data.d);
        if (u.w) { try { localStorage.setItem(WKEY, u.w === 'lb' ? 'lb' : 'kg'); } catch (e) {} }
        if (u.t) { try { localStorage.setItem(CU_TKEY, u.t === 'sec' ? 'sec' : 'min'); } catch (e) {} }
        if (u.d) { try { localStorage.setItem(CU_DKEY, u.d === 'km' ? 'km' : 'm'); } catch (e) {} }
        try { localStorage.setItem(CU_TSKEY, String(Number(data.ts))); } catch (e) {}
        wApply();
      } catch (e) {}
    }
    function cuSync(watch) {
      ensureFirebaseLite().then(function () {
        if (!firebase.apps.length) firebase.initializeApp(CLOUD_CFG);
        var ref = firebase.firestore().collection('portal_shares').doc(CU_DOC);
        if (watch && ref.onSnapshot) {
          ref.onSnapshot(function (snap) { try { cuApplyRemote(snap && snap.exists ? snap.data() : null); } catch (e) {} }, function (e) {});
        } else {
          ref.get({ source: 'server' }).then(function (snap) { cuApplyRemote(snap && snap.exists ? snap.data() : null); }).catch(function (e) {});
        }
      }).catch(function (e) {});
    }
    try { cuSync(true); } catch (e) {}
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-cunit-backdrop]')) { cuClose(); return; }
      var tp = e.target.closest('[data-cunit-t]');
      if (tp) { cuTSet(tp.getAttribute('data-cunit-t')); return; }
      var dp = e.target.closest('[data-cunit-d]');
      if (dp) { cuDSet(dp.getAttribute('data-cunit-d')); return; }
      if (e.target.closest('[data-tunit-col],[data-dunit-col]')) { cuOpen(); return; }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cuClose(); });

    /* ---- dumbbell: one-tap return to the workout (portal variant of c83) ---- */`, 1);

/* C5: wApply extends to cardio columns */
patch('client', 'C5 wApply extend',
`      document.querySelectorAll('[data-wunit-col]').forEach(function (el) {
        var base = el.getAttribute('data-wunit-base') || '';
        el.textContent = (base && base.toLowerCase() !== sh.toLowerCase()) ? base + ' · ' + sh : base;
        el.title = wTitle;
      });
    }`,
`      document.querySelectorAll('[data-wunit-col]').forEach(function (el) {
        var base = el.getAttribute('data-wunit-base') || '';
        el.textContent = (base && base.toLowerCase() !== sh.toLowerCase()) ? base + ' · ' + sh : base;
        el.title = wTitle;
      });
      try { cuApply(); } catch (e) {}
    }`, 1);

/* C6: wSet pushes to cloud */
patch('client', 'C6 wSet push',
`    function wSet(u) {
      if (u !== 'lb') u = 'kg';
      try { localStorage.setItem(WKEY, u); } catch (e) {}
      wApply();
      wClose();
    }`,
`    function wSet(u) {
      if (u !== 'lb') u = 'kg';
      try { localStorage.setItem(WKEY, u); } catch (e) {}
      wApply();
      wClose();
      cuPush();
    }`, 1);

/* C7: renderExercises — cardio flag */
patch('client', 'C7 isCardioEx',
`      const groupLabel = exData ? (exData['group_'+lang] || exData.group_en || ex.group || '') : (ex.group || '');
      const liveEx = sess ? (sess.exercises||[])[ei] : null;`,
`      const groupLabel = exData ? (exData['group_'+lang] || exData.group_en || ex.group || '') : (ex.group || '');
      const isCardioEx = (ex.cardio === true) || !!(exData && exData.category === 'cardio'); /* c88 */
      const liveEx = sess ? (sess.exercises||[])[ei] : null;`, 1);

/* C8: portal header row — cardio columns */
patch('client', 'C8 header row',
`          <span>#</span><span class="text-center">\${esc(t('prevLabel'))}</span><span class="text-center" data-wunit-col data-wunit-base="\${esc(t('weightLabel'))}">\${esc(t('weightLabel'))}</span><span></span><span class="text-center">\${esc(t('repsLabel'))}</span><span class="text-center">✓</span><span></span><span></span>`,
`          <span>#</span><span class="text-center">\${esc(t('prevLabel'))}</span>\${isCardioEx ? \`<span class="text-center" data-tunit-col data-tunit-base="\${esc(t('timeLabel'))}">\${esc(t('timeLabel'))}</span><span></span><span class="text-center" data-dunit-col data-dunit-base="\${esc(t('distShortLabel'))}">\${esc(t('distShortLabel'))}</span>\` : \`<span class="text-center" data-wunit-col data-wunit-base="\${esc(t('weightLabel'))}">\${esc(t('weightLabel'))}</span><span></span><span class="text-center">\${esc(t('repsLabel'))}</span>\`}<span class="text-center">✓</span><span></span><span></span>`, 1);

/* C9: set volume dash for cardio */
patch('client', 'C9 setVol',
`        const setVol = Math.round((Number(s.weight)||0) * (Number(s.reps)||0));`,
`        const setVol = isCardioEx ? '—' : Math.round((Number(s.weight)||0) * (Number(s.reps)||0));`, 1);

/* C10: set row — time/dist inputs for cardio */
patch('client', 'C10 row inputs',
`          <input type="number" step="0.5" inputmode="decimal" value="\${s.weight!=null?Number(s.weight):''}" \${dis} data-field="weight" data-ex="\${ei}" data-si="\${si}" class="set-input" placeholder="0" />
          <span class="text-[9px] text-muted text-center">×</span>
          <input type="number" step="1" inputmode="numeric" value="\${s.type==='amrap'?'':(s.reps!=null?Number(s.reps):'')}" \${dis} data-field="reps" data-ex="\${ei}" data-si="\${si}" class="set-input" placeholder="\${s.type==='amrap'?'∞':'0'}" />`,
`          \${isCardioEx
            ? \`<input type="number" step="0.5" inputmode="decimal" value="\${s.time!=null?Number(s.time):''}" \${dis} data-field="time" data-ex="\${ei}" data-si="\${si}" class="set-input" placeholder="0" />
          <span class="text-[9px] text-muted text-center">/</span>
          <input type="number" step="0.5" inputmode="decimal" value="\${s.dist!=null?Number(s.dist):''}" \${dis} data-field="dist" data-ex="\${ei}" data-si="\${si}" class="set-input" placeholder="0" />\`
            : \`<input type="number" step="0.5" inputmode="decimal" value="\${s.weight!=null?Number(s.weight):''}" \${dis} data-field="weight" data-ex="\${ei}" data-si="\${si}" class="set-input" placeholder="0" />
          <span class="text-[9px] text-muted text-center">×</span>
          <input type="number" step="1" inputmode="numeric" value="\${s.type==='amrap'?'':(s.reps!=null?Number(s.reps):'')}" \${dis} data-field="reps" data-ex="\${ei}" data-si="\${si}" class="set-input" placeholder="\${s.type==='amrap'?'∞':'0'}" />\`}`, 1);

/* C11: input handler — time/dist fields */
patch('client', 'C11 input handler',
`        if (f === 'weight') set.weight = v === '' ? null : parseFloat(v);
        else if (f === 'reps') set.reps = v === '' ? null : parseInt(v,10);
        else set.rpe = v === '' ? null : parseFloat(v);`,
`        if (f === 'weight') set.weight = v === '' ? null : parseFloat(v);
        else if (f === 'reps') set.reps = v === '' ? null : parseInt(v,10);
        else if (f === 'time') set.time = v === '' ? null : parseFloat(v);
        else if (f === 'dist') set.dist = v === '' ? null : parseFloat(v);
        else set.rpe = v === '' ? null : parseFloat(v);`, 1);

/* C12: exercise-card tap delegation must not open the card from the cardio unit labels */
patch('client', 'C12 exList exclusion',
`        if(e.target.closest('[data-wunit-col],[data-wunit-chip]')) return;`,
`        if(e.target.closest('[data-wunit-col],[data-wunit-chip],[data-tunit-col],[data-dunit-col]')) return;`, 1);

/* ============ 3. recover.html hardening ============ */
patch('recover', 'R1 skip service docs',
`    }).then(function (snap) {
      if (!snap || !snap.exists) return null;
      var data = snap.data() || {};
      if (!data.d) return null;
      return b64uDecode(data.d);
    });`,
`    }).then(function (snap) {
      if (!snap || !snap.exists) return null;
      var data = snap.data() || {};
      /* c88: skip service docs (units sync) — only real encrypted share blobs */
      if (!data.d || typeof data.d !== 'string' || data.d.length < 64) return null;
      try { return b64uDecode(data.d); } catch (e) { return null; }
    });`, 1);

/* ============ 4. sw.js version ============ */
patch('sw', 'S1 cache v115',
"const CACHE_NAME = 'dk-gym-v114'; //",
"// v115: c88 — cardio units: the cardio columns of a live workout (Время/Дистанция) open ONE unit sheet (minutes<->seconds, meters<->kilometers) in BOTH apps; a Category select in the custom exercise form marks cardio exercises; ALL units (weight + time + distance) now live in ONE cloud doc (portal_shares/ps_units_global_v1) — change in one app, both change\nconst CACHE_NAME = 'dk-gym-v115'; //", 1);

/* ============ 5. i18n JSONs ============ */
const I18N_ADD = {
  ru: { time: 'Единица времени', min: 'Минуты', sec: 'Секунды', minShort: 'мин', secShort: 'сек',
        dist: 'Единица расстояния', m: 'Метры', km: 'Километры', mShort: 'м', kmShort: 'км',
        cardioTitle: 'Единицы кардио' },
  en: { time: 'Time unit', min: 'Minutes', sec: 'Seconds', minShort: 'min', secShort: 'sec',
        dist: 'Distance unit', m: 'Meters', km: 'Kilometers', mShort: 'm', kmShort: 'km',
        cardioTitle: 'Cardio units' },
  he: { time: 'יחידת זמן', min: 'דקות', sec: 'שניות', minShort: 'דק׳', secShort: 'שנ׳',
        dist: 'יחידת מרחק', m: 'מטרים', km: 'קילומטרים', mShort: 'מט', kmShort: 'ק״מ',
        cardioTitle: 'יחידות קרדיו' },
};
const W_ADD = { ru: { time: 'Время', dist: 'Дистанция' }, en: { time: 'Time', dist: 'Distance' }, he: { time: 'זמן', dist: 'מרחק' } };
const EX_ADD = { ru: { category: 'Категория', categoryCardio: 'Кардио' }, en: { category: 'Category', categoryCardio: 'Cardio' }, he: { category: 'קטגוריה', categoryCardio: 'קרדיו' } };

[['i18nRu', 'ru'], ['i18nEn', 'en'], ['i18nHe', 'he']].forEach(function (pair) {
  const key = pair[0], lang = pair[1];
  const p = FILES[key];
  let json;
  try { json = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { failures.push(`[${key}] JSON parse failed: ` + e.message); return; }
  json.wunit = Object.assign({}, json.wunit || {}, I18N_ADD[lang]);
  json.workouts = Object.assign({}, json.workouts || {}, W_ADD[lang]);
  json.exercise = Object.assign({}, json.exercise || {}, EX_ADD[lang]);
  fs.writeFileSync(p, JSON.stringify(json, null, 2) + '\n');
  console.log(`  ok [${key}] i18n extended`);
});

/* ============ sanity ============ */
console.log('\nsanity:');
function expectIn(fileKey, substr, min, max) {
  const src = fs.readFileSync(FILES[fileKey], 'utf8');
  let idx = 0, n = 0;
  while ((idx = src.indexOf(substr, idx)) !== -1) { n++; idx += substr.length; }
  const ok = n >= min && (max == null || n <= max);
  if (!ok) failures.push(`sanity [${fileKey}] "${substr}" count=${n} expected ${min}..${max == null ? '∞' : max}`);
  else console.log(`  ok [${fileKey}] "${substr}" x${n}`);
}
expectIn('crm', 'ps_units_global_v1', 2, 2);
expectIn('crm', 'dk-cunit-sheet', 4, 6);
expectIn('crm', 'data-tunit-col', 2, 4);
expectIn('crm', 'data-dunit-col', 2, 4);
expectIn('crm', "exIsCardio(", 4, 8);
expectIn('crm', "category: ex.category || ''", 1, 1);
expectIn('client', 'ps_units_global_v1', 1, 2);
expectIn('client', 'data-tunit-col', 2, 4);
expectIn('client', "isCardioEx", 4, 8);
expectIn('recover', "data.d.length < 64", 1, 1);
expectIn('sw', 'v115', 2, 2);

/* inline <script> syntax check (crm + client) */
['crm', 'client'].forEach(function (fileKey) {
  const src = fs.readFileSync(FILES[fileKey], 'utf8');
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let m, i = 0, bad = 0;
  while ((m = re.exec(src)) !== null) {
    i++;
    try { new vm.Script(m[1], { filename: fileKey + '-inline-' + i }); }
    catch (e) { bad++; failures.push(`syntax [${fileKey}] inline block #${i}: ` + e.message); }
  }
  console.log(`  checked [${fileKey}] ${i} inline blocks, ${bad} bad`);
});

if (failures.length) {
  console.error('\nFAILED:\n' + failures.map(f => '  - ' + f).join('\n'));
  process.exit(1);
}
console.log('\nALL PATCHES APPLIED OK');
