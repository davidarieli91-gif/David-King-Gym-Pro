/* c133 unit test — accessibility + i18n sweep (portal).
   Static analysis of the REAL files: localized accessible names, ARIA state
   that survives interactions, dialog semantics + focus handling, RTL-safe
   calendar, engine ariaLabel support. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'client.html'), 'utf8');
const engine = fs.readFileSync(path.join(root, 'src', 'analytics-engine.js'), 'utf8');
const rec = fs.readFileSync(path.join(root, 'src', 'recovery-engine.js'), 'utf8');
const trainer = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }
function count(s, needle) { return s.split(needle).length - 1; }

/* ---------- 1. new i18n keys exist in RU/EN/HE ---------- */
['setNormal', 'supersetLabel', 'timeToggle', 'a11yDoneSet', 'a11yRemoveSet', 'a11yFontDec', 'a11yFontInc',
 'a11yTheme', 'a11yThemeMenu', 'a11ySettings', 'a11yWaterPlus', 'a11yWaterMinus', 'a11yRestMinus',
 'a11yRestPlus', 'a11yRestSkip', 'a11yRemoveDiary', 'a11yCloseViewer'].forEach(function (k) {
  ok('i18n ×3: ' + k, count(html, k + ":'") === 3);
});

/* ---------- 2. icon-only controls get localized names via updateLabels ---------- */
const names = ['font-dec-btn', 'font-inc-btn', 'theme-toggle', 'theme-menu', 'portal-settings-btn',
  'btn-water-plus', 'btn-water-minus', 'btn-timer-minus15', 'btn-timer-plus30', 'btn-timer-skip', 'viewer-close'];
ok('updateLabels wires every icon-only control', names.every(n => html.indexOf("['" + n + "'") >= 0));
ok('settings button also gets a localized title', html.indexOf("el.setAttribute('title', t(pair[1]))") >= 0);

/* ---------- 3. set-row semantics (render + live handlers) ---------- */
ok('RPE buttons render aria-pressed', /data-v="\$\{v\}"[^>]*aria-pressed="\$\{s\.rpe === v \? 'true' : 'false'\}"/.test(html));
ok('RPE click handler keeps aria-pressed in sync', html.indexOf("b.setAttribute('aria-pressed', on ? 'true' : 'false')") >= 0);
ok('done toggle renders aria-pressed + label', html.indexOf("aria-pressed=\"${done ? 'true' : 'false'}\" title=\"${esc(t('a11yDoneSet'))}\"") >= 0);
ok('done toggle click updates aria-pressed', html.indexOf("btn.setAttribute('aria-pressed', set.done ? 'true' : 'false')") >= 0);
ok('remove-set has an accessible name', /data-remove-set[^>]*aria-label="\$\{esc\(t\('a11yRemoveSet'\)\)\}"/.test(html));
ok('type cycler title shows the current type', html.indexOf("title=\"${esc(t(TYPE_I18N[s.type] || 'setNormal'))}\"") >= 0);
ok('type cycler updates its name on click', html.indexOf("btn.setAttribute('aria-label', _tt133)") >= 0);
ok('min⇄sec toggle localized', html.indexOf("data-tunit-col-ex=\"${ei}\" title=\"${esc(t('timeToggle'))}\"") >= 0);
ok('superset ⚡ title localized', html.indexOf("esc(t('supersetLabel')) + '\">⚡ </span>'") >= 0);
ok('diary ✕ has an accessible name', html.indexOf("data-diary-del=\"${i}\" aria-label=\"${esc(t('a11yRemoveDiary'))}\"") >= 0);

/* ---------- 4. dialogs: names, focus, Escape ---------- */
ok('unlock overlay is a named dialog', html.indexOf('id="unlock-screen" class="hidden fixed inset-0 z-[100] bg-black/90 backdrop-blur-lg flex items-center justify-center p-4" role="dialog" aria-modal="true"') >= 0);
ok('showUnlock sets aria-label', html.indexOf("_us133.setAttribute('aria-label', t('unlockTitle'))") >= 0);
ok('report modal gets aria-label on open', html.indexOf("_rm133.setAttribute('aria-label', t('reportTitle'))") >= 0);
ok('report focuses its Save button on open', html.indexOf("document.getElementById('report-save').focus({ preventScroll: true })") >= 0);
ok('report remembers + restores focus', html.indexOf('_reportPrevFocus133 = (document.activeElement') >= 0 &&
  html.indexOf('_reportPrevFocus133.focus({ preventScroll: true })') >= 0);
ok('Escape closes the report too', html.indexOf("closeViewer(); closeExerciseModal(); closeReportModal();") >= 0);

/* ---------- 5. RTL-safe timeline + honest recent label ---------- */
ok('calendar grid forced direction:ltr (chronological in RTL)', html.indexOf('class="grid grid-cols-7 gap-1" style="direction:ltr"') >= 0);
ok('renderARecent: stray «·reps» removed', html.indexOf('·reps ·') === -1);
ok('renderARecent: uses localized sets/minutes', html.indexOf("${done}/${tot} ${esc(t('aSetsWord'))} · ${mins} ${esc(t('aMinutes'))}") >= 0);

/* ---------- 6. settings sheet labels ---------- */
ok('settings close gets aria-label in fillLabels', html.indexOf("document.querySelector('#portal-settings-sheet [data-cps-close]')") >= 0 &&
  html.indexOf("cpsX.setAttribute('aria-label', T('a11yClose'))") >= 0);
ok('shade palette group gets aria-label', html.indexOf("pc.setAttribute('aria-label', T('ptexColor'))") >= 0);

/* ---------- 7. engines ---------- */
ok('analytics engine version c133', engine.indexOf("version: 'c133'") >= 0);
ok('sparkBars honors opts.ariaLabel', engine.indexOf("(opts.ariaLabel ? ' aria-label=\"' + escTxt(opts.ariaLabel)") >= 0);
ok('both builders support ariaLabel', count(engine, 'aria-label="\x27 + escTxt(opts.ariaLabel)') === 2 || count(engine, "aria-label=\"' + escTxt(opts.ariaLabel)") === 2);
ok('recovery sparkline LTR', rec.indexOf('style="display:block;direction:ltr"') >= 0);
ok('portal passes chart labels', html.indexOf("ariaLabel: t('aTrendT')") >= 0 && html.indexOf("ariaLabel: t('aProgressT')") >= 0);

/* ---------- 8. versions ---------- */
ok('sw cache at least v160', (function () { const m = fs.readFileSync(path.join(root, 'sw.js'), 'utf8').match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 160; })());
ok('RUNNING / dk-build at least c133', (function () {
  const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
  return !!r && !!b && Number(r[1]) >= 133 && Number(b[1]) >= 133;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
