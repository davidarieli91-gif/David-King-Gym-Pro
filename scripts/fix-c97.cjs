#!/usr/bin/env node
/* c97 — portal UX polish: instant i18n for the recovery map + the unit and
 * «Техника» controls become REAL buttons (no more accidental exercise card).
 *
 * User report (2026-09-16, after c96 went live):
 *  1. «кнопка восстановления внутри портала — язык переводится не сразу,
 *     некоторые части сразу, некоторые не сразу» — the recovery card title +
 *     subtitle re-translated on a language switch (updateLabels), but the 10
 *     dynamic slot rows kept the previous language until the tab was left and
 *     re-opened (renderAll never called renderRecovery).
 *  2. «нажимаешь на килограммы или фунты на кнопку изменения веса — снова
 *     открывается карточка упражнения» — the c96 per-exercise weight-unit
 *     header was a plain <span data-wunit-col-ex>; the c87 bubbling guard
 *     only listed [data-wunit-col] etc., so the tap ALSO reached the card
 *     handler and opened the whole exercise modal (the unit sheet appeared
 *     only behind it / after close). Fix: real <button> + guard entry, in
 *     BOTH the portal and the trainer live workout («в live режиме пусть
 *     она будет как кнопочка чтобы видно было очертание кнопки»).
 *  3. «нажимаешь на кнопочку техника — сначала открывается вся карточка и
 *     при закрытии уже эта техника развернута» — «Техника» was a
 *     <details><summary> inside the card; a summary is neither input nor
 *     button, so its tap opened the exercise modal and the technique only
 *     expanded after the modal was closed. Fix: a real expand/collapse
 *     button that toggles the technique body in place and never opens the
 *     exercise card.
 *
 * Also: cardio time/distance headers get the same button look (same sheet
 * interaction), per-exercise header tooltips say which exercise they belong
 * to (wunitExTitle), and versions bump to c97 / RUNNING=97 / sw dk-gym-v124.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

let fails = 0;
function rep(file, from, to, label) {
  const p = path.join(ROOT, file);
  let s = fs.readFileSync(p, 'utf8');
  const n = s.split(from).length - 1;
  if (n !== 1) {
    if (n === 0 && s.split(to).length - 1 >= 1) { console.log(`skip  ${label || file} (already applied)`); return; }
    console.error(`FAIL [${label || file}]: expected 1 occurrence, found ${n}`);
    fails++;
    return;
  }
  s = s.replace(from, to);
  fs.writeFileSync(p, s);
  console.log(`ok  ${label || file}`);
}

/* ------------------------------------------------------------------ *
 * FIX 1 — recovery map re-translates IMMEDIATELY on language switch
 * ------------------------------------------------------------------ */
rep('client.html',
  `    updateLabels(); renderAll();
    try { if (window.dkPortalSync) window.dkPortalSync(); } catch(e) {}`,
  `    updateLabels(); renderAll();
    try { renderRecovery(); } catch(e) {} /* c97: the 10 slot rows are dynamic — re-render them in the new language RIGHT NOW (updateLabels only re-translated the static title/subtitle, the rows kept the old language until the tab was re-opened) */
    try { if (window.dkPortalSync) window.dkPortalSync(); } catch(e) {}`,
  'fix1: setLang -> renderRecovery');

/* ------------------------------------------------------------------ *
 * FIX 2a — card-open guard learns the c96 per-exercise header + tech btn
 * ------------------------------------------------------------------ */
rep('client.html',
  `        if(e.target.closest('[data-wunit-col],[data-wunit-chip],[data-tunit-col],[data-dunit-col]')) return;`,
  `        /* c97: the c96 PER-EXERCISE unit header (data-wunit-col-ex) and the
         * «Техника» toggle are standalone controls too — tapping them must
         * never open the exercise card (the span/summary used to bubble). */
        if(e.target.closest('[data-wunit-col],[data-wunit-chip],[data-wunit-col-ex],[data-tunit-col],[data-dunit-col],[data-tech-toggle]')) return;`,
  'fix2a: card-open guard += wunit-col-ex/tech-toggle');

/* ------------------------------------------------------------------ *
 * FIX 2b — portal: per-exercise weight-unit header span -> real button
 * ------------------------------------------------------------------ */
rep('client.html',
  "`<span class=\"text-center cursor-pointer\" data-wunit-col-ex=\"${ei}\" data-wunit-base=\"${esc(t('weightLabel'))}\" title=\"${esc(t('wunitExTitle') || 'Weight unit')}\">${esc(t('weightLabel'))}${exUnitShort ? ' · ' + esc(exUnitShort) : ''}</span>",
  "`<button type=\"button\" class=\"w-full text-center text-[9px] font-bold uppercase tracking-wide rounded-lg border border-border bg-surface-2 text-muted py-1 px-0.5 leading-tight cursor-pointer transition\" data-wunit-col-ex=\"${ei}\" data-wunit-base=\"${esc(t('weightLabel'))}\" title=\"${esc(t('wunitExTitle') || 'Weight unit')}\">${esc(t('weightLabel'))}${exUnitShort ? ' · ' + esc(exUnitShort) : ''}</button>",
  'fix2b: portal weight-unit header -> button');

/* ------------------------------------------------------------------ *
 * FIX 2c — portal: cardio time/distance headers -> real buttons
 * ------------------------------------------------------------------ */
rep('client.html',
  "`<span class=\"text-center\" data-tunit-col data-tunit-base=\"${esc(t('timeLabel'))}\">${esc(t('timeLabel'))}</span><span></span><span class=\"text-center\" data-dunit-col data-dunit-base=\"${esc(t('distShortLabel'))}\">${esc(t('distShortLabel'))}</span>`",
  "`<button type=\"button\" class=\"w-full text-center text-[9px] font-bold uppercase tracking-wide rounded-lg border border-border bg-surface-2 text-muted py-1 px-0.5 leading-tight cursor-pointer transition\" data-tunit-col data-tunit-base=\"${esc(t('timeLabel'))}\">${esc(t('timeLabel'))}</button><span></span><button type=\"button\" class=\"w-full text-center text-[9px] font-bold uppercase tracking-wide rounded-lg border border-border bg-surface-2 text-muted py-1 px-0.5 leading-tight cursor-pointer transition\" data-dunit-col data-dunit-base=\"${esc(t('distShortLabel'))}\">${esc(t('distShortLabel'))}</button>`",
  'fix2c: portal cardio time/dist headers -> buttons');

/* ------------------------------------------------------------------ *
 * FIX 2d — portal CSS: button-ish hover (color + border) for all headers
 * ------------------------------------------------------------------ */
rep('client.html',
  `    [data-wunit-col] { cursor: pointer; transition: color .15s ease; }
    [data-wunit-col]:hover { color: rgb(var(--c-accent)); }`,
  `    /* c97: these headers are real buttons now — accent on hover, accent-ish border */
    [data-wunit-col], [data-wunit-col-ex], [data-tunit-col], [data-dunit-col] { cursor: pointer; transition: color .15s ease, border-color .15s ease; }
    [data-wunit-col]:hover, [data-wunit-col-ex]:hover, [data-tunit-col]:hover, [data-dunit-col]:hover { color: rgb(var(--c-accent)); border-color: rgb(var(--c-accent) / .55); }`,
  'fix2d: portal header hover CSS');

/* ------------------------------------------------------------------ *
 * FIX 2e — portal wApply: per-exercise tooltip says WHICH exercise
 * ------------------------------------------------------------------ */
rep('client.html',
  `        try { if (window.dkPortalExUnit) eu = window.dkPortalExUnit(idx); } catch (e) {}
        var esh = wShort(eu);
        el.textContent = (base && base.toLowerCase() !== esh.toLowerCase()) ? base + ' · ' + esh : base;
        el.title = wTitle;`,
  `        try { if (window.dkPortalExUnit) eu = window.dkPortalExUnit(idx); } catch (e) {}
        var esh = wShort(eu);
        el.textContent = (base && base.toLowerCase() !== esh.toLowerCase()) ? base + ' · ' + esh : base;
        el.title = T('wunitExTitle') || wTitle; /* c97: «unit of THIS exercise», not the generic title */`,
  'fix2e: portal per-ex tooltip');

/* ------------------------------------------------------------------ *
 * FIX 3a — portal: «Техника» details/summary -> real toggle button
 * ------------------------------------------------------------------ */
rep('client.html',
  "      const techniqueHtml = technique ? `<details class=\"group\"><summary class=\"text-[11px] font-semibold text-indigo-300 cursor-pointer select-none flex items-center gap-1\">\n          <svg class=\"w-3 h-3 transition-transform group-open:rotate-90\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><polyline points=\"9 18 15 12 9 6\"/></svg>\n          ${esc(t('technique'))}</summary>\n          <div class=\"mt-1.5 space-y-1 pl-1\">${technique.split(' | ').map(st=>`<p class=\"text-[11px] text-muted leading-relaxed\">• ${esc(st.trim())}</p>`).join('')}</div></details>` : '';",
  "      /* c97: «Техника» is now a REAL button — it expands the technique right\n         here and never opens the whole exercise card (it used to be a\n         <details><summary>, whose tap bubbled to the card handler: the card\n         modal opened first and the technique only appeared after close). */\n      const techniqueHtml = technique ? `<div>\n          <button type=\"button\" data-tech-toggle=\"${ei}\" aria-expanded=\"false\" class=\"inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/25 transition select-none cursor-pointer\">\n          <svg data-tech-chevron=\"${ei}\" class=\"w-3 h-3 transition-transform\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><polyline points=\"9 18 15 12 9 6\"/></svg>\n          ${esc(t('technique'))}</button>\n          <div class=\"hidden mt-1.5 space-y-1 pl-1\" data-tech-body=\"${ei}\">${technique.split(' | ').map(st=>`<p class=\"text-[11px] text-muted leading-relaxed\">• ${esc(st.trim())}</p>`).join('')}</div></div>` : '';",
  'fix3a: technique details -> button + hidden body');

/* ------------------------------------------------------------------ *
 * FIX 3b — portal: toggle handler in wireExerciseEvents
 * ------------------------------------------------------------------ */
rep('client.html',
  `        ex.rest_sec = (v && v >= 5) ? v : 90;
        inp.value = ex.rest_sec;
        ensureStarted(sess0); saveDraft();
      });
    });
  }`,
  `        ex.rest_sec = (v && v >= 5) ? v : 90;
        inp.value = ex.rest_sec;
        ensureStarted(sess0); saveDraft();
      });
    });

    // c97: «Техника» toggle — expand/collapse WITHOUT opening the exercise card
    list.querySelectorAll('[data-tech-toggle]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const ei = +btn.dataset.techToggle;
        const card = btn.closest('[data-exercise-card]');
        const body = card && card.querySelector('[data-tech-body="' + ei + '"]');
        if (!body) return;
        const open = !body.classList.toggle('hidden');
        const chev = card.querySelector('[data-tech-chevron="' + ei + '"]');
        if (chev) chev.style.transform = open ? 'rotate(90deg)' : '';
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
  }`,
  'fix3b: technique toggle handler');

/* ------------------------------------------------------------------ *
 * FIX 4 — trainer live workout: unit headers -> real buttons («в live
 * режиме пусть она будет как кнопочка чтобы видно было очертание кнопки»)
 * ------------------------------------------------------------------ */
rep('fitness-crm.html',
  "`<th class=\"px-2 py-2 text-center\" data-tunit-col data-tunit-base=\"${t('workouts.time')}\">${t('workouts.time')} · ${dkTUnitShort()}</th>",
  "`<th class=\"px-1 py-2 text-center\"><button type=\"button\" class=\"w-full px-1 py-1 rounded-lg border border-border bg-surface-2 text-[10px] uppercase tracking-wider font-bold text-muted leading-tight cursor-pointer transition\" data-tunit-col data-tunit-base=\"${t('workouts.time')}\">${t('workouts.time')} · ${dkTUnitShort()}</button></th>",
  'fix4a: CRM cardio time header -> button');
rep('fitness-crm.html',
  "<th class=\"px-2 py-2 text-center\" data-dunit-col data-dunit-base=\"${t('workouts.dist')}\">${t('workouts.dist')} · ${dkDUnitShort()}</th>",
  "<th class=\"px-1 py-2 text-center\"><button type=\"button\" class=\"w-full px-1 py-1 rounded-lg border border-border bg-surface-2 text-[10px] uppercase tracking-wider font-bold text-muted leading-tight cursor-pointer transition\" data-dunit-col data-dunit-base=\"${t('workouts.dist')}\">${t('workouts.dist')} · ${dkDUnitShort()}</button></th>",
  'fix4b: CRM cardio dist header -> button');
rep('fitness-crm.html',
  "`<th class=\"px-2 py-2 text-center\" data-wunit-col-ex=\"${idx}\" data-wunit-base=\"${t('workouts.weight')}\" title=\"${t('wunit.title') || 'Weight unit'}\">${t('workouts.weight')} · ${dkWUnitShort(exUnit)}</th>",
  "`<th class=\"px-1 py-2 text-center\"><button type=\"button\" class=\"w-full px-1 py-1 rounded-lg border border-border bg-surface-2 text-[10px] uppercase tracking-wider font-bold text-muted leading-tight cursor-pointer transition\" data-wunit-col-ex=\"${idx}\" data-wunit-base=\"${t('workouts.weight')}\" title=\"${t('wunit.title') || 'Weight unit'}\">${t('workouts.weight')} · ${dkWUnitShort(exUnit)}</button></th>",
  'fix4c: CRM per-exercise weight header -> button');

/* ------------------------------------------------------------------ *
 * FIX 5 — CRM CSS hover + per-exercise tooltip
 * ------------------------------------------------------------------ */
rep('fitness-crm.html',
  `/* c86: the weight column header is a top label — it opens the unit picker too */
[data-wunit-col] { cursor: pointer; transition: color .15s ease; }
[data-wunit-col]:hover { color: rgb(var(--c-accent)); }
/* c96: per-exercise weight column header = unit toggle for THAT exercise */
[data-wunit-col-ex] { cursor: pointer; transition: color .15s ease; }
[data-wunit-col-ex]:hover { color: rgb(var(--c-accent)); }`,
  `/* c86/c97: the unit column headers are REAL buttons now — accent on hover, accent-ish border */
[data-wunit-col], [data-wunit-col-ex], [data-tunit-col], [data-dunit-col] { cursor: pointer; transition: color .15s ease, border-color .15s ease; }
[data-wunit-col]:hover, [data-wunit-col-ex]:hover, [data-tunit-col]:hover, [data-dunit-col]:hover { color: rgb(var(--c-accent)); border-color: rgb(var(--c-accent) / .55); }`,
  'fix5a: CRM header hover CSS');
rep('fitness-crm.html',
  `      var esh = dkWUnitShort(eu);
      el.textContent = (base && base.toLowerCase() !== esh.toLowerCase()) ? base + ' · ' + esh : base;
      el.title = wTitle;`,
  `      var esh = dkWUnitShort(eu);
      el.textContent = (base && base.toLowerCase() !== esh.toLowerCase()) ? base + ' · ' + esh : base;
      el.title = t('wunit.exTitle') || wTitle; /* c97: «unit of THIS exercise» */`,
  'fix5b: CRM per-ex tooltip');

/* ------------------------------------------------------------------ *
 * VERSIONS — c96 -> c97 / RUNNING 96 -> 97 / sw dk-gym-v123 -> v124
 * ------------------------------------------------------------------ */
rep('fitness-crm.html',
  `<meta name="dk-build" content="c96" />`,
  `<meta name="dk-build" content="c97" />`,
  'version: meta c97');
rep('fitness-crm.html',
  `  var RUNNING = 96; /* numeric part of dk-build c96 */`,
  `  var RUNNING = 97; /* numeric part of dk-build c97 */`,
  'version: RUNNING=97');
rep('fitness-crm.html',
  `v<span id="login-version">—</span> · IndexedDB · 3 languages · c96`,
  `v<span id="login-version">—</span> · IndexedDB · 3 languages · c97`,
  'version: login tag c97');
rep('sw.js',
  `const CACHE_NAME = 'dk-gym-v123'; // c96`,
  `// v124: c97 — portal UX polish: (1) the recovery map re-translates INSTANTLY on a language switch (setLang now re-renders the 10 slot rows — before, only the static title/subtitle changed and the rows kept the old language until the tab was re-opened); (2) the per-exercise weight-unit header (кг/фт) and the cardio time/distance headers became REAL buttons with a visible outline in BOTH apps — tapping them opens only the unit sheet, never the whole exercise card anymore (the c96 header was a plain span whose tap bubbled to the card-open handler); (3) «Техника» became a real expand/collapse button that shows the technique in place — it used to be a <details><summary> whose tap opened the exercise card first, with the technique expanding only after the card was closed; (4) per-exercise unit header tooltips now say «unit of THIS exercise».
const CACHE_NAME = 'dk-gym-v124'; // c97`,
  'version: sw v124');

/* ------------------------------------------------------------------ */
if (fails) { console.error(`\n${fails} patch(es) FAILED`); process.exit(1); }
console.log('\nAll c97 patches applied.');
