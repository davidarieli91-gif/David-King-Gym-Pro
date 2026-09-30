/* c131 unit test — portal data-safety pack.
   Extracts the pure functions straight out of client.html and runs them in a
   sandbox with a stubbed localStorage (same "extract from the real file"
   approach as the c126 portal test). Hand-computed expectations; the static
   checks at the end pin the transaction/queue wiring that cannot run in Node
   (Firestore). */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'client.html'), 'utf8');
const trainer = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');

let pass = 0, fail = 0;
function eq(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) { pass++; console.log('PASS ' + name + ' = ' + JSON.stringify(got)); }
  else { fail++; console.log('FAIL ' + name + ' got ' + JSON.stringify(got) + ' want ' + JSON.stringify(want)); }
}
function ok(name, cond) {
  if (cond) { pass++; console.log('PASS ' + name); }
  else { fail++; console.log('FAIL ' + name); }
}

/* --- extract a function by name with a brace-balanced, string-aware scanner --- */
function extractFn(src, name) {
  const start = src.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('function not found: ' + name);
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
  throw new Error('unbalanced braces in ' + name);
}

const names = [
  'dkLocalDateKey', 'dkCheckinToKg', 'dkMergeHistRecs', 'dkCheckinToCloud', 'dkMergeCheckinPayload',
  'dkPendingKey', 'dkPendingList', 'dkPendingSave', 'dkPendingAdd', 'dkPendingRemove', 'dkPendingCount'
];
const fnSrc = names.map(n => extractFn(html, n)).join('\n');

function makeLS() {
  const m = new Map();
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: k => { m.delete(k); },
    key: i => Array.from(m.keys())[i],
    get length() { return m.size; },
    _dump: () => m
  };
}

const factory = new Function('localStorage', 'navigator', 'nsKey', 'dkSyncState',
  fnSrc + '\nreturn { dkLocalDateKey, dkCheckinToKg, dkMergeHistRecs, dkCheckinToCloud, dkMergeCheckinPayload, dkPendingKey, dkPendingList, dkPendingSave, dkPendingAdd, dkPendingRemove, dkPendingCount };');

const ls = makeLS();
const S = factory(ls, { onLine: true }, k => k + '__testns', function () {});

/* ---------- 1. local date keys (was toISOString → UTC on UTC+2/+3) ---------- */
eq('date: late evening stays the SAME local day', S.dkLocalDateKey(new Date(2026, 8, 30, 23, 45)), '2026-09-30');
eq('date: early morning stays the SAME local day', S.dkLocalDateKey(new Date(2026, 0, 1, 0, 5)), '2026-01-01');
eq('date: month/day zero-padded', S.dkLocalDateKey(new Date(2026, 2, 5, 12, 0)), '2026-03-05');
eq('date: no argument → today (format only)', /^\d{4}-\d{2}-\d{2}$/.test(S.dkLocalDateKey()), true);
eq('date: invalid input → empty string', S.dkLocalDateKey('not-a-date'), '');

/* ---------- 2. check-in weight unit conversion + 30..300 kg band ---------- */
eq('checkin: 80 kg stays 80', S.dkCheckinToKg(80, 'kg'), 80);
eq('checkin: 80.5 kg stays 80.5', S.dkCheckinToKg('80.5', 'kg'), 80.5);
eq('checkin: 176 lb → 79.8 kg (×0.45359237, 1 decimal)', S.dkCheckinToKg(176, 'lb'), 79.8);
eq('checkin: 440.9 lb → 200 kg (in band)', S.dkCheckinToKg(440.9, 'lb'), 200);
eq('checkin: 29 kg → rejected (below band)', S.dkCheckinToKg(29, 'kg'), null);
eq('checkin: 301 kg → rejected (above band)', S.dkCheckinToKg(301, 'kg'), null);
eq('checkin: 60 lb = 27.2 kg → rejected', S.dkCheckinToKg(60, 'lb'), null);
eq('checkin: empty → null', S.dkCheckinToKg('', 'kg'), null);
eq('checkin: 0 → null', S.dkCheckinToKg(0, 'kg'), null);

/* ---------- 3. dkMergeHistRecs — dedupe by ts, sort, cap 200 ---------- */
const A1 = { ts: 1, tag: 'a' }, B2 = { ts: 2, tag: 'b' }, C2 = { ts: 2, tag: 'c' };
eq('mergeRecs: new rec replaces same-ts cloud rec',
  S.dkMergeHistRecs([A1, B2], C2), [A1, C2]);
eq('mergeRecs: unsorted cloud gets sorted',
  S.dkMergeHistRecs([B2, A1], { ts: 3, tag: 'd' }).map(r => r.ts), [1, 2, 3]);
const many = []; for (let i = 1; i <= 205; i++) many.push({ ts: i });
const capped = S.dkMergeHistRecs(many, { ts: 206 });
eq('mergeRecs: cap 200 (length)', capped.length, 200);
eq('mergeRecs: cap 200 (oldest dropped, newest kept)', [capped[0].ts, capped[199].ts], [7, 206]);
eq('mergeRecs: garbage input tolerated', S.dkMergeHistRecs(null, { ts: 5 }), [{ ts: 5 }]);

/* ---------- 4. dkCheckinToCloud — kg band + cm band + energy ---------- */
eq('push: valid check-in → cloud shape (energy 0 kept!)',
  S.dkCheckinToCloud({ ts: 9, date: '2026-09-30', weight: 82.5, energy: 0, waist: 80, hip: 105.5 }),
  { ts: 9, date: '2026-09-30', weight: 82.5, energy: 0, waist: 80, hip: 105.5 });
eq('push: weight 20 kg dropped', S.dkCheckinToCloud({ ts: 9, weight: 20 }), null);
eq('push: weight 350 kg dropped', S.dkCheckinToCloud({ ts: 9, weight: 350 }), null);
eq('push: ts 0 dropped', S.dkCheckinToCloud({ ts: 0, weight: 80 }), null);
eq('push: out-of-band waist omitted (hip stays)',
  S.dkCheckinToCloud({ ts: 9, weight: 80, waist: 210, hip: 99 }),
  { ts: 9, date: '', weight: 80, energy: null, hip: 99 });
eq('push: bad energy → null', S.dkCheckinToCloud({ ts: 9, weight: 80, energy: 'x' }).energy, null);

/* ---------- 5. dkMergeCheckinPayload — per-field backfill + merge ---------- */
let m = S.dkMergeCheckinPayload([{ ts: 1, weight: 80 }], [{ ts: 1, weight: 80, waist: 77, hip: 99 }]);
eq('checks: both fields backfilled', [m.checks[0].waist, m.checks[0].hip, m.added, m.enriched], [77, 99, 0, 1]);
m = S.dkMergeCheckinPayload([{ ts: 2, weight: 81, waist: 78 }], [{ ts: 2, weight: 81, hip: 100 }]);
eq('checks: per-FIELD — existing waist kept, missing hip filled', [m.checks[0].waist, m.checks[0].hip, m.enriched], [78, 100, 1]);
m = S.dkMergeCheckinPayload([{ ts: 3, weight: 82, waist: 70, hip: 95 }], [{ ts: 3, weight: 82, waist: 70, hip: 95 }]);
eq('checks: complete record → no write', [m.enriched, m.added], [0, 0]);
m = S.dkMergeCheckinPayload([{ ts: 1, weight: 80 }], [{ ts: 1, weight: 80 }, { ts: 2, weight: 81 }]);
eq('checks: new local check-in appended', [m.added, m.checks.map(c => c.ts)], [1, [1, 2]]);
m = S.dkMergeCheckinPayload(null, [{ ts: 5, weight: 80 }]);
eq('checks: empty cloud → all added', [m.added, m.checks.length], [1, 1]);
const cloud95 = []; for (let i = 1; i <= 95; i++) cloud95.push({ ts: i, weight: 80 });
m = S.dkMergeCheckinPayload(cloud95, []);
eq('checks: cap 90', m.checks.length, 90);
eq('checks: cap keeps the NEWEST', m.checks[89].ts, 95);

/* ---------- 6. pending queue — namespaced, dedupe by ts, cap 20 ---------- */
eq('queue: empty storage → []', S.dkPendingList(), []);
eq('queue: key is namespaced per client', S.dkPendingKey(), 'dk_pending_sync__testns');
S.dkPendingAdd({ ts: 20, tag: 'b' });
S.dkPendingAdd({ ts: 10, tag: 'a' });
eq('queue: kept sorted by ts', S.dkPendingList().map(r => [r.ts, r.tag]), [[10, 'a'], [20, 'b']]);
S.dkPendingAdd({ ts: 20, tag: 'b2' });
eq('queue: duplicate ts replaced (no duplicates)', S.dkPendingList().map(r => r.tag), ['a', 'b2']);
S.dkPendingAdd(null);
S.dkPendingAdd({ ts: 0 });
eq('queue: null/ts0 ignored', S.dkPendingCount(), 2);
S.dkPendingRemove(10);
eq('queue: remove by ts', S.dkPendingList().map(r => r.ts), [20]);
for (let i = 30; i <= 60; i++) S.dkPendingAdd({ ts: i });
eq('queue: cap 20', S.dkPendingCount(), 20);
eq('queue: cap keeps the newest', S.dkPendingList()[19].ts, 60);

/* ---------- 7. static wiring checks (Firestore paths can't run in Node) ---------- */
ok('portal: push uses ONE transaction helper (db.runTransaction)', trainer.indexOf('runTransaction') >= 0 && /db\.runTransaction\(/.test(html));
ok('portal: no dkHistFetchPayload leftovers (the empty-on-error reader is gone)', html.indexOf('dkHistFetchPayload') === -1);
ok('portal: transaction aborts on corrupt payload', html.indexOf("throw new Error('corrupt payload')") >= 0);
ok('portal: pending queue flushed on boot', html.indexOf('dkFlushPending()') >= 0 && html.indexOf("addEventListener('online'") >= 0);
ok('portal: failed push enqueues the workout', /if \(!ok\) dkPendingAdd\(rec\)/.test(html));
ok('portal: sync badge element present', html.indexOf('id="sync-badge"') >= 0);
ok('portal: check-in save goes through dkCheckinToKg', /dkCheckinToKg\(document\.getElementById\('input-checkin-weight'\)\.value/.test(html));
ok('portal: no UTC date-key slices left', !/toISOString\(\)\.slice/.test(html));
ok('portal: second workout button («Ещё одна тренировка»)', html.indexOf("t('anotherWorkout')") >= 0);
ok('portal: localStorage writes guarded (history returns bool)', /function saveHistory\(list\) \{ try \{/.test(html));
ok('i18n ×3: syncOffline', (html.match(/syncOffline:'/g) || []).length === 3);
ok('i18n ×3: anotherWorkout', (html.match(/anotherWorkout:'/g) || []).length === 3);
ok('i18n ×3: checkinWeightRange', (html.match(/checkinWeightRange:'/g) || []).length === 3);
ok('i18n ×3: storageFull', (html.match(/storageFull:'/g) || []).length === 3);
ok('trainer: push AND backfill both transactional', (trainer.match(/runTransaction/g) || []).length >= 2);
ok('trainer: corrupt payload aborts', trainer.indexOf('corrupt payload — push aborted') >= 0 && trainer.indexOf('corrupt payload — backfill aborted') >= 0);
ok('sw: cache at least v158 (c131 shipped it)', (function () {
  const m = fs.readFileSync(path.join(root, 'sw.js'), 'utf8').match(/CACHE_NAME = 'dk-gym-v(\d+)'/);
  return !!m && Number(m[1]) >= 158;
})());
ok('versions: RUNNING/dk-build at least c131', (function () {
  const r = trainer.match(/var RUNNING = (\d+)/);
  const b = trainer.match(/content="c(\d+)"/);
  return !!r && !!b && Number(r[1]) >= 131 && Number(b[1]) >= 131;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
