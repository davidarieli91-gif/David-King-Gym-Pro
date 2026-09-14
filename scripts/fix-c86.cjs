#!/usr/bin/env node
/* =============================================================================
 * fix-c86.cjs — c86 (user feedback on c85)
 * (1) TEXTURES (client.html): remove the c85 «portal compat» layer that painted
 *     the texture directly onto .glass / .glass-strong panels — that made every
 *     panel busy and everything visually merge. From now on panels stay CLEAN:
 *     the texture lives on the background (#dk-tex-overlay) and shows through
 *     the translucent glass — exactly how the trainer app renders it.
 * (2) WEIGHT UNITS (both apps): the picker is NO LONGER opened by tapping a
 *     weight input — editing a weight value must never open a dialog. The unit
 *     is changed ONLY from the top labels: the header chip AND the weight
 *     column header (both now carry a localized title + pointer cursor).
 * Versions: meta c86, RUNNING=86, footer c86, sw dk-gym-v113.
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

console.log('=== fix-c86.cjs ===');

/* ============================ 1. fitness-crm.html ========================= */
let crm = read('fitness-crm.html');

/* 1a. versions */
crm = repOnce(crm, '<meta name="dk-build" content="c85" />', '<meta name="dk-build" content="c86" />', 'crm.meta');
crm = repOnce(crm, 'var RUNNING = 85; /* numeric part of dk-build c85 */', 'var RUNNING = 86; /* numeric part of dk-build c86 */', 'crm.RUNNING');
crm = repOnce(crm, '· IndexedDB · 3 languages · c85', '· IndexedDB · 3 languages · c86', 'crm.footer');

/* 1b. module comment — the trigger model changed */
crm = repOnce(crm,
`  /* ===== c85: weight unit (kg⇄lb) for live workouts — tap any weight input
     or the header chip to pick the unit; the choice is shown AT THE TOP of the
     live screen and next to the weight column of every exercise table. ===== */`,
`  /* ===== c86: weight unit (kg⇄lb) for live workouts — the unit is changed ONLY
     from the top labels (header chip / weight column header); weight inputs stay
     plain numeric fields. The choice is shown AT THE TOP of the live screen and
     next to the weight column of every exercise table. ===== */`,
  'crm.wunit-comment');

/* 1c. dkWUnitApply — also set the localized tooltip on the top labels */
crm = repOnce(crm,
`  function dkWUnitApply() {
    var u = dkWUnitGet(), sh = dkWUnitShort(u);
    document.querySelectorAll('[data-wunit-chip]').forEach(function (ch) { ch.textContent = dkWUnitLabel(u); });
    document.querySelectorAll('[data-wunit-col]').forEach(function (el) {
      var base = el.getAttribute('data-wunit-base') || '';
      el.textContent = (base && base.toLowerCase() !== sh.toLowerCase()) ? base + ' · ' + sh : base;
    });
  }`,
`  function dkWUnitApply() {
    var u = dkWUnitGet(), sh = dkWUnitShort(u), wTitle = t('wunit.title') || 'Weight unit';
    document.querySelectorAll('[data-wunit-chip]').forEach(function (ch) { ch.textContent = dkWUnitLabel(u); ch.title = wTitle; });
    document.querySelectorAll('[data-wunit-col]').forEach(function (el) {
      var base = el.getAttribute('data-wunit-base') || '';
      el.textContent = (base && base.toLowerCase() !== sh.toLowerCase()) ? base + ' · ' + sh : base;
      el.title = wTitle;
    });
  }`,
  'crm.wunit-apply-titles');

/* 1d. click delegation — weight inputs are plain numeric fields from now on;
       the picker opens from the top labels (chip + weight column header) */
crm = repOnce(crm,
`  /* tap a weight input in the live workout → unit picker; the header chip opens it too */
  document.addEventListener('click', function (e) {
    var inp = e.target.closest('input[data-set-input$=".weight"]');
    if (inp && inp.closest('#live-workout-exercises')) { dkWUnitOpen(inp); return; }
    if (e.target.closest('[data-wunit-chip]')) dkWUnitOpen(null);
  });`,
`  /* c86: the unit is changed ONLY from the top labels — the header chip and the
     weight column header open the picker; weight inputs stay plain numeric
     fields (editing a weight value must never open a dialog). */
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-wunit-chip]')) { dkWUnitOpen(null); return; }
    if (e.target.closest('[data-wunit-col]')) { dkWUnitOpen(null); return; }
  });`,
  'crm.wunit-delegation');

/* 1f. re-apply labels when the async i18n dict arrives — on a first load in
       EN/HE the chip/col labels would otherwise keep the RU fallback text
       until the first manual language switch */
crm = repOnce(crm,
  `  document.addEventListener('dk-lang', function () { try { dkWUnitApply(); } catch (_e) {} });`,
`  document.addEventListener('dk-lang', function () { try { dkWUnitApply(); } catch (_e) {} });
  document.addEventListener('dk:i18n-ready', function () { try { dkWUnitApply(); } catch (_e) {} });`,
  'crm.wunit-i18n-ready');

/* 1e. CSS — the weight column header looks/behaves like a top label */
crm = repOnce(crm,
  `#lw-unit-chip { max-width: 9.5rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }`,
`#lw-unit-chip { max-width: 9.5rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
/* c86: the weight column header is a top label — it opens the unit picker too */
[data-wunit-col] { cursor: pointer; transition: color .15s ease; }
[data-wunit-col]:hover { color: rgb(var(--c-accent)); }`,
  'crm.wunit-col-css');

/* ============================== 2. client.html ============================ */
let cl = read('client.html');

/* 2a. REMOVE the c85 glass compat layer — panels must stay clean; the texture
       lives on the background overlay and shows through the translucent glass
       (same look as the trainer app) */
cl = repOnce(cl,
`    /* ===== c85 portal compat: the texture layer also covers the portal's glass surfaces ===== */
    body[data-tex]:not([data-tex='none']) .glass,
    body[data-tex]:not([data-tex='none']) .glass-strong {
      background-image: var(--texture, none);
      background-size: var(--texture-size, auto);
      background-repeat: var(--texture-repeat, repeat);
    }
`,
`    /* ===== c86: panels stay CLEAN — no texture is painted on .glass / .glass-strong.
       The texture lives on the background (#dk-tex-overlay) and shows through the
       translucent glass — exactly how the trainer app renders it. ===== */
`,
  'portal.compat-removed');

/* 2b. CSS — the weight column header looks/behaves like a top label */
cl = repOnce(cl,
  `    [data-wunit-chip] { max-width: 9.5rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }`,
`    [data-wunit-chip] { max-width: 9.5rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    /* c86: the weight column header is a top label — it opens the unit picker too */
    [data-wunit-col] { cursor: pointer; transition: color .15s ease; }
    [data-wunit-col]:hover { color: rgb(var(--c-accent)); }`,
  'portal.wunit-col-css');

/* 2c. wApply — also set the localized tooltip on the top labels */
cl = repOnce(cl,
`    function wApply() {
      var u = wGet(), sh = wShort(u);
      document.querySelectorAll('[data-wunit-chip]').forEach(function (ch) { ch.textContent = wLabel(u); });
      document.querySelectorAll('[data-wunit-col]').forEach(function (el) {
        var base = el.getAttribute('data-wunit-base') || '';
        el.textContent = (base && base.toLowerCase() !== sh.toLowerCase()) ? base + ' · ' + sh : base;
      });
    }`,
`    function wApply() {
      var u = wGet(), sh = wShort(u), wTitle = T('wunitTitle') || 'Weight unit';
      document.querySelectorAll('[data-wunit-chip]').forEach(function (ch) { ch.textContent = wLabel(u); ch.title = wTitle; });
      document.querySelectorAll('[data-wunit-col]').forEach(function (el) {
        var base = el.getAttribute('data-wunit-base') || '';
        el.textContent = (base && base.toLowerCase() !== sh.toLowerCase()) ? base + ' · ' + sh : base;
        el.title = wTitle;
      });
    }`,
  'portal.wapply-titles');

/* 2d. click branches — weight inputs are plain numeric fields from now on;
       the picker opens from the top labels (chip + weight column header) */
cl = repOnce(cl,
`      var inp = e.target.closest('input[data-field="weight"]');
      if (inp && inp.closest('#workout-exercises-list')) { wOpen(inp); return; }
      var chip = e.target.closest('[data-wunit-chip]');
      if (chip) { wOpen(null); return; }`,
`      var chip = e.target.closest('[data-wunit-chip]');
      if (chip) { wOpen(null); return; }
      var col = e.target.closest('[data-wunit-col]');
      if (col) { wOpen(null); return; }`,
  'portal.wunit-delegation');

/* ================================ 3. sw.js ================================ */
let sw = read('sw.js');
sw = repOnce(sw, "const CACHE_NAME = 'dk-gym-v112';", "const CACHE_NAME = 'dk-gym-v113';", 'sw.cache');
{
  const sAnchor = '// v112: c85';
  const sCount = sw.split(sAnchor).length - 1;
  if (sCount !== 1) { console.error('FAIL: sw v112 history anchor count ' + sCount); process.exit(1); }
  const idx = sw.indexOf(sAnchor);
  const lineEnd = sw.indexOf('\n', idx);
  const v113 = '// v113: c86 — textures: the portal\'s panels stay clean (no texture painted on .glass/.glass-strong; the texture lives on the background overlay and shows through the translucent glass, same as the trainer app); weight units: the picker moved OFF the weight inputs — it opens only from the top labels (header chip + weight column header) in both apps';
  sw = sw.slice(0, lineEnd + 1) + v113 + '\n' + sw.slice(lineEnd + 1);
  console.log('ok   [sw.history]');
}

/* ================== 4. syntax-check every inline <script> ================= */
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

/* =========================== 5. final sanity ============================== */
const sanity = [];
const assert = (cond, msg) => { if (!cond) sanity.push(msg); };

/* trainer */
assert(crm.includes('content="c86"'), 'crm meta c86');
assert(crm.includes('var RUNNING = 86;'), 'crm RUNNING 86');
assert((crm.match(/dkWUnitOpen\(inp\)/g) || []).length === 0, 'crm input trigger removed');
assert((crm.match(/data-set-input\$="\.weight"/g) || []).length === 0, 'crm weight-input selector gone');
assert((crm.match(/\[data-wunit-col\]'\)\) \{ dkWUnitOpen\(null\); return; \}/g) || []).length === 1, 'crm col trigger present');
assert((crm.match(/\[data-wunit-chip\]'\)\) \{ dkWUnitOpen\(null\); return; \}/g) || []).length === 1, 'crm chip trigger present');
assert((crm.match(/ch\.title = wTitle/g) || []).length === 1, 'crm chip tooltip');
assert((crm.match(/el\.title = wTitle/g) || []).length === 1, 'crm col tooltip');
assert(crm.includes('[data-wunit-col] { cursor: pointer;'), 'crm col cursor css');
assert((crm.match(/dk:i18n-ready', function \(\) \{ try \{ dkWUnitApply\(\);/g) || []).length === 1, 'crm i18n-ready re-apply');
assert((crm.match(/data-wunit-col/g) || []).length >= 2, 'crm weight col still used');

/* portal */
assert((cl.match(/c85 portal compat/g) || []).length === 0, 'portal compat layer removed');
assert((cl.match(/body\[data-tex\]:not\(\[data-tex='none'\]\) \.glass/g) || []).length === 0, 'portal no texture on glass');
assert(cl.includes('.glass {\n      background: var(--glass-bg);'), 'portal glass base intact');
assert((cl.match(/wOpen\(inp\)/g) || []).length === 0, 'portal input trigger removed');
assert((cl.match(/input\[data-field="weight"\]'\)/g) || []).length === 0, 'portal weight-input selector gone');
assert((cl.match(/\[data-wunit-col\]'\);\n      if \(col\) \{ wOpen\(null\); return; \}/g) || []).length === 1, 'portal col trigger present');
assert((cl.match(/\[data-wunit-chip\]'\);\n      if \(chip\) \{ wOpen\(null\); return; \}/g) || []).length === 1, 'portal chip trigger present');
assert((cl.match(/ch\.title = wTitle/g) || []).length === 1, 'portal chip tooltip');
assert((cl.match(/el\.title = wTitle/g) || []).length === 1, 'portal col tooltip');
assert(cl.includes('[data-wunit-col] { cursor: pointer;'), 'portal col cursor css');
assert((cl.match(/data-wunit-col/g) || []).length >= 2, 'portal weight col still used');
assert(cl.includes('.tex-swatch { display:block; height:46px;'), 'portal tex swatches intact');
assert((cl.match(/dk-tex-overlay/g) || []).length >= 3, 'portal overlay engine intact');
assert((cl.match(/dk-wunit-sheet/g) || []).length >= 2, 'portal wunit sheet intact');

/* sw */
assert(sw.includes('dk-gym-v113'), 'sw v113');
assert(sw.split('// v113: c86').length === 2, 'sw v113 history single');
assert((sw.match(/dk-gym-v112/g) || []).length === 0, 'sw v112 fully replaced');

if (sanity.length || !syntaxOk) {
  console.error('SANITY FAILURES:\n' + sanity.map(s => ' - ' + s).join('\n'));
  process.exit(1);
}

/* ============================== 6. write ================================== */
write('fitness-crm.html', crm);
write('client.html', cl);
write('sw.js', sw);
console.log('=== c86 patches applied: fitness-crm.html, client.html, sw.js (RUNNING=86, dk-gym-v113) ===');
