#!/usr/bin/env node
/* ============================================================================
 * fix-c93.cjs — «Объём по группам мышц» identical + interconnected (CRM ↔ portal)
 *
 * USER REQUEST: «Объём по группам мышц вообще разный, я хочу чтобы было как
 * в аналитике слева по скриншоту идентичны и взаимосвязаны».
 *
 * Screenshot: trainer CRM showed Ноги 2352 / Грудь 1280 / Спина 763 …
 * (kg·reps) while the trainee portal showed a single «Другое 200 кг» bar.
 * TWO root causes:
 *   1) DIFFERENT FORMULA: the portal bars summed DONE sets only
 *      (exDoneVolume) in «кг»; the CRM bars sum ALL sets × weight×reps in
 *      «kg·reps» (fitness-crm.html renderVolume).
 *   2) DIFFERENT DATA: the portal analytics reads its own localStorage
 *      dk_workout_history; the trainer analytics reads IndexedDB
 *      workout_history — workouts logged on one side never reached the other.
 *
 * FIX:
 *   A. Portal analytics now uses the CRM formula everywhere (muscle bars,
 *      volume metric card, recent list) + the same stored-group fallback +
 *      the same «kg·reps» unit label.
 *   B. ONE shared cloud history doc per client: portal_shares/ps_hist_<16hex>
 *      (16hex = the same SHA-256 derivative as the portal share id, so BOTH
 *      apps can derive it — CRM from clientId, portal from its share id).
 *      • CRM live-workout finish  → pushes the record (portal schema)
 *      • portal workout save      → pushes the record
 *      • portal boots + onSnapshot→ merges remote records into localStorage
 *      • CRM analytics render     → merges remote records in-memory
 *        (normalized to the CRM shape; NOT persisted to IndexedDB)
 *      Merge dedupes by record ts, keeps last 60 (same cap as localStorage).
 *      Legacy #e= links / demo mode have no share id → sync silently skips.
 *
 * Versions: meta dk-build c92→c93, login footer c92→c93, RUNNING 92→93,
 * sw dk-gym-v119→v120 (+history line).
 * ==========================================================================*/
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FILE = path.join(ROOT, 'fitness-crm.html');
const CLIENT = path.join(ROOT, 'client.html');
const SW = path.join(ROOT, 'sw.js');
let html = fs.readFileSync(FILE, 'utf8');
let clientHtml = fs.readFileSync(CLIENT, 'utf8');
let sw = fs.readFileSync(SW, 'utf8');
const fails = [];
let patched = 0;

function repOnce(name, anchor, replacement) {
  const idx = html.indexOf(anchor);
  if (idx === -1) { fails.push(`[${name}] anchor NOT FOUND`); return; }
  if (html.indexOf(anchor, idx + 1) !== -1) { fails.push(`[${name}] anchor NOT UNIQUE`); return; }
  html = html.slice(0, idx) + replacement + html.slice(idx + anchor.length);
  patched++;
  console.log(`OK  ${name}`);
}
function repOnceClient(name, anchor, replacement) {
  const idx = clientHtml.indexOf(anchor);
  if (idx === -1) { fails.push(`[${name}] anchor NOT FOUND (client)`); return; }
  if (clientHtml.indexOf(anchor, idx + 1) !== -1) { fails.push(`[${name}] anchor NOT UNIQUE (client)`); return; }
  clientHtml = clientHtml.slice(0, idx) + replacement + clientHtml.slice(idx + anchor.length);
  patched++;
  console.log(`OK  ${name} (client)`);
}
function repOnceSw(name, anchor, replacement) {
  const idx = sw.indexOf(anchor);
  if (idx === -1) { fails.push(`[${name}] anchor NOT FOUND (sw)`); return; }
  if (sw.indexOf(anchor, idx + 1) !== -1) { fails.push(`[${name}] anchor NOT UNIQUE (sw)`); return; }
  sw = sw.slice(0, idx) + replacement + sw.slice(idx + anchor.length);
  patched++;
  console.log(`OK  ${name} (sw)`);
}

/* ============================================================
 * PART A1 — client.html: aGroupOf honors the stored group string
 * (records synced from the CRM carry the localized group)
 * ============================================================ */
repOnceClient('A1 aGroupOf stored-group fallback',
`    return mgKeyOf(ex.name) || 'other';
  }`,
`    /* c93: records synced from the trainer CRM carry the exercise's group
       string (localized at log time) — map it before the name fallback and
       pass unknown strings through as their own bar (exactly what the CRM
       renderVolume does), so nothing silently merges into «Other». */
    if (ex.group != null && String(ex.group).trim() !== '') {
      const k = mgKeyOf(ex.group);
      if (k) return k;
      return String(ex.group).trim();
    }
    return mgKeyOf(ex.name) || 'other';
  }`);

/* ============================================================
 * PART A2 — client.html: aRecVolume helper (CRM formula)
 * ============================================================ */
repOnceClient('A2 aRecVolume helper',
`  function aAnalytics() {`,
`  /* c93: analytics volume = ALL sets × weight×reps — the EXACT trainer CRM
     formula (fitness-crm.html renderVolume), so identical data always
     produces identical numbers on both sides («kg·reps»). */
  function aRecVolume(r) {
    let v = 0;
    ((r && r.exercises) || []).forEach(ex => {
      (ex.sets || []).forEach(s => { v += (Number(s.weight) || 0) * (Number(s.reps) || 0); });
    });
    return Math.round(v);
  }
  function aAnalytics() {`);

/* ============================================================
 * PART A3 — client.html: volume metric card uses the CRM formula
 * ============================================================ */
repOnceClient('A3 aAnalytics volume formula',
`    let volume = 0, minutes = 0;
    wf.forEach(r => {
      let v = Number(r.volume) || 0;
      if (!v) (r.exercises || []).forEach(ex => { v += exDoneVolume(ex.sets).v; });
      volume += v;
      minutes += (Number(r.duration_sec) || 0) / 60;
    });`,
`    /* c93: same formula as the trainer CRM (ALL sets × weight×reps) */
    let volume = 0, minutes = 0;
    wf.forEach(r => {
      volume += aRecVolume(r);
      minutes += (Number(r.duration_sec) || 0) / 60;
    });`);

/* ============================================================
 * PART A4 — client.html: muscle bars use the CRM formula
 * ============================================================ */
repOnceClient('A4 renderAMuscles all-sets formula',
`    const byGroup = new Map();
    a.wf.forEach(r => (r.exercises || []).forEach(ex => {
      const v = exDoneVolume(ex.sets).v;
      if (!v) return;
      const g = aGroupOf(ex);
      byGroup.set(g, (byGroup.get(g) || 0) + v);
    }));`,
`    const byGroup = new Map();
    a.wf.forEach(r => (r.exercises || []).forEach(ex => {
      /* c93: ALL sets × weight×reps — identical to the trainer CRM bars */
      const v = (ex.sets || []).reduce((sum, s) => sum + (Number(s.weight) || 0) * (Number(s.reps) || 0), 0);
      if (!v) return;
      const g = aGroupOf(ex);
      byGroup.set(g, (byGroup.get(g) || 0) + v);
    }));`);

/* ============================================================
 * PART A5 — client.html: muscle bars unit = «kg·reps» (CRM label)
 * ============================================================ */
repOnceClient('A5 muscle bar unit kg·reps',
`          <span class="font-mono text-muted">\${aNum(v)} \${esc(t('volumeKg'))}</span>`,
`          <span class="font-mono text-muted">\${aNum(v)} kg·reps</span>`);

/* ============================================================
 * PART A6 — client.html: recent-list volume = CRM formula + unit
 * ============================================================ */
repOnceClient('A6 renderARecent formula',
`      let v = Number(r.volume) || 0; if (!v) (r.exercises || []).forEach(ex => { v += exDoneVolume(ex.sets).v; });`,
`      const v = aRecVolume(r); /* c93: CRM formula (ALL sets × weight×reps) */`);
repOnceClient('A6b recent unit kg·reps',
`        <span class="font-mono text-muted shrink-0 text-end">\${aNum(v)} \${esc(t('volumeKg'))} · \${done}/\${tot} · \${mins} \${esc(t('aMinutes'))}</span>`,
`        <span class="font-mono text-muted shrink-0 text-end">\${aNum(v)} kg·reps · \${done}/\${tot} · \${mins} \${esc(t('aMinutes'))}</span>`);

/* ============================================================
 * PART B1 — client.html: the two-way history sync module
 * ============================================================ */
repOnceClient('B1 history sync module',
`  /* ============ CHECK-IN ============ */`,
`  /* ============ c93: TWO-WAY WORKOUT-HISTORY SYNC (CRM ↔ portal) ============
   * ONE cloud doc per client: portal_shares/ps_hist_<16hex> — the SAME
   * SHA-256 derivative the portal share link uses, so both apps derive it
   * independently (CRM from clientId, portal from its share id).
   * Trainer-logged workouts land in the portal, portal workouts land in the
   * trainer analytics — both «Объём по группам мышц» panels are fed by the
   * SAME data with the SAME formula (ALL sets × weight×reps, kg·reps).
   * Records use the portal schema; merge dedupes by ts; last 60 kept.
   * No share id (legacy #e= links, demo mode) → sync silently skipped. */
  function dkHistDocId() {
    try {
      const sh = JSON.parse(localStorage.getItem('dk_client_share') || 'null');
      if (sh && sh.id && String(sh.id).indexOf('ps') === 0 && String(sh.id).length > 6) return 'ps_hist_' + String(sh.id).slice(2);
    } catch (e) {}
    return '';
  }
  function dkHistMergeRemote(recs) {
    if (!Array.isArray(recs) || !recs.length) return false;
    const hist = loadHistory();
    const seen = new Set(hist.map(r => Number(r.ts) || 0));
    let added = 0;
    recs.forEach(r => {
      if (!r || r.ts == null) return;
      if (seen.has(Number(r.ts))) return;
      hist.push(r); seen.add(Number(r.ts)); added++;
    });
    if (!added) return false;
    hist.sort((a, b) => (a.ts || 0) - (b.ts || 0));
    saveHistory(hist);
    renderAnalytics();
    console.info('[hist-sync] merged ' + added + ' workout(s) from the trainer');
    return true;
  }
  function dkHistRef(docId) {
    return ensureFirebaseLite().then(function () {
      if (!firebase.apps.length) firebase.initializeApp(CLOUD_CFG);
      return firebase.firestore().collection('portal_shares').doc(docId);
    });
  }
  function dkHistFetch() {
    const docId = dkHistDocId();
    if (!docId) return Promise.resolve(null);
    return dkHistRef(docId).then(function (ref) {
      return ref.get({ source: 'server' });
    }).then(function (snap) {
      if (!snap || !snap.exists) return [];
      const data = snap.data() || {};
      if (!data.d) return [];
      const p = JSON.parse(data.d);
      return Array.isArray(p.recs) ? p.recs : [];
    }).catch(function () { return null; });
  }
  function dkHistPush(rec) {
    const docId = dkHistDocId();
    if (!docId || !rec) return Promise.resolve(false);
    return dkHistFetch().then(function (remote) {
      const recs = (Array.isArray(remote) ? remote : []).filter(r => r && Number(r.ts) !== Number(rec.ts));
      recs.push(rec);
      recs.sort((a, b) => (a.ts || 0) - (b.ts || 0));
      return dkHistRef(docId).then(function (ref) {
        return ref.set({ d: JSON.stringify({ recs: recs.slice(-60) }), v: 2, ts: Date.now() });
      });
    }).then(function () { return true; }).catch(function (e) { console.warn('[hist-sync] push failed', e); return false; });
  }
  function dkHistWatch() {
    const docId = dkHistDocId();
    if (!docId) return;
    dkHistRef(docId).then(function (ref) {
      if (ref.onSnapshot) {
        ref.onSnapshot(function (snap) {
          try {
            const data = snap && snap.exists ? snap.data() : null;
            if (!data || !data.d) return;
            const p = JSON.parse(data.d);
            dkHistMergeRemote(p.recs);
          } catch (e) {}
        }, function () {
          /* listener error → fall back to a one-time read */
          dkHistFetch().then(function (recs) { if (recs) dkHistMergeRemote(recs); }).catch(function () {});
        });
      } else {
        dkHistFetch().then(function (recs) { if (recs) dkHistMergeRemote(recs); }).catch(function () {});
      }
    }).catch(function () {});
  }
  function dkHistStart() { if (dkHistDocId()) dkHistWatch(); }

  /* ============ CHECK-IN ============ */`);

/* ============================================================
 * PART B2 — client.html: start the sync after data is applied
 * ============================================================ */
repOnceClient('B2 applyData starts sync',
`    exerciseDB = d.exercises || {};
    sessions = {};
    renderAll();
    checkDraft();
  }`,
`    exerciseDB = d.exercises || {};
    sessions = {};
    renderAll();
    checkDraft();
    /* c93: two-way history sync with the trainer CRM (cloud doc per share) */
    try { dkHistStart(); } catch (e) {}
  }`);

/* ============================================================
 * PART B3 — client.html: push the finished workout to the cloud
 * ============================================================ */
repOnceClient('B3 report-save pushes to cloud',
`      const hist = loadHistory(); hist.push(rec); saveHistory(hist);`,
`      const hist = loadHistory(); hist.push(rec); saveHistory(hist);
      /* c93: mirror the finished workout into the shared cloud history doc */
      try { dkHistPush(rec); } catch (e) {}`);

/* ============================================================
 * PART B4 — fitness-crm.html: cloud history helpers (window API)
 * ============================================================ */
repOnce('B4 CRM cloud history helpers',
`    async function uploadPortalShare(id, blobB64) {
      await ensurePortalFirebase();
      if (!firebase.apps.length) firebase.initializeApp(PORTAL_SHARE_CFG);
      await firebase.firestore().collection('portal_shares').doc(id).set({ d: blobB64, v: 1, ts: Date.now() });
    }`,
`    async function uploadPortalShare(id, blobB64) {
      await ensurePortalFirebase();
      if (!firebase.apps.length) firebase.initializeApp(PORTAL_SHARE_CFG);
      await firebase.firestore().collection('portal_shares').doc(id).set({ d: blobB64, v: 1, ts: Date.now() });
    }

    /* ===== c93: shared workout-history doc (CRM ↔ trainee portal) =====
     * ONE cloud doc per client: portal_shares/ps_hist_<16hex> (16hex = the
     * same SHA-256 derivative as the portal share id). The trainer CRM and
     * the trainee portal both read/write it, so «Объём по группам мышц» in
     * the trainer analytics and in the trainee's personal analytics shows
     * the SAME workouts — identical and interconnected. Records use the
     * portal schema (ts/program/exercises[key,…]); merge dedupes by ts;
     * last 60 kept. Exposed on window: the live-workout module and the
     * analytics module live in different closures. */
    async function portalHistoryDocId(clientId) {
      const shareId = await portalShareId(clientId);
      return 'ps_hist_' + String(shareId).slice(2);
    }
    window.dkPushClientHistory = async function (clientId, rec) {
      try {
        if (!clientId || !rec) return false;
        const docId = await portalHistoryDocId(clientId);
        await ensurePortalFirebase();
        if (!firebase.apps.length) firebase.initializeApp(PORTAL_SHARE_CFG);
        const ref = firebase.firestore().collection('portal_shares').doc(docId);
        let recs = [];
        try {
          const snap = await ref.get({ source: 'server' });
          const data = snap && snap.exists ? snap.data() : null;
          if (data && data.d) { const p = JSON.parse(data.d); if (Array.isArray(p.recs)) recs = p.recs; }
        } catch (_) {}
        recs = recs.filter(r => r && Number(r.ts) !== Number(rec.ts));
        recs.push(rec);
        recs.sort((a, b) => (a.ts || 0) - (b.ts || 0));
        await ref.set({ d: JSON.stringify({ recs: recs.slice(-60) }), v: 2, ts: Date.now() });
        return true;
      } catch (e) { console.warn('[hist-sync] CRM push failed', e); return false; }
    };
    window.dkFetchClientHistory = async function (clientId) {
      try {
        if (!clientId) return [];
        const docId = await portalHistoryDocId(clientId);
        await ensurePortalFirebase();
        if (!firebase.apps.length) firebase.initializeApp(PORTAL_SHARE_CFG);
        const snap = await Promise.race([
          firebase.firestore().collection('portal_shares').doc(docId).get({ source: 'server' }),
          new Promise(res => setTimeout(() => res(null), 5000))
        ]);
        if (!snap || !snap.exists) return [];
        const data = snap.data() || {};
        if (!data.d) return [];
        const p = JSON.parse(data.d);
        const recs = Array.isArray(p.recs) ? p.recs : [];
        /* portal-shaped → CRM-shaped (in-memory only, NOT persisted) */
        return recs.filter(r => r && (Number(r.ts) > 0 || Date.parse(r.date) > 0)).map(r => {
          const ts = Number(r.ts) || Date.parse(r.date) || 0;
          const exs = r.exercises || [];
          return {
            date: ts, created_at: ts,
            duration: Number(r.duration_sec) || 0,
            total_volume: exs.reduce((s, ex) => s + (ex.sets || []).reduce((ss, st) => ss + (Number(st.weight) || 0) * (Number(st.reps) || 0), 0), 0),
            name: r.program || '', _remote: true,
            exercises: exs.map(ex => ({
              exercise_id: ex.key || ex.exercise_id || '',
              name: ex.name || '',
              group: ex.group || '', muscle_group: ex.group || '',
              sets: ex.sets || []
            }))
          };
        }).filter(w => w.date > 0);
      } catch (e) { console.warn('[hist-sync] CRM fetch failed', e); return []; }
    };`);

/* ============================================================
 * PART B5 — fitness-crm.html: live-workout finish mirrors to cloud
 * ============================================================ */
repOnce('B5 CRM finish pushes to cloud',
`      document.getElementById('live-report-save').addEventListener('click', async () => {
        await db.put('workout_history', record);`,
`      document.getElementById('live-report-save').addEventListener('click', async () => {
        await db.put('workout_history', record);
        /* c93: mirror the finished workout into the shared cloud history doc
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
        } catch (_) {}`);

/* ============================================================
 * PART B6 — fitness-crm.html: analytics render merges cloud history
 * ============================================================ */
repOnce('B6 CRM analytics merge',
`      // Fetch all history for this client
      const workouts = await db.find('workout_history', 'by_clientId', _clientId);
      const nutrition = await db.find('nutrition_history', 'by_clientId', _clientId);

      // Compute metrics
      const metrics = computeMetrics(workouts, nutrition);
      renderMetrics(metrics);
      renderCalendar(workouts, nutrition);
      renderVolume(workouts);`,
`      // Fetch all history for this client
      const workouts = await db.find('workout_history', 'by_clientId', _clientId);
      const nutrition = await db.find('nutrition_history', 'by_clientId', _clientId);

      /* c93: merge the trainee portal's cloud history (portal_shares/ps_hist_*)
         so the trainer analytics and the trainee's personal analytics show
         the SAME workouts — identical & interconnected. Remote records are
         normalized to the CRM shape in-memory (NOT persisted to IndexedDB);
         a 5s race guard keeps analytics usable when the cloud is offline. */
      let workoutsAll = workouts;
      try {
        if (typeof window.dkFetchClientHistory === 'function') {
          const remote = await window.dkFetchClientHistory(_clientId);
          if (remote && remote.length) {
            const seen = new Set(workouts.map(w => Number(w.date || w.created_at) || 0));
            const extra = remote.filter(r => !seen.has(Number(r.date) || 0));
            if (extra.length) workoutsAll = workouts.concat(extra);
          }
        }
      } catch (_) {}

      // Compute metrics
      const metrics = computeMetrics(workoutsAll, nutrition);
      renderMetrics(metrics);
      renderCalendar(workoutsAll, nutrition);
      renderVolume(workoutsAll);`);

/* ============================================================
 * Versions — c92 → c93, sw v119 → v120
 * ============================================================ */
repOnce('v meta', '<meta name="dk-build" content="c92" />', '<meta name="dk-build" content="c93" />');
repOnce('v footer', '3 languages · c92</p>', '3 languages · c93</p>');
repOnce('v RUNNING',
  'var RUNNING = 92; /* numeric part of dk-build c92 */',
  'var RUNNING = 93; /* numeric part of dk-build c93 */');

repOnceSw('v sw history line',
  "// v119: c92 — personal analytics in the trainee portal: the third bottom-nav tab («Прогресс», which was only a morning check-in form) is now «Аналитика» — range chips (week/month/all) + 4 metric cards (workouts/active days/streak 🔥/volume+minutes), activity heatmap (workout vs check-in), volume per muscle group (canonical groups + 3-language labels, same dictionary as CRM c91 — resolves via share exerciseDB → program day → legacy reverse map), body-weight SVG trend from check-ins (dashed target line + delta chip), recent-workouts list; the check-in form + measurement history stay at the bottom of the tab; check-in card labels got ids + i18n (were hard-coded RU).",
  "// v120: c93 — «Объём по группам мышц» identical + interconnected: the trainee portal's analytics now uses the EXACT trainer CRM formula (ALL sets × weight×reps, «kg·reps» — it used to sum DONE sets only in «кг», which is why the portal showed a single «Другое 200 кг» bar while the trainer saw Ноги 2352 / Грудь 1280 …); ONE shared cloud history doc per client (portal_shares/ps_hist_<16hex>, the same SHA-256 derivative as the portal share id): CRM live-workout finish pushes the record, portal workout save pushes the record, the portal merges via onSnapshot (dedupe by ts, last 60), the CRM analytics merges remote records in-memory (5s offline guard, not persisted) — both sides always show the same workouts; legacy #e= links / demo skip the sync.\n// v119: c92 — personal analytics in the trainee portal: the third bottom-nav tab («Прогресс», which was only a morning check-in form) is now «Аналитика» — range chips (week/month/all) + 4 metric cards (workouts/active days/streak 🔥/volume+minutes), activity heatmap (workout vs check-in), volume per muscle group (canonical groups + 3-language labels, same dictionary as CRM c91 — resolves via share exerciseDB → program day → legacy reverse map), body-weight SVG trend from check-ins (dashed target line + delta chip), recent-workouts list; the check-in form + measurement history stay at the bottom of the tab; check-in card labels got ids + i18n (were hard-coded RU).");
repOnceSw('v sw cache',
  "const CACHE_NAME = 'dk-gym-v119';",
  "const CACHE_NAME = 'dk-gym-v120';");

/* ============================================================
 * Report + write
 * ============================================================ */
if (fails.length) {
  console.error('\nFAILED PATCHES:');
  fails.forEach(f => console.error('  ' + f));
  process.exit(1);
}
fs.writeFileSync(FILE, html);
fs.writeFileSync(CLIENT, clientHtml);
fs.writeFileSync(SW, sw);
console.log(`\nPatched ${patched} anchors — fitness-crm.html, client.html, sw.js written.`);
