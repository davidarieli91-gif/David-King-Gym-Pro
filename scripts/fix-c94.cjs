#!/usr/bin/env node
/* c94 — three problems, one release:
 *   A) PROFILE CLOBBER: saveNow() pushed a FULL local dump with no fence — a
 *      stale device (phone) auto-synced and replaced the newer cloud dump with
 *      its old copy; every fresher device then silently restored the stale dump
 *      and the freshly created profile «אסי בורג» vanished everywhere (second
 *      occurrence; «אור וינקלר» was c87). FIX: cloud-newer FENCE — a save is
 *      only allowed from a device whose last COMPLETED save/restore (LASTSYNC)
 *      has seen the current cloud generation; otherwise refuse + conflict
 *      banner. The explicit settings «Save to cloud» button forces (trainer's
 *      deliberate choice, as promised by the banner text).
 *   B) PORTAL ANALYTICS: c93 only mirrored NEW workouts into the shared
 *      ps_hist doc — the trainer's PAST history never reached the portal, so
 *      «Объём по группам мышц» still showed one bar while the CRM showed all.
 *      FIX: dkSyncClientHistory backfills the FULL local history (cap 200,
 *      was 60) on analytics render, live-save and portal-share generation.
 *   C) RECOVERY: recover.html can now restore from the trainer's OWN cloud
 *      account dump (Google sign-in → users/{uid} → per-store parts) with
 *      original ids + history, and tries the on-device portal session blob
 *      before the cloud share docs. Plus: portal picks up new releases
 *      immediately (controllerchange → reload/banner).
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const CRM = path.join(ROOT, 'fitness-crm.html');
const CLI = path.join(ROOT, 'client.html');
const REC = path.join(ROOT, 'recover.html');
const SW = path.join(ROOT, 'sw.js');

let fails = [];
function must(cond, msg) { if (!cond) { fails.push(msg); console.error('FAIL', msg); } else console.log('ok  ', msg); }

function repOnce(file, label, from, to) {
  let s = fs.readFileSync(file, 'utf8');
  const n = s.split(from).length - 1;
  if (n !== 1) { fails.push(label + ': anchor count ' + n + ' (expected 1)'); console.error('FAIL', label, 'anchor x' + n); return s; }
  s = s.replace(from, to);
  fs.writeFileSync(file, s);
  console.log('ok  ', label);
  return s;
}

/* ================= fitness-crm.html ================= */
let crm = fs.readFileSync(CRM, 'utf8');

/* A) saveNow gains opts + the clobber fence */
crm = repOnce(CRM, 'saveNow signature', '    async function saveNow() {', '    async function saveNow(opts) {');

const fenceAnchor = "        _saveStep = 'read-local-db';";
const fenceCode = `        /* c94 CLOBBER FENCE: never overwrite cloud data this device has not
         * seen. The stale-device disaster (profile «אסי בורג» destroyed
         * 2026-09-16): device B (stale) auto-synced and replaced the whole
         * cloud dump with its old copy; every fresher device then silently
         * restored the stale dump — the new profile vanished everywhere.
         * A save is only allowed from a device whose last COMPLETED
         * save/restore (LASTSYNC) has seen the current cloud generation;
         * otherwise the conflict banner appears and the trainer decides. */
        if (!opts || !opts.force) {
          var _lastOk94 = 0;
          try { var _lr94 = await db.get('settings', LASTSYNC_KEY); _lastOk94 = (_lr94 && _lr94.value) || 0; } catch (eL94) {}
          if (prev && prev.updated_at && Number(prev.updated_at) > _lastOk94 + 1500) {
            log('cloud-newer fence: cloud.updated_at', prev.updated_at, '> last completed sync', _lastOk94, '— refusing to overwrite unseen cloud data');
            try { var cf94 = $('cloud-conflict'); if (cf94) cf94.classList.remove('hidden'); } catch (eF94) {}
            toastMsg(T('settings.cloudAccStale') || 'Cloud was updated from another device — upload cancelled so newer data is not overwritten. Use «Restore from cloud» to load it, or «Save to cloud» again to overwrite with this device.', 'warning', 10000);
            return { ok: false, error: 'cloud_newer' };
          }
        }
        _saveStep = 'read-local-db';`;
crm = repOnce(CRM, 'clobber fence', fenceAnchor, fenceCode);

crm = repOnce(CRM, 'markDirty quiet on cloud_newer',
  `          if (_user && _autosync && _fs && Object.keys(_dirty).length && !_busy) {
            saveNow().then(function (r) { if (r && !r.ok && r.error !== 'busy') errMsg(r.error); }).catch(function () {});
          }`,
  `          if (_user && _autosync && _fs && Object.keys(_dirty).length && !_busy) {
            saveNow().then(function (r) { if (r && !r.ok && r.error !== 'busy' && r.error !== 'cloud_newer') errMsg(r.error); }).catch(function () {});
          }`);

crm = repOnce(CRM, 'settings Save forces the fence',
  `          bSave.disabled = true;
          var r = await saveNow();`,
  `          bSave.disabled = true;
          var r = await saveNow({ force: true });`);

/* B) full-history backfill */
crm = repOnce(CRM, 'push cap 60 → 200',
  "        await ref.set({ d: JSON.stringify({ recs: recs.slice(-60) }), v: 2, ts: Date.now() });",
  "        await ref.set({ d: JSON.stringify({ recs: recs.slice(-200) }), v: 2, ts: Date.now() });");

crm = repOnce(CRM, 'dkSyncClientHistory module',
  `      } catch (e) { console.warn('[hist-sync] CRM fetch failed', e); return []; }
    };`,
  `      } catch (e) { console.warn('[hist-sync] CRM fetch failed', e); return []; }
    };

    /* c94: convert a CRM workout_history record to the portal schema */
    function crmToPortalRec94(record) {
      try {
        if (!record) return null;
        const ts = Number(record.date || record.created_at || 0);
        if (!(ts > 0)) return null;
        const exs = Array.isArray(record.exercises) ? record.exercises : [];
        const doneSets = exs.reduce((s, ex) => s + (ex.sets || []).filter(x => x && x.done).length, 0);
        const totSets = exs.reduce((s, ex) => s + (ex.sets || []).length, 0);
        return {
          ts: ts,
          date: new Date(ts).toISOString().slice(0, 10),
          program: record.name || '',
          day_letter: '', day_index: -1,
          duration_sec: record.duration || 0,
          volume: record.total_volume || exs.reduce((s, ex) => s + (ex.sets || []).reduce((ss, st) => ss + (Number(st.weight) || 0) * (Number(st.reps) || 0), 0), 0),
          done_sets: doneSets, total_sets: totSets,
          exercises: exs.map(ex => ({
            key: ex.exercise_id,
            name: ex.name,
            group: ex.group || ex.muscle_group || '',
            sets: (ex.sets || []).map(s => ({ weight: s.weight || 0, reps: s.reps || 0, time: s.time != null ? s.time : null, dist: s.dist != null ? s.dist : null, rpe: s.rpe || null, type: s.type || 'normal', done: !!s.done }))
          }))
        };
      } catch (e) { return null; }
    }

    /* c94 BACKFILL: push the FULL local history of a client into the shared
     * cloud doc (portal_shares/ps_hist_<hash>), deduping by ts. c93 only
     * mirrored NEW workouts, so the portal never saw the trainer's past
     * sessions and «Объём по группам мышц» showed one bar. Cap 200. */
    window.dkSyncClientHistory = async function (clientId, crmRecs) {
      try {
        if (!clientId || !Array.isArray(crmRecs) || !crmRecs.length) return false;
        const recs = crmRecs.map(crmToPortalRec94).filter(Boolean);
        if (!recs.length) return false;
        const docId = await portalHistoryDocId(clientId);
        await ensurePortalFirebase();
        if (!firebase.apps.length) firebase.initializeApp(PORTAL_SHARE_CFG);
        const ref = firebase.firestore().collection('portal_shares').doc(docId);
        let remote = [];
        try {
          const snap = await Promise.race([
            ref.get({ source: 'server' }),
            new Promise(res => setTimeout(() => res(null), 5000))
          ]);
          if (snap && snap.exists) {
            const data = snap.data() || {};
            if (data.d) { const p = JSON.parse(data.d); if (Array.isArray(p.recs)) remote = p.recs; }
          }
        } catch (_) {}
        const seen = new Set(remote.map(r => Number(r && r.ts) || 0));
        const add = recs.filter(r => !seen.has(Number(r.ts) || 0));
        if (!add.length) return true; /* cloud already has everything */
        const merged = remote.concat(add).sort((a, b) => (a.ts || 0) - (b.ts || 0));
        await ref.set({ d: JSON.stringify({ recs: merged.slice(-200) }), v: 2, ts: Date.now() });
        console.info('[hist-sync] backfilled ' + add.length + '/' + recs.length + ' workout(s) for client ' + clientId);
        return true;
      } catch (e) { console.warn('[hist-sync] CRM backfill failed', e); return false; }
    };`);

crm = repOnce(CRM, 'analytics render backfill',
  `      let workoutsAll = workouts;`,
  `      /* c94: backfill ALL local history for this client into the shared
         cloud doc so the trainee's portal sees the trainer's past sessions */
      try {
        if (typeof window.dkSyncClientHistory === 'function' && workouts && workouts.length) {
          await Promise.race([
            window.dkSyncClientHistory(_clientId, workouts),
            new Promise(res => setTimeout(res, 4000))
          ]);
        }
      } catch (_) {}
      let workoutsAll = workouts;`);

crm = repOnce(CRM, 'live-save full backfill',
  `        /* c93: mirror the finished workout into the shared cloud history doc
           so the trainee's portal analytics shows this session too */
        try {
          if (typeof window.dkPushClientHistory === 'function') {
            const doneSets = record.exercises.reduce((s, ex) => s + (ex.sets || []).filter(x => x.done).length, 0);
            const totSets = record.exercises.reduce((s, ex) => s + (ex.sets || []).length, 0);
            window.dkPushClientHistory(record.client_id, {
              ts: record.date,
              date: new Date(record.date).toISOString().slice(0, 10),
              program: record.name || '',
              day_letter: '', day_index: -1,
              duration_sec: record.duration || 0,
              volume: record.total_volume || 0,
              done_sets: doneSets, total_sets: totSets,
              exercises: record.exercises.map(ex => ({
                key: ex.exercise_id,
                name: ex.name,
                group: ex.group || ex.muscle_group || '',
                sets: (ex.sets || []).map(s => ({ weight: s.weight || 0, reps: s.reps || 0, time: s.time != null ? s.time : null, dist: s.dist != null ? s.dist : null, rpe: s.rpe || null, type: s.type || 'normal', done: !!s.done }))
              }))
            });
          }
        } catch (_) {}`,
  `        /* c94: backfill the FULL local history of this client into the shared
           cloud doc (subsumes the c93 single-record mirror) */
        try {
          if (typeof window.dkSyncClientHistory === 'function') {
            const all94 = await db.find('workout_history', 'by_clientId', record.client_id);
            if (all94 && all94.length && !all94.some(w => Number(w.date || w.created_at) === Number(record.date))) all94.push(record);
            await Promise.race([
              window.dkSyncClientHistory(record.client_id, all94),
              new Promise(res => setTimeout(res, 6000))
            ]);
          }
        } catch (_) {}`);

crm = repOnce(CRM, 'portal-share generation backfill',
  `          const shareId = await portalShareId(clientId);
          await uploadPortalShare(shareId, b64uEncode(blob));
          clientUrl = \`\${origin}client.html#c=\${shareId}\`;`,
  `          const shareId = await portalShareId(clientId);
          await uploadPortalShare(shareId, b64uEncode(blob));
          clientUrl = \`\${origin}client.html#c=\${shareId}\`;
          /* c94: give the freshly generated portal the trainer's past workouts
             too — «Объём по группам мышц» identical from minute one */
          try {
            const _h94 = await db.find('workout_history', 'by_clientId', clientId);
            if (_h94 && _h94.length && typeof window.dkSyncClientHistory === 'function') {
              window.dkSyncClientHistory(clientId, _h94);
            }
          } catch (_) {}`);

/* versions */
crm = repOnce(CRM, 'meta c93→c94', '<meta name="dk-build" content="c93" />', '<meta name="dk-build" content="c94" />');
crm = repOnce(CRM, 'RUNNING 93→94',
  '  var RUNNING = 93; /* numeric part of dk-build c93 */',
  '  var RUNNING = 94; /* numeric part of dk-build c94 */');
crm = repOnce(CRM, 'login tag c93→c94',
  '<p class="text-center text-[11px] text-muted mt-4">v<span id="login-version">—</span> · IndexedDB · 3 languages · c93</p>',
  '<p class="text-center text-[11px] text-muted mt-4">v<span id="login-version">—</span> · IndexedDB · 3 languages · c94</p>');

/* ================= client.html ================= */
repOnce(CLI, 'portal push cap 60 → 200',
  "        return ref.set({ d: JSON.stringify({ recs: recs.slice(-60) }), v: 2, ts: Date.now() });",
  "        return ref.set({ d: JSON.stringify({ recs: recs.slice(-200) }), v: 2, ts: Date.now() });");
repOnce(CLI, 'portal local history cap 60 → 200',
  "  function saveHistory(list) { localStorage.setItem('dk_workout_history', JSON.stringify(list.slice(-60))); }",
  "  function saveHistory(list) { localStorage.setItem('dk_workout_history', JSON.stringify(list.slice(-200))); }");
repOnce(CLI, 'portal sw update pickup',
  '  <link rel="manifest" href="manifest.json" />',
  `  <link rel="manifest" href="manifest.json" />
  <script>
  /* c94: the trainer app's service worker precaches this page too — when a
     new version activates, pick it up: auto-reload when no workout is in
     progress, otherwise offer a button (never destroy a live session). */
  (function () {
    try {
      if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;
      var done = false;
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (done) return; done = true;
        var draft = null;
        try { draft = localStorage.getItem('dk_live_draft'); } catch (e) {}
        var active = draft && draft !== 'null' && draft !== '{}' && draft !== '[]';
        if (!active) { try { if (!sessionStorage.getItem('dk_sw_rld')) { sessionStorage.setItem('dk_sw_rld', '1'); location.reload(); } } catch (e) {} return; }
        var b = document.createElement('button');
        b.textContent = '🔄 Доступна новая версия — обновить';
        b.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:calc(76px + env(safe-area-inset-bottom,0px));z-index:9999;background:#6366f1;color:#fff;border:0;border-radius:999px;padding:10px 18px;font:600 13px Inter,system-ui;box-shadow:0 8px 24px rgba(0,0,0,.4)';
        b.onclick = function () { location.reload(); };
        document.body.appendChild(b);
      });
    } catch (e) {}
  })();
  </script>`);

/* ================= recover.html ================= */
/* 1) try the on-device portal session blob first */
repOnce(REC, 'recover listLocalBlobs',
  '  /* ---- decrypt ---- */',
  `  /* c94: portal sessions cached on THIS device (client.html keeps the last
   * encrypted share blob in localStorage) — try them before the cloud docs */
  function listLocalBlobs() {
    var out = [];
    try {
      var cd = JSON.parse(localStorage.getItem('dk_client_data') || 'null');
      if (cd && cd.blob && typeof cd.blob === 'string' && cd.blob.length > 64) out.push(b64uDecode(cd.blob));
    } catch (e) {}
    return out;
  }

  /* ---- decrypt ---- */`);

/* 2) restoreWithCode tries local blobs + share docs */
repOnce(REC, 'recover restoreWithCode signature',
  '  function restoreWithCode(code, shareIds) {',
  '  function restoreWithCode(code, shareIds, localBlobs) {');
repOnce(REC, 'recover candidate chain',
  `    var chain = Promise.resolve();
    var payload = null;
    shareIds.forEach(function (id) {
      chain = chain.then(function () {
        if (payload) return;
        return fetchShareBlob(id).then(function (blob) {
          if (!blob) return;
          return decryptBlob(blob, code).then(function (p) {
            if (p && p.client) payload = p;
          }).catch(function () { /* wrong code for this doc — try next */ });
        });
      });
    });`,
  `    var chain = Promise.resolve();
    var payload = null;
    function tryDecryptBlob94(blob, label) {
      chain = chain.then(function () {
        if (payload || !blob) return;
        return decryptBlob(blob, code).then(function (p) {
          if (p && p.client) { payload = p; console.info('[recover] matched', label); }
        }).catch(function () { /* wrong code for this blob — try next */ });
      });
    }
    (localBlobs || []).forEach(function (b) { tryDecryptBlob94(b, 'local portal session'); });
    shareIds.forEach(function (id) {
      chain = chain.then(function () {
        if (payload) return;
        return fetchShareBlob(id).then(function (blob) { tryDecryptBlob94(blob, id); });
      });
    });`);

/* 3) plumb localBlobs through startRestore + dup-force wrapper */
repOnce(REC, 'recover startRestore signature',
  `  function startRestore(code, ids) {
    forceRestore = false;
    restoreWithCode(code, ids).then(finish).catch(function (e) {`,
  `  function startRestore(code, ids, localBlobs) {
    forceRestore = false;
    restoreWithCode(code, ids, localBlobs).then(finish).catch(function (e) {`);
repOnce(REC, 'recover dup-force retry passes blobs',
  `          forceRestore = true;
          startRestore(code, ids);`,
  `          forceRestore = true;
          startRestore(code, ids, lb);`);
repOnce(REC, 'recover btn-go passes local blobs',
  '      startRestore(code, ids);',
  '      startRestore(code, ids, listLocalBlobs());');
repOnce(REC, 'recover dup-force wrapper passes blobs',
  `  var _origRestore = restoreWithCode;
  restoreWithCode = function (code, ids) {
    return _origRestore(code, ids).then(function (res) {`,
  `  var _origRestore = restoreWithCode;
  restoreWithCode = function (code, ids, lb) {
    return _origRestore(code, ids, lb).then(function (res) {`);

/* 4) UI: mode button + cloud section */
repOnce(REC, 'recover mode button',
  `    <button class="btn" id="btn-go">Восстановить</button>
    <p class="msg err" id="err-code"></p>`,
  `    <button class="btn" id="btn-go">Восстановить</button>
    <p class="msg err" id="err-code"></p>
    <button class="btn ghost" id="btn-cloud-mode" style="margin-top:10px">☁️ Восстановить из облачного аккаунта</button>
    <div class="steps">Если профиль сохранялся в облачный аккаунт (Настройки → Online account), войдите через Google — здесь появятся все клиенты из облака, и любого можно вернуть вместе с историей.</div>`);
repOnce(REC, 'recover cloud section UI',
  `  <p class="msg" id="msg"></p>
</main>`,
  `  <!-- c94: restore from the trainer's own cloud account dump -->
  <section id="step-cloud" class="hidden">
    <button class="btn" id="btn-cloud-signin">Войти через Google</button>
    <p class="msg" id="cloud-msg"></p>
    <label class="chk" id="cloud-hist-row"><input type="checkbox" id="cloud-hist" checked /> <span>включая историю тренировок и питания</span></label>
    <div id="cloud-list" class="cloud-list"></div>
    <button class="btn ghost hidden" id="btn-cloud-back" style="margin-top:10px">← К восстановлению по коду</button>
  </section>

  <p class="msg" id="msg"></p>
</main>`);
repOnce(REC, 'recover cloud CSS',
  `  @keyframes sp { to { transform: rotate(360deg); } }`,
  `  @keyframes sp { to { transform: rotate(360deg); } }
  .chk { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: #9aa7b5; margin-top: 12px; }
  .chk input { accent-color: #f5b942; width: 15px; height: 15px; }
  .cloud-list { margin-top: 10px; max-height: 46vh; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; text-align: start; }
  .cloud-item { display: flex; align-items: center; justify-content: space-between; gap: 10px; background: rgba(0,0,0,.3); border: 1px solid rgba(255,255,255,.12); border-radius: 12px; padding: 10px 12px; }
  .cloud-item .ci-info { display: flex; flex-direction: column; min-width: 0; }
  .cloud-item .ci-info b { font-size: 14.5px; }
  .cloud-item .ci-info span { font-size: 11.5px; color: #9aa7b5; }
  .ci-btn { flex-shrink: 0; border: 0; border-radius: 10px; padding: 8px 12px; font-size: 12.5px; font-weight: 700; cursor: pointer; background: linear-gradient(135deg, #f5b942, #e08b1d); color: #1a1206; }
  .cloud-item.done { opacity: .65; }
  .cloud-item.done .ci-btn { background: rgba(127,227,160,.15); color: #7fe3a0; cursor: default; }`);

/* 5) cloud dump JS — sign in, list, merge-put with ORIGINAL ids */
repOnce(REC, 'recover cloud dump JS',
  `  /* duplicate → offer force */`,
  `  /* ===== c94: restore from the trainer's own cloud account dump ===== */
  var REF_STORES94 = ['exercise_base', 'food_database'];
  var _cloudDump = null;

  function ensureFirebaseAuth() {
    if (window.firebase && firebase.auth && firebase.firestore) return Promise.resolve();
    return ensureFirebase().then(function () {
      return loadScript('https://www.gstatic.com/firebasejs/' + FB_VER + '/firebase-auth-compat.js');
    });
  }
  function cloudSignIn() {
    return ensureFirebaseAuth().then(function () {
      if (!firebase.apps.length) firebase.initializeApp(CFG);
      var auth = firebase.auth();
      if (auth.currentUser) return auth.currentUser;
      return auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).then(function (cred) {
        return cred && cred.user ? cred.user : auth.currentUser;
      }).catch(function (e) {
        /* popup blocked / standalone PWA → redirect fallback */
        try { auth.signInWithRedirect(new firebase.auth.GoogleAuthProvider()); } catch (e2) {}
        throw e;
      });
    });
  }
  /* redirect return → auto-open the list */
  (function () {
    try {
      ensureFirebaseAuth().then(function () {
        if (!firebase.apps.length) firebase.initializeApp(CFG);
        return firebase.auth().getRedirectResult();
      }).then(function (r) {
        if (r && r.user) { show('step-cloud'); openCloudList(r.user); }
      }).catch(function () {});
    } catch (e) {}
  })();

  function fetchCloudDump(user) {
    var fs94 = firebase.firestore();
    var uRef = fs94.collection('users').doc(user.uid);
    return uRef.get().then(function (snap) {
      if (!snap || !snap.exists) throw { userMessage: true, text: 'Облачный аккаунт пуст — сначала сохраните данные в облаке из приложения (Настройки → «Save to cloud»).' };
      var meta = snap.data() || {};
      var parts = meta.store_parts || {};
      var stores = Object.keys(parts).filter(function (s) { return REF_STORES94.indexOf(s) === -1; });
      var out = {};
      return stores.reduce(function (pr, name) {
        return pr.then(function () {
          var info = parts[name] || {};
          var n = Number(info.n) || 0, h = info.h || '';
          if (!n || !h) { out[name] = []; return; }
          var col = uRef.collection('stores').doc(name).collection('parts');
          var gets = [];
          for (var p = 0; p < n; p++) gets.push(col.doc(h.slice(0, 24) + '_' + p).get());
          return Promise.all(gets).then(function (snaps) {
            var text = '';
            snaps.forEach(function (s) { if (s && s.exists) text += (s.data() || {}).data || ''; });
            try { out[name] = JSON.parse(text) || []; } catch (e) { out[name] = []; }
          });
        });
      }, Promise.resolve()).then(function () { return out; });
    });
  }

  function esc94(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function openCloudList(user) {
    var m = $('cloud-msg');
    m.className = 'msg';
    m.innerHTML = '<span class="spin"></span> Читаю облачную копию…';
    $('btn-cloud-signin').classList.add('hidden');
    fetchCloudDump(user).then(function (dump) {
      _cloudDump = dump;
      var clients = dump.clients || [];
      if (!clients.length) throw { userMessage: true, text: 'В облаке нет клиентов. Профиль, вероятно, не успел попасть в облако — попробуйте восстановление по коду доступа или сохранение с устройства, где он ещё есть.' };
      var programs = dump.client_programs || [];
      var plans = dump.nutrition_plans || [];
      var histN = (dump.workout_history || []).length + (dump.nutrition_history || []).length;
      var html = clients.map(function (c, i) {
        var np = programs.filter(function (p) { return p && p.client_id === c.id; }).length;
        var nn = plans.filter(function (p) { return p && p.client_id === c.id; }).length;
        var d = c.created_at ? new Date(c.created_at).toLocaleDateString() : '';
        return '<div class="cloud-item"><div class="ci-info"><b>' + esc94(c.full_name || 'Клиент') + '</b>' +
          '<span>' + (d ? esc94(d) + ' · ' : '') + 'программ: ' + np + ' · планов: ' + nn + '</span></div>' +
          '<button class="ci-btn" data-i="' + i + '">Вернуть</button></div>';
      }).join('');
      $('cloud-list').innerHTML = html;
      m.textContent = 'Найдено клиентов: ' + clients.length + (histN ? ' · записей истории в облаке: ' + histN : '');
      $('btn-cloud-back').classList.remove('hidden');
      Array.prototype.forEach.call(document.querySelectorAll('.cloud-item .ci-btn'), function (b) {
        b.addEventListener('click', function () { restoreFromDump94(Number(b.getAttribute('data-i')), b); });
      });
    }).catch(function (e) {
      m.className = 'msg err';
      m.textContent = (e && e.userMessage) ? e.text : 'Не удалось прочитать облако: ' + String((e && (e.code || e.message)) || e);
      $('btn-cloud-signin').classList.remove('hidden');
    });
  }

  function restoreFromDump94(i, btn) {
    if (!_cloudDump) return;
    var c = (_cloudDump.clients || [])[i];
    if (!c || !c.id) return;
    var m = $('cloud-msg');
    m.className = 'msg';
    m.innerHTML = '<span class="spin"></span> Возвращаю «' + esc94(c.full_name || 'Клиент') + '»…';
    var withHist = $('cloud-hist').checked;
    openDb().then(function (idb) {
      var names = ['clients', 'client_programs', 'nutrition_plans', 'workout_history', 'nutrition_history'];
      var stores = Array.from(idb.objectStoreNames);
      var use = names.filter(function (n) { return stores.indexOf(n) !== -1; });
      return new Promise(function (res, rej) {
        var tx = idb.transaction(use, 'readwrite');
        var st = {};
        use.forEach(function (n) { st[n] = tx.objectStore(n); });
        st.clients.put(c); /* ORIGINAL id — history links survive */
        var np = 0, nn = 0, nh = 0;
        (_cloudDump.client_programs || []).forEach(function (p) {
          if (p && p.client_id === c.id) { st.client_programs.put(p); np++; }
        });
        (_cloudDump.nutrition_plans || []).forEach(function (p) {
          if (p && p.client_id === c.id) { st.nutrition_plans.put(p); nn++; }
        });
        if (withHist) {
          ['workout_history', 'nutrition_history'].forEach(function (hn) {
            if (st[hn] && _cloudDump[hn]) {
              _cloudDump[hn].forEach(function (r) {
                if (r && r.client_id === c.id) { st[hn].put(r); nh++; }
              });
            }
          });
        }
        tx.oncomplete = function () { res({ np: np, nn: nn, nh: nh }); };
        tx.onerror = function () { rej(tx.error); };
        tx.onabort = function () { rej(tx.error || new Error('aborted')); };
      });
    }).then(function (r) {
      m.className = 'msg ok';
      m.textContent = '✓ «' + (c.full_name || 'Клиент') + '» возвращён: программ ' + r.np + ', планов ' + r.nn + (withHist ? ', записей истории ' + r.nh : '') + '. Откройте приложение — профиль на месте.';
      if (btn) { btn.textContent = '✓ Вернул'; var item = btn.closest('.cloud-item'); if (item) item.classList.add('done'); }
    }).catch(function (e) {
      m.className = 'msg err';
      m.textContent = 'Ошибка восстановления: ' + String((e && (e.code || e.message)) || e);
    });
  }

  $('btn-cloud-mode').addEventListener('click', function () { show('step-cloud'); say(''); });
  $('btn-cloud-back').addEventListener('click', function () {
    show('step-code');
    $('cloud-msg').textContent = '';
    $('cloud-list').innerHTML = '';
    $('btn-cloud-back').classList.add('hidden');
    $('btn-cloud-signin').classList.remove('hidden');
  });
  $('btn-cloud-signin').addEventListener('click', function () {
    var m = $('cloud-msg');
    m.className = 'msg';
    m.innerHTML = '<span class="spin"></span> Открываю окно Google…';
    cloudSignIn().then(function (u) {
      if (u) openCloudList(u);
    }).catch(function (e) {
      m.className = 'msg err';
      var s = String((e && (e.code || e.message)) || e);
      m.textContent = /popup|blocked/i.test(s) ? 'Окно Google заблокировано — разрешите всплывающие окна и повторите.' :
        /cancelled|closed/i.test(s) ? 'Вход отменён.' :
        /redirect/i.test(s) ? 'Перенаправляю на Google… после входа список появится автоматически.' :
        'Не удалось войти: ' + s;
    });
  });

  /* duplicate → offer force */`);

/* ================= sw.js ================= */
let sw = fs.readFileSync(SW, 'utf8');
if (!/const CACHE_NAME = 'dk-gym-v120';/.test(sw)) { fails.push('sw v120 anchor missing'); }
sw = sw.replace(/const CACHE_NAME = 'dk-gym-v120';[^\n]*/,
  "// v121: c94 — cloud-sync clobber fence (a stale device can no longer overwrite newer cloud data), portal analytics backfill (FULL trainer history → ps_hist doc, caps 60→200), recover.html cloud-account restore (Google sign-in, original ids + history) + on-device portal blob restore, portal picks up new releases via controllerchange\nconst CACHE_NAME = 'dk-gym-v121'; // c94");
fs.writeFileSync(SW, sw);
must(/const CACHE_NAME = 'dk-gym-v121';/.test(sw) && !/'dk-gym-v120'/.test(sw), 'sw CACHE_NAME v120 → v121');

/* ================= sanity ================= */
must(crm.includes('var RUNNING = 94;') && (crm.match(/var RUNNING = 94;/g) || []).length === 1, 'crm RUNNING 94 ×1');
must(crm.includes('content="c94"') && (crm.match(/name="dk-build" content="c94"/g) || []).length === 1, 'crm meta c94 ×1');
must(crm.includes('async function saveNow(opts)'), 'crm saveNow(opts)');
must(crm.includes("error: 'cloud_newer'"), 'crm fence returns cloud_newer');
must((crm.match(/saveNow\(\{ force: true \}\)/g) || []).length === 1, 'crm forced save ×1');
must(crm.includes('window.dkSyncClientHistory'), 'crm dkSyncClientHistory');
must(crm.includes('crmToPortalRec94'), 'crm crmToPortalRec94');
must(!crm.includes('recs.slice(-60)'), 'crm no 60-cap left');
must(!crm.includes('«אסי בורג» уничтожен'), 'sanity');
must(fs.readFileSync(CLI, 'utf8').includes("JSON.stringify(list.slice(-200))"), 'client saveHistory 200');
must(!fs.readFileSync(CLI, 'utf8').includes('slice(-60)'), 'client no 60-cap left');
must(fs.readFileSync(REC, 'utf8').includes('restoreFromDump94'), 'recover cloud restore present');

if (fails.length) { console.error('\n' + fails.length + ' FAILURE(S)'); process.exit(1); }
console.log('\nALL c94 PATCHES OK');
