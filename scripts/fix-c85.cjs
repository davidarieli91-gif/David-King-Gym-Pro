#!/usr/bin/env node
/* =============================================================================
 * fix-c85.cjs — c85
 * (1) TRAINER (fitness-crm.html): live workout kg⇄lb weight-unit picker.
 *     Tap any weight input (or the new header chip) → a compact dialog with
 *     «Килограммы» / «Фунты»; the choice is persisted (localStorage dk_wunit)
 *     and displayed AT THE TOP of the live screen (chip near the duration) and
 *     on the weight column header of every exercise table.
 * (2) CLIENT PORTAL (client.html): full parity with the trainer app —
 *     - header buttons: dumbbell (return to the workout, green dot when live),
 *       A− / A+ 16-step font scaler, theme quick menu (33 themes), settings
 *       (gear) opening a sheet with themes + texture effects v2 + opacity and
 *       the share-report action (moved out of the header, same handler);
 *     - the FULL theme CSS pack ported 1:1 from fitness-crm.html (33 themes
 *       incl. retro-1940 serif + body::before/::after decorations);
 *     - texture effects v2 engine ported 1:1 (data-tex, #dk-tex-overlay,
 *       opacity slider, localStorage dk_portal_tex) + glass compat layer;
 *     - the same kg⇄lb weight-unit picker for the portal's live workout.
 * Versions: meta c85, RUNNING=85, footer c85, sw dk-gym-v112.
 * repOnce discipline: every anchor must occur EXACTLY once or the run aborts
 * without writing any file.
 * ========================================================================== */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');

function read(f) { return fs.readFileSync(path.join(ROOT, f), 'utf8'); }
function write(f, s) { fs.writeFileSync(path.join(ROOT, f), s); }

function repOnce(src, anchor, replacement, label) {
  const count = src.split(anchor).length - 1;
  if (count !== 1) {
    console.error('FAIL [' + label + ']: anchor count = ' + count + ' (expected 1)\nanchor: ' + JSON.stringify(anchor.slice(0, 120)));
    process.exit(1);
  }
  console.log('ok   [' + label + ']');
  return src.replace(anchor, replacement);
}

function cutBetween(src, startMarker, endMarker, label) {
  const a = src.indexOf(startMarker);
  const b = src.indexOf(endMarker);
  if (a === -1 || b === -1 || b <= a) {
    console.error('FAIL [' + label + ']: markers not found or misordered');
    process.exit(1);
  }
  console.log('ok   [' + label + '] sliced ' + (b - a) + ' chars');
  return src.slice(a, b);
}

/* ============================== TRAINER ENGINE ============================ */
const TRAINER_ENGINE = `  /* ===== c85: weight unit (kg⇄lb) for live workouts — tap any weight input
     or the header chip to pick the unit; the choice is shown AT THE TOP of the
     live screen and next to the weight column of every exercise table. ===== */
  var DK_WUNIT_KEY = 'dk_wunit';
  function dkWUnitGet() { try { return localStorage.getItem(DK_WUNIT_KEY) === 'lb' ? 'lb' : 'kg'; } catch (_e) { return 'kg'; } }
  function dkWUnitLabel(u) { return t('wunit.' + (u === 'lb' ? 'lb' : 'kg')) || (u === 'lb' ? 'Фунты' : 'Килограммы'); }
  function dkWUnitShort(u) {
    if (u == null) u = dkWUnitGet();
    return t('wunit.' + (u === 'lb' ? 'lbShort' : 'kgShort')) || (u === 'lb' ? 'фт' : 'кг');
  }
  function dkWUnitApply() {
    var u = dkWUnitGet(), sh = dkWUnitShort(u);
    document.querySelectorAll('[data-wunit-chip]').forEach(function (ch) { ch.textContent = dkWUnitLabel(u); });
    document.querySelectorAll('[data-wunit-col]').forEach(function (el) {
      var base = el.getAttribute('data-wunit-base') || '';
      el.textContent = (base && base.toLowerCase() !== sh.toLowerCase()) ? base + ' · ' + sh : base;
    });
  }
  var _dkWUnitSrc = null;
  function dkWUnitEnsureSheet() {
    if (document.getElementById('dk-wunit-sheet')) return;
    var wrap = document.createElement('div');
    wrap.id = 'dk-wunit-sheet';
    wrap.className = 'hidden fixed inset-0 z-[95] flex items-center justify-center p-4';
    wrap.innerHTML =
      '<div class="absolute inset-0 bg-black/60 backdrop-blur-sm" data-wunit-backdrop></div>' +
      '<div class="relative w-full max-w-xs rounded-2xl border border-border bg-surface shadow-float p-4 space-y-2" role="dialog" aria-modal="true">' +
        '<div class="text-[10px] font-bold uppercase tracking-wider text-muted mb-1" data-wunit-title></div>' +
        '<button type="button" data-wunit-pick="kg" class="wunit-opt w-full flex items-center justify-between gap-2 rounded-xl border border-border bg-surface-2 px-3 py-3 text-sm font-bold text-text transition"><span data-wunit-opt-label="kg"></span><span class="wunit-check" aria-hidden="true">✓</span></button>' +
        '<button type="button" data-wunit-pick="lb" class="wunit-opt w-full flex items-center justify-between gap-2 rounded-xl border border-border bg-surface-2 px-3 py-3 text-sm font-bold text-text transition"><span data-wunit-opt-label="lb"></span><span class="wunit-check" aria-hidden="true">✓</span></button>' +
      '</div>';
    document.body.appendChild(wrap);
    wrap.addEventListener('click', function (e) {
      if (e.target.closest('[data-wunit-backdrop]')) { dkWUnitClose(); return; }
      var pick = e.target.closest('[data-wunit-pick]');
      if (pick) dkWUnitSet(pick.getAttribute('data-wunit-pick'));
    });
  }
  function dkWUnitRefreshSheet() {
    var sheet = document.getElementById('dk-wunit-sheet');
    if (!sheet) return;
    var tt = sheet.querySelector('[data-wunit-title]');
    if (tt) tt.textContent = t('wunit.title') || 'Единица веса';
    ['kg', 'lb'].forEach(function (u) {
      var lab = sheet.querySelector('[data-wunit-opt-label="' + u + '"]');
      if (lab) lab.textContent = dkWUnitLabel(u) + ' · ' + dkWUnitShort(u);
      var btn = sheet.querySelector('[data-wunit-pick="' + u + '"]');
      if (btn) {
        var on = dkWUnitGet() === u;
        btn.classList.toggle('wunit-opt-active', on);
        var c = btn.querySelector('.wunit-check');
        if (c) c.style.visibility = on ? 'visible' : 'hidden';
      }
    });
  }
  function dkWUnitOpen(srcInput) {
    _dkWUnitSrc = srcInput || null;
    dkWUnitEnsureSheet();
    dkWUnitRefreshSheet();
    document.getElementById('dk-wunit-sheet').classList.remove('hidden');
  }
  function dkWUnitClose() {
    var sh = document.getElementById('dk-wunit-sheet');
    if (sh) sh.classList.add('hidden');
    if (_dkWUnitSrc && document.contains(_dkWUnitSrc)) { try { _dkWUnitSrc.focus({ preventScroll: true }); } catch (_e) {} }
    _dkWUnitSrc = null;
  }
  function dkWUnitSet(u) {
    if (u !== 'lb') u = 'kg';
    try { localStorage.setItem(DK_WUNIT_KEY, u); } catch (_e) {}
    dkWUnitApply();
    dkWUnitClose();
  }
  /* tap a weight input in the live workout → unit picker; the header chip opens it too */
  document.addEventListener('click', function (e) {
    var inp = e.target.closest('input[data-set-input$=".weight"]');
    if (inp && inp.closest('#live-workout-exercises')) { dkWUnitOpen(inp); return; }
    if (e.target.closest('[data-wunit-chip]')) dkWUnitOpen(null);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') dkWUnitClose(); });
  document.addEventListener('dk-lang', function () { try { dkWUnitApply(); } catch (_e) {} });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { try { dkWUnitApply(); } catch (_e) {} });
  else try { dkWUnitApply(); } catch (_e) {}

`;

const TRAINER_WUNIT_CSS = `/* ===== c85: weight unit picker (live workouts) ===== */
.wunit-check { visibility: hidden; color: rgb(var(--c-primary-2)); font-weight: 800; }
.wunit-opt-active { border-color: rgb(var(--c-primary) / .6) !important; background: rgb(var(--c-primary) / .12) !important; color: rgb(var(--c-primary-2)); }
#lw-unit-chip { max-width: 9.5rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
`;

const TRAINER_CHIP = `                <button type="button" id="lw-unit-chip" data-wunit-chip class="shrink-0 h-9 px-2.5 grid place-items-center rounded-lg bg-surface-2 hover:bg-border/40 border border-border text-[10px] font-bold uppercase tracking-wide text-muted transition" title="Weight unit">кг</button>
`;

/* ============================== PORTAL CSS ================================ */
const PORTAL_FONT_CSS = `
    /* ===== c85: font scale — the same 16-step system as the trainer app (A− / A+ in the header) ===== */
    :root { --font-scale: 1; }
    html { font-size: clamp(10px, calc(16px * var(--font-scale)), 60px); }
`;

const PORTAL_COMPAT_CSS = `
    /* ===== c85 portal compat: the texture layer also covers the portal's glass surfaces ===== */
    body[data-tex]:not([data-tex='none']) .glass,
    body[data-tex]:not([data-tex='none']) .glass-strong {
      background-image: var(--texture, none);
      background-size: var(--texture-size, auto);
      background-repeat: var(--texture-repeat, repeat);
    }
    /* ===== c85: header buttons (dumbbell / theme menu / settings) + weight unit picker ===== */
    #dk-dumbbell-btn { position: relative; width: 2.25rem; height: 2.25rem; flex: none; display: grid; place-items: center; border-radius: .5rem; background: rgb(var(--c-surface-2)); border: 1px solid rgb(var(--c-border)); color: rgb(var(--c-text)); cursor: pointer; transition: background .15s ease, border-color .15s ease, color .15s ease; }
    #dk-dumbbell-btn:hover { background: rgb(var(--c-border) / .4); }
    #dk-dumbbell-btn.dk-dumbbell-active { background: rgb(var(--c-primary) / .18); color: rgb(var(--c-primary-2)); border-color: rgb(var(--c-primary) / .5); }
    #dk-dumbbell-dot { position: absolute; inset-inline-end: 5px; top: 5px; width: 8px; height: 8px; border-radius: 9999px; background: #22c55e; box-shadow: 0 0 0 2px rgb(var(--c-surface)); animation: dk-dot-pulse 1.6s ease infinite; }
    @keyframes dk-dot-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
    .dk-pos-flash { animation: dk-pos-flash-kf 2.4s ease; }
    @keyframes dk-pos-flash-kf { 0%, 55% { box-shadow: 0 0 0 3px rgb(var(--c-primary) / .55); } 100% { box-shadow: 0 0 0 0 rgb(var(--c-primary) / 0); } }
    .wunit-check { visibility: hidden; color: rgb(var(--c-primary-2)); font-weight: 800; }
    .wunit-opt-active { border-color: rgb(var(--c-primary) / .6) !important; background: rgb(var(--c-primary) / .12) !important; color: rgb(var(--c-primary-2)); }
    [data-wunit-chip] { max-width: 9.5rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    /* c85 parity: on light themes the portal's hardcoded white text follows the theme
       text color (the trainer app uses text-text; gradient buttons keep white) */
    [data-mode="light"] #banner-prog-name,
    [data-mode="light"] #stat-exercises, [data-mode="light"] #stat-sets, [data-mode="light"] #stat-volume,
    [data-mode="light"] #workout-exercises-list .text-white,
    [data-mode="light"] #workout-exercises-list input {
      color: rgb(var(--c-text)) !important;
    }
`;

/* ============================ PORTAL HEADER =============================== */
const PORTAL_DUMBBELL_HTML = `      <!-- c85: dumbbell — one-tap return to the workout (same as the trainer app header) -->
      <button id="dk-dumbbell-btn" class="shrink-0" aria-label="Back to workout" title="Back to workout">
        <svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.4 14.4 9.6 9.6"/><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/><path d="m21.5 21.5-1.4-1.4"/><path d="M3.9 3.9 2.5 2.5"/><path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"/></svg>
        <span id="dk-dumbbell-dot" class="hidden" aria-hidden="true"></span>
      </button>`;

const PORTAL_CONTROLS_HTML = `      <!-- c85: same font stepper as the trainer app -->
      <button id="font-dec-btn" class="h-9 px-2 grid place-items-center rounded-lg bg-surface-2 hover:opacity-80 transition border border-border text-sm font-bold" aria-label="Decrease font size" title="A−">A−</button>
      <button id="font-inc-btn" class="h-9 px-2 grid place-items-center rounded-lg bg-surface-2 hover:opacity-80 transition border border-border text-sm font-bold" aria-label="Increase font size" title="A+">A+</button>
      <!-- c85: theme quick menu — 33 themes, same as the trainer app -->
      <div class="relative">
        <button id="theme-toggle" class="w-9 h-9 grid place-items-center rounded-lg bg-surface-2 hover:opacity-80 transition border border-border" aria-label="Toggle theme" aria-haspopup="menu" aria-expanded="false">
          <svg id="cp-theme-icon-sun" class="w-4.5 h-4.5 hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
          <svg id="cp-theme-icon-moon" class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
        </button>
        <div id="theme-menu" class="hidden absolute end-0 top-full mt-2 w-60 max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-[rgb(var(--c-surface))] shadow-float z-50 p-1.5" role="menu" aria-label="Choose theme"></div>
      </div>
      <!-- c85: settings — themes, texture effects and opacity (same engine as the trainer app) -->
      <button id="portal-settings-btn" class="w-9 h-9 grid place-items-center rounded-lg bg-surface-2 hover:opacity-80 transition border border-border" aria-label="Settings" title="Settings">
        <svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      </button>`;

const PORTAL_HERO_CHIP = `                <span class="inline-flex items-center gap-1.5">
                  <button type="button" id="cp-unit-chip" data-wunit-chip class="h-7 px-2 grid place-items-center rounded-lg bg-surface-2 border border-border text-[9px] font-bold uppercase tracking-wide text-muted transition hover:opacity-80">кг</button>
                  <span id="live-duration" class="hidden font-mono font-bold text-sm text-cyan-300">0:00</span>
                </span>`;

/* ============================== PORTAL MODULE ============================= */
const PORTAL_MODULE = `  <script>
  /* ===== c85: PORTAL PARITY — the client portal becomes identical to the
     trainer app: same header buttons (dumbbell / A− / A+ / theme quick menu /
     settings), the full 33-theme pack with decorations, texture effects v2
     with an opacity slider, 16-step font scaling, and the same kg⇄lb
     weight-unit picker for the portal's live workout. ===== */
  (function () {
    'use strict';
    function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
    function curLang() { try { return (typeof currentLang !== 'undefined') ? currentLang : 'ru'; } catch (e) { return 'ru'; } }

    /* ---- local strings (ru / en / he) ---- */
    var L = {
      ru: { dumbbellAria:'Вернуться к тренировке', setTitle:'Настройки', themes:'Темы', darkThemes:'Тёмные темы', lightThemes:'Светлые темы', textures:'Текстуры', texHint:'Текстурные наложения поверх любой темы — те же, что в основном приложении. Выберите эффект и настройте насыщенность.', opacity:'Насыщенность', reset:'Сброс', resetDone:'Возврат к стандартной насыщенности', applied:'Текстура применена', share:'Поделиться отчётом', themeChanged:'Тема изменена', wunitTitle:'Единица веса', wunitKg:'Килограммы', wunitLb:'Фунты', wunitKgShort:'кг', wunitLbShort:'фт' },
      en: { dumbbellAria:'Back to workout', setTitle:'Settings', themes:'Themes', darkThemes:'Dark themes', lightThemes:'Light themes', textures:'Textures', texHint:'Texture overlays on top of any theme — the same as in the main app. Pick an effect and fine-tune its opacity.', opacity:'Opacity', reset:'Reset', resetDone:'Returned to the effect default', applied:'Texture applied', share:'Share report', themeChanged:'Theme changed', wunitTitle:'Unit of weight', wunitKg:'Kilograms', wunitLb:'Pounds', wunitKgShort:'kg', wunitLbShort:'lb' },
      he: { dumbbellAria:'חזרה לאימון', setTitle:'הגדרות', themes:'ערכות נושא', darkThemes:'ערכות כהות', lightThemes:'ערכות בהירות', textures:'טקסטורות', texHint:'שכבות מרקף מעל כל ערכת נושא — אותן טקסטורות כמו באפליקציה הראשית. בחרו אפקט וכוונו את העוצמה.', opacity:'עוצמה', reset:'איפוס', resetDone:'חזרה לעוצמת ברירת המחדל', applied:'הטקסטורה הוחלה', share:'שתף דוח', themeChanged:'ערכת הנושא הוחלפה', wunitTitle:'יחידת משקל', wunitKg:'קילוגרמים', wunitLb:'פאונד', wunitKgShort:'ק״ג', wunitLbShort:'lb' }
    };
    function T(k) { var l = curLang(); return (L[l] && L[l][k]) || L.ru[k] || k; }

    /* ---- the 33 themes of the trainer app (DK_THEMES, same order) ---- */
    var DK_THEMES = [
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

    /* ---- theme quick menu + settings grid (one renderer, two hosts) ---- */
    function themeItemHTML(th, cur) {
      var act = th.id === cur;
      return '<button type="button" role="menuitemradio" aria-checked="' + act + '" data-theme-pick="' + th.id + '" class="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition text-text" style="' + (act ? 'background:rgb(var(--c-primary) / .15);color:rgb(var(--c-primary-2));' : '') + '">' +
        '<span class="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10" style="background:' + th.color + '"></span>' +
        '<span class="truncate">' + th.name + '</span>' +
        (act ? '<span class="ms-auto shrink-0 font-bold" style="color:rgb(var(--c-primary-2))">✓</span>' : '') +
        '</button>';
    }
    function renderThemeMenus() {
      var cur = document.documentElement.getAttribute('data-theme') || 'midnight-obsidian';
      var darks = DK_THEMES.filter(function (x) { return x.dark; });
      var lights = DK_THEMES.filter(function (x) { return !x.dark; });
      var html = '<div class="px-2 pt-1 pb-1 text-[10px] uppercase tracking-wider text-muted font-semibold">' + T('darkThemes') + '</div>' +
        darks.map(function (th) { return themeItemHTML(th, cur); }).join('') +
        '<div class="px-2 pt-2 pb-1 mt-1 border-t border-border text-[10px] uppercase tracking-wider text-muted font-semibold">' + T('lightThemes') + '</div>' +
        lights.map(function (th) { return themeItemHTML(th, cur); }).join('');
      var menu = document.getElementById('theme-menu');
      if (menu) menu.innerHTML = html;
      var grid = document.getElementById('cps-theme-grid');
      if (grid) grid.innerHTML = html;
    }
    function syncThemeIcon() {
      var dark = document.documentElement.getAttribute('data-mode') === 'dark';
      var sun = document.getElementById('cp-theme-icon-sun');
      var moon = document.getElementById('cp-theme-icon-moon');
      if (sun) sun.classList.toggle('hidden', !dark);
      if (moon) moon.classList.toggle('hidden', dark);
    }
    var _menuBtn = null;
    function openThemeMenu() {
      var m = document.getElementById('theme-menu');
      if (!m) return;
      renderThemeMenus();
      m.classList.remove('hidden');
      if (_menuBtn) _menuBtn.setAttribute('aria-expanded', 'true');
    }
    function closeThemeMenu() {
      var m = document.getElementById('theme-menu');
      if (!m || m.classList.contains('hidden')) return;
      m.classList.add('hidden');
      if (_menuBtn) _menuBtn.setAttribute('aria-expanded', 'false');
    }

    /* ---- font scale (same 16 steps as the trainer app) ---- */
    var FONT_STEPS = [0.62, 0.68, 0.74, 0.8, 0.88, 1, 1.1, 1.2, 1.3, 1.42, 1.55, 1.7, 1.85, 2, 2.2, 2.4];
    function applyFontScale(v) {
      var best = FONT_STEPS[0];
      FONT_STEPS.forEach(function (s) { if (Math.abs(s - v) < Math.abs(best - v)) best = s; });
      document.documentElement.style.setProperty('--font-scale', String(best));
      try { localStorage.setItem('dk_portal_font', String(best)); } catch (e) {}
    }
    function stepFont(dir) {
      var cur = 1;
      try { cur = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--font-scale')) || 1; } catch (e) {}
      var idx = 0, best = 1e9;
      FONT_STEPS.forEach(function (s, i) { var d = Math.abs(s - cur); if (d < best) { best = d; idx = i; } });
      idx = Math.min(FONT_STEPS.length - 1, Math.max(0, idx + dir));
      applyFontScale(FONT_STEPS[idx]);
    }

    /* ---- texture effects v2 (same engine as the trainer app, localStorage-backed) ---- */
    var TEX_FX = ['none','glass','plastic','gloss','metal','wood','parquet','marble','tile','brick','mosaic','pebbles','asphalt','water','swamp','grass','hay','snow','bubbles','film','vhs','church'];
    var TEX_NAMES = {
      none:['Нет','None','ללא'], glass:['Стекло','Glass','זכוכית'], plastic:['Пластик','Plastic','פלסטיק'],
      gloss:['Глянец','Gloss','ברק'], metal:['Металл','Metal','מתכת'], wood:['Дерево','Wood','עץ'],
      parquet:['Паркет','Parquet','פרקט'], marble:['Мрамор','Marble','שיש'], tile:['Плитка','Tile','אריחים'],
      brick:['Кирпич','Brick','לבנים'], mosaic:['Мозаика','Mosaic','פסיפס'], pebbles:['Галька','Pebbles','חלוקי אבן'],
      asphalt:['Асфальт','Asphalt','אספלט'], water:['Вода','Water','מים'], swamp:['Болото','Swamp','ביצה'],
      grass:['Трава','Grass','דשא'], hay:['Сено','Hay','חציר'], snow:['Снег','Snow','שלג'],
      bubbles:['Пузыри','Bubbles','בועות'], film:['Плёнка','Film','פילם'], vhs:['VHS','VHS','VHS'],
      church:['Собор','Church','קתדרלה']
    };
    function texName(k) {
      var i = { ru: 0, en: 1, he: 2 }[curLang()];
      if (i == null) i = 0;
      var a = TEX_NAMES[k] || [k, k, k];
      return a[i] || k;
    }
    function texEnsureOverlay() {
      var el = document.getElementById('dk-tex-overlay');
      if (!el) { el = document.createElement('div'); el.id = 'dk-tex-overlay'; el.setAttribute('aria-hidden', 'true'); document.body.prepend(el); }
      return el;
    }
    var texState = { name: 'none', opacity: null };
    function texApply(name, opacity) {
      if (TEX_FX.indexOf(name) === -1) name = 'none';
      texState.name = name;
      texState.opacity = (typeof opacity === 'number' && isFinite(opacity)) ? Math.min(1, Math.max(0.05, opacity)) : null;
      texEnsureOverlay();
      document.body.setAttribute('data-tex', texState.name);
      if (texState.opacity == null) document.body.style.removeProperty('--texture-opacity-user');
      else document.body.style.setProperty('--texture-opacity-user', String(texState.opacity));
      var defV = 0.35;
      try { defV = parseFloat(getComputedStyle(document.body).getPropertyValue('--texture-opacity-def')) || 0.35; } catch (e) {}
      var shown = texState.opacity != null ? texState.opacity : (isFinite(defV) && defV > 0 ? defV : 0.35);
      var slider = document.getElementById('cps-tex-opacity');
      if (slider) slider.value = String(shown);
      var val = document.getElementById('cps-tex-opacity-val');
      if (val) val.textContent = Math.round(shown * 100) + '%';
      document.querySelectorAll('.texture-btn').forEach(function (btn) {
        var on = btn.getAttribute('data-tex') === texState.name;
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }
    function texPersist() {
      try { localStorage.setItem('dk_portal_tex', JSON.stringify({ name: texState.name, opacity: texState.opacity })); } catch (e) {}
    }
    function loadTex() {
      var v = {};
      try { v = JSON.parse(localStorage.getItem('dk_portal_tex') || '{}') || {}; } catch (e) { v = {}; }
      texApply(v.name || 'none', (typeof v.opacity === 'number' && isFinite(v.opacity)) ? v.opacity : null);
    }
    function buildTexButtons() {
      var grid = document.getElementById('cps-tex-grid');
      if (!grid) return;
      grid.innerHTML = TEX_FX.map(function (k) {
        return '<button type="button" class="texture-btn text-center border border-border bg-surface-2 transition" data-tex="' + k + '" aria-pressed="false">' +
          '<span class="tex-swatch" data-tex="' + k + '" aria-hidden="true"></span>' +
          '<span class="tex-name">' + texName(k) + '</span>' +
          '<span class="tex-check" aria-hidden="true">✓</span>' +
          '</button>';
      }).join('');
    }

    /* ---- settings sheet (gear in the header) ---- */
    function fillLabels() {
      var set = function (id, txt) { var el = document.getElementById(id); if (el) el.textContent = txt; };
      set('cps-title', T('setTitle'));
      set('cps-share-label', T('share'));
      set('cps-themes-label', T('themes'));
      set('cps-textures-label', T('textures'));
      set('cps-texhint-label', T('texHint'));
      set('cps-opacity-label', T('opacity'));
      set('cps-reset-label', T('reset'));
      var db = document.getElementById('dk-dumbbell-btn');
      if (db) { db.setAttribute('aria-label', T('dumbbellAria')); db.setAttribute('title', T('dumbbellAria')); }
    }
    function ensureSettingsSheet() {
      if (document.getElementById('portal-settings-sheet')) return;
      var w = document.createElement('div');
      w.id = 'portal-settings-sheet';
      w.className = 'hidden fixed inset-0 z-[96] flex items-end sm:items-center justify-center p-0 sm:p-4';
      w.innerHTML =
        '<div class="absolute inset-0 bg-black/60 backdrop-blur-sm" data-cps-backdrop></div>' +
        '<div class="relative bg-[rgb(var(--c-surface))] w-full sm:max-w-md max-h-[88vh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-border shadow-float overflow-hidden" role="dialog" aria-modal="true">' +
          '<div class="sticky top-0 z-10 bg-[rgb(var(--c-surface))] border-b border-border p-4 flex items-center gap-3">' +
            '<h3 id="cps-title" class="font-display font-bold text-base text-text flex-1"></h3>' +
            '<button type="button" data-cps-close class="w-8 h-8 grid place-items-center rounded-lg hover:opacity-80 text-muted"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg></button>' +
          '</div>' +
          '<div class="p-4 space-y-5 overflow-y-auto">' +
            '<button type="button" id="cps-share" class="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-xs font-bold text-text transition hover:opacity-80 flex items-center justify-center gap-2">' +
              '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>' +
              '<span id="cps-share-label"></span>' +
            '</button>' +
            '<div>' +
              '<div id="cps-themes-label" class="text-[10px] font-bold uppercase tracking-wider text-muted mb-2"></div>' +
              '<div id="cps-theme-grid" class="grid grid-cols-2 gap-1.5 max-h-64 overflow-y-auto"></div>' +
            '</div>' +
            '<div>' +
              '<div id="cps-textures-label" class="text-[10px] font-bold uppercase tracking-wider text-muted mb-2"></div>' +
              '<p id="cps-texhint-label" class="text-[11px] text-muted mb-2 leading-relaxed"></p>' +
              '<div id="cps-tex-grid" class="grid grid-cols-3 gap-2"></div>' +
              '<div class="mt-2">' +
                '<div class="flex items-center justify-between mb-1">' +
                  '<label id="cps-opacity-label" class="text-xs font-semibold text-muted" for="cps-tex-opacity"></label>' +
                  '<span id="cps-tex-opacity-val">35%</span>' +
                '</div>' +
                '<input type="range" id="cps-tex-opacity" min="0.05" max="1" step="0.05" value="0.35" class="w-full" style="accent-color:rgb(var(--c-accent))" />' +
                '<div class="flex justify-end mt-1">' +
                  '<button type="button" id="cps-tex-reset" class="text-[10px] font-semibold text-muted border border-border rounded-md px-2 py-0.5"><span id="cps-reset-label"></span></button>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
      document.body.appendChild(w);
      buildTexButtons();
    }
    function openSettingsSheet() {
      ensureSettingsSheet();
      fillLabels();
      renderThemeMenus();
      buildTexButtons();
      texApply(texState.name, texState.opacity);
      document.getElementById('portal-settings-sheet').classList.remove('hidden');
    }
    function closeSettingsSheet() {
      var sh = document.getElementById('portal-settings-sheet');
      if (sh) sh.classList.add('hidden');
    }

    /* ---- weight unit (kg⇄lb) — same behaviour as the trainer app ---- */
    var WKEY = 'dk_wunit';
    function wGet() { try { return localStorage.getItem(WKEY) === 'lb' ? 'lb' : 'kg'; } catch (e) { return 'kg'; } }
    function wLabel(u) { return T(u === 'lb' ? 'wunitLb' : 'wunitKg'); }
    function wShort(u) { if (u == null) u = wGet(); return T(u === 'lb' ? 'wunitLbShort' : 'wunitKgShort'); }
    function wApply() {
      var u = wGet(), sh = wShort(u);
      document.querySelectorAll('[data-wunit-chip]').forEach(function (ch) { ch.textContent = wLabel(u); });
      document.querySelectorAll('[data-wunit-col]').forEach(function (el) {
        var base = el.getAttribute('data-wunit-base') || '';
        el.textContent = (base && base.toLowerCase() !== sh.toLowerCase()) ? base + ' · ' + sh : base;
      });
    }
    var _wSrc = null;
    function wEnsureSheet() {
      if (document.getElementById('dk-wunit-sheet')) return;
      var wrap = document.createElement('div');
      wrap.id = 'dk-wunit-sheet';
      wrap.className = 'hidden fixed inset-0 z-[95] flex items-center justify-center p-4';
      wrap.innerHTML =
        '<div class="absolute inset-0 bg-black/60 backdrop-blur-sm" data-wunit-backdrop></div>' +
        '<div class="relative w-full max-w-xs rounded-2xl border border-border bg-[rgb(var(--c-surface))] shadow-float p-4 space-y-2" role="dialog" aria-modal="true">' +
          '<div class="text-[10px] font-bold uppercase tracking-wider text-muted mb-1" data-wunit-title></div>' +
          '<button type="button" data-wunit-pick="kg" class="wunit-opt w-full flex items-center justify-between gap-2 rounded-xl border border-border bg-surface-2 px-3 py-3 text-sm font-bold text-text transition"><span data-wunit-opt-label="kg"></span><span class="wunit-check" aria-hidden="true">✓</span></button>' +
          '<button type="button" data-wunit-pick="lb" class="wunit-opt w-full flex items-center justify-between gap-2 rounded-xl border border-border bg-surface-2 px-3 py-3 text-sm font-bold text-text transition"><span data-wunit-opt-label="lb"></span><span class="wunit-check" aria-hidden="true">✓</span></button>' +
        '</div>';
      document.body.appendChild(wrap);
      wrap.addEventListener('click', function (e) {
        if (e.target.closest('[data-wunit-backdrop]')) { wClose(); return; }
        var pick = e.target.closest('[data-wunit-pick]');
        if (pick) wSet(pick.getAttribute('data-wunit-pick'));
      });
    }
    function wRefreshSheet() {
      var sheet = document.getElementById('dk-wunit-sheet');
      if (!sheet) return;
      var tt = sheet.querySelector('[data-wunit-title]');
      if (tt) tt.textContent = T('wunitTitle');
      ['kg', 'lb'].forEach(function (u) {
        var lab = sheet.querySelector('[data-wunit-opt-label="' + u + '"]');
        if (lab) lab.textContent = wLabel(u) + ' · ' + wShort(u);
        var btn = sheet.querySelector('[data-wunit-pick="' + u + '"]');
        if (btn) {
          var on = wGet() === u;
          btn.classList.toggle('wunit-opt-active', on);
          var c = btn.querySelector('.wunit-check');
          if (c) c.style.visibility = on ? 'visible' : 'hidden';
        }
      });
    }
    function wOpen(srcInput) {
      _wSrc = srcInput || null;
      wEnsureSheet();
      wRefreshSheet();
      document.getElementById('dk-wunit-sheet').classList.remove('hidden');
    }
    function wClose() {
      var sh = document.getElementById('dk-wunit-sheet');
      if (sh) sh.classList.add('hidden');
      if (_wSrc && document.contains(_wSrc)) { try { _wSrc.focus({ preventScroll: true }); } catch (e) {} }
      _wSrc = null;
    }
    function wSet(u) {
      if (u !== 'lb') u = 'kg';
      try { localStorage.setItem(WKEY, u); } catch (e) {}
      wApply();
      wClose();
    }
    window.dkWUnitApply = wApply;

    /* ---- dumbbell: one-tap return to the workout (portal variant of c83) ---- */
    function sessionActive() {
      try {
        var s = (typeof getSession === 'function') ? getSession(activeDayIndex) : null;
        return !!(s && s.started_at);
      } catch (e) { return false; }
    }
    function goWorkouts() {
      var tab = document.querySelector('.nav-tab[data-tab="workouts"]');
      if (tab) tab.click();
    }
    function syncDumbbell() {
      var active = sessionActive();
      var btn = document.getElementById('dk-dumbbell-btn');
      if (btn) btn.classList.toggle('dk-dumbbell-active', active);
      var dot = document.getElementById('dk-dumbbell-dot');
      if (dot) dot.classList.toggle('hidden', !active);
    }

    /* ---- lang-change hook (called by setLang via window.dkPortalSync) ---- */
    window.dkPortalSync = function () {
      try { renderThemeMenus(); } catch (e) {}
      try { syncThemeIcon(); } catch (e) {}
      try { fillLabels(); } catch (e) {}
      try { buildTexButtons(); texApply(texState.name, texState.opacity); } catch (e) {}
      try { wApply(); } catch (e) {}
    };

    /* ---- delegated clicks ---- */
    document.addEventListener('click', function (e) {
      var pick = e.target.closest('[data-theme-pick]');
      if (pick) {
        var id = pick.getAttribute('data-theme-pick');
        try { applyTheme(id); } catch (err) {}
        try { toast(T('themeChanged'), 'info', 1500); } catch (err) {}
        renderThemeMenus();
        syncThemeIcon();
        closeThemeMenu();
        return;
      }
      if (e.target.closest('#theme-toggle')) {
        var m = document.getElementById('theme-menu');
        if (m && m.classList.contains('hidden')) openThemeMenu(); else closeThemeMenu();
        return;
      }
      var tb = e.target.closest('.texture-btn');
      if (tb) {
        texApply(tb.getAttribute('data-tex'), texState.opacity);
        texPersist();
        try { toast(T('applied'), 'success', 1600); } catch (err) {}
        return;
      }
      var inp = e.target.closest('input[data-field="weight"]');
      if (inp && inp.closest('#workout-exercises-list')) { wOpen(inp); return; }
      var chip = e.target.closest('[data-wunit-chip]');
      if (chip) { wOpen(null); return; }
      if (e.target.closest('#portal-settings-btn')) { openSettingsSheet(); return; }
      if (e.target.closest('[data-cps-backdrop]') || e.target.closest('[data-cps-close]')) { closeSettingsSheet(); return; }
      if (e.target.closest('#cps-share')) {
        closeSettingsSheet();
        try { shareReport(); } catch (err) {}
        return;
      }
    });
    document.addEventListener('click', function (e) {
      var m = document.getElementById('theme-menu');
      if (!m || m.classList.contains('hidden')) return;
      if (m.contains(e.target) || (_menuBtn && _menuBtn.contains(e.target))) return;
      closeThemeMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeThemeMenu(); closeSettingsSheet(); var sh = document.getElementById('dk-wunit-sheet'); if (sh) sh.classList.add('hidden'); }
    });
    var texSliderHooked = false;
    function hookSlider() {
      var s = document.getElementById('cps-tex-opacity');
      if (!s || texSliderHooked) return;
      texSliderHooked = true;
      s.addEventListener('input', function () {
        var v = parseFloat(s.value);
        if (!isFinite(v)) return;
        texState.opacity = v;
        document.body.style.setProperty('--texture-opacity-user', String(v));
        var val = document.getElementById('cps-tex-opacity-val');
        if (val) val.textContent = Math.round(v * 100) + '%';
        texPersist();
      });
      var r = document.getElementById('cps-tex-reset');
      if (r) r.addEventListener('click', function () {
        texApply(texState.name, null);
        texPersist();
        try { toast(T('resetDone'), 'success', 1600); } catch (err) {}
      });
    }

    ready(function () {
      _menuBtn = document.getElementById('theme-toggle');
      var db = document.getElementById('dk-dumbbell-btn');
      if (db) {
        db.setAttribute('aria-label', T('dumbbellAria'));
        db.setAttribute('title', T('dumbbellAria'));
        db.addEventListener('click', function () {
          goWorkouts();
          setTimeout(function () {
            var row = document.querySelector('#workout-exercises-list .set-row:not(.set-row-done)');
            if (row) {
              row.scrollIntoView({ behavior: 'smooth', block: 'center' });
              var card = row.closest('[data-exercise-card]');
              if (card) { card.classList.remove('dk-pos-flash'); void card.offsetWidth; card.classList.add('dk-pos-flash'); }
            } else {
              var hero = document.getElementById('client-card');
              if (hero) hero.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 80);
        });
      }
      var fd = document.getElementById('font-dec-btn');
      var fi = document.getElementById('font-inc-btn');
      if (fd) fd.addEventListener('click', function () { stepFont(-1); });
      if (fi) fi.addEventListener('click', function () { stepFont(1); });
      var sf = 1;
      try { sf = parseFloat(localStorage.getItem('dk_portal_font')); } catch (e) {}
      if (isFinite(sf) && sf > 0) applyFontScale(sf);
      ensureSettingsSheet();
      hookSlider();
      loadTex();
      syncThemeIcon();
      renderThemeMenus();
      wApply();
      setInterval(syncDumbbell, 1000);
      syncDumbbell();
    });
  })();
  </script>
`;

/* ================================ I18N ==================================== */
const WUNIT_RU = `  "wunit": {
    "title": "Единица веса",
    "kg": "Килограммы",
    "lb": "Фунты",
    "kgShort": "кг",
    "lbShort": "фт"
  },
`;
const WUNIT_EN = `  "wunit": {
    "title": "Unit of weight",
    "kg": "Kilograms",
    "lb": "Pounds",
    "kgShort": "kg",
    "lbShort": "lb"
  },
`;
const WUNIT_HE = `  "wunit": {
    "title": "יחידת משקל",
    "kg": "קילוגרמים",
    "lb": "פאונד",
    "kgShort": "ק״ג",
    "lbShort": "lb"
  },
`;

/* ============================== THEME META ================================ */
const THEME_META_ENTRIES = {
  'dark': ['true', '#0a0a0f'], 'ocean-deep': ['true', '#080f19'], 'forest-night': ['true', '#0a140f'],
  'sunset-rose': ['true', '#140a12'], 'carbon-steel': ['true', '#121214'], 'royal-purple': ['true', '#120c1c'],
  'crimson-dark': ['true', '#140a0a'], 'amber-gold': ['true', '#141008'], 'teal-pro': ['true', '#081414'],
  'slate-mono': ['true', '#0f1216'], 'light': ['false', '#f8f9fc'], 'cloud-blue': ['false', '#f0f8ff'],
  'mint-fresh': ['false', '#f0fdf4'], 'peach-soft': ['false', '#fff7ed'], 'lavender-light': ['false', '#f5f3ff'],
  'rose-quartz': ['false', '#fdf2f8'], 'sand-stone': ['false', '#fcfaf0'], 'sky-day': ['false', '#f0f9ff'],
  'sage-garden': ['false', '#f7fceb'], 'coral-reef': ['false', '#fff1f0'], 'midnight-mint': ['true', '#0e1f1a'],
  'dusk-velvet': ['true', '#1a1224'], 'graphite-mist': ['true', '#1c1d22'], 'tide-pool': ['true', '#0d1a22'],
  'warm-espresso': ['true', '#1a120c'], 'aurora-haze': ['true', '#10141f'], 'jungle': ['true', '#06120c'],
  'aquarium': ['true', '#04101c'], 'winter': ['true', '#0c121e'], 'bubble-lagoon': ['true', '#081a14'],
  'ember-tide': ['true', '#070f1e'], 'crimson-reef': ['true', '#180a10'], 'retro-1940': ['false', '#f3e8cd'],
  /* legacy portal defaults (kept so saved prefs keep resolving) */
  'midnight-obsidian': ['true', '#0a0a12'], 'arctic-frost': ['false', '#f2f8ff'], 'warm-sand': ['false', '#fcf5e8'],
  'forest-emerald': ['true', '#08120e'], 'coral-sunset': ['false', '#fff2eb']
};
function buildThemeMeta() {
  const lines = Object.entries(THEME_META_ENTRIES).map(([id, v]) => `    '${id}':{dark:${v[0]},bg:'${v[1]}'}`);
  return '  const THEME_META = {\n' + lines.join(',\n') + '\n  };';
}

/* ================================ MAIN ==================================== */
console.log('=== fix-c85.cjs ===');

/* ---------- 1. fitness-crm.html ---------- */
let crm = read('fitness-crm.html');
crm = repOnce(crm, '<meta name="dk-build" content="c84" />', '<meta name="dk-build" content="c85" />', 'crm.meta');
crm = repOnce(crm, 'var RUNNING = 84; /* numeric part of dk-build c84 */', 'var RUNNING = 85; /* numeric part of dk-build c85 */', 'crm.RUNNING');
crm = repOnce(crm, '· IndexedDB · 3 languages · c84', '· IndexedDB · 3 languages · c85', 'crm.footer');
crm = repOnce(crm, '  function dkDumbbellActive() {', TRAINER_ENGINE + '  function dkDumbbellActive() {', 'crm.wunit-engine');
crm = repOnce(crm, '/* ===== c84: Quick Pick panel mounted inline in Workouts ▸ База упражнений ===== */',
  TRAINER_WUNIT_CSS + '/* ===== c84: Quick Pick panel mounted inline in Workouts ▸ База упражнений ===== */', 'crm.wunit-css');
crm = repOnce(crm,
`                <div class="text-end shrink-0">
                  <div class="font-mono font-bold text-lg" id="live-workout-duration">0:00</div>`,
  TRAINER_CHIP +
`                <div class="text-end shrink-0">
                  <div class="font-mono font-bold text-lg" id="live-workout-duration">0:00</div>`, 'crm.live-chip');
crm = repOnce(crm,
  `<th class="px-2 py-2 text-center">\${t('workouts.weight')}</th>`,
  `<th class="px-2 py-2 text-center" data-wunit-col data-wunit-base="\${t('workouts.weight')}">\${t('workouts.weight')} · \${dkWUnitShort()}</th>`,
  'crm.weight-th');

/* ---------- 2. extract theme + texture CSS chunks from the (patched) trainer ---------- */
const themeChunk = cutBetween(crm, '    [data-theme="light"] {', '/* ===== TEXTURE EFFECTS v2 (c79)', 'crm.theme-chunk').trimEnd();
const texChunk = cutBetween(crm, '/* ===== TEXTURE EFFECTS v2 (c79)', '/* ===== COLLAPSIBLE SETTINGS PANELS =====', 'crm.tex-chunk').trimEnd();
if (themeChunk.indexOf('[data-theme="retro-1940"] body::before') === -1) { console.error('FAIL: theme chunk missing retro decorations'); process.exit(1); }
if (texChunk.indexOf("[data-tex='wood']") === -1 || texChunk.indexOf('.tex-check') === -1) { console.error('FAIL: texture chunk incomplete'); process.exit(1); }

/* ---------- 3. client.html ---------- */
let cl = read('client.html');

/* 3a. CSS: replace the 10-line portal theme block with the full port */
const clStartMarker = '[data-theme="light"] { --c-bg:248 249 252';
const clEndMarker = '[data-theme="retro-1940"] { --c-bg:243 232 205';
if ((cl.split(clStartMarker).length - 1) !== 1) { console.error('FAIL: portal css start anchor'); process.exit(1); }
if ((cl.split(clEndMarker).length - 1) !== 1) { console.error('FAIL: portal css end anchor'); process.exit(1); }
const a = cl.indexOf(clStartMarker);
const bLineEnd = cl.indexOf('\n', cl.indexOf(clEndMarker));
const newCss = `    /* ===== c85: FULL theme pack (33 themes incl. fancy decorations) + texture effects v2,
       ported 1:1 from fitness-crm.html so the portal looks EXACTLY like the
       trainer app / live workout ===== */
` + themeChunk + '\n' + texChunk + PORTAL_FONT_CSS + PORTAL_COMPAT_CSS + '\n';
cl = cl.slice(0, a) + newCss + cl.slice(bLineEnd + 1);
console.log('ok   [portal.css-port]');

/* 3b. THEME_META — the trainer's full map (dark + bg) incl. legacy portal ids */
const tmStart = cl.indexOf('  const THEME_META = {');
if (tmStart === -1) { console.error('FAIL: THEME_META not found'); process.exit(1); }
const tmEnd = cl.indexOf('\n  };', tmStart);
if (tmEnd === -1) { console.error('FAIL: THEME_META end not found'); process.exit(1); }
cl = cl.slice(0, tmStart) + buildThemeMeta() + cl.slice(tmEnd + '\n  };'.length);
console.log('ok   [portal.THEME_META]');

/* 3c. header: theme-select → dumbbell */
{
  const sAnchor = '      <select id="theme-select"';
  const sCount = cl.split(sAnchor).length - 1;
  if (sCount !== 1) { console.error('FAIL: theme-select anchor count ' + sCount); process.exit(1); }
  const sIdx = cl.indexOf(sAnchor);
  const eIdx = cl.indexOf('      </select>', sIdx);
  if (eIdx === -1) { console.error('FAIL: theme-select close not found'); process.exit(1); }
  cl = cl.slice(0, sIdx) + PORTAL_DUMBBELL_HTML + cl.slice(eIdx + '      </select>'.length);
  console.log('ok   [portal.header-dumbbell]');
}
/* 3d. header: share button → A−/A+ + theme menu + settings */
{
  const sAnchor = '      <button id="btn-share-report"';
  const sCount = cl.split(sAnchor).length - 1;
  if (sCount !== 1) { console.error('FAIL: share anchor count ' + sCount); process.exit(1); }
  const sIdx = cl.indexOf(sAnchor);
  const eIdx = cl.indexOf('      </button>', sIdx);
  if (eIdx === -1) { console.error('FAIL: share close not found'); process.exit(1); }
  cl = cl.slice(0, sIdx) + PORTAL_CONTROLS_HTML + cl.slice(eIdx + '      </button>'.length);
  console.log('ok   [portal.header-controls]');
}
/* 3e. hero: unit chip next to the live duration */
cl = repOnce(cl, '          <span id="live-duration" class="hidden font-mono font-bold text-sm text-cyan-300">0:00</span>',
  PORTAL_HERO_CHIP, 'portal.hero-chip');
/* 3f. weight column header in renderExercises */
cl = repOnce(cl,
  `<span class="text-center">\${esc(t('weightLabel'))}</span>`,
  `<span class="text-center" data-wunit-col data-wunit-base="\${esc(t('weightLabel'))}">\${esc(t('weightLabel'))}</span>`,
  'portal.weight-col');
/* 3g. renderExercises hook — re-apply unit labels after every re-render */
cl = repOnce(cl,
`    wireExerciseEvents();
    updateLiveUI();
  }`,
`    wireExerciseEvents();
    if (window.dkWUnitApply) window.dkWUnitApply();
    updateLiveUI();
  }`, 'portal.render-hook');
/* 3h. share handler guard (button moved into the settings sheet) */
cl = repOnce(cl,
  `    document.getElementById('btn-share-report').addEventListener('click', ()=>shareReport());`,
  `    document.getElementById('btn-share-report')?.addEventListener('click', ()=>shareReport());`,
  'portal.share-guard');
/* 3i. setLang → dkPortalSync */
cl = repOnce(cl,
  `    updateLabels(); renderAll();`,
  `    updateLabels(); renderAll();
    try { if (window.dkPortalSync) window.dkPortalSync(); } catch(e) {}`,
  'portal.setlang-hook');
/* 3j. the parity module (inserted as its own <script> right before the close guard) */
cl = repOnce(cl,
`  <script>
  /* ===== c14 close guard: confirm before the portal closes =====`,
  PORTAL_MODULE +
`  <script>
  /* ===== c14 close guard: confirm before the portal closes =====`, 'portal.module');

/* 3k. weightLabel EN/HE were the bare unit words ('kg' / 'ק״ג') — as the ONLY
   usage is the sets-grid header, make them real words so the unit suffix
   reads correctly ('Weight · lb' instead of 'kg · lb') */
cl = repOnce(cl,
  `      prevLabel:'Prev.',weightLabel:'kg',repsLabel:'Reps',rpeLabel:'RPE',`,
  `      prevLabel:'Prev.',weightLabel:'Weight',repsLabel:'Reps',rpeLabel:'RPE',`,
  'portal.weightLabel-en');
cl = repOnce(cl,
  `      prevLabel:'קודם',weightLabel:'ק״ג',repsLabel:'חזרות',rpeLabel:'RPE',`,
  `      prevLabel:'קודם',weightLabel:'משקל',repsLabel:'חזרות',rpeLabel:'RPE',`,
  'portal.weightLabel-he');

/* ---------- 4. i18n ---------- */
const i18nMap = { 'src/i18n/ru.json': WUNIT_RU, 'src/i18n/en.json': WUNIT_EN, 'src/i18n/he.json': WUNIT_HE };
const i18nOut = {};
for (const [f, block] of Object.entries(i18nMap)) {
  let s = read(f);
  s = repOnce(s, '  "aria": {', block + '  "aria": {', f + '.wunit');
  try { JSON.parse(s); } catch (e) { console.error('FAIL: ' + f + ' JSON broken: ' + e.message); process.exit(1); }
  i18nOut[f] = s;
}

/* ---------- 5. sw.js ---------- */
let sw = read('sw.js');
sw = repOnce(sw, "const CACHE_NAME = 'dk-gym-v111';", "const CACHE_NAME = 'dk-gym-v112';", 'sw.cache');
{
  const sAnchor = '// v111: c84';
  const sCount = sw.split(sAnchor).length - 1;
  if (sCount !== 1) { console.error('FAIL: sw v111 history anchor count ' + sCount); process.exit(1); }
  const idx = sw.indexOf(sAnchor);
  const lineEnd = sw.indexOf('\n', idx);
  const v112 = '// v112: c85 — trainer live workout: kg⇄lb weight-unit picker (tap any weight input or the header chip; the unit is displayed at the top of the live screen and on every weight column); client portal (client.html): header now matches the trainer app (dumbbell return-to-workout, A−/A+ font steps, theme quick menu with 33 themes, settings sheet with textures v2 + opacity + share), the full theme CSS pack ported 1:1, 16-step font scale, and the same kg⇄lb unit picker';
  sw = sw.slice(0, lineEnd + 1) + v112 + '\n' + sw.slice(lineEnd + 1);
  console.log('ok   [sw.history]');
}

/* ---------- 6. syntax-check every inline <script> block ---------- */
function checkScripts(file, src) {
  const re = /<script>([\s\S]*?)<\/script>/g;
  let m, i = 0, bad = 0;
  while ((m = re.exec(src)) !== null) {
    i++;
    try { new vm.Script(m[1], { filename: file + '#block' + i }); }
    catch (e) { bad++; console.error('SYNTAX FAIL ' + file + ' block ' + i + ': ' + e.message); }
  }
  console.log('ok   [' + file + ' inline scripts: ' + i + ', bad: ' + bad + ']');
  return bad === 0;
}
const syntaxOk = checkScripts('fitness-crm.html', crm) & checkScripts('client.html', cl);

/* ---------- 7. final sanity ---------- */
const sanity = [];
const assert = (cond, msg) => { if (!cond) sanity.push(msg); };
assert(crm.includes('content="c85"'), 'crm meta c85');
assert(crm.includes('var RUNNING = 85;'), 'crm RUNNING 85');
assert((crm.match(/dkWUnitGet\(/g) || []).length >= 4, 'crm engine present');
assert((crm.match(/data-wunit-col/g) || []).length >= 1, 'crm weight col');
assert((crm.match(/data-wunit-chip/g) || []).length >= 1, 'crm chip');
assert(sw.includes('dk-gym-v112'), 'sw v112');
assert(sw.split('// v112: c85').length === 2, 'sw v112 history single');
assert((cl.match(/data-theme="light" \{ --c-bg:248 249 252/g) || []).length === 0, 'portal old theme block removed');
assert(cl.includes('[data-theme="retro-1940"] body::before'), 'portal retro decorations');
assert(cl.includes("[data-tex='mosaic']"), 'portal mosaic texture');
assert(cl.includes('.tex-check'), 'portal tex styles');
assert(cl.includes("--font-scale"), 'portal font scale');
assert((cl.match(/id="theme-select"/g) || []).length === 0, 'portal theme-select removed');
assert((cl.match(/id="btn-share-report"/g) || []).length === 0, 'portal share button moved');
assert((cl.match(/DK_THEMES = \[/g) || []).length === 1, 'portal DK_THEMES');
assert(cl.includes("'ocean-deep':{dark:true,bg:'#080f19'"), 'portal THEME_META extended');
assert((cl.match(/data-wunit-col/g) || []).length >= 1, 'portal weight col');
assert((cl.match(/dk-wunit-sheet/g) || []).length >= 2, 'portal wunit sheet');
assert((cl.match(/portal-settings-sheet/g) || []).length >= 2, 'portal settings sheet');
assert((cl.match(/id="font-dec-btn"/g) || []).length === 1, 'portal font-dec btn');
assert((cl.match(/id="theme-toggle"/g) || []).length === 1, 'portal theme-toggle btn');
assert((cl.match(/id="dk-dumbbell-btn"/g) || []).length === 1, 'portal dumbbell btn');
assert(i18nOut['src/i18n/ru.json'].includes('"wunit"'), 'i18n ru wunit');
assert(i18nOut['src/i18n/en.json'].includes('"wunit"'), 'i18n en wunit');
assert(i18nOut['src/i18n/he.json'].includes('"wunit"'), 'i18n he wunit');

if (sanity.length || !syntaxOk) {
  console.error('SANITY FAILURES:\n' + sanity.map(s => ' - ' + s).join('\n'));
  process.exit(1);
}

/* ---------- 8. write everything ---------- */
write('fitness-crm.html', crm);
write('client.html', cl);
for (const [f, s] of Object.entries(i18nOut)) write(f, s);
write('sw.js', sw);
console.log('=== c85 patches applied: fitness-crm.html, client.html, 3×i18n, sw.js (RUNNING=85, dk-gym-v112) ===');
