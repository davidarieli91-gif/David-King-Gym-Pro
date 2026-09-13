/* c76: Exercise DB tab = EXACT copy of the Quick Pick («Выбор упражнений») screen.
   User: «тренировки и выбор упражнений сильно отличаются — сделай тренировки точной копией».
   Changes:
     1. Source tab bar → picker-style pill bar (p-0.5, shrink-0 tabs, px-2.5 py-1) + ⭐/🕐 tabs.
     2. ⭐ favorites / 🕐 recent tabs (same stores as picker: settings row 'bm_favorites',
        workout_history last-20-unique).
     3. Manage buttons (Edit tree / Archive / New folder / Add) → compact icon-style.
     4. exercise-count badge hidden (picker has none), Body-map toggle → lg:hidden.
     5. Col3: picker-identical toolbar (View: Compound/Isolation dropdown + count).
     6. Cards → picker renderExCard copy: animated 2-frame images, star (favorite) overlay,
        source badge + eye (openExerciseModal) + "+", muscle chips.
     7. Grouped sections (Compound/Isolation/Other) + VISIBLE_CAP 200 + "Show more".
     8. Front/Back/Side map tabs localized (Спереди/Сзади/Сбоку) — like the picker.
   Pattern: anchored single replacements (abort on count != 1). */
const fs = require('fs');
const F = 'fitness-crm.html';
let s = fs.readFileSync(F, 'utf8');
let applied = 0, failed = 0;

function repOnce(name, anchor, replacement) {
  const n = s.split(anchor).length - 1;
  if (n !== 1) {
    console.error(`FAIL [${name}]: anchor count = ${n} (expected 1)`);
    failed++;
    return false;
  }
  s = s.replace(anchor, replacement);
  applied++;
  console.log(`ok  [${name}]`);
  return true;
}

/* ============ 1. Source tab bar → picker pill bar + ⭐/🕐 + compact manage buttons ============ */
repOnce('top-row-picker-style',
`                <div class="flex gap-1 bg-surface-2 border border-border rounded-lg p-1">
                  <button data-exercise-source="all" class="ex-src-btn px-3 py-1.5 rounded-md text-xs font-semibold transition bg-primary text-white" data-i18n="common.all">All</button>
                  <button data-exercise-source="burnfit" class="ex-src-btn px-3 py-1.5 rounded-md text-xs font-semibold transition text-muted" data-i18n="exercise.sourceBurnfit">Burnfit</button>
                  <button data-exercise-source="gymvisual" class="ex-src-btn px-3 py-1.5 rounded-md text-xs font-semibold transition text-muted" data-i18n="exercise.sourceGymVisual">Gym Visual</button>
                  <button data-exercise-source="gymimpulse" class="ex-src-btn px-3 py-1.5 rounded-md text-xs font-semibold transition text-muted" data-i18n="exercise.sourceGymImpulse">GymImpulse</button>
                </div>
                <span id="exercise-count" class="text-xs text-muted bg-surface-2 border border-border rounded-full px-2 py-0.5">0</span>
                <button id="exercise-edit-mode-btn" class="bg-surface-2 hover:bg-border/40 border border-border text-sm font-medium px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1.5">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  <span data-i18n="exercise.editMode">Edit tree</span>
                </button>
                <button id="exercise-archive-btn" class="bg-surface-2 hover:bg-border/40 border border-border text-sm font-medium px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1.5 text-muted" data-i18n-attr="title:common.archive">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                  <span class="hidden sm:inline" data-i18n="common.archive">Archive</span>
                </button>
                <button id="exercise-add-root-folder-btn" class="hidden bg-success/15 hover:bg-success/25 text-success border border-success/30 text-sm font-medium px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1.5" data-i18n="exercise.newFolder">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
                  <span>New folder</span>
                </button>
                <button id="exercise-add-btn" class="ms-auto bg-surface-2 hover:bg-border/40 border border-border text-sm font-medium px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1.5">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
                  <span data-i18n="exercise.add">Add exercise</span>
                </button>`,
`                <!-- c76: exact copy of the Quick Pick tab bar (All / Burnfit / Gym Visual / GymImpulse / ⭐ / 🕐) -->
                <div class="flex gap-1 bg-surface-2 border border-border rounded-lg p-0.5 flex-nowrap overflow-x-auto no-scrollbar min-[1440px]:overflow-x-visible">
                  <button data-exercise-source="all" class="ex-src-btn shrink-0 px-2.5 py-1 min-[1440px]:px-3 min-[1440px]:py-1.5 rounded-md text-xs min-[1440px]:text-[14px] font-semibold transition bg-primary text-white" data-i18n="common.all">All</button>
                  <button data-exercise-source="burnfit" class="ex-src-btn shrink-0 px-2.5 py-1 min-[1440px]:px-3 min-[1440px]:py-1.5 rounded-md text-xs min-[1440px]:text-[14px] font-semibold transition text-muted" data-i18n="exercise.sourceBurnfit">Burnfit</button>
                  <button data-exercise-source="gymvisual" class="ex-src-btn shrink-0 px-2.5 py-1 min-[1440px]:px-3 min-[1440px]:py-1.5 rounded-md text-xs min-[1440px]:text-[14px] font-semibold transition text-muted" data-i18n="exercise.sourceGymVisual">Gym Visual</button>
                  <button data-exercise-source="gymimpulse" class="ex-src-btn shrink-0 px-2.5 py-1 min-[1440px]:px-3 min-[1440px]:py-1.5 rounded-md text-xs min-[1440px]:text-[14px] font-semibold transition text-muted" data-i18n="exercise.sourceGymImpulse">GymImpulse</button>
                  <button id="exb-tab-favorites" aria-label="Favorites" class="shrink-0 px-2.5 py-1 min-[1440px]:px-3 min-[1440px]:py-1.5 rounded-md text-xs min-[1440px]:text-[14px] font-semibold transition text-muted">⭐</button>
                  <button id="exb-tab-recent" aria-label="Recent" class="shrink-0 px-2.5 py-1 min-[1440px]:px-3 min-[1440px]:py-1.5 rounded-md text-xs min-[1440px]:text-[14px] font-semibold transition text-muted">🕐</button>
                </div>
                <span id="exercise-count" class="hidden text-xs text-muted bg-surface-2 border border-border rounded-full px-2 py-0.5">0</span>
                <button id="exercise-edit-mode-btn" class="bg-surface-2 hover:bg-border/40 border border-border text-sm font-medium px-2 py-1.5 rounded-lg transition inline-flex items-center gap-1.5" data-i18n-attr="title:exercise.editMode">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  <span class="hidden sm:inline" data-i18n="exercise.editMode">Edit tree</span>
                </button>
                <button id="exercise-archive-btn" class="bg-surface-2 hover:bg-border/40 border border-border text-sm font-medium px-2 py-1.5 rounded-lg transition inline-flex items-center gap-1.5 text-muted" data-i18n-attr="title:common.archive">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                  <span class="hidden sm:inline" data-i18n="common.archive">Archive</span>
                </button>
                <button id="exercise-add-root-folder-btn" class="hidden bg-success/15 hover:bg-success/25 text-success border border-success/30 text-sm font-medium px-2 py-1.5 rounded-lg transition inline-flex items-center gap-1.5" data-i18n="exercise.newFolder">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
                  <span class="hidden sm:inline">New folder</span>
                </button>
                <button id="exercise-add-btn" class="ms-auto bg-surface-2 hover:bg-border/40 border border-border text-sm font-medium px-2.5 py-1.5 rounded-lg transition inline-flex items-center gap-1.5">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
                  <span data-i18n="exercise.add">Add exercise</span>
                </button>`);

/* ============ 2. Body-map toggle → desktop hidden (picker has no such button) ============ */
repOnce('bodymap-toggle-lg-hidden',
`<button id="exercise-bodymap-toggle" class="bg-surface-2 hover:bg-border/40 border border-border text-sm font-medium px-3 py-2 rounded-xl transition inline-flex items-center gap-1.5" title="Body map">`,
`<button id="exercise-bodymap-toggle" class="bg-surface-2 hover:bg-border/40 border border-border text-sm font-medium px-3 py-2 rounded-xl transition inline-flex items-center gap-1.5 lg:hidden" title="Body map">`);

/* ============ 3. Col3: picker-identical toolbar (View dropdown + count) ============ */
repOnce('col3-view-toolbar',
`                <div id="exb-grid-col" class="flex-1 min-w-0 overflow-y-auto p-2">
                  <div id="exb-equip-chips" class="flex gap-1 mb-2 flex-wrap"></div>
                  <div id="exb-class-chips" class="flex flex-col gap-1.5 mb-2"></div>
                  <div class="flex items-center justify-end mb-1 px-1">
                    <span id="exb-count" class="text-[10px] text-muted font-mono"></span>
                  </div>
                  <div id="exb-grid" class="bm-cq-grid gap-2"></div>
                </div>`,
`                <div id="exb-grid-col" class="flex-1 min-w-0 overflow-y-auto p-3">
                  <div id="exb-equip-chips" class="flex gap-1 mb-2 flex-wrap"></div>
                  <div id="exb-class-chips" class="flex flex-col gap-1.5 mb-3"></div>
                  <div id="exb-view-toolbar" class="flex items-center justify-between gap-2 mb-2 px-1">
                    <div class="flex items-center gap-1">
                      <span class="text-[9px] font-bold uppercase text-muted" data-i18n="bm.view">View:</span>
                      <select id="exb-group-toggle" class="text-[11px] font-semibold px-2 py-1 rounded-lg border border-border bg-surface-2 hover:bg-border/30 transition cursor-pointer focus:outline-none" title="Toggle grouping">
                        <option value="mechanic" data-i18n="bm.groupMechanic">Compound/Isolation</option>
                        <option value="none" data-i18n="bm.groupFlat">Flat list</option>
                      </select>
                    </div>
                    <span id="exb-count" class="text-[10px] text-muted font-mono"></span>
                  </div>
                  <div id="exb-grid" class="bm-cq-grid gap-2"></div>
                </div>`);

/* ============ 4. CSS: grouped sections for #exb-grid (same as picker) ============ */
repOnce('css-exb-grouped',
`#exb-grid { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }`,
`#exb-grid { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }
/* c76: exercise-DB grouped sections — same as Quick Pick */
#exb-grid.bm-grouped { display: flex; flex-direction: column; gap: 0.75rem; }
#exb-grid.bm-grouped > .bm-section-grid { display: grid; grid-template-columns: repeat(1, minmax(0, 1fr)); gap: 0.5rem; }
@media (min-width: 640px) { #exb-grid.bm-grouped > .bm-section-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (min-width: 1024px) { #exb-grid.bm-grouped > .bm-section-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 359px) { #exb-grid.bm-grouped > .bm-section-grid { grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); } }`);

/* ============ 5. dkExBrowse: state vars ============ */
repOnce('exb-state',
`    var _open = {};
    var _equip = 'all';
    var _cls = { mechanic: null, force: null, level: null, category: null };`,
`    var _open = {};
    var _equip = 'all';
    var _cls = { mechanic: null, force: null, level: null, category: null };
    /* c76: exact Quick Pick parity — favorites/recent tabs, grouping, cap */
    var _favs = [];            /* shared with the picker (settings row 'bm_favorites') */
    var _recentIds = [];       /* like picker: last 20 unique exercise ids from workout_history */
    var _tab = 'source';       /* 'source' | 'favorites' | 'recent' */
    var _lastSrc = 'all';      /* source to restore when leaving ⭐/🕐 */
    var _groupBy = 'mechanic'; /* View dropdown (like picker) */
    var VIS_CAP = 200;         /* like picker VISIBLE_CAP */

    function loadFavs() {
      try {
        if (typeof db === 'undefined' || !db || !db.get) return Promise.resolve();
        return Promise.resolve(db.get('settings', 'bm_favorites')).then(function (row) {
          _favs = (row && row.value) ? row.value : [];
        }).catch(function () { _favs = []; });
      } catch (e) { return Promise.resolve(); }
    }
    function saveFavs() {
      try { if (typeof db !== 'undefined' && db && db.put) db.put('settings', { key: 'bm_favorites', value: _favs }); } catch (e) {}
    }
    function loadRecent() {
      try {
        if (typeof db === 'undefined' || !db || !db.all) { _recentIds = []; return Promise.resolve(); }
        return Promise.resolve(db.all('workout_history')).then(function (history) {
          var seen = {}; var out = [];
          (history || []).sort(function (a, b) { return (b.date || 0) - (a.date || 0); });
          for (var i = 0; i < history.length && out.length < 20; i++) {
            var exs = history[i].exercises || [];
            for (var j = 0; j < exs.length; j++) {
              var id = exs[j] && exs[j].exercise_id;
              if (id && !seen[id]) { seen[id] = 1; out.push(id); if (out.length >= 20) break; }
            }
          }
          _recentIds = out;
        }).catch(function () { _recentIds = []; });
      } catch (e) { _recentIds = []; return Promise.resolve(); }
    }`);

/* ============ 6. dkExBrowse: localFilter + tabFilter ============ */
repOnce('exb-local-filter',
`    function localFilter(items) {
      return (items || []).filter(function (e) {
        if (_equip !== 'all' && equipOf(e) !== _equip) return false;
        for (var k in _cls) {
          if (_cls[k] && e[k] !== _cls[k]) return false;
        }
        return true;
      });
    }`,
`    /* c76: favorites/recent pool restriction (like picker matchFav) */
    function tabFilter(items) {
      if (_tab === 'favorites') return (items || []).filter(function (e) { return _favs.indexOf(e.id) > -1; });
      if (_tab === 'recent') return (items || []).filter(function (e) { return _recentIds.indexOf(e.id) > -1; });
      return (items || []).slice();
    }
    function localFilter(items) {
      return tabFilter(items).filter(function (e) {
        if (_equip !== 'all' && equipOf(e) !== _equip) return false;
        for (var k in _cls) {
          if (_cls[k] && e[k] !== _cls[k]) return false;
        }
        return true;
      });
    }`);

/* ============ 7. dkExBrowse: cardHtml → exact picker renderExCard copy ============ */
repOnce('exb-card',
`    function cardHtml(e) {
      var L = lang();
      var name = exName(e);
      var imgs = e.images || e.i || [];
      var img = imgs[0] || '';
      var src = e.source || e.src || '';
      var code = (src === 'muscle_motion' || src === 'mm') ? 'MM' : ((src === 'burnfit' || src === 'bf') ? 'BF' : ((src === 'gymvisual' || src === 'gv') ? 'GV' : ((src === 'gymimpulse' || src === 'gi') ? 'GI' : 'PG')));
      var codeCls = code === 'BF' ? 'bg-success/15 text-success' : (code === 'GV' ? 'bg-warning/15 text-warning' : 'bg-accent/15 text-accent');
      var chips = '';
      try { if (typeof getExerciseMuscleChips === 'function') chips = getExerciseMuscleChips(e, L) || ''; } catch (err) {}
      var hasVid = !!(e.video_url && String(e.video_url).indexOf('youtu') > -1);
      return '<div data-exb-id="' + esc(e.id) + '" class="bm-ex-card bg-surface border border-border rounded-xl overflow-hidden cursor-pointer hover:border-primary/40 transition">' +
        '<div class="aspect-square bg-white grid place-items-center overflow-hidden">' +
        (img ? '<img src="' + esc(img) + '" alt="' + esc(name) + '" loading="lazy" class="w-full h-full object-contain p-1" />' : '<span class="text-muted text-xs">—</span>') +
        '</div>' +
        '<div class="p-2 space-y-1">' +
        '<div class="text-[13px] font-semibold leading-snug" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">' + esc(name) + '</div>' +
        (chips ? '<div class="flex items-center gap-1 flex-wrap">' + chips + '</div>' : '') +
        '<div class="flex items-center gap-1">' +
        '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded ' + codeCls + '">' + code + '</span>' +
        (hasVid ? '<span class="text-[10px] text-danger">▶</span>' : '') +
        '</div></div></div>';
    }`,
`    function cardHtml(e) {
      /* c76: exact copy of the picker renderExCard — animated frames, star, eye, "+", chips */
      var L = lang();
      var name = exName(e);
      var imgs = e.images || e.i || [];
      var img1 = imgs[0] || '';
      var img2 = imgs[1] || '';
      var id = e.id;
      var isFav = _favs.indexOf(id) > -1;
      var src = e.source || e.src || '';
      var code = (src === 'muscle_motion' || src === 'mm') ? 'MM' : ((src === 'burnfit' || src === 'bf') ? 'BF' : ((src === 'gymvisual' || src === 'gv') ? 'GV' : ((src === 'gymimpulse' || src === 'gi') ? 'GI' : 'PG')));
      var codeCls = code === 'MM' ? 'bg-accent/15 text-accent' : (code === 'BF' ? 'bg-success/15 text-success' : (code === 'GV' ? 'bg-warning/15 text-warning' : (code === 'GI' ? 'bg-accent/15 text-accent' : 'bg-primary/15 text-primary-2')));
      var hasVector = (typeof window.exerciseVectorIllustration === 'function');
      var vectorHtml = hasVector ? window.exerciseVectorIllustration(e, { both: false, size: 140 }) : '';
      var imgHtml = (img1 && img2)
        ? '<div class="ex-anim-container" style="border-radius:0">' +
          '<img src="' + esc(img1) + '" alt="" class="ex-anim-frame-1" loading="lazy" style="object-fit:contain" />' +
          '<img src="' + esc(img2) + '" alt="" class="ex-anim-frame-2" loading="lazy" style="object-fit:contain" />' +
          '</div>'
        : (img1
          ? (e.gif
            ? '<img src="' + esc(e.gif) + '" alt="" class="w-full h-full object-cover" loading="lazy"/>'
            : '<img src="' + esc(img1) + '" alt="" class="w-full h-full object-cover" loading="lazy"/>')
          : (vectorHtml || '<div class="w-full h-full grid place-items-center"><svg class="w-8 h-8 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/></svg></div>'));
      var chips = '';
      try { chips = (typeof window.getExerciseMuscleChips === 'function') ? (window.getExerciseMuscleChips(e, L) || '') : ''; } catch (err) {}
      return '<div class="bm-ex-card bg-surface-2 border border-border rounded-xl overflow-hidden hover:border-primary/30 transition cursor-pointer" data-exb-id="' + esc(id) + '">' +
        '<div class="aspect-square bg-surface relative overflow-hidden">' + imgHtml +
        '<button class="absolute top-1 end-1 w-6 h-6 grid place-items-center rounded-full bg-black/40 text-white z-10" data-exb-fav="' + esc(id) + '" aria-label="Favorite">' +
        '<svg class="w-3.5 h-3.5 ' + (isFav ? 'text-yellow-400' : 'text-white/60') + '" viewBox="0 0 24 24" fill="' + (isFav ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>' +
        '</button></div>' +
        '<div class="p-1.5">' +
        '<div class="text-[13px] font-semibold leading-snug line-clamp-2 min-h-[2.4em]">' + esc(name) + '</div>' +
        '<div class="flex items-center justify-between mt-0.5">' +
        '<span class="text-[10px] font-bold px-1.5 py-0.5 rounded ' + codeCls + '">' + code + '</span>' +
        '<button class="w-6 h-6 grid place-items-center rounded bg-surface hover:bg-primary/20 text-primary-2 transition" data-exb-view="' + esc(id) + '" aria-label="View"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>' +
        '<span class="text-primary-2 text-xs font-bold">+</span>' +
        '</div>' +
        (chips ? '<div class="flex items-center gap-1 flex-wrap mt-1">' + chips + '</div>' : '') +
        '</div></div>';
    }`);

/* ============ 8. dkExBrowse: renderGrid → grouping + cap + show-more ============ */
repOnce('exb-grid-render',
`    function renderGrid(a) {
      var grid = document.getElementById('exb-grid');
      if (!grid) return;
      var items = localFilter(a.items);
      var cnt = document.getElementById('exb-count');
      if (cnt) {
        var u = UNIT[lang()] || 'exercises';
        cnt.textContent = items.length + ' ' + u;
      }
      if (!items.length) {
        grid.innerHTML = '<div class="col-span-full text-center py-8 text-sm text-muted">—</div>';
        return;
      }
      grid.innerHTML = items.map(cardHtml).join('');
    }`,
`    function renderGrid(a) {
      var grid = document.getElementById('exb-grid');
      if (!grid) return;
      var items = localFilter(a.items);
      var cnt = document.getElementById('exb-count');
      if (cnt) {
        var u = UNIT[lang()] || 'exercises';
        cnt.textContent = items.length + ' ' + u;
      }
      if (!items.length) {
        var msg = '—';
        try {
          if (_tab === 'favorites') msg = (typeof t === 'function' && t('exercise.noFavorites')) || 'No favorites yet';
          else if (_tab === 'recent') msg = (typeof t === 'function' && t('exercise.noResults')) || 'No exercises found';
          else msg = (typeof t === 'function' && t('exercise.noResults')) || 'No exercises found';
        } catch (e0) {}
        grid.classList.remove('bm-grouped');
        grid.innerHTML = '<div class="col-span-full text-center py-8 text-sm text-muted">' + esc(msg) + '</div>';
        return;
      }
      var L = lang();
      /* c76: group by mechanic — same rule as the picker */
      var hasMech = false, distinct = {};
      for (var i = 0; i < items.length; i++) {
        var m = items[i].mechanic;
        if (m === 'compound' || m === 'isolation') hasMech = true;
        if (m) distinct[m] = 1;
      }
      var shouldGroup = (_groupBy === 'mechanic') && !_cls.mechanic && hasMech && Object.keys(distinct).length >= 2;
      if (shouldGroup) {
        grid.classList.add('bm-grouped');
        var sections = [
          { key: 'compound', label: L === 'ru' ? 'Базовые' : (L === 'he' ? 'בסיסי' : 'Compound'), icon: '⚙️', cls: 'bm-section-compound' },
          { key: 'isolation', label: L === 'ru' ? 'Изолирующие' : (L === 'he' ? 'בידוד' : 'Isolation'), icon: '🎯', cls: 'bm-section-isolation' },
          { key: 'other', label: L === 'ru' ? 'Другое' : (L === 'he' ? 'אחר' : 'Other'), icon: '📦', cls: 'bm-section-other' }
        ];
        var buckets = { compound: [], isolation: [], other: [] };
        items.forEach(function (e) {
          var mm = e.mechanic;
          if (mm === 'compound') buckets.compound.push(e);
          else if (mm === 'isolation') buckets.isolation.push(e);
          else buckets.other.push(e);
        });
        var present = sections.filter(function (sec) { return buckets[sec.key].length > 0; });
        var capPer = {};
        if (present.length === 1) {
          capPer[present[0].key] = VIS_CAP;
        } else {
          var tot = 0;
          present.forEach(function (sec) { tot += buckets[sec.key].length; });
          present.forEach(function (sec) {
            var pr = Math.floor(VIS_CAP * buckets[sec.key].length / (tot || 1));
            capPer[sec.key] = Math.max(30, Math.min(buckets[sec.key].length, pr));
          });
        }
        var html = '';
        present.forEach(function (sec) {
          var arr = buckets[sec.key].slice().sort(function (x, y) {
            return exName(x).localeCompare(exName(y), L || 'en');
          });
          var vis = arr.slice(0, capPer[sec.key]);
          var rem = arr.length - vis.length;
          html += '<div class="bm-section-header ' + sec.cls + '"><span style="font-size:13px">' + sec.icon + '</span><span>' + esc(sec.label) + '</span><span class="bm-section-count">' + arr.length + '</span></div>';
          html += '<div class="bm-section-grid">' + vis.map(cardHtml).join('') + '</div>';
          if (rem > 0) {
            html += '<div class="text-[10px] text-muted text-center py-1">+' + rem + ' ' + (L === 'ru' ? 'ещё' : (L === 'he' ? 'עוד' : 'more')) + ' — ' + (L === 'ru' ? 'уточните фильтр' : (L === 'he' ? 'סנן' : 'refine filter')) + '</div>';
          }
        });
        grid.innerHTML = html;
        return;
      }
      /* flat rendering + cap + show more (like picker) */
      grid.classList.remove('bm-grouped');
      var visible = items.length > VIS_CAP ? items.slice(0, VIS_CAP) : items;
      var remaining = items.length - visible.length;
      grid.innerHTML = visible.map(cardHtml).join('');
      if (remaining > 0) {
        var showMoreL = 'Show more';
        try { showMoreL = (typeof t === 'function' && t('common.showMore')) || 'Show more'; } catch (e1) {}
        grid.innerHTML += '<button id="exb-show-more" class="col-span-full mt-2 py-2 text-xs font-semibold text-primary-2 hover:bg-primary/10 rounded-lg border border-primary/30 transition">' + esc(showMoreL) + ' (+' + remaining + ')</button>';
      }
    }`);

/* ============ 9. dkExBrowse: wireGrid → star / eye / show-more / card ============ */
repOnce('exb-grid-wire',
`    function wireGrid() {
      var grid = document.getElementById('exb-grid');
      if (!grid || grid.__wired) return;
      grid.__wired = true;
      grid.addEventListener('click', function (ev) {
        var card = ev.target.closest ? ev.target.closest('[data-exb-id]') : null;
        if (!card) return;
        try { screens.exercises.openView(card.getAttribute('data-exb-id')); } catch (e) {}
      });
    }`,
`    function wireGrid() {
      var grid = document.getElementById('exb-grid');
      if (!grid || grid.__wired) return;
      grid.__wired = true;
      grid.addEventListener('click', function (ev) {
        /* c76: star = favorite (same store as the picker) */
        var fav = ev.target.closest ? ev.target.closest('[data-exb-fav]') : null;
        if (fav) {
          var fid = fav.getAttribute('data-exb-fav');
          var ix = _favs.indexOf(fid);
          if (ix > -1) _favs.splice(ix, 1); else _favs.push(fid);
          saveFavs();
          if (_tab === 'favorites') {
            renderGrid(api() || { items: [] });
          } else {
            var svg = fav.querySelector('svg');
            if (svg) {
              var on = ix === -1;
              svg.classList.toggle('text-yellow-400', on);
              svg.classList.toggle('text-white/60', !on);
              svg.setAttribute('fill', on ? 'currentColor' : 'none');
            }
          }
          return;
        }
        /* c76: eye = view (same modal as the picker) */
        var view = ev.target.closest ? ev.target.closest('[data-exb-view]') : null;
        if (view) {
          try { if (typeof openExerciseModal === 'function') openExerciseModal(view.getAttribute('data-exb-view')); } catch (e) {}
          return;
        }
        /* c76: show more — render the full capped set (like picker) */
        var more = ev.target.closest ? ev.target.closest('#exb-show-more') : null;
        if (more) {
          var a1 = api();
          if (a1) {
            var all = localFilter(a1.items);
            grid.classList.remove('bm-grouped');
            grid.innerHTML = all.map(cardHtml).join('');
          }
          return;
        }
        var card = ev.target.closest ? ev.target.closest('[data-exb-id]') : null;
        if (!card) return;
        try { if (typeof openExerciseModal === 'function') openExerciseModal(card.getAttribute('data-exb-id')); else screens.exercises.openView(card.getAttribute('data-exb-id')); } catch (e) {}
      });
    }`);

/* ============ 10. dkExBrowse: tabs + view-dropdown wiring (new functions) ============ */
repOnce('exb-tabs-wiring',
`    /* ---------- sync ---------- */
    function sync() {`,
`    /* ---------- c76: ⭐/🕐 tabs + View dropdown (exact Quick Pick parity) ---------- */
    function renderTabs() {
      var fav = document.getElementById('exb-tab-favorites');
      var rec = document.getElementById('exb-tab-recent');
      if (_tab !== 'source') {
        document.querySelectorAll('.ex-src-btn').forEach(function (x) {
          x.classList.remove('bg-primary'); x.classList.remove('text-white'); x.classList.add('text-muted');
        });
      }
      if (fav) {
        fav.classList.toggle('bg-primary', _tab === 'favorites');
        fav.classList.toggle('text-white', _tab === 'favorites');
        fav.classList.toggle('text-muted', _tab !== 'favorites');
      }
      if (rec) {
        rec.classList.toggle('bg-primary', _tab === 'recent');
        rec.classList.toggle('text-white', _tab === 'recent');
        rec.classList.toggle('text-muted', _tab !== 'recent');
      }
    }
    function rerenderPool() {
      var a = api();
      if (!a) return;
      var av = { items: tabFilter(a.items), group: a.group, subgroup: a.subgroup };
      renderTree(av);
      renderChips(av);
      renderGrid({ items: av.items });
    }
    function wireTabs() {
      var marker = document.querySelector('[data-exercise-source="all"]');
      var cont = marker ? marker.parentElement : null;
      if (!cont || cont.__exbTabs) return;
      cont.__exbTabs = true;
      /* capture phase: runs before the app's own .ex-src-btn handler */
      cont.addEventListener('click', function (ev) {
        var fav = ev.target.closest ? ev.target.closest('#exb-tab-favorites') : null;
        var rec = ev.target.closest ? ev.target.closest('#exb-tab-recent') : null;
        var src = ev.target.closest ? ev.target.closest('.ex-src-btn') : null;
        if (fav || rec) {
          if (_tab === 'source') {
            var act = cont.querySelector('.ex-src-btn.bg-primary');
            _lastSrc = (act && act.getAttribute('data-exercise-source')) || _lastSrc || 'all';
          }
          var goingBack = (_tab !== 'source');
          _tab = goingBack ? 'source' : (fav ? 'favorites' : 'recent');
          if (_tab === 'source') {
            document.querySelectorAll('.ex-src-btn').forEach(function (x) {
              var on = x.getAttribute('data-exercise-source') === _lastSrc;
              x.classList.toggle('bg-primary', on);
              x.classList.toggle('text-white', on);
              x.classList.toggle('text-muted', !on);
            });
            try { if (screens.exercises && screens.exercises.setSource) screens.exercises.setSource(_lastSrc); } catch (e) {}
          }
          if (_tab === 'recent') loadRecent().then(function () { renderTabs(); rerenderPool(); });
          renderTabs();
          rerenderPool();
          return;
        }
        if (src) {
          _tab = 'source';
          renderTabs();
        }
      }, true);
    }
    function wireGroupToggle() {
      var sel = document.getElementById('exb-group-toggle');
      if (!sel || sel.__wired) return;
      sel.__wired = true;
      sel.addEventListener('change', function () {
        _groupBy = (sel.value === 'none') ? 'none' : 'mechanic';
        renderGrid(api() || { items: [] });
      });
    }

    /* ---------- sync ---------- */
    function sync() {`);

/* ============ 11. sync(): re-render body map (localized labels) + tabs + filtered pool ============ */
repOnce('exb-sync',
`      /* c75: first sync paints the body map (previously drawn only when the panel was toggled) */
      var svgBox = document.getElementById('exercise-bodymap-svg');
      if (svgBox && !document.getElementById('exercise-bodymap-panel').classList.contains('hidden')) {
        if (!svgBox.querySelector('svg') && typeof window.__exBmRender === 'function') window.__exBmRender('front');
        if (typeof window.__exBmApplyMode === 'function') { try { window.__exBmApplyMode(); } catch (e) {} }
      }
      renderTree(a);
      renderChips(a);
      renderGrid(a);`,
`      /* c75: first sync paints the body map (previously drawn only when the panel was toggled) */
      /* c76: re-render on every sync — keeps Front/Back/Side labels localized (picker parity) */
      var svgBox = document.getElementById('exercise-bodymap-svg');
      if (svgBox && !document.getElementById('exercise-bodymap-panel').classList.contains('hidden')) {
        if (typeof window.__exBmRender === 'function') { try { window.__exBmRender(); } catch (e) {} }
        if (typeof window.__exBmApplyMode === 'function') { try { window.__exBmApplyMode(); } catch (e) {} }
      }
      renderTabs();
      /* c76: on ⭐/🕐 tabs the tree/chips counts reflect the restricted pool (like picker) */
      var av = { items: tabFilter(a.items), group: a.group, subgroup: a.subgroup };
      renderTree(av);
      renderChips(av);
      renderGrid(av);`);

/* ============ 12. init(): wire tabs + dropdown + load favorites/recent ============ */
repOnce('exb-init',
`      wireTree(); wireChips(); wireGrid();
      sync();
    }`,
`      wireTree(); wireChips(); wireGrid(); wireTabs(); wireGroupToggle();
      loadFavs().then(function () { try { sync(); } catch (e) {} });
      loadRecent();
      sync();
    }`);

/* ============ 13. Front/Back/Side map tabs → localized (picker parity) ============ */
repOnce('bm-tabs-localized',
`      // Update view tab styling
      ['front', 'back', 'side'].forEach(v => {
        const btn = document.getElementById('ex-bm-view-' + v);
        if (btn) {
          if (v === view) { btn.classList.add('bg-primary','text-white'); btn.classList.remove('text-muted'); }
          else { btn.classList.remove('bg-primary','text-white'); btn.classList.add('text-muted'); }
        }
      });
    }`,
`      // Update view tab styling
      ['front', 'back', 'side'].forEach(v => {
        const btn = document.getElementById('ex-bm-view-' + v);
        if (btn) {
          if (v === view) { btn.classList.add('bg-primary','text-white'); btn.classList.remove('text-muted'); }
          else { btn.classList.remove('bg-primary','text-white'); btn.classList.add('text-muted'); }
        }
      });
      /* c76: localized labels — exact copy of the picker (Спереди / Сзади / Сбоку) */
      const bLang = (typeof currentLang === 'function') ? currentLang() : 'en';
      const bLbl = { front: { en: 'Front', ru: 'Спереди', he: 'קדימה' }, back: { en: 'Back', ru: 'Сзади', he: 'אחורה' }, side: { en: 'Side', ru: 'Сбоку', he: 'צד' } };
      ['front', 'back', 'side'].forEach(v => {
        const b = document.getElementById('ex-bm-view-' + v);
        if (b) b.textContent = bLbl[v][bLang] || bLbl[v].en;
      });
    }`);

/* ============ 14. Versions: dk-build c76, RUNNING=76 ============ */
repOnce('ver-meta',
`<meta name="dk-build" content="c75" />`,
`<meta name="dk-build" content="c76" />`);

repOnce('ver-running',
`  var RUNNING = 75; /* numeric part of dk-build c75 */`,
`  var RUNNING = 76; /* numeric part of dk-build c76 */`);

fs.writeFileSync(F, s);

/* ============ sw.js ============ */
const SW = 'sw.js';
let sw = fs.readFileSync(SW, 'utf8');
const swAnchor = `const CACHE_NAME = 'dk-gym-v102'; // v102: c75 — 3D atlas 1.5x + Settings ▸ UI sizes (atlas slider, bodymap/exercise-panel fixes) + Exercise DB tab rebuilt as picker-style browse`;
if (sw.split(swAnchor).length - 1 === 1) {
  sw = sw.replace(swAnchor,
`const CACHE_NAME = 'dk-gym-v103'; // v103: c76 — Exercise DB tab = exact Quick Pick copy (star/eye/+ cards, favorites/recent tabs, View grouping, localized map tabs)
// v102: c75 — 3D atlas 1.5x + Settings ▸ UI sizes (atlas slider, bodymap/exercise-panel fixes) + Exercise DB tab rebuilt as picker-style browse`);
  fs.writeFileSync(SW, sw);
  console.log('ok  [sw-v103]');
  applied++;
} else {
  console.error('FAIL [sw-v103]: anchor not found');
  failed++;
}

/* ============ sanity ============ */
const blocks = s.split(/<script[\s>]/i).length - 1;
console.log('script blocks:', blocks);
const checks = [
  ['exb-tab-favorites', 2],   /* html button + js getElementById */
  ['exb-tab-recent', 2],
  ['exb-group-toggle', 2],
  ['bm_favorites', 3],        /* picker load + exb load + exb save */
  ['dk-build" content="c76"', 1],
  ['var RUNNING = 76', 1]
];
let sane = true;
checks.forEach(([needle, want]) => {
  const n = s.split(needle).length - 1;
  if (n < want) { console.error(`SANITY FAIL: "${needle}" count=${n} want>=${want}`); sane = false; }
  else console.log(`sanity ok: "${needle}" x${n}`);
});
const swN = sw.split('dk-gym-v103').length - 1;
if (swN < 1) { console.error('SANITY FAIL: sw v103 missing'); sane = false; }

console.log(`\nApplied: ${applied}, failed: ${failed}, sanity: ${sane ? 'OK' : 'BROKEN'}`);
process.exit(failed > 0 || !sane ? 1 : 0);
