/* c156 unit + static test — analytics exercise names follow the language +
   the hero panel lives in the Workouts tab only (kg/lb chip moved to Analytics). */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const trainer = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const html = fs.readFileSync(path.join(root, 'client.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }
function eq(name, got, want) { const g = JSON.stringify(got), w = JSON.stringify(want); if (g === w) { pass++; console.log('PASS ' + name + ' = ' + g); } else { fail++; console.log('FAIL ' + name + ' got ' + g + ' want ' + w); } }

function extractFn(src, name) {
  let start = src.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('function not found: ' + name);
  if (start >= 6 && src.slice(start - 6, start) === 'async ') start -= 6;
  let depth = 0, i = src.indexOf('{', start);
  let inStr = null, inLine = false, inBlock = false, esc = false;
  for (; i < src.length; i++) {
    const c = src[i], n = src[i + 1];
    if (inLine) { if (c === '\n') inLine = false; continue; }
    if (inBlock) { if (c === '*' && n === '/') { inBlock = false; i++; } continue; }
    if (inStr) { if (esc) { esc = false; continue; } if (c === '\\') { esc = true; continue; } if (c === inStr) inStr = null; continue; }
    if (c === '/' && n === '/') { inLine = true; i++; continue; }
    if (c === '/' && n === '*') { inBlock = true; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (!depth) return src.slice(start, i + 1); }
  }
  throw new Error('unbalanced: ' + name);
}

/* ---------- UNIT: aExName ---------- */
const src = [
  'let _aExNameIdx = null; let _aExHistIdx = null;',
  extractFn(html, 'aNormExName'), extractFn(html, 'aExNameIdx'), extractFn(html, 'aExHistIdx'), extractFn(html, 'aExName')
].join('\n') + '\n;globalThis.__N156 = { aExName, aExNameIdx, aExHistIdx };';
new Function(src)();
const N = globalThis.__N156;
globalThis.exerciseDB = {
  ex1: { name_ru: 'Жим лёжа', name_en: 'Bench Press', name_he: 'לחיצת חזה' },
  ex2: { name_ru: 'Тяга верхнего блока' }
};
globalThis.currentLang = 'ru';
eq('ru name from the payload map', N.aExName('id:ex1', 'stale'), 'Жим лёжа');
globalThis.currentLang = 'en';
eq('en name from the payload map', N.aExName('id:ex1', 'stale'), 'Bench Press');
globalThis.currentLang = 'he';
eq('he name from the payload map', N.aExName('id:ex1', 'stale'), 'לחיצת חזה');
globalThis.currentLang = 'en';
eq('en falls back to ru when the en field is missing', N.aExName('id:ex2', 'stale'), 'Тяга верхнего блока');
/* history index (names that travelled with trainer pushes) */
globalThis.loadHistory = () => [{ exercises: [{ key: 'ex9', name: 'Что-то', name_en: 'Cable Row', name_ru: 'Тяга', name_he: 'חתירה' }] }];
eq('history-carried localized name (en)', N.aExName('id:ex9', 'Что-то'), 'Cable Row');
globalThis.currentLang = 'he';
eq('history-carried localized name (he)', N.aExName('id:ex9', 'Что-то'), 'חתירה');
globalThis.currentLang = 'ru';
/* nm: key — matched to the payload by any-language name */
eq('nm key matched by any language', N.aExName('nm:bench press', 'Bench Press'), 'Жим лёжа');
eq('nm key unmatched → raw fallback', N.aExName('nm:unknown thing', 'Кастомное упражнение'), 'Кастомное упражнение');
eq('id key without any data → id-stripped fallback', N.aExName('id:ex404', ''), 'ex404');
eq('null-safe', N.aExName(null, null), '');

/* ---------- STATIC: hero panel placement ---------- */
const iWork = html.indexOf('id="tab-workouts"');
const iHero = html.indexOf('id="client-card"');
const iNutrition = html.indexOf('id="tab-nutrition"');
const iAnalytics = html.indexOf('id="tab-analytics"');
const iChip = html.indexOf('id="cp-unit-chip"');
const iRecovery = html.indexOf('id="tab-recovery"');
ok('hero card sits INSIDE the workouts tab', iWork >= 0 && iHero > iWork && iHero < iNutrition);
ok('hero card no longer before the tabs', html.indexOf('<!-- Hero card -->') > iWork);
ok('kg/lb chip sits INSIDE the analytics tab (single element)', html.split('id="cp-unit-chip"').length - 1 === 1 && iChip > iAnalytics && iChip < iRecovery);
ok('hero title/start/stat ids intact', ['txt-active-program', 'btn-quick-start', 'stat-exercises', 'stat-sets', 'stat-volume'].every(id => html.indexOf('id="' + id + '"') > iWork));

/* ---------- STATIC: localization wiring ---------- */
ok('aExName helper + both indexes', html.indexOf('function aExName(key, raw)') >= 0 && html.indexOf('function aExNameIdx()') >= 0 && html.indexOf('function aExHistIdx()') >= 0);
ok('progress select uses the localized list', html.indexOf('name: aExName(key, ex.name), count: 1') >= 0);
ok('PR rows use aExName', html.indexOf('esc(aExName(pr.key, pr.name))') >= 0);
ok('report rows use aExName', html.indexOf('esc(aExName(ex.key, ex.name))') >= 0);
ok('indexes rebuild on boot + history save', html.indexOf('_aExNameIdx = null; _aExHistIdx = null; /* c156') >= 0 && html.indexOf('saveHistory(list) { try { localStorage.setItem(nsKey(\'dk_workout_history\'), JSON.stringify(list.slice(-200))); _aExNameIdx = null; _aExHistIdx = null;') >= 0);
ok('trainer: backfill records carry name_ru/en/he', trainer.indexOf('name_en: ex.name_en || \'\', name_ru: ex.name_ru || \'\', name_he: ex.name_he || \'\' }') >= 0);
ok('trainer: single pushes enrich names too', trainer.indexOf('ex.name_he = ex98.name_he || ex.name_he || \'\'') >= 0);
ok('trainer: portal record mapper serializes localized names', trainer.indexOf('name_he: (exInfo && exInfo[ex.exercise_id] && exInfo[ex.exercise_id].name_he)') >= 0);

/* ---------- versions ---------- */
ok('sw cache at least v183', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 183; })());
ok('RUNNING / dk-build at least c156', (function () {
  const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
  return !!r && !!b && Number(r[1]) >= 156 && Number(b[1]) >= 156;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
