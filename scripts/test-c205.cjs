/* c205 test — live-workout parity for the trainer and the client portal:
   readable rest fields, green set checks, one Prev source, client supersets,
   client completion ring/report chart, theme-aware exercise cards and portal
   workouts persisted into the trainer's workout_history. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..');
const crm = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
const portal = fs.readFileSync(path.join(root, 'client.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src', 'input.css'), 'utf8');
const core = fs.readFileSync(path.join(root, 'src', 'muscle-core.js'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }

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

/* ---------- rest field: full seconds, no spinner ---------- */
const restInputs = (crm.match(/class="rest-sec-input w-16/g) || []).length + (portal.match(/class="rest-sec-input w-16/g) || []).length;
ok('both portals use the wide rest field', restInputs >= 2);
ok('rest field is wide enough for 3 digits (68px)', css.indexOf('.rest-sec-input {') >= 0 && css.indexOf('width: 4.25rem') >= 0 && css.indexOf('min-width: 4.25rem') >= 0);
ok('rest field hides number spinners', css.indexOf('::-webkit-outer-spin-button') >= 0 && css.indexOf('appearance: textfield') >= 0);

/* ---------- trainer cards match the portal rhythm ---------- */
ok('trainer live cards get the larger padding/title', css.indexOf('#live-workout-exercises > .glass {') >= 0 && css.indexOf('padding: 1.12rem 1.18rem') >= 0 && css.indexOf('#live-workout-exercises > .glass h4 { font-size: .96rem; }') >= 0);
ok('trainer set rows keep the portal minimum height', css.indexOf('#live-workout-exercises .set-row { min-height: 2.5rem; }') >= 0);

/* ---------- green done checks in both portals ---------- */
const doneChecks = (css.match(/\.set-row-done \.set-check/g) || []).length;
ok('shared CSS paints the done check green in both lists', doneChecks >= 1 && css.indexOf('#live-workout-exercises .set-row-done .set-check') >= 0 && css.indexOf('#workout-exercises-list .set-row-done .set-check') >= 0 && css.indexOf('background: rgb(var(--c-success)) !important') >= 0);
ok('portal done check is enlarged and always opaque when done', css.indexOf('#workout-exercises-list .set-check {') >= 0 && css.indexOf('width: 1.9rem') >= 0 && css.indexOf('opacity: 1 !important') >= 0);
ok('live sessions count a ticked set immediately', core.indexOf("if (s.done === true || s.touched === true) return true;") >= 0 && core.indexOf('if (s.performed != null) return !!s.performed;') >= 0);

/* ---------- theme-aware exercise cards ---------- */
ok('both live card lists follow the active theme', css.indexOf('html[data-ui="v2"] #live-workout-exercises > .glass') >= 0 && css.indexOf('html[data-ui="v2"] #workout-exercises-list > .glass') >= 0 && css.indexOf('background: var(--v2-glass-bg) !important') >= 0);
ok('inner set rows and inputs follow the theme too', css.indexOf('html[data-ui="v2"] #live-workout-exercises .set-row') >= 0 && css.indexOf('html[data-ui="v2"] #workout-exercises-list .set-row') >= 0 && css.indexOf('html[data-ui="v2"] #live-workout-exercises .set-input') >= 0 && css.indexOf('html[data-ui="v2"] #workout-exercises-list .set-input') >= 0);
ok('light themes get light cards, dark themes dark cards', css.indexOf('--v2-glass-bg') >= 0 && portal.indexOf('[data-mode="light"]') >= 0 && crm.indexOf('[data-mode="light"]') >= 0);

/* ---------- same Prev values in both portals ---------- */
const findLast = extractFn(portal, 'dkPFindLastEx');
ok('client Prev scans the newest occurrence across all history', findLast.indexOf('for (let i = list.length - 1; i >= 0; i--)') >= 0 && findLast.indexOf('pass === 0') < 0 && findLast.indexOf('same day first') < 0);
ok('client Prev keeps the done-only, same-set-number rule', findLast.indexOf('allSets.some(psSetPerformed)') >= 0 && findLast.indexOf('sets: allSets') >= 0);
ok('trainer Prev also scans the newest occurrence', crm.indexOf('cands.sort((a, b) => b.date - a.date)') >= 0 && crm.indexOf("map['id:' + idKey]") >= 0 && crm.indexOf("map['nm:' + nmKey]") >= 0);

/* ---------- client superset button ---------- */
ok('client card has a superset button', portal.indexOf('data-ps-superset="${ei}"') >= 0 && portal.indexOf('psToggleSuperset(ei)') >= 0);
ok('client superset uses the shared link model', portal.indexOf('function psToggleSuperset(ei)') >= 0 && portal.indexOf('psEqualizeSupersets(exs)') >= 0 && portal.indexOf('psSSStyle(_ssChain.gi)') >= 0);
for (const lang of ['supersetOn', 'supersetOff', 'supersetNeedNext']) {
  ok('client superset copy exists: ' + lang, portal.indexOf(lang + ':') >= 0);
}

/* ---------- client completion ring + report chart ---------- */
ok('client live head shows the completion ring', portal.indexOf('id="client-progress-ring"') >= 0 && portal.indexOf('id="client-ring-pct"') >= 0);
ok('ring/bar/label all update from the same set count', portal.indexOf("ring.style.setProperty('--p', pct+'%')") >= 0 && portal.indexOf("ringPct.textContent = pct+'%'") >= 0 && portal.indexOf("bar.style.width = pct+'%'") >= 0);
ok('client finish report renders a six-week volume chart', portal.indexOf('function reportVolumeTrendHTML(rec)') >= 0 && portal.indexOf('for (let i = 5; i >= 0; i--)') >= 0 && portal.indexOf('reportVolumeTrendHTML(rec)') >= 0);
ok('report chart CSS exists and themes', portal.indexOf('.report-bars {') >= 0 && portal.indexOf('.report-bar {') >= 0 && portal.indexOf('rgb(var(--c-accent))') >= 0);
for (const lang of ['reportTrendTitle', 'reportThisWeek', 'reportWeekShort']) {
  ok('report chart copy exists: ' + lang, portal.indexOf(lang + ':') >= 0);
}

/* ---------- portal save waits for the shared doc ---------- */
ok('client save awaits the cloud push', portal.indexOf('synced = await Promise.race([') >= 0 && portal.indexOf('dkHistPush(rec)') >= 0);
ok('client save reports a pending sync when offline', portal.indexOf("workoutSavedPending") >= 0 && portal.indexOf("toast(synced ? t('workoutSaved') : (t('workoutSavedPending')") >= 0);

/* ---------- trainer persists portal history ---------- */
ok('trainer exposes dkPersistCrmHistory', crm.indexOf('async function dkPersistCrmHistory(clientId, rows)') >= 0 && crm.indexOf('window.dkPersistCrmHistory = dkPersistCrmHistory;') >= 0);
ok('fetch maps portal records and then persists them', crm.indexOf('try { await dkPersistCrmHistory(clientId, mapped); } catch (_) {}') >= 0);
ok('persist writes IndexedDB workout_history in bulk', crm.indexOf("await db.bulkPut('workout_history', fresh)") >= 0);
ok('persist bumps the client last_active and emits a refresh event', crm.indexOf('c.last_active = maxTs;') >= 0 && crm.indexOf('dk-workout-history-updated') >= 0);
ok('dashboard merges portal history for shared clients', crm.indexOf('function mergePortalHistory()') >= 0 && crm.indexOf('c.portal_sk || c.portal_pass') >= 0 && crm.indexOf('mergePortalHistory();') >= 0);
ok('dashboard refreshes when persisted portal history lands', crm.indexOf("document.addEventListener('dk-workout-history-updated'") >= 0);

/* ---------- actual persistence behavior ---------- */
(async () => {
  try {
    const fnSrc = extractFn(crm, 'dkPersistCrmHistory');
    const writes = { bulkPut: null, client: null, events: 0 };
    const fakeDb = {
      find: async () => [{ id: 'old', date: 111 }],
      get: async () => ({ id: 'cli_demo_daniel', last_active: 0 }),
      bulkPut: async (store, rows) => { writes.bulkPut = { store, rows }; },
      put: async (store, row) => { writes.client = { store, row }; }
    };
    const ctx = {
      db: fakeDb,
      console,
      document: { dispatchEvent: () => { writes.events++; } },
      CustomEvent: function () {},
      Promise, Math, Object, Number, Array, String
    };
    vm.createContext(ctx);
    vm.runInContext(fnSrc, ctx);
    const rows = [
      { date: 111, name: 'already here' },
      { date: 222, name: 'portal workout', exercises: [] },
      { created_at: 333, name: 'legacy date field', exercises: [] }
    ];
    const added = await vm.runInContext('dkPersistCrmHistory("cli_demo_daniel", __rows)', Object.assign(ctx, { __rows: rows }));
    ok('persist dedupes by timestamp', added === 2 && writes.bulkPut && writes.bulkPut.rows.length === 2);
    ok('persist stamps client_id + stable fallback id', writes.bulkPut.rows.every(r => r.client_id === 'cli_demo_daniel') && writes.bulkPut.rows.some(r => r.id === 'remote_cli_demo_daniel_333'));
    ok('persist advances the client last_active', writes.client && writes.client.store === 'clients' && writes.client.row.last_active === 333);
    ok('persist fires one dashboard refresh event', writes.events === 1);
  } catch (e) {
    ok('persistence behavior test runs', false);
    console.log(e && e.stack ? e.stack : e);
  }

  /* ---------- versions ---------- */
  ok('trainer build c208', crm.indexOf('<meta name="dk-build" content="c208" />') >= 0);
  ok('trainer RUNNING 208', crm.indexOf('var RUNNING = 208;') >= 0);
  ok('SW cache v235', sw.indexOf("CACHE_NAME = 'dk-gym-v235'") >= 0);

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})();
