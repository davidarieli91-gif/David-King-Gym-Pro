#!/usr/bin/env node
/* ============================================================================
 * fix-c82.cjs — mobile «Тренировки ▸ База упражнений» layout repair
 *
 * Symptom (user screenshots, phone ~412px): after revealing the body map the
 * whole browse structure breaks — the map takes one full-width flex row while
 * the muscle-tree column and the entire cards grid are pushed off-screen to
 * the right (only a 10px sliver of the tree remains visible); because the
 * layout keeps `align-items: stretch`, all three columns stretch to the
 * grid's content height (~60 000px) so the empty textured background fills
 * screens and screens of nothing; the page gains horizontal scroll.
 *
 * Root cause: the ≤1023px reveal rule only switched the map column on
 *   #exb-map-col:has(#exercise-bodymap-panel:not(.hidden)) { display:flex; width:100% }
 * but #exb-layout stayed a single non-wrapping flex row with stretch
 * alignment — a 100%-wide shrink-0 child + 150px tree + flex-1 grid can only
 * overflow. (.exb-map-open was toggled by JS since c75 but had NO CSS rule,
 * so :has-less WebViews got no fallback either.)
 *
 * Fixes:
 *  1. ≤1023px: #exb-layout wraps — the revealed map becomes its own
 *     full-width row ABOVE the tree+cards row; columns align flex-start so
 *     none of them stretches to the list height; tree column width capped at
 *     46vw so the cards always keep room even with big UI-scale values.
 *  2. .exb-map-open CSS fallback (JS already toggles it since c75) — works on
 *     WebViews without :has() support.
 *  3. Embedded 3D widget (#exercise-bodymap-3d) on ≤1023px: width capped to
 *     its column (min(190px*atlas, 100%)) + aspect-ratio 19/31 keeps the
 *     standing-figure proportions (Settings ▸ 3D atlas size = 2.5 used to
 *     produce a 475px-wide box on a 412px screen).
 *  4. #exercise-bodymap-svg inline max-width gets the same 100% cap.
 *  5. Phase-5.4 «Report» button label now follows language changes (was
 *     frozen at inject-time English «📊 Report» — visible on user screenshot).
 *  6. Versions: meta dk-build c81→c82, RUNNING 81→82, login footer c81→c82,
 *     sw dk-gym-v108→v109 (+history line)
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

function repOnceSw(name, anchor, replacement) {
  const idx = sw.indexOf(anchor);
  if (idx === -1) { fails.push(`[${name}] anchor NOT FOUND`); return; }
  if (sw.indexOf(anchor, idx + 1) !== -1) { fails.push(`[${name}] anchor NOT UNIQUE`); return; }
  sw = sw.slice(0, idx) + replacement + sw.slice(idx + anchor.length);
  patched++;
  console.log(`OK  ${name} (sw.js)`);
}

/* ============================================================
 * 1) Mobile (≤1023px) browse layout — wrap, no stretch, caps
 * ============================================================ */
repOnce(
  'mobile exb layout wrap + caps',
  `@media (max-width: 1023px) {
  #exb-map-col { display: none; }
  #exb-map-col:has(#exercise-bodymap-panel:not(.hidden)) { display: flex; width: 100%; }
  #exb-tree-col { width: calc(150px * var(--ui-exercise-panel, 1)); }
}`,
  `@media (max-width: 1023px) {
  /* c82: mobile browse — the revealed map becomes its own FULL-WIDTH ROW above
     the tree + cards row. The old single-row reveal (width:100% inside a
     non-wrapping flex line) pushed the tree and the whole cards grid
     off-screen, and align-items:stretch stretched every column to the grid's
     content height (tens of thousands of px of empty background). */
  #exb-layout { flex-wrap: wrap; align-items: flex-start; }
  #exb-map-col { display: none; }
  /* .exb-map-open = JS hook (toggled since c75) — doubles as the :has() fallback */
  #exb-map-col.exb-map-open,
  #exb-map-col:has(#exercise-bodymap-panel:not(.hidden)) {
    display: flex; flex: 1 1 100%; width: 100%; max-width: 100%; min-width: 0;
  }
  #exb-tree-col { width: min(calc(150px * var(--ui-exercise-panel, 1)), 46vw); }
  /* c82: the embedded 3D widget never exceeds its column on phones
     (190px * atlas 2.5 = 475px used to overflow a 412px viewport) */
  #exercise-bodymap-panel > div:first-child { width: 100%; }
  #exercise-bodymap-3d { width: min(calc(190px * var(--ui-atlas, 1.5)), 100%); height: auto; aspect-ratio: 19 / 31; }
}`
);

/* ============================================================
 * 2) SVG body map — cap at 100% regardless of --ui-bodymap
 * ============================================================ */
repOnce(
  'bodymap svg inline cap',
  `<div id="exercise-bodymap-svg" class="mx-auto" style="max-width: calc(160px * var(--ui-bodymap, 1));"></div>`,
  `<div id="exercise-bodymap-svg" class="mx-auto" style="max-width: min(calc(160px * var(--ui-bodymap, 1)), 100%);"></div>`
);

/* ============================================================
 * 3) «Report» button label follows the app language
 * ============================================================ */
repOnce(
  'report button lang sync',
  `      anchor.parentNode.insertBefore(b, anchor.nextSibling);
    } catch (e) {}
  }`,
  `      anchor.parentNode.insertBefore(b, anchor.nextSibling);
    } catch (e) {}
  }

  /* c82: the injected label used to freeze at inject-time language
     (screenshot: «Report» while the app ran in RU) — re-translate on change */
  try {
    new MutationObserver(function () {
      var btn = document.getElementById("p54-btn");
      if (btn) btn.textContent = S().btn;
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  } catch (e) {}`
);

/* ============================================================
 * 4) Version bumps (html)
 * ============================================================ */
repOnce(
  'meta dk-build c82',
  `<meta name="dk-build" content="c81" />`,
  `<meta name="dk-build" content="c82" />`
);

repOnce(
  'login footer c82',
  `· IndexedDB · 3 languages · c81</p>`,
  `· IndexedDB · 3 languages · c82</p>`
);

repOnce(
  'RUNNING = 82',
  `var RUNNING = 81; /* numeric part of dk-build c81 */`,
  `var RUNNING = 82; /* numeric part of dk-build c82 */`
);

/* ============================================================
 * 5) sw.js — version bump + history
 * ============================================================ */
repOnceSw(
  'sw cache v109 + history',
  `// v108: c81 — mixed-cache blank labels fixed: i18n/*.json now NETWORK-FIRST, waiting SW auto-activates (SKIP_WAITING) + one guarded controllerchange reload, applyI18n keeps default text when a key is missing
const CACHE_NAME = 'dk-gym-v108';`,
  `// v108: c81 — mixed-cache blank labels fixed: i18n/*.json now NETWORK-FIRST, waiting SW auto-activates (SKIP_WAITING) + one guarded controllerchange reload, applyI18n keeps default text when a key is missing
// v109: c82 — mobile Exercise DB browse repaired: revealed body map = own full-width wrapped row (tree+cards no longer pushed off-screen, no stretch-to-list-height), .exb-map-open CSS fallback for :has-less WebViews, 3D widget/SVG capped to column width, Report button label follows language
const CACHE_NAME = 'dk-gym-v109';`
);

/* ============================================================
 * Sanity + write
 * ============================================================ */
console.log('--- sanity ---');
function must(cond, msg) {
  if (cond) { console.log('OK  ' + msg); } else { fails.push('SANITY: ' + msg); }
}
must(html.includes('content="c82"') && !html.includes('content="c81"'), 'meta = c82 only');
must((html.match(/· c82<\/p>/g) || []).length === 1, 'login footer = c82');
must(html.includes('var RUNNING = 82;'), 'RUNNING = 82');
must(html.includes('#exb-layout { flex-wrap: wrap; align-items: flex-start; }'), 'mobile wrap rule');
must((html.match(/#exb-map-col\.exb-map-open/g) || []).length === 1, 'exb-map-open CSS fallback');
must(html.includes('aspect-ratio: 19 / 31;'), '3D widget aspect cap');
must(html.includes('max-width: min(calc(160px * var(--ui-bodymap, 1)), 100%);'), 'svg inline cap');
must(html.includes('attributeFilter: ["lang"] }'), 'report lang observer');
must(sw.includes("const CACHE_NAME = 'dk-gym-v109';") && !sw.includes("'dk-gym-v108'"), 'sw CACHE_NAME = v109');
must(!fails.length, 'no failures');

if (fails.length) {
  console.error('\nFAILED:\n' + fails.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
fs.writeFileSync(FILE, html);
fs.writeFileSync(SW, sw);
console.log(`\nDone. ${patched} patches written.\n`);
