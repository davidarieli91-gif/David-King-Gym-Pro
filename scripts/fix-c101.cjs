/* c101 patch — three fixes:
   1) Portal data leak: every client portal on a device shared ONE localStorage
      key set (dk_workout_history / dk_checkins / dk_done_days / dk_diary_* /
      dk_water_*) — opening client B's portal after client A's showed A's
      workouts in B's recovery map & analytics («3 тренировок» for a client who
      never trained). All per-client data is namespaced by the portal share id;
      legacy global keys are quarantined (renamed dk_legacy_*) on share load.
   2) Portal save slots REMOVED entirely (user: they belong to the trainer only
      — the trainee needs visual settings only). UI, logic, timers, i18n keys.
   3) «Выбор упражнений» body cards: SVG body + 3D body moved flush together
      (4px gap) and both height-capped so they ALWAYS fit the screen together
      (50/50 split of the picker map column, 44vh cap in the Exercise DB panel,
      160:360 kept, camera re-fits on resize). Sizes: user said «размер уже
      хороший» — boxes never grow beyond the bodymap-slider size.
   Versions: meta c101 / RUNNING=101 / footer c101 / sw dk-gym-v128. */
const fs = require('fs');

function patch(file, fn) {
  const before = fs.readFileSync(file, 'utf8');
  let s = before;
  const repOnce = (a, b, tag) => {
    if (!s.includes(a)) throw new Error(`[${file}] MISS ${tag || ''}: ${String(a).slice(0, 90)}`);
    s = s.replace(a, b);
  };
  const repCount = (re, b, n, tag) => {
    const m = s.match(re);
    if (!m || m.length !== n) throw new Error(`[${file}] COUNT ${tag || ''}: expected ${n}, got ${m ? m.length : 0}`);
    s = s.replace(re, b);
  };
  fn(s, repOnce, repCount, (x) => { s = x; });
  if (s === before) throw new Error(`[${file}] no changes`);
  fs.writeFileSync(file, s);
  console.log(`[${file}] patched OK (${before.length} -> ${s.length} chars)`);
}

/* ============================== client.html ============================== */
patch('client.html', (s0, once, count, set) => {

  /* ---- 1a. per-client namespaced storage helpers + history ---- */
  once(
`  function loadHistory() { try { return JSON.parse(localStorage.getItem('dk_workout_history')||'[]'); } catch(e){ return []; } }
  function saveHistory(list) { localStorage.setItem('dk_workout_history', JSON.stringify(list.slice(-200))); }`,

`  /* ===== c101: PER-CLIENT STORAGE =====
   * Every portal on this device used to share ONE set of localStorage keys,
   * so opening client B's portal after client A's showed A's workouts in B's
   * recovery map and analytics (a client who never trained looked «уставший»,
   * «3 тренировок» in every portal). All per-client data is namespaced by the
   * portal share id now; the trainer-logged history still arrives per client
   * from the shared ps_hist cloud doc (c93). Visual settings stay global. */
  function dkClientNs() {
    try {
      const sh = JSON.parse(localStorage.getItem('dk_client_share') || 'null');
      if (sh && sh.id && String(sh.id).length > 3) return String(sh.id);
    } catch (e) {}
    return 'demo';
  }
  function nsKey(k) { return k + '__' + dkClientNs(); }
  /* c101: move the old SHARED keys aside so no code path can ever read them
     again — they carried a mix of different clients' data on shared devices.
     Data is NOT deleted (renamed to dk_legacy_*, recoverable via devtools);
     every client's real cloud history still arrives from ps_hist (c93). */
  function dkQuarantineLegacyGlobalKeys() {
    try {
      ['dk_workout_history', 'dk_checkins', 'dk_done_days'].forEach(function (k) {
        const v = localStorage.getItem(k);
        if (v != null) { localStorage.setItem('dk_legacy_' + k.slice(3), v); localStorage.removeItem(k); }
      });
      const drop = [], keep = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.indexOf('dk_diary_') === 0 || k.indexOf('dk_water_') === 0)) { keep[k] = localStorage.getItem(k); drop.push(k); }
      }
      drop.forEach(function (k) { localStorage.removeItem(k); });
      Object.keys(keep).forEach(function (k) { localStorage.setItem('dk_legacy_' + k.slice(3), keep[k]); });
    } catch (e) {}
  }
  function loadHistory() { try { return JSON.parse(localStorage.getItem(nsKey('dk_workout_history'))||'[]'); } catch(e){ return []; } }
  function saveHistory(list) { localStorage.setItem(nsKey('dk_workout_history'), JSON.stringify(list.slice(-200))); }`);

  /* ---- 1b. check-ins ---- */
  once(
`  function loadCheckins() { try { return JSON.parse(localStorage.getItem('dk_checkins')||'[]'); } catch(e){ return []; } }`,
`  function loadCheckins() { try { return JSON.parse(localStorage.getItem(nsKey('dk_checkins'))||'[]'); } catch(e){ return []; } }`);
  once(
`    localStorage.setItem('dk_checkins', JSON.stringify(list.slice(-365)));`,
`    localStorage.setItem(nsKey('dk_checkins'), JSON.stringify(list.slice(-365)));`);

  /* ---- 1c. done days ---- */
  once(
`    const done = JSON.parse(localStorage.getItem('dk_done_days')||'{}');
    done[todayKey()] = (currentProgram&&currentProgram.name)||'';
    localStorage.setItem('dk_done_days',JSON.stringify(done));`,
`    const done = JSON.parse(localStorage.getItem(nsKey('dk_done_days'))||'{}');
    done[todayKey()] = (currentProgram&&currentProgram.name)||'';
    localStorage.setItem(nsKey('dk_done_days'),JSON.stringify(done));`);
  once(
`    const isDone = JSON.parse(localStorage.getItem('dk_done_days')||'{}')[todayKey()];`,
`    const isDone = JSON.parse(localStorage.getItem(nsKey('dk_done_days'))||'{}')[todayKey()];`);

  /* ---- 1d. water + diary (per date → per client per date) ---- */
  once(
`  function waterKey() { return 'dk_water_' + new Date().toISOString().slice(0,10); }`,
`  function waterKey() { return nsKey('dk_water_' + new Date().toISOString().slice(0,10)); }`);
  once(
`  function diaryKey() { return 'dk_diary_' + todayKey(); }`,
`  function diaryKey() { return nsKey('dk_diary_' + todayKey()); }`);

  /* ---- 1e. quarantine on every successful share load ---- */
  once(
`      try { localStorage.setItem('dk_client_share', JSON.stringify({ id: id })); } catch (e) {}`,
`      try { localStorage.setItem('dk_client_share', JSON.stringify({ id: id })); } catch (e) {}
      try { dkQuarantineLegacyGlobalKeys(); } catch (e) {} /* c101: the old shared keys hold a MIX of clients — park them */`);

  /* ---- 2. remove the remaining save-slot references ---- */
  once(
`    /* c98: the map subtitle is DYNAMIC now (client · workouts · muscles — set by renderRecMap); the slots block below got its own static header */
    const _slotsTitle98 = document.getElementById('txt-slots-title'); if (_slotsTitle98) _slotsTitle98.textContent = t('slotsTitle');
    const _slotsSub98 = document.getElementById('txt-slots-sub'); if (_slotsSub98) _slotsSub98.textContent = t('recSub');
`,
`    /* c98: the map subtitle is DYNAMIC (client · workouts · muscles — set by renderRecMap) */
`);
  once(
`    try { renderRecovery(); } catch(e) {} /* c97: the 10 slot rows are dynamic — re-render them in the new language RIGHT NOW (updateLabels only re-translated the static title/subtitle, the rows kept the old language until the tab was re-opened) */
`, '');
  once(
`    /* c96: refresh the AUTO recovery slot right after a check-in is stored */
    try { recvAutoTick(); } catch (e) {}
`, '');
  once(
`      /* c96: refresh the AUTO recovery slot right after a workout is stored */
      try { recvAutoTick(); } catch (e) {}
`, '');
  once(
`            '<div class="border-t border-border pt-4">' +
              '<div id="txt-slots-title" class="text-[10px] font-bold uppercase tracking-wider text-muted mb-1"></div>' +
              '<p id="txt-slots-sub" class="text-[11px] text-muted mb-2 leading-relaxed"></p>' +
              '<div id="recovery-slots" class="space-y-2"></div>' +
            '</div>' +
`, '');
  once(
`      set('txt-slots-title', T('slotsTitle')); /* c99: backup slots section */
      set('txt-slots-sub', T('recSub'));
`, '');
  once(
`      /* c99: the 10 profile save slots live HERE now (they are a BACKUP
         feature — the recovery tab is the muscle recovery map only).
         Translate the labels and render the rows right away. */
      try { document.getElementById('txt-slots-title').textContent = T('slotsTitle'); } catch (e) {}
      try { document.getElementById('txt-slots-sub').textContent = T('recSub'); } catch (e) {}
      try { if (window.dkPortalRecovery && typeof window.dkPortalRecovery.render === 'function') window.dkPortalRecovery.render(); } catch (e) {}
      buildTexButtons();`,
`      buildTexButtons();`);
  once(
`      try { if (window.dkPortalRecovery && typeof window.dkPortalRecovery.render === 'function') window.dkPortalRecovery.render(); } catch (e) {} /* c99: fresh slot rows on every open */
`, '');

  /* ---- 2b. i18n: drop the slots-era keys (recTitle stays — it is the recovery
         tab title; map* keys stay — the recovery map uses them) ---- */
  count(/recTitle:'([^']*)',recSub:[\s\S]*?recCloud:'[^']*',/g, (m, t) => `recTitle:'${t}',`, 3, 'main dict rec*');
  count(/,slotsTitle:'[^']*',/g, ',', 3, 'main dict slotsTitle');
  count(/, slotsTitle:'[^']*', recSub:'[^']*' }/g, ' }', 3, 'settings dict slots tail');

});

/* ============================ fitness-crm.html =========================== */
patch('fitness-crm.html', (s0, once, count, set) => {

  /* ---- 3a. picker modal map column: 50/50 height split, 4px gap ---- */
  once(
`    /* c75: Body map SVG size works again — width-based (SVG hit-testing stays exact, no transform) */
    /* c100: the SVG container spans the full column so the SVG body and the
       embedded 3D body (#bm-3d-container is w-full) resolve to the SAME width
       — at custom bodymap sliders the two figures stay pixel-equal */
    #bm-svg-container { width: 100%; }
    #bm-svg-container .bm-body-svg { width: 100%; max-width: calc(400px * var(--ui-bodymap, 1)); height: auto; }
    #exercise-bodymap-svg .bm-body-svg { width: calc(160px * var(--ui-bodymap, 1)); max-width: none; height: auto; }`,

`    /* c75: Body map SVG size works again — width-based (SVG hit-testing stays exact, no transform) */
    /* c101: the two body cards SHARE the picker column's visible height
       (50/50, 4px column gap): each box keeps the SVG's 160:360 ratio with its
       width derived from the height, is capped at the bodymap-slider size and
       never exceeds the column — both figures are ALWAYS fully on screen, no
       scrolling and no empty gap between them («подвинь карточки вплотную —
       обе должны влезать в экран»). c100 made them equal-width; the column
       still grows with the slider (line above). */
    #bm-svg-container {
      flex: 1 1 0; min-height: 0; width: auto; max-width: 100%;
      aspect-ratio: 160 / 360;
      max-height: calc(clamp(200px, 20cqw, 320px) * var(--ui-bodymap, 1) * 2.25);
    }
    #bm-svg-container .bm-body-svg { width: 100%; max-width: 100%; height: 100%; }
    /* c101: Exercise DB panel — the same «both fit the screen» rule: each body
       is height-capped at 44vh (160:360 kept) instead of slider-width only */
    #exercise-bodymap-svg .bm-body-svg { display: block; margin: 0 auto; width: auto; max-width: 100%; height: min(calc(160px * var(--ui-bodymap, 1) * 2.25), 44vh); }`);

  /* ---- 3b. the two 3D boxes follow the same rules ---- */
  once(
`#exercise-bodymap-3d { width: calc(160px * var(--ui-bodymap, 1)); height: auto; aspect-ratio: 160 / 360; }
#bm-3d-container { width: 100%; height: auto; aspect-ratio: 160 / 360; flex: none; }`,
`/* c101: both body boxes are HEIGHT-driven now so both cards are always fully
   visible together. Panel: each body capped at 44vh (160:360 kept, width from
   height). Picker modal: #bm-3d-container splits the map column 50/50 with the
   SVG body (flex:1 1 0 + the column's 4px gap, width from height via the
   160:360 ratio) and both are capped at the bodymap-slider size — no
   scrolling, no empty gap. c100 made the two boxes equal-width; before c100
   the 3D box answered to a DIFFERENT slider (--ui-atlas) and was flex-crushed
   to a 142px sliver inside the picker modal's map column. */
#exercise-bodymap-3d { width: auto; max-width: 100%; height: min(calc(160px * var(--ui-bodymap, 1) * 2.25), 44vh); aspect-ratio: 160 / 360; }
#bm-3d-container { width: auto; max-width: 100%; height: auto; aspect-ratio: 160 / 360; flex: 1 1 0; min-height: 0; max-height: calc(clamp(200px, 20cqw, 320px) * var(--ui-bodymap, 1) * 2.25); }`);

  /* ---- 3c. camera re-fits when the box resizes (50/50 split changes it) ---- */
  once(
`    function resize() {
      var w = box.clientWidth || 0, h = box.clientHeight || 0;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }`,
`    function resize() {
      var w = box.clientWidth || 0, h = box.clientHeight || 0;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      fit(); /* c101: the box height now depends on the column layout (50/50 split) — re-frame the figure whenever the box resizes */
    }`);

  /* ---- versions ---- */
  once('<meta name="dk-build" content="c100" />', '<meta name="dk-build" content="c101" />', 'meta');
  once('· IndexedDB · 3 languages · c100</p>', '· IndexedDB · 3 languages · c101</p>', 'footer');
  once('var RUNNING = 100; /* numeric part of dk-build c100 */', 'var RUNNING = 101; /* numeric part of dk-build c101 */', 'RUNNING');

});

/* ================================= sw.js ================================= */
patch('sw.js', (s0, once, count, set) => {
  once(
`const CACHE_NAME = 'dk-gym-v127'; // c100`,
`// v128: c101 — (1) the trainee portal stopped mixing clients: all per-client localStorage data (workout history, check-ins, done days, diary, water) is namespaced by the portal share id, the old shared keys are quarantined (dk_legacy_*) — the recovery map and analytics of a client who never trained no longer show another client's workouts; (2) the 10 save slots are REMOVED from the portal (trainer-only feature, the trainee keeps visual settings); (3) the picker's SVG body + 3D body sit flush (4px gap) and share the column height 50/50 (panel: 44vh cap) — both always fully on screen, camera re-fits on resize
const CACHE_NAME = 'dk-gym-v128'; // c101`);
});

console.log('c101 patch complete');
