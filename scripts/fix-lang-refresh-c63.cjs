#!/usr/bin/env node
/* c63 (v2): live language refresh for JS-built open modals
 * Problem: switchAppLanguage re-renders screens + exercise picker, but modals whose
 * bodies are built by JS (program-day preview, exercise card, program builder) keep
 * the old language until closed and reopened — exercise names/groups carry no
 * data-i18n, so applyI18n cannot reach them (user screenshot: day preview in RU
 * while app switched to HE).
 * Scope reality (why v1 failed): openProgramDayPreview / openExerciseModal /
 * renderBuilder live INSIDE module IIFEs (main block is 'use strict'), so they are
 * NOT reachable as globals from the i18n section. Fix = each function registers a
 * closure callback on window when it runs; the i18n section calls the callbacks.
 *   openProgramDayPreview → window.__refreshDayPreview
 *   openExerciseModal     → window.__refreshExModal (skipped in EDIT mode)
 *   renderBuilder         → window.__refreshBuilder
 * Plus: subtitle hardcode "N exercises" → t('exercise.exercises')
 * Version bump: c62→c63, RUNNING 62→63, footer, sw dk-gym-v89→v90
 * (exercise-db.json untouched: seed v95 / BUST v51 stay)
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

let html = fs.readFileSync(path.join(ROOT, 'fitness-crm.html'), 'utf8');
const results = [];
function rep(name, from, to) {
  const i = html.indexOf(from);
  if (i === -1) { results.push([name, 'FAIL:notfound']); return; }
  if (html.indexOf(from, i + 1) !== -1) { results.push([name, 'FAIL:ambiguous']); return; }
  html = html.slice(0, i) + to + html.slice(i + from.length);
  results.push([name, 'OK']);
}

// ---- 1) top-level refresh helpers before switchAppLanguage (i18n section)
rep('helpers before switchAppLanguage',
  `  /** Central language switch: persist + translate static strings + instantly`,
  `  /* ===== c63: refresh open dynamic modals whose bodies are JS-built.
     Exercise names/groups/muscle labels have no data-i18n attributes, so
     applyI18n() cannot reach them — after a language switch these modals must
     be rebuilt. The builder functions live inside module IIFEs ('use strict'),
     so they are not global: each registers a closure callback on window when
     it runs, and these helpers invoke it only while its modal is visible. ===== */
  function refreshProgramDayPreview() {
    try {
      const m = document.getElementById('program-day-preview-modal');
      if (!m || m.classList.contains('hidden')) return false;
      if (typeof window.__refreshDayPreview === 'function') { window.__refreshDayPreview(); return true; }
    } catch (_) {}
    return false;
  }
  function refreshExerciseModalForLang() {
    try {
      const m = document.getElementById('exercise-modal');
      if (!m || m.classList.contains('hidden')) return false;
      const formEl = document.getElementById('exercise-form');
      if (formEl && !formEl.classList.contains('hidden')) return false; /* user editing — don't clobber unsaved input */
      if (typeof window.__refreshExModal === 'function') { window.__refreshExModal(); return true; }
    } catch (_) {}
    return false;
  }
  function refreshProgramBuilderForLang() {
    try {
      const m = document.getElementById('program-builder-modal');
      if (!m || m.classList.contains('hidden')) return false;
      if (typeof window.__refreshBuilder === 'function') { window.__refreshBuilder(); return true; }
    } catch (_) {}
    return false;
  }

  /** Central language switch: persist + translate static strings + instantly`
);

// ---- 2) switchAppLanguage invokes the refresh helpers
rep('switchAppLanguage calls',
  `      if (typeof bodyMapPicker !== 'undefined' && bodyMapPicker.refresh) bodyMapPicker.refresh();
      applyI18n(currentLang());`,
  `      if (typeof bodyMapPicker !== 'undefined' && bodyMapPicker.refresh) bodyMapPicker.refresh();
      /* c63: rebuild open dynamic modals so exercise names follow the new language */
      refreshProgramDayPreview();
      refreshExerciseModalForLang();
      refreshProgramBuilderForLang();
      applyI18n(currentLang());`
);

// ---- 3) day preview registers its refresh closure
rep('preview registers closure',
  `function openProgramDayPreview(programId, dayIdx) {
      db.get('client_programs', programId).then(prog => {`,
  `function openProgramDayPreview(programId, dayIdx) {
      window.__refreshDayPreview = function () { openProgramDayPreview(programId, dayIdx); }; /* c63: live lang refresh */
      db.get('client_programs', programId).then(prog => {`
);

// ---- 4) subtitle: drop hardcoded ' exercises'
rep('subtitle i18n',
  `if (subtitleEl) subtitleEl.textContent = prog.name + ' · ' + (day.exercises || []).length + ' exercises';`,
  `if (subtitleEl) subtitleEl.textContent = prog.name + ' · ' + (day.exercises || []).length + ' ' + t('exercise.exercises');`
);

// ---- 5) exercise modal registers its refresh closure
rep('exercise modal registers closure',
  `openExerciseModal(exerciseId) {
    if (!exerciseId) return;`,
  `openExerciseModal(exerciseId) {
    window.__refreshExModal = function () { openExerciseModal(exerciseId); }; /* c63: live lang refresh */
    if (!exerciseId) return;`
);

// ---- 6) builder registers its refresh closure
rep('builder registers closure',
  `function renderBuilder() {
      const freqHint = document.getElementById('pb-freq-hint');`,
  `function renderBuilder() {
      window.__refreshBuilder = function () { renderBuilder(); }; /* c63: live lang refresh */
      const freqHint = document.getElementById('pb-freq-hint');`
);

// ---- 7) version bumps
rep('meta c63', '<meta name="dk-build" content="c62" />', '<meta name="dk-build" content="c63" />');
rep('RUNNING 63', 'var RUNNING = 62; /* numeric part of dk-build c62 */', 'var RUNNING = 63; /* numeric part of dk-build c63 */');
rep('footer c63', '3 languages · c62', '3 languages · c63');

fs.writeFileSync(path.join(ROOT, 'fitness-crm.html'), html);

// ---- sw.js
let sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
if (sw.includes("const CACHE_NAME = 'dk-gym-v89';")) {
  sw = sw.replace(/const CACHE_NAME = 'dk-gym-v89';[^\n]*/, "const CACHE_NAME = 'dk-gym-v90'; // v90: c63 live language refresh for open dynamic modals (day preview, exercise card, builder)");
  results.push(['sw v90', 'OK']);
} else results.push(['sw v90', 'FAIL']);
fs.writeFileSync(path.join(ROOT, 'sw.js'), sw);

results.forEach(([n, r]) => console.log(r.padEnd(14), n));
if (results.some(([, r]) => r.startsWith('FAIL'))) process.exit(1);
console.log('c63 patch v2 done');
