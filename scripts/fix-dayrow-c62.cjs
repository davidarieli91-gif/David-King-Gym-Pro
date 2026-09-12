#!/usr/bin/env node
/* c62: program day-row mobile fix — «Открыть» button always reachable
 * Problem: day row = [A badge][dow select][name][4 thumbs][+N][Open btn], all shrink-0
 * except name. On 360px phones (esp. Android font scale 1.2-1.4) the row overflows and
 * the Open button lands off-screen → large programs can't be opened.
 * Fix:
 *  1) row becomes flex-wrap (gap-y-1) → if a line can't fit, button wraps to its own line
 *  2) thumbs + "+N" go into a scrollable strip (min-w-0 overflow-x-auto no-scrollbar)
 *  3) Open button gets ml-auto → right-aligned on any line
 * Version bump: c61→c62, RUNNING 61→62, sw dk-gym-v88→v89 (exercise-db.json untouched:
 * seed v95 / BUST v51 stay)
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

// ---- 1) active day row container → flex-wrap
rep('day-row flex-wrap',
  'return `<div class="flex items-center gap-2 bg-surface rounded-lg p-2">\n                    <span class="w-7 h-7 rounded-lg bg-primary/15 text-primary-2 grid place-items-center font-mono font-bold text-xs shrink-0">${day.day_letter || (i+1)}</span>',
  'return `<div class="flex flex-wrap items-center gap-x-2 gap-y-1 bg-surface rounded-lg p-2">\n                    <span class="w-7 h-7 rounded-lg bg-primary/15 text-primary-2 grid place-items-center font-mono font-bold text-xs shrink-0">${day.day_letter || (i+1)}</span>'
);

// ---- 2) thumbs + "+N" → scrollable strip, Open button → ml-auto
rep('thumbs strip + ml-auto button',
  `                    \${(day.exercises || []).slice(0, 4).map(ex => {
                      const img = globalExImage(ex);
                      return img
                        ? \`<div class="w-8 h-8 rounded-lg shrink-0 overflow-hidden bg-surface-2 border border-border grid place-items-center" title="\${escapeAttr(globalExName(ex))}"><img src="\${escapeAttr(img)}" alt="" class="w-full h-full object-contain" loading="lazy" onerror="this.style.display='none'" /></div>\`
                        : '';
                    }).join('')}
                    \${(day.exercises || []).length > 4 ? \`<span class="text-[10px] text-muted shrink-0">+\${day.exercises.length - 4}</span>\` : ''}
                    <button class="text-xs font-semibold text-primary-2 hover:bg-primary/10 rounded-lg px-2.5 py-1 transition shrink-0" data-program-day="\${prog.id}.\${i}">\${t('common.open') || 'Open'}</button>`,
  `                    <div class="flex items-center gap-1.5 min-w-0 max-w-full overflow-x-auto no-scrollbar">
                      \${(day.exercises || []).slice(0, 4).map(ex => {
                        const img = globalExImage(ex);
                        return img
                          ? \`<div class="w-8 h-8 rounded-lg shrink-0 overflow-hidden bg-surface-2 border border-border grid place-items-center" title="\${escapeAttr(globalExName(ex))}"><img src="\${escapeAttr(img)}" alt="" class="w-full h-full object-contain" loading="lazy" onerror="this.style.display='none'" /></div>\`
                          : '';
                      }).join('')}
                      \${(day.exercises || []).length > 4 ? \`<span class="text-[10px] text-muted shrink-0">+\${day.exercises.length - 4}</span>\` : ''}
                    </div>
                    <button class="text-xs font-semibold text-primary-2 hover:bg-primary/10 rounded-lg px-2.5 py-1 transition shrink-0 ml-auto" data-program-day="\${prog.id}.\${i}">\${t('common.open') || 'Open'}</button>`
);

// ---- 3) version bumps
rep('meta c62', '<meta name="dk-build" content="c61" />', '<meta name="dk-build" content="c62" />');
rep('RUNNING 62', 'var RUNNING = 61; /* numeric part of dk-build c61 */', 'var RUNNING = 62; /* numeric part of dk-build c62 */');
rep('footer c62', '3 languages · c61', '3 languages · c62');

fs.writeFileSync(path.join(ROOT, 'fitness-crm.html'), html);

// ---- sw.js
let sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const swFrom = "const CACHE_NAME = 'dk-gym-v88'; // v88: c61 mobile responsive fix";
const swTo = "const CACHE_NAME = 'dk-gym-v89'; // v89: c62 program day-row mobile fix";
if (sw.includes(swFrom)) { sw = sw.replace(swFrom, swTo); results.push(['sw v89', 'OK']); }
else results.push(['sw v89', 'FAIL']);
fs.writeFileSync(path.join(ROOT, 'sw.js'), sw);

results.forEach(([n, r]) => console.log(r.padEnd(14), n));
if (results.some(([, r]) => r.startsWith('FAIL'))) process.exit(1);
console.log('c62 patch done');
