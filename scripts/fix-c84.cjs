#!/usr/bin/env node
/* ============================================================================
 * fix-c84.cjs — two changes
 *
 * 1) «Добавить клиента» on desktop now lives INSIDE the Clients screen exactly
 *    like on the smartphone: the pinned aside-bottom button (#aside-add-client)
 *    is removed and #dash-add-btn loses its lg:hidden — the Clients screen
 *    header button is the one and only entry point on every viewport.
 *
 * 2) Workouts ▸ «База упражнений» becomes THE SAME PANEL as the «Выбор
 *    упражнений» (Quick Pick) modal — literally the same component, single
 *    shared DOM (#bm-root), so every future edit automatically applies to both.
 *    bodyMapPicker (the one module that renders it) gains mountInline():
 *      • re-parents #bm-root into #exb-qp-host on the Workouts screen
 *      • browse mode: _callback = null → cards NEVER auto-add to a running
 *        workout (user request) — clicking a card opens its details instead
 *      • panel title reads «Тренировки» (data-i18n swapped to workouts.title)
 *      • open() re-parents back into the modal shell — live-workout picking
 *        keeps working exactly as before
 *    screens.exercises.applyFilters() remounts the panel with the current
 *    pool (non-archived, or archived-only in archive mode) and re-applies the
 *    atlas muscle filter (setBodyMapFilter flow). Manage row (Edit tree /
 *    Archive / Add exercise) stays above the panel; the duplicated source-tab
 *    row + search + exb layout DOM is kept hidden (wiring references it).
 *
 *    Versions: meta c83→c84, RUNNING 83→84, login footer c83→c84,
 *    sw dk-gym-v110→v111 (+history line).
 * ==========================================================================*/
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FILE = path.join(ROOT, 'fitness-crm.html');
const SW = path.join(ROOT, 'sw.js');
let html = fs.readFileSync(FILE, 'utf8');
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

function repExactly(name, anchor, replacement, expected) {
  let count = 0, idx = 0;
  while ((idx = html.indexOf(anchor, idx)) !== -1) { count++; idx += anchor.length; }
  if (count !== expected) { fails.push(`[${name}] expected ${expected} occurrences, found ${count}`); return; }
  html = html.split(anchor).join(replacement);
  patched++;
  console.log(`OK  ${name} (${expected} sites)`);
}

function repOnceSw(name, anchor, replacement) {
  const idx = sw.indexOf(anchor);
  if (idx === -1) { fails.push(`[${name}] anchor NOT FOUND (sw)`); return; }
  if (sw.indexOf(anchor, idx + 1) !== -1) { fails.push(`[${name}] anchor NOT UNIQUE (sw)`); return; }
  sw = sw.slice(0, idx) + replacement + sw.slice(idx + anchor.length);
  patched++;
  console.log(`OK  ${name} (sw.js)`);
}

/* ============================================================
 * 1) Quick Pick panel: give the shared component an id
 * ============================================================ */
repOnce(
  'bm-root id',
  `<div class="bg-surface w-full max-w-[min(96vw,1152px)] max-h-[calc(100dvh-1rem)] sm:max-h-[92vh] flex flex-col rounded-2xl border border-border shadow-float" style="container-type:inline-size;container-name:bmPicker">`,
  `<div id="bm-root" class="bg-surface w-full max-w-[min(96vw,1152px)] max-h-[calc(100dvh-1rem)] sm:max-h-[92vh] flex flex-col rounded-2xl border border-border shadow-float" style="container-type:inline-size;container-name:bmPicker">`
);

/* ============================================================
 * 2) Workouts exercises panel — remove the duplicated source-tab
 *    row, add the mount host, hide the legacy browse DOM
 * ============================================================ */
repOnce(
  'remove exb source-tab row',
  `                <!-- c76: exact copy of the Quick Pick tab bar (All / Burnfit / Gym Visual / GymImpulse / ⭐ / 🕐) -->
                <div class="flex gap-1 bg-surface-2 border border-border rounded-lg p-0.5 flex-nowrap overflow-x-auto no-scrollbar min-[1440px]:overflow-x-visible">
                  <button data-exercise-source="all" class="ex-src-btn shrink-0 px-2.5 py-1 min-[1440px]:px-3 min-[1440px]:py-1.5 rounded-md text-xs min-[1440px]:text-[14px] font-semibold transition bg-primary text-white" data-i18n="common.all">All</button>
                  <button data-exercise-source="burnfit" class="ex-src-btn shrink-0 px-2.5 py-1 min-[1440px]:px-3 min-[1440px]:py-1.5 rounded-md text-xs min-[1440px]:text-[14px] font-semibold transition text-muted" data-i18n="exercise.sourceBurnfit">Burnfit</button>
                  <button data-exercise-source="gymvisual" class="ex-src-btn shrink-0 px-2.5 py-1 min-[1440px]:px-3 min-[1440px]:py-1.5 rounded-md text-xs min-[1440px]:text-[14px] font-semibold transition text-muted" data-i18n="exercise.sourceGymVisual">Gym Visual</button>
                  <button data-exercise-source="gymimpulse" class="ex-src-btn shrink-0 px-2.5 py-1 min-[1440px]:px-3 min-[1440px]:py-1.5 rounded-md text-xs min-[1440px]:text-[14px] font-semibold transition text-muted" data-i18n="exercise.sourceGymImpulse">GymImpulse</button>
                  <button id="exb-tab-favorites" aria-label="Favorites" class="shrink-0 px-2.5 py-1 min-[1440px]:px-3 min-[1440px]:py-1.5 rounded-md text-xs min-[1440px]:text-[14px] font-semibold transition text-muted">⭐</button>
                  <button id="exb-tab-recent" aria-label="Recent" class="shrink-0 px-2.5 py-1 min-[1440px]:px-3 min-[1440px]:py-1.5 rounded-md text-xs min-[1440px]:text-[14px] font-semibold transition text-muted">🕐</button>
                </div>
                <span id="exercise-count"`,
  `                <span id="exercise-count"`
);

repOnce(
  'mount host + hide legacy browse DOM',
  `              <!-- Search -->
              <div class="flex flex-col sm:flex-row gap-2 mb-3">`,
  `              <!-- c84: the SAME Quick Pick component as the «Выбор упражнений» modal,
                   mounted inline in browse mode (cards never auto-add to a workout) -->
              <div id="exb-qp-host" class="hidden"></div>
              <!-- c84: legacy browse DOM kept hidden — existing wiring references these IDs -->
              <div class="hidden">
              <!-- Search -->
              <div class="flex flex-col sm:flex-row gap-2 mb-3">`
);

repOnce(
  'close hidden legacy wrapper',
  `                <p class="text-sm text-muted" data-i18n="exercise.noResults">No exercises found</p>
              </div>
            </div>`,
  `                <p class="text-sm text-muted" data-i18n="exercise.noResults">No exercises found</p>
              </div>
              </div>
            </div>`
);

/* ============================================================
 * 3) CSS — de-scope the card-zoom rule, modal-width zoom for the
 *    inline host, inline panel sizing, hide the X while inline
 * ============================================================ */
repOnce(
  'de-scope card zoom rule',
  `    #bodymap-picker-modal #bm-ex-grid .flex.items-center.gap-2,
    #bodymap-picker-modal #bm-fav-grid .flex.items-center.gap-2,
    #bodymap-picker-modal #bm-recent-grid .flex.items-center.gap-2 {
      zoom: var(--ui-exercise-card, 1);
    }`,
  `    /* c84: was scoped to the modal — the same grids now also render inline */
    #bm-ex-grid .flex.items-center.gap-2,
    #bm-fav-grid .flex.items-center.gap-2,
    #bm-recent-grid .flex.items-center.gap-2 {
      zoom: var(--ui-exercise-card, 1);
    }`
);

repOnce(
  'modal-width zoom covers inline host',
  `    /* Modal width — affects all modal content containers */
    [class*="fixed inset-0"] > [class*="bg-surface"] {
      zoom: var(--ui-modal-width);
    }`,
  `    /* Modal width — affects all modal content containers
       (c84: + the inline Quick Pick panel so both stay identical) */
    [class*="fixed inset-0"] > [class*="bg-surface"],
    #exb-qp-host > #bm-root {
      zoom: var(--ui-modal-width);
    }`
);

repOnce(
  'inline panel CSS',
  `.dk-pos-flash { animation: dk-pos-flash-kf 2.4s ease; }
@keyframes dk-pos-flash-kf {
  0%, 55% { box-shadow: 0 0 0 3px rgb(var(--c-primary) / .55); }
  100% { box-shadow: 0 0 0 0 rgb(var(--c-primary) / 0); }
}
</style>`,
  `.dk-pos-flash { animation: dk-pos-flash-kf 2.4s ease; }
@keyframes dk-pos-flash-kf {
  0%, 55% { box-shadow: 0 0 0 3px rgb(var(--c-primary) / .55); }
  100% { box-shadow: 0 0 0 0 rgb(var(--c-primary) / 0); }
}
/* ===== c84: Quick Pick panel mounted inline in Workouts ▸ База упражнений ===== */
#bm-root.bm-inline { max-width: none; height: min(74vh, 960px); }
.bm-inline #bm-close { display: none; }
</style>`
);

/* ============================================================
 * 4) bodyMapPicker — one component, two mounts
 * ============================================================ */
repOnce(
  'open() delegates to shared __activate',
  `    function open(onPick, cache) {
      _callback = onPick;
      _cache = cache || [];
      _activeGroup = null;`,
  `    function open(onPick, cache) {
      _callback = onPick || null;
      _cache = cache || [];
      /* c84: if the panel was mounted inline in the Workouts screen, take it
         back into the modal shell first — one component, two mounts. */
      __detachInline();
      __restoreModalChrome();
      __activate();
      setTimeout(() => { const s = document.getElementById('bm-search'); if (s) s.focus(); }, 100);
    }

    /* c84: shared activation — reset filters + wire controls + render.
       Used by BOTH open() (modal mode) and mountInline() (Workouts ▸
       База упражнений), so the two are always identical by construction. */
    function __activate() {
      _activeGroup = null;`
);

repOnce(
  'strip modal chrome from __activate',
  `      const modal = document.getElementById('bodymap-picker-modal');
      modal.classList.remove('hidden');
      // Manually translate title (fix for dynamic modal)
      const qpTitle = modal.querySelector('[data-i18n="programs.quickPick"]');
      if (qpTitle) qpTitle.textContent = t('programs.quickPick');
      // Translate search placeholder
      const searchInput = document.getElementById('bm-search');
      if (searchInput) searchInput.placeholder = t('exercise.searchPlaceholder') || 'Search...';
      // Wire tab buttons`,
  `      // Wire tab buttons`
);

repOnce(
  'remove focus tail from __activate',
  `      updateGroupToggleLabel();
      renderAll();
      setTimeout(() => { if (search) search.focus(); }, 100);
    }`,
  `      updateGroupToggleLabel();
      renderAll();
    }`
);

repOnce(
  'inline mount + detach + chrome + setGroupFilter',
  `    function close() {
      document.getElementById('bodymap-picker-modal').classList.add('hidden');
    }`,
  `    function close() {
      document.getElementById('bodymap-picker-modal').classList.add('hidden');
    }

    /* c84: move the panel back into the modal shell if it was mounted inline */
    function __detachInline() {
      try {
        const modal = document.getElementById('bodymap-picker-modal');
        const root = document.getElementById('bm-root');
        if (!modal || !root) return;
        if (root.parentElement && root.parentElement.id === 'exb-qp-host') {
          root.parentElement.classList.add('hidden');
          modal.appendChild(root);
        }
        root.classList.remove('bm-inline');
      } catch (_e) {}
    }

    /* c84: modal chrome — title back to «Выбор упражнений» */
    function __restoreModalChrome() {
      const modal = document.getElementById('bodymap-picker-modal');
      if (!modal) return;
      modal.classList.remove('hidden');
      const qpTitle = modal.querySelector('[data-i18n="programs.quickPick"], [data-i18n="workouts.title"]');
      if (qpTitle) { qpTitle.setAttribute('data-i18n', 'programs.quickPick'); qpTitle.textContent = t('programs.quickPick'); }
      const searchInput = document.getElementById('bm-search');
      if (searchInput) searchInput.placeholder = t('exercise.searchPlaceholder') || 'Search...';
    }

    /* c84: mount THE SAME picker component inline in the Workouts screen.
       Browse mode: _callback = null → cards never add to a workout (the user
       request); clicking a card opens its details instead. The panel is the
       single shared DOM — any future edit applies to both mounts. */
    function mountInline(hostId, cache) {
      const host = document.getElementById(hostId);
      const root = document.getElementById('bm-root');
      const modal = document.getElementById('bodymap-picker-modal');
      if (!host || !root || !modal) return;
      _callback = null;
      _cache = cache || _cache || [];
      modal.classList.add('hidden');
      if (root.parentElement !== host) host.appendChild(root);
      root.classList.add('bm-inline');
      host.classList.remove('hidden');
      const qpTitle = root.querySelector('[data-i18n="programs.quickPick"], [data-i18n="workouts.title"]');
      if (qpTitle) { qpTitle.setAttribute('data-i18n', 'workouts.title'); qpTitle.textContent = t('workouts.title'); }
      __activate();
    }

    /* c84: filter the panel to a muscle group from outside (atlas flow) */
    function setGroupFilter(group, subgroup) {
      _activeGroup = group || null;
      _activeSubgroup = subgroup || null;
      if (_activeGroup) _expandedGroups.add(_activeGroup);
      renderAll();
    }`
);

repOnce(
  'refresh() works for both mounts',
  `    function refresh() {
      const modal = document.getElementById('bodymap-picker-modal');
      if (!modal || modal.classList.contains('hidden')) return;
      const qpTitle = modal.querySelector('[data-i18n="programs.quickPick"]');
      if (qpTitle) qpTitle.textContent = t('programs.quickPick');
      const searchInput = document.getElementById('bm-search');
      if (searchInput) searchInput.placeholder = t('exercise.searchPlaceholder') || 'Search...';
      renderAll();
    }`,
  `    function refresh() {
      /* c84: re-render in the current language wherever the panel lives —
         modal OR inline in the Workouts screen (title follows the mount) */
      const modal = document.getElementById('bodymap-picker-modal');
      const root = document.getElementById('bm-root');
      const inlineVisible = !!(root && root.classList.contains('bm-inline') && root.offsetParent !== null);
      const modalVisible = !!(modal && !modal.classList.contains('hidden'));
      if (!modalVisible && !inlineVisible) return;
      const qpTitle = root ? root.querySelector('[data-i18n="programs.quickPick"], [data-i18n="workouts.title"]') : null;
      if (qpTitle) qpTitle.textContent = t((inlineVisible && !modalVisible) ? 'workouts.title' : 'programs.quickPick');
      const searchInput = document.getElementById('bm-search');
      if (searchInput) searchInput.placeholder = t('exercise.searchPlaceholder') || 'Search...';
      renderAll();
    }`
);

repOnce(
  'export new API',
  `    return { open, close, refresh };`,
  `    return { open, close, refresh, mountInline, setGroupFilter };`
);

/* ============================================================
 * 5) Browse mode: cards never auto-add — click shows details
 * ============================================================ */
repOnce(
  'browse guard (flat grid)',
  `            const id = el.getAttribute('data-bm-add');
            const ex = _cache.find(x => x.id === id);
            if (ex && _callback) {`,
  `            const id = el.getAttribute('data-bm-add');
            const ex = _cache.find(x => x.id === id);
            /* c84: browse mode (Workouts panel) — never adds; show details */
            if (!_callback) { if (ex && typeof openExerciseModal === 'function') openExerciseModal(id); return; }
            if (ex && _callback) {`
);

repExactly(
  'browse guard (fav + recent grids)',
  `          const id = el.getAttribute('data-bm-add');
          const ex = _cache.find(x => x.id === id);
          if (ex && _callback) {`,
  `          const id = el.getAttribute('data-bm-add');
          const ex = _cache.find(x => x.id === id);
          /* c84: browse mode (Workouts panel) — never adds; show details */
          if (!_callback) { if (ex && typeof openExerciseModal === 'function') openExerciseModal(id); return; }
          if (ex && _callback) {`,
  2
);

/* ============================================================
 * 6) screens.exercises — remount the shared panel with the pool
 * ============================================================ */
repOnce(
  'applyFilters remounts panel',
  `        return true;
      });
      renderTree();
    }`,
  `        return true;
      });
      renderTree();
      _mountPanel();
    }

    /* c84: (re)mount the SHARED Quick Pick panel into the Exercise DB tab.
       Pool: non-archived (archived-only in archive mode); the atlas muscle
       filter (setBodyMapFilter) is re-applied after mount. */
    function _mountPanel() {
      if (typeof bodyMapPicker === 'undefined' || !bodyMapPicker.mountInline) return;
      try {
        const pool = _all.filter(e => _archiveMode ? !!e.is_archived : !e.is_archived);
        bodyMapPicker.mountInline('exb-qp-host', pool);
        if (_bmGroup && bodyMapPicker.setGroupFilter) bodyMapPicker.setGroupFilter(_bmGroup, _bmSubgroup || null);
      } catch (e0) { console.warn('[exercises] mount panel failed', e0); }
    }`
);

/* ============================================================
 * 7) Add Client — inside the Clients screen on every viewport
 * ============================================================ */
repOnce(
  'remove aside Add Client button',
  `        <div class="p-3 border-t border-border">
          <button id="aside-add-client" class="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-2 text-white font-semibold text-sm py-2.5 rounded-xl transition shadow-card">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
            <span data-i18n="aside.addClient">Add Client</span>
          </button>
        </div>
      </aside>`,
  `      </aside>`
);

repOnce(
  'dash Add Client visible on desktop too',
  `<button id="dash-add-btn" class="ms-auto lg:hidden inline-flex items-center gap-1.5 bg-primary hover:bg-primary-2 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition shadow-card">`,
  `<button id="dash-add-btn" class="ms-auto inline-flex items-center gap-1.5 bg-primary hover:bg-primary-2 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition shadow-card">`
);

/* ============================================================
 * 8) Version bumps
 * ============================================================ */
repOnce('meta c84', `<meta name="dk-build" content="c83" />`, `<meta name="dk-build" content="c84" />`);
repOnce('login footer c84', `· IndexedDB · 3 languages · c83</p>`, `· IndexedDB · 3 languages · c84</p>`);
repOnce('RUNNING = 84', `var RUNNING = 83; /* numeric part of dk-build c83 */`, `var RUNNING = 84; /* numeric part of dk-build c84 */`);

repOnceSw(
  'sw cache v111 + history',
  `// v110: c83 — header dumbbell button (left of the language selector): one-tap return to the live workout at the exercise the user is actually working on (last set touched → first unfinished → last), from any screen and from inside the live scroll itself; green pulse dot marks a running session
const CACHE_NAME = 'dk-gym-v110';`,
  `// v110: c83 — header dumbbell button (left of the language selector): one-tap return to the live workout at the exercise the user is actually working on (last set touched → first unfinished → last), from any screen and from inside the live scroll itself; green pulse dot marks a running session
// v111: c84 — Workouts ▸ Exercise DB = THE SAME Quick Pick component as the «Выбор упражнений» modal (single shared #bm-root DOM, mounted inline in browse mode: cards never auto-add — a click opens details; title «Тренировки»); manage row keeps Edit-tree/Archive/Add-exercise; Add Client moved from the desktop aside into the Clients screen header (same as mobile)
const CACHE_NAME = 'dk-gym-v111';`
);

/* ============================================================
 * Sanity + write
 * ============================================================ */
console.log('--- sanity ---');
function must(cond, msg) {
  if (cond) { console.log('OK  ' + msg); } else { fails.push('SANITY: ' + msg); }
}
must((html.match(/id="bm-root"/g) || []).length === 1, 'bm-root id once');
must((html.match(/function __activate\(/g) || []).length === 1, '__activate defined once');
must((html.match(/__activate\(\);/g) || []).length === 2, '__activate called from open + mountInline');
must((html.match(/function mountInline\(/g) || []).length === 1, 'mountInline defined once');
must((html.match(/function setGroupFilter\(/g) || []).length === 1, 'setGroupFilter defined once');
must((html.match(/return \{ open, close, refresh, mountInline, setGroupFilter \};/g) || []).length === 1, 'module exports extended');
must((html.match(/if \(!_callback\) \{ if \(ex && typeof openExerciseModal === 'function'\) openExerciseModal\(id\); return; \}/g) || []).length === 3, 'browse guard in all 3 grids');
must((html.match(/id="exb-qp-host"/g) || []).length === 1, 'mount host in markup once');
must((html.match(/mountInline\('exb-qp-host', pool\)/g) || []).length === 1, '_mountPanel wires the host');
must((html.match(/_mountPanel\(\);/g) || []).length === 1, 'applyFilters remounts');
must(!html.includes('<!-- c76: exact copy of the Quick Pick tab bar'), 'duplicated exb source tabs gone');
must((html.match(/data-exercise-source=/g) || []).length === 1, 'only the JS wireTabs marker remains');
must(html.includes('<div class="hidden">\n              <!-- Search -->'), 'legacy browse DOM hidden');
must(html.includes('#bm-root.bm-inline { max-width: none; height: min(74vh, 960px); }'), 'inline sizing rule');
must(html.includes('.bm-inline #bm-close { display: none; }'), 'X hidden while inline');
must(html.includes('#exb-qp-host > #bm-root {'), 'modal-width zoom covers inline');
must(!html.includes('#bodymap-picker-modal #bm-ex-grid'), 'card zoom de-scoped');
must(!html.includes('aside-add-client" class'), 'aside Add Client button removed');
must(html.includes('id="aside-add-client"') === false, 'no aside button markup');
must(html.includes("['dash-add-btn', 'dash-empty-add', 'aside-add-client']"), 'JS list kept (null-safe)');
must(html.includes('id="dash-add-btn" class="ms-auto inline-flex'), 'dash button on desktop too');
must(!html.includes('ms-auto lg:hidden inline-flex'), 'lg:hidden removed from dash button');
must(html.includes('content="c84"') && !html.includes('content="c83"'), 'meta = c84 only');
must((html.match(/· c84<\/p>/g) || []).length === 1, 'login footer = c84');
must(html.includes('var RUNNING = 84;'), 'RUNNING = 84');
must(sw.includes("const CACHE_NAME = 'dk-gym-v111';") && !sw.includes("'dk-gym-v110'"), 'sw CACHE_NAME = v111');
must(!fails.length, 'no failures');

if (fails.length) {
  console.error('\nFAILED:\n' + fails.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
fs.writeFileSync(FILE, html);
fs.writeFileSync(SW, sw);
console.log(`\nDone. ${patched} patches written.\n`);
