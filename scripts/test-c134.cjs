/* c134 unit test — portal feature pack (food DB search / device wipe / PWA). */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'client.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const trainer = fs.readFileSync(path.join(root, 'fitness-crm.html'), 'utf8');
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }
function count(s, needle) { return s.split(needle).length - 1; }

/* ---------- 1. food-DB search ---------- */
ok('search input + results + status markup', html.indexOf('id="diary-food-search"') >= 0 && html.indexOf('id="diary-food-results"') >= 0 && html.indexOf('id="diary-food-search-status"') >= 0);
ok('DB is fetched LAZILY inside dkLoadFoodDB only', (function () {
  const fn = html.slice(html.indexOf('function dkLoadFoodDB'), html.indexOf('function foodName(p)'));
  return fn.indexOf("fetch('food-db.json')") >= 0;
})());
ok('no eager food-db fetch at boot', count(html, "fetch('food-db.json')") === 1);
ok('foodName prefers the current language', html.indexOf("p['name_' + currentLang] || p.name_en || p.name_ru || p.name_he") >= 0);
ok('search matches name_ru/en/he + brand, tokens AND-ed', html.indexOf('(p.name_en || \'\') + \' \' + (p.name_ru || \'\') + \' \' + (p.name_he || \'\')') >= 0 && html.indexOf('if (hay.indexOf(words[w]) === -1)') >= 0);
ok('search caps results at 12', html.indexOf('out.length < 12') >= 0);
ok('pick fills all 6 fields', ['diary-food-name', 'diary-food-grams', 'diary-food-kcal', 'diary-food-p', 'diary-food-f', 'diary-food-c'].every(id => html.indexOf("set('" + id + "'") >= 0));
ok('pick defaults grams to the real serving, else 100 (c150)', html.indexOf("set('diary-food-grams', String(sq > 0 ? Math.round(sq) : 100))") >= 0);
ok('debounce 250ms', html.indexOf('}, 250);') >= 0);
ok('search needs ≥2 chars', html.indexOf('if (q.length < 2)') >= 0);
ok('dropdown closes on outside click', html.indexOf("e.target.closest('#diary-food-search') || e.target.closest('#diary-food-results')") >= 0);
ok('Escape hides the dropdown', html.indexOf('hideFoodResults(); } catch (e134) {} } });') >= 0);
ok('wiring runs at boot', html.indexOf('try { wireFoodSearch(); } catch (e134)') >= 0);
ok('placeholder localized in updateLabels', html.indexOf('_dfs134.placeholder = t(\'diarySearchPh\')') >= 0);
ok('i18n ×3: diarySearchPh', count(html, "diarySearchPh:'") === 3);
ok('i18n ×3: diarySearchLoading', count(html, "diarySearchLoading:'") === 3);
ok('i18n ×3: diarySearchEmpty', count(html, "diarySearchEmpty:'") === 3);
ok('i18n ×3: diarySearchOffline', count(html, "diarySearchOffline:'") === 3);

/* ---------- 2. device wipe ---------- */
ok('dkWipeData removes client-scoped + legacy keys', html.indexOf("k.endsWith('__' + ns) || k.indexOf('dk_legacy_') === 0") >= 0);
ok('dkWipeData removes share blob + live draft (+ c151 session)', html.indexOf("['dk_client_data', 'dk_client_share', 'dk_live_draft', 'dk_portal_session',") >= 0);
ok('wipe functions exposed for the settings sheet', html.indexOf('window.dkWipeData = dkWipeData') >= 0 && html.indexOf('window.dkWipeDeviceData = dkWipeDeviceData') >= 0);
ok('settings sheet has the wipe button', html.indexOf("id=\"cps-wipe\"") >= 0 && html.indexOf("id=\"cps-wipe-label\"") >= 0);
ok('wipe button label filled in fillLabels', html.indexOf("set('cps-wipe-label', T('wipeBtn'))") >= 0);
ok('wipe click asks confirm then wipes', html.indexOf("if (confirm(T('wipeConfirm')))") >= 0 && html.indexOf('window.dkWipeDeviceData()') >= 0);
ok('i18n ×3: wipeBtn', count(html, "wipeBtn:'") === 3);
ok('i18n ×3: wipeConfirm', count(html, "wipeConfirm:'") === 3);

/* ---------- 3. PWA hygiene ---------- */
ok('portal manifest exists', fs.existsSync(path.join(root, 'manifest-portal.json')));
const mp = fs.existsSync(path.join(root, 'manifest-portal.json')) ? JSON.parse(fs.readFileSync(path.join(root, 'manifest-portal.json'), 'utf8')) : {};
ok('portal manifest starts at client.html (c157: exact-path scope)', mp.start_url === '/David-King-Gym-Pro/client.html' && mp.scope === '/David-King-Gym-Pro/client.html');
ok('portal manifest has 3 portal icons (c155 re-icon)', Array.isArray(mp.icons) && mp.icons.length === 3 && mp.icons.every(i => /icon-portal-/.test(i.src)));
ok('client.html links the portal manifest', html.indexOf('<link rel="manifest" href="manifest-portal.json" />') >= 0);
ok('sw APP_SHELL precaches the portal CSS + engines', ['./src/input.css', './src/muscle-map.js', './src/recovery-engine.js', './src/analytics-engine.js', './manifest-portal.json'].every(f => sw.indexOf("'" + f + "'") >= 0));
ok('copy-assets ships the portal manifest', fs.readFileSync(path.join(root, 'scripts', 'copy-assets.js'), 'utf8').indexOf("'manifest-portal.json'") >= 0);

/* ---------- 4. versions ---------- */
ok('sw cache at least v161', (function () { const m = sw.match(/CACHE_NAME = 'dk-gym-v(\d+)'/); return !!m && Number(m[1]) >= 161; })());
ok('RUNNING / dk-build at least c134', (function () {
  const r = trainer.match(/var RUNNING = (\d+)/), b = trainer.match(/content="c(\d+)"/);
  return !!r && !!b && Number(r[1]) >= 134 && Number(b[1]) >= 134;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
