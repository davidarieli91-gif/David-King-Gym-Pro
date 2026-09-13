/* c75: 3D atlas 1.5x + Settings ▸ UI sizes (atlas slider + fix broken bodymap/exercise-panel)
   + Exercise DB tab rebuilt as picker-style 3-column browse layout.
   Pattern: anchored single replacements (abort on count != 1). */
const fs = require('fs');
const F = 'fitness-crm.html';
let s = fs.readFileSync(F, 'utf8');
let applied = 0, failed = 0;

function repOnce(name, anchor, replacement, opts) {
  opts = opts || {};
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

/* ================= 1. CSS :root — default --ui-atlas = 1.5 ================= */
repOnce('root-ui-atlas',
  `:root {
      --font-scale: 1;`,
  `:root {
      --ui-atlas: 1.5;       /* c75: 3D atlas size multiplier (Settings ▸ UI element sizes) */
      --font-scale: 1;`);

/* ================= 2. CSS — widget boxes scale + exb layout + fixes ================= */
repOnce('css-b3d-box',
  `/* c74: DKBody3D embedded widget */
.b3d-box { position: relative; }`,
  `/* c75: 3D atlas widgets scale with --ui-atlas (Settings ▸ UI element sizes ▸ 3D atlas size) */
#exercise-bodymap-3d { width: calc(190px * var(--ui-atlas, 1.5)); height: calc(310px * var(--ui-atlas, 1.5)); }
#bm-3d-container { height: calc(360px * var(--ui-atlas, 1.5)); }
/* c75: Exercise DB browse — picker-style 3-column layout */
[data-workout-panel="exercises"]:not(.exb-manage) #exercise-tree,
[data-workout-panel="exercises"]:not(.exb-manage) #exercise-empty { display: none !important; }
[data-workout-panel="exercises"].exb-manage #exb-layout { display: none !important; }
#exb-layout { align-items: stretch; }
#exb-map-col { width: calc(clamp(200px, 19cqw, 290px) * var(--ui-bodymap, 1)); }
#exb-map-col { display: flex; }
#exb-tree-col { width: calc(clamp(150px, 16cqw, 235px) * var(--ui-exercise-panel, 1)); }
#exb-map-hint { font-size: 10px; color: rgb(var(--c-muted, 150 150 150)); text-align: center; }
#exb-map-col:has(#exercise-bodymap-panel.hidden) { display: none; }
@media (max-width: 1023px) {
  #exb-map-col { display: none; }
  #exb-map-col.exb-map-open { display: flex; width: 100%; }
  #exb-tree-col { width: calc(150px * var(--ui-exercise-panel, 1)); }
}
/* c74: DKBody3D embedded widget */
.b3d-box { position: relative; }`);

/* ================= 3. CSS — retarget dead exercise-panel selector + revive --ui-bodymap ================= */
repOnce('css-ui-bodymap-fix',
  `/* Exercise picker left panel (muscle groups) width */
    #bodymap-picker-modal [style*="width: 160px"] {
      width: calc(160px * var(--ui-exercise-panel)) !important;
    }`,
  `/* c75: Exercise picker muscle-group tree column width (was dead selector [style*="width:160px"]) */
    .picker-tree-col {
      width: calc(clamp(160px, 18cqw, 260px) * var(--ui-exercise-panel, 1));
    }
    @media (max-width: 1439px) {
      .picker-tree-col { width: calc(clamp(140px, 26vw, 210px) * var(--ui-exercise-panel, 1)); }
    }
    @media (max-width: 767px) {
      .picker-tree-col { width: calc(150px * var(--ui-exercise-panel, 1)); }
    }
    /* c75: picker map column follows the Body map SVG size slider */
    .picker-map-col { width: calc(clamp(200px, 20cqw, 320px) * var(--ui-bodymap, 1)); }
    /* c75: Body map SVG size works again — width-based (SVG hit-testing stays exact, no transform) */
    #bm-svg-container .bm-body-svg { width: 100%; max-width: calc(400px * var(--ui-bodymap, 1)); height: auto; }
    #exercise-bodymap-svg .bm-body-svg { width: calc(160px * var(--ui-bodymap, 1)); max-width: none; height: auto; }`);

/* ================= 4. JS — _renderBmSvg inline maxWidth (click-safe width scale) ================= */
repOnce('js-bm-svg-maxwidth',
  `if (svg) { svg.style.maxWidth = '160px'; svg.style.height = 'auto'; }`,
  `if (svg) { svg.style.maxWidth = 'calc(160px * var(--ui-bodymap, 1))'; svg.style.height = 'auto'; }`);

/* ================= 5. Atlas standalone — 1.5x framing + live scale refit ================= */
repOnce('atlas-dkAtlasScale',
  `  function fitCamera() {`,
  `  function dkAtlasScale() {
    try {
      var v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ui-atlas'));
      if (!isFinite(v) || v <= 0) v = 1.5;
      return Math.min(3, Math.max(1, v));
    } catch (e) { return 1.5; }
  }
  window.addEventListener('dk-atlas-scale', function () {
    if (S.root && S.camera) { try { fitCamera(); } catch (e) {} }
  });
  function fitCamera() {`);

repOnce('atlas-dist-1_5x',
  `    var dist = (size.y / 2) / Math.tan((S.camera.fov * Math.PI / 180) / 2) * 1.15;`,
  `    var dist = (size.y / 2) / Math.tan((S.camera.fov * Math.PI / 180) / 2) * 1.15 / dkAtlasScale();`);

/* ================= 6. DKBody3D widget — camera refit on scale change ================= */
repOnce('b3d-fit-fn',
  `    var dist = (size.y / 2) / Math.tan((camera.fov * Math.PI / 180) / 2) * 1.18;
    camera.position.set(c.x, c.y + size.y * 0.02, c.z + dist);
    camera.lookAt(c);
    var controls = new S._OrbitControls(camera, canvas);
    controls.enableDamping = true; controls.dampingFactor = 0.08;
    controls.minDistance = 0.4; controls.maxDistance = 8;
    controls.enablePan = false;
    controls.target.set(c.x, c.y, c.z);
    controls.update();`,
  `    var controls = new S._OrbitControls(camera, canvas);
    controls.enableDamping = true; controls.dampingFactor = 0.08;
    controls.minDistance = 0.4; controls.maxDistance = 8;
    controls.enablePan = false;
    function fit() {
      var dist = (size.y / 2) / Math.tan((camera.fov * Math.PI / 180) / 2) * 1.18 / dkAtlasScale();
      camera.position.set(c.x, c.y + size.y * 0.02, c.z + dist);
      camera.lookAt(c);
      controls.target.set(c.x, c.y, c.z);
      controls.update();
    }
    fit();
    window.addEventListener('dk-atlas-scale', fit);`);

/* ================= 7. Settings — 3D atlas size slider (DOM) ================= */
repOnce('settings-atlas-slider',
  `                  <!-- Reset button -->
                  <button id="ui-size-reset"`,
  `                  <!-- 3D atlas size (c75) -->
                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <label class="text-xs font-semibold" data-i18n="settings.atlasSize">3D atlas size</label>
                      <span id="ui-size-atlas-val" class="text-[10px] font-mono text-muted">1.50x</span>
                    </div>
                    <input type="range" id="ui-size-atlas" min="1" max="2.5" step="0.05" value="1.5" class="w-full accent-primary" />
                    <div class="flex justify-between text-[9px] text-muted mt-0.5">
                      <span>1.0x</span><span>1.5x</span><span>2.5x</span>
                    </div>
                  </div>

                  <!-- Reset button -->
                  <button id="ui-size-reset"`);

/* ================= 8. JS — UI_SIZE_KEYS + defaults + event dispatch ================= */
repOnce('js-ui-size-keys',
  `const UI_SIZE_KEYS = ['exercise-img', 'food-img', 'exercise-panel', 'exercise-card', 'modal-width', 'bodymap'];`,
  `const UI_SIZE_KEYS = ['exercise-img', 'food-img', 'exercise-panel', 'exercise-card', 'modal-width', 'bodymap', 'atlas'];`);

repOnce('js-ui-size-default',
  `          const val = sizes[key] != null ? sizes[key] : 1;`,
  `          const val = sizes[key] != null ? sizes[key] : (key === 'atlas' ? 1.5 : 1);`);

repOnce('js-ui-size-save-dispatch',
  `        document.documentElement.style.setProperty(cssVar, val);
        // Update label`,
  `        document.documentElement.style.setProperty(cssVar, val);
        if (key === 'atlas') { try { window.dispatchEvent(new CustomEvent('dk-atlas-scale')); } catch (e) {} }
        // Update label`);

repOnce('js-ui-size-reset-default',
  `        const slider = document.getElementById('ui-size-' + key);
        if (slider) slider.value = 1;
        saveUiSize(key, 1);`,
  `        const slider = document.getElementById('ui-size-' + key);
        const dv = (key === 'atlas') ? 1.5 : 1;
        if (slider) slider.value = dv;
        saveUiSize(key, dv);`);

/* ================= 9. Exercises module — expose __browse ================= */
repOnce('ex-module-browse-api',
  `toggleArchiveMode, restoreExercise, get _archiveMode() { return _archiveMode; } };`,
  `toggleArchiveMode, restoreExercise, get _archiveMode() { return _archiveMode; },
             __browse: function () { return { items: _filtered, editMode: _editMode, archiveMode: _archiveMode, group: _bmGroup, subgroup: _bmSubgroup }; } };`);

/* ================= 10. renderTree → sync dbBrowse ================= */
repOnce('ex-rendertree-hook',
  `      tree.innerHTML = html;

      // Wire all handlers
      wireTreeHandlers(tree);
    }`,
  `      tree.innerHTML = html;

      // Wire all handlers
      wireTreeHandlers(tree);
      /* c75: keep the picker-style browse columns in sync */
      if (window.dkExBrowse) { try { window.dkExBrowse.sync(); } catch (e) {} }
    }`);

/* ================= 11. toggleEditMode / toggleArchiveMode → sync mode ================= */
repOnce('ex-editmode-hook',
  `    function toggleEditMode() {
      _editMode = !_editMode;
      const tree = document.getElementById('exercise-tree');`,
  `    function toggleEditMode() {
      _editMode = !_editMode;
      if (window.dkExBrowse) { try { window.dkExBrowse.sync(); } catch (e) {} }
      const tree = document.getElementById('exercise-tree');`);

repOnce('ex-archivemode-hook',
  `    function toggleArchiveMode() {
      _archiveMode = !_archiveMode;
      const btn = document.getElementById('exercise-archive-btn');`,
  `    function toggleArchiveMode() {
      _archiveMode = !_archiveMode;
      if (window.dkExBrowse) { try { window.dkExBrowse.sync(); } catch (e) {} }
      const btn = document.getElementById('exercise-archive-btn');`);

/* ================= 12. DB tab DOM — 3-column browse layout ================= */
(function restructureDbTab() {
  const start = s.indexOf('<div id="exercise-bodymap-panel"');
  const endMarker = '<!-- ===== Tab: Templates ===== -->';
  const end = s.indexOf(endMarker);
  if (start < 0 || end < 0 || end <= start) {
    console.error('FAIL [db-tab-region]: markers not found');
    failed++;
    return;
  }
  const region = s.slice(start, end);
  ['exercise-bodymap-svg', 'exercise-bodymap-3d', 'exercise-bodymap-clear', 'exercise-tree', 'exercise-empty', 'Tree container'].forEach(k => {
    if (!region.includes(k)) { console.error('FAIL [db-tab-region]: missing ' + k); failed++; }
  });
  if (failed) return;

  const treeCommentIdx = region.indexOf('<!-- Tree container');
  const treeIdx = region.indexOf('<div id="exercise-tree"');
  const emptyIdx = region.indexOf('<div id="exercise-empty"');
  let panelHtml = region.slice(0, treeCommentIdx).trim();
  const treeHtml = region.slice(treeIdx, emptyIdx).trim();
  const emptyHtml = region.slice(emptyIdx).trim();

  // Panel restyle: always visible, column layout, width-scalable svg, inline sizes -> CSS vars
  const p1 = '<div id="exercise-bodymap-panel" class="hidden mb-3 bg-surface-2 border border-border rounded-xl p-3 flex flex-col sm:flex-row gap-3 items-start">';
  if (panelHtml.split(p1).length - 1 !== 1) { console.error('FAIL [db-tab-panel-open]'); failed++; return; }
  panelHtml = panelHtml.replace(p1,
    '<div id="exercise-bodymap-panel" class="w-full bg-surface-2 border border-border rounded-xl p-3 flex flex-col gap-3 items-start">');
  const p2 = '<div id="exercise-bodymap-svg" class="mx-auto" style="max-width: 160px;"></div>';
  if (panelHtml.split(p2).length - 1 !== 1) { console.error('FAIL [db-tab-svg-container]'); failed++; return; }
  panelHtml = panelHtml.replace(p2,
    '<div id="exercise-bodymap-svg" class="mx-auto" style="max-width: calc(160px * var(--ui-bodymap, 1));"></div>');
  const p3 = '<div id="exercise-bodymap-3d" class="b3d-box hidden mx-auto mt-2 rounded-xl overflow-hidden border border-border" style="width: 190px; height: 310px;"></div>';
  if (panelHtml.split(p3).length - 1 !== 1) { console.error('FAIL [db-tab-3d-box]'); failed++; return; }
  panelHtml = panelHtml.replace(p3,
    '<div id="exercise-bodymap-3d" class="b3d-box hidden mx-auto mt-2 rounded-xl overflow-hidden border border-border"></div>');

  const layout = `<div id="exb-layout" class="flex gap-1.5 items-stretch min-h-0 mb-3">
                <!-- Col 1: body map (SVG / 3D / Both — Settings ▸ Body map view) -->
                <div id="exb-map-col" class="shrink-0 flex-col items-center overflow-y-auto p-1.5">
                  ${panelHtml}
                  <div id="exb-map-hint" class="mt-1 px-1"></div>
                </div>
                <!-- Col 2: muscle groups tree (c75: picker-style) -->
                <div id="exb-tree-col" class="shrink-0 overflow-y-auto border-e border-border p-1.5">
                  <div id="exb-tree" class="space-y-0.5"></div>
                </div>
                <!-- Col 3: filters + exercise cards (c75: picker-style) -->
                <div id="exb-grid-col" class="flex-1 min-w-0 overflow-y-auto p-2">
                  <div id="exb-equip-chips" class="flex gap-1 mb-2 flex-wrap"></div>
                  <div id="exb-class-chips" class="flex flex-col gap-1.5 mb-2"></div>
                  <div class="flex items-center justify-end mb-1 px-1">
                    <span id="exb-count" class="text-[10px] text-muted font-mono"></span>
                  </div>
                  <div id="exb-grid" class="bm-cq-grid gap-2"></div>
                </div>
              </div>
              ${treeHtml}
              ${emptyHtml}

            `;
  s = s.slice(0, start) + layout + s.slice(end);
  applied++;
  console.log('ok  [db-tab-region]');
})();

/* ================= 13. Body map toggle → col visibility on mobile ================= */
repOnce('ex-bm-toggle-hook',
  `    if (bmToggle) bmToggle.addEventListener('click', () => {
      if (!bmPanel) return;
      bmPanel.classList.toggle('hidden');`,
  `    if (bmToggle) bmToggle.addEventListener('click', () => {
      if (!bmPanel) return;
      bmPanel.classList.toggle('hidden');
      /* c75: on <lg screens the map column is hidden — the Body map button reveals it */
      var exbMapCol = document.getElementById('exb-map-col');
      if (exbMapCol) exbMapCol.classList.toggle('exb-map-open', !bmPanel.classList.contains('hidden'));`);

/* ================= 14. dbBrowse module (new script before </body>) ================= */
const dbBrowse = `
<script>
  /* ================= c75: Exercise DB browse — picker-style 3-column layout =================
     Col1 body map (existing #exercise-bodymap-* wiring), Col2 group tree (thumbnails +
     counts, subgroup expand), Col3 equipment/class chips + image cards grid.
     Browse mode is the default; «Редактировать»/«Архив» switch back to the classic tree. */
  (function () {
    var HINT = { en: 'Tap a muscle to filter', ru: 'Нажмите на мышцу для фильтра', he: 'הקש על שריר לסינון' };
    var UNIT = { en: 'exercises', ru: 'упр.', he: 'תרגילים' };
    var ORDER = ['chest', 'back', 'shoulders', 'elbow_flexors', 'triceps', 'forearms', 'abdominals',
                 'legs', 'fullbody', 'calisthenics', 'stretching', 'warmup', 'other'];
    var EQUIP = {
      dumbbell: { en: 'Dumbbells', ru: 'Гантели', he: 'משקולות' },
      dumbbells: { en: 'Dumbbells', ru: 'Гантели', he: 'משקולות' },
      barbell: { en: 'Barbell', ru: 'Штанга', he: 'מוט' },
      cable: { en: 'Cable', ru: 'Кроссовер', he: 'כבלים' },
      machine: { en: 'Machine', ru: 'Тренажёр', he: 'מכונה' },
      bodyweight: { en: 'Bodyweight', ru: 'Вес тела', he: 'משקל גוף' },
      kettlebell: { en: 'Kettlebells', ru: 'Гири', he: 'קטלבלים' },
      kettlebells: { en: 'Kettlebells', ru: 'Гири', he: 'קטלבלים' },
      band: { en: 'Bands', ru: 'Резинки', he: 'גומיות' },
      bands: { en: 'Bands', ru: 'Резинки', he: 'גומיות' },
      plate: { en: 'Plate', ru: 'Блины', he: 'דיסקיות' },
      medicine_ball: { en: 'Medicine ball', ru: 'Медбол', he: 'כדור משקולת' },
      exercise_ball: { en: 'Exercise ball', ru: 'Фитбол', he: 'כדור התעמלות' },
      foam_roll: { en: 'Foam roll', ru: 'Ролик', he: 'רולר' },
      none: { en: 'None', ru: 'Без инвентаря', he: 'ללא' },
      other: { en: 'Other', ru: 'Другое', he: 'אחר' }
    };
    var CLASS_DIMS = [
      { key: 'mechanic', icon: '⚙️', label: { en: 'Mechanic', ru: 'Механика', he: 'מכניקה' }, values: [
        { v: 'compound', label: { en: 'Compound', ru: 'Базовое', he: 'בסיסי' } },
        { v: 'isolation', label: { en: 'Isolation', ru: 'Изолирующее', he: 'בידוד' } } ] },
      { key: 'force', icon: '↔️', label: { en: 'Force', ru: 'Усилие', he: 'כוח' }, values: [
        { v: 'push', label: { en: 'Push', ru: 'Жим', he: 'דחיפה' } },
        { v: 'pull', label: { en: 'Pull', ru: 'Тяга', he: 'משיכה' } },
        { v: 'static', label: { en: 'Static', ru: 'Статика', he: 'סטטי' } } ] },
      { key: 'level', icon: '📊', label: { en: 'Level', ru: 'Уровень', he: 'רמה' }, values: [
        { v: 'beginner', label: { en: 'Beginner', ru: 'Начальный', he: 'מתחיל' } },
        { v: 'intermediate', label: { en: 'Intermediate', ru: 'Средний', he: 'בינוני' } },
        { v: 'expert', label: { en: 'Expert', ru: 'Эксперт', he: 'מתקדם' } } ] },
      { key: 'category', icon: '🏷️', label: { en: 'Category', ru: 'Категория', he: 'קטגוריה' }, values: [
        { v: 'strength', label: { en: 'Strength', ru: 'Сила', he: 'כוח' } },
        { v: 'stretching', label: { en: 'Stretching', ru: 'Растяжка', he: 'מתיחה' } },
        { v: 'plyometrics', label: { en: 'Plyometrics', ru: 'Плиометрика', he: 'פליומטריה' } },
        { v: 'strongman', label: { en: 'Strongman', ru: 'Стронгмен', he: 'סטרונגמן' } },
        { v: 'cardio', label: { en: 'Cardio', ru: 'Кардио', he: 'כושר' } } ] }
    ];
    var _open = {};
    var _equip = 'all';
    var _cls = { mechanic: null, force: null, level: null, category: null };

    function esc(x) {
      return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }
    function lang() {
      try { if (typeof currentLang === 'function') return currentLang(); } catch (e) {}
      return (document.documentElement.getAttribute('lang') || 'en').slice(0, 2);
    }
    function tr(dict) { return (dict && (dict[lang()] || dict.en)) || ''; }
    function api() {
      try { return (typeof screens !== 'undefined' && screens.exercises && screens.exercises.__browse) ? screens.exercises.__browse() : null; }
      catch (e) { return null; }
    }
    function panel() { return document.querySelector('[data-workout-panel="exercises"]'); }
    function gLabel(g) { try { return (typeof groupName === 'function' && groupName(g)) || g; } catch (e) { return g; } }
    function sLabel(sv) { try { return (typeof subgroupName === 'function' && subgroupName(sv)) || sv; } catch (e) { return sv; } }
    function gIcon(g) { try { return (typeof muscleGroupIcon === 'function') ? muscleGroupIcon(g) : ''; } catch (e) { return ''; } }
    function sIcon(g, sv) { try { return (typeof subgroupIcon === 'function') ? subgroupIcon(g, sv) : ''; } catch (e) { return ''; } }
    function exName(e) { var L = lang(); return e['name_' + L] || e.name_en || '?'; }
    function equipOf(e) { return e.equipment_type || e.e || ''; }
    function equipLabel(t) { var d = EQUIP[t]; return d ? tr(d) : String(t).replace(/_/g, ' '); }
    function counts(items) {
      var map = {};
      (items || []).forEach(function (e) {
        var g = e.group_canonical || e.g || 'other';
        if (!map[g]) map[g] = { count: 0, sub: {} };
        map[g].count++;
        var sv = e.sE || e.subgroup_en || '';
        if (sv) map[g].sub[sv] = (map[g].sub[sv] || 0) + 1;
      });
      return map;
    }

    /* ---------- Col 2: group tree ---------- */
    function renderTree(a) {
      var el = document.getElementById('exb-tree');
      if (!el) return;
      var map = counts(a.items);
      var gs = Object.keys(map).sort(function (x, y) {
        var ix = ORDER.indexOf(x), iy = ORDER.indexOf(y);
        if (ix !== -1 && iy !== -1) return ix - iy;
        if (ix !== -1) return -1;
        if (iy !== -1) return 1;
        return x.localeCompare(y);
      });
      var html = '';
      gs.forEach(function (g) {
        var info = map[g];
        var active = a.group === g && !a.subgroup;
        var open = !!_open[g] || a.group === g;
        var hasSub = Object.keys(info.sub).length > 0;
        var cls = active ? 'bg-primary text-white border-primary' : 'bg-surface-2 hover:bg-primary/20 border-border';
        html += '<div class="bm-group-folder">' +
          '<div class="bm-group-header flex items-center gap-1.5 font-semibold rounded-lg border ' + cls + ' transition cursor-pointer" data-exb-group="' + esc(g) + '">' +
          '<span class="text-[10px] w-3 shrink-0 text-center">' + (hasSub ? (open ? '▾' : '▸') : '') + '</span>' +
          '<span class="mg-icon-box shrink-0">' + gIcon(g) + '</span>' +
          '<span class="flex-1 truncate">' + esc(gLabel(g)) + '</span>' +
          '<span class="text-[12px] opacity-70 shrink-0 font-semibold">' + info.count + '</span>' +
          '</div>';
        if (hasSub && open) {
          html += '<div class="bm-subgroups ps-3 mt-0.5 space-y-0.5">';
          Object.keys(info.sub).forEach(function (sv) {
            var sAct = a.group === g && a.subgroup === sv;
            var sCls = sAct ? 'bg-primary/30 text-primary-2 border-primary/40' : 'bg-surface hover:bg-primary/10 border-transparent';
            html += '<div class="bm-subgroup-btn flex items-center gap-1.5 text-[10px] font-medium rounded-md border ' + sCls + ' transition cursor-pointer" data-exb-sub="' + esc(sv) + '" data-exb-group="' + esc(g) + '">' +
              '<span class="mg-icon-box shrink-0">' + sIcon(g, sv) + '</span>' +
              '<span class="flex-1 truncate">' + esc(sLabel(sv)) + '</span>' +
              '<span class="text-[10px] opacity-60 shrink-0">' + info.sub[sv] + '</span>' +
              '</div>';
          });
          html += '</div>';
        }
        html += '</div>';
      });
      el.innerHTML = html || '<div class="text-[11px] text-muted text-center py-3">—</div>';
    }

    function wireTree() {
      var el = document.getElementById('exb-tree');
      if (!el || el.__wired) return;
      el.__wired = true;
      el.addEventListener('click', function (ev) {
        var sub = ev.target.closest ? ev.target.closest('[data-exb-sub]') : null;
        var hdr = sub ? null : (ev.target.closest ? ev.target.closest('[data-exb-group]') : null);
        if (sub) {
          try { screens.exercises.setBodyMapFilter(sub.getAttribute('data-exb-group'), sub.getAttribute('data-exb-sub')); } catch (e) {}
          return;
        }
        if (hdr) {
          var g = hdr.getAttribute('data-exb-group');
          var a = api();
          if (a && a.group === g && !a.subgroup) {
            _open[g] = false;
            try { screens.exercises.clearBodyMapFilter(); } catch (e) {}
          } else {
            _open[g] = true;
            try { screens.exercises.setBodyMapFilter(g, null); } catch (e) {}
          }
        }
      });
    }

    /* ---------- Col 3: chips ---------- */
    function renderChips(a) {
      var eq = document.getElementById('exb-equip-chips');
      if (eq) {
        var types = {};
        (a.items || []).forEach(function (e) { var t = equipOf(e); if (t) types[t] = (types[t] || 0) + 1; });
        var allL = 'All';
        try { allL = (typeof t === 'function' && t('common.all')) || 'All'; } catch (e) {}
        var html = '<button class="bm-chip text-[13px] font-semibold px-3 py-1.5 rounded-full border ' + (_equip === 'all' ? 'active' : 'bg-surface-2 text-muted border-border') + '" data-exb-equip="all">' + esc(allL) + '</button>';
        Object.keys(types).sort().forEach(function (tp) {
          html += '<button class="bm-chip text-[13px] font-semibold px-3 py-1.5 rounded-full border ' + (_equip === tp ? 'active' : 'bg-surface-2 text-muted border-border') + '" data-exb-equip="' + esc(tp) + '">' + esc(equipLabel(tp)) + ' <span class="opacity-60">' + types[tp] + '</span></button>';
        });
        eq.innerHTML = html;
      }
      var cc = document.getElementById('exb-class-chips');
      if (cc) {
        var html2 = '';
        var L = lang();
        CLASS_DIMS.forEach(function (dim) {
          var cts = {};
          dim.values.forEach(function (v) { cts[v.v] = 0; });
          (a.items || []).forEach(function (e) { var v = e[dim.key]; if (v && cts.hasOwnProperty(v)) cts[v]++; });
          var total = 0; Object.keys(cts).forEach(function (k) { total += cts[k]; });
          if (!total) return;
          html2 += '<div class="flex items-center gap-1 flex-wrap">' +
            '<span class="text-[9px] font-bold uppercase text-muted shrink-0" style="min-width:60px">' + dim.icon + ' ' + esc(dim.label[L] || dim.label.en) + '</span>' +
            '<button class="bm-class-chip text-[10px] font-semibold px-2 py-0.5 rounded-full border ' + (!_cls[dim.key] ? 'active' : 'bg-surface-2 text-muted border-border') + '" data-exb-class-key="' + dim.key + '" data-exb-class-val="">All</button>';
          dim.values.forEach(function (v) {
            if (!cts[v.v]) return;
            var act = _cls[dim.key] === v.v;
            html2 += '<button class="bm-class-chip text-[10px] font-semibold px-2 py-0.5 rounded-full border ' + (act ? 'active' : 'bg-surface-2 text-muted border-border') + '" data-exb-class-key="' + dim.key + '" data-exb-class-val="' + esc(v.v) + '">' + esc(v.label[L] || v.label.en) + ' <span class="opacity-60">' + cts[v.v] + '</span></button>';
          });
          html2 += '</div>';
        });
        cc.innerHTML = html2;
      }
    }

    function wireChips() {
      var eq = document.getElementById('exb-equip-chips');
      if (eq && !eq.__wired) {
        eq.__wired = true;
        eq.addEventListener('click', function (ev) {
          var b = ev.target.closest ? ev.target.closest('[data-exb-equip]') : null;
          if (!b) return;
          _equip = b.getAttribute('data-exb-equip');
          var a = api(); if (a) { renderChips(a); renderGrid(a); }
        });
      }
      var cc = document.getElementById('exb-class-chips');
      if (cc && !cc.__wired) {
        cc.__wired = true;
        cc.addEventListener('click', function (ev) {
          var b = ev.target.closest ? ev.target.closest('[data-exb-class-key]') : null;
          if (!b) return;
          var k = b.getAttribute('data-exb-class-key');
          var v = b.getAttribute('data-exb-class-val');
          _cls[k] = v || null;
          var a = api(); if (a) { renderChips(a); renderGrid(a); }
        });
      }
    }

    /* ---------- Col 3: cards grid ---------- */
    function localFilter(items) {
      return (items || []).filter(function (e) {
        if (_equip !== 'all' && equipOf(e) !== _equip) return false;
        for (var k in _cls) {
          if (_cls[k] && e[k] !== _cls[k]) return false;
        }
        return true;
      });
    }
    function cardHtml(e) {
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
    }
    function renderGrid(a) {
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
    }
    function wireGrid() {
      var grid = document.getElementById('exb-grid');
      if (!grid || grid.__wired) return;
      grid.__wired = true;
      grid.addEventListener('click', function (ev) {
        var card = ev.target.closest ? ev.target.closest('[data-exb-id]') : null;
        if (!card) return;
        try { screens.exercises.openView(card.getAttribute('data-exb-id')); } catch (e) {}
      });
    }

    /* ---------- sync ---------- */
    function sync() {
      var a = api();
      var p = panel();
      if (!p) return;
      var manage = !!(a && (a.editMode || a.archiveMode));
      p.classList.toggle('exb-manage', manage);
      var hint = document.getElementById('exb-map-hint');
      if (hint) hint.textContent = HINT[lang()] || HINT.en;
      if (!a) return;
      renderTree(a);
      renderChips(a);
      renderGrid(a);
    }

    window.dkExBrowse = { sync: sync };

    function init() {
      wireTree(); wireChips(); wireGrid();
      sync();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
    /* re-localize texts when the app language changes */
    var lastLang = lang();
    new MutationObserver(function () {
      var l = lang();
      if (l !== lastLang) { lastLang = l; try { sync(); } catch (e) {} }
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  })();
</script>
`;
repOnce('dbbrowse-script',
  `\n</script>\n</body>\n</html>`,
  `\n</script>\n` + dbBrowse + `</body>\n</html>`);

/* ================= 15. Version bump: c75 / RUNNING=75 / sw v102 ================= */
repOnce('ver-dk-build',
  `<meta name="dk-build" content="c74" />`,
  `<meta name="dk-build" content="c75" />`);
repOnce('ver-running',
  `var RUNNING = 74; /* numeric part of dk-build c74 */`,
  `var RUNNING = 75; /* numeric part of dk-build c75 */`);

/* ================= 16. Write ================= */
if (failed) {
  console.error('ABORT: ' + failed + ' replacement(s) failed — file NOT written');
  process.exit(1);
}
fs.writeFileSync(F, s);
console.log('WROTE ' + F + ' (' + applied + ' replacements)');
