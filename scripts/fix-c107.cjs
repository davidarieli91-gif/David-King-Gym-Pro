#!/usr/bin/env node
/* ============================================================================
 * fix-c107.cjs — superset ✓ sync + font-scale adaptivity + goal-badge removal
 *               + «шаблон без упражнений» fix   (see sw.js v134 line for details)
 * Targets: fitness-crm.html (crm), client.html (cl), sw.js (sw)
 * ==========================================================================*/
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FILE = path.join(ROOT, 'fitness-crm.html');
const CLIENT = path.join(ROOT, 'client.html');
const SW = path.join(ROOT, 'sw.js');
let html = fs.readFileSync(FILE, 'utf8');
let cl = fs.readFileSync(CLIENT, 'utf8');
let sw = fs.readFileSync(SW, 'utf8');
const fails = [];
let patched = 0;

function srcOf(file) { return file === 'cl' ? cl : (file === 'sw' ? sw : html); }
function storeOf(file, s) { if (file === 'cl') cl = s; else if (file === 'sw') sw = s; else html = s; }

function repOnce(name, anchor, replacement, file) {
  const s0 = srcOf(file);
  const idx = s0.indexOf(anchor);
  if (idx === -1) { fails.push(`[${name}] anchor NOT FOUND`); return; }
  if (s0.indexOf(anchor, idx + 1) !== -1) { fails.push(`[${name}] anchor NOT UNIQUE`); return; }
  storeOf(file, s0.slice(0, idx) + replacement + s0.slice(idx + anchor.length));
  patched++;
  console.log(`  ✓ ${name}`);
}

function repAll(name, anchor, replacement, file) {
  const s0 = srcOf(file);
  if (!s0.includes(anchor)) { fails.push(`[${name}] anchor NOT FOUND`); return; }
  const n = s0.split(anchor).length - 1;
  storeOf(file, s0.split(anchor).join(replacement));
  patched++;
  console.log(`  ✓ ${name} (x${n})`);
}

/* ================= 1. VERSIONS ================= */
repOnce('meta c106→c107',
  `<meta name="dk-build" content="c106" />`,
  `<meta name="dk-build" content="c107" />`);
repOnce('login footer c106→c107',
  `IndexedDB · 3 languages · c106`,
  `IndexedDB · 3 languages · c107`);
repOnce('RUNNING 106→107',
  `var RUNNING = 106; /* numeric part of dk-build c106 */`,
  `var RUNNING = 107; /* numeric part of dk-build c107 */`);
repOnce('sw cache v133→v134',
  `const CACHE_NAME = 'dk-gym-v133'; // c106`,
  `// v134: c107 — (1) SUPERSET ✓ SYNC: checking a set on one exercise now checks the SAME set index on its superset partners in BOTH the trainer live workout and the trainee portal (unchecking mirrors too, prev-chaining included), «Сделал всё» lands on the partners, add/remove set keep the pair at the same set count, and every session start equalizes a superset run to its max set count — the pair always finishes together, rest timer starts once; (2) FONT-SCALE ADAPTIVITY: flex/grid children may now shrink below their content minimum (min-width:0 — scroll strips keep the old behavior), the Workouts/Tools/Nutrition/Analytics tab bars, the screen header rows and the top bar (lang/A±/theme/lock) wrap instead of pushing buttons off-screen, and from A3+ (scale ≥1.3) whitespace-nowrap utilities are released and long words may break instead of bleeding out of their chip — the Tools MAINTENANCE card no longer crosses its parent card; (3) a template saved from a PROGRAM now also stores a flattened exercise list and every template reader (card counter, apply picker, start) falls back to flattening workout_days — «0 упражнения · 0 подходов» and empty apply fixed, old broken templates self-heal on read; (4) the obsolete «Гипертрофия» goal badge is gone from client cards, the profile hero, the exported PDF header, both generator previews and the portal header subtitle (groupings are Спортзал/Друзья/Семья since c105)
const CACHE_NAME = 'dk-gym-v134'; // c107`, 'sw');

/* ================= 2. FONT-SCALE ADAPTIVITY (CRM CSS) ================= */
repOnce('CSS: adaptivity layer',
`    html { font-size: clamp(10px, calc(16px * var(--font-scale)), 60px); }`,
`    html { font-size: clamp(10px, calc(16px * var(--font-scale)), 60px); }

    /* ===== c107: font-scale adaptivity — panels must never overflow when
       A+/A- grow or shrink --font-scale. Layer 1: flex/grid cells may shrink
       below their content minimum (Tailwind's min-width:auto refused to
       shrink, so inputs (~170px min-content) and nowrap rows pushed panels
       past their borders). At normal scale nothing changes — shrinking only
       happens when the row is genuinely too tight. ===== */
    body .flex > *, body .grid > * { min-width: 0; }
    /* horizontal scroll strips keep the old behavior — their children must
       stay content-sized, that is what makes them scrollable */
    .overflow-x-auto > *, .overflow-x-scroll > * { min-width: auto; }
    /* Layer 2: segment tab bars wrap instead of overflowing (Отчёт /
       Калькулятор… were cut off screen at big scales) */
    html .flex:has(> .workout-tab-btn), html .flex:has(> .tools-tab),
    html .flex:has(> .nutrition-tab-btn), html .flex:has(> .analytics-range-btn) { flex-wrap: wrap; }
    html .workout-tab-btn, html .tools-tab, html .nutrition-tab-btn,
    html .analytics-range-btn { white-space: normal; line-height: 1.2; }
    /* Layer 3: screen header rows (title + action button) wrap when tight */
    html .flex.items-center:has(> h1) { flex-wrap: wrap; }
    /* Layer 4: top bar (lang / A- A+ / theme / lock) wraps to a second line
       instead of pushing the lock button off-screen */
    html .dk-topbar-row, html .dk-topbar-row > div { flex-wrap: wrap; }
    html .dk-topbar-row { height: auto; min-height: 2.5rem; padding-block: 0.25rem; }
    /* Layer 5: at A3+ (scale ≥ 1.3) long one-word labels may break mid-word
       instead of bleeding out of their chip; nowrap utilities are released */
    html.dk-fs-big body { overflow-wrap: break-word; }
    html.dk-fs-big .whitespace-nowrap:not(.dk-keep-nowrap) { white-space: normal; }`);

repOnce('topbar row class',
  `<div class="flex items-center gap-2 px-3 h-10">`,
  `<div class="dk-topbar-row flex items-center gap-2 px-3">`);

repOnce('applyFontSize toggles dk-fs-big',
`      const snapped = _findClosestFontScale(scale);
      document.documentElement.style.setProperty('--font-scale', String(snapped));`,
`      const snapped = _findClosestFontScale(scale);
      document.documentElement.style.setProperty('--font-scale', String(snapped));
      /* c107: big-font tier — releases nowrap + allows mid-word breaks */
      document.documentElement.classList.toggle('dk-fs-big', snapped >= 1.3);`);

repOnce('maintenance header row wraps',
`                    <div class="flex items-center justify-between gap-2">
                      <div class="text-[11px] uppercase tracking-wider text-muted font-bold" data-i18n="tools.maintenanceLabel">Maintenance</div>`,
`                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <div class="text-[11px] uppercase tracking-wider text-muted font-bold" data-i18n="tools.maintenanceLabel">Maintenance</div>`);

/* ================= 3. SUPERSET SYNC (CRM live workout) ================= */
repOnce('live: superset helpers',
`    /** Build HTML for a single set row. */`,
`    /* ===== c107: superset set-sync — a ✓ on one exercise checks the SAME set
       index on its superset partners; «Сделал всё», add-set and remove-set
       keep every partner at the same set count, so the pair always finishes
       together. A superset group = a maximal run of CONSECUTIVE is_superset
       exercises (the builder always marks an exercise and its next one). ===== */
    function lwSupersetGroup(idx) {
      if (!_workout || !_workout.exercises[idx] || _workout.exercises[idx].is_superset !== true) return [];
      const exs = _workout.exercises;
      let a = idx; while (a - 1 >= 0 && exs[a - 1] && exs[a - 1].is_superset === true) a--;
      let b = idx; while (b + 1 < exs.length && exs[b + 1] && exs[b + 1].is_superset === true) b++;
      const out = [];
      for (let i = a; i <= b; i++) if (i !== idx) out.push(i);
      return out;
    }
    /* pad every member of a superset run to the same set count (last-set clone) */
    function lwEqualizeSupersets(exs) {
      if (!Array.isArray(exs)) return;
      let i = 0;
      while (i < exs.length) {
        if (exs[i] && exs[i].is_superset === true) {
          let j = i;
          while (j + 1 < exs.length && exs[j + 1] && exs[j + 1].is_superset === true) j++;
          let max = 0;
          for (let k = i; k <= j; k++) max = Math.max(max, (exs[k].sets || []).length);
          for (let k = i; k <= j; k++) {
            const ex = exs[k];
            while (ex.sets.length > 0 && ex.sets.length < max) {
              const last = ex.sets[ex.sets.length - 1];
              ex.sets.push(Object.assign({}, last, { done: false, rpe: null, prev_rpe: null }));
            }
          }
          i = j + 1;
        } else i++;
      }
    }
    /* chain the just-done set's values into the next set's «prev» (shared by
       the primary exercise and its superset partners) */
    function lwChainPrev(exIdx, si) {
      const ex = _workout && _workout.exercises[exIdx];
      if (!ex || si + 1 >= ex.sets.length) return;
      const curr = ex.sets[si];
      const nxt = ex.sets[si + 1];
      nxt.prev_weight = curr.weight;
      nxt.prev_reps = curr.reps;
      nxt.prev_rpe = curr.rpe; /* c90: chain the effort too */
      const cEx = exIsCardio(ex);
      const sEx = exIsStretch(ex) || exIsWarmup(ex); /* c102+c105 */
      if (cEx || sEx) nxt.prev_time = curr.time;
      if (cEx) nxt.prev_dist = curr.dist;
      const nextRow = document.querySelector(\`[data-set-row="\${exIdx}.\${si + 1}"]\`);
      if (nextRow) {
        const prevCell = nextRow.querySelector('[data-prev-cell]');
        if (prevCell) {
          const txt = cEx
            ? \`\${curr.time != null ? curr.time : '—'}×\${curr.dist != null ? curr.dist : '—'}\`
            : sEx
            ? \`\${curr.time != null ? curr.time : '—'}×\${curr.weight != null ? curr.weight : '—'}×\${curr.reps != null ? curr.reps : '—'}\`
            : \`\${curr.weight != null ? curr.weight : '—'}×\${curr.reps != null ? curr.reps : '—'}\`;
          prevCell.innerHTML = escapeHTML(txt) + (curr.rpe != null ? prevRpeBadgeHTML(curr.rpe) : '');
        }
      }
    }

    /** Build HTML for a single set row. */`);

repOnce('live: toggle done sync',
`            set.done = !set.done;
            const ex = _workout.exercises[exIdx];
            const si = parseInt(setIdx);
            const row = btn.closest('.set-row');
            if (row) row.classList.toggle('set-row-done', set.done);
            updateMiniProgress(parseInt(exIdx, 10));
            if (set.done) {
              // Auto-fill previous values for next set if exists
              if (si + 1 < ex.sets.length) {
                const curr = ex.sets[si];
                ex.sets[si + 1].prev_weight = curr.weight;
                ex.sets[si + 1].prev_reps = curr.reps;
                ex.sets[si + 1].prev_rpe = curr.rpe; /* c90: chain the effort too */
                const cEx = exIsCardio(ex);
                const sEx = exIsStretch(ex) || exIsWarmup(ex); /* c102+c105: stretch/warm-up chain their hold time too */
                if (cEx || sEx) {
                  ex.sets[si + 1].prev_time = curr.time;
                }
                if (cEx) {
                  ex.sets[si + 1].prev_dist = curr.dist;
                }
                const nextRow = document.querySelector(\`[data-set-row="\${exIdx}.\${si + 1}"]\`);
                if (nextRow) {
                  const prevCell = nextRow.querySelector('[data-prev-cell]');
                  if (prevCell) {
                    const txt = cEx
                      ? \`\${curr.time != null ? curr.time : '—'}×\${curr.dist != null ? curr.dist : '—'}\`
                      : sEx
                      ? \`\${curr.time != null ? curr.time : '—'}×\${curr.weight != null ? curr.weight : '—'}×\${curr.reps != null ? curr.reps : '—'}\`
                      : \`\${curr.weight != null ? curr.weight : '—'}×\${curr.reps != null ? curr.reps : '—'}\`;
                    prevCell.innerHTML = escapeHTML(txt) + (curr.rpe != null ? prevRpeBadgeHTML(curr.rpe) : '');
                  }
                }
              }
              // Start rest timer — use per-exercise rest if set, else 90
              const restSec = ex.rest_sec != null ? ex.rest_sec : 90;
              restTimer.start(restSec);`,
`            set.done = !set.done;
            const ex = _workout.exercises[exIdx];
            const xi = parseInt(exIdx, 10);
            const si = parseInt(setIdx);
            const row = btn.closest('.set-row');
            if (row) row.classList.toggle('set-row-done', set.done);
            updateMiniProgress(xi);
            if (set.done) {
              // c107: chain prev values (primary exercise)
              lwChainPrev(xi, si);
              // c107: superset sync — the ✓ lands on the SAME set of every partner
              lwSupersetGroup(xi).forEach(p => {
                const pEx = _workout.exercises[p];
                const pSet = pEx && pEx.sets[si];
                if (!pSet || pSet.done) return;
                pSet.done = true;
                const pRow = document.querySelector(\`[data-set-row="\${p}.\${si}"]\`);
                if (pRow) pRow.classList.add('set-row-done');
                updateMiniProgress(p);
                lwChainPrev(p, si);
              });
              // Start rest timer — use per-exercise rest if set, else 90
              const restSec = ex.rest_sec != null ? ex.rest_sec : 90;
              restTimer.start(restSec);`);

repOnce('live: toggle uncheck sync',
`              }
            } else {
              updateStats();
              updateProgressBar();
              saveDraft();
            }`,
`              }
            } else {
              // c107: unchecking mirrors to the superset partners too
              lwSupersetGroup(xi).forEach(p => {
                const pEx = _workout.exercises[p];
                const pSet = pEx && pEx.sets[si];
                if (!pSet || !pSet.done) return;
                pSet.done = false;
                const pRow = document.querySelector(\`[data-set-row="\${p}.\${si}"]\`);
                if (pRow) pRow.classList.remove('set-row-done');
                updateMiniProgress(p);
              });
              updateStats();
              updateProgressBar();
              saveDraft();
            }`);

repOnce('live: add-set sync',
`              prev_rpe: null
            });
            render();`,
`              prev_rpe: null
            });
            /* c107: superset sync — the new set lands on every partner too */
            const ns = ex.sets[ex.sets.length - 1];
            lwSupersetGroup(exIdx).forEach(p => {
              const pEx = _workout.exercises[p];
              if (pEx) pEx.sets.push(Object.assign({}, ns));
            });
            render();`);

repOnce('live: remove-set sync',
`          if (_workout && _workout.exercises[exIdx]) {
            _workout.exercises[exIdx].sets.splice(setIdx, 1);
            render();
          }`,
`          if (_workout && _workout.exercises[exIdx]) {
            _workout.exercises[exIdx].sets.splice(setIdx, 1);
            /* c107: superset sync — partners keep the same set count */
            lwSupersetGroup(exIdx).forEach(p => {
              const pEx = _workout.exercises[p];
              if (pEx && pEx.sets.length > 1 && pEx.sets[setIdx]) pEx.sets.splice(setIdx, 1);
            });
            render();
          }`);

repOnce('live: done-all sync',
`          const ex = _workout.exercises[idx];
          ex.sets.forEach(s => { s.done = true; });
          saveDraft();
          render();`,
`          const ex = _workout.exercises[idx];
          ex.sets.forEach(s => { s.done = true; });
          /* c107: «Сделал всё» lands on the superset partners too */
          lwSupersetGroup(idx).forEach(p => {
            const pEx = _workout.exercises[p];
            if (pEx) pEx.sets.forEach(s => { s.done = true; });
          });
          saveDraft();
          render();`);

repOnce('live: equalize startFromTemplate',
`        started_at: Date.now()
      };
      await loadExerciseCache();  // Fix: await before render() so thumbnails appear
      loadClientList();
      render();`,
`        started_at: Date.now()
      };
      lwEqualizeSupersets(_workout.exercises); /* c107: partners start with equal set counts */
      await loadExerciseCache();  // Fix: await before render() so thumbnails appear
      loadClientList();
      render();`);

repOnce('live: equalize startFromProgram',
`        started_at: Date.now()
      };
      await loadExerciseCache();  // Fix: await before render() so thumbnails appear
      loadClientList().then(() => {`,
`        started_at: Date.now()
      };
      lwEqualizeSupersets(_workout.exercises); /* c107: partners start with equal set counts */
      await loadExerciseCache();  // Fix: await before render() so thumbnails appear
      loadClientList().then(() => {`);

repOnce('live: equalize applyTemplateToClient',
`        started_at: Date.now()
      };
      loadExerciseCache();
      loadClientList().then(() => {`,
`        started_at: Date.now()
      };
      lwEqualizeSupersets(_workout.exercises); /* c107: partners start with equal set counts */
      loadExerciseCache();
      loadClientList().then(() => {`);

repAll('live: template mapping carries is_superset',
`          cardio: ex.cardio === true || ex.category === 'cardio',
          rest_sec: ex.rest_sec != null ? ex.rest_sec : 90,
          unit: ex.unit === 'lb' ? 'lb' : (ex.unit === 'kg' ? 'kg' : dkWUnitGet()),
          sets: (ex.sets || []).map(s => ({ ...s, done: false }))`,
`          cardio: ex.cardio === true || ex.category === 'cardio',
          rest_sec: ex.rest_sec != null ? ex.rest_sec : 90,
          unit: ex.unit === 'lb' ? 'lb' : (ex.unit === 'kg' ? 'kg' : dkWUnitGet()),
          tunit: ex.tunit === 'min' || ex.tunit === 'sec' ? ex.tunit : null, /* c107 */
          is_superset: ex.is_superset === true, /* c107: superset pairs survive template → live */
          sets: (ex.sets || []).map(s => ({ ...s, done: false }))`);

/* ================= 4. TEMPLATE FLATTEN (bug: «0 упражнения») ================= */
repOnce('tpl: global flatten helper',
`  screens.templates = (function () {`,
`  /* c107: a template saved from a PROGRAM stores its days in workout_days —
     flatten them (rest days skipped) so the card counter, the apply-picker
     and startFromTemplate all see the exercises. Templates saved from the
     live workout already carry a flat exercises array. Fixes the user report
     «внутри сохранённого шаблона нет ни одного упражнения». */
  function dkTplExercises(tpl) {
    if (!tpl) return [];
    if (Array.isArray(tpl.exercises) && tpl.exercises.length) return tpl.exercises;
    const out = [];
    (tpl.workout_days || []).forEach(d => {
      if (!d || d.is_rest_day) return;
      (d.exercises || []).forEach(ex => out.push(ex));
    });
    return out;
  }

  screens.templates = (function () {`);

repOnce('tpl: cardHTML reads flatten',
`      const exerciseCount = (tpl.exercises || []).length;
      const totalSets = (tpl.exercises || []).reduce((sum, ex) => sum + (ex.sets || []).length, 0);`,
`      const exerciseCount = dkTplExercises(tpl).length; /* c107 */
      const totalSets = dkTplExercises(tpl).reduce((sum, ex) => sum + (ex.sets || []).length, 0); /* c107 */`);

repOnce('tpl: picker reads flatten',
`          const exerciseCount = (tpl.exercises || []).length;
          const totalSets = (tpl.exercises || []).reduce((sum, ex) => sum + (ex.sets || []).length, 0);`,
`          const exerciseCount = dkTplExercises(tpl).length; /* c107 */
          const totalSets = dkTplExercises(tpl).reduce((sum, ex) => sum + (ex.sets || []).length, 0); /* c107 */`);

repOnce('tpl: saveProgramAsTemplate stores flat exercises',
`        split_type: prog.split_type || 'ab',
        duration_months: prog.duration_months || 3,`,
`        split_type: prog.split_type || 'ab',
        duration_months: prog.duration_months || 3,
        /* c107: flattened exercise list so the card/picker/apply see them (the
           card used to show «0 упражнения · 0 подходов» and applying started an
           empty live workout) */
        exercises: (prog.workout_days || []).filter(d => d && !d.is_rest_day).reduce((acc, d) => acc.concat(d.exercises || []), []),`);

/* ================= 5. GOAL BADGE REMOVAL (CRM) ================= */
repOnce('goal: client card drop',
`      // Bug fix (2026-08 QA #5): c.goal = "fat_loss" produced key "client.goalFat_loss" (with underscore)
      // which doesn't match dict key "client.goalFatLoss" (camelCase). Strip underscores first.
      const goalCamel = c.goal ? c.goal.split('_').map((p, i) => i === 0 ? p.charAt(0).toUpperCase() + p.slice(1) : p.charAt(0).toUpperCase() + p.slice(1)).join('') : null;
      const goalKey = goalCamel ? 'client.goal' + goalCamel : null;
      const goalLabel = goalKey ? (t(goalKey) || c.goal) : '';
      const lastActive = c.last_active ? fmtRelative(c.last_active) : t('client.lastActive') + ' —';`,
`      /* c107: the old goal groupings are gone (c105 replaced them with
         Спортзал/Друзья/Семья) — the «Гипертрофия» badge no longer renders */
      const lastActive = c.last_active ? fmtRelative(c.last_active) : t('client.lastActive') + ' —';`);

repOnce('goal: client card badge removed',
`\`              \${c.goal ? \`<span class="text-[10px] font-semibold px-1.5 py-0.5 rounded-md \${goalBadgeClass(c.goal)}">\${escapeHTML(goalLabel)}</span>\` : ''}\n              \${groupBadge}\`;`.slice(1, -2),
`\`              \${groupBadge}\`;`.slice(1, -2));

repOnce('goal: profile hero drop',
`      // Bug fix (2026-08 QA #5): strip underscores from goal before building i18n key
      const goalCamel = c.goal ? c.goal.split('_').map((p, i) => i === 0 ? p.charAt(0).toUpperCase() + p.slice(1) : p.charAt(0).toUpperCase() + p.slice(1)).join('') : null;
      const goalKey = goalCamel ? 'client.goal' + goalCamel : null;
      const goalLabel = goalKey ? (t(goalKey) || c.goal) : '';
      const lastActive = c.last_active ? fmtRelative(c.last_active) : '—';`,
`      /* c107: goal badge removed — groupings are Спортзал/Друзья/Семья now */
      const lastActive = c.last_active ? fmtRelative(c.last_active) : '—';`);

repOnce('goal: profile hero badge removed',
`\`                \${c.goal ? \`<span class="text-[11px] font-semibold px-2 py-0.5 rounded-md \${goalBadgeClass(c.goal)}">\${escapeHTML(goalLabel)}</span>\` : ''}\n              </div>\`;`.slice(1, -2),
`\`              </div>\`;`.slice(1, -2));

repOnce('goal: PDF meta line drop',
`      const goalLabel = (client && client.goal) || '';
      const durLabel = program.duration_months ? program.duration_months + ' ' + (t('programs.months') || 'months') : '';
      const metaLine = [goalLabel, durLabel].filter(Boolean).join(' · ');`,
`      /* c107: goal dropped from the exported PDF header (groupings are gone) */
      const durLabel = program.duration_months ? program.duration_months + ' ' + (t('programs.months') || 'months') : '';
      const metaLine = [durLabel].filter(Boolean).join(' · ');`);

repOnce('goal: workout generator row drop',
`\`            <div><span class="text-muted">\${t('generator.goalLabel')}:</span> <span class="font-semibold">\${escapeHTML(client.goal || '—')}</span></div>\n            <div><span class="text-muted">\${t('generator.freqLabel')}:</span> <span class="font-semibold">\${t('generator.perWeek', {n: client.frequency || '—'})}</span></div>\`;`.slice(1, -2),
`\`            <div><span class="text-muted">\${t('generator.freqLabel')}:</span> <span class="font-semibold">\${t('generator.perWeek', {n: client.frequency || '—'})}</span></div>\`;`.slice(1, -2));

repOnce('goal: nutrition generator row drop',
`\`            <div><span class="text-muted">\${t('generator.goalLabel')}:</span> <span class="font-semibold">\${escapeHTML(client.goal || '—')}</span></div>\n            <div><span class="text-muted">\${t('nutrition.bmrLabel')}:</span> <span class="font-semibold">\${bmr} \${t('nutrition.kcalUnit')}</span></div>\`;`.slice(1, -2),
`\`            <div><span class="text-muted">\${t('nutrition.bmrLabel')}:</span> <span class="font-semibold">\${bmr} \${t('nutrition.kcalUnit')}</span></div>\`;`.slice(1, -2));

/* ================= 6. PORTAL (client.html) ================= */
repOnce('portal: superset helpers',
`  function ensureSession(dayIdx){`,
`  /* c107: superset helpers — a group is a maximal run of CONSECUTIVE
     is_superset exercises; ✓ / add / remove / «Сделал всё» sync across it and
     every partner carries the same set count. */
  function psSupGroup(exs, idx) {
    if (!exs || !exs[idx] || exs[idx].is_superset !== true) return [];
    let a = idx; while (a - 1 >= 0 && exs[a - 1] && exs[a - 1].is_superset === true) a--;
    let b = idx; while (b + 1 < exs.length && exs[b + 1] && exs[b + 1].is_superset === true) b++;
    const out = [];
    for (let i = a; i <= b; i++) if (i !== idx) out.push(i);
    return out;
  }
  function psEqualizeSupersets(exs) {
    if (!Array.isArray(exs)) return;
    let i = 0;
    while (i < exs.length) {
      if (exs[i] && exs[i].is_superset === true) {
        let j = i;
        while (j + 1 < exs.length && exs[j + 1] && exs[j + 1].is_superset === true) j++;
        let max = 0;
        for (let k = i; k <= j; k++) max = Math.max(max, (exs[k].sets || []).length);
        for (let k = i; k <= j; k++) {
          const ex = exs[k];
          while (ex.sets.length > 0 && ex.sets.length < max) {
            const last = ex.sets[ex.sets.length - 1];
            ex.sets.push(Object.assign({}, last, { done: false, rpe: null, prev_rpe: null }));
          }
        }
        i = j + 1;
      } else i++;
    }
  }

  function ensureSession(dayIdx){`, 'cl');

repOnce('portal: equalize ensureSession',
`    s.exercises.forEach(ex=>{ if(!ex.sets.length) ex.sets.push({weight:null,reps:null,time:null,dist:null,rpe:null,type:'normal',done:false,prev_weight:null,prev_reps:null,prev_rpe:null,prev_time:null,prev_dist:null}); });
    sessions[dayIdx]=s;`,
`    s.exercises.forEach(ex=>{ if(!ex.sets.length) ex.sets.push({weight:null,reps:null,time:null,dist:null,rpe:null,type:'normal',done:false,prev_weight:null,prev_reps:null,prev_rpe:null,prev_time:null,prev_dist:null}); });
    psEqualizeSupersets(s.exercises); /* c107: partners start with equal set counts */
    sessions[dayIdx]=s;`, 'cl');

repOnce('portal: equalize startOrResumeDay',
`      sess = buildSession(idx, true);
      if (!sess) return;
      sessions[idx]=sess;`,
`      sess = buildSession(idx, true);
      if (!sess) return;
      psEqualizeSupersets(sess.exercises); /* c107: partners start with equal set counts */
      sessions[idx]=sess;`, 'cl');

repOnce('portal: toggle sync',
`        set.done = !set.done;
        if (set.done) {
          // copy current values into next set's prev (CRM parity)
          const next = ex.sets[si+1];`,
`        set.done = !set.done;
        /* c107: superset sync — the ✓ lands on the SAME set of every partner */
        psSupGroup(sess0.exercises, ei).forEach(p => {
          const pEx = sess0.exercises[p];
          const pSet = pEx && pEx.sets[si];
          if (!pSet || pSet.done === set.done) return;
          pSet.done = set.done;
          const pRow = document.querySelector(\`[data-exercise-card="\${p}"] .set-row[data-si="\${si}"]\`);
          if (pRow) pRow.classList.toggle('set-row-done', pSet.done);
          updateMiniProgress(p);
          if (pSet.done) {
            /* chain the partner's next-set prev too (CRM parity) */
            const pNext = pEx.sets[si+1];
            if (pNext) {
              pNext.prev_weight = pSet.weight != null ? pSet.weight : pNext.prev_weight;
              pNext.prev_reps = pSet.reps != null ? pSet.reps : pNext.prev_reps;
              pNext.prev_rpe = pSet.rpe != null ? pSet.rpe : pNext.prev_rpe;
              const pExD = ((dayInfo(activeDayIndex)||{}).exercises||[])[p] || {};
              const pExDataC = getExData(pExD);
              const pCardio = (pExD.cardio === true) || !!(pExDataC && pExDataC.category === 'cardio');
              const pStretch = !!((pExDataC && (pExDataC.category === 'stretching' || pExDataC.group === 'stretching')) || (pExDataC && pExDataC.group === 'warmup'));
              if (pCardio || pStretch) pNext.prev_time = pSet.time != null ? pSet.time : pNext.prev_time;
              if (pCardio) pNext.prev_dist = pSet.dist != null ? pSet.dist : pNext.prev_dist;
              const pRow2 = document.querySelector(\`[data-exercise-card="\${p}"] .set-row[data-si="\${si+1}"] [data-prev-cell]\`);
              if (pRow2) {
                const ptxt = pCardio
                  ? \`\${pSet.time!=null?pSet.time:'—'}×\${pSet.dist!=null?pSet.dist:'—'}\`
                  : pStretch
                  ? \`\${pSet.time!=null?pSet.time:'—'}×\${pSet.weight!=null?pSet.weight:'—'}×\${pSet.reps!=null?pSet.reps:'—'}\`
                  : \`\${pSet.weight!=null?pSet.weight:'—'}×\${pSet.reps!=null?pSet.reps:'—'}\`;
                pRow2.innerHTML = esc(ptxt) + (pSet.rpe != null ? \`<span class="prev-rpe" style="background:\${RPE_COLORS[pSet.rpe-1]||'#666'}" title="RPE \${pSet.rpe}">\${pSet.rpe}</span>\` : '');
              }
            }
          }
        });
        if (set.done) {
          // copy current values into next set's prev (CRM parity)
          const next = ex.sets[si+1];`, 'cl');

repOnce('portal: add-set sync',
`        ensureStarted(sess0); saveDraft(); renderExercises();
        const rows = document.querySelectorAll(\`[data-exercise-card="\${ei}"] .set-row\`);`,
`        /* c107: superset sync — the new set lands on every partner too */
        psSupGroup(sess0.exercises, ei).forEach(p => {
          const pEx = sess0.exercises[p];
          if (pEx) pEx.sets.push(Object.assign({}, ex.sets[ex.sets.length - 1]));
        });
        ensureStarted(sess0); saveDraft(); renderExercises();
        const rows = document.querySelectorAll(\`[data-exercise-card="\${ei}"] .set-row\`);`, 'cl');

repOnce('portal: done-all sync',
`        (ex.sets||[]).forEach(s => { s.done = true; });
        ensureStarted(sess0); saveDraft(); renderExercises();
        startRest(ex.rest_sec || 90);`,
`        (ex.sets||[]).forEach(s => { s.done = true; });
        /* c107: «Сделал всё» lands on the superset partners too */
        psSupGroup(sess0.exercises, ei).forEach(p => {
          const pEx = sess0.exercises[p];
          if (pEx) (pEx.sets||[]).forEach(s => { s.done = true; });
        });
        ensureStarted(sess0); saveDraft(); renderExercises();
        startRest(ex.rest_sec || 90);`, 'cl');

repOnce('portal: remove-set sync',
`        if (!ex || si === 0 || ex.sets.length <= 1) return;
        ex.sets.splice(si, 1);
        saveDraft(); renderExercises();`,
`        if (!ex || si === 0 || ex.sets.length <= 1) return;
        ex.sets.splice(si, 1);
        /* c107: superset sync — partners keep the same set count */
        psSupGroup(sess0.exercises, ei).forEach(p => {
          const pEx = sess0.exercises[p];
          if (pEx && pEx.sets.length > 1 && pEx.sets[si]) pEx.sets.splice(si, 1);
        });
        saveDraft(); renderExercises();`, 'cl');

repOnce('portal: header goal drop',
`    document.getElementById('hdr-goal').textContent = (currentClient.goal||'') + ' • David King Gym';`,
`    document.getElementById('hdr-goal').textContent = 'David King Gym'; /* c107: goal groupings are gone */`, 'cl');

/* ================= WRITE BACK ================= */
if (fails.length) {
  console.error('\n✗ PATCH FAILED — ' + fails.length + ' problem(s):');
  fails.forEach(f => console.error('  ' + f));
  process.exit(1);
}
fs.writeFileSync(FILE, html);
fs.writeFileSync(CLIENT, cl);
fs.writeFileSync(SW, sw);
console.log(`\n✓ fix-c107 applied: ${patched} replacements`);
