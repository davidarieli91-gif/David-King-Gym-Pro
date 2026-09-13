/* c77: (1) UI-size auto-change fix — layout-safe zoom for gif/food/cards (old
   transform:scale clipped gifs and overlapped card grids), nested-modal zoom
   guard, wheel/touch guards + range clamp so size sliders can no longer change
   themselves silently; (2) HARD auth lock — before sign-in nothing except the
   top header bar is interactive (aside incl. Add Client, #main, bottom navs);
   (3) header theme button = quick menu listing ALL 33 themes (grouped
   Dark/Light) instead of the 2-theme dark/light toggle.
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

/* ================= 1a. Exercise GIF + food image — zoom on the SLOT ================= */
repOnce('gif-food-zoom',
  `    /* Exercise GIF/image size — affects exercise modal GIF slot */
    #exercise-gif-slot img,
    .ex-anim-container img,
    .ex-anim-frame-1,
    .ex-anim-frame-2 {
      transform: scale(var(--ui-exercise-img));
      transform-origin: center;
    }

    /* Food image size — affects food detail modal image slot */
    #food-detail-image-slot img {
      transform: scale(var(--ui-food-img));
      transform-origin: center;
    }`,
  `    /* c77: exercise GIF/image size + food image size — the old CSS used
       transform:scale on the img: >1x got clipped by the slot's overflow-hidden,
       <1x left a tiny image inside a huge empty box, and the broad img selectors
       (.ex-anim-container img is shared) leaked onto picker-card animations.
       Layout-safe rework: the modal's media COLUMN is sized by the slider
       (pure grid layout, no transforms) — the gif/image box grows or shrinks
       with its column, the text column reflows, nothing overlaps and nothing is
       clipped at any slider value. The column template is set from JS as an
       inline literal (applyMediaCols in the ui-sizes module): var() substitution
       inside grid-template-columns proved unreliable in Chromium (the template
       silently degraded to a single track). */
    #exercise-gif-slot, #food-detail-image-slot { max-width: 100%; }

    /* c77: vertical touch-drag over a size slider scrolls the page instead of
       silently changing the saved value (horizontal drags still adjust it) */
    input[id^="ui-size-"] { touch-action: pan-y; }`);

/* ================= 1b. Exercise cards — zoom instead of transform ================= */
repOnce('cards-zoom',
  `    /* Exercise card size — affects exercise cards in grid */
    #bodymap-picker-modal #bm-ex-grid .flex.items-center.gap-2,
    #bodymap-picker-modal #bm-fav-grid .flex.items-center.gap-2,
    #bodymap-picker-modal #bm-recent-grid .flex.items-center.gap-2 {
      transform: scale(var(--ui-exercise-card));
      transform-origin: top left;
    }`,
  `    /* c77: exercise card size — zoom instead of transform:scale(top left).
       transform left the layout box untouched, so cards at >1x overlapped the
       rows/columns around them; zoom participates in grid layout so cards
       never overlap at any slider value. */
    #bodymap-picker-modal #bm-ex-grid .flex.items-center.gap-2,
    #bodymap-picker-modal #bm-fav-grid .flex.items-center.gap-2,
    #bodymap-picker-modal #bm-recent-grid .flex.items-center.gap-2 {
      zoom: var(--ui-exercise-card, 1);
    }`);

/* ================= 1c. Nested modal zoom guard ================= */
repOnce('nested-zoom-guard',
  `    /* Modal width — affects all modal content containers */
    [class*="fixed inset-0"] > [class*="bg-surface"] {
      zoom: var(--ui-modal-width);
    }`,
  `    /* Modal width — affects all modal content containers */
    [class*="fixed inset-0"] > [class*="bg-surface"] {
      zoom: var(--ui-modal-width);
    }
    /* c77: a modal stacked INSIDE another overlay is already scaled by the
       ancestor's zoom — reset to 1 so zooms don't multiply into huge dialogs */
    [class*="fixed inset-0"] [class*="fixed inset-0"] > [class*="bg-surface"] {
      zoom: 1;
    }`);

/* ================= 2a. HARD auth lock (CSS) ================= */
repOnce('hard-lock-css',
  `body.auth-locked aside nav, body.auth-locked nav.bottom-nav, body.auth-locked nav.fixed.bottom-0 { pointer-events: none !important; opacity: .45; }`,
  `/* c77: HARD lock — before sign-in NOTHING is interactive except the top header
   bar (language, A-/A+, theme quick menu): the whole aside (including the Add
   Client button at its bottom, which was still clickable after c74), the
   workspace column and both bottom navs are dead. The login screen re-enables
   pointer events for its own subtree so signing in still works. */
body.auth-locked aside,
body.auth-locked #main,
body.auth-locked nav.bottom-nav,
body.auth-locked nav.fixed.bottom-0 { pointer-events: none !important; }
body.auth-locked aside nav, body.auth-locked nav.bottom-nav, body.auth-locked nav.fixed.bottom-0 { opacity: .45; }
body.auth-locked #main [data-screen="login"] { pointer-events: auto !important; }
body.auth-locked #app > .fixed.inset-0:not(.hidden) { pointer-events: none !important; }`);

/* ================= 2b. Add-client buttons — JS auth gate (2nd line of defence) ================= */
repOnce('add-client-guard',
  `    const addBtns = ['dash-add-btn', 'dash-empty-add', 'aside-add-client'];
    addBtns.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => screens.dashboard.openCreate());
    });`,
  `    const addBtns = ['dash-add-btn', 'dash-empty-add', 'aside-add-client'];
    addBtns.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => {
        /* c77: hard auth gate — Add-Client must be dead before sign-in (the CSS
           lock removes pointer events; this is the second line of defence) */
        if (typeof auth === 'undefined' || !auth || typeof auth.isUnlocked !== 'function' || !auth.isUnlocked()) {
          if (typeof router !== 'undefined' && router && router.show) {
            try { router.show('login'); } catch (_e) { /* noop */ }
          }
          return;
        }
        screens.dashboard.openCreate();
      });
    });`);

/* ================= 3a. Theme quick menu — button HTML ================= */
repOnce('theme-menu-html',
  `          <!-- Theme toggle -->
          <button id="theme-toggle"
                  class="w-9 h-9 grid place-items-center rounded-lg bg-surface-2 hover:bg-border/40 transition border border-border"
                  aria-label="Toggle theme" data-i18n-attr="aria-label:aria.toggleTheme">
            <svg class="w-4.5 h-4.5 hidden dark:block" data-theme-icon="dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
            <svg class="w-4.5 h-4.5 block dark:hidden" data-theme-icon="light" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
          </button>`,
  `          <!-- c77: Theme quick menu — the button opens a dropdown listing ALL themes -->
          <div class="relative">
            <button id="theme-toggle"
                    class="w-9 h-9 grid place-items-center rounded-lg bg-surface-2 hover:bg-border/40 transition border border-border"
                    aria-label="Toggle theme" data-i18n-attr="aria-label:aria.toggleTheme" aria-haspopup="menu" aria-expanded="false">
              <svg class="w-4.5 h-4.5 hidden dark:block" data-theme-icon="dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
              <svg class="w-4.5 h-4.5 block dark:hidden" data-theme-icon="light" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
            </button>
            <div id="theme-menu" class="hidden absolute end-0 top-full mt-2 w-60 max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-surface shadow-float z-50 p-1.5" role="menu" aria-label="Choose theme"></div>
          </div>`);

/* ================= 3b. Theme quick menu — JS ================= */
repOnce('theme-menu-js',
  `  document.getElementById('theme-toggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    toast(t('toast.themeChanged', { theme: next }), 'info', 1500);
  });`,
  `  /* c77: theme QUICK MENU — the header theme button no longer flips just
     dark/light: it opens a dropdown listing ALL themes (33), grouped
     Dark/Light with the active one highlighted. Picking a theme calls the
     same applyTheme as the Settings grid, so persistence, data-mode and the
     theme-color meta tag all stay in sync. Works while signed out (header is
     the one area that stays interactive before login). */
  const DK_THEMES = [
    { id:'dark',name:'Midnight Indigo',dark:true,color:'#6366f1' },
    { id:'ocean-deep',name:'Ocean Deep',dark:true,color:'#06b6d4' },
    { id:'forest-night',name:'Forest Night',dark:true,color:'#22c55e' },
    { id:'sunset-rose',name:'Sunset Rose',dark:true,color:'#ec4899' },
    { id:'carbon-steel',name:'Carbon Steel',dark:true,color:'#64748b' },
    { id:'royal-purple',name:'Royal Purple',dark:true,color:'#8b5cf6' },
    { id:'crimson-dark',name:'Crimson Dark',dark:true,color:'#ef4444' },
    { id:'amber-gold',name:'Amber Gold',dark:true,color:'#f59e0b' },
    { id:'teal-pro',name:'Teal Pro',dark:true,color:'#14b8a6' },
    { id:'slate-mono',name:'Slate Mono',dark:true,color:'#475569' },
    { id:'midnight-mint',name:'Midnight Mint',dark:true,color:'#2dd4bf' },
    { id:'dusk-velvet',name:'Dusk Velvet',dark:true,color:'#a78bfa' },
    { id:'graphite-mist',name:'Graphite Mist',dark:true,color:'#60a5fa' },
    { id:'tide-pool',name:'Tide Pool',dark:true,color:'#38bdf8' },
    { id:'warm-espresso',name:'Warm Espresso',dark:true,color:'#fb923c' },
    { id:'aurora-haze',name:'Aurora Haze',dark:true,color:'#22d3ee' },
    { id:'jungle',name:'Jungle',dark:true,color:'#22c55e' },
    { id:'aquarium',name:'Aquarium',dark:true,color:'#06b6d4' },
    { id:'winter',name:'Winter',dark:true,color:'#60a5fa' },
    { id:'bubble-lagoon',name:'Bubble Lagoon',dark:true,color:'#10b981' },
    { id:'ember-tide',name:'Ember Tide',dark:true,color:'#f97316' },
    { id:'crimson-reef',name:'Crimson Reef',dark:true,color:'#f43f5e' },
    { id:'retro-1940',name:'Retro 1940',dark:false,color:'#b22222' },
    { id:'light',name:'Pure White',dark:false,color:'#4f46e5' },
    { id:'cloud-blue',name:'Cloud Blue',dark:false,color:'#3b82f6' },
    { id:'mint-fresh',name:'Mint Fresh',dark:false,color:'#059669' },
    { id:'peach-soft',name:'Peach Soft',dark:false,color:'#f97316' },
    { id:'lavender-light',name:'Lavender',dark:false,color:'#a855f7' },
    { id:'rose-quartz',name:'Rose Quartz',dark:false,color:'#e11d48' },
    { id:'sand-stone',name:'Sand Stone',dark:false,color:'#d97706' },
    { id:'sky-day',name:'Sky Day',dark:false,color:'#0ea5e9' },
    { id:'sage-garden',name:'Sage Garden',dark:false,color:'#65a30d' },
    { id:'coral-reef',name:'Coral Reef',dark:false,color:'#f43f5e' }
  ];
  const _themeBtn = document.getElementById('theme-toggle');
  const _themeMenu = document.getElementById('theme-menu');
  function _dkThemeGroupLabels() {
    const l = (typeof currentLang === 'function') ? currentLang() : 'en';
    if (l === 'ru') return { dark: 'Тёмные темы', light: 'Светлые темы' };
    if (l === 'he') return { dark: 'ערכות כהות', light: 'ערכות בהירות' };
    return { dark: 'Dark themes', light: 'Light themes' };
  }
  function renderThemeMenu() {
    if (!_themeMenu) return;
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    const L = _dkThemeGroupLabels();
    const item = (th) => '<button type="button" role="menuitemradio" aria-checked="' + (th.id === cur) + '" class="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition ' + (th.id === cur ? 'bg-primary/15 text-primary' : 'hover:bg-surface-2 text-text') + '" data-theme-pick="' + th.id + '">' +
      '<span class="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10" style="background:' + th.color + '"></span>' +
      '<span class="truncate">' + th.name + '</span>' +
      (th.id === cur ? '<svg class="w-3 h-3 ms-auto shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>' : '') +
      '</button>';
    const darks = DK_THEMES.filter(function (x) { return x.dark; });
    const lights = DK_THEMES.filter(function (x) { return !x.dark; });
    _themeMenu.innerHTML =
      '<div class="px-2 pt-1 pb-1 text-[10px] uppercase tracking-wider text-muted font-semibold">' + L.dark + '</div>' +
      darks.map(item).join('') +
      '<div class="px-2 pt-2 pb-1 mt-1 border-t border-border text-[10px] uppercase tracking-wider text-muted font-semibold">' + L.light + '</div>' +
      lights.map(item).join('');
    _themeMenu.querySelectorAll('[data-theme-pick]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const id = btn.getAttribute('data-theme-pick');
        applyTheme(id);
        toast(t('toast.themeChanged', { theme: id }), 'info', 1500);
        renderThemeMenu();
        _closeThemeMenu();
      });
    });
  }
  function _openThemeMenu() {
    if (!_themeMenu) return;
    renderThemeMenu();
    _themeMenu.classList.remove('hidden');
    if (_themeBtn) _themeBtn.setAttribute('aria-expanded', 'true');
  }
  function _closeThemeMenu() {
    if (!_themeMenu) return;
    if (_themeMenu.classList.contains('hidden')) return;
    _themeMenu.classList.add('hidden');
    if (_themeBtn) _themeBtn.setAttribute('aria-expanded', 'false');
  }
  if (_themeBtn) _themeBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (!_themeMenu || _themeMenu.classList.contains('hidden')) _openThemeMenu();
    else _closeThemeMenu();
  });
  document.addEventListener('click', function (e) {
    if (!_themeMenu || _themeMenu.classList.contains('hidden')) return;
    if (_themeMenu.contains(e.target) || (_themeBtn && _themeBtn.contains(e.target))) return;
    _closeThemeMenu();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') _closeThemeMenu(); });
  /* keep the Settings theme grid highlight in sync when a theme is picked
     from the header quick menu */
  document.addEventListener('dk-theme-applied', function () {
    try { if (typeof renderThemeGrid === 'function') renderThemeGrid(); } catch (_e) {}
  });`);

/* ================= 3c. applyTheme dispatches dk-theme-applied ================= */
repOnce('theme-applied-event',
  `    try { await db.put('settings', { key: 'theme', value: t }); } catch (_) {}
  }`,
  `    try { await db.put('settings', { key: 'theme', value: t }); } catch (_) {}
    /* c77: notify listeners (Settings theme grid re-highlight) */
    try { document.dispatchEvent(new CustomEvent('dk-theme-applied')); } catch (_) {}
  }`);

/* ================= 3d. Settings theme grid re-highlights on quick-menu pick ================= */
repOnce('theme-grid-sync',
  `    renderThemeGrid();

    // Font size + Modal size controls`,
  `    renderThemeGrid();
    /* c77: re-highlight the grid when a theme is picked from the header quick
       menu (renderThemeGrid lives in this closure, so the listener must be
       registered here — the header dispatches 'dk-theme-applied' from applyTheme) */
    document.addEventListener('dk-theme-applied', function () { try { renderThemeGrid(); } catch (_e) {} });

    // Font size + Modal size controls`);

/* ================= 4a. loadUiSizes — clamp persisted values ================= */
repOnce('ui-sizes-clamp',
  `        const sizes = row && row.value ? row.value : {};
        UI_SIZE_KEYS.forEach(key => {
          const val = sizes[key] != null ? sizes[key] : (key === 'atlas' ? 1.5 : 1);`,
  `        const sizes = row && row.value ? row.value : {};
        /* c77: clamp persisted values to each slider's legal range — a corrupted
           or out-of-range save can no longer render inconvenient graphics */
        const _UI_RANGES = { 'exercise-img': [0.5, 2.5], 'food-img': [0.5, 2.5], 'exercise-panel': [0.6, 2.0], 'exercise-card': [0.6, 1.8], 'modal-width': [0.8, 1.5], 'bodymap': [0.6, 2.0], 'atlas': [1, 2.5] };
        UI_SIZE_KEYS.forEach(key => {
          const _dv = (key === 'atlas' ? 1.5 : 1);
          const _raw = sizes[key] != null ? Number(sizes[key]) : NaN;
          let val = Number.isFinite(_raw) ? _raw : _dv;
          const _rng = _UI_RANGES[key];
          if (_rng) val = Math.min(_rng[1], Math.max(_rng[0], val));`);

/* ================= 4a-bis. applyMediaCols — media column follows image sliders =================
   NOTE: inserted BEFORE saveUiSize so the hoisted function is available there. */
repOnce('apply-media-cols',
  `    async function saveUiSize(key, val) {`,
  `    /* c77: exercise/food modal media column follows the image-size sliders.
       Set as inline literal (NOT via CSS var): var() substitution inside
       grid-template-columns silently degraded to a single track in Chromium.
       Desktop (>=1024px) only — below that the modal stacks vertically. */
    function applyMediaCols() {
      try {
        var wide = window.matchMedia && window.matchMedia('(min-width: 1024px)').matches;
        var getV = function (key, dv) {
          var el = document.getElementById('ui-size-' + key);
          if (el && el.value) { var n = parseFloat(el.value); if (isFinite(n)) return n; }
          return dv;
        };
        var ex = document.getElementById('exercise-view');
        var fd = document.getElementById('food-detail-view');
        var gEx = wide ? ('minmax(0,' + getV('exercise-img', 1) + 'fr) minmax(0,1.15fr)') : '';
        var gFd = wide ? ('minmax(0,' + getV('food-img', 1) + 'fr) minmax(0,1.15fr)') : '';
        if (ex) ex.style.gridTemplateColumns = gEx;
        if (fd) fd.style.gridTemplateColumns = gFd;
      } catch (_e) { /* noop */ }
    }
    window.addEventListener('resize', applyMediaCols);
    async function saveUiSize(key, val) {`);

/* ================= 4a-ter. saveUiSize calls applyMediaCols ================= */
repOnce('save-calls-media-cols',
  `        // Update label
        const valEl = document.getElementById('ui-size-' + key + '-val');
        if (valEl) valEl.textContent = val.toFixed(2) + 'x';
      } catch (e) { console.warn('[ui-sizes] save failed:', e); }`,
  `        // Update label
        const valEl = document.getElementById('ui-size-' + key + '-val');
        if (valEl) valEl.textContent = val.toFixed(2) + 'x';
        /* c77: media modal columns follow the image-size sliders live */
        if (key === 'exercise-img' || key === 'food-img') { try { applyMediaCols(); } catch (_e) {} }
      } catch (e) { console.warn('[ui-sizes] save failed:', e); }`);

/* ================= 4a-quater. loadUiSizes triggers initial applyMediaCols ================= */
repOnce('load-calls-media-cols',
  `      } catch (e) { console.warn('[ui-sizes] load failed:', e); }
    }`,
  `      } catch (e) { console.warn('[ui-sizes] load failed:', e); }
      /* c77: apply saved image sizes to the modal media columns on boot */
      try { applyMediaCols(); } catch (_e) {}
    }`);

/* ================= 4b. Sliders — no silent self-changes (wheel/touch/blur) ================= */
repOnce('slider-guards',
  `    UI_SIZE_KEYS.forEach(key => {
      const slider = document.getElementById('ui-size-' + key);
      if (slider) slider.addEventListener('input', () => {
        saveUiSize(key, parseFloat(slider.value));
      });
    });`,
  `    UI_SIZE_KEYS.forEach(key => {
      const slider = document.getElementById('ui-size-' + key);
      if (slider) slider.addEventListener('input', () => {
        saveUiSize(key, parseFloat(slider.value));
      });
      /* c77: stop silent self-changes — in Chrome a mouse wheel over a FOCUSED
         range slider moves its value (and every move was persisted instantly),
         which felt like the app changing sizes "by itself". After a pointer or
         keyboard adjustment the slider blurs, so later page scrolling can no
         longer touch it; a wheel over a still-focused slider is blocked too. */
      if (slider) {
        slider.addEventListener('pointerup', () => { try { slider.blur(); } catch (_e) {} });
        slider.addEventListener('wheel', (ev) => {
          if (document.activeElement === slider) ev.preventDefault();
        }, { passive: false });
      }
    });`);

/* ================= 5. Version bump ================= */
repOnce('running-bump',
  `  var RUNNING = 76; /* numeric part of dk-build c76 */`,
  `  var RUNNING = 77; /* numeric part of dk-build c77 */`);

fs.writeFileSync(F, s);
console.log(`\nfitness-crm.html: ${applied} applied, ${failed} failed`);

/* ================= sw.js — cache bump + history ================= */
let sw = fs.readFileSync('sw.js', 'utf8');
const swA = sw.split("const CACHE_NAME = 'dk-gym-v103';").length - 1;
if (swA === 1) {
  sw = sw.replace(
    "const CACHE_NAME = 'dk-gym-v103'; // v103: c76 — Exercise DB tab = exact Quick Pick copy (star/eye/+ cards, favorites/recent tabs, View grouping, localized map tabs)",
    "const CACHE_NAME = 'dk-gym-v104'; // v104: c77 — UI sizes can no longer change themselves (zoom-based gif/food/cards, wheel/touch slider guards) + hard pre-login lock (Add Client included) + header theme quick menu with all 33 themes\n// v103: c76 — Exercise DB tab = exact Quick Pick copy (star/eye/+ cards, favorites/recent tabs, View grouping, localized map tabs)"
  );
  fs.writeFileSync('sw.js', sw);
  console.log('sw.js: CACHE_NAME -> dk-gym-v104');
} else {
  console.error(`sw.js: anchor count = ${swA} (expected 1)`);
  failed++;
}

if (applied + 1 !== 16 || failed > 0) {
  console.error(`RESULT: expected 16 total edits, got applied=${applied} failed=${failed}`);
  process.exit(1);
}
console.log('ALL 16 EDITS OK');
