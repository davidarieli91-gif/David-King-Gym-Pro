/* c78: (1) UI-size persistence race FIXED — saveUiSize no longer does an async
 *      read-modify-write per call; the Reset button fired 7 of them concurrently
 *      on the same ui_sizes row, the last stale write won and manually-reset
 *      values (e.g. exercise-panel stuck at max 2.0) reappeared after every
 *      reload. Now: one in-memory UI_STATE + ONE debounced whole-object write,
 *      plus a one-time sanitize of values stuck at a slider's max.
 *      (2) Exercise DB tab = picker parity: flat view by default (no «БАЗОВЫЕ»
 *      section bars until the user asks), localized "All" in the МЕХАНИКА row,
 *      no counts on equipment chips, muscle chips capped at 2 secondary + "+N"
 *      so fullbody moves stop stacking 6 chips (picker cards included).
 *      Version bumps c78 / RUNNING=78 / sw dk-gym-v105.
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'fitness-crm.html');
const MM   = path.join(__dirname, '..', 'src', 'muscle-map.js');
const SW   = path.join(__dirname, '..', 'sw.js');
let s = fs.readFileSync(FILE, 'utf8');
const orig = s;
let mm = fs.readFileSync(MM, 'utf8');
const mmOrig = mm;
let sw = fs.readFileSync(SW, 'utf8');
const swOrig = sw;

function repOnce(name, anchor, replacement, target) {
  const t = target || 'crm';
  const src = t === 'crm' ? s : (t === 'mm' ? mm : sw);
  const n = src.split(anchor).length - 1;
  if (n !== 1) {
    console.error('ANCHOR "' + name + '" found ' + n + ' times in ' + t + ' — abort');
    process.exit(1);
  }
  if (t === 'crm') s = s.replace(anchor, replacement);
  else if (t === 'mm') mm = mm.replace(anchor, replacement);
  else sw = sw.replace(anchor, replacement);
  console.log('ok  ' + name);
}

/* ========== 1) race-free ui-size persistence ========== */

/* 1a. state + clamp/apply/persist + loadUiSizes */
repOnce('loadUiSizes + state',
`    const UI_SIZE_KEYS = ['exercise-img', 'food-img', 'exercise-panel', 'exercise-card', 'modal-width', 'bodymap', 'atlas'];
    async function loadUiSizes() {
      try {
        const row = await db.get('settings', 'ui_sizes');
        const sizes = row && row.value ? row.value : {};
        /* c77: clamp persisted values to each slider's legal range — a corrupted
           or out-of-range save can no longer render inconvenient graphics */
        const _UI_RANGES = { 'exercise-img': [0.5, 2.5], 'food-img': [0.5, 2.5], 'exercise-panel': [0.6, 2.0], 'exercise-card': [0.6, 1.8], 'modal-width': [0.8, 1.5], 'bodymap': [0.6, 2.0], 'atlas': [1, 2.5] };
        UI_SIZE_KEYS.forEach(key => {
          const _dv = (key === 'atlas' ? 1.5 : 1);
          const _raw = sizes[key] != null ? Number(sizes[key]) : NaN;
          let val = Number.isFinite(_raw) ? _raw : _dv;
          const _rng = _UI_RANGES[key];
          if (_rng) val = Math.min(_rng[1], Math.max(_rng[0], val));
          const slider = document.getElementById('ui-size-' + key);
          const valEl = document.getElementById('ui-size-' + key + '-val');
          if (slider) slider.value = val;
          if (valEl) valEl.textContent = val.toFixed(2) + 'x';
          // Apply to CSS variable
          const cssVar = '--ui-' + key.replace('-', '-');
          document.documentElement.style.setProperty(cssVar, val);
        });
      } catch (e) { console.warn('[ui-sizes] load failed:', e); }
      /* c77: apply saved image sizes to the modal media columns on boot */
      try { applyMediaCols(); } catch (_e) {}
    }`,
`    const UI_SIZE_KEYS = ['exercise-img', 'food-img', 'exercise-panel', 'exercise-card', 'modal-width', 'bodymap', 'atlas'];
    /* c78: race-free persistence — UI_STATE is the single source of truth.
     * The old flow did an async read-modify-write of the whole ui_sizes row on
     * every slider event, and the Reset button fired SEVEN of them at once; the
     * last stale write won, so values the user had just reset (report: the
     * «панель групп мышц» slider jumping back to max 2.0) resurrected after
     * every reload. Now saves mutate UI_STATE synchronously and ONE debounced
     * write stores the whole object — there is no read in the save path at all. */
    const UI_RANGES = { 'exercise-img': [0.5, 2.5], 'food-img': [0.5, 2.5], 'exercise-panel': [0.6, 2.0], 'exercise-card': [0.6, 1.8], 'modal-width': [0.8, 1.5], 'bodymap': [0.6, 2.0], 'atlas': [1, 2.5] };
    const UI_DEFAULTS = { 'exercise-img': 1, 'food-img': 1, 'exercise-panel': 1, 'exercise-card': 1, 'modal-width': 1, 'bodymap': 1, 'atlas': 1.5 };
    const UI_STATE = {};
    function uiClamp(key, v) {
      let n = Number(v);
      if (!isFinite(n)) n = UI_DEFAULTS[key];
      const r = UI_RANGES[key];
      if (r) n = Math.min(r[1], Math.max(r[0], n));
      return Math.round(n * 100) / 100;
    }
    function uiApply(key) {
      const val = UI_STATE[key];
      const slider = document.getElementById('ui-size-' + key);
      const valEl = document.getElementById('ui-size-' + key + '-val');
      if (slider) slider.value = val;
      if (valEl) valEl.textContent = val.toFixed(2) + 'x';
      document.documentElement.style.setProperty('--ui-' + key, String(val));
    }
    let _uiPersistTimer = null;
    function uiPersist() {
      if (_uiPersistTimer) clearTimeout(_uiPersistTimer);
      _uiPersistTimer = setTimeout(function () {
        _uiPersistTimer = null;
        Promise.resolve(db.put('settings', { key: 'ui_sizes', value: Object.assign({}, UI_STATE) }))
          .catch(function (e) { console.warn('[ui-sizes] save failed:', e); });
      }, 250);
    }
    function uiFlushNow() {
      if (_uiPersistTimer) {
        clearTimeout(_uiPersistTimer);
        _uiPersistTimer = null;
        try { db.put('settings', { key: 'ui_sizes', value: Object.assign({}, UI_STATE) }); } catch (e) { /* noop */ }
      }
    }
    window.addEventListener('pagehide', uiFlushNow);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') uiFlushNow(); });
    async function loadUiSizes() {
      let sizes = {};
      try {
        const row = await db.get('settings', 'ui_sizes');
        sizes = row && row.value ? row.value : {};
        /* c78 one-time cleanup: builds before c78 could persist corrupted
         * values stuck at a slider's max (the concurrent-write race) — drop
         * exactly those once so the app starts sane; every later user choice
         * persists verbatim. */
        try {
          const done = await db.get('settings', 'ui_sizes_v78_clean');
          if (!done) {
            Object.keys(UI_RANGES).forEach(k => {
              if (Number(sizes[k]) === UI_RANGES[k][1]) delete sizes[k];
            });
            await db.put('settings', { key: 'ui_sizes', value: sizes });
            await db.put('settings', { key: 'ui_sizes_v78_clean', value: { done: true, at: Date.now() } });
            console.log('[ui-sizes] c78 one-time sanitize done');
          }
        } catch (_e) { /* noop */ }
      } catch (e) { console.warn('[ui-sizes] load failed:', e); }
      UI_SIZE_KEYS.forEach(key => {
        UI_STATE[key] = (sizes[key] != null) ? uiClamp(key, sizes[key]) : UI_DEFAULTS[key];
      });
      UI_SIZE_KEYS.forEach(key => uiApply(key));
      /* c77: apply saved image sizes to the modal media columns on boot */
      try { applyMediaCols(); } catch (_e) {}
    }`
);

/* 1b. saveUiSize — synchronous state update, no read */
repOnce('saveUiSize race-free',
`    async function saveUiSize(key, val) {
      try {
        const row = await db.get('settings', 'ui_sizes');
        const sizes = row && row.value ? row.value : {};
        sizes[key] = val;
        await db.put('settings', { key: 'ui_sizes', value: sizes });
        // Apply to CSS variable
        const cssVar = '--ui-' + key.replace('-', '-');
        document.documentElement.style.setProperty(cssVar, val);
        if (key === 'atlas') { try { window.dispatchEvent(new CustomEvent('dk-atlas-scale')); } catch (e) {} }
        // Update label
        const valEl = document.getElementById('ui-size-' + key + '-val');
        if (valEl) valEl.textContent = val.toFixed(2) + 'x';
        /* c77: media modal columns follow the image-size sliders live */
        if (key === 'exercise-img' || key === 'food-img') { try { applyMediaCols(); } catch (_e) {} }
      } catch (e) { console.warn('[ui-sizes] save failed:', e); }
    }`,
`    /* c78: synchronous UI_STATE mutation + debounced single-row persist (no race) */
    function saveUiSize(key, val) {
      UI_STATE[key] = uiClamp(key, val);
      uiApply(key);
      if (key === 'atlas') { try { window.dispatchEvent(new CustomEvent('dk-atlas-scale')); } catch (e) {} }
      /* c77: media modal columns follow the image-size sliders live */
      if (key === 'exercise-img' || key === 'food-img') { try { applyMediaCols(); } catch (_e) {} }
      uiPersist();
    }`
);

/* 1c. reset handler — plain loop over sync saves (uiPersist coalesces) */
repOnce('ui-size reset loop',
`      UI_SIZE_KEYS.forEach(key => {
        const slider = document.getElementById('ui-size-' + key);
        const dv = (key === 'atlas') ? 1.5 : 1;
        if (slider) slider.value = dv;
        saveUiSize(key, dv);
      });`,
`      /* c78: every save mutates UI_STATE synchronously; the debounced persist
       * coalesces all seven into ONE write — the reset now survives reloads. */
      UI_SIZE_KEYS.forEach(key => saveUiSize(key, (key === 'atlas') ? 1.5 : 1));`
);

/* ========== 2) Exercise DB tab = picker parity ========== */

/* 2a. default flat view (like the picker) */
repOnce('exb _groupBy default',
  `var _groupBy = 'mechanic'; /* View dropdown (like picker) */`,
  `var _groupBy = 'none'; /* c78: default flat list — identical to the picker's default view */`
);

/* 2b. view dropdown shows «Flat list» selected by default */
repOnce('exb view select order',
`                        <option value="mechanic" data-i18n="bm.groupMechanic">Compound/Isolation</option>
                        <option value="none" data-i18n="bm.groupFlat">Flat list</option>`,
`                        <option value="none" data-i18n="bm.groupFlat">Flat list</option>
                        <option value="mechanic" data-i18n="bm.groupMechanic">Compound/Isolation</option>`
);

/* 2c. localized "All" in the МЕХАНИКА class-chip row */
repOnce('exb class-chip All i18n',
  `'" data-exb-class-key="' + dim.key + '" data-exb-class-val="">All</button>';`,
  `'" data-exb-class-key="' + dim.key + '" data-exb-class-val="">' + esc(allL || 'All') + '</button>';`
);

/* 2d. equipment chips without counts (picker parity) */
repOnce('exb equip chips no counts',
  `'" data-exb-equip="' + esc(tp) + '">' + esc(equipLabel(tp)) + ' <span class="opacity-60">' + types[tp] + '</span></button>';`,
  `'" data-exb-equip="' + esc(tp) + '">' + esc(equipLabel(tp)) + '</button>'; /* c78: counts dropped — picker parity */`
);

/* ========== 3) compact muscle chips (max 2 secondary + "+N") ========== */

/* 3a. muscle-map.js: opts.maxAux support */
repOnce('mm chips signature',
  `function getExerciseMuscleChips(ex, lang) {`,
  `function getExerciseMuscleChips(ex, lang, opts) {`,
  'mm'
);
repOnce('mm chips maxAux',
`      const nm = (g) => ((GROUP_NAMES_3[g] && GROUP_NAMES_3[g][L]) || g);
      const pc = GROUP_COLORS[primary] || GROUP_COLORS.other;
      let html = '<span class="text-[11px] font-bold px-2 py-1 rounded-md" style="background:' + pc + '26;color:' + pc + '">◉ ' + _mmEsc(nm(primary)) + '</span>';
      aux.forEach(a => {
        html += '<span class="text-[11px] px-2 py-1 rounded-md" style="background:rgba(127,140,160,.14);color:inherit;opacity:.85">○ ' + _mmEsc(nm(a)) + '</span>';
      });
      return html;`,
`      const nm = (g) => ((GROUP_NAMES_3[g] && GROUP_NAMES_3[g][L]) || g);
      const pc = GROUP_COLORS[primary] || GROUP_COLORS.other;
      /* c78: optional cap on secondary chips — fullbody moves used to print 5-6
         stacked ○ chips that made cards tall and ragged; maxAux keeps it tidy. */
      const maxAux = (opts && opts.maxAux > 0) ? opts.maxAux : 0;
      const shown = maxAux ? aux.slice(0, maxAux) : aux;
      let html = '<span class="text-[11px] font-bold px-2 py-1 rounded-md" style="background:' + pc + '26;color:' + pc + '">◉ ' + _mmEsc(nm(primary)) + '</span>';
      shown.forEach(a => {
        html += '<span class="text-[11px] px-2 py-1 rounded-md" style="background:rgba(127,140,160,.14);color:inherit;opacity:.85">○ ' + _mmEsc(nm(a)) + '</span>';
      });
      if (maxAux && aux.length > shown.length) {
        html += '<span class="text-[11px] font-semibold px-2 py-1 rounded-md" style="background:rgba(127,140,160,.14);opacity:.75">+' + (aux.length - shown.length) + '</span>';
      }
      return html;`,
  'mm'
);

/* 3b. picker card → capped chips */
repOnce('picker card chips cap',
  `\${hasVector && window.getExerciseMuscleChips ? window.getExerciseMuscleChips(e) : ''}`,
  `\${hasVector && window.getExerciseMuscleChips ? window.getExerciseMuscleChips(e, null, { maxAux: 2 }) : ''}`
);

/* 3c. exercise-DB card → capped chips */
repOnce('exb card chips cap',
  `chips = (typeof window.getExerciseMuscleChips === 'function') ? (window.getExerciseMuscleChips(e, L) || '') : '';`,
  `chips = (typeof window.getExerciseMuscleChips === 'function') ? (window.getExerciseMuscleChips(e, L, { maxAux: 2 }) || '') : '';`
);

/* ========== 4) version bumps ========== */
repOnce('dk-build meta',
  `<meta name="dk-build" content="c76" />`,
  `<meta name="dk-build" content="c78" />`
);
repOnce('RUNNING',
  `var RUNNING = 77; /* numeric part of dk-build c77 */`,
  `var RUNNING = 78; /* numeric part of dk-build c78 */`
);
repOnce('sw cache',
  `const CACHE_NAME = 'dk-gym-v104'; // v104: c77 — UI sizes can no longer change themselves (zoom-based gif/food/cards, wheel/touch slider guards) + hard pre-login lock (Add Client included) + header theme quick menu with all 33 themes`,
`const CACHE_NAME = 'dk-gym-v105'; // v105: c78 — ui-sizes persistence race fixed (stuck-at-max sanitized once, debounced single-write saves) + Exercise DB tab picker-parity (flat view default, localized All, no equip counts, compact muscle chips)
// v104: c77 — UI sizes can no longer change themselves (zoom-based gif/food/cards, wheel/touch slider guards) + hard pre-login lock (Add Client included) + header theme quick menu with all 33 themes`,
  'sw'
);

/* ========== sanity ========== */
{
  const musts = [
    ['ui_sizes_v78_clean', s],
    ['UI_STATE = {}', s],
    ['uiFlushNow', s],
    ["var _groupBy = 'none'", s],
    ['maxAux', s],
    ['getExerciseMuscleChips(e, null, { maxAux: 2 })', s],
    ['getExerciseMuscleChips(e, L, { maxAux: 2 })', s],
    ['RUNNING = 78', s],
    ['dk-gym-v105', sw],
    ['maxAux', mm]
  ];
  for (const [needle, hay] of musts) {
    if (hay.indexOf(needle) === -1) { console.error('SANITY fail: missing "' + needle + '"'); process.exit(1); }
  }
  if (s.indexOf("var _groupBy = 'mechanic'") !== -1) { console.error('SANITY fail: _groupBy mechanic still present'); process.exit(1); }
  if (s.split('ui_sizes_v78_clean').length !== 3) { console.error('SANITY fail: sanitize flag count unexpected'); process.exit(1); }
  const selBlock = s.slice(s.indexOf('id="exb-group-toggle"'), s.indexOf('</select>', s.indexOf('id="exb-group-toggle"')));
  if (selBlock.indexOf('value="none"') === -1 || selBlock.indexOf('value="none"') > selBlock.indexOf('value="mechanic"')) {
    console.error('SANITY fail: flat option not first in exb view select');
    process.exit(1);
  }
  console.log('sanity ✓  (state, defaults, caps, versions)');
}

fs.writeFileSync(FILE, s);
fs.writeFileSync(MM, mm);
fs.writeFileSync(SW, sw);
console.log('written. deltas: crm', s.length - orig.length, '| muscle-map', mm.length - mmOrig.length, '| sw', sw.length - swOrig.length);
