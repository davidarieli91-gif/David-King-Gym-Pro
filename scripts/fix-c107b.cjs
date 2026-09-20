#!/usr/bin/env node
/* ============================================================================
 * fix-c107b.cjs — c107 refinements found during browser verification
 *
 *  1. Tools LOSE/MAINTAIN/GAIN numbers broke mid-digit at big scales
 *     («2, 59 4»): number font caps at min(0.875rem, 4.6vw) + the rem-scaled
 *     px-2 button padding shrinks to 2px under dk-fs-big — full numbers at
 *     every scale, identical look at scale 1.
 *  2. Layers 2–4 of the adaptivity CSS are scoped to html.dk-fs-big (scale
 *     ≥ 1.3): tab bars / screen header rows / top bar only start wrapping
 *     from A3+ — below that the original single-row look is pixel-identical
 *     to c106. Tab-bar children get min-width:auto + flex-basis:auto under
 *     dk-fs-big so bars wrap ROW-wise (min-content) and never stack letters.
 *  3. The MAINTENANCE header row (Tools) wraps label/number instead of
 *     pushing the kcal value through the card border.
 * ==========================================================================*/
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'fitness-crm.html');
let html = fs.readFileSync(FILE, 'utf8');
const fails = [];
let patched = 0;
function repOnce(name, anchor, replacement) {
  const idx = html.indexOf(anchor);
  if (idx === -1) { fails.push(`[${name}] anchor NOT FOUND`); return; }
  if (html.indexOf(anchor, idx + 1) !== -1) { fails.push(`[${name}] anchor NOT UNIQUE`); return; }
  html = html.slice(0, idx) + replacement + html.slice(idx + anchor.length);
  patched++;
  console.log(`  ✓ ${name}`);
}

/* --- 1. quick-target numbers --- */
repOnce('cal quick row class',
`                <div class="grid grid-cols-3 gap-2 mt-3">
                  <button type="button" data-cal-quick="lose"`,
`                <div class="grid grid-cols-3 gap-2 mt-3 dk-quick3">
                  <button type="button" data-cal-quick="lose"`);

repOnce('cal quick number cap css',
`    html.dk-fs-big body { overflow-wrap: break-word; }
    html.dk-fs-big .whitespace-nowrap:not(.dk-keep-nowrap) { white-space: normal; }`,
`    html.dk-fs-big body { overflow-wrap: break-word; }
    html.dk-fs-big .whitespace-nowrap:not(.dk-keep-nowrap) { white-space: normal; }
    /* c107b: the quick-target numbers never break mid-digit — the font caps
       at what a 1/3-wide cell can hold (identical at scale 1); the rem-scaled
       px-2 button padding shrinks too or nothing fits at A4+ */
    html.dk-fs-big .dk-quick3 div.font-extrabold { font-size: min(0.875rem, 4.6vw); overflow-wrap: normal; }
    html.dk-fs-big .dk-quick3 > button { padding-inline: 2px; }`);

/* --- 2. scope layers 2–4 to dk-fs-big --- */
repOnce('layers 2-4 scoped to dk-fs-big',
`    /* Layer 2: segment tab bars wrap instead of overflowing (Отчёт /
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
    html .dk-topbar-row { height: auto; min-height: 2.5rem; padding-block: 0.25rem; }`,
`    /* Layer 2 (c107b: active from A3+ / scale ≥ 1.3 only — at smaller scales
       the familiar single squeezed row stays exactly as it was): segment tab
       bars wrap instead of overflowing (Отчёт / Калькулятор… were cut off
       screen at big scales); children keep content-based min-width so the
       bar wraps row-wise (min-content) instead of stacking letters */
    html.dk-fs-big .flex:has(> .workout-tab-btn), html.dk-fs-big .flex:has(> .tools-tab),
    html.dk-fs-big .flex:has(> .nutrition-tab-btn), html.dk-fs-big .flex:has(> .analytics-range-btn) { flex-wrap: wrap; }
    html.dk-fs-big .workout-tab-btn, html.dk-fs-big .tools-tab, html.dk-fs-big .nutrition-tab-btn,
    html.dk-fs-big .analytics-range-btn { white-space: normal; line-height: 1.2; }
    html.dk-fs-big .flex:has(> .workout-tab-btn) > *, html.dk-fs-big .flex:has(> .tools-tab) > *,
    html.dk-fs-big .flex:has(> .nutrition-tab-btn) > *, html.dk-fs-big .flex:has(> .analytics-range-btn) > * { min-width: auto; flex-basis: auto; }
    /* Layer 3: screen header rows (title + action button) wrap when tight (A3+) */
    html.dk-fs-big .flex.items-center:has(> h1) { flex-wrap: wrap; }
    /* Layer 4: top bar (lang / A- A+ / theme / lock) wraps to a second line
       instead of pushing the lock button off-screen */
    html.dk-fs-big .dk-topbar-row, html.dk-fs-big .dk-topbar-row > div { flex-wrap: wrap; }
    html .dk-topbar-row { height: auto; min-height: 2.5rem; }`);

if (fails.length) {
  console.error('\n✗ fix-c107b FAILED:'); fails.forEach(f => console.error('  ' + f));
  process.exit(1);
}
fs.writeFileSync(FILE, html);
console.log(`\n✓ fix-c107b applied: ${patched} replacements`);
