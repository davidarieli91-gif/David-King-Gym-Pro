#!/usr/bin/env node
/* c61 version bump: c60→c61, RUNNING 60→61, footer, sw dk-gym-v87→v88 (+history line).
   seed v95 и EXERCISE_DB_BUST v51 НЕ меняются: exercise-db.json не менялся. */
const fs = require('fs');
const R = '/home/z/David-King-Gym-Pro/fitness-crm.html';
const SW = '/home/z/David-King-Gym-Pro/sw.js';
const res = [];
let s = fs.readFileSync(R, 'utf8');
let sw = fs.readFileSync(SW, 'utf8');
const s0 = s, sw0 = sw;

function rep1(f, from, to) {
  const i = f.s.indexOf(from);
  if (i < 0) { res.push('FAIL ' + from.slice(0, 40)); f.bad = true; return; }
  if (f.s.indexOf(from, i + 1) >= 0) { res.push('FAIL uniq ' + from.slice(0, 40)); f.bad = true; return; }
  f.s = f.s.slice(0, i) + to + f.s.slice(i + from.length);
  res.push('OK   ' + from.slice(0, 46) + ' → ' + to.slice(0, 36));
}
const A = { get s() { return s; }, set s(v) { s = v; } };
const B = { get s() { return sw; }, set s(v) { sw = v; } };

rep1(A, '<meta name="dk-build" content="c60" />', '<meta name="dk-build" content="c61" />');
rep1(A, 'var RUNNING = 60; /* numeric part of dk-build c60 */', 'var RUNNING = 61; /* numeric part of dk-build c61 */');
rep1(A, '3 languages · c60', '3 languages · c61');

// sw: bump + prepend history comment
rep1(B, "CACHE_NAME = 'dk-gym-v87'; // v87: subgroup pass, seed v95", "CACHE_NAME = 'dk-gym-v88'; // v88: c61 mobile responsive fixes (live table, bottom bar, food db, picker, portal header)");
const swAnchor = sw.indexOf('CACHE_NAME');
if (swAnchor >= 0) {
  // найдём начало строки комментария-истории (строка перед CACHE_NAME)
  const lineStart = sw.lastIndexOf('\n', swAnchor) + 1;
  const historyLine = "// v87: subgroup pass, seed v95 (c60)\n";
  if (sw.slice(lineStart, swAnchor).indexOf('v88') < 0) {
    // вставим историю только если её ещё нет в предыдущих комментариях
    const head = sw.slice(0, swAnchor);
    if (head.indexOf('// v87:') < 0) {
      sw = sw.slice(0, lineStart) + historyLine + sw.slice(lineStart);
      res.push('OK   sw history v87 line added');
    } else {
      res.push('OK   sw history v87 already present');
    }
  }
}

console.log(res.join('\n'));
if (A.bad || B.bad) { console.error('FAILURES — not written'); process.exit(1); }
fs.writeFileSync(R, s);
fs.writeFileSync(SW, sw);
console.log('crm delta', s.length - s0.length, '| sw delta', sw.length - sw0.length);
